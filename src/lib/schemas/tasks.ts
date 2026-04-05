import { z } from 'zod';

export const taskSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  status: z.string(),
  priority: z.string(),
  venture_id: z.string(),
  assignee: z.string(),
  due_date: z.string(),
  tags: z.array(z.string()),
  created_at: z.string(),
});
export type Task = z.infer<typeof taskSchema>;

export const taskStatsSchema = z.object({
  total: z.number(),
  byStatus: z.record(z.string(), z.number()),
  byPriority: z.record(z.string(), z.number()),
});
export type TaskStats = z.infer<typeof taskStatsSchema>;
