import React from 'react';
import { Landmark, FileText, Download, CheckCircle2, Clock, AlertCircle, ArrowDownRight } from 'lucide-react';
import { EARNINGS_WIDGET_DATA, formatSellerINR } from '../../../data/sellerDashboardData';
import { useToast } from '../../../context/ToastContext';

export default function SellerSettlementsView() {
  const data = EARNINGS_WIDGET_DATA;
  const toast = useToast();

  return (
    <div className="space-y-6 text-xs animate-reveal">
      
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-[#D8E0DC]">
        <div>
          <h2 className="font-['Outfit'] text-xl sm:text-2xl font-extrabold text-[#0F3D2E]">
            Settlements & Bank Remittances
          </h2>
          <p className="text-xs text-[#5C6B63] mt-0.5">
            Automated weekly NEFT/RTGS disbursements direct to your registered HDFC Current Account.
          </p>
        </div>

        <button
          type="button"
          onClick={() => toast.success("Settlement Ledger Exported", "Downloaded audited FY25-26 payout history (CSV).")}
          className="px-4 py-2 bg-[#0F3D2E] hover:bg-[#155440] text-[#FBF8F1] rounded-2xl font-black text-xs btn-interactive flex items-center space-x-1.5 shadow-xs cursor-pointer self-start sm:self-auto"
        >
          <Download className="w-4 h-4 text-[#D4AF37]" />
          <span>Export FY25-26 Ledger</span>
        </button>
      </div>

      {/* Payout Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Total Net Payout */}
        <div className="p-5 bg-gradient-to-br from-[#0F3D2E] to-[#16523F] text-[#FBF8F1] rounded-3xl border border-[#D4AF37]/50 shadow-md">
          <span className="text-[10px] font-black uppercase bg-[#D4AF37] text-[#0F3D2E] px-2 py-0.5 rounded-full">
            NET PAYABLE (30D)
          </span>
          <div className="font-['Outfit'] font-black text-2xl sm:text-3xl mt-3">
            {formatSellerINR(data.netEarnings)}
          </div>
          <span className="text-[10px] text-[#D4AF37] mt-1 block">
            Gross {formatSellerINR(data.grossEarnings)} − 10% Commission ({formatSellerINR(data.commissionDeducted)})
          </span>
        </div>

        {/* Pending Payout */}
        <div className="p-5 bg-white rounded-3xl border border-[#D8E0DC] shadow-xs flex flex-col justify-between">
          <div>
            <span className="text-[10px] font-bold text-[#5C6B63] uppercase">Upcoming Friday Payout</span>
            <div className="font-['Outfit'] font-black text-2xl text-[#0F3D2E] mt-2">
              {formatSellerINR(data.pendingSettlement)}
            </div>
          </div>
          <div className="mt-3 text-[10px] text-[#0F3D2E] font-bold flex items-center space-x-1">
            <Clock className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span>Disbursement Date: {data.nextPayoutDate}</span>
          </div>
        </div>

        {/* Disbursed Payout */}
        <div className="p-5 bg-white rounded-3xl border border-[#D8E0DC] shadow-xs flex flex-col justify-between">
          <div>
            <span className="text-[10px] font-bold text-[#5C6B63] uppercase">Total Disbursed (MTD)</span>
            <div className="font-['Outfit'] font-black text-2xl text-[#0F3D2E] mt-2">
              {formatSellerINR(data.paidSettlement)}
            </div>
          </div>
          <div className="mt-3 text-[10px] text-[#0F3D2E] font-bold flex items-center space-x-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#0F3D2E]" />
            <span>Remitted to HDFC Bank •••• 8492</span>
          </div>
        </div>

      </div>

      {/* Settlement Calculation Waterfall Table */}
      <div className="bg-white rounded-3xl border border-[#D8E0DC] p-5 sm:p-6 shadow-xs space-y-4">
        <h3 className="font-['Outfit'] font-bold text-base text-[#0F3D2E]">
          Mathematical Deduction Waterfall Breakdown (Batch {data.settlementBatchId})
        </h3>

        <div className="space-y-2.5 divide-y divide-[#D8E0DC]/50 text-xs">
          <div className="flex items-center justify-between pt-1">
            <span className="font-bold text-[#0F3D2E]">1. Gross Marketplace Sales Value (142 Completed Orders)</span>
            <span className="font-mono font-bold text-[#0F3D2E]">{formatSellerINR(data.grossEarnings)}</span>
          </div>
          <div className="flex items-center justify-between pt-2 text-[#C0392B]">
            <span>2. Less: Category Commission (Fixed 10.0% Tier)</span>
            <span className="font-mono font-bold">− {formatSellerINR(data.commissionDeducted)}</span>
          </div>
          <div className="flex items-center justify-between pt-2 text-[#0F3D2E] font-black border-t-2 border-[#0F3D2E]/20">
            <span>3. Net Merchant Payout (Line 1 − Line 2)</span>
            <span className="font-mono text-sm">{formatSellerINR(data.netEarnings)}</span>
          </div>
          <div className="flex items-center justify-between pt-2 text-[#5C6B63]">
            <span>4. Less: Previously Paid Remittances</span>
            <span className="font-mono">− {formatSellerINR(data.paidSettlement)}</span>
          </div>
          <div className="flex items-center justify-between pt-2 text-[#0F3D2E] font-bold bg-[#FCF7E8] p-2 rounded-xl">
            <span>5. Balance Due for Friday Payout Cycle (Line 3 − Line 4)</span>
            <span className="font-mono text-sm text-[#0F3D2E]">{formatSellerINR(data.pendingSettlement)}</span>
          </div>
        </div>
      </div>

    </div>
  );
}
