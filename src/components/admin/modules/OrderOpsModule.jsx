import React, { useCallback, useEffect, useState } from 'react';
import { Truck, RefreshCw, AlertCircle, ChevronLeft, ChevronRight, Eye, Download, XCircle, CheckCircle2 } from 'lucide-react';
import { apiRequest } from '../../../utils/api';
import { useToast } from '../../../context/ToastContext';
import { downloadSellerInvoice } from '../../../utils/sellerInvoice';
import { formatRefundBreakdownLabel, parseWarehouseApiError } from '../../../utils/warehouseUtils';

const PAGE_SIZE = 25;
const ALLOWED_NEXT = {
  pending: ['processing', 'cancelled'],
  processing: ['shipped', 'cancelled'],
  shipped: ['delivered'],
  delivered: [],
  cancelled: [],
};

function errorMessage(error) {
  const detail = error?.data?.detail;
  if (Array.isArray(detail)) return detail.join(' ');
  if (detail) return detail;
  if (error?.data && typeof error.data === 'object') {
    return Object.entries(error.data)
      .map(([field, messages]) => `${field}: ${Array.isArray(messages) ? messages.join(', ') : messages}`)
      .join(' | ');
  }
  return error?.message || 'The order transition failed.';
}

export default function OrderOpsModule({ onInspectOrder } = {}) {
  const [orders, setOrders] = useState([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrevious, setHasPrevious] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null);
  const [confirmError, setConfirmError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const toast = useToast();

  // Phase C: Admin Cancel a Paid Parcel (`POST /api/orders/admin/vendor-orders/<pk>/cancel/`)
  const [cancelParcelModal, setCancelParcelModal] = useState(null); // order
  const [cancelParcelReason, setCancelParcelReason] = useState('');
  const [cancelParcelFieldErrors, setCancelParcelFieldErrors] = useState({});
  const [cancelParcelGeneralError, setCancelParcelGeneralError] = useState('');
  const [cancelParcelSubmitting, setCancelParcelSubmitting] = useState(false);
  const [cancelParcelResult, setCancelParcelResult] = useState(null);
  const [cancelParcelFeatureDisabled, setCancelParcelFeatureDisabled] = useState(false);

  const openCancelParcelDialog = (order) => {
    if (cancelParcelSubmitting) return;
    setCancelParcelModal(order);
    setCancelParcelReason('');
    setCancelParcelFieldErrors({});
    setCancelParcelGeneralError('');
  };

  const handleConfirmCancelParcel = async (e) => {
    e.preventDefault();
    if (!cancelParcelModal || cancelParcelSubmitting) return;
    setCancelParcelFieldErrors({});
    setCancelParcelGeneralError('');
    setCancelParcelSubmitting(true);

    try {
      const res = await apiRequest(
        `/api/orders/admin/vendor-orders/${cancelParcelModal.id}/cancel/`,
        {
          method: 'POST',
          body: JSON.stringify({ reason: cancelParcelReason }),
        }
      );
      setCancelParcelResult(res);
      setOrders((curr) =>
        curr.map((o) =>
          o.id === res.vendor_order_id ? { ...o, status: res.status } : o
        )
      );
      setCancelParcelModal(null);
    } catch (err) {
      if (
        err?.status === 404 &&
        /feature disabled/i.test(String(err?.data?.detail || ''))
      ) {
        setCancelParcelFeatureDisabled(true);
        setCancelParcelModal(null);
        return;
      }
      const parsed = parseWarehouseApiError(err, ['reason', 'writeoffs']);
      setCancelParcelFieldErrors(parsed.fieldErrors);
      if (Object.keys(parsed.fieldErrors).length === 0 || err?.status === 409) {
        setCancelParcelGeneralError(parsed.generalError);
      }
    } finally {
      setCancelParcelSubmitting(false);
    }
  };

  const fetchOrders = useCallback(async (requestedPage = page) => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiRequest(`/api/orders/admin/orders/?page=${requestedPage}&page_size=${PAGE_SIZE}`);
      if (!data || !Array.isArray(data.results)) {
        throw new Error('The admin orders endpoint returned an invalid paginated response.');
      }
      setOrders(data.results);
      setCount(data.count || 0);
      setHasNext(Boolean(data.next));
      setHasPrevious(Boolean(data.previous));
      setPage(requestedPage);
    } catch (fetchError) {
      setError(errorMessage(fetchError));
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { fetchOrders(1); }, []);

  const submitTransition = async () => {
    if (!confirmAction || submitting) return;
    setSubmitting(true);
    setConfirmError(null);
    try {
      const updated = await apiRequest(
        `/api/orders/admin/vendor-orders/${confirmAction.order.id}/transition/`,
        { method: 'POST', body: JSON.stringify({ status: confirmAction.status }) },
      );
      setOrders((current) => current.map((order) => order.id === updated.id ? updated : order));
      toast.success('Order Updated', `Order #${updated.id} is now ${updated.status}.`);
      setConfirmAction(null);
    } catch (actionError) {
      const message = errorMessage(actionError);
      setConfirmError(message);
      toast.error('Order Transition Rejected', message);
    } finally {
      setSubmitting(false);
    }
  };

  const openConfirmation = (order, status) => {
    setConfirmError(null);
    setConfirmAction({ order, status });
  };

  const downloadInvoice = async (order) => {
    try {
      const full = await apiRequest(`/api/orders/admin/vendor-orders/${order.id}/`);
      downloadSellerInvoice(full);
      toast.success('Invoice Downloaded', `Invoice_ORD-${order.id}.pdf saved.`);
    } catch (err) {
      toast.error('Invoice Failed', errorMessage(err));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#EAE3DC]">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-1 rounded-lg bg-[#FFF3EC] text-[#FA661C]"><Truck className="w-4 h-4" /></span>
            <h2 className="font-['Outfit'] font-black text-xl text-[#FA661C]">Order Management &amp; Fulfillment</h2>
          </div>
          <p className="text-xs text-[#6B6058] mt-0.5">Manage vendor orders according to marketplace fulfillment policies.</p>
        </div>
        <div className="flex items-center space-x-3 self-start sm:self-auto">
          <span className="text-xs font-bold text-[#FA661C] bg-[#FFF8F2] border border-[#FF811A]/50 px-3 py-1.5 rounded-xl">
            {count} Vendor Orders
          </span>
          <button type="button" onClick={() => fetchOrders(page)} disabled={loading} title="Refresh Orders"
            className="p-2 rounded-xl bg-white hover:bg-[#FFF3EC] border border-[#EAE3DC] text-[#FA661C] disabled:opacity-50">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {cancelParcelResult?.refund_request && (
        <div
          data-testid="order-ops-cancel-refund-summary"
          className="p-4 rounded-2xl border border-[#6EE7B7] bg-[#ECFDF5]/60 space-y-1.5 text-xs"
        >
          <div className="flex flex-wrap items-center justify-between gap-2 font-bold text-[#065F46]">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-[#059669]" />
              <span>
                Parcel #{cancelParcelResult.vendor_order_id} Cancelled • Refund
                Request #{cancelParcelResult.refund_request.id} (
                {cancelParcelResult.refund_request.status})
              </span>
            </span>
            <span className="font-mono font-extrabold text-sm">
              {cancelParcelResult.refund_request.currency}{' '}
              {cancelParcelResult.refund_request.amount}
            </span>
          </div>
          {cancelParcelResult.refund_request.breakdown &&
            typeof cancelParcelResult.refund_request.breakdown === 'object' && (
              <div
                data-testid="order-ops-cancel-refund-breakdown"
                className="pt-1.5 border-t border-[#6EE7B7]/50 space-y-1 text-[11px] text-[#1A2420]"
              >
                {Object.entries(
                  cancelParcelResult.refund_request.breakdown
                ).map(([bKey, bVal]) => (
                  <div key={bKey} className="flex justify-between">
                    <span className="text-[#6B6058]">
                      {formatRefundBreakdownLabel(bKey)}
                    </span>
                    <span className="font-mono font-bold">
                      {cancelParcelResult.refund_request.currency} {String(bVal)}
                    </span>
                  </div>
                ))}
              </div>
            )}
        </div>
      )}

      {error && <div role="alert" className="p-4 bg-[#FDE8EA] border border-[#D7263D]/30 rounded-2xl text-xs text-[#D7263D]">
        <strong>Error Loading Order Ledger</strong><p className="mt-1">{error}</p>
        <button type="button" onClick={() => fetchOrders(page)} className="mt-2 underline">Retry</button>
      </div>}
      {loading && <div className="bg-white rounded-2xl border border-[#EAE3DC] p-6 text-center text-xs text-[#6B6058]">Loading real vendor orders…</div>}
      {!loading && !error && orders.length === 0 && <div className="bg-white rounded-3xl border border-dashed border-[#EAE3DC] p-10 text-center text-xs text-[#6B6058]">No vendor orders found.</div>}

      {!loading && !error && orders.length > 0 && <div className="bg-white rounded-2xl border border-[#EAE3DC] overflow-hidden shadow-xs">
        <div className="overflow-x-auto"><table className="w-full text-left text-xs border-collapse">
          <thead><tr className="bg-[#FFF3EC] text-[#FA661C] border-b border-[#EAE3DC] font-extrabold uppercase text-[10px] tracking-wider">
            <th className="p-3">Vendor Order</th><th className="p-3">Vendor / Customer</th><th className="p-3 text-right">Total</th><th className="p-3 text-center">Status</th><th className="p-3">Allowed Actions</th><th className="p-3 text-right">Details</th>
          </tr></thead>
          <tbody className="divide-y divide-[#EAE3DC]/60 font-medium">
            {orders.map((order) => <tr key={order.id} className="hover:bg-[#FFF8F2]/50">
              <td className="p-3"><span className="font-mono font-bold text-[#FA661C]">#{order.id}</span><span className="block text-[10px] text-[#6B6058]">Parent order #{order.order_id}</span></td>
              <td className="p-3"><strong>{order.vendor_name || `Vendor #${order.vendor}`}</strong><span className="block text-[10px] text-[#6B6058]">Customer: {order.customer_name}</span></td>
              <td className="p-3 text-right font-mono font-bold">{order.currency} {order.grand_total}</td>
              <td className="p-3 text-center"><span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-[#FFF3EC] text-[#FA661C]">{order.status}</span></td>
              <td className="p-3"><div className="flex flex-wrap gap-1.5">
                {!cancelParcelFeatureDisabled && ['pending', 'processing'].includes(order.status) && (
                  <button
                    type="button"
                    data-testid={`admin-cancel-parcel-btn-${order.id}`}
                    onClick={() => openCancelParcelDialog(order)}
                    className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-red-50 text-red-700 border border-red-200 cursor-pointer"
                  >
                    Cancel parcel
                  </button>
                )}
                {(ALLOWED_NEXT[order.status] || []).map((status) => <button key={status} type="button"
                  onClick={() => openConfirmation(order, status)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold capitalize ${status === 'cancelled' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-[#FFF3EC] text-[#FA661C] border border-[#FA661C]/30'}`}>
                  {status === 'cancelled' ? 'Cancel…' : `Mark ${status}`}
                </button>)}
                {!(ALLOWED_NEXT[order.status] || []).length && <span className="text-[10px] text-[#6B6058]">No further transitions</span>}
              </div></td>
              <td className="p-3"><div className="flex justify-end gap-1.5">
                {onInspectOrder && <button type="button" onClick={() => onInspectOrder(order.id)} title="Inspect order"
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-[#FFF3EC] hover:bg-[#FA661C] text-[#FA661C] hover:text-white border border-[#FF811A]/40 transition-colors">
                  <Eye className="w-3 h-3" />Inspect
                </button>}
                <button type="button" onClick={() => downloadInvoice(order)} title="Download invoice"
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-white hover:bg-[#FFF3EC] text-[#FA661C] border border-[#EAE3DC]">
                  <Download className="w-3 h-3 text-[#FF811A]" />Invoice
                </button>
              </div></td>
            </tr>)}
          </tbody>
        </table></div>
        <div className="flex items-center justify-between border-t border-[#EAE3DC] px-4 py-3 text-xs">
          <span className="text-[#6B6058]">Page {page} · {count} vendor orders</span>
          <div className="flex gap-2">
            <button type="button" disabled={!hasPrevious || loading} onClick={() => fetchOrders(page - 1)} className="inline-flex items-center gap-1 px-3 py-1.5 border rounded-lg disabled:opacity-40"><ChevronLeft className="w-4 h-4" />Previous</button>
            <button type="button" disabled={!hasNext || loading} onClick={() => fetchOrders(page + 1)} className="inline-flex items-center gap-1 px-3 py-1.5 border rounded-lg disabled:opacity-40">Next<ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
      </div>}

      {confirmAction && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="presentation">
        <section role="dialog" aria-modal="true" aria-labelledby="order-action-title" className="w-full max-w-lg space-y-4 rounded-2xl bg-white p-6 shadow-2xl">
          <h3 id="order-action-title" className="text-lg font-bold text-[#1A2420]">Confirm {confirmAction.status} for vendor order #{confirmAction.order.id}?</h3>
          {confirmAction.status === 'cancelled' && <p className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950">
            This cancels the <strong>entire parent order</strong>. If the parent payment is unpaid, the backend marks payment failed and restores stock for all line items. If it is paid, cancellation is rejected and the order must use the RMA refund flow.
          </p>}
          {confirmError && <div role="alert" className="flex gap-2 rounded-xl border border-red-300 bg-red-50 p-3 text-sm text-red-900"><AlertCircle className="h-5 w-5 shrink-0" />{confirmError}</div>}
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => { setConfirmAction(null); setConfirmError(null); }} disabled={submitting} className="rounded-lg border px-4 py-2 text-sm">Back</button>
            <button type="button" onClick={submitTransition} disabled={submitting} className="rounded-lg bg-[#FA661C] px-4 py-2 text-sm font-bold text-white disabled:opacity-50">{submitting ? 'Applying…' : `Confirm ${confirmAction.status}`}</button>
          </div>
        </section>
      </div>}

      {/* NATIVE <dialog>: ADMIN CANCEL A PAID PARCEL (`POST /api/orders/admin/vendor-orders/<pk>/cancel/`) */}
      {cancelParcelModal && (
        <dialog
          open
          data-testid="order-ops-cancel-parcel-dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 w-full h-full m-0 border-0"
        >
          <div className="w-full max-w-md space-y-4 rounded-3xl bg-white p-6 shadow-2xl border border-[#EAE3DC] text-xs">
            <div className="flex items-center justify-between border-b border-[#EAE3DC] pb-3">
              <h3 className="font-['Outfit'] font-extrabold text-base text-[#1A2420]">
                Cancel Parcel #{cancelParcelModal.id}
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

            <div className="p-3.5 rounded-xl bg-[#FFFBEB] border border-[#F59E0B] font-bold text-[#92400E]">
              This cancels paid seller parcel #{cancelParcelModal.id} before shipment, releases reserved stock, and creates a customer refund request with a breakdown.
            </div>

            {cancelParcelGeneralError && (
              <div
                role="alert"
                data-testid="order-ops-cancel-general-error"
                className="p-3 rounded-xl bg-[#FFF3F3] border border-[#FCA5A5] font-bold text-[#991B1B]"
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
                  htmlFor="order-ops-cancel-reason"
                  className="block font-bold text-[#1A2420] mb-1"
                >
                  Cancellation Reason *
                </label>
                <textarea
                  id="order-ops-cancel-reason"
                  rows={2}
                  data-testid="order-ops-cancel-reason-input"
                  value={cancelParcelReason}
                  onChange={(e) => {
                    setCancelParcelReason(e.target.value);
                    setCancelParcelFieldErrors((fe) => ({ ...fe, reason: '' }));
                  }}
                  placeholder="Enter mandatory cancellation reason..."
                  className="w-full px-3 py-2 rounded-xl border border-[#EAE3DC]"
                />
                {cancelParcelFieldErrors.reason && (
                  <p
                    data-testid="order-ops-cancel-error-reason"
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
                  Cancel
                </button>
                <button
                  type="submit"
                  data-testid="order-ops-cancel-submit-btn"
                  disabled={cancelParcelSubmitting}
                  className="px-4 py-2 rounded-xl bg-[#DC2626] hover:bg-[#B91C1C] text-white font-bold cursor-pointer disabled:opacity-50"
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
