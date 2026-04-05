import { useState } from 'react';
import { Copy, Check, RefreshCw, Pencil, Bookmark, BookmarkCheck } from 'lucide-react';
import { cn } from '../../lib/utils';

// ---------------------------------------------------------------------------
// Message Actions — hover toolbar on chat messages
// ---------------------------------------------------------------------------

interface MessageActionsProps {
  role: 'user' | 'assistant';
  content: string;
  isLast: boolean;
  onRegenerate?: () => void;
  onEdit?: () => void;
  className?: string;
}

export default function MessageActions({
  role,
  content,
  isLast,
  onRegenerate,
  onEdit,
  className,
}: MessageActionsProps) {
  const [copied, setCopied] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);

  async function handleCopy() {
    const text = typeof content === 'string' ? content : '';
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleBookmark() {
    // Save to localStorage bookmark list
    const key = 'mcv-bookmarks';
    const existing = JSON.parse(localStorage.getItem(key) || '[]');
    if (bookmarked) {
      const filtered = existing.filter((b: { content: string }) => b.content !== content);
      localStorage.setItem(key, JSON.stringify(filtered));
    } else {
      existing.unshift({ content, role, savedAt: Date.now() });
      localStorage.setItem(key, JSON.stringify(existing.slice(0, 100)));
    }
    setBookmarked(!bookmarked);
  }

  return (
    <div className={cn('ma-bar', className)}>
      <button className="ma-btn" onClick={handleCopy} title="Copy">
        {copied ? <Check size={12} /> : <Copy size={12} />}
      </button>

      {role === 'assistant' && isLast && onRegenerate && (
        <button className="ma-btn" onClick={onRegenerate} title="Regenerate">
          <RefreshCw size={12} />
        </button>
      )}

      {role === 'user' && onEdit && (
        <button className="ma-btn" onClick={onEdit} title="Edit">
          <Pencil size={12} />
        </button>
      )}

      <button className="ma-btn" onClick={handleBookmark} title={bookmarked ? 'Remove bookmark' : 'Bookmark'}>
        {bookmarked ? <BookmarkCheck size={12} /> : <Bookmark size={12} />}
      </button>

      <style>{`
        .ma-bar {
          display: flex;
          align-items: center;
          gap: 2px;
          opacity: 0;
          transition: opacity var(--transition-fast);
          position: absolute;
          top: -4px;
          right: 4px;
          background: var(--bg-surface);
          border: 1px solid var(--border);
          border-radius: 4px;
          padding: 1px;
          z-index: 5;
        }

        .chat-msg:hover .ma-bar { opacity: 1; }

        .ma-btn {
          padding: 3px 5px;
          border-radius: 3px;
          color: var(--text-muted);
          transition: all var(--transition-fast);
        }
        .ma-btn:hover { color: var(--cyan); background: var(--bg-elevated); }
      `}</style>
    </div>
  );
}
