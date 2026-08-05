/**
 * Prueba de aceptación de la Fase 2.
 *
 * Recorre el camino completo del boleto contra el servidor y la base reales:
 *
 *   pago confirmado → liga firmada → activación con responsiva → PDF con QR
 *
 * Comprueba además lo que sostiene ese camino: que la liga de otro boleto no
 * sirva, que un boleto sin pagar no se pueda activar, que la responsiva quede
 * registrada con versión e IP, y que el token del QR no sea intercambiable
 * con el de activación.
 *
 *   node --env-file=.env.local scripts/fase2-aceptacion.mjs [http://localhost:3000]
 *
 * Crea su propio evento y lo borra al terminar.
 */

import postgres from "postgres";
import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";

const BASE = process.argv[2] ?? process.env.BASE_URL ?? "http://localhost:3000";
const SECRETO = process.env.RUN_TOKEN_SECRET;

if (!process.env.DATABASE_URL) throw new Error("Falta DATABASE_URL");
if (!SECRETO) throw new Error("Falta RUN_TOKEN_SECRET");

const sql = postgres(process.env.DATABASE_URL, { max: 1, prepare: false, onnotice: () => {} });

const PRECIO = 39900;

let fallas = 0;
function verificar(descripcion, real, esperado) {
  const ok = JSON.stringify(real) === JSON.stringify(esperado);
  if (!ok) fallas += 1;
  console.log(
    `${ok ? "✓" : "✗"} ${descripcion}` +
      (ok ? "" : `\n    esperado ${JSON.stringify(esperado)}, obtenido ${JSON.stringify(real)}`),
  );
}

// Mismo esquema que src/lib/run/tokens.ts, para poder fabricar ligas válidas.
const b64 = (s) => Buffer.from(s).toString("base64url");
const firmar = (payload, dominio) =>
  b64(createHmac("sha256", `${SECRETO}:${dominio}`).update(payload).digest());

function tokenActivacion(boletoId, expiraEn) {
  const payload = b64(JSON.stringify({ b: boletoId, e: Math.floor(expiraEn.getTime() / 1000) }));
  return `${payload}.${firmar(payload, "activacion")}`;
}

const DATOS = {
  nombre: "Ana",
  apellidos: "Ramírez Soto",
  fechaNacimiento: "1994-03-12",
  sexo: "F",
  correo: "ana.prueba@example.com",
  telefono: "6180001122",
  tallaPlayera: "M",
  club: "Club de prueba",
  contactoEmergNombre: "Luis Ramírez",
  contactoEmergTel: "6180003344",
  tipoSangre: "O+",
  aceptaResponsiva: true,
};

async function activar(token, extra = {}) {
  const res = await fetch(`${BASE}/api/run/activar`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-forwarded-for": "189.203.0.7" },
    body: JSON.stringify({ ...DATOS, ...extra, token }),
  });
  return { status: res.status, cuerpo: await res.json().catch(() => ({})) };
}

async function main() {
  console.log(`Servidor: ${BASE}\n`);

  const [evento] = await sql`
    insert into public.evento (nombre, slug, fecha_carrera, sede, estado)
    values ('Prueba fase 2', ${`fase2-${Date.now()}`},
            '2026-10-16 17:00:00-06', 'Sede de prueba', 'venta_abierta')
    returning id, fecha_carrera
  `;
  const [tipo] = await sql`
    insert into public.tipo_boleto (evento_id, nombre, precio_centavos, cupo_total)
    values (${evento.id}, 'Boleto de prueba', ${PRECIO}, 10) returning id
  `;

  // El token caduca un día después de la carrera, igual que en producción.
  const expira = new Date(evento.fecha_carrera.getTime() + 86_400_000);

  async function crearBoleto(estadoOrden, estadoBoleto) {
    const id = randomUUID();
    const token = tokenActivacion(id, expira);
    const [orden] = await sql`
      insert into public.orden (evento_id, correo_comprador, nombre_comprador,
                                monto_inscripcion, estado, expira_en)
      values (${evento.id}, 'compra@example.com', 'Quien Compra', ${PRECIO},
              ${estadoOrden}, now() + interval '1 day')
      returning id, folio
    `;
    await sql`
      insert into public.boleto (id, evento_id, orden_id, tipo_boleto_id, estado, token_activacion)
      values (${id}, ${evento.id}, ${orden.id}, ${tipo.id}, ${estadoBoleto}, ${token})
    `;
    return { id, token, folio: orden.folio };
  }

  try {
    // ── 1. Activación del boleto pagado ──────────────────────────────
    console.log("1. Activación");
    const pagado = await crearBoleto("pagada", "pagado");

    const sinResponsiva = await activar(pagado.token, { aceptaResponsiva: false });
    verificar("sin aceptar la responsiva, se rechaza", sinResponsiva.status, 400);

    const ok = await activar(pagado.token);
    verificar("con datos completos, activa", ok.status, 200);

    const [b] = await sql`
      select estado::text, nombre, apellidos, talla_playera, contacto_emerg_tel,
             responsiva_version, responsiva_ip, activado_en,
             extract(year from age(fecha_nacimiento))::int as edad_hoy
        from public.boleto where id = ${pagado.id}
    `;
    verificar("el boleto queda activado", b.estado, "activado");
    verificar("guardó nombre y talla", [b.nombre, b.talla_playera], ["Ana", "M"]);
    verificar("guardó el contacto de emergencia", b.contacto_emerg_tel, "6180003344");
    verificar("dejó constancia de la responsiva", Boolean(b.responsiva_version), true);
    verificar("y de la IP desde donde se aceptó", b.responsiva_ip, "189.203.0.7");

    // ── 2. Lo que no debe poder activarse ────────────────────────────
    console.log("\n2. Ligas que no deben servir");
    const pendiente = await crearBoleto("pendiente", "pendiente");
    const sinPago = await activar(pendiente.token);
    verificar("un boleto sin pago confirmado no se activa", sinPago.status, 409);

    const falsa = await activar(`${pagado.token.split(".")[0]}.firmafalsa`);
    verificar("una firma inválida se rechaza", falsa.status, 400);

    const vencida = tokenActivacion(pagado.id, new Date(Date.now() - 86_400_000));
    verificar("una liga vencida se rechaza", (await activar(vencida)).status, 400);

    // ── 3. Separación de dominio entre tokens ────────────────────────
    console.log("\n3. El QR y la liga no son intercambiables");
    const payload = pagado.token.split(".")[0];
    const firmaQr = firmar(payload, "qr");
    const firmaActivacion = pagado.token.split(".")[1];
    verificar(
      "la misma carga firmada para QR y para activación da firmas distintas",
      firmaQr === firmaActivacion,
      false,
    );
    const comoQr = await activar(`${payload}.${firmaQr}`);
    verificar("un token de QR no sirve para activar", comoQr.status, 400);

    // ── 4. PDF con QR ────────────────────────────────────────────────
    console.log("\n4. Boleto en PDF");
    const res = await fetch(`${BASE}/api/run/boleto/${pagado.token}/pdf`);
    const buffer = Buffer.from(await res.arrayBuffer());
    verificar("responde 200", res.status, 200);
    verificar("es un PDF", buffer.subarray(0, 5).toString(), "%PDF-");
    verificar("y trae contenido", buffer.length > 5000, true);

    const sinActivar = await fetch(`${BASE}/api/run/boleto/${pendiente.token}/pdf`);
    verificar("sin activar, no hay PDF", sinActivar.status, 409);

    // ── 5. Reactivación ──────────────────────────────────────────────
    console.log("\n5. Corregir datos");
    const correccion = await activar(pagado.token, { tallaPlayera: "L", club: "Otro club" });
    verificar("se puede corregir después", correccion.status, 200);
    const [b2] = await sql`select talla_playera, estado::text from public.boleto where id = ${pagado.id}`;
    verificar("la talla se actualizó", b2.talla_playera, "L");
    verificar("y el estado no retrocede", b2.estado, "activado");
  } finally {
    await sql`delete from public.orden where evento_id = ${evento.id}`;
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
