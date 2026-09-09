import React from 'react';
import { TrendingUp } from 'lucide-react';
import { formatCurrencyValue } from '../../data/sellerDashboardData';
import { useCountUp } from '../../hooks/useCountUp';

function AnimatedStatValue({ target, currency }) {
  const count = useCountUp(target, 700);
  return <span>{formatCurrencyValue(count, currency)}</span>;
}

const PERIOD_CONFIG = [
  { id: 'today', apiKey: 'today', label: 'Today', trend: 'Live' },
  { id: 'yesterday', apiKey: 'yesterday', label: 'Yesterday', trend: 'Prior Day' },
  { id: 'last_7_days', apiKey: 'last_7_days', label: 'Last 7 Days', trend: '7D Window' },
  { id: 'last_30_days', apiKey: 'last_30_days', label: 'Last 30 Days', trend: '30D Window' },
  { id: 'lifetime', apiKey: 'lifetime', label: 'Lifetime Sales', trend: 'All Time' }
];

export default function SellerSalesWidget({ salesByCurrency, selectedCurrency = 'INR', availableCurrencies = ['INR'], onSelectCurrency }) {
  // Extract period values in selected currency from API response if present
  const getPeriodAmount = (apiKey) => {
    if (!salesByCurrency) return 0;
    const periodObj = salesByCurrency[apiKey];
    if (!periodObj) return 0;
    if (typeof periodObj === 'number') return periodObj;
    if (typeof periodObj === 'object') {
      return Number(periodObj[selectedCurrency] || periodObj['INR'] || Object.values(periodObj)[0] || 0);
    }
    return 0;
  };

  return (
    <section aria-labelledby="sales-widget-heading" className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center space-x-2">
          <span className="p-1 rounded-lg bg-[#FFF3EC] text-[#FA661C]">
            <TrendingUp className="w-3.5 h-3.5" />
          </span>
          <h2 id="sales-widget-heading" className="font-['Outfit'] font-extrabold text-sm uppercase tracking-wider text-[#FA661C]">
            Sales Performance Overview
          </h2>
        </div>

        {/* Currency Switcher Tabs (Supported for Multi-currency Vendors) */}
        <div className="flex items-center space-x-1.5">
          <span className="text-[11px] text-[#6B6058]">Currency:</span>
          {availableCurrencies.map((curr) => (
            <button
              key={curr}
              type="button"
              onClick={() => onSelectCurrency && onSelectCurrency(curr)}
              className={`px-2 py-0.5 rounded text-[11px] font-extrabold transition-all cursor-pointer ${
                selectedCurrency === curr
                  ? 'bg-[#FA661C] text-[#FF811A] shadow-2xs'
                  : 'bg-white text-[#6B6058] hover:text-[#FA661C] border border-[#EAE3DC]'
              }`}
            >
              {curr}
            </button>
          ))}
        </div>
      </div>

      {/* 5 Period Stat Cards in a Single Row (Scrollable on Mobile) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 overflow-x-auto pb-1">
        {PERIOD_CONFIG.map((p) => {
          const targetAmount = getPeriodAmount(p.apiKey);

          return (
            <div
              key={p.id}
              className="p-3.5 bg-white rounded-2xl border border-[#EAE3DC] hover:border-[#FF811A]/60 shadow-2xs card-interactive flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-1 mb-2">
                  <span className="text-[11px] font-bold text-[#6B6058] truncate">
                    {p.label}
                  </span>
                  <span className="text-[10px] font-extrabold bg-[#FFF3EC] text-[#FA661C] px-1.5 py-0.2 rounded">
                    {p.trend}
                  </span>
                </div>

                <div className="font-['Outfit'] font-black text-lg sm:text-xl text-[#FA661C] tracking-tight">
                  <AnimatedStatValue target={targetAmount} currency={selectedCurrency} />
                </div>
              </div>

              <div className="mt-2.5 pt-2 border-t border-[#EAE3DC]/50 flex items-center justify-between">
                <span className="text-[10px] text-[#6B6058]">Real API Period</span>
                <span className="text-[9px] font-bold text-[#FA661C]">Verified</span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

