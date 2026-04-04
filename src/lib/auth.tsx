import { ClerkProvider, SignIn, useAuth, useUser, UserButton } from '@clerk/clerk-react';
import { type ReactNode, useState, useEffect } from 'react';
import { setAuthTokenGetter } from './api';

const CLERK_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || '';

export function AuthProvider({ children }: { children: ReactNode }) {
  if (!CLERK_KEY) {
    // No Clerk key — run unauthenticated (dev mode)
    return <>{children}</>;
  }

  return (
    <ClerkProvider publishableKey={CLERK_KEY} afterSignOutUrl="/">
      <AuthGate>{children}</AuthGate>
    </ClerkProvider>
  );
}

function AuthGate({ children }: { children: ReactNode }) {
  const { isSignedIn, isLoaded, getToken } = useAuth();
  const [showSignIn, setShowSignIn] = useState(false);

  // Wire Clerk token into fetch helper for API auth
  useEffect(() => {
    if (isSignedIn) {
      setAuthTokenGetter(() => getToken());
    }
  }, [isSignedIn, getToken]);

  if (!isLoaded) {
    return (
      <div className="auth-loading">
        <div className="auth-spinner" />
        <span>Loading MCV One...</span>
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <div className="auth-screen">
        <div className="auth-brand">
          <span className="auth-logo">MCV</span>
          <span className="auth-logo-sub">ONE</span>
        </div>
        <p className="auth-tagline">Agentic Operating System</p>
        {showSignIn ? (
          <SignIn routing="hash" />
        ) : (
          <button className="auth-cta" onClick={() => setShowSignIn(true)}>
            Sign In to Continue
          </button>
        )}

        <style>{`
          .auth-screen {
            height: 100vh;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            background: var(--bg-deep);
            gap: var(--space-md);
          }
          .auth-brand { display: flex; align-items: baseline; gap: 6px; }
          .auth-logo { font-size: 3rem; font-weight: 800; color: var(--cyan); }
          .auth-logo-sub { font-size: 1.5rem; font-weight: 600; color: var(--text-secondary); letter-spacing: 4px; }
          .auth-tagline { font-size: var(--text-sm); color: var(--text-muted); margin-bottom: var(--space-lg); }
          .auth-cta {
            padding: 12px 32px;
            background: var(--cyan);
            color: var(--bg-deep);
            font-weight: 600;
            font-size: var(--text-sm);
            border-radius: var(--radius-md);
            transition: all var(--transition-fast);
          }
          .auth-cta:hover { background: var(--cyan-dim); }
          .auth-loading {
            height: 100vh;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: var(--space-md);
            color: var(--text-muted);
            font-size: var(--text-sm);
          }
          .auth-spinner {
            width: 24px; height: 24px;
            border: 2px solid var(--border);
            border-top-color: var(--cyan);
            border-radius: 50%;
            animation: spin 0.8s linear infinite;
          }
        `}</style>
      </div>
    );
  }

  return <>{children}</>;
}

export { useAuth, useUser, UserButton };
