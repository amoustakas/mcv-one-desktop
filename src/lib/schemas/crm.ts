import { z } from 'zod';

// ── Contacts ──
export const contactSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  phone: z.string(),
  company: z.string(),
  role: z.string(),
  type: z.string(),
  status: z.string(),
  venture_id: z.string(),
  notes: z.string(),
  tags: z.array(z.string()),
  linkedin_url: z.string(),
  twitter_url: z.string(),
  last_contacted: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
  account_id: z.string(),
  lead_score: z.number(),
  engagement_score: z.number(),
  source: z.string(),
  lifecycle_stage: z.string(),
  title: z.string(),
  // JSONB bag on the DB side. Known consumers stash things like
  // prospect_id (onboarding → CRM bridge), completion_journey_id (reverse
  // link to the journey that created the contact), and track (which onboarding
  // track). Keep the type open so new fields don't require a schema bump.
  metadata: z.record(z.string(), z.unknown()).optional(),
});
export type Contact = z.infer<typeof contactSchema>;

// ── Accounts ──
export const accountSchema = z.object({
  id: z.string(),
  name: z.string(),
  domain: z.string(),
  industry: z.string(),
  size: z.string(),
  revenue: z.string(),
  description: z.string(),
  website: z.string(),
  type: z.string(),
  status: z.string(),
  health_score: z.number(),
  venture_id: z.string(),
  tags: z.array(z.string()),
  created_at: z.string(),
  updated_at: z.string(),
});
export type Account = z.infer<typeof accountSchema>;

// ── Deals ──
export const dealSchema = z.object({
  id: z.string(),
  title: z.string(),
  value: z.number(),
  stage: z.string(),
  venture_id: z.string(),
  contact_id: z.string(),
  contacts: z.object({ name: z.string(), company: z.string() }).nullable(),
  probability: z.number(),
  expected_close: z.string(),
  notes: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
});
export type Deal = z.infer<typeof dealSchema>;

// ── Activities ──
export const activitySchema = z.object({
  id: z.string(),
  type: z.string(),
  title: z.string(),
  description: z.string(),
  contact_id: z.string(),
  deal_id: z.string(),
  venture_id: z.string(),
  contacts: z.object({ name: z.string() }).nullable(),
  created_at: z.string(),
});
export type Activity = z.infer<typeof activitySchema>;

// ── Pipeline ──
export const pipelineStageSchema = z.object({
  stage: z.string(),
  count: z.number(),
  totalValue: z.number(),
  weightedValue: z.number(),
});
export type PipelineStage = z.infer<typeof pipelineStageSchema>;
