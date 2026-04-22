// Renders a research dossier output from the Factory's researchDossierBuilder
// flow in a reader-friendly card (instead of raw JSON). Detects the shape
// defensively so older flow outputs or partial results still display.

import { useState } from 'react';
import { ChevronDown, ChevronRight, CircleDot, Copy } from 'lucide-react';
import { Badge } from '../ui';
import type { ResearchDossier, ResearchDossierFlowOutput } from '../../lib/factory-client';

const RELEVANCE_COLOR: Record<ResearchDossier['findings'][number]['relevance'], string> = {
  critical: '#EF4444',
  high: '#F59E0B',
  medium: '#00F0FF',
  low: '#64748B',
};

export function isResearchDossierOutput(output: unknown): output is ResearchDossierFlowOutput {
  if (!output || typeof output !== 'object') return false;
  const o = output as Record<string, unknown>;
  const d = o.dossier as Record<string, unknown> | undefined;
  return (
    !!d &&
    typeof d.entityName === 'string' &&
    typeof d.domain === 'string' &&
    Array.isArray(d.findings)
  );
}

export default function DossierCard({ output }: { output: ResearchDossierFlowOutput }) {
  const { dossier, stored, emitted, memoryHealth, inferenceTier, inferenceModel } = output;
  const [questionsOpen, setQuestionsOpen] = useState(false);
  const [metaOpen, setMetaOpen] = useState(false);

  const copyJson = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(dossier, null, 2));
    } catch { /* ignore */ }
  };

  const confPct = Math.round((dossier.confidence ?? 0) * 100);

  return (
    <div
      style={{
        border: '1px solid var(--border-default)',
        borderRadius: 8,
        padding: 14,
        background: 'var(--surface-raised)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 10 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <Badge variant="outline" color="#00F0FF">{dossier.domain}</Badge>
            <Badge variant="outline" color={confPct >= 70 ? '#10B981' : confPct >= 40 ? '#F59E0B' : '#EF4444'}>
              {confPct}% confidence
            </Badge>
          </div>
          <h4 style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>{dossier.title}</h4>
          <div style={{ marginTop: 2, fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            {dossier.entityName} · {new Date(dossier.createdAt).toLocaleString()}
          </div>
        </div>
        <button
          type="button"
          onClick={copyJson}
          title="Copy dossier JSON"
          style={{
            background: 'transparent', border: '1px solid var(--border-default)',
            borderRadius: 4, padding: '4px 8px', color: 'var(--text-muted)',
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 11,
            flexShrink: 0,
          }}
        >
          <Copy size={11} /> copy
        </button>
      </div>

      <p style={{ margin: '0 0 12px 0', fontSize: 13, lineHeight: 1.5, color: 'var(--text-primary)' }}>
        {dossier.summary}
      </p>

      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>
          Findings ({dossier.findings.length})
        </div>
        <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'grid', gap: 4 }}>
          {dossier.findings.map((f, i) => (
            <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 12, lineHeight: 1.4 }}>
              <CircleDot size={10} color={RELEVANCE_COLOR[f.relevance]} style={{ marginTop: 4, flexShrink: 0 }} />
              <span style={{ flex: 1 }}>
                <span style={{
                  fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.05em',
                  color: RELEVANCE_COLOR[f.relevance], marginRight: 6, fontWeight: 600,
                }}>
                  {f.relevance}
                </span>
                {f.statement}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {dossier.openQuestions.length > 0 && (
        <div style={{ marginBottom: 10 }}>
          <button
            type="button"
            onClick={() => setQuestionsOpen(v => !v)}
            style={{
              background: 'transparent', border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 4, padding: 0,
              fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em',
            }}
          >
            {questionsOpen ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
            Open questions ({dossier.openQuestions.length})
          </button>
          {questionsOpen && (
            <ul style={{ margin: '6px 0 0 0', padding: '0 0 0 18px', fontSize: 12, lineHeight: 1.5 }}>
              {dossier.openQuestions.map((q, i) => <li key={i}>{q}</li>)}
            </ul>
          )}
        </div>
      )}

      <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 8, marginTop: 8 }}>
        <button
          type="button"
          onClick={() => setMetaOpen(v => !v)}
          style={{
            background: 'transparent', border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 4, padding: 0,
            fontSize: 10, color: 'var(--text-muted)',
          }}
        >
          {metaOpen ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
          provenance
        </button>
        {metaOpen && (
          <div style={{ marginTop: 6, display: 'grid', gap: 3, fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            <span>id: {dossier.id}</span>
            <span>tier: {inferenceTier} · model: {inferenceModel}</span>
            <span>
              stored: {stored.stored ? 'pgvector' : `no (${stored.error ?? 'unknown'})`} ·
              {' '}memory: local={memoryHealth.localPg ? 'ok' : '—'} triangle={memoryHealth.triangleIntel ? 'ok' : '—'}
            </span>
            <span>
              fabric: {emitted.published
                ? `✓ ${emitted.eventId}`
                : `✗ ${emitted.skippedReason ?? emitted.error ?? 'unknown'}`}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
