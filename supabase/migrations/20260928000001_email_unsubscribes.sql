-- Descadastros dos disparos do admin (/admin/email). O envio geral ignora
-- quem está aqui; emails de compra (download, sessão) não são afetados.
create table if not exists public.email_unsubscribes (
  email       text primary key,
  created_at  timestamptz default now()
);

alter table public.email_unsubscribes enable row level security;

do $$ begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'email_unsubscribes' and policyname = 'service role full access'
  ) then
    create policy "service role full access"
      on public.email_unsubscribes
      for all
      using (auth.role() = 'service_role');
  end if;
end $$;
