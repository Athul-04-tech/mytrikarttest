import React from 'react';
import { UserPlus, Users, MessageSquare, HelpCircle, ArrowRight, Sparkles } from 'lucide-react';
import { CUSTOMER_WIDGET_DATA } from '../../data/sellerDashboardData';
import { useCountUp } from '../../hooks/useCountUp';
import { useToast } from '../../context/ToastContext';

const ICON_MAP = {
  UserPlus,
  Users,
  MessageSquare,
  HelpCircle
};

function AnimatedCount({ target }) {
  const count = useCountUp(target, 650);
  return <span>{count}</span>;
}

export default function SellerCustomerWidget() {
  const toast = useToast();

  const handleCardClick = (item) => {
    if (item.id === 'unread-msg') {
      toast.info("Merchant Chat Desk", "Opening 4 customer buyer inquiries.");
    } else if (item.id === 'questions') {
      toast.info("Product Q&A", "Opening 2 pending pre-order questions.");
    } else {
      toast.info("Audience Insights", `Viewing repeat cohort report for ${item.label}`);
    }
  };

  return (
    <section aria-labelledby="customer-widget-heading" className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="p-1 rounded-lg bg-[#E8F2EE] text-[#0F3D2E]">
            <Users className="w-3.5 h-3.5" />
          </span>
          <h2 id="customer-widget-heading" className="font-['Outfit'] font-extrabold text-sm uppercase tracking-wider text-[#0F3D2E]">
            Buyer Engagement & Customer Care
          </h2>
        </div>

        <span className="text-[11px] text-[#5C6B63]">
          4.8 / 5.0 Store Rating (3,410 Reviews)
        </span>
      </div>

      {/* 4 Compact Customer Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        {CUSTOMER_WIDGET_DATA.map((item) => {
          const Icon = ICON_MAP[item.iconName] || Users;

          return (
            <div
              key={item.id}
              onClick={() => handleCardClick(item)}
              className="p-3.5 bg-white rounded-2xl border border-[#D8E0DC] hover:border-[#D4AF37]/60 shadow-2xs card-interactive cursor-pointer flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-1 mb-2">
                  <span className="text-[11px] font-bold text-[#5C6B63] truncate">
                    {item.label}
                  </span>
                  <div className={`p-1 rounded-lg ${
                    item.hasBadge ? 'bg-[#FCF7E8] text-[#D4AF37]' : 'bg-[#E8F2EE] text-[#0F3D2E]'
                  }`}>
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                </div>

                <div className="flex items-baseline space-x-2">
                  <div className="font-['Outfit'] font-black text-xl text-[#0F3D2E]">
                    <AnimatedCount target={item.count} />
                  </div>
                  {item.hasBadge && (
                    <span className="text-[9px] font-extrabold bg-[#D4AF37] text-[#0F3D2E] px-1.5 py-0.2 rounded shadow-2xs uppercase">
                      Action Needed
                    </span>
                  )}
                </div>
              </div>

              <div className="mt-2.5 pt-2 border-t border-[#D8E0DC]/50 flex items-center justify-between text-[10px]">
                <span className="text-[#5C6B63]">{item.subtext}</span>
                {item.trend && (
                  <span className="font-extrabold text-[#0F3D2E] bg-[#E8F2EE] px-1.5 py-0.2 rounded">
                    {item.trend}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
