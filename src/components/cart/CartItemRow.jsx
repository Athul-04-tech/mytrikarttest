import React from 'react';
import { Plus, Minus, Trash2, Bookmark, Store, CheckCircle2 } from 'lucide-react';
import { useCountUp } from '../../hooks/useCountUp';

function AnimatedPrice({ value }) {
  return <span>₹{Number(value).toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>;
}

export default function CartItemRow({
  item,
  onUpdateQty,
  onRemove,
  onSaveForLater
}) {
  const lineTotal = item.price * item.quantity;

  return (
    <div className="p-4 sm:p-5 bg-white rounded-2xl border border-[#D8E0DC] hover:border-[#D4AF37]/50 shadow-2xs transition-all duration-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 group">
      
      {/* Left: Product Thumbnail + Title Details */}
      <div className="flex items-start space-x-3.5 min-w-0">
        <img
          src={item.image}
          alt={item.name}
          className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl object-cover border border-[#D8E0DC] shrink-0 card-img-zoom"
        />

        <div className="min-w-0 flex-1">
          <div className="flex items-center space-x-1.5 text-[10px] text-[#5C6B63] mb-0.5">
            <Store className="w-3 h-3 text-[#D4AF37]" />
            <span className="truncate">{item.vendorName || 'Verified Merchant'}</span>
          </div>

          <h3 className="font-['Outfit'] font-bold text-xs sm:text-sm text-[#0F3D2E] leading-snug line-clamp-2">
            {item.name}
          </h3>

          {item.variant && (
            <span className="text-[10px] font-medium text-[#5C6B63] bg-[#FBF8F1] px-2 py-0.5 rounded-md border border-[#D8E0DC] inline-block mt-1">
              Variant: {item.variant}
            </span>
          )}

          {/* Unit Price */}
          <div className="flex items-baseline space-x-2 mt-1.5">
            <span className="font-bold text-xs text-[#0F3D2E]">
              ₹{item.price.toLocaleString('en-IN')}
            </span>
            {item.originalPrice && (
              <span className="text-[10px] text-[#5C6B63] line-through">
                ₹{item.originalPrice.toLocaleString('en-IN')}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Right: Quantity Stepper, Line Total, Save for Later & Delete */}
      <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#D8E0DC]/50">
        
        {/* Quantity Stepper */}
        <div className="flex items-center space-x-2 bg-[#FBF8F1] p-1 rounded-xl border border-[#D8E0DC]">
          <button
            type="button"
            onClick={() => onUpdateQty(item.id, -1)}
            disabled={item.quantity <= 1}
            className="w-7 h-7 rounded-lg bg-white hover:bg-[#E8F2EE] disabled:opacity-40 disabled:cursor-not-allowed border border-[#D8E0DC] text-[#0F3D2E] font-bold flex items-center justify-center icon-interactive cursor-pointer"
            aria-label="Decrease quantity"
          >
            <Minus className="w-3 h-3" />
          </button>

          <span className="w-6 text-center font-['Outfit'] font-black text-xs text-[#0F3D2E]">
            {item.quantity}
          </span>

          <button
            type="button"
            onClick={() => onUpdateQty(item.id, 1)}
            className="w-7 h-7 rounded-lg bg-white hover:bg-[#E8F2EE] border border-[#D8E0DC] text-[#0F3D2E] font-bold flex items-center justify-center icon-interactive cursor-pointer"
            aria-label="Increase quantity"
          >
            <Plus className="w-3 h-3" />
          </button>
        </div>

        {/* Line Total */}
        <div className="text-right">
          <span className="text-[10px] text-[#5C6B63] block">Item Total</span>
          <div className="font-['Outfit'] font-black text-sm sm:text-base text-[#0F3D2E]">
            <AnimatedPrice value={lineTotal} />
          </div>
        </div>

        {/* Action Links (Save for Later & Remove) */}
        <div className="flex items-center space-x-2 text-[11px]">
          <button
            type="button"
            onClick={() => onSaveForLater(item)}
            className="text-[#5C6B63] hover:text-[#0F3D2E] font-bold flex items-center space-x-1 link-interactive cursor-pointer"
          >
            <Bookmark className="w-3 h-3 text-[#D4AF37]" />
            <span className="hidden sm:inline">Save for Later</span>
          </button>

          <span className="text-[#D8E0DC] hidden sm:inline">•</span>

          <button
            type="button"
            onClick={() => onRemove(item.id)}
            className="text-[#5C6B63] hover:text-[#C0392B] font-bold flex items-center space-x-1 link-interactive cursor-pointer"
          >
            <Trash2 className="w-3 h-3" />
            <span>Remove</span>
          </button>
        </div>

      </div>

    </div>
  );
}
