import React, { useState, useEffect, useCallback } from 'react';
import {
  Truck,
  Search,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  RefreshCw,
  ArrowLeft,
  Clock,
  Boxes,
  X,
} from 'lucide-react';
import { apiRequest } from '../../utils/api';
import {
  HANDOVER_LINE_CONDITIONS,
  formatHandoverStatusLabel,
  getHandoverStatusBadgeClass,
  isHandoverMarkedOverdueByServer,
  parseWarehouseApiError,
} from '../../utils/warehouseUtils';

export default function ManagerHandoversSection({
  onOpenShipment,
  onFeatureDisabled,
  onUnauthorized,
}) {
  const [featureDisabled, setFeatureDisabled] = useState(false);
  const [handovers, setHandovers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchNumber, setSearchNumber] = useState('');

  // Selected handover for receiving (`POST /api/warehouse/manager/handovers/<pk>/receive/`)
  const [selectedHandover, setSelectedHandover] = useState(null);
  const [lineInputs, setLineInputs] = useState({});
  const [receiveFieldErrors, setReceiveFieldErrors] = useState({});
  const [receiveGeneralError, setReceiveGeneralError] = useState('');
  const [receiveSubmitting, setReceiveSubmitting] = useState(false);
  const [receiveResult, setReceiveResult] = useState(null);

  // Reject confirmation <dialog> state
  const [rejectConfirmOpen, setRejectConfirmOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const fetchInbox = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await apiRequest('/api/warehouse/manager/handovers/');
      const rows = Array.isArray(data) ? data : data?.results || [];
      setHandovers(rows);
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
          'Failed to load hub handovers inbox.'
      );
    } finally {
      setLoading(false);
    }
  }, [onFeatureDisabled, onUnauthorized]);

  useEffect(() => {
    fetchInbox();
  }, [fetchInbox]);

  if (featureDisabled) {
    return null;
  }

  const initReceiveForm = (row) => {
    const nextLines = {};
    (row.lines || []).forEach((line) => {
      nextLines[line.id] = {
        received_quantity:
          line.received_quantity !== null && line.received_quantity !== undefined
            ? String(line.received_quantity)
            : String(line.expected_quantity ?? ''),
        condition: line.condition || 'good',
        note: line.note || '',
      };
    });
    setLineInputs(nextLines);
    setReceiveFieldErrors({});
    setReceiveGeneralError('');
    setReceiveResult(null);
    setRejectConfirmOpen(false);
    setRejectReason('');
  };

  const openHandoverForReceive = (row) => {
    setSelectedHandover(row);
    initReceiveForm(row);
  };

  const handleFindByNumber = (e) => {
    e.preventDefault();
    const query = searchNumber.trim().toLowerCase();
    if (!query) return;
    const found = handovers.find(
      (h) => String(h.handover_number || '').toLowerCase() === query
    );
    if (found) {
      openHandoverForReceive(found);
    }
  };

  const buildLinesPayload = (handover) =>
    (handover.lines || []).map((line) => {
      const entry = lineInputs[line.id] || {};
      const rawQty = entry.received_quantity ?? '';
      return {
        line_id: Number(line.id),
        received_quantity: rawQty === '' ? 0 : Number(rawQty),
        condition: entry.condition || 'good',
        note: entry.note || '',
      };
    });

  // Submit Accept (`accept: true`) -> server validates and returns { handover, shipment_id }
  const handleSubmitAccept = async () => {
    if (!selectedHandover || receiveSubmitting) return;
    setReceiveFieldErrors({});
    setReceiveGeneralError('');
    setReceiveSubmitting(true);

    try {
      const res = await apiRequest(
        `/api/warehouse/manager/handovers/${selectedHandover.id}/receive/`,
        {
          method: 'POST',
          body: JSON.stringify({
            accept: true,
            lines: buildLinesPayload(selectedHandover),
            reason: '',
          }),
        }
      );
      setReceiveResult(res);
      if (res?.handover) {
        setSelectedHandover(res.handover);
      }
      await fetchInbox();
      if (res?.shipment_id && onOpenShipment) {
        onOpenShipment(res.shipment_id);
      }
    } catch (err) {
      const parsed = parseWarehouseApiError(err, ['lines', 'reason']);
      setReceiveFieldErrors(parsed.fieldErrors);
      setReceiveGeneralError(parsed.generalError);
    } finally {
      setReceiveSubmitting(false);
    }
  };

  // Submit Reject (`accept: false, reason`) from native <dialog> -> server validates, cancels parcel & refunds customer
  const handleConfirmRejectSubmit = async (e) => {
    e.preventDefault();
    if (!selectedHandover || receiveSubmitting) return;
    setReceiveFieldErrors({});
    setReceiveGeneralError('');
    setReceiveSubmitting(true);

    try {
      const res = await apiRequest(
        `/api/warehouse/manager/handovers/${selectedHandover.id}/receive/`,
        {
          method: 'POST',
          body: JSON.stringify({
            accept: false,
            lines: buildLinesPayload(selectedHandover),
            reason: rejectReason,
          }),
        }
      );
      setRejectConfirmOpen(false);
      setReceiveResult(res);
      if (res?.handover) {
        setSelectedHandover(res.handover);
      }
      await fetchInbox();
    } catch (err) {
      const parsed = parseWarehouseApiError(err, ['lines', 'reason']);
      setReceiveFieldErrors(parsed.fieldErrors);
      if (Object.keys(parsed.fieldErrors).length === 0 || err?.status === 409) {
        setReceiveGeneralError(parsed.generalError);
      }
    } finally {
      setReceiveSubmitting(false);
    }
  };

  const filteredHandovers = searchNumber.trim()
    ? handovers.filter((h) =>
        String(h.handover_number || '')
          .toLowerCase()
          .includes(searchNumber.trim().toLowerCase())
      )
    : handovers;

  return (
    <section
      data-testid="manager-handovers-section"
      className="bg-white rounded-3xl border border-[#EAE3DC] p-5 sm:p-6 shadow-xs space-y-5 text-xs"
    >
      {!selectedHandover ? (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#EAE3DC] pb-4">
            <div>
              <div className="flex items-center space-x-2">
                <Truck className="w-4 h-4 text-[#FA661C]" />
                <span className="text-[11px] font-black uppercase tracking-wider text-[#FA661C]">
                  Hub Inbound Receiving
                </span>
              </div>
              <h2 className="font-['Outfit'] font-extrabold text-lg text-[#1A2420] mt-0.5">
                Expected &amp; In-Transit Seller Handovers
              </h2>
              <p className="text-xs text-[#6B6058]">
                Find by handover number, inspect incoming parcels, and record received quantities and conditions.
              </p>
            </div>

            <button
              type="button"
              onClick={fetchInbox}
              disabled={loading}
              data-testid="refresh-hub-handovers-btn"
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

          {/* Find by Handover Number Bar */}
          <form
            onSubmit={handleFindByNumber}
            className="flex flex-wrap items-center gap-2"
          >
            <div className="relative flex-1 min-w-[240px]">
              <input
                type="text"
                data-testid="hub-handover-search-input"
                value={searchNumber}
                onChange={(e) => setSearchNumber(e.target.value)}
                placeholder="Find by handover number (e.g. HND-...)..."
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-[#EAE3DC] font-mono text-xs"
              />
              <Search className="w-4 h-4 text-[#6B6058] absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
            <button
              type="submit"
              data-testid="hub-handover-find-btn"
              className="px-4 py-2 rounded-xl bg-[#FA661C] hover:bg-[#E0530B] text-white font-bold cursor-pointer"
            >
              Find Handover
            </button>
          </form>

          {error && (
            <div
              role="alert"
              data-testid="hub-handovers-error"
              className="p-4 rounded-2xl border border-[#FCA5A5] bg-[#FFF3F3] text-[#991B1B] font-bold flex items-center space-x-2"
            >
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {loading ? (
            <div className="py-10 text-center text-[#6B6058]">
              Loading expected handovers…
            </div>
          ) : filteredHandovers.length === 0 ? (
            <div
              data-testid="hub-handovers-empty"
              className="py-12 text-center border border-dashed border-[#EAE3DC] rounded-2xl space-y-2"
            >
              <Boxes className="w-8 h-8 text-[#FA661C] mx-auto opacity-80" />
              <p className="font-bold text-sm text-[#1A2420]">
                No expected handovers in inbox
              </p>
              <p className="text-[#6B6058]">
                Expected and in-transit seller handovers assigned to this hub will appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredHandovers.map((row) => {
                const isOverdue = isHandoverMarkedOverdueByServer(row);
                return (
                  <div
                    key={row.id}
                    data-testid={`hub-handover-card-${row.id}`}
                    className="p-4 rounded-2xl border border-[#EAE3DC] bg-[#FFF8F2]/50 space-y-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#EAE3DC] pb-2.5">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <span
                          data-testid={`hub-handover-number-${row.id}`}
                          className="font-mono font-extrabold text-sm text-[#FA661C]"
                        >
                          {row.handover_number}
                        </span>
                        <span
                          data-testid={`hub-handover-status-${row.id}`}
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${getHandoverStatusBadgeClass(
                            row.status
                          )}`}
                        >
                          {formatHandoverStatusLabel(row.status)}
                        </span>
                        {isOverdue && (
                          <span
                            data-testid={`hub-handover-overdue-${row.id}`}
                            className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-[#DC2626] text-white"
                          >
                            Overdue
                          </span>
                        )}
                        <span className="font-bold text-[#1A2420]">
                          Order {row.order_number} • Parcel #{row.vendor_order_id}
                        </span>
                        {(row.vendor_name || row.vendor_id) && (
                          <span className="text-[#6B6058]">
                            Seller: {row.vendor_name || `#${row.vendor_id}`}
                          </span>
                        )}
                        <span
                          data-testid={`hub-handover-deadline-${row.id}`}
                          className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-white border border-[#EAE3DC] font-mono text-[11px] text-[#6B6058]"
                        >
                          <Clock className="w-3 h-3 text-[#FA661C]" />
                          <span>Deadline: {row.deadline_at || '—'}</span>
                        </span>
                      </div>

                      <button
                        type="button"
                        data-testid={`open-hub-receive-btn-${row.id}`}
                        onClick={() => openHandoverForReceive(row)}
                        className="px-4 py-2 rounded-xl bg-[#FA661C] hover:bg-[#E0530B] text-white font-bold cursor-pointer"
                      >
                        Inspect &amp; Receive
                      </button>
                    </div>

                    <div className="overflow-x-auto bg-white rounded-xl border border-[#EAE3DC]">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="border-b border-[#EAE3DC] text-[#6B6058] uppercase text-[10px]">
                            <th className="py-2 px-3">Product</th>
                            <th className="py-2 px-3">SKU</th>
                            <th className="py-2 px-3 text-right">Expected Qty</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#EAE3DC]/60">
                          {(row.lines || []).map((line) => (
                            <tr key={line.id}>
                              <td className="py-2 px-3 font-bold text-[#1A2420]">
                                {line.product_name}
                              </td>
                              <td className="py-2 px-3 font-mono text-[#FA661C]">
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
                );
              })}
            </div>
          )}
        </>
      ) : (
        /* RECEIVE HANDOVER SCREEN */
        <div
          data-testid="hub-handover-receive-view"
          className="space-y-5"
        >
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#EAE3DC] pb-4">
            <div className="flex items-center space-x-3">
              <button
                type="button"
                data-testid="hub-receive-back-btn"
                onClick={() => setSelectedHandover(null)}
                className="p-2 rounded-xl border border-[#EAE3DC] hover:bg-[#FFF3EC] text-[#1A2420] cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-['Outfit'] font-extrabold text-lg text-[#1A2420]">
                    Receive Handover {selectedHandover.handover_number}
                  </h2>
                  <span
                    data-testid="hub-receive-status-badge"
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${getHandoverStatusBadgeClass(
                      selectedHandover.status
                    )}`}
                  >
                    {formatHandoverStatusLabel(selectedHandover.status)}
                  </span>
                </div>
                <p className="text-[11px] text-[#6B6058] mt-0.5">
                  Order {selectedHandover.order_number} • Parcel #
                  {selectedHandover.vendor_order_id} • Deadline:{' '}
                  <span className="font-mono font-bold">
                    {selectedHandover.deadline_at || '—'}
                  </span>
                </p>
              </div>
            </div>
          </div>

          {/* Clear explanation of what the server will do for Accept vs Reject */}
          <div
            data-testid="hub-receive-rules-notice"
            className="p-4 rounded-2xl border border-[#EAE3DC] bg-[#FFF8F2] space-y-1 text-xs text-[#1A2420]"
          >
            <div className="font-bold">How the server processes this receipt:</div>
            <ul className="list-disc pl-5 space-y-0.5 text-[#6B6058]">
              <li>
                <strong className="text-[#065F46]">Accept:</strong> Allowed only when every line has the full expected quantity in Good condition; creates the shipment and goes straight to the pick, pack, label, and ship screen.
              </li>
              <li>
                <strong className="text-[#991B1B]">Reject:</strong> Requires a reason; cancels the seller parcel, creates a customer refund request, and holds the goods for return to the seller.
              </li>
            </ul>
          </div>

          {receiveGeneralError && (
            <div
              role="alert"
              data-testid="hub-receive-general-error"
              className="p-3.5 rounded-2xl border border-[#FCA5A5] bg-[#FFF3F3] text-[#991B1B] font-bold flex items-center space-x-2"
            >
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{receiveGeneralError}</span>
            </div>
          )}

          {receiveFieldErrors.lines && (
            <div
              role="alert"
              data-testid="hub-receive-error-lines"
              className="p-3.5 rounded-2xl border border-[#FCA5A5] bg-[#FFF3F3] text-[#991B1B] font-bold"
            >
              {receiveFieldErrors.lines}
            </div>
          )}

          {receiveResult && (
            <div
              data-testid="hub-receive-result-banner"
              role="status"
              className={`p-4 rounded-2xl border font-bold flex flex-wrap items-center justify-between gap-3 ${
                receiveResult.shipment_id
                  ? 'bg-[#ECFDF5] border-[#6EE7B7] text-[#065F46]'
                  : 'bg-[#FFF3F3] border-[#FCA5A5] text-[#991B1B]'
              }`}
            >
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>
                  {receiveResult.shipment_id
                    ? `Handover accepted. Shipment #${receiveResult.shipment_id} created and ready for packing.`
                    : `Handover rejected. Parcel #${selectedHandover.vendor_order_id} has been cancelled and customer refund requested.`}
                </span>
              </div>
              {receiveResult.shipment_id && onOpenShipment && (
                <button
                  type="button"
                  data-testid="hub-receive-open-shipment-btn"
                  onClick={() => onOpenShipment(receiveResult.shipment_id)}
                  className="px-4 py-1.5 rounded-xl bg-[#059669] text-white font-bold cursor-pointer"
                >
                  Go to Shipment #{receiveResult.shipment_id}
                </button>
              )}
            </div>
          )}

          {/* Per-Line Inspection Inputs */}
          <div className="overflow-x-auto rounded-2xl border border-[#EAE3DC]">
            <table
              data-testid="hub-receive-lines-table"
              className="w-full text-left border-collapse text-xs"
            >
              <thead>
                <tr className="bg-[#FFF3EC]/60 border-b border-[#EAE3DC] text-[#6B6058] uppercase text-[10px]">
                  <th className="py-2.5 px-3">Product &amp; SKU</th>
                  <th className="py-2.5 px-3 text-right">Expected Qty</th>
                  <th className="py-2.5 px-3 text-right">Received Qty *</th>
                  <th className="py-2.5 px-3">Condition *</th>
                  <th className="py-2.5 px-3">Line Note</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EAE3DC]">
                {(selectedHandover.lines || []).map((line) => {
                  const inp = lineInputs[line.id] || {
                    received_quantity: '',
                    condition: 'good',
                    note: '',
                  };
                  return (
                    <tr
                      key={line.id}
                      data-testid={`hub-receive-line-row-${line.id}`}
                    >
                      <td className="py-3 px-3">
                        <div className="font-bold text-[#1A2420]">
                          {line.product_name}
                        </div>
                        <div className="font-mono text-[11px] text-[#FA661C]">
                          {line.sku} • Line #{line.id}
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
                          data-testid={`hub-receive-qty-input-${line.id}`}
                          aria-label={`Received quantity for ${line.sku}`}
                          value={inp.received_quantity}
                          onChange={(e) =>
                            setLineInputs((prev) => ({
                              ...prev,
                              [line.id]: {
                                ...prev[line.id],
                                received_quantity: e.target.value,
                              },
                            }))
                          }
                          className="w-24 px-2.5 py-1.5 rounded-xl border border-[#EAE3DC] font-mono text-right"
                        />
                      </td>
                      <td className="py-3 px-3">
                        <select
                          data-testid={`hub-receive-condition-select-${line.id}`}
                          aria-label={`Condition for ${line.sku}`}
                          value={inp.condition}
                          onChange={(e) =>
                            setLineInputs((prev) => ({
                              ...prev,
                              [line.id]: {
                                ...prev[line.id],
                                condition: e.target.value,
                              },
                            }))
                          }
                          className="px-2.5 py-1.5 rounded-xl border border-[#EAE3DC] bg-white font-bold"
                        >
                          {HANDOVER_LINE_CONDITIONS.map((c) => (
                            <option key={c.value} value={c.value}>
                              {c.label}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="py-3 px-3">
                        <input
                          type="text"
                          data-testid={`hub-receive-note-input-${line.id}`}
                          aria-label={`Note for ${line.sku}`}
                          value={inp.note}
                          onChange={(e) =>
                            setLineInputs((prev) => ({
                              ...prev,
                              [line.id]: {
                                ...prev[line.id],
                                note: e.target.value,
                              },
                            }))
                          }
                          placeholder="Optional note"
                          className="w-full px-2.5 py-1.5 rounded-xl border border-[#EAE3DC]"
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Action Buttons: Accept or Reject */}
          <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
            <button
              type="button"
              data-testid="hub-open-reject-dialog-btn"
              disabled={receiveSubmitting}
              onClick={() => {
                setReceiveFieldErrors({});
                setReceiveGeneralError('');
                setRejectConfirmOpen(true);
              }}
              className="px-5 py-2.5 rounded-xl bg-white hover:bg-[#FFF3F3] text-[#DC2626] border border-[#FCA5A5] font-bold cursor-pointer disabled:opacity-50"
            >
              Reject Handover
            </button>

            <button
              type="button"
              data-testid="hub-accept-handover-btn"
              disabled={receiveSubmitting}
              onClick={handleSubmitAccept}
              className="px-5 py-2.5 rounded-xl bg-[#059669] hover:bg-[#047857] text-white font-bold cursor-pointer disabled:opacity-50"
            >
              {receiveSubmitting
                ? 'Submitting…'
                : 'Accept Handover & Proceed to Pack'}
            </button>
          </div>
        </div>
      )}

      {/* NATIVE <dialog>: REJECT HANDOVER CONFIRMATION */}
      {rejectConfirmOpen && selectedHandover && (
        <dialog
          open
          data-testid="hub-reject-handover-dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-[#1A1A1A]/60 backdrop-blur-2xs flex items-center justify-center p-4 w-full h-full m-0 border-0"
        >
          <div className="bg-white rounded-3xl border border-[#EAE3DC] shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#EAE3DC] pb-3">
              <h3 className="font-['Outfit'] font-extrabold text-lg text-[#1A2420]">
                Reject Handover {selectedHandover.handover_number}
              </h3>
              <button
                type="button"
                onClick={() => setRejectConfirmOpen(false)}
                className="p-1 text-[#6B6058] hover:text-[#1A2420] cursor-pointer"
                aria-label="Close reject handover dialog"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div
              data-testid="hub-reject-handover-warning"
              className="p-3.5 rounded-xl bg-[#FFFBEB] border border-[#F59E0B] text-xs font-bold text-[#92400E]"
            >
              Rejecting this handover cancels the seller parcel and refunds the customer. The goods will be held for return to the seller.
            </div>

            {receiveGeneralError && (
              <div
                role="alert"
                data-testid="hub-reject-dialog-general-error"
                className="p-3 rounded-xl bg-[#FFF3F3] border border-[#FCA5A5] text-xs font-bold text-[#991B1B]"
              >
                {receiveGeneralError}
              </div>
            )}

            <form
              onSubmit={handleConfirmRejectSubmit}
              noValidate
              className="space-y-3"
            >
              <div>
                <label
                  htmlFor="hub-reject-reason"
                  className="block font-bold text-[#1A2420] mb-1"
                >
                  Rejection Reason *
                </label>
                <textarea
                  id="hub-reject-reason"
                  rows={2}
                  data-testid="hub-reject-reason-input"
                  value={rejectReason}
                  onChange={(e) => {
                    setRejectReason(e.target.value);
                    setReceiveFieldErrors((fe) => ({ ...fe, reason: '' }));
                  }}
                  placeholder="Describe the discrepancy or damage found..."
                  className="w-full px-3 py-2 rounded-xl border border-[#EAE3DC]"
                />
                {receiveFieldErrors.reason && (
                  <p
                    data-testid="hub-reject-error-reason"
                    className="mt-1 text-[11px] font-semibold text-[#DC2626]"
                  >
                    {receiveFieldErrors.reason}
                  </p>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRejectConfirmOpen(false)}
                  className="px-4 py-2 rounded-xl border border-[#EAE3DC] font-bold text-[#6B6058] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  data-testid="hub-confirm-reject-submit-btn"
                  disabled={receiveSubmitting}
                  className="px-4 py-2 rounded-xl bg-[#DC2626] hover:bg-[#B91C1C] text-white font-bold cursor-pointer disabled:opacity-50"
                >
                  {receiveSubmitting ? 'Rejecting…' : 'Confirm Reject Handover'}
                </button>
              </div>
            </form>
          </div>
        </dialog>
      )}
    </section>
  );
}

