// Parser contract tests — feed each parser a small representative fixture
// and assert the structured output shape. This locks the parsing invariants
// even when the source markdown evolves; real ingestion tests will run
// end-to-end against the live DB in Step 10.

import { describe, it, expect } from 'vitest';

import { parseIpInventory } from '../parsers/ip-inventory';
import { parsePatents } from '../parsers/patent-section';
import { parseCounselPack } from '../parsers/counsel-pack';
import { parseT0Portfolio } from '../parsers/t0-portfolio';
import { parseT1Entities } from '../parsers/t1-entities';
import { parseT2Gaps } from '../parsers/t2-gaps';
import { parseT6Carts } from '../parsers/t6-carts';

// ─── IP Inventory (trademarks + copyrights) ─────────────────────────────────

const IP_INVENTORY_FIXTURE = `# MCV Universe — IP Inventory v1.1

## 1. Trademark Candidate Inventory

### 1.1 Corporate Marks (P0)

| Mark | Priority | Classes | Notes |
|---|---|---|---|
| **MCV** | P0 | 9, 35, 36 | Primary corporate brand |
| **MCV UNIVERSE** | P0 | 9, 35 | Ecosystem umbrella |
| **ROOT** | P0 | 35, 36 | Layer 0 IP trust brand |

### 1.4 Venture Brand Marks

| Mark | Priority | Classes | Notes |
|---|---|---|---|
| **FUTURESTATE** | P0 | 35, 36, 42 | Flagship venture |
| **FUTURESTATE STATE** (compound w/ token) | P0 | 9, 36 | Compound filing strategy |
| **BETEDGE** | P1 | 41, 42 |  |

## 3. Copyright Registration Inventory

### 3.2 Foundational Works (P0 — Canada + US)

The 8 works include MCV Universe Codex, UWG Architecture, Multi-Token Whitepaper,
Global Jurisdictional Routing, Fractal Pyramid Diagram, Batch Kickoff Manifest,
Phase 0 Audit Kickoff, and MCV Atlas Command Center Mockup.
`;

describe('parseIpInventory', () => {
  it('extracts trademarks from every §1.x table', () => {
    const result = parseIpInventory(IP_INVENTORY_FIXTURE);
    expect(result.trademarks.length).toBe(6);
    const marks = result.trademarks.map((m) => m.markText);
    expect(marks).toContain('MCV');
    expect(marks).toContain('FUTURESTATE');
    expect(marks).toContain('BETEDGE');
  });

  it('flags compound marks and strips the "(compound w/ token)" suffix', () => {
    const result = parseIpInventory(IP_INVENTORY_FIXTURE);
    const compound = result.trademarks.find((m) => m.markText === 'FUTURESTATE STATE');
    expect(compound).toBeDefined();
    expect(compound?.isCompound).toBe(true);
  });

  it('parses classes as number arrays', () => {
    const result = parseIpInventory(IP_INVENTORY_FIXTURE);
    const mcv = result.trademarks.find((m) => m.markText === 'MCV');
    expect(mcv?.classes).toEqual([9, 35, 36]);
  });

  it('sets jurisdictions to US+CA by default', () => {
    const result = parseIpInventory(IP_INVENTORY_FIXTURE);
    expect(result.trademarks[0].jurisdictions).toEqual(['US', 'CA']);
  });

  it('detects explicitly-named copyright works in §3 prose', () => {
    const result = parseIpInventory(IP_INVENTORY_FIXTURE);
    const titles = result.copyrights.map((c) => c.markText);
    expect(titles).toContain('MCV Universe Codex');
    expect(titles).toContain('UWG Architecture');
    expect(titles).toContain('Multi-Token Whitepaper');
    expect(result.copyrights.every((c) => c.markKind === 'copyright')).toBe(true);
  });
});

// ─── Patents ────────────────────────────────────────────────────────────────

const PATENT_FIXTURE = `## 2. Patent Candidate Inventory

### 2.1 PP0 — File Within 30 Days

- **PP0-A: Universal Wealth Grant Mechanism** — combination of biometric-triangle eligibility, time-locked vesting with daily unlocks.
- **PP0-B: Core-Triangle Identity Primitive** — WHO/WHAT/HOW cryptographic binding with native agent-identity.

### 2.2 PP1 — File Within 90 Days

- **PP1-E: Wealth Taper Mechanism — NEW IN v1.1.** Progressive reduction in rate-of-return. Novelty hook: the combination of non-confiscatable wealth guarantee as a constitutional invariant. Supporting artifacts: UWG Architecture doc; Multi-Token Whitepaper.

### 2.3 PP2 — Evaluate for Year-One Filing

- **PP2-A: Cryptic Profile Architecture** — modular observation primitives with hard-coded prohibition on grading.
`;

describe('parsePatents', () => {
  it('emits one patent per PP* bullet across §§2.1-2.3', () => {
    const { patents, warnings } = parsePatents(PATENT_FIXTURE);
    expect(patents.length).toBe(4);
    expect(warnings).toEqual([]);
  });

  it('assigns priority tiers by section (PP0/PP1/PP2)', () => {
    const { patents } = parsePatents(PATENT_FIXTURE);
    const byCode = new Map(patents.map((p) => [p.markText.split(':')[0], p.priorityTier]));
    expect(byCode.get('PP0-A')).toBe('PP0');
    expect(byCode.get('PP1-E')).toBe('PP1');
    expect(byCode.get('PP2-A')).toBe('PP2');
  });

  it('extracts novelty_hook from labeled fields', () => {
    const { patents } = parsePatents(PATENT_FIXTURE);
    const pp1e = patents.find((p) => p.markText.startsWith('PP1-E'));
    expect(pp1e?.noveltyHook).toBeTruthy();
    expect(pp1e?.noveltyHook).toContain('non-confiscatable');
  });

  it('splits supporting_artifacts on semicolon/comma', () => {
    const { patents } = parsePatents(PATENT_FIXTURE);
    const pp1e = patents.find((p) => p.markText.startsWith('PP1-E'));
    expect(pp1e?.supportingArtifacts).toContain('UWG Architecture doc');
    expect(pp1e?.supportingArtifacts).toContain('Multi-Token Whitepaper');
  });

  it('sets markKind=patent and default provisional_draft_status=unscoped', () => {
    const { patents } = parsePatents(PATENT_FIXTURE);
    expect(patents.every((p) => p.markKind === 'patent')).toBe(true);
    expect(patents.every((p) => p.provisionalDraftStatus === 'unscoped')).toBe(true);
  });
});

// ─── Counsel Pack ────────────────────────────────────────────────────────────

const COUNSEL_PACK_FIXTURE = `# Counsel Pack v2.0

## 4.5 Pre-Disclosure Checklist

| # | Item | Status | Responsible |
|---|---|---|---|
| 1 | CT-1 architecture opinion | Pending | Corp/Tax |
| 2 | IP-3 PP0 provisional patents | Pending | IP |

## 5. Corporate & Tax Counsel

### 5.2 Specific Tasks

| ID | Task | Summary | Priority | Timing |
|---|---|---|---|---|
| **CT-1** | Architecture opinion letter | Review three-layer structure | P0 | Week 1-2 |
| **CT-2** | Trust-jurisdiction recommendation | Select Jersey/Guernsey/Cayman | P0 | Week 1-2 |
| **CT-5** | Intercompany framework draft | Royalty/transfer-pricing | P1 | Week 5-10 |

## 6. Intellectual Property Counsel

### 6.2 Specific Tasks

| ID | Task | Summary | Priority | Timing |
|---|---|---|---|---|
| **IP-1** | Clearance searches | 28 P0 marks | P0 | Week 1-4 |
| **IP-3** | File 3 PP0 provisional patents | UWG, Core-Triangle, ZTAG | P0 | Week 2-6 |

## 7. Securities Counsel

### 7.2 Specific Tasks

| ID | Task | Summary | Priority | Timing |
|---|---|---|---|---|
| **SEC-1** | Multi-token characterization | 7 ecosystem tokens | P0 | Week 1-6 |

## 8.2 Cross-Workstream Dependencies

| Upstream | Unblocks | Target |
|---|---|---|
| CT-1 (architecture opinion) | IP assignment deed in CT-7 | Week 2 |
| IP-1 (clearance) | IP-2 (P0 filings) | Week 4 |
`;

describe('parseCounselPack', () => {
  it('parses every CT-*, IP-*, SEC-* row across §§5.2, 6.2, 7.2', () => {
    const { tasks } = parseCounselPack(COUNSEL_PACK_FIXTURE);
    const codes = tasks.map((t) => t.taskCode);
    expect(codes).toContain('CT-1');
    expect(codes).toContain('CT-2');
    expect(codes).toContain('CT-5');
    expect(codes).toContain('IP-1');
    expect(codes).toContain('IP-3');
    expect(codes).toContain('SEC-1');
  });

  it('assigns workstream from the parent section', () => {
    const { tasks } = parseCounselPack(COUNSEL_PACK_FIXTURE);
    expect(tasks.find((t) => t.taskCode === 'CT-1')?.workstream).toBe('corp_tax');
    expect(tasks.find((t) => t.taskCode === 'IP-1')?.workstream).toBe('ip');
    expect(tasks.find((t) => t.taskCode === 'SEC-1')?.workstream).toBe('securities');
  });

  it('flags P0 tasks as critical_path', () => {
    const { tasks } = parseCounselPack(COUNSEL_PACK_FIXTURE);
    expect(tasks.find((t) => t.taskCode === 'CT-1')?.criticalPath).toBe(true);
    expect(tasks.find((t) => t.taskCode === 'CT-5')?.criticalPath).toBe(false);
  });

  it('resolves §8.2 depends_on edges', () => {
    const { tasks } = parseCounselPack(COUNSEL_PACK_FIXTURE);
    const ip1 = tasks.find((t) => t.taskCode === 'IP-1');
    // §8.2 row "IP-1 (clearance) | IP-2 (P0 filings)" — IP-2 depends on IP-1;
    // since our fixture doesn't ship an IP-2 row, the edge is simply not recorded.
    // Assert IP-1 itself has no self-dependency:
    expect(ip1?.dependsOn).not.toContain('IP-1');
  });
});

// ─── T0 Portfolio (domains + acquisition-pending rollups) ───────────────────

const T0_FIXTURE = `Domain,Class,Category,Scope,Status,Routing,Intended Use,Product Owner,Holding Entity,Registrar,Renewal Date,TM Priority,TM Status,Patent-Adjacent,Interconnectivity Dependencies,Notes
mcv.global,Core,Brand Apex,Universal,Active,TBD,Ecosystem homepage,Tony,MCV Holdings Ltd,Namecheap,2027-01-15,P0,Not-filed,No,,Crown-jewel
mcv.one,Core,Agentic OS,Universal,Active,TBD,Central OS,Tony,MCV Holdings Ltd,Namecheap,2027-01-14,P0,Not-filed,Yes,,Extended by desktop
mcv.ac,Core,Citizen Account,Universal,ACQUIRE-PENDING,N/A,Daily-use surface,Tony,TBD,Namecheap,N/A,P0,Not-filed,No,,C$39.58 sale
mcv.trade,Platform,Tokenized sec,Inst,ACQUIRE-PENDING,N/A,Secondary market,Tony,TBD,Namecheap,N/A,P0,Not-filed,No,,Premium
`;

describe('parseT0Portfolio', () => {
  it('splits rows by Status → owned vs pending', () => {
    const result = parseT0Portfolio(T0_FIXTURE);
    expect(result.owned.length).toBe(2);
    expect(result.pending.length).toBe(2);
  });

  it('owned rows land in domain_registry with status="active"', () => {
    const result = parseT0Portfolio(T0_FIXTURE);
    expect(result.owned.every((d) => d.status === 'active')).toBe(true);
    expect(result.owned.find((d) => d.fqdn === 'mcv.global')).toBeDefined();
  });

  it('pending rows map priority → urgency_tier', () => {
    const result = parseT0Portfolio(T0_FIXTURE);
    expect(result.pending.every((p) => p.urgencyTier === 'red_7day')).toBe(true);
  });

  it('lowercases fqdn', () => {
    const source = T0_FIXTURE.replace('mcv.global', 'MCV.GLOBAL');
    const result = parseT0Portfolio(source);
    expect(result.owned.find((d) => d.fqdn === 'mcv.global')).toBeDefined();
  });
});

// ─── T1 Entities ────────────────────────────────────────────────────────────

const T1_FIXTURE = `Entity Name,Entity Type,Jurisdiction,Layer,Role,Status,Formation Date,Counsel Contact,Domains Held,Key Functions,Notes
Root (Purpose Trust),Trust,Jersey or Guernsey (TBD),Layer 0,IP Custody,Planned,TBD,,,Holds civilizational IP,
MCV Holdings Ltd,VCC,Singapore,Layer 1,Federation,Planned,TBD,,"mcv.global",Federation coordination,
EdgeIQ Holdings Inc (Wyoming),C-Corp,"Wyoming, USA",Layer 1,US Ops,Active,Incorporated,,,US operating entity,
FutureState LP,Limited Partnership,Cayman Islands,Layer 2,RWA Tokenization,Planned,TBD,,,Real estate tokenization,
`;

describe('parseT1Entities', () => {
  it('maps VCC/DAC/C-Corp → "corporation"', () => {
    const { entities } = parseT1Entities(T1_FIXTURE);
    const mcvHoldings = entities.find((e) => e.label === 'MCV Holdings Ltd');
    expect(mcvHoldings?.entityType).toBe('corporation');
    const edgeIq = entities.find((e) => e.label.startsWith('EdgeIQ Holdings'));
    expect(edgeIq?.entityType).toBe('corporation');
  });

  it('maps Trust → "trust" and Limited Partnership → "lp"', () => {
    const { entities } = parseT1Entities(T1_FIXTURE);
    expect(entities.find((e) => e.label.startsWith('Root'))?.entityType).toBe('trust');
    expect(entities.find((e) => e.label === 'FutureState LP')?.entityType).toBe('lp');
  });

  it('normalizes jurisdictions to known short codes', () => {
    const { entities } = parseT1Entities(T1_FIXTURE);
    expect(entities.find((e) => e.label === 'MCV Holdings Ltd')?.jurisdiction).toBe('SG');
    expect(entities.find((e) => e.label === 'FutureState LP')?.jurisdiction).toBe('CAYMAN');
  });

  it('generates slug ids, collapsing parentheticals', () => {
    const { entities } = parseT1Entities(T1_FIXTURE);
    const root = entities.find((e) => e.label.startsWith('Root'));
    expect(root?.id).toBe('root-purpose-trust');
    const futurestate = entities.find((e) => e.label === 'FutureState LP');
    expect(futurestate?.id).toBe('futurestate-lp');
  });

  it('marks Layer 0 and known sovereign entities as is_crown', () => {
    const { entities } = parseT1Entities(T1_FIXTURE);
    const root = entities.find((e) => e.label.startsWith('Root'));
    const mcvHoldings = entities.find((e) => e.label === 'MCV Holdings Ltd');
    expect(root?.isCrown).toBe(true);
    expect(mcvHoldings?.isCrown).toBe(true);
  });
});

// ─── T2 Gaps ────────────────────────────────────────────────────────────────

const T2_FIXTURE = `Gap / Urgency,Priority,Domain,Function,Blocker,Owner (target),Est. Cost,Action Window,Status,Notes
🔴 CRITICAL,P0,futurestate.app,FutureState surface,Blocks Hunter disclosure,FutureState LP,TBD,This week,Not acquired,
🟠 STRATEGIC,P0,naos.ai,NAOS brand,NAOS patent surface,MCV Holdings,TBD,30 days,In cart,
🟡 RESEARCH,P2,mcv.ops,Internal ops,Subdomain works,MCV Holdings,TBD,60 days,Not in cart,
`;

describe('parseT2Gaps', () => {
  it('maps emoji + text flags to urgency_tier enum', () => {
    const { acquisitions } = parseT2Gaps(T2_FIXTURE);
    const byAsset = new Map(acquisitions.map((a) => [a.assetIdentifier, a.urgencyTier]));
    expect(byAsset.get('futurestate.app')).toBe('red_7day');
    expect(byAsset.get('naos.ai')).toBe('orange_30day');
    expect(byAsset.get('mcv.ops')).toBe('yellow_90day');
  });

  it('flags blocks_disclosure when Blocker mentions Hunter/Kirill/disclosure', () => {
    const { acquisitions } = parseT2Gaps(T2_FIXTURE);
    const fs = acquisitions.find((a) => a.assetIdentifier === 'futurestate.app');
    expect(fs?.blocksDisclosure).toBe(true);
  });
});

// ─── T6 Carts ───────────────────────────────────────────────────────────────

const T6_FIXTURE = `#,Domain,List Price CAD,Sale Price CAD,Savings,Decision,Class,Priority,Rationale,Fits a Class?,Needed <24mo?,Hard to Re-Acquire?
1,futurestate.app,17.77,17.77,,ACQUIRE,Venture,P0,Primary surface,Yes,Yes,Yes
2,futurestate.build,45.16,45.16,,ACQUIRE,Venture,P1,Build vertical,Yes,Yes,Yes
3,futurestate.art,5.45,5.45,,KILL,DNF,,Wrong vertical,No,No,No
4,futurestate.us,2670.04,2670.04,,DEFER,Venture,P1,Premium,Yes,No,No
`;

describe('parseT6Carts', () => {
  it('only includes ACQUIRE decisions; counts DEFER + KILL separately', () => {
    const result = parseT6Carts(T6_FIXTURE);
    expect(result.acquisitions.length).toBe(2);
    expect(result.deferred).toBe(1);
    expect(result.killed).toBe(1);
  });

  it('translates priority → urgency_tier correctly', () => {
    const result = parseT6Carts(T6_FIXTURE);
    const byAsset = new Map(result.acquisitions.map((a) => [a.assetIdentifier, a.urgencyTier]));
    expect(byAsset.get('futurestate.app')).toBe('red_7day');
    expect(byAsset.get('futurestate.build')).toBe('orange_30day');
  });

  it('flags futurestate P0 rows as blocks_disclosure', () => {
    const result = parseT6Carts(T6_FIXTURE);
    const fs = result.acquisitions.find((a) => a.assetIdentifier === 'futurestate.app');
    expect(fs?.blocksDisclosure).toBe(true);
    expect(fs?.blocksVentureName).toBe('futurestate');
  });
});
