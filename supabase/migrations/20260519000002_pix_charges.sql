create table if not exists public.pix_charges (
  id                uuid primary key default gen_random_uuid(),
  asaas_payment_id  text unique not null,
  email             text not null,
  name              text,
  product           text not null,
  status            text not null default 'pending',
  created_at        timestamptz default now(),
  confirmed_at      timestamptz
);

alter table public.pix_charges enable row level security;

create policy "service role full access"
  on public.pix_charges
  for all
  using (auth.role() = 'service_role');
