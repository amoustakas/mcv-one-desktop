-- ============================================================================
-- Automatic notifications for key business events.
-- Applied live 2026-04-13 via Supabase MCP. Git copy for reproducibility.
--
-- Writes to public.notifications -> realtime push -> NotificationCenter +
-- use-realtime.ts query invalidation -> live bell updates.
--
-- Triggers installed on:
--   1. orders INSERT                   -> info
--   2. payment_intents status change    -> success / error
--   3. invoices status change           -> success / warning
--   4. fraud_checks INSERT (risk > 80)  -> warning / error
--   5. nexus_alerts INSERT              -> info / warning / error
--   6. naos_agents milestone change     -> success
-- ============================================================================

CREATE OR REPLACE FUNCTION notify_event(
  p_title text, p_description text,
  p_type text DEFAULT 'info', p_source text DEFAULT 'system',
  p_venture_id text DEFAULT NULL
) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_catalog AS $$
BEGIN
  INSERT INTO notifications (title, description, type, source, venture_id)
  VALUES (p_title, p_description, p_type, p_source, p_venture_id);
EXCEPTION WHEN OTHERS THEN NULL;
END;
$$;

-- 1. Order INSERT
CREATE OR REPLACE FUNCTION notify_new_order() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_catalog AS $$
BEGIN
  PERFORM notify_event(
    format('New order: $%s', round(new.total_amount, 2)),
    format('Customer placed an order (status: %s)', new.status),
    'info', 'commerce', new.venture_id);
  RETURN new;
END; $$;
DROP TRIGGER IF EXISTS trg_notify_new_order ON orders;
CREATE TRIGGER trg_notify_new_order AFTER INSERT ON orders
  FOR EACH ROW EXECUTE FUNCTION notify_new_order();

-- 2. Payment intent status change
CREATE OR REPLACE FUNCTION notify_payment_status() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_catalog AS $$
BEGIN
  IF new.status = 'succeeded' AND (old.status IS NULL OR old.status <> 'succeeded') THEN
    PERFORM notify_event(
      format('Payment succeeded: $%s', round(new.amount, 2)),
      coalesce(new.description, 'Payment processed successfully'),
      'success', 'payments', new.venture_id);
  ELSIF new.status = 'failed' AND (old.status IS NULL OR old.status <> 'failed') THEN
    PERFORM notify_event(
      format('Payment failed: $%s', round(new.amount, 2)),
      coalesce(new.description, 'Payment could not be processed'),
      'error', 'payments', new.venture_id);
  END IF;
  RETURN new;
END; $$;
DROP TRIGGER IF EXISTS trg_notify_payment_status ON payment_intents;
CREATE TRIGGER trg_notify_payment_status AFTER INSERT OR UPDATE OF status ON payment_intents
  FOR EACH ROW EXECUTE FUNCTION notify_payment_status();

-- 3. Invoice status change
CREATE OR REPLACE FUNCTION notify_invoice_overdue() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_catalog AS $$
BEGIN
  IF new.status = 'overdue' AND (old.status IS NULL OR old.status <> 'overdue') THEN
    PERFORM notify_event(
      format('Invoice overdue: %s', new.invoice_number),
      format('$%s past due — customer %s', round(new.amount_due, 2), new.customer_id),
      'warning', 'commerce', new.venture_id);
  ELSIF new.status = 'paid' AND (old.status IS NULL OR old.status <> 'paid') THEN
    PERFORM notify_event(
      format('Invoice paid: %s', new.invoice_number),
      format('$%s received', round(new.amount_paid, 2)),
      'success', 'commerce', new.venture_id);
  END IF;
  RETURN new;
END; $$;
DROP TRIGGER IF EXISTS trg_notify_invoice_status ON invoices;
CREATE TRIGGER trg_notify_invoice_status AFTER UPDATE OF status ON invoices
  FOR EACH ROW EXECUTE FUNCTION notify_invoice_overdue();

-- 4. Fraud check INSERT (high risk)
CREATE OR REPLACE FUNCTION notify_fraud_check() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_catalog AS $$
BEGIN
  IF new.decision = 'block' OR new.risk_score > 80 THEN
    PERFORM notify_event(
      format('Fraud check: %s (risk %s)', new.decision, new.risk_score),
      format('Transaction %s flagged — %s', new.transaction_id, new.decision),
      CASE WHEN new.decision = 'block' THEN 'error' ELSE 'warning' END,
      'compliance', new.venture_id);
  END IF;
  RETURN new;
END; $$;
DROP TRIGGER IF EXISTS trg_notify_fraud_check ON fraud_checks;
CREATE TRIGGER trg_notify_fraud_check AFTER INSERT ON fraud_checks
  FOR EACH ROW EXECUTE FUNCTION notify_fraud_check();

-- 5. Nexus alert INSERT
CREATE OR REPLACE FUNCTION notify_nexus_alert() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_catalog AS $$
BEGIN
  PERFORM notify_event(
    format('Tax nexus: %s', new.jurisdiction_name),
    format('%s (%s%% of threshold)', new.alert_type, round(coalesce(new.threshold_percent, 0), 1)),
    CASE new.severity WHEN 'critical' THEN 'error' WHEN 'warning' THEN 'warning' ELSE 'info' END,
    'compliance', new.venture_id);
  RETURN new;
END; $$;
DROP TRIGGER IF EXISTS trg_notify_nexus_alert ON nexus_alerts;
CREATE TRIGGER trg_notify_nexus_alert AFTER INSERT ON nexus_alerts
  FOR EACH ROW EXECUTE FUNCTION notify_nexus_alert();

-- 6. Agent milestone
CREATE OR REPLACE FUNCTION notify_agent_milestone() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_catalog AS $$
BEGIN
  IF new.milestone IS DISTINCT FROM old.milestone THEN
    PERFORM notify_event(
      format('Agent milestone: %s', new.codename),
      format('Reached %s tier', new.milestone),
      'success', 'naos', NULL);
  END IF;
  RETURN new;
END; $$;
DROP TRIGGER IF EXISTS trg_notify_agent_milestone ON naos_agents;
CREATE TRIGGER trg_notify_agent_milestone AFTER UPDATE OF milestone ON naos_agents
  FOR EACH ROW EXECUTE FUNCTION notify_agent_milestone();
