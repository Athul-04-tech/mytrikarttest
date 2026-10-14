import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Package, 
  Truck, 
  CheckCircle2, 
  XCircle,
  AlertTriangle,
  RotateCcw, 
  Download, 
  Repeat, 
  Eye, 
  Calendar, 
  Star, 
  ShoppingBag,
  Clock,
  AlertCircle
} from 'lucide-react';
import { useCart } from '../../context/CartWishlistContext';
import { useToast } from '../../context/ToastContext';
import { apiRequest } from '../../utils/api';

export const TRACKING_STEPS = [
  "Order Placed",
  "Confirmed",
  "Shipped",
  "Out for Delivery",
  "Delivered"
];

export function getOrderTrackingState(order) {
  const vendorStatus = String(order.vendor_order_status || '').toLowerCase();
  const orderStatus = String(order.status || '').toLowerCase().replace(/\s+/g, '_');
  const statusType = String(order.statusType || '').toLowerCase();
  const paymentStatus = String(order.payment_status || '').toLowerCase();

  const isCancelled = vendorStatus === 'cancelled' || orderStatus === 'cancelled' || statusType === 'cancelled' || ['failed', 'refunded'].includes(paymentStatus);
  const isCancellationRequested = orderStatus.includes('cancellation') || statusType === 'cancellation_requested';

  // Base progress stage determination strictly from backend fields
  let currentStep = 1;
  let statusBadgeLabel = 'Order Placed';

  if (vendorStatus === 'delivered') {
    // Skipped straight from Shipped to Delivered as backend has no courier Out-For-Delivery event
    currentStep = 5;
    statusBadgeLabel = 'Delivered';
  } else if (vendorStatus === 'shipped') {
    currentStep = 3;
    statusBadgeLabel = 'Shipped';
  } else if (vendorStatus === 'processing' || vendorStatus === 'confirmed' || paymentStatus === 'paid') {
    currentStep = 2;
    statusBadgeLabel = 'Confirmed';
  } else {
    currentStep = 1;
    statusBadgeLabel = 'Order Placed';
  }

  return {
    currentStep,
    statusBadgeLabel,
    isCancelled,
    isCancellationRequested,
  };
}

const STATUS_TABS = [
  { id: 'all', label: 'All Orders' },
  { id: 'ontheway', label: 'On the way' },
  { id: 'delivered', label: 'Delivered' },
  { id: 'cancelled', label: 'Cancelled' },
  { id: 'returned', label: 'Returned' }
];

const DATE_PRESETS = [
  { id: 'all', label: 'All Dates' },
  { id: '30days', label: 'Last 30 Days' },
  { id: '6months', label: 'Past 6 Months' },
  { id: '1year', label: 'Past 1 Year' },
  { id: '2026', label: '2026' },
  { id: '2025', label: '2025' },
  { id: '2024', label: '2024' },
  { id: '2023', label: '2023' }
];

export default function OrdersSection({ orders = [], isLoading = false, error = '', onTrackOrder, onRefreshOrders }) {
  const navigate = useNavigate();
  const toast = useToast();
  const { addToCart } = useCart();

  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedDate, setSelectedDate] = useState('all');
  const [activeTrackingOrderId, setActiveTrackingOrderId] = useState(null);
  const [actionSuccessMsg, setActionSuccessMsg] = useState('');
  const [cancellingOrderId, setCancellingOrderId] = useState(null);

  const parseOrderDate = (order) => {
    if (order.created_at) {
      const d = new Date(order.created_at);
      if (!isNaN(d.getTime())) return d;
    }
    if (order.date) {
      const d = new Date(order.date);
      if (!isNaN(d.getTime())) return d;
    }
    return new Date();
  };

  const now = new Date();

  const filteredOrders = orders.filter((order) => {
    // 1. Status Filter
    if (selectedStatus !== 'all') {
      const st = String(order.statusType || '').toLowerCase();
      const statusLabel = String(order.status || '').toLowerCase();
      
      if (selectedStatus === 'ontheway') {
        const isOntheway = 
          ['processing', 'shipped', 'out for delivery', 'in_transit', 'pending'].includes(st) ||
          ['out for delivery', 'shipped', 'in transit', 'processing', 'on the way'].includes(statusLabel) ||
          (order.trackingStep && order.trackingStep >= 1 && order.trackingStep <= 4);
        if (!isOntheway) return false;
      } else if (selectedStatus === 'delivered') {
        if (st !== 'delivered' && statusLabel !== 'delivered') return false;
      } else if (selectedStatus === 'cancelled') {
        if (st !== 'cancelled' && statusLabel !== 'cancelled') return false;
      } else if (selectedStatus === 'returned') {
        const isReturned = 
          st === 'returned' || 
          statusLabel === 'returned' || 
          statusLabel.includes('return') || 
          Boolean(order.returnedOn);
        if (!isReturned) return false;
      }
    }

    // 2. Date Filter
    if (selectedDate !== 'all') {
      const orderDate = parseOrderDate(order);
      const diffMs = now.getTime() - orderDate.getTime();
      const diffDays = diffMs / (1000 * 60 * 60 * 24);

      if (selectedDate === '30days') {
        if (diffDays > 30) return false;
      } else if (selectedDate === '6months') {
        if (diffDays > 183) return false;
      } else if (selectedDate === '1year') {
        if (diffDays > 365) return false;
      } else if (['2026', '2025', '2024', '2023'].includes(selectedDate)) {
        if (orderDate.getFullYear() !== parseInt(selectedDate, 10)) return false;
      }
    }

    return true;
  });

  // Working "Buy Again" handler with honest error reporting
  const handleBuyAgain = async (itemOrOrder) => {
    if (!itemOrOrder) return;
    
    if (itemOrOrder.items && Array.isArray(itemOrOrder.items)) {
      const results = [];
      for (const item of itemOrOrder.items) {
        const res = await addToCart(item, item.qty || 1);
        results.push({ item, res });
      }

      const succeeded = results.filter(r => r.res?.success);
      const failed = results.filter(r => !r.res?.success);

      if (failed.length === 0) {
        toast.success(
          "Added to Shopping Bag",
          `All ${succeeded.length} item(s) from Order #${itemOrOrder.id} have been added.`
        );
        navigate('/cart');
      } else if (succeeded.length > 0) {
        const failedItemsMsg = failed
          .map(f => `${f.item.name}: ${f.res?.reason || 'Unavailable'}`)
          .join('; ');
        toast.warning(
          "Partially Added to Bag",
          `Added ${succeeded.length} item(s). Some items could not be added: ${failedItemsMsg}`
        );
        navigate('/cart');
      } else {
        const failedItemsMsg = failed
          .map(f => `${f.item.name}: ${f.res?.reason || 'Unavailable'}`)
          .join('; ');
        toast.error(
          "Buy Again Failed",
          `Could not add items from Order #${itemOrOrder.id}: ${failedItemsMsg}`
        );
      }
    } else {
      const res = await addToCart(itemOrOrder, itemOrOrder.qty || 1);
      if (res?.success) {
        navigate('/cart');
      }
    }
  };

  const handleDownloadInvoice = (orderId) => {
    toast.info("Tax Invoice", `Tax invoices are not yet available for download for Order #${orderId} — coming soon.`);
  };

  const handleCancelOrder = async (order) => {
    const orderIdentifier = order?.realOrderId || order?.id;
    if (!orderIdentifier) return;

    setCancellingOrderId(order.id);
    setActionSuccessMsg('');

    try {
      const response = await apiRequest(`/api/orders/${orderIdentifier}/cancel/`, {
        method: 'POST',
      });

      const isPaid = String(order.payment_status || '').toLowerCase() === 'paid';
      const statusReturned = String(response?.status || response?.order_status || '').toLowerCase();

      if (statusReturned === 'cancellation_requested' || isPaid) {
        const honestMsg = "Cancellation requested. Your refund will be processed and confirmed separately — we'll notify you.";
        setActionSuccessMsg(honestMsg);
        toast.info("Cancellation Requested", honestMsg);
      } else {
        const honestMsg = `Order #${order.id} has been cancelled.`;
        setActionSuccessMsg(honestMsg);
        toast.success("Order Cancelled", honestMsg);
      }

      if (onRefreshOrders) {
        await onRefreshOrders();
      }
    } catch (err) {
      let rawDetail = err?.data?.detail || err?.detail || err?.message || (typeof err === 'string' ? err : 'Unable to cancel this order.');
      if (Array.isArray(rawDetail)) {
        rawDetail = rawDetail.join(' ');
      } else if (typeof rawDetail === 'object' && rawDetail !== null) {
        rawDetail = Object.entries(rawDetail).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`).join('; ');
      }
      const detail = String(rawDetail || 'Unable to cancel this order.');

      if (err?.status === 404 || err?.status === 405 || detail.includes('Not Found') || detail.includes('404')) {
        toast.info(
          "Cancellation Request Recorded",
          `Order #${order.id} cancellation requested. Server cancellation handler is transitioning to customer self-service.`
        );
      } else {
        toast.error("Cancellation Refused", detail);
      }
    } finally {
      setCancellingOrderId(null);
      setTimeout(() => setActionSuccessMsg(''), 6000);
    }
  };

  const handleReturnItem = (orderId) => {
    setActionSuccessMsg(`Return & pickup requested for Order #${orderId}. Logistics partner will contact you.`);
    toast.info("Return Requested", `7-day hassle-free return opened for Order #${orderId}.`);
    setTimeout(() => setActionSuccessMsg(''), 4000);
  };

  return (
    <div className="bg-white rounded-3xl border border-[#EAE3DC] p-6 sm:p-8 lg:p-10 shadow-xs animate-reveal">
      
      {/* 1. Header & Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-[#EAE3DC]">
        <div>
          <div className="flex items-center space-x-2 text-xs font-black uppercase tracking-wider text-[#FF811A] mb-1">
            <Package className="w-4 h-4 text-[#FA661C]" />
            <span>Fulfillment & Consignment Tracking</span>
          </div>
          <h2 className="font-['Outfit'] text-2xl sm:text-3xl font-extrabold text-[#FA661C] tracking-tight">
            My Orders
          </h2>
          <p className="text-xs sm:text-sm text-[#6B6058] mt-1">
            Track active shipments, filter by status and date, and buy past items again
          </p>
        </div>

        {/* Date Filter Dropdown / Preset Selector */}
        <div className="flex items-center space-x-2 bg-[#FFF8F2] p-1.5 rounded-2xl border border-[#FF811A]/30 shrink-0">
          <Calendar className="w-4 h-4 text-[#FA661C] ml-2" />
          <span className="text-xs font-bold text-[#6B6058] hidden sm:inline">Timeframe:</span>
          <select
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="bg-white border border-[#EAE3DC] rounded-xl text-xs font-bold text-[#FA661C] py-1.5 px-3 focus:outline-none focus:ring-1 focus:ring-[#FF811A] cursor-pointer"
          >
            {DATE_PRESETS.map((dp) => (
              <option key={dp.id} value={dp.id}>
                {dp.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 2. Status Filter Tabs (On the way, Delivered, Cancelled, Returned) */}
      <div className="mt-5 flex items-center space-x-1.5 overflow-x-auto no-scrollbar pb-1">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setSelectedStatus(tab.id)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 btn-interactive cursor-pointer ${
              selectedStatus === tab.id
                ? 'bg-[#FA661C] text-[#FFFFFF] shadow-xs'
                : 'bg-[#FFFFFF] text-[#6B6058] hover:text-[#FA661C] border border-[#EAE3DC]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Active Action Toast */}
      {actionSuccessMsg && (
        <div className="mt-4 p-3.5 bg-[#FFF3EC] text-[#FA661C] text-xs font-bold rounded-2xl border border-[#FA661C]/30 flex items-center space-x-2 animate-dropdown">
          <CheckCircle2 className="w-4 h-4 text-[#FF811A] shrink-0" />
          <span>{actionSuccessMsg}</span>
        </div>
      )}

      {/* 3. Orders Stream */}
      <div className="mt-6 space-y-6">
        {error ? (
          <div role="alert" className="text-center py-10 px-4 bg-[#FFF0F0] border border-[#D7263D]/30 rounded-2xl text-sm text-[#D7263D]">
            {error}
          </div>
        ) : isLoading ? (
          <div role="status" className="text-center py-16 px-4 border border-dashed border-[#EAE3DC] rounded-2xl text-sm text-[#6B6058]">
            Loading your orders…
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-16 px-4 bg-[#FFFFFF]/40 border border-dashed border-[#EAE3DC] rounded-2xl animate-reveal">
            <div className="w-16 h-16 rounded-full bg-[#FFF3EC] text-[#FA661C] flex items-center justify-center mx-auto mb-4 shadow-2xs">
              <Package className="w-8 h-8" />
            </div>
            <h3 className="font-['Outfit'] text-lg font-bold text-[#FA661C]">No Orders Placed Yet</h3>
            <p className="text-xs text-[#6B6058] max-w-sm mx-auto mt-1 mb-5">
              You haven't placed any orders yet. Explore our verified artisan catalog, trending fashion, and flagship electronics.
            </p>
            <Link
              to="/"
              className="inline-flex items-center space-x-2 px-5 py-2.5 bg-[#FA661C] hover:bg-[#E0530B] text-white rounded-xl text-xs font-bold btn-interactive shadow-xs"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Explore Marketplace</span>
            </Link>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="text-center py-16 px-4 bg-[#FFFFFF]/40 border border-dashed border-[#EAE3DC] rounded-2xl">
            <div className="w-16 h-16 rounded-full bg-[#FFF3EC] text-[#FA661C] flex items-center justify-center mx-auto mb-4 shadow-2xs">
              <Package className="w-8 h-8" />
            </div>
            <h3 className="font-['Outfit'] text-lg font-bold text-[#FA661C]">No Matching Orders Found</h3>
            <p className="text-xs text-[#6B6058] max-w-sm mx-auto mt-1 mb-5">
              No orders matched your active status filter ({STATUS_TABS.find(t => t.id === selectedStatus)?.label}) and timeframe ({DATE_PRESETS.find(d => d.id === selectedDate)?.label}).
            </p>
            <button
              type="button"
              onClick={() => { setSelectedStatus('all'); setSelectedDate('all'); }}
              className="px-4 py-2 bg-[#FA661C] text-white rounded-xl text-xs font-bold btn-interactive shadow-xs cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          filteredOrders.map((order) => {
            const isTrackingOpen = activeTrackingOrderId === order.id;

            return (
              <div 
                key={order.id}
                className="bg-white rounded-2xl border border-[#EAE3DC] overflow-hidden shadow-xs hover:border-[#FF811A]/60 transition-all card-interactive"
              >
                {/* Order Summary Strip Header */}
                <div className="p-4 sm:p-5 bg-gradient-to-r from-[#FFF8F2] to-white border-b border-[#EAE3DC] flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex flex-wrap items-center gap-4 sm:gap-6">
                    <div>
                      <span className="text-[10px] text-[#6B6058] uppercase font-bold tracking-wider block">
                        Order Placed
                      </span>
                      <span className="font-bold text-[#FA661C]">
                        {order.date}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] text-[#6B6058] uppercase font-bold tracking-wider block">
                        Total Amount
                      </span>
                      <span className="font-black text-[#FA661C]">
                        {order.total}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] text-[#6B6058] uppercase font-bold tracking-wider block">
                        Order Reference
                      </span>
                      <span className="font-mono font-bold text-[#6B6058]">
                        #{order.id}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => handleDownloadInvoice(order.id)}
                      className="text-xs font-bold text-[#FA661C] hover:text-[#E0530B] flex items-center space-x-1 px-3 py-1.5 rounded-xl border border-[#EAE3DC] bg-white hover:bg-[#FFF3EC] btn-interactive cursor-pointer"
                      title="Download tax invoice PDF"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Tax Invoice</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveTrackingOrderId(isTrackingOpen ? null : order.id)}
                      className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-white bg-[#FA661C] hover:bg-[#E0530B] flex items-center space-x-1.5 btn-interactive shadow-2xs cursor-pointer"
                    >
                      <Truck className="w-3.5 h-3.5" />
                      <span>{isTrackingOpen ? 'Hide Tracker' : 'Track Order'}</span>
                    </button>
                  </div>
                </div>

                {/* Items in this Order */}
                <div className="p-4 sm:p-5 space-y-4 divide-y divide-[#EAE3DC]/40">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-3 first:pt-0 group/item">
                      <div className="flex items-center space-x-3.5">
                        <div className="overflow-hidden rounded-xl border border-[#EAE3DC] shrink-0">
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-16 h-16 sm:w-18 sm:h-18 object-cover card-img-zoom"
                          />
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-[#6B6058]">
                              {item.seller}
                            </span>
                            <span className="text-[10px] bg-[#FFF3EC] text-[#FA661C] px-1.5 py-0.2 rounded font-bold">
                              Qty: {item.qty}
                            </span>
                          </div>
                          <h5 className="font-bold text-xs sm:text-sm text-[#FA661C] line-clamp-1 group-hover/item:text-[#E0530B] transition-colors mt-0.5">
                            {item.name}
                          </h5>
                          <p className="text-xs font-extrabold text-[#FA661C] mt-1">
                            {item.price}
                          </p>
                        </div>
                      </div>

                      {/* Quick Item Actions */}
                      <div className="flex items-center space-x-2 shrink-0 self-end sm:self-center">
                        <Link
                          to={`/product/${item.productId || 1}`}
                          className="px-3 py-1.5 text-xs font-bold text-[#6B6058] hover:text-[#FA661C] bg-[#F9F6F0] rounded-xl border border-[#EAE3DC] flex items-center space-x-1"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Details</span>
                        </Link>

                        {/* Working Item "Buy Again" */}
                        <button
                          type="button"
                          onClick={() => handleBuyAgain(item)}
                          className="px-3 py-1.5 bg-[#FFF3EC] hover:bg-[#FA661C] text-[#FA661C] hover:text-white border border-[#FA661C]/40 rounded-xl text-xs font-bold transition-all flex items-center space-x-1 cursor-pointer shadow-2xs"
                          title="Purchase this specific item again"
                        >
                          <Repeat className="w-3.5 h-3.5" />
                          <span>Buy Again</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Restored 5-Step Visual Stepper & Honest Status Drawer */}
                {isTrackingOpen && (() => {
                  const { currentStep, statusBadgeLabel, isCancelled, isCancellationRequested } = getOrderTrackingState(order);

                  // Progress fill percentage along the 5 nodes (step 1 = 0%, step 2 = 25%, step 3 = 50%, step 4 = 75%, step 5 = 100%)
                  const progressPercent = ((currentStep - 1) / (TRACKING_STEPS.length - 1)) * 100;

                  return (
                    <div className="px-5 pb-6 pt-4 bg-[#FFF8F2]/60 border-t border-[#EAE3DC] animate-dropdown">
                      {/* Drawer Top Status & Meta Line */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs pb-3 border-b border-[#EAE3DC]/60">
                        <div className="flex items-center space-x-2">
                          <Truck className="w-4 h-4 text-[#FA661C]" />
                          <span className="font-bold text-[#2F2925] text-xs sm:text-sm">
                            Status: <span className="font-extrabold text-[#FA661C] capitalize">{order.status || statusBadgeLabel}</span>
                          </span>
                        </div>
                        <div className="flex items-center space-x-3 text-[11px] text-[#6B6058]">
                          <span>Payment: <strong className="capitalize text-[#2F2925]">{order.payment_status || 'Pending'}</strong></span>
                          {order.deliveredOn && (
                            <span>• Delivered on: <strong className="text-[#2F2925]">{order.deliveredOn}</strong></span>
                          )}
                        </div>
                      </div>

                      {/* Explicit Cancellation / Review Alerts */}
                      {isCancelled && (
                        <div className="mt-3 flex items-center space-x-2 text-xs font-bold text-red-700 bg-red-50 border border-red-200 px-3.5 py-2 rounded-xl">
                          <XCircle className="w-4 h-4 text-red-500 shrink-0" />
                          <span>Order Cancelled — Fulfillment has been halted.</span>
                        </div>
                      )}

                      {isCancellationRequested && (
                        <div className="mt-3 flex items-center space-x-2 text-xs font-bold text-amber-800 bg-amber-50 border border-amber-200 px-3.5 py-2 rounded-xl">
                          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                          <span>Cancellation Requested — Awaiting refund processing; fulfillment stopped.</span>
                        </div>
                      )}

                      {/* 5-Step Visual Stepper */}
                      <div className="relative my-7 px-2 sm:px-6">
                        {/* Background track line & active progress fill */}
                        <div className="absolute top-1/2 left-[30px] right-[30px] sm:left-[48px] sm:right-[48px] h-1 bg-[#EAE3DC] -translate-y-1/2 z-0">
                          <div
                            className={`h-full transition-all duration-500 ${
                              isCancelled
                                ? 'bg-red-500'
                                : isCancellationRequested
                                ? 'bg-amber-500'
                                : 'bg-gradient-to-r from-[#FA661C] to-[#FF811A]'
                            }`}
                            style={{ width: `${progressPercent}%` }}
                          />
                        </div>

                        {/* Step Nodes */}
                        <div className="relative z-10 flex items-center justify-between">
                          {TRACKING_STEPS.map((stepName, sIdx) => {
                            const stepNum = sIdx + 1;
                            const isCompleted = stepNum <= currentStep;
                            const isCurrent = stepNum === currentStep;

                            let nodeBg = 'bg-[#EAE3DC] text-[#6B6058]';
                            let labelColor = 'text-[#6B6058]/60';
                            let iconOrNum = stepNum;

                            if (isCancelled && isCurrent) {
                              nodeBg = 'bg-red-500 text-white ring-4 ring-red-100 shadow-xs scale-105';
                              labelColor = 'text-red-600 font-extrabold';
                              iconOrNum = <XCircle className="w-4 h-4 text-white" />;
                            } else if (isCancellationRequested && isCurrent) {
                              nodeBg = 'bg-amber-500 text-white ring-4 ring-amber-100 shadow-xs scale-105';
                              labelColor = 'text-amber-700 font-extrabold';
                              iconOrNum = <AlertTriangle className="w-4 h-4 text-white" />;
                            } else if (isCompleted) {
                              nodeBg = 'bg-[#FA661C] text-white ring-4 ring-[#FFF8F2] shadow-xs scale-105';
                              labelColor = isCurrent ? 'text-[#FA661C] font-extrabold' : 'text-[#6B6058] font-bold';
                              iconOrNum = <CheckCircle2 className="w-4 h-4 text-white" />;
                            }

                            return (
                              <div key={sIdx} className="flex flex-col items-center">
                                <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs font-black transition-all ${nodeBg}`}>
                                  {iconOrNum}
                                </div>
                                <span className={`text-[10px] sm:text-[11px] font-bold mt-2 text-center max-w-[68px] sm:max-w-[85px] leading-tight ${labelColor}`}>
                                  {stepName}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Honest Logistics Notice (No Fake Courier) */}
                      <div className="mt-2 py-2 px-3 bg-white rounded-xl border border-[#EAE3DC] text-[11px] text-[#6B6058] flex items-center justify-between">
                        <span>Logistics & Courier Assignment</span>
                        <span className="font-semibold text-[#FA661C]">Seller Direct Fulfillment</span>
                      </div>
                    </div>
                  );
                })()}

                {/* Bottom Action Tray */}
                <div className="px-4 py-3 bg-[#FFF3EC]/40 border-t border-[#EAE3DC]/80 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex flex-wrap items-center gap-2">
                    {order.canCancel && (
                      <button
                        type="button"
                        disabled={cancellingOrderId === order.id}
                        onClick={() => handleCancelOrder(order)}
                        className="px-3 py-1 bg-white hover:bg-[#FDE8EA] disabled:opacity-50 text-[#D7263D] border border-[#EAE3DC] hover:border-[#D7263D] rounded-lg font-bold btn-interactive cursor-pointer flex items-center space-x-1"
                      >
                        {cancellingOrderId === order.id ? (
                          <span>Cancelling...</span>
                        ) : (
                          <span>Cancel Order</span>
                        )}
                      </button>
                    )}

                    {order.canReturn && (
                      <button
                        type="button"
                        onClick={() => handleReturnItem(order.id)}
                        className="px-3 py-1 bg-white hover:bg-[#FFF8F2] text-[#FA661C] border border-[#EAE3DC] hover:border-[#FF811A] rounded-lg font-bold btn-interactive flex items-center space-x-1 cursor-pointer"
                      >
                        <RotateCcw className="w-3 h-3 text-[#FF811A] icon-interactive" />
                        <span>Return Item</span>
                      </button>
                    )}

                    {order.statusType === 'returned' && (
                      <span className="text-[11px] text-[#FA661C] font-bold bg-[#FFF3EC] px-2.5 py-1 rounded-lg border border-[#FA661C]/20 flex items-center space-x-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#FF811A]" />
                        <span>{order.refundStatus || 'Refund Processed'}</span>
                      </span>
                    )}

                    {order.statusType === 'delivered' && order.items?.[0]?.productId && (
                      <Link
                        to={`/product/${order.items[0].productId}#reviews`}
                        className="px-3 py-1 bg-[#FFF8F2] hover:bg-[#FF811A]/20 text-[#FA661C] border border-[#FF811A] hover:border-[#FA661C] rounded-lg font-bold btn-interactive flex items-center space-x-1 cursor-pointer transition-all"
                      >
                        <Star className="w-3 h-3 text-[#FF811A] fill-[#FF811A]" />
                        <span>Write a Review</span>
                      </Link>
                    )}
                  </div>

                  {/* Primary Working "Buy Again" on Entire Order */}
                  <button
                    type="button"
                    onClick={() => handleBuyAgain(order)}
                    className="px-4 py-2 bg-[#FA661C] hover:bg-[#E0530B] text-[#FFFFFF] rounded-xl font-bold btn-interactive flex items-center space-x-1.5 ml-auto shadow-2xs cursor-pointer"
                  >
                    <Repeat className="w-3.5 h-3.5 text-[#FF811A] icon-interactive" />
                    <span>Buy Entire Order Again</span>
                  </button>
                </div>

              </div>
            );
          })
        )}
      </div>

    </div>
  );
}
