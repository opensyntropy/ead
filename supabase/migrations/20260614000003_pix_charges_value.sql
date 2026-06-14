-- Valor em centavos no momento da cobrança
alter table public.pix_charges
  add column if not exists value integer;

-- Backfill produtos com preço fixo (course, bundle, session, session_upsell)
update public.pix_charges set value = 9700  where product = 'course'          and value is null;
update public.pix_charges set value = 12700 where product = 'bundle'          and value is null;
update public.pix_charges set value = 19700 where product = 'session'         and value is null;
update public.pix_charges set value = 12000 where product = 'session_upsell'  and value is null;

-- Ebook: antes de 2026-06-14 (meia-noite SP = 03:00 UTC) era R$67, depois R$87
update public.pix_charges set value = 6700
  where product = 'ebook' and value is null
    and created_at < '2026-06-14T03:00:00Z';

update public.pix_charges set value = 8700
  where product = 'ebook' and value is null
    and created_at >= '2026-06-14T03:00:00Z';
