---
name: inscripciones-carrera
description: Plan de arquitectura y reglas de implementación para el sistema propio de inscripciones a carreras de bancodurango.org (proyecto Generous Generation) — un "mini-Vivenu" en Next.js con cobro en MXN por OXXO, SPEI y tarjeta, boletos con QR, dorsales, entrega de kits y páginas de recaudación individual. Usa este skill SIEMPRE que el usuario hable de la carrera, del evento de running, de inscripciones, registro de corredores, boletos, dorsales, números de competidor, entrega de kits, chip de cronometraje, recaudación por corredor, o cuando pida schema, endpoints, webhooks de pago, código o decisiones técnicas del evento — aunque no mencione "Vivenu", "inscripciones" ni el nombre del proyecto.
---

# Sistema de inscripciones para carreras — Banco de Alimentos Durango

Guía de implementación del módulo de inscripciones que vive dentro del sitio existente `bancodurango.org` (Next.js). El modelo de referencia es cómo HYROX opera sobre Vivenu: checkout mínimo en dominio propio, la organización como comercio de registro, y personalización del boleto después del pago.

## Cómo usar este skill

Al arrancar cualquier tarea de este proyecto:

1. Lee las **restricciones no negociables** de abajo — definen por qué el diseño es como es.
2. Identifica en qué **fase** está la tarea y no adelantes trabajo de fases posteriores.
3. Si la tarea toca datos o pagos, lee `references/modelo-datos.md` antes de escribir código.
4. Si la tarea toca facturación, deducibilidad o CFDI, lee `references/fiscal-mx.md`.
5. Si la tarea toca operación del día del evento, lee `references/operacion.md`.

Cuando una decisión dependa de la fecha de la carrera o del contrato con el cronometrista y esos datos no estén confirmados, dilo explícitamente en lugar de asumir — esas dos variables restringen rangos de dorsales, formatos de importación y fechas límite.

## Contexto fijo del proyecto

- **Organización**: asociación civil mexicana, donataria autorizada, en Durango.
- **Sitio**: Next.js (App Router), desplegado en Vercel, con `/donar` y `/cuenta` ya funcionando.
- **Divisa**: MXN únicamente.
- **Métodos de pago**: tarjeta, OXXO y SPEI, a través de la pasarela que ya usa `/donar`.
- **Objetivo del evento**: recaudar fondos para el proyecto Generous Generation, no vender boletos.

Esa última línea es la que ordena las prioridades. Cuando haya que elegir entre pulir el checkout y construir la recaudación por corredor, gana la recaudación.

## Restricciones no negociables

**Nunca construir estas cosas.** Cada una es un pozo sin fondo que ya está resuelto mejor por alguien más:

| No construir | Usar en su lugar |
|---|---|
| Procesamiento de tarjetas | Checkout hospedado de la pasarela. Nunca tocar un PAN ni un CVV |
| Cronometraje o lectura de chip | Proveedor externo con contrato; se le exporta CSV y regresa resultados |
| Sala de espera / cola de alta demanda | No aplica al volumen esperado |
| Transferencia de boleto entre personas | Add-on de reembolso (patrón Flex de HYROX) y resolución por soporte |
| Multi-divisa | Solo MXN |
| Email marketing | Resend solo para transaccional |

**Arquitectura**: un solo evento por ahora, pero toda tabla lleva `evento_id` y nada de la carrera se codifica duro. Eso deja abierta la puerta a multi-tenant sin pagar hoy su complejidad. No implementar multi-tenant, roles complejos ni abstracciones de "plataforma" hasta que exista una segunda carrera real.

## Las tres reglas que rompen sistemas

Si el código falla, casi siempre es por una de estas tres. Verifícalas en cada revisión.

**1. El estado del pago lo define el webhook, nunca el navegador.** OXXO y SPEI son asíncronos: la persona genera referencia y paga dos días después. El retorno del navegador no prueba nada. Todo webhook debe ser idempotente (llega dos o tres veces) mediante una `idempotency_key` única por evento de pasarela, guardada antes de aplicar efectos.

**2. El cupo se reserva con TTL, o se agota con gente que nunca pagó.** La inscripción nace en `pendiente` con `expira_en` alineado a la vigencia de la referencia OXXO (48–72 h). Un cron libera las vencidas. El cupo disponible es `confirmadas + pendientes vigentes`, nunca solo confirmadas.

**3. El dorsal se asigna solo con pago confirmado y bajo lock.** Usar `SELECT ... FOR UPDATE` sobre un contador por distancia, o una secuencia de Postgres por rango. Nunca `MAX(dorsal)+1` sin lock: en la hora pico de preventa se emiten duplicados y se descubre el día de la entrega de kits.

## Máquina de estados de la inscripción

```
orden_creada ──(cron, TTL vencido)──> expirada        [libera cupo]
     │
     └──(webhook confirma)──> pagada                  [cupo firme]
                                │
                                └──(persona llena datos)──> activada
                                            │
                                            └──(job)──> dorsal_asignado
                                                        │
                                                        └──(QR escaneado)──> kit_entregado
```

Modelar esto como columna de estado con transiciones explícitas y validadas en una sola función. No dispersar cambios de estado por varios endpoints.

## Registro en dos pasos (patrón HYROX)

El diseño central, y la razón de que el checkout convierta:

**Paso 1 — Compra.** Solo lo mínimo: distancia, cantidad, correo, add-ons, donativo opcional. Se paga. Se genera un token firmado de activación (HMAC, con `boleto_id` y expiración) y se envía por correo con un botón que lleva a `/carrera/activar/[token]`.

**Paso 2 — Activación.** Ahí se piden los datos pesados: nombre completo, fecha de nacimiento, sexo, talla, club, contacto de emergencia, tipo de sangre, condiciones médicas y aceptación de la carta responsiva.

Esto resuelve tres problemas de golpe: máxima conversión en el checkout, compras grupales (una persona compra 30 lugares y reparte el link a cada quien), y el desfase natural del pago en OXXO. La categoría por edad se calcula **a la fecha de la carrera**, no a la del registro.

## Fases de entrega

No trabajar fuera de fase. Cada una debe quedar funcionando de punta a punta antes de pasar a la siguiente.

**Fase 1 — Cobro y estados (semana 1–2).** Tablas base, creación de orden, webhook idempotente, cron de expiración, reserva de cupo. Un solo tipo de boleto. Sin PDF, sin panel.

**Fase 2 — Boleto y activación (semana 3).** Token firmado, formulario de activación, carta responsiva versionada, PDF con QR generado en el servidor, correos transaccionales.

**Fase 3 — Operación (semana 4).** Panel interno protegido por rol, asignación de dorsales, exportaciones (cronometrista, tallas, contactos de emergencia, seguro), check-in de kits.

**Fase 4 — Recaudación individual.** Páginas `/carrera/corre-por/[slug]` con meta, barra de progreso y atribución de donativos a un `recaudador_id` sobre el `/donar` existente. Es el diferenciador del proyecto: un corredor que consigue diez donativos de $200 vale mucho más que su inscripción.

**Fase 5 — Resultados.** Importar CSV del cronometrista, página pública con búsqueda por dorsal y nombre, diploma descargable. Es la página más visitada y compartida de cualquier carrera.

## Alcance técnico total

Siete tablas: `evento`, `tipo_boleto`, `orden`, `pago`, `boleto`, `dorsal_secuencia`, `checkin`. Seis endpoints: crear orden, webhook de pago, activar boleto, descargar PDF, validar QR, exportar CSV. Un cron.

Si una propuesta hace crecer mucho esa lista, es señal de que se está construyendo algo que estaba en la tabla de "no construir". Cuestiónalo antes de escribir código.

Detalle completo del schema, endpoints y firma de tokens en `references/modelo-datos.md`.

## Fiscal: la trampa más cara

La cuota de inscripción es una **contraprestación por un servicio**, no un donativo deducible. Emitir un recibo deducible por ella expone a la A.C. Por eso la orden se divide siempre en dos conceptos separados desde el modelo de datos: `monto_inscripcion` y `monto_donativo`, con comprobantes distintos. Detalle en `references/fiscal-mx.md`.

## Stack

| Capa | Elección |
|---|---|
| App | Next.js App Router, Server Actions y Route Handlers |
| Base de datos | Postgres (Supabase o Neon) |
| ORM | Prisma o Drizzle, con migraciones versionadas |
| Pagos | La pasarela ya usada en `/donar` |
| Auth | Reusar `/cuenta` |
| Correo | Resend con React Email |
| PDF y QR | `@react-pdf/renderer` o Satori, más `qrcode` |
| Archivos | Supabase Storage o S3 |
| Cron | Vercel Cron |

No introducir un segundo proveedor de pagos: complica la conciliación y la emisión de CFDI sin ganancia real.

## Estilo de trabajo esperado

Escribe en español mexicano, sin anglicismos innecesarios (dorsal o número, no "bib"; cupo, no "capacity"). Al proponer código, entrega archivos completos y ejecutables en lugar de fragmentos sueltos, y nombra las tablas y campos en español para que el equipo operativo pueda leer las exportaciones sin traducir.

Cuando el usuario pida una funcionalidad que cae en la tabla de "no construir", no la implementes en silencio: explica brevemente cuál es la alternativa y qué costo real tendría construirla, y deja que decida.
