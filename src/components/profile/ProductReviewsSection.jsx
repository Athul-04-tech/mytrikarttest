import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Star, MessageSquarePlus, CheckCircle2, AlertCircle, ChevronDown, ChevronUp, Send, Loader2 } from 'lucide-react';
import { apiRequest } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';

// ── Star Rating Input ─────────────────────────────────────────────────────────
function StarInput({ value, onChange, disabled = false }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex items-center space-x-1" role="group" aria-label="Star rating">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={disabled}
          onClick={() => !disabled && onChange(star)}
          onMouseEnter={() => !disabled && setHovered(star)}
          onMouseLeave={() => !disabled && setHovered(0)}
          className={`transition-transform ${disabled ? 'cursor-default' : 'cursor-pointer hover:scale-125'}`}
          aria-label={`${star} star${star !== 1 ? 's' : ''}`}
        >
          <Star
            className={`w-7 h-7 transition-colors ${
              star <= (hovered || value)
                ? 'text-[#FF811A] fill-[#FF811A]'
                : 'text-[#EAE3DC] fill-[#EAE3DC]'
            }`}
          />
        </button>
      ))}
    </div>
  );
}

// ── Single Review Card ────────────────────────────────────────────────────────
function ReviewCard({ review }) {
  const [expanded, setExpanded] = useState(false);
  const isLong = (review.comment || '').length > 220;
  const displayComment = isLong && !expanded
    ? review.comment.slice(0, 220) + '…'
    : review.comment;

  return (
    <div className="p-4 sm:p-5 bg-white border border-[#EAE3DC] rounded-2xl space-y-3 hover:border-[#FF811A]/40 transition-colors shadow-2xs">
      {/* Header row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#FA661C] to-[#FF811A] flex items-center justify-center text-white font-black text-sm shrink-0">
            {review.reviewer_name ? review.reviewer_name.charAt(0).toUpperCase() : 'C'}
          </div>
          <div>
            <p className="text-xs font-extrabold text-[#1A2420]">
              {review.reviewer_name || 'Verified Customer'}
            </p>
            {review.is_verified_purchase && (
              <span className="inline-flex items-center space-x-1 text-[10px] font-bold text-[#FA661C]">
                <CheckCircle2 className="w-3 h-3" />
                <span>Verified Purchase</span>
              </span>
            )}
          </div>
        </div>

        {/* Star rating */}
        <div className="flex items-center space-x-0.5 shrink-0">
          {[1, 2, 3, 4, 5].map((s) => (
            <Star
              key={s}
              className={`w-3.5 h-3.5 ${s <= review.rating ? 'text-[#FF811A] fill-[#FF811A]' : 'text-[#EAE3DC] fill-[#EAE3DC]'}`}
            />
          ))}
        </div>
      </div>

      {/* Title */}
      {review.title && (
        <p className="text-sm font-bold text-[#FA661C]">{review.title}</p>
      )}

      {/* Comment */}
      {review.comment && (
        <div>
          <p className="text-xs text-[#6B6058] leading-relaxed">{displayComment}</p>
          {isLong && (
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className="mt-1 text-[10px] font-bold text-[#FA661C] flex items-center space-x-0.5 hover:underline cursor-pointer"
            >
              {expanded ? (
                <><ChevronUp className="w-3 h-3" /><span>Show less</span></>
              ) : (
                <><ChevronDown className="w-3 h-3" /><span>Read more</span></>
              )}
            </button>
          )}
        </div>
      )}

      {/* Date */}
      <p className="text-[10px] text-[#6B6058]/60">
        {review.created_at
          ? new Date(review.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
          : ''}
      </p>
    </div>
  );
}

// ── Rating Distribution Bar ───────────────────────────────────────────────────
function RatingBar({ star, count, total }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="flex items-center space-x-2 text-[11px]">
      <span className="w-8 text-right font-bold text-[#6B6058]">{star}★</span>
      <div className="flex-1 bg-[#EAE3DC] rounded-full h-1.5 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-[#FA661C] to-[#FF811A] rounded-full transition-all duration-700"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="w-8 font-semibold text-[#6B6058]">{pct}%</span>
    </div>
  );
}

// ── Main Export ───────────────────────────────────────────────────────────────
export default function ProductReviewsSection({ productId, averageRating, reviewCount }) {
  const { isLoggedIn } = useAuth();

  const [reviews, setReviews] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [reviewsError, setReviewsError] = useState('');

  // Write-review form state
  const [formOpen, setFormOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const fetchReviews = useCallback(async () => {
    setLoadingReviews(true);
    setReviewsError('');
    try {
      // Canonical public endpoint (paginated, 20/page). Walk every page so the
      // star distribution reflects ALL published reviews, matching the backend aggregate.
      let path = `/api/products/${productId}/reviews/`;
      const all = [];
      while (path) {
        const data = await apiRequest(path, { skipAuth: true });
        if (Array.isArray(data)) { all.push(...data); break; }
        all.push(...(data?.results || []));
        if (data?.next) {
          const u = new URL(data.next, window.location.origin);
          path = u.pathname + u.search;
        } else {
          path = null;
        }
      }
      setReviews(all);
    } catch (err) {
      setReviewsError(err?.message || 'Could not load reviews.');
    } finally {
      setLoadingReviews(false);
    }
  }, [productId]);

  useEffect(() => {
    if (productId) fetchReviews();
  }, [productId, fetchReviews]);

  // Rating distribution calculation
  const distribution = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => r.rating === star).length,
  }));

  const computedAvg = reviews.length > 0
    ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
    : null;
  const displayAvg = averageRating ? Number(averageRating).toFixed(1) : computedAvg;

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (rating === 0) {
      setSubmitError('Please select a star rating before submitting.');
      return;
    }
    setSubmitting(true);
    setSubmitError('');
    try {
      await apiRequest('/api/customers/reviews/', {
        method: 'POST',
        body: JSON.stringify({ product: productId, rating, title: title.trim(), comment: comment.trim() }),
      });
      setSubmitSuccess(true);
      setFormOpen(false);
      setRating(0);
      setTitle('');
      setComment('');
    } catch (err) {
      const errData = err?.data;
      const msg =
        (errData && (errData.detail || errData.non_field_errors?.[0] || Object.values(errData)[0])) ||
        err?.message ||
        'Failed to submit review. Please try again.';
      setSubmitError(Array.isArray(msg) ? msg[0] : String(msg));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section
      id="product-reviews"
      className="bg-white rounded-3xl border border-[#EAE3DC] p-6 sm:p-8 shadow-xs space-y-8"
      aria-labelledby="reviews-heading"
    >
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#EAE3DC]">
        <div>
          <h2
            id="reviews-heading"
            className="font-['Outfit'] text-2xl sm:text-3xl font-extrabold text-[#FA661C] tracking-tight"
          >
            Customer Reviews
          </h2>
          <p className="text-xs text-[#6B6058] mt-1">
            {reviewCount > 0
              ? `${reviewCount} verified purchase review${reviewCount !== 1 ? 's' : ''}`
              : 'Be the first to share your experience'}
          </p>
        </div>

        {/* Write Review CTA */}
        {isLoggedIn ? (
          !submitSuccess && (
            <button
              type="button"
              id="write-review-btn"
              onClick={() => setFormOpen((v) => !v)}
              className="flex items-center space-x-2 px-4 py-2 bg-[#FA661C] hover:bg-[#E0530B] text-white rounded-xl text-xs font-extrabold shadow-xs btn-interactive transition-all cursor-pointer shrink-0"
            >
              <MessageSquarePlus className="w-4 h-4" />
              <span>{formOpen ? 'Cancel Review' : 'Write a Review'}</span>
            </button>
          )
        ) : (
          <Link
            to="/login"
            className="flex items-center space-x-2 px-4 py-2 border border-[#FA661C] text-[#FA661C] hover:bg-[#FFF8F2] rounded-xl text-xs font-extrabold transition-all cursor-pointer shrink-0"
          >
            <MessageSquarePlus className="w-4 h-4" />
            <span>Sign in to Write a Review</span>
          </Link>
        )}
      </div>

      {/* Success Banner */}
      {submitSuccess && (
        <div className="flex items-start space-x-3 p-4 bg-[#F0FFF7] border border-green-300 rounded-2xl text-sm text-green-800 animate-reveal">
          <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-extrabold">Review Submitted Successfully!</p>
            <p className="text-xs mt-0.5 text-green-700">
              Your review is pending moderation and will appear here once approved. Thank you for sharing your experience!
            </p>
          </div>
        </div>
      )}

      {/* Write Review Form */}
      {formOpen && !submitSuccess && (
        <form
          id="write-review-form"
          onSubmit={handleSubmitReview}
          className="bg-[#FFF8F2] border border-[#FF811A]/30 rounded-2xl p-5 sm:p-6 space-y-5 animate-dropdown"
        >
          <h3 className="font-['Outfit'] font-extrabold text-base text-[#FA661C] flex items-center space-x-2">
            <MessageSquarePlus className="w-4 h-4" />
            <span>Share Your Experience</span>
          </h3>

          {/* Star Rating Picker */}
          <div className="space-y-1.5">
            <label className="text-xs font-extrabold text-[#FA661C] uppercase tracking-wider block">
              Overall Rating <span className="text-[#D7263D]">*</span>
            </label>
            <StarInput value={rating} onChange={setRating} disabled={submitting} />
            {rating > 0 && (
              <p className="text-[11px] text-[#6B6058]">
                {['', 'Poor — Not what I expected', 'Fair — Has some issues', 'Good — Satisfied overall', 'Very Good — Highly pleased', 'Excellent — Absolutely love it!'][rating]}
              </p>
            )}
          </div>

          {/* Title */}
          <div className="space-y-1.5">
            <label htmlFor="review-title" className="text-xs font-extrabold text-[#FA661C] uppercase tracking-wider block">
              Review Title
            </label>
            <input
              id="review-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={submitting}
              maxLength={120}
              placeholder="Summarise your experience in a few words…"
              className="w-full px-4 py-2.5 bg-white border border-[#EAE3DC] rounded-xl text-sm text-[#1A2420] placeholder-[#6B6058]/50 focus:outline-none focus:border-[#FF811A] focus:ring-2 focus:ring-[#FF811A]/20 transition-all disabled:opacity-60"
            />
          </div>

          {/* Comment */}
          <div className="space-y-1.5">
            <label htmlFor="review-comment" className="text-xs font-extrabold text-[#FA661C] uppercase tracking-wider block">
              Detailed Review
            </label>
            <textarea
              id="review-comment"
              rows={4}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              disabled={submitting}
              maxLength={2000}
              placeholder="What did you like or dislike? How was the quality, delivery, and overall experience?"
              className="w-full px-4 py-2.5 bg-white border border-[#EAE3DC] rounded-xl text-sm text-[#1A2420] placeholder-[#6B6058]/50 focus:outline-none focus:border-[#FF811A] focus:ring-2 focus:ring-[#FF811A]/20 transition-all resize-none disabled:opacity-60"
            />
            <p className="text-[10px] text-right text-[#6B6058]">{comment.length} / 2000</p>
          </div>

          {/* Error */}
          {submitError && (
            <div className="flex items-start space-x-2 p-3 bg-[#FDE8EA] border border-[#D7263D]/30 rounded-xl text-xs text-[#D7263D]">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{submitError}</span>
            </div>
          )}

          {/* Eligibility Note */}
          <p className="text-[11px] text-[#6B6058] bg-white border border-[#EAE3DC] rounded-xl p-3 leading-relaxed">
            <strong className="text-[#FA661C]">Note:</strong> Only customers with a completed, paid &amp; delivered order of this product may submit a review. Submissions without a verified purchase are automatically rejected.
          </p>

          {/* Submit Button */}
          <button
            type="submit"
            id="submit-review-btn"
            disabled={submitting || rating === 0}
            className="flex items-center space-x-2 px-5 py-2.5 bg-[#FA661C] hover:bg-[#E0530B] disabled:bg-[#6B6058]/40 text-white rounded-xl text-xs font-extrabold shadow-xs btn-interactive transition-all cursor-pointer disabled:cursor-not-allowed"
          >
            {submitting ? (
              <><Loader2 className="w-4 h-4 animate-spin" /><span>Submitting…</span></>
            ) : (
              <><Send className="w-4 h-4" /><span>Submit Review</span></>
            )}
          </button>
        </form>
      )}

      {/* Rating Summary + Distribution */}
      {reviews.length > 0 && (
        <div className="flex flex-col sm:flex-row gap-6 pb-6 border-b border-[#EAE3DC]">
          {/* Big average score */}
          <div className="flex flex-col items-center justify-center min-w-[100px] space-y-1">
            <span className="font-['Outfit'] text-5xl font-black text-[#FA661C]">
              {displayAvg || '—'}
            </span>
            <div className="flex items-center space-x-0.5">
              {[1, 2, 3, 4, 5].map((s) => {
                const avg = Number(displayAvg || 0);
                return (
                  <Star
                    key={s}
                    className={`w-4 h-4 ${s <= Math.round(avg) ? 'text-[#FF811A] fill-[#FF811A]' : 'text-[#EAE3DC] fill-[#EAE3DC]'}`}
                  />
                );
              })}
            </div>
            <span className="text-[11px] text-[#6B6058]">{reviews.length} review{reviews.length !== 1 ? 's' : ''}</span>
          </div>

          {/* Distribution bars */}
          <div className="flex-1 space-y-2 justify-center flex flex-col">
            {distribution.map(({ star, count }) => (
              <RatingBar key={star} star={star} count={count} total={reviews.length} />
            ))}
          </div>
        </div>
      )}

      {/* Reviews List */}
      <div className="space-y-4">
        {loadingReviews ? (
          <div className="space-y-3 animate-pulse">
            {[1, 2].map((i) => (
              <div key={i} className="h-28 bg-[#FFF3EC] rounded-2xl" />
            ))}
          </div>
        ) : reviewsError ? (
          <div className="text-center py-8 text-xs text-[#D7263D] bg-[#FDE8EA] rounded-2xl border border-[#D7263D]/20 px-4">
            {reviewsError}
          </div>
        ) : reviews.length === 0 ? (
          <div className="text-center py-12 px-4 bg-[#FFF8F2]/60 border border-dashed border-[#EAE3DC] rounded-2xl">
            <div className="w-14 h-14 rounded-full bg-[#FFF3EC] text-[#FA661C] flex items-center justify-center mx-auto mb-3">
              <Star className="w-7 h-7" />
            </div>
            <h3 className="font-['Outfit'] text-sm font-extrabold text-[#FA661C]">No Reviews Yet</h3>
            <p className="text-xs text-[#6B6058] mt-1 max-w-xs mx-auto">
              This product has no published reviews yet. Purchase it to be the first to share your experience!
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {reviews.map((review) => (
              <ReviewCard key={review.id} review={review} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
