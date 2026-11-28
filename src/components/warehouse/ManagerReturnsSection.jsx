import React, { useState, useEffect, useCallback } from 'react';
import {
  RotateCcw,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  ArrowLeft,
  Boxes,
  X,
} from 'lucide-react';
import { apiRequest } from '../../utils/api';
import {
  RETURN_INSPECTION_RESULTS,
  formatReturnInspectionLabel,
  formatReturnDestinationLabel,
  getReturnDestinationBadgeClass,
  formatDateTime,
  parseWarehouseApiError,
} from '../../utils/warehouseUtils';

export default function ManagerReturnsSection({
  onFeatureDisabled,
  onUnauthorized,
}) {
  const [featureDisabled, setFeatureDisabled] = useState(false);
  const [returnsInbox, setReturnsInbox] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Selected RMA for receiving & inspection (`POST /api/warehouse/returns/manager/<pk>/receive/`)
  const [selectedRma, setSelectedRma] = useState(null);
  const [lineInputs, setLineInputs] = useState({});
  const [receiveFieldErrors, setReceiveFieldErrors] = useState({});
  const [receiveGeneralError, setReceiveGeneralError] = useState('');
  const [receiveConflictAlert, setReceiveConflictAlert] = useState('');
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [receiveSubmitting, setReceiveSubmitting] = useState(false);
  const [receiptResult, setReceiptResult] = useState(null);

  const fetchReturnsInbox = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await apiRequest('/api/warehouse/returns/manager/');
      const rows = Array.isArray(data) ? data : data?.results || [];
      setReturnsInbox(rows);
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
          'Failed to load hub returns inbox.'
      );
    } finally {
      setLoading(false);
    }
  }, [onFeatureDisabled, onUnauthorized]);

  useEffect(() => {
    fetchReturnsInbox();
  }, [fetchReturnsInbox]);

  if (featureDisabled) {
    return null;
  }

  const openRmaForReceive = (rmaRow) => {
    setSelectedRma(rmaRow);
    const initialLines = {};
    (rmaRow.lines || []).forEach((line) => {
      initialLines[line.return_request_item_id] = {
        received_quantity: String(line.expected_quantity ?? 1),
        inspection_result: 'resellable',
        note: '',
      };
    });
    setLineInputs(initialLines);
    setReceiveFieldErrors({});
    setReceiveGeneralError('');
    setReceiveConflictAlert('');
    setConfirmDialogOpen(false);
    setReceiptResult(null);
  };

  const handleOpenConfirmDialog = (e) => {
    e.preventDefault();
    if (!selectedRma || receiveSubmitting) return;
    setReceiveFieldErrors({});
    setReceiveGeneralError('');
    setReceiveConflictAlert('');
    setConfirmDialogOpen(true);
  };

  const handleConfirmReceiveSubmit = async () => {
    if (!selectedRma || receiveSubmitting) return;
    setReceiveFieldErrors({});
    setReceiveGeneralError('');
    setReceiveConflictAlert('');
    setReceiveSubmitting(true);

    const linesPayload = (selectedRma.lines || []).map((line) => {
      const inp = lineInputs[line.return_request_item_id] || {};
      const rawQty = inp.received_quantity ?? '';
      return {
        return_request_item_id: Number(line.return_request_item_id),
        received_quantity: rawQty === '' ? '' : Number(rawQty),
        inspection_result: inp.inspection_result || '',
        note: inp.note || '',
      };
    });

    try {
      const res = await apiRequest(
        `/api/warehouse/returns/manager/${selectedRma.rma_id}/receive/`,
        {
          method: 'POST',
          body: JSON.stringify({ lines: linesPayload }),
        }
      );
      setConfirmDialogOpen(false);
      setReceiptResult(res);
      await fetchReturnsInbox();
    } catch (err) {
      if (err?.status === 401 && onUnauthorized) {
        await onUnauthorized();
        return;
      }
      const parsed = parseWarehouseApiError(err, ['lines']);
      if (err?.status === 409) {
        setConfirmDialogOpen(false);
        setReceiveConflictAlert(
          parsed.generalError ||
            err?.data?.detail ||
            'This return has already been received or cannot be received in its current state.'
        );
        await fetchReturnsInbox();
      } else {
        setReceiveFieldErrors(parsed.fieldErrors);
        setReceiveGeneralError(parsed.generalError);
        if (Object.keys(parsed.fieldErrors).length > 0) {
          setConfirmDialogOpen(false);
        }
      }
    } finally {
      setReceiveSubmitting(false);
    }
  };

  return (
    <section
      data-testid="manager-returns-section"
      className="bg-white rounded-3xl border border-[#EAE3DC] p-5 sm:p-6 shadow-xs space-y-5 text-xs"
    >
      {!selectedRma ? (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#EAE3DC] pb-4">
            <div>
              <div className="flex items-center space-x-2">
                <RotateCcw className="w-4 h-4 text-[#FA661C]" />
                <span className="text-[11px] font-black uppercase tracking-wider text-[#FA661C]">
                  Hub Customer Returns
                </span>
              </div>
              <h2 className="font-['Outfit'] font-extrabold text-lg text-[#1A2420] mt-0.5">
                Returns Inbox
              </h2>
              <p className="text-xs text-[#6B6058]">
                Receive customer returned goods against approved RMAs and record line-by-line inspection results.
              </p>
            </div>

            <button
              type="button"
              onClick={fetchReturnsInbox}
              disabled={loading}
              data-testid="refresh-manager-returns-btn"
              className="px-3.5 py-2 rounded-xl border border-[#EAE3DC] bg-white hover:bg-[#FFF3EC] font-bold text-[#1A2420] flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 text-[#FA661C] ${
                  loading ? 'animate-spin' : ''
                }`}
              />
              <span>Refresh Inbox</span>
            </button>
          </div>

          {error && (
            <div
              role="alert"
              data-testid="manager-returns-error"
              className="p-4 rounded-2xl border border-[#FCA5A5] bg-[#FFF3F3] text-[#991B1B] font-bold flex items-center space-x-2"
            >
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {loading ? (
            <div className="py-10 text-center text-[#6B6058]">
              Loading expected returns…
            </div>
          ) : returnsInbox.length === 0 ? (
            <div
              data-testid="manager-returns-empty"
              className="py-12 text-center border border-dashed border-[#EAE3DC] rounded-2xl space-y-2"
            >
              <Boxes className="w-8 h-8 text-[#FA661C] mx-auto opacity-80" />
              <p className="font-bold text-sm text-[#1A2420]">
                No expected returns at this hub
              </p>
              <p className="text-[#6B6058]">
                Approved customer RMAs routed to your warehouse hub will appear here for physical receipt and inspection.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {returnsInbox.map((rma) => (
                <div
                  key={rma.rma_id}
                  data-testid={`manager-return-card-${rma.rma_id}`}
                  className="p-4 rounded-2xl border border-[#EAE3DC] bg-[#FFF8F2]/50 space-y-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#EAE3DC] pb-2.5">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <span
                        data-testid={`manager-return-rma-number-${rma.rma_id}`}
                        className="font-mono font-extrabold text-sm text-[#FA661C]"
                      >
                        {rma.rma_number}
                      </span>
                      <span
                        data-testid={`manager-return-status-${rma.rma_id}`}
                        className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-[#EFF6FF] text-[#1D4ED8] border border-[#93C5FD]"
                      >
                        {rma.status}
                      </span>
                      {rma.requested_action && (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-white border border-[#EAE3DC] text-[#6B6058]">
                          Action: {rma.requested_action}
                        </span>
                      )}
                      <span className="font-bold text-[#1A2420]">
                        Parcel #{rma.vendor_order_id} • Hub #{rma.warehouse_id}
                      </span>
                    </div>

                    <button
                      type="button"
                      data-testid={`open-manager-return-receive-btn-${rma.rma_id}`}
                      onClick={() => openRmaForReceive(rma)}
                      className="px-4 py-2 rounded-xl bg-[#FA661C] hover:bg-[#E0530B] text-white font-bold cursor-pointer"
                    >
                      Receive &amp; Inspect
                    </button>
                  </div>

                  <div className="overflow-x-auto bg-white rounded-xl border border-[#EAE3DC]">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-[#EAE3DC] text-[#6B6058] uppercase text-[10px]">
                          <th className="py-2 px-3">RMA Item ID</th>
                          <th className="py-2 px-3">Order Item ID</th>
                          <th className="py-2 px-3">SKU</th>
                          <th className="py-2 px-3 text-right">Expected Qty</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#EAE3DC]/60">
                        {(rma.lines || []).map((line) => (
                          <tr key={line.return_request_item_id}>
                            <td className="py-2 px-3 font-mono">
                              #{line.return_request_item_id}
                            </td>
                            <td className="py-2 px-3 font-mono text-[#6B6058]">
                              #{line.order_item_id}
                            </td>
                            <td className="py-2 px-3 font-mono font-bold text-[#1A2420]">
                              {line.sku}
                            </td>
                            <td className="py-2 px-3 text-right font-mono font-bold">
                              {line.expected_quantity}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        /* RECEIVE AND INSPECT VIEW */
        <div
          data-testid="manager-return-receive-view"
          className="space-y-5"
        >
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#EAE3DC] pb-4">
            <div className="flex items-center space-x-3">
              <button
                type="button"
                data-testid="manager-return-back-btn"
                onClick={() => setSelectedRma(null)}
                className="p-2 rounded-xl border border-[#EAE3DC] hover:bg-[#FFF3EC] text-[#1A2420] cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-['Outfit'] font-extrabold text-lg text-[#1A2420]">
                    Receive &amp; Inspect {selectedRma.rma_number}
                  </h2>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-[#EFF6FF] text-[#1D4ED8] border border-[#93C5FD]">
                    {selectedRma.status}
                  </span>
                </div>
                <p className="text-[11px] text-[#6B6058] mt-0.5">
                  RMA #{selectedRma.rma_id} • Parcel #
                  {selectedRma.vendor_order_id} • Hub #{selectedRma.warehouse_id}
                </p>
              </div>
            </div>
          </div>

          {receiveConflictAlert && (
            <div
              role="alert"
              data-testid="manager-return-conflict-alert"
              className="p-4 rounded-2xl border border-[#F59E0B] bg-[#FFFBEB] text-[#92400E] font-bold flex items-center space-x-2"
            >
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{receiveConflictAlert}</span>
            </div>
          )}

          {receiveGeneralError && (
            <div
              role="alert"
              data-testid="manager-return-general-error"
              className="p-3.5 rounded-2xl border border-[#FCA5A5] bg-[#FFF3F3] text-[#991B1B] font-bold flex items-center space-x-2"
            >
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{receiveGeneralError}</span>
            </div>
          )}

          {receiveFieldErrors.lines && (
            <div
              role="alert"
              data-testid="manager-return-error-lines"
              className="p-3.5 rounded-2xl border border-[#FCA5A5] bg-[#FFF3F3] text-[#991B1B] font-bold"
            >
              {receiveFieldErrors.lines}
            </div>
          )}

          {/* Server Receipt Result Panel */}
          {receiptResult ? (
            <div
              data-testid="manager-return-receipt-result"
              className="p-5 rounded-2xl border border-[#6EE7B7] bg-[#ECFDF5]/60 space-y-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#6EE7B7]/60 pb-3">
                <div className="flex items-center space-x-2 text-[#065F46] font-extrabold text-sm">
                  <CheckCircle2 className="w-5 h-5 text-[#059669] shrink-0" />
                  <span>
                    Return Receipt Recorded:{' '}
                    <strong
                      data-testid="manager-return-receipt-number"
                      className="font-mono"
                    >
                      {receiptResult.receipt_number}
                    </strong>
                  </span>
                </div>
                <span className="font-mono text-[11px] text-[#047857]">
                  Received at {formatDateTime(receiptResult.received_at)}
                </span>
              </div>

              {receiptResult.allocation_note && (
                <div
                  data-testid="manager-return-allocation-note"
                  className="p-3 rounded-xl bg-white border border-[#EAE3DC] text-[#1A2420] font-semibold"
                >
                  Allocation Note: {receiptResult.allocation_note}
                </div>
              )}

              <div className="overflow-x-auto bg-white rounded-xl border border-[#EAE3DC]">
                <table
                  data-testid="manager-return-receipt-lines-table"
                  className="w-full text-left border-collapse text-xs"
                >
                  <thead>
                    <tr className="bg-[#FFF3EC]/60 border-b border-[#EAE3DC] text-[#6B6058] uppercase text-[10px]">
                      <th className="py-2.5 px-3">Product &amp; SKU</th>
                      <th className="py-2.5 px-3 text-right">Expected</th>
                      <th className="py-2.5 px-3 text-right">Received</th>
                      <th className="py-2.5 px-3">Inspection Result</th>
                      <th className="py-2.5 px-3">Stock Destination</th>
                      <th className="py-2.5 px-3">Lot ID</th>
                      <th className="py-2.5 px-3">Note</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EAE3DC]">
                    {(receiptResult.lines || []).map((line) => (
                      <tr
                        key={line.receipt_line_id}
                        data-testid={`manager-return-receipt-line-${line.receipt_line_id}`}
                      >
                        <td className="py-2.5 px-3">
                          <div className="font-bold text-[#1A2420]">
                            {line.product_name}
                          </div>
                          <div className="font-mono text-[11px] text-[#FA661C]">
                            {line.sku}
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono">
                          {line.expected_quantity}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold">
                          {line.received_quantity}
                        </td>
                        <td
                          data-testid={`manager-return-line-result-${line.receipt_line_id}`}
                          className="py-2.5 px-3 font-bold text-[#1A2420]"
                        >
                          {formatReturnInspectionLabel(line.inspection_result)}
                        </td>
                        <td className="py-2.5 px-3">
                          <span
                            data-testid={`manager-return-line-destination-${line.receipt_line_id}`}
                            className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${getReturnDestinationBadgeClass(
                              line.destination
                            )}`}
                          >
                            {formatReturnDestinationLabel(line.destination)}
                          </span>
                        </td>
                        <td
                          data-testid={`manager-return-line-lot-${line.receipt_line_id}`}
                          className="py-2.5 px-3 font-mono font-bold"
                        >
                          {line.lot_id ? `Lot #${line.lot_id}` : '—'}
                        </td>
                        <td className="py-2.5 px-3 text-[#6B6058]">
                          {line.note || '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* Receive & Inspect Form */
            <form
              onSubmit={handleOpenConfirmDialog}
              data-testid="manager-return-receive-form"
              className="space-y-4"
              noValidate
            >
              <div className="overflow-x-auto rounded-2xl border border-[#EAE3DC]">
                <table
                  data-testid="manager-return-input-lines-table"
                  className="w-full text-left border-collapse text-xs"
                >
                  <thead>
                    <tr className="bg-[#FFF3EC]/60 border-b border-[#EAE3DC] text-[#6B6058] uppercase text-[10px]">
                      <th className="py-2.5 px-3">RMA Line &amp; SKU</th>
                      <th className="py-2.5 px-3 text-right">Expected Qty</th>
                      <th className="py-2.5 px-3 text-right">Received Qty *</th>
                      <th className="py-2.5 px-3">Inspection Result *</th>
                      <th className="py-2.5 px-3">Inspection Note</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EAE3DC]">
                    {(selectedRma.lines || []).map((line) => {
                      const rriId = line.return_request_item_id;
                      const inp = lineInputs[rriId] || {
                        received_quantity: '',
                        inspection_result: 'resellable',
                        note: '',
                      };
                      return (
                        <tr
                          key={rriId}
                          data-testid={`manager-return-input-row-${rriId}`}
                        >
                          <td className="py-3 px-3">
                            <div className="font-mono font-bold text-[#1A2420]">
                              {line.sku}
                            </div>
                            <div className="font-mono text-[11px] text-[#6B6058]">
                              RMA Item #{rriId} • Order Item #{line.order_item_id}
                            </div>
                          </td>
                          <td className="py-3 px-3 text-right font-mono font-bold text-sm">
                            {line.expected_quantity}
                          </td>
                          <td className="py-3 px-3 text-right">
                            <input
                              type="number"
                              min="0"
                              max={line.expected_quantity}
                              data-testid={`manager-return-qty-input-${rriId}`}
                              aria-label={`Received quantity for ${line.sku}`}
                              value={inp.received_quantity}
                              onChange={(e) => {
                                const val = e.target.value;
                                setLineInputs((prev) => ({
                                  ...prev,
                                  [rriId]: {
                                    ...prev[rriId],
                                    received_quantity: val,
                                  },
                                }));
                                setReceiveFieldErrors((fe) => ({
                                  ...fe,
                                  lines: '',
                                }));
                              }}
                              className="w-24 px-2.5 py-1.5 rounded-xl border border-[#EAE3DC] font-mono text-right"
                            />
                          </td>
                          <td className="py-3 px-3">
                            <select
                              data-testid={`manager-return-result-select-${rriId}`}
                              aria-label={`Inspection result for ${line.sku}`}
                              value={inp.inspection_result}
                              onChange={(e) => {
                                const val = e.target.value;
                                setLineInputs((prev) => ({
                                  ...prev,
                                  [rriId]: {
                                    ...prev[rriId],
                                    inspection_result: val,
                                  },
                                }));
                                setReceiveFieldErrors((fe) => ({
                                  ...fe,
                                  lines: '',
                                }));
                              }}
                              className="px-2.5 py-1.5 rounded-xl border border-[#EAE3DC] bg-white font-bold"
                            >
                              {RETURN_INSPECTION_RESULTS.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                  {opt.label}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="py-3 px-3">
                            <input
                              type="text"
                              data-testid={`manager-return-note-input-${rriId}`}
                              aria-label={`Note for ${line.sku}`}
                              value={inp.note}
                              onChange={(e) => {
                                const val = e.target.value;
                                setLineInputs((prev) => ({
                                  ...prev,
                                  [rriId]: {
                                    ...prev[rriId],
                                    note: val,
                                  },
                                }));
                              }}
                              placeholder="Optional inspection note"
                              className="w-full px-2.5 py-1.5 rounded-xl border border-[#EAE3DC]"
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedRma(null)}
                  className="px-4 py-2 rounded-xl border border-[#EAE3DC] font-bold text-[#6B6058] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  data-testid="open-manager-return-confirm-dialog-btn"
                  disabled={receiveSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-[#FA661C] hover:bg-[#E0530B] text-white font-bold cursor-pointer disabled:opacity-50"
                >
                  Record Return &amp; Inspection
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* NATIVE <dialog>: CONFIRM RETURN RECEIPT & INSPECTION */}
      {confirmDialogOpen && selectedRma && (
        <dialog
          open
          data-testid="manager-return-confirm-dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-[#1A1A1A]/60 backdrop-blur-2xs flex items-center justify-center p-4 w-full h-full m-0 border-0"
        >
          <div className="bg-white rounded-3xl border border-[#EAE3DC] shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#EAE3DC] pb-3">
              <h3 className="font-['Outfit'] font-extrabold text-lg text-[#1A2420]">
                Confirm Return Receipt — {selectedRma.rma_number}
              </h3>
              <button
                type="button"
                onClick={() => setConfirmDialogOpen(false)}
                className="p-1 text-[#6B6058] hover:text-[#1A2420] cursor-pointer"
                aria-label="Close return receipt confirmation dialog"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div
              data-testid="manager-return-confirm-notice"
              className="p-3.5 rounded-xl bg-[#FFFBEB] border border-[#F59E0B] text-xs font-bold text-[#92400E]"
            >
              This records the goods. It does not refund the customer; an admin handles the refund.
            </div>

            {receiveGeneralError && (
              <div
                role="alert"
                data-testid="manager-return-dialog-error"
                className="p-3 rounded-xl bg-[#FFF3F3] border border-[#FCA5A5] text-xs font-bold text-[#991B1B]"
              >
                {receiveGeneralError}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setConfirmDialogOpen(false)}
                className="px-4 py-2 rounded-xl border border-[#EAE3DC] font-bold text-[#6B6058] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                data-testid="confirm-manager-return-receive-submit-btn"
                disabled={receiveSubmitting}
                onClick={handleConfirmReceiveSubmit}
                className="px-4 py-2 rounded-xl bg-[#FA661C] hover:bg-[#E0530B] text-white font-bold cursor-pointer disabled:opacity-50"
              >
                {receiveSubmitting
                  ? 'Recording…'
                  : 'Confirm Receipt & Inspection'}
              </button>
            </div>
          </div>
        </dialog>
      )}
    </section>
  );
}

