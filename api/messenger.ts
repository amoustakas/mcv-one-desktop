import { requireAuth } from './_auth';
import type { VercelRequest, VercelResponse } from '@vercel/node';

// ---------------------------------------------------------------------------
// Facebook Messenger Platform API — send messages, pages, profiles, templates
// Uses Meta Graph API v21.0
// ---------------------------------------------------------------------------

const GRAPH_API = 'https://graph.facebook.com/v21.0';
const PAGE_TOKEN = process.env.MESSENGER_PAGE_TOKEN || process.env.META_PAGE_TOKEN || '';

async function messengerFetch(path: string, token: string, options?: { method?: string; body?: unknown }) {
  const sep = path.includes('?') ? '&' : '?';
  const url = `${GRAPH_API}${path}${sep}access_token=${token}`;
  const res = await fetch(url, {
    method: options?.method || 'GET',
    headers: { 'Content-Type': 'application/json' },
    body: options?.body ? JSON.stringify(options.body) : undefined,
  });
  if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.error?.message || `Messenger ${res.status}`); }
  return res.json();
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const userId = await requireAuth(req, res);
  if (!userId) return;
  if (!PAGE_TOKEN) return res.status(500).json({ error: 'MESSENGER_PAGE_TOKEN not configured' });

  const action = (req.method === 'GET' ? req.query.action : req.body?.action) as string;

  try {
    switch (action) {
      // ── Send Text Message ──
      case 'send-text': {
        const { recipientId, text } = req.body;
        if (!recipientId || !text) return res.status(400).json({ error: 'recipientId and text required' });
        return res.json(await messengerFetch('/me/messages', PAGE_TOKEN, {
          method: 'POST', body: { recipient: { id: recipientId }, message: { text }, messaging_type: 'RESPONSE' },
        }));
      }

      // ── Send Template (Generic / Button / Receipt) ──
      case 'send-template': {
        const { recipientId, template } = req.body;
        if (!recipientId || !template) return res.status(400).json({ error: 'recipientId and template required' });
        return res.json(await messengerFetch('/me/messages', PAGE_TOKEN, {
          method: 'POST', body: {
            recipient: { id: recipientId },
            message: { attachment: { type: 'template', payload: template } },
            messaging_type: 'RESPONSE',
          },
        }));
      }

      // ── Send Image / File ──
      case 'send-attachment': {
        const { recipientId, type = 'image', url } = req.body;
        if (!recipientId || !url) return res.status(400).json({ error: 'recipientId and url required' });
        return res.json(await messengerFetch('/me/messages', PAGE_TOKEN, {
          method: 'POST', body: {
            recipient: { id: recipientId },
            message: { attachment: { type, payload: { url, is_reusable: true } } },
            messaging_type: 'RESPONSE',
          },
        }));
      }

      // ── Send Quick Replies ──
      case 'send-quick-replies': {
        const { recipientId, text, quickReplies } = req.body;
        if (!recipientId || !text || !quickReplies) return res.status(400).json({ error: 'recipientId, text, quickReplies required' });
        return res.json(await messengerFetch('/me/messages', PAGE_TOKEN, {
          method: 'POST', body: {
            recipient: { id: recipientId },
            message: { text, quick_replies: quickReplies },
            messaging_type: 'RESPONSE',
          },
        }));
      }

      // ── Sender Actions (typing, mark_seen) ──
      case 'sender-action': {
        const { recipientId, senderAction = 'typing_on' } = req.body;
        if (!recipientId) return res.status(400).json({ error: 'recipientId required' });
        return res.json(await messengerFetch('/me/messages', PAGE_TOKEN, {
          method: 'POST', body: { recipient: { id: recipientId }, sender_action: senderAction },
        }));
      }

      // ── User Profile ──
      case 'get-profile': {
        const { userId: uid } = req.query;
        if (!uid) return res.status(400).json({ error: 'userId required' });
        return res.json(await messengerFetch(`/${uid}?fields=first_name,last_name,profile_pic,locale,timezone,gender`, PAGE_TOKEN));
      }

      // ── Page Info ──
      case 'get-page':
        return res.json(await messengerFetch('/me?fields=name,id,category,fan_count,description,website,picture', PAGE_TOKEN));

      // ── Persistent Menu ──
      case 'set-persistent-menu': {
        const { menuItems } = req.body;
        if (!menuItems) return res.status(400).json({ error: 'menuItems required' });
        return res.json(await messengerFetch('/me/custom_user_settings', PAGE_TOKEN, {
          method: 'POST', body: {
            persistent_menu: [{ locale: 'default', composer_input_disabled: false, call_to_actions: menuItems }],
          },
        }));
      }

      // ── Ice Breakers ──
      case 'set-ice-breakers': {
        const { iceBreakers } = req.body;
        if (!iceBreakers) return res.status(400).json({ error: 'iceBreakers array required' });
        return res.json(await messengerFetch('/me/messenger_profile', PAGE_TOKEN, {
          method: 'POST', body: { ice_breakers: iceBreakers },
        }));
      }

      // ── Get Started Button ──
      case 'set-get-started': {
        const { payload = 'GET_STARTED' } = req.body;
        return res.json(await messengerFetch('/me/messenger_profile', PAGE_TOKEN, {
          method: 'POST', body: { get_started: { payload } },
        }));
      }

      // ── Overview ──
      case 'overview': {
        const page = await messengerFetch('/me?fields=name,id,category,fan_count', PAGE_TOKEN);
        return res.json({ page_name: page.name, page_id: page.id, category: page.category, fans: page.fan_count });
      }

      default:
        return res.status(400).json({ error: `Unknown action: ${action}` });
    }
  } catch (err) {
    return res.status(500).json({ error: err instanceof Error ? err.message : 'Unknown error' });
  }
}
