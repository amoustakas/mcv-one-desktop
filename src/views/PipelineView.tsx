import { Cpu } from 'lucide-react';
import { PageShell, PageHeader, EmptyState } from '../components/ui';

export default function PipelineView() {
  return (
    <PageShell scroll>
      <PageHeader icon={<Cpu size={20} />} title="Pipeline" />
      <EmptyState
        icon={<Cpu size={32} />}
        title="Live Pipeline Monitor"
        description="Real-time view of all local CLI terminals, Docker containers, GitHub Actions, and active sessions. Coming in Phase 2."
      />
    </PageShell>
  );
}
