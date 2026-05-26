alter table public.download_tokens
  add column if not exists download_count int not null default 0;
