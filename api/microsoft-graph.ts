import { getProviderToken } from './_oauth-helper';
import type { VercelRequest, VercelResponse } from '@vercel/node';

// ---------------------------------------------------------------------------
// Microsoft Graph API — Unified gateway for Teams, Outlook, OneDrive,
// SharePoint, Calendar, Contacts, Users, Presence, Planner, To Do
// https://graph.microsoft.com/v1.0
// ---------------------------------------------------------------------------

const GRAPH = 'https://graph.microsoft.com/v1.0';

async function requireAuth(req: VercelRequest, res: VercelResponse): Promise<string | null> {
  const secretKey = process.env.CLERK_SECRET_KEY;
  if (!secretKey) return 'no-secret';
  const t = req.headers.authorization?.startsWith('Bearer ') ? req.headers.authorization.slice(7) : (req.cookies?.__session || null);
  if (!t) { res.status(401).json({ error: 'Auth required' }); return null; }
  try { const { verifyToken } = await import('@clerk/backend'); return (await verifyToken(t, { secretKey })).sub; }
  catch { res.status(401).json({ error: 'Invalid session' }); return null; }
}

async function graphFetch(path: string, token: string, params: Record<string, string> = {}) {
  const qs = new URLSearchParams(params).toString();
  const res = await fetch(`${GRAPH}${path}${qs ? (path.includes('?') ? '&' : '?') + qs : ''}`, {
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  });
  if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.error?.message || `Graph ${res.status}`); }
  if (res.status === 204) return {};
  return res.json();
}

async function graphPost(path: string, token: string, body: unknown, method = 'POST') {
  const res = await fetch(`${GRAPH}${path}`, {
    method, headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.error?.message || `Graph ${res.status}`); }
  if (res.status === 204 || res.status === 202) return { success: true };
  return res.json();
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const userId = await requireAuth(req, res);
  if (!userId) return;

  let token: string;
  try { token = (await getProviderToken(userId, 'microsoft')).token; }
  catch { return res.status(500).json({ error: 'Microsoft not connected. Add in Settings > Integrations.' }); }

  const action = (req.method === 'GET' ? req.query.action : req.body?.action) as string;

  try {
    switch (action) {
      // ═══════════════════════════════════════════════════════════
      // USER / PROFILE
      // ═══════════════════════════════════════════════════════════
      case 'me':
        return res.json(await graphFetch('/me?$select=id,displayName,mail,jobTitle,department,officeLocation,mobilePhone,businessPhones,userPrincipalName', token));

      case 'my-photo':
        return res.json({ url: `${GRAPH}/me/photo/$value`, note: 'Fetch with Authorization header for binary image' });

      case 'list-users': {
        const { top = '25', filter, search } = req.query;
        const params: Record<string, string> = { $top: top as string, $select: 'id,displayName,mail,jobTitle,department' };
        if (filter) params.$filter = filter as string;
        if (search) params.$search = `"displayName:${search}"`;
        return res.json(await graphFetch('/users', token, params));
      }

      case 'get-user': {
        const { id } = req.query;
        if (!id) return res.status(400).json({ error: 'id required' });
        return res.json(await graphFetch(`/users/${id}?$select=id,displayName,mail,jobTitle,department,officeLocation`, token));
      }

      // ═══════════════════════════════════════════════════════════
      // OUTLOOK MAIL
      // ═══════════════════════════════════════════════════════════
      case 'list-mail': {
        const { top = '20', filter, folder = 'inbox' } = req.query;
        const params: Record<string, string> = { $top: top as string, $select: 'id,subject,from,receivedDateTime,isRead,bodyPreview', $orderby: 'receivedDateTime desc' };
        if (filter) params.$filter = filter as string;
        return res.json(await graphFetch(`/me/mailFolders/${folder}/messages`, token, params));
      }

      case 'get-mail': {
        const { id } = req.query;
        if (!id) return res.status(400).json({ error: 'id required' });
        return res.json(await graphFetch(`/me/messages/${id}?$select=id,subject,from,toRecipients,body,receivedDateTime,hasAttachments`, token));
      }

      case 'send-mail': {
        const { to, subject, body: mailBody, contentType = 'HTML', cc, importance = 'normal' } = req.body;
        if (!to || !subject || !mailBody) return res.status(400).json({ error: 'to, subject, body required' });
        const toRecipients = (Array.isArray(to) ? to : [to]).map((e: string) => ({ emailAddress: { address: e } }));
        const msg: Record<string, unknown> = {
          message: {
            subject, importance,
            body: { contentType, content: mailBody },
            toRecipients,
          },
        };
        if (cc) msg.message = { ...(msg.message as Record<string, unknown>), ccRecipients: (Array.isArray(cc) ? cc : [cc]).map((e: string) => ({ emailAddress: { address: e } })) };
        return res.json(await graphPost('/me/sendMail', token, msg));
      }

      case 'search-mail': {
        const { query, top = '10' } = req.query;
        if (!query) return res.status(400).json({ error: 'query required' });
        return res.json(await graphFetch(`/me/messages?$search="${encodeURIComponent(query as string)}"&$top=${top}&$select=id,subject,from,receivedDateTime,bodyPreview`, token));
      }

      case 'list-mail-folders':
        return res.json(await graphFetch('/me/mailFolders?$top=50', token));

      // ═══════════════════════════════════════════════════════════
      // OUTLOOK CALENDAR
      // ═══════════════════════════════════════════════════════════
      case 'list-events': {
        const { top = '20', startDateTime, endDateTime } = req.query;
        const now = new Date().toISOString();
        const nextMonth = new Date(Date.now() + 30 * 86400000).toISOString();
        return res.json(await graphFetch(`/me/calendarView?startDateTime=${startDateTime || now}&endDateTime=${endDateTime || nextMonth}&$top=${top}&$select=id,subject,start,end,location,organizer,isAllDay,webLink&$orderby=start/dateTime`, token));
      }

      case 'create-event': {
        const { subject, start, end, location, body: eventBody, attendees, isOnlineMeeting, timeZone = 'Eastern Standard Time' } = req.body;
        if (!subject || !start || !end) return res.status(400).json({ error: 'subject, start, end required' });
        const event: Record<string, unknown> = {
          subject,
          start: typeof start === 'string' ? { dateTime: start, timeZone } : start,
          end: typeof end === 'string' ? { dateTime: end, timeZone } : end,
          isOnlineMeeting: isOnlineMeeting ?? true,
        };
        if (location) event.location = { displayName: location };
        if (eventBody) event.body = { contentType: 'HTML', content: eventBody };
        if (attendees) event.attendees = (attendees as string[]).map((e) => ({ emailAddress: { address: e }, type: 'required' }));
        return res.json(await graphPost('/me/events', token, event));
      }

      case 'list-calendars':
        return res.json(await graphFetch('/me/calendars?$select=id,name,color,isDefaultCalendar', token));

      // ═══════════════════════════════════════════════════════════
      // OUTLOOK CONTACTS
      // ═══════════════════════════════════════════════════════════
      case 'list-contacts': {
        const { top = '25' } = req.query;
        return res.json(await graphFetch(`/me/contacts?$top=${top}&$select=id,displayName,emailAddresses,businessPhones,companyName,jobTitle`, token));
      }

      case 'create-contact': {
        const { givenName, surname, email, phone, company, jobTitle } = req.body;
        if (!givenName) return res.status(400).json({ error: 'givenName required' });
        return res.json(await graphPost('/me/contacts', token, {
          givenName, surname, companyName: company, jobTitle,
          emailAddresses: email ? [{ address: email }] : [],
          businessPhones: phone ? [phone] : [],
        }));
      }

      // ═══════════════════════════════════════════════════════════
      // MICROSOFT TEAMS
      // ═══════════════════════════════════════════════════════════
      case 'list-teams':
        return res.json(await graphFetch('/me/joinedTeams?$select=id,displayName,description', token));

      case 'list-channels': {
        const { teamId } = req.query;
        if (!teamId) return res.status(400).json({ error: 'teamId required' });
        return res.json(await graphFetch(`/teams/${teamId}/channels?$select=id,displayName,description,membershipType`, token));
      }

      case 'channel-messages': {
        const { teamId, channelId, top = '20' } = req.query;
        if (!teamId || !channelId) return res.status(400).json({ error: 'teamId and channelId required' });
        return res.json(await graphFetch(`/teams/${teamId}/channels/${channelId}/messages?$top=${top}`, token));
      }

      case 'send-channel-message': {
        const { teamId, channelId, content, contentType = 'text' } = req.body;
        if (!teamId || !channelId || !content) return res.status(400).json({ error: 'teamId, channelId, content required' });
        return res.json(await graphPost(`/teams/${teamId}/channels/${channelId}/messages`, token, {
          body: { contentType, content },
        }));
      }

      case 'list-chats': {
        const { top = '20' } = req.query;
        return res.json(await graphFetch(`/me/chats?$top=${top}&$select=id,topic,chatType,lastUpdatedDateTime&$orderby=lastUpdatedDateTime desc`, token));
      }

      case 'chat-messages': {
        const { chatId, top = '20' } = req.query;
        if (!chatId) return res.status(400).json({ error: 'chatId required' });
        return res.json(await graphFetch(`/me/chats/${chatId}/messages?$top=${top}`, token));
      }

      case 'send-chat-message': {
        const { chatId, content, contentType = 'text' } = req.body;
        if (!chatId || !content) return res.status(400).json({ error: 'chatId and content required' });
        return res.json(await graphPost(`/me/chats/${chatId}/messages`, token, { body: { contentType, content } }));
      }

      // ── Teams Presence ──
      case 'my-presence':
        return res.json(await graphFetch('/me/presence', token));

      case 'set-presence': {
        const { availability, activity, expirationDuration = 'PT1H' } = req.body;
        if (!availability) return res.status(400).json({ error: 'availability required (Available, Busy, Away, DoNotDisturb)' });
        return res.json(await graphPost('/me/presence/setPresence', token, {
          sessionId: process.env.MICROSOFT_APP_ID || 'mcv-one',
          availability, activity: activity || availability, expirationDuration,
        }));
      }

      // ── Teams Meetings ──
      case 'create-online-meeting': {
        const { subject, startDateTime, endDateTime, participants } = req.body;
        if (!subject || !startDateTime || !endDateTime) return res.status(400).json({ error: 'subject, startDateTime, endDateTime required' });
        const meeting: Record<string, unknown> = { subject, startDateTime, endDateTime };
        if (participants) meeting.participants = { attendees: (participants as string[]).map((e) => ({ upn: e })) };
        return res.json(await graphPost('/me/onlineMeetings', token, meeting));
      }

      // ═══════════════════════════════════════════════════════════
      // ONEDRIVE
      // ═══════════════════════════════════════════════════════════
      case 'onedrive-root':
        return res.json(await graphFetch('/me/drive/root/children?$select=id,name,size,lastModifiedDateTime,folder,file,webUrl&$top=50', token));

      case 'onedrive-folder': {
        const { itemId } = req.query;
        if (!itemId) return res.status(400).json({ error: 'itemId required' });
        return res.json(await graphFetch(`/me/drive/items/${itemId}/children?$select=id,name,size,lastModifiedDateTime,folder,file,webUrl&$top=50`, token));
      }

      case 'onedrive-search': {
        const { query, top = '20' } = req.query;
        if (!query) return res.status(400).json({ error: 'query required' });
        return res.json(await graphFetch(`/me/drive/root/search(q='${encodeURIComponent(query as string)}')?$top=${top}&$select=id,name,size,webUrl,lastModifiedDateTime`, token));
      }

      case 'onedrive-recent':
        return res.json(await graphFetch('/me/drive/recent?$top=20', token));

      case 'onedrive-shared':
        return res.json(await graphFetch('/me/drive/sharedWithMe?$top=20', token));

      case 'onedrive-storage':
        return res.json(await graphFetch('/me/drive?$select=quota', token));

      case 'onedrive-get-item': {
        const { itemId } = req.query;
        if (!itemId) return res.status(400).json({ error: 'itemId required' });
        return res.json(await graphFetch(`/me/drive/items/${itemId}?$select=id,name,size,file,folder,webUrl,lastModifiedDateTime,createdDateTime,parentReference`, token));
      }

      // ═══════════════════════════════════════════════════════════
      // SHAREPOINT
      // ═══════════════════════════════════════════════════════════
      case 'list-sites': {
        const { search } = req.query;
        if (search) return res.json(await graphFetch(`/sites?search=${encodeURIComponent(search as string)}&$top=20`, token));
        return res.json(await graphFetch('/sites?$top=20&$select=id,displayName,webUrl,description', token));
      }

      case 'get-site': {
        const { siteId } = req.query;
        if (!siteId) return res.status(400).json({ error: 'siteId required' });
        return res.json(await graphFetch(`/sites/${siteId}?$select=id,displayName,webUrl,description`, token));
      }

      case 'site-lists': {
        const { siteId } = req.query;
        if (!siteId) return res.status(400).json({ error: 'siteId required' });
        return res.json(await graphFetch(`/sites/${siteId}/lists?$select=id,displayName,description,list&$top=50`, token));
      }

      case 'list-items': {
        const { siteId, listId, top = '50' } = req.query;
        if (!siteId || !listId) return res.status(400).json({ error: 'siteId and listId required' });
        return res.json(await graphFetch(`/sites/${siteId}/lists/${listId}/items?$expand=fields&$top=${top}`, token));
      }

      // ═══════════════════════════════════════════════════════════
      // ENTRA ID (Azure AD) — Users, Groups, Applications
      // ═══════════════════════════════════════════════════════════
      case 'list-groups': {
        const { top = '25' } = req.query;
        return res.json(await graphFetch(`/groups?$top=${top}&$select=id,displayName,description,groupTypes,mailEnabled,securityEnabled`, token));
      }

      case 'group-members': {
        const { groupId, top = '50' } = req.query;
        if (!groupId) return res.status(400).json({ error: 'groupId required' });
        return res.json(await graphFetch(`/groups/${groupId}/members?$top=${top}&$select=id,displayName,mail,jobTitle`, token));
      }

      case 'list-apps':
        return res.json(await graphFetch('/applications?$top=25&$select=id,displayName,appId,createdDateTime', token));

      case 'org-info':
        return res.json(await graphFetch('/organization?$select=id,displayName,verifiedDomains,city,state,country', token));

      // ═══════════════════════════════════════════════════════════
      // PLANNER (Tasks)
      // ═══════════════════════════════════════════════════════════
      case 'my-planner-tasks':
        return res.json(await graphFetch('/me/planner/tasks?$select=id,title,percentComplete,dueDateTime,priority,assigneePriority', token));

      case 'list-plans': {
        const { groupId } = req.query;
        if (!groupId) return res.status(400).json({ error: 'groupId required' });
        return res.json(await graphFetch(`/groups/${groupId}/planner/plans?$select=id,title,createdDateTime`, token));
      }

      // ═══════════════════════════════════════════════════════════
      // TO DO
      // ═══════════════════════════════════════════════════════════
      case 'todo-lists':
        return res.json(await graphFetch('/me/todo/lists?$select=id,displayName,isOwner', token));

      case 'todo-tasks': {
        const { listId } = req.query;
        if (!listId) return res.status(400).json({ error: 'listId required' });
        return res.json(await graphFetch(`/me/todo/lists/${listId}/tasks?$select=id,title,status,importance,dueDateTime,completedDateTime&$top=50`, token));
      }

      case 'create-todo': {
        const { listId, title, dueDateTime, importance } = req.body;
        if (!listId || !title) return res.status(400).json({ error: 'listId and title required' });
        const task: Record<string, unknown> = { title };
        if (dueDateTime) task.dueDateTime = { dateTime: dueDateTime, timeZone: 'Eastern Standard Time' };
        if (importance) task.importance = importance;
        return res.json(await graphPost(`/me/todo/lists/${listId}/tasks`, token, task));
      }

      // ═══════════════════════════════════════════════════════════
      // OVERVIEW
      // ═══════════════════════════════════════════════════════════
      case 'overview': {
        const [me, teams, mail] = await Promise.all([
          graphFetch('/me?$select=displayName,mail,jobTitle', token),
          graphFetch('/me/joinedTeams?$top=5&$select=displayName', token).catch(() => ({ value: [] })),
          graphFetch('/me/mailFolders/inbox?$select=unreadItemCount,totalItemCount', token).catch(() => ({})),
        ]);
        return res.json({
          user: me.displayName,
          email: me.mail,
          title: me.jobTitle,
          teams: teams.value?.length ?? 0,
          inbox_unread: mail.unreadItemCount ?? 0,
          inbox_total: mail.totalItemCount ?? 0,
        });
      }

      default:
        return res.status(400).json({ error: `Unknown action: ${action}` });
    }
  } catch (err) {
    return res.status(500).json({ error: err instanceof Error ? err.message : 'Unknown error' });
  }
}
