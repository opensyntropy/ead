ALTER TABLE public.user_products ADD COLUMN IF NOT EXISTS refunded boolean NOT NULL DEFAULT false;
