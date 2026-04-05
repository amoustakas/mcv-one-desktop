import { Brain } from 'lucide-react';
import { PageShell, PageHeader, EmptyState } from '../components/ui';

export default function MemoryView() {
  return (
    <PageShell scroll>
      <PageHeader icon={<Brain size={20} />} title="Memory Hub" />
      <EmptyState
        icon={<Brain size={32} />}
        title="Sequential Memory System"
        description="Cross-session memory, context threading, and knowledge persistence. Coming in Phase 2."
      />
    </PageShell>
  );
}
