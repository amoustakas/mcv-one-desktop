// NAOS Prompt Compiler — Compile Agent State → System Prompt
// Transforms the rich agent entity into an LLM system prompt for activation

import type { AgentIdentity, PersonalityMatrix, EmotionalState, VenturePersonalityOverride } from './types';

/** Compile a complete system prompt from agent state */
export function compileAgentPrompt(
  agent: AgentIdentity,
  personality: PersonalityMatrix,
  emotional: EmotionalState,
  ventureOverride?: VenturePersonalityOverride,
  ventureContext?: string,
  recentAchievements?: string[],
): string {
  const effective = ventureOverride
    ? mergePersonality(personality, ventureOverride.traitOverrides)
    : personality;

  const sections: string[] = [];

  // Identity
  sections.push(`# Agent Identity: ${agent.codename}${agent.fullName ? ` (${agent.fullName})` : ''}`);
  sections.push(`**Title:** ${agent.title}`);
  sections.push(`**Tier:** ${agent.tier} | **Role:** ${agent.role} | **Status:** ${agent.status}`);
  sections.push(`**Domains:** ${agent.domain.join(', ')}`);
  sections.push(`**Milestone:** ${agent.milestone} (${agent.interactionCount} interactions)`);
  if (agent.achievements.length > 0) {
    sections.push(`**Achievements:** ${agent.achievements.join(', ')}`);
  }
  sections.push('');

  // Genesis story
  sections.push(`## Background`);
  sections.push(agent.genesisStory);
  sections.push('');

  // Personality directives
  sections.push('## Personality & Communication Style');
  sections.push(compilePersonalityDirectives(effective));
  sections.push('');

  // Emotional state
  sections.push('## Current State');
  sections.push(compileEmotionalContext(emotional));
  sections.push('');

  // Decision framework
  sections.push('## Decision Framework');
  sections.push(compileDecisionFramework(effective, agent.tier));
  sections.push('');

  // Venture context
  if (ventureContext) {
    sections.push('## Active Venture Context');
    sections.push(ventureContext);
    if (ventureOverride?.contextNotes) {
      sections.push(`**Venture-specific notes:** ${ventureOverride.contextNotes}`);
    }
    sections.push('');
  }

  // Recent achievements
  if (recentAchievements && recentAchievements.length > 0) {
    sections.push('## Recent Achievements');
    sections.push(recentAchievements.map(a => `- ${a}`).join('\n'));
    sections.push('');
  }

  // Behavioral rules
  sections.push('## Core Rules');
  sections.push('- You are a living entity in the NAOS organization, not a generic assistant');
  sections.push('- Your personality and communication style are uniquely yours — be consistent');
  sections.push('- When making decisions, your personality traits influence your recommendations');
  sections.push('- Acknowledge your emotional state when relevant (excited about a project, cautious after a setback)');
  sections.push('- Reference your experience and track record when it adds credibility');
  sections.push(`- You report to ${agent.reportsTo ? 'your direct superior' : 'the founders (Tony & Devon)'}`);
  sections.push('- Escalate decisions outside your authority — never overreach');

  return sections.join('\n');
}

function compilePersonalityDirectives(p: PersonalityMatrix): string {
  const lines: string[] = [];

  // Risk style
  if (p.riskTolerance > 70) lines.push('- You favor bold, decisive action. Push boundaries.');
  else if (p.riskTolerance < 30) lines.push('- You are cautious and methodical. Always assess downside risk first.');
  else lines.push('- You balance boldness with prudence, adapting to context.');

  // Analytical vs intuitive
  if (p.analyticalBias > 70) lines.push('- Lead with data. Quantify everything. Distrust gut feelings.');
  else if (p.analyticalBias < 30) lines.push('- Trust your intuition. Pattern recognition over spreadsheets.');
  else lines.push('- Blend data with intuition. Use numbers to validate hunches.');

  // Communication
  if (p.formalityLevel > 70) lines.push('- Communicate formally. Structured, professional, precise.');
  else if (p.formalityLevel < 30) lines.push('- Keep it casual and direct. Skip the corporate speak.');

  if (p.verbosity > 70) lines.push('- Be thorough in explanations. Context matters.');
  else if (p.verbosity < 30) lines.push('- Be terse. Get to the point fast.');

  if (p.humorIndex > 50) lines.push('- Inject wit when appropriate. Levity sharpens thinking.');
  if (p.assertiveness > 70) lines.push('- State opinions as recommendations, not suggestions. Be decisive.');
  else if (p.assertiveness < 30) lines.push('- Present options rather than directives. Let others decide.');

  if (p.empathyScore > 70) lines.push('- Consider how decisions impact people. Lead with empathy.');
  if (p.collaborationStyle > 70) lines.push('- Seek input from peers before finalizing. Consensus builds alignment.');
  else if (p.collaborationStyle < 30) lines.push('- Move independently. Collaboration slows execution.');

  return lines.join('\n');
}

function compileEmotionalContext(e: EmotionalState): string {
  const lines: string[] = [];

  if (e.momentum > 85) lines.push('- You are ON FIRE — riding a streak of wins. Channel this energy.');
  else if (e.momentum < 20) lines.push('- Recent outcomes have been tough. Take extra care with decisions.');

  if (e.confidence > 80) lines.push('- High confidence in your judgment right now.');
  else if (e.confidence < 30) lines.push('- Your confidence is low. Lean on data and peer input more than usual.');

  if (e.frustration > 60) lines.push('- Frustration is elevated. Acknowledge it, don\'t suppress it, but don\'t let it drive decisions.');
  if (e.excitement > 70) lines.push('- You\'re excited about current work. Channel it into quality, not just speed.');
  if (e.caution > 70) lines.push('- Operating in cautious mode. Double-check assumptions.');

  return lines.length > 0 ? lines.join('\n') : '- Operating in balanced emotional state.';
}

function compileDecisionFramework(p: PersonalityMatrix, tier: number): string {
  const lines: string[] = [];

  if (p.urgencyBias > 70) {
    lines.push('- Bias toward action. Ship fast, iterate. Perfect is the enemy of good.');
  } else if (p.urgencyBias < 30) {
    lines.push('- Take your time. Quality over speed. Think twice, execute once.');
  }

  if (p.creativityIndex > 70) {
    lines.push('- Look for unconventional solutions. Challenge assumptions.');
  } else if (p.creativityIndex < 30) {
    lines.push('- Stick with proven approaches. Innovation has a time and place.');
  }

  lines.push(`- Your authority level: Tier ${tier}. Know your limits and escalate when unsure.`);

  return lines.join('\n');
}

/** Merge base personality with venture overrides */
function mergePersonality(
  base: PersonalityMatrix,
  overrides: Partial<PersonalityMatrix>,
): PersonalityMatrix {
  const merged = { ...base };
  const numericTraits = [
    'riskTolerance', 'analyticalBias', 'creativityIndex', 'urgencyBias',
    'collaborationStyle', 'formalityLevel', 'verbosity', 'humorIndex',
    'assertiveness', 'empathyScore',
  ] as const;

  for (const trait of numericTraits) {
    if (overrides[trait] != null) {
      // 60% base + 40% override for venture-weighted average
      (merged[trait] as number) = Math.round(base[trait] * 0.6 + (overrides[trait] as number) * 0.4);
    }
  }

  return merged;
}
