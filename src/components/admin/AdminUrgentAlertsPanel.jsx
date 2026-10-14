import React from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, Store, PackageCheck, CheckCircle2, ArrowRight } from 'lucide-react';

export default function AdminUrgentAlertsPanel({ overviewData }) {
  const pendingVendors = (overviewData?.vendors?.by_onboarding_status?.under_review ?? 0) +
                         (overviewData?.vendors?.by_onboarding_status?.resubmit_required ?? 0);
  const pendingProducts = overviewData?.products?.pending_review ?? 0;

  const totalUrgent = (pendingVendors > 0 ? 1 : 0) + (pendingProducts > 0 ? 1 : 0);

  return (
    <div className="bg-white rounded-3xl border border-[#EAE3DC] p-5 sm:p-6 shadow-xs">
      
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[#EAE3DC] gap-2">
        <div className="flex items-center space-x-2 min-w-0">
          <span className={`p-1 rounded-lg shrink-0 ${totalUrgent > 0 ? 'bg-[#FDE8EA] text-[#D7263D]' : 'bg-[#FFF3EC] text-[#FA661C]'}`}>
            <AlertTriangle className="w-4 h-4" />
          </span>
          <h3 className="font-['Outfit'] font-extrabold text-sm sm:text-base text-[#FA661C] leading-snug truncate">
            Urgent Operational & Compliance Alerts
          </h3>
        </div>

        <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full shrink-0 ${
          totalUrgent > 0 
            ? 'bg-[#FDE8EA] text-[#D7263D] border border-[#D7263D]/30 animate-pulse'
            : 'bg-[#FFF3EC] text-[#FA661C] border border-[#FA661C]/20'
        }`}>
          {totalUrgent > 0 ? `${totalUrgent} Action Needed` : 'All Clear'}
        </span>
      </div>

      {/* Alerts Body */}
      <div className="mt-4 space-y-3">
        
        {/* Pending Vendors Alert */}
        {pendingVendors > 0 && (
          <div className="p-3.5 rounded-2xl bg-[#FDE8EA]/40 border border-[#D7263D]/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start space-x-3 min-w-0">
              <span className="p-1.5 rounded-xl bg-[#FDE8EA] text-[#D7263D] shrink-0 mt-0.5">
                <Store className="w-4 h-4" />
              </span>
              <div className="min-w-0">
                <h4 className="font-bold text-xs text-[#FA661C]">
                  {pendingVendors} Merchant Onboarding{pendingVendors > 1 ? 's' : ''} Pending KYC Review
                </h4>
                <p className="text-[11px] text-[#6B6058] mt-0.5">
                  Vendor profiles are waiting for identity and GSTIN verification.
                </p>
              </div>
            </div>

            <Link
              to="/admin/vendors"
              className="w-full sm:w-auto justify-center px-3.5 py-2 rounded-xl bg-[#FA661C] text-white text-xs font-bold shrink-0 btn-interactive flex items-center space-x-1.5 shadow-2xs"
            >
              <span>Review Vendors</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}

        {/* Pending Product Reviews Alert */}
        {pendingProducts > 0 && (
          <div className="p-3.5 rounded-2xl bg-[#FDE8EA]/40 border border-[#D7263D]/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start space-x-3 min-w-0">
              <span className="p-1.5 rounded-xl bg-[#FDE8EA] text-[#D7263D] shrink-0 mt-0.5">
                <PackageCheck className="w-4 h-4" />
              </span>
              <div className="min-w-0">
                <h4 className="font-bold text-xs text-[#FA661C]">
                  {pendingProducts} Product Listing{pendingProducts > 1 ? 's' : ''} Awaiting Moderation
                </h4>
                <p className="text-[11px] text-[#6B6058] mt-0.5">
                  Vendor product submissions are queued in the review desk.
                </p>
              </div>
            </div>

            <Link
              to="/admin/products"
              className="w-full sm:w-auto justify-center px-3.5 py-2 rounded-xl bg-[#FA661C] text-white text-xs font-bold shrink-0 btn-interactive flex items-center space-x-1.5 shadow-2xs"
            >
              <span>Open Queue</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}

        {/* Clear State if no urgent alerts */}
        {totalUrgent === 0 && (
          <div className="p-5 bg-[#FFF8F2]/50 border border-dashed border-[#EAE3DC] rounded-2xl text-center space-y-1.5">
            <div className="w-8 h-8 rounded-full bg-[#FFF3EC] text-[#52B788] mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <h4 className="font-['Outfit'] font-bold text-xs text-[#FA661C]">
              No Urgent Operational Alerts
            </h4>
            <p className="text-[11px] text-[#6B6058]">
              All merchant onboardings and product listings are reviewed up to date.
            </p>
          </div>
        )}

      </div>

    </div>
  );
}
