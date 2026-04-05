import { useMemo, type ReactNode } from 'react';
import { Activity } from 'lucide-react';
import { cn, timeAgo } from '../lib/utils';
import Skeleton from './ui/Skeleton';
import Button from './ui/Button';

interface ActivityItem {
  id: string;
  icon?: ReactNode;
  title: string;
  description?: string;
  timestamp: string;
  source?: string;
  status?: 'active' | 'error' | 'success' | 'warning';
  ventureId?: string;
}

interface ActivityFeedProps {
  items: ActivityItem[];
  isLoading?: boolean;
  compact?: boolean;
  groupByDate?: boolean;
  maxItems?: number;
  onLoadMore?: () => void;
  className?: string;
}

function getDateLabel(ts: string): string {
  const d = new Date(ts);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (d >= today) return 'Today';
  if (d >= yesterday) return 'Yesterday';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function SkeletonFeed() {
  return (
    <>
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="mcv-feed-item" style={{ gap: 10 }}>
          <Skeleton width={28} height={28} variant="rect" />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
            <Skeleton width="70%" height={12} />
            <Skeleton width="40%" height={10} />
          </div>
          <Skeleton width={40} height={10} />
        </div>
      ))}
    </>
  );
}

export default function ActivityFeed({
  items,
  isLoading = false,
  compact = false,
  groupByDate = false,
  maxItems,
  onLoadMore,
  className,
}: ActivityFeedProps) {
  const visibleItems = maxItems ? items.slice(0, maxItems) : items;

  const grouped = useMemo(() => {
    if (!groupByDate) return null;
    const groups: { label: string; items: ActivityItem[] }[] = [];
    let currentLabel = '';
    for (const item of visibleItems) {
      const label = getDateLabel(item.timestamp);
      if (label !== currentLabel) {
        currentLabel = label;
        groups.push({ label, items: [item] });
      } else {
        groups[groups.length - 1].items.push(item);
      }
    }
    return groups;
  }, [visibleItems, groupByDate]);

  if (isLoading) {
    return (
      <div className={cn('mcv-feed', compact && 'mcv-feed-compact', className)}>
        <SkeletonFeed />
      </div>
    );
  }

  if (!items.length) {
    return (
      <div className={cn('mcv-feed', className)} style={{ padding: '32px 16px', textAlign: 'center' }}>
        <Activity size={20} style={{ color: 'var(--text-muted)', opacity: 0.5, margin: '0 auto 8px' }} />
        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>No activity yet</div>
      </div>
    );
  }

  const renderItem = (item: ActivityItem) => (
    <div
      key={item.id}
      className={cn(
        'mcv-feed-item',
        item.status && `mcv-feed-item-${item.status}`,
      )}
    >
      <div className="mcv-feed-item-icon">
        {item.icon ?? <Activity size={14} />}
      </div>
      <div className="mcv-feed-item-body">
        <div className="mcv-feed-item-title">{item.title}</div>
        {item.description && <div className="mcv-feed-item-desc">{item.description}</div>}
      </div>
      <span className="mcv-feed-item-time">{timeAgo(item.timestamp)}</span>
    </div>
  );

  return (
    <div className={cn('mcv-feed', compact && 'mcv-feed-compact', className)}>
      {grouped
        ? grouped.map((group) => (
            <div key={group.label}>
              <div className="mcv-feed-group-label">{group.label}</div>
              {group.items.map(renderItem)}
            </div>
          ))
        : visibleItems.map(renderItem)}

      {onLoadMore && (
        <div style={{ padding: '8px 16px', textAlign: 'center' }}>
          <Button variant="ghost" size="sm" onClick={onLoadMore}>
            Load more
          </Button>
        </div>
      )}
    </div>
  );
}

export type { ActivityItem, ActivityFeedProps };
