// Thin shim — canonical implementation lives in @mcv/commerce-sdk/review-service.
import { createReviewService } from '@mcv/commerce-sdk/review-service';
import { supabase } from '../supabase';

const service = createReviewService({ supabase });

export const createReview = service.createReview;
export const approveReview = service.approveReview;
export const rejectReview = service.rejectReview;
export const flagReview = service.flagReview;
export const respondToReview = service.respondToReview;
export const listReviews = service.listReviews;
export const getProductRating = service.getProductRating;
export const markHelpful = service.markHelpful;
export const reportReview = service.reportReview;
export const getModerationQueue = service.getModerationQueue;
export const recalculateProductRating = service.recalculateProductRating;

export type { ReviewService } from '@mcv/commerce-sdk/review-service';
