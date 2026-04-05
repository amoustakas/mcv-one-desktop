/**
 * MCV One Desktop — Approval Hook Definition
 *
 * Used for HITL (Human-in-the-Loop) approval gates.
 * Workflows pause at these hooks until a human approves/rejects.
 */

import { defineHook } from 'workflow';
import { z } from 'zod';

/** Generic approval hook — used for deploy, budget, and destructive actions */
export const approvalHook = defineHook({
  schema: z.object({
    approved: z.boolean(),
    comment: z.string().optional(),
    approvedBy: z.string().optional(),
  }),
});

/** Deploy approval — requires explicit confirmation before production deploys */
export const deployApprovalHook = defineHook({
  schema: z.object({
    approved: z.boolean(),
    environment: z.enum(['preview', 'production']),
    comment: z.string().optional(),
  }),
});

/** Budget approval — for campaign/spend decisions above threshold */
export const budgetApprovalHook = defineHook({
  schema: z.object({
    approved: z.boolean(),
    adjustedAmount: z.number().optional(),
    comment: z.string().optional(),
  }),
});
