# @mcv/task-sdk

Epic / Story / Task / Checkpoint types + Zod schemas for the MCV task
pipeline. Powers the NAOS-driven build flywheel across every venture app.

## Usage

```ts
import {
  EpicRow,
  StoryRow,
  CheckpointRow,
  EPIC_COLUMN_ORDER,
  computeEpicProgress,
  CreateEpicSchema,
  ClaimStorySchema,
} from '@mcv/task-sdk';

// Validate NAOS agent tool input
const parsed = CreateEpicSchema.parse(toolInput);

// Optimistic UI
const pct = computeEpicProgress(stories);
```

## Status ladders

```
Epic:   draft → proposed → approved → in-progress → review → done
        (blocked / cancelled are off-ladder)

Story:  todo → in-progress → review → done
        (blocked / cancelled are off-ladder)

Checkpoint: pending / awaiting-review → approved | rejected | skipped
```

## Multi-session coordination

`StoryRow.kit_invocations` carries `SessionClaimInvocation` /
`SessionReleaseInvocation` entries appended by the `claim_story` /
`release_story` API actions, letting parallel Claude Code sessions
reserve work without colliding.
