import React, { useCallback, useEffect, useState } from 'react';
import { Truck, RefreshCw, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { apiRequest } from '../../../utils/api';
import { useToast } from '../../../context/ToastContext';

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

export default function OrderOpsModule() {
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#EAE3DC]">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-1 rounded-lg bg-[#FFF3EC] text-[#FA661C]"><Truck className="w-4 h-4" /></span>
            <h2 className="font-['Outfit'] font-black text-xl text-[#FA661C]">Order Management &amp; Fulfillment</h2>
          </div>
          <p className="text-xs text-[#6B6058] mt-0.5">Real vendor orders. Status actions follow the backend transition rules.</p>
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

      {error && <div role="alert" className="p-4 bg-[#FDE8EA] border border-[#D7263D]/30 rounded-2xl text-xs text-[#D7263D]">
        <strong>Error Loading Order Ledger</strong><p className="mt-1">{error}</p>
        <button type="button" onClick={() => fetchOrders(page)} className="mt-2 underline">Retry</button>
      </div>}
      {loading && <div className="bg-white rounded-2xl border border-[#EAE3DC] p-6 text-center text-xs text-[#6B6058]">Loading real vendor orders…</div>}
      {!loading && !error && orders.length === 0 && <div className="bg-white rounded-3xl border border-dashed border-[#EAE3DC] p-10 text-center text-xs text-[#6B6058]">No vendor orders found.</div>}

      {!loading && !error && orders.length > 0 && <div className="bg-white rounded-2xl border border-[#EAE3DC] overflow-hidden shadow-xs">
        <div className="overflow-x-auto"><table className="w-full text-left text-xs border-collapse">
          <thead><tr className="bg-[#FFF3EC] text-[#FA661C] border-b border-[#EAE3DC] font-extrabold uppercase text-[10px] tracking-wider">
            <th className="p-3">Vendor Order</th><th className="p-3">Vendor / Customer</th><th className="p-3 text-right">Total</th><th className="p-3 text-center">Status</th><th className="p-3">Allowed Actions</th>
          </tr></thead>
          <tbody className="divide-y divide-[#EAE3DC]/60 font-medium">
            {orders.map((order) => <tr key={order.id} className="hover:bg-[#FFF8F2]/50">
              <td className="p-3"><span className="font-mono font-bold text-[#FA661C]">#{order.id}</span><span className="block text-[10px] text-[#6B6058]">Parent order #{order.order_id}</span></td>
              <td className="p-3"><strong>{order.vendor_name || `Vendor #${order.vendor}`}</strong><span className="block text-[10px] text-[#6B6058]">Customer: {order.customer_name}</span></td>
              <td className="p-3 text-right font-mono font-bold">{order.currency} {Number(order.grand_total || 0).toLocaleString()}</td>
              <td className="p-3 text-center"><span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-[#FFF3EC] text-[#FA661C]">{order.status}</span></td>
              <td className="p-3"><div className="flex flex-wrap gap-1.5">
                {(ALLOWED_NEXT[order.status] || []).map((status) => <button key={status} type="button"
                  onClick={() => openConfirmation(order, status)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold capitalize ${status === 'cancelled' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-[#FFF3EC] text-[#FA661C] border border-[#FA661C]/30'}`}>
                  {status === 'cancelled' ? 'Cancel…' : `Mark ${status}`}
                </button>)}
                {!(ALLOWED_NEXT[order.status] || []).length && <span className="text-[10px] text-[#6B6058]">No further transitions</span>}
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
    </div>
  );
}
