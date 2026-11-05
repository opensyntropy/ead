-- Inscritos para receber aviso de novos vídeos do Guia Agrofloresta (formulário da home e dos capítulos).
-- Cada pessoa deixa e-mail, WhatsApp ou os dois; o aviso sai pelo canal que ela deixou.
create table if not exists public.video_subscribers (
  id          uuid primary key default gen_random_uuid(),
  email       text unique,
  whatsapp    text unique,          -- só dígitos, com DDI (formato wa.me), ex.: 5512991234567
  origem      text,                 -- página onde se inscreveu, ex.: /manejo/chaya
  created_at  timestamptz default now(),
  constraint video_subscribers_contato check (email is not null or whatsapp is not null)
);

alter table public.video_subscribers enable row level security;

do $$ begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'video_subscribers' and policyname = 'service role full access'
  ) then
    create policy "service role full access"
      on public.video_subscribers
      for all
      using (auth.role() = 'service_role');
  end if;
end $$;
