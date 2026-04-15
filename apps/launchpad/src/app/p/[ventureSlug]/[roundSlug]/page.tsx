import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { getCapitalEngine } from '../../../../lib/capital';

export const revalidate = 60;

type Params = { ventureSlug: string; roundSlug: string };

async function loadRoundAndContent(params: Params) {
  const engine = getCapitalEngine();
  const round = await engine.rounds.getRoundBySlug(params.ventureSlug, params.roundSlug);
  if (!round || !round.isPublic || (round.status !== 'open' && round.status !== 'closing')) return null;

  const [description, updates] = await Promise.all([
    engine.content.getRoundDescription(round.id).catch(() => null),
    engine.content.listRoundUpdates(round.id, { limit: 10 }).catch(() => []),
  ]);

  const publicUpdates = updates.filter((u) => u.content.visibility === 'public' || u.content.visibility === 'published');
  return { round, description, publicUpdates };
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const resolved = await params;
  const data = await loadRoundAndContent(resolved);
  if (!data) return { title: 'Raise not found' };
  const { round, description } = data;
  const seoTitle = (description?.seo as { title?: string })?.title ?? round.name;
  const seoDesc = description?.excerpt
    ?? (description?.seo as { description?: string })?.description
    ?? round.description
    ?? `Raising ${round.targetRaise.toLocaleString('en-US', { style: 'currency', currency: round.currency })}`;
  return {
    title: `${seoTitle} · MCV Capital`,
    description: seoDesc,
    openGraph: {
      title: seoTitle,
      description: seoDesc,
      url: `https://launchpad.mcv.one/p/${resolved.ventureSlug}/${resolved.roundSlug}`,
      type: 'website',
    },
  };
}

function usd(value: number, currency = 'USD') {
  return value.toLocaleString('en-US', { style: 'currency', currency, maximumFractionDigits: 0 });
}

// Minimal markdown → React renderer. Handles #/##/### headings, - lists, paragraphs.
// React auto-escapes all text, so no XSS surface.
function renderMarkdown(md: string): ReactNode {
  const lines = md.split(/\r?\n/);
  const blocks: ReactNode[] = [];
  let listBuf: string[] = [];
  let key = 0;

  const flushList = () => {
    if (listBuf.length) {
      blocks.push(<ul key={key++} style={{ paddingLeft: 24, marginBottom: 16 }}>{listBuf.map((li, i) => <li key={i}>{li}</li>)}</ul>);
      listBuf = [];
    }
  };

  for (const raw of lines) {
    const t = raw.trim();
    if (!t) { flushList(); continue; }
    if (t.startsWith('### ')) { flushList(); blocks.push(<h3 key={key++} style={{ marginTop: 24, marginBottom: 8 }}>{t.slice(4)}</h3>); continue; }
    if (t.startsWith('## ')) { flushList(); blocks.push(<h2 key={key++} style={{ marginTop: 32, marginBottom: 12, fontSize: 24 }}>{t.slice(3)}</h2>); continue; }
    if (t.startsWith('# ')) { flushList(); blocks.push(<h1 key={key++} style={{ marginTop: 40, marginBottom: 16, fontSize: 32 }}>{t.slice(2)}</h1>); continue; }
    if (t.startsWith('- ') || t.startsWith('* ')) { listBuf.push(t.slice(2)); continue; }
    flushList();
    blocks.push(<p key={key++} style={{ marginBottom: 12 }}>{t}</p>);
  }
  flushList();
  return blocks;
}

export default async function RoundPage({ params }: { params: Promise<Params> }) {
  const resolved = await params;
  const data = await loadRoundAndContent(resolved);
  if (!data) notFound();
  const { round, description, publicUpdates } = data;

  const progress = round.targetRaise > 0 ? Math.min(100, (round.totalCommitted / round.targetRaise) * 100) : 0;

  return (
    <div className="lp-container" style={{ padding: '48px 24px', maxWidth: 960 }}>
      <div style={{ color: 'var(--text-muted)', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>
        {round.ventureId}
      </div>
      <h1 style={{ fontSize: 48, margin: '0 0 16px', lineHeight: 1.1 }}>{round.name}</h1>

      <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
        <span className={`lp-badge lp-badge-${round.raiseLane}`}>{round.raiseLane}</span>
        <span className="lp-badge lp-badge-open">{round.status}</span>
        {round.regulatoryFramework && (
          <span className="lp-badge" style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)' }}>
            {round.regulatoryFramework.toUpperCase()}
          </span>
        )}
        {round.accreditedOnly && (
          <span className="lp-badge" style={{ background: 'rgba(245,158,11,0.15)', color: 'var(--amber)' }}>
            Accredited only
          </span>
        )}
      </div>

      {round.description && <p style={{ fontSize: 18, color: 'var(--text-muted)', marginBottom: 32 }}>{round.description}</p>}

      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 12, padding: 24, marginBottom: 32 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 }}>
          <div>
            <div style={{ fontSize: 36, fontWeight: 700 }}>{usd(round.totalCommitted, round.currency)}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>committed of {usd(round.targetRaise, round.currency)}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 36, fontWeight: 700 }}>{round.totalInvestors}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>investors</div>
          </div>
        </div>
        <div className="lp-progress-track"><div className="lp-progress-fill" style={{ width: `${progress}%` }} /></div>
        <div className="lp-progress-label"><span>{progress.toFixed(0)}% complete</span><span>{usd(round.allocationRemaining ?? 0, round.currency)} remaining</span></div>
      </div>

      {description?.bodyMarkdown && (
        <section style={{ marginBottom: 48 }}>
          <article style={{ fontSize: 16, lineHeight: 1.7 }}>
            {renderMarkdown(description.bodyMarkdown)}
          </article>
        </section>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 32 }}>
        <div>
          <h3 style={{ fontSize: 14, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>Terms</h3>
          <Detail label="Type" value={`${round.roundType} · ${round.raiseLane}`} />
          <Detail label="Currency" value={round.currency} />
          {round.minimumCheck > 0 && <Detail label="Min check" value={usd(round.minimumCheck, round.currency)} />}
          {round.maximumCheck && <Detail label="Max check" value={usd(round.maximumCheck, round.currency)} />}
          {round.preMoneyValuation && <Detail label="Pre-money" value={usd(round.preMoneyValuation, round.currency)} />}
          {round.valuationCap && <Detail label="Cap" value={usd(round.valuationCap, round.currency)} />}
          {round.discountRate !== null && round.discountRate !== undefined && <Detail label="Discount" value={`${round.discountRate}%`} />}
        </div>
        <div>
          <h3 style={{ fontSize: 14, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>Timeline</h3>
          {round.openDate && <Detail label="Open" value={new Date(round.openDate).toLocaleDateString()} />}
          {round.closeDate && <Detail label="Close" value={new Date(round.closeDate).toLocaleDateString()} />}
          {round.fundingDeadline && <Detail label="Deadline" value={new Date(round.fundingDeadline).toLocaleDateString()} />}
          {round.jurisdictionRestrictions.length > 0 && (
            <Detail label="Restricted" value={round.jurisdictionRestrictions.join(', ')} />
          )}
        </div>
      </div>

      {publicUpdates.length > 0 && (
        <section style={{ marginBottom: 48 }}>
          <h3 style={{ fontSize: 14, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 16 }}>
            Recent Updates
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {publicUpdates.map((u) => (
              <div key={u.contentId} style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 8, padding: 16 }}>
                <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>{u.content.title}</div>
                {u.content.excerpt && <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 8 }}>{u.content.excerpt}</div>}
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                  {u.content.publishedAt ? new Date(u.content.publishedAt).toLocaleDateString() : 'draft'}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <div style={{ textAlign: 'center', padding: '32px 0' }}>
        <a
          href={`https://invest.mcv.one/capital/${round.ventureId}/${round.slug}`}
          className="lp-btn lp-btn-primary"
          style={{ fontSize: 16, padding: '16px 48px' }}
        >
          Commit to this raise
        </a>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 12 }}>
          Routes to the MCV Capital investor portal. Accredited-investor verification handled automatically.
        </div>
      </div>

      <div style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'center', padding: '32px 0 16px', borderTop: '1px solid var(--border-subtle)' }}>
        Raise published via <a href="/protocol">MCP-Capital v0.1</a> · Embed: <a href={`/widget/${resolved.ventureSlug}/${resolved.roundSlug}`}>iframe widget</a>
      </div>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 13, borderBottom: '1px dotted var(--border-subtle)' }}>
      <span style={{ color: 'var(--text-muted)' }}>{label}</span>
      <span>{value}</span>
    </div>
  );
}
