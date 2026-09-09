import React from 'react';
import { Link } from 'react-router-dom';
import { Plus, Sparkles, Calendar } from 'lucide-react';

export default function SellerWelcomeHeader({ storeName, asOfDate, onAsOfDateChange }) {
  const displayName = storeName || 'Merchant Store';

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2">
      <div>
        <div className="flex items-center space-x-2 text-[#FF811A] mb-1">
          <Sparkles className="w-3.5 h-3.5 fill-current" />
          <span className="text-[10px] font-black uppercase tracking-widest text-[#FA661C]">
            SELLER OPERATIONS CONSOLE
          </span>
          <span className="text-[10px] bg-[#FFF8F2] text-[#FA661C] border border-[#FF811A]/50 font-bold px-2 py-0.2 rounded-full">
            Merchant tier: Not yet available
          </span>
        </div>

        <h1 className="font-['Outfit'] text-2xl sm:text-3xl font-extrabold text-[#FA661C] tracking-tight">
          Welcome back, {displayName}
        </h1>
        <p className="text-xs text-[#6B6058] mt-1">
          Here is your store performance, orders needing fulfillment, and earnings settlement breakdown.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3 shrink-0 self-start md:self-auto">
        {/* As-Of Date Filter Control */}
        <div className="flex items-center space-x-1.5 bg-white border border-[#EAE3DC] px-3 py-2 rounded-2xl shadow-2xs">
          <Calendar className="w-3.5 h-3.5 text-[#FA661C]" />
          <span className="text-[11px] font-bold text-[#6B6058]">As Of:</span>
          <input
            type="date"
            value={asOfDate || ''}
            onChange={(e) => onAsOfDateChange && onAsOfDateChange(e.target.value)}
            className="text-xs font-bold text-[#FA661C] bg-transparent outline-none cursor-pointer"
            title="Select historical report snapshot date"
          />
          {asOfDate && (
            <button
              type="button"
              onClick={() => onAsOfDateChange && onAsOfDateChange('')}
              className="text-[10px] font-bold text-[#D7263D] hover:underline ml-1 cursor-pointer"
            >
              Reset
            </button>
          )}
        </div>

        {/* Prominent Primary CTA Button */}
        <Link
          to="/seller/products/new"
          className="px-5 py-2.5 bg-[#FA661C] hover:bg-[#E0530B] active:bg-[#0A2A1F] text-[#FFFFFF] rounded-2xl text-xs font-black btn-interactive flex items-center space-x-2 shadow-md hover:shadow-lg border border-[#FA661C] shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4 text-[#FF811A] icon-interactive" />
          <span>Add New Product Listing</span>
        </Link>
      </div>
    </div>
  );
}

