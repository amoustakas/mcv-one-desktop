import { z } from 'zod';

export const docMetadataSchema = z.object({
  source: z.string().optional(),
  path: z.string().optional(),
  notionId: z.string().optional(),
}).passthrough();
export type DocMetadata = z.infer<typeof docMetadataSchema>;

export const documentSchema = z.object({
  id: z.string(),
  title: z.string(),
  content: z.string().optional(),
  doc_type: z.string(),
  venture_id: z.string(),
  tags: z.array(z.string()).optional(),
  metadata: docMetadataSchema.optional(),
  source_url: z.string().optional(),
  created_at: z.string(),
  updated_at: z.string(),
});
export type Document = z.infer<typeof documentSchema>;
