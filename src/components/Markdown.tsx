import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MarkdownProps {
  content: string;
}

export default function Markdown({ content }: MarkdownProps) {
  return (
    <div className="markdown-body">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>

      <style>{`
        .markdown-body {
          font-size: var(--text-sm);
          line-height: 1.7;
          color: var(--text-primary);
        }

        .markdown-body p {
          margin-bottom: 0.75em;
        }

        .markdown-body p:last-child {
          margin-bottom: 0;
        }

        .markdown-body h1, .markdown-body h2, .markdown-body h3,
        .markdown-body h4, .markdown-body h5, .markdown-body h6 {
          margin-top: 1em;
          margin-bottom: 0.5em;
          font-weight: 600;
          color: var(--text-primary);
        }

        .markdown-body h1 { font-size: var(--text-xl); }
        .markdown-body h2 { font-size: var(--text-lg); }
        .markdown-body h3 { font-size: var(--text-base); }

        .markdown-body code {
          font-family: var(--font-mono);
          font-size: 0.85em;
          background: var(--bg-surface);
          padding: 2px 6px;
          border-radius: 4px;
          color: var(--cyan);
        }

        .markdown-body pre {
          margin: 0.75em 0;
          background: var(--bg-surface);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          padding: var(--space-md);
          overflow-x: auto;
        }

        .markdown-body pre code {
          background: none;
          padding: 0;
          color: var(--text-primary);
          font-size: var(--text-sm);
        }

        .markdown-body ul, .markdown-body ol {
          padding-left: 1.5em;
          margin-bottom: 0.75em;
        }

        .markdown-body li {
          margin-bottom: 0.25em;
        }

        .markdown-body blockquote {
          border-left: 3px solid var(--purple);
          padding-left: var(--space-md);
          margin: 0.75em 0;
          color: var(--text-secondary);
        }

        .markdown-body a {
          color: var(--cyan);
          text-decoration: none;
        }

        .markdown-body a:hover {
          text-decoration: underline;
        }

        .markdown-body table {
          width: 100%;
          border-collapse: collapse;
          margin: 0.75em 0;
          font-size: var(--text-xs);
        }

        .markdown-body th, .markdown-body td {
          border: 1px solid var(--border);
          padding: 6px 10px;
          text-align: left;
        }

        .markdown-body th {
          background: var(--bg-elevated);
          font-weight: 600;
          color: var(--text-secondary);
        }

        .markdown-body hr {
          border: none;
          border-top: 1px solid var(--border);
          margin: 1em 0;
        }

        .markdown-body strong {
          font-weight: 600;
          color: var(--text-primary);
        }

        .markdown-body em {
          color: var(--text-secondary);
        }
      `}</style>
    </div>
  );
}
