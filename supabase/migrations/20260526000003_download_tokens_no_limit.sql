alter table public.download_tokens
  add column if not exists no_limit boolean not null default false;
