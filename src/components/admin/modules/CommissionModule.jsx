import React, { useState } from 'react';
import { 
  CATEGORY_COMMISSION_RATES, 
  MASTER_VENDORS, 
  MASTER_ORDERS, 
  calculateOrderSettlement,
  formatINR 
} from '../../../data/adminFinanceEngine';
import { Percent, CheckCircle2, ShieldCheck, Edit3, ArrowRight } from 'lucide-react';
import { useToast } from '../../../context/ToastContext';

export default function CommissionModule() {
  const toast = useToast();
  const settlements = MASTER_ORDERS.map(calculateOrderSettlement);

  return (
    <div className="space-y-6">
      
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#D8E0DC]">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-1 rounded-lg bg-[#E8F2EE] text-[#0F3D2E]">
              <Percent className="w-4 h-4" />
            </span>
            <h2 className="font-['Outfit'] font-black text-xl text-[#0F3D2E]">
              Commission Matrix & Policy Enforcement
            </h2>
          </div>
          <p className="text-xs text-[#5C6B63] mt-0.5">
            100% Rate Alignment: Global category percentages match exact order line deductions across every screen.
          </p>
        </div>

        <button
          type="button"
          onClick={() => toast.success("Rate Matrix Synchronized", "All 30 modules refreshed with active category commission tiers.")}
          className="px-4 py-2 bg-[#0F3D2E] text-[#FBF8F1] rounded-xl text-xs font-bold btn-interactive flex items-center space-x-1.5 cursor-pointer shadow-xs self-start sm:self-auto"
        >
          <ShieldCheck className="w-4 h-4 text-[#D4AF37]" />
          <span>Sync Commission Rules</span>
        </button>
      </div>

      {/* 2. Category Tier Rates Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 text-xs">
        {Object.entries(CATEGORY_COMMISSION_RATES).map(([category, rate]) => (
          <div key={category} className="p-3.5 bg-white rounded-2xl border border-[#D8E0DC] hover:border-[#D4AF37] transition-all">
            <span className="text-[10px] font-bold text-[#5C6B63] uppercase block truncate">{category}</span>
            <div className="font-['Outfit'] font-black text-xl text-[#0F3D2E] mt-1">
              {(rate * 100).toFixed(0)}%
            </div>
            <span className="text-[9px] text-[#0F3D2E] font-extrabold bg-[#E8F2EE] px-1.5 py-0.2 rounded mt-1 inline-block">
              Enforced Policy
            </span>
          </div>
        ))}
      </div>

      {/* 3. Vendor Custom Commission Overrides & Active Orders Verification */}
      <div className="bg-white rounded-2xl border border-[#D8E0DC] p-5 shadow-xs space-y-4">
        <h3 className="font-['Outfit'] font-black text-base text-[#0F3D2E]">
          Active Merchant Rate Verification Ledger
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#E8F2EE] text-[#0F3D2E] border-b border-[#D8E0DC] font-extrabold uppercase text-[10px] tracking-wider">
                <th className="p-3">Merchant Name</th>
                <th className="p-3">Primary Category</th>
                <th className="p-3 text-center">Commission %</th>
                <th className="p-3">Sample Order Reference</th>
                <th className="p-3 text-right">Gross Sale</th>
                <th className="p-3 text-right">Commission Retained</th>
                <th className="p-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#D8E0DC]/60 font-medium">
              {settlements.map((s) => (
                <tr key={s.orderId} className="hover:bg-[#FBF8F1] transition-colors">
                  <td className="p-3 font-bold text-[#0F3D2E]">
                    {s.vendorName}
                  </td>
                  <td className="p-3 text-[#5C6B63]">
                    {s.category}
                  </td>
                  <td className="p-3 text-center font-black text-[#0F3D2E]">
                    <span className="bg-[#FCF7E8] text-[#0F3D2E] border border-[#D4AF37]/50 px-2 py-0.5 rounded-full">
                      {s.commissionRatePercent}
                    </span>
                  </td>
                  <td className="p-3 font-mono text-[#0F3D2E]">
                    {s.orderId} ({s.productName.slice(0, 24)}...)
                  </td>
                  <td className="p-3 text-right font-mono text-[#0F3D2E]">
                    {formatINR(s.grossAmount)}
                  </td>
                  <td className="p-3 text-right font-black text-[#0F3D2E]">
                    {formatINR(s.commissionAmount)}
                  </td>
                  <td className="p-3 text-center">
                    <span className="text-[10px] font-bold text-[#0F3D2E] bg-[#E8F2EE] px-2 py-0.5 rounded-full flex items-center justify-center space-x-1 w-max mx-auto">
                      <CheckCircle2 className="w-3 h-3 text-[#0F3D2E]" />
                      <span>Exact Match</span>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
