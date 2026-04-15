import type { KitManifest, KitToolHandler, KitExecutionContext } from '../types';

async function twilioApi(action: string, params: Record<string, unknown>, ctx: KitExecutionContext) {
  const isRead = ['list-messages', 'list-calls', 'get-message', 'get-call', 'lookup', 'list-numbers', 'usage', 'overview', 'get-account'].includes(action);
  if (isRead) {
    const query = new URLSearchParams({ action, ...Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined).map(([k, v]) => [k, String(v)])) }).toString();
    const res = await ctx.fetch(`/api/twilio?${query}`);
    if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.error || `Twilio ${res.status}`); }
    return res.json();
  }
  const res = await ctx.fetch('/api/twilio', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, ...params }),
  });
  if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.error || `Twilio ${res.status}`); }
  return res.json();
}

const sendSms: KitToolHandler = async (input, ctx) => {
  const data = await twilioApi('send-sms', { to: input.to, body: input.body, from: input.from }, ctx);
  return { success: true, data, displayMarkdown: `SMS sent to ${input.to}: "${input.body}" (SID: ${data.sid})` };
};

const sendWhatsApp: KitToolHandler = async (input, ctx) => {
  const data = await twilioApi('send-whatsapp', { to: input.to, body: input.body }, ctx);
  return { success: true, data, displayMarkdown: `WhatsApp sent to ${input.to}: "${input.body}" (SID: ${data.sid})` };
};

const makeCall: KitToolHandler = async (input, ctx) => {
  const data = await twilioApi('make-call', { to: input.to, twiml: input.twiml, from: input.from }, ctx);
  return { success: true, data, displayMarkdown: `Call initiated to ${input.to} (SID: ${data.sid})` };
};

const listMessages: KitToolHandler = async (input, ctx) => {
  const data = await twilioApi('list-messages', { limit: input.limit ?? '10' }, ctx);
  const msgs = data.messages ?? [];
  const lines = msgs.map((m: { sid: string; from: string; to: string; body: string; status: string }) =>
    `- ${m.from} → ${m.to}: "${(m.body || '').slice(0, 60)}" — **${m.status}**`);
  return { success: true, data: msgs, displayMarkdown: `## Messages (${msgs.length})\n\n${lines.join('\n')}` };
};

const phoneLookup: KitToolHandler = async (input, ctx) => {
  const data = await twilioApi('lookup', { phone: input.phone }, ctx);
  return { success: true, data, displayMarkdown: `## Lookup: ${input.phone}\n\n- **Valid:** ${data.valid}\n- **Type:** ${data.line_type_intelligence?.type || 'unknown'}\n- **Carrier:** ${data.carrier?.name || 'unknown'}\n- **Country:** ${data.country_code}` };
};

const verifySend: KitToolHandler = async (input, ctx) => {
  const data = await twilioApi('verify-send', { to: input.to, channel: input.channel ?? 'sms' }, ctx);
  return { success: true, data, displayMarkdown: `Verification code sent to ${input.to} via ${input.channel || 'sms'} — status: ${data.status}` };
};

const verifyCheck: KitToolHandler = async (input, ctx) => {
  const data = await twilioApi('verify-check', { to: input.to, code: input.code }, ctx);
  return { success: true, data, displayMarkdown: `Verification check for ${input.to}: **${data.status}** (valid: ${data.valid})` };
};

const twilioOverview: KitToolHandler = async (_input, ctx) => {
  const data = await twilioApi('overview', {}, ctx);
  return { success: true, data, displayMarkdown: `## Twilio Overview\n\n- **Account:** ${data.friendly_name}\n- **Status:** ${data.status}\n- **Recent Messages:** ${data.recent_messages}\n- **Recent Calls:** ${data.recent_calls}` };
};

export const manifest: KitManifest = {
  id: 'twilio-comms',
  name: 'Twilio Communications',
  version: '1.0.0',
  description: 'Twilio SMS, voice, WhatsApp, phone verification, and number lookup.',
  author: 'MCV',
  capabilities: ['network', 'credentials'],
  runtime: 'inline',
  ventureScope: '*',
  instructions: 'Use twilio tools for SMS, voice calls, WhatsApp messages, phone verification, and number lookups.',
  tools: [
    { name: 'twilio_send_sms', description: 'Send an SMS message.', input_schema: { type: 'object', properties: { to: { type: 'string', description: 'Phone number (+1...)' }, body: { type: 'string', description: 'Message text' }, from: { type: 'string', description: 'Override sender number' } }, required: ['to', 'body'] } },
    { name: 'twilio_send_whatsapp', description: 'Send a WhatsApp message.', input_schema: { type: 'object', properties: { to: { type: 'string', description: 'Phone (+1...) or whatsapp:+1...' }, body: { type: 'string' } }, required: ['to', 'body'] } },
    { name: 'twilio_make_call', description: 'Initiate a voice call.', input_schema: { type: 'object', properties: { to: { type: 'string' }, twiml: { type: 'string', description: 'TwiML instructions' }, from: { type: 'string' } }, required: ['to'] } },
    { name: 'twilio_list_messages', description: 'List recent SMS/MMS messages.', input_schema: { type: 'object', properties: { limit: { type: 'string' } } } },
    { name: 'twilio_phone_lookup', description: 'Look up a phone number for carrier, type, and validity.', input_schema: { type: 'object', properties: { phone: { type: 'string', description: 'Phone number to look up' } }, required: ['phone'] } },
    { name: 'twilio_verify_send', description: 'Send a verification code via SMS or voice.', input_schema: { type: 'object', properties: { to: { type: 'string' }, channel: { type: 'string', description: 'sms, call, email, or whatsapp' } }, required: ['to'] } },
    { name: 'twilio_verify_check', description: 'Check a verification code.', input_schema: { type: 'object', properties: { to: { type: 'string' }, code: { type: 'string' } }, required: ['to', 'code'] } },
    { name: 'twilio_overview', description: 'Get Twilio account summary.', input_schema: { type: 'object', properties: {} } },
  ],
};

export const handlers: Record<string, KitToolHandler> = {
  twilio_send_sms: sendSms,
  twilio_send_whatsapp: sendWhatsApp,
  twilio_make_call: makeCall,
  twilio_list_messages: listMessages,
  twilio_phone_lookup: phoneLookup,
  twilio_verify_send: verifySend,
  twilio_verify_check: verifyCheck,
  twilio_overview: twilioOverview,
};
