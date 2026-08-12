import React from 'react';
import { ShoppingBag, ArrowRight, CheckCircle2, Clock, AlertTriangle, Truck } from 'lucide-react';
import { ORDERS_WIDGET_DATA, formatSellerINR } from '../../data/sellerDashboardData';
import { useCountUp } from '../../hooks/useCountUp';
import { useToast } from '../../context/ToastContext';

function AnimatedCount({ target }) {
  const count = useCountUp(target, 600);
  return <span>{count}</span>;
}

export default function SellerOrdersWidget({ onNavigateToOrders }) {
  const toast = useToast();
  const data = ORDERS_WIDGET_DATA;

  return (
    <section aria-labelledby="orders-widget-heading" className="bg-white rounded-3xl border border-[#D8E0DC] p-5 sm:p-6 shadow-xs flex flex-col justify-between h-full">
      <div>
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#D8E0DC]">
          <div className="flex items-center space-x-2">
            <span className="p-1 rounded-lg bg-[#E8F2EE] text-[#0F3D2E]">
              <ShoppingBag className="w-4 h-4 text-[#0F3D2E]" />
            </span>
            <h3 id="orders-widget-heading" className="font-['Outfit'] font-extrabold text-base text-[#0F3D2E]">
              Orders Fulfillment Queue
            </h3>
          </div>

          <button
            type="button"
            onClick={onNavigateToOrders}
            className="text-xs font-bold text-[#0F3D2E] hover:text-[#D4AF37] link-interactive flex items-center space-x-0.5 cursor-pointer"
          >
            <span>View All Orders</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* 5 Status Count Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 my-3 text-xs">
          {data.counts.map((st) => (
            <div
              key={st.id}
              className={`p-2.5 rounded-xl border flex flex-col justify-between ${
                st.isHighlight
                  ? 'bg-[#FCF7E8] border-[#D4AF37]/60 shadow-2xs'
                  : st.isUrgent
                  ? 'bg-[#FDEDEC]/40 border-[#C0392B]/30'
                  : 'bg-[#FBF8F1] border-[#D8E0DC]'
              }`}
            >
              <span className="text-[10px] font-bold text-[#5C6B63] truncate">
                {st.label}
              </span>
              <div className={`font-['Outfit'] font-black text-lg mt-0.5 ${
                st.isHighlight ? 'text-[#0F3D2E]' : st.isUrgent ? 'text-[#C0392B]' : 'text-[#0F3D2E]'
              }`}>
                <AnimatedCount target={st.count} />
              </div>
            </div>
          ))}
        </div>

        {/* Mini Recent Orders List (5-6 Rows) */}
        <div className="mt-4 space-y-2">
          <span className="text-[10px] font-bold text-[#5C6B63] uppercase tracking-wider block">
            Recent Order Dispatches
          </span>

          <div className="space-y-2 divide-y divide-[#D8E0DC]/40">
            {data.recentOrders.map((ord) => (
              <div
                key={ord.id}
                onClick={() => toast.info("Order Details", `Inspecting shipment for ${ord.id}`)}
                className="pt-2 first:pt-0 flex items-center justify-between gap-2.5 hover:bg-[#FBF8F1] p-1.5 rounded-xl transition-colors cursor-pointer group"
              >
                <div className="flex items-center space-x-2.5 truncate">
                  <img
                    src={ord.thumbnail}
                    alt={ord.productName}
                    className="w-9 h-9 rounded-lg object-cover border border-[#D8E0DC] shrink-0"
                  />
                  <div className="truncate">
                    <div className="flex items-center space-x-1.5">
                      <span className="font-mono font-bold text-xs text-[#0F3D2E]">{ord.id}</span>
                      <span className="text-[10px] text-[#5C6B63]">• {ord.customerName}</span>
                    </div>
                    <p className="text-[10px] text-[#5C6B63] truncate max-w-[200px]">
                      {ord.productName}
                    </p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="font-mono font-black text-xs text-[#0F3D2E] block">
                    {formatSellerINR(ord.amount)}
                  </span>
                  <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full uppercase ${
                    ord.status === 'Delivered'
                      ? 'bg-[#E8F2EE] text-[#0F3D2E]'
                      : ord.status === 'Shipped'
                      ? 'bg-[#E8F2EE] text-[#0F3D2E]'
                      : ord.status === 'New'
                      ? 'bg-[#FCF7E8] text-[#0F3D2E] border border-[#D4AF37]/50'
                      : 'bg-[#FBF8F1] text-[#5C6B63]'
                  }`}>
                    {ord.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      <div className="mt-3 pt-2.5 border-t border-[#D8E0DC]/60 text-right">
        <button
          type="button"
          onClick={() => toast.success("Batch Manifest Generated", "Print shipping labels for 6 new orders.")}
          className="text-[11px] font-bold text-[#0F3D2E] hover:text-[#D4AF37] link-interactive cursor-pointer"
        >
          Print Shipping Manifest (6 Orders) →
        </button>
      </div>
    </section>
  );
}
