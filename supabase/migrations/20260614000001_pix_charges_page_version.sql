alter table public.pix_charges
  add column if not exists page_version text; -- 'normal' | 'returning'
