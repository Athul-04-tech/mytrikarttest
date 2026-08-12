import React from 'react';
import { User, ShieldCheck, Landmark, FileText, CheckCircle2, Award } from 'lucide-react';
import { SELLER_PROFILE } from '../../../data/sellerDashboardData';

export default function SellerProfileView() {
  return (
    <div className="space-y-6 text-xs animate-reveal">
      <div className="pb-3 border-b border-[#D8E0DC]">
        <h2 className="font-['Outfit'] text-xl sm:text-2xl font-extrabold text-[#0F3D2E]">
          Merchant Profile & KYC Dossier
        </h2>
        <p className="text-xs text-[#5C6B63] mt-0.5">
          Verified corporate credentials, GSTIN registration certificate, and designated settlement bank.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        
        {/* Business Entity Details */}
        <div className="bg-white rounded-3xl border border-[#D8E0DC] p-6 shadow-xs space-y-3">
          <div className="flex items-center space-x-2 text-[#0F3D2E] font-bold text-sm">
            <ShieldCheck className="w-4 h-4 text-[#D4AF37]" />
            <span>Business Entity Information</span>
          </div>

          <div className="space-y-2 text-xs divide-y divide-[#D8E0DC]/50">
            <div className="pt-2 flex justify-between">
              <span className="text-[#5C6B63]">Legal Name:</span>
              <span className="font-bold text-[#0F3D2E]">{SELLER_PROFILE.legalName}</span>
            </div>
            <div className="pt-2 flex justify-between">
              <span className="text-[#5C6B63]">Display Store:</span>
              <span className="font-bold text-[#0F3D2E]">{SELLER_PROFILE.storeName}</span>
            </div>
            <div className="pt-2 flex justify-between">
              <span className="text-[#5C6B63]">GSTIN Number:</span>
              <span className="font-mono font-bold text-[#0F3D2E]">27AAAAA0000A1Z5</span>
            </div>
            <div className="pt-2 flex justify-between">
              <span className="text-[#5C6B63]">PAN Entity:</span>
              <span className="font-mono font-bold text-[#0F3D2E]">AAACA1234F</span>
            </div>
            <div className="pt-2 flex justify-between">
              <span className="text-[#5C6B63]">KYC Verification:</span>
              <span className="font-bold text-[#0F3D2E] bg-[#E8F2EE] px-2 py-0.5 rounded-full flex items-center space-x-1">
                <CheckCircle2 className="w-3 h-3 text-[#0F3D2E]" />
                <span>Verified 100% (Gold Tier)</span>
              </span>
            </div>
          </div>
        </div>

        {/* Bank & Settlement Account */}
        <div className="bg-white rounded-3xl border border-[#D8E0DC] p-6 shadow-xs space-y-3">
          <div className="flex items-center space-x-2 text-[#0F3D2E] font-bold text-sm">
            <Landmark className="w-4 h-4 text-[#D4AF37]" />
            <span>Designated Remittance Bank</span>
          </div>

          <div className="space-y-2 text-xs divide-y divide-[#D8E0DC]/50">
            <div className="pt-2 flex justify-between">
              <span className="text-[#5C6B63]">Bank Name:</span>
              <span className="font-bold text-[#0F3D2E]">HDFC Bank Limited</span>
            </div>
            <div className="pt-2 flex justify-between">
              <span className="text-[#5C6B63]">Account Number:</span>
              <span className="font-mono font-bold text-[#0F3D2E]">50200084920192</span>
            </div>
            <div className="pt-2 flex justify-between">
              <span className="text-[#5C6B63]">IFSC Code:</span>
              <span className="font-mono font-bold text-[#0F3D2E]">HDFC0000240</span>
            </div>
            <div className="pt-2 flex justify-between">
              <span className="text-[#5C6B63]">Branch:</span>
              <span className="font-bold text-[#0F3D2E]">Fort Branch, Mumbai</span>
            </div>
            <div className="pt-2 flex justify-between">
              <span className="text-[#5C6B63]">Account Type:</span>
              <span className="font-bold text-[#0F3D2E]">Current Commercial Account</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
