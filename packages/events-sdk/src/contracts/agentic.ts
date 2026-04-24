// packages/events-sdk/src/contracts/agentic.ts
//
// Agentic OS emissions — Layer 4 (Draft Inbox) lifecycle events.
//
// Topics mirror what api/_handlers/agentic.ts publishes on each transition:
// draft created (on seed / agent), approved, rejected, edited. Subscribers
// land in M3/M4 workflow code — for the Waterloo demo, the EventStreamView
// is the only subscriber and renders them live.

import { z } from 'zod';
import type { ContractDeclaration } from '../types.js';

const DraftType = z.enum([
  'nda',
  'ip_filing',
  'domain_acquisition',
  'contract_redline',
  'investor_update',
  'counsel_engagement_letter',
  'entity_formation',
]);

const DraftCore = z.object({
  draftId: z.string().uuid(),
  draftType: DraftType,
  title: z.string(),
  emitterAgent: z.string(),
  targetVenture: z.string().nullable(),
});

export const AgenticContract: ContractDeclaration<'agentic'> = {
  module: 'agentic',
  version: '1.0',

  emits: [
    {
      topic: 'agentic.draft.created',
      schemaVersion: '1.0',
      payload: DraftCore.extend({ summary: z.string() }),
      description:
        'Agent drafted a document (NDA, filing, redline, etc.) and parked it in the inbox for human review.',
    },
    {
      topic: 'agentic.draft.approved',
      schemaVersion: '1.0',
      payload: DraftCore.extend({
        decidedBy: z.string(),
        notes: z.string().nullable(),
      }),
      description:
        'Human approved the draft. Downstream systems should act on it — counter-sign, file, wire, etc.',
    },
    {
      topic: 'agentic.draft.rejected',
      schemaVersion: '1.0',
      payload: DraftCore.extend({
        decidedBy: z.string(),
        reason: z.string().nullable(),
      }),
      description:
        'Human rejected the draft. Reason (when provided) should feed back into the agent for next attempt.',
    },
    {
      topic: 'agentic.draft.edited',
      schemaVersion: '1.0',
      payload: DraftCore.extend({
        decidedBy: z.string(),
        bodyPreview: z.string(),
      }),
      description:
        'Human edited the draft and approved it in place. bodyPreview is the first ~240 chars of the edited body.',
    },
  ],

  subscribes: [],
};
