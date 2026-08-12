import React from 'react';
import { TrendingUp, Calendar, Sparkles } from 'lucide-react';
import { SALES_WIDGET_DATA, formatSellerINR } from '../../data/sellerDashboardData';
import { useCountUp } from '../../hooks/useCountUp';

function AnimatedStatValue({ target }) {
  const count = useCountUp(target, 700);
  return <span>{formatSellerINR(count)}</span>;
}

function MiniSparkline({ data, isPositive }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const width = 64;
  const height = 24;

  const points = data
    .map((val, idx) => {
      const x = (idx / (data.length - 1)) * width;
      const y = height - ((val - min) / range) * (height - 4) - 2;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <svg width={width} height={height} className="overflow-visible shrink-0">
      <polyline
        fill="none"
        stroke={isPositive ? '#0F3D2E' : '#C0392B'}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
    </svg>
  );
}

export default function SellerSalesWidget() {
  return (
    <section aria-labelledby="sales-widget-heading" className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="p-1 rounded-lg bg-[#E8F2EE] text-[#0F3D2E]">
            <TrendingUp className="w-3.5 h-3.5" />
          </span>
          <h2 id="sales-widget-heading" className="font-['Outfit'] font-extrabold text-sm uppercase tracking-wider text-[#0F3D2E]">
            Sales Performance Overview
          </h2>
        </div>
        <span className="text-[11px] text-[#5C6B63]">
          Live Metric Sync • Nested Period Consistency
        </span>
      </div>

      {/* 5 Period Stat Cards in a Single Row (Scrollable on Mobile) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 overflow-x-auto pb-1">
        {SALES_WIDGET_DATA.map((item) => (
          <div
            key={item.id}
            className="p-3.5 bg-white rounded-2xl border border-[#D8E0DC] hover:border-[#D4AF37]/60 shadow-2xs card-interactive flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between gap-1 mb-2">
                <span className="text-[11px] font-bold text-[#5C6B63] truncate">
                  {item.label}
                </span>
                <span className="text-[10px] font-extrabold bg-[#E8F2EE] text-[#0F3D2E] px-1.5 py-0.2 rounded">
                  {item.trend}
                </span>
              </div>

              <div className="font-['Outfit'] font-black text-lg sm:text-xl text-[#0F3D2E] tracking-tight">
                <AnimatedStatValue target={item.amount} />
              </div>
            </div>

            <div className="mt-2.5 pt-2 border-t border-[#D8E0DC]/50 flex items-center justify-between">
              <span className="text-[10px] text-[#5C6B63]">Trend</span>
              <MiniSparkline data={item.sparkline} isPositive={item.isPositive} />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
