import React, { useEffect, useState } from 'react';
import { ShieldCheck, ArrowRight, CheckCircle2, Truck } from 'lucide-react';
import { useCart } from '../../context/CartWishlistContext';

export default function OrderSummarySidebar({ onProceedToCheckout, isCheckoutPage = false }) {
  const { calculations, cart } = useCart();
  const [highlightPulse, setHighlightPulse] = useState(false);

  // Trigger subtle pulse animation on value update
  useEffect(() => {
    setHighlightPulse(true);
    const timer = setTimeout(() => setHighlightPulse(false), 500);
    return () => clearTimeout(timer);
  }, [
    calculations.cartSubtotal, 
    calculations.shippingFee, 
    calculations.taxAmount, 
    calculations.amountPayable
  ]);

  const formatINR = (val) => `₹${Number(val).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div className="bg-white rounded-3xl border border-[#EAE3DC] p-5 sm:p-6 shadow-xs sticky top-20 space-y-4 text-xs">
      
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[#EAE3DC]">
        <h3 className="font-['Outfit'] font-extrabold text-base text-[#FA661C]">
          Order Price Summary
        </h3>
        <span className="text-[10px] font-bold text-[#6B6058]">
          {cart.reduce((acc, item) => acc + item.quantity, 0)} Items
        </span>
      </div>

      {/* Breakdown Lines */}
      <div className="space-y-2.5 divide-y divide-[#EAE3DC]/40 text-[#6B6058]">
        
        {/* Subtotal */}
        <div className={`flex items-center justify-between pt-1 transition-all ${highlightPulse ? 'text-[#FA661C]' : ''}`}>
          <span>Cart Subtotal</span>
          <span className="font-bold text-[#FA661C]">
            {formatINR(calculations.cartSubtotal)}
          </span>
        </div>

        {/* Shipping */}
        <div className="flex items-center justify-between pt-2.5">
          <span className="flex items-center space-x-1">
            <Truck className="w-3 h-3 text-[#6B6058]" />
            <span>Standard Delivery</span>
          </span>
          <span className="font-bold text-[#FA661C]">
            <span className="text-[#FA661C] uppercase text-[10px] font-black bg-[#FFF3EC] px-1.5 py-0.2 rounded">
              FREE
            </span>
          </span>
        </div>

        {/* Estimated Tax */}
        <div className="flex items-center justify-between pt-2.5">
          <span>Estimated Tax (GST 5%)</span>
          <span className="font-bold text-[#FA661C]">
            + {formatINR(calculations.taxAmount)}
          </span>
        </div>

      </div>

      {/* TOTAL AMOUNT PAYABLE */}
      <div className={`pt-3 border-t-2 border-[#FA661C]/20 flex items-center justify-between transition-colors duration-300 ${
        highlightPulse ? 'bg-[#FFF8F2] p-2 rounded-xl border-[#FF811A]' : ''
      }`}>
        <div>
          <span className="font-['Outfit'] font-black text-sm text-[#FA661C] block">
            {isCheckoutPage ? 'Amount Payable' : 'Estimated Total'}
          </span>
          <span className="text-[10px] text-[#6B6058]">Calculated at checkout</span>
        </div>

        <div className="text-right font-['Outfit'] font-black text-xl text-[#FA661C]">
          {formatINR(calculations.amountPayable)}
        </div>
      </div>

      {/* Primary CTA (if in Cart view) */}
      {!isCheckoutPage && (
        <button
          type="button"
          onClick={onProceedToCheckout}
          disabled={cart.length === 0}
          className="w-full py-3 px-4 bg-[#FA661C] hover:bg-[#E0530B] active:bg-[#0A2A1F] disabled:opacity-50 disabled:cursor-not-allowed text-[#FFFFFF] rounded-2xl font-black text-xs btn-interactive flex items-center justify-center space-x-2 shadow-md hover:shadow-lg cursor-pointer"
        >
          <span>Proceed to Checkout</span>
          <ArrowRight className="w-4 h-4 text-[#FF811A] icon-interactive" />
        </button>
      )}

      {/* Trust Badges */}
      <div className="pt-2 border-t border-[#EAE3DC]/60 grid grid-cols-2 gap-2 text-[10px] text-[#6B6058]">
        <div className="flex items-center space-x-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-[#FA661C] shrink-0" />
          <span>100% Genuine Items</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <CheckCircle2 className="w-3.5 h-3.5 text-[#FA661C] shrink-0" />
          <span>7-Day Easy Returns</span>
        </div>
      </div>

    </div>
  );
}

