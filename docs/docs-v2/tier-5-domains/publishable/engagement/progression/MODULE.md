# @mcv/engagement/progression

> **Progression Systems** â€” Level-based progression, XP curves, skill trees, unlock paths, prestige mechanics, and seasonal progression for the MCV.ONE platform.

**Package:** `@mcv/engagement/progression`
**Domain:** Engagement Â· Tier 5
**Registry:** `@anthropic:registry/mcv`
**Since:** 0.12.0
**Status:** Stable
**Maintainers:** MCV Platform Team

---

## Table of Contents

- [Purpose](#purpose)
- [Exports](#exports)
- [Architecture](#architecture)
- [Core Interfaces](#core-interfaces)
- [Database Schemas](#database-schemas)
- [Code Examples](#code-examples)
- [Error Codes](#error-codes)
- [Security](#security)
- [Environment Variables](#environment-variables)
- [Dependencies](#dependencies)
- [Testing](#testing)

---

## Purpose

The `@mcv/engagement/progression` module provides a complete progression engine for any MCV.ONE venture. Progression systems are foundational to user engagement â€” they give players/users a sense of growth, direction, and accomplishment. This module abstracts the math, storage, and event plumbing so ventures can ship rich progression experiences without reinventing XP curves or skill tree traversal.

### What This Module Does

1. **Manages XP-to-Level Calculations** â€” Supports linear, exponential, logarithmic, stepped, and fully custom XP curves. Given a raw XP total, resolves the user's current level, progress toward the next level, and overflow XP instantly.

2. **Tracks Multi-Source XP Earning** â€” Integrates with the `@mcv/engagement/earn` module to receive XP from any source (combat, social interaction, trading, quests, achievements). Supports typed XP pools (combat XP, social XP, trade XP) that feed into independent or aggregated progression tracks.

3. **Powers Skill Trees** â€” Provides a directed-acyclic-graph (DAG) engine for skill/talent trees. Handles prerequisite validation, branch exclusivity, point allocation, and respec/reset mechanics with configurable cost functions.

4. **Gates Content via Unlock Paths** â€” Defines what content, features, or capabilities become available at specific progression milestones. Supports progressive disclosure patterns where complexity is revealed gradually.

5. **Enables Prestige/Rebirth Loops** â€” Implements reset-to-level-1 mechanics with cumulative bonuses, prestige tier tracking, permanent unlock carryover, and prestige-specific reward tables.

6. **Drives Seasonal Progression** â€” Season pass / battle pass systems with free and premium tracks, time-limited XP boosts, seasonal reward tables, and automatic season rollover.

7. **Emits Granular Events** â€” Every XP gain, level-up, skill unlock, prestige reset, and milestone hit publishes to Redpanda, enabling downstream systems (notifications, analytics, leaderboards) to react in real time.

8. **Operates Multi-Tenant** â€” All progression data is scoped by `venture_id` with Supabase RLS. Platform-level progression (cross-venture) runs in a reserved partition with XP sharing policies.

### Why It Exists

Without a centralized progression module:
- Every venture reimplements XP math with subtle bugs (off-by-one at level boundaries, integer overflow at high levels)
- Skill tree validation is error-prone â€” cycles, orphaned nodes, impossible prerequisite chains
- Prestige systems interact badly with unlock paths when built ad-hoc
- Seasonal content has no standard reset/rollover lifecycle
- Cross-venture progression (platform level) becomes impossible to coordinate

This module eliminates those problems with a battle-tested, event-driven progression engine.

### Design Principles

- **Deterministic Calculations** â€” Given the same XP total and curve configuration, the level calculation is always identical. No floating-point drift, no cache-dependent answers.
- **Event-Sourced XP** â€” Raw XP events are the source of truth. Materialized totals are projections that can be rebuilt from the event log.
- **Configuration Over Code** â€” XP curves, skill trees, unlock paths, and prestige rules are data (stored in PostgreSQL), not hardcoded. Venture operators can tune progression without deploys.
- **Composable Tracks** â€” Multiple progression tracks (player level, guild level, crafting skill, seasonal pass) run independently with optional cross-feeding rules.
- **Audit-Ready** â€” Every XP mutation records source, amount, timestamp, and context. Prestige resets preserve historical records. Nothing is silently lost.

---

## Exports

```typescript
// === Primary Service ===
export { ProgressionService } from './services/progression.service';
export { ProgressionRouter, progressionRouter } from './router';

// === Core Types ===
export type {
  Level,
  LevelInfo,
  LevelRange,
  XPCurve,
  XPCurveType,
  XPCurveConfig,
  XPCurvePoint,
  XPSource,
  XPGain,
  XPModifier,
  XPModifierType,
  XPPool,
  XPPoolType,
} from './types/xp.types';

export type {
  SkillTree,
  SkillTreeConfig,
  SkillNode,
  SkillNodeType,
  SkillNodeState,
  SkillPrerequisite,
  SkillBranch,
  SkillAllocation,
  RespecConfig,
  RespecResult,
} from './types/skill-tree.types';

export type {
  UnlockPath,
  UnlockCondition,
  UnlockGate,
  UnlockState,
  UnlockReward,
  ProgressiveDisclosure,
} from './types/unlock.types';

export type {
  PrestigeConfig,
  PrestigeTier,
  PrestigeRecord,
  PrestigeBonus,
  PrestigeBonusType,
  PrestigeCarryover,
  RebirthResult,
} from './types/prestige.types';

export type {
  ProgressionTrack,
  TrackConfig,
  TrackType,
  TrackRelation,
  TrackFeedRule,
  MultiTrackState,
} from './types/track.types';

export type {
  SeasonPass,
  SeasonPassConfig,
  SeasonTier,
  SeasonReward,
  SeasonTrack,
  SeasonTrackType,
  SeasonProgress,
  SeasonSchedule,
} from './types/season.types';

export type {
  Milestone,
  MilestoneConfig,
  MilestoneReward,
  MilestoneState,
  MilestoneNotification,
  MilestoneLeaderboard,
} from './types/milestone.types';

export type {
  ProgressionConfig,
  UserProgression,
  ProgressionSnapshot,
  ProgressionHistory,
  ProgressionEvent,
  ProgressionEventType,
} from './types/progression.types';

// === Schemas (Drizzle) ===
export {
  progressionConfigs,
  userProgression,
  xpCurves,
  xpEvents,
  skillTrees,
  skillNodes,
  skillEdges,
  userSkills,
  unlockPaths,
  unlockStates,
  prestigeRecords,
  seasonPasses,
  seasonProgress,
  milestones,
  userMilestones,
  progressionTracks,
  trackProgress,
} from './schemas';

// === Utilities ===
export { XPCalculator } from './utils/xp-calculator';
export { CurveBuilder } from './utils/curve-builder';
export { SkillTreeValidator } from './utils/skill-tree-validator';
export { UnlockResolver } from './utils/unlock-resolver';
export { PrestigeCalculator } from './utils/prestige-calculator';
export { ProgressionAggregator } from './utils/progression-aggregator';

// === Events ===
export {
  PROGRESSION_EVENTS,
  type XPGainedEvent,
  type LevelUpEvent,
  type SkillUnlockedEvent,
  type PrestigeResetEvent,
  type MilestoneReachedEvent,
  type SeasonTierReachedEvent,
  type UnlockAchievedEvent,
  type TrackProgressEvent,
} from './events';

// === Constants ===
export {
  DEFAULT_MAX_LEVEL,
  DEFAULT_XP_CURVE,
  MAX_SKILL_POINTS,
  MAX_PRESTIGE_TIER,
  SEASON_DURATION_DAYS,
  XP_POOL_TYPES,
  PROGRESSION_LIMITS,
} from './constants';

// === Middleware ===
export { requireLevel } from './middleware/require-level';
export { requireSkill } from './middleware/require-skill';
export { requirePrestige } from './middleware/require-prestige';
export { requireUnlock } from './middleware/require-unlock';
export { requireSeasonTier } from './middleware/require-season-tier';
```

---

## Architecture

### System Overview

```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚                        CLIENT APPLICATIONS                          â”‚
â”‚  (Web Dashboard, Mobile App, Game Client, Admin Panel)              â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
                               â”‚ tRPC / REST
                               â–¼
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚                      PROGRESSION ROUTER                             â”‚
â”‚                                                                     â”‚
â”‚  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â” â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â” â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â” â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â” â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â” â”‚
â”‚  â”‚ XP       â”‚ â”‚ Level    â”‚ â”‚ Skill    â”‚ â”‚ Unlock   â”‚ â”‚ Season   â”‚ â”‚
â”‚  â”‚ Endpointsâ”‚ â”‚ Endpointsâ”‚ â”‚ Tree API â”‚ â”‚ Path API â”‚ â”‚ Pass API â”‚ â”‚
â”‚  â””â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”˜ â””â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”˜ â””â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”˜ â””â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”˜ â””â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”˜ â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”¼â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¼â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¼â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¼â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¼â”€â”€â”€â”€â”€â”€â”€â”€â”˜
        â”‚            â”‚            â”‚            â”‚            â”‚
        â–¼            â–¼            â–¼            â–¼            â–¼
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚                     PROGRESSION SERVICE                             â”‚
â”‚                                                                     â”‚
â”‚  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”   â”‚
â”‚  â”‚                    XP PIPELINE                               â”‚   â”‚
â”‚  â”‚                                                              â”‚   â”‚
â”‚  â”‚  XP Source â†’ Modifiers â†’ Pool Router â†’ Track Accumulator    â”‚   â”‚
â”‚  â”‚       â”‚          â”‚            â”‚               â”‚              â”‚   â”‚
â”‚  â”‚       â”‚     â”Œâ”€â”€â”€â”€â”´â”€â”€â”€â”€â”  â”Œâ”€â”€â”€â”´â”€â”€â”€â”    â”Œâ”€â”€â”€â”€â”€â”´â”€â”€â”€â”€â”€â”€â”      â”‚   â”‚
â”‚  â”‚       â”‚     â”‚ Boost   â”‚  â”‚Combat â”‚    â”‚ Level Calc  â”‚      â”‚   â”‚
â”‚  â”‚       â”‚     â”‚ Season  â”‚  â”‚Social â”‚    â”‚ (XPCalc)    â”‚      â”‚   â”‚
â”‚  â”‚       â”‚     â”‚ Prestigeâ”‚  â”‚Trade  â”‚    â”‚             â”‚      â”‚   â”‚
â”‚  â”‚       â”‚     â”‚ Event   â”‚  â”‚Quest  â”‚    â”‚ Curve Eval  â”‚      â”‚   â”‚
â”‚  â”‚       â”‚     â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜  â”‚Custom â”‚    â”‚ Level Gate  â”‚      â”‚   â”‚
â”‚  â”‚       â”‚                  â””â”€â”€â”€â”€â”€â”€â”€â”˜    â”‚ Overflow    â”‚      â”‚   â”‚
â”‚  â”‚       â”‚                               â””â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”˜      â”‚   â”‚
â”‚  â”‚       â”‚                                     â”‚              â”‚   â”‚
â”‚  â”‚       â”‚              â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜              â”‚   â”‚
â”‚  â”‚       â”‚              â–¼                                      â”‚   â”‚
â”‚  â”‚       â”‚     â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”                             â”‚   â”‚
â”‚  â”‚       â”‚     â”‚ LEVEL RESOLVER â”‚                             â”‚   â”‚
â”‚  â”‚       â”‚     â”‚                â”‚                             â”‚   â”‚
â”‚  â”‚       â”‚     â”‚ current_level  â”‚â”€â”€â†’ Unlock Path Check        â”‚   â”‚
â”‚  â”‚       â”‚     â”‚ xp_in_level    â”‚â”€â”€â†’ Milestone Check          â”‚   â”‚
â”‚  â”‚       â”‚     â”‚ xp_to_next     â”‚â”€â”€â†’ Progress Visualization   â”‚   â”‚
â”‚  â”‚       â”‚     â”‚ progress_pct   â”‚â”€â”€â†’ Level-Up Event           â”‚   â”‚
â”‚  â”‚       â”‚     â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜                             â”‚   â”‚
â”‚  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜   â”‚
â”‚                                                                     â”‚
â”‚  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”  â”‚
â”‚  â”‚ SKILL TREE    â”‚  â”‚ PRESTIGE      â”‚  â”‚ SEASON PASS            â”‚  â”‚
â”‚  â”‚ ENGINE        â”‚  â”‚ ENGINE        â”‚  â”‚ ENGINE                 â”‚  â”‚
â”‚  â”‚               â”‚  â”‚               â”‚  â”‚                        â”‚  â”‚
â”‚  â”‚ DAG Validator â”‚  â”‚ Reset Calc    â”‚  â”‚ Tier Calculator        â”‚  â”‚
â”‚  â”‚ Prereq Check  â”‚  â”‚ Bonus Apply   â”‚  â”‚ Free/Premium Split     â”‚  â”‚
â”‚  â”‚ Point Alloc   â”‚  â”‚ Carryover     â”‚  â”‚ Reward Distribution    â”‚  â”‚
â”‚  â”‚ Branch Logic  â”‚  â”‚ History Track â”‚  â”‚ Schedule Manager       â”‚  â”‚
â”‚  â”‚ Respec Calc   â”‚  â”‚ Tier Advance  â”‚  â”‚ Boost Multiplier       â”‚  â”‚
â”‚  â””â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”˜  â””â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”˜  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜  â”‚
â”‚          â”‚                  â”‚                       â”‚               â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¼â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¼â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¼â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
           â”‚                  â”‚                       â”‚
           â–¼                  â–¼                       â–¼
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚                         DATA LAYER                                  â”‚
â”‚                                                                     â”‚
â”‚  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â” â”‚
â”‚  â”‚         Supabase PostgreSQL               â”‚  â”‚   Redpanda     â”‚ â”‚
â”‚  â”‚                                           â”‚  â”‚                â”‚ â”‚
â”‚  â”‚  progression_configs   user_progression   â”‚  â”‚  xp.gained     â”‚ â”‚
â”‚  â”‚  xp_curves             xp_events          â”‚  â”‚  level.up      â”‚ â”‚
â”‚  â”‚  skill_trees           skill_nodes        â”‚  â”‚  skill.unlock  â”‚ â”‚
â”‚  â”‚  skill_edges           user_skills        â”‚  â”‚  prestige.resetâ”‚ â”‚
â”‚  â”‚  unlock_paths          unlock_states      â”‚  â”‚  milestone.hit â”‚ â”‚
â”‚  â”‚  prestige_records      season_passes      â”‚  â”‚  season.tier   â”‚ â”‚
â”‚  â”‚  season_progress       milestones         â”‚  â”‚  unlock.gate   â”‚ â”‚
â”‚  â”‚  user_milestones       progression_tracks â”‚  â”‚  track.progressâ”‚ â”‚
â”‚  â”‚  track_progress                           â”‚  â”‚                â”‚ â”‚
â”‚  â”‚                                           â”‚  â”‚                â”‚ â”‚
â”‚  â”‚  [RLS: venture_id scoping on all tables]  â”‚  â”‚                â”‚ â”‚
â”‚  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜ â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

### XP Flow Pipeline

The XP pipeline is the hot path of the progression system. Every XP gain flows through this pipeline:

```
1. XP SOURCE EVENT
   â”‚
   â”‚  { source: 'quest_complete', xp_type: 'combat', base_amount: 150, context: {...} }
   â”‚
   â–¼
2. MODIFIER STACK (applied in order)
   â”‚
   â”‚  â”Œâ”€ Base Amount: 150
   â”‚  â”œâ”€ Prestige Bonus (Ã—1.15):     172.5
   â”‚  â”œâ”€ Season Boost (Ã—1.5):        258.75
   â”‚  â”œâ”€ Event Multiplier (Ã—2.0):    517.5
   â”‚  â”œâ”€ Diminishing Returns Cap:    500.0  (capped)
   â”‚  â””â”€ Final: 500 XP (integer)
   â”‚
   â–¼
3. POOL ROUTER
   â”‚
   â”‚  XP Type: 'combat'
   â”‚  â”Œâ”€ â†’ Combat XP Pool:   +500
   â”‚  â”œâ”€ â†’ Player XP Pool:   +500  (combat feeds player 1:1)
   â”‚  â””â”€ â†’ Season XP Pool:   +250  (combat feeds season 0.5:1)
   â”‚
   â–¼
4. TRACK ACCUMULATOR
   â”‚
   â”‚  For each pool that received XP:
   â”‚  â”œâ”€ Combat Track:  12,450 â†’ 12,950 total XP
   â”‚  â”œâ”€ Player Track:  89,200 â†’ 89,700 total XP
   â”‚  â””â”€ Season Track:   4,300 â†’  4,550 total XP
   â”‚
   â–¼
5. LEVEL CALCULATOR (per track)
   â”‚
   â”‚  Player Track (exponential curve):
   â”‚  â”‚  Level 23 requires 88,000 XP
   â”‚  â”‚  Level 24 requires 95,000 XP
   â”‚  â”‚  Current XP: 89,700
   â”‚  â”‚  â†’ Level: 23
   â”‚  â”‚  â†’ XP in level: 1,700 / 7,000
   â”‚  â”‚  â†’ Progress: 24.3%
   â”‚  â”‚  â†’ No level-up
   â”‚  â”‚
   â”‚  Combat Track (linear curve):
   â”‚  â”‚  Was Level 6, now has 12,950 XP
   â”‚  â”‚  Level 6 requires 12,000 XP
   â”‚  â”‚  Level 7 requires 14,000 XP
   â”‚  â”‚  â†’ Level: 6
   â”‚  â”‚  â†’ XP in level: 950 / 2,000
   â”‚  â”‚  â†’ Progress: 47.5%
   â”‚  â”‚  â†’ No level-up
   â”‚  â”‚
   â”‚  Season Track (stepped curve):
   â”‚  â”‚  Was Tier 4, now has 4,550 XP
   â”‚  â”‚  Tier 5 requires 4,500 XP  â† CROSSED!
   â”‚  â”‚  â†’ Tier: 5
   â”‚  â”‚  â†’ LEVEL-UP EVENT
   â”‚
   â–¼
6. POST-LEVEL CHECKS
   â”‚
   â”œâ”€ Unlock Path: "Season Tier 5 unlocks Premium Emote Pack"
   â”‚  â†’ Emit unlock.gate event
   â”‚
   â”œâ”€ Milestone: "Tier 5 = 'Halfway Hero' milestone"
   â”‚  â†’ Emit milestone.hit event
   â”‚  â†’ Grant milestone reward
   â”‚
   â””â”€ Notification: Push level-up + milestone to user
       â†’ Emit season.tier event to Redpanda
```

### Level Calculation Engine

The level calculator is a pure function â€” deterministic, side-effect-free, and fast:

```typescript
/**
 * Core level calculation algorithm.
 *
 * Given a total XP and a curve definition, returns the resolved level info.
 * This function is called on every XP mutation and must be O(log n) or better.
 */
function calculateLevel(totalXP: bigint, curve: XPCurve): LevelInfo {
  // 1. Binary search through curve thresholds
  //    - For formula-based curves: evaluate formula at midpoints
  //    - For table-based curves: binary search precomputed table
  //    - For hybrid curves: formula below breakpoint, table above

  // 2. Resolve level boundaries
  //    - currentLevelXP: XP required to reach this level
  //    - nextLevelXP: XP required to reach next level
  //    - xpInLevel: totalXP - currentLevelXP
  //    - xpForLevel: nextLevelXP - currentLevelXP
  //    - progressPercent: xpInLevel / xpForLevel

  // 3. Handle edge cases
  //    - Max level: clamp at cap, overflow XP tracked separately
  //    - Level 0/1 boundary: configurable (0-indexed vs 1-indexed)
  //    - Prestige modifier: multiply XP thresholds by prestige factor

  // 4. Return LevelInfo (immutable, cacheable)
}
```

#### Supported Curve Types

| Curve Type | Formula | Use Case |
|---|---|---|
| `linear` | `xp = base + (level Ã— increment)` | Simple games, casual progression |
| `exponential` | `xp = base Ã— (multiplier ^ level)` | RPGs, competitive systems |
| `logarithmic` | `xp = base Ã— log(level + offset) Ã— scale` | Fast early, slow late |
| `polynomial` | `xp = base Ã— (level ^ exponent)` | Balanced curve with tunable shape |
| `stepped` | Lookup table with explicit thresholds | Season passes, battle passes |
| `custom` | User-defined function (evaluated safely) | Full control, venture-specific |
| `composite` | Different curves for different level ranges | Phase transitions (easy start, hard endgame) |

### Skill Tree Engine

The skill tree engine models skill/talent trees as directed acyclic graphs (DAGs):

```
                    â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
                    â”‚  ROOT    â”‚
                    â”‚ (free)   â”‚
                    â””â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”˜
                         â”‚
              â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¼â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
              â–¼          â–¼          â–¼
        â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â” â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â” â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
        â”‚ BRANCH A â”‚ â”‚ BRANCH B â”‚ â”‚ BRANCH C â”‚
        â”‚ Warrior  â”‚ â”‚  Mage    â”‚ â”‚  Rogue   â”‚
        â””â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”˜ â””â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”˜ â””â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”˜
             â”‚            â”‚            â”‚
        â”Œâ”€â”€â”€â”€â”¼â”€â”€â”€â”€â”  â”Œâ”€â”€â”€â”¼â”€â”€â”€â”€â”  â”Œâ”€â”€â”€â”¼â”€â”€â”€â”€â”
        â–¼    â–¼    â–¼  â–¼   â–¼    â–¼  â–¼   â–¼    â–¼
       [A1] [A2] [A3][B1][B2] [B3][C1][C2] [C3]
        â”‚    â”‚        â”‚   â”‚         â”‚   â”‚
        â–¼    â–¼        â–¼   â–¼         â–¼   â–¼
       [A4] [A5]     [B4][B5]     [C4] [C5]
             â”‚              â”‚            â”‚
             â–¼              â–¼            â–¼
           [A6]  â†mutexâ†’  [B6]  â†mutexâ†’ [C6]
          CAPSTONE       CAPSTONE      CAPSTONE
```

Key behaviors:
- **Prerequisite Chains**: Node B4 requires B1 + B2. Validated at allocation time.
- **Branch Exclusivity**: Mutex edges prevent allocating capstones from multiple branches (configurable).
- **Point Budget**: Total skill points are earned via level-ups. Budget is enforced globally.
- **Respec**: Full reset returns all points. Partial respec removes a subtree. Cost function is configurable (free, currency, escalating).

### Event Architecture

All progression mutations emit events to Redpanda:

```
Topic: progression.events.{venture_id}

Event Types:
â”œâ”€â”€ xp.gained          â€” Raw XP added to a pool
â”œâ”€â”€ xp.modified        â€” XP after modifier stack
â”œâ”€â”€ level.up           â€” User crossed a level boundary
â”œâ”€â”€ level.down         â€” User lost a level (admin action / penalty)
â”œâ”€â”€ skill.allocated    â€” Skill point placed in a node
â”œâ”€â”€ skill.deallocated  â€” Skill point removed (respec)
â”œâ”€â”€ skill.tree.reset   â€” Full tree respec
â”œâ”€â”€ unlock.achieved    â€” Content/feature unlocked
â”œâ”€â”€ unlock.revoked     â€” Unlock removed (admin / prestige reset)
â”œâ”€â”€ prestige.reset     â€” User performed a prestige/rebirth
â”œâ”€â”€ prestige.advance   â€” Prestige tier increased
â”œâ”€â”€ season.tier        â€” Season pass tier reached
â”œâ”€â”€ season.reward      â€” Season reward claimed
â”œâ”€â”€ season.started     â€” New season began
â”œâ”€â”€ season.ended       â€” Season concluded
â”œâ”€â”€ milestone.reached  â€” Named milestone achieved
â”œâ”€â”€ milestone.reward   â€” Milestone reward granted
â”œâ”€â”€ track.created      â€” New progression track initialized
â””â”€â”€ track.progress     â€” Aggregated progress update (batched)
```

Events are partitioned by `user_id` to maintain per-user ordering guarantees.

---

## Core Interfaces

### ProgressionService

The primary entry point for all progression operations.

```typescript
interface ProgressionService {
  // === XP Operations ===

  /**
   * Award XP to a user. Runs through the full modifier pipeline,
   * routes to appropriate pools, recalculates levels, and emits events.
   *
   * @param ventureId - Venture scope
   * @param userId - Target user
   * @param gain - XP gain descriptor
   * @returns Updated progression state for all affected tracks
   */
  awardXP(
    ventureId: string,
    userId: string,
    gain: XPGain
  ): Promise<XPAwardResult>;

  /**
   * Award XP to multiple users in a single transaction.
   * Used for party/guild XP, event rewards, etc.
   */
  awardXPBatch(
    ventureId: string,
    gains: Array<{ userId: string; gain: XPGain }>
  ): Promise<Map<string, XPAwardResult>>;

  /**
   * Remove XP from a user (admin action, penalty).
   * May trigger level-down if XP drops below current level threshold.
   */
  removeXP(
    ventureId: string,
    userId: string,
    removal: XPRemoval
  ): Promise<XPRemovalResult>;

  /**
   * Get the current XP breakdown for a user across all pools.
   */
  getXPBreakdown(
    ventureId: string,
    userId: string
  ): Promise<XPBreakdown>;

  /**
   * Get XP earning history with pagination and filtering.
   */
  getXPHistory(
    ventureId: string,
    userId: string,
    options?: XPHistoryOptions
  ): Promise<PaginatedResult<XPHistoryEntry>>;

  // === Level Operations ===

  /**
   * Get the current level info for a user on a specific track.
   */
  getLevel(
    ventureId: string,
    userId: string,
    trackId?: string
  ): Promise<LevelInfo>;

  /**
   * Get level info for all tracks a user is progressing on.
   */
  getAllLevels(
    ventureId: string,
    userId: string
  ): Promise<Map<string, LevelInfo>>;

  /**
   * Calculate what level a given XP amount would resolve to
   * on a specific curve. Pure calculation, no side effects.
   */
  calculateLevelForXP(
    curveId: string,
    totalXP: bigint
  ): Promise<LevelInfo>;

  /**
   * Get the XP required to reach a specific level on a curve.
   */
  getXPForLevel(
    curveId: string,
    level: number
  ): Promise<bigint>;

  /**
   * Set a user's level directly (admin override).
   * Adjusts XP to match the level threshold.
   */
  setLevel(
    ventureId: string,
    userId: string,
    trackId: string,
    level: number,
    reason: string
  ): Promise<LevelInfo>;

  // === Skill Tree Operations ===

  /**
   * Get a skill tree definition with all nodes and edges.
   */
  getSkillTree(
    ventureId: string,
    treeId: string
  ): Promise<SkillTree>;

  /**
   * Get the user's current skill allocations for a tree.
   */
  getUserSkills(
    ventureId: string,
    userId: string,
    treeId: string
  ): Promise<SkillAllocation>;

  /**
   * Allocate a skill point to a node.
   * Validates prerequisites, point budget, and branch exclusivity.
   */
  allocateSkill(
    ventureId: string,
    userId: string,
    treeId: string,
    nodeId: string
  ): Promise<SkillAllocationResult>;

  /**
   * Allocate multiple skill points in a single transaction.
   * Validates the entire allocation path before committing.
   */
  allocateSkillBatch(
    ventureId: string,
    userId: string,
    treeId: string,
    nodeIds: string[]
  ): Promise<SkillAllocationResult>;

  /**
   * Respec (reset) a skill tree partially or fully.
   */
  respecSkills(
    ventureId: string,
    userId: string,
    treeId: string,
    options?: RespecOptions
  ): Promise<RespecResult>;

  /**
   * Check if a user has a specific skill allocated.
   */
  hasSkill(
    ventureId: string,
    userId: string,
    treeId: string,
    nodeId: string
  ): Promise<boolean>;

  /**
   * Get available (allocatable) nodes for a user given their current state.
   */
  getAvailableNodes(
    ventureId: string,
    userId: string,
    treeId: string
  ): Promise<SkillNode[]>;

  // === Unlock Path Operations ===

  /**
   * Check if a user has unlocked a specific gate.
   */
  isUnlocked(
    ventureId: string,
    userId: string,
    gateId: string
  ): Promise<boolean>;

  /**
   * Get all unlock states for a user.
   */
  getUnlockStates(
    ventureId: string,
    userId: string
  ): Promise<UnlockState[]>;

  /**
   * Get unlock paths that will become available next
   * based on the user's current progression.
   */
  getNextUnlocks(
    ventureId: string,
    userId: string,
    limit?: number
  ): Promise<UnlockPath[]>;

  /**
   * Force-unlock a gate (admin action).
   */
  forceUnlock(
    ventureId: string,
    userId: string,
    gateId: string,
    reason: string
  ): Promise<UnlockState>;

  /**
   * Revoke an unlock (admin action).
   */
  revokeUnlock(
    ventureId: string,
    userId: string,
    gateId: string,
    reason: string
  ): Promise<void>;

  // === Prestige Operations ===

  /**
   * Check if a user is eligible for prestige (meets requirements).
   */
  canPrestige(
    ventureId: string,
    userId: string,
    trackId?: string
  ): Promise<PrestigeEligibility>;

  /**
   * Execute a prestige/rebirth. Resets level, preserves carryovers,
   * applies prestige bonuses, increments prestige tier.
   */
  prestige(
    ventureId: string,
    userId: string,
    trackId?: string
  ): Promise<RebirthResult>;

  /**
   * Get a user's prestige history.
   */
  getPrestigeHistory(
    ventureId: string,
    userId: string
  ): Promise<PrestigeRecord[]>;

  /**
   * Get the current prestige tier and bonuses.
   */
  getPrestigeInfo(
    ventureId: string,
    userId: string
  ): Promise<PrestigeInfo>;

  // === Season Pass Operations ===

  /**
   * Get the current active season for a venture.
   */
  getCurrentSeason(
    ventureId: string
  ): Promise<SeasonPass | null>;

  /**
   * Get a user's season progress (tier, XP, claimed rewards).
   */
  getSeasonProgress(
    ventureId: string,
    userId: string,
    seasonId?: string
  ): Promise<SeasonProgress>;

  /**
   * Claim a season reward at a specific tier.
   */
  claimSeasonReward(
    ventureId: string,
    userId: string,
    seasonId: string,
    tierId: string
  ): Promise<SeasonReward>;

  /**
   * Claim all available unclaimed season rewards.
   */
  claimAllSeasonRewards(
    ventureId: string,
    userId: string,
    seasonId: string
  ): Promise<SeasonReward[]>;

  /**
   * Upgrade a user to premium season track.
   */
  upgradeToPremium(
    ventureId: string,
    userId: string,
    seasonId: string,
    paymentRef: string
  ): Promise<SeasonProgress>;

  // === Milestone Operations ===

  /**
   * Get all milestones for a venture with user completion state.
   */
  getMilestones(
    ventureId: string,
    userId: string,
    options?: MilestoneQueryOptions
  ): Promise<MilestoneState[]>;

  /**
   * Get the milestone leaderboard (who reached milestones first).
   */
  getMilestoneLeaderboard(
    ventureId: string,
    milestoneId: string,
    options?: LeaderboardOptions
  ): Promise<MilestoneLeaderboard>;

  // === Multi-Track Operations ===

  /**
   * Get all progression tracks configured for a venture.
   */
  getTracks(
    ventureId: string
  ): Promise<ProgressionTrack[]>;

  /**
   * Get a user's progression snapshot across all tracks.
   */
  getProgressionSnapshot(
    ventureId: string,
    userId: string
  ): Promise<ProgressionSnapshot>;

  /**
   * Get historical progression data for charting.
   */
  getProgressionHistory(
    ventureId: string,
    userId: string,
    options?: HistoryOptions
  ): Promise<ProgressionHistory>;

  // === Configuration ===

  /**
   * Create or update a progression configuration for a venture.
   */
  upsertConfig(
    ventureId: string,
    config: ProgressionConfig
  ): Promise<ProgressionConfig>;

  /**
   * Create or update an XP curve definition.
   */
  upsertCurve(
    ventureId: string,
    curve: XPCurveConfig
  ): Promise<XPCurve>;

  /**
   * Create or update a skill tree definition.
   */
  upsertSkillTree(
    ventureId: string,
    tree: SkillTreeConfig
  ): Promise<SkillTree>;

  /**
   * Validate a skill tree definition (check for cycles, orphans, etc.).
   */
  validateSkillTree(
    tree: SkillTreeConfig
  ): Promise<SkillTreeValidation>;

  /**
   * Create or update a season pass definition.
   */
  upsertSeasonPass(
    ventureId: string,
    season: SeasonPassConfig
  ): Promise<SeasonPass>;

  /**
   * Create or update unlock paths.
   */
  upsertUnlockPaths(
    ventureId: string,
    paths: UnlockPath[]
  ): Promise<UnlockPath[]>;

  /**
   * Create or update milestones.
   */
  upsertMilestones(
    ventureId: string,
    milestones: MilestoneConfig[]
  ): Promise<Milestone[]>;
}
```

### Level & XP Types

```typescript
/**
 * Represents a resolved level with full context.
 */
interface LevelInfo {
  /** Current level number (1-indexed by default) */
  level: number;

  /** Total accumulated XP */
  totalXP: bigint;

  /** XP required to reach the current level */
  currentLevelXP: bigint;

  /** XP required to reach the next level */
  nextLevelXP: bigint;

  /** XP earned within the current level (totalXP - currentLevelXP) */
  xpInLevel: bigint;

  /** Total XP needed for this level (nextLevelXP - currentLevelXP) */
  xpForLevel: bigint;

  /** Progress percentage through current level (0.0 - 1.0) */
  progressPercent: number;

  /** Whether the user is at max level */
  isMaxLevel: boolean;

  /** XP earned beyond max level (if applicable) */
  overflowXP: bigint;

  /** Prestige tier (0 = no prestige) */
  prestigeTier: number;

  /** Track this level belongs to */
  trackId: string;

  /** Timestamp of last XP change */
  lastUpdated: Date;
}

/**
 * Defines an XP-to-level curve.
 */
interface XPCurve {
  id: string;
  ventureId: string;
  name: string;
  description?: string;

  /** Curve type determines the calculation strategy */
  type: XPCurveType;

  /** Base XP for level 1â†’2 transition */
  baseXP: bigint;

  /** Type-specific parameters */
  params: XPCurveParams;

  /** Maximum level (null = unlimited) */
  maxLevel: number | null;

  /** Whether levels are 0-indexed or 1-indexed */
  zeroIndexed: boolean;

  /** Precomputed lookup table (for stepped/custom curves) */
  lookupTable?: XPCurvePoint[];

  /** Cache of computed thresholds for fast lookup */
  computedThresholds?: Map<number, bigint>;

  createdAt: Date;
  updatedAt: Date;
}

type XPCurveType =
  | 'linear'
  | 'exponential'
  | 'logarithmic'
  | 'polynomial'
  | 'stepped'
  | 'custom'
  | 'composite';

interface XPCurveParams {
  // Linear: xp = baseXP + (level * increment)
  increment?: bigint;

  // Exponential: xp = baseXP * (multiplier ^ level)
  multiplier?: number;

  // Logarithmic: xp = baseXP * log(level + offset) * scale
  offset?: number;
  scale?: number;

  // Polynomial: xp = baseXP * (level ^ exponent)
  exponent?: number;

  // Composite: different curves for different ranges
  segments?: Array<{
    fromLevel: number;
    toLevel: number;
    curveType: XPCurveType;
    params: Omit<XPCurveParams, 'segments'>;
  }>;

  // Custom: serialized function (sandboxed evaluation)
  customFormula?: string;
}

/**
 * A single point on a curve lookup table.
 */
interface XPCurvePoint {
  level: number;
  totalXPRequired: bigint;
  xpForThisLevel: bigint;
}

/**
 * Describes an XP gain from any source.
 */
interface XPGain {
  /** XP source identifier (e.g., 'quest_complete', 'pvp_win') */
  source: string;

  /** Type of XP (determines pool routing) */
  xpType: XPPoolType;

  /** Base XP amount before modifiers */
  baseAmount: bigint;

  /** Optional: specific track to award to (skips pool routing) */
  targetTrackId?: string;

  /** Context metadata (quest ID, enemy name, etc.) */
  context?: Record<string, unknown>;

  /** Whether to skip modifier stack (raw XP) */
  skipModifiers?: boolean;

  /** Idempotency key to prevent duplicate awards */
  idempotencyKey?: string;
}

type XPPoolType =
  | 'combat'
  | 'social'
  | 'trade'
  | 'quest'
  | 'exploration'
  | 'crafting'
  | 'seasonal'
  | 'platform'
  | 'custom';

/**
 * An XP modifier that adjusts the base amount.
 */
interface XPModifier {
  id: string;
  name: string;
  type: XPModifierType;

  /** Multiplier value (1.0 = no change, 2.0 = double, 0.5 = half) */
  value: number;

  /** Priority determines application order (lower = first) */
  priority: number;

  /** Conditions under which this modifier applies */
  conditions?: XPModifierCondition[];

  /** Whether the modifier stacks with others of the same type */
  stackable: boolean;

  /** Maximum number of stacks */
  maxStacks?: number;

  /** Expiry (null = permanent) */
  expiresAt?: Date | null;

  /** Source of the modifier */
  source: string;
}

type XPModifierType =
  | 'prestige_bonus'
  | 'season_boost'
  | 'event_multiplier'
  | 'item_bonus'
  | 'guild_bonus'
  | 'subscription_bonus'
  | 'diminishing_returns'
  | 'penalty'
  | 'custom';

interface XPModifierCondition {
  field: string;
  operator: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'not_in';
  value: unknown;
}

/**
 * Result of an XP award operation.
 */
interface XPAwardResult {
  /** User ID */
  userId: string;

  /** Original gain request */
  gain: XPGain;

  /** XP after modifier stack */
  modifiedAmount: bigint;

  /** Modifiers that were applied */
  appliedModifiers: Array<{
    modifier: XPModifier;
    beforeAmount: bigint;
    afterAmount: bigint;
  }>;

  /** Pools that received XP */
  poolUpdates: Array<{
    poolType: XPPoolType;
    amountAdded: bigint;
    newTotal: bigint;
  }>;

  /** Track updates (with potential level-ups) */
  trackUpdates: Array<{
    trackId: string;
    previousLevel: LevelInfo;
    currentLevel: LevelInfo;
    leveledUp: boolean;
    levelsGained: number;
  }>;

  /** Unlocks triggered by this XP gain */
  newUnlocks: UnlockState[];

  /** Milestones reached by this XP gain */
  milestonesReached: Milestone[];

  /** Season tiers reached */
  seasonTiersReached: SeasonTier[];

  /** Timestamp */
  timestamp: Date;
}
```

### Skill Tree Types

```typescript
/**
 * A complete skill tree definition.
 */
interface SkillTree {
  id: string;
  ventureId: string;
  name: string;
  description?: string;

  /** Root node ID (entry point) */
  rootNodeId: string;

  /** All nodes in the tree */
  nodes: SkillNode[];

  /** Directed edges (prerequisite â†’ dependent) */
  edges: SkillEdge[];

  /** Named branches for UI grouping */
  branches: SkillBranch[];

  /** Total skill points available at max level */
  maxPoints: number;

  /** Points gained per level-up */
  pointsPerLevel: number;

  /** Bonus points at specific levels */
  bonusPointLevels?: Array<{ level: number; points: number }>;

  /** Respec configuration */
  respecConfig: RespecConfig;

  /** Branch exclusivity rules */
  exclusivityRules?: ExclusivityRule[];

  /** Version for migration/compatibility */
  version: number;

  createdAt: Date;
  updatedAt: Date;
}

/**
 * A single node in a skill tree.
 */
interface SkillNode {
  id: string;
  treeId: string;

  /** Display name */
  name: string;

  /** Description of what this skill does */
  description: string;

  /** Icon identifier for UI rendering */
  icon?: string;

  /** Node type determines behavior */
  type: SkillNodeType;

  /** Which branch this node belongs to */
  branchId?: string;

  /** Cost in skill points to allocate */
  cost: number;

  /** Maximum ranks (for multi-rank nodes) */
  maxRanks: number;

  /** Per-rank effects/values */
  rankEffects?: Array<{
    rank: number;
    effect: string;
    value: number;
  }>;

  /** Minimum level required to allocate this node */
  minLevel?: number;

  /** Minimum prestige tier required */
  minPrestige?: number;

  /** Position for UI rendering (x, y coordinates) */
  position: { x: number; y: number };

  /** Metadata for venture-specific behavior */
  metadata?: Record<string, unknown>;
}

type SkillNodeType =
  | 'passive'       // Permanent stat boost
  | 'active'        // Unlocks an ability
  | 'keystone'      // Major branch-defining node
  | 'capstone'      // End-of-branch ultimate
  | 'gateway'       // Required to access next tier
  | 'choice'        // Pick one of N options (exclusive)
  | 'root';         // Entry point (auto-unlocked)

interface SkillEdge {
  id: string;
  treeId: string;

  /** Source node (prerequisite) */
  fromNodeId: string;

  /** Target node (dependent) */
  toNodeId: string;

  /** Edge type */
  type: 'prerequisite' | 'mutex' | 'recommended';

  /** Minimum ranks required in source node */
  requiredRanks?: number;
}

interface SkillBranch {
  id: string;
  treeId: string;
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  sortOrder: number;
}

interface RespecConfig {
  /** Whether full respec is allowed */
  allowFullRespec: boolean;

  /** Whether partial respec (subtree removal) is allowed */
  allowPartialRespec: boolean;

  /** Cost type for respec */
  costType: 'free' | 'currency' | 'item' | 'escalating';

  /** Base cost for respec (currency/item amount) */
  baseCost?: number;

  /** Cost currency/item identifier */
  costCurrencyId?: string;

  /** Escalation multiplier per respec (for 'escalating' type) */
  escalationMultiplier?: number;

  /** Maximum number of respecs (-1 = unlimited) */
  maxRespecs: number;

  /** Cooldown between respecs in seconds */
  cooldownSeconds?: number;
}

interface RespecResult {
  /** Points returned to pool */
  pointsRefunded: number;

  /** Nodes that were deallocated */
  deallocatedNodes: string[];

  /** Cost paid for the respec */
  costPaid: number;

  /** Remaining respec charges */
  respecsRemaining: number;

  /** Unlocks that were revoked due to skill loss */
  revokedUnlocks: string[];

  /** Next available respec time (if cooldown active) */
  nextRespecAvailable?: Date;
}

/**
 * A user's skill allocation state.
 */
interface SkillAllocation {
  userId: string;
  treeId: string;

  /** Total points earned */
  totalPoints: number;

  /** Points currently allocated */
  allocatedPoints: number;

  /** Points available to spend */
  availablePoints: number;

  /** Per-node allocation state */
  nodes: Map<string, {
    nodeId: string;
    currentRanks: number;
    maxRanks: number;
    isAllocated: boolean;
    isAvailable: boolean;
    missingPrereqs: string[];
  }>;

  /** Number of respecs used */
  respecsUsed: number;

  /** Last respec timestamp */
  lastRespec?: Date;
}

interface ExclusivityRule {
  /** Rule name for display */
  name: string;

  /** Node groups â€” user can only fully allocate nodes in one group */
  groups: Array<{
    name: string;
    nodeIds: string[];
  }>;

  /** How many groups the user can pick from */
  maxGroups: number;

  /** Whether the choice is locked after first allocation */
  lockOnFirstAllocation: boolean;
}
```

### Unlock Path Types

```typescript
/**
 * Defines an unlock path â€” content that becomes available at a progression milestone.
 */
interface UnlockPath {
  id: string;
  ventureId: string;

  /** Human-readable name */
  name: string;

  /** Description of what gets unlocked */
  description?: string;

  /** The gate identifier that other systems check */
  gateId: string;

  /** Conditions that must ALL be met for the unlock */
  conditions: UnlockCondition[];

  /** What gets unlocked (metadata for the consuming system) */
  reward?: UnlockReward;

  /** Priority for display ordering */
  sortOrder: number;

  /** Category for grouping */
  category?: string;

  /** Whether this unlock is visible before it's achieved */
  visibleBeforeUnlock: boolean;

  /** Whether this unlock survives prestige resets */
  persistThroughPrestige: boolean;

  createdAt: Date;
  updatedAt: Date;
}

/**
 * A single condition for an unlock.
 */
interface UnlockCondition {
  /** Condition type */
  type: UnlockConditionType;

  /** Track ID (for level/xp conditions) */
  trackId?: string;

  /** Required level */
  level?: number;

  /** Required XP amount */
  xpAmount?: bigint;

  /** Required skill node ID */
  skillNodeId?: string;

  /** Required skill tree ID */
  skillTreeId?: string;

  /** Required prestige tier */
  prestigeTier?: number;

  /** Required milestone ID */
  milestoneId?: string;

  /** Required season tier */
  seasonTier?: number;

  /** Custom condition key (checked against user metadata) */
  customKey?: string;
  customValue?: unknown;
}

type UnlockConditionType =
  | 'level_reached'
  | 'xp_earned'
  | 'skill_allocated'
  | 'prestige_tier'
  | 'milestone_reached'
  | 'season_tier'
  | 'achievement_earned'
  | 'quest_completed'
  | 'custom';

/**
 * Current state of an unlock for a user.
 */
interface UnlockState {
  gateId: string;
  userId: string;
  unlocked: boolean;
  unlockedAt?: Date;
  conditions: Array<{
    condition: UnlockCondition;
    met: boolean;
    currentValue: unknown;
    requiredValue: unknown;
    progress: number; // 0.0 - 1.0
  }>;
  overallProgress: number; // 0.0 - 1.0
}

/**
 * Progressive disclosure configuration.
 */
interface ProgressiveDisclosure {
  ventureId: string;

  /** Ordered list of disclosure stages */
  stages: Array<{
    /** Stage name */
    name: string;
    /** Unlock gate that triggers this stage */
    gateId: string;
    /** Features/UI elements revealed at this stage */
    reveals: string[];
    /** Optional tutorial/onboarding content */
    tutorialId?: string;
  }>;
}
```

### Prestige Types

```typescript
/**
 * Configuration for prestige/rebirth mechanics.
 */
interface PrestigeConfig {
  id: string;
  ventureId: string;

  /** Which progression track this prestige applies to */
  trackId: string;

  /** Whether prestige is enabled */
  enabled: boolean;

  /** Minimum level required to prestige */
  minLevel: number;

  /** Maximum prestige tier (null = unlimited) */
  maxTier: number | null;

  /** Prestige tier definitions */
  tiers: PrestigeTier[];

  /** What carries over through prestige */
  carryover: PrestigeCarryover;

  /** How XP curve scales with prestige */
  curveScaling: PrestigeCurveScaling;

  /** Confirmation required (prevents accidental prestige) */
  requireConfirmation: boolean;

  /** Cooldown between prestiges in seconds */
  cooldownSeconds?: number;

  createdAt: Date;
  updatedAt: Date;
}

interface PrestigeTier {
  tier: number;
  name: string;
  description?: string;
  icon?: string;
  color?: string;

  /** Bonuses granted at this prestige tier */
  bonuses: PrestigeBonus[];

  /** Rewards granted when reaching this tier */
  rewards: PrestigeReward[];

  /** Additional requirements beyond min level for this specific tier */
  additionalRequirements?: UnlockCondition[];
}

interface PrestigeBonus {
  type: PrestigeBonusType;
  value: number;

  /** Whether this bonus stacks with previous tiers */
  cumulative: boolean;
}

type PrestigeBonusType =
  | 'xp_multiplier'       // Earn XP faster
  | 'xp_flat_bonus'       // Flat XP added to every gain
  | 'skill_points_bonus'  // Extra skill points per level
  | 'unlock_discount'     // Unlock requirements reduced
  | 'max_level_increase'  // Higher level cap
  | 'exclusive_access'    // Access to prestige-only content
  | 'cosmetic'           // Visual indicator (border, badge)
  | 'custom';

interface PrestigeCarryover {
  /** Skill tree allocations persist */
  skills: boolean;

  /** Unlock states persist */
  unlocks: boolean;

  /** Which specific unlock gate IDs always persist */
  persistentUnlockIds: string[];

  /** Currency/items that carry over (by currency ID) */
  persistentCurrencyIds: string[];

  /** Achievement/milestone progress carries over */
  milestones: boolean;

  /** Season pass progress carries over */
  seasonProgress: boolean;

  /** Custom carryover flags */
  custom: Record<string, boolean>;
}

interface PrestigeCurveScaling {
  /** How the XP curve changes with each prestige */
  type: 'none' | 'linear' | 'exponential' | 'custom';

  /** Multiplier applied to XP requirements per prestige tier */
  multiplierPerTier?: number;

  /** Flat XP added to requirements per prestige tier */
  flatBonusPerTier?: bigint;

  /** Custom scaling function (sandboxed) */
  customFormula?: string;
}

interface PrestigeReward {
  type: 'currency' | 'item' | 'cosmetic' | 'title' | 'unlock' | 'custom';
  rewardId: string;
  amount?: number;
  metadata?: Record<string, unknown>;
}

/**
 * Historical record of a prestige reset.
 */
interface PrestigeRecord {
  id: string;
  ventureId: string;
  userId: string;
  trackId: string;

  /** The prestige tier reached */
  toTier: number;

  /** Level at time of prestige */
  levelAtPrestige: number;

  /** Total XP at time of prestige */
  xpAtPrestige: bigint;

  /** What was carried over */
  carryoverSnapshot: Record<string, unknown>;

  /** What was reset */
  resetSnapshot: Record<string, unknown>;

  /** Bonuses applied */
  bonusesApplied: PrestigeBonus[];

  /** Rewards granted */
  rewardsGranted: PrestigeReward[];

  /** Time spent at previous prestige tier */
  timeAtPreviousTier: number; // seconds

  performedAt: Date;
}

/**
 * Result of executing a prestige/rebirth.
 */
interface RebirthResult {
  /** The new prestige tier */
  newTier: number;

  /** Previous state (for UI display) */
  previousState: {
    level: number;
    totalXP: bigint;
    prestigeTier: number;
  };

  /** Current state after reset */
  currentState: {
    level: number;
    totalXP: bigint;
    prestigeTier: number;
  };

  /** Bonuses now active */
  activeBonuses: PrestigeBonus[];

  /** Rewards granted */
  rewards: PrestigeReward[];

  /** Items/unlocks that were carried over */
  carriedOver: string[];

  /** Items/unlocks that were reset */
  reset: string[];

  /** Prestige record ID for reference */
  recordId: string;
}
```

### Progression Track Types

```typescript
/**
 * A progression track defines an independent progression axis.
 */
interface ProgressionTrack {
  id: string;
  ventureId: string;
  name: string;
  description?: string;

  /** Track type */
  type: TrackType;

  /** XP curve used for this track */
  curveId: string;

  /** XP pool types that feed this track */
  xpSources: Array<{
    poolType: XPPoolType;
    ratio: number; // 1.0 = full, 0.5 = half
  }>;

  /** Whether this track has its own prestige config */
  prestigeConfigId?: string;

  /** Display configuration */
  display: {
    icon?: string;
    color?: string;
    showInDashboard: boolean;
    sortOrder: number;
  };

  /** Whether this track is enabled */
  enabled: boolean;

  /** Whether this track is visible to users */
  visible: boolean;

  createdAt: Date;
  updatedAt: Date;
}

type TrackType =
  | 'player'     // Main player/character level
  | 'guild'      // Guild/clan level
  | 'skill'      // Individual skill level (combat, crafting, etc.)
  | 'season'     // Seasonal progression
  | 'platform'   // Cross-venture platform level
  | 'reputation' // Faction/NPC reputation
  | 'custom';

/**
 * Feed rules define how XP flows between tracks.
 */
interface TrackFeedRule {
  id: string;
  ventureId: string;

  /** Source track */
  fromTrackId: string;

  /** Destination track */
  toTrackId: string;

  /** XP conversion ratio */
  ratio: number;

  /** Maximum XP transferred per event */
  maxPerEvent?: bigint;

  /** Maximum XP transferred per day */
  dailyCap?: bigint;

  /** Conditions for the feed to activate */
  conditions?: XPModifierCondition[];

  enabled: boolean;
}

/**
 * Complete progression snapshot for a user.
 */
interface ProgressionSnapshot {
  userId: string;
  ventureId: string;

  /** Level info per track */
  tracks: Map<string, LevelInfo>;

  /** Skill allocations per tree */
  skills: Map<string, SkillAllocation>;

  /** Unlock states */
  unlocks: UnlockState[];

  /** Prestige info */
  prestige: PrestigeInfo;

  /** Active season progress */
  seasonProgress?: SeasonProgress;

  /** Milestones achieved */
  milestones: MilestoneState[];

  /** Active XP modifiers */
  activeModifiers: XPModifier[];

  /** Snapshot timestamp */
  snapshotAt: Date;
}

/**
 * Historical progression data for charting.
 */
interface ProgressionHistory {
  userId: string;
  ventureId: string;

  /** Time-series XP data points */
  xpHistory: Array<{
    timestamp: Date;
    trackId: string;
    totalXP: bigint;
    level: number;
  }>;

  /** Level-up timestamps */
  levelUps: Array<{
    timestamp: Date;
    trackId: string;
    fromLevel: number;
    toLevel: number;
  }>;

  /** Prestige timestamps */
  prestiges: Array<{
    timestamp: Date;
    trackId: string;
    toTier: number;
  }>;

  /** Date range */
  from: Date;
  to: Date;
}
```

### Season Pass Types

```typescript
/**
 * A season pass definition.
 */
interface SeasonPass {
  id: string;
  ventureId: string;
  name: string;
  description?: string;

  /** Season schedule */
  schedule: SeasonSchedule;

  /** Season XP curve (how much XP per tier) */
  curveId: string;

  /** Free track tiers */
  freeTiers: SeasonTier[];

  /** Premium track tiers */
  premiumTiers: SeasonTier[];

  /** Total number of tiers */
  totalTiers: number;

  /** XP boosts active during this season */
  xpBoosts: Array<{
    name: string;
    multiplier: number;
    poolTypes?: XPPoolType[];
    startDate?: Date;
    endDate?: Date;
  }>;

  /** Premium pass price (reference to payment system) */
  premiumPriceRef?: string;

  /** Whether unclaimed rewards are auto-claimed at season end */
  autoClaimOnEnd: boolean;

  /** Whether past season rewards can be claimed retroactively */
  allowRetroactiveClaim: boolean;

  /** Season status */
  status: 'draft' | 'scheduled' | 'active' | 'ending' | 'ended' | 'archived';

  /** Version number for this season */
  seasonNumber: number;

  createdAt: Date;
  updatedAt: Date;
}

interface SeasonSchedule {
  /** Season start time */
  startDate: Date;

  /** Season end time */
  endDate: Date;

  /** Duration in days */
  durationDays: number;

  /** Grace period after end for claiming rewards (days) */
  gracePeriodDays: number;

  /** Time zone for schedule display */
  timezone: string;
}

interface SeasonTier {
  id: string;
  seasonId: string;

  /** Tier number (1-indexed) */
  tierNumber: number;

  /** Track type (free or premium) */
  track: SeasonTrackType;

  /** XP required to reach this tier (cumulative) */
  xpRequired: bigint;

  /** Reward at this tier */
  reward: SeasonReward;

  /** Display name override */
  name?: string;

  /** Whether this is a "featured" tier (highlighted in UI) */
  featured: boolean;
}

type SeasonTrackType = 'free' | 'premium';

interface SeasonReward {
  id: string;
  type: 'currency' | 'item' | 'cosmetic' | 'xp_boost' | 'title' | 'emote' | 'badge' | 'custom';
  rewardId: string;
  amount?: number;
  name: string;
  description?: string;
  icon?: string;
  rarity?: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  metadata?: Record<string, unknown>;
}

/**
 * A user's progress through a season pass.
 */
interface SeasonProgress {
  userId: string;
  seasonId: string;
  ventureId: string;

  /** Current tier reached */
  currentTier: number;

  /** Total season XP earned */
  totalSeasonXP: bigint;

  /** XP earned within current tier */
  xpInTier: bigint;

  /** XP needed for next tier */
  xpForNextTier: bigint;

  /** Progress percentage for current tier */
  tierProgress: number;

  /** Whether user has premium pass */
  isPremium: boolean;

  /** Premium upgrade timestamp */
  premiumSince?: Date;

  /** Claimed reward IDs (free track) */
  claimedFreeRewards: string[];

  /** Claimed reward IDs (premium track) */
  claimedPremiumRewards: string[];

  /** Unclaimed available rewards */
  unclaimedRewards: SeasonTier[];

  /** Daily/weekly challenges completed (if applicable) */
  challengesCompleted?: number;

  lastUpdated: Date;
}
```

### Milestone Types

```typescript
/**
 * A named milestone at a key progression point.
 */
interface Milestone {
  id: string;
  ventureId: string;

  /** Milestone name (e.g., "First Blood", "Century Club") */
  name: string;

  /** Description */
  description?: string;

  /** Icon for display */
  icon?: string;

  /** The condition that triggers this milestone */
  condition: MilestoneCondition;

  /** Reward granted when milestone is reached */
  reward?: MilestoneReward;

  /** Notification configuration */
  notification?: MilestoneNotification;

  /** Whether this milestone appears on leaderboards */
  showOnLeaderboard: boolean;

  /** Whether this milestone is hidden until achieved */
  hidden: boolean;

  /** Whether this milestone persists through prestige */
  persistThroughPrestige: boolean;

  /** Category for grouping */
  category?: string;

  /** Sort order within category */
  sortOrder: number;

  /** Points value (for milestone score aggregation) */
  points: number;

  createdAt: Date;
  updatedAt: Date;
}

interface MilestoneCondition {
  type: 'level_reached' | 'xp_earned' | 'prestige_tier' | 'skill_allocated' | 'season_tier' | 'custom';
  trackId?: string;
  value: number | bigint;
  customKey?: string;
}

interface MilestoneReward {
  type: 'currency' | 'item' | 'cosmetic' | 'title' | 'xp' | 'skill_points' | 'custom';
  rewardId: string;
  amount?: number;
  metadata?: Record<string, unknown>;
}

interface MilestoneNotification {
  /** Title for the notification */
  title: string;

  /** Body text */
  body: string;

  /** Whether to show an in-app banner */
  showBanner: boolean;

  /** Whether to send a push notification */
  sendPush: boolean;

  /** Whether to broadcast to the venture (public announcement) */
  broadcastToVenture: boolean;

  /** Animation/effect to play */
  effect?: string;

  /** Sound to play */
  sound?: string;
}

/**
 * User's state for a milestone.
 */
interface MilestoneState {
  milestoneId: string;
  userId: string;

  /** Whether the milestone has been achieved */
  achieved: boolean;

  /** When the milestone was achieved */
  achievedAt?: Date;

  /** Current progress toward the milestone (0.0 - 1.0) */
  progress: number;

  /** Current value toward the milestone condition */
  currentValue: number | bigint;

  /** Required value */
  requiredValue: number | bigint;

  /** Whether the reward has been claimed */
  rewardClaimed: boolean;

  /** Rank on the leaderboard (null if not on leaderboard) */
  leaderboardRank?: number;
}

/**
 * Milestone leaderboard.
 */
interface MilestoneLeaderboard {
  milestoneId: string;
  milestoneName: string;
  ventureId: string;

  /** Entries sorted by achievement time (earliest first) */
  entries: Array<{
    rank: number;
    userId: string;
    displayName: string;
    achievedAt: Date;
    prestigeTier?: number;
  }>;

  /** Total users who have achieved this milestone */
  totalAchievers: number;

  /** Percentage of all users who have achieved this milestone */
  achievementRate: number;

  lastUpdated: Date;
}
```

---

## Database Schemas

### progression_configs

Stores the top-level progression configuration for each venture.

```typescript
import { pgTable, text, uuid, boolean, jsonb, timestamp, integer } from 'drizzle-orm/pg-core';

export const progressionConfigs = pgTable('progression_configs', {
  id: uuid('id').primaryKey().defaultRandom(),
  ventureId: uuid('venture_id').notNull().references(() => ventures.id),

  /** Display name for the progression system */
  name: text('name').notNull(),

  /** Whether progression is enabled for this venture */
  enabled: boolean('enabled').notNull().default(true),

  /** Default XP curve ID for the primary track */
  defaultCurveId: uuid('default_curve_id'),

  /** Default max level */
  defaultMaxLevel: integer('default_max_level').default(100),

  /** Whether to use 0-indexed levels */
  zeroIndexed: boolean('zero_indexed').notNull().default(false),

  /** XP modifier stack configuration */
  modifierConfig: jsonb('modifier_config').$type<{
    maxMultiplier: number;
    diminishingReturnsThreshold: bigint;
    diminishingReturnsRate: number;
  }>(),

  /** Global XP rate multiplier (for events, maintenance, etc.) */
  globalXPMultiplier: integer('global_xp_multiplier').notNull().default(100), // 100 = 1.0x

  /** Platform-level progression settings */
  platformProgression: jsonb('platform_progression').$type<{
    enabled: boolean;
    xpShareRatio: number;
    sharedPoolTypes: XPPoolType[];
  }>(),

  /** Feature flags */
  features: jsonb('features').$type<{
    skillTrees: boolean;
    prestige: boolean;
    seasonPass: boolean;
    milestones: boolean;
    multiTrack: boolean;
    crossVenture: boolean;
  }>(),

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});
```

### user_progression

Stores the materialized progression state for each user per track.

```typescript
export const userProgression = pgTable('user_progression', {
  id: uuid('id').primaryKey().defaultRandom(),
  ventureId: uuid('venture_id').notNull().references(() => ventures.id),
  userId: uuid('user_id').notNull().references(() => users.id),
  trackId: uuid('track_id').notNull().references(() => progressionTracks.id),

  /** Total accumulated XP */
  totalXP: bigint('total_xp', { mode: 'bigint' }).notNull().default(0n),

  /** Current resolved level */
  currentLevel: integer('current_level').notNull().default(1),

  /** XP earned within the current level */
  xpInLevel: bigint('xp_in_level', { mode: 'bigint' }).notNull().default(0n),

  /** Current prestige tier */
  prestigeTier: integer('prestige_tier').notNull().default(0),

  /** Overflow XP (earned beyond max level) */
  overflowXP: bigint('overflow_xp', { mode: 'bigint' }).notNull().default(0n),

  /** Lifetime XP earned (never resets, even on prestige) */
  lifetimeXP: bigint('lifetime_xp', { mode: 'bigint' }).notNull().default(0n),

  /** XP pool breakdowns */
  poolBreakdown: jsonb('pool_breakdown').$type<Record<XPPoolType, bigint>>(),

  /** Active XP modifiers snapshot */
  activeModifiers: jsonb('active_modifiers').$type<XPModifier[]>(),

  /** Last XP gain timestamp */
  lastXPGain: timestamp('last_xp_gain', { withTimezone: true }),

  /** Last level-up timestamp */
  lastLevelUp: timestamp('last_level_up', { withTimezone: true }),

  /** Consecutive days with XP gain (for streak tracking) */
  dailyStreak: integer('daily_streak').notNull().default(0),

  /** Last day with XP gain (for streak tracking) */
  lastActiveDate: timestamp('last_active_date', { withTimezone: true }),

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  // Composite unique: one row per user per track per venture
  userTrackUnique: unique().on(table.ventureId, table.userId, table.trackId),
  // Fast lookup by user
  userIdx: index('user_progression_user_idx').on(table.ventureId, table.userId),
  // Level-based queries (leaderboards)
  levelIdx: index('user_progression_level_idx').on(table.ventureId, table.trackId, table.currentLevel),
}));
```

### xp_curves

Stores XP curve definitions.

```typescript
export const xpCurves = pgTable('xp_curves', {
  id: uuid('id').primaryKey().defaultRandom(),
  ventureId: uuid('venture_id').notNull().references(() => ventures.id),

  name: text('name').notNull(),
  description: text('description'),

  /** Curve type */
  type: text('type').$type<XPCurveType>().notNull(),

  /** Base XP for the first level transition */
  baseXP: bigint('base_xp', { mode: 'bigint' }).notNull(),

  /** Curve-specific parameters */
  params: jsonb('params').$type<XPCurveParams>().notNull(),

  /** Maximum level (null = unlimited) */
  maxLevel: integer('max_level'),

  /** Whether levels are 0-indexed */
  zeroIndexed: boolean('zero_indexed').notNull().default(false),

  /** Precomputed lookup table for stepped/custom curves */
  lookupTable: jsonb('lookup_table').$type<XPCurvePoint[]>(),

  /** Whether this curve is the venture's default */
  isDefault: boolean('is_default').notNull().default(false),

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});
```

### xp_events

Event-sourced XP gain records (append-only).

```typescript
export const xpEvents = pgTable('xp_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  ventureId: uuid('venture_id').notNull().references(() => ventures.id),
  userId: uuid('user_id').notNull().references(() => users.id),
  trackId: uuid('track_id').notNull().references(() => progressionTracks.id),

  /** XP source identifier */
  source: text('source').notNull(),

  /** XP pool type */
  poolType: text('pool_type').$type<XPPoolType>().notNull(),

  /** Base XP before modifiers */
  baseAmount: bigint('base_amount', { mode: 'bigint' }).notNull(),

  /** Final XP after modifiers */
  finalAmount: bigint('final_amount', { mode: 'bigint' }).notNull(),

  /** Modifiers that were applied */
  appliedModifiers: jsonb('applied_modifiers').$type<Array<{
    modifierId: string;
    name: string;
    type: XPModifierType;
    value: number;
  }>>(),

  /** Whether this triggered a level-up */
  triggeredLevelUp: boolean('triggered_level_up').notNull().default(false),

  /** Level after this XP gain */
  levelAfter: integer('level_after').notNull(),

  /** Total XP after this gain */
  totalXPAfter: bigint('total_xp_after', { mode: 'bigint' }).notNull(),

  /** Context metadata */
  context: jsonb('context').$type<Record<string, unknown>>(),

  /** Idempotency key */
  idempotencyKey: text('idempotency_key'),

  /** Timestamp */
  occurredAt: timestamp('occurred_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  userTimeIdx: index('xp_events_user_time_idx').on(table.ventureId, table.userId, table.occurredAt),
  idempotencyIdx: unique('xp_events_idempotency_idx').on(table.ventureId, table.idempotencyKey),
  sourceIdx: index('xp_events_source_idx').on(table.ventureId, table.source),
}));
```

### skill_trees

Stores skill tree definitions.

```typescript
export const skillTrees = pgTable('skill_trees', {
  id: uuid('id').primaryKey().defaultRandom(),
  ventureId: uuid('venture_id').notNull().references(() => ventures.id),

  name: text('name').notNull(),
  description: text('description'),

  /** Root node ID */
  rootNodeId: uuid('root_node_id'),

  /** Total max points at max level */
  maxPoints: integer('max_points').notNull(),

  /** Points per level-up */
  pointsPerLevel: integer('points_per_level').notNull().default(1),

  /** Bonus point levels */
  bonusPointLevels: jsonb('bonus_point_levels').$type<Array<{
    level: number;
    points: number;
  }>>(),

  /** Branch definitions */
  branches: jsonb('branches').$type<SkillBranch[]>(),

  /** Respec configuration */
  respecConfig: jsonb('respec_config').$type<RespecConfig>().notNull(),

  /** Exclusivity rules */
  exclusivityRules: jsonb('exclusivity_rules').$type<ExclusivityRule[]>(),

  /** Schema version */
  version: integer('version').notNull().default(1),

  /** Whether this tree is active */
  enabled: boolean('enabled').notNull().default(true),

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});
```

### skill_nodes

Stores individual nodes within skill trees.

```typescript
export const skillNodes = pgTable('skill_nodes', {
  id: uuid('id').primaryKey().defaultRandom(),
  treeId: uuid('tree_id').notNull().references(() => skillTrees.id, { onDelete: 'cascade' }),
  ventureId: uuid('venture_id').notNull(),

  name: text('name').notNull(),
  description: text('description').notNull(),
  icon: text('icon'),

  /** Node type */
  type: text('type').$type<SkillNodeType>().notNull(),

  /** Branch ID */
  branchId: text('branch_id'),

  /** Cost in skill points */
  cost: integer('cost').notNull().default(1),

  /** Maximum ranks */
  maxRanks: integer('max_ranks').notNull().default(1),

  /** Per-rank effects */
  rankEffects: jsonb('rank_effects').$type<Array<{
    rank: number;
    effect: string;
    value: number;
  }>>(),

  /** Minimum level to allocate */
  minLevel: integer('min_level'),

  /** Minimum prestige tier */
  minPrestige: integer('min_prestige'),

  /** UI position */
  positionX: integer('position_x').notNull().default(0),
  positionY: integer('position_y').notNull().default(0),

  /** Venture-specific metadata */
  metadata: jsonb('metadata').$type<Record<string, unknown>>(),

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  treeIdx: index('skill_nodes_tree_idx').on(table.treeId),
}));
```

### skill_edges

Stores directed edges between skill nodes.

```typescript
export const skillEdges = pgTable('skill_edges', {
  id: uuid('id').primaryKey().defaultRandom(),
  treeId: uuid('tree_id').notNull().references(() => skillTrees.id, { onDelete: 'cascade' }),

  /** Source node (prerequisite) */
  fromNodeId: uuid('from_node_id').notNull().references(() => skillNodes.id, { onDelete: 'cascade' }),

  /** Target node (dependent) */
  toNodeId: uuid('to_node_id').notNull().references(() => skillNodes.id, { onDelete: 'cascade' }),

  /** Edge type */
  type: text('type').$type<'prerequisite' | 'mutex' | 'recommended'>().notNull().default('prerequisite'),

  /** Minimum ranks required in source node */
  requiredRanks: integer('required_ranks').default(1),
}, (table) => ({
  treeIdx: index('skill_edges_tree_idx').on(table.treeId),
  fromIdx: index('skill_edges_from_idx').on(table.fromNodeId),
  toIdx: index('skill_edges_to_idx').on(table.toNodeId),
  uniqueEdge: unique().on(table.fromNodeId, table.toNodeId),
}));
```

### user_skills

Stores user skill point allocations.

```typescript
export const userSkills = pgTable('user_skills', {
  id: uuid('id').primaryKey().defaultRandom(),
  ventureId: uuid('venture_id').notNull(),
  userId: uuid('user_id').notNull().references(() => users.id),
  treeId: uuid('tree_id').notNull().references(() => skillTrees.id),
  nodeId: uuid('node_id').notNull().references(() => skillNodes.id),

  /** Current ranks allocated */
  currentRanks: integer('current_ranks').notNull().default(0),

  /** When this node was first allocated */
  allocatedAt: timestamp('allocated_at', { withTimezone: true }).notNull().defaultNow(),

  /** When ranks were last changed */
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  userTreeIdx: index('user_skills_user_tree_idx').on(table.userId, table.treeId),
  uniqueAlloc: unique().on(table.userId, table.treeId, table.nodeId),
}));
```

### unlock_paths

Stores unlock path definitions.

```typescript
export const unlockPaths = pgTable('unlock_paths', {
  id: uuid('id').primaryKey().defaultRandom(),
  ventureId: uuid('venture_id').notNull().references(() => ventures.id),

  name: text('name').notNull(),
  description: text('description'),

  /** Unique gate identifier */
  gateId: text('gate_id').notNull(),

  /** Unlock conditions (all must be met) */
  conditions: jsonb('conditions').$type<UnlockCondition[]>().notNull(),

  /** Reward metadata */
  reward: jsonb('reward').$type<UnlockReward>(),

  /** Display ordering */
  sortOrder: integer('sort_order').notNull().default(0),

  /** Category */
  category: text('category'),

  /** Whether visible before unlock */
  visibleBeforeUnlock: boolean('visible_before_unlock').notNull().default(true),

  /** Whether it survives prestige */
  persistThroughPrestige: boolean('persist_through_prestige').notNull().default(false),

  /** Whether this path is active */
  enabled: boolean('enabled').notNull().default(true),

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  gateIdx: unique('unlock_paths_gate_idx').on(table.ventureId, table.gateId),
}));
```

### unlock_states

Stores per-user unlock state.

```typescript
export const unlockStates = pgTable('unlock_states', {
  id: uuid('id').primaryKey().defaultRandom(),
  ventureId: uuid('venture_id').notNull(),
  userId: uuid('user_id').notNull().references(() => users.id),
  pathId: uuid('path_id').notNull().references(() => unlockPaths.id),
  gateId: text('gate_id').notNull(),

  /** Whether the gate is unlocked */
  unlocked: boolean('unlocked').notNull().default(false),

  /** When the gate was unlocked */
  unlockedAt: timestamp('unlocked_at', { withTimezone: true }),

  /** How the unlock happened */
  unlockSource: text('unlock_source').$type<'progression' | 'admin' | 'prestige_carryover' | 'purchase'>(),

  /** Admin reason (if force-unlocked/revoked) */
  adminReason: text('admin_reason'),

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  userGateIdx: unique('unlock_states_user_gate_idx').on(table.ventureId, table.userId, table.gateId),
  userIdx: index('unlock_states_user_idx').on(table.ventureId, table.userId),
}));
```

### prestige_records

Stores historical prestige/rebirth records.

```typescript
export const prestigeRecords = pgTable('prestige_records', {
  id: uuid('id').primaryKey().defaultRandom(),
  ventureId: uuid('venture_id').notNull().references(() => ventures.id),
  userId: uuid('user_id').notNull().references(() => users.id),
  trackId: uuid('track_id').notNull().references(() => progressionTracks.id),

  /** Prestige tier reached */
  toTier: integer('to_tier').notNull(),

  /** Level at time of prestige */
  levelAtPrestige: integer('level_at_prestige').notNull(),

  /** Total XP at time of prestige */
  xpAtPrestige: bigint('xp_at_prestige', { mode: 'bigint' }).notNull(),

  /** Carryover snapshot */
  carryoverSnapshot: jsonb('carryover_snapshot').$type<Record<string, unknown>>(),

  /** Reset snapshot (what was lost) */
  resetSnapshot: jsonb('reset_snapshot').$type<Record<string, unknown>>(),

  /** Bonuses applied at this tier */
  bonusesApplied: jsonb('bonuses_applied').$type<PrestigeBonus[]>(),

  /** Rewards granted */
  rewardsGranted: jsonb('rewards_granted').$type<PrestigeReward[]>(),

  /** Time spent at previous tier (seconds) */
  timeAtPreviousTier: integer('time_at_previous_tier'),

  performedAt: timestamp('performed_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  userIdx: index('prestige_records_user_idx').on(table.ventureId, table.userId),
  tierIdx: index('prestige_records_tier_idx').on(table.ventureId, table.userId, table.toTier),
}));
```

### season_passes

Stores season pass definitions.

```typescript
export const seasonPasses = pgTable('season_passes', {
  id: uuid('id').primaryKey().defaultRandom(),
  ventureId: uuid('venture_id').notNull().references(() => ventures.id),

  name: text('name').notNull(),
  description: text('description'),

  /** Season number */
  seasonNumber: integer('season_number').notNull(),

  /** XP curve for tier progression */
  curveId: uuid('curve_id').notNull().references(() => xpCurves.id),

  /** Start and end dates */
  startDate: timestamp('start_date', { withTimezone: true }).notNull(),
  endDate: timestamp('end_date', { withTimezone: true }).notNull(),

  /** Grace period after end (days) */
  gracePeriodDays: integer('grace_period_days').notNull().default(7),

  /** Total number of tiers */
  totalTiers: integer('total_tiers').notNull(),

  /** Free track tiers */
  freeTiers: jsonb('free_tiers').$type<SeasonTier[]>().notNull(),

  /** Premium track tiers */
  premiumTiers: jsonb('premium_tiers').$type<SeasonTier[]>().notNull(),

  /** Season-specific XP boosts */
  xpBoosts: jsonb('xp_boosts').$type<Array<{
    name: string;
    multiplier: number;
    poolTypes?: XPPoolType[];
    startDate?: Date;
    endDate?: Date;
  }>>(),

  /** Premium price reference */
  premiumPriceRef: text('premium_price_ref'),

  /** Auto-claim unclaimed rewards at season end */
  autoClaimOnEnd: boolean('auto_claim_on_end').notNull().default(false),

  /** Allow retroactive claiming */
  allowRetroactiveClaim: boolean('allow_retroactive_claim').notNull().default(true),

  /** Season status */
  status: text('status').$type<'draft' | 'scheduled' | 'active' | 'ending' | 'ended' | 'archived'>().notNull().default('draft'),

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  ventureSeasonIdx: unique('season_passes_venture_season_idx').on(table.ventureId, table.seasonNumber),
  statusIdx: index('season_passes_status_idx').on(table.ventureId, table.status),
}));
```

### season_progress

Stores per-user season progress.

```typescript
export const seasonProgress = pgTable('season_progress', {
  id: uuid('id').primaryKey().defaultRandom(),
  ventureId: uuid('venture_id').notNull(),
  userId: uuid('user_id').notNull().references(() => users.id),
  seasonId: uuid('season_id').notNull().references(() => seasonPasses.id),

  /** Current tier reached */
  currentTier: integer('current_tier').notNull().default(0),

  /** Total season XP */
  totalSeasonXP: bigint('total_season_xp', { mode: 'bigint' }).notNull().default(0n),

  /** Whether user has premium */
  isPremium: boolean('is_premium').notNull().default(false),

  /** Premium upgrade timestamp */
  premiumSince: timestamp('premium_since', { withTimezone: true }),

  /** Payment reference for premium */
  premiumPaymentRef: text('premium_payment_ref'),

  /** Claimed free reward IDs */
  claimedFreeRewards: jsonb('claimed_free_rewards').$type<string[]>().notNull().default([]),

  /** Claimed premium reward IDs */
  claimedPremiumRewards: jsonb('claimed_premium_rewards').$type<string[]>().notNull().default([]),

  /** Challenges completed count */
  challengesCompleted: integer('challenges_completed').notNull().default(0),

  lastUpdated: timestamp('last_updated', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  userSeasonIdx: unique('season_progress_user_season_idx').on(table.ventureId, table.userId, table.seasonId),
}));
```

### milestones

Stores milestone definitions.

```typescript
export const milestones = pgTable('milestones', {
  id: uuid('id').primaryKey().defaultRandom(),
  ventureId: uuid('venture_id').notNull().references(() => ventures.id),

  name: text('name').notNull(),
  description: text('description'),
  icon: text('icon'),

  /** Trigger condition */
  condition: jsonb('condition').$type<MilestoneCondition>().notNull(),

  /** Reward */
  reward: jsonb('reward').$type<MilestoneReward>(),

  /** Notification config */
  notification: jsonb('notification').$type<MilestoneNotification>(),

  /** Show on leaderboard */
  showOnLeaderboard: boolean('show_on_leaderboard').notNull().default(false),

  /** Hidden until achieved */
  hidden: boolean('hidden').notNull().default(false),

  /** Survives prestige */
  persistThroughPrestige: boolean('persist_through_prestige').notNull().default(true),

  /** Category */
  category: text('category'),

  /** Sort order */
  sortOrder: integer('sort_order').notNull().default(0),

  /** Points value */
  points: integer('points').notNull().default(0),

  /** Active */
  enabled: boolean('enabled').notNull().default(true),

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});
```

### user_milestones

Stores per-user milestone states.

```typescript
export const userMilestones = pgTable('user_milestones', {
  id: uuid('id').primaryKey().defaultRandom(),
  ventureId: uuid('venture_id').notNull(),
  userId: uuid('user_id').notNull().references(() => users.id),
  milestoneId: uuid('milestone_id').notNull().references(() => milestones.id),

  /** Whether achieved */
  achieved: boolean('achieved').notNull().default(false),

  /** Achievement timestamp */
  achievedAt: timestamp('achieved_at', { withTimezone: true }),

  /** Current progress value */
  currentValue: bigint('current_value', { mode: 'bigint' }).notNull().default(0n),

  /** Whether reward was claimed */
  rewardClaimed: boolean('reward_claimed').notNull().default(false),

  /** Reward claim timestamp */
  rewardClaimedAt: timestamp('reward_claimed_at', { withTimezone: true }),

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  userMilestoneIdx: unique('user_milestones_unique_idx').on(table.ventureId, table.userId, table.milestoneId),
  achievedIdx: index('user_milestones_achieved_idx').on(table.ventureId, table.milestoneId, table.achievedAt),
}));
```

### progression_tracks

Stores progression track definitions.

```typescript
export const progressionTracks = pgTable('progression_tracks', {
  id: uuid('id').primaryKey().defaultRandom(),
  ventureId: uuid('venture_id').notNull().references(() => ventures.id),

  name: text('name').notNull(),
  description: text('description'),

  /** Track type */
  type: text('type').$type<TrackType>().notNull(),

  /** Associated XP curve */
  curveId: uuid('curve_id').notNull().references(() => xpCurves.id),

  /** XP pool sources and ratios */
  xpSources: jsonb('xp_sources').$type<Array<{
    poolType: XPPoolType;
    ratio: number;
  }>>().notNull(),

  /** Associated prestige config */
  prestigeConfigId: uuid('prestige_config_id'),

  /** Display config */
  display: jsonb('display').$type<{
    icon?: string;
    color?: string;
    showInDashboard: boolean;
    sortOrder: number;
  }>().notNull(),

  /** Enabled state */
  enabled: boolean('enabled').notNull().default(true),

  /** Visible to users */
  visible: boolean('visible').notNull().default(true),

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});
```

### track_progress

Stores per-user per-track progress (separate from user_progression for feed rules).

```typescript
export const trackProgress = pgTable('track_progress', {
  id: uuid('id').primaryKey().defaultRandom(),
  ventureId: uuid('venture_id').notNull(),
  userId: uuid('user_id').notNull().references(() => users.id),
  trackId: uuid('track_id').notNull().references(() => progressionTracks.id),

  /** XP pool totals */
  poolTotals: jsonb('pool_totals').$type<Record<XPPoolType, bigint>>().notNull().default({}),

  /** Daily XP earned (for cap enforcement) */
  dailyXP: bigint('daily_xp', { mode: 'bigint' }).notNull().default(0n),

  /** Date for daily XP tracking */
  dailyDate: timestamp('daily_date', { withTimezone: true }),

  /** Weekly XP earned */
  weeklyXP: bigint('weekly_xp', { mode: 'bigint' }).notNull().default(0n),

  /** Week start for weekly XP tracking */
  weekStart: timestamp('week_start', { withTimezone: true }),

  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  userTrackIdx: unique('track_progress_user_track_idx').on(table.ventureId, table.userId, table.trackId),
}));
```

### Row-Level Security

All tables enforce RLS scoped by `venture_id`:

```sql
-- Example RLS policy for user_progression
ALTER TABLE user_progression ENABLE ROW LEVEL SECURITY;

-- Users can read their own progression
CREATE POLICY "users_read_own_progression"
  ON user_progression
  FOR SELECT
  USING (
    auth.uid() = user_id
    AND venture_id IN (
      SELECT venture_id FROM venture_members
      WHERE user_id = auth.uid()
    )
  );

-- Users cannot directly modify progression (only via service role)
CREATE POLICY "service_role_all_progression"
  ON user_progression
  FOR ALL
  USING (auth.role() = 'service_role');

-- Venture admins can read all progression in their venture
CREATE POLICY "admins_read_venture_progression"
  ON user_progression
  FOR SELECT
  USING (
    venture_id IN (
      SELECT venture_id FROM venture_members
      WHERE user_id = auth.uid()
      AND role IN ('owner', 'admin')
    )
  );
```

---

## Code Examples

### Example 1: Configure a Venture's Progression System

```typescript
import { ProgressionService } from '@mcv/engagement/progression';

const progressionService = container.resolve(ProgressionService);

// Set up progression for a new RPG venture
const config = await progressionService.upsertConfig('venture-rpg-001', {
  name: 'Dragon Quest Progression',
  enabled: true,
  defaultMaxLevel: 99,
  zeroIndexed: false,
  modifierConfig: {
    maxMultiplier: 10.0,
    diminishingReturnsThreshold: 100000n,
    diminishingReturnsRate: 0.85,
  },
  globalXPMultiplier: 100, // 1.0x (no global modifier)
  platformProgression: {
    enabled: true,
    xpShareRatio: 0.1, // 10% of venture XP feeds platform level
    sharedPoolTypes: ['combat', 'quest'],
  },
  features: {
    skillTrees: true,
    prestige: true,
    seasonPass: true,
    milestones: true,
    multiTrack: true,
    crossVenture: true,
  },
});

// Create an exponential XP curve
const curve = await progressionService.upsertCurve('venture-rpg-001', {
  name: 'Standard RPG Curve',
  type: 'exponential',
  baseXP: 100n,
  params: {
    multiplier: 1.15, // Each level requires 15% more XP than the last
  },
  maxLevel: 99,
  zeroIndexed: false,
});

// Create progression tracks
const playerTrack = await progressionService.upsertTrack('venture-rpg-001', {
  name: 'Player Level',
  type: 'player',
  curveId: curve.id,
  xpSources: [
    { poolType: 'combat', ratio: 1.0 },
    { poolType: 'quest', ratio: 1.0 },
    { poolType: 'exploration', ratio: 0.5 },
  ],
  display: {
    icon: 'sword-shield',
    color: '#FFD700',
    showInDashboard: true,
    sortOrder: 1,
  },
});

const craftingTrack = await progressionService.upsertTrack('venture-rpg-001', {
  name: 'Crafting Level',
  type: 'skill',
  curveId: curve.id, // Could use a different curve
  xpSources: [
    { poolType: 'crafting', ratio: 1.0 },
    { poolType: 'trade', ratio: 0.3 },
  ],
  display: {
    icon: 'anvil',
    color: '#CD853F',
    showInDashboard: true,
    sortOrder: 2,
  },
});

console.log('Progression configured:', {
  config: config.id,
  curve: curve.id,
  tracks: [playerTrack.id, craftingTrack.id],
});
```

### Example 2: Award XP and Handle Level-Ups

```typescript
import { ProgressionService, type XPGain } from '@mcv/engagement/progression';

const progressionService = container.resolve(ProgressionService);

// Award combat XP for defeating a boss
const gain: XPGain = {
  source: 'boss_defeat',
  xpType: 'combat',
  baseAmount: 5000n,
  context: {
    bossId: 'dragon-lord-99',
    bossName: 'Dragon Lord',
    difficulty: 'heroic',
    partySize: 4,
  },
  idempotencyKey: `boss-defeat-${eventId}`, // Prevent double-awards on retry
};

const result = await progressionService.awardXP(
  'venture-rpg-001',
  'user-abc-123',
  gain
);

// Check what happened
console.log('XP Award Result:', {
  baseAmount: gain.baseAmount,
  modifiedAmount: result.modifiedAmount,
  modifiers: result.appliedModifiers.map(m => ({
    name: m.modifier.name,
    type: m.modifier.type,
    before: m.beforeAmount,
    after: m.afterAmount,
  })),
});

// Check for level-ups
for (const update of result.trackUpdates) {
  if (update.leveledUp) {
    console.log(`ðŸŽ‰ LEVEL UP on ${update.trackId}!`, {
      from: update.previousLevel.level,
      to: update.currentLevel.level,
      levelsGained: update.levelsGained,
    });

    // Maybe show a level-up animation to the client
    await notifyLevelUp(userId, update);
  } else {
    console.log(`Progress on ${update.trackId}:`, {
      level: update.currentLevel.level,
      progress: `${(update.currentLevel.progressPercent * 100).toFixed(1)}%`,
      xpToNext: update.currentLevel.xpForLevel - update.currentLevel.xpInLevel,
    });
  }
}

// Check for new unlocks
if (result.newUnlocks.length > 0) {
  console.log('ðŸ”“ New unlocks:', result.newUnlocks.map(u => u.gateId));
}

// Check for milestones
if (result.milestonesReached.length > 0) {
  console.log('ðŸ† Milestones reached:', result.milestonesReached.map(m => m.name));
}

// Batch XP award for a party
const partyResult = await progressionService.awardXPBatch('venture-rpg-001', [
  { userId: 'user-abc-123', gain: { source: 'party_bonus', xpType: 'combat', baseAmount: 1000n } },
  { userId: 'user-def-456', gain: { source: 'party_bonus', xpType: 'combat', baseAmount: 1000n } },
  { userId: 'user-ghi-789', gain: { source: 'party_bonus', xpType: 'combat', baseAmount: 1000n } },
  { userId: 'user-jkl-012', gain: { source: 'party_bonus', xpType: 'combat', baseAmount: 1000n } },
]);
```

### Example 3: Define and Manage Skill Trees

```typescript
import { ProgressionService, type SkillTreeConfig } from '@mcv/engagement/progression';

const progressionService = container.resolve(ProgressionService);

// Define a warrior skill tree
const treeConfig: SkillTreeConfig = {
  name: 'Warrior Talents',
  description: 'Master the arts of combat, defense, and battlefield control.',
  maxPoints: 50,
  pointsPerLevel: 1,
  bonusPointLevels: [
    { level: 10, points: 2 }, // Bonus points at level 10
    { level: 25, points: 3 },
    { level: 50, points: 5 },
    { level: 99, points: 10 },
  ],
  respecConfig: {
    allowFullRespec: true,
    allowPartialRespec: true,
    costType: 'escalating',
    baseCost: 100,
    costCurrencyId: 'gold',
    escalationMultiplier: 1.5,
    maxRespecs: -1, // Unlimited
    cooldownSeconds: 3600, // 1 hour cooldown
  },
  branches: [
    { id: 'arms', name: 'Arms', description: 'Offensive combat mastery', color: '#FF4444', icon: 'sword', sortOrder: 1 },
    { id: 'protection', name: 'Protection', description: 'Defensive stalwart', color: '#4488FF', icon: 'shield', sortOrder: 2 },
    { id: 'fury', name: 'Fury', description: 'Berserker rage', color: '#FF8800', icon: 'flame', sortOrder: 3 },
  ],
  nodes: [
    // Root
    { id: 'root', name: 'Warrior Training', description: 'Basic warrior training', type: 'root', cost: 0, maxRanks: 1, position: { x: 0, y: 0 } },

    // Arms Branch
    { id: 'arms-1', name: 'Sharpened Blade', description: '+5% weapon damage per rank', type: 'passive', branchId: 'arms', cost: 1, maxRanks: 5, rankEffects: [
      { rank: 1, effect: 'weapon_damage', value: 5 },
      { rank: 2, effect: 'weapon_damage', value: 10 },
      { rank: 3, effect: 'weapon_damage', value: 15 },
      { rank: 4, effect: 'weapon_damage', value: 20 },
      { rank: 5, effect: 'weapon_damage', value: 25 },
    ], position: { x: -2, y: 1 } },
    { id: 'arms-2', name: 'Deep Wounds', description: 'Critical hits cause bleeding', type: 'active', branchId: 'arms', cost: 2, maxRanks: 1, position: { x: -2, y: 2 } },
    { id: 'arms-3', name: 'Mortal Strike', description: 'Powerful strike that reduces healing', type: 'keystone', branchId: 'arms', cost: 3, maxRanks: 1, minLevel: 20, position: { x: -2, y: 3 } },
    { id: 'arms-cap', name: 'Bladestorm', description: 'Whirlwind of steel hitting all enemies', type: 'capstone', branchId: 'arms', cost: 5, maxRanks: 1, minLevel: 50, position: { x: -2, y: 5 } },

    // Protection Branch
    { id: 'prot-1', name: 'Toughness', description: '+3% max health per rank', type: 'passive', branchId: 'protection', cost: 1, maxRanks: 5, rankEffects: [
      { rank: 1, effect: 'max_health', value: 3 },
      { rank: 2, effect: 'max_health', value: 6 },
      { rank: 3, effect: 'max_health', value: 9 },
      { rank: 4, effect: 'max_health', value: 12 },
      { rank: 5, effect: 'max_health', value: 15 },
    ], position: { x: 0, y: 1 } },
    { id: 'prot-2', name: 'Shield Wall', description: 'Block incoming damage for 6s', type: 'active', branchId: 'protection', cost: 2, maxRanks: 1, position: { x: 0, y: 2 } },
    { id: 'prot-3', name: 'Last Stand', description: 'Cannot die for 5 seconds when fatal damage taken', type: 'keystone', branchId: 'protection', cost: 3, maxRanks: 1, minLevel: 20, position: { x: 0, y: 3 } },
    { id: 'prot-cap', name: 'Immortal Fortress', description: 'Become immune to all damage for 10s', type: 'capstone', branchId: 'protection', cost: 5, maxRanks: 1, minLevel: 50, position: { x: 0, y: 5 } },

    // Fury Branch
    { id: 'fury-1', name: 'Enrage', description: '+2% attack speed per rank', type: 'passive', branchId: 'fury', cost: 1, maxRanks: 5, rankEffects: [
      { rank: 1, effect: 'attack_speed', value: 2 },
      { rank: 2, effect: 'attack_speed', value: 4 },
      { rank: 3, effect: 'attack_speed', value: 6 },
      { rank: 4, effect: 'attack_speed', value: 8 },
      { rank: 5, effect: 'attack_speed', value: 10 },
    ], position: { x: 2, y: 1 } },
    { id: 'fury-2', name: 'Bloodthirst', description: 'Attacks heal for 3% damage dealt', type: 'active', branchId: 'fury', cost: 2, maxRanks: 1, position: { x: 2, y: 2 } },
    { id: 'fury-3', name: 'Rampage', description: 'Chain of 3 rapid strikes', type: 'keystone', branchId: 'fury', cost: 3, maxRanks: 1, minLevel: 20, position: { x: 2, y: 3 } },
    { id: 'fury-cap', name: 'Titan\'s Grip', description: 'Wield two two-handed weapons', type: 'capstone', branchId: 'fury', cost: 5, maxRanks: 1, minLevel: 50, position: { x: 2, y: 5 } },
  ],
  edges: [
    // Root â†’ branches
    { fromNodeId: 'root', toNodeId: 'arms-1', type: 'prerequisite' },
    { fromNodeId: 'root', toNodeId: 'prot-1', type: 'prerequisite' },
    { fromNodeId: 'root', toNodeId: 'fury-1', type: 'prerequisite' },

    // Arms chain
    { fromNodeId: 'arms-1', toNodeId: 'arms-2', type: 'prerequisite', requiredRanks: 3 },
    { fromNodeId: 'arms-2', toNodeId: 'arms-3', type: 'prerequisite' },
    { fromNodeId: 'arms-3', toNodeId: 'arms-cap', type: 'prerequisite' },

    // Protection chain
    { fromNodeId: 'prot-1', toNodeId: 'prot-2', type: 'prerequisite', requiredRanks: 3 },
    { fromNodeId: 'prot-2', toNodeId: 'prot-3', type: 'prerequisite' },
    { fromNodeId: 'prot-3', toNodeId: 'prot-cap', type: 'prerequisite' },

    // Fury chain
    { fromNodeId: 'fury-1', toNodeId: 'fury-2', type: 'prerequisite', requiredRanks: 3 },
    { fromNodeId: 'fury-2', toNodeId: 'fury-3', type: 'prerequisite' },
    { fromNodeId: 'fury-3', toNodeId: 'fury-cap', type: 'prerequisite' },

    // Capstone mutex (can only pick one capstone)
    { fromNodeId: 'arms-cap', toNodeId: 'prot-cap', type: 'mutex' },
    { fromNodeId: 'arms-cap', toNodeId: 'fury-cap', type: 'mutex' },
    { fromNodeId: 'prot-cap', toNodeId: 'fury-cap', type: 'mutex' },
  ],
  exclusivityRules: [{
    name: 'Capstone Exclusivity',
    groups: [
      { name: 'Arms Mastery', nodeIds: ['arms-cap'] },
      { name: 'Protection Mastery', nodeIds: ['prot-cap'] },
      { name: 'Fury Mastery', nodeIds: ['fury-cap'] },
    ],
    maxGroups: 1,
    lockOnFirstAllocation: false, // Can change with respec
  }],
};

// Validate the tree before saving
const validation = await progressionService.validateSkillTree(treeConfig);
if (!validation.valid) {
  console.error('Skill tree validation failed:', validation.errors);
  // e.g., cycles detected, orphaned nodes, impossible prerequisites
} else {
  const tree = await progressionService.upsertSkillTree('venture-rpg-001', treeConfig);
  console.log('Skill tree created:', tree.id);
}

// Allocate skill points for a user
const allocation = await progressionService.allocateSkill(
  'venture-rpg-001',
  'user-abc-123',
  tree.id,
  'arms-1' // Allocate to Sharpened Blade
);

console.log('Allocation result:', {
  allocated: allocation.success,
  pointsRemaining: allocation.availablePoints,
  nodeState: allocation.nodeState,
});

// Batch allocate a full build path
const batchResult = await progressionService.allocateSkillBatch(
  'venture-rpg-001',
  'user-abc-123',
  tree.id,
  ['arms-1', 'arms-1', 'arms-1', 'arms-2', 'arms-3'] // 3 ranks in arms-1 + arms-2 + arms-3
);

// Check available next nodes
const available = await progressionService.getAvailableNodes(
  'venture-rpg-001',
  'user-abc-123',
  tree.id
);
console.log('Available nodes:', available.map(n => n.name));
```

### Example 4: Prestige/Rebirth System

```typescript
import { ProgressionService, type PrestigeConfig } from '@mcv/engagement/progression';

const progressionService = container.resolve(ProgressionService);

// Configure prestige for the player track
const prestigeConfig: PrestigeConfig = {
  ventureId: 'venture-rpg-001',
  trackId: 'player-track-id',
  enabled: true,
  minLevel: 99, // Must be max level to prestige
  maxTier: 10,
  tiers: [
    {
      tier: 1,
      name: 'Bronze Reborn',
      icon: 'star-bronze',
      color: '#CD7F32',
      bonuses: [
        { type: 'xp_multiplier', value: 1.10, cumulative: true },  // +10% XP
        { type: 'skill_points_bonus', value: 2, cumulative: true }, // +2 skill points per level
      ],
      rewards: [
        { type: 'cosmetic', rewardId: 'border-bronze-prestige', metadata: { description: 'Bronze prestige border' } },
        { type: 'title', rewardId: 'title-reborn', metadata: { title: 'The Reborn' } },
      ],
    },
    {
      tier: 2,
      name: 'Silver Reborn',
      icon: 'star-silver',
      color: '#C0C0C0',
      bonuses: [
        { type: 'xp_multiplier', value: 1.15, cumulative: true },  // +15% XP (replaces bronze)
        { type: 'skill_points_bonus', value: 4, cumulative: true },
        { type: 'max_level_increase', value: 5, cumulative: true },  // Max level 104
      ],
      rewards: [
        { type: 'cosmetic', rewardId: 'border-silver-prestige' },
        { type: 'title', rewardId: 'title-twice-born', metadata: { title: 'Twice Born' } },
        { type: 'currency', rewardId: 'premium-gems', amount: 500 },
      ],
    },
    {
      tier: 3,
      name: 'Gold Reborn',
      icon: 'star-gold',
      color: '#FFD700',
      bonuses: [
        { type: 'xp_multiplier', value: 1.25, cumulative: true },
        { type: 'skill_points_bonus', value: 6, cumulative: true },
        { type: 'max_level_increase', value: 10, cumulative: true },
        { type: 'exclusive_access', value: 1, cumulative: false }, // Access prestige-only dungeon
      ],
      rewards: [
        { type: 'cosmetic', rewardId: 'border-gold-prestige' },
        { type: 'cosmetic', rewardId: 'aura-golden-flame' },
        { type: 'title', rewardId: 'title-thrice-born', metadata: { title: 'Thrice Born' } },
        { type: 'currency', rewardId: 'premium-gems', amount: 1000 },
      ],
    },
    // ... tiers 4-10 follow same pattern with increasing bonuses
  ],
  carryover: {
    skills: false,           // Skills reset on prestige
    unlocks: false,          // Most unlocks reset
    persistentUnlockIds: [   // These specific unlocks survive
      'unlock-character-customization',
      'unlock-auction-house',
    ],
    persistentCurrencyIds: [ // Premium currency survives
      'premium-gems',
    ],
    milestones: true,        // Milestone achievements persist
    seasonProgress: true,    // Season progress persists
    custom: {
      'guild-membership': true,  // Stay in guild
      'friend-list': true,       // Keep friends
    },
  },
  curveScaling: {
    type: 'linear',
    multiplierPerTier: 1.1, // Each prestige requires 10% more XP per level
  },
  requireConfirmation: true,
  cooldownSeconds: 86400, // 24-hour cooldown between prestiges
};

// Save prestige config
await progressionService.upsertPrestigeConfig('venture-rpg-001', prestigeConfig);

// Check if user can prestige
const eligibility = await progressionService.canPrestige(
  'venture-rpg-001',
  'user-abc-123'
);

console.log('Prestige eligibility:', {
  eligible: eligibility.eligible,
  currentLevel: eligibility.currentLevel,
  requiredLevel: eligibility.requiredLevel,
  currentTier: eligibility.currentTier,
  nextTier: eligibility.nextTier,
  nextTierBonuses: eligibility.nextTierBonuses,
  cooldownRemaining: eligibility.cooldownRemaining,
});

if (eligibility.eligible) {
  // Execute prestige!
  const result = await progressionService.prestige(
    'venture-rpg-001',
    'user-abc-123'
  );

  console.log('ðŸŒŸ PRESTIGE COMPLETE!', {
    newTier: result.newTier,
    previousLevel: result.previousState.level,
    resetToLevel: result.currentState.level,
    activeBonuses: result.activeBonuses,
    rewardsGranted: result.rewards,
    carriedOver: result.carriedOver,
    itemsReset: result.reset,
  });
}

// Get prestige history
const history = await progressionService.getPrestigeHistory(
  'venture-rpg-001',
  'user-abc-123'
);
console.log('Prestige history:', history.map(r => ({
  tier: r.toTier,
  levelAtPrestige: r.levelAtPrestige,
  date: r.performedAt,
})));
```

### Example 5: Season Pass System

```typescript
import { ProgressionService, type SeasonPassConfig } from '@mcv/engagement/progression';

const progressionService = container.resolve(ProgressionService);

// Create a season pass
const seasonConfig: SeasonPassConfig = {
  name: 'Season 3: Age of Dragons',
  description: 'Earn dragon-themed rewards by gaining XP throughout the season!',
  seasonNumber: 3,
  schedule: {
    startDate: new Date('2026-03-01T00:00:00Z'),
    endDate: new Date('2026-05-31T23:59:59Z'),
    durationDays: 92,
    gracePeriodDays: 7,
    timezone: 'UTC',
  },
  totalTiers: 50,
  freeTiers: [
    { tierNumber: 1, track: 'free', xpRequired: 1000n, reward: { id: 'r1', type: 'currency', rewardId: 'gold', amount: 500, name: '500 Gold', rarity: 'common' }, featured: false },
    { tierNumber: 5, track: 'free', xpRequired: 5000n, reward: { id: 'r5', type: 'cosmetic', rewardId: 'skin-dragon-basic', name: 'Dragon Recruit Skin', rarity: 'rare' }, featured: true },
    { tierNumber: 10, track: 'free', xpRequired: 12000n, reward: { id: 'r10', type: 'currency', rewardId: 'gems', amount: 50, name: '50 Gems', rarity: 'uncommon' }, featured: false },
    { tierNumber: 25, track: 'free', xpRequired: 45000n, reward: { id: 'r25', type: 'cosmetic', rewardId: 'emote-dragonfire', name: 'Dragonfire Emote', rarity: 'epic' }, featured: true },
    { tierNumber: 50, track: 'free', xpRequired: 150000n, reward: { id: 'r50', type: 'title', rewardId: 'title-dragon-slayer', name: 'Dragon Slayer Title', rarity: 'legendary' }, featured: true },
  ],
  premiumTiers: [
    { tierNumber: 1, track: 'premium', xpRequired: 1000n, reward: { id: 'rp1', type: 'currency', rewardId: 'gold', amount: 2000, name: '2000 Gold', rarity: 'uncommon' }, featured: false },
    { tierNumber: 5, track: 'premium', xpRequired: 5000n, reward: { id: 'rp5', type: 'cosmetic', rewardId: 'skin-dragon-elite', name: 'Elite Dragon Skin', rarity: 'epic' }, featured: true },
    { tierNumber: 25, track: 'premium', xpRequired: 45000n, reward: { id: 'rp25', type: 'cosmetic', rewardId: 'mount-dragon', name: 'Dragon Mount', rarity: 'legendary' }, featured: true },
    { tierNumber: 50, track: 'premium', xpRequired: 150000n, reward: { id: 'rp50', type: 'cosmetic', rewardId: 'skin-ancient-dragon', name: 'Ancient Dragon Skin', rarity: 'mythic' }, featured: true },
  ],
  xpCurve: {
    type: 'linear_increasing',
    baseXpPerTier: 1000n,
    incrementPerTier: 200n,
  },
  bonusWeekends: {
    enabled: true,
    multiplier: 1.5,
    schedule: 'every_other_weekend',
  },
};

const season = await progressionService.createSeason(ctx, seasonConfig);

// Enroll a player in the season pass
const enrollment = await progressionService.enrollInSeason(ctx, {
  userId: 'user-123',
  seasonId: season.id,
  track: 'free', // Start with free track
});

// Upgrade to premium track
const upgraded = await progressionService.upgradeToPremiumTrack(ctx, {
  userId: 'user-123',
  seasonId: season.id,
  paymentRef: 'payment-abc-123', // Reference to payment transaction
  retroactive: true, // Grant all missed premium rewards
});

// Award season XP from gameplay
const xpResult = await progressionService.awardSeasonXp(ctx, {
  userId: 'user-123',
  seasonId: season.id,
  amount: 2500n,
  source: 'quest_completion',
  metadata: { questId: 'quest-dragon-hunt-1' },
});

// Check unlocked tiers and claim rewards
console.log('Current tier:', xpResult.currentTier);
console.log('New unlocks:', xpResult.unlockedTiers);

for (const tier of xpResult.unlockedTiers) {
  const claimed = await progressionService.claimSeasonReward(ctx, {
    userId: 'user-123',
    seasonId: season.id,
    tierNumber: tier.tierNumber,
    track: tier.track,
  });
  console.log(Claimed:  ());
}

// Check season progress
const progress = await progressionService.getSeasonProgress(ctx, {
  userId: 'user-123',
  seasonId: season.id,
});

console.log('Season Progress:', {
  currentTier: progress.currentTier,
  totalXp: progress.totalXp.toString(),
  xpToNextTier: progress.xpToNextTier.toString(),
  percentComplete: progress.percentComplete,
  track: progress.track,
  claimedRewards: progress.claimedRewards.length,
  unclaimedRewards: progress.unclaimedRewards.length,
  daysRemaining: progress.daysRemaining,
});
```


---

## Error Codes

All errors in `@mcv/engagement/progression` use the standard MCV error format with the `PROG_` prefix. Errors are thrown as `McvError` instances with structured metadata for client consumption.

| Code | Name | HTTP | Description |
|------|------|------|-------------|
| `PROG_001` | `INVALID_XP_AMOUNT` | 400 | XP amount must be a positive bigint value. Zero and negative values are rejected. |
| `PROG_002` | `MAX_LEVEL_REACHED` | 409 | Entity has reached the maximum configured level for this progression track. No further XP can be applied unless prestige is triggered. |
| `PROG_003` | `LEVEL_NOT_FOUND` | 404 | The requested level does not exist in the configured XP curve. May indicate a misconfigured level cap or curve. |
| `PROG_004` | `XP_CURVE_INVALID` | 400 | The XP curve configuration is malformed. Check that base values, growth rates, and formulas produce valid positive outputs for all levels. |
| `PROG_005` | `PREREQUISITE_NOT_MET` | 409 | One or more prerequisite skills/nodes have not been unlocked. The skill tree enforces dependency ordering. |
| `PROG_006` | `SKILL_POINT_INSUFFICIENT` | 409 | Not enough skill points to unlock or upgrade the requested node. Current balance is included in error metadata. |
| `PROG_007` | `SKILL_NODE_NOT_FOUND` | 404 | The referenced skill node ID does not exist in the active skill tree version. |
| `PROG_008` | `SKILL_TREE_NOT_FOUND` | 404 | The referenced skill tree ID does not exist or is not assigned to this entity/tenant. |
| `PROG_009` | `SKILL_ALREADY_UNLOCKED` | 409 | The skill node has already been unlocked at its maximum rank. |
| `PROG_010` | `SKILL_TREE_CYCLE_DETECTED` | 400 | A cycle was detected in the skill tree graph during validation. Skill trees must be directed acyclic graphs (DAGs). |
| `PROG_011` | `PRESTIGE_CONDITIONS_NOT_MET` | 409 | Entity does not meet the requirements for prestige/rebirth. Typically requires max level, specific achievements, or cooldown expiry. |
| `PROG_012` | `PRESTIGE_COOLDOWN_ACTIVE` | 429 | A cooldown period is active between prestige resets. Metadata includes `cooldownExpiresAt`. |
| `PROG_013` | `PRESTIGE_MAX_TIER_REACHED` | 409 | Entity has reached the maximum prestige tier. No further prestige resets are available. |
| `PROG_014` | `SEASON_NOT_FOUND` | 404 | The referenced season ID does not exist or has been archived. |
| `PROG_015` | `SEASON_EXPIRED` | 410 | The season has ended and is no longer accepting XP or reward claims. Grace period (if configured) may still allow claims. |
| `PROG_016` | `SEASON_NOT_STARTED` | 409 | The season has not yet begun. XP awards and enrollment are blocked until the start date. |
| `PROG_017` | `SEASON_ALREADY_ENROLLED` | 409 | User is already enrolled in this season. Duplicate enrollment is rejected. |
| `PROG_018` | `TRACK_LOCKED` | 403 | The requested track (e.g., premium) has not been unlocked. A purchase or upgrade is required. |
| `PROG_019` | `REWARD_ALREADY_CLAIMED` | 409 | The reward for this tier/track combination has already been claimed by the user. |
| `PROG_020` | `REWARD_TIER_NOT_REACHED` | 409 | The user has not yet reached the tier required to claim this reward. |
| `PROG_021` | `PROGRESSION_TRACK_NOT_FOUND` | 404 | The referenced progression track does not exist for this entity. |
| `PROG_022` | `XP_SOURCE_DISABLED` | 403 | The XP source (e.g., quest, match, daily) has been disabled by configuration or admin action. |
| `PROG_023` | `XP_RATE_LIMITED` | 429 | XP gain from this source has been rate-limited. Metadata includes `retryAfter` and `windowMs`. |
| `PROG_024` | `MULTIPLIER_STACK_OVERFLOW` | 400 | Too many XP multipliers are stacked simultaneously. The maximum concurrent multiplier count is configurable. |
| `PROG_025` | `INVALID_CURVE_FORMULA` | 400 | Custom XP curve formula failed validation. Formulas must be deterministic, non-negative, and monotonically increasing. |
| `PROG_026` | `SNAPSHOT_NOT_FOUND` | 404 | The referenced progression snapshot (used for prestige history or rollback) was not found. |
| `PROG_027` | `MIGRATION_IN_PROGRESS` | 503 | A progression data migration is currently running. Retry after migration completes. |
| `PROG_028` | `CONCURRENT_MODIFICATION` | 409 | Another operation is modifying this entity's progression state. Uses optimistic locking via version column. |
| `PROG_029` | `BULK_OPERATION_PARTIAL_FAILURE` | 207 | A bulk XP award or level sync operation partially failed. Metadata includes per-entity success/failure details. |
| `PROG_030` | `INVALID_PRESTIGE_CONFIG` | 400 | Prestige configuration is invalid. Check retention rules, reward multipliers, and tier definitions. |

### Error Metadata

All progression errors include structured metadata for client-side handling:

```typescript
interface ProgressionErrorMeta {
  // Common fields
  entityId?: string;
  trackId?: string;
  tenantId?: string;

  // XP-related
  currentXp?: string;        // bigint serialized as string
  requiredXp?: string;
  maxXp?: string;
  xpSource?: string;

  // Level-related
  currentLevel?: number;
  maxLevel?: number;
  targetLevel?: number;

  // Skill tree-related
  nodeId?: string;
  treeId?: string;
  missingPrerequisites?: string[];
  currentSkillPoints?: number;
  requiredSkillPoints?: number;

  // Prestige-related
  currentPrestigeTier?: number;
  maxPrestigeTier?: number;
  cooldownExpiresAt?: string;  // ISO 8601

  // Season-related
  seasonId?: string;
  seasonEndsAt?: string;       // ISO 8601
  currentTier?: number;
  requiredTier?: number;
  track?: 'free' | 'premium';

  // Rate limiting
  retryAfter?: number;         // milliseconds
  windowMs?: number;
  currentCount?: number;
  maxCount?: number;
}
```


---

## Security

### Access Control Matrix

The progression module enforces role-based access control at the tRPC router level, with additional RLS policies at the database layer for defense in depth.

| Operation | User (Self) | User (Other) | Admin | Game Designer | System/Service |
|-----------|:-----------:|:------------:|:-----:|:-------------:|:--------------:|
| View own progression | Ã¢Å“â€¦ | Ã¢â‚¬â€ | Ã¢Å“â€¦ | Ã¢Å“â€¦ | Ã¢Å“â€¦ |
| View other's progression | Ã¢ÂÅ’ | Ã¢ÂÅ’ | Ã¢Å“â€¦ | Ã¢Å“â€¦ (read-only) | Ã¢Å“â€¦ |
| Earn XP (via gameplay) | Ã¢Å“â€¦ | Ã¢â‚¬â€ | Ã¢â‚¬â€ | Ã¢â‚¬â€ | Ã¢Å“â€¦ |
| Award XP manually | Ã¢ÂÅ’ | Ã¢ÂÅ’ | Ã¢Å“â€¦ | Ã¢ÂÅ’ | Ã¢Å“â€¦ |
| Deduct/reset XP | Ã¢ÂÅ’ | Ã¢ÂÅ’ | Ã¢Å“â€¦ | Ã¢ÂÅ’ | Ã¢Å“â€¦ |
| Unlock skill node | Ã¢Å“â€¦ | Ã¢â‚¬â€ | Ã¢Å“â€¦ | Ã¢ÂÅ’ | Ã¢Å“â€¦ |
| Reset skill tree | Ã¢Å“â€¦ | Ã¢â‚¬â€ | Ã¢Å“â€¦ | Ã¢ÂÅ’ | Ã¢Å“â€¦ |
| Trigger prestige | Ã¢Å“â€¦ | Ã¢â‚¬â€ | Ã¢Å“â€¦ | Ã¢ÂÅ’ | Ã¢Å“â€¦ |
| Configure XP curves | Ã¢ÂÅ’ | Ã¢ÂÅ’ | Ã¢Å“â€¦ | Ã¢Å“â€¦ | Ã¢ÂÅ’ |
| Configure skill trees | Ã¢ÂÅ’ | Ã¢ÂÅ’ | Ã¢Å“â€¦ | Ã¢Å“â€¦ | Ã¢ÂÅ’ |
| Create/edit seasons | Ã¢ÂÅ’ | Ã¢ÂÅ’ | Ã¢Å“â€¦ | Ã¢Å“â€¦ | Ã¢ÂÅ’ |
| Enroll in season | Ã¢Å“â€¦ | Ã¢â‚¬â€ | Ã¢Å“â€¦ | Ã¢ÂÅ’ | Ã¢Å“â€¦ |
| Claim season rewards | Ã¢Å“â€¦ | Ã¢â‚¬â€ | Ã¢Å“â€¦ | Ã¢ÂÅ’ | Ã¢Å“â€¦ |
| Upgrade to premium track | Ã¢Å“â€¦ | Ã¢â‚¬â€ | Ã¢Å“â€¦ | Ã¢ÂÅ’ | Ã¢Å“â€¦ |
| View analytics/reports | Ã¢ÂÅ’ | Ã¢ÂÅ’ | Ã¢Å“â€¦ | Ã¢Å“â€¦ | Ã¢Å“â€¦ |
| Export progression data | Ã¢Å“â€¦ (own) | Ã¢ÂÅ’ | Ã¢Å“â€¦ | Ã¢ÂÅ’ | Ã¢Å“â€¦ |
| Bulk operations | Ã¢ÂÅ’ | Ã¢ÂÅ’ | Ã¢Å“â€¦ | Ã¢ÂÅ’ | Ã¢Å“â€¦ |
| Configure prestige rules | Ã¢ÂÅ’ | Ã¢ÂÅ’ | Ã¢Å“â€¦ | Ã¢Å“â€¦ | Ã¢ÂÅ’ |

### XP Manipulation Prevention

```typescript
// All XP operations go through a validated pipeline
const xpPipeline = {
  // 1. Source validation Ã¢â‚¬â€ only whitelisted sources can award XP
  validateSource: (source: string) => {
    const allowedSources = config.get('progression.xp.allowedSources');
    if (!allowedSources.includes(source)) {
      throw new McvError('PROG_022', { xpSource: source });
    }
  },

  // 2. Amount bounds checking Ã¢â‚¬â€ prevent overflow and unreasonable values
  validateAmount: (amount: bigint) => {
    if (amount <= 0n) throw new McvError('PROG_001', { amount: amount.toString() });
    const maxSingleAward = config.get('progression.xp.maxSingleAward');
    if (amount > maxSingleAward) {
      throw new McvError('PROG_001', {
        amount: amount.toString(),
        max: maxSingleAward.toString(),
        reason: 'exceeds_single_award_limit',
      });
    }
  },

  // 3. Rate limiting Ã¢â‚¬â€ per-source, per-user limits
  checkRateLimit: async (userId: string, source: string) => {
    const key = `xp_rate:${userId}:${source}`;
    const window = config.get(`progression.xp.rateLimit.${source}.windowMs`);
    const max = config.get(`progression.xp.rateLimit.${source}.maxCount`);
    const current = await rateLimiter.check(key, window);
    if (current >= max) {
      throw new McvError('PROG_023', { retryAfter: window, windowMs: window, currentCount: current, maxCount: max });
    }
  },

  // 4. Multiplier cap Ã¢â‚¬â€ prevent exponential stacking exploits
  validateMultipliers: (multipliers: XpMultiplier[]) => {
    const maxStack = config.get('progression.xp.maxMultiplierStack');
    if (multipliers.length > maxStack) {
      throw new McvError('PROG_024', { count: multipliers.length, max: maxStack });
    }
    const totalMultiplier = multipliers.reduce((acc, m) => acc * m.value, 1.0);
    const maxTotal = config.get('progression.xp.maxTotalMultiplier');
    if (totalMultiplier > maxTotal) {
      throw new McvError('PROG_024', { totalMultiplier, maxTotal });
    }
  },

  // 5. Idempotency Ã¢â‚¬â€ prevent duplicate XP awards from retries
  ensureIdempotent: async (idempotencyKey: string) => {
    const exists = await cache.get(`xp_idem:${idempotencyKey}`);
    if (exists) return { duplicate: true, originalResult: JSON.parse(exists) };
    return { duplicate: false };
  },
};
```

### Skill Tree Integrity

- **DAG Validation**: All skill tree configurations are validated as directed acyclic graphs at creation/update time. Cycles are rejected with `PROG_010`.
- **Prerequisite Chain Verification**: Before unlocking a node, the full prerequisite chain is traversed and verified against the user's unlocked nodes.
- **Version Locking**: Skill trees use version numbers. When a tree is updated, existing user progress is preserved against the version they started with. Migration paths handle version transitions.
- **Atomic Transactions**: Skill point deduction and node unlock happen in a single database transaction. If either fails, the entire operation rolls back.

### Row-Level Security (RLS)

```sql
-- Progression state: users can only read/write their own records
CREATE POLICY progression_state_tenant_isolation ON progression.entity_state
  USING (tenant_id = current_setting('app.tenant_id')::uuid)
  WITH CHECK (tenant_id = current_setting('app.tenant_id')::uuid);

CREATE POLICY progression_state_user_read ON progression.entity_state
  FOR SELECT USING (
    entity_id = current_setting('app.user_id')::uuid
    OR current_setting('app.role') IN ('admin', 'game_designer', 'service')
  );

CREATE POLICY progression_state_user_write ON progression.entity_state
  FOR ALL USING (
    entity_id = current_setting('app.user_id')::uuid
    OR current_setting('app.role') IN ('admin', 'service')
  );

-- Skill tree unlocks: users can only read/modify their own
CREATE POLICY skill_unlocks_isolation ON progression.skill_unlocks
  USING (tenant_id = current_setting('app.tenant_id')::uuid)
  WITH CHECK (tenant_id = current_setting('app.tenant_id')::uuid);

CREATE POLICY skill_unlocks_user ON progression.skill_unlocks
  FOR ALL USING (
    user_id = current_setting('app.user_id')::uuid
    OR current_setting('app.role') IN ('admin', 'service')
  );

-- Season enrollments: tenant + user isolation
CREATE POLICY season_enrollment_isolation ON progression.season_enrollments
  USING (tenant_id = current_setting('app.tenant_id')::uuid)
  WITH CHECK (tenant_id = current_setting('app.tenant_id')::uuid);

CREATE POLICY season_enrollment_user ON progression.season_enrollments
  FOR ALL USING (
    user_id = current_setting('app.user_id')::uuid
    OR current_setting('app.role') IN ('admin', 'service')
  );

-- XP ledger: append-only for users, full access for admin/service
CREATE POLICY xp_ledger_tenant ON progression.xp_ledger
  USING (tenant_id = current_setting('app.tenant_id')::uuid);

CREATE POLICY xp_ledger_insert ON progression.xp_ledger
  FOR INSERT WITH CHECK (
    current_setting('app.role') IN ('admin', 'service')
  );

CREATE POLICY xp_ledger_read ON progression.xp_ledger
  FOR SELECT USING (
    entity_id = current_setting('app.user_id')::uuid
    OR current_setting('app.role') IN ('admin', 'game_designer', 'service')
  );
```

### Rate Limiting

| Endpoint Category | Window | Max Requests | Scope |
|-------------------|--------|-------------|-------|
| XP award (per source) | 60s | 10 | Per user, per source |
| XP award (global) | 60s | 30 | Per user |
| Skill unlock | 10s | 5 | Per user |
| Skill tree reset | 300s | 1 | Per user |
| Prestige trigger | 3600s | 1 | Per user |
| Season enroll | 60s | 3 | Per user |
| Reward claim | 10s | 10 | Per user |
| Progression read | 10s | 50 | Per user |
| Admin operations | 60s | 100 | Per admin |
| Bulk operations | 300s | 5 | Per admin |

### Audit Trail

All state-changing operations emit audit events to the `progression.audit_log` table and to the Redpanda `progression.events` topic:

```typescript
interface ProgressionAuditEvent {
  id: string;                    // UUID v7
  tenantId: string;
  entityId: string;
  actorId: string;               // Who performed the action
  actorRole: 'user' | 'admin' | 'game_designer' | 'service';
  action: ProgressionAuditAction;
  resource: 'xp' | 'level' | 'skill_tree' | 'skill_node' | 'prestige' | 'season' | 'track' | 'reward';
  resourceId: string;
  before: Record<string, unknown> | null;  // Previous state snapshot
  after: Record<string, unknown> | null;   // New state snapshot
  metadata: Record<string, unknown>;
  ip?: string;
  userAgent?: string;
  timestamp: Date;
}

type ProgressionAuditAction =
  | 'xp.awarded' | 'xp.deducted' | 'xp.reset'
  | 'level.up' | 'level.set' | 'level.reset'
  | 'skill.unlocked' | 'skill.upgraded' | 'skill.reset' | 'skill_tree.reset'
  | 'prestige.triggered' | 'prestige.config_updated'
  | 'season.created' | 'season.updated' | 'season.ended'
  | 'season.enrolled' | 'season.track_upgraded'
  | 'reward.claimed' | 'reward.granted'
  | 'config.xp_curve_updated' | 'config.skill_tree_updated'
  | 'bulk.xp_awarded' | 'bulk.level_synced';
```


---

## Environment Variables

All environment variables are prefixed with `MCV_PROGRESSION_` and can be overridden per tenant via the configuration service.

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `MCV_PROGRESSION_DEFAULT_MAX_LEVEL` | `number` | `100` | Default maximum level for new progression tracks. Can be overridden per track. |
| `MCV_PROGRESSION_DEFAULT_XP_CURVE_TYPE` | `string` | `exponential` | Default XP curve type: `linear`, `exponential`, `polynomial`, `logarithmic`, `stepped`, `custom`. |
| `MCV_PROGRESSION_DEFAULT_XP_BASE` | `string` | `100` | Default base XP for level 1 (bigint as string). |
| `MCV_PROGRESSION_DEFAULT_XP_GROWTH_RATE` | `number` | `1.15` | Default exponential growth rate for XP curves. |
| `MCV_PROGRESSION_DEFAULT_XP_MULTIPLIER` | `number` | `1.0` | Global default XP multiplier applied to all awards. |
| `MCV_PROGRESSION_MAX_SINGLE_XP_AWARD` | `string` | `1000000` | Maximum XP that can be awarded in a single operation (bigint as string). Anti-exploit safeguard. |
| `MCV_PROGRESSION_MAX_MULTIPLIER_STACK` | `number` | `5` | Maximum number of XP multipliers that can be active simultaneously per entity. |
| `MCV_PROGRESSION_MAX_TOTAL_MULTIPLIER` | `number` | `10.0` | Maximum combined multiplier value. Prevents exponential stacking exploits. |
| `MCV_PROGRESSION_PRESTIGE_MAX_TIER` | `number` | `10` | Default maximum prestige/rebirth tier. |
| `MCV_PROGRESSION_PRESTIGE_COOLDOWN_MS` | `number` | `86400000` | Default cooldown between prestige resets (milliseconds). Default: 24 hours. |
| `MCV_PROGRESSION_PRESTIGE_REQUIRE_MAX_LEVEL` | `boolean` | `true` | Whether prestige requires reaching max level. |
| `MCV_PROGRESSION_PRESTIGE_XP_RETENTION_PCT` | `number` | `0` | Percentage of XP retained after prestige (0Ã¢â‚¬â€œ100). |
| `MCV_PROGRESSION_PRESTIGE_SKILL_RETENTION` | `string` | `none` | Skill retention on prestige: `none`, `partial`, `full`. |
| `MCV_PROGRESSION_SEASON_GRACE_PERIOD_DAYS` | `number` | `7` | Days after season end that rewards can still be claimed. |
| `MCV_PROGRESSION_SEASON_MAX_TIERS` | `number` | `100` | Maximum number of tiers in a season pass. |
| `MCV_PROGRESSION_SEASON_RETROACTIVE_PREMIUM` | `boolean` | `true` | Whether upgrading to premium grants missed premium rewards retroactively. |
| `MCV_PROGRESSION_SKILL_TREE_MAX_NODES` | `number` | `500` | Maximum nodes per skill tree. Performance safeguard. |
| `MCV_PROGRESSION_SKILL_TREE_MAX_DEPTH` | `number` | `20` | Maximum depth of skill tree dependency chains. |
| `MCV_PROGRESSION_SKILL_RESET_COST_TYPE` | `string` | `currency` | Cost type for skill tree resets: `currency`, `item`, `free`, `scaling`. |
| `MCV_PROGRESSION_CACHE_TTL_LEVEL_MS` | `number` | `30000` | Cache TTL for level/XP lookups (milliseconds). Default: 30 seconds. |
| `MCV_PROGRESSION_CACHE_TTL_SKILL_TREE_MS` | `number` | `300000` | Cache TTL for skill tree configurations (milliseconds). Default: 5 minutes. |
| `MCV_PROGRESSION_CACHE_TTL_SEASON_MS` | `number` | `60000` | Cache TTL for season configurations (milliseconds). Default: 1 minute. |
| `MCV_PROGRESSION_CACHE_TTL_LEADERBOARD_MS` | `number` | `15000` | Cache TTL for progression leaderboard queries (milliseconds). Default: 15 seconds. |
| `MCV_PROGRESSION_EVENT_TOPIC` | `string` | `progression.events` | Redpanda topic for progression events. |
| `MCV_PROGRESSION_EVENT_BATCH_SIZE` | `number` | `100` | Maximum events per batch when publishing to Redpanda. |
| `MCV_PROGRESSION_EVENT_FLUSH_INTERVAL_MS` | `number` | `5000` | Interval for flushing batched events (milliseconds). |
| `MCV_PROGRESSION_LEDGER_RETENTION_DAYS` | `number` | `365` | Number of days to retain XP ledger entries before archival. |
| `MCV_PROGRESSION_SNAPSHOT_ON_PRESTIGE` | `boolean` | `true` | Whether to create a full progression snapshot before prestige reset. |
| `MCV_PROGRESSION_ENABLE_ANALYTICS` | `boolean` | `true` | Enable progression analytics event emission for dashboards. |

### Tenant-Level Overrides

All environment variables can be overridden per tenant through the configuration service:

```typescript
// In tenant configuration (stored in fabric)
const tenantProgressionConfig = {
  maxLevel: 200,                    // Override default 100
  xpCurve: {
    type: 'polynomial',
    base: 150n,
    exponent: 2.3,
  },
  prestige: {
    maxTier: 15,
    cooldownMs: 43200000,           // 12 hours instead of 24
    xpRetentionPercent: 10,         // Keep 10% XP on prestige
    skillRetention: 'partial',
  },
  seasons: {
    gracePeriodDays: 14,            // 2 weeks instead of 1
    retroactivePremium: true,
  },
  rateLimits: {
    xpAwardPerMinute: 20,           // Higher limit for this tenant
  },
};
```


---

## Dependencies

### Internal Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `@mcv/kernel` | `workspace:*` | Core infrastructure: DI container, configuration, error handling, logging, event bus, lifecycle management. |
| `@mcv/identity` | `workspace:*` | User identity resolution, authentication context, and user metadata for progression entity mapping. |
| `@mcv/fabric` | `workspace:*` | Multi-tenant context, tenant configuration overrides, tenant-scoped database connections, and RLS session variables. |
| `@mcv/engagement/points` | `workspace:*` | Point balance management used for skill point allocation, prestige currency, and reward distribution. |
| `@mcv/engagement/earn` | `workspace:*` | Earning rule engine that triggers XP awards from gameplay actions (quest completion, match results, daily logins). |
| `@mcv/engagement/achievements` | `workspace:*` | Achievement tracking integration Ã¢â‚¬â€ certain achievements can unlock XP bonuses, skill nodes, or prestige eligibility. |
| `@mcv/engagement/rewards` | `workspace:*` | Reward catalog and fulfillment for season pass rewards, prestige rewards, and skill tree milestone rewards. |
| `@mcv/engagement/leaderboards` | `workspace:*` | Leaderboard integration for level-based rankings, prestige tier rankings, and season XP leaderboards. |
| `@mcv/chronicle` | `workspace:*` | Audit logging and event sourcing infrastructure for progression state change tracking. |
| `@mcv/temporal` | `workspace:*` | Scheduled task management for season lifecycle (start/end), bonus weekends, and cooldown timers. |
| `@mcv/cache` | `workspace:*` | Distributed caching layer (Redis-backed) for progression state, skill trees, and leaderboard data. |

### External Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `bignumber.js` | `^9.1.2` | Arbitrary-precision arithmetic for XP calculations. Prevents overflow in high-level progression with large XP values. |
| `zod` | `^3.23.0` | Runtime schema validation for XP curve configs, skill tree definitions, season configs, and all tRPC inputs. |
| `date-fns` | `^3.6.0` | Date manipulation for season scheduling, cooldown calculations, grace periods, and bonus weekend detection. |
| `date-fns-tz` | `^3.1.0` | Timezone-aware date handling for season start/end times across different tenant timezones. |
| `graphlib` | `^2.1.8` | Graph data structure for skill tree validation (DAG verification, topological sorting, cycle detection). |
| `drizzle-orm` | `^0.33.0` | Type-safe SQL query builder and ORM for all progression database operations. |
| `@paralleldrive/cuid2` | `^2.2.2` | Collision-resistant unique ID generation for progression entities, skill nodes, and season IDs. |
| `ioredis` | `^5.4.0` | Redis client for distributed caching and rate limiting of XP awards. |
| `kafkajs` | `^2.2.4` | Redpanda/Kafka client for publishing progression events and consuming XP award triggers. |
| `superjson` | `^2.2.1` | Serialization layer for bigint values in tRPC responses (bigints are not JSON-native). |
| `lodash-es` | `^4.17.21` | Utility functions: deep cloning skill trees, merging configs, chunking bulk operations. |
| `pino` | `^9.0.0` | Structured logging for progression operations, performance tracing, and error reporting. |

### Peer Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `@supabase/supabase-js` | `^2.45.0` | Supabase client for RLS-aware database access and realtime subscriptions. |
| `@trpc/server` | `^10.45.0` | tRPC server for type-safe API endpoints. |

---

## Testing

### Test Structure

```
src/
Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ __tests__/
Ã¢â€â€š   Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ unit/
Ã¢â€â€š   Ã¢â€â€š   Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ xp-curves.test.ts           # XP curve calculations
Ã¢â€â€š   Ã¢â€â€š   Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ level-calculator.test.ts     # Level-from-XP resolution
Ã¢â€â€š   Ã¢â€â€š   Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ skill-tree-validator.test.ts # DAG validation, cycle detection
Ã¢â€â€š   Ã¢â€â€š   Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ skill-tree-traversal.test.ts # Prerequisite chain walking
Ã¢â€â€š   Ã¢â€â€š   Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ prestige-engine.test.ts      # Prestige conditions and state reset
Ã¢â€â€š   Ã¢â€â€š   Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ season-lifecycle.test.ts     # Season state machine transitions
Ã¢â€â€š   Ã¢â€â€š   Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ xp-pipeline.test.ts          # XP validation, rate limits, multipliers
Ã¢â€â€š   Ã¢â€â€š   Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ multiplier-stack.test.ts     # Multiplier stacking and caps
Ã¢â€â€š   Ã¢â€â€š   Ã¢â€â€Ã¢â€â‚¬Ã¢â€â‚¬ snapshot-manager.test.ts     # Prestige snapshot creation/restoration
Ã¢â€â€š   Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ integration/
Ã¢â€â€š   Ã¢â€â€š   Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ progression-lifecycle.test.ts  # Full XP Ã¢â€ â€™ level Ã¢â€ â€™ prestige cycle
Ã¢â€â€š   Ã¢â€â€š   Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ skill-tree-flow.test.ts        # Unlock Ã¢â€ â€™ upgrade Ã¢â€ â€™ reset flow
Ã¢â€â€š   Ã¢â€â€š   Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ season-pass-flow.test.ts       # Enroll Ã¢â€ â€™ earn Ã¢â€ â€™ claim Ã¢â€ â€™ end
Ã¢â€â€š   Ã¢â€â€š   Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ multi-track.test.ts            # Multiple progression tracks
Ã¢â€â€š   Ã¢â€â€š   Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ rls-policies.test.ts           # Row-level security verification
Ã¢â€â€š   Ã¢â€â€š   Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ event-emission.test.ts         # Redpanda event publishing
Ã¢â€â€š   Ã¢â€â€š   Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ concurrent-access.test.ts      # Optimistic locking under contention
Ã¢â€â€š   Ã¢â€â€š   Ã¢â€â€Ã¢â€â‚¬Ã¢â€â‚¬ tenant-isolation.test.ts       # Cross-tenant data isolation
Ã¢â€â€š   Ã¢â€â€Ã¢â€â‚¬Ã¢â€â‚¬ performance/
Ã¢â€â€š       Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ xp-curve-bench.test.ts         # XP calculation throughput
Ã¢â€â€š       Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ bulk-award-bench.test.ts        # Bulk XP award performance
Ã¢â€â€š       Ã¢â€Å“Ã¢â€â‚¬Ã¢â€â‚¬ skill-tree-large-bench.test.ts  # Large skill tree operations
Ã¢â€â€š       Ã¢â€â€Ã¢â€â‚¬Ã¢â€â‚¬ leaderboard-bench.test.ts       # Progression leaderboard queries
```

### Unit Tests

#### XP Curve Calculations

```typescript
describe('XP Curves', () => {
  describe('exponential curve', () => {
    const curve = createXpCurve({
      type: 'exponential',
      base: 100n,
      growthRate: 1.15,
    });

    it('should calculate correct XP for each level', () => {
      expect(curve.xpForLevel(1)).toBe(100n);
      expect(curve.xpForLevel(2)).toBe(115n);
      expect(curve.xpForLevel(10)).toBe(352n);
      expect(curve.xpForLevel(50)).toBe(8683n);
      expect(curve.xpForLevel(100)).toBe(117390n);
    });

    it('should calculate cumulative XP correctly', () => {
      expect(curve.cumulativeXpForLevel(1)).toBe(100n);
      expect(curve.cumulativeXpForLevel(5)).toBe(674n);
      expect(curve.cumulativeXpForLevel(100)).toBe(2_092_546n);
    });

    it('should resolve level from XP', () => {
      expect(curve.levelFromXp(0n)).toBe(0);
      expect(curve.levelFromXp(99n)).toBe(0);
      expect(curve.levelFromXp(100n)).toBe(1);
      expect(curve.levelFromXp(215n)).toBe(2);
      expect(curve.levelFromXp(2_092_546n)).toBe(100);
    });

    it('should handle bigint edge cases', () => {
      expect(curve.xpForLevel(1)).toBeGreaterThan(0n);
      expect(curve.xpForLevel(200)).toBeGreaterThan(curve.xpForLevel(199));
    });

    it('should be monotonically increasing', () => {
      for (let i = 2; i <= 100; i++) {
        expect(curve.xpForLevel(i)).toBeGreaterThan(curve.xpForLevel(i - 1));
      }
    });
  });

  describe('polynomial curve', () => {
    const curve = createXpCurve({
      type: 'polynomial',
      base: 50n,
      exponent: 2.0,
    });

    it('should follow quadratic growth', () => {
      expect(curve.xpForLevel(1)).toBe(50n);
      expect(curve.xpForLevel(2)).toBe(200n);
      expect(curve.xpForLevel(10)).toBe(5000n);
    });
  });

  describe('stepped curve', () => {
    const curve = createXpCurve({
      type: 'stepped',
      steps: [
        { fromLevel: 1, toLevel: 10, xpPerLevel: 100n },
        { fromLevel: 11, toLevel: 30, xpPerLevel: 500n },
        { fromLevel: 31, toLevel: 50, xpPerLevel: 2000n },
        { fromLevel: 51, toLevel: 100, xpPerLevel: 10000n },
      ],
    });

    it('should use correct step for each level range', () => {
      expect(curve.xpForLevel(5)).toBe(100n);
      expect(curve.xpForLevel(15)).toBe(500n);
      expect(curve.xpForLevel(35)).toBe(2000n);
      expect(curve.xpForLevel(75)).toBe(10000n);
    });
  });
});
```

#### Skill Tree Validation

```typescript
describe('Skill Tree Validator', () => {
  it('should accept valid DAG', () => {
    const tree = createSkillTree({
      nodes: [
        { id: 'root', name: 'Root', prerequisites: [] },
        { id: 'branch-a', name: 'Branch A', prerequisites: ['root'] },
        { id: 'branch-b', name: 'Branch B', prerequisites: ['root'] },
        { id: 'leaf', name: 'Leaf', prerequisites: ['branch-a', 'branch-b'] },
      ],
    });
    expect(validateSkillTree(tree)).toEqual({ valid: true, errors: [] });
  });

  it('should detect cycles', () => {
    const tree = createSkillTree({
      nodes: [
        { id: 'a', name: 'A', prerequisites: ['c'] },
        { id: 'b', name: 'B', prerequisites: ['a'] },
        { id: 'c', name: 'C', prerequisites: ['b'] },
      ],
    });
    const result = validateSkillTree(tree);
    expect(result.valid).toBe(false);
    expect(result.errors).toContainEqual(
      expect.objectContaining({ code: 'CYCLE_DETECTED' })
    );
  });

  it('should detect orphaned nodes', () => {
    const tree = createSkillTree({
      nodes: [
        { id: 'root', name: 'Root', prerequisites: [] },
        { id: 'orphan', name: 'Orphan', prerequisites: ['nonexistent'] },
      ],
    });
    const result = validateSkillTree(tree);
    expect(result.valid).toBe(false);
    expect(result.errors).toContainEqual(
      expect.objectContaining({ code: 'MISSING_PREREQUISITE', nodeId: 'orphan' })
    );
  });

  it('should enforce max depth', () => {
    // Create a chain of 25 nodes (exceeds max depth of 20)
    const nodes = Array.from({ length: 25 }, (_, i) => ({
      id: `node-${i}`,
      name: `Node ${i}`,
      prerequisites: i > 0 ? [`node-${i - 1}`] : [],
    }));
    const tree = createSkillTree({ nodes, maxDepth: 20 });
    const result = validateSkillTree(tree);
    expect(result.valid).toBe(false);
    expect(result.errors).toContainEqual(
      expect.objectContaining({ code: 'MAX_DEPTH_EXCEEDED' })
    );
  });
});
```

#### Prestige Engine

```typescript
describe('Prestige Engine', () => {
  it('should validate prestige conditions', async () => {
    const engine = createPrestigeEngine({
      requireMaxLevel: true,
      maxLevel: 100,
      cooldownMs: 86400000,
      maxTier: 10,
    });

    // Not at max level
    const result1 = await engine.canPrestige({
      currentLevel: 50,
      currentPrestigeTier: 0,
      lastPrestigeAt: null,
    });
    expect(result1.eligible).toBe(false);
    expect(result1.reason).toBe('level_requirement');

    // At max level, no cooldown
    const result2 = await engine.canPrestige({
      currentLevel: 100,
      currentPrestigeTier: 0,
      lastPrestigeAt: null,
    });
    expect(result2.eligible).toBe(true);
  });

  it('should apply prestige reset correctly', async () => {
    const engine = createPrestigeEngine({
      requireMaxLevel: true,
      maxLevel: 100,
      xpRetentionPercent: 10,
      skillRetention: 'none',
    });

    const result = await engine.applyPrestige({
      currentXp: 2_092_546n,
      currentLevel: 100,
      currentPrestigeTier: 0,
      skills: ['skill-a', 'skill-b', 'skill-c'],
    });

    expect(result.newLevel).toBe(0);
    expect(result.newXp).toBe(209_254n); // 10% retention
    expect(result.newPrestigeTier).toBe(1);
    expect(result.retainedSkills).toEqual([]); // none retention
    expect(result.snapshot).toBeDefined(); // Pre-prestige snapshot saved
  });

  it('should enforce cooldown', async () => {
    const engine = createPrestigeEngine({ cooldownMs: 86400000 });
    const result = await engine.canPrestige({
      currentLevel: 100,
      currentPrestigeTier: 1,
      lastPrestigeAt: new Date(Date.now() - 3600000), // 1 hour ago
    });
    expect(result.eligible).toBe(false);
    expect(result.reason).toBe('cooldown_active');
  });
});
```

### Integration Tests

#### Full Progression Lifecycle

```typescript
describe('Progression Lifecycle (Integration)', () => {
  let ctx: TestContext;
  let service: ProgressionService;

  beforeEach(async () => {
    ctx = await createTestContext({ tenant: true, user: true });
    service = ctx.container.resolve(ProgressionService);
  });

  it('should handle full XP Ã¢â€ â€™ level Ã¢â€ â€™ prestige Ã¢â€ â€™ season cycle', async () => {
    // 1. Create progression track
    const track = await service.createTrack(ctx, {
      name: 'Player Level',
      maxLevel: 10,
      xpCurve: { type: 'linear', base: 100n, increment: 50n },
    });

    // 2. Award XP and verify level-ups
    let state = await service.awardXp(ctx, {
      entityId: ctx.userId,
      trackId: track.id,
      amount: 350n,
      source: 'test',
    });
    expect(state.level).toBe(3);

    // 3. Continue to max level
    state = await service.awardXp(ctx, {
      entityId: ctx.userId,
      trackId: track.id,
      amount: 50000n,
      source: 'test',
    });
    expect(state.level).toBe(10);

    // 4. Verify max level cap
    await expect(service.awardXp(ctx, {
      entityId: ctx.userId,
      trackId: track.id,
      amount: 1000n,
      source: 'test',
    })).rejects.toThrow('PROG_002');

    // 5. Trigger prestige
    const prestige = await service.triggerPrestige(ctx, {
      entityId: ctx.userId,
      trackId: track.id,
    });
    expect(prestige.newPrestigeTier).toBe(1);
    expect(prestige.newLevel).toBe(0);

    // 6. Verify XP can be earned again
    state = await service.awardXp(ctx, {
      entityId: ctx.userId,
      trackId: track.id,
      amount: 200n,
      source: 'test',
    });
    expect(state.level).toBe(2);
    expect(state.prestigeTier).toBe(1);
  });

  it('should enforce RLS isolation between tenants', async () => {
    const ctx1 = await createTestContext({ tenant: 'tenant-1', user: 'user-1' });
    const ctx2 = await createTestContext({ tenant: 'tenant-2', user: 'user-2' });

    const track1 = await service.createTrack(ctx1, {
      name: 'Track A', maxLevel: 50,
      xpCurve: { type: 'linear', base: 100n, increment: 100n },
    });

    // Tenant 2 should not see Tenant 1's tracks
    const tracks = await service.listTracks(ctx2);
    expect(tracks.find(t => t.id === track1.id)).toBeUndefined();

    // Tenant 2 should not be able to award XP on Tenant 1's track
    await expect(service.awardXp(ctx2, {
      entityId: 'user-2',
      trackId: track1.id,
      amount: 100n,
      source: 'test',
    })).rejects.toThrow('PROG_021');
  });

  it('should handle concurrent XP awards with optimistic locking', async () => {
    const track = await service.createTrack(ctx, {
      name: 'Concurrent Test', maxLevel: 100,
      xpCurve: { type: 'linear', base: 100n, increment: 0n },
    });

    // Fire 10 concurrent XP awards
    const promises = Array.from({ length: 10 }, () =>
      service.awardXp(ctx, {
        entityId: ctx.userId,
        trackId: track.id,
        amount: 100n,
        source: 'test',
      })
    );

    const results = await Promise.allSettled(promises);
    const successes = results.filter(r => r.status === 'fulfilled');
    const failures = results.filter(r => r.status === 'rejected');

    // All should eventually succeed (with retries) or fail gracefully
    expect(successes.length + failures.length).toBe(10);

    // Final state should be consistent
    const finalState = await service.getState(ctx, {
      entityId: ctx.userId,
      trackId: track.id,
    });
    expect(finalState.totalXp).toBe(BigInt(successes.length) * 100n);
  });
});
```

### Performance Benchmarks

```typescript
describe('Performance Benchmarks', () => {
  it('XP curve calculation: 10,000 levels in < 50ms', () => {
    const curve = createXpCurve({ type: 'exponential', base: 100n, growthRate: 1.1 });
    const start = performance.now();
    for (let i = 1; i <= 10000; i++) {
      curve.xpForLevel(i);
    }
    const elapsed = performance.now() - start;
    expect(elapsed).toBeLessThan(50);
  });

  it('Level-from-XP resolution: 10,000 lookups in < 100ms', () => {
    const curve = createXpCurve({ type: 'exponential', base: 100n, growthRate: 1.1 });
    const start = performance.now();
    for (let i = 0; i < 10000; i++) {
      curve.levelFromXp(BigInt(i * 1000));
    }
    const elapsed = performance.now() - start;
    expect(elapsed).toBeLessThan(100);
  });

  it('Skill tree validation: 500-node DAG in < 200ms', () => {
    const nodes = generateLargeSkillTree(500);
    const tree = createSkillTree({ nodes });
    const start = performance.now();
    validateSkillTree(tree);
    const elapsed = performance.now() - start;
    expect(elapsed).toBeLessThan(200);
  });

  it('Bulk XP award: 1,000 entities in < 2s', async () => {
    const entities = Array.from({ length: 1000 }, (_, i) => ({
      entityId: `entity-${i}`,
      amount: 500n,
    }));
    const start = performance.now();
    await service.bulkAwardXp(ctx, {
      trackId: track.id,
      awards: entities,
      source: 'benchmark',
    });
    const elapsed = performance.now() - start;
    expect(elapsed).toBeLessThan(2000);
  });
});
```

### Coverage Targets

| Category | Target | Enforcement |
|----------|--------|-------------|
| **Statements** | Ã¢â€°Â¥ 90% | CI gate (fail build below threshold) |
| **Branches** | Ã¢â€°Â¥ 85% | CI gate |
| **Functions** | Ã¢â€°Â¥ 90% | CI gate |
| **Lines** | Ã¢â€°Â¥ 90% | CI gate |
| **Integration** | Ã¢â€°Â¥ 80% | CI gate |
| **Critical Paths** | 100% | Code review requirement |

Critical paths requiring 100% coverage:
- XP award pipeline (validation Ã¢â€ â€™ rate limit Ã¢â€ â€™ multiplier Ã¢â€ â€™ persist Ã¢â€ â€™ event)
- Level-up detection and event emission
- Skill tree prerequisite checking
- Prestige state reset and snapshot
- Season reward claiming
- RLS policy enforcement
- Concurrent modification handling

