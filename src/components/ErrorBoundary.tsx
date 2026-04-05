import { Component, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ViewErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        gap: 16, padding: 48, color: 'var(--text-secondary)', textAlign: 'center',
      }}>
        <AlertTriangle size={32} style={{ color: 'var(--status-error)' }} />
        <h3 style={{ color: 'var(--text-primary)', margin: 0 }}>
          {this.props.fallbackTitle || 'Something went wrong'}
        </h3>
        <p style={{ margin: 0, fontSize: '0.85rem', maxWidth: 400 }}>
          {this.state.error?.message || 'An unexpected error occurred in this view.'}
        </p>
        <button
          onClick={() => this.setState({ hasError: false, error: null })}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '8px 16px', borderRadius: 8,
            background: 'var(--surface)', border: '1px solid var(--border)',
            color: 'var(--text-primary)', cursor: 'pointer', fontSize: '0.85rem',
          }}
        >
          <RefreshCw size={14} /> Try Again
        </button>
      </div>
    );
  }
}
