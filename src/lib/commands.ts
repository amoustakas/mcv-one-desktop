export interface CommandResult {
  handled: boolean;
  response?: string;
  __clear?: boolean;
}

// ---------------------------------------------------------------------------
// Types for API data
// ---------------------------------------------------------------------------

interface TaskRecord {
  title: string;
  id?: string;
  status: string;
  venture?: string;
  completed_at?: string;
}

interface DealRecord {
  title: string;
  value: number;
  id?: string;
  stage: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function fetchJson(url: string) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

async function postJson(url: string, body: Record<string, unknown>) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(err.error || `API error: ${res.status}`);
  }
  return res.json();
}

function timeAgo(dateStr: string | number): string {
  const ts = typeof dateStr === 'number' ? dateStr : new Date(dateStr).getTime();
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function currency(value: number | string): string {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return String(value);
  return num.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
}

// ---------------------------------------------------------------------------
// Command Router
// ---------------------------------------------------------------------------

export async function handleCommand(input: string): Promise<CommandResult> {
  const trimmed = input.trim();
  if (!trimmed.startsWith('/')) return { handled: false };

  const parts = trimmed.slice(1).split(/\s+/);
  const cmd = parts[0].toLowerCase();
  const arg = parts.slice(1).join(' ');

  try {
    // =====================================================================
    //  GITHUB COMMANDS
    // =====================================================================

    if (cmd === 'repos') {
      const data = await fetchJson('/api/github?action=repos');
      const lines = data.repos.map(
        (r: { name: string; updated: string; open_issues: number; error?: string }) =>
          r.error
            ? `- **${r.name}** — ${r.error}`
            : `- **${r.name}** — updated ${timeAgo(r.updated)} · ${r.open_issues} issues`,
      );
      return { handled: true, response: `## Repositories\n\n${lines.join('\n')}` };
    }

    if (cmd === 'prs' || cmd === 'pr') {
      const repo = arg || 'mcv-one-desktop';
      const data = await fetchJson(`/api/github?action=prs&repo=${encodeURIComponent(repo)}`);
      if (data.prs.length === 0) {
        return { handled: true, response: `No PRs found for **${repo}**.` };
      }
      const lines = data.prs.map(
        (pr: { number: number; title: string; state: string; merged: string | null; author: string; updated: string }) => {
          const status = pr.merged ? '`merged`' : pr.state === 'open' ? '`open`' : '`closed`';
          return `- #${pr.number} ${status} **${pr.title}** by ${pr.author} · ${timeAgo(pr.updated)}`;
        },
      );
      return { handled: true, response: `## PRs — ${repo}\n\n${lines.join('\n')}` };
    }

    if (cmd === 'commits' || cmd === 'log') {
      const repo = arg || 'mcv-one-desktop';
      const data = await fetchJson(`/api/github?action=commits&repo=${encodeURIComponent(repo)}`);
      const lines = data.commits.map(
        (c: { sha: string; message: string; author: string; date: string }) =>
          `- \`${c.sha}\` ${c.message} — ${c.author}, ${timeAgo(c.date)}`,
      );
      return { handled: true, response: `## Recent Commits — ${repo}\n\n${lines.join('\n')}` };
    }

    // =====================================================================
    //  VERCEL COMMANDS
    // =====================================================================

    if (cmd === 'deploy' || cmd === 'deployments') {
      const data = await fetchJson('/api/vercel-status?action=deployments');
      if (!data.deployments || data.deployments.length === 0) {
        return { handled: true, response: 'No deployments found. Is VERCEL_TOKEN configured?' };
      }
      const lines = data.deployments.map(
        (d: { name: string; state: string; url: string; target: string; created: number }) => {
          const state = d.state === 'READY' ? '`live`' : d.state === 'ERROR' ? '`error`' : `\`${d.state}\``;
          return `- ${state} **${d.name}** → ${d.target || 'preview'} · [${d.url}](${d.url})`;
        },
      );
      return { handled: true, response: `## Vercel Deployments\n\n${lines.join('\n')}` };
    }

    if (cmd === 'projects') {
      const data = await fetchJson('/api/vercel-status?action=projects');
      if (!data.projects || data.projects.length === 0) {
        return { handled: true, response: 'No Vercel projects found.' };
      }
      const lines = data.projects.map(
        (p: { name: string; framework: string; url: string }) =>
          `- **${p.name}** (${p.framework || 'unknown'}) → [${p.url}](${p.url})`,
      );
      return { handled: true, response: `## Vercel Projects\n\n${lines.join('\n')}` };
    }

    if (cmd === 'status') {
      const [gh, vc] = await Promise.all([
        fetchJson('/api/github?action=overview').catch(() => null),
        fetchJson('/api/vercel-status?action=deployments').catch(() => null),
      ]);

      let md = '## System Status\n\n';

      if (gh) {
        md += '### GitHub Repos\n\n';
        md += '| Repo | Last Push | Issues |\n|------|-----------|--------|\n';
        for (const r of gh.repos) {
          md += `| ${r.name} | ${r.updated ? timeAgo(r.updated) : 'N/A'} | ${r.open_issues} |\n`;
        }
        md += `\n**Recent commits (mcv-one-desktop):**\n`;
        for (const c of gh.recent_commits) {
          md += `- \`${c.sha}\` ${c.message}\n`;
        }
      }

      if (vc?.deployments?.length) {
        md += '\n### Vercel Deployments\n\n';
        const recent = vc.deployments.slice(0, 5);
        for (const d of recent) {
          const state = d.state === 'READY' ? 'live' : d.state;
          md += `- \`${state}\` **${d.name}** → ${d.target || 'preview'}\n`;
        }
      }

      return { handled: true, response: md };
    }

    // =====================================================================
    //  DOCUMENT INTELLIGENCE
    // =====================================================================

    if (cmd === 'docs') {
      const data = await postJson('/api/docs', { action: 'list', venture_id: arg || undefined });
      if (!data.documents?.length) return { handled: true, response: 'No documents found.' };
      const lines = data.documents.map(
        (d: { title: string; doc_type: string; venture_id: string; id: string }) =>
          `- **${d.title}** (${d.doc_type}) — ${d.venture_id} \`${d.id.slice(0, 8)}\``,
      );
      return { handled: true, response: `## Documents\n\n${lines.join('\n')}` };
    }

    if (cmd === 'ask') {
      if (!arg) return { handled: true, response: 'Usage: `/ask <question>` — queries your document library' };
      const data = await postJson('/api/docs', { action: 'query', question: arg });
      let md = `## Answer\n\n${data.answer}`;
      if (data.sources?.length) {
        md += `\n\n**Sources:** ${data.sources.map((s: { title: string }) => s.title).join(', ')}`;
      }
      return { handled: true, response: md };
    }

    if (cmd === 'note') {
      if (!arg) return { handled: true, response: 'Usage: `/note <title> | <content>` — saves a document' };
      const [title, ...rest] = arg.split('|');
      const content = rest.join('|').trim() || title.trim();
      const data = await postJson('/api/docs', {
        action: 'create',
        title: title.trim(),
        content,
        doc_type: 'note',
      });
      return { handled: true, response: `Saved: **${data.document?.title}** \`${data.document?.id?.slice(0, 8)}\`` };
    }

    // =====================================================================
    //  GOOGLE / GEMINI
    // =====================================================================

    if (cmd === 'gemini') {
      if (!arg) return { handled: true, response: 'Usage: `/gemini <prompt>` — sends to Gemini Pro' };
      const data = await postJson('/api/google', { action: 'gemini-generate', prompt: arg });
      return { handled: true, response: data.content || 'No response from Gemini.' };
    }

    if (cmd === 'summarize') {
      if (!arg) return { handled: true, response: 'Usage: `/summarize <text or URL>`' };
      const data = await postJson('/api/google', { action: 'gemini-summarize', text: arg });
      return { handled: true, response: `## Summary\n\n${data.content}` };
    }

    if (cmd === 'places') {
      if (!arg) return { handled: true, response: 'Usage: `/places <search query>` — searches Google Places' };
      const data = await postJson('/api/google', { action: 'places-search', query: arg });
      if (!data.places?.length) return { handled: true, response: 'No places found.' };
      const lines = data.places
        .slice(0, 10)
        .map(
          (p: { name: string; address: string; rating: number }) =>
            `- **${p.name}** — ${p.address} (${p.rating ? p.rating + ' stars' : 'unrated'})`,
        );
      return { handled: true, response: `## Places: ${arg}\n\n${lines.join('\n')}` };
    }

    if (cmd === 'geocode') {
      if (!arg) return { handled: true, response: 'Usage: `/geocode <address>`' };
      const data = await postJson('/api/google', { action: 'maps-geocode', address: arg });
      if (!data.results?.length) return { handled: true, response: 'Address not found.' };
      const r = data.results[0];
      const loc = r.geometry?.location;
      return { handled: true, response: `**${r.formatted_address}**\nLat: ${loc?.lat}, Lng: ${loc?.lng}` };
    }

    // =====================================================================
    //  TASK COMMANDS
    // =====================================================================

    if (cmd === 'task') {
      if (!arg) return { handled: true, response: 'Usage: `/task <title>` — creates a new task' };
      const data = await postJson('/api/tasks', {
        action: 'create',
        task: { title: arg.trim(), status: 'todo' },
      });
      const t = data.task;
      return {
        handled: true,
        response: `## Task Created\n\n- **${t?.title || arg}** — \`${t?.status || 'todo'}\` \`${t?.id?.slice(0, 8) || ''}\``,
      };
    }

    if (cmd === 'tasks') {
      const sub = parts[1]?.toLowerCase();

      // /tasks done
      if (sub === 'done' || sub === 'completed') {
        const data = await postJson('/api/tasks', { action: 'list', status: 'done' });
        const tasks = data.tasks || [];
        if (tasks.length === 0) return { handled: true, response: 'No completed tasks.' };
        const lines = tasks.map(
          (t: { title: string; id: string; completed_at?: string }) =>
            `- ~~${t.title}~~ \`${t.id?.slice(0, 8) || ''}\`${t.completed_at ? ' · ' + timeAgo(t.completed_at) : ''}`,
        );
        return { handled: true, response: `## Completed Tasks\n\n${lines.join('\n')}` };
      }

      // /tasks <venture>
      if (sub && sub !== 'all') {
        const venture = parts.slice(1).join(' ');
        const data = await postJson('/api/tasks', { action: 'list', venture });
        const tasks = data.tasks || [];
        if (tasks.length === 0) return { handled: true, response: `No tasks found for venture **${venture}**.` };
        const grouped = groupBy(tasks as TaskRecord[], (t) => t.status);
        return {
          handled: true,
          response: `## Tasks — ${venture}\n\n${renderTaskGroups(grouped)}`,
        };
      }

      // /tasks (list all)
      const data = await postJson('/api/tasks', { action: 'list' });
      const tasks = data.tasks || [];
      if (tasks.length === 0) return { handled: true, response: 'No tasks found. Create one with `/task <title>`.' };
      const grouped = groupBy(tasks as TaskRecord[], (t) => t.status);
      return {
        handled: true,
        response: `## All Tasks\n\n${renderTaskGroups(grouped)}`,
      };
    }

    // =====================================================================
    //  CRM COMMANDS
    // =====================================================================

    if (cmd === 'contact') {
      if (!arg) return { handled: true, response: 'Usage: `/contact <name> | <email> | <company>`' };
      const segments = arg.split('|').map((s) => s.trim());
      const name = segments[0] || '';
      const email = segments[1] || '';
      const company = segments[2] || '';
      if (!name) return { handled: true, response: 'A contact name is required.' };
      const data = await postJson('/api/crm', {
        action: 'create-contact',
        contact: { name, email: email || undefined, company: company || undefined },
      });
      const c = data.contact;
      let md = `## Contact Created\n\n- **${c?.name || name}**`;
      if (c?.email || email) md += ` · ${c?.email || email}`;
      if (c?.company || company) md += ` · ${c?.company || company}`;
      if (c?.id) md += ` \`${c.id.slice(0, 8)}\``;
      return { handled: true, response: md };
    }

    if (cmd === 'contacts') {
      const data = await postJson('/api/crm', { action: 'list-contacts' });
      const contacts = data.contacts || [];
      if (contacts.length === 0) return { handled: true, response: 'No contacts yet. Add one with `/contact <name> | <email> | <company>`.' };
      let md = '## Contacts\n\n';
      md += '| Name | Email | Company |\n|------|-------|---------|\n';
      for (const c of contacts) {
        md += `| ${c.name || '—'} | ${c.email || '—'} | ${c.company || '—'} |\n`;
      }
      return { handled: true, response: md };
    }

    if (cmd === 'deal') {
      if (!arg) return { handled: true, response: 'Usage: `/deal <title> | <value>`' };
      const segments = arg.split('|').map((s) => s.trim());
      const title = segments[0] || '';
      const value = segments[1] ? parseFloat(segments[1].replace(/[^0-9.-]/g, '')) : 0;
      if (!title) return { handled: true, response: 'A deal title is required.' };
      const data = await postJson('/api/crm', {
        action: 'create-deal',
        deal: { title, value: value || 0 },
      });
      const d = data.deal;
      return {
        handled: true,
        response: `## Deal Created\n\n- **${d?.title || title}** — ${currency(d?.value ?? value)}${d?.id ? ' `' + d.id.slice(0, 8) + '`' : ''}`,
      };
    }

    if (cmd === 'deals') {
      const data = await postJson('/api/crm', { action: 'list-deals' });
      const deals = data.deals || [];
      if (deals.length === 0) return { handled: true, response: 'No deals yet. Create one with `/deal <title> | <value>`.' };
      const grouped = groupBy(deals as DealRecord[], (d) => d.stage || 'Unassigned');
      let md = '## Deals by Stage\n\n';
      for (const [stage, items] of Object.entries(grouped)) {
        const total = items.reduce((sum, d) => sum + (d.value || 0), 0);
        md += `### ${stage} (${items.length}) — ${currency(total)}\n\n`;
        for (const d of items) {
          md += `- **${d.title}** — ${currency(d.value)}${d.id ? ' `' + d.id.slice(0, 8) + '`' : ''}\n`;
        }
        md += '\n';
      }
      return { handled: true, response: md };
    }

    if (cmd === 'pipeline') {
      const data = await postJson('/api/crm', { action: 'list-deals' });
      const deals = data.deals || [];
      if (deals.length === 0) return { handled: true, response: 'Pipeline is empty. Create deals with `/deal <title> | <value>`.' };
      const grouped = groupBy(deals as DealRecord[], (d) => d.stage || 'Unassigned');

      let md = '## Deal Pipeline\n\n';
      md += '| Stage | Count | Total Value |\n|-------|-------|-------------|\n';
      let grandTotal = 0;
      for (const [stage, items] of Object.entries(grouped)) {
        const total = items.reduce((sum, d) => sum + (d.value || 0), 0);
        grandTotal += total;
        md += `| ${stage} | ${items.length} | ${currency(total)} |\n`;
      }
      md += `| **Total** | **${deals.length}** | **${currency(grandTotal)}** |\n`;
      return { handled: true, response: md };
    }

    // =====================================================================
    //  NOTION COMMANDS
    // =====================================================================

    if (cmd === 'notion') {
      const sub = parts[1]?.toLowerCase();

      if (!sub) {
        return {
          handled: true,
          response: [
            '**Notion Commands:**',
            '- `/notion search <query>` — search Notion pages',
            '- `/notion databases` — list databases',
            '- `/notion import <pageId>` — import a page into docs',
          ].join('\n'),
        };
      }

      if (sub === 'search') {
        const query = parts.slice(2).join(' ');
        if (!query) return { handled: true, response: 'Usage: `/notion search <query>`' };
        const data = await postJson('/api/notion', { action: 'search', query });
        const results = data.results || [];
        if (results.length === 0) return { handled: true, response: `No Notion results for "${query}".` };
        const lines = results.map(
          (r: { title: string; type: string; url?: string; id: string }) =>
            `- **${r.title || 'Untitled'}** (${r.type || 'page'})${r.url ? ' · [open](' + r.url + ')' : ''} \`${r.id.slice(0, 8)}\``,
        );
        return { handled: true, response: `## Notion Search: ${query}\n\n${lines.join('\n')}` };
      }

      if (sub === 'databases' || sub === 'dbs') {
        const data = await postJson('/api/notion', { action: 'list-databases' });
        const dbs = data.databases || [];
        if (dbs.length === 0) return { handled: true, response: 'No Notion databases found.' };
        const lines = dbs.map(
          (db: { title: string; id: string; url?: string }) =>
            `- **${db.title || 'Untitled'}** \`${db.id.slice(0, 8)}\`${db.url ? ' · [open](' + db.url + ')' : ''}`,
        );
        return { handled: true, response: `## Notion Databases\n\n${lines.join('\n')}` };
      }

      if (sub === 'import') {
        const pageId = parts[2];
        if (!pageId) return { handled: true, response: 'Usage: `/notion import <pageId>`' };
        // Step 1: fetch the Notion page blocks
        const pageData = await postJson('/api/notion', { action: 'get-page', pageId });
        const title = pageData.title || 'Imported from Notion';
        const content = pageData.content || pageData.markdown || '';
        if (!content) return { handled: true, response: `Could not extract content from Notion page \`${pageId}\`.` };
        // Step 2: save as a doc
        const doc = await postJson('/api/docs', {
          action: 'create',
          title,
          content,
          doc_type: 'notion-import',
        });
        return {
          handled: true,
          response: `## Imported from Notion\n\n- **${doc.document?.title || title}** \`${doc.document?.id?.slice(0, 8) || ''}\`\n- ${content.length} characters imported`,
        };
      }

      return { handled: true, response: `Unknown Notion command: \`${sub}\`. Try \`/notion\` for usage.` };
    }

    // =====================================================================
    //  DRIVE COMMANDS
    // =====================================================================

    if (cmd === 'drive') {
      const sub = parts[1]?.toLowerCase();

      if (!sub) {
        return {
          handled: true,
          response: [
            '**Drive Commands:**',
            '- `/drive search <query>` — search Google Drive',
            '- `/drive list` — list recent files',
            '- `/drive import <fileId>` — import a doc into docs',
          ].join('\n'),
        };
      }

      if (sub === 'search') {
        const query = parts.slice(2).join(' ');
        if (!query) return { handled: true, response: 'Usage: `/drive search <query>`' };
        const data = await postJson('/api/drive', { action: 'search', query });
        const files = data.files || [];
        if (files.length === 0) return { handled: true, response: `No Drive files found for "${query}".` };
        const lines = files.map(
          (f: { name: string; mimeType: string; modifiedTime?: string; id: string; webViewLink?: string }) =>
            `- **${f.name}** (${simplifyMime(f.mimeType)})${f.modifiedTime ? ' · ' + timeAgo(f.modifiedTime) : ''}${f.webViewLink ? ' · [open](' + f.webViewLink + ')' : ''} \`${f.id.slice(0, 8)}\``,
        );
        return { handled: true, response: `## Drive Search: ${query}\n\n${lines.join('\n')}` };
      }

      if (sub === 'list' || sub === 'recent') {
        const data = await postJson('/api/drive', { action: 'list' });
        const files = data.files || [];
        if (files.length === 0) return { handled: true, response: 'No recent Drive files.' };
        const lines = files.map(
          (f: { name: string; mimeType: string; modifiedTime?: string; id: string }) =>
            `- **${f.name}** (${simplifyMime(f.mimeType)})${f.modifiedTime ? ' · ' + timeAgo(f.modifiedTime) : ''} \`${f.id.slice(0, 8)}\``,
        );
        return { handled: true, response: `## Recent Drive Files\n\n${lines.join('\n')}` };
      }

      if (sub === 'import') {
        const fileId = parts[2];
        if (!fileId) return { handled: true, response: 'Usage: `/drive import <fileId>`' };
        // Step 1: export the Drive file as text
        const driveData = await postJson('/api/drive', { action: 'export', fileId });
        const title = driveData.title || driveData.name || 'Imported from Drive';
        const content = driveData.content || driveData.text || '';
        if (!content) return { handled: true, response: `Could not extract content from Drive file \`${fileId}\`.` };
        // Step 2: save as a doc
        const doc = await postJson('/api/docs', {
          action: 'create',
          title,
          content,
          doc_type: 'drive-import',
        });
        return {
          handled: true,
          response: `## Imported from Drive\n\n- **${doc.document?.title || title}** \`${doc.document?.id?.slice(0, 8) || ''}\`\n- ${content.length} characters imported`,
        };
      }

      return { handled: true, response: `Unknown Drive command: \`${sub}\`. Try \`/drive\` for usage.` };
    }

    // =====================================================================
    //  SYSTEM COMMANDS
    // =====================================================================

    if (cmd === 'health') {
      const data = await fetchJson('/api/health');
      const checks = data.services || data;
      let md = '## API Health\n\n';
      if (typeof checks === 'object' && !Array.isArray(checks)) {
        md += '| Service | Status |\n|---------|--------|\n';
        for (const [service, status] of Object.entries(checks)) {
          const icon = status === 'ok' || status === 'healthy' || status === true ? 'ok' : 'down';
          md += `| ${service} | \`${icon}\` |\n`;
        }
      } else {
        md += `\`\`\`json\n${JSON.stringify(data, null, 2)}\n\`\`\``;
      }
      return { handled: true, response: md };
    }

    if (cmd === 'version') {
      let version = 'unknown';
      try {
        const data = await fetchJson('/api/health');
        version = data.version || version;
      } catch {
        // fall through
      }
      return {
        handled: true,
        response: `**Aegis Command Center** — v${version}\n\nRuntime: Next.js on Vercel\nPlatform: ${typeof navigator !== 'undefined' ? navigator.userAgent.split(' ').pop() : 'server'}`,
      };
    }

    if (cmd === 'clear') {
      return { handled: true, __clear: true, response: '' };
    }

    if (cmd === 'venture') {
      if (!arg) return { handled: true, response: 'Usage: `/venture <name>` — switch to a venture context' };
      // Store venture context for subsequent commands
      if (typeof window !== 'undefined') {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (window as any).__activeVenture = arg.trim();
      }
      return {
        handled: true,
        response: `## Venture Context\n\nSwitched to **${arg.trim()}**. Subsequent commands will scope to this venture where applicable.`,
      };
    }

    // =====================================================================
    //  HELP
    // =====================================================================

    if (cmd === 'help') {
      return {
        handled: true,
        response: `## Aegis Command Center

### GitHub
| Command | Description |
|---------|-------------|
| \`/status\` | Full system overview (GitHub + Vercel) |
| \`/repos\` | List all GitHub repos |
| \`/prs [repo]\` | Recent pull requests |
| \`/commits [repo]\` | Recent commits |

### Vercel
| Command | Description |
|---------|-------------|
| \`/deployments\` | Vercel deployment history |
| \`/projects\` | Vercel projects list |

### Intelligence
| Command | Description |
|---------|-------------|
| \`/docs [venture]\` | List documents in library |
| \`/ask <question>\` | Query docs with Gemini RAG |
| \`/note <title> \\| <content>\` | Save a document/note |
| \`/gemini <prompt>\` | Direct Gemini Pro query |
| \`/summarize <text>\` | Summarize with Gemini Flash |

### Google
| Command | Description |
|---------|-------------|
| \`/places <query>\` | Search Google Places |
| \`/geocode <address>\` | Geocode an address |

### Tasks
| Command | Description |
|---------|-------------|
| \`/task <title>\` | Create a new task |
| \`/tasks\` | List all tasks grouped by status |
| \`/tasks done\` | List completed tasks |
| \`/tasks <venture>\` | List tasks for a venture |

### CRM
| Command | Description |
|---------|-------------|
| \`/contact <name> \\| <email> \\| <company>\` | Create a contact |
| \`/contacts\` | List all contacts |
| \`/deal <title> \\| <value>\` | Create a deal |
| \`/deals\` | List deals grouped by stage |
| \`/pipeline\` | Show deal pipeline summary |

### Notion
| Command | Description |
|---------|-------------|
| \`/notion search <query>\` | Search Notion pages |
| \`/notion databases\` | List Notion databases |
| \`/notion import <pageId>\` | Import a Notion page into docs |

### Google Drive
| Command | Description |
|---------|-------------|
| \`/drive search <query>\` | Search Google Drive |
| \`/drive list\` | List recent Drive files |
| \`/drive import <fileId>\` | Import a Drive doc into docs |

### System
| Command | Description |
|---------|-------------|
| \`/health\` | Show API health status |
| \`/version\` | Show app version |
| \`/clear\` | Clear the chat |
| \`/venture <name>\` | Switch active venture context |
| \`/help\` | Show this command reference |

### Kits
| Command | Description |
|---------|-------------|
| \`/kits\` | List all loaded kits and their tools |
| \`/kit info <id>\` | Show detailed kit information |
| \`/kit disable <id>\` | Disable a loaded kit |
| \`/kit enable <id>\` | Re-enable a disabled kit |`,
      };
    }

    // =====================================================================
    //  KIT COMMANDS
    // =====================================================================

    if (cmd === 'kits') {
      // Dynamic import to avoid circular dependency
      const { useKitStore } = await import('../stores/kits');
      const kits = useKitStore.getState().getLoadedKits();
      if (kits.length === 0) {
        return { handled: true, response: 'No kits loaded.' };
      }
      let md = '## Loaded Kits\n\n';
      for (const kit of kits) {
        const tools = kit.manifest.tools.map((t) => `\`${t.name}\``).join(', ');
        const status = kit.status === 'loaded' ? '`active`' : `\`${kit.status}\``;
        md += `- ${status} **${kit.manifest.name}** (${kit.manifest.id} v${kit.manifest.version})\n`;
        md += `  Tools: ${tools}\n`;
        md += `  Source: ${kit.source} · Scope: ${kit.manifest.ventureScope === '*' ? 'all ventures' : (kit.manifest.ventureScope as string[]).join(', ')}\n\n`;
      }
      return { handled: true, response: md };
    }

    if (cmd === 'kit') {
      const sub = parts[1]?.toLowerCase();
      if (!sub) {
        return {
          handled: true,
          response: '**Kit Commands:**\n- `/kits` — list loaded kits\n- `/kit info <id>` — show kit details\n- `/kit disable <id>` — disable a kit\n- `/kit enable <id>` — enable a kit',
        };
      }

      const { useKitStore } = await import('../stores/kits');

      if (sub === 'info') {
        const kitId = parts[2];
        if (!kitId) return { handled: true, response: 'Usage: `/kit info <kit-id>`' };
        const kits = useKitStore.getState().getLoadedKits();
        const kit = kits.find((k) => k.manifest.id === kitId);
        if (!kit) return { handled: true, response: `Kit "${kitId}" not found.` };

        let md = `## ${kit.manifest.name}\n\n`;
        md += `**ID:** ${kit.manifest.id}\n**Version:** ${kit.manifest.version}\n**Author:** ${kit.manifest.author}\n`;
        md += `**Status:** ${kit.status}\n**Runtime:** ${kit.manifest.runtime}\n**Source:** ${kit.source}\n\n`;
        md += `${kit.manifest.description}\n\n`;
        md += `### Tools\n\n`;
        for (const tool of kit.manifest.tools) {
          md += `- **${tool.name}** — ${tool.description}\n`;
        }
        if (kit.manifest.instructions) {
          md += `\n### Instructions\n\n${kit.manifest.instructions}\n`;
        }
        return { handled: true, response: md };
      }

      if (sub === 'disable') {
        const kitId = parts[2];
        if (!kitId) return { handled: true, response: 'Usage: `/kit disable <kit-id>`' };
        useKitStore.getState().disableKit(kitId);
        return { handled: true, response: `Kit **${kitId}** disabled.` };
      }

      if (sub === 'enable') {
        const kitId = parts[2];
        if (!kitId) return { handled: true, response: 'Usage: `/kit enable <kit-id>`' };
        useKitStore.getState().enableKit(kitId);
        return { handled: true, response: `Kit **${kitId}** enabled.` };
      }

      return { handled: true, response: `Unknown kit command: \`${sub}\`. Try \`/kit\` for usage.` };
    }

    // =====================================================================
    //  FALLBACK
    // =====================================================================

    return { handled: false };
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return { handled: true, response: `**Command error:** ${msg}` };
  }
}

// ---------------------------------------------------------------------------
// Utility functions
// ---------------------------------------------------------------------------

function groupBy<T>(items: T[], keyFn: (item: T) => string): Record<string, T[]> {
  const result: Record<string, T[]> = {};
  for (const item of items) {
    const key = keyFn(item) || 'Other';
    if (!result[key]) result[key] = [];
    result[key].push(item);
  }
  return result;
}

function renderTaskGroups(grouped: Record<string, TaskRecord[]>): string {
  const statusOrder = ['todo', 'in-progress', 'in_progress', 'review', 'blocked', 'done'];
  const statusLabels: Record<string, string> = {
    'todo': 'To Do',
    'in-progress': 'In Progress',
    'in_progress': 'In Progress',
    'review': 'Review',
    'blocked': 'Blocked',
    'done': 'Done',
  };

  const sorted = Object.entries(grouped).sort(([a], [b]) => {
    const ai = statusOrder.indexOf(a);
    const bi = statusOrder.indexOf(b);
    return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
  });

  let md = '';
  for (const [status, tasks] of sorted) {
    const label = statusLabels[status] || status.charAt(0).toUpperCase() + status.slice(1);
    md += `### ${label} (${tasks.length})\n\n`;
    for (const t of tasks) {
      const done = status === 'done';
      const title = done ? `~~${t.title}~~` : `**${t.title}**`;
      md += `- ${title}${t.venture ? ' · ' + t.venture : ''}${t.id ? ' `' + t.id.slice(0, 8) + '`' : ''}\n`;
    }
    md += '\n';
  }
  return md;
}

function simplifyMime(mime: string): string {
  if (!mime) return 'file';
  if (mime.includes('spreadsheet') || mime.includes('excel')) return 'spreadsheet';
  if (mime.includes('document') || mime.includes('word')) return 'doc';
  if (mime.includes('presentation') || mime.includes('powerpoint')) return 'slides';
  if (mime.includes('pdf')) return 'pdf';
  if (mime.includes('image')) return 'image';
  if (mime.includes('folder')) return 'folder';
  if (mime.includes('form')) return 'form';
  if (mime.includes('video')) return 'video';
  if (mime.includes('audio')) return 'audio';
  return mime.split('/').pop()?.split('.').pop() || 'file';
}
