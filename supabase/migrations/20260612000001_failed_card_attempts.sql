-- Tentativas de pagamento com cartão recusadas/falhas.
-- Cartão é cobrado de forma síncrona: quando recusa, a Asaas não gera cobrança
-- (sem asaas_payment_id), então não cabe em pix_charges. Guardamos o contato
-- (NUNCA dados do cartão) para disparar e-mail de recuperação de cartão.
create table if not exists public.failed_card_attempts (
  id                uuid primary key default gen_random_uuid(),
  email             text not null,
  name              text,
  whatsapp          text,
  product           text not null,
  reason            text,
  utm_source        text,
  utm_medium        text,
  utm_campaign      text,
  utm_term          text,
  utm_content       text,
  ab_variant        text,
  recovery_sent_at  timestamptz,
  created_at        timestamptz default now()
);

create index if not exists failed_card_attempts_recovery_idx
  on public.failed_card_attempts (recovery_sent_at, created_at);

alter table public.failed_card_attempts enable row level security;

do $$ begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'failed_card_attempts' and policyname = 'service role full access'
  ) then
    create policy "service role full access"
      on public.failed_card_attempts
      for all
      using (auth.role() = 'service_role');
  end if;
end $$;
