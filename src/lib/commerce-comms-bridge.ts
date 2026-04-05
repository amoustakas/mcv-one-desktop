import { apiPost } from './api/client';

// ---------------------------------------------------------------------------
// Commerce-Comms Bridge
// Event-driven bridge that triggers communication actions when commerce/CRM
// events occur. Called from mutation onSuccess callbacks.
// ---------------------------------------------------------------------------

// Lazy import to avoid circular deps — the rules store may not be loaded yet
function getRules() {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { useCommsRulesStore } = require('../stores/comms-rules');
    return useCommsRulesStore.getState();
  } catch {
    return null;
  }
}

export interface CommerceEvent {
  type: string; // 'deal.closed_won', 'contact.created', 'invoice.overdue', etc.
  data: Record<string, unknown>;
}

/** Process a commerce event through active trigger rules */
export async function onCommerceEvent(event: CommerceEvent): Promise<{ fired: number; errors: string[] }> {
  const store = getRules();
  if (!store) return { fired: 0, errors: ['Rules store not loaded'] };

  const rules = store.getActiveRules(event.type);
  if (rules.length === 0) return { fired: 0, errors: [] };

  let fired = 0;
  const errors: string[] = [];

  for (const rule of rules) {
    try {
      // Interpolate template with event data
      const message = interpolateTemplate(rule.template, event.data);

      // Execute the action based on the kit tool name
      await executeCommsAction(rule.action, message, event.data);
      fired++;
    } catch (err) {
      errors.push(`Rule "${rule.name}": ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  }

  return { fired, errors };
}

/** Replace {{variable}} placeholders in template with data values */
function interpolateTemplate(template: string, data: Record<string, unknown>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_match, key) => {
    const val = data[key];
    if (val === undefined || val === null) return `{{${key}}}`;
    return String(val);
  });
}

/** Execute a communication action by kit tool name */
async function executeCommsAction(toolName: string, message: string, data: Record<string, unknown>) {
  switch (toolName) {
    case 'gmail_send': {
      const to = (data.contactEmail || data.email || data.to) as string;
      if (!to) throw new Error('No email recipient');
      await apiPost('/api/gmail', {
        action: 'send',
        to,
        subject: (data.subject as string) || 'Notification from MCV One',
        body: message,
      });
      break;
    }

    case 'slack_send_message': {
      const channel = (data.slackChannel || data.channel || 'general') as string;
      await apiPost('/api/slack', { action: 'send-message', channel, text: message });
      break;
    }

    case 'twilio_send_sms': {
      const to = (data.contactPhone || data.phone || data.to) as string;
      if (!to) throw new Error('No phone number');
      await apiPost('/api/twilio', { action: 'send-sms', to, body: message });
      break;
    }

    case 'crm_create_activity': {
      const contactId = data.contactId as string;
      await apiPost('/api/crm', {
        action: 'create-activity',
        type: 'note',
        title: message.slice(0, 200),
        description: message,
        contact_id: contactId || null,
        venture_id: (data.ventureId || 'mcv') as string,
      });
      break;
    }

    default:
      throw new Error(`Unknown action: ${toolName}`);
  }
}

// ── Pre-built event helpers (called from mutation hooks) ──

export function onDealStageChanged(deal: {
  title: string; stage: string; value?: number;
  contact_id?: string; venture_id?: string;
  contactEmail?: string; contactPhone?: string; contactName?: string;
}) {
  if (deal.stage === 'closed_won') {
    onCommerceEvent({
      type: 'deal.closed_won',
      data: {
        dealTitle: deal.title,
        value: deal.value,
        contactId: deal.contact_id,
        contactEmail: deal.contactEmail,
        contactName: deal.contactName,
        ventureId: deal.venture_id,
      },
    });
  } else if (deal.stage === 'closed_lost') {
    onCommerceEvent({
      type: 'deal.closed_lost',
      data: {
        dealTitle: deal.title,
        contactId: deal.contact_id,
        ventureId: deal.venture_id,
      },
    });
  }
}

export function onContactCreated(contact: {
  name: string; email?: string; venture_id?: string;
}) {
  onCommerceEvent({
    type: 'contact.created',
    data: {
      contactName: contact.name,
      contactEmail: contact.email,
      ventureName: contact.venture_id || 'MCV One',
      ventureId: contact.venture_id,
    },
  });
}

export function onInvoiceOverdue(invoice: {
  invoice_number: string; total: number; customer_name?: string;
  customer_email?: string; customer_phone?: string;
}) {
  onCommerceEvent({
    type: 'invoice.overdue',
    data: {
      invoiceNumber: invoice.invoice_number,
      total: `$${invoice.total.toLocaleString()}`,
      customerName: invoice.customer_name,
      contactEmail: invoice.customer_email,
      contactPhone: invoice.customer_phone,
    },
  });
}

export function onPaymentFailed(payment: {
  amount: number; currency: string; customer_name?: string;
}) {
  onCommerceEvent({
    type: 'payment.failed',
    data: {
      amount: `$${payment.amount.toLocaleString()}`,
      currency: payment.currency,
      customerName: payment.customer_name,
      channel: 'general', // Default Slack channel for alerts
    },
  });
}
