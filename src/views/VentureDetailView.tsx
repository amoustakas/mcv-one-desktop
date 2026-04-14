import { useState, Suspense, lazy } from 'react';
import { Tabs, PageShell, EmptyState } from '../components/ui';
import { type Venture } from '../lib/ventures';
import VentureQuestPanel from '../components/ventures/VentureQuestPanel';
import AssetTierGraph from '../components/ventures/AssetTierGraph';
import ClerkOrgPanel from '../components/ventures/ClerkOrgPanel';
import VentureDomainsPanel from '../components/ventures/VentureDomainsPanel';
import VentureSocialsPanel from '../components/ventures/VentureSocialsPanel';
import VentureDocsPanel from '../components/ventures/VentureDocsPanel';
import VentureOpsPanel from '../components/ventures/VentureOpsPanel';
import VentureSettingsPanel from '../components/ventures/VentureSettingsPanel';
import { Settings as SettingsIcon } from 'lucide-react';

const VentureProfile = lazy(() => import('./VentureProfile'));

type TabId = 'overview' | 'quests' | 'assets' | 'domains' | 'socials' | 'team' | 'docs' | 'ops' | 'settings';

interface TabDef {
  id: TabId;
  label: string;
}

const TABS: TabDef[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'quests', label: 'Quests' },
  { id: 'assets', label: 'Assets' },
  { id: 'domains', label: 'Domains' },
  { id: 'socials', label: 'Socials' },
  { id: 'team', label: 'Team' },
  { id: 'docs', label: 'Docs' },
  { id: 'ops', label: 'Ops' },
  { id: 'settings', label: 'Settings' },
];

export default function VentureDetailView({ venture }: { venture: Venture }) {
  const [tab, setTab] = useState<TabId>('overview');

  return (
    <div className="vdv-root">
      <Tabs
        tabs={TABS.map(t => ({ id: t.id, label: t.label }))}
        active={tab}
        onChange={(id) => setTab(id as TabId)}
        className="vdv-tabs"
      />

      <div className="vdv-body">
        {tab === 'overview' && (
          <Suspense fallback={<div className="vdv-loading">Loading overview…</div>}>
            <VentureProfile venture={venture} />
          </Suspense>
        )}

        {tab === 'quests' && (
          <PageShell>
            <VentureQuestPanel venture={venture} />
          </PageShell>
        )}

        {tab === 'assets' && (
          <PageShell>
            <AssetTierGraph venture={venture} />
          </PageShell>
        )}

        {tab === 'domains' && (
          <PageShell>
            <VentureDomainsPanel venture={venture} />
          </PageShell>
        )}

        {tab === 'socials' && (
          <PageShell>
            <VentureSocialsPanel venture={venture} />
          </PageShell>
        )}

        {tab === 'team' && (
          <PageShell>
            <ClerkOrgPanel venture={venture} />
          </PageShell>
        )}

        {tab === 'docs' && (
          <PageShell>
            <VentureDocsPanel venture={venture} />
          </PageShell>
        )}

        {tab === 'ops' && (
          <PageShell>
            <VentureOpsPanel venture={venture} />
          </PageShell>
        )}

        {tab === 'settings' && (
          <PageShell>
            <VentureSettingsPanel venture={venture} />
          </PageShell>
        )}
      </div>

      <style>{`
        .vdv-root { display: flex; flex-direction: column; height: 100%; }
        .vdv-tabs { flex-shrink: 0; border-bottom: 1px solid var(--border); padding: 0 24px; }
        .vdv-body { flex: 1; overflow-y: auto; }
        .vdv-loading { padding: 48px; text-align: center; color: var(--text-muted); font-size: 13px; }
      `}</style>
    </div>
  );
}
