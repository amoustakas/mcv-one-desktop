import type { VercelRequest, VercelResponse } from '@vercel/node';

async function requireAuth(req: VercelRequest, res: VercelResponse): Promise<string | null> {
  const secretKey = process.env.CLERK_SECRET_KEY;
  if (!secretKey) return 'no-secret';
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : (req.cookies?.__session || null);
  if (!token) { res.status(401).json({ error: 'Authentication required' }); return null; }
  try {
    const { verifyToken } = await import('@clerk/backend');
    const payload = await verifyToken(token, { secretKey });
    return payload.sub;
  } catch { res.status(401).json({ error: 'Invalid session' }); return null; }
}


// ---------------------------------------------------------------------------
// Twilio API — SMS, voice, WhatsApp, verify, lookup, messaging
// Uses Twilio REST API directly (Basic auth with AccountSID:AuthToken)
// ---------------------------------------------------------------------------

const ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID || '';
const AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN || '';
const TWILIO_NUMBER = process.env.TWILIO_PHONE_NUMBER || '';
const TWILIO_API = `https://api.twilio.com/2010-04-01/Accounts/${ACCOUNT_SID}`;
const VERIFY_SID = process.env.TWILIO_VERIFY_SID || '';

function authHeader(): string {
  return 'Basic ' + Buffer.from(`${ACCOUNT_SID}:${AUTH_TOKEN}`).toString('base64');
}

async function twilioFetch(url: string, options?: { method?: string; body?: URLSearchParams }) {
  const res = await fetch(url, {
    method: options?.method || 'GET',
    headers: {
      Authorization: authHeader(),
      ...(options?.body ? { 'Content-Type': 'application/x-www-form-urlencoded' } : {}),
    },
    body: options?.body?.toString(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || `Twilio ${res.status}`);
  return data;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const userId = await requireAuth(req, res);
  if (!userId) return;

  if (!ACCOUNT_SID || !AUTH_TOKEN) {
    return res.status(500).json({ error: 'TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN not configured' });
  }

  const action = (req.method === 'GET' ? req.query.action : req.body?.action) as string;

  try {
    switch (action) {
      // ── Account ──
      case 'get-account':
        return res.json(await twilioFetch(`${TWILIO_API}.json`));

      // ── Send SMS ──
      case 'send-sms': {
        const { to, body, from } = req.body;
        if (!to || !body) return res.status(400).json({ error: 'to and body required' });
        const params = new URLSearchParams({ To: to, Body: body, From: from || TWILIO_NUMBER });
        return res.json(await twilioFetch(`${TWILIO_API}/Messages.json`, { method: 'POST', body: params }));
      }

      // ── Send WhatsApp ──
      case 'send-whatsapp': {
        const { to, body } = req.body;
        if (!to || !body) return res.status(400).json({ error: 'to and body required' });
        const whatsappTo = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`;
        const whatsappFrom = `whatsapp:${TWILIO_NUMBER}`;
        const params = new URLSearchParams({ To: whatsappTo, Body: body, From: whatsappFrom });
        return res.json(await twilioFetch(`${TWILIO_API}/Messages.json`, { method: 'POST', body: params }));
      }

      // ── List Messages ──
      case 'list-messages': {
        const { limit = '20', to, from } = req.query;
        let url = `${TWILIO_API}/Messages.json?PageSize=${limit}`;
        if (to) url += `&To=${encodeURIComponent(to as string)}`;
        if (from) url += `&From=${encodeURIComponent(from as string)}`;
        return res.json(await twilioFetch(url));
      }

      // ── Get Message ──
      case 'get-message': {
        const { sid } = req.query;
        if (!sid) return res.status(400).json({ error: 'sid required' });
        return res.json(await twilioFetch(`${TWILIO_API}/Messages/${sid}.json`));
      }

      // ── Make Voice Call ──
      case 'make-call': {
        const { to, twiml, url: twimlUrl, from } = req.body;
        if (!to) return res.status(400).json({ error: 'to required' });
        const params = new URLSearchParams({ To: to, From: from || TWILIO_NUMBER });
        if (twiml) params.set('Twiml', twiml);
        else if (twimlUrl) params.set('Url', twimlUrl);
        else params.set('Twiml', '<Response><Say>Hello from MCV One.</Say></Response>');
        return res.json(await twilioFetch(`${TWILIO_API}/Calls.json`, { method: 'POST', body: params }));
      }

      // ── List Calls ──
      case 'list-calls': {
        const { limit = '20' } = req.query;
        return res.json(await twilioFetch(`${TWILIO_API}/Calls.json?PageSize=${limit}`));
      }

      // ── Get Call ──
      case 'get-call': {
        const { sid } = req.query;
        if (!sid) return res.status(400).json({ error: 'sid required' });
        return res.json(await twilioFetch(`${TWILIO_API}/Calls/${sid}.json`));
      }

      // ── Phone Number Lookup ──
      case 'lookup': {
        const { phone } = req.query;
        if (!phone) return res.status(400).json({ error: 'phone required' });
        const lookupUrl = `https://lookups.twilio.com/v2/PhoneNumbers/${encodeURIComponent(phone as string)}?Fields=line_type_intelligence,caller_name`;
        return res.json(await twilioFetch(lookupUrl));
      }

      // ── Verify: Send Code ──
      case 'verify-send': {
        if (!VERIFY_SID) return res.status(500).json({ error: 'TWILIO_VERIFY_SID not configured' });
        const { to, channel = 'sms' } = req.body;
        if (!to) return res.status(400).json({ error: 'to required' });
        const verifyUrl = `https://verify.twilio.com/v2/Services/${VERIFY_SID}/Verifications`;
        const params = new URLSearchParams({ To: to, Channel: channel });
        return res.json(await twilioFetch(verifyUrl, { method: 'POST', body: params }));
      }

      // ── Verify: Check Code ──
      case 'verify-check': {
        if (!VERIFY_SID) return res.status(500).json({ error: 'TWILIO_VERIFY_SID not configured' });
        const { to, code } = req.body;
        if (!to || !code) return res.status(400).json({ error: 'to and code required' });
        const checkUrl = `https://verify.twilio.com/v2/Services/${VERIFY_SID}/VerificationChecks`;
        const params = new URLSearchParams({ To: to, Code: code });
        return res.json(await twilioFetch(checkUrl, { method: 'POST', body: params }));
      }

      // ── List Phone Numbers ──
      case 'list-numbers':
        return res.json(await twilioFetch(`${TWILIO_API}/IncomingPhoneNumbers.json`));

      // ── Usage Records ──
      case 'usage': {
        const { category } = req.query;
        let url = `${TWILIO_API}/Usage/Records/ThisMonth.json`;
        if (category) url += `?Category=${category}`;
        return res.json(await twilioFetch(url));
      }

      // ── Overview ──
      case 'overview': {
        const [account, messages, calls] = await Promise.all([
          twilioFetch(`${TWILIO_API}.json`),
          twilioFetch(`${TWILIO_API}/Messages.json?PageSize=5`),
          twilioFetch(`${TWILIO_API}/Calls.json?PageSize=5`),
        ]);
        return res.json({
          friendly_name: account.friendly_name,
          status: account.status,
          type: account.type,
          recent_messages: messages.messages?.length ?? 0,
          recent_calls: calls.calls?.length ?? 0,
        });
      }

      default:
        return res.status(400).json({ error: `Unknown action: ${action}` });
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : (err && typeof err === 'object' && 'message' in err ? String((err as { message: unknown }).message) : JSON.stringify(err));
    return res.status(500).json({ error: message });
  }
}
