import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ---------------------------------------------------------------------------
// Comms Trigger Rules Store — automation rules that fire comms on events
// ---------------------------------------------------------------------------

export interface CommsTriggerRule {
  id: string;
  name: string;
  eventType: string;
  action: string;       // kit tool name
  template: string;     // message template with {{variable}} placeholders
  enabled: boolean;
  ventureScope: string[];
}

interface CommsRulesState {
  rules: CommsTriggerRule[];
  addRule: (rule: Omit<CommsTriggerRule, 'id'>) => void;
  updateRule: (id: string, updates: Partial<CommsTriggerRule>) => void;
  removeRule: (id: string) => void;
  toggleRule: (id: string) => void;
  getActiveRules: (eventType: string) => CommsTriggerRule[];
}

const DEFAULT_RULES: CommsTriggerRule[] = [
  {
    id: 'default-deal-won',
    name: 'Deal Won \u2192 Congratulations Email',
    eventType: 'deal.closed_won',
    action: 'gmail_send',
    template: 'Congratulations! The deal "{{dealTitle}}" has been closed successfully.',
    enabled: true,
    ventureScope: [],
  },
  {
    id: 'default-deal-lost',
    name: 'Deal Lost \u2192 Log Activity',
    eventType: 'deal.closed_lost',
    action: 'crm_create_activity',
    template: 'Deal "{{dealTitle}}" was lost. Reason: {{notes}}',
    enabled: true,
    ventureScope: [],
  },
  {
    id: 'default-invoice-overdue',
    name: 'Invoice Overdue \u2192 SMS Reminder',
    eventType: 'invoice.overdue',
    action: 'twilio_send_sms',
    template: 'Reminder: Invoice {{invoiceNumber}} of {{total}} is overdue. Please process payment.',
    enabled: true,
    ventureScope: [],
  },
  {
    id: 'default-payment-failed',
    name: 'Payment Failed \u2192 Alert CEO',
    eventType: 'payment.failed',
    action: 'slack_send_message',
    template: '\u26a0\ufe0f Payment failed for {{customerName}}: {{amount}} {{currency}}',
    enabled: true,
    ventureScope: [],
  },
  {
    id: 'default-new-contact',
    name: 'New Contact \u2192 Welcome Email',
    eventType: 'contact.created',
    action: 'gmail_send',
    template: 'Welcome to the {{ventureName}} family! Looking forward to working together.',
    enabled: true,
    ventureScope: [],
  },
  {
    id: 'default-task-overdue',
    name: 'Task Overdue \u2192 Slack Alert',
    eventType: 'task.overdue',
    action: 'slack_send_message',
    template: '\ud83d\udccb Task overdue: "{{taskTitle}}" was due {{dueDate}}',
    enabled: true,
    ventureScope: [],
  },
];

export const useCommsRulesStore = create<CommsRulesState>()(
  persist(
    (set, get) => ({
      rules: DEFAULT_RULES,

      addRule: (rule) =>
        set((state) => ({
          rules: [
            ...state.rules,
            { ...rule, id: `rule-${Date.now()}-${Math.random().toString(36).slice(2, 8)}` },
          ],
        })),

      updateRule: (id, updates) =>
        set((state) => ({
          rules: state.rules.map((r) => (r.id === id ? { ...r, ...updates } : r)),
        })),

      removeRule: (id) =>
        set((state) => ({
          rules: state.rules.filter((r) => r.id !== id),
        })),

      toggleRule: (id) =>
        set((state) => ({
          rules: state.rules.map((r) =>
            r.id === id ? { ...r, enabled: !r.enabled } : r,
          ),
        })),

      getActiveRules: (eventType) =>
        get().rules.filter((r) => r.enabled && r.eventType === eventType),
    }),
    { name: 'mcv-comms-rules' },
  ),
);
