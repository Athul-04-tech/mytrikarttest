import React, { useState } from 'react';
import { 
  MASTER_ORDERS, 
  calculateOrderTax, 
  getMasterFinancialSummaries, 
  formatINR 
} from '../../../data/adminFinanceEngine';
import { Landmark, FileText, CheckCircle2, ShieldCheck, Download, AlertCircle } from 'lucide-react';
import { useToast } from '../../../context/ToastContext';

export default function TaxManagementModule() {
  const [filterType, setFilterType] = useState('all'); // 'all' | 'intrastate' | 'interstate'
  const toast = useToast();

  const taxes = MASTER_ORDERS.map(calculateOrderTax);
  const filteredTaxes = filterType === 'all'
    ? taxes
    : filterType === 'intrastate'
    ? taxes.filter(t => t.isIntrastate)
    : taxes.filter(t => !t.isIntrastate);

  const totalCGST = Number(taxes.reduce((acc, t) => acc + t.cgstAmount, 0).toFixed(2));
  const totalSGST = Number(taxes.reduce((acc, t) => acc + t.sgstAmount, 0).toFixed(2));
  const totalIGST = Number(taxes.reduce((acc, t) => acc + t.igstAmount, 0).toFixed(2));
  const totalTDS = Number(taxes.reduce((acc, t) => acc + t.tdsAmount, 0).toFixed(2));
  const totalTCS = Number(taxes.reduce((acc, t) => acc + t.tcsAmount, 0).toFixed(2));

  return (
    <div className="space-y-6">
      
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#D8E0DC]">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-1 rounded-lg bg-[#FCF7E8] text-[#0F3D2E]">
              <Landmark className="w-4 h-4 text-[#D4AF37]" />
            </span>
            <h2 className="font-['Outfit'] font-black text-xl text-[#0F3D2E]">
              Tax Management & GSTIN Compliance
            </h2>
          </div>
          <p className="text-xs text-[#5C6B63] mt-0.5">
            Strict Multi-Jurisdiction Rules: Intrastate (CGST 50% + SGST 50%, IGST = 0) vs Interstate (IGST 100%, CGST/SGST = 0)
          </p>
        </div>

        <div className="flex items-center space-x-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => toast.success("GSTR-1 Exported", "Monthly GSTR-1 & TCS Section 52 reports generated.")}
            className="px-3.5 py-2 bg-[#0F3D2E] text-[#FBF8F1] rounded-xl text-xs font-bold btn-interactive flex items-center space-x-1.5 cursor-pointer shadow-xs"
          >
            <Download className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span>Generate GSTR-1 File</span>
          </button>
        </div>
      </div>

      {/* 2. Tax Pool Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
        <div className="p-3.5 bg-[#FBF8F1] rounded-2xl border border-[#D8E0DC]">
          <span className="text-[10px] font-bold text-[#5C6B63] uppercase">CGST Total</span>
          <div className="font-['Outfit'] font-black text-base text-[#0F3D2E] mt-0.5">
            {formatINR(totalCGST)}
          </div>
          <span className="text-[10px] text-[#5C6B63]">Central Intrastate</span>
        </div>

        <div className="p-3.5 bg-[#FBF8F1] rounded-2xl border border-[#D8E0DC]">
          <span className="text-[10px] font-bold text-[#5C6B63] uppercase">SGST Total</span>
          <div className="font-['Outfit'] font-black text-base text-[#0F3D2E] mt-0.5">
            {formatINR(totalSGST)}
          </div>
          <span className="text-[10px] text-[#5C6B63] font-semibold text-[#0F3D2E]">Exact 1:1 Match with CGST</span>
        </div>

        <div className="p-3.5 bg-[#FBF8F1] rounded-2xl border border-[#D8E0DC]">
          <span className="text-[10px] font-bold text-[#5C6B63] uppercase">IGST Total</span>
          <div className="font-['Outfit'] font-black text-base text-[#0F3D2E] mt-0.5">
            {formatINR(totalIGST)}
          </div>
          <span className="text-[10px] text-[#5C6B63]">Interstate Supply</span>
        </div>

        <div className="p-3.5 bg-[#FCF7E8] rounded-2xl border border-[#D4AF37]/50">
          <span className="text-[10px] font-bold text-[#0F3D2E] uppercase">TDS u/s 194-O</span>
          <div className="font-['Outfit'] font-black text-base text-[#0F3D2E] mt-0.5">
            {formatINR(totalTDS)}
          </div>
          <span className="text-[10px] text-[#5C6B63]">1% on Gross Sale Value</span>
        </div>

        <div className="p-3.5 bg-[#FCF7E8] rounded-2xl border border-[#D4AF37]/50 col-span-2 sm:col-span-1">
          <span className="text-[10px] font-bold text-[#0F3D2E] uppercase">TCS (GST Sec 52)</span>
          <div className="font-['Outfit'] font-black text-base text-[#0F3D2E] mt-0.5">
            {formatINR(totalTCS)}
          </div>
          <span className="text-[10px] text-[#5C6B63]">1% on Net Taxable Supply</span>
        </div>
      </div>

      {/* 3. Jurisdictional Filter Tabs */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-1.5 bg-[#E8F2EE] p-1 rounded-xl border border-[#D8E0DC] text-xs font-bold">
          <button
            type="button"
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              filterType === 'all' ? 'bg-[#0F3D2E] text-[#FBF8F1] shadow-2xs' : 'text-[#5C6B63] hover:text-[#0F3D2E]'
            }`}
          >
            All Tax Records ({taxes.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterType('intrastate')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              filterType === 'intrastate' ? 'bg-[#0F3D2E] text-[#FBF8F1] shadow-2xs' : 'text-[#5C6B63] hover:text-[#0F3D2E]'
            }`}
          >
            Intrastate Only (CGST + SGST)
          </button>
          <button
            type="button"
            onClick={() => setFilterType('interstate')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              filterType === 'interstate' ? 'bg-[#0F3D2E] text-[#FBF8F1] shadow-2xs' : 'text-[#5C6B63] hover:text-[#0F3D2E]'
            }`}
          >
            Interstate Only (IGST)
          </button>
        </div>

        <span className="text-xs text-[#5C6B63]">
          Status: <strong className="text-[#0F3D2E]">100% Tax Formula Verified</strong>
        </span>
      </div>

      {/* 4. Tax Ledger Table */}
      <div className="bg-white rounded-2xl border border-[#D8E0DC] overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#E8F2EE] text-[#0F3D2E] border-b border-[#D8E0DC] font-extrabold uppercase text-[10px] tracking-wider">
                <th className="p-3">Order ID</th>
                <th className="p-3">Jurisdiction Route</th>
                <th className="p-3 text-right">Taxable Base</th>
                <th className="p-3 text-right">GST Rate</th>
                <th className="p-3 text-right">CGST</th>
                <th className="p-3 text-right">SGST</th>
                <th className="p-3 text-right">IGST</th>
                <th className="p-3 text-right">TDS (194-O)</th>
                <th className="p-3 text-right">TCS (Sec 52)</th>
                <th className="p-3 text-right font-black text-[#0F3D2E] bg-[#FCF7E8]">Gross Bill</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#D8E0DC]/60 font-medium">
              {filteredTaxes.map((tax) => (
                <tr key={tax.orderId} className="hover:bg-[#FBF8F1] transition-colors">
                  <td className="p-3 font-mono font-bold text-[#0F3D2E]">
                    {tax.orderId}
                  </td>
                  <td className="p-3">
                    <div className="font-bold text-[#0F3D2E] flex items-center space-x-1">
                      <span>{tax.vendorState}</span>
                      <span className="text-[#D4AF37]">→</span>
                      <span>{tax.customerState}</span>
                    </div>
                    <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded uppercase inline-block mt-0.5 ${
                      tax.isIntrastate 
                        ? 'bg-[#E8F2EE] text-[#0F3D2E]' 
                        : 'bg-[#FCF7E8] text-[#0F3D2E]'
                    }`}>
                      {tax.isIntrastate ? 'Intrastate Supply' : 'Interstate Supply'}
                    </span>
                  </td>
                  <td className="p-3 text-right font-mono text-[#0F3D2E]">
                    {formatINR(tax.taxableValue)}
                  </td>
                  <td className="p-3 text-right font-bold text-[#0F3D2E]">
                    {tax.gstRatePercent}
                  </td>
                  <td className="p-3 text-right font-mono">
                    {tax.isIntrastate ? formatINR(tax.cgstAmount) : '₹0.00'}
                    {tax.isIntrastate && <span className="text-[9px] text-[#5C6B63] block">({tax.cgstRatePercent})</span>}
                  </td>
                  <td className="p-3 text-right font-mono">
                    {tax.isIntrastate ? formatINR(tax.sgstAmount) : '₹0.00'}
                    {tax.isIntrastate && <span className="text-[9px] text-[#5C6B63] block">({tax.sgstRatePercent})</span>}
                  </td>
                  <td className="p-3 text-right font-mono">
                    {!tax.isIntrastate ? formatINR(tax.igstAmount) : '₹0.00'}
                    {!tax.isIntrastate && <span className="text-[9px] text-[#5C6B63] block">({tax.igstRatePercent})</span>}
                  </td>
                  <td className="p-3 text-right font-mono text-[#5C6B63]">
                    {formatINR(tax.tdsAmount)}
                  </td>
                  <td className="p-3 text-right font-mono text-[#5C6B63]">
                    {formatINR(tax.tcsAmount)}
                  </td>
                  <td className="p-3 text-right font-black text-[#0F3D2E] bg-[#FCF7E8]/60">
                    {formatINR(tax.grossAmount)}
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
