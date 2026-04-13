import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ---------------------------------------------------------------------------
// Google Workspace Store — Venture mapping, context, and automation state
// ---------------------------------------------------------------------------

/** Maps Google resources to MCV ventures */
export interface VentureGoogleMapping {
  ventureId: string;
  gmail: {
    labels: string[];         // Gmail label IDs mapped to this venture
    searchQuery?: string;     // Custom search filter (e.g. "from:@betedge.ai")
  };
  calendar: {
    calendarIds: string[];    // Calendar IDs mapped to this venture
    keywords: string[];       // Keywords to auto-tag events (e.g. "BetEdge", "betting")
  };
  drive: {
    folderIds: string[];      // Drive folder IDs for this venture
    sharedDriveId?: string;   // Shared drive ID if applicable
  };
  analytics: {
    propertyId?: string;      // GA4 property ID for this venture
    streamId?: string;        // Data stream ID
  };
  searchConsole: {
    siteUrl?: string;         // Search Console site URL (e.g. "https://betedge.ai")
  };
}

/** Proactive alert configuration */
export interface AlertRule {
  id: string;
  type: 'email_age' | 'meeting_prep' | 'task_overdue' | 'ads_budget' | 'analytics_anomaly' | 'custom';
  name: string;
  enabled: boolean;
  config: Record<string, unknown>;
  lastTriggered?: string;
}

/** Automation rule (event → action) */
export interface AutomationRule {
  id: string;
  name: string;
  enabled: boolean;
  trigger: {
    type: 'schedule' | 'email_received' | 'event_created' | 'task_completed' | 'analytics_threshold';
    config: Record<string, unknown>;
  };
  actions: Array<{
    type: 'send_email' | 'create_task' | 'create_event' | 'notify' | 'run_workflow' | 'pause_ads';
    config: Record<string, unknown>;
  }>;
  lastRun?: string;
  runCount: number;
}

/** Context item surfaced by the intelligence layer */
export interface ContextItem {
  id: string;
  service: 'gmail' | 'calendar' | 'drive' | 'tasks' | 'contacts' | 'analytics' | 'crm';
  type: string;
  title: string;
  subtitle: string;
  timestamp: string;
  relevanceScore: number;
  data: Record<string, unknown>;
  url?: string;
}

interface GoogleWorkspaceState {
  // Venture mappings
  ventureMappings: VentureGoogleMapping[];
  setVentureMapping: (ventureId: string, mapping: Partial<VentureGoogleMapping>) => void;
  getVentureMapping: (ventureId: string) => VentureGoogleMapping | undefined;

  // Contextual intelligence
  contextItems: ContextItem[];
  contextLoading: boolean;
  contextEntity: { type: string; id: string; name: string } | null;
  setContextItems: (items: ContextItem[]) => void;
  setContextLoading: (loading: boolean) => void;
  setContextEntity: (entity: { type: string; id: string; name: string } | null) => void;

  // Proactive alerts
  alertRules: AlertRule[];
  activeAlerts: Array<{ ruleId: string; message: string; severity: 'info' | 'warning' | 'critical'; timestamp: string; dismissed: boolean }>;
  addAlertRule: (rule: AlertRule) => void;
  removeAlertRule: (id: string) => void;
  toggleAlertRule: (id: string) => void;
  addActiveAlert: (alert: { ruleId: string; message: string; severity: 'info' | 'warning' | 'critical' }) => void;
  dismissAlert: (index: number) => void;

  // Automation engine
  automations: AutomationRule[];
  addAutomation: (rule: AutomationRule) => void;
  removeAutomation: (id: string) => void;
  toggleAutomation: (id: string) => void;
  updateAutomationLastRun: (id: string) => void;
}

const DEFAULT_ALERT_RULES: AlertRule[] = [
  {
    id: 'email-age',
    type: 'email_age',
    name: 'Unanswered important emails (>2 days)',
    enabled: true,
    config: { maxAgeDays: 2, fromDomains: [] },
  },
  {
    id: 'meeting-prep',
    type: 'meeting_prep',
    name: 'Upcoming meeting in 30 minutes',
    enabled: true,
    config: { minutesBefore: 30 },
  },
  {
    id: 'task-overdue',
    type: 'task_overdue',
    name: 'Tasks past due date',
    enabled: true,
    config: {},
  },
  {
    id: 'ads-budget',
    type: 'ads_budget',
    name: 'Google Ads spend exceeds daily budget',
    enabled: false,
    config: { thresholdPercent: 120 },
  },
];

export const useGoogleWorkspaceStore = create<GoogleWorkspaceState>()(
  persist(
    (set, get) => ({
      // Venture mappings
      ventureMappings: [],
      setVentureMapping: (ventureId, mapping) => set(s => {
        const existing = s.ventureMappings.find(m => m.ventureId === ventureId);
        if (existing) {
          return {
            ventureMappings: s.ventureMappings.map(m =>
              m.ventureId === ventureId ? { ...m, ...mapping } : m,
            ),
          };
        }
        const newMapping: VentureGoogleMapping = {
          ventureId,
          gmail: { labels: [], ...mapping.gmail },
          calendar: { calendarIds: [], keywords: [], ...mapping.calendar },
          drive: { folderIds: [], ...mapping.drive },
          analytics: { ...mapping.analytics },
          searchConsole: { ...mapping.searchConsole },
        };
        return { ventureMappings: [...s.ventureMappings, newMapping] };
      }),
      getVentureMapping: (ventureId) => get().ventureMappings.find(m => m.ventureId === ventureId),

      // Context
      contextItems: [],
      contextLoading: false,
      contextEntity: null,
      setContextItems: (items) => set({ contextItems: items }),
      setContextLoading: (loading) => set({ contextLoading: loading }),
      setContextEntity: (entity) => set({ contextEntity: entity }),

      // Alerts
      alertRules: DEFAULT_ALERT_RULES,
      activeAlerts: [],
      addAlertRule: (rule) => set(s => ({ alertRules: [...s.alertRules, rule] })),
      removeAlertRule: (id) => set(s => ({ alertRules: s.alertRules.filter(r => r.id !== id) })),
      toggleAlertRule: (id) => set(s => ({
        alertRules: s.alertRules.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r),
      })),
      addActiveAlert: (alert) => set(s => ({
        activeAlerts: [...s.activeAlerts, { ...alert, timestamp: new Date().toISOString(), dismissed: false }].slice(-50),
      })),
      dismissAlert: (index) => set(s => ({
        activeAlerts: s.activeAlerts.map((a, i) => i === index ? { ...a, dismissed: true } : a),
      })),

      // Automations
      automations: [],
      addAutomation: (rule) => set(s => ({ automations: [...s.automations, rule] })),
      removeAutomation: (id) => set(s => ({ automations: s.automations.filter(r => r.id !== id) })),
      toggleAutomation: (id) => set(s => ({
        automations: s.automations.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r),
      })),
      updateAutomationLastRun: (id) => set(s => ({
        automations: s.automations.map(r => r.id === id ? { ...r, lastRun: new Date().toISOString(), runCount: r.runCount + 1 } : r),
      })),
    }),
    {
      name: 'mcv-google-workspace',
      partialize: (s) => ({
        ventureMappings: s.ventureMappings,
        alertRules: s.alertRules,
        automations: s.automations,
      }),
    },
  ),
);
