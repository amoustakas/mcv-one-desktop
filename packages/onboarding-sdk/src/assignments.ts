// Track + venture → agent-handle resolver.
// Given a journey's track, the selected venture, and the step's agent_role,
// returns the handle of the agent who should own that step.
//
// Agents are referenced by handle (e.g. '@amara') — the API handler
// looks up the UUID via the agent_persona table.

import type { AgentRole, TrackName } from './types';

// Venture ids per CLAUDE.md.
export type VentureId =
  | 'mcv'
  | 'futurestate'
  | 'warforge'
  | 'mcvgg'
  | 'betedge'
  | 'edgeiq'
  | 'arqlabs'
  | null;

// Handles from agent_persona (Phase 1 Agent Roster — 13 active agents).
export const AGENT_HANDLES = {
  atlas:    '@atlas',     // Chief of Staff
  amara:    '@amara',     // IR Chief (default investor specialist)
  sterling: '@sterling',  // Futurestate IR
  nico:     '@nico',      // BetEdge Growth (also Creator specialist for BetEdge)
  justice:  '@justice',   // Compliance Officer
  ada:      '@ada',       // Legal Counsel
  warren:   '@warren',    // Finance Officer
  leo:      '@leo',       // Product Strategist (partner specialist)
  linus:    '@linus',     // Engineering Lead
  hannah:   '@hannah',    // Growth Chief
  dieter:   '@dieter',    // Creative Director (WarForge creator specialist)
  hedy:     '@hedy',      // Ops Controller
  satoshi:  '@satoshi',   // Tokenomics (MCV.gg specialist)
} as const;

export type AgentHandle = (typeof AGENT_HANDLES)[keyof typeof AGENT_HANDLES];

// Venture-scoped IR specialist override. Falls back to @amara (IR chief).
function irForVenture(venture: VentureId): AgentHandle {
  switch (venture) {
    case 'futurestate': return AGENT_HANDLES.sterling;
    case 'betedge':     return AGENT_HANDLES.nico;
    case 'mcvgg':       return AGENT_HANDLES.satoshi;
    default:            return AGENT_HANDLES.amara;
  }
}

// Venture-scoped creator specialist.
function creatorSpecialistForVenture(venture: VentureId): AgentHandle {
  switch (venture) {
    case 'betedge':  return AGENT_HANDLES.nico;
    case 'warforge': return AGENT_HANDLES.dieter;
    default:         return AGENT_HANDLES.hannah; // growth chief as generic creator host
  }
}

// Main resolver. Track + role together are enough for most tracks;
// venture refines the IR/creator handoff.
export function resolveAgentHandle(
  track: TrackName,
  role: AgentRole,
  venture: VentureId,
): AgentHandle | null {
  if (role === 'none') return null;

  switch (role) {
    case 'chief_of_staff': return AGENT_HANDLES.atlas;
    case 'compliance':     return AGENT_HANDLES.justice;
    case 'legal':          return AGENT_HANDLES.ada;
    case 'finance':        return AGENT_HANDLES.warren;
    case 'product':        return AGENT_HANDLES.leo;
    case 'engineering':    return AGENT_HANDLES.linus;
    case 'creative':       return AGENT_HANDLES.dieter;
    case 'ops':            return AGENT_HANDLES.hedy;
    case 'tokenomics':     return AGENT_HANDLES.satoshi;
    case 'growth':
      // partner track → Leo (product) runs partner handoff; creator → venture-scoped
      if (track === 'partner') return AGENT_HANDLES.leo;
      if (track === 'creator') return creatorSpecialistForVenture(venture);
      return AGENT_HANDLES.hannah;
    case 'ir_specialist':  return irForVenture(venture);
    default:
      return AGENT_HANDLES.atlas;
  }
}

// The specialist who "owns" a journey after the agent_assignment step.
// Used to populate prospect_journey.agent_id when the handoff occurs.
export function resolveJourneyOwner(track: TrackName, venture: VentureId): AgentHandle {
  switch (track) {
    case 'investor_retail':
    case 'investor_accredited':
      return irForVenture(venture);
    case 'partner':
      return AGENT_HANDLES.leo;
    case 'creator':
      return creatorSpecialistForVenture(venture);
    case 'team_member':
      // default to Atlas; real team-routing logic would inspect role
      return AGENT_HANDLES.atlas;
    case 'ally':
      return AGENT_HANDLES.atlas;
    case 'waitlist':
      return AGENT_HANDLES.atlas;
  }
}
