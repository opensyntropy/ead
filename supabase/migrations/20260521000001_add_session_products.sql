-- Adiciona 'session' e 'session_upsell' ao check constraint de user_products
alter table public.user_products
  drop constraint if exists user_products_product_check;

alter table public.user_products
  add constraint user_products_product_check
  check (product in ('ebook', 'course', 'bundle', 'session', 'session_upsell'));
