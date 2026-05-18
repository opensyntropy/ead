create table if not exists public.refund_requests (
  id         uuid primary key default gen_random_uuid(),
  email      text not null,
  reason     text,
  status     text not null default 'pending',
  created_at timestamptz default now()
);

alter table public.refund_requests enable row level security;

create policy "service role full access"
  on public.refund_requests
  for all
  using (auth.role() = 'service_role');
