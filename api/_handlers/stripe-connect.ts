import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { emitPaymentEvent } from './_payment-events.js';

// ---------------------------------------------------------------------------
// Stripe Connect endpoint — Express accounts per venture.
//
// Actions:
//   create-account       → create Express account for a venture, persist row
//   onboarding-link      → hosted onboarding URL (one-time, use, expires)
//   account-status       → sync capabilities + requirements from Stripe
//   dashboard-link       → Express dashboard login URL for the connected user
//   list-accounts        → list all venture accounts
//   get-account          → get a single venture's account
//   payout               → trigger a manual payout from connected account
//   update-fee           → change application_fee_bps for a venture
// ---------------------------------------------------------------------------

async function requireAuth(req: VercelRequest, res: VercelResponse): Promise<string | null> {
  const secretKey = process.env.CLERK_SECRET_KEY;
  if (!secretKey) return 'no-secret';
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : (req.cookies?.__session || null);
  if (!token) { res.status(401).json({ error: 'Authentication required' }); return null; }
  try {
    const { verifyToken } = await import('@clerk/backend');
    const payload = await verifyToken(token, { secretKey });
    return payload.sub;
  } catch { res.status(401).json({ error: 'Invalid session' }); return null; }
}

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '',
);

function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error('STRIPE_SECRET_KEY not configured');
  return new Stripe(key, { apiVersion: '2024-11-20.acacia' as Stripe.StripeConfig['apiVersion'] });
}

function baseUrl(req: VercelRequest): string {
  const host = req.headers['x-forwarded-host'] || req.headers.host || 'localhost:3100';
  const proto = (req.headers['x-forwarded-proto'] as string) || 'https';
  return `${proto}://${host}`;
}

async function logEvent(venture_id: string, stripe_account_id: string, event_type: string, payload: Record<string, unknown>) {
  try {
    await supabase.from('stripe_connect_events').insert({ venture_id, stripe_account_id, event_type, payload });
  } catch {
    // audit log is best-effort
  }
}

async function syncAccountState(stripe: Stripe, stripe_account_id: string): Promise<Record<string, unknown>> {
  const acct = await stripe.accounts.retrieve(stripe_account_id);
  const update = {
    charges_enabled: !!acct.charges_enabled,
    payouts_enabled: !!acct.payouts_enabled,
    details_submitted: !!acct.details_submitted,
    onboarding_completed_at: acct.details_submitted ? new Date().toISOString() : null,
    requirements_currently_due: acct.requirements?.currently_due || [],
    requirements_eventually_due: acct.requirements?.eventually_due || [],
    requirements_past_due: acct.requirements?.past_due || [],
    capabilities: (acct.capabilities as unknown as Record<string, unknown>) || {},
    email: acct.email || null,
    business_name: acct.business_profile?.name || null,
    last_synced_at: new Date().toISOString(),
  };
  await supabase.from('venture_stripe_accounts').update(update).eq('stripe_account_id', stripe_account_id);
  return { ...update, stripe_account_id };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const userId = await requireAuth(req, res); if (!userId) return;
  const action = req.method === 'GET' ? (req.query.action as string) : req.body?.action;

  try {
    const stripe = getStripe();

    switch (action) {
      case 'create-account': {
        const { venture_id, email, country = 'US', business_name } = req.body;
        if (!venture_id) return res.status(400).json({ error: 'venture_id required' });

        // Idempotent: return existing if present
        const { data: existing } = await supabase
          .from('venture_stripe_accounts')
          .select('*')
          .eq('venture_id', venture_id)
          .maybeSingle();
        if (existing) return res.json({ account: existing, created: false });

        const account = await stripe.accounts.create({
          type: 'express',
          country,
          email: email || undefined,
          business_profile: business_name ? { name: business_name } : undefined,
          capabilities: {
            card_payments: { requested: true },
            transfers: { requested: true },
          },
          metadata: { venture_id, mcv_platform: 'mcv-one-desktop' },
        });

        const { data: inserted, error } = await supabase
          .from('venture_stripe_accounts')
          .insert({
            venture_id,
            stripe_account_id: account.id,
            account_type: 'express',
            country,
            email: account.email,
            business_name: account.business_profile?.name,
            capabilities: (account.capabilities as unknown as Record<string, unknown>) || {},
          })
          .select()
          .single();
        if (error) throw error;

        await logEvent(venture_id, account.id, 'account.created', { email });
        return res.json({ account: inserted, created: true });
      }

      case 'onboarding-link': {
        const { venture_id } = req.body;
        const { data: vsa } = await supabase
          .from('venture_stripe_accounts')
          .select('stripe_account_id')
          .eq('venture_id', venture_id)
          .single();
        if (!vsa) return res.status(404).json({ error: 'No Connect account for this venture. Call create-account first.' });

        const origin = baseUrl(req);
        const link = await stripe.accountLinks.create({
          account: vsa.stripe_account_id,
          refresh_url: `${origin}/#venture=${encodeURIComponent(venture_id)}&stripe=refresh`,
          return_url: `${origin}/#venture=${encodeURIComponent(venture_id)}&stripe=return`,
          type: 'account_onboarding',
          collect: 'eventually_due',
        });

        await logEvent(venture_id, vsa.stripe_account_id, 'onboarding.started', { url: link.url, expires_at: link.expires_at });
        return res.json({ url: link.url, expires_at: link.expires_at });
      }

      case 'account-status': {
        const { venture_id } = req.body;
        const { data: vsa } = await supabase
          .from('venture_stripe_accounts')
          .select('stripe_account_id')
          .eq('venture_id', venture_id)
          .single();
        if (!vsa) return res.status(404).json({ error: 'No Connect account for this venture' });

        const state = await syncAccountState(stripe, vsa.stripe_account_id);
        // fire onboarding-completed event the first time details_submitted flips true
        if ((state as { details_submitted: boolean }).details_submitted) {
          await logEvent(venture_id, vsa.stripe_account_id, 'onboarding.completed', state);
        }
        return res.json({ account: state });
      }

      case 'dashboard-link': {
        const { venture_id } = req.body;
        const { data: vsa } = await supabase
          .from('venture_stripe_accounts')
          .select('stripe_account_id')
          .eq('venture_id', venture_id)
          .single();
        if (!vsa) return res.status(404).json({ error: 'No Connect account for this venture' });

        const link = await stripe.accounts.createLoginLink(vsa.stripe_account_id);
        return res.json({ url: link.url });
      }

      case 'list-accounts': {
        const { data, error } = await supabase
          .from('venture_stripe_accounts')
          .select('*')
          .order('created_at', { ascending: false });
        if (error) throw error;
        return res.json({ accounts: data || [] });
      }

      case 'get-account': {
        const venture_id = (req.query.venture_id || req.body?.venture_id) as string;
        const { data, error } = await supabase
          .from('venture_stripe_accounts')
          .select('*')
          .eq('venture_id', venture_id)
          .maybeSingle();
        if (error) throw error;
        return res.json({ account: data });
      }

      case 'payout': {
        const { venture_id, amount, currency = 'usd' } = req.body;
        const { data: vsa } = await supabase
          .from('venture_stripe_accounts')
          .select('stripe_account_id, payouts_enabled')
          .eq('venture_id', venture_id)
          .single();
        if (!vsa) return res.status(404).json({ error: 'No Connect account for this venture' });
        if (!vsa.payouts_enabled) return res.status(400).json({ error: 'Payouts not enabled — complete onboarding first' });

        const payout = await stripe.payouts.create(
          { amount: Math.round(amount * 100), currency },
          { stripeAccount: vsa.stripe_account_id },
        );
        await logEvent(venture_id, vsa.stripe_account_id, 'payout.created', { id: payout.id, amount: payout.amount });
        await emitPaymentEvent({
          event_type: 'payout.created',
          processor: 'stripe',
          venture_id,
          actor: userId,
          external_id: payout.id,
          amount_cents: payout.amount,
          currency: (payout.currency ?? 'usd').toUpperCase(),
          status: payout.status ?? null,
          payload: {
            stripe_account_id: vsa.stripe_account_id,
            arrival_date: payout.arrival_date,
          },
        });
        return res.json({ payout: { id: payout.id, amount: payout.amount / 100, currency: payout.currency, status: payout.status, arrival_date: payout.arrival_date } });
      }

      case 'update-fee': {
        const { venture_id, application_fee_bps } = req.body;
        if (typeof application_fee_bps !== 'number' || application_fee_bps < 0 || application_fee_bps > 10000) {
          return res.status(400).json({ error: 'application_fee_bps must be 0–10000' });
        }
        const { data, error } = await supabase
          .from('venture_stripe_accounts')
          .update({ application_fee_bps })
          .eq('venture_id', venture_id)
          .select()
          .single();
        if (error) throw error;
        return res.json({ account: data });
      }

      default:
        return res.status(400).json({ error: `Unknown action: ${action}` });
    }
  } catch (error) {
    return res.status(500).json({ error: error instanceof Error ? error.message : (error && typeof error === 'object' && 'message' in error ? String((error as { message: unknown }).message) : JSON.stringify(error)) });
  }
}
