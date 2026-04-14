import { useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Plug, CreditCard, CheckCircle2, AlertTriangle, ExternalLink,
  RefreshCw, DollarSign, Building2, Banknote, Cloud, MessageSquare,
  Brain, Ban,
} from 'lucide-react';
import { PageShell, PageHeader, GlassCard, Badge, Button, GridLayout } from '../components/ui';
import { useNavigation } from '../stores/navigation';
import { useToast } from '../components/Toasts';
import { apiPost } from '../lib/api/client';
import { useCoreTriangleHealth } from '../hooks/use-core-triangle';
import { fadeInUp } from '../lib/animations';
import PlaidLinkButton from '../components/plaid/PlaidLinkButton';

interface PlaidItemRow {
  id: string;
  item_id: string;
  institution_name: string | null;
  accounts: Array<{ account_id?: string; name?: string; subtype?: string; mask?: string }>;
  status: string;
  venture_id: string | null;
  last_sync_at: string | null;
}

interface PlaidTransferRow {
  id: string;
  transfer_id: string | null;
  authorization_id: string | null;
  type: 'debit' | 'credit' | null;
  amount_cents: number;
  currency: string;
  status: string;
  description: string | null;
  failure_reason: string | null;
  created_at: string;
}

interface StripeConnectAccount {
  id: string;
  venture_id: string;
  stripe_account_id: string;
  account_type: string;
  country: string;
  email: string | null;
  business_name: string | null;
  charges_enabled: boolean;
  payouts_enabled: boolean;
  details_submitted: boolean;
  requirements_currently_due: string[];
  application_fee_bps: number;
  last_synced_at: string | null;
}

export default function VentureIntegrationsView() {
  const { activeVenture } = useNavigation();
  const { toast } = useToast();
  const ventureId = activeVenture || '';
  const coreHealth = useCoreTriangleHealth(60_000);

  const [stripeAccount, setStripeAccount] = useState<StripeConnectAccount | null>(null);
  const [loadingStripe, setLoadingStripe] = useState(false);
  const [feeBps, setFeeBps] = useState(1000);

  const [plaidItems, setPlaidItems] = useState<PlaidItemRow[]>([]);
  const [plaidTransfers, setPlaidTransfers] = useState<PlaidTransferRow[]>([]);
  const [loadingPlaid, setLoadingPlaid] = useState(false);

  const loadStripe = useCallback(async () => {
    if (!ventureId) return;
    setLoadingStripe(true);
    try {
      const res = await apiPost<{ account: StripeConnectAccount | null }>('/api/stripe-connect', {
        action: 'get-account',
        venture_id: ventureId,
      });
      setStripeAccount(res.account);
      if (res.account) setFeeBps(res.account.application_fee_bps);
    } catch (e) {
      toast('error', e instanceof Error ? e.message : 'Failed to load Stripe account');
    } finally {
      setLoadingStripe(false);
    }
  }, [ventureId, toast]);

  useEffect(() => { void loadStripe(); }, [loadStripe]);

  const loadPlaid = useCallback(async () => {
    if (!ventureId) return;
    setLoadingPlaid(true);
    try {
      const [itemsRes, transfersRes] = await Promise.all([
        apiPost<{ items: PlaidItemRow[] }>('/api/plaid', { action: 'list-items', venture_id: ventureId }),
        apiPost<{ transfers: PlaidTransferRow[] }>('/api/plaid', { action: 'list-transfers', venture_id: ventureId, limit: 10 }),
      ]);
      setPlaidItems(itemsRes.items || []);
      setPlaidTransfers(transfersRes.transfers || []);
    } catch (e) {
      // Non-fatal — Plaid may not be configured yet
      if (import.meta.env.DEV) console.warn('[plaid] load failed:', e);
    } finally {
      setLoadingPlaid(false);
    }
  }, [ventureId]);

  useEffect(() => { void loadPlaid(); }, [loadPlaid]);

  async function removePlaidItem(plaid_item_id: string) {
    try {
      await apiPost('/api/plaid', { action: 'remove-item', plaid_item_id });
      toast('success', 'Bank unlinked');
      await loadPlaid();
    } catch (e) {
      toast('error', e instanceof Error ? e.message : 'Unlink failed');
    }
  }

  async function createAccount() {
    try {
      const res = await apiPost<{ account: StripeConnectAccount; created: boolean }>('/api/stripe-connect', {
        action: 'create-account',
        venture_id: ventureId,
      });
      setStripeAccount(res.account);
      setFeeBps(res.account.application_fee_bps);
      toast('success', res.created ? 'Stripe Connect account created' : 'Account already exists');
    } catch (e) {
      toast('error', e instanceof Error ? e.message : 'Failed to create account');
    }
  }

  async function openOnboarding() {
    try {
      const res = await apiPost<{ url: string }>('/api/stripe-connect', {
        action: 'onboarding-link',
        venture_id: ventureId,
      });
      window.open(res.url, '_blank');
      toast('info', 'Onboarding opened in new tab. Refresh status after completion.');
    } catch (e) {
      toast('error', e instanceof Error ? e.message : 'Failed to open onboarding');
    }
  }

  async function openDashboard() {
    try {
      const res = await apiPost<{ url: string }>('/api/stripe-connect', {
        action: 'dashboard-link',
        venture_id: ventureId,
      });
      window.open(res.url, '_blank');
    } catch (e) {
      toast('error', e instanceof Error ? e.message : 'Failed to open dashboard');
    }
  }

  async function refreshStatus() {
    if (!stripeAccount) return;
    setLoadingStripe(true);
    try {
      await apiPost('/api/stripe-connect', { action: 'account-status', venture_id: ventureId });
      await loadStripe();
      toast('success', 'Status refreshed');
    } catch (e) {
      toast('error', e instanceof Error ? e.message : 'Refresh failed');
    } finally {
      setLoadingStripe(false);
    }
  }

  async function saveFee() {
    try {
      await apiPost('/api/stripe-connect', {
        action: 'update-fee',
        venture_id: ventureId,
        application_fee_bps: feeBps,
      });
      toast('success', `Platform fee set to ${(feeBps / 100).toFixed(2)}%`);
      await loadStripe();
    } catch (e) {
      toast('error', e instanceof Error ? e.message : 'Fee update failed');
    }
  }

  if (!ventureId) {
    return (
      <PageShell>
        <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
          Select a venture to manage its integrations.
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell scroll>
      <PageHeader
        icon={<Plug size={20} />}
        title="Integrations"
        subtitle={`Configure payment rails, storage, comms, and AI for ${ventureId}`}
      >
        <Button variant="secondary" size="sm" icon={<RefreshCw size={13} />} onClick={loadStripe}>Refresh</Button>
      </PageHeader>

      <GridLayout cols={2} gap="md" className="vi-grid">
        {/* ── Stripe Connect ── */}
        <motion.div variants={fadeInUp} initial="hidden" animate="show">
          <GlassCard className="vi-card">
            <div className="vi-card-header">
              <div className="vi-card-icon" style={{ color: '#635BFF' }}><CreditCard size={18} /></div>
              <div className="vi-card-title">
                <h3>Stripe Connect</h3>
                <p>Marketplace payouts + platform fee split</p>
              </div>
              {stripeAccount && (
                <div className="vi-card-pills">
                  <Badge size="sm">{stripeAccount.charges_enabled ? 'charges ✓' : 'charges ✗'}</Badge>
                  <Badge size="sm">{stripeAccount.payouts_enabled ? 'payouts ✓' : 'payouts ✗'}</Badge>
                </div>
              )}
            </div>

            {loadingStripe && !stripeAccount && <div className="vi-loading">Loading…</div>}

            {!loadingStripe && !stripeAccount && (
              <div className="vi-empty">
                <p>No Stripe Connect account yet for this venture.</p>
                <Button variant="primary" size="sm" onClick={createAccount}>Create Express Account</Button>
              </div>
            )}

            {stripeAccount && (
              <>
                <div className="vi-field">
                  <span className="vi-field-label">Account ID</span>
                  <code className="vi-field-value">{stripeAccount.stripe_account_id}</code>
                </div>
                <div className="vi-field">
                  <span className="vi-field-label">Country</span>
                  <span className="vi-field-value">{stripeAccount.country}</span>
                </div>
                {stripeAccount.business_name && (
                  <div className="vi-field">
                    <span className="vi-field-label">Business</span>
                    <span className="vi-field-value">{stripeAccount.business_name}</span>
                  </div>
                )}

                {!stripeAccount.details_submitted && (
                  <div className="vi-warning">
                    <AlertTriangle size={12} />
                    <span>Onboarding incomplete. Owner must finish KYC + banking.</span>
                  </div>
                )}

                {stripeAccount.requirements_currently_due.length > 0 && (
                  <div className="vi-warning">
                    <AlertTriangle size={12} />
                    <span>Due: {stripeAccount.requirements_currently_due.join(', ')}</span>
                  </div>
                )}

                {stripeAccount.details_submitted && stripeAccount.charges_enabled && (
                  <div className="vi-success">
                    <CheckCircle2 size={12} />
                    <span>Ready to accept payments with platform fee split.</span>
                  </div>
                )}

                {/* Platform Fee Slider */}
                <div className="vi-fee">
                  <div className="vi-fee-label">
                    <span>Platform fee</span>
                    <strong>{(feeBps / 100).toFixed(2)}%</strong>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="3000"
                    step="25"
                    value={feeBps}
                    onChange={e => setFeeBps(parseInt(e.target.value))}
                    className="vi-fee-slider"
                  />
                  <div className="vi-fee-range">
                    <span>0%</span>
                    <span>30%</span>
                  </div>
                  {feeBps !== stripeAccount.application_fee_bps && (
                    <Button variant="primary" size="sm" onClick={saveFee}>Save fee change</Button>
                  )}
                </div>

                <div className="vi-actions">
                  {!stripeAccount.details_submitted && (
                    <Button variant="primary" size="sm" icon={<ExternalLink size={12} />} onClick={openOnboarding}>
                      Continue onboarding
                    </Button>
                  )}
                  {stripeAccount.details_submitted && (
                    <Button variant="secondary" size="sm" icon={<ExternalLink size={12} />} onClick={openDashboard}>
                      Stripe dashboard
                    </Button>
                  )}
                  <Button variant="ghost" size="sm" icon={<RefreshCw size={12} />} onClick={refreshStatus}>
                    Refresh
                  </Button>
                </div>
              </>
            )}
          </GlassCard>
        </motion.div>

        {/* ── Placeholders for future integrations ── */}
        <motion.div variants={fadeInUp} initial="hidden" animate="show">
          <GlassCard className="vi-card">
            <div className="vi-card-header">
              <div className="vi-card-icon" style={{ color: '#00F5FF' }}><Banknote size={18} /></div>
              <div className="vi-card-title">
                <h3>Plaid (ACH)</h3>
                <p>Bank linking, ACH debits/credits, credit-line rails</p>
              </div>
              <Badge size="sm">{plaidItems.length} linked</Badge>
            </div>

            {loadingPlaid && plaidItems.length === 0 && (
              <div className="vi-loading">Loading linked accounts…</div>
            )}

            {plaidItems.length === 0 && !loadingPlaid && (
              <div className="vi-empty">
                <p>No bank accounts linked for this venture yet.</p>
                <PlaidLinkButton ventureId={ventureId} onLinked={() => void loadPlaid()} size="sm" />
              </div>
            )}

            {plaidItems.length > 0 && (
              <>
                <div className="vi-plaid-list">
                  {plaidItems.map((item) => (
                    <div key={item.id} className="vi-plaid-item">
                      <div className="vi-plaid-item-head">
                        <strong>{item.institution_name || 'Unknown bank'}</strong>
                        <Badge size="sm">{item.status}</Badge>
                      </div>
                      <div className="vi-plaid-accounts">
                        {item.accounts.slice(0, 3).map((acct, i) => (
                          <span key={i} className="vi-plaid-acct">
                            {acct.name || 'Account'} {acct.mask ? `··${acct.mask}` : ''}
                          </span>
                        ))}
                        {item.accounts.length > 3 && <span className="vi-plaid-acct">+{item.accounts.length - 3} more</span>}
                      </div>
                      <div className="vi-plaid-item-actions">
                        <button
                          className="vi-plaid-unlink"
                          onClick={() => removePlaidItem(item.id)}
                          aria-label="Unlink"
                        >Unlink</button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="vi-actions">
                  <PlaidLinkButton
                    ventureId={ventureId}
                    variant="secondary"
                    size="sm"
                    label="Link another bank"
                    onLinked={() => void loadPlaid()}
                  />
                </div>
              </>
            )}

            {plaidTransfers.length > 0 && (
              <div className="vi-plaid-transfers">
                <div className="vi-plaid-transfers-head">Recent transfers</div>
                {plaidTransfers.slice(0, 5).map((t) => (
                  <div key={t.id} className="vi-plaid-transfer">
                    <span className={`vi-plaid-transfer-type vi-plaid-transfer-${t.type}`}>{t.type === 'debit' ? '↓' : '↑'}</span>
                    <span className="vi-plaid-transfer-amount">${(t.amount_cents / 100).toFixed(2)}</span>
                    <Badge size="sm">{t.status}</Badge>
                    <span className="vi-plaid-transfer-date">{t.created_at.slice(0, 10)}</span>
                  </div>
                ))}
              </div>
            )}
          </GlassCard>
        </motion.div>

        <motion.div variants={fadeInUp} initial="hidden" animate="show">
          <GlassCard className="vi-card vi-card-stub">
            <div className="vi-card-header">
              <div className="vi-card-icon" style={{ color: '#F38020' }}><Cloud size={18} /></div>
              <div className="vi-card-title">
                <h3>Cloudflare R2</h3>
                <p>Private storage bucket per venture</p>
              </div>
              <Badge size="sm">Ready (API)</Badge>
            </div>
            <div className="vi-stub-body">
              R2 binary upload + presigned URLs are wired at the API layer. UI for
              bucket assignment per venture is next.
            </div>
          </GlassCard>
        </motion.div>

        <motion.div variants={fadeInUp} initial="hidden" animate="show">
          <GlassCard className="vi-card vi-card-stub">
            <div className="vi-card-header">
              <div className="vi-card-icon" style={{ color: '#A259FF' }}><MessageSquare size={18} /></div>
              <div className="vi-card-title">
                <h3>Comms channels</h3>
                <p>Slack, Discord, Telegram, Twilio, Gmail per venture</p>
              </div>
              <Badge size="sm">Partial</Badge>
            </div>
            <div className="vi-stub-body">
              Global OAuth connections work via Settings → Integrations. Per-venture
              channel routing (e.g. FutureState alerts → specific Slack channel)
              is next.
            </div>
          </GlassCard>
        </motion.div>
      </GridLayout>

      {/* Core Triangle footer */}
      <div className="vi-core-status">
        <div className="vi-core-label">
          <Brain size={12} />
          <span>Core Triangle</span>
        </div>
        <CoreDot name="Identity" state={coreHealth.identity} />
        <CoreDot name="Fabric" state={coreHealth.fabric} />
        <CoreDot name="Intelligence" state={coreHealth.intelligence} />
        <span className="vi-core-meta">
          {coreHealth.checkedAt ? `last checked ${coreHealth.checkedAt.toLocaleTimeString()}` : 'checking…'}
        </span>
      </div>

      <style>{`
        .vi-grid { padding: 0 20px 20px; }

        .vi-card { padding: 16px; display: flex; flex-direction: column; gap: 12px; }
        .vi-card-header { display: flex; align-items: flex-start; gap: 12px; }
        .vi-card-icon { flex-shrink: 0; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; background: var(--bg-elevated); border-radius: var(--radius-md); }
        .vi-card-title { flex: 1; min-width: 0; }
        .vi-card-title h3 { font-size: 14px; font-weight: 600; margin: 0; color: var(--text-primary); }
        .vi-card-title p { font-size: 11px; color: var(--text-muted); margin: 2px 0 0; line-height: 1.3; }
        .vi-card-pills { display: flex; gap: 4px; flex-wrap: wrap; }

        .vi-loading { color: var(--text-muted); font-size: 11px; font-style: italic; padding: 16px 0; }
        .vi-empty { display: flex; flex-direction: column; gap: 10px; align-items: flex-start; padding: 12px 0; }
        .vi-empty p { font-size: 12px; color: var(--text-muted); margin: 0; }

        .vi-field { display: flex; justify-content: space-between; gap: 10px; font-size: 11px; padding: 4px 0; border-bottom: 1px dashed var(--border); }
        .vi-field-label { color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px; font-size: 10px; }
        .vi-field-value { font-family: var(--font-mono); color: var(--text-secondary); font-size: 10px; }
        code.vi-field-value { background: var(--bg-elevated); padding: 1px 6px; border-radius: 3px; }

        .vi-warning { display: flex; align-items: center; gap: 6px; padding: 8px 10px; font-size: 11px; color: var(--warning); background: rgba(245,158,11,0.08); border: 1px solid rgba(245,158,11,0.25); border-radius: var(--radius-sm); }
        .vi-success { display: flex; align-items: center; gap: 6px; padding: 8px 10px; font-size: 11px; color: var(--success); background: rgba(16,185,129,0.08); border: 1px solid rgba(16,185,129,0.25); border-radius: var(--radius-sm); }

        .vi-fee { display: flex; flex-direction: column; gap: 8px; padding: 10px; background: var(--bg-elevated); border-radius: var(--radius-sm); }
        .vi-fee-label { display: flex; justify-content: space-between; font-size: 11px; color: var(--text-muted); }
        .vi-fee-label strong { color: var(--cyan); font-family: var(--font-mono); font-size: 12px; }
        .vi-fee-slider { width: 100%; accent-color: var(--cyan); }
        .vi-fee-range { display: flex; justify-content: space-between; font-size: 9px; color: var(--text-muted); font-family: var(--font-mono); }

        .vi-actions { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 4px; }

        .vi-card-stub { opacity: 0.78; }
        .vi-stub-body { font-size: 11px; color: var(--text-muted); line-height: 1.5; }

        .vi-plaid-list { display: flex; flex-direction: column; gap: 8px; margin-top: 8px; }
        .vi-plaid-item { padding: 10px 12px; background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius-sm); display: flex; flex-direction: column; gap: 6px; }
        .vi-plaid-item-head { display: flex; align-items: center; justify-content: space-between; font-size: 12px; color: var(--text-primary); }
        .vi-plaid-accounts { display: flex; gap: 6px; flex-wrap: wrap; font-size: 10px; color: var(--text-muted); }
        .vi-plaid-acct { padding: 1px 6px; background: var(--bg-elevated); border-radius: var(--radius-sm); font-family: var(--font-mono); }
        .vi-plaid-item-actions { display: flex; justify-content: flex-end; }
        .vi-plaid-unlink { background: none; border: none; font-size: 10px; color: var(--text-muted); cursor: pointer; padding: 2px 6px; }
        .vi-plaid-unlink:hover { color: var(--error); }

        .vi-plaid-transfers { margin-top: 10px; padding-top: 10px; border-top: 1px dashed var(--border); display: flex; flex-direction: column; gap: 4px; }
        .vi-plaid-transfers-head { font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; color: var(--text-muted); }
        .vi-plaid-transfer { display: flex; align-items: center; gap: 8px; font-size: 11px; padding: 3px 0; }
        .vi-plaid-transfer-type { font-family: var(--font-mono); font-weight: 700; width: 12px; text-align: center; }
        .vi-plaid-transfer-debit { color: var(--error); }
        .vi-plaid-transfer-credit { color: var(--success); }
        .vi-plaid-transfer-amount { font-family: var(--font-mono); font-weight: 600; }
        .vi-plaid-transfer-date { margin-left: auto; font-size: 10px; color: var(--text-muted); font-family: var(--font-mono); }

        .vi-core-status { display: flex; align-items: center; gap: 16px; padding: 10px 20px; border-top: 1px solid var(--border); background: var(--bg-surface); font-size: 11px; color: var(--text-muted); }
        .vi-core-label { display: flex; align-items: center; gap: 6px; text-transform: uppercase; letter-spacing: 0.5px; font-size: 10px; font-weight: 600; }
        .vi-core-meta { margin-left: auto; font-size: 10px; font-style: italic; }
      `}</style>
    </PageShell>
  );
}

function CoreDot({ name, state }: { name: string; state: 'online' | 'offline' | 'unknown' }) {
  const color = state === 'online' ? 'var(--success)' : state === 'offline' ? 'var(--error)' : 'var(--text-muted)';
  const icon = state === 'online' ? <CheckCircle2 size={10} /> : state === 'offline' ? <Ban size={10} /> : <DollarSign size={10} />;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: color, display: 'inline-block' }} />
      <span style={{ fontSize: 10 }}>{name}</span>
      <span style={{ opacity: 0.6 }}>{icon}</span>
    </span>
  );
}

// keep unused imports silenced for future panels
void Building2;
