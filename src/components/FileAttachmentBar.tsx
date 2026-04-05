import { X, Loader2, CheckCircle2, AlertCircle, FileText, FileVideo, FileAudio, FileImage } from 'lucide-react';
import { cn } from '../lib/utils';
import type { UploadedFile } from '../lib/kits/types';

// ---------------------------------------------------------------------------
// FileAttachmentBar — horizontal list of attached file chips with status
// ---------------------------------------------------------------------------

interface FileAttachmentBarProps {
  files: UploadedFile[];
  onRemove: (fileId: string) => void;
  className?: string;
}

function getIcon(mimeType: string) {
  if (mimeType.startsWith('video/')) return FileVideo;
  if (mimeType.startsWith('audio/')) return FileAudio;
  if (mimeType.startsWith('image/')) return FileImage;
  return FileText;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

function StatusIcon({ state }: { state: UploadedFile['state'] }) {
  switch (state) {
    case 'uploading':
    case 'processing':
      return <Loader2 size={12} className="mcv-file-chip-spinner" />;
    case 'active':
      return <CheckCircle2 size={12} style={{ color: 'var(--success)' }} />;
    case 'failed':
      return <AlertCircle size={12} style={{ color: 'var(--error)' }} />;
  }
}

export default function FileAttachmentBar({ files, onRemove, className }: FileAttachmentBarProps) {
  if (files.length === 0) return null;

  return (
    <div className={cn('mcv-file-bar', className)}>
      {files.map((file) => {
        const Icon = getIcon(file.mimeType);
        return (
          <div key={file.id} className={cn('mcv-file-chip', `mcv-file-chip-${file.state}`)}>
            <Icon size={14} className="mcv-file-chip-icon" />
            <span className="mcv-file-chip-name">{file.localName}</span>
            <span className="mcv-file-chip-size">{formatSize(file.sizeBytes)}</span>
            <StatusIcon state={file.state} />
            <button
              className="mcv-file-chip-remove"
              onClick={() => onRemove(file.id)}
              aria-label={`Remove ${file.localName}`}
            >
              <X size={12} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
