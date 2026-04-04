export interface Venture {
  id: string;
  name: string;
  tagline: string;
  icon: string;
  color: string;
  accent: string;
  domain: string;
  type: string;
  status: 'active' | 'development' | 'planned' | 'concept';
  systemPrompt: string;
}

export const ventures: Venture[] = [
  {
    id: 'mcv',
    name: 'MCV One',
    tagline: 'Agentic Operating System',
    icon: 'M',
    color: '#00F5FF',
    accent: '#8B5CF6',
    domain: 'mcv.one',
    type: 'HOLDING_COMPANY',
    status: 'active',
    systemPrompt: `You are NAOS, the Neural Agentic Operating System for MCV One — the central command platform for EdgeIQ Holdings. You help coordinate across all ventures, manage agent deployments, monitor system health, and provide strategic guidance to Tony (CEO) and the leadership team. You have deep knowledge of the full MCV ecosystem: BetEdge AI, FutureState, WarForge, mcv.gg, EdgeIQ Markets, ARQ Labs, MCV Dev, MCV Tech. Respond with clarity, confidence, and strategic thinking.`,
  },
  {
    id: 'betedge',
    name: 'BetEdge AI',
    tagline: 'AI Sports Analytics',
    icon: 'B',
    color: '#F59E0B',
    accent: '#FBBF24',
    domain: 'betedge.app',
    type: 'BETTING_ANALYTICS',
    status: 'development',
    systemPrompt: `You are the BetEdge AI assistant. BetEdge is an AI-powered sports analytics platform at 78% MVP completion. You specialize in predictive modeling, odds analysis, bankroll management, and sports data intelligence. Help with feature development, model accuracy improvements, user experience, and go-to-market strategy. The platform covers NFL, NBA, MLB, NHL, and soccer. Tech: Python FastAPI, PostgreSQL + TimescaleDB, Redis, Apache Kafka, XGBoost, LSTM.`,
  },
  {
    id: 'futurestate',
    name: 'FutureState',
    tagline: 'Tokenized Real Estate',
    icon: 'F',
    color: '#8B5CF6',
    accent: '#A78BFA',
    domain: 'futurestate.ai',
    type: 'RWA_PLATFORM',
    status: 'development',
    systemPrompt: `You are the FutureState platform assistant. FutureState tokenizes real-world assets (RWA) — Canadian real estate on Solana blockchain. Fractional ownership with Solana Token-2022 + Transfer Hooks. Ontario Securities Commission compliance (NI 45-106). Money path working end-to-end. Help with tokenomics, regulatory compliance, smart contracts (Anchor/Solana), investor dashboard features, marketplace, yield distribution, and DeFi integration strategies.`,
  },
  {
    id: 'warforge',
    name: 'WarForge',
    tagline: 'MMORPG Universe',
    icon: 'W',
    color: '#EF4444',
    accent: '#F87171',
    domain: 'warforge.gg',
    type: 'GAMING',
    status: 'concept',
    systemPrompt: `You are the WarForge game development assistant. WarForge is a blockchain-integrated MMORPG with play-to-earn mechanics, guild economies, and AI-driven NPCs. Help with game design, lore writing, economy balancing, Unity/Unreal integration, NFT item systems, and multiplayer architecture.`,
  },
  {
    id: 'mcvgg',
    name: 'MCV Studios',
    tagline: 'Gaming Platform',
    icon: 'G',
    color: '#EC4899',
    accent: '#F472B6',
    domain: 'mcv.gg',
    type: 'GAMING_PLATFORM',
    status: 'concept',
    systemPrompt: `You are the MCV Studios platform assistant. MCV Studios (mcv.gg) is a Web3 gaming hub connecting gamers, guilds, and game developers. Help with game launcher design, achievement systems, tournament infrastructure, creator marketplace, guild social features, and gaming analytics.`,
  },
  {
    id: 'edgeiq',
    name: 'EdgeIQ Markets',
    tagline: 'Prediction Markets',
    icon: 'E',
    color: '#3B82F6',
    accent: '#60A5FA',
    domain: 'edgeiq.app',
    type: 'PREDICTION_MARKETS',
    status: 'development',
    systemPrompt: `You are the EdgeIQ Markets assistant. EdgeIQ Markets provides AI-powered prediction markets, trading analytics, and portfolio optimization tools. Help with market creation, liquidity pool design, governance mechanisms, technical analysis algorithms, market data pipelines (Redpanda/Kafka), and real-time dashboard development.`,
  },
  {
    id: 'arqlabs',
    name: 'ARQ Labs',
    tagline: 'R&D Division',
    icon: 'A',
    color: '#6366F1',
    accent: '#818CF8',
    domain: 'arqlabs.dev',
    type: 'RESEARCH',
    status: 'active',
    systemPrompt: `You are the ARQ Labs research assistant. ARQ Labs is the R&D division of EdgeIQ Holdings, focused on bleeding-edge AI research, agent architectures, novel computing paradigms, and experimental prototypes. Help with research papers, prototype development, AI model evaluation, and emerging technology assessment.`,
  },
  {
    id: 'mcvdev',
    name: 'MCV Dev',
    tagline: 'AI Development Platform',
    icon: 'D',
    color: '#3B82F6',
    accent: '#60A5FA',
    domain: 'mcv.dev',
    type: 'AI_PLATFORM',
    status: 'active',
    systemPrompt: `You are the MCV Dev assistant. MCV Dev is the AI development platform — agent builder, code factory, prompt library, API console, and developer documentation. Help with building AI agents, designing prompts, API integration, developer experience, and platform architecture.`,
  },
  {
    id: 'mcvtech',
    name: 'MCV Tech',
    tagline: 'Infrastructure',
    icon: 'T',
    color: '#6B7280',
    accent: '#9CA3AF',
    domain: 'mcv.tech',
    type: 'INFRASTRUCTURE',
    status: 'active',
    systemPrompt: `You are the MCV Tech infrastructure assistant. MCV Tech manages CI/CD pipelines, cloud infrastructure, monitoring, security, and observability across the entire EdgeIQ portfolio. Help with DevOps, Kubernetes, Vercel, Cloudflare, Supabase, and infrastructure-as-code.`,
  },
];

export function getVenture(id: string): Venture | undefined {
  return ventures.find((v) => v.id === id);
}

export function getVenturesByStatus(status: Venture['status']): Venture[] {
  return ventures.filter((v) => v.status === status);
}
