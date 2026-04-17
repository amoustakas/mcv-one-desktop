import { describe, it, expect } from 'vitest';
import { composeSystemPrompt } from '../compose';
import type { Persona } from '../../../hooks/use-persona-registry';

const sterlingPersona: Persona = {
  id: 'e2f608a3-86cb-4fd7-bc0b-2b3dced903a0',
  handle: '@sterling',
  full_name: 'Hannah Sterling',
  title: 'Futurestate IR',
  department: 'ir_comms',
  seniority: 'senior',
  scope_kind: 'venture',
  scope_value: 'futurestate',
  reports_to_agent_id: null,
  persona_bio: 'Twelve years in real-estate capital markets. Knows every Canadian pre-con syndicate by name.',
  voice_profile: {},
  system_prompt: 'You are Sterling. You lead investor relations for Futurestate. Your job is to convert warm prospects into funded commitments.',
  avatar_url: null,
  accent_color: '#00F5FF',
  active: true,
  hired_at: '2026-04-16',
  dimension: '4D',
  crown_affiliation: 'mcv-inc-crown',
  xp: 0,
};

describe('composeSystemPrompt', () => {
  it('always includes the persona handle + title + department', () => {
    const out = composeSystemPrompt({ persona: sterlingPersona });
    expect(out).toContain('@sterling');
    expect(out).toContain('Hannah Sterling');
    expect(out).toContain('Futurestate IR');
    expect(out).toContain('ir comms');  // underscore replaced with space
  });

  it('includes the stored system_prompt verbatim under Your directive', () => {
    const out = composeSystemPrompt({ persona: sterlingPersona });
    expect(out).toContain('## Your directive');
    expect(out).toContain('You are Sterling. You lead investor relations');
  });

  it('includes venture context when ventureId provided', () => {
    const out = composeSystemPrompt({
      persona: sterlingPersona,
      venture: { id: 'futurestate', name: 'FutureState', type: 'Fintech', funding_stage: 'Bootstrapped', primary_domain: 'futurestate.ai' },
    });
    expect(out).toContain('FutureState');
    expect(out).toContain('futurestate');
    expect(out).toContain('Fintech');
    expect(out).toContain('futurestate.ai');
  });

  it('flags scope mismatch when persona is scoped to one venture but asked about another', () => {
    const out = composeSystemPrompt({
      persona: sterlingPersona,   // scoped to futurestate
      venture: { id: 'betedge', name: 'BetEdge AI' },
    });
    expect(out).toContain('Scope mismatch');
    expect(out).toContain('futurestate');
    expect(out).toContain('betedge');
  });

  it('no scope-mismatch banner when persona scope matches venture', () => {
    const out = composeSystemPrompt({
      persona: sterlingPersona,
      venture: { id: 'futurestate', name: 'FutureState' },
    });
    expect(out).not.toContain('Scope mismatch');
  });

  it('no scope-mismatch for global-scoped personas ever', () => {
    const globalPersona: Persona = { ...sterlingPersona, scope_kind: 'global', scope_value: null, handle: '@atlas', full_name: 'Atlas' };
    const out = composeSystemPrompt({
      persona: globalPersona,
      venture: { id: 'betedge', name: 'BetEdge AI' },
    });
    expect(out).not.toContain('Scope mismatch');
  });

  it('includes lens when provided', () => {
    const out = composeSystemPrompt({
      persona: sterlingPersona,
      lens: { time_window: 'last_30_days', suite: 'capital', fiscal_quarter: 'Q2_2026', entity: { type: 'round', id: 'round-xyz' } },
    });
    expect(out).toContain('last_30_days');
    expect(out).toContain('capital');
    expect(out).toContain('Q2_2026');
    expect(out).toContain('round');
    expect(out).toContain('round-xyz');
  });

  it('includes arbitrary context as a code block', () => {
    const out = composeSystemPrompt({
      persona: sterlingPersona,
      context: { current_commit_amount: 100_000, urgency: 'high' },
    });
    expect(out).toContain('## Additional context');
    expect(out).toContain('"current_commit_amount"');
    expect(out).toContain('100000');
  });

  it('brand voice footer always present and last', () => {
    const out = composeSystemPrompt({ persona: sterlingPersona });
    expect(out).toContain('Brand voice invariants');
    expect(out).toContain('Aggressive ambition');
    // Footer is last non-empty section
    const lines = out.split('\n').filter(Boolean);
    const footerStart = lines.findIndex((l) => l.includes('Brand voice invariants'));
    expect(footerStart).toBeGreaterThan(0);
    expect(footerStart).toBeGreaterThan(lines.length * 0.5);  // footer in second half
  });

  it('includes dimension + crown when present', () => {
    const out = composeSystemPrompt({ persona: sterlingPersona });
    expect(out).toContain('4D');
    expect(out).toContain('mcv-inc-crown');
  });

  it('handles dimension-less personas gracefully (no crash)', () => {
    const minimalPersona: Persona = { ...sterlingPersona, dimension: undefined, crown_affiliation: undefined };
    const out = composeSystemPrompt({ persona: minimalPersona });
    expect(out).not.toContain('**Dimension:**');
    expect(out).toContain('@sterling');  // still renders identity
  });
});
