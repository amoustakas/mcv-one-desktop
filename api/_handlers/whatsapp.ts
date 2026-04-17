import { requireAuth } from './_auth.js';
import type { VercelRequest, VercelResponse } from '@vercel/node';

import { requestLogger } from '../../src/lib/server/logger';
// ---------------------------------------------------------------------------
// WhatsApp Business Cloud API — messages, templates, media, contacts, profile
// Uses Meta Graph API v21.0
// ---------------------------------------------------------------------------

const GRAPH_API = 'https://graph.facebook.com/v21.0';
const WA_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN || process.env.META_ACCESS_TOKEN || '';
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID || '';
const BUSINESS_ID = process.env.WHATSAPP_BUSINESS_ACCOUNT_ID || '';

async function waFetch(path: string, options?: { method?: string; body?: unknown }) {
  const res = await fetch(`${GRAPH_API}${path}`, {
    method: options?.method || 'GET',
    headers: { Authorization: `Bearer ${WA_TOKEN}`, 'Content-Type': 'application/json' },
    body: options?.body ? JSON.stringify(options.body) : undefined,
  });
  if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.error?.message || `WhatsApp ${res.status}`); }
  return res.json();
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { log: __log, correlationId: __correlationId } = requestLogger(req as unknown as { headers?: Record<string, unknown>; url?: string; method?: string });
  try { res.setHeader('x-correlation-id', __correlationId); } catch { /* headers already sent */ }
  const __start = Date.now();
  __log.info({ event: 'request_in' });
  res.on('finish', () => {
    __log.info({ event: 'request_out', status: res.statusCode, duration_ms: Date.now() - __start });
  });
  res.on('close', () => {
    if (!res.writableEnded) {
      __log.warn({ event: 'request_abort', duration_ms: Date.now() - __start });
    }
  });
  const userId = await requireAuth(req, res);
  if (!userId) return;
  if (!WA_TOKEN) return res.status(500).json({ error: 'WHATSAPP_ACCESS_TOKEN not configured' });

  const action = (req.method === 'GET' ? req.query.action : req.body?.action) as string;
  const phoneId = (req.query.phoneNumberId || req.body?.phoneNumberId || PHONE_NUMBER_ID) as string;

  try {
    switch (action) {
      // ── Send Text Message ──
      case 'send-text': {
        const { to, text } = req.body;
        if (!to || !text) return res.status(400).json({ error: 'to and text required' });
        return res.json(await waFetch(`/${phoneId}/messages`, {
          method: 'POST', body: { messaging_product: 'whatsapp', to, type: 'text', text: { body: text } },
        }));
      }

      // ── Send Template Message ──
      case 'send-template': {
        const { to, templateName, languageCode = 'en', components } = req.body;
        if (!to || !templateName) return res.status(400).json({ error: 'to and templateName required' });
        return res.json(await waFetch(`/${phoneId}/messages`, {
          method: 'POST', body: {
            messaging_product: 'whatsapp', to, type: 'template',
            template: { name: templateName, language: { code: languageCode }, components },
          },
        }));
      }

      // ── Send Image ──
      case 'send-image': {
        const { to, imageUrl, caption } = req.body;
        if (!to || !imageUrl) return res.status(400).json({ error: 'to and imageUrl required' });
        return res.json(await waFetch(`/${phoneId}/messages`, {
          method: 'POST', body: { messaging_product: 'whatsapp', to, type: 'image', image: { link: imageUrl, caption } },
        }));
      }

      // ── Send Document ──
      case 'send-document': {
        const { to, documentUrl, filename, caption } = req.body;
        if (!to || !documentUrl) return res.status(400).json({ error: 'to and documentUrl required' });
        return res.json(await waFetch(`/${phoneId}/messages`, {
          method: 'POST', body: { messaging_product: 'whatsapp', to, type: 'document', document: { link: documentUrl, filename, caption } },
        }));
      }

      // ── Send Location ──
      case 'send-location': {
        const { to, latitude, longitude, name, address } = req.body;
        if (!to || !latitude || !longitude) return res.status(400).json({ error: 'to, latitude, longitude required' });
        return res.json(await waFetch(`/${phoneId}/messages`, {
          method: 'POST', body: { messaging_product: 'whatsapp', to, type: 'location', location: { latitude, longitude, name, address } },
        }));
      }

      // ── Send Interactive (Buttons / List) ──
      case 'send-interactive': {
        const { to, interactive } = req.body;
        if (!to || !interactive) return res.status(400).json({ error: 'to and interactive object required' });
        return res.json(await waFetch(`/${phoneId}/messages`, {
          method: 'POST', body: { messaging_product: 'whatsapp', to, type: 'interactive', interactive },
        }));
      }

      // ── Mark as Read ──
      case 'mark-read': {
        const { messageId } = req.body;
        if (!messageId) return res.status(400).json({ error: 'messageId required' });
        return res.json(await waFetch(`/${phoneId}/messages`, {
          method: 'POST', body: { messaging_product: 'whatsapp', status: 'read', message_id: messageId },
        }));
      }

      // ── Templates ──
      case 'list-templates': {
        const bid = (req.query.businessId || BUSINESS_ID) as string;
        if (!bid) return res.status(400).json({ error: 'businessId required' });
        return res.json(await waFetch(`/${bid}/message_templates?limit=50`));
      }

      case 'create-template': {
        const { name, category, language = 'en', components: templateComponents } = req.body;
        const bid = req.body.businessId || BUSINESS_ID;
        if (!bid || !name || !category) return res.status(400).json({ error: 'businessId, name, category required' });
        return res.json(await waFetch(`/${bid}/message_templates`, {
          method: 'POST', body: { name, category, language, components: templateComponents },
        }));
      }

      // ── Business Profile ──
      case 'get-profile':
        return res.json(await waFetch(`/${phoneId}/whatsapp_business_profile?fields=about,address,description,email,profile_picture_url,websites,vertical`));

      case 'update-profile': {
        const { about, description, email, websites, address } = req.body;
        return res.json(await waFetch(`/${phoneId}/whatsapp_business_profile`, {
          method: 'POST', body: { messaging_product: 'whatsapp', about, description, email, websites, address },
        }));
      }

      // ── Phone Numbers ──
      case 'get-phone-number':
        return res.json(await waFetch(`/${phoneId}?fields=verified_name,code_verification_status,display_phone_number,quality_rating,platform_type,throughput`));

      case 'list-phone-numbers': {
        const bid = (req.query.businessId || BUSINESS_ID) as string;
        if (!bid) return res.status(400).json({ error: 'businessId required' });
        return res.json(await waFetch(`/${bid}/phone_numbers?fields=verified_name,display_phone_number,quality_rating`));
      }

      // ── Media ──
      case 'upload-media': {
        return res.json({ note: 'Media upload requires multipart/form-data. Use the Graph API directly with your token.' });
      }

      case 'get-media': {
        const { mediaId } = req.query;
        if (!mediaId) return res.status(400).json({ error: 'mediaId required' });
        return res.json(await waFetch(`/${mediaId}`));
      }

      // ── Overview ──
      case 'overview': {
        const [profile, phone] = await Promise.all([
          waFetch(`/${phoneId}/whatsapp_business_profile?fields=about,description,vertical`).catch(() => ({})),
          waFetch(`/${phoneId}?fields=verified_name,display_phone_number,quality_rating`).catch(() => ({})),
        ]);
        return res.json({
          phone_number: phone.display_phone_number,
          verified_name: phone.verified_name,
          quality: phone.quality_rating,
          about: profile.data?.[0]?.about,
          vertical: profile.data?.[0]?.vertical,
        });
      }

      default:
        return res.status(400).json({ error: `Unknown action: ${action}` });
    }
  } catch (err) {
    return res.status(500).json({ error: err instanceof Error ? err.message : (err && typeof err === 'object' && 'message' in err ? String((err as { message: unknown }).message) : JSON.stringify(err)) });
  }
}
