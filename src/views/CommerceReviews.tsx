// @ts-nocheck
// src/views/CommerceReviews.tsx
// Review moderation view — Shop Management

import { useEffect } from 'react';
import { Star, CheckCircle, XCircle, MessageSquare, ShieldCheck } from 'lucide-react';
import { useCommerceSurfaceStore } from '../stores/commerce-surface';
import { useNavigation } from '../stores/navigation';
import type { Review } from '../lib/commerce/surface-types';
import { PageShell, PageHeader, StatCard, GlassCard } from '../components/ui';
import { useToast } from '../components/Toasts';

function StarRating({ rating }: { rating: number }) {
  return (
    <div style={{ display: 'flex', gap: '2px' }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          size={12}
          style={{
            color: n <= rating ? '#F59E0B' : 'rgba(255,255,255,0.1)',
            fill: n <= rating ? '#F59E0B' : 'none',
          }}
        />
      ))}
    </div>
  );
}

function ReviewCard({ review, onApprove, onReject }: { review: Review; onApprove: () => void; onReject: () => void }) {
  return (
    <div className="rev-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <StarRating rating={review.rating} />
            {review.verifiedPurchase && (
              <span className="rev-verified">
                <ShieldCheck size={10} /> Verified
              </span>
            )}
          </div>
          <p style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '2px' }}>
            {review.title || 'No title'}
          </p>
          <p style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
            {review.customerId ? `Customer ${review.customerId.slice(-6)}` : 'Anonymous'} •{' '}
            {review.productId ? `Product ${review.productId.slice(-6)}` : ''} •{' '}
            {new Date(review.createdAt).toLocaleDateString()}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '6px' }}>
          <button className="rev-action-btn rev-action-btn--approve" onClick={onApprove} title="Approve">
            <CheckCircle size={14} />
          </button>
          <button className="rev-action-btn rev-action-btn--reject" onClick={onReject} title="Reject">
            <XCircle size={14} />
          </button>
        </div>
      </div>
      <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.5', margin: 0 }}>
        {review.body || 'No review body'}
      </p>
      {review.status === 'flagged' && (
        <div style={{ marginTop: '8px', padding: '4px 8px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '4px', fontSize: '10px', color: '#EF4444' }}>
          Flagged for review
        </div>
      )}
    </div>
  );
}

export default function CommerceReviews() {
  const { reviews, moderationQueue, reviewsLoading, fetchReviews, fetchModerationQueue, moderateReview } = useCommerceSurfaceStore();
  const { activeVenture } = useNavigation();
  const ventureId = activeVenture || 'mcv';
  const { toast } = useToast();

  const handleModerate = async (id: string, decision: 'approve' | 'reject') => {
    const ok = await moderateReview(ventureId, id, decision);
    if (ok) {
      toast(decision === 'approve' ? 'success' : 'info', decision === 'approve' ? 'Review approved' : 'Review rejected');
    } else {
      toast('error', 'Moderation failed — check server logs');
    }
  };

  useEffect(() => {
    fetchModerationQueue(ventureId);
    fetchReviews(ventureId, undefined, 'approved');
  }, [ventureId, fetchModerationQueue, fetchReviews]);

  const totalReviews = reviews.length;
  const avgRating = reviews.length
    ? (reviews.reduce((s: number, r: Review) => s + r.rating, 0) / reviews.length).toFixed(1)
    : '—';
  const pendingCount = moderationQueue.filter((r: Review) => r.status === 'pending').length;
  const flaggedCount = moderationQueue.filter((r: Review) => r.status === 'flagged').length;

  // Rating distribution from approved reviews
  const ratingDist = [5, 4, 3, 2, 1].map((r) => ({
    stars: r,
    count: reviews.filter((rev: Review) => rev.rating === r).length,
  }));
  const maxCount = Math.max(...ratingDist.map((d) => d.count), 1);

  return (
    <PageShell scroll>
      <PageHeader title="Reviews" subtitle="Review moderation and product ratings" loading={reviewsLoading} />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '12px', marginBottom: '20px' }}>
        <StatCard label="Total Reviews" value={String(totalReviews)} icon={<Star size={16} />} accent="cyan" />
        <StatCard label="Avg Rating" value={String(avgRating)} icon={<Star size={16} />} accent="purple" />
        <StatCard label="Pending" value={String(pendingCount)} icon={<MessageSquare size={16} />} accent="warning" />
        <StatCard label="Flagged" value={String(flaggedCount)} icon={<XCircle size={16} />} accent="warning" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: '16px', alignItems: 'start' }}>
        <div>
          {/* Moderation queue */}
          {moderationQueue.length > 0 && (
            <GlassCard style={{ marginBottom: '16px' }}>
              <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(0,245,255,0.07)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <MessageSquare size={14} style={{ color: '#F59E0B' }} />
                <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', color: '#F59E0B' }}>
                  Moderation Queue ({moderationQueue.length})
                </span>
              </div>
              <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {moderationQueue.map((review: Review) => (
                  <ReviewCard
                    key={review.id}
                    review={review}
                    onApprove={() => handleModerate(review.id, 'approve')}
                    onReject={() => handleModerate(review.id, 'reject')}
                  />
                ))}
              </div>
            </GlassCard>
          )}

          {/* Approved reviews */}
          <GlassCard>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(0,245,255,0.07)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckCircle size={14} style={{ color: '#10B981' }} />
              <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', color: '#10B981' }}>
                Published Reviews ({reviews.length})
              </span>
            </div>
            <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {reviews.length === 0 && (
                <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                  {reviewsLoading ? 'Loading...' : 'No published reviews yet'}
                </div>
              )}
              {reviews.slice(0, 20).map((review: Review) => (
                <ReviewCard
                  key={review.id}
                  review={review}
                  onApprove={() => { }}
                  onReject={() => { }}
                />
              ))}
            </div>
          </GlassCard>
        </div>

        {/* Rating summary sidebar */}
        <GlassCard>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(0,245,255,0.07)' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--text-muted)' }}>
              Rating Summary
            </span>
          </div>
          <div style={{ padding: '16px' }}>
            <div style={{ textAlign: 'center', marginBottom: '16px' }}>
              <p style={{ fontSize: '36px', fontWeight: 800, color: 'var(--color-cyan)', fontFamily: 'var(--font-mono)', lineHeight: 1 }}>
                {avgRating}
              </p>
              <div style={{ display: 'flex', justifyContent: 'center', marginTop: '6px' }}>
                <StarRating rating={Math.round(parseFloat(avgRating as string) || 0)} />
              </div>
              <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                {totalReviews} review{totalReviews !== 1 ? 's' : ''}
              </p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {ratingDist.map(({ stars, count }) => (
                <div key={stars} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', width: '16px', textAlign: 'right' }}>{stars}</span>
                  <Star size={10} style={{ color: '#F59E0B', fill: '#F59E0B', flexShrink: 0 }} />
                  <div style={{ flex: 1, height: '5px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{
                      height: '100%', width: `${(count / maxCount) * 100}%`,
                      background: '#F59E0B', borderRadius: '3px', transition: 'width 0.4s ease',
                    }} />
                  </div>
                  <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', width: '24px', textAlign: 'right' }}>
                    {count}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </GlassCard>
      </div>

      <style>{`
        .rev-card {
          padding: 12px 14px; border-radius: 8px;
          background: rgba(0,0,0,0.15); border: 1px solid rgba(255,255,255,0.05);
          transition: border-color 0.12s;
        }
        .rev-card:hover { border-color: rgba(0,245,255,0.1); }
        .rev-verified {
          display: flex; align-items: center; gap: 3px;
          font-size: 9px; font-weight: 700; padding: 1px 6px; border-radius: 4px;
          background: rgba(16,185,129,0.1); color: #10B981; border: 1px solid rgba(16,185,129,0.25);
          text-transform: uppercase; letter-spacing: 0.3px;
        }
        .rev-action-btn {
          display: flex; align-items: center; justify-content: center;
          width: 28px; height: 28px; border-radius: 6px;
          background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08);
          cursor: pointer; transition: all 0.12s;
        }
        .rev-action-btn--approve { color: #10B981; }
        .rev-action-btn--approve:hover { background: rgba(16,185,129,0.12); border-color: rgba(16,185,129,0.3); }
        .rev-action-btn--reject { color: #EF4444; }
        .rev-action-btn--reject:hover { background: rgba(239,68,68,0.12); border-color: rgba(239,68,68,0.3); }
      `}</style>
    </PageShell>
  );
}
