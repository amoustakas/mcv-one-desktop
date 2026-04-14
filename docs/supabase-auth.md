# Clerk → Supabase JWT Bridge

Wires Clerk-issued JWTs into Supabase so RLS policies that reference `auth.uid()` and `auth.jwt()` trigger correctly. Without this bridge the browser client is anonymous and RLS blocks user-scoped reads.

## One-time setup (Clerk dashboard)

1. Open your Clerk project → **JWT Templates** → **New template**.
2. Name it exactly `supabase`.
3. Signing algorithm: **HS256**.
4. Signing key: **your Supabase JWT secret** (Supabase dashboard → Project Settings → API → `JWT Secret`).
5. Claims:
   ```json
   {
     "aud": "authenticated",
     "role": "authenticated"
   }
   ```
6. Save.

## Environment variables

Server-side (Vercel project settings):
```
SUPABASE_URL=https://kovsdngjojzfebrxulyj.supabase.co
SUPABASE_SERVICE_KEY=<service-role-key>   # bypasses RLS, server-only
SUPABASE_ANON_KEY=<anon-key>              # user-scoped, RLS applies
SUPABASE_JWT_SECRET=<from-supabase-dashboard>
CLERK_SECRET_KEY=<from-clerk-dashboard>
```

Browser-side (`.env.local`):
```
VITE_SUPABASE_URL=https://kovsdngjojzfebrxulyj.supabase.co
VITE_SUPABASE_ANON_KEY=<anon-key>
```

## Usage

### Server (API routes)

```ts
import { getServiceClient, requireAuth } from './_supabase';

export default async function handler(req, res) {
  const ctx = await requireAuth(req, res);   // { userId, token }
  if (!ctx) return;
  const supabase = getServiceClient();        // or getUserClient(ctx.token) for RLS
  // ...
}
```

Use `getServiceClient()` for admin ops (cross-venture reads, audit log inserts). Use `getUserClient(ctx.token)` when you want RLS to apply to the query.

### Browser (React)

```tsx
import { useAuth } from '@clerk/clerk-react';
import { getAuthedClient } from '@/lib/supabase';

function useSupabase() {
  const { getToken } = useAuth();
  return async () => getAuthedClient(() => getToken({ template: 'supabase' }));
}
```

## Verification

```sql
-- In Supabase SQL editor, as the user session:
select auth.jwt();
-- Should return a jsonb with "sub" = your Clerk user_id, "role" = "authenticated"

select auth.uid();
-- Should return your Clerk user_id as text/uuid
```

## RLS pattern (example)

```sql
create policy "my_rows" on my_table
  for select using (created_by = auth.jwt()->>'sub');
```

Note: Clerk user IDs are not UUIDs — they look like `user_2abc...`. Store them as `text` in your tables, not `uuid`.
