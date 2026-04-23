import { useState, type MouseEvent } from 'react';
import { Copy, Check } from 'lucide-react';

interface CopyButtonProps {
  value: string;
  label?: string;
  size?: number;
}

export default function CopyButton({ value, label, size = 12 }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const onClick = async (e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    e.preventDefault();
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    } catch {
      // Clipboard access can be denied in non-secure contexts; fail silent
      // so the demo isn't blocked by a browser permission dialog.
    }
  };

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label ?? `Copy ${value}`}
      style={{
        background: 'transparent',
        border: 'none',
        padding: '2px 4px',
        marginLeft: 6,
        cursor: 'pointer',
        color: copied ? 'var(--success)' : 'var(--text-muted)',
        verticalAlign: 'middle',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 3,
        fontSize: 10,
      }}
    >
      {copied ? (
        <>
          <Check size={size} /> copied
        </>
      ) : (
        <Copy size={size} />
      )}
    </button>
  );
}
