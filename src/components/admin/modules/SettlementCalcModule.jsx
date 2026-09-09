import React, { useState } from 'react';
import { 
  MASTER_ORDERS, 
  calculateOrderSettlement, 
  getMasterFinancialSummaries, 
  formatINR 
} from '../../../data/adminFinanceEngine';
import { Landmark, ArrowRight, CheckCircle2, Calculator, Info, FileSpreadsheet } from 'lucide-react';
import { useToast } from '../../../context/ToastContext';

export default function SettlementCalcModule() {
  const [selectedSettlement, setSelectedSettlement] = useState(null);
  const toast = useToast();

  const summary = getMasterFinancialSummaries();
  const settlements = MASTER_ORDERS.map(calculateOrderSettlement);

  return (
    <div className="space-y-6">
      
      {/* 1. Header & Financial Summary Ribbon */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#EAE3DC]">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-1 rounded-lg bg-[#FFF3EC] text-[#FA661C]">
              <Calculator className="w-4 h-4" />
            </span>
            <h2 className="font-['Outfit'] font-black text-xl text-[#FA661C]">
              Settlement Calculation & Deduction Engine
            </h2>
          </div>
          <p className="text-xs text-[#6B6058] mt-0.5">
            Strict Formula: Gross Sales − Commission − Logistics − Platform Fee − Gateway − TDS (1%) − TCS (1%) = Final Settlement
          </p>
        </div>

        <button
          type="button"
          onClick={() => toast.success("Ledger Exported", "Settlement calculation waterfall exported to CSV.")}
          className="px-4 py-2 bg-[#FA661C] text-[#FFFFFF] rounded-xl text-xs font-bold btn-interactive flex items-center space-x-1.5 cursor-pointer shadow-xs self-start sm:self-auto"
        >
          <FileSpreadsheet className="w-4 h-4 text-[#FF811A]" />
          <span>Export Settlement Sheet</span>
        </button>
      </div>

      {/* 2. Top Aggregate Vitals */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5 text-xs">
        <div className="p-3 bg-[#FFFFFF] rounded-2xl border border-[#EAE3DC]">
          <span className="text-[10px] font-bold text-[#6B6058] uppercase">Gross Sales</span>
          <div className="font-['Outfit'] font-black text-sm text-[#FA661C] mt-0.5">
            {formatINR(summary.totalGrossSales)}
          </div>
        </div>

        <div className="p-3 bg-[#FFFFFF] rounded-2xl border border-[#EAE3DC]">
          <span className="text-[10px] font-bold text-[#6B6058] uppercase">− Commissions</span>
          <div className="font-['Outfit'] font-black text-sm text-[#D7263D] mt-0.5">
            {formatINR(summary.totalCommissions)}
          </div>
        </div>

        <div className="p-3 bg-[#FFFFFF] rounded-2xl border border-[#EAE3DC]">
          <span className="text-[10px] font-bold text-[#6B6058] uppercase">− Logistics</span>
          <div className="font-['Outfit'] font-black text-sm text-[#D7263D] mt-0.5">
            {formatINR(summary.totalLogistics)}
          </div>
        </div>

        <div className="p-3 bg-[#FFFFFF] rounded-2xl border border-[#EAE3DC]">
          <span className="text-[10px] font-bold text-[#6B6058] uppercase">− Platform Fee</span>
          <div className="font-['Outfit'] font-black text-sm text-[#D7263D] mt-0.5">
            {formatINR(summary.totalPlatformFees)}
          </div>
        </div>

        <div className="p-3 bg-[#FFFFFF] rounded-2xl border border-[#EAE3DC]">
          <span className="text-[10px] font-bold text-[#6B6058] uppercase">− Gateway Fee</span>
          <div className="font-['Outfit'] font-black text-sm text-[#D7263D] mt-0.5">
            {formatINR(summary.totalGateway)}
          </div>
        </div>

        <div className="p-3 bg-[#FFFFFF] rounded-2xl border border-[#EAE3DC]">
          <span className="text-[10px] font-bold text-[#6B6058] uppercase">− TDS & TCS</span>
          <div className="font-['Outfit'] font-black text-sm text-[#D7263D] mt-0.5">
            {formatINR(summary.totalTDS + summary.totalTCS)}
          </div>
        </div>

        <div className="p-3 bg-[#FFF8F2] rounded-2xl border border-[#FF811A]/60 col-span-2 sm:col-span-1">
          <span className="text-[10px] font-bold text-[#FA661C] uppercase">Net Vendor Payout</span>
          <div className="font-['Outfit'] font-black text-sm text-[#FA661C] mt-0.5">
            {formatINR(summary.totalNetSettlements)}
          </div>
        </div>
      </div>

      {/* 3. Detailed Waterfall Table */}
      <div className="bg-white rounded-2xl border border-[#EAE3DC] overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#FFF3EC] text-[#FA661C] border-b border-[#EAE3DC] font-extrabold uppercase text-[10px] tracking-wider">
                <th className="p-3">Order ID</th>
                <th className="p-3">Merchant / Product</th>
                <th className="p-3 text-right">Gross</th>
                <th className="p-3 text-right">Comm.</th>
                <th className="p-3 text-right">Logistics</th>
                <th className="p-3 text-right">Platform</th>
                <th className="p-3 text-right">Gateway</th>
                <th className="p-3 text-right">TDS (1%)</th>
                <th className="p-3 text-right">TCS (1%)</th>
                <th className="p-3 text-right font-black text-[#FA661C] bg-[#FFF8F2]">Net Settlement</th>
                <th className="p-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EAE3DC]/60 font-medium">
              {settlements.map((item) => (
                <tr key={item.orderId} className="hover:bg-[#FFFFFF] transition-colors group">
                  <td className="p-3 font-mono font-bold text-[#FA661C]">
                    {item.orderId}
                  </td>
                  <td className="p-3">
                    <div className="font-bold text-[#FA661C] truncate max-w-[180px]">{item.vendorName}</div>
                    <div className="text-[10px] text-[#6B6058] truncate max-w-[180px]">{item.productName}</div>
                  </td>
                  <td className="p-3 text-right font-black text-[#FA661C]">
                    {formatINR(item.grossAmount)}
                  </td>
                  <td className="p-3 text-right text-[#D7263D]">
                    -{formatINR(item.commissionAmount)}
                    <span className="text-[9px] text-[#6B6058] block">({item.commissionRatePercent})</span>
                  </td>
                  <td className="p-3 text-right text-[#D7263D]">
                    -{formatINR(item.logisticsFee)}
                  </td>
                  <td className="p-3 text-right text-[#D7263D]">
                    -{formatINR(item.platformFee)}
                  </td>
                  <td className="p-3 text-right text-[#D7263D]">
                    -{formatINR(item.gatewayCharges)}
                  </td>
                  <td className="p-3 text-right text-[#6B6058]">
                    -{formatINR(item.tds)}
                  </td>
                  <td className="p-3 text-right text-[#6B6058]">
                    -{formatINR(item.tcs)}
                  </td>
                  <td className="p-3 text-right font-black text-[#FA661C] bg-[#FFF8F2]/60">
                    {formatINR(item.finalSettlement)}
                  </td>
                  <td className="p-3 text-center">
                    <button
                      type="button"
                      onClick={() => setSelectedSettlement(item)}
                      className="px-2 py-1 rounded-lg bg-[#FA661C] text-[#FF811A] font-bold text-[10px] btn-interactive cursor-pointer shadow-2xs"
                    >
                      Audit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. Detailed Deduction Inspection Modal */}
      {selectedSettlement && (
        <div className="fixed inset-0 bg-[#FA661C]/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-[#FF811A] max-w-lg w-full p-6 shadow-2xl space-y-4 animate-dropdown text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-[#EAE3DC]">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#FF811A] bg-[#FA661C] px-2 py-0.5 rounded">
                  ARITHMETIC WATERFALL AUDIT
                </span>
                <h3 className="font-['Outfit'] font-black text-lg text-[#FA661C] mt-1">
                  Settlement Breakdown: {selectedSettlement.orderId}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedSettlement(null)}
                className="p-1 rounded-lg text-[#6B6058] hover:text-[#FA661C]"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 font-mono text-xs">
              <div className="flex justify-between py-1 border-b border-[#EAE3DC]/50 font-bold text-[#FA661C]">
                <span>Gross Customer Payment</span>
                <span>+{formatINR(selectedSettlement.grossAmount)}</span>
              </div>
              <div className="flex justify-between py-1 text-[#D7263D]">
                <span>Less Commission ({selectedSettlement.commissionRatePercent})</span>
                <span>−{formatINR(selectedSettlement.commissionAmount)}</span>
              </div>
              <div className="flex justify-between py-1 text-[#D7263D]">
                <span>Less Logistics Courier Fee</span>
                <span>−{formatINR(selectedSettlement.logisticsFee)}</span>
              </div>
              <div className="flex justify-between py-1 text-[#D7263D]">
                <span>Less Marketplace Platform Fee (2%)</span>
                <span>−{formatINR(selectedSettlement.platformFee)}</span>
              </div>
              <div className="flex justify-between py-1 text-[#D7263D]">
                <span>Less Payment Gateway Fee (2% + 18% GST)</span>
                <span>−{formatINR(selectedSettlement.gatewayCharges)}</span>
              </div>
              <div className="flex justify-between py-1 text-[#6B6058]">
                <span>Less TDS u/s 194-O (1% of Gross)</span>
                <span>−{formatINR(selectedSettlement.tds)}</span>
              </div>
              <div className="flex justify-between py-1 text-[#6B6058]">
                <span>Less TCS under GST Sec 52 (1% Taxable)</span>
                <span>−{formatINR(selectedSettlement.tcs)}</span>
              </div>

              <div className="flex justify-between py-2 border-t-2 border-[#FA661C] font-black text-sm text-[#FA661C] bg-[#FFF8F2] px-3 rounded-xl mt-2">
                <span>Final Net Merchant Payout</span>
                <span>{formatINR(selectedSettlement.finalSettlement)}</span>
              </div>
            </div>

            <div className="text-[11px] text-[#6B6058] bg-[#FFFFFF] p-3 rounded-xl border border-[#EAE3DC]">
              <span className="font-bold text-[#FA661C]">Direct Bank Remittance:</span> Scheduled for {selectedSettlement.bankAccount} via NEFT batch.
            </div>

            <button
              type="button"
              onClick={() => {
                toast.success("Disbursement Released", `Transferred ${formatINR(selectedSettlement.finalSettlement)} to ${selectedSettlement.vendorName}`);
                setSelectedSettlement(null);
              }}
              className="w-full py-2.5 bg-[#FA661C] text-[#FFFFFF] font-bold text-xs rounded-xl btn-interactive cursor-pointer shadow-sm"
            >
              Approve & Release NEFT Payout
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
