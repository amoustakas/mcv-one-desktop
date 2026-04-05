# ADR-009: Monorepo Build Strategy (Turborepo + pnpm)

**Status:** APPROVED
**Date:** March 10, 2026
**Deciders:** Architecture Team, DevOps
**Context:**
MCV.ONE is a Turborepo monorepo with 31+ packages and 3 applications. Build times, dependency management, and CI efficiency are critical for developer velocity across a growing team.

**Problem:**
1. **Build times:** Full rebuild of 31 packages + 3 apps takes 5-10 minutes without caching.
2. **Dependency conflicts:** Multiple packages can drift on shared dependency versions.
3. **CI costs:** GitHub Actions minutes are expensive for full rebuilds on every PR.
4. **Local dev:** Developers need fast hot-reload across package boundaries.

**Decision:**
We use **Turborepo** for task orchestration with **pnpm** for dependency management, leveraging remote caching and intelligent change detection.

**Configuration:**
```json
// turbo.json
{
  "globalDependencies": ["**/.env.*local"],
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", ".next/**", "!.next/cache/**"],
      "env": ["DATABASE_URL", "NEXT_PUBLIC_*"]
    },
    "lint": { "dependsOn": ["^lint"] },
    "typecheck": { "dependsOn": ["^typecheck", "^build"] },
    "test": { "outputs": ["coverage/**"], "cache": false },
    "dev": { "cache": false, "persistent": true },
    "db:generate": { "cache": false },
    "db:push": { "cache": false }
  }
}
```

**pnpm Workspace:**
```yaml
# pnpm-workspace.yaml
packages:
  - 'apps/*'
  - 'packages/*'
```

**Version Pinning (pnpm overrides):**
```json
{
  "pnpm": {
    "overrides": {
      "drizzle-orm": "^0.45.1",
      "@trpc/server": "11.0.0-rc.446",
      "@trpc/client": "11.0.0-rc.446",
      "react": "^18.3.1",
      "react-dom": "^18.3.1",
      "zod": "^4.3.6"
    }
  }
}
```

**Remote Caching:**
- Provider: Vercel Remote Cache
- Sharing: CI + all local dev machines share cache
- Expected hit rate: 60-80% on PRs
- Time savings: 3-5 min per CI run

**Package Naming:**
- Scope: `@mcv/*`
- Convention: `@mcv/{tier-concept}` (e.g., `@mcv/auth`, `@mcv/crm`, `@mcv/ui`)

**Consequences:**
- Positive: 60-80% cache hits, fast local dev, single lockfile, consistent versions
- Negative: Turborepo learning curve, remote cache dependency
- Mitigation: Full rebuild still works without cache (just slower)
