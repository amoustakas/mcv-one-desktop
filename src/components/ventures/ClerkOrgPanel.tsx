import { useState } from 'react';
import { Building2, Shield, Sparkles, Users, AlertCircle, Check } from 'lucide-react';
import { GlassCard, Button, Badge, EmptyState } from '../ui';
import { useOrganization, useOrganizationList, OrganizationSwitcher, OrganizationProfile } from '../../lib/auth';
import { apiPost } from '../../lib/api/client';
import type { Venture } from '../../lib/ventures';

// MCV-themed appearance for Clerk prebuilts
const MCV_APPEARANCE = {
  variables: {
    colorPrimary: '#00F0FF',
    colorBackground: '#0F1629',
    colorInputBackground: '#0A1020',
    colorText: '#E8F0FE',
    colorTextSecondary: '#8899AA',
    colorDanger: '#EF4444',
    borderRadius: '10px',
    fontFamily: 'Inter, system-ui, sans-serif',
  },
  elements: {
    card: { background: 'var(--bg-card)', border: '1px solid var(--border)' },
    formButtonPrimary: { background: 'var(--cyan)', color: 'var(--bg-deep)' },
    organizationPreviewMainIdentifier: { color: 'var(--text-primary)' },
  },
};

export default function ClerkOrgPanel({ venture, onUpdated }: { venture: Venture; onUpdated?: (v: Venture) => void }) {
  const [provisioning, setProvisioning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { organization: activeOrg } = useOrganization();
  const { userMemberships } = useOrganizationList({ userMemberships: true });

  const hasOrg = !!venture.clerkOrgId;
  const thisVentureOrg = userMemberships?.data?.find(m => m.organization.id === venture.clerkOrgId);

  async function promoteToTenant() {
    setProvisioning(true);
    setError(null);
    try {
      const result = await apiPost<{ venture: Venture; clerk_org_id: string }>('/api/ventures', {
        action: 'provision-org',
        venture_id: venture.id,
        mirror_members: true,
      });
      onUpdated?.(result.venture);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to provision organization');
    } finally {
      setProvisioning(false);
    }
  }

  if (!hasOrg) {
    return (
      <div className="cop-root">
        <GlassCard className="cop-card cop-promote">
          <div className="cop-promote-head">
            <Sparkles size={18} style={{ color: 'var(--cyan)' }} />
            <h3 className="cop-title">Promote {venture.name} to a dedicated tenant</h3>
          </div>
          <p className="cop-desc">
            Today {venture.name} lives under the root <strong>EdgeIQ Holdings</strong> organization with manual venture assignments.
            Promote it to a dedicated Clerk organization to unlock:
          </p>
          <ul className="cop-benefits">
            <li><Check size={12} /> Enterprise SSO / SAML / OIDC for external collaborators</li>
            <li><Check size={12} /> Verified custom domains (e.g. {venture.domain})</li>
            <li><Check size={12} /> Organization-scoped RLS — automatic tenant isolation</li>
            <li><Check size={12} /> Invitations, roles, and memberships UI</li>
            <li><Check size={12} /> White-label branding applied to Clerk auth screens</li>
          </ul>
          <div className="cop-caveat">
            <AlertCircle size={12} />
            <span>Existing members assigned to this venture will be mirrored into the new org.</span>
          </div>
          {error && <div className="cop-error">{error}</div>}
          <div className="cop-actions">
            <Button onClick={promoteToTenant} disabled={provisioning} size="sm" icon={<Building2 size={12} />}>
              {provisioning ? 'Provisioning…' : `Provision ${venture.name} as tenant`}
            </Button>
          </div>
        </GlassCard>

        <GlassCard className="cop-card">
          <h4 className="cop-subtitle">Current tenancy</h4>
          <div className="cop-status-row">
            <Badge color="#00F0FF" variant="outline">Root Org</Badge>
            <span className="cop-status-label">EdgeIQ Holdings</span>
            <span className="cop-status-muted">· shared with all ventures</span>
          </div>
        </GlassCard>

        {/* Inline style block scoped below */}
        <CopStyles />
      </div>
    );
  }

  // Has org — show the full Clerk surfaces
  return (
    <div className="cop-root">
      <GlassCard className="cop-card cop-active-head">
        <div className="cop-active-head-left">
          <Building2 size={18} style={{ color: 'var(--success)' }} />
          <div>
            <h3 className="cop-title">{venture.name}</h3>
            <div className="cop-active-meta">
              <Badge color="#10B981">Dedicated Tenant</Badge>
              <span className="cop-status-muted">org_id: {venture.clerkOrgId?.slice(0, 20)}…</span>
            </div>
          </div>
        </div>
        <div className="cop-switcher">
          <OrganizationSwitcher
            appearance={MCV_APPEARANCE}
            hidePersonal
            afterSelectOrganizationUrl={typeof window !== 'undefined' ? window.location.pathname : undefined}
          />
        </div>
      </GlassCard>

      {!thisVentureOrg && activeOrg?.id !== venture.clerkOrgId && (
        <GlassCard className="cop-card cop-hint">
          <AlertCircle size={14} style={{ color: 'var(--warning)' }} />
          <span>You're not active in this venture's organization. Use the switcher above to access member/role surfaces.</span>
        </GlassCard>
      )}

      {activeOrg?.id === venture.clerkOrgId && (
        <GlassCard className="cop-card cop-profile-card">
          <div className="cop-section-head">
            <Users size={14} />
            <h4 className="cop-subtitle">Members, roles, domains & SSO</h4>
          </div>
          <div className="cop-clerk-mount">
            <OrganizationProfile appearance={MCV_APPEARANCE} routing="hash" />
          </div>
        </GlassCard>
      )}

      <GlassCard className="cop-card">
        <div className="cop-section-head">
          <Shield size={14} />
          <h4 className="cop-subtitle">Tenancy isolation</h4>
        </div>
        <p className="cop-desc">
          All venture data (<code>ventures</code>, <code>venture_assets</code>, <code>venture_docs</code>) is now RLS-scoped to this org.
          Users outside <strong>{venture.name}</strong> can't read or write this venture's rows — enforced at the Postgres level.
        </p>
      </GlassCard>

      <CopStyles />
    </div>
  );
}

function CopStyles() {
  return (
    <style>{`
      .cop-root { display: flex; flex-direction: column; gap: 12px; }
      .cop-card { padding: 16px; }
      .cop-promote { background: linear-gradient(135deg, var(--cyan-glow), transparent 60%); border: 1px solid var(--border-active); }
      .cop-promote-head { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; }
      .cop-title { margin: 0; font-size: 14px; font-weight: 600; color: var(--text-primary); font-family: var(--font-display); }
      .cop-subtitle { margin: 0; font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; color: var(--text-muted); font-family: var(--font-display); }
      .cop-desc { font-size: 12px; color: var(--text-secondary); line-height: 1.6; margin: 0 0 10px; }
      .cop-desc code { font-family: var(--font-mono); font-size: 11px; padding: 1px 5px; background: var(--bg-input); border-radius: 4px; color: var(--cyan); }
      .cop-benefits { list-style: none; padding: 0; margin: 0 0 12px; display: flex; flex-direction: column; gap: 6px; }
      .cop-benefits li { display: flex; align-items: center; gap: 8px; font-size: 12px; color: var(--text-secondary); }
      .cop-benefits svg { color: var(--success); flex-shrink: 0; }
      .cop-caveat { display: flex; gap: 6px; align-items: center; font-size: 11px; color: var(--text-muted); padding: 8px 10px; background: var(--bg-input); border-radius: var(--radius-sm); margin-bottom: 12px; }
      .cop-caveat svg { color: var(--warning); flex-shrink: 0; }
      .cop-error { font-size: 12px; color: var(--error); padding: 8px 10px; background: rgba(239, 68, 68, 0.08); border: 1px solid rgba(239, 68, 68, 0.3); border-radius: var(--radius-sm); margin-bottom: 10px; }
      .cop-actions { display: flex; justify-content: flex-end; }
      .cop-status-row { display: flex; align-items: center; gap: 10px; font-size: 12px; }
      .cop-status-label { color: var(--text-primary); font-weight: 500; }
      .cop-status-muted { color: var(--text-muted); font-size: 11px; }
      .cop-active-head { display: flex; align-items: center; justify-content: space-between; gap: 16px; flex-wrap: wrap; }
      .cop-active-head-left { display: flex; align-items: center; gap: 12px; }
      .cop-active-meta { display: flex; align-items: center; gap: 10px; margin-top: 4px; font-family: var(--font-mono); font-size: 10px; }
      .cop-switcher { flex-shrink: 0; }
      .cop-hint { display: flex; align-items: center; gap: 10px; font-size: 12px; color: var(--text-secondary); }
      .cop-section-head { display: flex; align-items: center; gap: 8px; margin-bottom: 10px; color: var(--text-secondary); }
      .cop-profile-card { padding: 0; overflow: hidden; }
      .cop-profile-card .cop-section-head { padding: 14px 16px; margin-bottom: 0; border-bottom: 1px solid var(--border); }
      .cop-clerk-mount { padding: 16px; }
    `}</style>
  );
}
