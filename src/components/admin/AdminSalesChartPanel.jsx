import React, { useState } from 'react';
import { TrendingUp, DollarSign, Calendar, ArrowUpRight, Sparkles } from 'lucide-react';

const CHART_DATA = {
  'today': { gmv: '₹14.8 Lakh', orders: '482', commission: '₹1.28 Lakh', bars: [20, 35, 45, 60, 80, 65, 95, 110, 85, 90, 120, 140] },
  '7d': { gmv: '₹1.12 Cr', orders: '3,840', commission: '₹9.8 Lakh', bars: [45, 60, 75, 90, 85, 110, 130] },
  '30d': { gmv: '₹4.82 Cr', orders: '18,420', commission: '₹41.8 Lakh', bars: [30, 45, 55, 40, 65, 80, 75, 90, 110, 100, 125, 145] },
  '1y': { gmv: '₹54.2 Cr', orders: '2.1 Lakh', commission: '₹4.6 Cr', bars: [50, 65, 80, 95, 110, 120, 140, 160, 175, 190, 210, 240] }
};

export default function AdminSalesChartPanel() {
  const [range, setRange] = useState('30d');
  const data = CHART_DATA[range];

  return (
    <div className="bg-white rounded-3xl border border-[#D8E0DC] p-5 sm:p-6 shadow-xs flex flex-col justify-between h-full">
      
      {/* Header with Range Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#D8E0DC]">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-1 rounded-lg bg-[#E8F2EE] text-[#0F3D2E]">
              <TrendingUp className="w-4 h-4" />
            </span>
            <h3 className="font-['Outfit'] font-extrabold text-base sm:text-lg text-[#0F3D2E]">
              Revenue & GMV Trajectory
            </h3>
          </div>
          <p className="text-xs text-[#5C6B63] mt-0.5">
            Gross merchandise value against net commission revenue breakdown
          </p>
        </div>

        {/* Range Tabs */}
        <div className="flex items-center space-x-1 bg-[#FBF8F1] p-1 rounded-xl border border-[#D8E0DC] self-start sm:self-auto text-xs">
          {[
            { id: 'today', label: 'Today' },
            { id: '7d', label: '7D' },
            { id: '30d', label: '30D' },
            { id: '1y', label: '1Y' }
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setRange(tab.id)}
              className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all cursor-pointer ${
                range === tab.id
                  ? 'bg-[#0F3D2E] text-[#FBF8F1] shadow-2xs'
                  : 'text-[#5C6B63] hover:text-[#0F3D2E]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Highlights Metrics Ribbon */}
      <div className="grid grid-cols-3 gap-3 my-4 p-3 bg-[#FBF8F1] rounded-2xl border border-[#D8E0DC]/80 text-xs">
        <div>
          <span className="text-[10px] font-bold text-[#5C6B63] uppercase">GMV Sales</span>
          <div className="font-['Outfit'] font-black text-sm sm:text-base text-[#0F3D2E] mt-0.5">
            {data.gmv}
          </div>
        </div>

        <div>
          <span className="text-[10px] font-bold text-[#5C6B63] uppercase">Orders Volume</span>
          <div className="font-['Outfit'] font-black text-sm sm:text-base text-[#0F3D2E] mt-0.5">
            {data.orders}
          </div>
        </div>

        <div>
          <span className="text-[10px] font-bold text-[#5C6B63] uppercase">Net Platform Fee</span>
          <div className="font-['Outfit'] font-black text-sm sm:text-base text-[#D4AF37] mt-0.5">
            {data.commission}
          </div>
        </div>
      </div>

      {/* SVG Bar / Area Visualizer */}
      <div className="relative h-44 sm:h-48 w-full flex items-end justify-between gap-1 sm:gap-2 pt-6 px-2">
        {data.bars.map((val, idx) => {
          const max = Math.max(...data.bars);
          const heightPercent = (val / max) * 100;

          return (
            <div key={idx} className="flex-1 flex flex-col items-center group/bar h-full justify-end">
              <div 
                className="w-full max-w-[28px] bg-gradient-to-t from-[#0F3D2E] via-[#16523F] to-[#D4AF37] rounded-t-lg transition-all duration-300 group-hover/bar:brightness-125 shadow-2xs relative"
                style={{ height: `${heightPercent}%` }}
              >
                {/* Hover Tooltip Value */}
                <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-[#0F3D2E] text-[#D4AF37] font-bold text-[9px] px-1.5 py-0.5 rounded opacity-0 group-hover/bar:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-xs z-10">
                  ₹{(val * 3.4).toFixed(1)}L
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-[#D8E0DC]/60 text-[10px] text-[#5C6B63] font-bold uppercase tracking-wider">
        <span>Start Cycle</span>
        <span className="text-[#0F3D2E]">Peak Velocity • +18.4% YoY</span>
        <span>Current Cycle</span>
      </div>

    </div>
  );
}
