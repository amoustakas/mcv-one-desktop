// @mcv/commerce-sdk/review-service — customer reviews, ratings, moderation.
//
// 11 methods behind createReviewService({ supabase }). Notable shape:
//   - createReview auto-flags isVerifiedPurchase by probing order_items
//     for a matching customer/product pair — a closed-over helper handles
//     this so the check isn't part of the exposed interface.
//   - approveReview triggers recalculateProductRating so product_ratings
//     stays in sync.
//   - reportReview auto-flags the review after >3 reports.

import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  Review,
  ProductRating,
  ReviewStatus,
  CreateReviewInput,
} from './surface-types';

// ─── Row mappers ────────────────────────────────────────────────────────

function mapReviewRow(row: Record<string, unknown>): Review {
  const parseStringArray = (value: unknown): string[] => {
    if (Array.isArray(value)) return value as string[];
    if (typeof value === 'string') {
      try { return JSON.parse(value) as string[]; } catch { return []; }
    }
    return [];
  };

  return {
    id: row.id as string,
    ventureId: row.venture_id as string,
    productId: row.product_id as string,
    customerId: row.customer_id as string,
    orderId: (row.order_id as string) ?? null,
    rating: Number(row.rating),
    title: row.title as string,
    body: row.body as string,
    pros: parseStringArray(row.pros),
    cons: parseStringArray(row.cons),
    images: parseStringArray(row.images),
    isVerifiedPurchase: (row.is_verified_purchase as boolean) ?? false,
    status: row.status as ReviewStatus,
    helpfulCount: Number(row.helpful_count ?? 0),
    reportCount: Number(row.report_count ?? 0),
    vendorResponse: (row.vendor_response as string) ?? null,
    respondedAt: (row.responded_at as string) ?? null,
    createdAt: row.created_at as string,
  };
}

function mapRatingRow(row: Record<string, unknown>): ProductRating {
  const parseJson = <T>(value: unknown): T => {
    if (value === null || value === undefined) return {} as T;
    if (typeof value === 'object') return value as T;
    if (typeof value === 'string') {
      try { return JSON.parse(value) as T; } catch { return {} as T; }
    }
    return {} as T;
  };

  return {
    productId: row.product_id as string,
    averageRating: Number(row.average_rating ?? 0),
    totalReviews: Number(row.total_reviews ?? 0),
    distribution: parseJson<{ [stars: number]: number }>(row.distribution),
  };
}

// ─── Engine interface ──────────────────────────────────────────────────

export interface ReviewService {
  createReview(input: CreateReviewInput): Promise<Review>;
  approveReview(reviewId: string): Promise<Review>;
  rejectReview(reviewId: string): Promise<Review>;
  flagReview(reviewId: string): Promise<Review>;
  respondToReview(reviewId: string, vendorResponse: string): Promise<Review>;
  listReviews(productId: string, status?: ReviewStatus, limit?: number, offset?: number): Promise<Review[]>;
  getProductRating(productId: string): Promise<ProductRating | null>;
  markHelpful(reviewId: string): Promise<Review>;
  reportReview(reviewId: string): Promise<Review>;
  getModerationQueue(ventureId: string): Promise<Review[]>;
  recalculateProductRating(productId: string): Promise<ProductRating>;
}

export interface ReviewServiceOptions {
  supabase: SupabaseClient | null;
}

// ─── Factory ───────────────────────────────────────────────────────────

export function createReviewService({ supabase }: ReviewServiceOptions): ReviewService {
  // Closed-over: probe order_items to confirm the customer purchased the
  // product. Used by createReview to stamp the verified-purchase badge.
  async function checkVerifiedPurchase(customerId: string, productId: string): Promise<boolean> {
    if (!supabase) return false;

    const { data, error } = await supabase
      .from('order_items')
      .select('id, orders!inner(customer_id)')
      .eq('product_id', productId)
      .eq('orders.customer_id', customerId)
      .limit(1);

    if (error) return false;
    return (data ?? []).length > 0;
  }

  const service: ReviewService = {
    async recalculateProductRating(productId) {
      if (!supabase) throw new Error('Supabase client not available');

      const { data: reviews, error } = await supabase
        .from('reviews')
        .select('rating')
        .eq('product_id', productId)
        .eq('status', 'approved');

      if (error) throw new Error(`Failed to fetch reviews for rating: ${error.message}`);

      const ratingList = (reviews ?? []).map((r: Record<string, unknown>) => Number(r.rating));
      const totalReviews = ratingList.length;
      const averageRating = totalReviews > 0
        ? ratingList.reduce((sum, r) => sum + r, 0) / totalReviews
        : 0;

      const distribution: { [stars: number]: number } = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      for (const r of ratingList) {
        const key = Math.min(5, Math.max(1, Math.round(r)));
        distribution[key] = (distribution[key] ?? 0) + 1;
      }

      const ratingRow = {
        product_id: productId,
        average_rating: Math.round(averageRating * 100) / 100,
        total_reviews: totalReviews,
        distribution,
        updated_at: new Date().toISOString(),
      };

      const { data: upserted, error: upsertError } = await supabase
        .from('product_ratings')
        .upsert(ratingRow, { onConflict: 'product_id' })
        .select()
        .single();

      if (upsertError) throw new Error(`Failed to upsert product rating: ${upsertError.message}`);
      return mapRatingRow(upserted);
    },

    async createReview(input) {
      if (!supabase) throw new Error('Supabase client not available');

      const isVerifiedPurchase = await checkVerifiedPurchase(input.customerId, input.productId);

      const { data, error } = await supabase
        .from('reviews')
        .insert({
          venture_id: input.ventureId,
          product_id: input.productId,
          customer_id: input.customerId,
          order_id: input.orderId,
          rating: input.rating,
          title: input.title,
          body: input.body,
          pros: input.pros ?? [],
          cons: input.cons ?? [],
          images: input.images ?? [],
          is_verified_purchase: isVerifiedPurchase,
          status: 'pending',
          helpful_count: 0,
          report_count: 0,
        })
        .select()
        .single();

      if (error) throw new Error(`Failed to create review: ${error.message}`);
      return mapReviewRow(data);
    },

    async approveReview(reviewId) {
      if (!supabase) throw new Error('Supabase client not available');

      const { data, error } = await supabase
        .from('reviews')
        .update({ status: 'approved' })
        .eq('id', reviewId)
        .select()
        .single();

      if (error) throw new Error(`Failed to approve review: ${error.message}`);
      const review = mapReviewRow(data);

      // Cascades: keep product_ratings aggregate in sync.
      await service.recalculateProductRating(review.productId);

      return review;
    },

    async rejectReview(reviewId) {
      if (!supabase) throw new Error('Supabase client not available');

      const { data, error } = await supabase
        .from('reviews')
        .update({ status: 'rejected' })
        .eq('id', reviewId)
        .select()
        .single();

      if (error) throw new Error(`Failed to reject review: ${error.message}`);
      return mapReviewRow(data);
    },

    async flagReview(reviewId) {
      if (!supabase) throw new Error('Supabase client not available');

      const { data, error } = await supabase
        .from('reviews')
        .update({ status: 'flagged' })
        .eq('id', reviewId)
        .select()
        .single();

      if (error) throw new Error(`Failed to flag review: ${error.message}`);
      return mapReviewRow(data);
    },

    async respondToReview(reviewId, vendorResponse) {
      if (!supabase) throw new Error('Supabase client not available');

      const { data, error } = await supabase
        .from('reviews')
        .update({
          vendor_response: vendorResponse,
          responded_at: new Date().toISOString(),
        })
        .eq('id', reviewId)
        .select()
        .single();

      if (error) throw new Error(`Failed to add vendor response: ${error.message}`);
      return mapReviewRow(data);
    },

    async listReviews(productId, status, limit = 50, offset = 0) {
      if (!supabase) return [];

      let query = supabase
        .from('reviews')
        .select()
        .eq('product_id', productId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (status) query = query.eq('status', status);

      const { data, error } = await query;
      if (error) throw new Error(`Failed to list reviews: ${error.message}`);
      return (data ?? []).map(mapReviewRow);
    },

    async getProductRating(productId) {
      if (!supabase) return null;

      const { data, error } = await supabase
        .from('product_ratings')
        .select()
        .eq('product_id', productId)
        .single();

      if (error?.code === 'PGRST116') return null;
      if (error) throw new Error(`Failed to get product rating: ${error.message}`);
      return mapRatingRow(data);
    },

    async markHelpful(reviewId) {
      if (!supabase) throw new Error('Supabase client not available');

      const { data: current, error: fetchError } = await supabase
        .from('reviews')
        .select('helpful_count')
        .eq('id', reviewId)
        .single();

      if (fetchError || !current) throw new Error('Review not found');

      const { data, error } = await supabase
        .from('reviews')
        .update({ helpful_count: Number(current.helpful_count ?? 0) + 1 })
        .eq('id', reviewId)
        .select()
        .single();

      if (error) throw new Error(`Failed to mark review helpful: ${error.message}`);
      return mapReviewRow(data);
    },

    async reportReview(reviewId) {
      if (!supabase) throw new Error('Supabase client not available');

      const { data: current, error: fetchError } = await supabase
        .from('reviews')
        .select('report_count, status')
        .eq('id', reviewId)
        .single();

      if (fetchError || !current) throw new Error('Review not found');

      const newReportCount = Number(current.report_count ?? 0) + 1;
      // Auto-flag threshold: >3 community reports mark as flagged.
      const newStatus = newReportCount > 3 ? 'flagged' : (current.status as string);

      const { data, error } = await supabase
        .from('reviews')
        .update({ report_count: newReportCount, status: newStatus })
        .eq('id', reviewId)
        .select()
        .single();

      if (error) throw new Error(`Failed to report review: ${error.message}`);
      return mapReviewRow(data);
    },

    async getModerationQueue(ventureId) {
      if (!supabase) return [];

      const { data, error } = await supabase
        .from('reviews')
        .select()
        .eq('venture_id', ventureId)
        .in('status', ['pending', 'flagged'])
        .order('created_at', { ascending: true });

      if (error) throw new Error(`Failed to get moderation queue: ${error.message}`);
      return (data ?? []).map(mapReviewRow);
    },
  };

  return service;
}
