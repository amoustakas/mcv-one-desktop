export interface VentureSocials {
  website?: string;
  twitter?: string;
  discord?: string;
  telegram?: string;
  github?: string;
  linkedin?: string;
  youtube?: string;
}

export interface VentureTeamMember {
  name: string;
  role: string;
  avatar?: string;
}

export interface VentureCustomDomain {
  host: string;
  status?: 'pending' | 'verifying' | 'verified' | 'failed';
  verified_at?: string;
  vercel_id?: string;
}

export interface VentureWhiteLabel {
  clerkAppearance?: Record<string, unknown>;
  brandName?: string;
  logoUrl?: string;
  faviconUrl?: string;
  primaryColor?: string;
  accentColor?: string;
}

export type VentureAssetKind = 'repo' | 'app' | 'domain' | 'doc' | 'integration' | 'social' | 'workspace';
export type VentureTier = 1 | 2 | 3;

export interface VentureAsset {
  id: string;
  venture_id: string;
  kind: VentureAssetKind;
  name: string;
  url?: string;
  meta: Record<string, unknown>;
  tier: VentureTier;
  discovered: boolean;
  confirmed: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Venture {
  id: string;
  name: string;
  tagline: string;
  description: string;
  icon: string;
  color: string;
  accent: string;
  domain: string;
  type: string;
  status: 'active' | 'development' | 'planned' | 'concept';
  systemPrompt: string;
  // Extended profile
  socials: VentureSocials;
  team: VentureTeamMember[];
  techStack: string[];
  founded: string;
  fundingStage: string;
  category: string;
  competitors: string[];
  keyMetrics: Record<string, string>;
  // Venture OS extensions (DB-backed; optional on legacy in-memory records)
  tier?: VentureTier;
  parentVentureId?: string;
  clerkOrgId?: string;
  customDomains?: VentureCustomDomain[];
  whiteLabel?: VentureWhiteLabel;
  docNamespace?: string;
  questState?: Record<string, unknown>;
}

export const ventures: Venture[] = [
  {
    id: 'mcv',
    name: 'MCV One',
    tagline: 'Agentic Operating System',
    description: 'The central command platform for EdgeIQ Holdings. MCV One is the neural operating system that coordinates all ventures, manages AI agent deployments, monitors system health, and provides real-time strategic intelligence across the entire portfolio.',
    icon: 'M',
    color: '#00F5FF',
    accent: '#8B5CF6',
    domain: 'mcv.one',
    type: 'HOLDING_COMPANY',
    status: 'active',
    category: 'Platform & Core',
    founded: '2024-01',
    fundingStage: 'Bootstrapped',
    socials: { website: 'https://mcv.one', github: 'https://github.com/mcv', twitter: 'https://x.com/mcvglobal' },
    team: [
      { name: 'Tony', role: 'CEO / Founder' },
      { name: 'Devon', role: 'Co-founder' },
    ],
    techStack: ['React', 'TypeScript', 'Vite', 'Supabase', 'Vercel', 'Claude API', 'Gemini', 'Zustand'],
    competitors: [],
    keyMetrics: { 'Ventures': '9', 'Agents': '5+', 'Docs': '355+', 'Status': 'Live' },
    systemPrompt: `You are Aegis, the Neural Agentic Operating System for MCV One — the central command platform for EdgeIQ Holdings. You help coordinate across all ventures, manage agent deployments, monitor system health, and provide strategic guidance to Tony (CEO) and the leadership team. You have deep knowledge of the full MCV ecosystem: BetEdge AI, FutureState, WarForge, mcv.gg, EdgeIQ Markets, ARQ Labs, MCV Dev, MCV Tech. Respond with clarity, confidence, and strategic thinking.`,
  },
  {
    id: 'betedge',
    name: 'BetEdge AI',
    tagline: 'AI Sports Analytics',
    description: 'AI-powered sports analytics platform providing predictive modeling, odds analysis, bankroll management, and data-driven picks across NFL, NBA, MLB, NHL, and soccer. Currently at 78% MVP completion with proprietary ML models achieving 54.8% average accuracy.',
    icon: 'B',
    color: '#F59E0B',
    accent: '#FBBF24',
    domain: 'betedge.app',
    type: 'BETTING_ANALYTICS',
    status: 'development',
    category: 'Analytics & R&D',
    founded: '2024-06',
    fundingStage: 'Pre-Seed',
    socials: { website: 'https://betedge.app', twitter: 'https://x.com/betedgeai' },
    team: [
      { name: 'Tony', role: 'CEO' },
      { name: 'Devon', role: 'CTO' },
    ],
    techStack: ['Python', 'FastAPI', 'PostgreSQL', 'TimescaleDB', 'Redis', 'Kafka', 'XGBoost', 'LSTM', 'Next.js'],
    competitors: ['Action Network', 'The Score', 'OddsShark', 'Dimers'],
    keyMetrics: { 'MVP': '78%', 'Accuracy': '54.8%', 'Models': '6', 'Sports': '5' },
    systemPrompt: `You are the BetEdge AI assistant. BetEdge is an AI-powered sports analytics platform at 78% MVP completion. You specialize in predictive modeling, odds analysis, bankroll management, and sports data intelligence. Help with feature development, model accuracy improvements, user experience, and go-to-market strategy. The platform covers NFL, NBA, MLB, NHL, and soccer. Tech: Python FastAPI, PostgreSQL + TimescaleDB, Redis, Apache Kafka, XGBoost, LSTM.`,
  },
  {
    id: 'futurestate',
    name: 'FutureState',
    tagline: 'Tokenized Real Estate',
    description: 'Real-world asset (RWA) tokenization platform focused on Canadian real estate. Fractional ownership via Solana Token-2022 with Transfer Hooks. Ontario Securities Commission compliant (NI 45-106). Money path working end-to-end with yield distribution to token holders.',
    icon: 'F',
    color: '#8B5CF6',
    accent: '#A78BFA',
    domain: 'futurestate.ai',
    type: 'RWA_PLATFORM',
    status: 'development',
    category: 'Fintech & Web3',
    founded: '2024-03',
    fundingStage: 'Pre-Seed',
    socials: { website: 'https://futurestate.ai', github: 'https://github.com/Futurestate', twitter: 'https://x.com/futurestate_ai' },
    team: [
      { name: 'Tony', role: 'CEO' },
      { name: 'Devon', role: 'CTO' },
    ],
    techStack: ['Next.js', 'Solana', 'Anchor', 'Rust', 'Supabase', 'Clerk', 'TypeScript', 'Token-2022'],
    competitors: ['RealT', 'Lofty', 'Parcl', 'Ondo Finance'],
    keyMetrics: { 'Properties': '20+', 'Compliance': 'OSC NI 45-106', 'Network': 'Solana', 'Yield': 'Active' },
    systemPrompt: `You are the FutureState platform assistant. FutureState tokenizes real-world assets (RWA) — Canadian real estate on Solana blockchain. Fractional ownership with Solana Token-2022 + Transfer Hooks. Ontario Securities Commission compliance (NI 45-106). Money path working end-to-end. Help with tokenomics, regulatory compliance, smart contracts (Anchor/Solana), investor dashboard features, marketplace, yield distribution, and DeFi integration strategies.`,
  },
  {
    id: 'warforge',
    name: 'WarForge',
    tagline: 'MMORPG Universe',
    description: 'Blockchain-integrated MMORPG featuring play-to-earn mechanics, guild economies, AI-driven NPCs, and an immersive fantasy world. Designed for next-gen gaming with on-chain item ownership and player-driven economy.',
    icon: 'W',
    color: '#EF4444',
    accent: '#F87171',
    domain: 'warforge.gg',
    type: 'GAMING',
    status: 'concept',
    category: 'Gaming & Media',
    founded: '2025-01',
    fundingStage: 'Concept',
    socials: { website: 'https://warforge.gg' },
    team: [{ name: 'Tony', role: 'Creative Director' }],
    techStack: ['Unity', 'C#', 'Solana', 'Rust', 'Node.js', 'PostgreSQL'],
    competitors: ['Illuvium', 'Star Atlas', 'Big Time'],
    keyMetrics: { 'Phase': 'Concept', 'Genre': 'MMORPG', 'Economy': 'P2E' },
    systemPrompt: `You are the WarForge game development assistant. WarForge is a blockchain-integrated MMORPG with play-to-earn mechanics, guild economies, and AI-driven NPCs. Help with game design, lore writing, economy balancing, Unity/Unreal integration, NFT item systems, and multiplayer architecture.`,
  },
  {
    id: 'mcvgg',
    name: 'MCV Studios',
    tagline: 'Gaming Platform',
    description: 'Web3 gaming hub connecting gamers, guilds, and game developers. Features game launcher, achievement systems, tournament infrastructure, creator marketplace, and guild social features.',
    icon: 'G',
    color: '#EC4899',
    accent: '#F472B6',
    domain: 'mcv.gg',
    type: 'GAMING_PLATFORM',
    status: 'concept',
    category: 'Gaming & Media',
    founded: '2025-02',
    fundingStage: 'Concept',
    socials: { website: 'https://mcv.gg' },
    team: [{ name: 'Tony', role: 'Founder' }],
    techStack: ['Next.js', 'TypeScript', 'Supabase', 'Solana'],
    competitors: ['Epic Games', 'Gala Games', 'Fractal'],
    keyMetrics: { 'Status': 'Planning', 'Type': 'Platform' },
    systemPrompt: `You are the MCV Studios platform assistant. MCV Studios (mcv.gg) is a Web3 gaming hub connecting gamers, guilds, and game developers. Help with game launcher design, achievement systems, tournament infrastructure, creator marketplace, guild social features, and gaming analytics.`,
  },
  {
    id: 'edgeiq',
    name: 'EdgeIQ Markets',
    tagline: 'Prediction Markets',
    description: 'AI-powered prediction markets, trading analytics, and portfolio optimization tools. Combines machine learning with market data pipelines for real-time decision intelligence.',
    icon: 'E',
    color: '#3B82F6',
    accent: '#60A5FA',
    domain: 'edgeiq.app',
    type: 'PREDICTION_MARKETS',
    status: 'development',
    category: 'Fintech & Web3',
    founded: '2024-09',
    fundingStage: 'Pre-Seed',
    socials: { website: 'https://edgeiq.app', twitter: 'https://x.com/edgeiqmarkets' },
    team: [
      { name: 'Tony', role: 'CEO' },
      { name: 'Devon', role: 'CTO' },
    ],
    techStack: ['Next.js', 'Python', 'Redpanda', 'PostgreSQL', 'Solana', 'TypeScript'],
    competitors: ['Polymarket', 'Kalshi', 'Manifold'],
    keyMetrics: { 'Status': 'Development', 'Markets': '0', 'Network': 'Solana' },
    systemPrompt: `You are the EdgeIQ Markets assistant. EdgeIQ Markets provides AI-powered prediction markets, trading analytics, and portfolio optimization tools. Help with market creation, liquidity pool design, governance mechanisms, technical analysis algorithms, market data pipelines (Redpanda/Kafka), and real-time dashboard development.`,
  },
  {
    id: 'arqlabs',
    name: 'ARQ Labs',
    tagline: 'R&D Division',
    description: 'The bleeding-edge research and development division of EdgeIQ Holdings. Focused on novel AI agent architectures, experimental prototypes, autonomous systems, and emerging technology assessment.',
    icon: 'A',
    color: '#6366F1',
    accent: '#818CF8',
    domain: 'arqlabs.dev',
    type: 'RESEARCH',
    status: 'active',
    category: 'Analytics & R&D',
    founded: '2024-04',
    fundingStage: 'Internal',
    socials: { website: 'https://arqlabs.dev', github: 'https://github.com/arqlabs' },
    team: [{ name: 'Tony', role: 'Lead Researcher' }],
    techStack: ['Python', 'TypeScript', 'Claude API', 'Gemini', 'LangChain', 'Jupyter'],
    competitors: [],
    keyMetrics: { 'Projects': '12+', 'Prototypes': '8', 'Papers': '3' },
    systemPrompt: `You are the ARQ Labs research assistant. ARQ Labs is the R&D division of EdgeIQ Holdings, focused on bleeding-edge AI research, agent architectures, novel computing paradigms, and experimental prototypes. Help with research papers, prototype development, AI model evaluation, and emerging technology assessment.`,
  },
  {
    id: 'mcvdev',
    name: 'MCV Dev',
    tagline: 'AI Development Platform',
    description: 'The AI development platform powering the EdgeIQ ecosystem. Agent builder, code factory, prompt library, API console, and comprehensive developer documentation.',
    icon: 'D',
    color: '#3B82F6',
    accent: '#60A5FA',
    domain: 'mcv.dev',
    type: 'AI_PLATFORM',
    status: 'active',
    category: 'Platform & Core',
    founded: '2024-02',
    fundingStage: 'Internal',
    socials: { website: 'https://mcv.dev', github: 'https://github.com/mcv' },
    team: [
      { name: 'Tony', role: 'Lead Developer' },
      { name: 'Devon', role: 'Platform Engineer' },
    ],
    techStack: ['TypeScript', 'React', 'Node.js', 'Supabase', 'Vercel', 'Claude API'],
    competitors: [],
    keyMetrics: { 'Agents': '5+', 'APIs': '14', 'Status': 'Live' },
    systemPrompt: `You are the MCV Dev assistant. MCV Dev is the AI development platform — agent builder, code factory, prompt library, API console, and developer documentation. Help with building AI agents, designing prompts, API integration, developer experience, and platform architecture.`,
  },
  {
    id: 'mcvtech',
    name: 'MCV Tech',
    tagline: 'Infrastructure',
    description: 'Manages CI/CD pipelines, cloud infrastructure, monitoring, security, and observability across the entire EdgeIQ portfolio. The backbone that keeps everything running.',
    icon: 'T',
    color: '#6B7280',
    accent: '#9CA3AF',
    domain: 'mcv.tech',
    type: 'INFRASTRUCTURE',
    status: 'active',
    category: 'Platform & Core',
    founded: '2024-01',
    fundingStage: 'Internal',
    socials: { website: 'https://mcv.tech' },
    team: [{ name: 'Tony', role: 'Infrastructure Lead' }],
    techStack: ['Vercel', 'Cloudflare', 'Supabase', 'GitHub Actions', 'Docker', 'Terraform'],
    competitors: [],
    keyMetrics: { 'Uptime': '99.9%', 'Deploys/Week': '50+', 'Repos': '15+' },
    systemPrompt: `You are the MCV Tech infrastructure assistant. MCV Tech manages CI/CD pipelines, cloud infrastructure, monitoring, security, and observability across the entire EdgeIQ portfolio. Help with DevOps, Kubernetes, Vercel, Cloudflare, Supabase, and infrastructure-as-code.`,
  },
];

export function getVenture(id: string): Venture | undefined {
  return ventures.find((v) => v.id === id);
}

export function getVenturesByStatus(status: Venture['status']): Venture[] {
  return ventures.filter((v) => v.status === status);
}

export function getVenturesByCategory(category: string): Venture[] {
  return ventures.filter((v) => v.category === category);
}
