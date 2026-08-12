import React from 'react';
import { 
  TrendingUp, 
  DollarSign, 
  ShoppingBag, 
  Store, 
  Users, 
  Package, 
  UserCheck, 
  RotateCcw, 
  Landmark, 
  ShieldCheck, 
  AlertTriangle 
} from 'lucide-react';
import { ADMIN_STATS_CARDS } from '../../data/adminMockData';

const ICON_MAP = {
  TrendingUp,
  DollarSign,
  ShoppingBag,
  Store,
  Users,
  Package,
  UserCheck,
  RotateCcw,
  Landmark,
  ShieldCheck
};

export default function AdminStatCardsGrid({ onSelectStatCard }) {
  return (
    <section aria-label="Business Overview Stats" className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-['Outfit'] font-black text-sm uppercase tracking-wider text-[#0F3D2E]">
          Real-Time Marketplace Vitals
        </h2>
        <span className="text-[11px] text-[#5C6B63] font-medium">
          Auto-refreshed 2m ago • Live Production Sync
        </span>
      </div>

      {/* DENSE STATS GRID (10 Compact Cards) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {ADMIN_STATS_CARDS.map((stat) => {
          const Icon = ICON_MAP[stat.iconName] || TrendingUp;

          return (
            <div
              key={stat.id}
              onClick={() => onSelectStatCard && onSelectStatCard(stat)}
              className={`p-3.5 rounded-2xl bg-white border transition-all duration-200 card-interactive cursor-pointer flex flex-col justify-between ${
                stat.isUrgent
                  ? 'border-[#C0392B]/40 hover:border-[#C0392B] bg-[#FDEDEC]/20 shadow-2xs'
                  : 'border-[#D8E0DC] hover:border-[#D4AF37]/60 shadow-2xs'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-1 mb-2">
                  <span className="text-[11px] font-bold text-[#5C6B63] truncate">
                    {stat.label}
                  </span>
                  <div className={`p-1 rounded-lg shrink-0 ${
                    stat.isUrgent
                      ? 'bg-[#FDEDEC] text-[#C0392B]'
                      : 'bg-[#FCF7E8] text-[#0F3D2E]'
                  }`}>
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                </div>

                <div className={`font-['Outfit'] font-black text-lg sm:text-xl tracking-tight ${
                  stat.isUrgent ? 'text-[#C0392B]' : 'text-[#0F3D2E]'
                }`}>
                  {stat.value}
                </div>
              </div>

              <div className="mt-2 pt-2 border-t border-[#D8E0DC]/50 flex items-center justify-between text-[10px]">
                <span className={`font-extrabold px-1.5 py-0.2 rounded ${
                  stat.isUrgent
                    ? 'bg-[#FDEDEC] text-[#C0392B]'
                    : stat.isPositive
                    ? 'bg-[#E8F2EE] text-[#0F3D2E]'
                    : 'bg-[#FCF7E8] text-[#D4AF37]'
                }`}>
                  {stat.trend}
                </span>
                <span className="text-[#5C6B63]/80 truncate max-w-[70px]">
                  {stat.subtext}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
