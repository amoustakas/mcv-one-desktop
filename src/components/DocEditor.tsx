import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Bold, Italic, Code, Heading1, Heading2, Heading3,
  List, ListOrdered, Quote, Link, Minus, FileCode,
  Eye, EyeOff, Save, X, Type,
} from 'lucide-react';
import Markdown from './Markdown';

/* ─── Types ──────────────────────────────────────────────────────── */

interface DocEditorProps {
  initialTitle: string;
  initialContent: string;
  ventureId?: string;
  docType?: string;
  onSave: (title: string, content: string) => void;
  onCancel: () => void;
}

interface FormatAction {
  icon: React.ReactNode;
  label: string;
  shortcut?: string;
  action: (ta: HTMLTextAreaElement) => { value: string; selStart: number; selEnd: number };
}

/* ─── Venture & DocType options ───────────────────────────────────── */

const VENTURE_OPTIONS = [
  { value: '', label: 'No Venture' },
  { value: 'mcv', label: 'MCV One' },
  { value: 'betedge', label: 'BetEdge AI' },
  { value: 'futurestate', label: 'FutureState' },
  { value: 'warforge', label: 'WarForge' },
  { value: 'mcvgg', label: 'mcv.gg' },
  { value: 'edgeiq', label: 'EdgeIQ Markets' },
  { value: 'arqlabs', label: 'ARQ Labs' },
  { value: 'mcvdev', label: 'MCV Dev' },
  { value: 'mcvtech', label: 'MCV Tech' },
];

const DOC_TYPE_OPTIONS = [
  { value: '', label: 'General' },
  { value: 'note', label: 'Note' },
  { value: 'spec', label: 'Spec / PRD' },
  { value: 'standup', label: 'Standup' },
  { value: 'report', label: 'Report' },
  { value: 'roadmap', label: 'Roadmap' },
  { value: 'guide', label: 'Guide' },
  { value: 'post', label: 'Blog Post' },
  { value: 'pitch', label: 'Pitch Deck' },
];

/* ─── Format helpers ─────────────────────────────────────────────── */

/** Wrap selected text with prefix/suffix. If nothing selected, insert placeholder. */
function wrapSelection(
  ta: HTMLTextAreaElement,
  prefix: string,
  suffix: string,
  placeholder: string,
): { value: string; selStart: number; selEnd: number } {
  const { selectionStart: s, selectionEnd: e, value: v } = ta;
  const selected = v.slice(s, e);
  if (selected) {
    const wrapped = `${prefix}${selected}${suffix}`;
    return {
      value: v.slice(0, s) + wrapped + v.slice(e),
      selStart: s + prefix.length,
      selEnd: s + prefix.length + selected.length,
    };
  }
  const insert = `${prefix}${placeholder}${suffix}`;
  return {
    value: v.slice(0, s) + insert + v.slice(e),
    selStart: s + prefix.length,
    selEnd: s + prefix.length + placeholder.length,
  };
}

/** Insert prefix at the start of the current line. */
function linePrefix(
  ta: HTMLTextAreaElement,
  prefix: string,
): { value: string; selStart: number; selEnd: number } {
  const { selectionStart: s, value: v } = ta;
  const lineStart = v.lastIndexOf('\n', s - 1) + 1;
  return {
    value: v.slice(0, lineStart) + prefix + v.slice(lineStart),
    selStart: s + prefix.length,
    selEnd: s + prefix.length,
  };
}

/* ─── Toolbar definitions ────────────────────────────────────────── */

const FORMAT_ACTIONS: FormatAction[] = [
  {
    icon: <Bold size={15} />, label: 'Bold', shortcut: 'Ctrl+B',
    action: (ta) => wrapSelection(ta, '**', '**', 'bold text'),
  },
  {
    icon: <Italic size={15} />, label: 'Italic', shortcut: 'Ctrl+I',
    action: (ta) => wrapSelection(ta, '*', '*', 'italic text'),
  },
  {
    icon: <Code size={15} />, label: 'Inline Code',
    action: (ta) => wrapSelection(ta, '`', '`', 'code'),
  },
  { icon: null, label: 'sep1', action: () => ({ value: '', selStart: 0, selEnd: 0 }) }, // separator
  {
    icon: <Heading1 size={15} />, label: 'Heading 1',
    action: (ta) => linePrefix(ta, '# '),
  },
  {
    icon: <Heading2 size={15} />, label: 'Heading 2',
    action: (ta) => linePrefix(ta, '## '),
  },
  {
    icon: <Heading3 size={15} />, label: 'Heading 3',
    action: (ta) => linePrefix(ta, '### '),
  },
  { icon: null, label: 'sep2', action: () => ({ value: '', selStart: 0, selEnd: 0 }) },
  {
    icon: <List size={15} />, label: 'Bullet List',
    action: (ta) => linePrefix(ta, '- '),
  },
  {
    icon: <ListOrdered size={15} />, label: 'Numbered List',
    action: (ta) => linePrefix(ta, '1. '),
  },
  {
    icon: <Quote size={15} />, label: 'Blockquote',
    action: (ta) => linePrefix(ta, '> '),
  },
  { icon: null, label: 'sep3', action: () => ({ value: '', selStart: 0, selEnd: 0 }) },
  {
    icon: <Link size={15} />, label: 'Link',
    action: (ta) => wrapSelection(ta, '[', '](url)', 'link text'),
  },
  {
    icon: <Minus size={15} />, label: 'Horizontal Rule',
    action: (ta) => {
      const { selectionStart: s, value: v } = ta;
      const insert = '\n---\n';
      return { value: v.slice(0, s) + insert + v.slice(s), selStart: s + insert.length, selEnd: s + insert.length };
    },
  },
  {
    icon: <FileCode size={15} />, label: 'Code Block',
    action: (ta) => wrapSelection(ta, '```\n', '\n```', 'code here'),
  },
];

/* ─── Component ──────────────────────────────────────────────────── */

export default function DocEditor({
  initialTitle,
  initialContent,
  ventureId = '',
  docType = '',
  onSave,
  onCancel,
}: DocEditorProps) {
  const [title, setTitle] = useState(initialTitle);
  const [content, setContent] = useState(initialContent);
  const [venture, setVenture] = useState(ventureId);
  const [type, setType] = useState(docType);
  const [showPreview, setShowPreview] = useState(false);

  const taRef = useRef<HTMLTextAreaElement>(null);

  /* ── Stat counters ─────────────────────────────────────────── */
  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
  const charCount = content.length;
  const lineCount = content.split('\n').length;

  /* ── Apply a format action to the textarea ─────────────────── */
  const applyFormat = useCallback((action: FormatAction['action']) => {
    const ta = taRef.current;
    if (!ta) return;
    const result = action(ta);
    setContent(result.value);
    // Defer cursor placement to after React re-renders the textarea value
    requestAnimationFrame(() => {
      ta.focus();
      ta.setSelectionRange(result.selStart, result.selEnd);
    });
  }, []);

  /* ── Keyboard shortcuts ────────────────────────────────────── */
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      const ctrl = e.ctrlKey || e.metaKey;
      if (!ctrl) return;

      switch (e.key.toLowerCase()) {
        case 's':
          e.preventDefault();
          onSave(title, content);
          break;
        case 'p':
          e.preventDefault();
          setShowPreview((p) => !p);
          break;
        case 'b': {
          e.preventDefault();
          const ta = taRef.current;
          if (ta) applyFormat((t) => wrapSelection(t, '**', '**', 'bold text'));
          break;
        }
        case 'i': {
          e.preventDefault();
          const ta = taRef.current;
          if (ta) applyFormat((t) => wrapSelection(t, '*', '*', 'italic text'));
          break;
        }
        default:
          break;
      }
    }

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [title, content, onSave, applyFormat]);

  /* ── Textarea key overrides (Tab, Enter auto-indent) ───────── */
  function handleTextareaKey(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    const ta = e.currentTarget;

    if (e.key === 'Tab') {
      e.preventDefault();
      const { selectionStart: s, selectionEnd: end } = ta;
      const updated = content.slice(0, s) + '  ' + content.slice(end);
      setContent(updated);
      requestAnimationFrame(() => {
        ta.setSelectionRange(s + 2, s + 2);
      });
      return;
    }

    if (e.key === 'Enter') {
      const { selectionStart: s } = ta;
      const lineStart = content.lastIndexOf('\n', s - 1) + 1;
      const currentLine = content.slice(lineStart, s);
      const indent = currentLine.match(/^(\s*)/)?.[1] || '';

      // Continue list markers
      const listMatch = currentLine.match(/^(\s*)([-*]|\d+\.)\s/);
      if (listMatch) {
        e.preventDefault();
        const marker = listMatch[2];
        // If the marker is a number, increment it
        let nextMarker = marker;
        if (/^\d+$/.test(marker.replace('.', ''))) {
          nextMarker = `${parseInt(marker) + 1}.`;
        }
        const insert = `\n${listMatch[1]}${nextMarker} `;
        const updated = content.slice(0, s) + insert + content.slice(s);
        setContent(updated);
        requestAnimationFrame(() => {
          ta.setSelectionRange(s + insert.length, s + insert.length);
        });
        return;
      }

      // Preserve indent
      if (indent) {
        e.preventDefault();
        const insert = `\n${indent}`;
        const updated = content.slice(0, s) + insert + content.slice(s);
        setContent(updated);
        requestAnimationFrame(() => {
          ta.setSelectionRange(s + insert.length, s + insert.length);
        });
      }
    }
  }

  return (
    <div style={styles.container}>
      {/* ── Top Toolbar ───────────────────────────────────────── */}
      <div style={styles.topToolbar}>
        <div style={styles.topLeft}>
          <input
            style={styles.titleInput}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Document title..."
            spellCheck={false}
          />
        </div>
        <div style={styles.topRight}>
          <select
            style={styles.select}
            value={venture}
            onChange={(e) => setVenture(e.target.value)}
          >
            {VENTURE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <select
            style={styles.select}
            value={type}
            onChange={(e) => setType(e.target.value)}
          >
            {DOC_TYPE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <button
            style={styles.btnSave}
            onClick={() => onSave(title, content)}
            title="Save (Ctrl+S)"
          >
            <Save size={14} />
            <span>Save</span>
          </button>
          <button
            style={styles.btnCancel}
            onClick={onCancel}
          >
            <X size={14} />
            <span>Cancel</span>
          </button>
        </div>
      </div>

      {/* ── Format Toolbar ────────────────────────────────────── */}
      <div style={styles.formatBar}>
        <div style={styles.formatGroup}>
          {FORMAT_ACTIONS.map((fa) => {
            if (fa.icon === null) {
              return <div key={fa.label} style={styles.separator} />;
            }
            return (
              <button
                key={fa.label}
                onClick={() => applyFormat(fa.action)}
                style={styles.formatBtn}
                title={fa.shortcut ? `${fa.label} (${fa.shortcut})` : fa.label}
              >
                {fa.icon}
              </button>
            );
          })}
        </div>
        <div style={styles.formatRight}>
          <button
            onClick={() => setShowPreview((p) => !p)}
            style={{
              ...styles.formatBtn,
              color: showPreview ? 'var(--cyan)' : 'var(--text-muted)',
              background: showPreview ? 'rgba(0,240,255,0.08)' : 'transparent',
            }}
            title="Toggle Preview (Ctrl+P)"
          >
            {showPreview ? <EyeOff size={15} /> : <Eye size={15} />}
            <span style={{ fontSize: 11, marginLeft: 4 }}>
              {showPreview ? 'Hide Preview' : 'Preview'}
            </span>
          </button>
        </div>
      </div>

      {/* ── Editor + Preview Area ─────────────────────────────── */}
      <div style={{ ...styles.editorArea, gridTemplateColumns: showPreview ? '1fr 1fr' : '1fr' }}>
        {/* Editor pane */}
        <div style={styles.editorPane}>
          <textarea
            ref={taRef}
            style={styles.textarea}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleTextareaKey}
            placeholder="Start writing in Markdown..."
            spellCheck={false}
            className="doc-editor-textarea"
          />
        </div>

        {/* Preview pane */}
        {showPreview && (
          <div style={styles.previewPane}>
            <div style={styles.previewHeader}>
              <Type size={12} />
              <span>Preview</span>
            </div>
            <div style={styles.previewContent}>
              <Markdown content={content || '*Nothing to preview yet...*'} />
            </div>
          </div>
        )}
      </div>

      {/* ── Footer / Status Bar ───────────────────────────────── */}
      <div style={styles.footer}>
        <div style={styles.footerLeft}>
          <span style={styles.footerStat}>{wordCount} words</span>
          <span style={styles.footerDot}>&middot;</span>
          <span style={styles.footerStat}>{charCount} chars</span>
          <span style={styles.footerDot}>&middot;</span>
          <span style={styles.footerStat}>{lineCount} lines</span>
        </div>
        <div style={styles.footerRight}>
          <span style={styles.footerHint}>Ctrl+S save</span>
          <span style={styles.footerHint}>Ctrl+P preview</span>
          <span style={styles.footerHint}>Ctrl+B bold</span>
          <span style={styles.footerHint}>Ctrl+I italic</span>
        </div>
      </div>

      {/* ── Scoped Styles ─────────────────────────────────────── */}
      <style>{`
        .doc-editor-textarea {
          resize: none;
          outline: none;
        }
        .doc-editor-textarea::placeholder {
          color: var(--text-muted);
        }
        .doc-editor-textarea:focus {
          border-color: var(--border-active) !important;
        }

        /* Scrollbar styling */
        .doc-editor-textarea::-webkit-scrollbar,
        .doc-editor-preview::-webkit-scrollbar {
          width: 6px;
        }
        .doc-editor-textarea::-webkit-scrollbar-track,
        .doc-editor-preview::-webkit-scrollbar-track {
          background: transparent;
        }
        .doc-editor-textarea::-webkit-scrollbar-thumb,
        .doc-editor-preview::-webkit-scrollbar-thumb {
          background: var(--border);
          border-radius: 3px;
        }
      `}</style>
    </div>
  );
}

/* ─── Inline Styles ──────────────────────────────────────────────── */

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    background: 'var(--bg-deep)',
    color: 'var(--text-primary)',
    fontFamily: 'var(--font-sans)',
    borderRadius: 'var(--radius-lg)',
    border: '1px solid var(--border)',
    overflow: 'hidden',
  },

  /* ── Top toolbar ────────────────────────────────────────── */
  topToolbar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    padding: '10px 16px',
    background: 'var(--bg-surface)',
    borderBottom: '1px solid var(--border)',
    flexShrink: 0,
    flexWrap: 'wrap',
  },
  topLeft: {
    flex: 1,
    minWidth: 200,
  },
  titleInput: {
    width: '100%',
    fontSize: '1.25rem',
    fontFamily: 'var(--font-display)',
    fontWeight: 700,
    color: 'var(--text-primary)',
    background: 'transparent',
    border: 'none',
    outline: 'none',
    padding: '4px 0',
    letterSpacing: '0.01em',
  },
  topRight: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    flexShrink: 0,
  },
  select: {
    height: 32,
    padding: '0 10px',
    fontSize: 12,
    fontFamily: 'var(--font-sans)',
    color: 'var(--text-secondary)',
    background: 'var(--bg-input)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-sm)',
    cursor: 'pointer',
    outline: 'none',
  },
  btnSave: {
    display: 'flex',
    alignItems: 'center',
    gap: 5,
    height: 32,
    padding: '0 14px',
    fontSize: 12,
    fontWeight: 600,
    color: '#020408',
    background: 'var(--cyan)',
    border: 'none',
    borderRadius: 'var(--radius-sm)',
    cursor: 'pointer',
    transition: 'opacity 0.15s',
    fontFamily: 'var(--font-sans)',
  },
  btnCancel: {
    display: 'flex',
    alignItems: 'center',
    gap: 5,
    height: 32,
    padding: '0 12px',
    fontSize: 12,
    fontWeight: 500,
    color: 'var(--text-secondary)',
    background: 'transparent',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-sm)',
    cursor: 'pointer',
    transition: 'all 0.15s',
    fontFamily: 'var(--font-sans)',
  },

  /* ── Format toolbar ─────────────────────────────────────── */
  formatBar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '6px 16px',
    background: 'var(--bg-card)',
    borderBottom: '1px solid var(--border)',
    flexShrink: 0,
  },
  formatGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: 2,
  },
  formatBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 30,
    height: 28,
    color: 'var(--text-muted)',
    background: 'transparent',
    border: 'none',
    borderRadius: 'var(--radius-sm)',
    cursor: 'pointer',
    transition: 'all 0.15s',
    padding: 0,
  },
  formatRight: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
  },
  separator: {
    width: 1,
    height: 18,
    background: 'var(--border)',
    margin: '0 6px',
    flexShrink: 0,
  },

  /* ── Editor area ────────────────────────────────────────── */
  editorArea: {
    flex: 1,
    display: 'grid',
    minHeight: 0,
    overflow: 'hidden',
  },
  editorPane: {
    display: 'flex',
    position: 'relative',
    overflow: 'hidden',
  },
  textarea: {
    flex: 1,
    padding: '20px 24px',
    fontSize: '0.9rem',
    lineHeight: 1.7,
    fontFamily: 'var(--font-mono)',
    color: 'var(--text-primary)',
    background: 'var(--bg-deep)',
    border: '1px solid transparent',
    borderRadius: 0,
    tabSize: 2,
    overflowY: 'auto',
  },

  /* ── Preview pane ───────────────────────────────────────── */
  previewPane: {
    display: 'flex',
    flexDirection: 'column',
    borderLeft: '1px solid var(--border)',
    overflow: 'hidden',
  },
  previewHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '6px 16px',
    fontSize: 11,
    fontWeight: 600,
    color: 'var(--text-muted)',
    background: 'var(--bg-elevated)',
    borderBottom: '1px solid var(--border)',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.08em',
    fontFamily: 'var(--font-mono)',
    flexShrink: 0,
  },
  previewContent: {
    flex: 1,
    padding: '20px 24px',
    overflowY: 'auto',
    background: 'var(--bg-surface)',
  },

  /* ── Footer ─────────────────────────────────────────────── */
  footer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '6px 16px',
    background: 'var(--bg-surface)',
    borderTop: '1px solid var(--border)',
    flexShrink: 0,
  },
  footerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  },
  footerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  },
  footerStat: {
    fontSize: 11,
    color: 'var(--text-muted)',
    fontFamily: 'var(--font-mono)',
  },
  footerDot: {
    color: 'var(--text-muted)',
    fontSize: 10,
  },
  footerHint: {
    fontSize: 10,
    color: 'var(--text-muted)',
    fontFamily: 'var(--font-mono)',
    padding: '2px 6px',
    background: 'rgba(255,255,255,0.03)',
    borderRadius: 3,
    border: '1px solid rgba(255,255,255,0.04)',
  },
};
