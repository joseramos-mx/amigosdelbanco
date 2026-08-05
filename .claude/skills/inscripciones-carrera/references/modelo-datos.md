# Modelo de datos y endpoints

Lee este archivo antes de escribir cualquier migración, endpoint o código que toque órdenes, pagos o boletos.

## Contenido

- [Tablas](#tablas)
- [Schema de referencia](#schema-de-referencia-prisma)
- [Endpoints](#endpoints)
- [Token de activación](#token-de-activación)
- [Asignación de dorsales](#asignación-de-dorsales)
- [Cálculo de cupo](#cálculo-de-cupo)
- [Idempotencia del webhook](#idempotencia-del-webhook)

## Tablas

| Tabla | Responsabilidad |
|---|---|
| `evento` | Edición, fecha, sede, estado de venta. Todo cuelga de aquí |
| `tipo_boleto` | Distancia o modalidad: cupo, rango de dorsales, precios por periodo |
| `orden` | Compra completa: puede traer varios boletos más un donativo |
| `pago` | Intentos y confirmaciones de la pasarela, con idempotencia |
| `boleto` | Una inscripción individual. Es la entidad que se activa y se escanea |
| `dorsal_secuencia` | Contador por tipo de boleto, protegido con lock |
| `checkin` | Registro de entrega de kit y accesos |

Toda tabla lleva `evento_id`, aunque hoy solo exista un evento.

## Schema de referencia (Prisma)

Adaptar nombres y tipos al ORM elegido, pero conservar la estructura y las restricciones.

```prisma
model Evento {
  id             String   @id @default(cuid())
  nombre         String
  slug           String   @unique
  fechaCarrera   DateTime
  sede           String
  estado         EstadoEvento @default(BORRADOR)
  creadoEn       DateTime @default(now())
  tiposBoleto    TipoBoleto[]
  ordenes        Orden[]
}

enum EstadoEvento { BORRADOR VENTA_ABIERTA VENTA_CERRADA FINALIZADO }

model TipoBoleto {
  id             String   @id @default(cuid())
  eventoId       String
  nombre         String              // "5K", "10K", "21K"
  distanciaKm    Decimal?
  cupoTotal      Int
  dorsalDesde    Int                 // 1000
  dorsalHasta    Int                 // 1999
  precios        PrecioPeriodo[]
  evento         Evento   @relation(fields: [eventoId], references: [id])
  @@unique([eventoId, nombre])
}

model PrecioPeriodo {
  id             String   @id @default(cuid())
  tipoBoletoId   String
  etiqueta       String              // "preventa", "general"
  montoCentavos  Int
  vigenteDesde   DateTime
  vigenteHasta   DateTime
  cupoMaximo     Int?                // se agota por fecha o por cupo, lo que ocurra primero
  tipoBoleto     TipoBoleto @relation(fields: [tipoBoletoId], references: [id])
}

model Orden {
  id                 String   @id @default(cuid())
  eventoId           String
  folio              String   @unique          // legible para soporte
  correoComprador    String
  nombreComprador    String
  telefono           String?
  montoInscripcion   Int                       // centavos, contraprestación
  montoDonativo      Int      @default(0)      // centavos, deducible
  montoAddons        Int      @default(0)
  estado             EstadoOrden @default(PENDIENTE)
  expiraEn           DateTime?                 // TTL de la reserva de cupo
  requiereFactura    Boolean  @default(false)
  rfc                String?
  razonSocial        String?
  usoCfdi            String?
  regimenFiscal      String?
  creadaEn           DateTime @default(now())
  boletos            Boleto[]
  pagos              Pago[]
  evento             Evento   @relation(fields: [eventoId], references: [id])
  @@index([estado, expiraEn])
}

enum EstadoOrden { PENDIENTE PAGADA EXPIRADA CANCELADA REEMBOLSADA }

model Pago {
  id                 String   @id @default(cuid())
  ordenId            String
  proveedor          String                    // "stripe", "conekta"
  metodo             MetodoPago
  referenciaExterna  String?                   // referencia OXXO o CLABE SPEI
  idempotencyKey     String   @unique          // id del evento de la pasarela
  montoCentavos      Int
  estado             EstadoPago @default(INICIADO)
  vencimientoRef     DateTime?
  payloadCrudo       Json?
  procesadoEn        DateTime?
  orden              Orden    @relation(fields: [ordenId], references: [id])
}

enum MetodoPago { TARJETA OXXO SPEI CORTESIA }
enum EstadoPago { INICIADO PENDIENTE CONFIRMADO FALLIDO REEMBOLSADO }

model Boleto {
  id                 String   @id @default(cuid())
  eventoId           String
  ordenId            String
  tipoBoletoId       String
  estado             EstadoBoleto @default(PENDIENTE)

  // se llenan en la activación, no en la compra
  nombre             String?
  apellidos          String?
  fechaNacimiento    DateTime?
  sexo               Sexo?
  correo             String?
  telefono           String?
  tallaPlayera       String?
  club               String?
  nacionalidad       String?
  contactoEmergNombre String?
  contactoEmergTel   String?
  tipoSangre         String?
  condicionesMedicas String?

  categoria          String?                   // calculada a la fecha de carrera
  dorsal             Int?
  tokenActivacion    String   @unique
  activadoEn         DateTime?
  responsivaVersion  String?
  responsivaAceptada DateTime?
  responsivaIp       String?

  orden              Orden    @relation(fields: [ordenId], references: [id])
  checkins           Checkin[]
  @@unique([eventoId, dorsal])
  @@index([tokenActivacion])
}

enum EstadoBoleto { PENDIENTE PAGADO ACTIVADO DORSAL_ASIGNADO ENTREGADO CANCELADO }
enum Sexo { F M X }

model DorsalSecuencia {
  tipoBoletoId   String   @id
  siguiente      Int                            // se incrementa bajo lock
}

model Checkin {
  id             String   @id @default(cuid())
  boletoId       String
  tipo           TipoCheckin
  registradoPor  String
  registradoEn   DateTime @default(now())
  notas          String?
  boleto         Boleto   @relation(fields: [boletoId], references: [id])
}

enum TipoCheckin { KIT ACCESO }
```

## Endpoints

| Ruta | Método | Función |
|---|---|---|
| `/api/carrera/orden` | POST | Valida cupo, crea orden en `PENDIENTE` con `expiraEn`, genera intención de pago |
| `/api/carrera/webhook` | POST | Único lugar que confirma pagos. Idempotente. Dispara correos y dorsales |
| `/api/carrera/activar` | POST | Valida token, guarda datos del corredor, registra responsiva |
| `/api/carrera/boleto/[id]/pdf` | GET | Genera PDF con QR. Autorizado por token o sesión |
| `/api/carrera/checkin` | POST | Valida QR firmado, marca entrega de kit, es idempotente |
| `/api/carrera/export` | GET | CSV por tipo: cronometrista, tallas, emergencias, seguro. Solo rol staff |

Cron diario o cada hora: expirar órdenes con `estado = PENDIENTE AND expiraEn < now()`, liberar cupo y enviar recordatorio a las que vencen en menos de 24 horas.

## Token de activación

No usar el `id` del boleto como link. Firmar con HMAC-SHA256 usando un secreto de entorno:

```
payload = base64url({ b: boletoId, e: expiraTimestamp })
firma   = base64url(hmacSha256(secreto, payload))
token   = payload + "." + firma
```

Verificar firma antes de cualquier consulta a base de datos, y comparar con `timingSafeEqual`. El mismo esquema sirve para el QR del boleto, con un payload distinto y sin expiración, validado contra `estado` en el momento del escaneo.

## Asignación de dorsales

Ejecutar solo al confirmarse el pago, dentro de una transacción:

```sql
BEGIN;
SELECT siguiente FROM "DorsalSecuencia"
  WHERE "tipoBoletoId" = $1 FOR UPDATE;
-- validar que siguiente <= dorsalHasta
UPDATE "DorsalSecuencia" SET siguiente = siguiente + 1
  WHERE "tipoBoletoId" = $1;
UPDATE "Boleto" SET dorsal = $2, estado = 'DORSAL_ASIGNADO'
  WHERE id = $3;
COMMIT;
```

El `@@unique([eventoId, dorsal])` es la red de seguridad: si algún día falla el lock, la base rechaza el duplicado en lugar de permitirlo silenciosamente.

## Cálculo de cupo

```sql
SELECT tb."cupoTotal" - COUNT(b.id) AS disponibles
FROM "TipoBoleto" tb
LEFT JOIN "Boleto" b ON b."tipoBoletoId" = tb.id
LEFT JOIN "Orden" o ON b."ordenId" = o.id
WHERE tb.id = $1
  AND (o.estado = 'PAGADA'
       OR (o.estado = 'PENDIENTE' AND o."expiraEn" > now()))
GROUP BY tb.id, tb."cupoTotal";
```

Contar solo pagadas subvende el evento y genera sobreventa; contar todas las pendientes sin filtrar por vigencia lo agota con órdenes muertas.

## Idempotencia del webhook

Orden estricto de operaciones:

1. Verificar la firma del webhook contra el secreto de la pasarela. Si falla, responder 400 y no procesar.
2. Intentar insertar `Pago` con `idempotencyKey` única. Si viola la restricción, es un reenvío: responder 200 sin efectos.
3. Aplicar la transición de estado dentro de una transacción.
4. Encolar correos y asignación de dorsal fuera de la transacción.
5. Responder 200 rápido. Cualquier trabajo lento va a un job, no al handler.

Guardar siempre `payloadCrudo`. Cuando algo se descuadre a un mes del evento, es lo único que permite reconstruir qué pasó.
