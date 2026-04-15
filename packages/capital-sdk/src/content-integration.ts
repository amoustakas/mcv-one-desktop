// @mcv/capital-sdk/content-integration — bridge between capital_* tables and
// the Content OS `content` table via capital_round_content junction.
//
// Capital SDK doesn't hard-depend on Content OS — we just speak its schema.
// Callers pass a Supabase client; we read/write content + junction rows directly.

import type { SupabaseClient } from '@supabase/supabase-js';

export type RoundContentRole =
  | 'description'
  | 'announcement'
  | 'update'
  | 'term_sheet'
  | 'om'
  | 'pitch_deck_notes'
  | 'safe_template'
  | 'subscription_template'
  | 'other';

export type CapitalContentType =
  | 'capital_round_description'
  | 'capital_investor_update'
  | 'capital_term_sheet'
  | 'capital_safe_agreement'
  | 'capital_subscription_agreement'
  | 'capital_om'
  | 'capital_pitch_deck_notes'
  | 'capital_announcement'
  | 'capital_commitment_receipt';

export type ContentVisibility = 'private' | 'internal' | 'published' | 'public';
export type ContentStatus = 'draft' | 'in-review' | 'approved' | 'executed' | 'archived';

export interface CapitalContentRow {
  id: string;
  ventureId: string | null;
  contentType: string;
  subtype: string | null;
  title: string;
  slug: string | null;
  bodyMarkdown: string | null;
  excerpt: string | null;
  status: ContentStatus;
  visibility: ContentVisibility;
  scheduledFor: string | null;
  publishedAt: string | null;
  categories: string[];
  tags: string[];
  seo: Record<string, unknown>;
  coverMediaId: string | null;
  author: string | null;
  createdAt: string;
  updatedAt: string;
  meta: Record<string, unknown>;
}

export interface RoundContentLink {
  roundId: string;
  contentId: string;
  role: RoundContentRole;
  isPrimary: boolean;
  ordinal: number;
  createdAt: string;
}

export interface RoundContentEntry extends RoundContentLink {
  content: CapitalContentRow;
}

function mapContentRow(row: Record<string, unknown>): CapitalContentRow {
  return {
    id: row.id as string,
    ventureId: (row.venture_id as string) ?? null,
    contentType: row.content_type as string,
    subtype: (row.subtype as string) ?? null,
    title: row.title as string,
    slug: (row.slug as string) ?? null,
    bodyMarkdown: (row.body_markdown as string) ?? null,
    excerpt: (row.excerpt as string) ?? null,
    status: row.status as ContentStatus,
    visibility: row.visibility as ContentVisibility,
    scheduledFor: (row.scheduled_for as string) ?? null,
    publishedAt: (row.published_at as string) ?? null,
    categories: Array.isArray(row.categories) ? (row.categories as string[]) : [],
    tags: Array.isArray(row.tags) ? (row.tags as string[]) : [],
    seo: (row.seo as Record<string, unknown>) ?? {},
    coverMediaId: (row.cover_media_id as string) ?? null,
    author: (row.author as string) ?? null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
    meta: (row.meta as Record<string, unknown>) ?? {},
  };
}

function mapLinkRow(row: Record<string, unknown>): RoundContentLink {
  return {
    roundId: row.round_id as string,
    contentId: row.content_id as string,
    role: row.role as RoundContentRole,
    isPrimary: Boolean(row.is_primary),
    ordinal: Number(row.ordinal ?? 0),
    createdAt: row.created_at as string,
  };
}

export interface CreateRoundContentInput {
  ventureId: string;
  roundId: string;
  role: RoundContentRole;
  contentType: CapitalContentType;
  title: string;
  bodyMarkdown?: string;
  excerpt?: string;
  visibility?: ContentVisibility;
  status?: ContentStatus;
  isPrimary?: boolean;
  ordinal?: number;
  tags?: string[];
  categories?: string[];
  seo?: Record<string, unknown>;
  author?: string;
  scheduledFor?: string;
  publishImmediately?: boolean;
}

export interface ContentIntegrationService {
  /** Create a new content row and link it to a round in one call. */
  createRoundContent(input: CreateRoundContentInput): Promise<RoundContentEntry>;
  /** List content linked to a round, optionally filtered by role. */
  listRoundContent(roundId: string, opts?: { role?: RoundContentRole; visibilityMin?: ContentVisibility }): Promise<RoundContentEntry[]>;
  /** Attach an existing content row to a round. */
  attachContent(roundId: string, contentId: string, role: RoundContentRole, opts?: { isPrimary?: boolean; ordinal?: number }): Promise<RoundContentLink>;
  /** Detach a content row from a round. */
  detachContent(roundId: string, contentId: string, role: RoundContentRole): Promise<void>;
  /** Convenience: fetch the primary description content for a round (for Launchpad rendering). */
  getRoundDescription(roundId: string): Promise<CapitalContentRow | null>;
  /** Convenience: list investor updates for a round ordered by published_at desc. */
  listRoundUpdates(roundId: string, opts?: { includeDrafts?: boolean; limit?: number }): Promise<RoundContentEntry[]>;
  /** Publish an investor update now (sets visibility, stamps published_at). */
  publishUpdate(contentId: string, visibility?: ContentVisibility): Promise<CapitalContentRow>;
}

export interface ContentIntegrationServiceOptions {
  supabase: SupabaseClient | null;
}

// Visibility hierarchy for filtering (higher includes lower on the "more-public" axis).
const VISIBILITY_MIN_ORDER: Record<ContentVisibility, number> = {
  private: 0,
  internal: 1,
  published: 2,
  public: 3,
};

export function createContentIntegrationService({ supabase }: ContentIntegrationServiceOptions): ContentIntegrationService {
  return {
    async createRoundContent(input) {
      if (!supabase) throw new Error('Supabase client not available');
      const nowIso = new Date().toISOString();
      const shouldPublishNow = input.publishImmediately && !input.scheduledFor;
      const contentRow = {
        venture_id: input.ventureId,
        content_type: input.contentType,
        title: input.title,
        body_markdown: input.bodyMarkdown ?? null,
        excerpt: input.excerpt ?? null,
        status: input.status ?? 'draft',
        visibility: input.visibility ?? (shouldPublishNow ? 'internal' : 'private'),
        scheduled_for: input.scheduledFor ?? null,
        published_at: shouldPublishNow ? nowIso : null,
        categories: input.categories ?? [],
        tags: [...(input.tags ?? []), 'capital', `capital:${input.role}`],
        seo: input.seo ?? {},
        author: input.author ?? null,
        source: 'capital-sdk',
        generated_by_kit: 'capital-ops',
      };
      const { data: content, error: contentErr } = await supabase
        .from('content')
        .insert(contentRow)
        .select()
        .single();
      if (contentErr) throw new Error(`Failed to create content: ${contentErr.message}`);

      const linkRow = {
        round_id: input.roundId,
        content_id: content.id,
        role: input.role,
        is_primary: input.isPrimary ?? false,
        ordinal: input.ordinal ?? 0,
      };
      const { data: link, error: linkErr } = await supabase
        .from('capital_round_content')
        .insert(linkRow)
        .select()
        .single();
      if (linkErr) throw new Error(`Failed to link round content: ${linkErr.message}`);

      return { ...mapLinkRow(link), content: mapContentRow(content) };
    },

    async listRoundContent(roundId, opts) {
      if (!supabase) return [];
      let q = supabase
        .from('capital_round_content')
        .select('*, content:content_id(*)')
        .eq('round_id', roundId)
        .order('is_primary', { ascending: false })
        .order('ordinal', { ascending: true });
      if (opts?.role) q = q.eq('role', opts.role);
      const { data, error } = await q;
      if (error) throw new Error(`Failed to list round content: ${error.message}`);

      const minOrder = opts?.visibilityMin ? VISIBILITY_MIN_ORDER[opts.visibilityMin] : null;
      const entries: RoundContentEntry[] = [];
      for (const row of (data ?? []) as Array<Record<string, unknown> & { content: Record<string, unknown> }>) {
        if (!row.content) continue;
        const content = mapContentRow(row.content);
        if (minOrder !== null && VISIBILITY_MIN_ORDER[content.visibility] < minOrder) continue;
        entries.push({ ...mapLinkRow(row), content });
      }
      return entries;
    },

    async attachContent(roundId, contentId, role, opts) {
      if (!supabase) throw new Error('Supabase client not available');
      const row = {
        round_id: roundId,
        content_id: contentId,
        role,
        is_primary: opts?.isPrimary ?? false,
        ordinal: opts?.ordinal ?? 0,
      };
      const { data, error } = await supabase
        .from('capital_round_content')
        .insert(row)
        .select()
        .single();
      if (error) throw new Error(`Failed to attach content: ${error.message}`);
      return mapLinkRow(data);
    },

    async detachContent(roundId, contentId, role) {
      if (!supabase) throw new Error('Supabase client not available');
      const { error } = await supabase
        .from('capital_round_content')
        .delete()
        .eq('round_id', roundId)
        .eq('content_id', contentId)
        .eq('role', role);
      if (error) throw new Error(`Failed to detach content: ${error.message}`);
    },

    async getRoundDescription(roundId) {
      if (!supabase) return null;
      const { data, error } = await supabase
        .from('capital_round_content')
        .select('*, content:content_id(*)')
        .eq('round_id', roundId)
        .eq('role', 'description')
        .eq('is_primary', true)
        .maybeSingle();
      if (error) throw new Error(`Failed to get round description: ${error.message}`);
      if (!data?.content) return null;
      return mapContentRow(data.content as Record<string, unknown>);
    },

    async listRoundUpdates(roundId, opts) {
      if (!supabase) return [];
      const limit = opts?.limit ?? 50;
      let q = supabase
        .from('capital_round_content')
        .select('*, content:content_id(*)')
        .eq('round_id', roundId)
        .eq('role', 'update')
        .limit(limit);
      const { data, error } = await q;
      if (error) throw new Error(`Failed to list updates: ${error.message}`);

      const entries: RoundContentEntry[] = [];
      for (const row of (data ?? []) as Array<Record<string, unknown> & { content: Record<string, unknown> }>) {
        if (!row.content) continue;
        const content = mapContentRow(row.content);
        if (!opts?.includeDrafts && content.status === 'draft') continue;
        entries.push({ ...mapLinkRow(row), content });
      }
      entries.sort((a, b) => {
        const aT = a.content.publishedAt ?? a.content.createdAt;
        const bT = b.content.publishedAt ?? b.content.createdAt;
        return bT.localeCompare(aT);
      });
      return entries;
    },

    async publishUpdate(contentId, visibility = 'internal') {
      if (!supabase) throw new Error('Supabase client not available');
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from('content')
        .update({ visibility, published_at: now, status: 'approved', updated_at: now })
        .eq('id', contentId)
        .select()
        .single();
      if (error) throw new Error(`Failed to publish update: ${error.message}`);
      return mapContentRow(data);
    },
  };
}
