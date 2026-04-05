import { useState } from 'react';
import { Copy, Check, FileCode, WrapText } from 'lucide-react';
import { cn } from '../../lib/utils';

// ---------------------------------------------------------------------------
// Code Viewer — syntax-highlighted code with line numbers
// ---------------------------------------------------------------------------

interface CodeViewerProps {
  content: string;
  filename: string;
  path: string;
  size?: number;
  className?: string;
}

/** Detect language from filename extension */
function getLanguage(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  const map: Record<string, string> = {
    ts: 'typescript', tsx: 'typescript', js: 'javascript', jsx: 'javascript',
    py: 'python', rs: 'rust', go: 'go', rb: 'ruby',
    css: 'css', scss: 'scss', html: 'html', svg: 'xml',
    json: 'json', yaml: 'yaml', yml: 'yaml', toml: 'toml',
    md: 'markdown', sql: 'sql', sh: 'bash', zsh: 'bash',
    dockerfile: 'dockerfile',
  };
  return map[ext] || 'text';
}

export default function CodeViewer({ content, filename, path, size, className }: CodeViewerProps) {
  const [copied, setCopied] = useState(false);
  const [wrap, setWrap] = useState(false);
  const language = getLanguage(filename);
  const lines = content.split('\n');

  async function handleCopy() {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className={cn('cv-container', className)}>
      {/* Header bar */}
      <div className="cv-header">
        <div className="cv-breadcrumb">
          <FileCode size={13} />
          {path.split('/').map((part, i, arr) => (
            <span key={i}>
              {i > 0 && <span className="cv-sep">/</span>}
              <span className={i === arr.length - 1 ? 'cv-filename' : 'cv-dir'}>{part}</span>
            </span>
          ))}
        </div>
        <div className="cv-meta">
          <span className="cv-lang">{language}</span>
          {size != null && <span className="cv-size">{size < 1024 ? `${size}B` : `${(size / 1024).toFixed(1)}KB`}</span>}
          <span className="cv-lines">{lines.length} lines</span>
          <button className="cv-btn" onClick={() => setWrap(!wrap)} title="Toggle word wrap">
            <WrapText size={13} />
          </button>
          <button className="cv-btn" onClick={handleCopy} title="Copy">
            {copied ? <Check size={13} /> : <Copy size={13} />}
          </button>
        </div>
      </div>

      {/* Code area */}
      <div className={cn('cv-code', wrap && 'wrap')}>
        <div className="cv-gutter">
          {lines.map((_, i) => (
            <span key={i} className="cv-line-num">{i + 1}</span>
          ))}
        </div>
        <pre className="cv-content">
          <code>{content}</code>
        </pre>
      </div>

      <style>{`
        .cv-container {
          display:flex; flex-direction:column; height:100%; overflow:hidden;
          background:var(--bg-card); border:1px solid var(--border); border-radius:var(--radius-md);
        }

        .cv-header {
          display:flex; align-items:center; justify-content:space-between;
          padding:6px 12px; border-bottom:1px solid var(--border);
          background:var(--bg-surface); flex-shrink:0;
        }

        .cv-breadcrumb { display:flex; align-items:center; gap:2px; font-size:12px; color:var(--text-secondary); }
        .cv-sep { color:var(--text-muted); margin:0 1px; }
        .cv-dir { color:var(--text-secondary); }
        .cv-filename { color:var(--text-primary); font-weight:600; }

        .cv-meta { display:flex; align-items:center; gap:8px; font-size:10px; color:var(--text-muted); }
        .cv-lang { font-family:var(--font-mono); background:var(--bg-elevated); padding:1px 6px; border-radius:3px; }

        .cv-btn { padding:3px; border-radius:3px; color:var(--text-muted); }
        .cv-btn:hover { color:var(--cyan); background:var(--bg-elevated); }

        .cv-code {
          flex:1; overflow:auto; display:flex; font-family:var(--font-mono);
          font-size:12px; line-height:1.6;
        }
        .cv-code.wrap .cv-content { white-space:pre-wrap; word-break:break-all; }

        .cv-gutter {
          display:flex; flex-direction:column; align-items:flex-end;
          padding:8px 8px 8px 12px; color:var(--text-muted); user-select:none;
          border-right:1px solid var(--border); background:var(--bg-surface); flex-shrink:0;
          font-size:11px;
        }

        .cv-line-num { min-width:30px; text-align:right; }

        .cv-content {
          flex:1; padding:8px 12px; margin:0; color:var(--text-primary);
          white-space:pre; overflow-x:auto; tab-size:2;
        }
      `}</style>
    </div>
  );
}
