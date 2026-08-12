import React from 'react';
import { Link } from 'react-router-dom';
import { Plus, Sparkles } from 'lucide-react';
import { SELLER_PROFILE } from '../../data/sellerDashboardData';

export default function SellerWelcomeHeader() {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
      <div>
        <div className="flex items-center space-x-2 text-[#D4AF37] mb-1">
          <Sparkles className="w-3.5 h-3.5 fill-current" />
          <span className="text-[10px] font-black uppercase tracking-widest text-[#0F3D2E]">
            SELLER OPERATIONS CONSOLE
          </span>
          <span className="text-[10px] bg-[#FCF7E8] text-[#0F3D2E] border border-[#D4AF37]/50 font-bold px-2 py-0.2 rounded-full">
            {SELLER_PROFILE.tier}
          </span>
        </div>

        <h1 className="font-['Outfit'] text-2xl sm:text-3xl font-extrabold text-[#0F3D2E] tracking-tight">
          Welcome back, {SELLER_PROFILE.storeName}
        </h1>
        <p className="text-xs text-[#5C6B63] mt-1">
          Here is your store performance, orders needing fulfillment, and earnings settlement breakdown.
        </p>
      </div>

      {/* Prominent Primary CTA Button */}
      <Link
        to="/seller/products/new"
        className="px-5 py-2.5 bg-[#0F3D2E] hover:bg-[#155440] active:bg-[#0A2A1F] text-[#FBF8F1] rounded-2xl text-xs font-black btn-interactive flex items-center space-x-2 shadow-md hover:shadow-lg border border-[#0F3D2E] shrink-0 self-start sm:self-auto cursor-pointer"
      >
        <Plus className="w-4 h-4 text-[#D4AF37] icon-interactive" />
        <span>Add New Product Listing</span>
      </Link>
    </div>
  );
}
