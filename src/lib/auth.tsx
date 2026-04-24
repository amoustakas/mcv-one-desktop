import {
  ClerkProvider,
  SignIn,
  useAuth,
  useUser,
  UserButton,
  useOrganization,
  useOrganizationList,
  OrganizationSwitcher,
  OrganizationProfile,
  CreateOrganization,
} from '@clerk/clerk-react';
import { type ReactNode, useState, useEffect } from 'react';
import { setAuthTokenGetter } from './api';
import { setClerkTokenGetter } from './supabase';
import { useKitStore } from '../stores/kits';

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

// Routes that must render without triggering the full-screen sign-in gate.
// The OnboardingHubView's WelcomeStep calls /api/onboarding?action=lookup-invite
// which is deliberately pre-auth — the user may arrive at this URL before ever
// having a Clerk session. Clerk context still wraps the subtree (so the welcome
// step's SignInButton works), but AuthGate yields instead of blocking.
function isPublicPath(): boolean {
  if (typeof window === 'undefined') return false;
  const path = window.location.pathname;
  return (
    path.startsWith('/p/') ||
    path === '/onboard' ||
    path.startsWith('/onboard/') ||
    // /accept-invite?code=... is the URL shape that api/_handlers/admin/invites.ts
    // emits for new invites; mirror it here so the same handler-generated link
    // lands pre-auth without a 404.
    path === '/accept-invite' ||
    path.startsWith('/accept-invite/')
  );
}

function AuthGate({ children }: { children: ReactNode }) {
  const { isSignedIn, isLoaded, getToken } = useAuth();
  const { user } = useUser();
  const [showSignIn, setShowSignIn] = useState(false);

  // Wire Clerk token into fetch helper for /api/* routes
  // AND into the Supabase client so direct browser reads respect RLS.
  useEffect(() => {
    if (isSignedIn) {
      setAuthTokenGetter(() => getToken());
      setClerkTokenGetter(() => getToken());
    } else {
      setClerkTokenGetter(null);
    }
  }, [isSignedIn, getToken]);

  // Hydrate Kit enable/disable preferences from Supabase once signed in.
  // Store's syncFromSupabase is a no-op if the user has no saved prefs yet.
  useEffect(() => {
    if (isSignedIn) {
      // Tiny delay lets the token getter get registered first, so the
      // /api/user-kits call goes through with the Bearer token attached.
      const t = setTimeout(() => {
        void useKitStore.getState().syncFromSupabase();
      }, 100);
      return () => clearTimeout(t);
    }
  }, [isSignedIn]);

  // Sync Clerk user to Supabase team_members
  useEffect(() => {
    if (isSignedIn && user) {
      fetch('/api/user-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'sync',
          clerk_user_id: user.id,
          name: user.fullName || user.firstName || user.primaryEmailAddress?.emailAddress?.split('@')[0],
          email: user.primaryEmailAddress?.emailAddress,
          avatar_url: user.imageUrl,
        }),
      }).catch(() => {});
    }
  }, [isSignedIn, user]);

  // Pre-auth public paths render their own chrome — skip both the spinner and
  // the sign-in screen so the onboarding wizard can do its lookup-invite call
  // before the user signs in.
  if (isPublicPath()) {
    return <>{children}</>;
  }

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

// Re-export Clerk primitives so consumers import from one place. This is
// a legacy barrel — mixing hook and component exports trips Fast Refresh's
// react-refresh/only-export-components rule because the bundler can't know
// which symbol a given import site wants when it needs to invalidate. A
// proper split into `lib/auth-hooks.ts` + `lib/auth-components.ts` would
// clear this cleanly and is tracked for a future refactor, but the payoff
// is dev-time UX (Fast Refresh granularity), not correctness, so we
// suppress the rule locally rather than expand this commit's scope.
export {
  // eslint-disable-next-line react-refresh/only-export-components
  useAuth,
  // eslint-disable-next-line react-refresh/only-export-components
  useUser,
  UserButton,
  // eslint-disable-next-line react-refresh/only-export-components
  useOrganization,
  // eslint-disable-next-line react-refresh/only-export-components
  useOrganizationList,
  OrganizationSwitcher,
  OrganizationProfile,
  CreateOrganization,
};
