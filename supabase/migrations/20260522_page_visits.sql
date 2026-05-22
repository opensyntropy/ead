create table if not exists public.page_visits (
  id          uuid primary key default gen_random_uuid(),
  page        text not null,
  utm_source  text,
  utm_medium  text,
  utm_campaign text,
  created_at  timestamptz not null default now()
);

-- Apenas o service role insere (via /api/track). Sem acesso anon.
alter table public.page_visits enable row level security;
