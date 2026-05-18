alter table public.download_tokens
  add column if not exists storage_path text;
