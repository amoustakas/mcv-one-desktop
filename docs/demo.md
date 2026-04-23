# MCV Foundation OS · Demo Script
**Audience:** U Waterloo × Google engineering · 2026-04-24
**Duration:** 5 minutes · **Surface:** Desktop app at `localhost:5173`

## 0 · Pre-flight (30 seconds, before audience sits down)
- [ ] `pnpm dev` running · confirm `localhost:5173` loads green
- [ ] Signed into Clerk as operator account · avatar visible top-right
- [ ] Supabase reachable — open **Settings → Diagnostics** and confirm green dot
- [ ] Browser at 100% zoom · no DevTools open · notifications silenced
- [ ] Pre-seed data: run `npx tsx scripts/seed-domain-registry.ts` and `seed-github-repos.ts` earlier that morning
- [ ] EventStream tab pre-opened in a second workspace (not yet visible)
- [ ] Phone silenced

## 1 · Command Center greeting (30 sec)
Open on Command Center. One sentence: *"This is the operator cockpit for MCV — a 12-venture portfolio run as one agentic OS."* Point at the status bar: presence, live venture count, system health. **Wow:** everything is real data, not a mock.

## 2 · Domain Portfolio (45 sec)
Click into **Foundation → Domains**. *"We track 40+ domains across Namecheap — expiry, auto-renew, the acquisition queue."* Click the `Seed 🔴🟠 urgents` button → toast appears bottom-right: *"N domain acquisitions staged · Ready to brief."* Hover `futurestate.holdings`, click the copy icon beside the FQDN. **Wow:** inline toast + tactile copy — the panel feels alive.

## 3 · Repository Portfolio (30 sec)
**Foundation → Repos.** *"Every GitHub repo in the org, synced hourly, with freshness tone."* Point at a green `today` chip and a red `240d ago` chip — the staleness signal is visible at a glance. Click a copy icon on a repo name.

## 4 · Deployment Portfolio (30 sec)
**Foundation → Deployments.** Filter `Prod`. *"Every Vercel deploy, the branch and commit that shipped it, live."* Copy a URL with the copy button.

## 5 · Draft Inbox (45 sec · if M4 has landed — otherwise skip to 6)
**Foundation → Draft Inbox.** *"Agents write drafts; humans approve. Zero-touch is the goal, oversight is the floor."* Press `j` three times to navigate down. Press `a` to approve one draft. Watch the right pane update and the list shrink.

## 6 · Event Stream · the payoff (60 sec)
Switch to **Internal → Event Stream.** *"Every module emits typed events onto a shared bus. This is our nervous system."* Click **🎬 Publish demo event** — three events cascade in over ~2 seconds:

1. `foundation.domain.acquired` — (futurestate.holdings, USD 4200)
2. `foundation.repo.synced` — (42 repos, 3 archived)
3. `foundation.deployment.live` — (mcv-investor production)

*"Every Foundation action you just saw was a real emission onto this bus. Other modules subscribe and react. That's why the event loop matters — it's what makes the system agentic rather than scripted."*

## Graceful fallbacks (if something misfires)
- **Stream blank on open?** Click `🎬 Publish demo event` — it's built for exactly this.
- **Supabase realtime slow?** Use the `Refetch` toolbar button to pull the last 100 envelopes.
- **Seed toast didn't appear?** Check the DevTools console for a `useToast` error (unlikely on master).
- **Copy button silently fails?** Browser denied clipboard; tell the story verbally and move on.
- **Any panel errors out?** Refresh the tab — state rehydrates in <1s.

## One-line close
*"Foundation OS is 1 of 7 layers. What you just saw is the bottom turtle — and it's typed, observable, and agent-safe all the way down."*
