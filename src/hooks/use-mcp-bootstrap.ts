import { useEffect, useRef } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { useMcpStore } from '../stores/mcp';

/**
 * Session-start MCP bootstrap.
 *
 * Initializes the MCP store once the Clerk session is loaded + signed in.
 * Auto-connects any registered servers that (a) have `autoConnect: true`
 * and (b) don't require OAuth/API credentials the client can't resolve.
 *
 * OAuth tokens and API keys cannot safely be exposed to the browser, so
 * this bootstrap passes empty maps. Servers whose env uses `$oauth:X`
 * or `$apikey:X` placeholders will error during connect — that's expected
 * and surfaced in IntegrationsHub. Users connect those explicitly after
 * setting up credentials.
 *
 * Mount once near the app root (e.g. inside App.tsx after ClerkProvider).
 */
export function useMcpBootstrap(): void {
  const { isLoaded, isSignedIn } = useAuth();
  const initialize = useMcpStore((s) => s.initialize);
  const initialized = useMcpStore((s) => s.initialized);
  const bootstrappedRef = useRef(false);

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;
    if (initialized || bootstrappedRef.current) return;
    bootstrappedRef.current = true;

    // Empty credential maps — zero-credential servers (memory, fetch, time,
    // filesystem) auto-connect. Credential-required servers surface errors
    // in IntegrationsHub and are connected manually after setup.
    initialize({}, {}).catch((err) => {
      // Non-fatal: MCP is an augmentation, app still works.
      if (import.meta.env.DEV) {
        console.warn('[mcp-bootstrap] initialize failed:', err);
      }
    });
  }, [isLoaded, isSignedIn, initialized, initialize]);
}
