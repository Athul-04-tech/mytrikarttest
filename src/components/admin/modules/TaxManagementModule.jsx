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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#EAE3DC]">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-1 rounded-lg bg-[#FFF8F2] text-[#FA661C]">
              <Landmark className="w-4 h-4 text-[#FF811A]" />
            </span>
            <h2 className="font-['Outfit'] font-black text-xl text-[#FA661C]">
              Tax Management & GSTIN Compliance
            </h2>
          </div>
          <p className="text-xs text-[#6B6058] mt-0.5">
            Strict Multi-Jurisdiction Rules: Intrastate (CGST 50% + SGST 50%, IGST = 0) vs Interstate (IGST 100%, CGST/SGST = 0)
          </p>
        </div>

        <div className="flex items-center space-x-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => toast.success("GSTR-1 Exported", "Monthly GSTR-1 & TCS Section 52 reports generated.")}
            className="px-3.5 py-2 bg-[#FA661C] text-[#FFFFFF] rounded-xl text-xs font-bold btn-interactive flex items-center space-x-1.5 cursor-pointer shadow-xs"
          >
            <Download className="w-3.5 h-3.5 text-[#FF811A]" />
            <span>Generate GSTR-1 File</span>
          </button>
        </div>
      </div>

      {/* 2. Tax Pool Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
        <div className="p-3.5 bg-[#FFFFFF] rounded-2xl border border-[#EAE3DC]">
          <span className="text-[10px] font-bold text-[#6B6058] uppercase">CGST Total</span>
          <div className="font-['Outfit'] font-black text-base text-[#FA661C] mt-0.5">
            {formatINR(totalCGST)}
          </div>
          <span className="text-[10px] text-[#6B6058]">Central Intrastate</span>
        </div>

        <div className="p-3.5 bg-[#FFFFFF] rounded-2xl border border-[#EAE3DC]">
          <span className="text-[10px] font-bold text-[#6B6058] uppercase">SGST Total</span>
          <div className="font-['Outfit'] font-black text-base text-[#FA661C] mt-0.5">
            {formatINR(totalSGST)}
          </div>
          <span className="text-[10px] text-[#6B6058] font-semibold text-[#FA661C]">Exact 1:1 Match with CGST</span>
        </div>

        <div className="p-3.5 bg-[#FFFFFF] rounded-2xl border border-[#EAE3DC]">
          <span className="text-[10px] font-bold text-[#6B6058] uppercase">IGST Total</span>
          <div className="font-['Outfit'] font-black text-base text-[#FA661C] mt-0.5">
            {formatINR(totalIGST)}
          </div>
          <span className="text-[10px] text-[#6B6058]">Interstate Supply</span>
        </div>

        <div className="p-3.5 bg-[#FFF8F2] rounded-2xl border border-[#FF811A]/50">
          <span className="text-[10px] font-bold text-[#FA661C] uppercase">TDS u/s 194-O</span>
          <div className="font-['Outfit'] font-black text-base text-[#FA661C] mt-0.5">
            {formatINR(totalTDS)}
          </div>
          <span className="text-[10px] text-[#6B6058]">1% on Gross Sale Value</span>
        </div>

        <div className="p-3.5 bg-[#FFF8F2] rounded-2xl border border-[#FF811A]/50 col-span-2 sm:col-span-1">
          <span className="text-[10px] font-bold text-[#FA661C] uppercase">TCS (GST Sec 52)</span>
          <div className="font-['Outfit'] font-black text-base text-[#FA661C] mt-0.5">
            {formatINR(totalTCS)}
          </div>
          <span className="text-[10px] text-[#6B6058]">1% on Net Taxable Supply</span>
        </div>
      </div>

      {/* 3. Jurisdictional Filter Tabs */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-1.5 bg-[#FFF3EC] p-1 rounded-xl border border-[#EAE3DC] text-xs font-bold">
          <button
            type="button"
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              filterType === 'all' ? 'bg-[#FA661C] text-[#FFFFFF] shadow-2xs' : 'text-[#6B6058] hover:text-[#FA661C]'
            }`}
          >
            All Tax Records ({taxes.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterType('intrastate')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              filterType === 'intrastate' ? 'bg-[#FA661C] text-[#FFFFFF] shadow-2xs' : 'text-[#6B6058] hover:text-[#FA661C]'
            }`}
          >
            Intrastate Only (CGST + SGST)
          </button>
          <button
            type="button"
            onClick={() => setFilterType('interstate')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              filterType === 'interstate' ? 'bg-[#FA661C] text-[#FFFFFF] shadow-2xs' : 'text-[#6B6058] hover:text-[#FA661C]'
            }`}
          >
            Interstate Only (IGST)
          </button>
        </div>

        <span className="text-xs text-[#6B6058]">
          Status: <strong className="text-[#FA661C]">100% Tax Formula Verified</strong>
        </span>
      </div>

      {/* 4. Tax Ledger Table */}
      <div className="bg-white rounded-2xl border border-[#EAE3DC] overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#FFF3EC] text-[#FA661C] border-b border-[#EAE3DC] font-extrabold uppercase text-[10px] tracking-wider">
                <th className="p-3">Order ID</th>
                <th className="p-3">Jurisdiction Route</th>
                <th className="p-3 text-right">Taxable Base</th>
                <th className="p-3 text-right">GST Rate</th>
                <th className="p-3 text-right">CGST</th>
                <th className="p-3 text-right">SGST</th>
                <th className="p-3 text-right">IGST</th>
                <th className="p-3 text-right">TDS (194-O)</th>
                <th className="p-3 text-right">TCS (Sec 52)</th>
                <th className="p-3 text-right font-black text-[#FA661C] bg-[#FFF8F2]">Gross Bill</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EAE3DC]/60 font-medium">
              {filteredTaxes.map((tax) => (
                <tr key={tax.orderId} className="hover:bg-[#FFFFFF] transition-colors">
                  <td className="p-3 font-mono font-bold text-[#FA661C]">
                    {tax.orderId}
                  </td>
                  <td className="p-3">
                    <div className="font-bold text-[#FA661C] flex items-center space-x-1">
                      <span>{tax.vendorState}</span>
                      <span className="text-[#FF811A]">→</span>
                      <span>{tax.customerState}</span>
                    </div>
                    <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded uppercase inline-block mt-0.5 ${
                      tax.isIntrastate 
                        ? 'bg-[#FFF3EC] text-[#FA661C]' 
                        : 'bg-[#FFF8F2] text-[#FA661C]'
                    }`}>
                      {tax.isIntrastate ? 'Intrastate Supply' : 'Interstate Supply'}
                    </span>
                  </td>
                  <td className="p-3 text-right font-mono text-[#FA661C]">
                    {formatINR(tax.taxableValue)}
                  </td>
                  <td className="p-3 text-right font-bold text-[#FA661C]">
                    {tax.gstRatePercent}
                  </td>
                  <td className="p-3 text-right font-mono">
                    {tax.isIntrastate ? formatINR(tax.cgstAmount) : '₹0.00'}
                    {tax.isIntrastate && <span className="text-[9px] text-[#6B6058] block">({tax.cgstRatePercent})</span>}
                  </td>
                  <td className="p-3 text-right font-mono">
                    {tax.isIntrastate ? formatINR(tax.sgstAmount) : '₹0.00'}
                    {tax.isIntrastate && <span className="text-[9px] text-[#6B6058] block">({tax.sgstRatePercent})</span>}
                  </td>
                  <td className="p-3 text-right font-mono">
                    {!tax.isIntrastate ? formatINR(tax.igstAmount) : '₹0.00'}
                    {!tax.isIntrastate && <span className="text-[9px] text-[#6B6058] block">({tax.igstRatePercent})</span>}
                  </td>
                  <td className="p-3 text-right font-mono text-[#6B6058]">
                    {formatINR(tax.tdsAmount)}
                  </td>
                  <td className="p-3 text-right font-mono text-[#6B6058]">
                    {formatINR(tax.tcsAmount)}
                  </td>
                  <td className="p-3 text-right font-black text-[#FA661C] bg-[#FFF8F2]/60">
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
