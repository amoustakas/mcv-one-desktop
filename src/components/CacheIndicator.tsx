import { useState, useEffect } from 'react';
import { Database } from 'lucide-react';
import { cn } from '../lib/utils';
import { useContextCache } from '../stores/context-cache';
import { formatCompact } from '../lib/utils';

// ---------------------------------------------------------------------------
// CacheIndicator — badge showing active context cache status
// ---------------------------------------------------------------------------

export default function CacheIndicator({ className }: { className?: string }) {
  const { activeCaches, isCaching, estimatedSavings } = useContextCache();
  const [ttlDisplay, setTtlDisplay] = useState('');

  const activeCache = activeCaches.find((c) => new Date(c.expireTime) > new Date());

  // Update TTL countdown every 30s
  useEffect(() => {
    if (!activeCache) { setTtlDisplay(''); return; }

    function update() {
      if (!activeCache) return;
      const remaining = new Date(activeCache.expireTime).getTime() - Date.now();
      if (remaining <= 0) { setTtlDisplay('expired'); return; }
      const mins = Math.floor(remaining / 60000);
      setTtlDisplay(mins > 0 ? `${mins}m` : '<1m');
    }

    update();
    const id = setInterval(update, 30_000);
    return () => clearInterval(id);
  }, [activeCache?.expireTime]);

  if (!activeCache && !isCaching) return null;

  return (
    <div
      className={cn('mcv-cache-indicator', className)}
      title={activeCache
        ? `Cache: ${formatCompact(activeCache.tokenCount)} tokens | TTL: ${ttlDisplay} | Saved: $${estimatedSavings.toFixed(4)}`
        : 'Creating cache...'
      }
    >
      <Database size={12} style={{ color: isCaching ? 'var(--warning)' : 'var(--success)' }} />
      <span className="mcv-cache-label">
        {isCaching ? 'Caching...' : `Cache ${ttlDisplay}`}
      </span>
      {activeCache && (
        <span className="mcv-cache-tokens">
          {formatCompact(activeCache.tokenCount)} tok
        </span>
      )}
    </div>
  );
}
