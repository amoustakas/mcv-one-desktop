-- Per-venture + per-payment-method processor routing overrides.
-- Lets each venture configure which processor handles which method
-- (e.g. BetEdge routes wire_usd through Stripe Connect account A,
-- FutureState routes wire_usd through account B). Without a row here,
-- the PaymentRouter's default capability match applies.
--
-- SPEC-EQC-001 Epic 16 Story 18 — processor registration.

CREATE TABLE IF NOT EXISTS public.payment_processor_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  venture_id text NOT NULL REFERENCES public.ventures(id) ON DELETE CASCADE,
  payment_method text NOT NULL,
  processor_id text NOT NULL,
  priority integer NOT NULL DEFAULT 100,
  enabled boolean NOT NULL DEFAULT true,
  metadata jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (venture_id, payment_method, processor_id)
);

CREATE INDEX IF NOT EXISTS idx_payment_processor_config_venture
  ON public.payment_processor_config (venture_id, enabled);

-- Auto-update updated_at on writes
CREATE OR REPLACE FUNCTION public.payment_processor_config_touch()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_payment_processor_config_touch ON public.payment_processor_config;
CREATE TRIGGER trg_payment_processor_config_touch
  BEFORE UPDATE ON public.payment_processor_config
  FOR EACH ROW EXECUTE FUNCTION public.payment_processor_config_touch();

ALTER TABLE public.payment_processor_config ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all payment_processor_config" ON public.payment_processor_config;
CREATE POLICY "Allow all payment_processor_config" ON public.payment_processor_config
  FOR ALL USING (true) WITH CHECK (true);

COMMENT ON TABLE public.payment_processor_config IS
  'Per-venture per-method routing map. NULL venture_id rows are global defaults (not allowed by FK — use an app-layer fallback instead).';
COMMENT ON COLUMN public.payment_processor_config.processor_id IS
  'Matches PaymentProcessor.id from @mcv/payments-sdk — e.g. stripe, solana, credits.';
COMMENT ON COLUMN public.payment_processor_config.priority IS
  'Lower wins when multiple processors accept the same method for a venture.';
COMMENT ON COLUMN public.payment_processor_config.metadata IS
  'Processor-specific config e.g. {"stripe_account_id": "acct_..."} for Stripe Connect.';
