# MCV.ONE Deployment Architecture
## Infrastructure, Environments & Release Strategy

**Version:** 1.0
**Last Updated:** March 10, 2026
**Reference:** ADR-001, ADR-009
**Status:** APPROVED
**Classification:** INTERNAL

---

## Executive Summary

This document defines the complete deployment architecture for MCV.ONE — covering environment topology, container orchestration, CI/CD pipeline integration, DNS/CDN strategy, database hosting, secrets management, and disaster recovery. The architecture supports a **progressive deployment model**: Vercel-first for rapid iteration during M0–M2, transitioning to Kubernetes for production workloads requiring GPU compute, long-running processes, and multi-venture isolation at M3+.

---

## 1. Environment Topology

### 1.1 Four-Environment Model

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                        MCV.ONE ENVIRONMENT TOPOLOGY                          │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  LOCAL DEV ──► DEVELOPMENT ──► STAGING ──► PRODUCTION                       │
│  (Docker)      (Vercel/Auto)   (Vercel/Auto)  (Vercel+K8s/Manual)          │
│                                                                              │
│  Branches:                                                                   │
│  feature/*     develop          staging         main                         │
│  ───────►      ───────►         ───────►        ───────►                    │
│  PR opens      Auto-deploy      Auto-deploy     Manual gate                 │
│                                                                              │
├──────────────────────────────────────────────────────────────────────────────┤
│  PREVIEW ENVIRONMENTS (Ephemeral)                                            │
│  ├── PR Preview: pr-{number}.preview.mcv.one                                │
│  ├── Auto-created on PR open                                                 │
│  └── Auto-destroyed on PR merge/close                                        │
└──────────────────────────────────────────────────────────────────────────────┘
```

### 1.2 Environment Configuration Matrix

| Property | Local | Development | Staging | Production |
|----------|-------|-------------|---------|------------|
| **URL** | `localhost:3000` | `dev.mcv.one` | `staging.mcv.one` | `admin.mcv.one` |
| **Branch** | `feature/*` | `develop` | `staging` | `main` |
| **Deploy Trigger** | Manual | Push to develop | Push to staging | Manual + confirmation |
| **Database** | Docker PostgreSQL 16 | Supabase (dev project) | Supabase (staging project) | Supabase (prod project) |
| **Redis** | Docker Redis 7 | Upstash (dev) | Upstash (staging) | Upstash (prod) |
| **Auth** | Better Auth (local) | Better Auth + OAuth | Better Auth + OAuth | Better Auth + OAuth + MFA |
| **AI/LLM** | OpenRouter (dev key) | OpenRouter (dev key) | OpenRouter (staging key) | OpenRouter (prod key) |
| **Feature Flags** | All enabled | Team-controlled | Release-gated | Gradual rollout |
| **Logging** | Console | Structured JSON | Structured JSON + Sentry | Structured JSON + Sentry + audit |
| **SSL/TLS** | None | Vercel auto | Vercel auto | Vercel auto + Cloudflare |
| **Backup** | None | None | Daily | Daily + 7d/4w/6m retention |
| **Replicas** | 1 | Vercel auto | Vercel auto | Vercel auto + K8s (3+) |

### 1.3 Multi-App Deployment Targets

| App | Dev URL | Staging URL | Production URL | Host |
|-----|---------|-------------|----------------|------|
| **Super Admin** | `dev.mcv.one` | `staging.mcv.one` | `admin.mcv.one` | Vercel |
| **Venture Admin** | `dev.app.mcv.one` | `staging.app.mcv.one` | `app.mcv.one` | Vercel |
| **Web Portal** | `dev.www.mcv.one` | `staging.www.mcv.one` | `www.mcv.one` | Vercel |
| **API (tRPC)** | `dev.api.mcv.one` | `staging.api.mcv.one` | `api.mcv.one` | Vercel + Edge |
| **ML Services** | N/A | `ml.staging.mcv.one` | `ml.mcv.one` | Kubernetes |
| **Agent Workers** | Local process | `agents.staging.mcv.one` | `agents.mcv.one` | Kubernetes |

---

## 2. Hosting Architecture

### 2.1 Hybrid Hosting Model

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                         HYBRID HOSTING ARCHITECTURE                          │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  LAYER A: EDGE (Vercel) ─────────────────────────────────────────────────── │
│  ├── Next.js Apps (SSR/SSG/ISR)                                              │
│  ├── tRPC API Routes (Serverless Functions)                                  │
│  ├── Edge Middleware (Auth, Rate Limiting, Geo-routing)                      │
│  ├── Image Optimization (Vercel OG)                                          │
│  └── Static Assets (CDN)                                                     │
│                                                                              │
│  LAYER B: MANAGED SERVICES ──────────────────────────────────────────────── │
│  ├── Supabase PostgreSQL (Primary Database)                                  │
│  │   ├── Direct: port 5432 (migrations, admin)                               │
│  │   └── Pooled: port 6543 (application queries via PgBouncer)               │
│  ├── Upstash Redis (Cache, Rate Limiting, Queues)                            │
│  ├── Upstash QStash (Async Job Processing)                                   │
│  ├── Cloudflare (DNS, CDN, WAF, DDoS)                                       │
│  └── OpenRouter (LLM Gateway — Claude, GPT-4, DeepSeek)                     │
│                                                                              │
│  LAYER C: KUBERNETES (AWS EKS) ── M3+ only ─────────────────────────────── │
│  ├── Queen Orchestrator (long-running agent process)                         │
│  ├── Ralph Worker Pods (code execution, builds)                              │
│  ├── Scout Monitors (data collection, anomaly detection)                     │
│  ├── ML Model Serving (TensorFlow/PyTorch, GPU nodes)                        │
│  ├── Redpanda Cluster (Event Streaming)                                      │
│  ├── Apache Iceberg + MinIO (Data Lakehouse)                                 │
│  └── n8n Workers (Automation Workflows)                                      │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Vercel Configuration (M0–M2 Primary)

**Monorepo Setup:**
```
vercel.json (per app):
{
  "buildCommand": "cd ../.. && pnpm turbo build --filter=admin",
  "installCommand": "pnpm install --frozen-lockfile",
  "framework": "nextjs",
  "outputDirectory": ".next"
}
```

**Vercel Project Mapping:**
- `mcv-admin` → `apps/admin` → `admin.mcv.one`
- `mcv-web` → `apps/web` → `www.mcv.one`
- `mcv-api` → `apps/api` → `api.mcv.one` (if separated)

**Edge Functions:**
- Auth middleware (token validation, session refresh)
- Rate limiting (per-venture, per-user)
- Geo-routing (jurisdiction compliance)
- Request logging (structured JSON)

**Serverless Function Limits:**
- Execution: 60s (Pro), 300s (Enterprise)
- Memory: 1024 MB default, 3008 MB max
- Payload: 4.5 MB request, 4.5 MB response
- Concurrent: 1000 (Pro)

### 2.3 Kubernetes Configuration (M3+ Long-Running)

**Cluster Specification:**
```yaml
# AWS EKS Cluster
cluster:
  name: mcv-one-production
  region: us-east-1
  version: "1.29"

node_groups:
  # General workloads
  general:
    instance_types: [t3.xlarge, t3.2xlarge]
    min_size: 3
    max_size: 10
    desired_size: 3
    disk_size: 100  # GB
    labels:
      workload-type: general

  # GPU workloads (ML inference)
  gpu:
    instance_types: [g4dn.xlarge]
    min_size: 0
    max_size: 4
    desired_size: 1
    disk_size: 200  # GB
    labels:
      workload-type: gpu
    taints:
      - key: nvidia.com/gpu
        value: "true"
        effect: NoSchedule

  # Agent workloads (high CPU)
  agents:
    instance_types: [c6i.2xlarge]
    min_size: 2
    max_size: 20
    desired_size: 3
    disk_size: 100
    labels:
      workload-type: agents
```

**Namespace Strategy:**
```
mcv-system          # Core platform services
mcv-agents          # Queen, Ralph, Scout pods
mcv-data            # Redpanda, Iceberg, MinIO
mcv-ml              # ML model serving
mcv-automation      # n8n workers
mcv-monitoring      # Prometheus, Grafana, Loki
betedge-prod        # BetEdge venture workloads
betedge-staging     # BetEdge staging
```

**Pod Security Standards:**
```yaml
securityContext:
  runAsNonRoot: true
  runAsUser: 1000
  readOnlyRootFilesystem: true
  allowPrivilegeEscalation: false
  capabilities:
    drop: ["ALL"]
```

---

## 3. Database Architecture

### 3.1 Supabase PostgreSQL

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                          DATABASE ARCHITECTURE                               │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  APPLICATION QUERIES ──► PgBouncer (port 6543) ──► PostgreSQL 15             │
│  (Drizzle ORM)           Transaction mode           + Extensions:            │
│                                                      ├── pgvector            │
│  MIGRATIONS/DDL ──────► Direct (port 5432) ──────►  ├── pg_cron             │
│  (drizzle-kit)                                       ├── pg_stat_statements  │
│                                                      ├── uuid-ossp           │
│                                                      └── postgis (future)    │
│                                                                              │
│  RLS POLICIES ────────────────────────────────────────────────────────────── │
│  ├── venture_isolation: venture_id = current_setting('app.venture_id')       │
│  ├── user_row_access: user_id = auth.uid()                                  │
│  └── admin_override: role IN ('super_admin', 'venture_admin')                │
│                                                                              │
│  BACKUP STRATEGY ─────────────────────────────────────────────────────────── │
│  ├── Point-in-Time Recovery: Supabase managed (up to 7 days)                │
│  ├── Daily Snapshots: pg_dump at 03:00 UTC → S3                             │
│  ├── Retention: 7 daily, 4 weekly, 6 monthly                                │
│  └── Cross-Region: Replicate to us-west-2 (DR)                              │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

### 3.2 Connection Configuration

```typescript
// packages/db/drizzle.config.ts
export default {
  dialect: "postgresql",
  schema: "./src/schema/index.ts",
  out: "./src/migrations",
  dbCredentials: {
    // DDL operations (migrations) — direct connection
    url: process.env.DIRECT_DATABASE_URL!,  // port 5432
  },
};

// Runtime queries — pooled connection
const queryClient = postgres(process.env.DATABASE_URL!, {
  // port 6543 via PgBouncer
  max: 20,
  idle_timeout: 20,
  connect_timeout: 10,
  prepare: false, // Required for PgBouncer transaction mode
});
```

### 3.3 Migration Strategy

```
Development:   drizzle-kit push (direct schema sync)
Staging:       drizzle-kit migrate (versioned migrations)
Production:    drizzle-kit migrate (versioned, reviewed, approved)
                └── Requires PR approval + migration review checklist
```

---

## 4. CDN & DNS Architecture

### 4.1 DNS Configuration

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  DOMAIN: mcv.one                                                             │
│  Registrar: Cloudflare                                                       │
│  DNS: Cloudflare (proxy enabled)                                             │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  A/CNAME Records:                                                            │
│  ├── admin.mcv.one      → CNAME → cname.vercel-dns.com (proxied)           │
│  ├── app.mcv.one        → CNAME → cname.vercel-dns.com (proxied)           │
│  ├── www.mcv.one        → CNAME → cname.vercel-dns.com (proxied)           │
│  ├── api.mcv.one        → CNAME → cname.vercel-dns.com (proxied)           │
│  ├── ml.mcv.one         → A → K8s LoadBalancer IP (proxied)                │
│  ├── agents.mcv.one     → A → K8s LoadBalancer IP (proxied)                │
│  └── *.staging.mcv.one  → CNAME → cname.vercel-dns.com                     │
│                                                                              │
│  Venture Domains:                                                            │
│  ├── betedge.app        → Cloudflare (separate zone)                        │
│  ├── mcv.gg             → Reserved (gaming platform)                        │
│  ├── edgeiq.app         → Reserved (prediction markets)                     │
│  ├── fullgain.ca        → Active (agency services)                          │
│  └── arqlabs.ca         → Reserved (R&D)                                    │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

### 4.2 Cloudflare Configuration

**Security:**
- SSL/TLS: Full (Strict) mode
- WAF: OWASP Core Rule Set enabled
- Rate Limiting: 100 req/s per IP (API), 30 req/s per IP (auth endpoints)
- Bot Management: Challenge mode for suspicious traffic
- DDoS Protection: Always-on L3/L4/L7

**Performance:**
- Caching: Static assets (1 year), API responses (no-cache)
- Argo Smart Routing: Enabled (production)
- Early Hints: Enabled
- HTTP/3: Enabled
- Brotli Compression: Enabled

---

## 5. Secrets Management

### 5.1 Secret Categories

| Category | Storage | Examples |
|----------|---------|----------|
| **Infrastructure** | GitHub Secrets | `VERCEL_TOKEN`, `VERCEL_ORG_ID` |
| **Database** | GitHub Secrets + Vercel Env | `DATABASE_URL`, `DIRECT_DATABASE_URL` |
| **Auth** | Vercel Env (encrypted) | `BETTER_AUTH_SECRET`, OAuth client secrets |
| **External APIs** | Vercel Env (encrypted) | `OPENROUTER_API_KEY`, `STRIPE_SECRET_KEY` |
| **K8s Secrets** | AWS Secrets Manager → K8s | DB passwords, API keys for agent pods |
| **Monitoring** | Vercel Env | `SENTRY_AUTH_TOKEN`, `POSTHOG_API_KEY` |

### 5.2 Secret Rotation Policy

| Secret Type | Rotation Frequency | Method |
|------------|-------------------|--------|
| Database passwords | 90 days | AWS Secrets Manager auto-rotate |
| Auth secrets | 180 days | Manual with zero-downtime (dual-key) |
| API keys (internal) | 90 days | Automated via n8n workflow |
| API keys (external) | Per provider policy | Manual with monitoring |
| TLS certificates | Auto (Let's Encrypt/Cloudflare) | Cert-manager auto-renew |

### 5.3 Environment Variable Sync

```bash
# Sync env vars across Vercel projects
vercel env pull .env.local --environment=development
vercel env pull .env.staging --environment=preview
vercel env pull .env.production --environment=production

# Required variables (all environments)
DATABASE_URL=                    # Pooled connection (port 6543)
DIRECT_DATABASE_URL=             # Direct connection (port 5432)
SUPABASE_URL=                    # Supabase project URL
NEXT_PUBLIC_SUPABASE_URL=        # Public Supabase URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=   # Public anon key
SUPABASE_SERVICE_ROLE_KEY=       # Service role (server-only)
BETTER_AUTH_SECRET=              # Session encryption (32 bytes)
UPSTASH_REDIS_REST_URL=          # Redis endpoint
UPSTASH_REDIS_REST_TOKEN=        # Redis auth
OPENROUTER_API_KEY=              # LLM gateway
NEXT_PUBLIC_APP_URL=             # App base URL
```

---

## 6. Local Development Setup

### 6.1 Docker Compose (Local)

```yaml
# docker-compose.yml — Local development stack
services:
  db:
    image: postgres:16-alpine
    container_name: mcv-one-db
    ports: ["5432:5432"]
    environment:
      POSTGRES_DB: mcv_one
      POSTGRES_USER: mcv
      POSTGRES_PASSWORD: ${DB_PASSWORD:-devpassword}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U mcv -d mcv_one"]
      interval: 10s
      retries: 5

  redis:
    image: redis:7-alpine
    container_name: mcv-one-redis
    ports: ["6379:6379"]
    command: >
      redis-server
      --maxmemory 256mb
      --maxmemory-policy allkeys-lru
      --appendonly yes
    volumes:
      - redis_data:/data

  mailpit:
    image: axllent/mailpit
    container_name: mcv-one-mail
    ports:
      - "8025:8025"   # Web UI
      - "1025:1025"   # SMTP
    profiles: ["tools"]

  pgadmin:
    image: dpage/pgadmin4
    container_name: mcv-one-pgadmin
    ports: ["5050:80"]
    environment:
      PGADMIN_DEFAULT_EMAIL: admin@mcv.one
      PGADMIN_DEFAULT_PASSWORD: admin
    profiles: ["tools"]

volumes:
  postgres_data:
  redis_data:

networks:
  default:
    name: mcv-network
```

### 6.2 Developer Quick Start

```bash
# 1. Clone and install
git clone git@github.com:mcv-global/mcv-one.git
cd mcv-one
pnpm install

# 2. Start local services
docker compose up -d
docker compose --profile tools up -d  # Optional: pgAdmin, Mailpit

# 3. Setup environment
cp .env.example .env.local

# 4. Initialize database
pnpm db:generate   # Generate Drizzle client
pnpm db:push       # Push schema to local DB
pnpm db:seed       # Seed with dev data

# 5. Start development
pnpm dev           # Starts all apps via Turborepo
```

---

## 7. Monitoring & Health Checks

### 7.1 Health Check Endpoints

| Endpoint | Check | Frequency |
|----------|-------|-----------|
| `/api/health` | App alive, DB connected, Redis connected | 30s |
| `/api/health/ready` | All dependencies ready | 10s (K8s) |
| `/api/health/live` | Process alive | 5s (K8s) |
| `/api/health/deep` | Full dependency check with latencies | On-demand |

### 7.2 Monitoring Stack (Production)

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  APPLICATION MONITORING                                                      │
│  ├── Sentry: Error tracking, performance monitoring, session replay          │
│  ├── PostHog: Product analytics, feature flags, session recording           │
│  └── Vercel Analytics: Web vitals, serverless function metrics              │
│                                                                              │
│  INFRASTRUCTURE MONITORING (K8s — M3+)                                       │
│  ├── Prometheus: Metrics collection (15s scrape interval)                    │
│  ├── Grafana: Dashboards and alerting                                        │
│  ├── Loki: Log aggregation (structured JSON)                                 │
│  └── Alertmanager: Alert routing (Slack, PagerDuty)                          │
│                                                                              │
│  DATABASE MONITORING                                                         │
│  ├── Supabase Dashboard: Connection pool, query performance                  │
│  ├── pg_stat_statements: Slow query identification                           │
│  └── Upstash Dashboard: Redis metrics, rate limit stats                      │
│                                                                              │
│  UPTIME MONITORING                                                           │
│  ├── Better Uptime / Checkly: External synthetic checks                      │
│  └── Cloudflare Health Checks: Origin server monitoring                      │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## 8. Disaster Recovery

### 8.1 Recovery Targets

| Component | RPO (Data Loss) | RTO (Downtime) | Strategy |
|-----------|----------------|----------------|----------|
| Application (Vercel) | 0 | <5 min | Multi-region, auto-failover |
| Database (Supabase) | <1 hour | <30 min | PITR + daily snapshots |
| Redis (Upstash) | <5 min | <10 min | Multi-region replication |
| K8s Workloads | N/A (stateless) | <15 min | Pod auto-restart + HPA |
| ML Models | N/A (immutable) | <30 min | S3 artifact restore |
| Event Stream (Redpanda) | <1 min | <15 min | 3-node cluster, replication=3 |

### 8.2 Backup Schedule

```
Database:
  03:00 UTC — Full pg_dump → S3 (mcv-backups-us-east-1)
  Continuous — WAL archiving (PITR up to 7 days)

Retention:
  Daily:   7 snapshots
  Weekly:  4 snapshots (Sunday)
  Monthly: 6 snapshots (1st of month)

Cross-Region:
  S3 replication: us-east-1 → us-west-2

Redis:
  Upstash managed replication (multi-region)

Secrets:
  AWS Secrets Manager (versioned, encrypted)
  GitHub Secrets (encrypted, audit-logged)
```

---

## 9. Cost Projections

### 9.1 M0–M2 (Vercel-First, Minimal K8s)

| Service | Tier | Monthly Cost |
|---------|------|-------------|
| Vercel | Pro (3 projects) | $60 |
| Supabase | Pro | $25 |
| Upstash Redis | Pro | $10 |
| Upstash QStash | Free tier | $0 |
| Cloudflare | Pro | $20 |
| OpenRouter | Pay-per-use | ~$50-200 |
| Sentry | Team | $26 |
| GitHub | Team | $4/user |
| **Subtotal** | | **~$200-400/mo** |

### 9.2 M3+ (Kubernetes Added)

| Service | Tier | Monthly Cost |
|---------|------|-------------|
| All M0-M2 services | | ~$400 |
| AWS EKS Cluster | | $73 |
| EC2 (3x t3.xlarge general) | On-demand | ~$450 |
| EC2 (1x g4dn.xlarge GPU) | On-demand | ~$380 |
| EC2 (3x c6i.2xlarge agents) | On-demand | ~$740 |
| S3 (backups, artifacts, lakehouse) | | ~$50 |
| CloudWatch Logs | | ~$30 |
| **Subtotal** | | **~$2,100-2,500/mo** |

*Note: Reserved instances reduce EC2 costs by 30-60%. Spot instances for agent pods reduce further.*

---

## 10. Release Process

### 10.1 GitFlow Branching

```
main (production)
 ├── hotfix/* ──► main (emergency patches)
 │
staging (pre-production)
 │
develop (integration)
 ├── feature/* (feature branches)
 ├── fix/* (bug fix branches)
 └── chore/* (maintenance branches)
```

### 10.2 Release Checklist

```
PRE-RELEASE:
  □ All feature PRs merged to develop
  □ CI passes on develop (lint, typecheck, test, build)
  □ Database migrations reviewed and tested
  □ Feature flags configured for gradual rollout
  □ Changelog updated (CHANGELOG.md)

STAGING DEPLOY:
  □ Merge develop → staging
  □ Auto-deploy to staging.mcv.one
  □ E2E tests pass (Playwright)
  □ Manual QA sign-off
  □ Performance baseline check

PRODUCTION DEPLOY:
  □ Create release PR: staging → main
  □ Two approvals required
  □ Trigger manual deploy workflow
  □ Confirm with "DEPLOY" input
  □ Health check passes (5 retries, 10s intervals)
  □ Smoke test critical paths
  □ Create GitHub Release with tag
  □ Notify team via Slack

POST-DEPLOY:
  □ Monitor error rates (Sentry) for 30 min
  □ Monitor performance (Vercel Analytics) for 1 hour
  □ Confirm feature flag rollout schedule
```

---

## Document Control

| Field | Value |
|-------|-------|
| **Author** | MCV Engineering |
| **Reviewers** | Tony Moustakas |
| **Created** | March 10, 2026 |
| **Version** | 1.0 |
| **Next Review** | April 10, 2026 |
| **Dependencies** | ADR-001 (Architecture), ADR-009 (Monorepo Build) |
