# Financials Engine — Implementation Plan (Plan 4 of 8)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans.

**Goal:** Build the financial reporting engine that reads from the universal ledger and produces P&L, balance sheet, cash flow statements, real-time metrics (MRR/ARR/churn/burn/runway), cost intelligence with savings tracking, and revenue recognition (ASC 606).

**Architecture:** Pure read layer over the ledger. Statement generators aggregate journal entry lines by account type and period. Real-time metrics use current balances + subscription data. Cost intelligence reads routing decisions. All computation is server-side (Vercel Functions) with results cached in Zustand.

**Tech Stack:** TypeScript 5.9, Supabase PG, Vercel Functions, Zustand, Recharts (for UI in Plan 7), decimal.js.

**Depends on:** Plan 1 (Ledger), Plan 2 (Payment Router — cost data), Plan 3 (Commerce — subscription data).

---

## Tasks

### Task 1: Finance Type Definitions
### Task 2: Supabase Migration (finance tables)
### Task 3: Financial Statements Generator (P&L, Balance Sheet, Cash Flow)
### Task 4: Real-Time Metrics Engine (MRR, ARR, churn, burn, runway)
### Task 5: Cost Intelligence Engine (fee analysis, savings, recommendations)
### Task 6: Revenue Recognition (ASC 606 schedules)
### Task 7: Finance API + Store + Kit + Barrel + Verification
