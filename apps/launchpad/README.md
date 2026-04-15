# MCV Capital Launchpad

Public-facing raise pages + embeddable widgets. Part of [SPEC-EQC-001](../../docs/capital/PROTOCOL.md) Epic 4.

Reference implementation of the public-discovery surface of MCV Capital Protocol (MCP-Capital v0.1).

## Routes

- `/` — homepage with featured + active raises, reads from `capital_rounds.is_public + status IN (open, closing)` via `@mcv/capital-sdk`
- `/p/[venture]/[round]` — public raise detail page (server-rendered for SEO, OG tags, ISR 60s)
- `/widget/[venture]/[round]` — embeddable iframe widget (small card, 360×200-ish)
- `/protocol` — MCP-Capital v0.1 spec (planned: markdown render of `docs/capital/PROTOCOL.md`)
- `/build` — startup self-serve signup (planned: Epic 4 Story 2-5)

## Env

```bash
SUPABASE_URL=https://kovsdngjojzfebrxulyj.supabase.co
SUPABASE_ANON_KEY=<anon key>
# Or NEXT_PUBLIC_* variants if served client-side in future
```

Reads are anon-key — RLS allows public select on rounds where `is_public = true`.

## Dev

```bash
cd apps/launchpad
npm run dev           # port 3200
npm run build && npm start
```

## Architecture

- Next.js 15 App Router, SSR + ISR (60s revalidation)
- Reads `@mcv/capital-sdk` workspace package directly (no HTTP hop — same Supabase client on the server)
- No client-side JS for core discovery (server-rendered); interactivity arrives in later epics
- Iframe widget uses permissive frame-ancestors CSP for embedding on startup sites

## Deploy

Separate Vercel project, domain `launchpad.mcv.one`. Environment vars set in project settings.

## Widget Embed Example

```html
<iframe
  src="https://launchpad.mcv.one/widget/betedge/seed-round"
  width="360"
  height="220"
  frameborder="0"
  style="border-radius: 12px; overflow: hidden;"
></iframe>
```
