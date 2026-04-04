export interface CommandResult {
  handled: boolean;
  response?: string;
}

async function fetchJson(url: string) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
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

      case 'help': {
        return {
          handled: true,
          response: `## NAOS Commands

| Command | Description |
|---------|-------------|
| \`/status\` | Full system overview (GitHub + Vercel) |
| \`/repos\` | List all GitHub repos |
| \`/prs [repo]\` | Recent PRs (default: mcv-one-desktop) |
| \`/commits [repo]\` | Recent commits |
| \`/deployments\` | Vercel deployment history |
| \`/projects\` | Vercel projects list |
| \`/help\` | This help menu |

Anything else gets sent to Claude as a regular message.`,
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
