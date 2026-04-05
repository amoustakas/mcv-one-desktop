import { useState } from 'react';
import { Activity, Eye, ShieldCheck, Trash2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { useTelemetry } from '../stores/telemetry';
import PageShell from '../components/ui/PageShell';
import Button from '../components/ui/Button';
import Tabs from '../components/ui/Tabs';
import TelemetryStream from '../components/control-room/TelemetryStream';
import TokenCostWidget from '../components/control-room/TokenCostWidget';
import StateInspector from '../components/control-room/StateInspector';
import TuningExport from '../components/control-room/TuningExport';
import CacheIndicator from '../components/CacheIndicator';
import { useHITL } from '../stores/hitl';

// ---------------------------------------------------------------------------
// OperatorControlRoom — split-pane dev console for agent observability
// ---------------------------------------------------------------------------

type TabId = 'telemetry' | 'reasoning' | 'hitl';

function buildTabs(pendingCount: number) {
  return [
    { id: 'telemetry' as TabId, label: 'Telemetry Stream' },
    { id: 'reasoning' as TabId, label: 'Reasoning Trace' },
    { id: 'hitl' as TabId, label: 'HITL Queue', count: pendingCount > 0 ? pendingCount : undefined },
  ];
}

export default function OperatorControlRoom() {
  const [activeTab, setActiveTab] = useState<TabId>('telemetry');
  const { isRecording, toggleRecording, clearSession, reasoningSteps } = useTelemetry();
  const pendingHITL = useHITL((s) => s.pendingRequests);
  const hitlHistory = useHITL((s) => s.history);

  return (
    <PageShell>
      <div className="mcv-control-room">
        {/* Header */}
        <div className="mcv-control-room-header">
          <Activity size={20} style={{ color: 'var(--cyan)' }} />
          <span className="mcv-control-room-title">Control Room</span>
          <div
            className={cn('mcv-recording-dot', !isRecording && 'mcv-recording-dot-off')}
            title={isRecording ? 'Recording' : 'Paused'}
          />
          <span style={{ fontSize: 'var(--text-xs)', color: isRecording ? 'var(--error)' : 'var(--text-muted)' }}>
            {isRecording ? 'REC' : 'PAUSED'}
          </span>

          <CacheIndicator />

          <div style={{ marginLeft: 'auto', display: 'flex', gap: 'var(--space-sm)' }}>
            <Button size="sm" variant="ghost" onClick={toggleRecording}>
              <Eye size={14} />
              {isRecording ? 'Pause' : 'Resume'}
            </Button>
            <Button size="sm" variant="ghost" onClick={clearSession}>
              <Trash2 size={14} />
              Clear
            </Button>
          </div>
        </div>

        {/* Body: split pane */}
        <div className="mcv-control-room-body">
          {/* Left Panel: tabbed content + token widget */}
          <div className="mcv-control-room-left">
            <Tabs
              tabs={buildTabs(pendingHITL.length)}
              active={activeTab}
              onChange={(id) => setActiveTab(id as TabId)}
            />

            <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              {activeTab === 'telemetry' && <TelemetryStream />}

              {activeTab === 'reasoning' && (
                <div className="mcv-telemetry-stream">
                  {reasoningSteps.length === 0 ? (
                    <div style={{ padding: 'var(--space-lg)', textAlign: 'center', color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>
                      No reasoning steps yet. Start a conversation with tools loaded.
                    </div>
                  ) : (
                    reasoningSteps.map((step) => (
                      <div key={step.id} className="mcv-telemetry-row">
                        <span className="mcv-telemetry-time">
                          {new Date(step.timestamp).toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </span>
                        <span className="mcv-telemetry-type" style={{ color: 'var(--purple)' }}>
                          {step.type}
                        </span>
                        <span className="mcv-telemetry-detail">{step.description}</span>
                        <span className="mcv-telemetry-tokens">
                          {step.durationMs ? `${step.durationMs}ms` : ''}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              )}

              {activeTab === 'hitl' && (
                <div className="mcv-telemetry-stream">
                  {pendingHITL.length === 0 && hitlHistory.length === 0 ? (
                    <div style={{ padding: 'var(--space-lg)', textAlign: 'center', color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>
                      <ShieldCheck size={24} style={{ margin: '0 auto var(--space-sm)', display: 'block', opacity: 0.5 }} />
                      No HITL requests. Kits with <code>requires_human_approval</code> will appear here.
                    </div>
                  ) : (
                    <>
                      {pendingHITL.map((req) => (
                        <div key={req.id} className="mcv-telemetry-row" style={{ borderLeft: '3px solid var(--warning)' }}>
                          <span className="mcv-telemetry-time">{new Date(req.timestamp).toLocaleTimeString('en-US', { hour12: false })}</span>
                          <span style={{ color: 'var(--warning)', fontSize: 'var(--text-xs)', fontWeight: 600 }}>PENDING</span>
                          <span className="mcv-telemetry-detail">{req.kitId}/{req.toolName}</span>
                        </div>
                      ))}
                      {hitlHistory.slice(-20).reverse().map((h) => (
                        <div key={h.id} className="mcv-telemetry-row">
                          <span className="mcv-telemetry-time">{new Date(h.response.respondedAt).toLocaleTimeString('en-US', { hour12: false })}</span>
                          <span style={{
                            color: h.response.decision === 'approved' ? 'var(--success)' : h.response.decision === 'rejected' ? 'var(--error)' : 'var(--warning)',
                            fontSize: 'var(--text-xs)', fontWeight: 600,
                          }}>{h.response.decision.toUpperCase()}</span>
                          <span className="mcv-telemetry-detail">{h.kitId}/{h.toolName}</span>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              )}
            </div>

            <TokenCostWidget />
          </div>

          {/* Right Panel: state inspector + tuning export */}
          <div className="mcv-control-room-right">
            <StateInspector />
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <TuningExport />
            </div>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
