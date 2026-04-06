// @ts-nocheck
import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { staggerContainer, fadeInUp } from '../../lib/animations';
import { Badge } from '../ui';

/* ─── Types ────────────────────────────────────────────────── */

interface OrgNode {
  agent: any;
  children: OrgNode[];
}

interface Props {
  agents: any[];
  selectedId?: string | null;
  onSelect: (id: string) => void;
}

/* ─── Helpers ─────────────────────────────────────────────── */

function tierLabel(tier: number): string {
  switch (tier) {
    case 1: return 'C-Suite';
    case 2: return 'Director';
    case 3: return 'Manager';
    case 4: return 'Lead';
    case 5: return 'IC';
    default: return `T${tier}`;
  }
}

function tierColor(tier: number): string {
  switch (tier) {
    case 1: return '#F59E0B';
    case 2: return '#8B5CF6';
    case 3: return '#00F5FF';
    case 4: return '#10B981';
    default: return '#94A3B8';
  }
}

function tierGradient(tier: number): string {
  switch (tier) {
    case 1: return 'linear-gradient(90deg, transparent, #F59E0B, transparent)';
    case 2: return 'linear-gradient(90deg, transparent, #00F5FF, transparent)';
    default: return 'linear-gradient(90deg, transparent, #8B5CF6, transparent)';
  }
}

/** Derive mood emoji from emotional state (simplified) */
function moodEmoji(emotional?: any): string {
  if (!emotional) return '';
  const scores: [string, number][] = [
    ['momentum', emotional.momentum ?? 0],
    ['excitement', emotional.excitement ?? 0],
    ['caution', emotional.caution ?? 0],
    ['frustration', emotional.frustration ?? 0],
    ['confidence', emotional.confidence ?? 0],
  ];
  scores.sort((a, b) => b[1] - a[1]);
  switch (scores[0][0]) {
    case 'momentum': return '\u26A1';
    case 'excitement': return '\uD83D\uDD25';
    case 'caution': return '\uD83D\uDD0D';
    case 'frustration': return '\uD83D\uDE24';
    case 'confidence': return '\uD83D\uDCAA';
    default: return '\u26A1';
  }
}

/** Build a tree from a flat agents list using reportsTo relationships */
function buildTree(agents: any[]): OrgNode[] {
  const map = new Map<string, OrgNode>();
  for (const agent of agents) {
    map.set(agent.id, { agent, children: [] });
  }

  const roots: OrgNode[] = [];
  for (const agent of agents) {
    const node = map.get(agent.id)!;
    if (agent.reportsTo && map.has(agent.reportsTo)) {
      map.get(agent.reportsTo)!.children.push(node);
    } else {
      roots.push(node);
    }
  }

  // Sort children by tier then codename
  function sortChildren(nodes: OrgNode[]) {
    nodes.sort((a, b) => a.agent.tier - b.agent.tier || a.agent.codename.localeCompare(b.agent.codename));
    for (const n of nodes) sortChildren(n.children);
  }
  sortChildren(roots);

  return roots;
}

/* ─── TreeNode (recursive) ────────────────────────────────── */

interface TreeNodeProps {
  node: OrgNode;
  depth: number;
  selectedId?: string | null;
  onSelect: (id: string) => void;
  emotionalMap?: Map<string, any>;
}

function TreeNode({ node, depth, selectedId, onSelect, emotionalMap }: TreeNodeProps) {
  const [expanded, setExpanded] = useState(depth < 2);
  const hasChildren = node.children.length > 0;
  const isSelected = selectedId === node.agent.id;
  const emoji = moodEmoji(emotionalMap?.get(node.agent.id));
  const tColor = tierColor(node.agent.tier);
  const gradient = tierGradient(node.agent.tier);

  const handleToggle = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setExpanded((p) => !p);
  }, []);

  const handleSelect = useCallback(() => {
    onSelect(node.agent.id);
  }, [onSelect, node.agent.id]);

  return (
    <div className="naos-oc-branch">
      {/* Connector line from parent */}
      {depth > 0 && (
        <div className="naos-oc-connector" />
      )}

      <motion.div
        className={`naos-oc-node ${isSelected ? 'naos-oc-node--selected' : ''}`}
        onClick={handleSelect}
        variants={fadeInUp}
        whileHover={{ y: -2, transition: { duration: 0.15 } }}
        whileTap={{ scale: 0.98, transition: { duration: 0.08 } }}
      >
        {/* Tier gradient top border */}
        <div className="naos-oc-node-accent" style={{ background: gradient }} />

        <div className="naos-oc-node-body">
          <div className="naos-oc-node-top">
            <span className="naos-oc-codename">{node.agent.codename}</span>
            {emoji && <span className="naos-oc-mood">{emoji}</span>}
          </div>
          <span className="naos-oc-title">{node.agent.title}</span>
          <div className="naos-oc-node-footer">
            <Badge color={tColor} size="sm">{tierLabel(node.agent.tier)}</Badge>
            {hasChildren && (
              <button
                className={`naos-oc-toggle ${expanded ? 'naos-oc-toggle--open' : ''}`}
                onClick={handleToggle}
                aria-label={expanded ? 'Collapse' : 'Expand'}
              >
                <ChevronRight size={12} />
                <span className="naos-oc-count">{node.children.length}</span>
              </button>
            )}
          </div>
        </div>
      </motion.div>

      {/* Children */}
      <AnimatePresence>
        {hasChildren && expanded && (
          <motion.div
            className="naos-oc-children"
            variants={staggerContainer}
            initial="hidden"
            animate="show"
            exit="hidden"
          >
            {node.children.map((child) => (
              <TreeNode
                key={child.agent.id}
                node={child}
                depth={depth + 1}
                selectedId={selectedId}
                onSelect={onSelect}
                emotionalMap={emotionalMap}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── OrgChartTree (root) ─────────────────────────────────── */

export default function OrgChartTree({ agents, selectedId, onSelect }: Props) {
  const tree = useMemo(() => buildTree(agents), [agents]);

  // Build emotional lookup map if agents have emotional data attached
  const emotionalMap = useMemo(() => {
    const m = new Map<string, any>();
    for (const a of agents) {
      if (a.emotional) m.set(a.id, a.emotional);
    }
    return m;
  }, [agents]);

  if (agents.length === 0) {
    return (
      <div className="naos-oc-empty">
        <span>No agents in the organization</span>
      </div>
    );
  }

  return (
    <>
      <motion.div
        className="naos-oc-root"
        variants={staggerContainer}
        initial="hidden"
        animate="show"
      >
        {tree.map((rootNode) => (
          <TreeNode
            key={rootNode.agent.id}
            node={rootNode}
            depth={0}
            selectedId={selectedId}
            onSelect={onSelect}
            emotionalMap={emotionalMap}
          />
        ))}
      </motion.div>

      <style>{orgChartStyles}</style>
    </>
  );
}

/* ─── Styles ──────────────────────────────────────────────── */

const orgChartStyles = `
  .naos-oc-root {
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 8px 0;
  }

  .naos-oc-empty {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 48px 16px;
    font-size: 0.8rem;
    color: var(--text-muted, #64748B);
    font-style: italic;
  }

  /* ── Branch ── */
  .naos-oc-branch {
    position: relative;
    padding-left: 0;
  }
  .naos-oc-children > .naos-oc-branch {
    padding-left: 28px;
  }

  /* ── Connector Lines ── */
  .naos-oc-connector {
    position: absolute;
    top: 0;
    left: -14px;
    width: 14px;
    height: 22px;
    border-left: 1px solid rgba(255, 255, 255, 0.08);
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    border-bottom-left-radius: 6px;
  }
  /* Vertical line continuing down for siblings */
  .naos-oc-children > .naos-oc-branch:not(:last-child)::before {
    content: "";
    position: absolute;
    top: 0;
    left: 14px;
    bottom: 0;
    width: 1px;
    background: rgba(255, 255, 255, 0.06);
  }

  /* ── Node ── */
  .naos-oc-node {
    position: relative;
    padding: 0;
    border-radius: 10px;
    border: 1px solid rgba(255, 255, 255, 0.06);
    background: rgba(6, 13, 20, 0.6);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    cursor: pointer;
    transition: border-color 0.2s, box-shadow 0.2s;
    overflow: hidden;
    max-width: 220px;
  }
  .naos-oc-node:hover {
    border-color: rgba(255, 255, 255, 0.12);
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  }
  .naos-oc-node--selected {
    border-color: rgba(0, 245, 255, 0.4) !important;
    box-shadow: 0 0 0 1px rgba(0, 245, 255, 0.2), 0 0 24px rgba(0, 245, 255, 0.08) !important;
  }

  .naos-oc-node-accent {
    height: 2px;
    width: 100%;
  }

  .naos-oc-node-body {
    padding: 10px 12px 8px;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .naos-oc-node-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 6px;
  }

  .naos-oc-codename {
    font-size: 0.88rem;
    font-weight: 700;
    color: var(--text-primary, #E2E8F0);
    letter-spacing: 0.04em;
    text-transform: uppercase;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .naos-oc-mood {
    font-size: 0.85rem;
    line-height: 1;
    flex-shrink: 0;
  }

  .naos-oc-title {
    font-size: 0.68rem;
    color: var(--text-muted, #64748B);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .naos-oc-node-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 6px;
    margin-top: 6px;
  }

  /* ── Toggle ── */
  .naos-oc-toggle {
    display: inline-flex;
    align-items: center;
    gap: 3px;
    padding: 2px 6px;
    border-radius: 6px;
    border: 1px solid rgba(255, 255, 255, 0.06);
    background: rgba(255, 255, 255, 0.03);
    color: var(--text-secondary, #94A3B8);
    cursor: pointer;
    transition: all 0.2s;
    font-size: 0.65rem;
  }
  .naos-oc-toggle:hover {
    background: rgba(255, 255, 255, 0.08);
    border-color: rgba(255, 255, 255, 0.12);
    color: var(--text-primary, #E2E8F0);
  }
  .naos-oc-toggle svg {
    transition: transform 0.25s ease;
  }
  .naos-oc-toggle--open svg {
    transform: rotate(90deg);
  }
  .naos-oc-count {
    font-variant-numeric: tabular-nums;
    font-weight: 600;
  }

  /* ── Children ── */
  .naos-oc-children {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-top: 8px;
  }

  /* ── Responsive ── */
  @media (max-width: 640px) {
    .naos-oc-node {
      max-width: 100%;
    }
    .naos-oc-children > .naos-oc-branch {
      padding-left: 20px;
    }
  }
`;
