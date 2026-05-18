create table if not exists public.download_tokens (
  token      uuid primary key default gen_random_uuid(),
  email      text not null,
  product    text not null,
  used       boolean not null default false,
  created_at timestamptz default now()
);

alter table public.download_tokens enable row level security;

create policy "service role full access"
  on public.download_tokens
  for all
  using (auth.role() = 'service_role');

-- Bucket privado para os ebooks
insert into storage.buckets (id, name, public)
values ('ebooks', 'ebooks', false)
on conflict (id) do nothing;

create policy "service role ebooks"
  on storage.objects
  for all
  using (bucket_id = 'ebooks' and auth.role() = 'service_role');
