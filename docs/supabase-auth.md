# Clerk → Supabase authentication

Wires Clerk-issued tokens into Supabase so RLS policies referencing `auth.uid()` and `auth.jwt()` fire correctly.

Two integration paths exist. Pick **one**. The browser helper `getAuthedClient()` in `src/lib/supabase.ts` works with both.

---

## Option A — Native third-party auth (recommended, no shared secret)

Clerk started shipping native Supabase integration in late 2024. Supabase validates Clerk session tokens directly against Clerk's JWKS — no shared secret, no template to maintain.

### Clerk dashboard
1. **Integrations → Supabase → Enable**.
2. Copy the **Clerk domain URL** shown (e.g. `https://clerk.<your-app>.com`).

### Supabase dashboard
1. **Authentication → Sign In / Up → Third Party Auth → Add Provider → Clerk**.
2. Paste the Clerk domain URL. Save.

### Client usage
```tsx
import { useAuth } from '@clerk/clerk-react';
import { getAuthedClient } from '@/lib/supabase';

const { getToken } = useAuth();
const sb = await getAuthedClient(() => getToken());   // no template arg
```

---

## Option B — Legacy JWT template (shared JWT secret)

### Clerk dashboard
1. **JWT Templates → New template**.
2. Name: **`supabase`** (exactly).
3. Signing algorithm: **HS256**.
4. Signing key: paste **Supabase JWT Secret** (Supabase dashboard → Settings → API → JWT Secret).
5. Claims:
   ```json
   { "aud": "authenticated", "role": "authenticated" }
   ```
6. Save.

### Vercel env
Add `SUPABASE_JWT_SECRET` (same value as above) to your project for Production + Preview.

### Client usage
```tsx
const sb = await getAuthedClient(() => getToken({ template: 'supabase' }));
```

---

## Required env vars (both options)

Server (Vercel):
```
SUPABASE_URL=https://kovsdngjojzfebrxulyj.supabase.co
SUPABASE_SERVICE_KEY=<service-role>
SUPABASE_ANON_KEY=<anon>
CLERK_SECRET_KEY=<clerk secret>
# Option B only:
SUPABASE_JWT_SECRET=<shared secret>
```

Browser:
```
VITE_SUPABASE_URL=https://kovsdngjojzfebrxulyj.supabase.co
VITE_SUPABASE_ANON_KEY=<anon>
```

---

## Server-side usage

```ts
import { getServiceClient, getUserClient, requireAuth } from './_supabase';

export default async function handler(req, res) {
  const ctx = await requireAuth(req, res);    // { userId, token }
  if (!ctx) return;

  // Use service client for admin / cross-venture ops (bypasses RLS):
  const admin = getServiceClient();

  // OR use a user-scoped client where RLS should apply:
  const user = getUserClient(ctx.token);
}
```

---

## Verification

In Supabase SQL Editor, run as an authenticated user session:
```sql
select auth.jwt();        -- jsonb with sub = your clerk user_id, role = 'authenticated'
select auth.uid();        -- your clerk user_id (text)
```

Clerk user IDs are strings like `user_2abc...`, not UUIDs. Use `text` columns, not `uuid`, for `created_by` / `user_id` fields.
