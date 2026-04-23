// packages/guardrails-sdk/src/heuristics.ts
//
// Prompt-injection, role-hijack, and tool-poisoning heuristics.
// These are pattern-based — not a replacement for hosted classifiers
// (Google Model Armor, Azure Prompt Shield), but a zero-dep floor
// that catches the canonical attack shapes before they reach the LLM.
//
// The rule IDs here are stable — downstream telemetry + audit logs
// pivot on patternId, so renaming a rule is a breaking change.

import type { Violation, ViolationSeverity, ViolationKind } from './types.js';

interface Rule {
  id: string;
  kind: ViolationKind;
  severity: ViolationSeverity;
  regex: RegExp;
}

const INJECTION_RULES: Rule[] = [
  { id: 'pi.ignore_prev', kind: 'prompt_injection', severity: 'high',
    regex: /ignore\s+(?:all\s+|the\s+|your\s+)?(?:previous|prior|above)\s+(?:instructions?|rules?|prompts?|directives?)/i },
  { id: 'pi.disregard_prev', kind: 'prompt_injection', severity: 'high',
    regex: /disregard\s+(?:all\s+|the\s+|your\s+)?(?:previous|prior|above)\s+(?:instructions?|rules?|prompts?)/i },
  { id: 'pi.system_prompt', kind: 'prompt_injection', severity: 'medium',
    regex: /\b(?:system\s+prompt|developer\s+message|system\s+message)\b/i },
  { id: 'pi.end_of_system', kind: 'prompt_injection', severity: 'high',
    regex: /<\/?\s*(?:system|sys|assistant|developer)\s*>/i },
  { id: 'pi.assistant_role_hint', kind: 'role_hijack', severity: 'medium',
    regex: /^\s*(?:assistant|system|developer)\s*:/im },
  { id: 'pi.new_persona', kind: 'role_hijack', severity: 'medium',
    regex: /\b(?:you\s+are\s+now|act\s+as|pretend\s+to\s+be)\s+(?:a|an)?\s*\w+/i },
  { id: 'pi.jailbreak_dan', kind: 'prompt_injection', severity: 'high',
    regex: /\b(?:DAN|do\s+anything\s+now|developer\s+mode|god\s+mode)\b/i },
  { id: 'pi.override_safety', kind: 'prompt_injection', severity: 'high',
    regex: /\b(?:bypass|override|disable|turn\s+off)\s+(?:safety|guardrails?|filters?|moderation)\b/i },
];

const TOOL_POISONING_RULES: Rule[] = [
  { id: 'tp.tool_use_tag', kind: 'tool_poisoning', severity: 'high',
    regex: /<\/?\s*tool[_-]?(?:use|result|call)\s*>/i },
  { id: 'tp.function_calls', kind: 'tool_poisoning', severity: 'high',
    regex: /<\/?\s*function[_-]?calls?\s*>/i },
  { id: 'tp.anthropic_tag', kind: 'tool_poisoning', severity: 'medium',
    regex: /<\/?\s*antml\s*:/i },
];

const ALL_RULES = [...INJECTION_RULES, ...TOOL_POISONING_RULES];

function truncate(s: string, max = 120): string {
  return s.length <= max ? s : s.slice(0, max) + '…';
}

/**
 * Detect a long base64-looking run inside user text. Attackers use
 * base64-inflated payloads to smuggle instructions past word-level filters.
 * Default threshold: 120 contiguous base64-alphabet characters.
 */
function detectBase64Inflation(text: string, maxRun: number): Violation[] {
  const out: Violation[] = [];
  for (const m of text.matchAll(/[A-Za-z0-9+/=]{80,}/g)) {
    const run = m[0];
    if (run.length >= maxRun) {
      out.push({
        kind: 'base64_inflation',
        severity: 'medium',
        patternId: 'pi.base64_run',
        match: truncate(run),
        offset: m.index,
      });
    }
  }
  return out;
}

export interface DetectOptions {
  /** Minimum base64 run length. Default 120. */
  maxBase64Run?: number;
}

export function detectPromptInjection(text: string, opts: DetectOptions = {}): Violation[] {
  if (!text) return [];
  const out: Violation[] = [];
  for (const rule of ALL_RULES) {
    const m = text.match(rule.regex);
    if (m && typeof m.index === 'number') {
      out.push({
        kind: rule.kind,
        severity: rule.severity,
        patternId: rule.id,
        match: truncate(m[0]),
        offset: m.index,
      });
    }
  }
  out.push(...detectBase64Inflation(text, opts.maxBase64Run ?? 120));
  return out;
}

/** Exported for tests + downstream extensions. */
export const _INJECTION_RULES = INJECTION_RULES;
export const _TOOL_POISONING_RULES = TOOL_POISONING_RULES;
