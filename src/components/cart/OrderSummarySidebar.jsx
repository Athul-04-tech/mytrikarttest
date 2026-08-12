import React, { useEffect, useState } from 'react';
import { ShieldCheck, ArrowRight, Sparkles, CheckCircle2, Gift, Truck } from 'lucide-react';
import { useCart } from '../../context/CartWishlistContext';

export default function OrderSummarySidebar({ onProceedToCheckout, isCheckoutPage = false }) {
  const { calculations, cart, appliedCoupon, isGiftWrap, shippingMethod } = useCart();
  const [highlightPulse, setHighlightPulse] = useState(false);

  // Trigger subtle gold pulse animation on value update
  useEffect(() => {
    setHighlightPulse(true);
    const timer = setTimeout(() => setHighlightPulse(false), 500);
    return () => clearTimeout(timer);
  }, [
    calculations.cartSubtotal, 
    calculations.couponDiscount, 
    calculations.giftWrapFee, 
    calculations.shippingFee, 
    calculations.taxAmount, 
    calculations.amountPayable
  ]);

  const formatINR = (val) => `₹${Number(val).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div className="bg-white rounded-3xl border border-[#D8E0DC] p-5 sm:p-6 shadow-xs sticky top-20 space-y-4 text-xs">
      
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[#D8E0DC]">
        <h3 className="font-['Outfit'] font-extrabold text-base text-[#0F3D2E]">
          Order Price Summary
        </h3>
        <span className="text-[10px] font-bold text-[#5C6B63]">
          {cart.reduce((acc, item) => acc + item.quantity, 0)} Items
        </span>
      </div>

      {/* Breakdown Lines (Strict Arithmetic) */}
      <div className="space-y-2.5 divide-y divide-[#D8E0DC]/40 text-[#5C6B63]">
        
        {/* Subtotal */}
        <div className={`flex items-center justify-between pt-1 transition-all ${highlightPulse ? 'text-[#0F3D2E]' : ''}`}>
          <span>Cart Subtotal</span>
          <span className="font-bold text-[#0F3D2E]">
            {formatINR(calculations.cartSubtotal)}
          </span>
        </div>

        {/* Coupon Discount */}
        {calculations.couponDiscount > 0 && (
          <div className="flex items-center justify-between pt-2.5 text-[#0F3D2E] font-medium animate-reveal">
            <span className="flex items-center space-x-1">
              <span>Coupon Discount</span>
              <strong className="text-[10px] bg-[#E8F2EE] px-1.5 py-0.2 rounded font-mono">
                {appliedCoupon?.code}
              </strong>
            </span>
            <span className="font-bold text-[#0F3D2E]">
              − {formatINR(calculations.couponDiscount)}
            </span>
          </div>
        )}

        {/* Gift Wrap Fee */}
        {calculations.giftWrapFee > 0 && (
          <div className="flex items-center justify-between pt-2.5 text-[#0F3D2E] animate-reveal">
            <span className="flex items-center space-x-1">
              <Gift className="w-3 h-3 text-[#D4AF37]" />
              <span>Premium Gift Wrapping</span>
            </span>
            <span className="font-bold text-[#0F3D2E]">
              + {formatINR(calculations.giftWrapFee)}
            </span>
          </div>
        )}

        {/* Estimated Shipping */}
        <div className="flex items-center justify-between pt-2.5">
          <span className="flex items-center space-x-1">
            <Truck className="w-3 h-3 text-[#5C6B63]" />
            <span>Shipping ({shippingMethod === 'express' ? 'Express' : shippingMethod === 'priority' ? 'Priority' : 'Standard'})</span>
          </span>
          <span className="font-bold text-[#0F3D2E]">
            {calculations.shippingFee === 0 ? (
              <span className="text-[#0F3D2E] uppercase text-[10px] font-black bg-[#E8F2EE] px-1.5 py-0.2 rounded">
                FREE
              </span>
            ) : (
              `+ ${formatINR(calculations.shippingFee)}`
            )}
          </span>
        </div>

        {/* Tax (GST with Rate Pair) */}
        <div className="flex items-center justify-between pt-2.5">
          <span>Estimated Tax (GST 5%)</span>
          <span className="font-bold text-[#0F3D2E]">
            + {formatINR(calculations.taxAmount)}
          </span>
        </div>

        {/* Wallet Deduction (if applied on checkout) */}
        {calculations.walletDeduction > 0 && (
          <div className="flex items-center justify-between pt-2.5 text-[#0F3D2E] font-medium animate-reveal">
            <span>Wallet Balance Applied</span>
            <span className="font-bold text-[#0F3D2E]">
              − {formatINR(calculations.walletDeduction)}
            </span>
          </div>
        )}

        {/* Reward Points Deduction (if applied on checkout) */}
        {calculations.rewardPointsDeduction > 0 && (
          <div className="flex items-center justify-between pt-2.5 text-[#0F3D2E] font-medium animate-reveal">
            <span>Reward Points Redeemed</span>
            <span className="font-bold text-[#0F3D2E]">
              − {formatINR(calculations.rewardPointsDeduction)}
            </span>
          </div>
        )}

      </div>

      {/* TOTAL AMOUNT PAYABLE (Exact Sum with Gold Pulse) */}
      <div className={`pt-3 border-t-2 border-[#0F3D2E]/20 flex items-center justify-between transition-colors duration-300 ${
        highlightPulse ? 'bg-[#FCF7E8] p-2 rounded-xl border-[#D4AF37]' : ''
      }`}>
        <div>
          <span className="font-['Outfit'] font-black text-sm text-[#0F3D2E] block">
            {isCheckoutPage ? 'Amount Payable' : 'Estimated Total'}
          </span>
          <span className="text-[10px] text-[#5C6B63]">Inclusive of all taxes</span>
        </div>

        <div className="text-right font-['Outfit'] font-black text-xl text-[#0F3D2E]">
          {formatINR(calculations.amountPayable)}
        </div>
      </div>

      {/* Total Savings Callout */}
      {calculations.totalSavings > 0 && (
        <div className="p-2.5 bg-[#E8F2EE] text-[#0F3D2E] rounded-xl border border-[#0F3D2E]/20 flex items-center justify-center space-x-1 text-[11px] font-bold text-center">
          <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
          <span>You are saving {formatINR(calculations.totalSavings)} on this order!</span>
        </div>
      )}

      {/* Primary CTA (if in Cart view) */}
      {!isCheckoutPage && (
        <button
          type="button"
          onClick={onProceedToCheckout}
          disabled={cart.length === 0}
          className="w-full py-3 px-4 bg-[#0F3D2E] hover:bg-[#155440] active:bg-[#0A2A1F] disabled:opacity-50 disabled:cursor-not-allowed text-[#FBF8F1] rounded-2xl font-black text-xs btn-interactive flex items-center justify-center space-x-2 shadow-md hover:shadow-lg cursor-pointer"
        >
          <span>Proceed to Checkout</span>
          <ArrowRight className="w-4 h-4 text-[#D4AF37] icon-interactive" />
        </button>
      )}

      {/* Trust Badges */}
      <div className="pt-2 border-t border-[#D8E0DC]/60 grid grid-cols-2 gap-2 text-[10px] text-[#5C6B63]">
        <div className="flex items-center space-x-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-[#0F3D2E] shrink-0" />
          <span>100% Genuine Items</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <CheckCircle2 className="w-3.5 h-3.5 text-[#0F3D2E] shrink-0" />
          <span>7-Day Easy Returns</span>
        </div>
      </div>

    </div>
  );
}
