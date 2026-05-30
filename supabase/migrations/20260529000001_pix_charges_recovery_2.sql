alter table public.pix_charges
  add column if not exists recovery_sent_at_2 timestamptz;
