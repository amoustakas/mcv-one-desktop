# Incident Response Guide

**Version**: 1.0 | **Date**: January 26, 2026

---

## Overview

This guide provides procedures for responding to incidents affecting the MCV.ONE Super Admin platform. It covers incident classification, response procedures, communication protocols, and post-incident analysis.

---

## Table of Contents

1. [Incident Classification](#incident-classification)
2. [Response Procedures](#response-procedures)
3. [Communication Protocols](#communication-protocols)
4. [Runbooks](#runbooks)
5. [Post-Incident Analysis](#post-incident-analysis)
6. [Contacts & Escalation](#contacts--escalation)

---

## Incident Classification

### Severity Levels

| Level | Name | Description | Response Time | Examples |
|-------|------|-------------|---------------|----------|
| **SEV-1** | Critical | Complete outage, data loss, security breach | < 15 min | Platform down, data breach, payment failures |
| **SEV-2** | Major | Significant degradation, feature unavailable | < 30 min | Slow performance, auth issues, partial outage |
| **SEV-3** | Minor | Limited impact, workaround available | < 2 hours | UI bugs, non-critical feature broken |
| **SEV-4** | Low | Minimal impact, cosmetic issues | < 24 hours | Typos, minor UI issues |

### Classification Matrix

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        INCIDENT CLASSIFICATION MATRIX                        │
│                                                                             │
│                           IMPACT                                            │
│                 Low          Medium         High          Critical          │
│              ┌─────────────────────────────────────────────────────┐        │
│     High    │   SEV-3    │   SEV-2    │   SEV-1    │   SEV-1    │        │
│              ├─────────────────────────────────────────────────────┤        │
│ U  Medium   │   SEV-4    │   SEV-3    │   SEV-2    │   SEV-1    │        │
│ R          ├─────────────────────────────────────────────────────┤        │
│ G  Low     │   SEV-4    │   SEV-4    │   SEV-3    │   SEV-2    │        │
│ E          ├─────────────────────────────────────────────────────┤        │
│ N  None    │   SEV-4    │   SEV-4    │   SEV-4    │   SEV-3    │        │
│ C          └─────────────────────────────────────────────────────┘        │
│ Y                                                                           │
│                                                                             │
│  Impact: Number of users/ventures affected                                  │
│  Urgency: Business criticality and time sensitivity                         │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Response Procedures

### SEV-1: Critical Incident

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       SEV-1 RESPONSE TIMELINE                                │
│                                                                             │
│  T+0      Detection & Alert                                                 │
│  ├──────► On-call engineer paged                                            │
│  │        Acknowledge alert within 5 minutes                                │
│  │                                                                          │
│  T+5      Initial Assessment                                                │
│  ├──────► Confirm severity level                                            │
│  │        Identify affected systems                                         │
│  │        Start incident channel                                            │
│  │                                                                          │
│  T+15     Assemble Team                                                     │
│  ├──────► Page additional engineers if needed                               │
│  │        Assign Incident Commander                                         │
│  │        Begin customer communication                                      │
│  │                                                                          │
│  T+30     Mitigation                                                        │
│  ├──────► Implement temporary fix                                           │
│  │        Consider rollback                                                 │
│  │        Update status page                                                │
│  │                                                                          │
│  T+60+    Resolution                                                        │
│  └──────► Deploy permanent fix                                              │
│           Verify recovery                                                   │
│           Schedule post-mortem                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Incident Response Steps

#### 1. Detection

```bash
# Automatic alerts via:
# - Sentry (errors)
# - Vercel (deployment failures)
# - Uptime monitors (health checks)
# - PagerDuty (on-call rotation)

# Manual detection:
# - Customer reports
# - Internal monitoring dashboards
```

#### 2. Acknowledgment

```bash
# Acknowledge in PagerDuty
# Create incident channel: #incident-YYYY-MM-DD-brief-description
# Post initial assessment
```

#### 3. Triage

```markdown
**Incident Triage Template**

**Time Detected:** YYYY-MM-DD HH:MM UTC
**Severity:** SEV-X
**Incident Commander:** @username
**Affected Systems:** [list systems]
**User Impact:** [describe impact]
**Initial Hypothesis:** [what we think is wrong]
**Current Status:** Investigating / Mitigating / Resolved
```

#### 4. Mitigation

```bash
# Common mitigation strategies:

# 1. Rollback deployment
vercel rollback

# 2. Enable maintenance mode
vercel env add MAINTENANCE_MODE true production
vercel deploy --prod

# 3. Scale resources (Vercel Pro)
# Contact Vercel support for emergency scaling

# 4. Disable problematic feature
# Update Edge Config to disable feature flag
```

#### 5. Resolution

```bash
# 1. Deploy fix
git push origin main  # Triggers auto-deploy

# 2. Verify fix
curl -s https://admin.mcv.one/api/health | jq

# 3. Monitor for 15 minutes
# Watch error rates in Sentry

# 4. Announce resolution
# Update status page
# Notify affected customers
```

---

## Communication Protocols

### Internal Communication

| Audience | Channel | Timing | Content |
|----------|---------|--------|---------|
| Engineering | #incident-* | Immediate | Technical details |
| Leadership | #leadership | Within 15 min | Impact summary |
| Support | #support | Within 30 min | Customer-facing info |
| All-hands | #general | After resolution | Summary |

### External Communication

#### Status Page Updates

```markdown
**Investigating** - HH:MM UTC
We are investigating reports of [issue description]. Users may experience [symptoms].

**Identified** - HH:MM UTC
The issue has been identified as [root cause]. We are working on a fix.

**Monitoring** - HH:MM UTC
A fix has been implemented. We are monitoring the situation.

**Resolved** - HH:MM UTC
This incident has been resolved. [Brief description of what happened and resolution].
```

#### Customer Email Template

```markdown
Subject: [Resolved] MCV.ONE Service Disruption - January 26, 2026

Dear Customer,

Earlier today, our platform experienced [brief description of issue].

**What happened:**
[2-3 sentences explaining the issue without technical jargon]

**Impact:**
[What features were affected and for how long]

**Resolution:**
[What we did to fix it]

**Prevention:**
[What we're doing to prevent recurrence]

We apologize for any inconvenience this may have caused. If you have any questions, please contact support@mcv.one.

Sincerely,
The MCV.ONE Team
```

---

## Runbooks

### Platform Unresponsive

```bash
# 1. Check deployment status
vercel ls mcv-one-super-admin --prod

# 2. Check health endpoint
curl -s https://admin.mcv.one/api/health | jq

# 3. Check Vercel status
open https://vercel-status.com

# 4. Check Supabase status
open https://status.supabase.com

# 5. If Vercel deployment issue:
vercel rollback

# 6. If database issue:
# Access Supabase dashboard
# Check connection limits
# Check for long-running queries

# 7. If Redis issue:
# Check Upstash dashboard
# Verify connection credentials
```

### Database Connection Errors

```bash
# 1. Check current connections
# In Supabase SQL editor:
SELECT count(*) FROM pg_stat_activity;

# 2. Kill long-running queries
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE state = 'active'
AND query_start < now() - interval '5 minutes';

# 3. Check connection pool settings
# Verify DATABASE_URL includes ?pgbouncer=true

# 4. Restart connection pool
# In Supabase dashboard: Settings > Database > Restart Pooler
```

### High Error Rate

```bash
# 1. Check Sentry for error patterns
open https://sentry.io/organizations/mcv/issues/

# 2. Identify error source
# - Deployment related? Check recent deploys
# - External service? Check service status
# - Traffic spike? Check analytics

# 3. If deployment related:
vercel rollback

# 4. If external service:
# Enable circuit breaker / fallback
# Update status page

# 5. If traffic spike:
# Rate limiting should handle automatically
# Contact Vercel for emergency scaling
```

### Authentication Failures

```bash
# 1. Check NextAuth configuration
# Verify NEXTAUTH_URL and NEXTAUTH_SECRET

# 2. Check OAuth provider status
# Google: https://status.cloud.google.com

# 3. Check session storage (Redis)
# Verify Upstash connection

# 4. Check database for user table issues
# Verify users table is accessible

# 5. Clear session cache if needed
# In Redis: DEL session:*
```

### Memory/Performance Issues

```bash
# 1. Check Vercel function logs
vercel logs mcv-one-super-admin --prod

# 2. Look for memory warnings
# "Function exceeded memory limit"

# 3. If function timeout:
# Check for N+1 queries
# Add database indexes
# Implement caching

# 4. If memory issue:
# Profile the function
# Reduce payload sizes
# Implement pagination
```

---

## Post-Incident Analysis

### Post-Mortem Template

```markdown
# Post-Mortem: [Incident Title]

**Date:** YYYY-MM-DD
**Duration:** X hours Y minutes
**Severity:** SEV-X
**Author:** [Name]
**Participants:** [List of responders]

## Summary
[2-3 sentence summary of what happened]

## Timeline (all times UTC)
| Time | Event |
|------|-------|
| HH:MM | First alert received |
| HH:MM | Incident acknowledged |
| HH:MM | Root cause identified |
| HH:MM | Fix deployed |
| HH:MM | Incident resolved |

## Impact
- **Users affected:** X
- **Ventures affected:** [list]
- **Duration:** X minutes
- **Revenue impact:** $X (if applicable)

## Root Cause
[Detailed technical explanation of what went wrong]

## Resolution
[What was done to fix the issue]

## Lessons Learned

### What went well
- [Item 1]
- [Item 2]

### What could be improved
- [Item 1]
- [Item 2]

## Action Items
| Action | Owner | Due Date | Status |
|--------|-------|----------|--------|
| [Action 1] | @user | YYYY-MM-DD | Open |
| [Action 2] | @user | YYYY-MM-DD | Open |

## References
- [Incident Slack channel]
- [Sentry issue link]
- [Related PR]
```

### Blameless Culture

- Focus on systems and processes, not individuals
- Assume everyone had good intentions
- Look for systemic improvements
- Share learnings openly
- Celebrate near-misses as learning opportunities

---

## Contacts & Escalation

### On-Call Rotation

| Role | Primary | Secondary | Escalation |
|------|---------|-----------|------------|
| Engineering | [rotation] | [rotation] | CTO |
| DevOps | [rotation] | [rotation] | VP Engineering |
| Security | [rotation] | [rotation] | CISO |

### External Contacts

| Service | Support | Status Page |
|---------|---------|-------------|
| Vercel | support@vercel.com | vercel-status.com |
| Supabase | support@supabase.io | status.supabase.com |
| Upstash | support@upstash.com | status.upstash.com |
| Cloudflare | support@cloudflare.com | cloudflarestatus.com |

### Escalation Matrix

```
SEV-4 → On-call Engineer
    │
    └── No response in 2h → Team Lead

SEV-3 → On-call Engineer
    │
    └── No response in 1h → Team Lead
        │
        └── No resolution in 4h → Engineering Manager

SEV-2 → On-call Engineer + Team Lead
    │
    └── No response in 30m → Engineering Manager
        │
        └── No resolution in 2h → VP Engineering

SEV-1 → On-call Engineer + Team Lead + Engineering Manager
    │
    └── No response in 15m → VP Engineering
        │
        └── All hands until resolved → CTO if needed
```

---

## Quick Reference Card

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    INCIDENT RESPONSE QUICK REFERENCE                         │
│                                                                             │
│  DETECT → ACKNOWLEDGE → TRIAGE → MITIGATE → RESOLVE → REVIEW               │
│                                                                             │
│  Key Commands:                                                              │
│  ─────────────                                                              │
│  vercel rollback                    # Instant rollback                      │
│  vercel logs mcv-one --prod         # View logs                             │
│  curl admin.mcv.one/api/health      # Health check                          │
│                                                                             │
│  Key Channels:                                                              │
│  ─────────────                                                              │
│  #incident-*                        # Active incident                       │
│  #mcv-alerts                        # Automated alerts                      │
│  #engineering                       # Team discussion                       │
│                                                                             │
│  Key Dashboards:                                                            │
│  ────────────────                                                           │
│  vercel.com/mcv/mcv-one             # Deployments                           │
│  sentry.io/mcv                      # Errors                                │
│  app.supabase.com                   # Database                              │
│  console.upstash.com                # Redis                                 │
│                                                                             │
│  Remember: Document everything. Communicate frequently. Stay calm.          │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

*MCV Global Consortium - Incident Response Guide*
