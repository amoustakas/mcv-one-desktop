import { useState, useEffect, Suspense, lazy } from 'react';
import { Tabs, PageShell, EmptyState } from '../components/ui';
import { type Venture } from '../lib/ventures';
import { useNavigation } from '../stores/navigation';
import VentureQuestPanel from '../components/ventures/VentureQuestPanel';
import AssetTierGraph from '../components/ventures/AssetTierGraph';
import ClerkOrgPanel from '../components/ventures/ClerkOrgPanel';
import VentureDomainsPanel from '../components/ventures/VentureDomainsPanel';
import VentureSocialsPanel from '../components/ventures/VentureSocialsPanel';
import VentureDocsPanel from '../components/ventures/VentureDocsPanel';
import VentureOpsPanel from '../components/ventures/VentureOpsPanel';
import VentureSettingsPanel from '../components/ventures/VentureSettingsPanel';
import VentureSnapshotCard from '../components/ventures/VentureSnapshotCard';
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

const VALID_TABS = new Set<TabId>(['overview', 'quests', 'assets', 'domains', 'socials', 'team', 'docs', 'ops', 'settings']);

export default function VentureDetailView({ venture }: { venture: Venture }) {
  const [tab, setTab] = useState<TabId>('overview');
  const consumePendingDetailTab = useNavigation(s => s.consumePendingDetailTab);

  // Honor a one-shot tab request from any caller (e.g. the Venture Wizard hint
  // "Open Docs tab"). We consume-and-clear so navigating away + back doesn't
  // keep yanking the user to the same tab.
  useEffect(() => {
    const pending = consumePendingDetailTab();
    if (pending && VALID_TABS.has(pending as TabId)) {
      setTab(pending as TabId);
    }
  }, [consumePendingDetailTab]);

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
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <VentureSnapshotCard venture={venture} />
              <VentureProfile venture={venture} />
            </div>
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
