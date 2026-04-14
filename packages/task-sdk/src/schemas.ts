// @mcv/task-sdk/schemas — Zod schemas for runtime validation.
//
// Use these for API boundaries, form validation, and agent tool input
// validation before handoff to the epic pipeline.

import { z } from 'zod';

export const EpicStatusSchema = z.enum([
  'draft', 'proposed', 'approved', 'in-progress',
  'blocked', 'review', 'done', 'cancelled',
]);

export const EpicPrioritySchema = z.enum(['critical', 'high', 'medium', 'low']);

export const StoryStatusSchema = z.enum([
  'todo', 'in-progress', 'review', 'blocked', 'done', 'cancelled',
]);

export const CheckpointTypeSchema = z.enum([
  'spec-review', 'design-review', 'pre-commit', 'pre-merge',
  'pre-deploy', 'post-deploy', 'custom',
]);

export const CheckpointStateSchema = z.enum([
  'pending', 'awaiting-review', 'approved', 'rejected', 'skipped',
]);

export const CreateEpicSchema = z.object({
  title: z.string().min(1),
  summary: z.string().optional(),
  spec_md: z.string().optional(),
  venture_id: z.string().optional(),
  suite: z.string().optional(),
  owner_agent: z.string().uuid().optional(),
  status: EpicStatusSchema.default('draft'),
  priority: EpicPrioritySchema.default('medium'),
  tags: z.array(z.string()).default([]),
});
export type CreateEpicInput = z.infer<typeof CreateEpicSchema>;

export const CreateStorySchema = z.object({
  epic_id: z.string().uuid(),
  title: z.string().min(1),
  description: z.string().optional(),
  acceptance_criteria: z.array(z.string()).default([]),
  assigned_agent: z.string().uuid().optional(),
  status: StoryStatusSchema.default('todo'),
  priority_order: z.number().default(100),
  estimated_effort: z.string().optional(),
});
export type CreateStoryInput = z.infer<typeof CreateStorySchema>;

export const DecomposeSchema = z.object({
  epic_id: z.string().uuid(),
  stories: z.array(CreateStorySchema.omit({ epic_id: true })).min(1),
});
export type DecomposeInput = z.infer<typeof DecomposeSchema>;

export const RequestCheckpointSchema = z.object({
  epic_id: z.string().uuid(),
  checkpoint_type: CheckpointTypeSchema,
  title: z.string().min(1),
  description: z.string().optional(),
  required_approvers: z.array(z.string()).default(['tony']),
  payload: z.record(z.string(), z.unknown()).default({}),
});
export type RequestCheckpointInput = z.infer<typeof RequestCheckpointSchema>;

export const ResolveCheckpointSchema = z.object({
  id: z.string().uuid(),
  state: z.enum(['approved', 'rejected', 'skipped']),
  decision_notes: z.string().optional(),
  approver: z.string().optional(),
});
export type ResolveCheckpointInput = z.infer<typeof ResolveCheckpointSchema>;

export const ClaimStorySchema = z.object({
  story_id: z.string().uuid(),
  session_id: z.string().min(1),
  note: z.string().optional(),
});
export type ClaimStoryInput = z.infer<typeof ClaimStorySchema>;

export const ReleaseStorySchema = z.object({
  id: z.string().uuid(),
  session_id: z.string().min(1),
  reset_status: z.boolean().default(true),
});
export type ReleaseStoryInput = z.infer<typeof ReleaseStorySchema>;
