-- Migra formato antigo ('A'/'B') para novo formato ('testId:variant')
UPDATE public.page_visits
  SET ab_variant = 'checkout_headline:' || ab_variant
  WHERE ab_variant IN ('A', 'B');

UPDATE public.pix_charges
  SET ab_variant = 'checkout_headline:' || ab_variant
  WHERE ab_variant IN ('A', 'B');
