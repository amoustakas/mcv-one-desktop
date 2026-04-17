import type { ReactNode } from 'react';
import type { SuiteId } from '../../lib/pinned-kpi/types';
import { PinnedKpiStrip } from '../pinned-kpi';
import { PageShell, PageHeader } from '../ui';

interface SuiteShellProps {
  suite: SuiteId;
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  ventureId?: string | null;
  lens?: string[];
  headerActions?: ReactNode;
  loading?: boolean;
  onRefresh?: () => void;
  children: ReactNode;
}

/**
 * Consistent per-suite wrapper — composes PageShell + PageHeader + PinnedKpiStrip.
 * No logic: each suite view gets the same header shape and the user-customizable
 * KPI strip without per-view duplication. Passes through PageHeader's
 * icon/loading/onRefresh affordances so wrapped views don't lose features.
 */
export function SuiteShell({
  suite,
  title,
  subtitle,
  icon,
  ventureId,
  lens,
  headerActions,
  loading,
  onRefresh,
  children,
}: SuiteShellProps) {
  return (
    <PageShell>
      <PageHeader
        title={title}
        subtitle={subtitle}
        icon={icon}
        loading={loading}
        onRefresh={onRefresh}
      >
        {headerActions}
      </PageHeader>
      <PinnedKpiStrip suite={suite} ventureId={ventureId} lens={lens} />
      {children}
    </PageShell>
  );
}
