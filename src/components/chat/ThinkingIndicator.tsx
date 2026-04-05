import { Bot } from 'lucide-react';

// ---------------------------------------------------------------------------
// Thinking Indicator — animated "thinking" state before first token
// ---------------------------------------------------------------------------

export default function ThinkingIndicator() {
  return (
    <div className="think-msg">
      <div className="think-avatar"><Bot size={16} /></div>
      <div className="think-content">
        <div className="think-label">Aegis</div>
        <div className="think-dots">
          <span className="think-dot" />
          <span className="think-dot" />
          <span className="think-dot" />
          <span className="think-text">Thinking...</span>
        </div>
      </div>

      <style>{`
        .think-msg {
          display: flex;
          gap: var(--space-sm);
          max-width: 800px;
        }

        .think-avatar {
          width: 30px; height: 30px; border-radius: var(--radius-sm);
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0; background: var(--bg-card);
          border: 1px solid rgba(0, 245, 255, 0.15); color: var(--cyan);
        }

        .think-content { display: flex; flex-direction: column; gap: 3px; }
        .think-label {
          font-size: 10px; font-weight: 600; color: var(--text-muted);
          text-transform: uppercase; letter-spacing: 0.5px;
        }

        .think-dots {
          display: flex; align-items: center; gap: 4px;
          padding: var(--space-sm) var(--space-md);
          background: var(--bg-card); border: 1px solid var(--border);
          border-radius: var(--radius-md);
        }

        .think-dot {
          width: 6px; height: 6px; border-radius: 50%;
          background: var(--cyan); opacity: 0.4;
          animation: think-pulse 1.4s ease-in-out infinite;
        }
        .think-dot:nth-child(2) { animation-delay: 0.2s; }
        .think-dot:nth-child(3) { animation-delay: 0.4s; }

        .think-text {
          font-size: 12px; color: var(--text-muted);
          margin-left: 4px; font-style: italic;
        }

        @keyframes think-pulse {
          0%, 80%, 100% { opacity: 0.2; transform: scale(0.8); }
          40% { opacity: 1; transform: scale(1.1); }
        }
      `}</style>
    </div>
  );
}
