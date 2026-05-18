-- Tabela de produtos adquiridos por usuário
create table if not exists public.user_products (
  id              uuid default gen_random_uuid() primary key,
  user_id         uuid references auth.users not null,
  product         text not null check (product in ('ebook', 'course', 'bundle')),
  asaas_payment_id text,
  created_at      timestamptz default now(),
  unique (user_id, product)
);

-- Tabela de admins
create table if not exists public.admins (
  user_id uuid references auth.users primary key
);

-- RLS: usuário lê apenas seus próprios produtos
alter table public.user_products enable row level security;

create policy "user reads own products"
  on public.user_products
  for select
  using (auth.uid() = user_id);

-- Apenas service role pode inserir/deletar (webhook e admin API)
create policy "service role full access"
  on public.user_products
  for all
  using (auth.role() = 'service_role');

-- RLS admins: usuário verifica se ele mesmo é admin
alter table public.admins enable row level security;

create policy "user checks own admin status"
  on public.admins
  for select
  using (auth.uid() = user_id);

create policy "service role manages admins"
  on public.admins
  for all
  using (auth.role() = 'service_role');
