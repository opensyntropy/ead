alter table public.pix_charges
  add column if not exists utm_term text;
