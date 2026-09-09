import React from 'react';
import { 
  AlertTriangle, 
  MessageSquare, 
  Headphones, 
  Star, 
  RefreshCw, 
  ArrowRight, 
  CheckCircle2 
} from 'lucide-react';
import { 
  ADMIN_LOW_STOCK_ALERTS, 
  ADMIN_RECENT_REVIEWS, 
  ADMIN_SUPPORT_TICKETS 
} from '../../data/adminMockData';
import { useToast } from '../../context/ToastContext';

export default function AdminUrgentAlertsPanel() {
  const toast = useToast();

  const handleReorder = (item) => {
    toast.success("Stock Replenishment Dispatched", `Auto-PO sent to ${item.vendor} for ${item.name}`);
  };

  const handleModerateReview = (rev) => {
    toast.success("Review Verified", `Review by ${rev.customer} approved for publication.`);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
      
      {/* 1. LOW STOCK ALERTS (Brick Red Urgency) */}
      <div className="bg-white rounded-3xl border border-[#D7263D]/30 p-5 shadow-xs flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between pb-3 border-b border-[#EAE3DC]">
            <div className="flex items-center space-x-2">
              <span className="p-1 rounded-lg bg-[#FDE8EA] text-[#D7263D]">
                <AlertTriangle className="w-4 h-4" />
              </span>
              <h3 className="font-['Outfit'] font-extrabold text-base text-[#FA661C]">
                Critical Stock Alerts
              </h3>
            </div>
            <span className="text-[10px] font-black bg-[#FDE8EA] text-[#D7263D] px-2 py-0.5 rounded-full border border-[#D7263D]/20 animate-pulse">
              3 Urgent
            </span>
          </div>

          <div className="my-3 space-y-2.5">
            {ADMIN_LOW_STOCK_ALERTS.map((item) => (
              <div key={item.id} className="p-2.5 rounded-2xl bg-[#FDE8EA]/30 border border-[#D7263D]/20">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h5 className="font-bold text-xs text-[#FA661C] line-clamp-1">
                      {item.name}
                    </h5>
                    <p className="text-[10px] text-[#6B6058] mt-0.5">
                      {item.vendor} • <span className="font-mono text-[#FA661C]">{item.sku}</span>
                    </p>
                  </div>
                  <span className="text-xs font-black text-[#D7263D] shrink-0 bg-white px-1.5 py-0.5 rounded border border-[#D7263D]/30">
                    {item.remaining} left
                  </span>
                </div>

                <div className="mt-2 pt-2 border-t border-[#D7263D]/20 flex items-center justify-between">
                  <span className="text-[10px] text-[#6B6058]">
                    Threshold: {item.threshold} units
                  </span>
                  <button
                    type="button"
                    onClick={() => handleReorder(item)}
                    className="text-[10px] font-bold text-[#FA661C] bg-white hover:bg-[#FFF3EC] border border-[#EAE3DC] px-2 py-1 rounded-lg btn-interactive flex items-center space-x-1 cursor-pointer shadow-2xs"
                  >
                    <RefreshCw className="w-3 h-3 text-[#FF811A]" />
                    <span>Auto-Order</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="pt-2 text-right">
          <button 
            type="button"
            onClick={() => toast.info("Warehouse Hub", "Viewing 48 inventory replenishment schedules.")}
            className="text-[11px] font-bold text-[#FA661C] hover:text-[#FF811A] link-interactive cursor-pointer"
          >
            Inventory Restock Matrix →
          </button>
        </div>
      </div>

      {/* 2. RECENT REVIEWS MODERATION */}
      <div className="bg-white rounded-3xl border border-[#EAE3DC] p-5 shadow-xs flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between pb-3 border-b border-[#EAE3DC]">
            <div className="flex items-center space-x-2">
              <span className="p-1 rounded-lg bg-[#FFF8F2] text-[#FA661C]">
                <MessageSquare className="w-4 h-4 text-[#FF811A]" />
              </span>
              <h3 className="font-['Outfit'] font-extrabold text-base text-[#FA661C]">
                Recent Reviews
              </h3>
            </div>
            <span className="text-[10px] font-bold text-[#6B6058]">AI Screened: Pass</span>
          </div>

          <div className="my-3 space-y-2.5">
            {ADMIN_RECENT_REVIEWS.map((rev) => (
              <div key={rev.id} className="p-2.5 rounded-2xl bg-[#FFFFFF] border border-[#EAE3DC]/80">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-xs text-[#FA661C] truncate max-w-[140px]">
                    {rev.customer}
                  </span>
                  <div className="flex items-center space-x-1 bg-white px-1.5 py-0.2 rounded border border-[#FF811A]/30 text-[10px] font-bold text-[#FF811A]">
                    <Star className="w-2.5 h-2.5 fill-current" />
                    <span>{rev.rating}.0</span>
                  </div>
                </div>

                <p className="text-[11px] text-[#6B6058] line-clamp-2 italic">
                  "{rev.comment}"
                </p>

                <div className="mt-2 pt-1.5 border-t border-[#EAE3DC]/60 flex items-center justify-between text-[10px]">
                  <span className="text-[#6B6058]">{rev.time}</span>
                  <button
                    type="button"
                    onClick={() => handleModerateReview(rev)}
                    className="font-bold text-[#FA661C] hover:text-[#FF811A] link-interactive cursor-pointer"
                  >
                    Publish Verified
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="pt-2 text-right">
          <button 
            type="button"
            onClick={() => toast.info("Review Moderation", "Opening 320 customer feedback stream.")}
            className="text-[11px] font-bold text-[#FA661C] hover:text-[#FF811A] link-interactive cursor-pointer"
          >
            Moderate All Reviews →
          </button>
        </div>
      </div>

      {/* 3. SUPPORT TICKETS ESCALATION */}
      <div className="bg-white rounded-3xl border border-[#EAE3DC] p-5 shadow-xs flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between pb-3 border-b border-[#EAE3DC]">
            <div className="flex items-center space-x-2">
              <span className="p-1 rounded-lg bg-[#FFF3EC] text-[#FA661C]">
                <Headphones className="w-4 h-4" />
              </span>
              <h3 className="font-['Outfit'] font-extrabold text-base text-[#FA661C]">
                Open Support Tickets
              </h3>
            </div>
            <span className="text-[10px] font-bold bg-[#FFF3EC] text-[#FA661C] px-2 py-0.5 rounded-full">
              3 Active
            </span>
          </div>

          <div className="my-3 space-y-2.5">
            {ADMIN_SUPPORT_TICKETS.map((ticket) => (
              <div key={ticket.id} className="p-2.5 rounded-2xl bg-[#FFFFFF] border border-[#EAE3DC]/80">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="font-mono text-[10px] font-bold text-[#FF811A]">
                      {ticket.id}
                    </span>
                    <h5 className="font-bold text-xs text-[#FA661C] line-clamp-1">
                      {ticket.subject}
                    </h5>
                    <p className="text-[10px] text-[#6B6058] mt-0.5">
                      {ticket.customer}
                    </p>
                  </div>

                  <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded uppercase shrink-0 ${
                    ticket.isUrgent
                      ? 'bg-[#FDE8EA] text-[#D7263D] border border-[#D7263D]/30'
                      : 'bg-[#FFF8F2] text-[#FA661C] border border-[#FF811A]/40'
                  }`}>
                    {ticket.priority}
                  </span>
                </div>

                <div className="mt-2 pt-1.5 border-t border-[#EAE3DC]/60 flex items-center justify-between text-[10px]">
                  <span className="text-[#6B6058]">Updated {ticket.time} ago</span>
                  <button
                    type="button"
                    onClick={() => toast.info("Helpdesk Portal", `Opening Ticket ${ticket.id}`)}
                    className="font-bold text-[#FA661C] hover:text-[#FF811A] link-interactive cursor-pointer"
                  >
                    Respond →
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="pt-2 text-right">
          <button 
            type="button"
            onClick={() => toast.info("Customer Desk", "Opening 16 active dispute and inquiry queues.")}
            className="text-[11px] font-bold text-[#FA661C] hover:text-[#FF811A] link-interactive cursor-pointer"
          >
            Open Complete Helpdesk →
          </button>
        </div>
      </div>

    </div>
  );
}
