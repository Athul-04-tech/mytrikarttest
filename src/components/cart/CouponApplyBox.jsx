import React, { useState } from 'react';
import { Tag, CheckCircle2, X, AlertCircle, Sparkles } from 'lucide-react';
import { useCart } from '../../context/CartWishlistContext';

export default function CouponApplyBox() {
  const { appliedCoupon, couponError, applyCoupon, removeCoupon } = useCart();
  const [code, setCode] = useState('');
  const [isShaking, setIsShaking] = useState(false);

  const handleApply = (e) => {
    e.preventDefault();
    const success = applyCoupon(code);
    if (!success) {
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);
    } else {
      setCode('');
    }
  };

  return (
    <div className="p-4 bg-white rounded-2xl border border-[#D8E0DC] space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-1.5 text-xs font-bold text-[#0F3D2E]">
          <Tag className="w-4 h-4 text-[#D4AF37]" />
          <span>Apply Promo Code / Voucher</span>
        </div>
        <span className="text-[10px] text-[#5C6B63]">Try: SAVE10</span>
      </div>

      {appliedCoupon ? (
        /* Applied Coupon Success Chip */
        <div className="p-3 bg-[#E8F2EE] border border-[#0F3D2E]/30 rounded-xl flex items-center justify-between animate-reveal">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-[#0F3D2E] shrink-0" />
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="font-mono font-black text-xs text-[#0F3D2E]">
                  {appliedCoupon.code}
                </span>
                <span className="text-[10px] bg-[#D4AF37] text-[#0F3D2E] font-bold px-1.5 py-0.2 rounded">
                  APPLIED
                </span>
              </div>
              <p className="text-[10px] text-[#0F3D2E]/80 mt-0.5">
                {appliedCoupon.desc}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={removeCoupon}
            className="p-1 rounded-lg text-[#5C6B63] hover:text-[#C0392B] hover:bg-white icon-interactive cursor-pointer"
            aria-label="Remove coupon"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        /* Coupon Input Form */
        <form onSubmit={handleApply} className="space-y-2">
          <div className={`flex items-center space-x-2 ${isShaking ? 'animate-shake' : ''}`}>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Enter coupon code"
              className="flex-1 p-2.5 bg-[#FBF8F1] border border-[#D8E0DC] rounded-xl text-xs uppercase font-mono tracking-wider text-[#0F3D2E] placeholder:text-[#5C6B63]/60 focus:ring-1 focus:ring-[#D4AF37] outline-none"
            />
            <button
              type="submit"
              className="px-4 py-2.5 bg-[#0F3D2E] hover:bg-[#155440] text-[#FBF8F1] text-xs font-bold rounded-xl btn-interactive cursor-pointer shrink-0"
            >
              Apply
            </button>
          </div>

          {/* Inline Error Message in Brick Red */}
          {couponError && (
            <div className="flex items-center space-x-1 text-[11px] text-[#C0392B] font-medium pt-0.5 animate-reveal">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{couponError}</span>
            </div>
          )}
        </form>
      )}
    </div>
  );
}
