import React from 'react';
import { Landmark, ArrowUpRight, CheckCircle2, FileText, Info } from 'lucide-react';
import { EARNINGS_WIDGET_DATA, formatSellerINR } from '../../data/sellerDashboardData';
import { useCountUp } from '../../hooks/useCountUp';
import { useToast } from '../../context/ToastContext';

function AnimatedEarningValue({ target }) {
  const count = useCountUp(target, 750);
  return <span>{formatSellerINR(count)}</span>;
}

export default function SellerEarningsWidget({ onNavigateToSettlements }) {
  const toast = useToast();
  const data = EARNINGS_WIDGET_DATA;

  const handleDownloadStatement = () => {
    toast.success("Statement Exported", `Downloaded Settlement Batch ${data.settlementBatchId} (PDF)`);
  };

  return (
    <section aria-labelledby="earnings-widget-heading" className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="p-1 rounded-lg bg-[#FCF7E8] text-[#0F3D2E]">
            <Landmark className="w-3.5 h-3.5 text-[#D4AF37]" />
          </span>
          <h2 id="earnings-widget-heading" className="font-['Outfit'] font-extrabold text-sm uppercase tracking-wider text-[#0F3D2E]">
            Earnings & Settlements Breakdown
          </h2>
        </div>

        <button
          type="button"
          onClick={handleDownloadStatement}
          className="text-xs font-bold text-[#0F3D2E] hover:text-[#D4AF37] link-interactive flex items-center space-x-1 cursor-pointer"
        >
          <FileText className="w-3.5 h-3.5" />
          <span>View Settlement Statement →</span>
        </button>
      </div>

      {/* Main Earnings Card with Prominent Net Earnings Feature */}
      <div className="bg-white rounded-3xl border border-[#D8E0DC] p-5 sm:p-6 shadow-xs">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
          
          {/* PROMINENT NET EARNINGS (Strongest Visual Treatment, Gold Accent) */}
          <div className="md:col-span-5 bg-gradient-to-br from-[#0F3D2E] via-[#16523F] to-[#0A2A1F] text-[#FBF8F1] p-5 rounded-2xl border border-[#D4AF37]/50 shadow-md relative overflow-hidden flex flex-col justify-between min-h-[140px]">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#D4AF37]/10 rounded-full blur-xl pointer-events-none" />
            
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-widest bg-[#D4AF37] text-[#0F3D2E] px-2 py-0.5 rounded-full shadow-2xs">
                  NET EARNINGS
                </span>
                <span className="text-[10px] text-[#D4AF37] font-bold">
                  After 10% Commission
                </span>
              </div>

              <div className="font-['Outfit'] font-black text-3xl sm:text-4xl text-[#FBF8F1] mt-3 tracking-tight">
                <AnimatedEarningValue target={data.netEarnings} />
              </div>
            </div>

            <div className="mt-3 pt-2 border-t border-[#FBF8F1]/20 flex items-center justify-between text-[11px] text-[#FBF8F1]/80">
              <span>Next Payout Cycle:</span>
              <strong className="text-[#D4AF37]">{data.nextPayoutDate}</strong>
            </div>
          </div>

          {/* SATELLITE EARNING STATS (Gross, Commission, Pending, Paid) */}
          <div className="md:col-span-7 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            
            {/* Gross Earnings */}
            <div className="p-3 bg-[#FBF8F1] rounded-2xl border border-[#D8E0DC] flex flex-col justify-between">
              <span className="text-[10px] font-bold text-[#5C6B63] uppercase">Gross Sales</span>
              <div className="font-['Outfit'] font-black text-base text-[#0F3D2E] mt-1">
                <AnimatedEarningValue target={data.grossEarnings} />
              </div>
              <span className="text-[9px] text-[#5C6B63] mt-1">100% Value</span>
            </div>

            {/* Commission Deducted */}
            <div className="p-3 bg-[#FBF8F1] rounded-2xl border border-[#D8E0DC] flex flex-col justify-between">
              <span className="text-[10px] font-bold text-[#5C6B63] uppercase">− Commission</span>
              <div className="font-['Outfit'] font-black text-base text-[#C0392B] mt-1">
                <AnimatedEarningValue target={data.commissionDeducted} />
              </div>
              <span className="text-[9px] text-[#5C6B63] mt-1">10.0% Rate</span>
            </div>

            {/* Pending Settlement */}
            <div className="p-3 bg-[#FCF7E8] rounded-2xl border border-[#D4AF37]/50 flex flex-col justify-between">
              <span className="text-[10px] font-bold text-[#0F3D2E] uppercase">In Pipeline</span>
              <div className="font-['Outfit'] font-black text-base text-[#0F3D2E] mt-1">
                <AnimatedEarningValue target={data.pendingSettlement} />
              </div>
              <span className="text-[9px] text-[#0F3D2E] font-bold mt-1">Pending Release</span>
            </div>

            {/* Paid Settlement */}
            <div className="p-3 bg-[#FBF8F1] rounded-2xl border border-[#D8E0DC] flex flex-col justify-between">
              <span className="text-[10px] font-bold text-[#5C6B63] uppercase">Disbursed</span>
              <div className="font-['Outfit'] font-black text-base text-[#0F3D2E] mt-1">
                <AnimatedEarningValue target={data.paidSettlement} />
              </div>
              <span className="text-[9px] text-[#0F3D2E] font-bold mt-1">Direct to Bank ✓</span>
            </div>

          </div>

        </div>
      </div>
    </section>
  );
}
