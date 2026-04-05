import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Download, FolderInput, Trash2, Lock, ExternalLink,
  Sparkles, Link2, Tag, Clock, Eye,
  File, Image, Film, Music, FileText, Code, Database,
} from 'lucide-react';
import { slideInRight } from '../../lib/animations';
import StorageProviderBadge from './StorageProviderBadge';
import StatusBadge from './StatusBadge';
import StageProgressBar from './StageProgressBar';
import type { StorageItem, AuditEntry } from '../../lib/storage/types';
import { getFileAuditLog } from '../../lib/storage/audit';

function getIcon(item: StorageItem) {
  const mime = item.mimeType || '';
  if (mime.startsWith('image')) return Image;
  if (mime.startsWith('video')) return Film;
  if (mime.startsWith('audio')) return Music;
  if (mime.includes('pdf') || mime.includes('document')) return FileText;
  if (mime.includes('json') || mime.includes('csv')) return Database;
  if (mime.includes('javascript') || mime.includes('typescript')) return Code;
  return File;
}

function formatSize(bytes?: number): string {
  if (!bytes) return 'Unknown';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

const AUDIT_ICONS: Record<string, typeof Clock> = {
  create: File, upload: File, read: Eye, download: Download,
  edit: FileText, rename: Tag, move: FolderInput, copy: File,
  trash: Trash2, restore: File, delete_permanent: Trash2,
  status_change: Clock, stage_change: Clock, visibility_change: Eye,
  share: ExternalLink, ai_analyze: Sparkles, ai_generate: Sparkles,
  lock: Lock, nft_certify: Link2,
};

interface Props {
  file: StorageItem | null;
  onClose: () => void;
  onDownload?: (file: StorageItem) => void;
  onDelete?: (file: StorageItem) => void;
  onMove?: (file: StorageItem) => void;
  onAiAnalyze?: (file: StorageItem) => void;
}

export default function FilePreviewPanel({ file, onClose, onDownload, onDelete, onMove, onAiAnalyze }: Props) {
  const [auditLog, setAuditLog] = useState<AuditEntry[]>([]);
  const [loadingAudit, setLoadingAudit] = useState(false);

  useEffect(() => {
    if (!file) return;
    setLoadingAudit(true);
    getFileAuditLog(file.id).then(entries => {
      setAuditLog(entries);
      setLoadingAudit(false);
    }).catch(() => setLoadingAudit(false));
  }, [file?.id]);

  const Icon = file ? getIcon(file) : File;

  return (
    <AnimatePresence>
      {file && (
        <motion.div
          className="preview-panel"
          variants={slideInRight}
          initial="hidden"
          animate="show"
          exit="hidden"
        >
          {/* Header */}
          <div className="preview-panel-header">
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
              File Details
            </span>
            <button
              onClick={onClose}
              style={{ color: 'var(--text-muted)', cursor: 'pointer', background: 'none', border: 'none' }}
            >
              <X size={16} />
            </button>
          </div>

          {/* Thumbnail / Preview */}
          <div className="preview-panel-thumb">
            {file.thumbnail ? (
              <img src={file.thumbnail} alt={file.name} />
            ) : (
              <Icon size={40} />
            )}
          </div>

          {/* Body */}
          <div className="preview-panel-body">
            {/* File name + status */}
            <div style={{ marginBottom: 'var(--space-md)' }}>
              <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', wordBreak: 'break-word' }}>
                {file.name}
              </h3>
              <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                <StatusBadge status={file.status} certification={file.certification} />
                <StorageProviderBadge provider={file.provider} />
              </div>
            </div>

            {/* Stage progress */}
            {file.stage && file.stage !== 'published' && (
              <div className="preview-section">
                <div className="preview-section-title">Stage</div>
                <StageProgressBar stage={file.stage} compact />
              </div>
            )}

            {/* Metadata */}
            <div className="preview-section">
              <div className="preview-section-title">Details</div>
              <div className="preview-field">
                <span className="preview-field-label">Size</span>
                <span className="preview-field-value">{formatSize(file.sizeBytes)}</span>
              </div>
              <div className="preview-field">
                <span className="preview-field-label">Type</span>
                <span className="preview-field-value">{file.mimeType || 'Unknown'}</span>
              </div>
              <div className="preview-field">
                <span className="preview-field-label">Provider</span>
                <span className="preview-field-value">{file.provider}</span>
              </div>
              <div className="preview-field">
                <span className="preview-field-label">Path</span>
                <span className="preview-field-value" style={{ fontSize: 10, maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {file.path}
                </span>
              </div>
              <div className="preview-field">
                <span className="preview-field-label">Created</span>
                <span className="preview-field-value">{formatDate(file.createdAt)}</span>
              </div>
              <div className="preview-field">
                <span className="preview-field-label">Modified</span>
                <span className="preview-field-value">{formatDate(file.updatedAt)}</span>
              </div>
              {file.versionCount > 1 && (
                <div className="preview-field">
                  <span className="preview-field-label">Versions</span>
                  <span className="preview-field-value">{file.versionCount}</span>
                </div>
              )}
            </div>

            {/* Tags */}
            {(file.tags.length > 0 || file.aiTags.length > 0) && (
              <div className="preview-section">
                <div className="preview-section-title">Tags</div>
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                  {file.tags.map(tag => (
                    <span key={tag} style={{
                      fontSize: 10, padding: '2px 8px', borderRadius: 'var(--radius-full)',
                      background: 'var(--bg-elevated)', color: 'var(--text-secondary)', border: '1px solid var(--border)',
                    }}>
                      {tag}
                    </span>
                  ))}
                  {file.aiTags.map(tag => (
                    <span key={tag} style={{
                      fontSize: 10, padding: '2px 8px', borderRadius: 'var(--radius-full)',
                      background: 'var(--cyan-glow)', color: 'var(--cyan)', border: '1px solid rgba(0,240,255,0.2)',
                    }}>
                      <Sparkles size={8} style={{ marginRight: 3 }} />{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* AI Summary */}
            {file.aiSummary && (
              <div className="preview-section">
                <div className="preview-section-title">AI Analysis</div>
                <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  {file.aiSummary}
                </p>
              </div>
            )}

            {/* Audit Activity */}
            <div className="preview-section">
              <div className="preview-section-title">Activity</div>
              {loadingAudit ? (
                <div style={{ fontSize: 11, color: 'var(--text-muted)', padding: 8 }}>Loading...</div>
              ) : auditLog.length === 0 ? (
                <div style={{ fontSize: 11, color: 'var(--text-muted)', padding: 8 }}>No activity recorded yet</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {auditLog.slice(0, 5).map(entry => {
                    const AuditIcon = AUDIT_ICONS[entry.action] || Clock;
                    return (
                      <div key={entry.id} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                        <div style={{
                          width: 24, height: 24, borderRadius: '50%', background: 'var(--bg-elevated)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                        }}>
                          <AuditIcon size={11} style={{ color: 'var(--text-muted)' }} />
                        </div>
                        <div>
                          <div style={{ fontSize: 11, color: 'var(--text-primary)' }}>
                            {entry.action.replace(/_/g, ' ')}
                          </div>
                          <div style={{ fontSize: 9, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                            {timeAgo(entry.timestamp)}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="preview-actions">
            <button
              onClick={() => onDownload?.(file)}
              style={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                padding: '8px 12px', borderRadius: 'var(--radius-md)', fontSize: 11, fontWeight: 500,
                background: 'var(--cyan-glow)', color: 'var(--cyan)', border: '1px solid rgba(0,240,255,0.2)', cursor: 'pointer',
              }}
            >
              <Download size={13} /> Download
            </button>
            <button
              onClick={() => onAiAnalyze?.(file)}
              style={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                padding: '8px 12px', borderRadius: 'var(--radius-md)', fontSize: 11, fontWeight: 500,
                background: 'var(--purple-glow)', color: 'var(--purple)', border: '1px solid rgba(139,92,246,0.2)', cursor: 'pointer',
              }}
            >
              <Sparkles size={13} /> AI Analyze
            </button>
          </div>
          <div className="preview-actions" style={{ borderTop: 'none', paddingTop: 0 }}>
            <button
              onClick={() => onMove?.(file)}
              style={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                padding: '8px 12px', borderRadius: 'var(--radius-md)', fontSize: 11, fontWeight: 500,
                background: 'var(--bg-card)', color: 'var(--text-secondary)', border: '1px solid var(--border)', cursor: 'pointer',
              }}
            >
              <FolderInput size={13} /> Move
            </button>
            <button
              onClick={() => onDelete?.(file)}
              style={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                padding: '8px 12px', borderRadius: 'var(--radius-md)', fontSize: 11, fontWeight: 500,
                background: 'rgba(239,68,68,0.06)', color: 'var(--error)', border: '1px solid rgba(239,68,68,0.15)', cursor: 'pointer',
              }}
            >
              <Trash2 size={13} /> Delete
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
