-- ──────────────────────────────────────────────────────────────────────
-- Semilla del Social Run 2026.
--
-- Todo lo de aquí es CONFIGURACIÓN, no estructura: se edita con un UPDATE,
-- no con un deploy. Tres valores siguen sin confirmarse y por eso el evento
-- nace en 'borrador', que es el único estado en el que /api/run/orden se
-- niega a vender:
--
--   · fecha_carrera — el 16 de octubre de 2026 sale del mockup del boleto.
--     Manda la fecha real en cuanto se cierre: de ella dependen las
--     categorías por edad y las fechas de corte.
--   · precio_centavos y cupo_total — provisionales.
--   · dorsal_desde / dorsal_hasta — los define el cronometrista. Quedan
--     nulos a propósito: sin contrato, la asignación de dorsales (Fase 3)
--     debe fallar en voz alta en lugar de inventar números.
--
-- Para abrir venta, una vez confirmados:
--   update public.tipo_boleto set precio_centavos = ..., cupo_total = ...,
--          dorsal_desde = ..., dorsal_hasta = ... where nombre = '...';
--   update public.dorsal_secuencia set siguiente = <dorsal_desde>;
--   update public.evento set estado = 'venta_abierta' where slug = 'social-run-2026';
-- ──────────────────────────────────────────────────────────────────────

insert into public.evento (nombre, slug, fecha_carrera, sede, ciudad, estado)
values (
  'Social Run 2026 — Generous Generation',
  'social-run-2026',
  '2026-10-16 17:00:00-06',          -- provisional, del mockup del boleto
  'Antigua Estación de Ferrocarril',
  'Durango, Dgo.',
  'borrador'
)
on conflict (slug) do nothing;

insert into public.tipo_boleto (evento_id, nombre, distancia_km, precio_centavos, cupo_total)
select e.id, 'Founding Member Pass', null, 0, 500
from public.evento e
where e.slug = 'social-run-2026'
on conflict (evento_id, nombre) do nothing;

-- El contador arranca en dorsal_desde cuando exista; mientras tanto en 0,
-- y la asignación valida el rango antes de tocarlo.
insert into public.dorsal_secuencia (tipo_boleto_id, evento_id, siguiente)
select tb.id, tb.evento_id, coalesce(tb.dorsal_desde, 0)
from public.tipo_boleto tb
join public.evento e on e.id = tb.evento_id
where e.slug = 'social-run-2026'
on conflict (tipo_boleto_id) do nothing;
