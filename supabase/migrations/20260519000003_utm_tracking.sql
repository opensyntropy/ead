alter table public.pix_charges
  add column if not exists utm_source  text,
  add column if not exists utm_medium  text,
  add column if not exists utm_campaign text,
  add column if not exists utm_content  text;
