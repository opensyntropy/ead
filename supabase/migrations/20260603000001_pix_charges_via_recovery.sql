alter table public.pix_charges
  add column if not exists via_recovery boolean not null default false;
