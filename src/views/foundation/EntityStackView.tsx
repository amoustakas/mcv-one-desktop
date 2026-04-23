// Entity Stack — Root → Crown pair → operating subs → venture SPVs.
// Crown entities (mcv-inc-crown, mcv-ltd-crown) render with a non-interactive
// 👑 badge. The foundation store's updateEntity() throws if any code tries
// to patch a Crown's protected fields.

import { useEffect, useMemo } from 'react';
import { Network, Crown } from 'lucide-react';
import { PageShell, PageHeader, GlassCard } from '../../components/ui';
import { Chip } from './_chip';
import { useFoundationStore, type EntityStackNode } from '../../stores/foundation';

interface TreeNode extends EntityStackNode {
  children: TreeNode[];
}

function buildTree(nodes: EntityStackNode[]): TreeNode[] {
  const byId = new Map<string, TreeNode>();
  for (const n of nodes) byId.set(n.id, { ...n, children: [] });
  const roots: TreeNode[] = [];
  for (const n of byId.values()) {
    if (n.parentEntityId && byId.has(n.parentEntityId)) {
      byId.get(n.parentEntityId)!.children.push(n);
    } else {
      roots.push(n);
    }
  }
  // Sort: crown first, then by label
  const sortNodes = (list: TreeNode[]) => {
    list.sort((a, b) => {
      if (a.isCrown !== b.isCrown) return a.isCrown ? -1 : 1;
      return a.label.localeCompare(b.label);
    });
    list.forEach((n) => sortNodes(n.children));
  };
  sortNodes(roots);
  return roots;
}

export default function EntityStackView() {
  const { entityStack, loading, errors, fetchEntityStack } = useFoundationStore();

  useEffect(() => {
    fetchEntityStack();
  }, [fetchEntityStack]);

  const tree = useMemo(() => buildTree(entityStack), [entityStack]);
  const crownCount = entityStack.filter((e) => e.isCrown).length;

  return (
    <PageShell>
      <PageHeader
        title="Entity Stack"
        subtitle={`${entityStack.length} entities · ${crownCount} crown-tier · 3-layer architecture (Root → Federation → Ventures)`}
        icon={<Network size={20} />}
      />

      {errors.entityStack && (
        <GlassCard style={{ padding: 12, marginBottom: 16, borderColor: 'var(--error)' }}>
          <span style={{ color: 'var(--error)' }}>{errors.entityStack}</span>
        </GlassCard>
      )}

      {loading.entityStack && entityStack.length === 0 && (
        <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)' }}>Loading entity stack…</div>
      )}

      {/* Crown monument strip */}
      {crownCount > 0 && (
        <GlassCard style={{ padding: 16, marginBottom: 20,
          background: 'linear-gradient(135deg, rgba(0,245,255,0.06), rgba(139,92,246,0.06))',
          borderColor: 'rgba(0,245,255,0.3)' }}>
          <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 1.2, color: 'var(--cyan)', marginBottom: 10 }}>
            👑 Sovereign Crowns · Never for sale · Succession-only
          </div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {entityStack.filter((e) => e.isCrown).map((c) => (
              <div key={c.id} style={{
                padding: 12,
                background: 'rgba(0,245,255,0.05)',
                border: '1px solid rgba(0,245,255,0.2)',
                borderRadius: 8,
                minWidth: 220,
              }}>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center', fontWeight: 600, marginBottom: 4 }}>
                  <Crown size={14} style={{ color: 'var(--cyan)' }} />
                  {c.label}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                  {c.id} · {c.jurisdiction} · {c.entityType}
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      )}

      {/* Full tree */}
      <GlassCard style={{ padding: 16 }}>
        <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 1.2, color: 'var(--text-muted)', marginBottom: 12 }}>
          Full Entity Tree
        </div>
        {tree.map((n) => <EntityRow key={n.id} node={n} depth={0} />)}
      </GlassCard>
    </PageShell>
  );
}

function EntityRow({ node, depth }: { node: TreeNode; depth: number }) {
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        paddingLeft: depth * 20,
      }}>
        {depth > 0 && <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>→</span>}
        {node.isCrown && <Crown size={14} style={{ color: 'var(--cyan)' }} />}
        <span style={{ fontWeight: node.isCrown ? 600 : 500 }}>{node.label}</span>
        <Chip tone="muted">{node.jurisdiction}</Chip>
        <Chip tone="muted">{node.entityType}</Chip>
        {!node.active && <Chip tone="warning">inactive</Chip>}
        <code style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 4 }}>{node.id}</code>
      </div>
      {node.children.map((c) => <EntityRow key={c.id} node={c} depth={depth + 1} />)}
    </div>
  );
}
