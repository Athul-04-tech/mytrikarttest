import React, { useState } from 'react';
import { Tag, CheckCircle2, X, AlertCircle, Loader2 } from 'lucide-react';
import { useCart } from '../../context/CartWishlistContext';

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
      <div className="flex items-center gap-1.5 text-xs font-bold text-[#FA661C]"><Tag className="w-4 h-4" /><span>Apply Coupon</span></div>
      {appliedCoupon ? <div className="p-3 bg-[#FFF3EC] border border-[#FA661C]/30 rounded-xl flex items-center justify-between">
        <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-[#FA661C]" /><div><span className="font-mono font-black text-xs text-[#FA661C]">{appliedCoupon.code}</span><p className="text-[10px] text-[#FA661C]/80 mt-0.5">Server validated savings: ₹{Number(appliedCoupon.discountAmount).toFixed(2)}</p></div></div>
        <button type="button" onClick={removeCoupon} className="p-1 text-[#6B6058] hover:text-[#D7263D]" aria-label="Remove coupon"><X className="w-4 h-4" /></button>
      </div> : <form onSubmit={handleApply} className="space-y-2">
        <div className="flex gap-2"><input type="text" value={code} onChange={(event) => setCode(event.target.value)} placeholder="Enter coupon code" className="flex-1 min-w-0 p-2.5 border border-[#EAE3DC] rounded-xl text-xs uppercase font-mono" /><button type="submit" disabled={applying} className="px-4 py-2.5 bg-[#FA661C] text-white text-xs font-bold rounded-xl disabled:opacity-50">{applying ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Apply'}</button></div>
        {couponError && <div className="flex items-center gap-1 text-[11px] text-[#D7263D]"><AlertCircle className="w-3.5 h-3.5" />{couponError}</div>}
      </form>}
    </div>
  );
}
