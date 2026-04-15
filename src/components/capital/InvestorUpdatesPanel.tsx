// Investor Updates timeline + inline composer for a round.
// Reads + writes via @mcv/capital-sdk content-integration.
// SPEC-EQC-001 Epic 15 — Content OS integration.

import { useState } from 'react';
import { MessageSquare, Plus, Send, Clock, Eye, EyeOff } from 'lucide-react';
import { GlassCard, Badge, EmptyState, Button, FormField, Input } from '../ui';
import { useRoundUpdates, useCreateRoundContent, usePublishRoundUpdate } from '../../hooks/use-capital';
import type { ContentVisibility } from '@mcv/capital-sdk';

interface Props {
  ventureId: string;
  roundId: string;
}

function timeAgo(iso: string): string {
  const d = (Date.now() - new Date(iso).getTime()) / 1000;
  if (d < 60) return 'just now';
  if (d < 3600) return `${Math.floor(d / 60)}m ago`;
  if (d < 86400) return `${Math.floor(d / 3600)}h ago`;
  return `${Math.floor(d / 86400)}d ago`;
}

export default function InvestorUpdatesPanel({ ventureId, roundId }: Props) {
  const { data: updates = [], isLoading } = useRoundUpdates(roundId, { includeDrafts: true, limit: 50 });
  const create = useCreateRoundContent();
  const publish = usePublishRoundUpdate();

  const [composing, setComposing] = useState(false);
  const [title, setTitle] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [body, setBody] = useState('');
  const [visibility, setVisibility] = useState<ContentVisibility>('internal');
  const [publishNow, setPublishNow] = useState(true);

  function reset() {
    setTitle(''); setExcerpt(''); setBody(''); setVisibility('internal'); setPublishNow(true); setComposing(false);
  }

  async function handleSubmit() {
    if (!title.trim() || !body.trim()) return;
    try {
      await create.mutateAsync({
        ventureId,
        roundId,
        role: 'update',
        contentType: 'capital_investor_update',
        title: title.trim(),
        bodyMarkdown: body.trim(),
        excerpt: excerpt.trim() || undefined,
        visibility,
        publishImmediately: publishNow,
      });
      reset();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to create update');
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <h2 style={{ fontSize: 14, color: 'var(--text-muted)', margin: 0 }}>
          <MessageSquare size={14} style={{ display: 'inline', marginRight: 4 }} />
          Investor Updates ({updates.length})
        </h2>
        {!composing && (
          <Button variant="ghost" icon={<Plus size={13} />} onClick={() => setComposing(true)}>
            New update
          </Button>
        )}
      </div>

      {composing && (
        <GlassCard style={{ padding: 16, marginBottom: 12 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <FormField label="Title" required>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Monthly update — October 2026" autoFocus />
            </FormField>
            <FormField label="One-line excerpt" hint="Surfaced in the timeline before the investor expands the update">
              <Input value={excerpt} onChange={(e) => setExcerpt(e.target.value)} placeholder="Closed first $250K, product beta live, hiring ML engineer." />
            </FormField>
            <FormField label="Body (markdown)" required>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={8}
                placeholder={'## Product\n\n- Beta launched to first 50 investors.\n- Key metric: 42% DAU activation.\n\n## Team\n\n- Hired Jane as VP Product.\n\n## Ask\n\n- Intros to Series A leads in fintech.'}
                style={{
                  width: '100%', padding: 10, fontSize: 13, fontFamily: 'monospace',
                  background: 'var(--bg-elevated)', color: 'var(--text)',
                  border: '1px solid var(--border-subtle)', borderRadius: 4, resize: 'vertical',
                }}
              />
            </FormField>
            <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, cursor: 'pointer' }}>
                <input
                  type="radio"
                  checked={visibility === 'internal'}
                  onChange={() => setVisibility('internal')}
                  style={{ accentColor: 'var(--cyan)' }}
                />
                <EyeOff size={12} />
                Internal (portal investors only)
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, cursor: 'pointer' }}>
                <input
                  type="radio"
                  checked={visibility === 'public'}
                  onChange={() => setVisibility('public')}
                  style={{ accentColor: 'var(--cyan)' }}
                />
                <Eye size={12} />
                Public (launchpad page)
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, cursor: 'pointer', marginLeft: 'auto' }}>
                <input
                  type="checkbox"
                  checked={publishNow}
                  onChange={(e) => setPublishNow(e.target.checked)}
                  style={{ accentColor: 'var(--cyan)' }}
                />
                Publish immediately
              </label>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <Button variant="ghost" onClick={reset}>Cancel</Button>
              <Button
                variant="primary"
                icon={<Send size={13} />}
                onClick={handleSubmit}
                disabled={!title.trim() || !body.trim() || create.isPending}
                loading={create.isPending}
              >
                {publishNow ? 'Publish' : 'Save draft'}
              </Button>
            </div>
          </div>
        </GlassCard>
      )}

      {isLoading ? (
        <div style={{ padding: 16, color: 'var(--text-muted)', fontSize: 12 }}>Loading updates…</div>
      ) : !updates.length && !composing ? (
        <EmptyState
          icon={<MessageSquare size={24} />}
          title="No updates yet"
          description="Share the first milestone update with your committed investors."
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {updates.map((u) => {
            const c = u.content;
            const isDraft = c.status === 'draft';
            const when = c.publishedAt ?? c.createdAt;
            return (
              <GlassCard key={c.id} style={{ padding: 14 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>{c.title}</div>
                    {c.excerpt && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>{c.excerpt}</div>}
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      {isDraft ? (
                        <Badge color="#6B7280">draft</Badge>
                      ) : (
                        <Badge color={c.visibility === 'public' ? '#00F0FF' : '#8B5CF6'}>
                          {c.visibility === 'public' ? 'public' : 'investor-visible'}
                        </Badge>
                      )}
                      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                        <Clock size={10} style={{ display: 'inline', marginRight: 3 }} />
                        {timeAgo(when)}
                      </span>
                    </div>
                  </div>
                  {isDraft && (
                    <Button
                      variant="ghost"
                      onClick={() => publish.mutate({ contentId: c.id, visibility: 'internal' })}
                      disabled={publish.isPending}
                    >
                      Publish
                    </Button>
                  )}
                </div>
                {c.bodyMarkdown && (
                  <details style={{ marginTop: 8 }}>
                    <summary style={{ cursor: 'pointer', fontSize: 11, color: 'var(--text-muted)' }}>Expand body</summary>
                    <pre style={{
                      whiteSpace: 'pre-wrap',
                      fontSize: 12,
                      marginTop: 8,
                      padding: 10,
                      background: 'var(--bg-elevated)',
                      borderRadius: 4,
                      fontFamily: 'inherit',
                    }}>
                      {c.bodyMarkdown}
                    </pre>
                  </details>
                )}
              </GlassCard>
            );
          })}
        </div>
      )}
    </div>
  );
}
