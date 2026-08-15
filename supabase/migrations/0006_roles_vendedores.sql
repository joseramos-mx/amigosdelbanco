-- Tabla para manejar roles de usuarios (vendedores, admin, etc) ligados a auth.users
create table public.usuario_rol (
  id         uuid primary key references auth.users(id) on delete cascade,
  rol        text not null check (rol in ('admin', 'escaner', 'vendedor')),
  nombre     text, -- Opcional, para mostrar el nombre del vendedor en el panel
  creado_en  timestamptz not null default now()
);

-- Habilitar RLS en la tabla
alter table public.usuario_rol enable row level security;

-- Relacionar la orden con el vendedor que capturó/vendió el boleto físico
alter table public.orden
  add column vendedor_id uuid references public.usuario_rol(id) on delete set null;

-- Índice para búsquedas rápidas de folios por vendedor
create index idx_orden_vendedor on public.orden(vendedor_id);
