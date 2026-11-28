import React, { useState, useEffect, useCallback } from 'react';
import {
  Truck,
  Printer,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  RefreshCw,
  ArrowLeft,
  MapPin,
  Clock,
  Boxes,
  X,
} from 'lucide-react';
import { apiRequest } from '../../utils/api';
import {
  formatHandoverStatusLabel,
  getHandoverStatusBadgeClass,
  isHandoverMarkedOverdueByServer,
  parseWarehouseApiError,
} from '../../utils/warehouseUtils';

export default function SellerHandoversSection({
  onFeatureDisabled,
  onUnauthorized,
}) {
  const [featureDisabled, setFeatureDisabled] = useState(false);
  const [handovers, setHandovers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionBanner, setActionBanner] = useState('');

  // Active handover detail view
  const [selectedHandover, setSelectedHandover] = useState(null);

  // Printable handover slip state (`GET /api/warehouse/handovers/<pk>/slip/`)
  const [slipHtml, setSlipHtml] = useState('');
  const [slipLoading, setSlipLoading] = useState(false);
  const [slipError, setSlipError] = useState('');

  // "Mark as sent" form & confirmation <dialog> state (`POST /api/warehouse/handovers/<pk>/send/`)
  const [sendForm, setSendForm] = useState({
    courier_name: '',
    tracking_number: '',
  });
  const [sendFieldErrors, setSendFieldErrors] = useState({});
  const [sendGeneralError, setSendGeneralError] = useState('');
  const [sendConfirmOpen, setSendConfirmOpen] = useState(false);
  const [sendSubmitting, setSendSubmitting] = useState(false);

  const fetchHandovers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await apiRequest('/api/warehouse/handovers/');
      const rows = Array.isArray(data) ? data : data?.results || [];
      setHandovers(rows);
      setFeatureDisabled(false);
      setSelectedHandover((prev) => {
        if (!prev) return null;
        return rows.find((r) => r.id === prev.id) || prev;
      });
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
          'Failed to load seller handovers.'
      );
    } finally {
      setLoading(false);
    }
  }, [onFeatureDisabled, onUnauthorized]);

  useEffect(() => {
    fetchHandovers();
  }, [fetchHandovers]);

  if (featureDisabled) {
    return null;
  }

  const openHandoverDetail = (row) => {
    setSelectedHandover(row);
    setSlipHtml('');
    setSlipError('');
    setActionBanner('');
    setSendForm({
      courier_name: row.courier_name || '',
      tracking_number: row.tracking_number || '',
    });
    setSendFieldErrors({});
    setSendGeneralError('');
    setSendConfirmOpen(false);
  };

  const closeHandoverDetail = () => {
    setSelectedHandover(null);
    setSlipHtml('');
    setSlipError('');
    setSendConfirmOpen(false);
  };

  const formatHubAddress = (hub) => {
    if (!hub || typeof hub !== 'object') return '';
    return [
      hub.address_line1,
      hub.address_line2,
      hub.city,
      hub.state,
      hub.postal_code,
      hub.country,
    ]
      .filter((p) => p && String(p).trim())
      .join(', ');
  };

  // Fetch printable handover slip with user's auth token (`GET /api/warehouse/handovers/<pk>/slip/`)
  const handlePrintSlip = async () => {
    if (!selectedHandover || slipLoading) return;
    setSlipLoading(true);
    setSlipError('');
    try {
      const res = await apiRequest(
        `/api/warehouse/handovers/${selectedHandover.id}/slip/`
      );
      const htmlString =
        typeof res === 'string'
          ? res
          : typeof res?.message === 'string'
          ? res.message
          : '';
      setSlipHtml(htmlString);

      if (typeof window !== 'undefined' && typeof window.open === 'function') {
        try {
          const printWin = window.open('', '_blank');
          if (printWin && printWin.document) {
            printWin.document.open();
            printWin.document.write(htmlString);
            printWin.document.close();
            if (typeof printWin.print === 'function') {
              printWin.print();
            }
          }
        } catch {
          // Fallback to inline isolated iframe preview
        }
      }
    } catch (err) {
      const parsed = parseWarehouseApiError(err);
      setSlipError(
        parsed.generalError ||
          err?.data?.detail ||
          'Failed to fetch handover slip.'
      );
    } finally {
      setSlipLoading(false);
    }
  };

  const handleOpenSendConfirm = (e) => {
    e.preventDefault();
    if (!selectedHandover || sendSubmitting) return;
    setSendFieldErrors({});
    setSendGeneralError('');
    setSendConfirmOpen(true);
  };

  const handleConfirmSend = async () => {
    if (!selectedHandover || sendSubmitting) return;
    setSendFieldErrors({});
    setSendGeneralError('');
    setActionBanner('');
    setSendSubmitting(true);

    try {
      const updated = await apiRequest(
        `/api/warehouse/handovers/${selectedHandover.id}/send/`,
        {
          method: 'POST',
          body: JSON.stringify({
            courier_name: sendForm.courier_name,
            tracking_number: sendForm.tracking_number,
          }),
        }
      );
      setSendConfirmOpen(false);
      setSelectedHandover(updated);
      setSendForm({
        courier_name: updated.courier_name || sendForm.courier_name,
        tracking_number: updated.tracking_number || sendForm.tracking_number,
      });
      setHandovers((prev) =>
        prev.map((h) => (h.id === updated.id ? updated : h))
      );
      setActionBanner(
        `Handover ${updated.handover_number} marked as sent via ${updated.courier_name} (${updated.tracking_number}).`
      );
    } catch (err) {
      const parsed = parseWarehouseApiError(err, [
        'courier_name',
        'tracking_number',
      ]);
      setSendFieldErrors(parsed.fieldErrors);
      setSendGeneralError(parsed.generalError);
      if (Object.keys(parsed.fieldErrors).length > 0) {
        setSendConfirmOpen(false);
      }
    } finally {
      setSendSubmitting(false);
    }
  };

  return (
    <div
      data-testid="seller-handovers-section"
      className="bg-white rounded-3xl border border-[#EAE3DC] p-5 sm:p-6 shadow-xs space-y-5 text-xs"
    >
      {actionBanner && (
        <div
          data-testid="seller-handover-action-banner"
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

      {!selectedHandover ? (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#EAE3DC] pb-4">
            <div>
              <div className="flex items-center space-x-2">
                <Truck className="w-4 h-4 text-[#FA661C]" />
                <span className="text-[11px] font-black uppercase tracking-wider text-[#FA661C]">
                  Platform Hub Fulfilment
                </span>
              </div>
              <h2 className="font-['Outfit'] font-extrabold text-lg text-[#1A2420] mt-0.5">
                Handovers to Platform Hub
              </h2>
              <p className="text-xs text-[#6B6058]">
                Paid seller-stock orders to be dispatched to your assigned platform hub.
              </p>
            </div>

            <button
              type="button"
              onClick={fetchHandovers}
              disabled={loading}
              data-testid="refresh-seller-handovers-btn"
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

          {error && (
            <div
              role="alert"
              data-testid="seller-handovers-error"
              className="p-4 rounded-2xl border border-[#FCA5A5] bg-[#FFF3F3] text-[#991B1B] font-bold flex items-center space-x-2"
            >
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {loading ? (
            <div className="py-10 text-center text-[#6B6058]">
              Loading handovers…
            </div>
          ) : handovers.length === 0 ? (
            <div
              data-testid="seller-handovers-empty"
              className="py-12 text-center border border-dashed border-[#EAE3DC] rounded-2xl space-y-2"
            >
              <Boxes className="w-8 h-8 text-[#FA661C] mx-auto opacity-80" />
              <p className="font-bold text-sm text-[#1A2420]">
                No handovers waiting
              </p>
              <p className="text-[#6B6058]">
                Paid orders fulfilled from your own stock will appear here for hub handover.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {handovers.map((row) => {
                const isOverdue = isHandoverMarkedOverdueByServer(row);
                const hubAddr = formatHubAddress(row.hub);

                return (
                  <div
                    key={row.id}
                    data-testid={`seller-handover-card-${row.id}`}
                    className="p-4 rounded-2xl border border-[#EAE3DC] bg-[#FFF8F2]/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          data-testid={`seller-handover-number-${row.id}`}
                          className="font-mono font-extrabold text-sm text-[#FA661C]"
                        >
                          {row.handover_number}
                        </span>
                        <span
                          data-testid={`seller-handover-status-${row.id}`}
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${getHandoverStatusBadgeClass(
                            row.status
                          )}`}
                        >
                          {formatHandoverStatusLabel(row.status)}
                        </span>
                        {isOverdue && (
                          <span
                            data-testid={`seller-handover-overdue-${row.id}`}
                            className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-[#DC2626] text-white"
                          >
                            Overdue
                          </span>
                        )}
                        <span className="font-mono font-bold text-[#1A2420]">
                          Order {row.order_number} (Parcel #{row.vendor_order_id})
                        </span>
                      </div>

                      {row.hub ? (
                        <div
                          data-testid={`seller-handover-hub-${row.id}`}
                          className="text-[#1A2420] flex items-start space-x-1.5"
                        >
                          <MapPin className="w-3.5 h-3.5 text-[#FA661C] shrink-0 mt-0.5" />
                          <span>
                            <strong>{row.hub.name}</strong>
                            {hubAddr ? ` — ${hubAddr}` : ''}
                          </span>
                        </div>
                      ) : (
                        <div
                          data-testid={`seller-handover-no-hub-${row.id}`}
                          className="text-[#991B1B] font-bold flex items-center space-x-1.5"
                        >
                          <AlertTriangle className="w-3.5 h-3.5 text-[#DC2626] shrink-0" />
                          <span>
                            {row.no_hub_message ||
                              row.reason ||
                              'No hub is assigned. Contact support to assign a hub.'}
                          </span>
                        </div>
                      )}

                      <div className="text-[11px] text-[#6B6058] flex flex-wrap items-center gap-3">
                        <span
                          data-testid={`seller-handover-deadline-${row.id}`}
                          className="inline-flex items-center space-x-1 font-mono"
                        >
                          <Clock className="w-3 h-3 text-[#FA661C]" />
                          <span>Deadline: {row.deadline_at || '—'}</span>
                        </span>
                        {row.courier_name && (
                          <span>
                            Courier: <strong>{row.courier_name}</strong>
                          </span>
                        )}
                        {row.tracking_number && (
                          <span className="font-mono">
                            Tracking: <strong>{row.tracking_number}</strong>
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="shrink-0">
                      <button
                        type="button"
                        data-testid={`open-seller-handover-btn-${row.id}`}
                        onClick={() => openHandoverDetail(row)}
                        className="px-4 py-2 rounded-xl bg-[#FA661C] hover:bg-[#E0530B] text-white font-bold cursor-pointer"
                      >
                        View Handover
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      ) : (
        /* HANDOVER DETAIL VIEW */
        <div
          data-testid="seller-handover-detail"
          className="space-y-5"
        >
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#EAE3DC] pb-4">
            <div className="flex items-center space-x-3">
              <button
                type="button"
                data-testid="back-to-handovers-list-btn"
                onClick={closeHandoverDetail}
                className="p-2 rounded-xl border border-[#EAE3DC] hover:bg-[#FFF3EC] text-[#1A2420] cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-['Outfit'] font-extrabold text-lg text-[#1A2420]">
                    Handover {selectedHandover.handover_number}
                  </h2>
                  <span
                    data-testid="detail-handover-status"
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${getHandoverStatusBadgeClass(
                      selectedHandover.status
                    )}`}
                  >
                    {formatHandoverStatusLabel(selectedHandover.status)}
                  </span>
                  {isHandoverMarkedOverdueByServer(selectedHandover) && (
                    <span
                      data-testid="detail-handover-overdue"
                      className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-[#DC2626] text-white"
                    >
                      Overdue
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-[#6B6058] mt-0.5">
                  Order {selectedHandover.order_number} • Parcel #
                  {selectedHandover.vendor_order_id} • Deadline:{' '}
                  <span
                    data-testid="detail-handover-deadline"
                    className="font-mono font-bold"
                  >
                    {selectedHandover.deadline_at || '—'}
                  </span>
                </p>
              </div>
            </div>

            {selectedHandover.hub && (
              <button
                type="button"
                data-testid="print-handover-slip-btn"
                disabled={slipLoading}
                onClick={handlePrintSlip}
                className="px-4 py-2 rounded-xl bg-[#1A2420] hover:bg-[#334139] text-white font-bold flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
              >
                <Printer className="w-3.5 h-3.5 text-[#FF811A]" />
                <span>
                  {slipLoading ? 'Loading slip…' : 'Print handover slip'}
                </span>
              </button>
            )}
          </div>

          {slipError && (
            <div
              role="alert"
              data-testid="handover-slip-error"
              className="p-3.5 rounded-2xl border border-[#FCA5A5] bg-[#FFF3F3] text-[#991B1B] font-bold"
            >
              {slipError}
            </div>
          )}

          {/* If the seller has no hub assigned, show the server's message and nothing else actionable */}
          {!selectedHandover.hub ? (
            <div
              role="alert"
              data-testid="seller-handover-no-hub-banner"
              className="p-5 rounded-2xl border-2 border-[#DC2626] bg-[#FFF3F3] text-[#991B1B] space-y-1.5"
            >
              <div className="flex items-center space-x-2 font-extrabold text-sm">
                <AlertTriangle className="w-5 h-5 text-[#DC2626] shrink-0" />
                <span>No Hub Assigned</span>
              </div>
              <p className="font-semibold">
                {selectedHandover.no_hub_message ||
                  selectedHandover.reason ||
                  'No hub is assigned. Contact support to assign a hub.'}
              </p>
            </div>
          ) : (
            <>
              {/* Assigned Hub Address Card */}
              <div
                data-testid="detail-handover-hub-card"
                className="p-4 rounded-2xl border border-[#EAE3DC] bg-[#FFF8F2] space-y-1"
              >
                <span className="text-[10px] font-black uppercase tracking-wider text-[#FA661C]">
                  Destination Platform Hub
                </span>
                <div className="font-bold text-sm text-[#1A2420]">
                  {selectedHandover.hub.name}
                </div>
                <div className="text-[#6B6058]">
                  {formatHubAddress(selectedHandover.hub)}
                </div>
              </div>

              {/* Isolated Handover Slip Print Frame */}
              {slipHtml && (
                <div
                  data-testid="handover-slip-print-view"
                  className="p-4 rounded-2xl border-2 border-[#1A2420] bg-white space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-sm text-[#1A2420]">
                      Handover Slip Print View ({selectedHandover.handover_number})
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        data-testid="trigger-slip-iframe-print-btn"
                        onClick={() => {
                          const frame = document.getElementById(
                            'handover-slip-iframe'
                          );
                          if (
                            frame &&
                            frame.contentWindow &&
                            typeof frame.contentWindow.print === 'function'
                          ) {
                            frame.contentWindow.print();
                          }
                        }}
                        className="px-3 py-1.5 rounded-xl bg-[#FA661C] text-white font-bold cursor-pointer"
                      >
                        Print Now
                      </button>
                      <button
                        type="button"
                        onClick={() => setSlipHtml('')}
                        className="px-3 py-1.5 rounded-xl border border-[#EAE3DC] text-[#6B6058] font-bold cursor-pointer"
                      >
                        Close Slip
                      </button>
                    </div>
                  </div>
                  <iframe
                    id="handover-slip-iframe"
                    data-testid="handover-slip-iframe"
                    title="Seller Handover Slip"
                    srcDoc={slipHtml}
                    className="w-full h-96 rounded-xl border border-[#EAE3DC]"
                  />
                </div>
              )}

              {/* Handover Lines Table */}
              <div className="overflow-x-auto rounded-2xl border border-[#EAE3DC]">
                <table
                  data-testid="handover-lines-table"
                  className="w-full text-left border-collapse text-xs"
                >
                  <thead>
                    <tr className="bg-[#FFF3EC]/60 border-b border-[#EAE3DC] text-[#6B6058] uppercase text-[10px]">
                      <th className="py-2.5 px-3">Product</th>
                      <th className="py-2.5 px-3">SKU</th>
                      <th className="py-2.5 px-3 text-right">Expected Qty</th>
                      <th className="py-2.5 px-3 text-right">Received Qty</th>
                      <th className="py-2.5 px-3">Hub Condition &amp; Note</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EAE3DC]">
                    {(selectedHandover.lines || []).map((line) => (
                      <tr
                        key={line.id}
                        data-testid={`handover-line-row-${line.id}`}
                      >
                        <td className="py-2.5 px-3 font-bold text-[#1A2420]">
                          {line.product_name}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-[#FA661C]">
                          {line.sku}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold">
                          {line.expected_quantity}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono">
                          {line.received_quantity ?? '—'}
                        </td>
                        <td className="py-2.5 px-3">
                          {line.condition ? (
                            <span className="font-bold uppercase">
                              {line.condition}
                              {line.note ? ` — ${line.note}` : ''}
                            </span>
                          ) : (
                            '—'
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mark as sent form (shown when awaiting_dispatch or in_transit for idempotent replay) */}
              {(selectedHandover.status === 'awaiting_dispatch' ||
                selectedHandover.status === 'in_transit') && (
                <form
                  onSubmit={handleOpenSendConfirm}
                  data-testid="handover-mark-sent-form"
                  className="p-5 rounded-2xl border border-[#EAE3DC] bg-[#FFF8F2]/60 space-y-4"
                  noValidate
                >
                  <div className="border-b border-[#EAE3DC] pb-2.5">
                    <h3 className="font-['Outfit'] font-extrabold text-base text-[#1A2420]">
                      Mark as sent to Hub
                    </h3>
                    <p className="text-[11px] text-[#6B6058]">
                      Enter the courier name and tracking number used to dispatch this parcel to the hub.
                    </p>
                  </div>

                  {sendGeneralError && (
                    <div
                      role="alert"
                      data-testid="handover-send-general-error"
                      className="p-3 rounded-xl border border-[#FCA5A5] bg-[#FFF3F3] text-[#991B1B] font-bold"
                    >
                      {sendGeneralError}
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label
                        htmlFor="handover-courier-input"
                        className="block font-bold text-[#1A2420] mb-1"
                      >
                        Courier Name *
                      </label>
                      <input
                        id="handover-courier-input"
                        type="text"
                        data-testid="handover-courier-input"
                        value={sendForm.courier_name}
                        onChange={(e) => {
                          setSendForm((s) => ({
                            ...s,
                            courier_name: e.target.value,
                          }));
                          setSendFieldErrors((fe) => ({
                            ...fe,
                            courier_name: '',
                          }));
                        }}
                        placeholder="e.g. Delhivery"
                        className="w-full px-3 py-2 rounded-xl border border-[#EAE3DC] bg-white"
                      />
                      {sendFieldErrors.courier_name && (
                        <p
                          data-testid="handover-error-courier_name"
                          className="mt-1 text-[11px] font-semibold text-[#DC2626]"
                        >
                          {sendFieldErrors.courier_name}
                        </p>
                      )}
                    </div>

                    <div>
                      <label
                        htmlFor="handover-tracking-input"
                        className="block font-bold text-[#1A2420] mb-1"
                      >
                        Tracking Number *
                      </label>
                      <input
                        id="handover-tracking-input"
                        type="text"
                        data-testid="handover-tracking-input"
                        value={sendForm.tracking_number}
                        onChange={(e) => {
                          setSendForm((s) => ({
                            ...s,
                            tracking_number: e.target.value,
                          }));
                          setSendFieldErrors((fe) => ({
                            ...fe,
                            tracking_number: '',
                          }));
                        }}
                        placeholder="e.g. DLV-998877"
                        className="w-full px-3 py-2 rounded-xl border border-[#EAE3DC] bg-white font-mono"
                      />
                      {sendFieldErrors.tracking_number && (
                        <p
                          data-testid="handover-error-tracking_number"
                          className="mt-1 text-[11px] font-semibold text-[#DC2626]"
                        >
                          {sendFieldErrors.tracking_number}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      data-testid="open-handover-send-dialog-btn"
                      disabled={sendSubmitting}
                      className="px-5 py-2.5 rounded-xl bg-[#FA661C] hover:bg-[#E0530B] text-white font-bold cursor-pointer disabled:opacity-50"
                    >
                      Mark as sent
                    </button>
                  </div>
                </form>
              )}
            </>
          )}
        </div>
      )}

      {/* NATIVE <dialog>: CONFIRM MARK HANDOVER AS SENT */}
      {sendConfirmOpen && selectedHandover && (
        <dialog
          open
          data-testid="handover-send-confirm-dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-[#1A1A1A]/60 backdrop-blur-2xs flex items-center justify-center p-4 w-full h-full m-0 border-0"
        >
          <div className="bg-white rounded-3xl border border-[#EAE3DC] shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#EAE3DC] pb-3">
              <h3 className="font-['Outfit'] font-extrabold text-lg text-[#1A2420]">
                Confirm Handover Dispatch
              </h3>
              <button
                type="button"
                onClick={() => setSendConfirmOpen(false)}
                className="p-1 text-[#6B6058] hover:text-[#1A2420] cursor-pointer"
                aria-label="Close handover send dialog"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-[#6B6058]">
              Confirm that you have dispatched handover{' '}
              <strong className="font-mono text-[#1A2420]">
                {selectedHandover.handover_number}
              </strong>{' '}
              to <strong>{selectedHandover.hub?.name}</strong>.
            </p>

            <div className="text-xs space-y-1 text-[#1A2420]">
              <div>
                Courier: <strong>{sendForm.courier_name || '—'}</strong>
              </div>
              <div>
                Tracking Number:{' '}
                <strong className="font-mono">
                  {sendForm.tracking_number || '—'}
                </strong>
              </div>
            </div>

            {sendGeneralError && (
              <div
                role="alert"
                data-testid="handover-send-dialog-error"
                className="p-3 rounded-xl bg-[#FFF3F3] border border-[#FCA5A5] text-xs text-[#991B1B] font-bold"
              >
                {sendGeneralError}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSendConfirmOpen(false)}
                className="px-4 py-2 rounded-xl border border-[#EAE3DC] font-bold text-[#6B6058] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                data-testid="confirm-handover-send-submit-btn"
                disabled={sendSubmitting}
                onClick={handleConfirmSend}
                className="px-4 py-2 rounded-xl bg-[#FA661C] hover:bg-[#E0530B] text-white font-bold cursor-pointer disabled:opacity-50"
              >
                {sendSubmitting ? 'Sending…' : 'Confirm Mark as Sent'}
              </button>
            </div>
          </div>
        </dialog>
      )}
    </div>
  );
}

