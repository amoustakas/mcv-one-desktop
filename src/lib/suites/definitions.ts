// Departmental Suite catalog.
//
// A Suite is a curated workspace that composes NAOS agents, kit tools, embedded
// components, and live data panels for a specific functional area of the MCV
// ecosystem. Tony's "Prompt Arch / The Lab" pattern: global toolbox everywhere,
// dedicated command centers per department.

export type SuiteId =
  | 'command-bridge'
  | 'creative-studio'
  | 'developer-ops'
  | 'marketing-growth'
  | 'commerce-finance'
  | 'comms-hub'
  | 'knowledge-research'
  | 'voice-studio'
  | 'strategy-intelligence'
  | 'ops-infra'
  | 'ventures-workspace'
  | 'arcade-lab'
  | 'foundation';

export interface SuiteTool {
  /** View id the tool opens (must match an App.tsx case) */
  viewId?: string;
  /** Kit id (from manifest.id) for chat-invokable tools */
  kitId?: string;
  label: string;
  description: string;
  icon?: string; // lucide name
  category?: 'generate' | 'analyze' | 'publish' | 'manage' | 'automate';
}

export interface SuiteDefinition {
  id: SuiteId;
  label: string;
  tagline: string;
  icon: string; // lucide name
  color: string; // hex or var()
  /** NAOS agent codenames assigned to this suite (first = primary lead) */
  agents: string[];
  /** Curated tools surfaced in the suite grid */
  tools: SuiteTool[];
  /** Primary kit ids (from loader.ts) for chat tool-calling priority */
  primaryKits: string[];
  /** Memory filter hint for MemoryShelf */
  memoryTags?: string[];
}

export const SUITES: SuiteDefinition[] = [
  {
    id: 'command-bridge',
    label: 'Command Bridge',
    tagline: 'Executive cockpit — fleet view of all ventures',
    icon: 'Compass',
    color: '#00F5FF',
    agents: ['aegis', 'atlas'],
    tools: [
      { viewId: 'portfolio', label: 'Portfolio', description: 'Cross-venture portfolio view', icon: 'LayoutGrid', category: 'analyze' },
      { viewId: 'intelligence', label: 'Intelligence', description: 'Market & competitive intel', icon: 'Binoculars', category: 'analyze' },
      { viewId: 'signals', label: 'Signals', description: 'Real-time alerts & triggers', icon: 'Radio', category: 'analyze' },
      { viewId: 'war-room', label: 'War Room', description: 'Live strategic operations', icon: 'Swords', category: 'manage' },
      { viewId: 'command-center', label: 'Command Center', description: 'Quick actions & alert queue', icon: 'Radar', category: 'manage' },
      { viewId: 'epics', label: 'Epic Board', description: 'Top-level initiatives across the org', icon: 'Layers', category: 'manage' },
      { kitId: 'treasury', label: 'Treasury (chat)', description: 'Ask NAOS about cash, runway, allocation', icon: 'Vault', category: 'analyze' },
      { kitId: 'ventures', label: 'Ventures (chat)', description: 'Query any venture via chat', icon: 'Building2', category: 'analyze' },
    ],
    primaryKits: ['treasury', 'ventures', 'naos-command', 'epic-pipeline'],
    memoryTags: ['strategy', 'executive'],
  },
  {
    id: 'creative-studio',
    label: 'Creative Studio',
    tagline: 'Video, image, brand — the content forge',
    icon: 'Palette',
    color: '#EC4899',
    agents: ['muse', 'daedalus'],
    tools: [
      { viewId: 'video-studio', label: 'Video Studio', description: 'Veo generation, cameos, typography, gallery', icon: 'Film', category: 'generate' },
      { viewId: 'creative-canvas', label: 'Creative Canvas', description: 'Imagen, infographics, mockups, augmented edits', icon: 'Brush', category: 'generate' },
      { viewId: 'ad-studio', label: 'Ad Studio', description: 'Campaign-grade creative assembly', icon: 'Megaphone', category: 'publish' },
      { viewId: 'ai-studio', label: 'AI Studio', description: 'Multi-tool Gemini workbench', icon: 'Sparkles', category: 'generate' },
      { kitId: 'imagen-studio', label: 'Imagen (chat)', description: 'Generate images via agent conversation', icon: 'ImagePlus', category: 'generate' },
      { kitId: 'veo-studio', label: 'Veo (chat)', description: 'Generate video via agent conversation', icon: 'Clapperboard', category: 'generate' },
      { kitId: 'creative-tools', label: 'Creative Tools', description: 'Comic, product mockup, augmented editor', icon: 'Wand2', category: 'generate' },
      { kitId: 'figma', label: 'Figma', description: 'Read/write Figma designs', icon: 'Figma', category: 'manage' },
    ],
    primaryKits: ['imagen-studio', 'veo-studio', 'creative-tools', 'creative-ai', 'ai-studio', 'figma'],
    memoryTags: ['creative', 'brand', 'content'],
  },
  {
    id: 'developer-ops',
    label: 'Developer Ops',
    tagline: 'Ship code. Investigate. Engineer.',
    icon: 'Code2',
    color: '#3B82F6',
    agents: ['daedalus', 'forge'],
    tools: [
      { viewId: 'engineering', label: 'Engineering', description: 'Engineering dashboard', icon: 'Wrench', category: 'manage' },
      { viewId: 'forge', label: 'Forge', description: 'Dev forge — repos, builds, deploys', icon: 'Hammer', category: 'manage' },
      { viewId: 'browser', label: 'Browser', description: 'Headless/assisted browsing', icon: 'Globe', category: 'analyze' },
      { viewId: 'sessions', label: 'Sessions', description: 'Claude Code session tracker', icon: 'Terminal', category: 'analyze' },
      { kitId: 'github', label: 'GitHub (chat)', description: 'Repos, PRs, issues, commits', icon: 'Github', category: 'manage' },
      { kitId: 'cloudflare', label: 'Cloudflare (chat)', description: 'Workers, KV, R2, D1', icon: 'Cloud', category: 'manage' },
      { kitId: 'sentry', label: 'Sentry (chat)', description: 'Errors + releases', icon: 'Siren', category: 'analyze' },
      { kitId: 'vercel', label: 'Vercel (chat)', description: 'Deployments + env', icon: 'Triangle', category: 'manage' },
      { kitId: 'docker', label: 'Docker (chat)', description: 'Containers, images, compose', icon: 'Container', category: 'manage' },
      { kitId: 'supabase' as string, label: 'Supabase (chat)', description: 'DB migrations, tables, RPC', icon: 'Database', category: 'manage' },
    ],
    primaryKits: ['github', 'cloudflare', 'sentry', 'vercel', 'docker', 'supabase'],
    memoryTags: ['engineering', 'devops'],
  },
  {
    id: 'marketing-growth',
    label: 'Marketing & Growth',
    tagline: 'Acquire, convert, retain — the growth engine',
    icon: 'TrendingUp',
    color: '#F59E0B',
    agents: ['hermes', 'muse'],
    tools: [
      { viewId: 'growth', label: 'Growth', description: 'Funnel, attribution, experiments', icon: 'LineChart', category: 'analyze' },
      { viewId: 'ad-studio', label: 'Ad Studio', description: 'Campaign composer across networks', icon: 'Megaphone', category: 'publish' },
      { viewId: 'contact-center', label: 'Contact Center', description: 'Multi-channel contact ops', icon: 'Headphones', category: 'manage' },
      { kitId: 'campaigns', label: 'Campaigns (chat)', description: 'Plan, launch, measure campaigns', icon: 'Rocket', category: 'publish' },
      { kitId: 'google-ads', label: 'Google Ads (chat)', description: 'Ads account ops', icon: 'Target', category: 'publish' },
      { kitId: 'meta-ads', label: 'Meta Ads (chat)', description: 'Meta campaigns', icon: 'Facebook', category: 'publish' },
      { kitId: 'tiktok', label: 'TikTok (chat)', description: 'TikTok ads + content', icon: 'Music', category: 'publish' },
      { kitId: 'hubspot', label: 'HubSpot (chat)', description: 'CRM & marketing hub', icon: 'Briefcase', category: 'manage' },
      { kitId: 'mailchimp' as string, label: 'Email Ops', description: 'Broadcast + lifecycle email', icon: 'Mail', category: 'publish' },
      { kitId: 'google-analytics', label: 'Analytics (chat)', description: 'GA4 metrics & funnels', icon: 'BarChart3', category: 'analyze' },
    ],
    primaryKits: ['campaigns', 'google-ads', 'meta-ads', 'tiktok', 'hubspot', 'ad-studio', 'google-analytics'],
    memoryTags: ['marketing', 'growth', 'campaigns'],
  },
  {
    id: 'commerce-finance',
    label: 'Commerce & Finance',
    tagline: 'The financial rails — revenue, payouts, ledger',
    icon: 'Coins',
    color: '#10B981',
    agents: ['athena', 'atlas'],
    tools: [
      { viewId: 'commerce-overview', label: 'Commerce', description: 'Overview dashboard', icon: 'ShoppingBag', category: 'manage' },
      { viewId: 'commerce-products', label: 'Products', description: 'Catalog + pricing', icon: 'Package', category: 'manage' },
      { viewId: 'commerce-orders', label: 'Orders', description: 'Order pipeline', icon: 'ClipboardList', category: 'manage' },
      { viewId: 'financials-dashboard', label: 'Financials', description: 'P&L, cash, ratios', icon: 'CircleDollarSign', category: 'analyze' },
      { viewId: 'financials-ledger', label: 'Ledger', description: 'Double-entry journal', icon: 'BookOpen', category: 'analyze' },
      { viewId: 'commerce-invoices', label: 'Invoices', description: 'Invoice ops', icon: 'FileText', category: 'manage' },
      { viewId: 'commerce-credits', label: 'Credits', description: 'Internal credit balances', icon: 'Gem', category: 'manage' },
      { viewId: 'commerce-loans', label: 'Loans', description: 'Loan origination & servicing', icon: 'Landmark', category: 'manage' },
      { viewId: 'treasury', label: 'Treasury', description: 'Cash, runway, allocation', icon: 'Vault', category: 'manage' },
      { kitId: 'stripe', label: 'Stripe (chat)', description: 'Charges, refunds, customers', icon: 'CreditCard', category: 'manage' },
      { kitId: 'payments', label: 'Payments (chat)', description: 'Multi-rail router', icon: 'Split', category: 'manage' },
      { kitId: 'plaid', label: 'Plaid (chat)', description: 'Bank link + ACH', icon: 'Banknote', category: 'manage' },
    ],
    primaryKits: ['stripe', 'payments', 'plaid', 'commerce', 'finance', 'ledger', 'treasury', 'commerce-surface'],
    memoryTags: ['commerce', 'finance', 'payments'],
  },
  {
    id: 'comms-hub',
    label: 'Comms Hub',
    tagline: 'Unified inbox — every channel, one place',
    icon: 'Inbox',
    color: '#8B5CF6',
    agents: ['hermes', 'scribe'],
    tools: [
      { viewId: 'comms-hub', label: 'Comms Hub', description: '10-tab unified inbox', icon: 'Inbox', category: 'manage' },
      { viewId: 'gmail', label: 'Gmail', description: 'Gmail inbox in-app', icon: 'Mail', category: 'manage' },
      { viewId: 'calendar', label: 'Calendar', description: 'Google Calendar', icon: 'Calendar', category: 'manage' },
      { kitId: 'slack', label: 'Slack (chat)', description: 'Workspace ops', icon: 'Slack', category: 'manage' },
      { kitId: 'discord', label: 'Discord (chat)', description: 'Server ops', icon: 'MessageSquare', category: 'manage' },
      { kitId: 'telegram', label: 'Telegram (chat)', description: 'Telegram ops', icon: 'Send', category: 'manage' },
      { kitId: 'twilio', label: 'Twilio (chat)', description: 'SMS + voice', icon: 'Phone', category: 'manage' },
      { kitId: 'gmail', label: 'Gmail (chat)', description: 'Search + draft mail', icon: 'AtSign', category: 'manage' },
      { kitId: 'google-calendar', label: 'Calendar (chat)', description: 'Events + scheduling', icon: 'CalendarClock', category: 'manage' },
      { kitId: 'comms-sync', label: 'Comms Sync', description: 'Cross-channel sync', icon: 'RefreshCw', category: 'automate' },
    ],
    primaryKits: ['slack', 'discord', 'telegram', 'twilio', 'gmail', 'google-calendar', 'comms-sync'],
    memoryTags: ['comms', 'inbox', 'calendar'],
  },
  {
    id: 'knowledge-research',
    label: 'Knowledge & Research',
    tagline: 'The KB — ingest, retrieve, synthesize',
    icon: 'BookMarked',
    color: '#06B6D4',
    agents: ['scribe', 'minerva'],
    tools: [
      { viewId: 'knowledge-hub', label: 'Knowledge Hub', description: 'Corpus browser + search', icon: 'Library', category: 'analyze' },
      { viewId: 'docs', label: 'Docs Hub', description: 'Internal docs', icon: 'BookOpen', category: 'manage' },
      { viewId: 'memory', label: 'Memory', description: 'Project memory + events', icon: 'Brain', category: 'manage' },
      { kitId: 'knowledge-hub', label: 'KB (chat)', description: 'Ask the knowledge base', icon: 'Search', category: 'analyze' },
      { kitId: 'google-rag', label: 'Google RAG (chat)', description: 'Doc-grounded answers', icon: 'FileSearch', category: 'analyze' },
      { kitId: 'notion', label: 'Notion (chat)', description: 'Notion workspace ops', icon: 'NotebookPen', category: 'manage' },
      { kitId: 'docs', label: 'Docs Kit (chat)', description: 'Query internal docs', icon: 'FileText', category: 'analyze' },
      { kitId: 'memory', label: 'Memory (chat)', description: 'Read/write agent memory', icon: 'Database', category: 'manage' },
    ],
    primaryKits: ['knowledge-hub', 'google-rag', 'docs', 'notion', 'memory', 'storage-supabase'],
    memoryTags: ['knowledge', 'research', 'docs'],
  },
  {
    id: 'voice-studio',
    label: 'Voice Studio',
    tagline: 'Live voice, cloning, narration — the audio forge',
    icon: 'Mic',
    color: '#A78BFA',
    agents: ['muse', 'hermes'],
    tools: [
      { viewId: 'voice-studio', label: 'Voice Studio', description: 'Live + recorded voice workbench', icon: 'Mic', category: 'generate' },
      { viewId: 'audio-router', label: 'Audio Router', description: 'Route audio across devices', icon: 'SlidersHorizontal', category: 'manage' },
      { kitId: 'deepgram', label: 'Deepgram (chat)', description: 'STT + transcription', icon: 'AudioLines', category: 'analyze' },
      { kitId: 'elevenlabs', label: 'ElevenLabs (chat)', description: 'TTS + voice cloning', icon: 'Volume2', category: 'generate' },
      { kitId: 'voice-ai', label: 'Voice AI (chat)', description: 'Unified voice orchestration', icon: 'Waves', category: 'generate' },
      { kitId: 'vapi', label: 'Vapi (chat)', description: 'Voice agents over phone', icon: 'PhoneCall', category: 'automate' },
    ],
    primaryKits: ['deepgram', 'elevenlabs', 'voice-ai', 'vapi'],
    memoryTags: ['voice', 'audio'],
  },
  {
    id: 'strategy-intelligence',
    label: 'Strategy & Intelligence',
    tagline: 'Research, forecast, decide',
    icon: 'Target',
    color: '#6366F1',
    agents: ['minerva', 'aegis', 'vulcan'],
    tools: [
      { viewId: 'intelligence', label: 'Intelligence', description: 'Intel dashboard', icon: 'Binoculars', category: 'analyze' },
      { viewId: 'signals', label: 'Signals', description: 'Trigger feed', icon: 'Radio', category: 'analyze' },
      { viewId: 'compliance-hub', label: 'Compliance Hub', description: 'Rules, fraud, dunning, tax', icon: 'ShieldCheck', category: 'manage' },
      { viewId: 'audit-log', label: 'Audit Log', description: 'System audit trail', icon: 'ScrollText', category: 'analyze' },
      { kitId: 'openai', label: 'OpenAI (chat)', description: 'GPT reasoning fallback', icon: 'Sparkles', category: 'analyze' },
      { kitId: 'perplexity' as string, label: 'Perplexity (chat)', description: 'Web-grounded research', icon: 'Globe', category: 'analyze' },
      { kitId: 'bing', label: 'Bing (chat)', description: 'Web search', icon: 'Globe2', category: 'analyze' },
      { kitId: 'compliance', label: 'Compliance (chat)', description: 'Compliance ops', icon: 'ShieldAlert', category: 'manage' },
    ],
    primaryKits: ['openai', 'bing', 'compliance', 'naos-command', 'google-analytics'],
    memoryTags: ['strategy', 'intelligence', 'compliance'],
  },
  {
    id: 'ops-infra',
    label: 'Ops / Infra',
    tagline: 'Reliability, infra, device mesh',
    icon: 'ServerCog',
    color: '#14B8A6',
    agents: ['sentry', 'vulcan'],
    tools: [
      { viewId: 'device-hub', label: 'Device Hub', description: 'Device mesh', icon: 'MonitorSmartphone', category: 'manage' },
      { viewId: 'operator-control', label: 'Control Room', description: 'State inspector + telemetry', icon: 'Gauge', category: 'analyze' },
      { viewId: 'connected-sessions', label: 'Sessions', description: 'Live connected sessions', icon: 'Network', category: 'analyze' },
      { kitId: 'docker', label: 'Docker (chat)', description: 'Container ops', icon: 'Container', category: 'manage' },
      { kitId: 'cloudflare', label: 'Cloudflare (chat)', description: 'Edge + KV/R2/D1', icon: 'Cloud', category: 'manage' },
      { kitId: 'device', label: 'Device (chat)', description: 'Device registry', icon: 'Cpu', category: 'manage' },
      { kitId: 'mcp-bridge', label: 'MCP (chat)', description: 'MCP server bridge', icon: 'Plug', category: 'manage' },
      { kitId: 'sentry', label: 'Sentry (chat)', description: 'Errors + releases', icon: 'Siren', category: 'analyze' },
    ],
    primaryKits: ['docker', 'cloudflare', 'device', 'mcp-bridge', 'sentry', 'local-server'],
    memoryTags: ['ops', 'infra', 'reliability'],
  },
  {
    id: 'ventures-workspace',
    label: 'Ventures Workspace',
    tagline: 'Cross-venture ops — one venture at a time',
    icon: 'Building2',
    color: '#F472B6',
    agents: ['forge', 'aegis', 'atlas'],
    tools: [
      { viewId: 'portfolio', label: 'Portfolio', description: 'All ventures snapshot', icon: 'LayoutGrid', category: 'analyze' },
      { viewId: 'venture-profile', label: 'Venture Profile', description: 'Profile & config', icon: 'Building2', category: 'manage' },
      { viewId: 'venture-operations', label: 'Operations', description: 'Venture ops', icon: 'Activity', category: 'manage' },
      { viewId: 'venture-settings', label: 'Settings', description: 'Venture settings', icon: 'Settings2', category: 'manage' },
      { kitId: 'ventures', label: 'Ventures (chat)', description: 'Cross-venture queries', icon: 'Compass', category: 'analyze' },
      { kitId: 'futurestate', label: 'FutureState (chat)', description: 'RWA ops', icon: 'Landmark', category: 'manage' },
      { kitId: 'platform', label: 'Platform (chat)', description: 'Platform-level ops', icon: 'Network', category: 'manage' },
    ],
    primaryKits: ['ventures', 'futurestate', 'platform'],
    memoryTags: ['ventures', 'portfolio'],
  },
  {
    id: 'arcade-lab',
    label: 'Arcade / Lab',
    tagline: 'Experimental — wild ideas & sandbox',
    icon: 'Gamepad2',
    color: '#FB923C',
    agents: ['muse', 'daedalus'],
    tools: [
      { viewId: 'ai-studio', label: 'AI Studio', description: 'Multi-tool playground', icon: 'Sparkles', category: 'generate' },
      { viewId: 'prompt-composer', label: 'Prompt Composer', description: 'Prompt engineering', icon: 'Keyboard', category: 'generate' },
      { viewId: 'stream-deck', label: 'Stream Deck', description: 'Custom control surface', icon: 'Grid3x3', category: 'manage' },
      { kitId: 'browser', label: 'Browser (chat)', description: 'Web automation', icon: 'Globe', category: 'automate' },
      { kitId: 'automation', label: 'Automation (chat)', description: 'n8n-style flows', icon: 'Workflow', category: 'automate' },
      { kitId: 'lmstudio', label: 'LM Studio (chat)', description: 'Local models', icon: 'Cpu', category: 'generate' },
    ],
    primaryKits: ['browser', 'automation', 'lmstudio', 'openai', 'claude'],
    memoryTags: ['experimental', 'lab'],
  },
];

// Foundation suite — added in Phase 3 of Foundation OS v1.
// Exposes the 6 cockpit panels + the 24 NAOS tools from foundation-kit.
SUITES.push({
  id: 'foundation',
  label: 'Foundation',
  tagline: 'IP · counsel · entities · domains · naming — the legal perimeter',
  icon: 'Scale',
  color: '#00F5FF',
  agents: ['aegis', 'atlas', 'argus'],
  tools: [
    { viewId: 'foundation-counsel', label: 'Counsel Cockpit', description: '3 workstream cards + embedded epic board', icon: 'Gavel', category: 'manage' },
    { viewId: 'foundation-ip', label: 'IP Portfolio', description: 'Trademarks / patents / copyrights / trade secrets', icon: 'Shield', category: 'manage' },
    { viewId: 'foundation-domains', label: 'Domain Portfolio', description: '4 urgency lanes — 🔴 Hunter-gating, 🟠 30-day, 🟢 defensive', icon: 'Globe', category: 'manage' },
    { viewId: 'foundation-repos', label: 'Repository Portfolio', description: 'GitHub repos + activity freshness · synced via seed-github-repos.ts', icon: 'Github', category: 'manage' },
    { viewId: 'foundation-deployments', label: 'Deployment Portfolio', description: 'Vercel projects + production/preview deployments · state-tracked', icon: 'Zap', category: 'analyze' },
    { viewId: 'foundation-entities', label: 'Entity Stack', description: 'Root → Crown pair → operating subs → venture SPVs', icon: 'Network', category: 'analyze' },
    { viewId: 'foundation-naming', label: 'Naming Board', description: '6 ratifications + occurrence review + git apply/rollback', icon: 'FileSignature', category: 'manage' },
    { viewId: 'foundation-filings', label: 'Filings Calendar', description: 'Critical 30d / 90d / year-one bands + Blue Marlin gate', icon: 'CalendarCheck', category: 'analyze' },
    { kitId: 'foundation', label: 'Foundation (chat)', description: '24 NAOS tools — IP, counsel, acquisitions, naming', icon: 'Sparkles', category: 'manage' },
  ],
  primaryKits: ['foundation'],
  memoryTags: ['foundation', 'legal', 'ip', 'counsel', 'entities'],
});

export function getSuite(id: SuiteId): SuiteDefinition | undefined {
  return SUITES.find(s => s.id === id);
}
