-- ──────────────────────────────────────────────────────────────────────
-- Cortesías: boletos sin cobro.
--
-- Patrocinadores, staff, prensa, becas — y también las pruebas del propio
-- equipo antes de abrir venta.
--
-- No se resuelven con un cupón del 100%: eso deja una orden que dice haber
-- vendido $399 mientras Stripe cobró $0, y ese descuadre aparece cuando
-- alguien cuadra contra el estado de cuenta. Una cortesía se registra con
-- monto cero desde el origen, con su método propio (`cortesia`, que ya
-- existía en el enum) y con el motivo escrito, que es lo que el contador va
-- a preguntar.
--
-- Ocupan cupo como cualquier otro boleto: son lugares reales, con playera y
-- kit que hay que entregar.
-- ──────────────────────────────────────────────────────────────────────

alter table public.orden
  add column if not exists motivo_cortesia text;

comment on column public.orden.motivo_cortesia is
  'Por qué se regaló este boleto. No nulo = cortesía; la orden va con monto cero.';

-- Para separarlas al conciliar y al reportar.
create index if not exists orden_cortesia_idx
  on public.orden (evento_id)
  where motivo_cortesia is not null;
