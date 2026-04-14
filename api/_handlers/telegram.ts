import { requireAuth } from './_auth.js';
import type { VercelRequest, VercelResponse } from '@vercel/node';

// ---------------------------------------------------------------------------
// Telegram Bot API — messages, groups, channels, stickers, files, commands
// ---------------------------------------------------------------------------

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
const TG_API = `https://api.telegram.org/bot${BOT_TOKEN}`;

async function tgFetch(method: string, params?: Record<string, unknown>) {
  const res = await fetch(`${TG_API}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: params ? JSON.stringify(params) : undefined,
  });
  const data = await res.json();
  if (!data.ok) throw new Error(data.description || `Telegram ${method} failed`);
  return data.result;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const userId = await requireAuth(req, res);
  if (!userId) return;
  if (!BOT_TOKEN) return res.status(500).json({ error: 'TELEGRAM_BOT_TOKEN not configured' });

  const action = (req.method === 'GET' ? req.query.action : req.body?.action) as string;

  try {
    switch (action) {
      // ── Bot Info ──
      case 'get-me':
        return res.json(await tgFetch('getMe'));

      // ── Send Messages ──
      case 'send-message': {
        const { chatId, text, parseMode = 'HTML', replyToMessageId, disableNotification } = req.body;
        if (!chatId || !text) return res.status(400).json({ error: 'chatId and text required' });
        return res.json(await tgFetch('sendMessage', {
          chat_id: chatId, text, parse_mode: parseMode,
          reply_to_message_id: replyToMessageId, disable_notification: disableNotification,
        }));
      }

      case 'send-photo': {
        const { chatId, photo, caption } = req.body;
        if (!chatId || !photo) return res.status(400).json({ error: 'chatId and photo (URL) required' });
        return res.json(await tgFetch('sendPhoto', { chat_id: chatId, photo, caption }));
      }

      case 'send-document': {
        const { chatId, document, caption } = req.body;
        if (!chatId || !document) return res.status(400).json({ error: 'chatId and document (URL) required' });
        return res.json(await tgFetch('sendDocument', { chat_id: chatId, document, caption }));
      }

      case 'send-location': {
        const { chatId, latitude, longitude } = req.body;
        if (!chatId || !latitude || !longitude) return res.status(400).json({ error: 'chatId, latitude, longitude required' });
        return res.json(await tgFetch('sendLocation', { chat_id: chatId, latitude, longitude }));
      }

      case 'send-poll': {
        const { chatId, question, options, isAnonymous = true, type = 'regular' } = req.body;
        if (!chatId || !question || !options) return res.status(400).json({ error: 'chatId, question, options required' });
        return res.json(await tgFetch('sendPoll', { chat_id: chatId, question, options, is_anonymous: isAnonymous, type }));
      }

      // ── Edit / Delete ──
      case 'edit-message': {
        const { chatId, messageId, text, parseMode = 'HTML' } = req.body;
        if (!chatId || !messageId || !text) return res.status(400).json({ error: 'chatId, messageId, text required' });
        return res.json(await tgFetch('editMessageText', { chat_id: chatId, message_id: messageId, text, parse_mode: parseMode }));
      }

      case 'delete-message': {
        const { chatId, messageId } = req.body;
        if (!chatId || !messageId) return res.status(400).json({ error: 'chatId and messageId required' });
        return res.json(await tgFetch('deleteMessage', { chat_id: chatId, message_id: messageId }));
      }

      // ── Chat Info ──
      case 'get-chat': {
        const { chatId } = req.query;
        if (!chatId) return res.status(400).json({ error: 'chatId required' });
        return res.json(await tgFetch('getChat', { chat_id: chatId }));
      }

      case 'get-chat-members-count': {
        const { chatId } = req.query;
        if (!chatId) return res.status(400).json({ error: 'chatId required' });
        return res.json(await tgFetch('getChatMemberCount', { chat_id: chatId }));
      }

      case 'get-chat-member': {
        const { chatId, memberId } = req.query;
        if (!chatId || !memberId) return res.status(400).json({ error: 'chatId and memberId required' });
        return res.json(await tgFetch('getChatMember', { chat_id: chatId, user_id: Number(memberId) }));
      }

      // ── Moderation ──
      case 'ban-member': {
        const { chatId, memberId } = req.body;
        if (!chatId || !memberId) return res.status(400).json({ error: 'chatId and memberId required' });
        return res.json(await tgFetch('banChatMember', { chat_id: chatId, user_id: Number(memberId) }));
      }

      case 'unban-member': {
        const { chatId, memberId } = req.body;
        if (!chatId || !memberId) return res.status(400).json({ error: 'chatId and memberId required' });
        return res.json(await tgFetch('unbanChatMember', { chat_id: chatId, user_id: Number(memberId), only_if_banned: true }));
      }

      case 'pin-message': {
        const { chatId, messageId } = req.body;
        if (!chatId || !messageId) return res.status(400).json({ error: 'chatId and messageId required' });
        return res.json(await tgFetch('pinChatMessage', { chat_id: chatId, message_id: messageId }));
      }

      // ── Bot Commands ──
      case 'set-commands': {
        const { commands } = req.body;
        if (!commands) return res.status(400).json({ error: 'commands array required' });
        return res.json(await tgFetch('setMyCommands', { commands }));
      }

      case 'get-commands':
        return res.json(await tgFetch('getMyCommands'));

      // ── Webhooks ──
      case 'set-webhook': {
        const { url: webhookUrl, secret_token } = req.body;
        if (!webhookUrl) return res.status(400).json({ error: 'url required' });
        return res.json(await tgFetch('setWebhook', { url: webhookUrl, secret_token }));
      }

      case 'get-webhook':
        return res.json(await tgFetch('getWebhookInfo'));

      case 'delete-webhook':
        return res.json(await tgFetch('deleteWebhook'));

      // ── Updates (polling) ──
      case 'get-updates': {
        const { offset, limit = 10 } = req.query;
        return res.json(await tgFetch('getUpdates', { offset: offset ? Number(offset) : undefined, limit: Number(limit) }));
      }

      // ── Inline Keyboard ──
      case 'send-inline-keyboard': {
        const { chatId, text, keyboard } = req.body;
        if (!chatId || !text || !keyboard) return res.status(400).json({ error: 'chatId, text, keyboard required' });
        return res.json(await tgFetch('sendMessage', {
          chat_id: chatId, text, reply_markup: { inline_keyboard: keyboard },
        }));
      }

      // ── Stickers ──
      case 'get-sticker-set': {
        const { name } = req.query;
        if (!name) return res.status(400).json({ error: 'name required' });
        return res.json(await tgFetch('getStickerSet', { name }));
      }

      // ── Overview ──
      case 'overview': {
        const [me, webhook] = await Promise.all([
          tgFetch('getMe'),
          tgFetch('getWebhookInfo'),
        ]);
        return res.json({
          bot_name: me.first_name,
          username: me.username,
          can_join_groups: me.can_join_groups,
          webhook_url: webhook.url || 'Not set',
          pending_updates: webhook.pending_update_count,
        });
      }

      default:
        return res.status(400).json({ error: `Unknown action: ${action}` });
    }
  } catch (err) {
    return res.status(500).json({ error: err instanceof Error ? err.message : (err && typeof err === 'object' && 'message' in err ? String((err as { message: unknown }).message) : JSON.stringify(err)) });
  }
}
