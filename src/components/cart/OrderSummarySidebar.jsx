import React, { useMemo } from 'react';
import {
  ShieldCheck,
  ArrowRight,
  CheckCircle2,
  Truck,
  Package,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { useCart } from '../../context/CartWishlistContext';
import { useAuth } from '../../context/AuthContext';
import {
  formatVerbatimMoney,
  getCartSummaryDeliveryDisplay,
  isNonZeroMoneyString,
} from '../../utils/orderPricingUtils';

export default function OrderSummarySidebar({
  onProceedToCheckout,
  isCheckoutPage = false,
}) {
  const {
    cart,
    cartSummary,
    cartSummaryLoading,
    cartSummaryError,
    appliedCoupon,
  } = useCart();
  const auth = useAuth();
  const isProductOwnedByCurrentSeller = auth?.isProductOwnedByCurrentSeller;

  const hasOwnProductsInCart = useMemo(() => {
    if (!isProductOwnedByCurrentSeller || !Array.isArray(cart)) return false;
    return cart.some((item) => isProductOwnedByCurrentSeller(item));
  }, [cart, isProductOwnedByCurrentSeller]);

  const deliveryDisplay = useMemo(
    () => getCartSummaryDeliveryDisplay(cartSummary),
    [cartSummary]
  );

  const packagingLines = Array.isArray(cartSummary?.packaging_lines)
    ? cartSummary.packaging_lines
    : [];

  return (
    <div
      data-testid="order-summary-sidebar"
      className="bg-white rounded-3xl border border-[#EAE3DC] p-5 sm:p-6 shadow-xs lg:sticky lg:top-[calc(var(--header-h,80px)+16px)] space-y-4 text-xs"
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[#EAE3DC]">
        <h3 className="font-['Outfit'] font-extrabold text-base text-[#FA661C]">
          Order Price Summary
        </h3>
        <span className="text-[10px] font-bold text-[#6B6058]">
          {cart.reduce((acc, item) => acc + item.quantity, 0)} Items
        </span>
      </div>

      {/* Loading State */}
      {cartSummaryLoading ? (
        <div
          role="status"
          data-testid="cart-summary-loading"
          className="py-8 text-center space-y-2 text-[#6B6058]"
        >
          <Loader2 className="w-5 h-5 text-[#FA661C] animate-spin mx-auto" />
          <p className="font-semibold">Loading price summary from server…</p>
        </div>
      ) : cartSummaryError ? (
        /* Error State: show server message and do not show a total from anywhere else */
        <div
          role="alert"
          data-testid="cart-summary-error"
          className="p-3.5 rounded-2xl border border-[#D7263D]/30 bg-[#FFF0F0] text-[#D7263D] flex items-start space-x-2"
        >
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span className="font-semibold">{cartSummaryError}</span>
        </div>
      ) : cartSummary ? (
        <>
          {/* Breakdown Lines */}
          <div className="space-y-2.5 divide-y divide-[#EAE3DC]/40 text-[#6B6058]">
            {/* 1. Item Subtotal */}
            <div className="flex items-center justify-between pt-1">
              <span>Item subtotal</span>
              <span
                data-testid="cart-summary-item-subtotal"
                className="font-mono font-bold text-[#1A2420]"
              >
                {formatVerbatimMoney(
                  cartSummary.currency,
                  cartSummary.item_subtotal
                )}
              </span>
            </div>

            {/* 2. Item Tax */}
            <div className="flex items-center justify-between pt-2.5">
              <span>Item tax</span>
              <span
                data-testid="cart-summary-item-tax"
                className="font-mono font-bold text-[#1A2420]"
              >
                {formatVerbatimMoney(cartSummary.currency, cartSummary.item_tax)}
              </span>
            </div>

            {/* 3. Discount (if any) */}
            {isNonZeroMoneyString(cartSummary.discount) && (
              <div className="flex items-center justify-between pt-2.5 text-emerald-700">
                <span>
                  Discount
                  {appliedCoupon?.code ? ` (${appliedCoupon.code})` : ''}
                </span>
                <span
                  data-testid="cart-summary-discount"
                  className="font-mono font-bold"
                >
                  -{' '}
                  {formatVerbatimMoney(
                    cartSummary.currency,
                    cartSummary.discount
                  )}
                </span>
              </div>
            )}

            {/* 4. Delivery Charge or delivery_message or Free delivery */}
            <div className="flex items-center justify-between pt-2.5">
              <span className="flex items-center space-x-1">
                <Truck className="w-3.5 h-3.5 text-[#6B6058]" />
                <span>Delivery charge</span>
              </span>
              <span
                data-testid="cart-summary-delivery-charge"
                className="font-mono font-bold text-[#1A2420]"
              >
                {deliveryDisplay.text}
              </span>
            </div>

            {/* 5. Packaging Fee (one line per seller parcel when more than one; single line otherwise) */}
            {packagingLines.length > 1 ? (
              <div
                data-testid="cart-summary-packaging-multi"
                className="pt-2.5 space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="flex items-center space-x-1">
                    <Package className="w-3.5 h-3.5 text-[#6B6058]" />
                    <span>
                      Packaging fee ({packagingLines.length} seller parcels)
                    </span>
                  </span>
                  <span
                    data-testid="cart-summary-packaging-total"
                    className="font-mono font-bold text-[#1A2420]"
                  >
                    {formatVerbatimMoney(
                      cartSummary.currency,
                      cartSummary.packaging_fee_total
                    )}
                  </span>
                </div>
                <div className="pl-4 space-y-1 text-[11px]">
                  {packagingLines.map((line, idx) => (
                    <div
                      key={line.vendor_id ?? idx}
                      data-testid={`cart-summary-packaging-line-${
                        line.vendor_id ?? idx
                      }`}
                      className="flex items-center justify-between"
                    >
                      <span>
                        Packaging fee (Seller parcel #{idx + 1}
                        {line.vendor_id ? ` • Vendor #${line.vendor_id}` : ''})
                      </span>
                      <span className="font-mono font-semibold text-[#1A2420]">
                        {formatVerbatimMoney(line.currency, line.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between pt-2.5">
                <span className="flex items-center space-x-1">
                  <Package className="w-3.5 h-3.5 text-[#6B6058]" />
                  <span>Packaging fee</span>
                </span>
                <span
                  data-testid="cart-summary-packaging-total"
                  className="font-mono font-bold text-[#1A2420]"
                >
                  {formatVerbatimMoney(
                    cartSummary.currency,
                    cartSummary.packaging_fee_total
                  )}
                </span>
              </div>
            )}

            {/* 6. Any fee tax line the server sends */}
            {isNonZeroMoneyString(cartSummary.fee_tax_total) && (
              <div className="flex items-center justify-between pt-2.5">
                <span>Fee tax</span>
                <span
                  data-testid="cart-summary-fee-tax"
                  className="font-mono font-bold text-[#1A2420]"
                >
                  {formatVerbatimMoney(
                    cartSummary.currency,
                    cartSummary.fee_tax_total
                  )}
                </span>
              </div>
            )}
          </div>

          {/* 7. Total */}
          <div className="pt-3 border-t-2 border-[#FA661C]/20 flex items-center justify-between">
            <div>
              <span className="font-['Outfit'] font-black text-sm text-[#FA661C] block">
                Total
              </span>
            </div>

            <div
              data-testid="cart-summary-total"
              className="text-right font-['Outfit'] font-mono font-black text-xl text-[#FA661C]"
            >
              {formatVerbatimMoney(cartSummary.currency, cartSummary.total)}
            </div>
          </div>
        </>
      ) : null}

      {/* Primary CTA (if in Cart view) */}
      {!isCheckoutPage && (
        <button
          type="button"
          onClick={onProceedToCheckout}
          disabled={cart.length === 0 || hasOwnProductsInCart}
          className={`w-full py-3 px-4 rounded-2xl font-black text-xs flex items-center justify-center space-x-2 shadow-md transition-all ${
            hasOwnProductsInCart
              ? 'bg-[#6B6058]/40 text-white cursor-not-allowed opacity-90'
              : 'bg-[#FA661C] hover:bg-[#E0530B] active:bg-[#0A2A1F] disabled:opacity-50 disabled:cursor-not-allowed text-[#FFFFFF] btn-interactive cursor-pointer shadow-md hover:shadow-lg'
          }`}
        >
          <span>
            {hasOwnProductsInCart
              ? 'Remove Own Products to Checkout'
              : 'Proceed to Checkout'}
          </span>
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
