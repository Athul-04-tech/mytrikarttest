import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tag, Copy, Check, ArrowRight, Clock, Gift, Loader2, AlertCircle } from 'lucide-react';
import { useCart } from '../../context/CartWishlistContext';
import { useToast } from '../../context/ToastContext';
import { apiRequest } from '../../utils/api';

export default function CouponsSection() {
  const navigate = useNavigate();
  const toast = useToast();
  const { appliedCoupon, applyCoupon } = useCart();
  const [coupons, setCoupons] = useState([]);
  const [voucherInput, setVoucherInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState('');
  const [error, setError] = useState('');
  const [copiedCode, setCopiedCode] = useState('');

  useEffect(() => {
    let active = true;
    apiRequest('/api/customers/coupons/')
      .then((rows) => { if (active) setCoupons(Array.isArray(rows) ? rows : []); })
      .catch((err) => { if (active) setError(err?.data?.detail || err?.message || 'Could not load your coupons.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const handleApply = async (code) => {
    setApplying(code);
    const success = await applyCoupon(code);
    setApplying('');
    if (success) navigate('/cart');
  };

  const handleRedeem = async (event) => {
    event.preventDefault();
    if (!voucherInput.trim()) return;
    const code = voucherInput.trim();
    const success = await applyCoupon(code);
    if (success) { setVoucherInput(''); navigate('/cart'); }
  };

  const copyCode = async (code) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      toast.success('Coupon Code Copied!', `Code "${code}" copied to clipboard.`);
      setTimeout(() => setCopiedCode(''), 2000);
    } catch (_) {
      toast.info('Coupon Code', `Code: ${code}`);
    }
  };

  return (
    <section className="bg-white rounded-3xl border border-[#EAE3DC] p-6 sm:p-8 shadow-xs">
      <div className="flex items-start justify-between gap-4 pb-5 border-b border-[#EAE3DC]">
        <div>
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-[#FA661C]"><Tag className="w-4 h-4" />Coupons &amp; Vouchers</div>
          <p className="text-sm text-[#6B6058] mt-2">Active offers available for your account.</p>
        </div>
        <span className="text-xs font-bold text-[#6B6058]">{coupons.length} available</span>
      </div>

      <form onSubmit={handleRedeem} className="mt-5 flex gap-2">
        <div className="flex items-center gap-2 text-[#FA661C]"><Gift className="w-5 h-5" /></div>
        <input value={voucherInput} onChange={(event) => setVoucherInput(event.target.value)} placeholder="Enter a promo code" className="min-w-0 flex-1 px-3 py-2 border border-[#EAE3DC] rounded-xl text-sm uppercase font-mono" />
        <button className="px-4 py-2 bg-[#FA661C] text-white rounded-xl text-sm font-bold">Apply</button>
      </form>

      {error && <div className="mt-4 flex gap-2 text-sm text-[#D7263D]"><AlertCircle className="w-4 h-4 shrink-0" />{error}</div>}
      {loading ? <div className="py-10 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-[#FA661C]" /></div> : coupons.length === 0 ? (
        <div className="mt-6 p-8 text-center rounded-2xl bg-[#FFF8F2] text-sm text-[#6B6058]">No active coupons are available right now.</div>
      ) : (
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          {coupons.map((coupon) => {
            const isApplied = appliedCoupon?.code === coupon.code;
            const discount = coupon.discount_type === 'percentage' ? `${coupon.discount_value}% off` : `₹${coupon.discount_value} off`;
            return <article key={coupon.code} className="rounded-2xl border border-[#EAE3DC] p-5 bg-[#FFFDFC]">
              <div className="flex justify-between gap-3"><div><h3 className="font-extrabold text-[#FA661C]">{discount}</h3><p className="text-sm text-[#6B6058] mt-1">{coupon.description || 'Marketplace offer'}</p></div><button type="button" onClick={() => copyCode(coupon.code)} className="p-2 text-[#FA661C]" aria-label={`Copy ${coupon.code}`}><span className="sr-only">{copiedCode === coupon.code ? 'Copied' : 'Copy code'}</span>{copiedCode === coupon.code ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}</button></div>
              <div className="mt-4 flex items-center justify-between gap-2 border-y border-dashed border-[#FF811A]/50 py-3"><span className="font-mono font-black tracking-wider text-[#FA661C]">{coupon.code}</span><span className="text-xs text-[#6B6058] flex items-center gap-1"><Clock className="w-3.5 h-3.5" />Until {new Date(coupon.valid_until).toLocaleDateString()}</span></div>
              <div className="mt-3 flex items-center justify-between"><span className="text-xs text-[#6B6058]">Minimum spend {coupon.min_cart_value ? `₹${coupon.min_cart_value}` : 'None'}</span>{isApplied ? <span className="text-xs font-bold text-emerald-700">Applied to cart</span> : <button type="button" disabled={Boolean(applying)} onClick={() => handleApply(coupon.code)} className="flex items-center gap-1 text-xs font-bold text-[#FA661C] disabled:opacity-50">{applying === coupon.code ? 'Applying…' : 'Use coupon'}<ArrowRight className="w-3 h-3" /></button>}</div>
            </article>;
          })}
        </div>
      )}
    </section>
  );
}
