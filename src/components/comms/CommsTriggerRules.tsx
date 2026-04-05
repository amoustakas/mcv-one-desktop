import { useState } from 'react';
import {
  Settings,
  ToggleLeft,
  ToggleRight,
  Trash2,
  Plus,
  Zap,
  Mail,
  Phone,
  Hash,
  MessageSquare,
} from 'lucide-react';
import { GlassCard, Badge, Button } from '../ui';
import { useCommsRulesStore } from '../../stores/comms-rules';
import type { CommsTriggerRule } from '../../stores/comms-rules';

// ---------------------------------------------------------------------------
// Comms Trigger Rules — automation settings panel
// Maps commerce/CRM events to communications actions
// ---------------------------------------------------------------------------

/** Map action prefixes to display metadata */
const ACTION_META: Record<string, { label: string; color: string; icon: typeof Mail }> = {
  gmail: { label: 'Gmail', color: '#EA4335', icon: Mail },
  slack: { label: 'Slack', color: '#8B5CF6', icon: Hash },
  twilio: { label: 'Twilio', color: '#F97316', icon: Phone },
  crm: { label: 'CRM', color: '#00F5FF', icon: MessageSquare },
};

function getActionMeta(action: string) {
  const prefix = action.split('_')[0];
  return ACTION_META[prefix] ?? { label: action, color: 'var(--text-secondary)', icon: Settings };
}

function truncate(text: string, max: number) {
  return text.length > max ? `${text.slice(0, max)}...` : text;
}

export default function CommsTriggerRules() {
  const { rules, toggleRule, removeRule } = useCommsRulesStore();
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  return (
    <GlassCard className="ctr-root">
      {/* Header */}
      <div className="ctr-header">
        <div className="ctr-header-left">
          <Zap size={16} style={{ color: 'var(--cyan)' }} />
          <div>
            <h3 className="ctr-title">Automation Rules</h3>
            <p className="ctr-subtitle">Automatically trigger communications when events occur</p>
          </div>
        </div>
        <Button variant="ghost" size="sm" icon={<Plus size={14} />}>
          Add Rule
        </Button>
      </div>

      {/* Rules list */}
      <div className="ctr-list">
        {rules.map((rule) => (
          <RuleRow
            key={rule.id}
            rule={rule}
            hovered={hoveredId === rule.id}
            onMouseEnter={() => setHoveredId(rule.id)}
            onMouseLeave={() => setHoveredId(null)}
            onToggle={() => toggleRule(rule.id)}
            onRemove={() => removeRule(rule.id)}
          />
        ))}
      </div>

      <style>{styles}</style>
    </GlassCard>
  );
}

// ---------------------------------------------------------------------------
// Rule row sub-component
// ---------------------------------------------------------------------------

interface RuleRowProps {
  rule: CommsTriggerRule;
  hovered: boolean;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onToggle: () => void;
  onRemove: () => void;
}

function RuleRow({ rule, hovered, onMouseEnter, onMouseLeave, onToggle, onRemove }: RuleRowProps) {
  const meta = getActionMeta(rule.action);
  const ActionIcon = meta.icon;

  return (
    <div
      className={`ctr-row ${rule.enabled ? '' : 'ctr-row--disabled'}`}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {/* Toggle */}
      <button
        type="button"
        className="ctr-toggle"
        onClick={onToggle}
        aria-label={rule.enabled ? 'Disable rule' : 'Enable rule'}
      >
        {rule.enabled ? (
          <ToggleRight size={22} style={{ color: 'var(--cyan)' }} />
        ) : (
          <ToggleLeft size={22} style={{ color: 'var(--text-tertiary)' }} />
        )}
      </button>

      {/* Info */}
      <div className="ctr-info">
        <span className="ctr-name">{rule.name}</span>
        <span className="ctr-template">{truncate(rule.template, 60)}</span>
      </div>

      {/* Badges */}
      <div className="ctr-badges">
        <Badge size="sm" variant="outline">{rule.eventType}</Badge>
        <Badge size="sm" color={meta.color}>
          <ActionIcon size={10} style={{ marginRight: 4 }} />
          {meta.label}
        </Badge>
      </div>

      {/* Delete */}
      <button
        type="button"
        className={`ctr-delete ${hovered ? 'ctr-delete--visible' : ''}`}
        onClick={onRemove}
        aria-label={`Delete rule ${rule.name}`}
      >
        <Trash2 size={14} />
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Scoped styles
// ---------------------------------------------------------------------------

const styles = /* css */ `
.ctr-root {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.ctr-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.ctr-header-left {
  display: flex;
  align-items: flex-start;
  gap: 10px;
}

.ctr-header-left > svg {
  margin-top: 2px;
  flex-shrink: 0;
}

.ctr-title {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
}

.ctr-subtitle {
  margin: 2px 0 0;
  font-size: 11px;
  color: var(--text-secondary);
}

/* List */
.ctr-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

/* Row */
.ctr-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  border-radius: 8px;
  transition: background 0.15s ease;
}

.ctr-row:hover {
  background: var(--glass-hover, rgba(255, 255, 255, 0.03));
}

.ctr-row--disabled .ctr-name,
.ctr-row--disabled .ctr-template {
  opacity: 0.45;
}

/* Toggle button */
.ctr-toggle {
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

/* Info */
.ctr-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.ctr-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.ctr-template {
  font-size: 11px;
  color: var(--text-tertiary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-family: var(--font-mono, monospace);
}

/* Badges */
.ctr-badges {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}

/* Delete */
.ctr-delete {
  background: none;
  border: none;
  padding: 4px;
  cursor: pointer;
  color: var(--text-tertiary);
  border-radius: 4px;
  opacity: 0;
  transition: opacity 0.15s ease, color 0.15s ease;
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

.ctr-delete--visible {
  opacity: 1;
}

.ctr-delete:hover {
  color: var(--danger, #EF4444);
}
`;
