import { useState } from 'react';
import { ChevronDown, ChevronRight, Package, Database, FileUp, Brain } from 'lucide-react';

import { useKitStore } from '../../stores/kits';
import { useFileBridge } from '../../stores/file-bridge';
import { useTelemetry } from '../../stores/telemetry';

// ---------------------------------------------------------------------------
// StateInspector — collapsible JSON tree showing agent runtime state
// ---------------------------------------------------------------------------

interface SectionProps {
  title: string;
  icon: React.ReactNode;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

function InspectorSection({ title, icon, defaultOpen = false, children }: SectionProps) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="mcv-inspector-section">
      <div className="mcv-inspector-header" onClick={() => setOpen(!open)}>
        {open ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
        {icon}
        {title}
      </div>
      {open && <div className="mcv-inspector-body">{children}</div>}
    </div>
  );
}

function JsonView({ data }: { data: unknown }) {
  return (
    <pre className="mcv-inspector-json">
      {JSON.stringify(data, null, 2)}
    </pre>
  );
}

export default function StateInspector() {
  const loadedKits = useKitStore((s) => s.getLoadedKits());
  const uploadedFiles = useFileBridge((s) => s.uploadedFiles);
  const reasoningSteps = useTelemetry((s) => s.reasoningSteps);

  const kitsSummary = loadedKits.map((k) => ({
    id: k.manifest.id,
    name: k.manifest.name,
    version: k.manifest.version,
    status: k.status,
    tools: k.manifest.tools.map((t) => t.name),
    runtime: k.manifest.runtime,
  }));

  const filesSummary = uploadedFiles.map((f) => ({
    name: f.localName,
    mime: f.mimeType,
    state: f.state,
    uri: f.geminiFileUri || '(pending)',
  }));

  const recentSteps = reasoningSteps.slice(-20);

  return (
    <div className="mcv-state-inspector">
      <InspectorSection title={`Loaded Kits (${loadedKits.length})`} icon={<Package size={12} />} defaultOpen>
        <JsonView data={kitsSummary} />
      </InspectorSection>

      <InspectorSection title="Active Cache" icon={<Database size={12} />}>
        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', padding: 'var(--space-sm)' }}>
          No cache active (Epic 7 — Context Caching)
        </div>
      </InspectorSection>

      <InspectorSection title={`Uploaded Files (${uploadedFiles.length})`} icon={<FileUp size={12} />}>
        {filesSummary.length === 0 ? (
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', padding: 'var(--space-sm)' }}>
            No files uploaded
          </div>
        ) : (
          <JsonView data={filesSummary} />
        )}
      </InspectorSection>

      <InspectorSection title={`Reasoning Steps (${recentSteps.length})`} icon={<Brain size={12} />}>
        {recentSteps.length === 0 ? (
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', padding: 'var(--space-sm)' }}>
            No reasoning steps recorded yet
          </div>
        ) : (
          <JsonView data={recentSteps} />
        )}
      </InspectorSection>
    </div>
  );
}
