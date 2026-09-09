import React from 'react';
import { 
  ShoppingBag, 
  Store, 
  RotateCcw, 
  AlertTriangle, 
  CheckCircle2, 
  ShieldCheck, 
  Clock, 
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { ADMIN_ACTIVITY_FEED } from '../../data/adminMockData';
import { useToast } from '../../context/ToastContext';

const ICON_MAP = {
  ShoppingBag,
  Store,
  RotateCcw,
  AlertTriangle,
  CheckCircle2,
  ShieldCheck
};

export default function AdminActivityFeed() {
  const toast = useToast();

  const handleAction = (item) => {
    toast.success("Activity Actioned", `Reviewing: ${item.title}`);
  };

  return (
    <div className="bg-white rounded-3xl border border-[#EAE3DC] p-5 sm:p-6 shadow-xs flex flex-col justify-between h-full">
      
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[#EAE3DC]">
        <div className="flex items-center space-x-2">
          <span className="p-1 rounded-lg bg-[#FFF8F2] text-[#FA661C]">
            <Clock className="w-4 h-4 text-[#FF811A]" />
          </span>
          <h3 className="font-['Outfit'] font-extrabold text-base sm:text-lg text-[#FA661C]">
            Live Activity Stream
          </h3>
        </div>

        <span className="text-[10px] font-extrabold bg-[#FFF3EC] text-[#FA661C] px-2 py-0.5 rounded-full flex items-center space-x-1">
          <span className="w-1.5 h-1.5 rounded-full bg-[#FA661C] animate-pulse" />
          <span>Real-time</span>
        </span>
      </div>

      {/* Stream Items */}
      <div className="my-3 space-y-3 divide-y divide-[#EAE3DC]/50 overflow-y-auto max-h-[300px] pr-1">
        {ADMIN_ACTIVITY_FEED.map((item) => {
          const Icon = ICON_MAP[item.iconName] || Clock;

          return (
            <div
              key={item.id}
              className="pt-3 first:pt-0 flex items-start justify-between gap-3 group/act cursor-pointer hover:bg-[#FFFFFF]/60 p-2 rounded-xl transition-colors"
              onClick={() => handleAction(item)}
            >
              <div className="flex items-start space-x-3">
                <div className={`p-2 rounded-xl shrink-0 mt-0.5 transition-transform group-hover/act:scale-110 ${
                  item.isUrgent
                    ? 'bg-[#FDE8EA] text-[#D7263D]'
                    : 'bg-[#FFF3EC] text-[#FA661C]'
                }`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-xs text-[#FA661C] leading-tight group-hover/act:text-[#E0530B] transition-colors">
                    {item.title}
                  </h4>
                  <p className="text-[11px] text-[#6B6058] mt-0.5">
                    {item.desc}
                  </p>
                </div>
              </div>

              <div className="text-right shrink-0">
                <span className="text-[10px] text-[#6B6058] font-medium block">
                  {item.time}
                </span>
                <button
                  type="button"
                  className="text-[10px] font-bold text-[#FF811A] hover:underline flex items-center space-x-0.5 mt-0.5 ml-auto"
                >
                  <span>Review</span>
                  <ArrowRight className="w-2.5 h-2.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="pt-3 border-t border-[#EAE3DC]/60 flex items-center justify-between text-xs text-[#6B6058]">
        <span>Showing 6 latest system events</span>
        <button 
          type="button"
          onClick={() => toast.info("Audit Feed Export", "Exporting complete 24h event logs to CSV.")}
          className="text-[11px] font-bold text-[#FA661C] hover:text-[#FF811A] link-interactive cursor-pointer"
        >
          View Full Audit Log →
        </button>
      </div>

    </div>
  );
}
