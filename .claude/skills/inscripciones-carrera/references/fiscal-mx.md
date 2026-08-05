# Fiscal: A.C. donataria autorizada y cuotas de inscripción

Lee este archivo antes de tocar montos, comprobantes, facturación o el texto que ve el usuario sobre deducibilidad.

Esta guía orienta el diseño técnico. **No sustituye la opinión del contador de la organización.** Antes de abrir venta, confirmar con él los puntos marcados como "validar".

## El principio que ordena todo

La cuota de inscripción es una **contraprestación**: la persona recibe un servicio a cambio (participar, kit, playera, avituallamiento, cronometraje). No es un donativo, y por lo tanto no genera recibo deducible.

Un donativo, en cambio, es una entrega gratuita sin nada a cambio. Ese sí ampara recibo deducible.

Emitir un recibo deducible por una inscripción expone a la A.C. a que le rechacen la deducción al donante y a observaciones sobre su autorización. Por eso la separación no es cosmética: vive en el modelo de datos.

## Cómo se refleja en el sistema

**Una orden, dos conceptos separados desde el origen:**

- `montoInscripcion` — contraprestación. CFDI de ingreso normal, con IVA según corresponda (validar con el contador si la actividad causa IVA o está exenta).
- `montoDonativo` — aportación voluntaria adicional. CFDI con complemento de donatarias, deducible.

Nunca sumarlos en un solo campo ni en un solo comprobante. Si en el futuro se necesita reconciliar, tener los montos separados desde el día uno hace la diferencia entre una consulta y una auditoría manual.

**En la interfaz**, el checkout debe mostrar la inscripción y, aparte, un campo opcional de "suma un donativo" con su propia explicación. El texto debe decir con claridad que solo el donativo es deducible.

## Datos de facturación

Recolectarlos en el checkout como opcionales, no obligatorios: pedirlos a todos baja la conversión y la mayoría de corredores no factura.

Campos necesarios: RFC, razón social, régimen fiscal, uso de CFDI, código postal del domicilio fiscal, correo de facturación.

Guardarlos en la orden, no en el boleto: quien paga puede no ser quien corre.

## Consideraciones a validar con el contador

- Si los ingresos por inscripciones cuentan como actividad distinta al objeto social, y qué proporción es admisible sin arriesgar la autorización como donataria.
- Tratamiento de IVA en la cuota de inscripción.
- Si conviene que el evento se facture desde la A.C. o desde otra estructura.
- Manejo de patrocinios corporativos: donativo, publicidad, o mixto. Cada uno tiene comprobante distinto.
- Cortesías y becas: cómo documentar boletos sin cobro.

## Recaudación individual y deducibilidad

En las páginas de "corre por mí", quien dona es el amigo del corredor, no el corredor. El donativo es del donante y su recibo va a su nombre. El corredor solo aparece como atribución interna (`recaudadorId`), nunca como titular del comprobante.

Esto es importante porque es fácil implementarlo mal: si el recibo saliera a nombre del corredor, se estaría documentando algo que no ocurrió.

## Reembolsos

Todo reembolso debe generar la nota de crédito o cancelación de CFDI que corresponda, y quedar registrado en la orden. No basta con revertir el cobro en la pasarela: el comprobante fiscal ya existe y tiene que resolverse.
