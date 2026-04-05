# Royalties, Escrow & Transaction Intelligence — Implementation Plan (Plan 5 of 8)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans.

**Goal:** Build creator royalties (automatic splits on every sale/resale), escrow service (milestone-based fund holding), and Transaction Intelligence (receipts are dead — living transaction records replace static PDFs).

**Architecture:** Royalties use the split payment engine from Plan 2. Escrow uses dedicated ledger accounts. Transaction Intelligence wraps every payment/refund/credit/transfer in a queryable, linked record with provenance chains.

**Tech Stack:** TypeScript 5.9, Zod 4.3, Supabase PG, Vercel Functions, Zustand.

**Depends on:** Plans 1-3 (Ledger, Router, Commerce).

---

## Tasks

### Task 1: Types + Migration
### Task 2: Royalty Engine
### Task 3: Escrow Service
### Task 4: Transaction Intelligence
### Task 5: API + Store + Kit + Barrel
