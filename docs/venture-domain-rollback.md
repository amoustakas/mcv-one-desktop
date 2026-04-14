# Venture Custom Domain — Rollback Runbook

## When to use

You added a custom domain to a venture, but verification is stalled or the
domain is causing traffic issues. This runbook gets you to a clean state
without losing venture data.

## Diagnosis (1 min)

Check the domain row in Supabase:

```sql
select id, name, custom_domains
from ventures where id = '<venture_id>';
```

Look at each element's `status`:

| Status      | Meaning                                              |
|-------------|------------------------------------------------------|
| `pending`   | Added but no DNS record detected yet — usually fine |
| `verifying` | DNS records found, Vercel/Clerk is issuing cert     |
| `verified`  | Live, routing traffic                                |
| `failed`    | Cert issuance or CNAME check failed                  |

If a domain has sat at `verifying` for more than 30 minutes, move to **Rollback**.

## Rollback options

### Option A — Remove one domain (preserves others)

```bash
curl -X POST $APP_URL/api/ventures \
  -H "Authorization: Bearer $CLERK_JWT" \
  -H "Content-Type: application/json" \
  -d '{"action":"remove-domain","venture_id":"<venture_id>","host":"<host>"}'
```

Or from `VentureDetailView → Domains` tab, hit the trash icon.

### Option B — Clear all custom_domains for a venture (soft reset)

```sql
update ventures set custom_domains = '[]'::jsonb where id = '<venture_id>';
```

This keeps the `ventures` row; the Domains tab shows an empty list. Safe —
no cascade, no data loss.

### Option C — Demote from dedicated Clerk tenant (last resort)

If the domain was attached to a Clerk organization and the cert issuance failed:

1. Remove the domain from the Clerk dashboard first (Organizations →
   *venture* → Verified Domains → delete).
2. Then run:

   ```sql
   update ventures set clerk_org_id = null where id = '<venture_id>';
   ```

3. The venture returns to the hybrid root-org mode with venture_assignments
   handling membership. RLS drops back to the `clerk_org_id IS NULL` policy.

**Do not delete the Clerk org itself** unless you also want to wipe
membership — invite the affected members to a fresh org first.

## Known failure modes

1. **Apex domain on a CDN that does not support ALIAS/ANAME** — Vercel requires
   A/AAAA records. If your registrar only supports CNAME at apex, use a
   subdomain (`www.betedge.ai`) or move DNS to Cloudflare (supports CNAME
   flattening).

2. **Conflicting `_acme-challenge` from a prior cert** — remove the stale TXT
   record at your DNS provider; wait 15 min; click Verify again.

3. **CAA record blocks Let's Encrypt** — check for `CAA` records at the apex;
   either remove them or add `0 issue "letsencrypt.org"`.

## Escalation

- **Clerk cert stuck > 2h**: open Clerk support ticket; include the org id and
  custom domain host.
- **Vercel routing correct but 404**: verify the SPA rewrite in `vercel.json`
  (`{"source":"/((?!api/).*)","destination":"/index.html"}`) is still present.
