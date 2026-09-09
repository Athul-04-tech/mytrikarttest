import React from 'react';
import { ShoppingBag, ArrowRight } from 'lucide-react';
import { formatCurrencyValue } from '../../data/sellerDashboardData';
import { useCountUp } from '../../hooks/useCountUp';
import { useToast } from '../../context/ToastContext';

function AnimatedCount({ target }) {
  const count = useCountUp(target, 600);
  return <span>{count}</span>;
}

export default function SellerOrdersWidget({ orderStatusCounts, recentOrders, onNavigateToOrders }) {
  const toast = useToast();

  const countsList = [
    { id: 'pending', label: 'Pending', count: Number(orderStatusCounts?.pending || 0), isHighlight: true },
    { id: 'processing', label: 'Processing', count: Number(orderStatusCounts?.processing || 0), isHighlight: false },
    { id: 'shipped', label: 'Shipped', count: Number(orderStatusCounts?.shipped || 0), isHighlight: false },
    { id: 'delivered', label: 'Delivered', count: Number(orderStatusCounts?.delivered || 0), isHighlight: false },
    { id: 'cancelled', label: 'Cancelled', count: Number(orderStatusCounts?.cancelled || 0), isUrgent: false }
  ];

  const recentList = (recentOrders || []).map(order => ({
    id: order.id,
    orderNumber: order.order_number || `#ORD-${order.id}`,
    productName: Array.isArray(order.product_names) ? order.product_names.join(', ') : (order.productName || 'Order Item'),
    amount: order.amount,
    currency: order.currency || 'INR',
    status: order.status
  }));

  return (
    <section aria-labelledby="orders-widget-heading" className="bg-white rounded-3xl border border-[#EAE3DC] p-5 sm:p-6 shadow-xs flex flex-col justify-between h-full">
      <div>
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#EAE3DC]">
          <div className="flex items-center space-x-2">
            <span className="p-1 rounded-lg bg-[#FFF3EC] text-[#FA661C]">
              <ShoppingBag className="w-4 h-4 text-[#FA661C]" />
            </span>
            <h3 id="orders-widget-heading" className="font-['Outfit'] font-extrabold text-base text-[#FA661C]">
              Orders Fulfillment Queue
            </h3>
          </div>

          <button
            type="button"
            onClick={onNavigateToOrders}
            className="text-xs font-bold text-[#FA661C] hover:text-[#FF811A] link-interactive flex items-center space-x-0.5 cursor-pointer"
          >
            <span>View All Orders</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* 5 Status Count Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 my-3 text-xs">
          {countsList.map((st) => (
            <div
              key={st.id}
              className={`p-2.5 rounded-xl border flex flex-col justify-between ${
                st.isHighlight
                  ? 'bg-[#FFF8F2] border-[#FF811A]/60 shadow-2xs'
                  : st.isUrgent
                  ? 'bg-[#FDE8EA]/40 border-[#D7263D]/30'
                  : 'bg-[#FFFFFF] border-[#EAE3DC]'
              }`}
            >
              <span className="text-[10px] font-bold text-[#6B6058] truncate">
                {st.label}
              </span>
              <div className={`font-['Outfit'] font-black text-lg mt-0.5 ${
                st.isHighlight ? 'text-[#FA661C]' : st.isUrgent ? 'text-[#D7263D]' : 'text-[#FA661C]'
              }`}>
                {orderStatusCounts ? <AnimatedCount target={st.count} /> : '—'}
              </div>
            </div>
          ))}
        </div>

        {/* Mini Recent Orders List */}
        <div className="mt-4 space-y-2">
          <span className="text-[10px] font-bold text-[#6B6058] uppercase tracking-wider block">
            Recent Order Dispatches
          </span>

          {recentList.length === 0 ? (
            <div className="p-4 bg-[#FFF3EC]/40 rounded-xl border border-[#EAE3DC] text-center text-xs text-[#6B6058]">
              No recent orders
            </div>
          ) : (
            <div className="space-y-2 divide-y divide-[#EAE3DC]/40">
              {recentList.map((ord) => (
                <div
                  key={ord.id}
                  onClick={() => toast.info("Order Details", `Inspecting shipment for ${ord.orderNumber}`)}
                  className="pt-2 first:pt-0 flex items-center justify-between gap-2.5 hover:bg-[#FFFFFF] p-1.5 rounded-xl transition-colors cursor-pointer group"
                >
                  <div className="flex items-center space-x-2.5 truncate">
                    <div className="truncate">
                      <div className="flex items-center space-x-1.5">
                        <span className="font-mono font-bold text-xs text-[#FA661C]">{ord.orderNumber}</span>
                      </div>
                      <p className="text-[10px] text-[#6B6058] truncate max-w-[200px]">
                        {ord.productName}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="font-mono font-black text-xs text-[#FA661C] block">
                      {formatCurrencyValue(ord.amount, ord.currency)}
                    </span>
                    <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full uppercase ${
                      ord.status === 'delivered' || ord.status === 'Delivered'
                        ? 'bg-[#FFF3EC] text-[#FA661C]'
                        : ord.status === 'shipped' || ord.status === 'Shipped'
                        ? 'bg-[#FFF3EC] text-[#FA661C]'
                        : ord.status === 'pending' || ord.status === 'New'
                        ? 'bg-[#FFF8F2] text-[#FA661C] border border-[#FF811A]/50'
                        : 'bg-[#FFFFFF] text-[#6B6058]'
                    }`}>
                      {ord.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      <div className="mt-3 pt-2.5 border-t border-[#EAE3DC]/60 text-right">
        <button
          type="button"
          onClick={() => toast.success("Batch Manifest Generated", "Print shipping labels for orders.")}
          className="text-[11px] font-bold text-[#FA661C] hover:text-[#FF811A] link-interactive cursor-pointer"
        >
          Print Shipping Manifest →
        </button>
      </div>
    </section>
  );
}
