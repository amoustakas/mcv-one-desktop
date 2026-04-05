import { useState, useRef, useCallback } from 'react';
import { cn } from '../lib/utils';
import { Upload } from 'lucide-react';

// ---------------------------------------------------------------------------
// FileDropzone — drag-drop + click file upload for multimodal chat input
// ---------------------------------------------------------------------------

const ACCEPTED_TYPES = [
  'application/pdf',
  'audio/*',
  'video/mp4',
  'video/webm',
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/gif',
];

const ACCEPT_STRING = ACCEPTED_TYPES.join(',');

interface FileDropzoneProps {
  onFiles: (files: File[]) => void;
  disabled?: boolean;
  className?: string;
}

/*
function getFileIcon(type: string) {
  if (type.startsWith('video/')) return FileVideo;
  if (type.startsWith('audio/')) return FileAudio;
  if (type.startsWith('image/')) return FileImage;
  return FileText;
}
*/

export default function FileDropzone({ onFiles, disabled, className }: FileDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      if (disabled) return;
      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0) onFiles(files);
    },
    [onFiles, disabled],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleClick = useCallback(() => {
    if (!disabled) inputRef.current?.click();
  }, [disabled]);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      if (files.length > 0) onFiles(files);
      // Reset so the same file can be re-selected
      e.target.value = '';
    },
    [onFiles],
  );

  return (
    <div
      className={cn(
        'mcv-file-dropzone',
        isDragging && 'mcv-file-dropzone-active',
        disabled && 'mcv-file-dropzone-disabled',
        className,
      )}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleClick(); }}
    >
      <Upload size={16} />
      <span className="mcv-file-dropzone-label">
        {isDragging ? 'Drop files here' : 'Attach files'}
      </span>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT_STRING}
        multiple
        onChange={handleInputChange}
        style={{ display: 'none' }}
      />
    </div>
  );
}
