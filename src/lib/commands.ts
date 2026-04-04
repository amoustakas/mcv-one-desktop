export interface CommandResult {
  handled: boolean;
  response?: string;
}

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

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export async function handleCommand(input: string): Promise<CommandResult> {
  const trimmed = input.trim();
  if (!trimmed.startsWith('/')) return { handled: false };

  const parts = trimmed.slice(1).split(/\s+/);
  const cmd = parts[0].toLowerCase();
  const arg = parts.slice(1).join(' ');

  try {
    switch (cmd) {
      case 'repos': {
        const data = await fetchJson('/api/github?action=repos');
        const lines = data.repos.map((r: { name: string; updated: string; open_issues: number; error?: string }) =>
          r.error
            ? `- **${r.name}** — ${r.error}`
            : `- **${r.name}** — updated ${timeAgo(r.updated)} · ${r.open_issues} issues`
        );
        return { handled: true, response: `## Repositories\n\n${lines.join('\n')}` };
      }

      case 'prs':
      case 'pr': {
        const repo = arg || 'mcv-one-desktop';
        const data = await fetchJson(`/api/github?action=prs&repo=${encodeURIComponent(repo)}`);
        if (data.prs.length === 0) {
          return { handled: true, response: `No PRs found for **${repo}**.` };
        }
        const lines = data.prs.map((pr: { number: number; title: string; state: string; merged: string | null; author: string; updated: string }) => {
          const status = pr.merged ? '`merged`' : pr.state === 'open' ? '`open`' : '`closed`';
          return `- #${pr.number} ${status} **${pr.title}** by ${pr.author} · ${timeAgo(pr.updated)}`;
        });
        return { handled: true, response: `## PRs — ${repo}\n\n${lines.join('\n')}` };
      }

      case 'commits':
      case 'log': {
        const repo = arg || 'mcv-one-desktop';
        const data = await fetchJson(`/api/github?action=commits&repo=${encodeURIComponent(repo)}`);
        const lines = data.commits.map((c: { sha: string; message: string; author: string; date: string }) =>
          `- \`${c.sha}\` ${c.message} — ${c.author}, ${timeAgo(c.date)}`
        );
        return { handled: true, response: `## Recent Commits — ${repo}\n\n${lines.join('\n')}` };
      }

      case 'deploy':
      case 'deployments': {
        const data = await fetchJson('/api/vercel-status?action=deployments');
        if (!data.deployments || data.deployments.length === 0) {
          return { handled: true, response: 'No deployments found. Is VERCEL_TOKEN configured?' };
        }
        const lines = data.deployments.map((d: { name: string; state: string; url: string; target: string; created: number }) => {
          const state = d.state === 'READY' ? '`live`' : d.state === 'ERROR' ? '`error`' : `\`${d.state}\``;
          return `- ${state} **${d.name}** → ${d.target || 'preview'} · [${d.url}](${d.url})`;
        });
        return { handled: true, response: `## Vercel Deployments\n\n${lines.join('\n')}` };
      }

      case 'projects': {
        const data = await fetchJson('/api/vercel-status?action=projects');
        if (!data.projects || data.projects.length === 0) {
          return { handled: true, response: 'No Vercel projects found.' };
        }
        const lines = data.projects.map((p: { name: string; framework: string; url: string }) =>
          `- **${p.name}** (${p.framework || 'unknown'}) → [${p.url}](${p.url})`
        );
        return { handled: true, response: `## Vercel Projects\n\n${lines.join('\n')}` };
      }

      case 'status': {
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

      // --- Document Intelligence ---
      case 'docs': {
        const data = await postJson('/api/docs', { action: 'list', venture_id: arg || undefined });
        if (!data.documents?.length) return { handled: true, response: 'No documents found.' };
        const lines = data.documents.map((d: { title: string; doc_type: string; venture_id: string; id: string }) =>
          `- **${d.title}** (${d.doc_type}) — ${d.venture_id} \`${d.id.slice(0, 8)}\``
        );
        return { handled: true, response: `## Documents\n\n${lines.join('\n')}` };
      }

      case 'ask': {
        if (!arg) return { handled: true, response: 'Usage: `/ask <question>` — queries your document library' };
        const data = await postJson('/api/docs', { action: 'query', question: arg });
        let md = `## Answer\n\n${data.answer}`;
        if (data.sources?.length) {
          md += `\n\n**Sources:** ${data.sources.map((s: { title: string }) => s.title).join(', ')}`;
        }
        return { handled: true, response: md };
      }

      case 'note': {
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

      // --- Google / Gemini ---
      case 'gemini': {
        if (!arg) return { handled: true, response: 'Usage: `/gemini <prompt>` — sends to Gemini Pro' };
        const data = await postJson('/api/google', { action: 'gemini-generate', prompt: arg });
        return { handled: true, response: data.content || 'No response from Gemini.' };
      }

      case 'summarize': {
        if (!arg) return { handled: true, response: 'Usage: `/summarize <text or URL>`' };
        const data = await postJson('/api/google', { action: 'gemini-summarize', text: arg });
        return { handled: true, response: `## Summary\n\n${data.content}` };
      }

      case 'places': {
        if (!arg) return { handled: true, response: 'Usage: `/places <search query>` — searches Google Places' };
        const data = await postJson('/api/google', { action: 'places-search', query: arg });
        if (!data.places?.length) return { handled: true, response: 'No places found.' };
        const lines = data.places.slice(0, 10).map((p: { name: string; address: string; rating: number }) =>
          `- **${p.name}** — ${p.address} (${p.rating ? p.rating + ' stars' : 'unrated'})`
        );
        return { handled: true, response: `## Places: ${arg}\n\n${lines.join('\n')}` };
      }

      case 'geocode': {
        if (!arg) return { handled: true, response: 'Usage: `/geocode <address>`' };
        const data = await postJson('/api/google', { action: 'maps-geocode', address: arg });
        if (!data.results?.length) return { handled: true, response: 'Address not found.' };
        const r = data.results[0];
        const loc = r.geometry?.location;
        return { handled: true, response: `**${r.formatted_address}**\nLat: ${loc?.lat}, Lng: ${loc?.lng}` };
      }

      case 'help': {
        return {
          handled: true,
          response: `## Aegis Commands

### System
| Command | Description |
|---------|-------------|
| \`/status\` | Full system overview (GitHub + Vercel) |
| \`/repos\` | List all GitHub repos |
| \`/prs [repo]\` | Recent PRs |
| \`/commits [repo]\` | Recent commits |
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

| \`/help\` | This menu |`,
        };
      }

      default:
        return { handled: false };
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return { handled: true, response: `**Command error:** ${msg}` };
  }
}
