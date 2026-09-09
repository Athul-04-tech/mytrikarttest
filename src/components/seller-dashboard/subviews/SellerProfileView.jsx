import React, { useState, useEffect } from 'react';
import { User, ShieldCheck, Landmark, FileText, CheckCircle2, Award } from 'lucide-react';
import { apiRequest } from '../../../utils/api';

export default function SellerProfileView() {
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function fetchProfile() {
      try {
        const data = await apiRequest('/api/vendors/me/');
        if (isMounted) setProfile(data);
      } catch (err) {
        console.warn("Failed to load vendor profile:", err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    fetchProfile();
    return () => { isMounted = false; };
  }, []);

  const legalName = profile?.business_name || 'Not yet available';
  const storeName = profile?.store_name || 'Not yet available';
  const gstin = profile?.tax_id || 'Not yet available';
  const registrationNumber = profile?.registration_number || 'Not yet available';
  const businessType = profile?.business_type || 'Not yet available';
  const onboardingStatus = profile?.onboarding_status ? profile.onboarding_status.toUpperCase() : 'Not yet available';

  return (
    <div className="space-y-6 text-xs animate-reveal">
      <div className="pb-3 border-b border-[#EAE3DC]">
        <h2 className="font-['Outfit'] text-xl sm:text-2xl font-extrabold text-[#FA661C]">
          Merchant Profile & KYC Dossier
        </h2>
        <p className="text-xs text-[#6B6058] mt-0.5">
          Verified corporate credentials, GSTIN registration certificate, and designated settlement bank.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        
        {/* Business Entity Details */}
        <div className="bg-white rounded-3xl border border-[#EAE3DC] p-6 shadow-xs space-y-3">
          <div className="flex items-center space-x-2 text-[#FA661C] font-bold text-sm">
            <ShieldCheck className="w-4 h-4 text-[#FF811A]" />
            <span>Business Entity Information</span>
          </div>

          <div className="space-y-2 text-xs divide-y divide-[#EAE3DC]/50">
            <div className="pt-2 flex justify-between">
              <span className="text-[#6B6058]">Legal Name:</span>
              <span className="font-bold text-[#FA661C]">{legalName}</span>
            </div>
            <div className="pt-2 flex justify-between">
              <span className="text-[#6B6058]">Display Store:</span>
              <span className="font-bold text-[#FA661C]">{storeName}</span>
            </div>
            <div className="pt-2 flex justify-between">
              <span className="text-[#6B6058]">Business Type:</span>
              <span className="font-bold text-[#FA661C] capitalize">{businessType}</span>
            </div>
            <div className="pt-2 flex justify-between">
              <span className="text-[#6B6058]">Registration Number:</span>
              <span className="font-mono font-bold text-[#FA661C]">{registrationNumber}</span>
            </div>
            <div className="pt-2 flex justify-between">
              <span className="text-[#6B6058]">GSTIN / Tax ID:</span>
              <span className="font-mono font-bold text-[#FA661C]">{gstin}</span>
            </div>
            <div className="pt-2 flex justify-between">
              <span className="text-[#6B6058]">KYC Verification Status:</span>
              <span className="font-bold text-[#FA661C] bg-[#FFF3EC] px-2 py-0.5 rounded-full flex items-center space-x-1">
                <CheckCircle2 className="w-3 h-3 text-[#FA661C]" />
                <span>{onboardingStatus}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Bank & Settlement Account */}
        <div className="bg-white rounded-3xl border border-[#EAE3DC] p-6 shadow-xs space-y-3">
          <div className="flex items-center space-x-2 text-[#FA661C] font-bold text-sm">
            <Landmark className="w-4 h-4 text-[#FF811A]" />
            <span>Designated Remittance Bank</span>
          </div>

          <div className="space-y-2 text-xs divide-y divide-[#EAE3DC]/50">
            <div className="pt-2 flex justify-between">
              <span className="text-[#6B6058]">Bank Name:</span>
              <span className="font-bold text-[#FA661C]">Not yet available</span>
            </div>
            <div className="pt-2 flex justify-between">
              <span className="text-[#6B6058]">Account Number:</span>
              <span className="font-mono font-bold text-[#FA661C]">Not yet available</span>
            </div>
            <div className="pt-2 flex justify-between">
              <span className="text-[#6B6058]">IFSC Code:</span>
              <span className="font-mono font-bold text-[#FA661C]">Not yet available</span>
            </div>
            <div className="pt-2 flex justify-between">
              <span className="text-[#6B6058]">Branch:</span>
              <span className="font-bold text-[#FA661C]">Not yet available</span>
            </div>
            <div className="pt-2 flex justify-between">
              <span className="text-[#6B6058]">Account Type:</span>
              <span className="font-bold text-[#FA661C]">Not yet available</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
