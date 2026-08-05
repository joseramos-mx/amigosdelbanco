-- ──────────────────────────────────────────────────────────────────────
-- Inscripciones a carreras — proyecto Generous Generation
--
-- Siete tablas: evento, tipo_boleto, orden, pago, boleto, dorsal_secuencia
-- y checkin. Todas llevan evento_id aunque hoy solo exista una carrera:
-- es lo que deja abierta la puerta a una segunda edición sin rehacer nada.
--
-- Acceso: solo desde el servidor, con conexión directa a Postgres
-- (src/lib/run/db.ts). RLS queda activo y sin políticas, así que la llave
-- anónima de PostgREST no lee nada; el rol dueño de la conexión la omite.
--
-- Reglas que sostiene este schema:
--   · El estado del pago lo define el webhook  → pago.idempotency_key unique
--   · El cupo se reserva con TTL               → orden.expira_en + índice
--   · El dorsal se asigna bajo lock            → dorsal_secuencia + unique
-- ──────────────────────────────────────────────────────────────────────

-- ── Enumeraciones ─────────────────────────────────────────────────────
create type public.estado_evento as enum ('borrador', 'venta_abierta', 'venta_cerrada', 'finalizado');
create type public.estado_orden  as enum ('pendiente', 'pagada', 'expirada', 'cancelada', 'reembolsada');
create type public.metodo_pago   as enum ('tarjeta', 'oxxo', 'spei', 'cortesia');
create type public.estado_pago   as enum ('iniciado', 'pendiente', 'confirmado', 'fallido', 'reembolsado');
create type public.estado_boleto as enum ('pendiente', 'pagado', 'activado', 'dorsal_asignado', 'entregado', 'cancelado');
create type public.sexo          as enum ('F', 'M', 'X');
create type public.tipo_checkin  as enum ('kit', 'acceso');

-- ── evento ────────────────────────────────────────────────────────────
create table public.evento (
  id             uuid primary key default gen_random_uuid(),
  nombre         text not null,
  slug           text not null unique,
  fecha_carrera  timestamptz not null,
  sede           text not null,
  ciudad         text not null default 'Durango, Dgo.',
  estado         public.estado_evento not null default 'borrador',
  -- Ventana de reserva de la orden. Arranca en 24 h porque una sesión de
  -- Stripe Checkout no vive más que eso; el webhook la extiende a la
  -- vigencia real del voucher OXXO cuando se genera la referencia.
  ttl_reserva_horas int not null default 24 check (ttl_reserva_horas between 1 and 168),
  creado_en      timestamptz not null default now()
);

-- ── tipo_boleto ───────────────────────────────────────────────────────
-- Fase 1 opera con un solo tipo y un precio plano. Los periodos de precio
-- (preventa / general) llegan cuando se definan, en su propia tabla.
create table public.tipo_boleto (
  id              uuid primary key default gen_random_uuid(),
  evento_id       uuid not null references public.evento(id) on delete cascade,
  nombre          text not null,
  distancia_km    numeric(5,2),
  precio_centavos bigint not null check (precio_centavos >= 0),
  cupo_total      int not null check (cupo_total > 0),
  -- Rango de dorsales: lo fija el cronometrista. Sin contrato cerrado se
  -- deja nulo y la asignación (Fase 3) falla explícitamente en vez de
  -- inventar números.
  dorsal_desde    int,
  dorsal_hasta    int,
  creado_en       timestamptz not null default now(),
  unique (evento_id, nombre),
  constraint dorsal_rango_coherente check (
    (dorsal_desde is null and dorsal_hasta is null)
    or (dorsal_desde is not null and dorsal_hasta is not null and dorsal_hasta >= dorsal_desde)
  )
);

-- ── orden ─────────────────────────────────────────────────────────────
-- Folio legible para soporte, con el mismo formato que el talón impreso.
create sequence public.orden_folio_seq start 1;

create table public.orden (
  id                uuid primary key default gen_random_uuid(),
  evento_id         uuid not null references public.evento(id) on delete restrict,
  folio             text not null unique
                      default ('GG-' || lpad(nextval('public.orden_folio_seq')::text, 5, '0')),
  correo_comprador  text not null,
  nombre_comprador  text not null,
  telefono          text,

  -- Separación fiscal, desde el origen y nunca sumadas: la inscripción es
  -- contraprestación (CFDI de ingreso) y el donativo es deducible (CFDI con
  -- complemento de donatarias). Ver references/fiscal-mx.md.
  monto_inscripcion bigint not null check (monto_inscripcion >= 0),
  monto_donativo    bigint not null default 0 check (monto_donativo >= 0),
  monto_addons      bigint not null default 0 check (monto_addons >= 0),

  estado            public.estado_orden not null default 'pendiente',
  expira_en         timestamptz,

  -- Datos de facturación: opcionales, y viven en la orden porque quien paga
  -- puede no ser quien corre.
  requiere_factura  boolean not null default false,
  rfc               text,
  razon_social      text,
  uso_cfdi          text,
  regimen_fiscal    text,
  cp_fiscal         text,
  correo_factura    text,

  stripe_session_id text unique,
  recordatorio_en   timestamptz,          -- aviso de "tu referencia vence"
  creada_en         timestamptz not null default now(),
  actualizada_en    timestamptz not null default now()
);

-- El cron de expiración barre exactamente por aquí.
create index orden_estado_expira_idx on public.orden (estado, expira_en);
create index orden_evento_estado_idx on public.orden (evento_id, estado);

-- ── pago ──────────────────────────────────────────────────────────────
-- idempotency_key es el id del evento de la pasarela. Es la única defensa
-- real contra el reenvío de webhooks, por eso es unique y se inserta antes
-- de aplicar cualquier efecto.
create table public.pago (
  id                 uuid primary key default gen_random_uuid(),
  evento_id          uuid not null references public.evento(id) on delete restrict,
  orden_id           uuid not null references public.orden(id) on delete cascade,
  proveedor          text not null default 'stripe',
  metodo             public.metodo_pago not null,
  referencia_externa text,                              -- referencia OXXO o CLABE SPEI
  idempotency_key    text not null unique,
  monto_centavos     bigint not null,
  estado             public.estado_pago not null default 'iniciado',
  vencimiento_ref    timestamptz,
  payload_crudo      jsonb,                             -- siempre, sin excepción
  procesado_en       timestamptz,
  creado_en          timestamptz not null default now()
);

create index pago_orden_idx on public.pago (orden_id, creado_en desc);

-- ── boleto ────────────────────────────────────────────────────────────
create table public.boleto (
  id                    uuid primary key default gen_random_uuid(),
  evento_id             uuid not null references public.evento(id) on delete restrict,
  orden_id              uuid not null references public.orden(id) on delete cascade,
  tipo_boleto_id        uuid not null references public.tipo_boleto(id) on delete restrict,
  estado                public.estado_boleto not null default 'pendiente',

  -- Se llenan en la activación (Fase 2), no en la compra.
  nombre                text,
  apellidos             text,
  fecha_nacimiento      date,
  sexo                  public.sexo,
  correo                text,
  telefono              text,
  talla_playera         text,
  club                  text,
  nacionalidad          text,
  contacto_emerg_nombre text,
  contacto_emerg_tel    text,
  tipo_sangre           text,
  condiciones_medicas   text,

  categoria             text,        -- se calcula a la fecha de la carrera
  dorsal                int,
  token_activacion      text not null unique,
  activado_en           timestamptz,

  responsiva_version    text,
  responsiva_aceptada   timestamptz,
  responsiva_ip         text,

  creado_en             timestamptz not null default now(),
  actualizado_en        timestamptz not null default now(),

  -- Red de seguridad del dorsal: si algún día falla el lock, la base
  -- rechaza el duplicado en vez de permitirlo en silencio. Los nulos no
  -- chocan entre sí, así que convive con boletos sin dorsal asignado.
  unique (evento_id, dorsal)
);

create index boleto_token_idx       on public.boleto (token_activacion);
create index boleto_orden_idx       on public.boleto (orden_id);
create index boleto_tipo_estado_idx on public.boleto (tipo_boleto_id, estado);

-- ── dorsal_secuencia ──────────────────────────────────────────────────
-- Contador por tipo de boleto. Se toma con SELECT ... FOR UPDATE en Fase 3.
create table public.dorsal_secuencia (
  tipo_boleto_id uuid primary key references public.tipo_boleto(id) on delete cascade,
  evento_id      uuid not null references public.evento(id) on delete cascade,
  siguiente      int not null
);

-- ── checkin ───────────────────────────────────────────────────────────
create table public.checkin (
  id             uuid primary key default gen_random_uuid(),
  evento_id      uuid not null references public.evento(id) on delete restrict,
  boleto_id      uuid not null references public.boleto(id) on delete cascade,
  tipo           public.tipo_checkin not null,
  registrado_por text not null,
  registrado_en  timestamptz not null default now(),
  notas          text,
  -- "El primero gana": el segundo escaneo del mismo kit no crea otro
  -- registro, se marca para revisión manual.
  unique (boleto_id, tipo)
);

-- ── actualizada_en / actualizado_en ───────────────────────────────────
create or replace function public.tocar_actualizada_en()
returns trigger language plpgsql as $$
begin
  new.actualizada_en = now();
  return new;
end;
$$;

create or replace function public.tocar_actualizado_en()
returns trigger language plpgsql as $$
begin
  new.actualizado_en = now();
  return new;
end;
$$;

create trigger orden_tocar_trg  before update on public.orden
  for each row execute function public.tocar_actualizada_en();

create trigger boleto_tocar_trg before update on public.boleto
  for each row execute function public.tocar_actualizado_en();

-- ── Row Level Security ────────────────────────────────────────────────
-- Sin políticas a propósito: nada de esto es público. Todo el acceso pasa
-- por el servidor con conexión directa.
alter table public.evento           enable row level security;
alter table public.tipo_boleto      enable row level security;
alter table public.orden            enable row level security;
alter table public.pago             enable row level security;
alter table public.boleto           enable row level security;
alter table public.dorsal_secuencia enable row level security;
alter table public.checkin          enable row level security;
