import React from 'react';
import { UserPlus, Users, MessageSquare, HelpCircle, Clock, Info } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

const CUSTOMER_PREVIEW_ITEMS = [
  { id: 'new_customers', label: 'New Customer Cohort', iconName: 'UserPlus' },
  { id: 'repeat_rate', label: 'Repeat Purchase Rate', iconName: 'Users' },
  { id: 'unread_messages', label: 'Buyer Direct Messages', iconName: 'MessageSquare' },
  { id: 'product_qna', label: 'Unanswered Product Q&A', iconName: 'HelpCircle' }
];

const ICON_MAP = {
  UserPlus,
  Users,
  MessageSquare,
  HelpCircle
};

export default function SellerCustomerWidget() {
  const toast = useToast();

  const handleCardClick = () => {
    toast.info("Coming Soon", "Customer analytics & messaging backend endpoints are under active development.");
  };

  return (
    <section aria-labelledby="customer-widget-heading" className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="p-1 rounded-lg bg-[#FFF3EC] text-[#FA661C]">
            <Users className="w-3.5 h-3.5" />
          </span>
          <h2 id="customer-widget-heading" className="font-['Outfit'] font-extrabold text-sm uppercase tracking-wider text-[#FA661C]">
            Buyer Engagement & Customer Care
          </h2>
          <span className="text-[10px] font-black uppercase tracking-wider bg-[#FFF8F2] text-[#FA661C] border border-[#FF811A]/60 px-2 py-0.5 rounded-full flex items-center space-x-1">
            <Clock className="w-3 h-3 text-[#FF811A]" />
            <span>Coming Soon</span>
          </span>
        </div>

        <span className="text-[11px] text-[#6B6058] italic">
          No live API endpoint available yet
        </span>
      </div>

      {/* Explicit Coming Soon Notice Banner */}
      <div className="p-3 bg-[#FFF8F2]/80 border border-[#FF811A]/50 rounded-2xl flex items-center space-x-3 text-xs text-[#FA661C]">
        <Info className="w-4 h-4 text-[#FF811A] shrink-0" />
        <div>
          <span className="font-bold">Customer Analytics & Messaging — Backend Feature in Progress</span>
          <p className="text-[11px] text-[#6B6058] mt-0.5">
            Customer engagement widgets (New/Repeat Cohorts, Unread Messages, and Product Q&A) do not have a live backend reporting source yet. Values below represent preview modules.
          </p>
        </div>
      </div>

      {/* 4 Compact Customer Stat Cards (Semi-opaque / Coming Soon state) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs opacity-75">
        {CUSTOMER_PREVIEW_ITEMS.map((item) => {
          const Icon = ICON_MAP[item.iconName] || Users;

          return (
            <div
              key={item.id}
              onClick={handleCardClick}
              className="p-3.5 bg-white rounded-2xl border border-[#EAE3DC] hover:border-[#FF811A]/60 shadow-2xs cursor-pointer flex flex-col justify-between relative"
            >
              <div className="absolute top-2 right-2">
                <span className="text-[8px] font-black uppercase bg-[#FFFFFF] text-[#6B6058] border border-[#EAE3DC] px-1 rounded">
                  Soon
                </span>
              </div>

              <div>
                <div className="flex items-center justify-between gap-1 mb-2">
                  <span className="text-[11px] font-bold text-[#6B6058] truncate">
                    {item.label}
                  </span>
                </div>

                <div className="flex items-baseline space-x-2">
                  <div className="font-['Outfit'] font-black text-xl text-[#FA661C]/60">
                    --
                  </div>
                </div>
              </div>

              <div className="mt-2.5 pt-2 border-t border-[#EAE3DC]/50 flex items-center justify-between text-[10px]">
                <span className="text-[#6B6058] font-medium">Feature Pending</span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

