import { useState, useEffect, useRef } from 'react';
import { Plus, X, FileText, CheckSquare, Users, BookOpen, Send, Loader2 } from 'lucide-react';
import { useNavigation } from '../stores/navigation';

type CaptureType = 'note' | 'task' | 'contact' | 'document';

interface QuickCaptureProps {
  open: boolean;
  onToggle: () => void;
}

export default function QuickCapture({ open, onToggle }: QuickCaptureProps) {
  const [captureType, setCaptureType] = useState<CaptureType>('note');
  const [input, setInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [flash, setFlash] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { setView } = useNavigation();

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  // Clear flash after 2s
  useEffect(() => {
    if (!flash) return;
    const t = setTimeout(() => setFlash(null), 2000);
    return () => clearTimeout(t);
  }, [flash]);

  async function handleSubmit() {
    if (!input.trim() || submitting) return;

    if (captureType === 'document') {
      setView('docs');
      onToggle();
      setInput('');
      return;
    }

    setSubmitting(true);
    try {
      if (captureType === 'note') {
        await fetch('/api/docs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'create', title: input, content: '', doc_type: 'note', venture_id: 'mcv' }),
        });
        setFlash('Note created');
      } else if (captureType === 'task') {
        await fetch('/api/tasks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'create', title: input, status: 'todo', priority: 'medium' }),
        });
        setFlash('Task created');
      } else if (captureType === 'contact') {
        await fetch('/api/crm', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'create-contact', name: input }),
        });
        setFlash('Contact created');
      }
      setInput('');
    } catch {
      setFlash('Error - try again');
    } finally {
      setSubmitting(false);
    }
  }

  const typeOptions: { id: CaptureType; icon: typeof FileText; label: string; color: string }[] = [
    { id: 'note', icon: FileText, label: 'Note', color: '#00F0FF' },
    { id: 'task', icon: CheckSquare, label: 'Task', color: '#10B981' },
    { id: 'contact', icon: Users, label: 'Contact', color: '#8B5CF6' },
    { id: 'document', icon: BookOpen, label: 'Document', color: '#F59E0B' },
  ];

  const activeOption = typeOptions.find(t => t.id === captureType) ?? typeOptions[0];

  return (
    <>
      {/* Floating Action Button */}
      <button
        className={`qc-fab ${open ? 'qc-fab-open' : ''}`}
        onClick={onToggle}
        title="Quick Capture (Ctrl+N)"
      >
        {open ? <X size={20} /> : <Plus size={20} />}
      </button>

      {/* Expanded Form */}
      {open && (
        <div className="qc-panel glass">
          {/* Type Selector */}
          <div className="qc-types">
            {typeOptions.map(opt => {
              const Icon = opt.icon;
              return (
                <button
                  key={opt.id}
                  className={`qc-type-btn ${captureType === opt.id ? 'active' : ''}`}
                  onClick={() => setCaptureType(opt.id)}
                  style={captureType === opt.id ? { color: opt.color, borderColor: opt.color + '60' } : undefined}
                >
                  <Icon size={12} />
                  <span>{opt.label}</span>
                </button>
              );
            })}
          </div>

          {/* Input */}
          <div className="qc-input-row">
            <div className="qc-input-dot" style={{ background: activeOption.color }} />
            <input
              ref={inputRef}
              className="qc-input"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') handleSubmit();
                if (e.key === 'Escape') onToggle();
              }}
              placeholder={
                captureType === 'note' ? 'Quick note...' :
                captureType === 'task' ? 'New task...' :
                captureType === 'contact' ? 'Contact name...' :
                'Opens Docs Hub...'
              }
              disabled={submitting}
            />
            <button
              className="qc-send"
              onClick={handleSubmit}
              disabled={!input.trim() || submitting}
              style={{ background: activeOption.color }}
            >
              {submitting ? <Loader2 size={13} className="qc-spin" /> : <Send size={13} />}
            </button>
          </div>

          {/* Flash message */}
          {flash && (
            <div className="qc-flash">{flash}</div>
          )}

          <div className="qc-hint">
            <kbd>Enter</kbd> to submit &middot; <kbd>Esc</kbd> to close
          </div>
        </div>
      )}

      <style>{`
        .qc-fab {
          position: fixed;
          bottom: 40px;
          right: 20px;
          z-index: 900;
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: var(--cyan);
          color: var(--bg-deep);
          display: flex;
          align-items: center;
          justify-content: center;
          border: none;
          cursor: pointer;
          box-shadow: 0 4px 20px rgba(0,240,255,0.3);
          transition: all 0.2s ease;
        }
        .qc-fab:hover {
          transform: scale(1.08);
          box-shadow: 0 6px 28px rgba(0,240,255,0.4);
        }
        .qc-fab-open {
          background: var(--bg-card);
          color: var(--text-muted);
          box-shadow: 0 4px 16px rgba(0,0,0,0.3);
          border: 1px solid var(--border);
        }
        .qc-fab-open:hover {
          color: var(--text-primary);
          box-shadow: 0 4px 16px rgba(0,0,0,0.4);
        }

        .qc-panel {
          position: fixed;
          bottom: 96px;
          right: 20px;
          z-index: 899;
          width: 360px;
          padding: 12px;
          border-radius: var(--radius-lg);
          background: rgba(11,17,33,0.95);
          backdrop-filter: blur(16px);
          border: 1px solid rgba(255,255,255,0.08);
          box-shadow: 0 12px 48px rgba(0,0,0,0.5);
          display: flex;
          flex-direction: column;
          gap: 8px;
          animation: qc-slide-up 0.15s ease-out;
        }

        @keyframes qc-slide-up {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .qc-types {
          display: flex;
          gap: 4px;
        }

        .qc-type-btn {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 4px;
          padding: 5px 8px;
          border-radius: var(--radius-sm);
          background: transparent;
          border: 1px solid var(--border);
          color: var(--text-muted);
          font-size: 10px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.12s;
        }
        .qc-type-btn:hover {
          background: var(--bg-card);
          color: var(--text-primary);
        }
        .qc-type-btn.active {
          background: var(--bg-elevated);
          font-weight: 600;
        }

        .qc-input-row {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 6px 10px;
          background: var(--bg-input);
          border: 1px solid var(--border);
          border-radius: var(--radius-sm);
          transition: border-color 0.15s;
        }
        .qc-input-row:focus-within {
          border-color: var(--border-active);
        }

        .qc-input-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          flex-shrink: 0;
        }

        .qc-input {
          flex: 1;
          background: transparent;
          border: none;
          color: var(--text-primary);
          font-size: 13px;
          outline: none;
          min-width: 0;
          font-family: var(--font-sans);
        }
        .qc-input::placeholder { color: var(--text-muted); }
        .qc-input:disabled { opacity: 0.5; }

        .qc-send {
          width: 28px;
          height: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: var(--radius-sm);
          color: var(--bg-deep);
          border: none;
          cursor: pointer;
          flex-shrink: 0;
          transition: opacity 0.15s;
          font-weight: 700;
        }
        .qc-send:hover:not(:disabled) { opacity: 0.85; }
        .qc-send:disabled { opacity: 0.3; cursor: not-allowed; }

        .qc-flash {
          font-size: 10px;
          font-weight: 600;
          color: var(--success);
          text-align: center;
          padding: 3px;
          animation: qc-flash-in 0.2s ease;
        }

        @keyframes qc-flash-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .qc-hint {
          font-size: 9px;
          color: var(--text-muted);
          text-align: center;
        }
        .qc-hint kbd {
          font-size: 8px;
          font-family: var(--font-mono);
          background: var(--bg-surface);
          border: 1px solid var(--border);
          padding: 1px 4px;
          border-radius: 2px;
        }

        @keyframes qc-spin { to { transform: rotate(360deg); } }
        .qc-spin { animation: qc-spin 1s linear infinite; }
      `}</style>
    </>
  );
}
