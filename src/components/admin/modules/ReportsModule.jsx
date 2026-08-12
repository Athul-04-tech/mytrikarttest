import React, { useState } from 'react';
import { 
  getMasterFinancialSummaries, 
  formatINR 
} from '../../../data/adminFinanceEngine';
import { BarChart3, TrendingUp, Download, CheckCircle2, Calendar } from 'lucide-react';
import { useToast } from '../../../context/ToastContext';

// 12 Monthly figures whose sum STRICTLY equals the Annual Total
const MONTHLY_SERIES = [
  { month: 'Apr 2025', gmv: 3800000.00, commission: 418000.00, orders: 1420 },
  { month: 'May 2025', gmv: 4100000.00, commission: 451000.00, orders: 1580 },
  { month: 'Jun 2025', gmv: 3950000.00, commission: 434500.00, orders: 1510 },
  { month: 'Jul 2025', gmv: 4400000.00, commission: 484000.00, orders: 1690 },
  { month: 'Aug 2025', gmv: 4250000.00, commission: 467500.00, orders: 1620 },
  { month: 'Sep 2025', gmv: 4600000.00, commission: 506000.00, orders: 1780 },
  { month: 'Oct 2025 (Festive)', gmv: 6800000.00, commission: 748000.00, orders: 2640 },
  { month: 'Nov 2025 (Diwali)', gmv: 7400000.00, commission: 814000.00, orders: 2890 },
  { month: 'Dec 2025', gmv: 5200000.00, commission: 572000.00, orders: 1980 },
  { month: 'Jan 2026', gmv: 4500000.00, commission: 495000.00, orders: 1720 },
  { month: 'Feb 2026', gmv: 4350000.00, commission: 478500.00, orders: 1650 },
  { month: 'Mar 2026', gmv: 4850000.00, commission: 533500.00, orders: 1840 }
];

export default function ReportsModule() {
  const toast = useToast();

  const totalAnnualGMV = MONTHLY_SERIES.reduce((acc, m) => acc + m.gmv, 0);
  const totalAnnualCommission = MONTHLY_SERIES.reduce((acc, m) => acc + m.commission, 0);
  const totalAnnualOrders = MONTHLY_SERIES.reduce((acc, m) => acc + m.orders, 0);

  return (
    <div className="space-y-6">
      
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#D8E0DC]">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-1 rounded-lg bg-[#E8F2EE] text-[#0F3D2E]">
              <BarChart3 className="w-4 h-4" />
            </span>
            <h2 className="font-['Outfit'] font-black text-xl text-[#0F3D2E]">
              Financial Reports & BI Analytics
            </h2>
          </div>
          <p className="text-xs text-[#5C6B63] mt-0.5">
            Strict Multi-Period Arithmetic: 12 Monthly figures sum precisely to the annual audited figures.
          </p>
        </div>

        <button
          type="button"
          onClick={() => toast.success("BI Export Generated", "Full 12-month FY financial audit workbook exported.")}
          className="px-4 py-2 bg-[#0F3D2E] text-[#FBF8F1] rounded-xl text-xs font-bold btn-interactive flex items-center space-x-1.5 cursor-pointer shadow-xs self-start sm:self-auto"
        >
          <Download className="w-4 h-4 text-[#D4AF37]" />
          <span>Download Audit BI Pack</span>
        </button>
      </div>

      {/* 2. Annual Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
        <div className="p-4 bg-[#FCF7E8] rounded-2xl border border-[#D4AF37]/60">
          <span className="text-[10px] font-bold text-[#0F3D2E] uppercase tracking-wider">
            Total Annual Audited GMV
          </span>
          <div className="font-['Outfit'] font-black text-2xl text-[#0F3D2E] mt-1">
            {formatINR(totalAnnualGMV)}
          </div>
          <span className="text-[10px] text-[#0F3D2E] font-bold mt-1 block">
            Exact Sum of All 12 Months
          </span>
        </div>

        <div className="p-4 bg-[#FBF8F1] rounded-2xl border border-[#D8E0DC]">
          <span className="text-[10px] font-bold text-[#5C6B63] uppercase tracking-wider">
            Total Net Platform Commissions
          </span>
          <div className="font-['Outfit'] font-black text-2xl text-[#0F3D2E] mt-1">
            {formatINR(totalAnnualCommission)}
          </div>
          <span className="text-[10px] text-[#5C6B63] mt-1 block">
            Avg Effective Take Rate: 11.0%
          </span>
        </div>

        <div className="p-4 bg-[#FBF8F1] rounded-2xl border border-[#D8E0DC]">
          <span className="text-[10px] font-bold text-[#5C6B63] uppercase tracking-wider">
            Annual Order Volume
          </span>
          <div className="font-['Outfit'] font-black text-2xl text-[#0F3D2E] mt-1">
            {totalAnnualOrders.toLocaleString('en-IN')} Orders
          </div>
          <span className="text-[10px] text-[#5C6B63] mt-1 block">
            99.2% Fulfillment SLA
          </span>
        </div>
      </div>

      {/* 3. 12-Month Detailed Breakdown Table */}
      <div className="bg-white rounded-2xl border border-[#D8E0DC] overflow-hidden shadow-xs">
        <div className="p-4 border-b border-[#D8E0DC] bg-[#E8F2EE] flex items-center justify-between">
          <h3 className="font-['Outfit'] font-black text-sm text-[#0F3D2E]">
            Financial Year 2025–2026 Monthly Breakdown
          </h3>
          <span className="text-[10px] text-[#0F3D2E] font-bold bg-white px-2 py-0.5 rounded border border-[#D8E0DC]">
            12 Periods Audited
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#FBF8F1] text-[#5C6B63] border-b border-[#D8E0DC] font-extrabold uppercase text-[10px] tracking-wider">
                <th className="p-3">Fiscal Period</th>
                <th className="p-3 text-right">Order Count</th>
                <th className="p-3 text-right">Gross GMV</th>
                <th className="p-3 text-right">Platform Commission</th>
                <th className="p-3 text-center">Take Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#D8E0DC]/60 font-medium">
              {MONTHLY_SERIES.map((item, idx) => (
                <tr key={idx} className="hover:bg-[#FBF8F1] transition-colors">
                  <td className="p-3 font-bold text-[#0F3D2E]">
                    {item.month}
                  </td>
                  <td className="p-3 text-right font-mono text-[#5C6B63]">
                    {item.orders.toLocaleString('en-IN')}
                  </td>
                  <td className="p-3 text-right font-mono font-bold text-[#0F3D2E]">
                    {formatINR(item.gmv)}
                  </td>
                  <td className="p-3 text-right font-mono font-bold text-[#D4AF37]">
                    {formatINR(item.commission)}
                  </td>
                  <td className="p-3 text-center">
                    <span className="bg-[#E8F2EE] text-[#0F3D2E] text-[10px] font-bold px-2 py-0.5 rounded-full">
                      {((item.commission / item.gmv) * 100).toFixed(1)}%
                    </span>
                  </td>
                </tr>
              ))}

              {/* Strict Annual Total Footer Row */}
              <tr className="bg-[#FCF7E8] font-black text-xs border-t-2 border-[#0F3D2E]">
                <td className="p-3 text-[#0F3D2E] uppercase">Annual Total (Sum)</td>
                <td className="p-3 text-right font-mono">{totalAnnualOrders.toLocaleString('en-IN')}</td>
                <td className="p-3 text-right font-mono text-[#0F3D2E]">{formatINR(totalAnnualGMV)}</td>
                <td className="p-3 text-right font-mono text-[#0F3D2E]">{formatINR(totalAnnualCommission)}</td>
                <td className="p-3 text-center">
                  <span className="bg-[#0F3D2E] text-[#D4AF37] px-2 py-0.5 rounded text-[10px]">
                    11.0%
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
