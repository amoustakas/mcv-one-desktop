import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Copy, Check } from 'lucide-react';

interface MarkdownProps {
  content: string;
}

function CodeBlock({ children, className }: { children: string; className?: string }) {
  const [copied, setCopied] = useState(false);
  const lang = className?.replace('language-', '') || '';

  function handleCopy() {
    navigator.clipboard.writeText(children.trim());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="md-code-block">
      <div className="md-code-header">
        <span className="md-code-lang">{lang || 'code'}</span>
        <button className="md-code-copy" onClick={handleCopy}>
          {copied ? <><Check size={11} /> Copied</> : <><Copy size={11} /> Copy</>}
        </button>
      </div>
      <pre><code className={className}>{children}</code></pre>
    </div>
  );
}

export default function Markdown({ content }: MarkdownProps) {
  return (
    <div className="markdown-body">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code({ children, className, ...props }) {
            const isBlock = className || (typeof children === 'string' && children.includes('\n'));
            if (isBlock) {
              return <CodeBlock className={className}>{String(children)}</CodeBlock>;
            }
            return <code className="md-inline-code" {...props}>{children}</code>;
          },
        }}
      >
        {content}
      </ReactMarkdown>

      <style>{`
        .markdown-body { font-size: 13px; line-height: 1.7; color: var(--text-primary); }
        .markdown-body p { margin-bottom: 0.6em; }
        .markdown-body p:last-child { margin-bottom: 0; }
        .markdown-body h1, .markdown-body h2, .markdown-body h3 { margin-top: 0.8em; margin-bottom: 0.4em; font-weight: 600; font-family: var(--font-display); }
        .markdown-body h1 { font-size: 1.3rem; }
        .markdown-body h2 { font-size: 1.1rem; }
        .markdown-body h3 { font-size: 1rem; }

        .md-inline-code {
          font-family: var(--font-mono); font-size: 0.85em;
          background: var(--bg-surface); padding: 2px 6px; border-radius: 4px; color: var(--cyan);
        }

        .md-code-block { margin: 0.6em 0; border: 1px solid var(--border); border-radius: var(--radius-md); overflow: hidden; }
        .md-code-header {
          display: flex; align-items: center; justify-content: space-between;
          padding: 4px 10px; background: var(--bg-elevated); border-bottom: 1px solid var(--border);
        }
        .md-code-lang { font-size: 10px; font-family: var(--font-mono); color: var(--text-muted); text-transform: uppercase; }
        .md-code-copy {
          display: flex; align-items: center; gap: 4px; font-size: 10px; color: var(--text-muted);
          padding: 2px 6px; border-radius: 3px; transition: all 0.15s;
        }
        .md-code-copy:hover { color: var(--cyan); background: rgba(0,240,255,0.08); }

        .md-code-block pre { margin: 0; padding: 10px 12px; background: var(--bg-surface); overflow-x: auto; }
        .md-code-block code { font-family: var(--font-mono); font-size: 12px; color: var(--text-primary); background: none; padding: 0; }

        .markdown-body ul, .markdown-body ol { padding-left: 1.4em; margin-bottom: 0.6em; }
        .markdown-body li { margin-bottom: 0.2em; }
        .markdown-body blockquote { border-left: 3px solid var(--purple); padding-left: 12px; margin: 0.6em 0; color: var(--text-secondary); }
        .markdown-body a { color: var(--cyan); text-decoration: none; }
        .markdown-body a:hover { text-decoration: underline; }
        .markdown-body table { width: 100%; border-collapse: collapse; margin: 0.6em 0; font-size: 11px; }
        .markdown-body th, .markdown-body td { border: 1px solid var(--border); padding: 5px 8px; text-align: left; }
        .markdown-body th { background: var(--bg-elevated); font-weight: 600; color: var(--text-secondary); }
        .markdown-body hr { border: none; border-top: 1px solid var(--border); margin: 0.8em 0; }
        .markdown-body strong { font-weight: 600; }
      `}</style>
    </div>
  );
}
