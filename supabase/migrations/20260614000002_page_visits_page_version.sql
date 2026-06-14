alter table public.page_visits
  add column if not exists page_version text; -- 'normal' | 'returning'
