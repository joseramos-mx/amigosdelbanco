-- ──────────────────────────────────────────────────────────────────────
-- Reembolsos de donativos.
--
-- 0001 sostiene los agregados con triggers que solo SUMAN al insertar. Con
-- eso, un reembolso hecho desde el dashboard de Stripe deja `totals` y
-- `donors.total_donated_cents` inflados para siempre, y nadie se entera
-- hasta que alguien cuadra a mano.
--
-- El check `amount_cents > 0` impide registrarlo como una fila negativa, así
-- que el reembolso se marca sobre la donación original y un trigger de
-- UPDATE resta lo mismo que sumó el de INSERT. Simétrico, y la resta vive
-- junto a la suma en lugar de repartida en el código.
-- ──────────────────────────────────────────────────────────────────────

alter table public.donations
  add column if not exists refunded_cents bigint not null default 0
    check (refunded_cents >= 0),
  add column if not exists refunded_at timestamptz;

create or replace function public.donations_after_update()
returns trigger language plpgsql as $$
declare
  delta bigint;
begin
  -- Solo importa el cambio en lo reembolsado de una donación exitosa.
  if new.status <> 'succeeded' and old.status <> 'succeeded' then
    return new;
  end if;

  delta := new.refunded_cents - old.refunded_cents;
  if delta = 0 then
    return new;
  end if;

  update public.donors
     set total_donated_cents = greatest(0, total_donated_cents - delta),
         updated_at = now()
   where id = new.donor_id;

  update public.totals
     set raised_cents = greatest(0, raised_cents - delta),
         updated_at = now()
   where id = 1;

  return new;
end;
$$;

drop trigger if exists donations_after_update_trg on public.donations;

create trigger donations_after_update_trg
after update of refunded_cents on public.donations
for each row execute function public.donations_after_update();
