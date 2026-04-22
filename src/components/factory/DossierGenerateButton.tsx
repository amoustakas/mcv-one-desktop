// Drop-in button that invokes researchDossierBuilder on the Local AI Factory
// for a given entity. Intended for embedding in row components (e.g.
// ProspectRow) so the operator can kick off research directly from their
// working context.
//
// On success: pushes a toast with a short summary + deep-link to the Factory
// Console where the full dossier renders. The run also lands in the Factory's
// own session history (picked up by FactoryConsoleView).

import { useCallback, useState, type MouseEvent } from 'react';
import { Loader2, Sparkles } from 'lucide-react';
import { factoryInvoke, type ResearchDossierFlowOutput } from '../../lib/factory-client';
import { useToast } from '../Toasts';
import { useNavigation } from '../../stores/navigation';

interface DossierGenerateButtonProps {
  /** Required — the entity name the Factory will research. */
  entityName: string;
  /** Research domain label, e.g. 'real-estate-operator', 'venture-category'. */
  domain: string;
  /** Optional extra context passed to the flow prompt. */
  context?: string;
  /** Inference depth: 1 = quick sketch, 3 = normal, 5 = Gemini escalation. Default 2. */
  depth?: number;
  /** Button size variant. */
  size?: 'sm' | 'md';
  /** Optional label override. Default "Dossier". */
  label?: string;
  /** Called with the successful flow output so parent can navigate / cache. */
  onGenerated?: (output: ResearchDossierFlowOutput) => void;
}

export default function DossierGenerateButton(props: DossierGenerateButtonProps) {
  const { entityName, domain, context, depth = 2, size = 'sm', label = 'Dossier', onGenerated } = props;
  const [running, setRunning] = useState(false);
  const { toast } = useToast();
  const setView = useNavigation(s => s.setView);

  const onClick = useCallback(async (e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    e.preventDefault();
    if (running) return;
    setRunning(true);
    try {
      const res = await factoryInvoke<ResearchDossierFlowOutput>('researchDossierBuilder', {
        entityName,
        domain,
        depth,
        context,
      });
      if (res.status === 'completed' && res.output) {
        const d = res.output.dossier;
        onGenerated?.(res.output);
        toast(
          'success',
          `Dossier generated for ${d.entityName}`,
          `${d.findings.length} findings · ${Math.round((d.confidence ?? 0) * 100)}% confidence · view in Factory Console`,
        );
      } else {
        toast(
          'error',
          `Dossier failed for ${entityName}`,
          res.error ?? 'Unknown Factory error — see Factory Console for details.',
        );
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'unknown error';
      const hint = msg.includes('factory-proxy') || msg.includes('Factory unreachable')
        ? 'Start the Factory: cd c:/Users/moust/mcv && pnpm dev'
        : 'Check Factory Console for logs';
      toast('error', `Dossier failed for ${entityName}`, `${msg} — ${hint}`);
    } finally {
      setRunning(false);
    }
  }, [running, entityName, domain, depth, context, onGenerated, toast]);

  const openConsole = useCallback((e: MouseEvent) => {
    e.stopPropagation();
    setView('factory-console');
  }, [setView]);

  const padding = size === 'sm' ? '4px 8px' : '6px 12px';
  const fontSize = size === 'sm' ? 11 : 13;
  const iconSize = size === 'sm' ? 11 : 13;

  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
      <button
        type="button"
        onClick={onClick}
        disabled={running}
        title={`Generate research dossier via Local AI Factory (depth ${depth})`}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 4,
          padding, borderRadius: 4, fontSize, fontWeight: 500,
          background: running ? 'var(--surface-raised)' : 'transparent',
          color: running ? 'var(--text-muted)' : 'var(--color-brand-electric)',
          border: '1px solid ' + (running ? 'var(--border-subtle)' : 'var(--color-brand-electric)'),
          cursor: running ? 'wait' : 'pointer',
        }}
      >
        {running ? <Loader2 size={iconSize} className="spin" /> : <Sparkles size={iconSize} />}
        {running ? 'Running…' : label}
      </button>
      <button
        type="button"
        onClick={openConsole}
        title="Open Factory Console"
        style={{
          display: 'inline-flex', alignItems: 'center',
          padding: '2px 6px', borderRadius: 4, fontSize: 10,
          background: 'transparent', color: 'var(--text-muted)',
          border: '1px solid var(--border-subtle)', cursor: 'pointer',
        }}
      >
        ↗
      </button>
    </span>
  );
}
