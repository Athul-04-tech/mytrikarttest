import React, { useState, useEffect, useCallback } from 'react';
import {
  RotateCcw,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Boxes,
  X,
} from 'lucide-react';
import { apiRequest } from '../../utils/api';
import {
  formatReturnInspectionLabel,
  formatReturnDestinationLabel,
  getReturnDestinationBadgeClass,
  formatDateTime,
  parseWarehouseApiError,
} from '../../utils/warehouseUtils';

export default function SellerReturnsSection({
  onFeatureDisabled,
  onUnauthorized,
}) {
  const [featureDisabled, setFeatureDisabled] = useState(false);
  const [receipts, setReceipts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionBanner, setActionBanner] = useState('');

  // Seller handback confirmation <dialog> state (`POST /api/warehouse/returns/vendor/<pk>/confirm-handback/`)
  const [handbackModalReceipt, setHandbackModalReceipt] = useState(null);
  const [handbackReference, setHandbackReference] = useState('');
  const [handbackQuantities, setHandbackQuantities] = useState({});
  const [handbackFieldErrors, setHandbackFieldErrors] = useState({});
  const [handbackGeneralError, setHandbackGeneralError] = useState('');
  const [handbackSubmitting, setHandbackSubmitting] = useState(false);
  const [lastHandbackResult, setLastHandbackResult] = useState(null);

  const fetchSellerReceipts = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await apiRequest('/api/warehouse/returns/vendor/');
      const rows = Array.isArray(data) ? data : data?.results || [];
      setReceipts(rows);
      setFeatureDisabled(false);
    } catch (err) {
      if (err?.status === 401 && onUnauthorized) {
        await onUnauthorized();
        return;
      }
      if (err?.status === 404) {
        setFeatureDisabled(true);
        if (onFeatureDisabled) onFeatureDisabled();
        return;
      }
      const parsed = parseWarehouseApiError(err);
      setError(
        parsed.generalError ||
          err?.data?.detail ||
          'Failed to load returned goods receipts.'
      );
    } finally {
      setLoading(false);
    }
  }, [onFeatureDisabled, onUnauthorized]);

  useEffect(() => {
    fetchSellerReceipts();
  }, [fetchSellerReceipts]);

  if (featureDisabled) {
    return null;
  }

  const openConfirmHandbackModal = (receipt) => {
    setHandbackModalReceipt(receipt);
    setHandbackReference('');
    const qtyMap = {};
    (receipt.lines || []).forEach((line) => {
      if (line.destination === 'seller_handback') {
        const remaining =
          Number(line.received_quantity ?? 0) -
          Number(line.seller_confirmed_quantity ?? 0);
        qtyMap[line.receipt_line_id] = String(
          remaining > 0 ? remaining : line.received_quantity ?? 1
        );
      }
    });
    setHandbackQuantities(qtyMap);
    setHandbackFieldErrors({});
    setHandbackGeneralError('');
  };

  const handleConfirmHandbackSubmit = async (e) => {
    e.preventDefault();
    if (!handbackModalReceipt || handbackSubmitting) return;
    setHandbackFieldErrors({});
    setHandbackGeneralError('');
    setActionBanner('');
    setHandbackSubmitting(true);

    const handbackLines = (handbackModalReceipt.lines || []).filter(
      (line) => line.destination === 'seller_handback'
    );

    const quantitiesPayload = handbackLines
      .map((line) => {
        const raw = handbackQuantities[line.receipt_line_id];
        if (raw === undefined || String(raw).trim() === '') return null;
        return {
          receipt_line_id: Number(line.receipt_line_id),
          quantity: Number(raw),
        };
      })
      .filter(Boolean);

    try {
      const res = await apiRequest(
        `/api/warehouse/returns/vendor/${handbackModalReceipt.id}/confirm-handback/`,
        {
          method: 'POST',
          body: JSON.stringify({
            reference: handbackReference,
            quantities: quantitiesPayload,
          }),
        }
      );
      setHandbackModalReceipt(null);
      setLastHandbackResult(res);
      setActionBanner(
        `Confirmed returned goods received back for Receipt ${handbackModalReceipt.receipt_number} (Reference: ${res.reference}).`
      );
      await fetchSellerReceipts();
    } catch (err) {
      if (err?.status === 401 && onUnauthorized) {
        await onUnauthorized();
        return;
      }
      const parsed = parseWarehouseApiError(err, ['reference', 'quantities']);
      setHandbackFieldErrors(parsed.fieldErrors);
      if (Object.keys(parsed.fieldErrors).length === 0 || err?.status === 409) {
        setHandbackGeneralError(parsed.generalError);
      }
    } finally {
      setHandbackSubmitting(false);
    }
  };

  return (
    <section
      data-testid="seller-returns-section"
      className="bg-white rounded-3xl border border-[#EAE3DC] p-5 sm:p-6 shadow-xs space-y-5 text-xs"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#EAE3DC] pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <RotateCcw className="w-4 h-4 text-[#FA661C]" />
            <span className="text-[11px] font-black uppercase tracking-wider text-[#FA661C]">
              Customer Return Receipts
            </span>
          </div>
          <h2 className="font-['Outfit'] font-extrabold text-lg text-[#1A2420] mt-0.5">
            Returned Goods &amp; Inspection Results
          </h2>
          <p className="text-xs text-[#6B6058]">
            View hub inspection results for returned goods and confirm receipt of items handed back to you.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchSellerReceipts}
          disabled={loading}
          data-testid="refresh-seller-returns-btn"
          className="px-3.5 py-2 rounded-xl border border-[#EAE3DC] bg-white hover:bg-[#FFF3EC] font-bold text-[#1A2420] flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
        >
          <RefreshCw
            className={`w-3.5 h-3.5 text-[#FA661C] ${
              loading ? 'animate-spin' : ''
            }`}
          />
          <span>Refresh</span>
        </button>
      </div>

      {actionBanner && (
        <div
          data-testid="seller-returns-action-banner"
          role="status"
          className="p-4 rounded-2xl border border-[#6EE7B7] bg-[#ECFDF5] text-[#065F46] font-bold flex items-center justify-between"
        >
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-[#059669] shrink-0" />
            <span>{actionBanner}</span>
          </div>
          <button
            type="button"
            onClick={() => setActionBanner('')}
            className="underline cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {lastHandbackResult && (
        <div
          data-testid="seller-return-handback-result"
          className="p-4 rounded-2xl border border-[#6EE7B7] bg-[#ECFDF5]/60 space-y-1.5"
        >
          <div className="font-bold text-[#065F46]">
            Handback Confirmation #{lastHandbackResult.id} • Receipt #
            {lastHandbackResult.receipt_id} • Reference:{' '}
            <span className="font-mono">{lastHandbackResult.reference}</span>
          </div>
          {Array.isArray(lastHandbackResult.lines) && (
            <div className="text-[11px] text-[#1A2420] font-mono">
              {lastHandbackResult.lines.map((l) => (
                <span key={l.receipt_line_id} className="mr-3">
                  Line #{l.receipt_line_id}: Confirmed Qty {l.quantity}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {error && (
        <div
          role="alert"
          data-testid="seller-returns-error"
          className="p-4 rounded-2xl border border-[#FCA5A5] bg-[#FFF3F3] text-[#991B1B] font-bold flex items-center space-x-2"
        >
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="py-10 text-center text-[#6B6058]">
          Loading returned goods receipts…
        </div>
      ) : receipts.length === 0 ? (
        <div
          data-testid="seller-returns-empty"
          className="py-12 text-center border border-dashed border-[#EAE3DC] rounded-2xl space-y-2"
        >
          <Boxes className="w-8 h-8 text-[#FA661C] mx-auto opacity-80" />
          <p className="font-bold text-sm text-[#1A2420]">
            No returned goods receipts yet
          </p>
          <p className="text-[#6B6058]">
            When a platform hub receives and inspects returned goods for your parcels, the receipt and inspection results will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {receipts.map((receipt) => {
            const hasHandbackLines = (receipt.lines || []).some(
              (l) => l.destination === 'seller_handback'
            );
            return (
              <div
                key={receipt.id}
                data-testid={`seller-return-receipt-card-${receipt.id}`}
                className="p-4 rounded-2xl border border-[#EAE3DC] bg-[#FFF8F2]/50 space-y-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#EAE3DC] pb-2.5">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span
                      data-testid={`seller-return-receipt-number-${receipt.id}`}
                      className="font-mono font-extrabold text-sm text-[#FA661C]"
                    >
                      {receipt.receipt_number}
                    </span>
                    <span className="font-mono font-bold text-[#1A2420]">
                      RMA-{receipt.rma_id}
                    </span>
                    <span className="text-[#6B6058]">
                      Parcel #{receipt.vendor_order_id} • Hub #{receipt.warehouse_id}
                    </span>
                    <span className="text-[11px] font-mono text-[#6B6058]">
                      Received: {formatDateTime(receipt.received_at)}
                    </span>
                  </div>

                  {hasHandbackLines && (
                    <button
                      type="button"
                      data-testid={`open-seller-return-handback-btn-${receipt.id}`}
                      onClick={() => openConfirmHandbackModal(receipt)}
                      className="px-3.5 py-1.5 rounded-xl bg-[#6B21A8] hover:bg-[#581C87] text-white font-bold cursor-pointer"
                    >
                      Confirm goods received back
                    </button>
                  )}
                </div>

                {receipt.allocation_note && (
                  <div
                    data-testid={`seller-return-allocation-note-${receipt.id}`}
                    className="p-2.5 rounded-xl bg-white border border-[#EAE3DC] text-[#1A2420] font-semibold"
                  >
                    Allocation Note: {receipt.allocation_note}
                  </div>
                )}

                <div className="overflow-x-auto bg-white rounded-xl border border-[#EAE3DC]">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-[#EAE3DC] text-[#6B6058] uppercase text-[10px]">
                        <th className="py-2 px-3">Product &amp; SKU</th>
                        <th className="py-2 px-3 text-right">Expected</th>
                        <th className="py-2 px-3 text-right">Received</th>
                        <th className="py-2 px-3">Inspection Result</th>
                        <th className="py-2 px-3">Destination</th>
                        <th className="py-2 px-3 text-right">
                          Confirmed Handback Qty
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#EAE3DC]/60">
                      {(receipt.lines || []).map((line) => (
                        <tr
                          key={line.receipt_line_id}
                          data-testid={`seller-return-line-row-${line.receipt_line_id}`}
                        >
                          <td className="py-2.5 px-3">
                            <div className="font-bold text-[#1A2420]">
                              {line.product_name}
                            </div>
                            <div className="font-mono text-[11px] text-[#FA661C]">
                              {line.sku} • Line #{line.receipt_line_id}
                            </div>
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono">
                            {line.expected_quantity}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold">
                            {line.received_quantity}
                          </td>
                          <td
                            data-testid={`seller-return-line-result-${line.receipt_line_id}`}
                            className="py-2.5 px-3 font-bold text-[#1A2420]"
                          >
                            {formatReturnInspectionLabel(line.inspection_result)}
                          </td>
                          <td className="py-2.5 px-3">
                            <span
                              data-testid={`seller-return-line-destination-${line.receipt_line_id}`}
                              className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${getReturnDestinationBadgeClass(
                                line.destination
                              )}`}
                            >
                              {formatReturnDestinationLabel(line.destination)}
                            </span>
                          </td>
                          <td
                            data-testid={`seller-return-line-confirmed-${line.receipt_line_id}`}
                            className="py-2.5 px-3 text-right font-mono font-bold text-[#6B21A8]"
                          >
                            {line.seller_confirmed_quantity ?? 0}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* NATIVE <dialog>: CONFIRM RETURNED GOODS RECEIVED BACK BY SELLER */}
      {handbackModalReceipt && (
        <dialog
          open
          data-testid="seller-return-handback-dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-[#1A2420]/50 backdrop-blur-2xs flex items-center justify-center p-4 w-full h-full m-0 border-0"
        >
          <div className="bg-white rounded-3xl border border-[#EAE3DC] shadow-2xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#EAE3DC] pb-3">
              <h3 className="font-['Outfit'] font-extrabold text-base text-[#1A2420]">
                Confirm goods received back — {handbackModalReceipt.receipt_number}
              </h3>
              <button
                type="button"
                onClick={() => setHandbackModalReceipt(null)}
                className="p-1.5 rounded-lg text-[#6B6058] hover:bg-[#FFF3EC] cursor-pointer"
                aria-label="Close confirm return handback dialog"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-[#6B6058]">
              Enter your receipt reference and confirm the quantities of returned goods physically handed back to you from the hub.
            </p>

            {handbackGeneralError && (
              <div
                role="alert"
                data-testid="seller-return-handback-general-error"
                className="p-3 rounded-xl bg-[#FFF3F3] border border-[#FCA5A5] text-xs font-bold text-[#991B1B]"
              >
                {handbackGeneralError}
              </div>
            )}

            {handbackFieldErrors.quantities && (
              <div
                role="alert"
                data-testid="seller-return-handback-error-quantities"
                className="p-3 rounded-xl bg-[#FFF3F3] border border-[#FCA5A5] text-xs font-bold text-[#DC2626]"
              >
                {handbackFieldErrors.quantities}
              </div>
            )}

            <form
              onSubmit={handleConfirmHandbackSubmit}
              noValidate
              className="space-y-4 text-xs"
            >
              <div>
                <label
                  htmlFor="seller-return-handback-reference"
                  className="block font-bold text-[#1A2420] mb-1"
                >
                  Receipt Reference *
                </label>
                <input
                  id="seller-return-handback-reference"
                  type="text"
                  data-testid="seller-return-handback-reference-input"
                  value={handbackReference}
                  onChange={(e) => {
                    setHandbackReference(e.target.value);
                    setHandbackFieldErrors((fe) => ({ ...fe, reference: '' }));
                  }}
                  placeholder="e.g. SELLER-RET-2026-01"
                  className="w-full px-3 py-2 rounded-xl border border-[#EAE3DC] font-mono"
                />
                {handbackFieldErrors.reference && (
                  <p
                    data-testid="seller-return-handback-error-reference"
                    className="mt-1 text-[#DC2626] font-semibold"
                  >
                    {handbackFieldErrors.reference}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <span className="font-bold text-[#1A2420] block">
                  Returned Quantities by Line *
                </span>
                {(handbackModalReceipt.lines || [])
                  .filter((line) => line.destination === 'seller_handback')
                  .map((line) => (
                    <div
                      key={line.receipt_line_id}
                      data-testid={`seller-return-handback-line-${line.receipt_line_id}`}
                      className="p-3 rounded-xl border border-[#EAE3DC] bg-[#FFF8F2]/50 flex flex-wrap items-center justify-between gap-2"
                    >
                      <div>
                        <div className="font-bold text-[#1A2420]">
                          {line.product_name}
                        </div>
                        <div className="font-mono text-[11px] text-[#6B6058]">
                          {line.sku} • Received: {line.received_quantity} •
                          Already Confirmed:{' '}
                          {line.seller_confirmed_quantity ?? 0}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <label
                          htmlFor={`handback-qty-${line.receipt_line_id}`}
                          className="text-[11px] font-bold text-[#1A2420]"
                        >
                          Quantity:
                        </label>
                        <input
                          id={`handback-qty-${line.receipt_line_id}`}
                          type="number"
                          min="1"
                          max={line.received_quantity}
                          data-testid={`seller-return-handback-qty-input-${line.receipt_line_id}`}
                          value={
                            handbackQuantities[line.receipt_line_id] ?? ''
                          }
                          onChange={(e) => {
                            const val = e.target.value;
                            setHandbackQuantities((prev) => ({
                              ...prev,
                              [line.receipt_line_id]: val,
                            }));
                            setHandbackFieldErrors((fe) => ({
                              ...fe,
                              quantities: '',
                            }));
                          }}
                          className="w-20 px-2.5 py-1.5 rounded-xl border border-[#EAE3DC] font-mono text-right bg-white"
                        />
                      </div>
                    </div>
                  ))}
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setHandbackModalReceipt(null)}
                  className="px-4 py-2 rounded-xl border border-[#EAE3DC] font-bold text-[#6B6058] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={handbackSubmitting}
                  data-testid="seller-return-handback-submit-btn"
                  className="px-4 py-2 rounded-xl bg-[#6B21A8] hover:bg-[#581C87] text-white font-bold cursor-pointer disabled:opacity-50"
                >
                  {handbackSubmitting ? 'Confirming…' : 'Confirm Handback'}
                </button>
              </div>
            </form>
          </div>
        </dialog>
      )}
    </section>
  );
}

