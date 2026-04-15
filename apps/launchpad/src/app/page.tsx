import Link from 'next/link';
import { getCapitalEngine } from '../lib/capital';
import { RoundCard } from '../components/RoundCard';

export const revalidate = 60; // ISR: rebuild every 60s

export default async function Home() {
  const engine = getCapitalEngine();
  const rounds = await engine.rounds.listPublicRounds({ limit: 24 }).catch(() => []);

  const featured = rounds.filter((r) => r.featuredOrder != null).sort((a, b) => (a.featuredOrder ?? 999) - (b.featuredOrder ?? 999));
  const active = rounds.filter((r) => r.featuredOrder == null);

  return (
    <div>
      <section className="lp-hero">
        <div className="lp-container">
          <h1>The open protocol for capital formation.</h1>
          <p>
            Raise equity, tokens, or hybrid instruments on a standard anyone can build against.
            No transfer agents. No gatekeepers. Regulated, programmable, instant.
          </p>
          <div className="lp-hero-cta">
            <Link href="/build" className="lp-btn lp-btn-primary">Launch your raise</Link>
            <Link href="/protocol" className="lp-btn lp-btn-ghost">Read the protocol</Link>
          </div>
        </div>
      </section>

      <div className="lp-container">
        {featured.length > 0 && (
          <>
            <h2 className="lp-section-title">Featured Raises</h2>
            <div className="lp-grid">
              {featured.map((r) => <RoundCard key={r.id} round={r} />)}
            </div>
          </>
        )}

        <h2 className="lp-section-title">Active Raises ({active.length})</h2>
        {active.length === 0 && featured.length === 0 ? (
          <div className="lp-empty">
            <p>No public raises are currently live.</p>
            <p>Check back soon, or <Link href="/build">launch your own</Link>.</p>
          </div>
        ) : (
          <div className="lp-grid">
            {active.map((r) => <RoundCard key={r.id} round={r} />)}
          </div>
        )}
      </div>

      <footer className="lp-footer">
        <div className="lp-container">
          <p>
            MCV Capital Launchpad · reference implementation of <a href="/protocol">MCP-Capital v0.1</a>
          </p>
          <p>
            <a href="https://mcv.one">MCV One</a>
            <a href="/protocol">Protocol</a>
            <a href="/consortium">Consortium</a>
            <a href="/docs">Docs</a>
          </p>
        </div>
      </footer>
    </div>
  );
}
