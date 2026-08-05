# Operación: kits, dorsales, cronometraje y día del evento

Lee este archivo cuando la tarea toque exportaciones, entrega de kits, check-in, resultados o coordinación con proveedores.

## Dependencias externas que definen el software

Dos contratos restringen el diseño y deben cerrarse antes de fijar el schema:

**Fecha de la carrera.** Define el cálculo de categorías por edad, las fechas límite de cambio de talla y distancia, y la vigencia de los periodos de precio.

**Cronometrista.** Define el formato de importación de inscritos, los rangos de dorsales que su sistema espera, el formato del CSV de resultados que devuelve, y su fecha de corte para recibir el padrón definitivo. Preguntarle desde el primer contacto: qué formato recibe, con cuántos días de anticipación, y si acepta altas tardías.

Si alguno no está confirmado, decirlo al usuario en lugar de asumir valores.

## Exportaciones obligatorias

El panel debe generar estos CSV. Nombrar columnas en español: el equipo operativo y los proveedores las leen directo.

| Exportación | Para quién | Contenido |
|---|---|---|
| Padrón de cronometraje | Cronometrista | Dorsal, nombre, apellidos, sexo, categoría, tipo de boleto, club |
| Conteo de tallas | Proveedor de playeras | Talla, cantidad, desglosado por tipo de boleto |
| Contactos de emergencia | Servicios médicos | Dorsal, nombre, contacto, teléfono, tipo de sangre, condiciones |
| Padrón para seguro | Aseguradora | Nombre completo, fecha de nacimiento, dorsal |
| No activados | Equipo de soporte | Órdenes pagadas cuyo boleto sigue sin datos |
| Pendientes de pago | Equipo de soporte | Órdenes por vencer, para recordatorio |

La lista de "no activados" es la que más trabajo ahorra: siempre hay gente que paga y nunca llena sus datos, y hay que perseguirla antes del corte.

## Política de dorsales y kits

Copiar el patrón probado:

- El dorsal **no se envía por correo**. Se recoge en la entrega de kits, presentando el boleto y una identificación oficial.
- Si el evento usa chip desechable, va dentro del kit. Si es reutilizable, definir depósito o cargo por pérdida y decirlo en el reglamento.
- Recolección por tercero: permitirla solo con carta poder simple e identificación de ambos. Registrarlo en `Checkin.notas`.

## Check-in del día del evento

El wifi de una explanada o un gimnasio siempre falla. El escáner debe funcionar sin conexión:

- Cachear el padrón completo en el dispositivo antes de abrir.
- Validar el QR localmente contra la firma HMAC, no contra el servidor.
- Encolar los check-ins y sincronizar cuando haya red.
- Resolver duplicados por `boletoId` con "el primero gana", y marcar los repetidos para revisión manual en lugar de rechazarlos en silencio.
- Tener siempre un plan B en papel: listado impreso por dorsal y por apellido.

## Cambios y cancelaciones

Van a ocurrir y sin flujo definido terminan en WhatsApp:

- **Cambio de talla**: permitir hasta la fecha de corte del proveedor, autoservicio desde el boleto.
- **Cambio de distancia**: permitir hasta el corte del cronometrista. Si sube de precio, cobrar diferencia; si baja, no reembolsar.
- **Reembolso**: solo con el add-on de flexibilidad comprado. Sin él, no hay reembolso, y decirlo con claridad en el reglamento.
- **Transferencia entre personas**: no soportada en el sistema. Se resuelve por soporte, caso por caso, o no se ofrece.

## Resultados

Es la página más visitada de cualquier carrera y la que más se comparte en redes. Vale invertir en ella.

- Importar el CSV del cronometrista con validación previa: dorsales que no existen en el padrón, tiempos imposibles, duplicados.
- Página pública con búsqueda por dorsal y por nombre, filtros por categoría y tipo de boleto.
- Diploma descargable con nombre, tiempo, posición general y de categoría, y el branding del evento y de Generous Generation.
- Botón para compartir con imagen generada. Cada compartida es alcance orgánico para la siguiente edición.

## Carta responsiva

Guardar siempre versión del texto, timestamp e IP. Si el texto cambia a mitad de la venta, los boletos previos conservan la versión que aceptaron. Es el respaldo legal del evento y no debe tratarse como una casilla decorativa.
