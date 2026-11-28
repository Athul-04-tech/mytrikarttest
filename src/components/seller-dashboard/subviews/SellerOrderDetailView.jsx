import React, { useEffect, useState } from 'react';
import {
  ArrowLeft, Download, Loader2, AlertCircle, RefreshCw, User, MapPin, Phone, Mail,
  Receipt, Package, CreditCard, Calendar, Clock, Truck, CheckCircle2, PackageCheck
} from 'lucide-react';
import { apiRequest } from '../../../utils/api';
import { formatSellerINR } from '../../../utils/currency';
import { useToast } from '../../../context/ToastContext';
import { downloadSellerInvoice } from '../../../utils/sellerInvoice';
import {
  formatShipmentStatusLabel,
  getShipmentStatusBadgeClass,
  formatFulfilmentStageLabel,
  hasNonZeroMoneyString,
  parseWarehouseApiError,
} from '../../../utils/warehouseUtils';

const STATUS = {
  pending: { label: 'Pending', cls: 'bg-[#FFF8F2] text-[#FA661C] border-[#FF811A]/50', icon: Clock },
  processing: { label: 'Processing', cls: 'bg-[#EBF3FF] text-[#1E64D4] border-[#1E64D4]/30', icon: RefreshCw },
  shipped: { label: 'Shipped', cls: 'bg-[#F3E8FF] text-[#7E22CE] border-[#7E22CE]/30', icon: Truck },
  delivered: { label: 'Delivered', cls: 'bg-[#E6F4EA] text-[#137333] border-[#137333]/30', icon: CheckCircle2 },
  cancelled: { label: 'Cancelled', cls: 'bg-[#FDE8EA] text-[#D7263D] border-[#D7263D]/30', icon: AlertCircle },
};
const STEPS = ['pending', 'processing', 'shipped', 'delivered'];

const fmtDate = (iso) => (iso ? new Date(iso).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—');

function Card({ icon: Icon, title, children, className = '' }) {
  return (
    <section className={`bg-white rounded-3xl border border-[#EAE3DC] p-5 shadow-xs hover:shadow-md transition-shadow ${className}`}>
      <div className="flex items-center space-x-2 mb-4">
        <div className="p-2 rounded-xl bg-[#FFF3EC] text-[#FA661C]"><Icon className="w-4 h-4" /></div>
        <h2 className="font-['Outfit'] font-extrabold text-sm text-[#1A2420] uppercase tracking-wide">{title}</h2>
      </div>
      {children}
    </section>
  );
}

export default function SellerOrderDetailView({ orderId, vendorProfile, onBack, endpoint, showVendor = false }) {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [downloading, setDownloading] = useState(false);
  const toast = useToast();

  // Seller confirm returned goods on rejected/cancelled parcel (`POST /api/warehouse/vendor-orders/<pk>/confirm-return/`)
  const [confirmReturnOpen, setConfirmReturnOpen] = useState(false);
  const [returnReceiptRef, setReturnReceiptRef] = useState('');
  const [returnQuantities, setReturnQuantities] = useState({});
  const [returnFieldErrors, setReturnFieldErrors] = useState({});
  const [returnGeneralError, setReturnGeneralError] = useState('');
  const [returnSubmitting, setReturnSubmitting] = useState(false);
  const [returnResult, setReturnResult] = useState(null);
  const [returnFeatureDisabled, setReturnFeatureDisabled] = useState(false);

  const openConfirmReturnDialog = () => {
    if (!order || returnSubmitting) return;
    const initialQty = {};
    (order.items || []).forEach((it, idx) => {
      const itemId = it.id ?? it.order_item_id ?? idx + 1;
      initialQty[itemId] = String(it.held_quantity ?? it.quantity ?? '');
    });
    setReturnQuantities(initialQty);
    setReturnReceiptRef('');
    setReturnFieldErrors({});
    setReturnGeneralError('');
    setConfirmReturnOpen(true);
  };

  const handleConfirmReturnSubmit = async (e) => {
    e.preventDefault();
    if (!order || returnSubmitting) return;
    setReturnFieldErrors({});
    setReturnGeneralError('');
    setReturnSubmitting(true);

    const quantitiesPayload = (order.items || []).map((it, idx) => {
      const itemId = Number(it.id ?? it.order_item_id ?? idx + 1);
      const rawVal = returnQuantities[itemId] ?? '';
      return {
        order_item_id: itemId,
        quantity: rawVal === '' ? 0 : Number(rawVal),
      };
    });

    try {
      const res = await apiRequest(
        `/api/warehouse/vendor-orders/${order.id}/confirm-return/`,
        {
          method: 'POST',
          body: JSON.stringify({
            receipt_reference: returnReceiptRef,
            quantities: quantitiesPayload,
          }),
        }
      );
      setReturnResult(res);
      setConfirmReturnOpen(false);
    } catch (err) {
      if (err?.status === 404 && /disabled/i.test(String(err?.data?.detail || ''))) {
        setReturnFeatureDisabled(true);
        setConfirmReturnOpen(false);
        return;
      }
      const parsed = parseWarehouseApiError(err, [
        'receipt_reference',
        'quantities',
      ]);
      setReturnFieldErrors(parsed.fieldErrors);
      if (Object.keys(parsed.fieldErrors).length === 0 || err?.status === 409) {
        setReturnGeneralError(parsed.generalError);
      }
    } finally {
      setReturnSubmitting(false);
    }
  };

  const load = async () => {
    setLoading(true); setError(null);
    try {
      setOrder(await apiRequest(endpoint || `/api/orders/vendor/${orderId}/`));
    } catch (err) {
      setError(err?.status === 404 ? 'Order not found or not assigned to your store.' : (err?.message || 'Failed to load order.'));
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); document.title = `Order #ORD-${orderId} — MytriKart`; }, [orderId]);

  const handleDownload = async () => {
    if (!order) return;
    setDownloading(true);
    try {
      downloadSellerInvoice(order, vendorProfile || {});
      toast.success('Invoice Downloaded', `Invoice_ORD-${order.id}.pdf saved.`);
    } catch (e) {
      console.error(e);
      toast.error?.('Invoice Failed', 'Could not generate invoice PDF.');
    } finally { setDownloading(false); }
  };

  if (loading) {
    return (
      <div className="p-16 bg-white rounded-3xl border border-[#EAE3DC] text-center space-y-3">
        <Loader2 className="w-8 h-8 text-[#FA661C] animate-spin mx-auto" />
        <p className="text-xs font-bold text-[#6B6058]">Loading order details...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="p-8 bg-[#FDE8EA] border border-[#D7263D]/40 rounded-3xl text-center space-y-3 text-[#D7263D]">
        <AlertCircle className="w-8 h-8 mx-auto" />
        <p className="text-sm font-bold">{error}</p>
        <div className="flex justify-center gap-2">
          <button type="button" onClick={onBack} className="px-4 py-2 bg-white border border-[#EAE3DC] rounded-xl font-bold text-xs text-[#6B6058] cursor-pointer">Back to Orders</button>
          <button type="button" onClick={load} className="px-4 py-2 bg-[#D7263D] text-white rounded-xl font-bold text-xs cursor-pointer">Retry</button>
        </div>
      </div>
    );
  }

  const st = STATUS[order.status] || STATUS.pending;
  const StIcon = st.icon;
  const stepIdx = STEPS.indexOf(order.status);
  const hasCustomer =
    order.customer !== null &&
    order.customer !== undefined &&
    typeof order.customer === 'object' &&
    Boolean(
      order.customer.full_name ||
        order.customer.username ||
        order.customer.email
    );
  const hasAddress =
    order.shipping_address !== null &&
    order.shipping_address !== undefined &&
    typeof order.shipping_address === 'object' &&
    Boolean(
      order.shipping_address.recipient_name ||
        order.shipping_address.address_line1 ||
        order.shipping_address.city
    );
  const addr = hasAddress ? order.shipping_address : {};
  const cust = hasCustomer ? order.customer : {};
  const items = order.items || [];
  const initials = hasCustomer
    ? (cust.full_name || cust.username || 'C')
        .split(' ')
        .map((p) => p[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : 'C';
  const canConfirmHandoverReturn =
    !showVendor &&
    !returnFeatureDisabled &&
    (order.status === 'cancelled' ||
      order.fulfilment_stage === 'cancelled' ||
      Boolean(order.has_held_handover_stock) ||
      (Array.isArray(order.handover_stock_holds) &&
        order.handover_stock_holds.length > 0));

  return (
    <div className="space-y-6 text-xs animate-reveal">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button type="button" id="order-detail-back" onClick={onBack} className="p-2.5 bg-white border border-[#EAE3DC] hover:bg-[#FFF3EC] hover:text-[#FA661C] text-[#6B6058] rounded-2xl cursor-pointer transition-colors" title="Back to orders">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="font-['Outfit'] text-2xl font-extrabold text-[#FA661C]">Order #ORD-{order.id}</h1>
              <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase inline-flex items-center gap-1 border ${st.cls}`}>
                <StIcon className="w-3 h-3" />{st.label}
              </span>
              {order.fulfilment_stage && (
                <span
                  data-testid="seller-order-fulfilment-stage"
                  className="text-[11px] font-bold px-3 py-1 rounded-full bg-[#FFF3EC] text-[#FA661C] border border-[#FA661C]/20"
                >
                  {formatFulfilmentStageLabel(order.fulfilment_stage)}
                </span>
              )}
            </div>
            <p className="text-[11px] text-[#6B6058] mt-0.5">
              {order.order_number && <span className="font-mono">{order.order_number} • </span>}Placed {fmtDate(order.order_created_at || order.created_at)}
              {showVendor && order.vendor_store_name && <span> • Sold by <strong className="text-[#1A2420]">{order.vendor_store_name}</strong></span>}
            </p>
          </div>
        </div>
        <button type="button" id="order-detail-download-invoice" onClick={handleDownload} disabled={downloading}
          className="px-5 py-2.5 bg-gradient-to-r from-[#FA661C] to-[#FF811A] hover:shadow-lg hover:shadow-[#FA661C]/30 text-white rounded-2xl font-black text-xs btn-interactive inline-flex items-center gap-2 cursor-pointer disabled:opacity-60 self-start md:self-auto">
          {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          Download Invoice (PDF)
        </button>
      </div>

      {/* Progress */}
      {order.status !== 'cancelled' && (
        <div className="bg-white rounded-3xl border border-[#EAE3DC] p-5">
          <div className="flex items-center">
            {STEPS.map((s, i) => {
              const done = i <= stepIdx; const Icon = STATUS[s].icon;
              return (
                <React.Fragment key={s}>
                  <div className="flex flex-col items-center gap-1.5 min-w-[64px]">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${done ? 'bg-[#FA661C] text-white shadow-md shadow-[#FA661C]/30' : 'bg-[#FFF3EC] text-[#6B6058]/60'}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className={`text-[10px] font-bold ${done ? 'text-[#FA661C]' : 'text-[#6B6058]/70'}`}>{STATUS[s].label}</span>
                  </div>
                  {i < STEPS.length - 1 && <div className={`flex-1 h-1 rounded-full mx-1 mb-5 ${i < stepIdx ? 'bg-[#FA661C]' : 'bg-[#EAE3DC]'}`} />}
                </React.Fragment>
              );
            })}
          </div>
          <p className="mt-3 flex items-center gap-1.5 text-[11px] text-[#6B6058]"><PackageCheck className="w-3.5 h-3.5 text-[#FF811A]" />Status updates are managed by MytriKart central logistics.</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Customer (omitted cleanly when privacy switch omits customer details) */}
        {hasCustomer && (
          <Card icon={User} title="Customer">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#FA661C] to-[#FF811A] text-white font-['Outfit'] font-black text-base flex items-center justify-center">{initials}</div>
              <div className="min-w-0">
                <p className="font-bold text-sm text-[#1A2420] truncate">{cust.full_name || cust.username}</p>
                {cust.username && <p className="text-[11px] text-[#FA661C] font-mono">@{cust.username}</p>}
              </div>
            </div>
            <div className="mt-4 space-y-2 text-[#6B6058]">
              {cust.email && <p className="flex items-center gap-2 break-all"><Mail className="w-3.5 h-3.5 text-[#FF811A] shrink-0" />{cust.email}</p>}
              {addr.recipient_phone && <p className="flex items-center gap-2"><Phone className="w-3.5 h-3.5 text-[#FF811A] shrink-0" />{addr.recipient_phone}</p>}
            </div>
          </Card>
        )}

        {/* Address (omitted cleanly when privacy switch omits address details) */}
        {hasAddress && (
          <Card icon={MapPin} title="Shipping Address">
            <address className="not-italic space-y-0.5 text-[#1A2420] leading-relaxed">
              {addr.recipient_name && <p className="font-bold text-sm">{addr.recipient_name}</p>}
              {addr.address_line1 && <p>{addr.address_line1}</p>}
              {addr.address_line2 && <p>{addr.address_line2}</p>}
              {([addr.city, addr.state].filter(Boolean).length > 0 || addr.postal_code) && (
                <p>{[addr.city, addr.state].filter(Boolean).join(', ')} {addr.postal_code}</p>
              )}
              {addr.country && <p className="text-[#6B6058]">{addr.country}</p>}
            </address>
          </Card>
        )}

        {/* Privacy Notice when customer or shipping address is omitted by server */}
        {(!hasCustomer || !hasAddress) && (
          <div
            data-testid="seller-order-privacy-note"
            className="bg-white rounded-3xl border border-[#EAE3DC] p-5 shadow-xs flex items-center space-x-3 text-xs text-[#6B6058]"
          >
            <PackageCheck className="w-5 h-5 text-[#FA661C] shrink-0" />
            <span className="font-semibold text-[#1A2420]">
              Customer details are handled by our warehouse team.
            </span>
          </div>
        )}

        {/* Payment */}
        <Card icon={CreditCard} title="Payment & Dates">
          <dl className="space-y-2.5">
            <div className="flex justify-between"><dt className="text-[#6B6058]">Payment</dt><dd className="font-bold uppercase text-[#FA661C]">{order.payment_status || '—'}</dd></div>
            <div className="flex justify-between"><dt className="text-[#6B6058]">Currency</dt><dd className="font-bold">{order.currency || 'INR'}</dd></div>
            <div className="flex justify-between gap-2"><dt className="text-[#6B6058] flex items-center gap-1"><Calendar className="w-3 h-3" />Ordered</dt><dd className="font-semibold text-right">{fmtDate(order.order_created_at || order.created_at)}</dd></div>
            <div className="flex justify-between gap-2"><dt className="text-[#6B6058] flex items-center gap-1"><CheckCircle2 className="w-3 h-3" />Delivered</dt><dd className="font-semibold text-right">{fmtDate(order.delivered_at)}</dd></div>
          </dl>
          {order.shipment && (
            <div
              data-testid="seller-order-shipment-tracking"
              className="mt-4 pt-3 border-t border-[#EAE3DC] space-y-1.5"
            >
              <div className="flex items-center justify-between">
                <span className="text-[#6B6058] font-bold flex items-center gap-1">
                  <Truck className="w-3.5 h-3.5 text-[#FA661C]" />
                  <span>Warehouse Shipment</span>
                </span>
                <span
                  data-testid="seller-order-shipment-status"
                  className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${getShipmentStatusBadgeClass(
                    order.shipment.status
                  )}`}
                >
                  {formatShipmentStatusLabel(order.shipment.status)}
                </span>
              </div>
              {order.shipment.courier_name && (
                <div className="flex justify-between">
                  <span className="text-[#6B6058]">Courier</span>
                  <strong
                    data-testid="seller-order-shipment-courier"
                    className="text-[#1A2420]"
                  >
                    {order.shipment.courier_name}
                  </strong>
                </div>
              )}
              {order.shipment.tracking_number && (
                <div className="flex justify-between">
                  <span className="text-[#6B6058]">Tracking</span>
                  <strong
                    data-testid="seller-order-shipment-tracking-number"
                    className="font-mono text-[#FA661C]"
                  >
                    {order.shipment.tracking_number}
                  </strong>
                </div>
              )}
            </div>
          )}
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Items */}
        <Card icon={Package} title={`Line Items (${items.length})`} className="lg:col-span-2">
          <div className="overflow-x-auto -mx-1">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[#FA661C] font-bold text-[11px] border-b border-[#EAE3DC]">
                  <th className="p-2.5">Item</th><th className="p-2.5 text-center">Qty</th><th className="p-2.5">Unit</th><th className="p-2.5">Taxes</th><th className="p-2.5 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EAE3DC]/60">
                {items.map((it, i) => (
                  <tr key={i} className="hover:bg-[#FFF8F2]">
                    <td className="p-2.5">
                      <p className="font-bold text-[#1A2420]">{it.product_name_snapshot}</p>
                      <p className="font-mono text-[10px] text-[#6B6058]">SKU {it.sku_snapshot || 'N/A'}{it.hsn_code_snapshot && ` • HSN ${it.hsn_code_snapshot}`}</p>
                    </td>
                    <td className="p-2.5 text-center font-mono font-bold">{it.quantity}</td>
                    <td className="p-2.5 font-mono">{formatSellerINR(it.unit_price)}</td>
                    <td className="p-2.5 font-mono text-[10px] text-[#6B6058]">
                      {it.cgst_amount && <div>CGST {it.cgst_rate}%: {formatSellerINR(it.cgst_amount)}</div>}
                      {it.sgst_amount && <div>SGST {it.sgst_rate}%: {formatSellerINR(it.sgst_amount)}</div>}
                      {it.igst_amount && <div>IGST {it.igst_rate}%: {formatSellerINR(it.igst_amount)}</div>}
                      {it.vat_amount && <div>VAT {it.vat_rate}%: {formatSellerINR(it.vat_amount)}</div>}
                      {!it.cgst_amount && !it.sgst_amount && !it.igst_amount && !it.vat_amount && '—'}
                    </td>
                    <td className="p-2.5 text-right font-mono font-black text-[#FA661C]">{formatSellerINR(it.line_total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Charges */}
        <Card icon={Receipt} title="Charges Breakdown">
          <dl className="space-y-2.5 font-mono">
            <div className="flex justify-between"><dt className="font-sans text-[#6B6058]">Subtotal</dt><dd className="font-bold">{formatSellerINR(order.subtotal)}</dd></div>
            <div className="flex justify-between"><dt className="font-sans text-[#6B6058]">Tax Total</dt><dd className="font-bold">{formatSellerINR(order.tax_total)}</dd></div>
            <div className="flex justify-between"><dt className="font-sans text-[#6B6058]">Shipping Charges</dt><dd className="font-bold">{hasNonZeroMoneyString(order.shipping_total) ? formatSellerINR(order.shipping_total) : 'FREE'}</dd></div>
          </dl>
          <div className="mt-4 p-4 rounded-2xl bg-gradient-to-r from-[#FA661C] to-[#FF811A] text-white flex justify-between items-center">
            <span className="font-['Outfit'] font-bold text-sm">Grand Total</span>
            <span className="font-mono font-black text-lg">{formatSellerINR(order.grand_total)}</span>
          </div>
        </Card>
      </div>

      {/* Confirm returned goods on a rejected or cancelled parcel whose goods were held at the hub */}
      {(canConfirmHandoverReturn || returnResult) && (
        <section
          data-testid="seller-order-confirm-return-section"
          className="bg-white rounded-3xl border border-[#EAE3DC] p-5 shadow-xs space-y-3"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-['Outfit'] font-extrabold text-sm text-[#1A2420]">
                Hub Return Confirmation
              </h2>
              <p className="text-xs text-[#6B6058]">
                If this parcel was rejected or cancelled while goods were held at the platform hub, confirm physical return to restore your seller stock.
              </p>
            </div>
            {canConfirmHandoverReturn && (
              <button
                type="button"
                data-testid="seller-order-confirm-return-btn"
                disabled={returnSubmitting}
                onClick={openConfirmReturnDialog}
                className="px-4 py-2 rounded-xl bg-[#6B21A8] hover:bg-[#581C87] text-white font-bold text-xs cursor-pointer disabled:opacity-50"
              >
                Confirm returned goods
              </button>
            )}
          </div>

          {returnResult && (
            <div
              data-testid="seller-order-return-confirmed-panel"
              className="p-3.5 rounded-2xl bg-[#ECFDF5] border border-[#6EE7B7] text-[#065F46] space-y-1.5 text-xs"
            >
              <div className="font-bold flex items-center space-x-1.5">
                <CheckCircle2 className="w-4 h-4 text-[#059669] shrink-0" />
                <span>
                  Returned goods confirmed for Parcel #{returnResult.vendor_order_id}
                </span>
              </div>
              {Array.isArray(returnResult.returned_quantities) && (
                <div
                  data-testid="seller-order-returned-quantities-list"
                  className="space-y-1 text-[11px]"
                >
                  {returnResult.returned_quantities.map((rq, idx) => (
                    <div
                      key={rq.order_item_id ?? idx}
                      data-testid={`seller-order-returned-line-${
                        rq.order_item_id ?? idx
                      }`}
                    >
                      Order Item #{rq.order_item_id}: Returned quantity{' '}
                      <strong>{rq.returned_quantity}</strong> (Held:{' '}
                      {rq.held_quantity})
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </section>
      )}

      {/* NATIVE <dialog>: CONFIRM RETURNED GOODS FROM HUB (`POST /api/warehouse/vendor-orders/<pk>/confirm-return/`) */}
      {confirmReturnOpen && (
        <dialog
          open
          data-testid="seller-order-confirm-return-dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-[#1A2420]/60 backdrop-blur-2xs flex items-center justify-center p-4 w-full h-full m-0 border-0"
        >
          <div className="bg-white rounded-3xl border border-[#EAE3DC] shadow-2xl max-w-md w-full p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-[#EAE3DC] pb-3">
              <h3 className="font-['Outfit'] font-extrabold text-base text-[#1A2420]">
                Confirm Returned Goods — Order #ORD-{order.id}
              </h3>
              <button
                type="button"
                onClick={() => setConfirmReturnOpen(false)}
                className="p-1 text-[#6B6058] hover:text-[#1A2420] cursor-pointer"
                aria-label="Close confirm returned goods dialog"
              >
                <AlertCircle className="w-4 h-4" />
              </button>
            </div>

            <p className="text-[#6B6058]">
              Enter your receipt reference and the returned quantity for each line item physically received back from the hub.
            </p>

            {returnGeneralError && (
              <div
                role="alert"
                data-testid="seller-order-return-general-error"
                className="p-3 rounded-xl bg-[#FFF3F3] border border-[#FCA5A5] text-xs font-bold text-[#991B1B]"
              >
                {returnGeneralError}
              </div>
            )}

            <form
              onSubmit={handleConfirmReturnSubmit}
              noValidate
              className="space-y-3"
            >
              <div>
                <label
                  htmlFor="seller-order-return-receipt"
                  className="block font-bold text-[#1A2420] mb-1"
                >
                  Receipt Reference *
                </label>
                <input
                  id="seller-order-return-receipt"
                  type="text"
                  data-testid="seller-order-return-receipt-input"
                  value={returnReceiptRef}
                  onChange={(e) => {
                    setReturnReceiptRef(e.target.value);
                    setReturnFieldErrors((fe) => ({
                      ...fe,
                      receipt_reference: '',
                    }));
                  }}
                  placeholder="e.g. HUB-RET-2026-01"
                  className="w-full px-3 py-2 rounded-xl border border-[#EAE3DC] font-mono"
                />
                {returnFieldErrors.receipt_reference && (
                  <p
                    data-testid="seller-order-return-error-receipt_reference"
                    className="mt-1 text-[11px] font-semibold text-[#DC2626]"
                  >
                    {returnFieldErrors.receipt_reference}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <span className="block font-bold text-[#1A2420]">
                  Returned Quantities per Line *
                </span>
                {items.map((it, idx) => {
                  const itemId = Number(it.id ?? it.order_item_id ?? idx + 1);
                  return (
                    <div
                      key={itemId}
                      className="flex items-center justify-between gap-3 p-2.5 rounded-xl border border-[#EAE3DC] bg-[#FFF8F2]/50"
                    >
                      <div>
                        <div className="font-bold text-[#1A2420]">
                          {it.product_name_snapshot}
                        </div>
                        <div className="font-mono text-[10px] text-[#6B6058]">
                          Item #{itemId} • SKU {it.sku_snapshot || 'N/A'} •
                          Ordered Qty: {it.quantity}
                        </div>
                      </div>
                      <input
                        type="number"
                        min="1"
                        max={it.quantity}
                        data-testid={`seller-order-return-qty-input-${itemId}`}
                        aria-label={`Returned quantity for ${it.product_name_snapshot}`}
                        value={returnQuantities[itemId] ?? ''}
                        onChange={(e) =>
                          setReturnQuantities((prev) => ({
                            ...prev,
                            [itemId]: e.target.value,
                          }))
                        }
                        className="w-20 px-2.5 py-1.5 rounded-xl border border-[#EAE3DC] bg-white font-mono text-right"
                      />
                    </div>
                  );
                })}
                {returnFieldErrors.quantities && (
                  <p
                    data-testid="seller-order-return-error-quantities"
                    className="mt-1 text-[11px] font-semibold text-[#DC2626]"
                  >
                    {returnFieldErrors.quantities}
                  </p>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setConfirmReturnOpen(false)}
                  className="px-4 py-2 rounded-xl border border-[#EAE3DC] font-bold text-[#6B6058] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  data-testid="seller-order-return-submit-btn"
                  disabled={returnSubmitting}
                  className="px-4 py-2 rounded-xl bg-[#6B21A8] hover:bg-[#581C87] text-white font-bold cursor-pointer disabled:opacity-50"
                >
                  {returnSubmitting ? 'Confirming…' : 'Confirm Returned Goods'}
                </button>
              </div>
            </form>
          </div>
        </dialog>
      )}
    </div>
  );
}
