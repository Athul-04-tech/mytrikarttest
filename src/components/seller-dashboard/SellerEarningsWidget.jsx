import React from 'react';
import { Landmark, FileText, Info, AlertCircle, HelpCircle } from 'lucide-react';
import { formatCurrencyValue } from '../../data/sellerDashboardData';
import { useCountUp } from '../../hooks/useCountUp';
import { useToast } from '../../context/ToastContext';

function AnimatedEarningValue({ target, currency = 'INR' }) {
  const count = useCountUp(target, 750);
  return <span>{formatCurrencyValue(count, currency)}</span>;
}

export default function SellerEarningsWidget({
  earningsByCurrency,
  paidSettlementData,
  pendingSettlementOrderCount,
  selectedCurrency = 'INR',
  onNavigateToSettlements
}) {
  const toast = useToast();
  // Extract live values directly from API data or default to 0
  const currentEarnings = earningsByCurrency?.[selectedCurrency] || null;
  const grossValue = currentEarnings ? Number(currentEarnings.gross || 0) : 0;
  const commissionValue = currentEarnings ? Number(currentEarnings.commission || 0) : 0;
  const netValue = currentEarnings ? Number(currentEarnings.net || 0) : 0;

  const paidAmount = paidSettlementData?.amount_by_currency?.[selectedCurrency] !== undefined
    ? Number(paidSettlementData.amount_by_currency[selectedCurrency] || 0)
    : 0;

  const isApproximation = Boolean(paidSettlementData?.is_approximation);
  const approximationNote = paidSettlementData?.note || "Paid withdrawals are not linked to settlement ledger credits, so this cannot be attributed to individual settlements.";


  const handleOpenSettlements = () => {
    if (typeof onNavigateToSettlements === 'function') {
      onNavigateToSettlements();
    }
  };

  return (
    <section aria-labelledby="earnings-widget-heading" className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center space-x-2">
          <span className="p-1 rounded-lg bg-[#FFF8F2] text-[#FA661C]">
            <Landmark className="w-3.5 h-3.5 text-[#FF811A]" />
          </span>
          <h2 id="earnings-widget-heading" className="font-['Outfit'] font-extrabold text-sm uppercase tracking-wider text-[#FA661C]">
            Earnings & Settlements Breakdown
          </h2>
          {pendingSettlementOrderCount !== undefined && pendingSettlementOrderCount > 0 && (
            <span className="text-[10px] font-extrabold bg-[#FFF8F2] text-[#FA661C] border border-[#FF811A]/50 px-2 py-0.5 rounded-full">
              {pendingSettlementOrderCount} Pending Release
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={handleOpenSettlements}
          className="text-xs font-bold text-[#FA661C] hover:text-[#FF811A] link-interactive flex items-center space-x-1 cursor-pointer"
        >
          <FileText className="w-3.5 h-3.5" />
          <span>View Settlement Statement →</span>
        </button>
      </div>

      {/* Main Earnings Card with Prominent Net Earnings Feature */}
      <div className="bg-white rounded-3xl border border-[#EAE3DC] p-5 sm:p-6 shadow-xs space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
          
          {/* PROMINENT NET EARNINGS (Strongest Visual Treatment, Gold Accent) */}
          <div className="md:col-span-5 bg-gradient-to-br from-[#FA661C] via-[#16523F] to-[#0A2A1F] text-[#FFFFFF] p-5 rounded-2xl border border-[#FF811A]/50 shadow-md relative overflow-hidden flex flex-col justify-between min-h-[140px]">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#FF811A]/10 rounded-full blur-xl pointer-events-none" />
            
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-widest bg-[#FF811A] text-[#FA661C] px-2 py-0.5 rounded-full shadow-2xs">
                  NET EARNINGS ({selectedCurrency})
                </span>
                <span className="text-[10px] text-[#FF811A] font-bold">
                  After Marketplace Fees
                </span>
              </div>

              <div className="font-['Outfit'] font-black text-3xl sm:text-4xl text-[#FFFFFF] mt-3 tracking-tight">
                <AnimatedEarningValue target={netValue} currency={selectedCurrency} />
              </div>
            </div>

            <div className="mt-3 pt-2 border-t border-[#FFFFFF]/20 flex items-center justify-between text-[11px] text-[#FFFFFF]/80">
              <span>Next Payout Cycle:</span>
              <strong className="text-[#FF811A]">Not yet available</strong>
            </div>
          </div>

          {/* SATELLITE EARNING STATS (Gross, Commission, Pending, Paid) */}
          <div className="md:col-span-7 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            
            {/* Gross Earnings */}
            <div className="p-3 bg-[#FFFFFF] rounded-2xl border border-[#EAE3DC] flex flex-col justify-between">
              <span className="text-[10px] font-bold text-[#6B6058] uppercase">Gross Sales</span>
              <div className="font-['Outfit'] font-black text-base text-[#FA661C] mt-1">
                <AnimatedEarningValue target={grossValue} currency={selectedCurrency} />
              </div>
              <span className="text-[9px] text-[#6B6058] mt-1">100% Value</span>
            </div>

            {/* Commission Deducted */}
            <div className="p-3 bg-[#FFFFFF] rounded-2xl border border-[#EAE3DC] flex flex-col justify-between">
              <span className="text-[10px] font-bold text-[#6B6058] uppercase">− Commission</span>
              <div className="font-['Outfit'] font-black text-base text-[#D7263D] mt-1">
                <AnimatedEarningValue target={commissionValue} currency={selectedCurrency} />
              </div>
              <span className="text-[9px] text-[#6B6058] mt-1">Marketplace Rate</span>
            </div>

            {/* Pending Settlement */}
            <div className="p-3 bg-[#FFF8F2] rounded-2xl border border-[#FF811A]/50 flex flex-col justify-between">
              <span className="text-[10px] font-bold text-[#FA661C] uppercase">In Pipeline</span>
              <div className="font-['Outfit'] font-black text-base text-[#FA661C] mt-1">
                <AnimatedEarningValue target={netValue - paidAmount > 0 ? netValue - paidAmount : 0} currency={selectedCurrency} />
              </div>
              <span className="text-[9px] text-[#FA661C] font-bold mt-1">Pending Release</span>
            </div>

            {/* Paid Settlement (With Approximation Flag Surfaced) */}
            <div className="p-3 bg-[#FFFFFF] rounded-2xl border border-[#EAE3DC] flex flex-col justify-between relative group">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-[#6B6058] uppercase">Disbursed</span>
                {isApproximation && (
                  <span className="text-[9px] font-extrabold text-[#FF811A] bg-[#FFF8F2] border border-[#FF811A]/40 px-1 rounded flex items-center space-x-0.5">
                    <span>Approx.</span>
                    <HelpCircle className="w-2.5 h-2.5 text-[#FA661C]" />
                  </span>
                )}
              </div>

              <div className="font-['Outfit'] font-black text-base text-[#FA661C] mt-1">
                <AnimatedEarningValue target={paidAmount} currency={selectedCurrency} />
              </div>
              <span className="text-[9px] text-[#FA661C] font-bold mt-1">Paid Withdrawals ✓</span>
            </div>

          </div>

        </div>

        {/* Approximation Note Banner (SURFACED VISIBLY PER REQUIREMENT) */}
        {isApproximation && (
          <div className="p-3 rounded-2xl bg-[#FFF8F2]/80 border border-[#FF811A]/40 flex items-start space-x-2 text-[11px] text-[#FA661C]">
            <Info className="w-4 h-4 text-[#FF811A] shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block">Paid Settlement Attribution Note</span>
              <p className="text-[10px] text-[#6B6058] mt-0.5 leading-normal">
                {approximationNote}
              </p>
            </div>
          </div>
        )}

      </div>
    </section>
  );
}

