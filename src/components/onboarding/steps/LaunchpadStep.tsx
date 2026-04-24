// src/components/onboarding/steps/LaunchpadStep.tsx
//
// Step 4 of the Onboarding wizard — the unlock screen. Shown once the user
// has signed all required documents and access_grants have been materialized.
//
// Renders one card per unlocked access level grouped by venture.
//
// Session 5: the Launch button no longer emits a static href. It calls
// /api/launchpad { action: 'issue-token', venture_id } to mint a 15-minute
// HS256 JWT, then opens the venture URL with ?access_token=JWT appended.
// The destination venture verifies the token server-side using the same
// AGENT_SIGNING_KEY — no database round-trip needed on the receiving end.

import { useCallback, useState } from 'react';
import { useAuth } from '@clerk/clerk-react';
import type { OnboardingGate, AccessGrant } from '../../../hooks/use-onboarding-gate';

interface LaunchpadStepProps {
  gate: OnboardingGate;
  onReturnToApp?: () => void;
}

export default function LaunchpadStep({ gate, onReturnToApp }: LaunchpadStepProps) {
  const { accessGrants, invite } = gate;

  if (accessGrants.length === 0) {
    return (
      <div className="mcv-onb-card">
        <h2 className="mcv-onb-card-title">Finalizing your access…</h2>
        <p className="mcv-onb-card-sub" style={{ marginTop: 8 }}>
          Your documents are signed. We are materializing the venture access grants — this
          usually takes a few seconds. If this persists for more than a minute, return to
          the documents step and click <em>Check status</em> to force a reconcile.
        </p>
      </div>
    );
  }

  // Group grants by venture so we render one venture card per distinct target.
  const byVenture = new Map<string, AccessGrant[]>();
  for (const g of accessGrants) {
    const key = g.venture_id ?? '__ecosystem__';
    const arr = byVenture.get(key) ?? [];
    arr.push(g);
    byVenture.set(key, arr);
  }

  return (
    <>
      <div className="mcv-onb-card" style={{ background: 'linear-gradient(135deg, rgba(0,245,255,0.08), rgba(139,92,246,0.06))', borderColor: 'rgba(0,245,255,0.3)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 8 }}>
          <SovereignGlyph />
          <div>
            <h2 className="mcv-onb-card-title" style={{ fontSize: 20, marginBottom: 4 }}>
              You are cleared.
            </h2>
            <p className="mcv-onb-card-sub" style={{ margin: 0 }}>
              Your MCV ID is active, your documents are on file, and the venture surfaces below are
              yours to explore.
            </p>
          </div>
        </div>
      </div>

      <div className="mcv-onb-launch-grid">
        {Array.from(byVenture.entries()).map(([ventureKey, grants]) => (
          <VentureCard
            key={ventureKey}
            ventureKey={ventureKey}
            grants={grants}
            invitedVenture={invite?.target_venture_id ?? null}
          />
        ))}
      </div>

      {onReturnToApp && (
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button type="button" className="mcv-onb-cta mcv-onb-cta-ghost" onClick={onReturnToApp}>
            Return to MCV One
          </button>
        </div>
      )}

      <LaunchpadStepStyles />
    </>
  );
}

function VentureCard({
  ventureKey,
  grants,
  invitedVenture,
}: {
  ventureKey: string;
  grants: AccessGrant[];
  invitedVenture: string | null;
}) {
  const meta = ventureMeta(ventureKey);
  const isPrimary = invitedVenture === ventureKey;
  const { getToken } = useAuth();
  const [minting, setMinting] = useState(false);
  const [mintError, setMintError] = useState<string | null>(null);

  // Only mint tokens for first-party ventures whose access-token flow is
  // actually implemented on the receiving end. The ecosystem-wide "MCV One"
  // grant re-enters the current app, so no token needed. Unknown ventures
  // likewise skip signing — they'll just open the placeholder URL.
  const needsToken = Boolean(meta.launchUrl && ventureKey !== '__ecosystem__' && ventureKey !== 'arqlabs');

  const launch = useCallback(async () => {
    if (!meta.launchUrl) return;
    if (!needsToken) {
      window.open(meta.launchUrl, '_blank', 'noopener,noreferrer');
      return;
    }
    setMinting(true);
    setMintError(null);
    try {
      const bearer = await getToken();
      const res = await fetch('/api/launchpad', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(bearer ? { Authorization: `Bearer ${bearer}` } : {}),
        },
        body: JSON.stringify({ action: 'issue-token', venture_id: ventureKey }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error ?? `issue-token failed (${res.status})`);
      }
      const body = (await res.json()) as { token: string; expiresAt: string };
      // Append the token as ?access_token= — the target venture's ingress
      // route verifies the signature, then sets its own session cookie.
      const sep = meta.launchUrl.includes('?') ? '&' : '?';
      const url = `${meta.launchUrl}${sep}access_token=${encodeURIComponent(body.token)}`;
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch (err) {
      setMintError(err instanceof Error ? err.message : String(err));
    } finally {
      setMinting(false);
    }
  }, [meta.launchUrl, needsToken, ventureKey, getToken]);

  return (
    <div className={['mcv-onb-launch-card', isPrimary ? 'is-primary' : ''].filter(Boolean).join(' ')}>
      <div className="mcv-onb-launch-card-header">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 2, color: isPrimary ? 'var(--cyan)' : 'var(--text-muted)' }}>
            {isPrimary ? 'Primary venture' : 'Unlocked'}
          </span>
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>{meta.name}</h3>
        </div>
        <div className="mcv-onb-launch-card-badge">
          {grants.length} {grants.length === 1 ? 'grant' : 'grants'}
        </div>
      </div>

      <p className="mcv-onb-card-sub" style={{ margin: '8px 0 14px' }}>
        {meta.tagline}
      </p>

      <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {grants.map((g) => (
          <li key={g.id} style={accessLevelPillStyle}>{g.access_level}</li>
        ))}
      </ul>

      {mintError && (
        <div style={{ marginTop: 10, fontSize: 11, color: 'var(--error)', paddingLeft: 8, borderLeft: '2px solid var(--error)' }}>
          {mintError}
        </div>
      )}

      {meta.launchUrl && (
        <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end' }}>
          <button
            type="button"
            className="mcv-onb-cta"
            onClick={launch}
            disabled={minting}
          >
            {minting ? 'Minting access token…' : `Launch ${meta.shortName}`}
            {!minting && <span aria-hidden>↗</span>}
          </button>
        </div>
      )}
    </div>
  );
}

interface VentureMeta {
  name: string;
  shortName: string;
  tagline: string;
  launchUrl: string | null;
}

function ventureMeta(key: string): VentureMeta {
  switch (key) {
    case 'futurestate':
      return {
        name: 'Futurestate',
        shortName: 'Futurestate',
        tagline: 'Real-world-asset investor dashboard. Browse active rounds, review diligence packets, and place allocations.',
        launchUrl: '/futurestate',
      };
    case 'betedge':
      return {
        name: 'BetEdge AI',
        shortName: 'BetEdge',
        tagline: 'Sports betting edge intelligence. Live models, EV scan, and portfolio tracking.',
        launchUrl: '/betedge',
      };
    case 'warforge':
      return {
        name: 'WarForge',
        shortName: 'WarForge',
        tagline: 'MMORPG sovereign universe. Faction portal, campaign ledger, and treasury view.',
        launchUrl: '/warforge',
      };
    case 'mcvgg':
      return {
        name: 'MCV Studios',
        shortName: 'MCV.gg',
        tagline: 'Creator economy hub. Licensing shelves, royalty graphs, and escrow pipelines.',
        launchUrl: '/mcvgg',
      };
    case 'edgeiq':
      return {
        name: 'EdgeIQ Markets',
        shortName: 'EdgeIQ',
        tagline: 'Cross-asset quantitative signals. Analytics workbench and strategy explorer.',
        launchUrl: '/edgeiq',
      };
    case 'arqlabs':
      return {
        name: 'ARQ Labs',
        shortName: 'ARQ Labs',
        tagline: 'R&D pipeline. Internal experiments graduating into ventures.',
        launchUrl: null,
      };
    case '__ecosystem__':
      return {
        name: 'MCV Ecosystem',
        shortName: 'MCV One',
        tagline: 'Cross-venture access to the MCV platform surfaces — command center, intelligence, and ops.',
        launchUrl: '/',
      };
    default:
      return {
        name: key,
        shortName: key,
        tagline: 'Access granted. Reach out to Tony for an orientation to this venture surface.',
        launchUrl: null,
      };
  }
}

function SovereignGlyph() {
  return (
    <svg viewBox="0 0 32 32" width="36" height="36" fill="none" stroke="url(#sov-g)" strokeWidth="1.6">
      <defs>
        <linearGradient id="sov-g" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#00f5ff" />
          <stop offset="1" stopColor="#8b5cf6" />
        </linearGradient>
      </defs>
      <polygon points="16,3 29,11 24,28 8,28 3,11" />
      <polygon points="16,10 22,13.5 20,22 12,22 10,13.5" />
      <circle cx="16" cy="16.5" r="1.5" fill="url(#sov-g)" />
    </svg>
  );
}

const accessLevelPillStyle: React.CSSProperties = {
  padding: '3px 9px',
  borderRadius: 999,
  border: '1px solid rgba(139, 92, 246, 0.35)',
  background: 'rgba(139, 92, 246, 0.08)',
  color: 'var(--purple, #8b5cf6)',
  fontSize: 10,
  fontFamily: 'var(--font-mono, ui-monospace, monospace)',
  letterSpacing: 0.5,
};

function LaunchpadStepStyles() {
  return (
    <style>{`
      .mcv-onb-launch-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
        gap: 16px;
      }
      .mcv-onb-launch-card {
        background: rgba(11, 18, 28, 0.72);
        border: 1px solid var(--border, rgba(255,255,255,0.08));
        border-radius: 14px;
        padding: 20px;
        transition: transform 180ms ease, border-color 180ms ease, box-shadow 180ms ease;
      }
      .mcv-onb-launch-card:hover {
        transform: translateY(-2px);
        border-color: rgba(0, 245, 255, 0.3);
      }
      .mcv-onb-launch-card.is-primary {
        border-color: rgba(0, 245, 255, 0.5);
        box-shadow: 0 16px 40px -20px rgba(0, 245, 255, 0.4);
      }
      .mcv-onb-launch-card-header {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 12px;
      }
      .mcv-onb-launch-card-badge {
        font-size: 10px;
        text-transform: uppercase;
        letter-spacing: 1.5px;
        color: var(--text-muted, #6b7a8c);
        padding: 3px 8px;
        border-radius: 6px;
        background: rgba(255, 255, 255, 0.04);
      }
    `}</style>
  );
}
