import React, { useState } from 'react';
import { MASTER_VENDORS } from '../../../data/adminFinanceEngine';
import { Store, UserCheck, ShieldAlert, CheckCircle2, Star, AlertCircle } from 'lucide-react';
import { useToast } from '../../../context/ToastContext';

export default function VendorHubModule() {
  const [vendors, setVendors] = useState(MASTER_VENDORS);
  const toast = useToast();

  const handleApproveKYC = (vendor) => {
    setVendors(prev => prev.map(v => v.id === vendor.id ? { ...v, kycStatus: 'Approved' } : v));
    toast.success("Merchant Approved", `${vendor.name} KYC & Bank account verified successfully.`);
  };

  const pendingCount = vendors.filter(v => v.kycStatus === 'Pending Review').length;

  return (
    <div className="space-y-6">
      
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#EAE3DC]">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-1 rounded-lg bg-[#FFF8F2] text-[#FA661C]">
              <Store className="w-4 h-4 text-[#FF811A]" />
            </span>
            <h2 className="font-['Outfit'] font-black text-xl text-[#FA661C]">
              Vendor & Seller Hub Directory
            </h2>
          </div>
          <p className="text-xs text-[#6B6058] mt-0.5">
            Merchant Governance: Registration Approvals, GSTIN/PAN Verification, Commission Tiers & SLA Compliance.
          </p>
        </div>

        <span className="text-xs font-bold text-[#D7263D] bg-[#FDE8EA] border border-[#D7263D]/30 px-3 py-1.5 rounded-xl self-start sm:self-auto flex items-center space-x-1.5">
          <AlertCircle className="w-4 h-4" />
          <span>{pendingCount} Pending KYC Approvals</span>
        </span>
      </div>

      {/* 2. Vendor Table */}
      <div className="bg-white rounded-2xl border border-[#EAE3DC] overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#FFF3EC] text-[#FA661C] border-b border-[#EAE3DC] font-extrabold uppercase text-[10px] tracking-wider">
                <th className="p-3">Merchant Name</th>
                <th className="p-3">Jurisdiction & GSTIN</th>
                <th className="p-3">Category</th>
                <th className="p-3 text-center">Commission</th>
                <th className="p-3 text-center">SLA Score</th>
                <th className="p-3 text-center">KYC Status</th>
                <th className="p-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EAE3DC]/60 font-medium">
              {vendors.map((vendor) => {
                const isPending = vendor.kycStatus === 'Pending Review';

                return (
                  <tr key={vendor.id} className="hover:bg-[#FFFFFF] transition-colors">
                    <td className="p-3">
                      <div className="font-bold text-[#FA661C] text-xs">{vendor.name}</div>
                      <div className="text-[10px] text-[#6B6058]">{vendor.bankAccount}</div>
                    </td>
                    <td className="p-3">
                      <span className="font-bold text-[#FA661C] block">{vendor.state} ({vendor.stateCode})</span>
                      <span className="font-mono text-[10px] text-[#6B6058]">{vendor.gstin}</span>
                    </td>
                    <td className="p-3 text-[#6B6058]">
                      {vendor.category}
                    </td>
                    <td className="p-3 text-center font-black text-[#FA661C]">
                      {(vendor.commissionRate * 100).toFixed(0)}%
                    </td>
                    <td className="p-3 text-center">
                      <span className="bg-[#FFF8F2] text-[#FA661C] font-extrabold px-2 py-0.5 rounded-full border border-[#FF811A]/40">
                        {vendor.slaScore}%
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                        isPending
                          ? 'bg-[#FDE8EA] text-[#D7263D] border border-[#D7263D]/40 animate-pulse'
                          : 'bg-[#FFF3EC] text-[#FA661C]'
                      }`}>
                        {vendor.kycStatus}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      {isPending ? (
                        <button
                          type="button"
                          onClick={() => handleApproveKYC(vendor)}
                          className="px-3 py-1.5 rounded-xl bg-[#FA661C] text-[#FF811A] font-bold text-[10px] btn-interactive cursor-pointer shadow-xs"
                        >
                          Approve KYC
                        </button>
                      ) : (
                        <span className="text-[10px] text-[#FA661C] font-bold">Verified ✓</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
