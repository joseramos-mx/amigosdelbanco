/**
 * Prueba de aceptación de la Fase 3.
 *
 * Lo que sostiene el día del evento:
 *
 *   1. Los pases firmados controlan quién entra y a qué. El de escáner no
 *      abre el panel ni las exportaciones.
 *   2. La entrega de kits es "el primero gana": el segundo escaneo del mismo
 *      boleto no crea otro registro, devuelve la hora del primero.
 *   3. Los dorsales se asignan bajo lock, sin huecos ni repetidos, y fallan
 *      en voz alta si no hay rango configurado.
 *   4. Las exportaciones salen en CSV con las columnas que esperan los
 *      proveedores.
 *
 *   node --env-file=.env.local scripts/fase3-aceptacion.mjs [http://localhost:3000]
 */

import postgres from "postgres";
import { createHmac, randomUUID } from "node:crypto";

const BASE = process.argv[2] ?? process.env.BASE_URL ?? "http://localhost:3000";
const SECRETO = process.env.RUN_TOKEN_SECRET;
const EPOCA = process.env.RUN_STAFF_EPOCH ?? "1";

if (!process.env.DATABASE_URL) throw new Error("Falta DATABASE_URL");
if (!SECRETO) throw new Error("Falta RUN_TOKEN_SECRET");

const sql = postgres(process.env.DATABASE_URL, { max: 1, prepare: false, onnotice: () => {} });

let fallas = 0;
function verificar(desc, real, esperado) {
  const ok = JSON.stringify(real) === JSON.stringify(esperado);
  if (!ok) fallas += 1;
  console.log(
    `${ok ? "✓" : "✗"} ${desc}` +
      (ok ? "" : `\n    esperado ${JSON.stringify(esperado)}, obtenido ${JSON.stringify(real)}`),
  );
}

const b64 = (s) => Buffer.from(s).toString("base64url");
const firmar = (p, d) => b64(createHmac("sha256", `${SECRETO}:${d}`).update(p).digest());

function pase(rol, nombre, dias = 1) {
  const payload = b64(
    JSON.stringify({ r: rol, n: nombre, e: Math.floor((Date.now() + dias * 86400000) / 1000) }),
  );
  return `${payload}.${firmar(payload, `staff:${EPOCA}`)}`;
}

function tokenQr(boletoId) {
  const payload = b64(JSON.stringify({ b: boletoId }));
  return `${payload}.${firmar(payload, "qr")}`;
}

const checkin = (paseToken, escaneos) =>
  fetch(`${BASE}/api/run/checkin`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-run-pase": paseToken },
    body: JSON.stringify({ escaneos }),
  });

async function main() {
  console.log(`Servidor: ${BASE}\n`);

  const [evento] = await sql`
    insert into public.evento (nombre, slug, fecha_carrera, sede, estado)
    values ('Prueba fase 3', ${`fase3-${Date.now()}`},
            '2026-10-16 17:00:00-06', 'Sede de prueba', 'venta_abierta')
    returning id
  `;
  const [tipo] = await sql`
    insert into public.tipo_boleto (evento_id, nombre, precio_centavos, cupo_total,
                                    dorsal_desde, dorsal_hasta)
    values (${evento.id}, 'Boleto de prueba', 39900, 10, 5000, 5003) returning id
  `;
  await sql`
    insert into public.dorsal_secuencia (tipo_boleto_id, evento_id, siguiente)
    values (${tipo.id}, ${evento.id}, 5000)
  `;

  const creadosEnReal = [];
  const ordenesEnReal = [];

  /** Crea un boleto activado en el evento indicado y devuelve sus ids. */
  async function crearBoletoEn(eventoId, tipoBoletoId) {
    const id = randomUUID();
    const [orden] = await sql`
      insert into public.orden (evento_id, correo_comprador, nombre_comprador,
                                monto_inscripcion, estado)
      values (${eventoId}, 'prueba-fase3@example.com', 'Prueba Fase 3', 39900, 'pagada')
      returning id
    `;
    await sql`
      insert into public.boleto (id, evento_id, orden_id, tipo_boleto_id, estado,
                                 token_activacion, nombre, apellidos, talla_playera,
                                 contacto_emerg_nombre, contacto_emerg_tel,
                                 fecha_nacimiento, sexo, tipo_sangre, activado_en)
      values (${id}, ${eventoId}, ${orden.id}, ${tipoBoletoId}, 'activado', ${randomUUID()},
              'Corredor', 'De Prueba', 'M', 'Contacto', '6180000000',
              '1990-05-20', 'M', 'O+', now())
    `;
    return { id, ordenId: orden.id };
  }

  async function crearBoleto({ activado = true } = {}) {
    const id = randomUUID();
    const [orden] = await sql`
      insert into public.orden (evento_id, correo_comprador, nombre_comprador,
                                monto_inscripcion, estado)
      values (${evento.id}, 'x@example.com', 'Compra', 39900, 'pagada')
      returning id
    `;
    await sql`
      insert into public.boleto (id, evento_id, orden_id, tipo_boleto_id, estado,
                                 token_activacion, nombre, apellidos, talla_playera,
                                 contacto_emerg_nombre, contacto_emerg_tel,
                                 fecha_nacimiento, sexo, activado_en)
      values (${id}, ${evento.id}, ${orden.id}, ${tipo.id},
              ${activado ? "activado" : "pagado"}, ${randomUUID()},
              'Corredor', 'De Prueba', 'M', 'Contacto', '6180000000',
              '1990-05-20', 'M', ${activado ? new Date() : null})
    `;
    return id;
  }

  const paseEscaner = pase("escaner", "Turno prueba");
  const paseAdmin = pase("admin", "Coordinación prueba");

  try {
    // ── 1. Pases ─────────────────────────────────────────────────────
    console.log("1. Pases firmados");
    verificar(
      "sin pase, el check-in responde 401",
      (await checkin("", [{ qr: "x" }])).status,
      401,
    );
    verificar(
      "con firma alterada, 401",
      (await checkin(`${paseEscaner.split(".")[0]}.falsa`, [{ qr: "x" }])).status,
      401,
    );
    verificar(
      "un pase vencido no sirve",
      (await checkin(pase("escaner", "Viejo", -1), [{ qr: "x" }])).status,
      401,
    );

    const exportEscaner = await fetch(`${BASE}/api/run/export?tipo=tallas`, {
      headers: { "x-run-pase": paseEscaner },
    });
    verificar("el pase de escáner no exporta", exportEscaner.status, 401);

    const dorsalesEscaner = await fetch(`${BASE}/api/run/dorsales`, {
      method: "POST",
      headers: { "x-run-pase": paseEscaner },
    });
    verificar("el pase de escáner no asigna dorsales", dorsalesEscaner.status, 401);

    // ── 2. Entrega de kits ───────────────────────────────────────────
    console.log("\n2. Entrega de kits");
    const boleto = await crearBoleto();
    const qr = tokenQr(boleto);

    const primera = await checkin(paseEscaner, [{ qr }]);
    const r1 = (await primera.json()).resultados[0];
    verificar("el primer escaneo entrega el kit", r1.resultado, "entregado");

    const segunda = await checkin(paseEscaner, [{ qr }]);
    const r2 = (await segunda.json()).resultados[0];
    verificar("el segundo se marca como repetido", r2.resultado, "repetido");
    verificar("y trae la hora de la primera entrega", Boolean(r2.registradoEn), true);

    const [{ n }] = await sql`
      select count(*)::int as n from public.checkin where boleto_id = ${boleto}
    `;
    verificar("solo hay un registro de entrega", n, 1);

    const [b] = await sql`select estado::text from public.boleto where id = ${boleto}`;
    verificar("el boleto queda entregado", b.estado, "entregado");

    const sinActivar = await crearBoleto({ activado: false });
    const r3 = (await (await checkin(paseEscaner, [{ qr: tokenQr(sinActivar) }])).json())
      .resultados[0];
    verificar("un boleto sin datos no se entrega", r3.resultado, "sin_activar");

    const inventado = (await (await checkin(paseEscaner, [{ qr: "no.esto" }])).json())
      .resultados[0];
    verificar("un QR inventado no pasa", inventado.resultado, "no_encontrado");

    // Reenviar la cola completa es seguro: así se comporta el escáner al
    // recuperar la red.
    const lote = await checkin(paseEscaner, [{ qr }, { qr }, { qr }]);
    const rl = (await lote.json()).resultados;
    verificar("reenviar el lote no duplica", rl.map((r) => r.resultado), [
      "repetido",
      "repetido",
      "repetido",
    ]);

    // ── 3. Dorsales y exportaciones ──────────────────────────────────
    // Estos endpoints trabajan sobre el evento configurado (obtenerEvento),
    // no sobre uno arbitrario: es un solo evento por diseño. Así que la
    // prueba monta datos sobre el real y los quita al terminar. El evento
    // real tiene rango de dorsales sin definir, y así se queda al final.
    console.log("\n3. Dorsales");
    const [real] = await sql`
      select e.id, tb.id as tipo_id, tb.dorsal_desde, tb.dorsal_hasta
        from public.evento e join public.tipo_boleto tb on tb.evento_id = e.id
       where e.slug = 'social-run-2026'
    `;

    if (!real) {
      console.log("· No hay evento social-run-2026; se omite esta parte");
    } else {
      creadosEnReal.push(real);
      await sql`
        update public.tipo_boleto set dorsal_desde = 9000, dorsal_hasta = 9002
         where id = ${real.tipo_id}
      `;
      await sql`
        update public.dorsal_secuencia set siguiente = 9000 where tipo_boleto_id = ${real.tipo_id}
      `;

      const enReal = [];
      for (let i = 0; i < 3; i += 1) enReal.push(await crearBoletoEn(real.id, real.tipo_id));
      ordenesEnReal.push(...enReal.map((b) => b.ordenId));

      const asign = await fetch(`${BASE}/api/run/dorsales`, {
        method: "POST",
        headers: { "x-run-pase": paseAdmin },
      });
      verificar("coordinación sí puede asignar", asign.status, 200);

      const dorsales = await sql`
        select dorsal from public.boleto
         where evento_id = ${real.id} and dorsal is not null order by dorsal
      `;
      const numeros = dorsales.map((d) => d.dorsal);
      verificar("asigna desde el inicio del rango, sin huecos", numeros, [9000, 9001, 9002]);
      verificar("no hay repetidos", new Set(numeros).size, numeros.length);

      const [seq] = await sql`
        select siguiente from public.dorsal_secuencia where tipo_boleto_id = ${real.tipo_id}
      `;
      verificar("el contador avanzó", seq.siguiente, 9003);

      // El rango daba para tres y ya se usaron: el cuarto no cabe.
      const cuarto = await crearBoletoEn(real.id, real.tipo_id);
      ordenesEnReal.push(cuarto.ordenId);
      const agotado = await fetch(`${BASE}/api/run/dorsales`, {
        method: "POST",
        headers: { "x-run-pase": paseAdmin },
      });
      verificar("al acabarse el rango, falla en voz alta", agotado.status, 409);

      // ── 4. Exportaciones ───────────────────────────────────────────
      console.log("\n4. Exportaciones");
      for (const t of ["cronometraje", "tallas", "emergencias", "seguro", "no-activados", "pendientes"]) {
        const res = await fetch(`${BASE}/api/run/export?tipo=${t}`, {
          headers: { "x-run-pase": paseAdmin },
        });
        const texto = await res.text();
        verificar(`${t} responde CSV`, [res.status, texto.length > 0], [200, true]);
      }

      const emergencias = await (
        await fetch(`${BASE}/api/run/export?tipo=emergencias`, {
          headers: { "x-run-pase": paseAdmin },
        })
      ).text();
      verificar(
        "emergencias trae las columnas de servicios médicos",
        emergencias.includes("Contacto") && emergencias.includes("Tipo de sangre"),
        true,
      );
      // Se miran los bytes: res.text() descarta el BOM inicial por
      // especificación, así que revisarlo sobre el string siempre falla.
      const bytes = Buffer.from(
        await (
          await fetch(`${BASE}/api/run/export?tipo=emergencias`, {
            headers: { "x-run-pase": paseAdmin },
          })
        ).arrayBuffer(),
      );
      verificar(
        "y abre bien en Excel (lleva BOM)",
        [...bytes.subarray(0, 3)],
        [0xef, 0xbb, 0xbf],
      );

      const crono = await (
        await fetch(`${BASE}/api/run/export?tipo=cronometraje`, {
          headers: { "x-run-pase": paseAdmin },
        })
      ).text();
      verificar("el padrón de cronometraje trae los dorsales asignados", crono.includes("9000"), true);
    }

    // ── 5. Cortesías ─────────────────────────────────────────────────
    // También operan sobre el evento configurado.
    console.log("\n5. Cortesías");
    if (real) {
      const antes = await sql`
        select coalesce(sum(monto_inscripcion + monto_donativo), 0)::int as total
          from public.orden where evento_id = ${real.id} and estado = 'pagada'
      `;

      const res = await fetch(`${BASE}/api/run/cortesias`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-run-pase": paseAdmin },
        body: JSON.stringify({
          nombre: "Patrocinador de prueba",
          correo: "cortesia-prueba@example.com",
          motivo: "Prueba automatizada",
          cantidad: 2,
        }),
      });
      const cuerpo = await res.json();
      verificar("coordinación puede emitir cortesías", res.status, 200);
      verificar("entrega una liga por boleto", cuerpo.ligas?.length, 2);

      const [orden] = await sql`
        select o.id, o.estado::text, o.monto_inscripcion::int as monto, o.motivo_cortesia,
               (select count(*)::int from public.boleto b where b.orden_id = o.id) as boletos
          from public.orden o
         where o.evento_id = ${real.id} and o.motivo_cortesia is not null
         order by o.creada_en desc limit 1
      `;
      ordenesEnReal.push(orden.id);

      verificar("nace pagada", orden.estado, "pagada");
      verificar("con monto cero", orden.monto, 0);
      verificar("y con el motivo escrito", orden.motivo_cortesia, "Prueba automatizada");
      verificar("con sus dos boletos", orden.boletos, 2);

      const [pago] = await sql`
        select metodo::text, monto_centavos::int as monto, estado::text
          from public.pago where orden_id = ${orden.id}
      `;
      verificar("el pago queda como cortesía confirmada",
        [pago.metodo, pago.monto, pago.estado], ["cortesia", 0, "confirmado"]);

      const despues = await sql`
        select coalesce(sum(monto_inscripcion + monto_donativo), 0)::int as total
          from public.orden where evento_id = ${real.id} and estado = 'pagada'
      `;
      verificar("no infla lo recaudado", despues[0].total, antes[0].total);

      // La liga sirve: es el flujo completo, que es lo que la hace útil para
      // probar antes de abrir venta.
      const token = cuerpo.ligas[0].replace("/run/activar/", "");
      const activacion = await fetch(`${BASE}/api/run/activar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token, nombre: "Invitado", apellidos: "De Prueba",
          fechaNacimiento: "1992-07-14", sexo: "M", correo: "cortesia-prueba@example.com",
          tallaPlayera: "L", contactoEmergNombre: "Alguien", contactoEmergTel: "6180001234",
          aceptaResponsiva: true,
        }),
      });
      verificar("la liga de cortesía activa igual que una pagada", activacion.status, 200);

      const pdf = await fetch(`${BASE}/api/run/boleto/${token}/pdf`);
      verificar("y genera su boleto con QR", pdf.status, 200);
    }

  } finally {
    for (const ordenId of ordenesEnReal) {
      await sql`delete from public.checkin where boleto_id in
                 (select id from public.boleto where orden_id = ${ordenId})`;
      await sql`delete from public.orden where id = ${ordenId}`;
    }
    // El rango de dorsales del evento real vuelve a quedar sin definir, que
    // es como debe estar hasta que lo confirme el cronometrista.
    for (const r of creadosEnReal) {
      await sql`
        update public.tipo_boleto
           set dorsal_desde = ${r.dorsal_desde}, dorsal_hasta = ${r.dorsal_hasta}
         where id = ${r.tipo_id}
      `;
      await sql`update public.dorsal_secuencia set siguiente = 0 where tipo_boleto_id = ${r.tipo_id}`;
    }
    await sql`delete from public.checkin where evento_id = ${evento.id}`;
    await sql`delete from public.orden where evento_id = ${evento.id}`;
    await sql`delete from public.dorsal_secuencia where evento_id = ${evento.id}`;
    await sql`delete from public.tipo_boleto where evento_id = ${evento.id}`;
    await sql`delete from public.evento where id = ${evento.id}`;
  }

  console.log(`\n${fallas === 0 ? "Todo pasó." : `${fallas} verificaciones fallaron.`}`);
  return fallas;
}

main()
  .then(async (f) => {
    await sql.end();
    process.exit(f === 0 ? 0 : 1);
  })
  .catch(async (err) => {
    console.error(err);
    await sql.end();
    process.exit(1);
  });
