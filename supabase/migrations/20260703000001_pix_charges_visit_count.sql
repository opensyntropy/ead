-- Número de acessos à página do ebook (localStorage ebook_visits) no momento do checkout.
-- Permite medir quantos acessos o comprador teve até converter.
alter table public.pix_charges
  add column if not exists visit_count integer;
