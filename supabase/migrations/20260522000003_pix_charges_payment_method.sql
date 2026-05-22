alter table public.pix_charges
  add column if not exists payment_method text,
  add column if not exists installment_count int;
