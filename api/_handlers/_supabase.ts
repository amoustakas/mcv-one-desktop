import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { VercelRequest, VercelResponse } from '@vercel/node';

// ---------------------------------------------------------------------------
// Centralized Supabase client helpers for API routes.
//   - getServiceClient(): service role, bypasses RLS (use for cross-venture admin ops)
//   - getUserClient(jwt): user-scoped, RLS applies via Clerk-issued Supabase JWT
//   - requireAuth(req, res): unified Clerk token verification
// ---------------------------------------------------------------------------

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

// Singleton service client — bypasses RLS.
let _serviceClient: SupabaseClient | null = null;
export function getServiceClient(): SupabaseClient {
  if (!_serviceClient) {
    if (!SUPABASE_URL) throw new Error('SUPABASE_URL not configured');
    _serviceClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY || SUPABASE_ANON_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return _serviceClient;
}

// Per-request user-scoped client. Requires a Clerk-issued Supabase JWT so that
// auth.jwt() and RLS policies referencing auth.uid() work correctly.
export function getUserClient(jwt: string): SupabaseClient {
  if (!SUPABASE_URL) throw new Error('SUPABASE_URL not configured');
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${jwt}` } },
  });
}

// Auth context returned by requireAuth()
export interface AuthContext {
  userId: string;
  token: string;
}

// Extract Clerk token, verify it, and return { userId, token }. On failure,
// responds 401 and returns null so the caller can `if (!ctx) return;`.
export async function requireAuth(req: VercelRequest, res: VercelResponse): Promise<AuthContext | null> {
  const secretKey = process.env.CLERK_SECRET_KEY;
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : (req.cookies?.__session || null);

  if (!secretKey) {
    // Dev fallback: no Clerk configured. Return synthetic id so local dev keeps working.
    return { userId: 'dev-user', token: token || 'dev-token' };
  }
  if (!token) {
    res.status(401).json({ error: 'Authentication required' });
    return null;
  }
  try {
    const { verifyToken } = await import('@clerk/backend');
    const payload = await verifyToken(token, { secretKey });
    return { userId: payload.sub as string, token };
  } catch {
    res.status(401).json({ error: 'Invalid session' });
    return null;
  }
}

// Convenience: get a client that respects RLS for the current request.
// Falls back to service client if no auth is wired (dev).
export function getRequestClient(ctx: AuthContext): SupabaseClient {
  if (ctx.token && ctx.token !== 'dev-token') return getUserClient(ctx.token);
  return getServiceClient();
}
