import React from 'react';
import { Package, Store, Star, ArrowUpRight, Crown } from 'lucide-react';
import { ADMIN_TOP_PRODUCTS, ADMIN_TOP_VENDORS } from '../../data/adminMockData';
import { useToast } from '../../context/ToastContext';

export default function AdminTopListsPanel() {
  const toast = useToast();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
      
      {/* 1. TOP SELLING PRODUCTS */}
      <div className="bg-white rounded-3xl border border-[#EAE3DC] p-5 sm:p-6 shadow-xs flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between pb-3 border-b border-[#EAE3DC]">
            <div className="flex items-center space-x-2">
              <span className="p-1 rounded-lg bg-[#FFF3EC] text-[#FA661C]">
                <Package className="w-4 h-4" />
              </span>
              <h3 className="font-['Outfit'] font-extrabold text-base text-[#FA661C]">
                Top Selling Products
              </h3>
            </div>
            <span className="text-[10px] font-bold text-[#6B6058]">By Gross Volume</span>
          </div>

          <div className="my-3 space-y-2.5">
            {ADMIN_TOP_PRODUCTS.map((prod, idx) => (
              <div 
                key={prod.id}
                onClick={() => toast.info("Product Insights", `Inspecting inventory for ${prod.name}`)}
                className="flex items-center justify-between p-2 rounded-xl hover:bg-[#FFFFFF] transition-colors cursor-pointer group"
              >
                <div className="flex items-center space-x-3 truncate">
                  <span className="font-mono text-xs font-black text-[#FF811A] w-4">
                    #{idx + 1}
                  </span>
                  <img 
                    src={prod.image} 
                    alt={prod.name} 
                    className="w-10 h-10 rounded-xl object-cover border border-[#EAE3DC] shrink-0"
                  />
                  <div className="truncate">
                    <h5 className="font-bold text-xs text-[#FA661C] truncate group-hover:text-[#E0530B] transition-colors">
                      {prod.name}
                    </h5>
                    <p className="text-[10px] text-[#6B6058]">
                      {prod.units} units sold • {prod.category}
                    </p>
                  </div>
                </div>

                <div className="text-right shrink-0 pl-2">
                  <span className="font-extrabold text-xs text-[#FA661C] block">
                    {prod.revenue}
                  </span>
                  <div className="flex items-center space-x-1 justify-end text-[10px] text-[#FF811A] font-bold">
                    <Star className="w-2.5 h-2.5 fill-current" />
                    <span>{prod.rating}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="pt-3 border-t border-[#EAE3DC]/60 text-right">
          <button 
            type="button"
            onClick={() => toast.info("Catalog Reports", "Navigating to 14,000+ item SKU analytics.")}
            className="text-[11px] font-bold text-[#FA661C] hover:text-[#FF811A] link-interactive cursor-pointer"
          >
            Explore Full Product Leaderboard →
          </button>
        </div>
      </div>

      {/* 2. TOP VENDORS */}
      <div className="bg-white rounded-3xl border border-[#EAE3DC] p-5 sm:p-6 shadow-xs flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between pb-3 border-b border-[#EAE3DC]">
            <div className="flex items-center space-x-2">
              <span className="p-1 rounded-lg bg-[#FFF8F2] text-[#FA661C]">
                <Store className="w-4 h-4 text-[#FF811A]" />
              </span>
              <h3 className="font-['Outfit'] font-extrabold text-base text-[#FA661C]">
                Top Vendor Partnerships
              </h3>
            </div>
            <span className="text-[10px] font-bold text-[#6B6058]">By SLA Compliance</span>
          </div>

          <div className="my-3 space-y-2.5">
            {ADMIN_TOP_VENDORS.map((vendor, idx) => (
              <div 
                key={vendor.id}
                onClick={() => toast.info("Merchant Profile", `Opening scorecard for ${vendor.name}`)}
                className="flex items-center justify-between p-2 rounded-xl hover:bg-[#FFFFFF] transition-colors cursor-pointer group"
              >
                <div className="flex items-center space-x-3 truncate">
                  <span className="font-mono text-xs font-black text-[#FA661C] w-4">
                    #{idx + 1}
                  </span>
                  <div className="w-10 h-10 rounded-xl bg-[#FA661C] text-[#FF811A] font-black text-xs flex items-center justify-center shrink-0">
                    {vendor.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="truncate">
                    <h5 className="font-bold text-xs text-[#FA661C] truncate group-hover:text-[#E0530B] transition-colors">
                      {vendor.name}
                    </h5>
                    <p className="text-[10px] text-[#6B6058]">
                      {vendor.category} • {vendor.orders} Orders
                    </p>
                  </div>
                </div>

                <div className="text-right shrink-0 pl-2">
                  <span className="font-extrabold text-xs text-[#FA661C] bg-[#FFF8F2] border border-[#FF811A]/40 px-2 py-0.5 rounded-full block text-center">
                    {vendor.score}% SLA
                  </span>
                  <span className="text-[9px] text-[#6B6058] font-bold block mt-0.5">
                    {vendor.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="pt-3 border-t border-[#EAE3DC]/60 text-right">
          <button 
            type="button"
            onClick={() => toast.info("Merchant Audits", "Navigating to 3,400+ vendor directory.")}
            className="text-[11px] font-bold text-[#FA661C] hover:text-[#FF811A] link-interactive cursor-pointer"
          >
            Manage All Verified Merchants →
          </button>
        </div>
      </div>

    </div>
  );
}
