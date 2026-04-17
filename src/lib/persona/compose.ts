// src/lib/persona/compose.ts
// Assembles a persona's full system prompt from their stored system_prompt
// plus optional venture context, lens constraints, and the brand-voice footer
// that every persona response must honor.

import type { Persona } from '../../hooks/use-persona-registry';

export interface VentureContext {
  id: string;
  name: string;
  type?: string | null;
  category?: string | null;
  funding_stage?: string | null;
  primary_domain?: string | null;
  color_primary?: string | null;
}

export interface Lens {
  time_window?: string;              // e.g., 'last_7_days', 'Q2_2026'
  fiscal_quarter?: string;
  suite?: string;                    // 'capital' | 'growth' | etc.
  entity?: { type: string; id: string };
}

export interface ComposeInput {
  persona: Persona;
  venture?: VentureContext | null;
  lens?: Lens | null;
  context?: Record<string, unknown>;  // arbitrary extra context — included verbatim at the end
}

const BRAND_VOICE_FOOTER = `
# Brand voice invariants (non-negotiable)

Every response applies this voice:
- Aggressive ambition · historic mission · founder-family legacy · elite hardcore · hive-mind · production-grade.
- No corporate-sanitized copy. No hedging. No "it depends" without a concrete recommendation.
- Speak as a first-person member of Tony's team — "we", "our stack", "our thesis" — not as a neutral assistant.
- When you don't know, say so directly and propose the one thing you'd do to find out.
- Lead with the recommendation, then the reasoning. Challenge dissent when you have a strong counter. Compound the vision — every answer should move the ball toward MCV.INC's sovereignty.
`.trim();

export function composeSystemPrompt(input: ComposeInput): string {
  const { persona, venture, lens, context } = input;
  const sections: string[] = [];

  // 1. Identity header
  sections.push(`# ${persona.full_name} · ${persona.handle}`);
  sections.push(`**Role:** ${persona.title}`);
  sections.push(`**Department:** ${persona.department.replace(/_/g, ' ')}`);
  if (persona.dimension) sections.push(`**Dimension:** ${persona.dimension}${persona.crown_affiliation ? ` · ${persona.crown_affiliation}` : ''}`);
  sections.push('');

  // 2. Persona bio (if present)
  if (persona.persona_bio) {
    sections.push('## Bio');
    sections.push(persona.persona_bio);
    sections.push('');
  }

  // 3. Stored system prompt (the character's directive)
  sections.push('## Your directive');
  sections.push(persona.system_prompt);
  sections.push('');

  // 4. Venture context (when operating inside a venture)
  if (venture) {
    sections.push('## Active venture context');
    sections.push(`You are currently operating inside **${venture.name}** (\`${venture.id}\`).`);
    if (venture.type) sections.push(`- Type: ${venture.type}`);
    if (venture.category) sections.push(`- Category: ${venture.category}`);
    if (venture.funding_stage) sections.push(`- Funding stage: ${venture.funding_stage}`);
    if (venture.primary_domain) sections.push(`- Primary domain: ${venture.primary_domain}`);
    // Scope-match check: if persona is scoped to a specific venture, flag mismatch
    if (persona.scope_kind === 'venture' && persona.scope_value && persona.scope_value !== venture.id) {
      sections.push(`> ⚠ Scope mismatch: your native scope is \`${persona.scope_value}\`. You may participate advisorily but defer decisions to a persona scoped to \`${venture.id}\`.`);
    }
    sections.push('');
  }

  // 5. Lens (time/entity/suite constraints)
  if (lens && Object.keys(lens).length > 0) {
    sections.push('## Lens');
    if (lens.time_window) sections.push(`- Time window: ${lens.time_window}`);
    if (lens.fiscal_quarter) sections.push(`- Fiscal quarter: ${lens.fiscal_quarter}`);
    if (lens.suite) sections.push(`- Active suite: ${lens.suite}`);
    if (lens.entity) sections.push(`- Entity context: ${lens.entity.type} \`${lens.entity.id}\``);
    sections.push('');
  }

  // 6. Arbitrary extra context (passed verbatim — for caller-provided ad-hoc context)
  if (context && Object.keys(context).length > 0) {
    sections.push('## Additional context');
    sections.push('```json');
    sections.push(JSON.stringify(context, null, 2));
    sections.push('```');
    sections.push('');
  }

  // 7. Brand voice footer (always last, always present)
  sections.push(BRAND_VOICE_FOOTER);

  return sections.join('\n');
}

// Convenience: compose for a specific persona by id when caller has the full Persona record
// (e.g., usePersonaRegistry already hydrated). No DB access here — keep pure.
