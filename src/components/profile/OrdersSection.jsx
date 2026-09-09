import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Package, 
  Truck, 
  CheckCircle2, 
  XCircle, 
  RotateCcw, 
  Download, 
  Repeat, 
  ChevronRight, 
  Eye, 
  ArrowRight, 
  Sparkles, 
  Calendar, 
  AlertTriangle 
} from 'lucide-react';

const TRACKING_STEPS = [
  "Order Placed",
  "Confirmed",
  "Shipped",
  "Out for Delivery",
  "Delivered"
];

export default function OrdersSection({ orders = [] }) {
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [activeTrackingOrderId, setActiveTrackingOrderId] = useState(null);

  const filteredOrders = orders.filter(order => {
    if (selectedFilter === 'all') return true;
    if (selectedFilter === 'processing') return order.statusType === 'processing';
    if (selectedFilter === 'delivered') return order.statusType === 'delivered';
    if (selectedFilter === 'cancelled') return order.statusType === 'cancelled';
    return true;
  });

  const handleAction = (actionName, orderId) => {
    alert(`Action [${actionName}] triggered for Order #${orderId}`);
  };

  return (
    <div className="bg-white rounded-3xl border border-[#EAE3DC] p-6 sm:p-8 lg:p-10 shadow-xs animate-reveal">
      
      {/* Header & Status Filter Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#EAE3DC]">
        <div>
          <h2 className="font-['Outfit'] text-2xl sm:text-3xl font-extrabold text-[#FA661C] tracking-tight">
            My Orders
          </h2>
          <p className="text-xs sm:text-sm text-[#6B6058] mt-1">
            Track live consignments, download tax invoices, and manage returns
          </p>
        </div>

        {/* Filter Pills with Micro-Interactions */}
        <div className="flex items-center space-x-1.5 overflow-x-auto no-scrollbar py-1">
          {[
            { id: 'all', label: 'All Orders' },
            { id: 'processing', label: 'In Transit' },
            { id: 'delivered', label: 'Delivered' },
            { id: 'cancelled', label: 'Cancelled' }
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSelectedFilter(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 btn-interactive cursor-pointer ${
                selectedFilter === tab.id
                  ? 'bg-[#FA661C] text-[#FFFFFF] shadow-xs'
                  : 'bg-[#FFFFFF] text-[#6B6058] hover:text-[#FA661C] border border-[#EAE3DC]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Orders Stream */}
      <div className="mt-8 space-y-6">
        {filteredOrders.length === 0 ? (
          <div className="text-center py-16 px-4 bg-[#FFFFFF]/40 border border-dashed border-[#EAE3DC] rounded-2xl">
            <div className="w-16 h-16 rounded-full bg-[#FFF3EC] text-[#FA661C] flex items-center justify-center mx-auto mb-4 shadow-2xs">
              <Package className="w-8 h-8" />
            </div>
            <h3 className="font-['Outfit'] text-lg font-bold text-[#FA661C]">No Orders Placed Yet</h3>
            <p className="text-xs text-[#6B6058] max-w-sm mx-auto mt-1 mb-6">
              When you purchase items on MytriKart, your complete order history, invoice downloads, and live shipment tracking will appear here.
            </p>
            <Link
              to="/"
              className="inline-flex items-center space-x-2 px-5 py-2.5 bg-[#FA661C] hover:bg-[#E0530B] text-[#FFFFFF] rounded-xl text-xs font-bold transition-all shadow-xs btn-interactive"
            >
              <span>Explore Marketplace</span>
              <ArrowRight className="w-4 h-4 text-[#FF811A]" />
            </Link>
          </div>
        ) : (
          filteredOrders.map((order) => {
          const isTrackingOpen = activeTrackingOrderId === order.id;

          return (
            <div
              key={order.id}
              className="border border-[#EAE3DC] rounded-2xl overflow-hidden bg-[#FFFFFF]/30 hover:border-[#FF811A]/60 shadow-2xs card-interactive"
            >
              {/* Order Header Summary */}
              <div className="p-4 sm:p-5 bg-white border-b border-[#EAE3DC]/80 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center space-x-4">
                  <div className="p-2 rounded-xl bg-[#FFF3EC] text-[#FA661C] icon-interactive">
                    <Package className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h4 className="font-['Outfit'] font-extrabold text-sm sm:text-base text-[#FA661C]">
                        Order #{order.id}
                      </h4>
                      {/* Status Badges */}
                      <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md uppercase tracking-wider ${
                        order.statusType === 'delivered'
                          ? 'bg-[#FFF3EC] text-[#FA661C] border border-[#FA661C]/20'
                          : order.statusType === 'processing'
                          ? 'bg-[#FFF8F2] text-[#FA661C] border border-[#FF811A] ring-1 ring-[#FF811A]/30'
                          : 'bg-[#FDE8EA] text-[#D7263D] border border-[#D7263D]/30'
                      }`}>
                        {order.status}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#6B6058] mt-0.5 flex items-center space-x-2">
                      <span>Placed on {order.date}</span>
                      <span>•</span>
                      <span>Total: <strong className="text-[#FA661C]">{order.total}</strong></span>
                    </p>
                  </div>
                </div>

                {/* Primary Action Buttons */}
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => setActiveTrackingOrderId(isTrackingOpen ? null : order.id)}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold text-[#FA661C] bg-[#FFF8F2] hover:bg-[#FF811A]/25 border border-[#FF811A] btn-interactive flex items-center space-x-1 cursor-pointer"
                  >
                    <Truck className="w-3.5 h-3.5 text-[#FA661C] icon-interactive" />
                    <span>{isTrackingOpen ? 'Hide Tracker' : 'Live Tracking'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleAction('Invoice Download', order.id)}
                    className="p-1.5 rounded-xl text-[#6B6058] hover:text-[#FA661C] bg-white border border-[#EAE3DC] hover:border-[#FA661C] btn-interactive cursor-pointer"
                    title="Download Tax Invoice PDF"
                  >
                    <Download className="w-4 h-4 icon-interactive" />
                  </button>
                </div>
              </div>

              {/* Items in this Order */}
              <div className="p-4 sm:p-5 space-y-4">
                {order.items.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between gap-4 group/item">
                    <div className="flex items-center space-x-3.5">
                      <div className="overflow-hidden rounded-xl border border-[#EAE3DC]">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-16 h-16 sm:w-18 sm:h-18 object-cover card-img-zoom"
                        />
                      </div>
                      <div>
                        <h5 className="font-bold text-xs sm:text-sm text-[#FA661C] line-clamp-1 group-hover/item:text-[#E0530B] transition-colors">
                          {item.name}
                        </h5>
                        <p className="text-[11px] text-[#6B6058] mt-0.5">
                          Sold by: <span className="font-semibold text-[#FA661C]">{item.seller}</span> | Qty: {item.qty}
                        </p>
                        <p className="text-xs font-extrabold text-[#FA661C] mt-1">
                          {item.price}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleAction('View Details', order.id)}
                      className="text-xs font-bold text-[#FA661C] link-interactive flex items-center space-x-1 shrink-0 cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5 icon-interactive" />
                      <span className="hidden sm:inline">Product Info</span>
                    </button>
                  </div>
                ))}
              </div>

              {/* STEPPED TRACKER COMPONENT */}
              {isTrackingOpen && order.statusType !== 'cancelled' && (
                <div className="px-5 pb-6 pt-2 bg-white border-t border-[#EAE3DC] animate-dropdown">
                  <div className="flex items-center justify-between mb-3 text-xs">
                    <span className="font-bold text-[#FA661C] flex items-center space-x-1.5">
                      <Truck className="w-4 h-4 text-[#FF811A] icon-interactive" />
                      <span>Shipment Tracker — {order.carrier || 'Express Direct'}</span>
                    </span>
                    <span className="text-[11px] text-[#6B6058]">
                      Est. Arrival: <strong className="text-[#FA661C]">{order.estimatedDelivery || order.deliveredOn}</strong>
                    </span>
                  </div>

                  {/* Visual Stepped Progress Bar */}
                  <div className="relative my-6 px-2 sm:px-6">
                    {/* Background track line */}
                    <div className="absolute top-1/2 left-4 right-4 h-1 bg-[#EAE3DC] -translate-y-1/2 z-0" />
                    
                    {/* Active progress fill line */}
                    <div 
                      className="absolute top-1/2 left-4 h-1 bg-gradient-to-r from-[#FA661C] to-[#FF811A] -translate-y-1/2 z-0 transition-all duration-500"
                      style={{ width: `${((order.trackingStep - 1) / (TRACKING_STEPS.length - 1)) * 92}%` }}
                    />

                    {/* Step Nodes */}
                    <div className="relative z-10 flex items-center justify-between">
                      {TRACKING_STEPS.map((stepName, sIdx) => {
                        const stepNum = sIdx + 1;
                        const isCompleted = stepNum <= order.trackingStep;
                        const isCurrent = stepNum === order.trackingStep;

                        return (
                          <div key={sIdx} className="flex flex-col items-center">
                            <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs font-black transition-all ${
                              isCompleted
                                ? 'bg-[#FA661C] text-[#FF811A] ring-4 ring-[#FFF8F2] shadow-xs scale-105'
                                : 'bg-[#EAE3DC] text-[#6B6058]'
                            }`}>
                              {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : stepNum}
                            </div>
                            <span className={`text-[10px] sm:text-[11px] font-bold mt-2 text-center max-w-[70px] ${
                              isCurrent ? 'text-[#FA661C]' : isCompleted ? 'text-[#6B6058]' : 'text-[#6B6058]/60'
                            }`}>
                              {stepName}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* Bottom Action Tray */}
              <div className="px-4 py-3 bg-[#FFF3EC]/40 border-t border-[#EAE3DC]/80 flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex flex-wrap items-center gap-2">
                  {order.canCancel && (
                    <button
                      type="button"
                      onClick={() => handleAction('Cancel Order', order.id)}
                      className="px-3 py-1 bg-white hover:bg-[#FDE8EA] text-[#D7263D] border border-[#EAE3DC] hover:border-[#D7263D] rounded-lg font-bold btn-interactive cursor-pointer"
                    >
                      Cancel Order
                    </button>
                  )}

                  {order.canReturn && (
                    <>
                      <button
                        type="button"
                        onClick={() => handleAction('Return Request', order.id)}
                        className="px-3 py-1 bg-white hover:bg-[#FFF8F2] text-[#FA661C] border border-[#EAE3DC] hover:border-[#FF811A] rounded-lg font-bold btn-interactive flex items-center space-x-1 cursor-pointer"
                      >
                        <RotateCcw className="w-3 h-3 text-[#FF811A] icon-interactive" />
                        <span>Return Item</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleAction('Replacement Request', order.id)}
                        className="px-3 py-1 bg-white hover:bg-[#FFF8F2] text-[#FA661C] border border-[#EAE3DC] hover:border-[#FF811A] rounded-lg font-bold btn-interactive cursor-pointer"
                      >
                        Replacement
                      </button>

                      <button
                        type="button"
                        onClick={() => handleAction('Exchange Request', order.id)}
                        className="px-3 py-1 bg-white hover:bg-[#FFF8F2] text-[#FA661C] border border-[#EAE3DC] hover:border-[#FF811A] rounded-lg font-bold btn-interactive cursor-pointer"
                      >
                        Exchange
                      </button>
                    </>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => handleAction('Reorder / Buy Again', order.id)}
                  className="px-3.5 py-1.5 bg-[#FA661C] hover:bg-[#E0530B] text-[#FFFFFF] rounded-xl font-bold btn-interactive flex items-center space-x-1.5 ml-auto shadow-2xs cursor-pointer"
                >
                  <Repeat className="w-3.5 h-3.5 text-[#FF811A] icon-interactive" />
                  <span>Buy Again</span>
                </button>
              </div>

            </div>
          );
        }))}
      </div>
    </div>
  );
}
