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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#D8E0DC]">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-1 rounded-lg bg-[#E8F2EE] text-[#0F3D2E]">
              <Calculator className="w-4 h-4" />
            </span>
            <h2 className="font-['Outfit'] font-black text-xl text-[#0F3D2E]">
              Settlement Calculation & Deduction Engine
            </h2>
          </div>
          <p className="text-xs text-[#5C6B63] mt-0.5">
            Strict Formula: Gross Sales − Commission − Logistics − Platform Fee − Gateway − TDS (1%) − TCS (1%) = Final Settlement
          </p>
        </div>

        <button
          type="button"
          onClick={() => toast.success("Ledger Exported", "Settlement calculation waterfall exported to CSV.")}
          className="px-4 py-2 bg-[#0F3D2E] text-[#FBF8F1] rounded-xl text-xs font-bold btn-interactive flex items-center space-x-1.5 cursor-pointer shadow-xs self-start sm:self-auto"
        >
          <FileSpreadsheet className="w-4 h-4 text-[#D4AF37]" />
          <span>Export Settlement Sheet</span>
        </button>
      </div>

      {/* 2. Top Aggregate Vitals */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5 text-xs">
        <div className="p-3 bg-[#FBF8F1] rounded-2xl border border-[#D8E0DC]">
          <span className="text-[10px] font-bold text-[#5C6B63] uppercase">Gross Sales</span>
          <div className="font-['Outfit'] font-black text-sm text-[#0F3D2E] mt-0.5">
            {formatINR(summary.totalGrossSales)}
          </div>
        </div>

        <div className="p-3 bg-[#FBF8F1] rounded-2xl border border-[#D8E0DC]">
          <span className="text-[10px] font-bold text-[#5C6B63] uppercase">− Commissions</span>
          <div className="font-['Outfit'] font-black text-sm text-[#C0392B] mt-0.5">
            {formatINR(summary.totalCommissions)}
          </div>
        </div>

        <div className="p-3 bg-[#FBF8F1] rounded-2xl border border-[#D8E0DC]">
          <span className="text-[10px] font-bold text-[#5C6B63] uppercase">− Logistics</span>
          <div className="font-['Outfit'] font-black text-sm text-[#C0392B] mt-0.5">
            {formatINR(summary.totalLogistics)}
          </div>
        </div>

        <div className="p-3 bg-[#FBF8F1] rounded-2xl border border-[#D8E0DC]">
          <span className="text-[10px] font-bold text-[#5C6B63] uppercase">− Platform Fee</span>
          <div className="font-['Outfit'] font-black text-sm text-[#C0392B] mt-0.5">
            {formatINR(summary.totalPlatformFees)}
          </div>
        </div>

        <div className="p-3 bg-[#FBF8F1] rounded-2xl border border-[#D8E0DC]">
          <span className="text-[10px] font-bold text-[#5C6B63] uppercase">− Gateway Fee</span>
          <div className="font-['Outfit'] font-black text-sm text-[#C0392B] mt-0.5">
            {formatINR(summary.totalGateway)}
          </div>
        </div>

        <div className="p-3 bg-[#FBF8F1] rounded-2xl border border-[#D8E0DC]">
          <span className="text-[10px] font-bold text-[#5C6B63] uppercase">− TDS & TCS</span>
          <div className="font-['Outfit'] font-black text-sm text-[#C0392B] mt-0.5">
            {formatINR(summary.totalTDS + summary.totalTCS)}
          </div>
        </div>

        <div className="p-3 bg-[#FCF7E8] rounded-2xl border border-[#D4AF37]/60 col-span-2 sm:col-span-1">
          <span className="text-[10px] font-bold text-[#0F3D2E] uppercase">Net Vendor Payout</span>
          <div className="font-['Outfit'] font-black text-sm text-[#0F3D2E] mt-0.5">
            {formatINR(summary.totalNetSettlements)}
          </div>
        </div>
      </div>

      {/* 3. Detailed Waterfall Table */}
      <div className="bg-white rounded-2xl border border-[#D8E0DC] overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#E8F2EE] text-[#0F3D2E] border-b border-[#D8E0DC] font-extrabold uppercase text-[10px] tracking-wider">
                <th className="p-3">Order ID</th>
                <th className="p-3">Merchant / Product</th>
                <th className="p-3 text-right">Gross</th>
                <th className="p-3 text-right">Comm.</th>
                <th className="p-3 text-right">Logistics</th>
                <th className="p-3 text-right">Platform</th>
                <th className="p-3 text-right">Gateway</th>
                <th className="p-3 text-right">TDS (1%)</th>
                <th className="p-3 text-right">TCS (1%)</th>
                <th className="p-3 text-right font-black text-[#0F3D2E] bg-[#FCF7E8]">Net Settlement</th>
                <th className="p-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#D8E0DC]/60 font-medium">
              {settlements.map((item) => (
                <tr key={item.orderId} className="hover:bg-[#FBF8F1] transition-colors group">
                  <td className="p-3 font-mono font-bold text-[#0F3D2E]">
                    {item.orderId}
                  </td>
                  <td className="p-3">
                    <div className="font-bold text-[#0F3D2E] truncate max-w-[180px]">{item.vendorName}</div>
                    <div className="text-[10px] text-[#5C6B63] truncate max-w-[180px]">{item.productName}</div>
                  </td>
                  <td className="p-3 text-right font-black text-[#0F3D2E]">
                    {formatINR(item.grossAmount)}
                  </td>
                  <td className="p-3 text-right text-[#C0392B]">
                    -{formatINR(item.commissionAmount)}
                    <span className="text-[9px] text-[#5C6B63] block">({item.commissionRatePercent})</span>
                  </td>
                  <td className="p-3 text-right text-[#C0392B]">
                    -{formatINR(item.logisticsFee)}
                  </td>
                  <td className="p-3 text-right text-[#C0392B]">
                    -{formatINR(item.platformFee)}
                  </td>
                  <td className="p-3 text-right text-[#C0392B]">
                    -{formatINR(item.gatewayCharges)}
                  </td>
                  <td className="p-3 text-right text-[#5C6B63]">
                    -{formatINR(item.tds)}
                  </td>
                  <td className="p-3 text-right text-[#5C6B63]">
                    -{formatINR(item.tcs)}
                  </td>
                  <td className="p-3 text-right font-black text-[#0F3D2E] bg-[#FCF7E8]/60">
                    {formatINR(item.finalSettlement)}
                  </td>
                  <td className="p-3 text-center">
                    <button
                      type="button"
                      onClick={() => setSelectedSettlement(item)}
                      className="px-2 py-1 rounded-lg bg-[#0F3D2E] text-[#D4AF37] font-bold text-[10px] btn-interactive cursor-pointer shadow-2xs"
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
        <div className="fixed inset-0 bg-[#0F3D2E]/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-[#D4AF37] max-w-lg w-full p-6 shadow-2xl space-y-4 animate-dropdown text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-[#D8E0DC]">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#D4AF37] bg-[#0F3D2E] px-2 py-0.5 rounded">
                  ARITHMETIC WATERFALL AUDIT
                </span>
                <h3 className="font-['Outfit'] font-black text-lg text-[#0F3D2E] mt-1">
                  Settlement Breakdown: {selectedSettlement.orderId}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedSettlement(null)}
                className="p-1 rounded-lg text-[#5C6B63] hover:text-[#0F3D2E]"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 font-mono text-xs">
              <div className="flex justify-between py-1 border-b border-[#D8E0DC]/50 font-bold text-[#0F3D2E]">
                <span>Gross Customer Payment</span>
                <span>+{formatINR(selectedSettlement.grossAmount)}</span>
              </div>
              <div className="flex justify-between py-1 text-[#C0392B]">
                <span>Less Commission ({selectedSettlement.commissionRatePercent})</span>
                <span>−{formatINR(selectedSettlement.commissionAmount)}</span>
              </div>
              <div className="flex justify-between py-1 text-[#C0392B]">
                <span>Less Logistics Courier Fee</span>
                <span>−{formatINR(selectedSettlement.logisticsFee)}</span>
              </div>
              <div className="flex justify-between py-1 text-[#C0392B]">
                <span>Less Marketplace Platform Fee (2%)</span>
                <span>−{formatINR(selectedSettlement.platformFee)}</span>
              </div>
              <div className="flex justify-between py-1 text-[#C0392B]">
                <span>Less Payment Gateway Fee (2% + 18% GST)</span>
                <span>−{formatINR(selectedSettlement.gatewayCharges)}</span>
              </div>
              <div className="flex justify-between py-1 text-[#5C6B63]">
                <span>Less TDS u/s 194-O (1% of Gross)</span>
                <span>−{formatINR(selectedSettlement.tds)}</span>
              </div>
              <div className="flex justify-between py-1 text-[#5C6B63]">
                <span>Less TCS under GST Sec 52 (1% Taxable)</span>
                <span>−{formatINR(selectedSettlement.tcs)}</span>
              </div>

              <div className="flex justify-between py-2 border-t-2 border-[#0F3D2E] font-black text-sm text-[#0F3D2E] bg-[#FCF7E8] px-3 rounded-xl mt-2">
                <span>Final Net Merchant Payout</span>
                <span>{formatINR(selectedSettlement.finalSettlement)}</span>
              </div>
            </div>

            <div className="text-[11px] text-[#5C6B63] bg-[#FBF8F1] p-3 rounded-xl border border-[#D8E0DC]">
              <span className="font-bold text-[#0F3D2E]">Direct Bank Remittance:</span> Scheduled for {selectedSettlement.bankAccount} via NEFT batch.
            </div>

            <button
              type="button"
              onClick={() => {
                toast.success("Disbursement Released", `Transferred ${formatINR(selectedSettlement.finalSettlement)} to ${selectedSettlement.vendorName}`);
                setSelectedSettlement(null);
              }}
              className="w-full py-2.5 bg-[#0F3D2E] text-[#FBF8F1] font-bold text-xs rounded-xl btn-interactive cursor-pointer shadow-sm"
            >
              Approve & Release NEFT Payout
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
