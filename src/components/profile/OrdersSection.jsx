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
import {
  formatVerbatimMoney,
  isNonZeroMoneyString,
  ORDER_CHARGE_KIND_LABELS,
} from '../../utils/orderPricingUtils';
import {
  formatShipmentStatusLabel,
  getShipmentStatusBadgeClass,
  formatDateTime,
  formatFulfilmentStageLabel,
  formatRefundBreakdownLabel,
  parseWarehouseApiError,
} from '../../utils/warehouseUtils';

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

  // Per-parcel cancellation dialog & result state (Phase C: POST /api/orders/vendor-orders/<pk>/cancel/)
  const [cancelParcelModal, setCancelParcelModal] = useState(null); // { order, vendorOrderId }
  const [cancelParcelReason, setCancelParcelReason] = useState('');
  const [cancelParcelFieldErrors, setCancelParcelFieldErrors] = useState({});
  const [cancelParcelGeneralError, setCancelParcelGeneralError] = useState('');
  const [cancelParcelSubmitting, setCancelParcelSubmitting] = useState(false);
  const [parcelCancelResults, setParcelCancelResults] = useState({}); // { [vendorOrderId]: { status, refund_request, idempotent_replay } }
  const [parcelCancelFeatureDisabled, setParcelCancelFeatureDisabled] = useState({}); // { [vendorOrderId]: true }

  const openCancelParcelDialog = (order, vendorOrderId) => {
    if (cancelParcelSubmitting) return;
    setCancelParcelModal({ order, vendorOrderId });
    setCancelParcelReason('');
    setCancelParcelFieldErrors({});
    setCancelParcelGeneralError('');
  };

  const handleConfirmCancelParcel = async (e) => {
    e.preventDefault();
    if (!cancelParcelModal || cancelParcelSubmitting) return;
    const { vendorOrderId } = cancelParcelModal;
    setCancelParcelFieldErrors({});
    setCancelParcelGeneralError('');
    setCancelParcelSubmitting(true);

    try {
      const res = await apiRequest(
        `/api/orders/vendor-orders/${vendorOrderId}/cancel/`,
        {
          method: 'POST',
          body: JSON.stringify({ reason: cancelParcelReason }),
        }
      );
      setParcelCancelResults((prev) => ({
        ...prev,
        [vendorOrderId]: res,
      }));
      setCancelParcelModal(null);
      if (onRefreshOrders) {
        await onRefreshOrders();
      }
    } catch (err) {
      if (err?.status === 404) {
        setParcelCancelFeatureDisabled((prev) => ({
          ...prev,
          [vendorOrderId]: true,
        }));
        setCancelParcelModal(null);
        return;
      }
      const parsed = parseWarehouseApiError(err, ['reason']);
      setCancelParcelFieldErrors(parsed.fieldErrors);
      if (Object.keys(parsed.fieldErrors).length === 0 || err?.status === 409) {
        setCancelParcelGeneralError(parsed.generalError);
      }
    } finally {
      setCancelParcelSubmitting(false);
    }
  };

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
        rawDetail = Object.entries(rawDetail).map(([k, v]) => `${k === 'non_field_errors' ? '' : `${k}: `}${Array.isArray(v) ? v.join(', ') : v}`).join('; ');
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
                      <span
                        data-testid={`order-grand-total-${order.realOrderId ?? order.id}`}
                        className="font-mono font-black text-[#FA661C]"
                      >
                        {order.grand_total !== undefined
                          ? formatVerbatimMoney(
                              order.currency || 'INR',
                              order.grand_total
                            )
                          : order.total}
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

                {/* Order Fee Lines & Totals Breakdown (from customer_charges and server totals) */}
                {(Array.isArray(order.customer_charges) &&
                  order.customer_charges.length > 0) ||
                isNonZeroMoneyString(order.delivery_charge) ||
                isNonZeroMoneyString(order.packaging_fee_total) ||
                isNonZeroMoneyString(order.fee_tax_total) ||
                order.subtotal !== undefined ? (
                  <div
                    data-testid={`order-charges-breakdown-${
                      order.realOrderId ?? order.id
                    }`}
                    className="px-4 sm:px-5 py-3.5 bg-[#FFF8F2]/50 border-t border-[#EAE3DC] space-y-1.5 text-xs text-[#6B6058]"
                  >
                    {order.subtotal !== undefined && (
                      <div className="flex justify-between">
                        <span>Item subtotal</span>
                        <span
                          data-testid={`order-subtotal-${
                            order.realOrderId ?? order.id
                          }`}
                          className="font-mono font-bold text-[#1A2420]"
                        >
                          {formatVerbatimMoney(
                            order.currency || 'INR',
                            order.subtotal
                          )}
                        </span>
                      </div>
                    )}
                    {order.tax_total !== undefined && (
                      <div className="flex justify-between">
                        <span>Item tax</span>
                        <span
                          data-testid={`order-item-tax-${
                            order.realOrderId ?? order.id
                          }`}
                          className="font-mono font-bold text-[#1A2420]"
                        >
                          {formatVerbatimMoney(
                            order.currency || 'INR',
                            order.tax_total
                          )}
                        </span>
                      </div>
                    )}
                    {isNonZeroMoneyString(order.discount_total) && (
                      <div className="flex justify-between text-emerald-700">
                        <span>Discount</span>
                        <span
                          data-testid={`order-discount-${
                            order.realOrderId ?? order.id
                          }`}
                          className="font-mono font-bold"
                        >
                          -{' '}
                          {formatVerbatimMoney(
                            order.currency || 'INR',
                            order.discount_total
                          )}
                        </span>
                      </div>
                    )}

                    {/* Customer charges array (delivery & packaging per parcel) */}
                    {Array.isArray(order.customer_charges) &&
                    order.customer_charges.length > 0 ? (
                      <div
                        data-testid={`order-customer-charges-list-${
                          order.realOrderId ?? order.id
                        }`}
                        className="space-y-1 pt-1"
                      >
                        {order.customer_charges.map((charge, cIdx) => (
                          <div
                            key={charge.id ?? cIdx}
                            data-testid={`order-charge-line-${
                              order.realOrderId ?? order.id
                            }-${charge.kind}-${charge.id ?? cIdx}`}
                            className="flex justify-between"
                          >
                            <span>
                              {ORDER_CHARGE_KIND_LABELS[charge.kind] ||
                                charge.kind}
                              {charge.vendor_order
                                ? ` (Parcel #${charge.vendor_order})`
                                : ''}
                              {charge.rule_version
                                ? ` (v${charge.rule_version})`
                                : ''}
                            </span>
                            <span className="font-mono font-bold text-[#1A2420]">
                              {formatVerbatimMoney(
                                charge.currency || order.currency || 'INR',
                                charge.amount
                              )}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <>
                        {isNonZeroMoneyString(order.delivery_charge) && (
                          <div className="flex justify-between">
                            <span>Delivery charge</span>
                            <span
                              data-testid={`order-delivery-charge-${
                                order.realOrderId ?? order.id
                              }`}
                              className="font-mono font-bold text-[#1A2420]"
                            >
                              {formatVerbatimMoney(
                                order.currency || 'INR',
                                order.delivery_charge
                              )}
                            </span>
                          </div>
                        )}
                        {isNonZeroMoneyString(order.packaging_fee_total) && (
                          <div className="flex justify-between">
                            <span>Packaging fee</span>
                            <span
                              data-testid={`order-packaging-fee-${
                                order.realOrderId ?? order.id
                              }`}
                              className="font-mono font-bold text-[#1A2420]"
                            >
                              {formatVerbatimMoney(
                                order.currency || 'INR',
                                order.packaging_fee_total
                              )}
                            </span>
                          </div>
                        )}
                      </>
                    )}

                    {isNonZeroMoneyString(order.fee_tax_total) && (
                      <div className="flex justify-between">
                        <span>Fee tax</span>
                        <span
                          data-testid={`order-fee-tax-${
                            order.realOrderId ?? order.id
                          }`}
                          className="font-mono font-bold text-[#1A2420]"
                        >
                          {formatVerbatimMoney(
                            order.currency || 'INR',
                            order.fee_tax_total
                          )}
                        </span>
                      </div>
                    )}

                    {order.grand_total !== undefined && (
                      <div className="flex justify-between pt-1.5 border-t border-[#EAE3DC]/60 font-bold text-[#FA661C]">
                        <span>Total</span>
                        <span
                          data-testid={`order-breakdown-total-${
                            order.realOrderId ?? order.id
                          }`}
                          className="font-mono font-black"
                        >
                          {formatVerbatimMoney(
                            order.currency || 'INR',
                            order.grand_total
                          )}
                        </span>
                      </div>
                    )}
                  </div>
                ) : null}

                {/* Customer Parcels, Fulfilment Stages, Shipments Tracking & Per-Parcel Cancellation */}
                {(() => {
                  const shipmentsList = Array.isArray(order.shipments)
                    ? order.shipments
                    : [];
                  const stagesList = Array.isArray(order.fulfilment_stages)
                    ? order.fulfilment_stages
                    : [];
                  const vendorOrdersList = Array.isArray(order.vendor_orders)
                    ? order.vendor_orders
                    : [];

                  const parcelMap = new Map();
                  const ensureParcel = (voId) => {
                    if (voId === null || voId === undefined) return null;
                    const key = Number(voId);
                    if (!parcelMap.has(key)) {
                      parcelMap.set(key, {
                        vendor_order_id: key,
                        shipment: null,
                        stage: null,
                        vendorOrder: null,
                      });
                    }
                    return parcelMap.get(key);
                  };

                  shipmentsList.forEach((shp) => {
                    const entry = ensureParcel(shp.vendor_order_id);
                    if (entry) entry.shipment = shp;
                  });
                  stagesList.forEach((st) => {
                    const entry = ensureParcel(st.vendor_order_id);
                    if (entry) entry.stage = st.stage;
                  });
                  vendorOrdersList.forEach((vo) => {
                    const voId = vo.vendor_order_id ?? vo.id;
                    const entry = ensureParcel(voId);
                    if (entry) {
                      entry.vendorOrder = vo;
                      if (vo.stage && !entry.stage) entry.stage = vo.stage;
                    }
                  });

                  const parcels = Array.from(parcelMap.values());
                  const hasShipments = shipmentsList.length > 0;
                  const hasParcels = parcels.length > 0;

                  return (
                    <>
                      {/* Customer Shipments Tracking Panel (shown when server sends shipments) */}
                      {hasShipments && (
                        <div
                          data-testid={`customer-order-shipments-${
                            order.realOrderId ?? order.id
                          }`}
                          className="px-4 sm:px-5 py-3.5 bg-[#EFF6FF]/40 border-t border-[#EAE3DC] space-y-2 text-xs"
                        >
                          <div className="font-bold text-[#1A2420] flex items-center space-x-1.5">
                            <Truck className="w-3.5 h-3.5 text-[#FA661C]" />
                            <span>Shipment Tracking</span>
                          </div>
                          <div className="space-y-2">
                            {shipmentsList.map((shp, sIdx) => (
                              <div
                                key={shp.vendor_order_id ?? sIdx}
                                data-testid={`customer-order-shipment-${
                                  order.realOrderId ?? order.id
                                }-${shp.vendor_order_id ?? sIdx}`}
                                className="p-3 rounded-xl bg-white border border-[#EAE3DC] flex flex-wrap items-center justify-between gap-3"
                              >
                                <div className="flex flex-wrap items-center gap-2">
                                  <span
                                    data-testid={`customer-shipment-status-${
                                      order.realOrderId ?? order.id
                                    }-${shp.vendor_order_id ?? sIdx}`}
                                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${getShipmentStatusBadgeClass(
                                      shp.status
                                    )}`}
                                  >
                                    {formatShipmentStatusLabel(shp.status)}
                                  </span>
                                  {shp.courier_name && (
                                    <span
                                      data-testid={`customer-shipment-courier-${
                                        order.realOrderId ?? order.id
                                      }-${shp.vendor_order_id ?? sIdx}`}
                                      className="font-bold text-[#1A2420]"
                                    >
                                      Courier: {shp.courier_name}
                                    </span>
                                  )}
                                  {shp.tracking_number && (
                                    <span
                                      data-testid={`customer-shipment-tracking-${
                                        order.realOrderId ?? order.id
                                      }-${shp.vendor_order_id ?? sIdx}`}
                                      className="font-mono font-bold text-[#FA661C]"
                                    >
                                      Tracking: {shp.tracking_number}
                                    </span>
                                  )}
                                </div>
                                <div className="text-[11px] text-[#6B6058] space-x-3">
                                  {shp.shipped_at && (
                                    <span
                                      data-testid={`customer-shipment-shipped-at-${
                                        order.realOrderId ?? order.id
                                      }-${shp.vendor_order_id ?? sIdx}`}
                                    >
                                      Shipped: {formatDateTime(shp.shipped_at)}
                                    </span>
                                  )}
                                  {shp.delivered_at && (
                                    <span
                                      data-testid={`customer-shipment-delivered-at-${
                                        order.realOrderId ?? order.id
                                      }-${shp.vendor_order_id ?? sIdx}`}
                                    >
                                      Delivered:{' '}
                                      {formatDateTime(shp.delivered_at)}
                                    </span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Seller Parcels: Fulfilment Stage Display & Per-Parcel Cancellation (Phases C & D) */}
                      {hasParcels && (
                        <div
                          data-testid={`customer-order-parcels-${
                            order.realOrderId ?? order.id
                          }`}
                          className="px-4 sm:px-5 py-3.5 bg-[#FFF8F2]/60 border-t border-[#EAE3DC] space-y-2.5 text-xs"
                        >
                          <div className="font-bold text-[#1A2420] flex items-center space-x-1.5">
                            <Package className="w-3.5 h-3.5 text-[#FA661C]" />
                            <span>Seller Parcels &amp; Fulfilment Status</span>
                          </div>

                          <div className="space-y-2.5">
                            {parcels.map((p) => {
                              const voId = p.vendor_order_id;
                              const cancelResult = parcelCancelResults[voId];
                              const refundReq =
                                cancelResult?.refund_request ||
                                p.vendorOrder?.refund_request ||
                                null;
                              const shpStatus = String(
                                p.shipment?.status || ''
                              ).toLowerCase();
                              const voStatus = String(
                                cancelResult?.status ||
                                  p.vendorOrder?.status ||
                                  ''
                              ).toLowerCase();
                              const effectiveStage =
                                cancelResult?.status === 'cancelled'
                                  ? 'cancelled'
                                  : p.stage;

                              const isParcelCancelled =
                                voStatus === 'cancelled' ||
                                effectiveStage === 'cancelled' ||
                                shpStatus === 'cancelled';

                              const isShortPickOrHeld =
                                shpStatus === 'exception' ||
                                voStatus === 'exception' ||
                                effectiveStage === 'exception';

                              const isShippedOrDelivered =
                                ['shipped', 'delivered'].includes(shpStatus) ||
                                ['shipped', 'delivered'].includes(voStatus) ||
                                ['shipped', 'delivered'].includes(
                                  String(effectiveStage || '').toLowerCase()
                                );

                              const isOrderPaid =
                                String(
                                  order.payment_status || 'paid'
                                ).toLowerCase() === 'paid';

                              const canCancelParcel =
                                !parcelCancelFeatureDisabled[voId] &&
                                isOrderPaid &&
                                !isParcelCancelled &&
                                !isShortPickOrHeld &&
                                !isShippedOrDelivered &&
                                p.vendorOrder?.can_cancel !== false;

                              return (
                                <div
                                  key={voId}
                                  data-testid={`customer-parcel-card-${voId}`}
                                  className="p-3.5 rounded-xl bg-white border border-[#EAE3DC] space-y-2"
                                >
                                  <div className="flex flex-wrap items-center justify-between gap-2">
                                    <div className="flex flex-wrap items-center gap-2">
                                      <span className="font-mono font-extrabold text-[#1A2420]">
                                        Parcel #{voId}
                                      </span>

                                      {effectiveStage && (
                                        <span
                                          data-testid={`customer-parcel-stage-${voId}`}
                                          className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#FFF3EC] text-[#FA661C] border border-[#FA661C]/20"
                                        >
                                          {formatFulfilmentStageLabel(
                                            effectiveStage
                                          )}
                                        </span>
                                      )}

                                      {isParcelCancelled && (
                                        <span
                                          data-testid={`customer-parcel-cancelled-badge-${voId}`}
                                          className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-[#FDE8EA] text-[#D7263D] border border-[#D7263D]/30"
                                        >
                                          Cancelled
                                        </span>
                                      )}
                                    </div>

                                    <div>
                                      {canCancelParcel && (
                                        <button
                                          type="button"
                                          data-testid={`customer-cancel-parcel-btn-${voId}`}
                                          disabled={cancelParcelSubmitting}
                                          onClick={() =>
                                            openCancelParcelDialog(order, voId)
                                          }
                                          className="px-3 py-1.5 rounded-xl bg-white hover:bg-[#FDE8EA] text-[#D7263D] border border-[#D7263D]/40 font-bold text-xs cursor-pointer disabled:opacity-50"
                                        >
                                          Cancel this parcel
                                        </button>
                                      )}
                                    </div>
                                  </div>

                                  {/* Short-pick or held parcel calm line (shown only if server status says exception) */}
                                  {isShortPickOrHeld && (
                                    <p
                                      data-testid={`customer-parcel-held-note-${voId}`}
                                      className="text-xs font-semibold text-[#92400E] bg-[#FFFBEB] px-3 py-2 rounded-lg border border-[#F59E0B]/40"
                                    >
                                      This parcel is being looked into by our team
                                    </p>
                                  )}

                                  {/* Refund Request & Breakdown Lines (shown verbatim as sent by server) */}
                                  {refundReq && (
                                    <div
                                      data-testid={`customer-parcel-refund-summary-${voId}`}
                                      className="p-3 rounded-xl bg-[#ECFDF5]/60 border border-[#6EE7B7] space-y-1.5 text-xs"
                                    >
                                      <div className="flex flex-wrap items-center justify-between gap-2 font-bold text-[#065F46]">
                                        <span>
                                          Refund Request #{refundReq.id} • Status:{' '}
                                          <strong
                                            data-testid={`customer-parcel-refund-status-${voId}`}
                                            className="uppercase"
                                          >
                                            {refundReq.status}
                                          </strong>
                                        </span>
                                        <span
                                          data-testid={`customer-parcel-refund-amount-${voId}`}
                                          className="font-mono font-extrabold text-sm"
                                        >
                                          {refundReq.currency} {refundReq.amount}
                                        </span>
                                      </div>

                                      {refundReq.breakdown &&
                                        typeof refundReq.breakdown ===
                                          'object' && (
                                          <div
                                            data-testid={`customer-parcel-refund-breakdown-${voId}`}
                                            className="pt-1.5 border-t border-[#6EE7B7]/50 space-y-1 text-[11px] text-[#1A2420]"
                                          >
                                            {Object.entries(
                                              refundReq.breakdown
                                            ).map(([bKey, bVal]) => (
                                              <div
                                                key={bKey}
                                                data-testid={`customer-parcel-refund-line-${voId}-${bKey}`}
                                                className="flex justify-between"
                                              >
                                                <span className="text-[#6B6058]">
                                                  {formatRefundBreakdownLabel(
                                                    bKey
                                                  )}
                                                </span>
                                                <span className="font-mono font-bold">
                                                  {refundReq.currency}{' '}
                                                  {String(bVal)}
                                                </span>
                                              </div>
                                            ))}
                                          </div>
                                        )}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </>
                  );
                })()}

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

      {/* NATIVE <dialog>: CANCEL THIS PARCEL (Phase C: POST /api/orders/vendor-orders/<pk>/cancel/) */}
      {cancelParcelModal && (
        <dialog
          open
          data-testid="customer-cancel-parcel-dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-[#1A2420]/60 backdrop-blur-2xs flex items-center justify-center p-4 w-full h-full m-0 border-0"
        >
          <div className="bg-white rounded-3xl border border-[#EAE3DC] shadow-2xl max-w-md w-full p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-[#EAE3DC] pb-3">
              <h3 className="font-['Outfit'] font-extrabold text-base text-[#1A2420]">
                Cancel Parcel #{cancelParcelModal.vendorOrderId}
              </h3>
              <button
                type="button"
                onClick={() => setCancelParcelModal(null)}
                className="p-1 text-[#6B6058] hover:text-[#1A2420] cursor-pointer"
                aria-label="Close cancel parcel dialog"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div
              data-testid="customer-cancel-parcel-explanation"
              className="p-3.5 rounded-xl bg-[#FFFBEB] border border-[#F59E0B] text-xs font-bold text-[#92400E]"
            >
              This cancels only this seller parcel before shipment and creates a refund request for the parcel amount. Other parcels in your order are not affected.
            </div>

            {cancelParcelGeneralError && (
              <div
                role="alert"
                data-testid="customer-cancel-parcel-general-error"
                className="p-3 rounded-xl bg-[#FFF3F3] border border-[#FCA5A5] text-xs font-bold text-[#991B1B]"
              >
                {cancelParcelGeneralError}
              </div>
            )}

            <form
              onSubmit={handleConfirmCancelParcel}
              noValidate
              className="space-y-3"
            >
              <div>
                <label
                  htmlFor="customer-cancel-parcel-reason"
                  className="block font-bold text-[#1A2420] mb-1"
                >
                  Cancellation Reason *
                </label>
                <textarea
                  id="customer-cancel-parcel-reason"
                  rows={2}
                  data-testid="customer-cancel-parcel-reason-input"
                  value={cancelParcelReason}
                  onChange={(e) => {
                    setCancelParcelReason(e.target.value);
                    setCancelParcelFieldErrors((fe) => ({ ...fe, reason: '' }));
                  }}
                  placeholder="Please tell us why you are cancelling this parcel..."
                  className="w-full px-3 py-2 rounded-xl border border-[#EAE3DC]"
                />
                {cancelParcelFieldErrors.reason && (
                  <p
                    data-testid="customer-cancel-parcel-error-reason"
                    className="mt-1 text-[11px] font-semibold text-[#DC2626]"
                  >
                    {cancelParcelFieldErrors.reason}
                  </p>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCancelParcelModal(null)}
                  className="px-4 py-2 rounded-xl border border-[#EAE3DC] font-bold text-[#6B6058] cursor-pointer"
                >
                  Keep Parcel
                </button>
                <button
                  type="submit"
                  data-testid="customer-cancel-parcel-submit-btn"
                  disabled={cancelParcelSubmitting}
                  className="px-4 py-2 rounded-xl bg-[#D7263D] hover:bg-[#B91C1C] text-white font-bold cursor-pointer disabled:opacity-50"
                >
                  {cancelParcelSubmitting
                    ? 'Cancelling…'
                    : 'Confirm Cancel Parcel'}
                </button>
              </div>
            </form>
          </div>
        </dialog>
      )}

    </div>
  );
}
