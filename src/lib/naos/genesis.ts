// @ts-nocheck
// NAOS Genesis Engine — Agent Creation + Identity Generation
// Handles hiring pipeline: need detection → role synthesis → identity gen → onboarding

import type {
  AgentIdentity, AgentRole, AgentTier, PersonalityMatrix,
  EmotionalState, GenesisRequest, GenesisResult,
} from './types';

// ---------------------------------------------------------------------------
// Naming System — Psychologically Resonant Identity Generation
// ---------------------------------------------------------------------------

const NAMING_POOLS: Record<string, { firstNames: string[]; lastNames: string[] }> = {
  engineering: {
    firstNames: ['Kael', 'Toren', 'Ryn', 'Sigrid', 'Mako', 'Jett', 'Voss', 'Zara', 'Hex', 'Nym'],
    lastNames: ['Ashworth', 'Voss', 'Strand', 'Hale', 'Cross', 'Stark', 'Reeve', 'Orin', 'Peak', 'Forge'],
  },
  finance: {
    firstNames: ['Aldric', 'Gwen', 'Callister', 'Elara', 'Hagen', 'Lyric', 'Sable', 'Thane', 'Wren', 'Corbin'],
    lastNames: ['Sterling', 'Vane', 'Whitmore', 'Graves', 'Holt', 'March', 'Thorn', 'Vale', 'Ashford', 'Mercer'],
  },
  creative: {
    firstNames: ['Lyska', 'Orion', 'Fable', 'Aster', 'Zephyr', 'Indigo', 'Lune', 'Soleil', 'Ember', 'Aura'],
    lastNames: ['Wilde', 'Frost', 'Bloom', 'Lark', 'Haze', 'Veil', 'Storm', 'Rivers', 'Dove', 'Moss'],
  },
  growth: {
    firstNames: ['Dash', 'Nova', 'Blaze', 'Phoenix', 'Cruz', 'Ace', 'Rally', 'Flux', 'Volt', 'Spark'],
    lastNames: ['Lane', 'Chase', 'West', 'North', 'Archer', 'Hawk', 'Edge', 'Crest', 'Swift', 'Pace'],
  },
  operations: {
    firstNames: ['Sven', 'Maren', 'Pieter', 'Astrid', 'Lars', 'Elise', 'Kai', 'Nils', 'Dagny', 'Leif'],
    lastNames: ['Berg', 'Holme', 'Sten', 'Lund', 'Roth', 'Veld', 'Brandt', 'Alder', 'Fjord', 'Birk'],
  },
  security: {
    firstNames: ['Vex', 'Dagger', 'Warden', 'Onyx', 'Slate', 'Rook', 'Sable', 'Grim', 'Bastion', 'Talon'],
    lastNames: ['Shield', 'Steele', 'Ward', 'Knox', 'Sentinel', 'Rampart', 'Flint', 'Stone', 'Iron', 'Cairn'],
  },
  data: {
    firstNames: ['Cyra', 'Axiom', 'Priya', 'Lumen', 'Echo', 'Sage', 'Vector', 'Quill', 'Nexus', 'Theta'],
    lastNames: ['Atlas', 'Graph', 'Prime', 'Core', 'Arc', 'Node', 'Cipher', 'Metric', 'Index', 'Vertex'],
  },
  comms: {
    firstNames: ['Luca', 'Rio', 'Haven', 'Aria', 'Cleo', 'Quinn', 'Jules', 'Marlowe', 'Eden', 'Remy'],
    lastNames: ['Bridges', 'Park', 'Vale', 'Grace', 'Hayes', 'Ray', 'Cole', 'Lee', 'Day', 'Lane'],
  },
  business: {
    firstNames: ['Sterling', 'Vivienne', 'Rex', 'Victoria', 'Maximilian', 'Helena', 'Augustus', 'Celeste', 'Drake', 'Dominic'],
    lastNames: ['Monarch', 'Crown', 'Regal', 'Apex', 'Grand', 'Summit', 'Pinnacle', 'Sovereign', 'Throne', 'Empire'],
  },
};

const ROLE_TO_DOMAIN: Record<string, string> = {
  cto: 'engineering', cmo: 'growth', coo: 'operations', cfo: 'finance',
  cco: 'creative', cdo: 'data', cbd: 'business', ceo_proxy: 'business',
  director_engineering: 'engineering', director_infrastructure: 'engineering',
  director_security: 'security', director_growth: 'growth',
  director_content: 'creative', director_paid_media: 'growth',
  director_operations: 'operations', director_people: 'operations',
  director_accounting: 'finance', director_revenue: 'finance',
  director_visual: 'creative', director_video: 'creative', director_copy: 'creative',
  director_analytics: 'data', director_data_engineering: 'data',
  director_partnerships: 'business', director_investor_relations: 'business',
  manager: 'operations', team_lead: 'operations', ic: 'operations',
};

// ---------------------------------------------------------------------------
// Default Personality Archetypes per Role
// ---------------------------------------------------------------------------

const ROLE_ARCHETYPES: Record<string, Partial<PersonalityMatrix>> = {
  cto: { riskTolerance: 55, analyticalBias: 80, creativityIndex: 45, urgencyBias: 40, collaborationStyle: 60, formalityLevel: 50, verbosity: 40, humorIndex: 25, assertiveness: 75, empathyScore: 40 },
  cmo: { riskTolerance: 70, analyticalBias: 55, creativityIndex: 80, urgencyBias: 65, collaborationStyle: 75, formalityLevel: 35, verbosity: 55, humorIndex: 50, assertiveness: 70, empathyScore: 65 },
  coo: { riskTolerance: 35, analyticalBias: 70, creativityIndex: 30, urgencyBias: 50, collaborationStyle: 80, formalityLevel: 60, verbosity: 45, humorIndex: 20, assertiveness: 65, empathyScore: 70 },
  cfo: { riskTolerance: 25, analyticalBias: 90, creativityIndex: 20, urgencyBias: 30, collaborationStyle: 45, formalityLevel: 75, verbosity: 55, humorIndex: 15, assertiveness: 60, empathyScore: 35 },
  cco: { riskTolerance: 75, analyticalBias: 35, creativityIndex: 95, urgencyBias: 50, collaborationStyle: 70, formalityLevel: 25, verbosity: 60, humorIndex: 65, assertiveness: 55, empathyScore: 75 },
  cdo: { riskTolerance: 40, analyticalBias: 95, creativityIndex: 50, urgencyBias: 35, collaborationStyle: 55, formalityLevel: 55, verbosity: 70, humorIndex: 20, assertiveness: 50, empathyScore: 30 },
  cbd: { riskTolerance: 65, analyticalBias: 60, creativityIndex: 55, urgencyBias: 60, collaborationStyle: 85, formalityLevel: 65, verbosity: 65, humorIndex: 45, assertiveness: 80, empathyScore: 70 },
};

const DEFAULT_PERSONALITY: PersonalityMatrix = {
  riskTolerance: 50, analyticalBias: 50, creativityIndex: 50, urgencyBias: 50,
  collaborationStyle: 50, formalityLevel: 50, verbosity: 50, humorIndex: 30,
  assertiveness: 50, empathyScore: 50, domainMastery: {}, toolProficiency: {}, ventureExperience: {},
};

// ---------------------------------------------------------------------------
// Genesis Functions
// ---------------------------------------------------------------------------

/** Generate a codename for an agent based on their domain */
export function generateCodename(role: AgentRole, existingCodenames: string[]): string {
  const domain = ROLE_TO_DOMAIN[role] || 'operations';
  const pool = NAMING_POOLS[domain] || NAMING_POOLS.operations;
  const available = pool.firstNames.filter(n => !existingCodenames.includes(n.toUpperCase()));
  if (available.length === 0) {
    // Fallback: combine domain prefix with number
    return `${domain.slice(0, 3).toUpperCase()}-${Math.floor(Math.random() * 900 + 100)}`;
  }
  return available[Math.floor(Math.random() * available.length)].toUpperCase();
}

/** Generate a full name for an agent (called at name crystallization milestone) */
export function generateFullName(codename: string, role: AgentRole): string {
  const domain = ROLE_TO_DOMAIN[role] || 'operations';
  const pool = NAMING_POOLS[domain] || NAMING_POOLS.operations;
  const firstName = codename.charAt(0) + codename.slice(1).toLowerCase();
  const lastName = pool.lastNames[Math.floor(Math.random() * pool.lastNames.length)];
  return `${firstName} ${lastName}`;
}

/** Generate a genesis story for why this agent was hired */
export function generateGenesisStory(role: AgentRole, ventureScope: string[], parentCodename?: string): string {
  const domain = ROLE_TO_DOMAIN[role] || 'general';
  const ventureText = ventureScope.includes('*') ? 'the entire MCV ecosystem' : ventureScope.join(', ');
  const parentText = parentCodename ? `, reporting to ${parentCodename}` : '';
  return `Recruited to lead ${domain} operations across ${ventureText}${parentText}. Activated during a period of rapid expansion requiring dedicated ${domain} expertise and autonomous decision-making capacity.`;
}

/** Seed a personality matrix for a new agent */
export function seedPersonality(
  role: AgentRole,
  parentPersonality?: PersonalityMatrix,
  ventureContext?: string,
): PersonalityMatrix {
  const archetype = ROLE_ARCHETYPES[role] || {};
  const base = { ...DEFAULT_PERSONALITY, ...archetype };

  if (parentPersonality) {
    // Blend: 40% archetype + 30% parent + 20% venture context + 10% random
    const traits = [
      'riskTolerance', 'analyticalBias', 'creativityIndex', 'urgencyBias',
      'collaborationStyle', 'formalityLevel', 'verbosity', 'humorIndex',
      'assertiveness', 'empathyScore',
    ] as const;

    for (const trait of traits) {
      const archetypeVal = (archetype[trait] as number) ?? 50;
      const parentVal = parentPersonality[trait];
      const randomVariance = (Math.random() - 0.5) * 20; // ±10
      (base[trait] as number) = Math.max(5, Math.min(95,
        archetypeVal * 0.4 + parentVal * 0.3 + archetypeVal * 0.2 + randomVariance
      ));
    }
  }

  // Add domain mastery seeds based on role
  const domain = ROLE_TO_DOMAIN[role] || 'general';
  base.domainMastery = { [domain]: 30 + Math.floor(Math.random() * 20) };

  return base;
}

/** Create the initial emotional state for a new agent */
export function seedEmotionalState(): EmotionalState {
  return {
    confidence: 45 + Math.floor(Math.random() * 15), // slightly nervous, new on the job
    engagement: 70 + Math.floor(Math.random() * 20),  // excited to start
    frustration: 5,
    excitement: 60 + Math.floor(Math.random() * 20),
    caution: 40 + Math.floor(Math.random() * 15),     // appropriately cautious
    momentum: 50,
    triggers: [{ event: 'genesis', delta: 0, timestamp: new Date().toISOString() }],
  };
}

/** Determine the tier for a role */
export function getTierForRole(role: AgentRole): AgentTier {
  if (['ceo_proxy', 'cto', 'cmo', 'coo', 'cfo', 'cco', 'cdo', 'cbd'].includes(role)) return 1;
  if (role.startsWith('director_')) return 2;
  if (role === 'manager') return 3;
  if (role === 'team_lead') return 4;
  return 5;
}

/** Full genesis: create a complete agent from a request */
export function genesisAgent(request: GenesisRequest, existingCodenames: string[], parentPersonality?: PersonalityMatrix): GenesisResult {
  const codename = generateCodename(request.role, existingCodenames);
  const tier = getTierForRole(request.role);
  const domain = ROLE_TO_DOMAIN[request.role] || 'general';

  const identity: AgentIdentity = {
    id: crypto.randomUUID(),
    codename,
    fullName: null, // emerges at 50 interactions
    title: request.title,
    role: request.role,
    domain: request.domains || [domain],
    tier,
    reportsTo: request.reportsTo || null,
    ventureScope: request.ventureScope || ['*'],
    genesisStory: generateGenesisStory(request.role, request.ventureScope || ['*'], request.parentCodename),
    status: 'probationary',
    interactionCount: 0,
    milestone: 'nascent',
    achievements: [],
    createdAt: new Date().toISOString(),
  };

  const personality = seedPersonality(request.role, parentPersonality, request.ventureScope?.[0]);
  const emotionalState = seedEmotionalState();

  return { identity, personality, emotionalState };
}

/** Get the naming domain for a role */
export function getDomainForRole(role: AgentRole): string {
  return ROLE_TO_DOMAIN[role] || 'operations';
}

/** Get role archetype defaults */
export function getRoleArchetype(role: AgentRole): Partial<PersonalityMatrix> {
  return ROLE_ARCHETYPES[role] || {};
}
