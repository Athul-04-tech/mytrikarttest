import React, { useState } from 'react';
import { Tag, CheckCircle2, X, AlertCircle, Loader2 } from 'lucide-react';
import { useCart } from '../../context/CartWishlistContext';
import { formatVerbatimMoney } from '../../utils/orderPricingUtils';

export default function CouponApplyBox() {
  const { appliedCoupon, couponError, applyCoupon, removeCoupon } = useCart();
  const [code, setCode] = useState('');
  const [applying, setApplying] = useState(false);

  const handleApply = async (event) => {
    event.preventDefault();
    setApplying(true);
    const success = await applyCoupon(code);
    setApplying(false);
    if (success) setCode('');
  };

  return (
    <div className="p-4 bg-white rounded-2xl border border-[#EAE3DC] space-y-3">
      <div className="flex items-center gap-1.5 text-xs font-bold text-[#FA661C]">
        <Tag className="w-4 h-4" />
        <span>Apply Coupon</span>
      </div>
      {appliedCoupon ? (
        <div className="p-3 bg-[#FFF3EC] border border-[#FA661C]/30 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#FA661C]" />
            <div>
              <span
                data-testid="applied-coupon-code"
                className="font-mono font-black text-xs text-[#FA661C]"
              >
                {appliedCoupon.code}
              </span>
              <p
                data-testid="applied-coupon-discount"
                className="text-[10px] text-[#FA661C]/80 mt-0.5"
              >
                Coupon discount:{' '}
                {formatVerbatimMoney(
                  appliedCoupon.currency || 'INR',
                  appliedCoupon.discountAmount
                )}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={removeCoupon}
            data-testid="remove-coupon-btn"
            className="p-1 text-[#6B6058] hover:text-[#D7263D] cursor-pointer"
            aria-label="Remove coupon"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <form onSubmit={handleApply} className="space-y-2">
          <div className="flex gap-2">
            <input
              type="text"
              data-testid="coupon-code-input"
              value={code}
              onChange={(event) => setCode(event.target.value)}
              placeholder="Enter coupon code"
              className="flex-1 min-w-0 p-2.5 border border-[#EAE3DC] rounded-xl text-xs uppercase font-mono"
            />
            <button
              type="submit"
              data-testid="apply-coupon-btn"
              disabled={applying}
              className="px-4 py-2.5 bg-[#FA661C] text-white text-xs font-bold rounded-xl disabled:opacity-50 cursor-pointer"
            >
              {applying ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                'Apply'
              )}
            </button>
          </div>
          {couponError && (
            <div
              data-testid="coupon-error-msg"
              className="flex items-center gap-1 text-[11px] text-[#D7263D]"
            >
              <AlertCircle className="w-3.5 h-3.5" />
              {couponError}
            </div>
          )}
        </form>
      )}
    </div>
  );
}
