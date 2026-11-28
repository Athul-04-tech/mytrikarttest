import React, { useState, useEffect, useCallback } from 'react';
import {
  Truck,
  Scale,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Lock,
  ShieldAlert,
  X,
} from 'lucide-react';
import { apiRequest } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import {
  SHIPMENT_STATUSES,
  SHIPMENT_EVENT_LABELS,
  RETURN_INSPECTION_RESULTS,
  formatShipmentStatusLabel,
  getShipmentStatusBadgeClass,
  formatHandoverStatusLabel,
  getHandoverStatusBadgeClass,
  formatReturnInspectionLabel,
  formatReturnDestinationLabel,
  getReturnDestinationBadgeClass,
  formatRefundBreakdownLabel,
  formatDateTime,
  parseWarehouseApiError,
} from '../../utils/warehouseUtils';

export function AdminShipmentsSection({ warehouses = [] }) {
  const [featureDisabled, setFeatureDisabled] = useState(false);
  const [shipments, setShipments] = useState([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1);
  const [nextUrl, setNextUrl] = useState(null);
  const [prevUrl, setPrevUrl] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [warehouseFilter, setWarehouseFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionBanner, setActionBanner] = useState('');

  // Phase C: Admin Resolve Short Pick state (`POST /api/admin/warehouse/shipments/<pk>/resolve-short-pick/`)
  const [resolvingShipment, setResolvingShipment] = useState(null);
  const [resolveWriteoffs, setResolveWriteoffs] = useState({}); // { [`${lineId}-${lotId}`]: qtyStr }
  const [resolveReason, setResolveReason] = useState('');
  const [resolveFieldErrors, setResolveFieldErrors] = useState({});
  const [resolveGeneralError, setResolveGeneralError] = useState('');
  const [resolveConfirmOpen, setResolveConfirmOpen] = useState(false);
  const [resolveSubmitting, setResolveSubmitting] = useState(false);

  // Phase C: Admin Cancel a Parcel state (`POST /api/orders/admin/vendor-orders/<pk>/cancel/`)
  const [cancelParcelOpen, setCancelParcelOpen] = useState(null); // { vendorOrderId, orderNumber }
  const [cancelParcelReason, setCancelParcelReason] = useState('');
  const [cancelParcelFieldErrors, setCancelParcelFieldErrors] = useState({});
  const [cancelParcelGeneralError, setCancelParcelGeneralError] = useState('');
  const [cancelParcelSubmitting, setCancelParcelSubmitting] = useState(false);
  const [cancelParcelResult, setCancelParcelResult] = useState(null);

  const openShortPickResolution = (shp) => {
    setResolvingShipment(shp);
    const initialMap = {};
    (shp.lines || []).forEach((line) => {
      const lots = Array.isArray(line.lot_reservations)
        ? line.lot_reservations
        : [];
      lots.forEach((lr) => {
        initialMap[`${line.id}-${lr.lot_id}`] = '';
      });
    });
    setResolveWriteoffs(initialMap);
    setResolveReason('');
    setResolveFieldErrors({});
    setResolveGeneralError('');
    setResolveConfirmOpen(false);
  };

  const handleOpenResolveConfirm = (e) => {
    e.preventDefault();
    if (!resolvingShipment || resolveSubmitting) return;
    setResolveFieldErrors({});
    setResolveGeneralError('');
    setResolveConfirmOpen(true);
  };

  const handleConfirmResolveShortPick = async () => {
    if (!resolvingShipment || resolveSubmitting) return;
    setResolveFieldErrors({});
    setResolveGeneralError('');
    setActionBanner('');
    setResolveSubmitting(true);

    const writeoffsList = [];
    (resolvingShipment.lines || []).forEach((line) => {
      const lots = Array.isArray(line.lot_reservations)
        ? line.lot_reservations
        : [];
      lots.forEach((lr) => {
        const raw = resolveWriteoffs[`${line.id}-${lr.lot_id}`];
        if (raw !== undefined && String(raw).trim() !== '') {
          const qtyNum = Number(raw);
          if (!Number.isNaN(qtyNum) && qtyNum > 0) {
            writeoffsList.push({
              shipment_line_id: Number(line.id),
              lot_id: Number(lr.lot_id),
              quantity: qtyNum,
            });
          }
        }
      });
    });

    try {
      const res = await apiRequest(
        `/api/admin/warehouse/shipments/${resolvingShipment.id}/resolve-short-pick/`,
        {
          method: 'POST',
          body: JSON.stringify({
            reason: resolveReason,
            writeoffs: writeoffsList,
          }),
        }
      );
      setResolveConfirmOpen(false);
      setResolvingShipment(null);
      setActionBanner(
        `Resolved short-pick on Shipment #${res.shipment_id} (Parcel #${res.vendor_order_id}). Refund request #${res.refund_request_id} created for ${res.currency} ${res.refund_amount}.`
      );
      await fetchAdminShipments(page, statusFilter, warehouseFilter);
    } catch (err) {
      const parsed = parseWarehouseApiError(err, ['reason', 'writeoffs']);
      setResolveFieldErrors(parsed.fieldErrors);
      setResolveGeneralError(parsed.generalError);
      if (Object.keys(parsed.fieldErrors).length > 0) {
        setResolveConfirmOpen(false);
      }
    } finally {
      setResolveSubmitting(false);
    }
  };

  const openAdminCancelParcelDialog = (vendorOrderId, orderNumber = '') => {
    if (cancelParcelSubmitting) return;
    setCancelParcelOpen({ vendorOrderId, orderNumber });
    setCancelParcelReason('');
    setCancelParcelFieldErrors({});
    setCancelParcelGeneralError('');
  };

  const handleConfirmAdminCancelParcel = async (e) => {
    e.preventDefault();
    if (!cancelParcelOpen || cancelParcelSubmitting) return;
    setCancelParcelFieldErrors({});
    setCancelParcelGeneralError('');
    setCancelParcelSubmitting(true);

    try {
      const res = await apiRequest(
        `/api/orders/admin/vendor-orders/${cancelParcelOpen.vendorOrderId}/cancel/`,
        {
          method: 'POST',
          body: JSON.stringify({ reason: cancelParcelReason }),
        }
      );
      setCancelParcelResult(res);
      setCancelParcelOpen(null);
      setActionBanner(
        `Cancelled Parcel #${res.vendor_order_id}. Refund request #${res.refund_request?.id} created for ${res.refund_request?.currency} ${res.refund_request?.amount}.`
      );
      await fetchAdminShipments(page, statusFilter, warehouseFilter);
    } catch (err) {
      const parsed = parseWarehouseApiError(err, ['reason', 'writeoffs']);
      setCancelParcelFieldErrors(parsed.fieldErrors);
      if (Object.keys(parsed.fieldErrors).length === 0 || err?.status === 409) {
        setCancelParcelGeneralError(parsed.generalError);
      }
    } finally {
      setCancelParcelSubmitting(false);
    }
  };

  const fetchAdminShipments = useCallback(
    async (
      requestedPage = page,
      stFilter = statusFilter,
      whFilter = warehouseFilter
    ) => {
      setLoading(true);
      setError('');
      try {
        const params = new URLSearchParams();
        if (requestedPage > 1) params.set('page', String(requestedPage));
        if (stFilter) params.set('status', stFilter);
        if (whFilter) params.set('warehouse', String(whFilter));
        const qs = params.toString() ? `?${params.toString()}` : '';
        const data = await apiRequest(`/api/admin/warehouse/shipments/${qs}`);
        const rows = Array.isArray(data) ? data : data?.results || [];
        setShipments(rows);
        setCount(typeof data?.count === 'number' ? data.count : rows.length);
        setNextUrl(data?.next || null);
        setPrevUrl(data?.previous || null);
        setFeatureDisabled(false);
      } catch (err) {
        const detail = String(err?.data?.detail || err?.message || '');
        if (
          err?.status === 404 &&
          (/disabled/i.test(detail) || detail === 'HTTP 404 Error')
        ) {
          setFeatureDisabled(true);
          return;
        }
        setError(detail || 'Failed to load admin shipments.');
      } finally {
        setLoading(false);
      }
    },
    [page, statusFilter, warehouseFilter]
  );

  useEffect(() => {
    fetchAdminShipments(page, statusFilter, warehouseFilter);
  }, [fetchAdminShipments, page, statusFilter, warehouseFilter]);

  if (featureDisabled) {
    return null;
  }

  return (
    <div
      data-testid="admin-shipments-section"
      className="bg-white rounded-3xl border border-[#EAE3DC] p-5 sm:p-6 shadow-xs space-y-5 text-xs"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#EAE3DC] pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <Truck className="w-4 h-4 text-[#FA661C]" />
            <span className="text-[11px] font-black uppercase tracking-wider text-[#FA661C]">
              Warehouse Fulfilment Oversight
            </span>
          </div>
          <h3 className="font-['Outfit'] font-extrabold text-lg text-[#1A2420] mt-0.5">
            Warehouse Shipments &amp; Event Log
          </h3>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <select
            aria-label="Filter shipments by status"
            data-testid="admin-shipments-status-filter"
            value={statusFilter}
            onChange={(e) => {
              setPage(1);
              setStatusFilter(e.target.value);
            }}
            className="px-3 py-2 rounded-xl border border-[#EAE3DC] bg-white font-bold"
          >
            <option value="">All Statuses</option>
            {SHIPMENT_STATUSES.map((st) => (
              <option key={st.value} value={st.value}>
                {st.label}
              </option>
            ))}
          </select>

          <select
            aria-label="Filter shipments by warehouse"
            data-testid="admin-shipments-warehouse-filter"
            value={warehouseFilter}
            onChange={(e) => {
              setPage(1);
              setWarehouseFilter(e.target.value);
            }}
            className="px-3 py-2 rounded-xl border border-[#EAE3DC] bg-white font-bold"
          >
            <option value="">All Warehouses</option>
            {warehouses.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name} (#{w.id})
              </option>
            ))}
          </select>

          <button
            type="button"
            data-testid="admin-shipments-refresh-btn"
            disabled={loading}
            onClick={() =>
              fetchAdminShipments(page, statusFilter, warehouseFilter)
            }
            className="px-3.5 py-2 rounded-xl border border-[#EAE3DC] bg-white hover:bg-[#FFF3EC] font-bold flex items-center space-x-1.5 cursor-pointer"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 text-[#FA661C] ${loading ? 'animate-spin' : ''
                }`}
            />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {actionBanner && (
        <div
          data-testid="admin-shipments-action-banner"
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

      {cancelParcelResult?.refund_request && (
        <div
          data-testid="admin-cancel-parcel-refund-summary"
          className="p-4 rounded-2xl border border-[#6EE7B7] bg-[#ECFDF5]/60 space-y-1.5 text-xs"
        >
          <div className="flex flex-wrap items-center justify-between gap-2 font-bold text-[#065F46]">
            <span>
              Parcel #{cancelParcelResult.vendor_order_id} Cancelled • Refund
              Request #{cancelParcelResult.refund_request.id} (
              {cancelParcelResult.refund_request.status})
            </span>
            <span className="font-mono font-extrabold text-sm">
              {cancelParcelResult.refund_request.currency}{' '}
              {cancelParcelResult.refund_request.amount}
            </span>
          </div>
          {cancelParcelResult.refund_request.breakdown &&
            typeof cancelParcelResult.refund_request.breakdown === 'object' && (
              <div
                data-testid="admin-cancel-parcel-refund-breakdown"
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

      {error && (
        <div
          role="alert"
          data-testid="admin-shipments-error"
          className="p-4 rounded-2xl border border-[#FCA5A5] bg-[#FFF3F3] text-[#991B1B] font-bold flex items-center space-x-2"
        >
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="py-12 text-center text-[#6B6058]">
          Loading warehouse shipments…
        </div>
      ) : shipments.length === 0 ? (
        <div
          data-testid="admin-shipments-empty"
          className="py-10 text-center text-[#6B6058] border border-dashed border-[#EAE3DC] rounded-2xl"
        >
          No warehouse shipments found.
        </div>
      ) : (
        <div className="space-y-4">
          {shipments.map((shp) => (
            <div
              key={shp.id}
              data-testid={`admin-shipment-card-${shp.id}`}
              className="p-4 rounded-2xl border border-[#EAE3DC] bg-[#FFF8F2]/40 space-y-3"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#EAE3DC] pb-2.5">
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="font-mono font-extrabold text-sm text-[#FA661C]">
                    Shipment #{shp.id}
                  </span>
                  <span
                    data-testid={`admin-shipment-status-${shp.id}`}
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${getShipmentStatusBadgeClass(
                      shp.status
                    )}`}
                  >
                    {formatShipmentStatusLabel(shp.status)}
                  </span>
                  <span className="font-mono font-bold text-[#1A2420]">
                    {shp.label_number}
                  </span>
                  <span className="text-[#6B6058]">
                    Order {shp.order_number} • Vendor Order #
                    {shp.vendor_order_id} • Warehouse #{shp.warehouse_id}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {(shp.courier_name || shp.tracking_number) && (
                    <div
                      data-testid={`admin-shipment-tracking-${shp.id}`}
                      className="font-mono text-xs text-[#1E40AF] font-bold"
                    >
                      {shp.courier_name} • {shp.tracking_number}
                    </div>
                  )}

                  {shp.status === 'exception' && (
                    <button
                      type="button"
                      data-testid={`open-resolve-short-pick-btn-${shp.id}`}
                      onClick={() => openShortPickResolution(shp)}
                      className="px-3 py-1.5 rounded-xl bg-[#FA661C] hover:bg-[#E0530B] text-white font-bold cursor-pointer"
                    >
                      Resolve short pick
                    </button>
                  )}

                  {!['shipped', 'delivered', 'cancelled', 'exception'].includes(
                    shp.status
                  ) && (
                      <button
                        type="button"
                        data-testid={`admin-cancel-shipment-parcel-btn-${shp.vendor_order_id}`}
                        onClick={() =>
                          openAdminCancelParcelDialog(
                            shp.vendor_order_id,
                            shp.order_number
                          )
                        }
                        className="px-3 py-1.5 rounded-xl bg-white hover:bg-[#FFF3F3] text-[#DC2626] border border-[#FCA5A5] font-bold cursor-pointer"
                      >
                        Cancel parcel
                      </button>
                    )}
                </div>
              </div>

              {/* Short-Pick Exception Lines & Resolution Form */}
              {resolvingShipment?.id === shp.id && (
                <form
                  onSubmit={handleOpenResolveConfirm}
                  data-testid={`resolve-short-pick-form-${shp.id}`}
                  className="p-4 rounded-2xl border-2 border-[#FA661C] bg-white space-y-4"
                  noValidate
                >
                  <div className="flex items-center justify-between border-b border-[#EAE3DC] pb-2.5">
                    <div>
                      <h4 className="font-['Outfit'] font-extrabold text-sm text-[#1A2420]">
                        Resolve Short Pick — Shipment #{shp.id} (Parcel #
                        {shp.vendor_order_id})
                      </h4>
                      <p className="text-[11px] text-[#6B6058]">
                        Allocate the missing units to linked stock lots for write-off and provide an audit reason.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setResolvingShipment(null)}
                      className="text-[#6B6058] hover:text-[#1A2420] cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {resolveGeneralError && (
                    <div
                      role="alert"
                      data-testid="resolve-short-pick-general-error"
                      className="p-3 rounded-xl border border-[#FCA5A5] bg-[#FFF3F3] text-[#991B1B] font-bold"
                    >
                      {resolveGeneralError}
                    </div>
                  )}

                  {resolveFieldErrors.writeoffs && (
                    <p
                      role="alert"
                      data-testid="resolve-short-pick-error-writeoffs"
                      className="p-3 rounded-xl border border-[#FCA5A5] bg-[#FFF3F3] text-[#DC2626] font-bold"
                    >
                      {resolveFieldErrors.writeoffs}
                    </p>
                  )}

                  <div className="space-y-3">
                    {(shp.lines || []).map((line) => {
                      const lots = Array.isArray(line.lot_reservations)
                        ? line.lot_reservations
                        : [];
                      return (
                        <div
                          key={line.id}
                          data-testid={`short-pick-line-card-${line.id}`}
                          className="p-3 rounded-xl border border-[#EAE3DC] bg-[#FFF8F2]/50 space-y-2"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div>
                              <span className="font-bold text-[#1A2420]">
                                {line.product_name}
                              </span>
                              <span className="font-mono text-[#FA661C] ml-2">
                                ({line.sku} • Line #{line.id})
                              </span>
                            </div>
                            <div className="font-mono text-[11px]">
                              Expected: <strong>{line.expected_quantity}</strong>{' '}
                              • Picked: <strong>{line.picked_quantity}</strong>
                            </div>
                          </div>

                          {line.exception_reason && (
                            <div className="text-[11px] font-semibold text-[#991B1B]">
                              Manager Exception Reason: {line.exception_reason}
                            </div>
                          )}

                          {lots.length > 0 && (
                            <div className="space-y-1.5 pt-1">
                              <span className="text-[10px] font-black uppercase text-[#6B6058] block">
                                Lot Write-off Allocations
                              </span>
                              {lots.map((lr) => {
                                const mapKey = `${line.id}-${lr.lot_id}`;
                                return (
                                  <div
                                    key={mapKey}
                                    className="flex flex-wrap items-center justify-between gap-2 bg-white p-2 rounded-lg border border-[#EAE3DC]"
                                  >
                                    <span className="font-mono text-[11px]">
                                      Lot #{lr.lot_id} • Location {lr.location}{' '}
                                      (Linked Qty: {lr.quantity})
                                    </span>
                                    <div className="flex items-center space-x-2">
                                      <label
                                        htmlFor={`writeoff-qty-${mapKey}`}
                                        className="text-[11px] font-bold text-[#1A2420]"
                                      >
                                        Write-off Qty:
                                      </label>
                                      <input
                                        id={`writeoff-qty-${mapKey}`}
                                        type="number"
                                        min="0"
                                        max={lr.quantity}
                                        data-testid={`writeoff-qty-input-${line.id}-${lr.lot_id}`}
                                        value={resolveWriteoffs[mapKey] ?? ''}
                                        onChange={(e) => {
                                          const val = e.target.value;
                                          setResolveWriteoffs((prev) => ({
                                            ...prev,
                                            [mapKey]: val,
                                          }));
                                          setResolveFieldErrors((fe) => ({
                                            ...fe,
                                            writeoffs: '',
                                          }));
                                        }}
                                        placeholder="0"
                                        className="w-20 px-2.5 py-1 rounded-lg border border-[#EAE3DC] font-mono text-right"
                                      />
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <div>
                    <label
                      htmlFor={`resolve-short-pick-reason-${shp.id}`}
                      className="block font-bold text-[#1A2420] mb-1"
                    >
                      Resolution Reason *
                    </label>
                    <textarea
                      id={`resolve-short-pick-reason-${shp.id}`}
                      rows={2}
                      data-testid="resolve-short-pick-reason-input"
                      value={resolveReason}
                      onChange={(e) => {
                        setResolveReason(e.target.value);
                        setResolveFieldErrors((fe) => ({ ...fe, reason: '' }));
                      }}
                      placeholder="Mandatory audit reason for writing off missing units and refunding the customer..."
                      className="w-full px-3 py-2 rounded-xl border border-[#EAE3DC]"
                    />
                    {resolveFieldErrors.reason && (
                      <p
                        data-testid="resolve-short-pick-error-reason"
                        className="mt-1 text-[11px] font-semibold text-[#DC2626]"
                      >
                        {resolveFieldErrors.reason}
                      </p>
                    )}
                  </div>

                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setResolvingShipment(null)}
                      className="px-4 py-2 rounded-xl border border-[#EAE3DC] font-bold text-[#6B6058] cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      data-testid="open-resolve-short-pick-dialog-btn"
                      disabled={resolveSubmitting}
                      className="px-5 py-2 rounded-xl bg-[#FA661C] hover:bg-[#E0530B] text-white font-bold cursor-pointer disabled:opacity-50"
                    >
                      Review &amp; Resolve Short Pick
                    </button>
                  </div>
                </form>
              )}

              {/* Event Log per Shipment */}
              {Array.isArray(shp.events) && shp.events.length > 0 && (
                <div
                  data-testid={`admin-shipment-events-${shp.id}`}
                  className="bg-white rounded-xl border border-[#EAE3DC] divide-y divide-[#EAE3DC]/60"
                >
                  {shp.events.map((ev) => (
                    <div
                      key={ev.id}
                      data-testid={`admin-shipment-event-${ev.id}`}
                      className="px-3 py-2 flex flex-wrap items-center justify-between gap-2 text-[11px]"
                    >
                      <div>
                        <strong className="text-[#1A2420]">
                          {SHIPMENT_EVENT_LABELS[ev.event] || ev.event}
                        </strong>
                        <span className="font-mono text-[#6B6058] ml-2">
                          ({ev.before_status || '—'} → {ev.after_status})
                        </span>
                        {ev.note && (
                          <span className="text-[#1A2420] ml-2">
                            — {ev.note}
                          </span>
                        )}
                      </div>
                      <div className="text-[#6B6058] font-mono">
                        @{ev.actor_username} • {formatDateTime(ev.occurred_at)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}

          {/* Pagination */}
          <div className="flex items-center justify-between pt-2 border-t border-[#EAE3DC]">
            <span className="text-[#6B6058]">
              Page {page} • {count} shipment(s)
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                data-testid="admin-shipments-prev-btn"
                disabled={!prevUrl || loading}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1.5 rounded-xl border border-[#EAE3DC] font-bold disabled:opacity-40 cursor-pointer flex items-center space-x-1"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Previous</span>
              </button>
              <button
                type="button"
                data-testid="admin-shipments-next-btn"
                disabled={!nextUrl || loading}
                onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1.5 rounded-xl border border-[#EAE3DC] font-bold disabled:opacity-40 cursor-pointer flex items-center space-x-1"
              >
                <span>Next</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* NATIVE <dialog>: CONFIRM SHORT-PICK RESOLUTION */}
      {resolveConfirmOpen && resolvingShipment && (
        <dialog
          open
          data-testid="resolve-short-pick-confirm-dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-[#1A1A1A]/60 backdrop-blur-2xs flex items-center justify-center p-4 w-full h-full m-0 border-0"
        >
          <div className="bg-white rounded-3xl border border-[#EAE3DC] shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#EAE3DC] pb-3">
              <h3 className="font-['Outfit'] font-extrabold text-lg text-[#1A2420]">
                Confirm Short-Pick Resolution — Shipment #{resolvingShipment.id}
              </h3>
              <button
                type="button"
                onClick={() => setResolveConfirmOpen(false)}
                className="p-1 text-[#6B6058] hover:text-[#1A2420] cursor-pointer"
                aria-label="Close short-pick resolution dialog"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div
              data-testid="resolve-short-pick-dialog-warning"
              className="p-3.5 rounded-xl bg-[#FFFBEB] border border-[#F59E0B] text-xs font-bold text-[#92400E]"
            >
              The missing units are written off from the selected lots and flagged for follow-up, the picked units are released back to stock, and the customer is refunded in full for this parcel.
            </div>

            {resolveGeneralError && (
              <div
                role="alert"
                data-testid="resolve-short-pick-dialog-error"
                className="p-3 rounded-xl bg-[#FFF3F3] border border-[#FCA5A5] text-xs font-bold text-[#991B1B]"
              >
                {resolveGeneralError}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setResolveConfirmOpen(false)}
                className="px-4 py-2 rounded-xl border border-[#EAE3DC] font-bold text-[#6B6058] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                data-testid="confirm-resolve-short-pick-submit-btn"
                disabled={resolveSubmitting}
                onClick={handleConfirmResolveShortPick}
                className="px-4 py-2 rounded-xl bg-[#DC2626] hover:bg-[#B91C1C] text-white font-bold cursor-pointer disabled:opacity-50"
              >
                {resolveSubmitting
                  ? 'Resolving…'
                  : 'Confirm Write-Off & Refund'}
              </button>
            </div>
          </div>
        </dialog>
      )}

      {/* NATIVE <dialog>: ADMIN CANCEL A PARCEL (`POST /api/orders/admin/vendor-orders/<pk>/cancel/`) */}
      {cancelParcelOpen && (
        <dialog
          open
          data-testid="admin-cancel-parcel-dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-[#1A1A1A]/60 backdrop-blur-2xs flex items-center justify-center p-4 w-full h-full m-0 border-0"
        >
          <div className="bg-white rounded-3xl border border-[#EAE3DC] shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#EAE3DC] pb-3">
              <h3 className="font-['Outfit'] font-extrabold text-lg text-[#1A2420]">
                Cancel Parcel #{cancelParcelOpen.vendorOrderId}
              </h3>
              <button
                type="button"
                onClick={() => setCancelParcelOpen(null)}
                className="p-1 text-[#6B6058] hover:text-[#1A2420] cursor-pointer"
                aria-label="Close admin cancel parcel dialog"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3.5 rounded-xl bg-[#FFFBEB] border border-[#F59E0B] text-xs font-bold text-[#92400E]">
              This cancels paid seller parcel #{cancelParcelOpen.vendorOrderId}{' '}
              before shipment, releases reserved stock, and creates a customer
              refund request.
            </div>

            {cancelParcelGeneralError && (
              <div
                role="alert"
                data-testid="admin-cancel-parcel-general-error"
                className="p-3 rounded-xl bg-[#FFF3F3] border border-[#FCA5A5] text-xs font-bold text-[#991B1B]"
              >
                {cancelParcelGeneralError}
              </div>
            )}

            <form
              onSubmit={handleConfirmAdminCancelParcel}
              noValidate
              className="space-y-3"
            >
              <div>
                <label
                  htmlFor="admin-cancel-parcel-reason"
                  className="block font-bold text-[#1A2420] mb-1"
                >
                  Cancellation Reason *
                </label>
                <textarea
                  id="admin-cancel-parcel-reason"
                  rows={2}
                  data-testid="admin-cancel-parcel-reason-input"
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
                    data-testid="admin-cancel-parcel-error-reason"
                    className="mt-1 text-[11px] font-semibold text-[#DC2626]"
                  >
                    {cancelParcelFieldErrors.reason}
                  </p>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCancelParcelOpen(null)}
                  className="px-4 py-2 rounded-xl border border-[#EAE3DC] font-bold text-[#6B6058] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  data-testid="admin-cancel-parcel-submit-btn"
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

export function AdminStockReconciliationSection() {
  const { currentUser } = useAuth();
  const isSuperuser = Boolean(currentUser?.is_superuser);

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [feedbackBanner, setFeedbackBanner] = useState('');

  // Superuser-only "Correct seller stock" form state
  const [correctForm, setCorrectForm] = useState({
    variant_id: '',
    stock_quantity: '',
    reason: '',
  });
  const [correctFieldErrors, setCorrectFieldErrors] = useState({});
  const [correctGeneralError, setCorrectGeneralError] = useState('');
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [correctSubmitting, setCorrectSubmitting] = useState(false);

  const fetchReconciliation = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await apiRequest(
        '/api/admin/warehouse/stock-reconciliation/'
      );
      setRows(Array.isArray(data) ? data : data?.results || []);
    } catch (err) {
      setError(
        err?.data?.detail ||
        err?.message ||
        'Failed to load stock reconciliation report.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReconciliation();
  }, [fetchReconciliation]);

  const handleOpenConfirmDialog = (e) => {
    e.preventDefault();
    setCorrectFieldErrors({});
    setCorrectGeneralError('');
    setConfirmDialogOpen(true);
  };

  const handleConfirmCorrection = async () => {
    if (correctSubmitting) return;
    setCorrectFieldErrors({});
    setCorrectGeneralError('');
    setFeedbackBanner('');
    setCorrectSubmitting(true);

    try {
      const res = await apiRequest(
        '/api/admin/warehouse/stock-reconciliation/correct/',
        {
          method: 'POST',
          body: JSON.stringify({
            variant_id:
              correctForm.variant_id !== ''
                ? Number(correctForm.variant_id)
                : '',
            stock_quantity:
              correctForm.stock_quantity !== ''
                ? Number(correctForm.stock_quantity)
                : '',
            reason: correctForm.reason,
          }),
        }
      );
      setConfirmDialogOpen(false);
      setFeedbackBanner(
        `Corrected seller stock for variant #${res.variant_id}: ${res.before_quantity} → ${res.stock_quantity} (delta: ${res.quantity_delta}).`
      );
      setCorrectForm({ variant_id: '', stock_quantity: '', reason: '' });
      await fetchReconciliation();
    } catch (err) {
      const parsed = parseWarehouseApiError(err, [
        'variant_id',
        'stock_quantity',
        'reason',
      ]);
      setCorrectFieldErrors(parsed.fieldErrors);
      setCorrectGeneralError(parsed.generalError);
      if (Object.keys(parsed.fieldErrors).length > 0) {
        setConfirmDialogOpen(false);
      }
    } finally {
      setCorrectSubmitting(false);
    }
  };

  return (
    <div
      data-testid="admin-stock-reconciliation-section"
      className="space-y-5 text-xs"
    >
      {feedbackBanner && (
        <div
          data-testid="reconciliation-feedback-banner"
          role="status"
          className="p-4 rounded-2xl border border-[#6EE7B7] bg-[#ECFDF5] text-[#065F46] font-bold flex items-center justify-between"
        >
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-[#059669] shrink-0" />
            <span>{feedbackBanner}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedbackBanner('')}
            className="underline cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Superuser Correction Form OR Non-Superuser Read-Only Note */}
      {isSuperuser ? (
        <div
          data-testid="superuser-stock-correction-panel"
          className="bg-white rounded-3xl border border-[#EAE3DC] p-5 sm:p-6 shadow-xs space-y-4"
        >
          <div className="border-b border-[#EAE3DC] pb-3">
            <h3 className="font-['Outfit'] font-extrabold text-base text-[#1A2420] flex items-center space-x-2">
              <ShieldAlert className="w-4 h-4 text-[#FA661C]" />
              <span>Correct seller stock (Superuser Only)</span>
            </h3>
            <p className="text-[11px] text-[#6B6058]">
              Apply an audited, permanent stock correction to one product variant.
            </p>
          </div>

          {correctGeneralError && (
            <div
              role="alert"
              data-testid="correction-general-error"
              className="p-3 rounded-xl border border-[#FCA5A5] bg-[#FFF3F3] text-[#991B1B] font-bold"
            >
              {correctGeneralError}
            </div>
          )}

          <form
            onSubmit={handleOpenConfirmDialog}
            data-testid="correct-seller-stock-form"
            className="space-y-4"
            noValidate
          >
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label
                  htmlFor="correct-variant-id"
                  className="block font-bold text-[#1A2420] mb-1"
                >
                  Variant ID *
                </label>
                <input
                  id="correct-variant-id"
                  type="number"
                  min="1"
                  data-testid="correct-variant-id-input"
                  value={correctForm.variant_id}
                  onChange={(e) => {
                    setCorrectForm((f) => ({
                      ...f,
                      variant_id: e.target.value,
                    }));
                    setCorrectFieldErrors((fe) => ({ ...fe, variant_id: '' }));
                  }}
                  placeholder="e.g. 13"
                  className="w-full px-3 py-2 rounded-xl border border-[#EAE3DC] font-mono"
                />
                {correctFieldErrors.variant_id && (
                  <p
                    data-testid="correct-error-variant_id"
                    className="mt-1 text-[11px] font-semibold text-[#DC2626]"
                  >
                    {correctFieldErrors.variant_id}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="correct-stock-qty"
                  className="block font-bold text-[#1A2420] mb-1"
                >
                  New Stock Quantity *
                </label>
                <input
                  id="correct-stock-qty"
                  type="number"
                  min="0"
                  data-testid="correct-stock-quantity-input"
                  value={correctForm.stock_quantity}
                  onChange={(e) => {
                    setCorrectForm((f) => ({
                      ...f,
                      stock_quantity: e.target.value,
                    }));
                    setCorrectFieldErrors((fe) => ({
                      ...fe,
                      stock_quantity: '',
                    }));
                  }}
                  placeholder="e.g. 10"
                  className="w-full px-3 py-2 rounded-xl border border-[#EAE3DC] font-mono"
                />
                {correctFieldErrors.stock_quantity && (
                  <p
                    data-testid="correct-error-stock_quantity"
                    className="mt-1 text-[11px] font-semibold text-[#DC2626]"
                  >
                    {correctFieldErrors.stock_quantity}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="correct-reason"
                  className="block font-bold text-[#1A2420] mb-1"
                >
                  Reason *
                </label>
                <input
                  id="correct-reason"
                  type="text"
                  data-testid="correct-reason-input"
                  value={correctForm.reason}
                  onChange={(e) => {
                    setCorrectForm((f) => ({ ...f, reason: e.target.value }));
                    setCorrectFieldErrors((fe) => ({ ...fe, reason: '' }));
                  }}
                  placeholder="Mandatory audit reason"
                  className="w-full px-3 py-2 rounded-xl border border-[#EAE3DC]"
                />
                {correctFieldErrors.reason && (
                  <p
                    data-testid="correct-error-reason"
                    className="mt-1 text-[11px] font-semibold text-[#DC2626]"
                  >
                    {correctFieldErrors.reason}
                  </p>
                )}
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                data-testid="open-correct-stock-confirm-btn"
                disabled={correctSubmitting}
                className="px-5 py-2.5 rounded-xl bg-[#FA661C] hover:bg-[#E0530B] text-white font-bold cursor-pointer disabled:opacity-50"
              >
                Correct seller stock
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div
          data-testid="reconciliation-readonly-note"
          className="p-4 rounded-2xl border border-amber-300 bg-amber-50 text-amber-900 flex items-center space-x-2.5 font-semibold"
        >
          <Lock className="w-4 h-4 text-amber-700 shrink-0" />
          <span>
            Read-only report: Only a superuser can apply a seller stock
            correction.
          </span>
        </div>
      )}

      {/* Read-Only Reconciliation Report Table */}
      <div className="bg-white rounded-3xl border border-[#EAE3DC] p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#EAE3DC] pb-3">
          <div>
            <h3 className="font-['Outfit'] font-extrabold text-base text-[#1A2420] flex items-center space-x-2">
              <Scale className="w-4 h-4 text-[#FA661C]" />
              <span>Stock Reconciliation Report</span>
            </h3>
            <p className="text-[11px] text-[#6B6058]">
              Per-variant and warehouse view of seller stock, open request holds, lots, and double-counting flags.
            </p>
          </div>

          <button
            type="button"
            data-testid="refresh-reconciliation-btn"
            disabled={loading}
            onClick={fetchReconciliation}
            className="px-3.5 py-2 rounded-xl border border-[#EAE3DC] bg-white hover:bg-[#FFF3EC] font-bold flex items-center space-x-1.5 cursor-pointer"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 text-[#FA661C] ${loading ? 'animate-spin' : ''
                }`}
            />
            <span>Refresh</span>
          </button>
        </div>

        {error && (
          <div
            role="alert"
            data-testid="reconciliation-load-error"
            className="p-4 rounded-2xl border border-[#FCA5A5] bg-[#FFF3F3] text-[#991B1B] font-bold"
          >
            {error}
          </div>
        )}

        {loading ? (
          <div className="py-12 text-center text-[#6B6058]">
            Loading stock reconciliation report…
          </div>
        ) : rows.length === 0 ? (
          <div className="py-10 text-center text-[#6B6058]">
            No reconciliation rows found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table
              data-testid="stock-reconciliation-table"
              className="w-full text-left border-collapse text-xs"
            >
              <thead>
                <tr className="bg-[#FFF3EC]/60 border-b border-[#EAE3DC] text-[#6B6058] uppercase text-[10px]">
                  <th className="py-2.5 px-3">Variant / SKU</th>
                  <th className="py-2.5 px-3">Seller / Warehouse</th>
                  <th className="py-2.5 px-3 text-right">Seller Stock</th>
                  <th className="py-2.5 px-3">Open Request Holds</th>
                  <th className="py-2.5 px-3">
                    Lots (Available / Reserved / Quarantined)
                  </th>
                  <th className="py-2.5 px-3">
                    Returns (Quarantine &amp; Unconfirmed Handbacks)
                  </th>
                  <th className="py-2.5 px-3">Diagnostic Flags</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EAE3DC]">
                {rows.map((row, idx) => (
                  <tr
                    key={`${row.variant_id}-${row.warehouse_id ?? 'none'}-${idx}`}
                    data-testid={`recon-row-${row.variant_id}-${row.warehouse_id ?? 'none'
                      }`}
                  >
                    <td className="py-3 px-3">
                      <div className="font-mono font-bold text-[#1A2420]">
                        Variant #{row.variant_id}
                      </div>
                      <div className="font-mono text-[11px] text-[#FA661C]">
                        {row.sku}
                      </div>
                    </td>
                    <td className="py-3 px-3 font-mono text-[11px]">
                      <div>Seller #{row.vendor_id}</div>
                      <div className="text-[#6B6058]">
                        {row.warehouse_id
                          ? `Warehouse #${row.warehouse_id}`
                          : 'No Warehouse'}
                      </div>
                    </td>
                    <td
                      data-testid={`recon-seller-stock-${row.variant_id}-${row.warehouse_id ?? 'none'
                        }`}
                      className="py-3 px-3 text-right font-mono font-extrabold text-sm text-[#1A2420]"
                    >
                      {row.seller_stock}
                    </td>
                    <td className="py-3 px-3 text-[11px]">
                      {Array.isArray(row.open_request_holds) &&
                        row.open_request_holds.length > 0 ? (
                        <div className="space-y-1">
                          {row.open_request_holds.map((h) => (
                            <div
                              key={h.item_id}
                              className="font-mono bg-[#FFF8F2] px-2 py-1 rounded border border-[#EAE3DC]"
                            >
                              Req #{h.request_id} ({h.status}): Held{' '}
                              <strong>{h.held_quantity}</strong> (Req:{' '}
                              {h.requested_quantity}, Acc:{' '}
                              {h.accepted_quantity ?? '—'})
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-[#6B6058]">None</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-[11px]">
                      {Array.isArray(row.lots) && row.lots.length > 0 ? (
                        <div className="space-y-1">
                          {row.lots.map((l) => (
                            <div
                              key={l.lot_id}
                              data-testid={`recon-lot-${l.lot_id}`}
                              className="font-mono bg-[#F9FAFB] px-2 py-1 rounded border border-[#EAE3DC]"
                            >
                              Lot #{l.lot_id} ({l.kind}): Avail{' '}
                              <strong>{l.available}</strong> • Res{' '}
                              <strong>{l.reserved}</strong> • Quar{' '}
                              <strong>{l.quarantined}</strong>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-[#6B6058]">No lots</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-[11px]">
                      {(!Array.isArray(row.return_quarantine_lots) ||
                        row.return_quarantine_lots.length === 0) &&
                      (!Array.isArray(row.unconfirmed_seller_handbacks) ||
                        row.unconfirmed_seller_handbacks.length === 0) ? (
                        <span className="text-[#6B6058]">None</span>
                      ) : (
                        <div className="space-y-1.5">
                          {Array.isArray(row.return_quarantine_lots) &&
                            row.return_quarantine_lots.map((rq) => (
                              <div
                                key={`rq-${rq.receipt_line_id}-${rq.lot_id}`}
                                data-testid={`recon-return-quarantine-${rq.receipt_line_id}`}
                                className="font-mono bg-[#FFF3F3] text-[#991B1B] px-2 py-1 rounded border border-[#FCA5A5]"
                              >
                                <span className="font-bold">
                                  Return Quarantine ({rq.result}):
                                </span>{' '}
                                {rq.receipt_number} (RMA #{rq.rma_id} • Lot #
                                {rq.lot_id}) • Qty <strong>{rq.quantity}</strong>
                              </div>
                            ))}
                          {Array.isArray(row.unconfirmed_seller_handbacks) &&
                            row.unconfirmed_seller_handbacks.map((uh) => (
                              <div
                                key={`uh-${uh.receipt_line_id}`}
                                data-testid={`recon-unconfirmed-handback-${uh.receipt_line_id}`}
                                className="font-mono bg-[#F3E8FF] text-[#6B21A8] px-2 py-1 rounded border border-[#D8B4FE]"
                              >
                                <span className="font-bold">
                                  Unconfirmed Seller Handback:
                                </span>{' '}
                                {uh.receipt_number} (RMA #{uh.rma_id} • Line #
                                {uh.receipt_line_id}) • Qty Due{' '}
                                <strong>{uh.quantity_due}</strong>
                              </div>
                            ))}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-3 text-[11px]">
                      <div className="flex flex-wrap gap-1">
                        {(row.lots || []).some((l) => l.likely_double_count) && (
                          <span
                            data-testid={`recon-flag-double-count-${row.variant_id}`}
                            className="px-2 py-0.5 rounded-full bg-[#FFF3F3] text-[#991B1B] border border-[#FCA5A5] font-bold text-[10px]"
                          >
                            Likely Double Count
                          </span>
                        )}
                        {(row.lots || []).some((l) => l.legacy_unverified) && (
                          <span
                            data-testid={`recon-flag-unverified-${row.variant_id}`}
                            className="px-2 py-0.5 rounded-full bg-[#FEF3C7] text-[#92400E] border border-[#FCD34D] font-bold text-[10px]"
                          >
                            Legacy Unverified ({row.unverified_lot_quantity})
                          </span>
                        )}
                        {Array.isArray(
                          row.stuck_paid_cancellation_reservations
                        ) &&
                          row.stuck_paid_cancellation_reservations.length >
                          0 && (
                            <span className="px-2 py-0.5 rounded-full bg-[#FFF3F3] text-[#991B1B] border border-[#FCA5A5] font-bold text-[10px]">
                              Stuck Paid Cancellation Hold
                            </span>
                          )}
                        {Array.isArray(row.overage_shortfalls) &&
                          row.overage_shortfalls.length > 0 && (
                            <span className="px-2 py-0.5 rounded-full bg-[#FFF3F3] text-[#991B1B] border border-[#FCA5A5] font-bold text-[10px]">
                              Overage Shortfall
                            </span>
                          )}
                        {Array.isArray(row.return_quarantine_lots) &&
                          row.return_quarantine_lots.length > 0 && (
                            <span
                              data-testid={`recon-flag-return-quarantine-${row.variant_id}`}
                              className="px-2 py-0.5 rounded-full bg-[#FFF3F3] text-[#991B1B] border border-[#FCA5A5] font-bold text-[10px]"
                            >
                              Return Quarantine ({row.return_quarantine_lots.length})
                            </span>
                          )}
                        {Array.isArray(row.unconfirmed_seller_handbacks) &&
                          row.unconfirmed_seller_handbacks.length > 0 && (
                            <span
                              data-testid={`recon-flag-unconfirmed-handback-${row.variant_id}`}
                              className="px-2 py-0.5 rounded-full bg-[#F3E8FF] text-[#6B21A8] border border-[#D8B4FE] font-bold text-[10px]"
                            >
                              Unconfirmed Seller Handback ({row.unconfirmed_seller_handbacks.length})
                            </span>
                          )}
                        {!(row.lots || []).some(
                          (l) => l.likely_double_count || l.legacy_unverified
                        ) &&
                          (!row.stuck_paid_cancellation_reservations ||
                            row.stuck_paid_cancellation_reservations.length ===
                            0) &&
                          (!row.overage_shortfalls ||
                            row.overage_shortfalls.length === 0) &&
                          (!row.return_quarantine_lots ||
                            row.return_quarantine_lots.length === 0) &&
                          (!row.unconfirmed_seller_handbacks ||
                            row.unconfirmed_seller_handbacks.length === 0) && (
                            <span className="text-[#059669] font-bold">
                              Clean
                            </span>
                          )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* NATIVE <dialog>: CONFIRM SELLER STOCK CORRECTION */}
      {confirmDialogOpen && isSuperuser && (
        <dialog
          open
          data-testid="correct-stock-confirm-dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-[#1A1A1A]/60 backdrop-blur-2xs flex items-center justify-center p-4 w-full h-full m-0 border-0"
        >
          <div className="bg-white rounded-3xl border border-[#EAE3DC] shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#EAE3DC] pb-3">
              <h3 className="font-['Outfit'] font-extrabold text-lg text-[#1A2420]">
                Confirm Seller Stock Correction
              </h3>
              <button
                type="button"
                onClick={() => setConfirmDialogOpen(false)}
                className="p-1 text-[#6B6058] hover:text-[#1A2420] cursor-pointer"
                aria-label="Close confirm dialog"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div
              data-testid="correct-stock-audit-warning"
              className="p-3.5 rounded-xl bg-[#FFFBEB] border border-[#F59E0B] text-xs font-bold text-[#92400E]"
            >
              This seller stock correction is audited and permanent. An immutable variant stock movement will be recorded.
            </div>

            <div className="text-xs space-y-1 text-[#1A2420]">
              <div>
                Variant ID:{' '}
                <strong className="font-mono">
                  #{correctForm.variant_id || '—'}
                </strong>
              </div>
              <div>
                New Quantity:{' '}
                <strong className="font-mono">
                  {correctForm.stock_quantity || '—'}
                </strong>
              </div>
              <div>
                Reason: <strong>{correctForm.reason || '—'}</strong>
              </div>
            </div>

            {correctGeneralError && (
              <div
                role="alert"
                data-testid="correct-dialog-error"
                className="p-3 rounded-xl bg-[#FFF3F3] border border-[#FCA5A5] text-xs text-[#991B1B] font-bold"
              >
                {correctGeneralError}
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
                data-testid="confirm-correct-stock-submit-btn"
                disabled={correctSubmitting}
                onClick={handleConfirmCorrection}
                className="px-4 py-2 rounded-xl bg-[#DC2626] hover:bg-[#B91C1C] text-white font-bold cursor-pointer disabled:opacity-50"
              >
                {correctSubmitting ? 'Applying…' : 'Confirm Correction'}
              </button>
            </div>
          </div>
        </dialog>
      )}
    </div>
  );
}

export function AdminHubOperationsSection({ warehouses = [] }) {
  const [featureDisabled, setFeatureDisabled] = useState(false);
  const [assignments, setAssignments] = useState([]);
  const [needsHubRows, setNeedsHubRows] = useState([]);
  const [overdueRows, setOverdueRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [feedbackBanner, setFeedbackBanner] = useState('');

  // Assign or change seller hub form state (`POST /api/admin/warehouse/vendor-hub-assignments/`)
  const [assignForm, setAssignForm] = useState({
    vendor_id: '',
    warehouse_id: '',
    reason: '',
  });
  const [assignFieldErrors, setAssignFieldErrors] = useState({});
  const [assignGeneralError, setAssignGeneralError] = useState('');
  const [assignConfirmOpen, setAssignConfirmOpen] = useState(false);
  const [assignSubmitting, setAssignSubmitting] = useState(false);

  const fetchHubOperationsData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [assignRes, needsRes, overdueRes] = await Promise.all([
        apiRequest('/api/admin/warehouse/vendor-hub-assignments/'),
        apiRequest('/api/admin/warehouse/handovers/needs-hub/'),
        apiRequest('/api/admin/warehouse/handovers/overdue/'),
      ]);

      setAssignments(
        Array.isArray(assignRes) ? assignRes : assignRes?.results || []
      );
      setNeedsHubRows(
        Array.isArray(needsRes) ? needsRes : needsRes?.results || []
      );
      setOverdueRows(
        Array.isArray(overdueRes) ? overdueRes : overdueRes?.results || []
      );
      setFeatureDisabled(false);
    } catch (err) {
      if (err?.status === 404) {
        setFeatureDisabled(true);
        return;
      }
      const parsed = parseWarehouseApiError(err);
      setError(
        parsed.generalError ||
        err?.data?.detail ||
        'Failed to load hub assignment and handover lists.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHubOperationsData();
  }, [fetchHubOperationsData]);

  if (featureDisabled) {
    return null;
  }

  const handleOpenAssignConfirm = (e) => {
    e.preventDefault();
    if (assignSubmitting) return;
    setAssignFieldErrors({});
    setAssignGeneralError('');
    setAssignConfirmOpen(true);
  };

  const handleConfirmAssignSubmit = async () => {
    if (assignSubmitting) return;
    setAssignFieldErrors({});
    setAssignGeneralError('');
    setFeedbackBanner('');
    setAssignSubmitting(true);

    try {
      const res = await apiRequest(
        '/api/admin/warehouse/vendor-hub-assignments/',
        {
          method: 'POST',
          body: JSON.stringify({
            vendor_id:
              assignForm.vendor_id !== ''
                ? Number(assignForm.vendor_id)
                : '',
            warehouse_id:
              assignForm.warehouse_id !== ''
                ? Number(assignForm.warehouse_id)
                : '',
            reason: assignForm.reason,
          }),
        }
      );
      setAssignConfirmOpen(false);
      setFeedbackBanner(
        `Assigned Hub #${res.warehouse_id} to Seller #${res.vendor_id} (Assignment #${res.id}).`
      );
      setAssignForm({ vendor_id: '', warehouse_id: '', reason: '' });
      await fetchHubOperationsData();
    } catch (err) {
      const parsed = parseWarehouseApiError(err, [
        'vendor_id',
        'warehouse_id',
        'warehouse',
        'reason',
      ]);
      const mappedFields = { ...parsed.fieldErrors };
      if (mappedFields.warehouse && !mappedFields.warehouse_id) {
        mappedFields.warehouse_id = mappedFields.warehouse;
      }
      setAssignFieldErrors(mappedFields);
      setAssignGeneralError(parsed.generalError);
      if (Object.keys(mappedFields).length > 0) {
        setAssignConfirmOpen(false);
      }
    } finally {
      setAssignSubmitting(false);
    }
  };

  // Current active assignments (effective_to === null)
  const activeAssignments = assignments.filter(
    (a) => a.effective_to === null || a.effective_to === undefined
  );

  return (
    <div
      data-testid="admin-hub-operations-section"
      className="space-y-6 text-xs"
    >
      {feedbackBanner && (
        <div
          data-testid="admin-hub-feedback-banner"
          role="status"
          className="p-4 rounded-2xl border border-[#6EE7B7] bg-[#ECFDF5] text-[#065F46] font-bold flex items-center justify-between"
        >
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-[#059669] shrink-0" />
            <span>{feedbackBanner}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedbackBanner('')}
            className="underline cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {error && (
        <div
          role="alert"
          data-testid="admin-hub-operations-error"
          className="p-4 rounded-2xl border border-[#FCA5A5] bg-[#FFF3F3] text-[#991B1B] font-bold flex items-center space-x-2"
        >
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* 1. ASSIGN OR CHANGE SELLER HUB FORM */}
      <div className="bg-white rounded-3xl border border-[#EAE3DC] p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#EAE3DC] pb-3">
          <div>
            <h3 className="font-['Outfit'] font-extrabold text-base text-[#1A2420]">
              Assign or Change Seller Platform Hub
            </h3>
            <p className="text-[11px] text-[#6B6058]">
              Assign an active platform warehouse hub to a seller. A mandatory audit reason is recorded.
            </p>
          </div>
          <button
            type="button"
            data-testid="refresh-hub-operations-btn"
            disabled={loading}
            onClick={fetchHubOperationsData}
            className="px-3.5 py-2 rounded-xl border border-[#EAE3DC] bg-white hover:bg-[#FFF3EC] font-bold flex items-center space-x-1.5 cursor-pointer"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 text-[#FA661C] ${loading ? 'animate-spin' : ''
                }`}
            />
            <span>Refresh All</span>
          </button>
        </div>

        {assignGeneralError && (
          <div
            role="alert"
            data-testid="assign-hub-general-error"
            className="p-3 rounded-xl border border-[#FCA5A5] bg-[#FFF3F3] text-[#991B1B] font-bold"
          >
            {assignGeneralError}
          </div>
        )}

        <form
          onSubmit={handleOpenAssignConfirm}
          data-testid="admin-assign-hub-form"
          className="space-y-4"
          noValidate
        >
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label
                htmlFor="assign-hub-vendor-id"
                className="block font-bold text-[#1A2420] mb-1"
              >
                Seller / Vendor ID *
              </label>
              <input
                id="assign-hub-vendor-id"
                type="number"
                min="1"
                data-testid="assign-hub-vendor-id-input"
                value={assignForm.vendor_id}
                onChange={(e) => {
                  setAssignForm((f) => ({ ...f, vendor_id: e.target.value }));
                  setAssignFieldErrors((fe) => ({ ...fe, vendor_id: '' }));
                }}
                placeholder="e.g. 5"
                className="w-full px-3 py-2 rounded-xl border border-[#EAE3DC] font-mono"
              />
              {assignFieldErrors.vendor_id && (
                <p
                  data-testid="assign-hub-error-vendor_id"
                  className="mt-1 text-[11px] font-semibold text-[#DC2626]"
                >
                  {assignFieldErrors.vendor_id}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="assign-hub-warehouse-id"
                className="block font-bold text-[#1A2420] mb-1"
              >
                Platform Hub (Warehouse) *
              </label>
              {warehouses.length > 0 ? (
                <select
                  id="assign-hub-warehouse-id"
                  data-testid="assign-hub-warehouse-input"
                  value={assignForm.warehouse_id}
                  onChange={(e) => {
                    setAssignForm((f) => ({
                      ...f,
                      warehouse_id: e.target.value,
                    }));
                    setAssignFieldErrors((fe) => ({
                      ...fe,
                      warehouse_id: '',
                    }));
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-[#EAE3DC] bg-white font-semibold"
                >
                  <option value="">Select hub warehouse…</option>
                  {warehouses.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name} (#{w.id}) {w.is_active === false ? '[Inactive]' : ''}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  id="assign-hub-warehouse-id"
                  type="number"
                  min="1"
                  data-testid="assign-hub-warehouse-input"
                  value={assignForm.warehouse_id}
                  onChange={(e) => {
                    setAssignForm((f) => ({
                      ...f,
                      warehouse_id: e.target.value,
                    }));
                    setAssignFieldErrors((fe) => ({
                      ...fe,
                      warehouse_id: '',
                    }));
                  }}
                  placeholder="e.g. 20"
                  className="w-full px-3 py-2 rounded-xl border border-[#EAE3DC] font-mono"
                />
              )}
              {assignFieldErrors.warehouse_id && (
                <p
                  data-testid="assign-hub-error-warehouse_id"
                  className="mt-1 text-[11px] font-semibold text-[#DC2626]"
                >
                  {assignFieldErrors.warehouse_id}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="assign-hub-reason"
                className="block font-bold text-[#1A2420] mb-1"
              >
                Reason *
              </label>
              <input
                id="assign-hub-reason"
                type="text"
                data-testid="assign-hub-reason-input"
                value={assignForm.reason}
                onChange={(e) => {
                  setAssignForm((f) => ({ ...f, reason: e.target.value }));
                  setAssignFieldErrors((fe) => ({ ...fe, reason: '' }));
                }}
                placeholder="Mandatory audit reason"
                className="w-full px-3 py-2 rounded-xl border border-[#EAE3DC]"
              />
              {assignFieldErrors.reason && (
                <p
                  data-testid="assign-hub-error-reason"
                  className="mt-1 text-[11px] font-semibold text-[#DC2626]"
                >
                  {assignFieldErrors.reason}
                </p>
              )}
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              data-testid="open-assign-hub-dialog-btn"
              disabled={assignSubmitting}
              className="px-5 py-2.5 rounded-xl bg-[#FA661C] hover:bg-[#E0530B] text-white font-bold cursor-pointer disabled:opacity-50"
            >
              Assign Hub
            </button>
          </div>
        </form>
      </div>

      {/* 2. ACTIVE SELLER HUB ASSIGNMENTS & FULL HISTORY */}
      <div className="bg-white rounded-3xl border border-[#EAE3DC] p-5 sm:p-6 shadow-xs space-y-4">
        <div className="border-b border-[#EAE3DC] pb-3">
          <h3 className="font-['Outfit'] font-extrabold text-base text-[#1A2420]">
            Seller Hub Assignments &amp; History ({assignments.length})
          </h3>
          <p className="text-[11px] text-[#6B6058]">
            Current assigned hubs ({activeAssignments.length} active) and full historical assignment log as sent by the server.
          </p>
        </div>

        {loading ? (
          <div className="py-8 text-center text-[#6B6058]">
            Loading seller hub assignments…
          </div>
        ) : assignments.length === 0 ? (
          <div
            data-testid="admin-hub-assignments-empty"
            className="py-8 text-center text-[#6B6058] border border-dashed border-[#EAE3DC] rounded-2xl"
          >
            No seller hub assignments recorded yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table
              data-testid="admin-hub-assignments-table"
              className="w-full text-left border-collapse text-xs"
            >
              <thead>
                <tr className="bg-[#FFF3EC]/60 border-b border-[#EAE3DC] text-[#6B6058] uppercase text-[10px]">
                  <th className="py-2.5 px-3">Assignment ID</th>
                  <th className="py-2.5 px-3">Seller</th>
                  <th className="py-2.5 px-3">Assigned Hub</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Effective From → To</th>
                  <th className="py-2.5 px-3">Set By &amp; Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EAE3DC]">
                {assignments.map((row) => {
                  const isActive =
                    row.effective_to === null || row.effective_to === undefined;
                  return (
                    <tr
                      key={row.id}
                      data-testid={`admin-hub-assignment-row-${row.id}`}
                    >
                      <td className="py-2.5 px-3 font-mono font-bold">
                        #{row.id}
                      </td>
                      <td className="py-2.5 px-3 font-mono font-bold text-[#1A2420]">
                        Seller #{row.vendor_id}
                      </td>
                      <td className="py-2.5 px-3 font-mono font-bold text-[#FA661C]">
                        Warehouse #{row.warehouse_id}
                      </td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${isActive
                              ? 'bg-[#ECFDF5] text-[#065F46] border border-[#6EE7B7]'
                              : 'bg-[#F3F4F6] text-[#6B7280] border border-[#D1D5DB]'
                            }`}
                        >
                          {isActive ? 'Active' : 'Superseded'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[11px] text-[#6B6058]">
                        {formatDateTime(row.effective_from)} →{' '}
                        {row.effective_to
                          ? formatDateTime(row.effective_to)
                          : 'Present'}
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="text-[#1A2420] font-semibold">
                          {row.reason}
                        </div>
                        {row.set_by_id && (
                          <div className="font-mono text-[10px] text-[#6B6058]">
                            Actor #{row.set_by_id}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 3. NEEDS HUB LIST (`GET /api/admin/warehouse/handovers/needs-hub/`) */}
      <div className="bg-white rounded-3xl border border-[#EAE3DC] p-5 sm:p-6 shadow-xs space-y-4">
        <div className="border-b border-[#EAE3DC] pb-3">
          <h3 className="font-['Outfit'] font-extrabold text-base text-[#1A2420]">
            Handovers Needing Hub Assignment ({needsHubRows.length})
          </h3>
          <p className="text-[11px] text-[#6B6058]">
            Paid seller-fulfilled orders where an unambiguous platform hub could not be determined automatically.
          </p>
        </div>

        {loading ? (
          <div className="py-8 text-center text-[#6B6058]">
            Loading needs-hub list…
          </div>
        ) : needsHubRows.length === 0 ? (
          <div
            data-testid="admin-needs-hub-empty"
            className="py-8 text-center text-[#6B6058] border border-dashed border-[#EAE3DC] rounded-2xl"
          >
            No handovers are currently waiting for a hub assignment.
          </div>
        ) : (
          <div className="space-y-2.5">
            {needsHubRows.map((nh) => (
              <div
                key={nh.handover_id ?? nh.vendor_order_id}
                data-testid={`admin-needs-hub-row-${nh.handover_id ?? nh.vendor_order_id
                  }`}
                className="p-3.5 rounded-2xl border border-[#F59E0B] bg-[#FFFBEB] flex flex-wrap items-center justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="font-bold text-[#92400E]">
                    Handover #{nh.handover_id} • Order {nh.order_number} •
                    Parcel #{nh.vendor_order_id} • Seller #{nh.vendor_id}
                  </div>
                  <div className="text-[11px] text-[#78350F]">{nh.reason}</div>
                </div>
                <button
                  type="button"
                  data-testid={`prefill-assign-hub-btn-${nh.vendor_id}`}
                  onClick={() =>
                    setAssignForm((f) => ({
                      ...f,
                      vendor_id: String(nh.vendor_id),
                    }))
                  }
                  className="px-3.5 py-1.5 rounded-xl bg-[#FA661C] text-white font-bold cursor-pointer"
                >
                  Select Seller #{nh.vendor_id}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 4. OVERDUE HANDOVERS LIST (`GET /api/admin/warehouse/handovers/overdue/`) */}
      <div className="bg-white rounded-3xl border border-[#EAE3DC] p-5 sm:p-6 shadow-xs space-y-4">
        <div className="border-b border-[#EAE3DC] pb-3">
          <h3 className="font-['Outfit'] font-extrabold text-base text-[#1A2420]">
            Overdue In-Transit Handovers ({overdueRows.length})
          </h3>
          <p className="text-[11px] text-[#6B6058]">
            Handovers marked sent by the seller but not yet received at the hub after the deadline.
          </p>
        </div>

        {loading ? (
          <div className="py-8 text-center text-[#6B6058]">
            Loading overdue handovers…
          </div>
        ) : overdueRows.length === 0 ? (
          <div
            data-testid="admin-overdue-handovers-empty"
            className="py-8 text-center text-[#6B6058] border border-dashed border-[#EAE3DC] rounded-2xl"
          >
            No overdue in-transit handovers.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table
              data-testid="admin-overdue-handovers-table"
              className="w-full text-left border-collapse text-xs"
            >
              <thead>
                <tr className="bg-[#FFF3F3] border-b border-[#FCA5A5] text-[#991B1B] uppercase text-[10px]">
                  <th className="py-2.5 px-3">Handover</th>
                  <th className="py-2.5 px-3">Order &amp; Parcel</th>
                  <th className="py-2.5 px-3">Seller &amp; Hub</th>
                  <th className="py-2.5 px-3">Deadline</th>
                  <th className="py-2.5 px-3">Sent At &amp; Carrier</th>
                  <th className="py-2.5 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EAE3DC]">
                {overdueRows.map((ov) => (
                  <tr
                    key={ov.id}
                    data-testid={`admin-overdue-handover-row-${ov.id}`}
                  >
                    <td className="py-2.5 px-3 font-mono font-bold text-[#DC2626]">
                      {ov.handover_number} (#{ov.id})
                    </td>
                    <td className="py-2.5 px-3 font-mono">
                      Order {ov.order_number} • Parcel #{ov.vendor_order_id}
                    </td>
                    <td className="py-2.5 px-3 font-mono">
                      Seller #{ov.vendor_id} → Hub #{ov.warehouse_id}
                    </td>
                    <td className="py-2.5 px-3 font-mono font-bold text-[#991B1B]">
                      {ov.deadline_at}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-[11px]">
                      <div>Sent: {ov.sent_at || '—'}</div>
                      <div>
                        {ov.courier_name} • {ov.tracking_number}
                      </div>
                    </td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${getHandoverStatusBadgeClass(
                          ov.status
                        )}`}
                      >
                        {formatHandoverStatusLabel(ov.status)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* NATIVE <dialog>: CONFIRM SELLER HUB ASSIGNMENT */}
      {assignConfirmOpen && (
        <dialog
          open
          data-testid="assign-hub-confirm-dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-[#1A1A1A]/60 backdrop-blur-2xs flex items-center justify-center p-4 w-full h-full m-0 border-0"
        >
          <div className="bg-white rounded-3xl border border-[#EAE3DC] shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#EAE3DC] pb-3">
              <h3 className="font-['Outfit'] font-extrabold text-lg text-[#1A2420]">
                Confirm Seller Hub Assignment
              </h3>
              <button
                type="button"
                onClick={() => setAssignConfirmOpen(false)}
                className="p-1 text-[#6B6058] hover:text-[#1A2420] cursor-pointer"
                aria-label="Close assign hub dialog"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs space-y-1 text-[#1A2420]">
              <div>
                Seller ID:{' '}
                <strong className="font-mono">
                  #{assignForm.vendor_id || '—'}
                </strong>
              </div>
              <div>
                Hub Warehouse ID:{' '}
                <strong className="font-mono">
                  #{assignForm.warehouse_id || '—'}
                </strong>
              </div>
              <div>
                Reason: <strong>{assignForm.reason || '—'}</strong>
              </div>
            </div>

            {assignGeneralError && (
              <div
                role="alert"
                data-testid="assign-hub-dialog-error"
                className="p-3 rounded-xl bg-[#FFF3F3] border border-[#FCA5A5] text-xs font-bold text-[#991B1B]"
              >
                {assignGeneralError}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setAssignConfirmOpen(false)}
                className="px-4 py-2 rounded-xl border border-[#EAE3DC] font-bold text-[#6B6058] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                data-testid="confirm-assign-hub-submit-btn"
                disabled={assignSubmitting}
                onClick={handleConfirmAssignSubmit}
                className="px-4 py-2 rounded-xl bg-[#FA661C] hover:bg-[#E0530B] text-white font-bold cursor-pointer disabled:opacity-50"
              >
                {assignSubmitting ? 'Assigning…' : 'Confirm Assignment'}
              </button>
            </div>
          </div>
        </dialog>
      )}
    </div>
  );
}

export function AdminReturnsSection({ warehouses = [] }) {
  const [featureDisabled, setFeatureDisabled] = useState(false);
  const [returnsList, setReturnsList] = useState([]);
  const [receivedReceipts, setReceivedReceipts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [warehouseFilter, setWarehouseFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Admin Receive & Inspect state (`POST /api/admin/warehouse/returns/<pk>/receive/`)
  const [selectedRma, setSelectedRma] = useState(null);
  const [receiveWarehouseId, setReceiveWarehouseId] = useState('');
  const [lineInputs, setLineInputs] = useState({});
  const [receiveFieldErrors, setReceiveFieldErrors] = useState({});
  const [receiveGeneralError, setReceiveGeneralError] = useState('');
  const [receiveConflictAlert, setReceiveConflictAlert] = useState('');
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [receiveSubmitting, setReceiveSubmitting] = useState(false);

  const fetchAdminReturns = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await apiRequest('/api/admin/warehouse/returns/');
      const rows = Array.isArray(data) ? data : data?.results || [];
      setReturnsList(rows);
      setFeatureDisabled(false);
    } catch (err) {
      if (err?.status === 404) {
        setFeatureDisabled(true);
        return;
      }
      const parsed = parseWarehouseApiError(err);
      setError(
        parsed.generalError ||
          err?.data?.detail ||
          'Failed to load admin warehouse returns.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAdminReturns();
  }, [fetchAdminReturns]);

  if (featureDisabled) {
    return null;
  }

  const openAdminReceive = (rma) => {
    setSelectedRma(rma);
    setReceiveWarehouseId(
      rma.warehouse_id !== null && rma.warehouse_id !== undefined
        ? String(rma.warehouse_id)
        : ''
    );
    const initialLines = {};
    (rma.lines || []).forEach((line) => {
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
  };

  const handleOpenAdminConfirm = (e) => {
    e.preventDefault();
    if (!selectedRma || receiveSubmitting) return;
    setReceiveFieldErrors({});
    setReceiveGeneralError('');
    setReceiveConflictAlert('');
    setConfirmDialogOpen(true);
  };

  const handleConfirmAdminReceive = async () => {
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
        `/api/admin/warehouse/returns/${selectedRma.rma_id}/receive/`,
        {
          method: 'POST',
          body: JSON.stringify({
            warehouse_id:
              receiveWarehouseId !== '' ? Number(receiveWarehouseId) : '',
            lines: linesPayload,
          }),
        }
      );
      setConfirmDialogOpen(false);
      setSelectedRma(null);
      setReceivedReceipts((prev) => [
        res,
        ...prev.filter((r) => r.id !== res.id),
      ]);
      await fetchAdminReturns();
    } catch (err) {
      const parsed = parseWarehouseApiError(err, ['warehouse_id', 'lines']);
      if (err?.status === 409) {
        setConfirmDialogOpen(false);
        setReceiveConflictAlert(
          parsed.generalError ||
            err?.data?.detail ||
            'This return has already been received.'
        );
        await fetchAdminReturns();
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

  const filteredReturns = returnsList.filter((row) => {
    if (
      warehouseFilter &&
      String(row.warehouse_id ?? '') !== String(warehouseFilter)
    ) {
      return false;
    }
    if (statusFilter && String(row.status ?? '') !== String(statusFilter)) {
      return false;
    }
    return true;
  });

  return (
    <div
      data-testid="admin-returns-section"
      className="bg-white rounded-3xl border border-[#EAE3DC] p-5 sm:p-6 shadow-xs space-y-5 text-xs"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#EAE3DC] pb-4">
        <div>
          <span className="text-[11px] font-black uppercase tracking-wider text-[#FA661C]">
            Warehouse Return Receipts &amp; Inspection
          </span>
          <h3 className="font-['Outfit'] font-extrabold text-lg text-[#1A2420] mt-0.5">
            All Warehouse Returns
          </h3>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <select
            aria-label="Filter returns by warehouse"
            data-testid="admin-returns-warehouse-filter"
            value={warehouseFilter}
            onChange={(e) => setWarehouseFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-[#EAE3DC] bg-white font-bold"
          >
            <option value="">All Hubs</option>
            {warehouses.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name} (#{w.id})
              </option>
            ))}
          </select>

          <select
            aria-label="Filter returns by status"
            data-testid="admin-returns-status-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-[#EAE3DC] bg-white font-bold"
          >
            <option value="">All Statuses</option>
            <option value="approved">approved</option>
            <option value="pickup_scheduled">pickup_scheduled</option>
            <option value="inspection">inspection</option>
          </select>

          <button
            type="button"
            data-testid="admin-returns-refresh-btn"
            disabled={loading}
            onClick={fetchAdminReturns}
            className="px-3.5 py-2 rounded-xl border border-[#EAE3DC] bg-white hover:bg-[#FFF3EC] font-bold flex items-center space-x-1.5 cursor-pointer"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 text-[#FA661C] ${
                loading ? 'animate-spin' : ''
              }`}
            />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Required Short Help Note */}
      <div
        data-testid="admin-returns-help-note"
        className="p-4 rounded-2xl border border-[#93C5FD] bg-[#EFF6FF] text-[#1E40AF] font-bold text-xs"
      >
        After the hub receives the goods, set the RMA to inspection in the admin site, then use the refund action. Receiving goods here does not refund.
      </div>

      {receiveConflictAlert && (
        <div
          role="alert"
          data-testid="admin-returns-conflict-alert"
          className="p-4 rounded-2xl border border-[#F59E0B] bg-[#FFFBEB] text-[#92400E] font-bold flex items-center space-x-2"
        >
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{receiveConflictAlert}</span>
        </div>
      )}

      {error && (
        <div
          role="alert"
          data-testid="admin-returns-error"
          className="p-4 rounded-2xl border border-[#FCA5A5] bg-[#FFF3F3] text-[#991B1B] font-bold flex items-center space-x-2"
        >
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Recorded Return Receipts (with Receipt #, Time, Allocation Note, and Per-Line Destination & Lot) */}
      {receivedReceipts.length > 0 && (
        <div
          data-testid="admin-recorded-return-receipts"
          className="space-y-3"
        >
          <h4 className="font-['Outfit'] font-extrabold text-sm text-[#1A2420]">
            Recorded Return Receipts ({receivedReceipts.length})
          </h4>
          {receivedReceipts.map((rcpt) => (
            <div
              key={rcpt.id}
              data-testid={`admin-return-receipt-card-${rcpt.id}`}
              className="p-4 rounded-2xl border border-[#6EE7B7] bg-[#ECFDF5]/60 space-y-3"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#6EE7B7]/60 pb-2">
                <div className="flex flex-wrap items-center gap-2 font-bold text-[#065F46]">
                  <CheckCircle2 className="w-4 h-4 text-[#059669] shrink-0" />
                  <span
                    data-testid={`admin-return-receipt-number-${rcpt.id}`}
                    className="font-mono text-sm"
                  >
                    {rcpt.receipt_number}
                  </span>
                  <span>
                    • RMA #{rcpt.rma_id} • Parcel #{rcpt.vendor_order_id} • Hub #
                    {rcpt.warehouse_id}
                  </span>
                </div>
                <span className="font-mono text-[11px] text-[#047857]">
                  Received: {formatDateTime(rcpt.received_at)}
                </span>
              </div>

              {rcpt.allocation_note && (
                <div
                  data-testid={`admin-return-allocation-note-${rcpt.id}`}
                  className="p-2.5 rounded-xl bg-white border border-[#EAE3DC] text-[#1A2420] font-semibold"
                >
                  Allocation Note: {rcpt.allocation_note}
                </div>
              )}

              <div className="overflow-x-auto bg-white rounded-xl border border-[#EAE3DC]">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-[#EAE3DC] text-[#6B6058] uppercase text-[10px]">
                      <th className="py-2 px-3">Product &amp; SKU</th>
                      <th className="py-2 px-3 text-right">Expected</th>
                      <th className="py-2 px-3 text-right">Received</th>
                      <th className="py-2 px-3">Result</th>
                      <th className="py-2 px-3">Destination</th>
                      <th className="py-2 px-3">Lot ID</th>
                      <th className="py-2 px-3">Note</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EAE3DC]/60">
                    {(rcpt.lines || []).map((line) => (
                      <tr
                        key={line.receipt_line_id}
                        data-testid={`admin-return-receipt-line-${line.receipt_line_id}`}
                      >
                        <td className="py-2 px-3">
                          <div className="font-bold text-[#1A2420]">
                            {line.product_name}
                          </div>
                          <div className="font-mono text-[11px] text-[#FA661C]">
                            {line.sku}
                          </div>
                        </td>
                        <td className="py-2 px-3 text-right font-mono">
                          {line.expected_quantity}
                        </td>
                        <td className="py-2 px-3 text-right font-mono font-bold">
                          {line.received_quantity}
                        </td>
                        <td className="py-2 px-3 font-bold">
                          {formatReturnInspectionLabel(line.inspection_result)}
                        </td>
                        <td className="py-2 px-3">
                          <span
                            data-testid={`admin-return-line-destination-${line.receipt_line_id}`}
                            className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${getReturnDestinationBadgeClass(
                              line.destination
                            )}`}
                          >
                            {formatReturnDestinationLabel(line.destination)}
                          </span>
                        </td>
                        <td className="py-2 px-3 font-mono font-bold">
                          {line.lot_id ? `Lot #${line.lot_id}` : '—'}
                        </td>
                        <td className="py-2 px-3 text-[#6B6058]">
                          {line.note || '—'}
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

      {/* Expected Returns Inbox */}
      {loading ? (
        <div className="py-12 text-center text-[#6B6058]">
          Loading warehouse returns…
        </div>
      ) : filteredReturns.length === 0 ? (
        <div
          data-testid="admin-returns-empty"
          className="py-10 text-center text-[#6B6058] border border-dashed border-[#EAE3DC] rounded-2xl"
        >
          No pending return requests awaiting hub receipt.
        </div>
      ) : (
        <div className="space-y-4">
          {filteredReturns.map((rma) => (
            <div
              key={rma.rma_id}
              data-testid={`admin-return-card-${rma.rma_id}`}
              className="p-4 rounded-2xl border border-[#EAE3DC] bg-[#FFF8F2]/40 space-y-3"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#EAE3DC] pb-2.5">
                <div className="flex flex-wrap items-center gap-2.5">
                  <span
                    data-testid={`admin-return-rma-number-${rma.rma_id}`}
                    className="font-mono font-extrabold text-sm text-[#FA661C]"
                  >
                    {rma.rma_number}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-[#EFF6FF] text-[#1D4ED8] border border-[#93C5FD]">
                    {rma.status}
                  </span>
                  {rma.requested_action && (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-white border border-[#EAE3DC] text-[#6B6058]">
                      Action: {rma.requested_action}
                    </span>
                  )}
                  <span className="font-bold text-[#1A2420]">
                    Parcel #{rma.vendor_order_id} •{' '}
                    {rma.warehouse_id
                      ? `Hub #${rma.warehouse_id}`
                      : 'No Hub Resolved'}
                  </span>
                </div>

                <button
                  type="button"
                  data-testid={`open-admin-return-receive-btn-${rma.rma_id}`}
                  onClick={() => openAdminReceive(rma)}
                  className="px-3.5 py-1.5 rounded-xl bg-[#FA661C] hover:bg-[#E0530B] text-white font-bold cursor-pointer"
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

              {/* Inline Admin Receive & Inspect Form */}
              {selectedRma?.rma_id === rma.rma_id && (
                <form
                  onSubmit={handleOpenAdminConfirm}
                  data-testid={`admin-return-receive-form-${rma.rma_id}`}
                  className="p-4 rounded-2xl border-2 border-[#FA661C] bg-white space-y-4"
                  noValidate
                >
                  <div className="flex items-center justify-between border-b border-[#EAE3DC] pb-2.5">
                    <h4 className="font-['Outfit'] font-extrabold text-sm text-[#1A2420]">
                      Receive &amp; Inspect {rma.rma_number} (RMA #{rma.rma_id})
                    </h4>
                    <button
                      type="button"
                      onClick={() => setSelectedRma(null)}
                      className="text-[#6B6058] hover:text-[#1A2420] cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {receiveGeneralError && (
                    <div
                      role="alert"
                      data-testid="admin-return-receive-general-error"
                      className="p-3 rounded-xl border border-[#FCA5A5] bg-[#FFF3F3] text-[#991B1B] font-bold"
                    >
                      {receiveGeneralError}
                    </div>
                  )}

                  {receiveFieldErrors.lines && (
                    <div
                      role="alert"
                      data-testid="admin-return-receive-error-lines"
                      className="p-3 rounded-xl border border-[#FCA5A5] bg-[#FFF3F3] text-[#DC2626] font-bold"
                    >
                      {receiveFieldErrors.lines}
                    </div>
                  )}

                  <div>
                    <label
                      htmlFor={`admin-return-warehouse-${rma.rma_id}`}
                      className="block font-bold text-[#1A2420] mb-1"
                    >
                      Hub Warehouse ID *
                    </label>
                    <input
                      id={`admin-return-warehouse-${rma.rma_id}`}
                      type="number"
                      min="1"
                      data-testid="admin-return-warehouse-id-input"
                      value={receiveWarehouseId}
                      onChange={(e) => {
                        setReceiveWarehouseId(e.target.value);
                        setReceiveFieldErrors((fe) => ({
                          ...fe,
                          warehouse_id: '',
                        }));
                      }}
                      placeholder="e.g. 20"
                      className="w-44 px-3 py-2 rounded-xl border border-[#EAE3DC] font-mono"
                    />
                    {receiveFieldErrors.warehouse_id && (
                      <p
                        data-testid="admin-return-error-warehouse_id"
                        className="mt-1 text-[11px] font-semibold text-[#DC2626]"
                      >
                        {receiveFieldErrors.warehouse_id}
                      </p>
                    )}
                  </div>

                  <div className="overflow-x-auto rounded-xl border border-[#EAE3DC]">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-[#FFF3EC]/60 border-b border-[#EAE3DC] text-[#6B6058] uppercase text-[10px]">
                          <th className="py-2 px-3">SKU</th>
                          <th className="py-2 px-3 text-right">Expected</th>
                          <th className="py-2 px-3 text-right">Received *</th>
                          <th className="py-2 px-3">Inspection Result *</th>
                          <th className="py-2 px-3">Note</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#EAE3DC]">
                        {(rma.lines || []).map((line) => {
                          const rriId = line.return_request_item_id;
                          const inp = lineInputs[rriId] || {
                            received_quantity: '',
                            inspection_result: 'resellable',
                            note: '',
                          };
                          return (
                            <tr key={rriId}>
                              <td className="py-2 px-3 font-mono font-bold">
                                {line.sku} (#{rriId})
                              </td>
                              <td className="py-2 px-3 text-right font-mono font-bold">
                                {line.expected_quantity}
                              </td>
                              <td className="py-2 px-3 text-right">
                                <input
                                  type="number"
                                  min="0"
                                  max={line.expected_quantity}
                                  data-testid={`admin-return-qty-input-${rriId}`}
                                  value={inp.received_quantity}
                                  onChange={(e) =>
                                    setLineInputs((prev) => ({
                                      ...prev,
                                      [rriId]: {
                                        ...prev[rriId],
                                        received_quantity: e.target.value,
                                      },
                                    }))
                                  }
                                  className="w-20 px-2 py-1 rounded-lg border border-[#EAE3DC] font-mono text-right"
                                />
                              </td>
                              <td className="py-2 px-3">
                                <select
                                  data-testid={`admin-return-result-select-${rriId}`}
                                  value={inp.inspection_result}
                                  onChange={(e) =>
                                    setLineInputs((prev) => ({
                                      ...prev,
                                      [rriId]: {
                                        ...prev[rriId],
                                        inspection_result: e.target.value,
                                      },
                                    }))
                                  }
                                  className="px-2 py-1 rounded-lg border border-[#EAE3DC] bg-white font-bold"
                                >
                                  {RETURN_INSPECTION_RESULTS.map((opt) => (
                                    <option key={opt.value} value={opt.value}>
                                      {opt.label}
                                    </option>
                                  ))}
                                </select>
                              </td>
                              <td className="py-2 px-3">
                                <input
                                  type="text"
                                  data-testid={`admin-return-note-input-${rriId}`}
                                  value={inp.note}
                                  onChange={(e) =>
                                    setLineInputs((prev) => ({
                                      ...prev,
                                      [rriId]: {
                                        ...prev[rriId],
                                        note: e.target.value,
                                      },
                                    }))
                                  }
                                  placeholder="Optional note"
                                  className="w-full px-2 py-1 rounded-lg border border-[#EAE3DC]"
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
                      data-testid="open-admin-return-confirm-dialog-btn"
                      disabled={receiveSubmitting}
                      className="px-5 py-2 rounded-xl bg-[#FA661C] hover:bg-[#E0530B] text-white font-bold cursor-pointer disabled:opacity-50"
                    >
                      Record Return &amp; Inspection
                    </button>
                  </div>
                </form>
              )}
            </div>
          ))}
        </div>
      )}

      {/* NATIVE <dialog>: CONFIRM ADMIN RETURN RECEIPT */}
      {confirmDialogOpen && selectedRma && (
        <dialog
          open
          data-testid="admin-return-confirm-dialog"
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
                aria-label="Close admin return receipt confirmation dialog"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div
              data-testid="admin-return-confirm-notice"
              className="p-3.5 rounded-xl bg-[#FFFBEB] border border-[#F59E0B] text-xs font-bold text-[#92400E]"
            >
              This records the goods. It does not refund the customer; an admin handles the refund.
            </div>

            {receiveGeneralError && (
              <div
                role="alert"
                data-testid="admin-return-dialog-error"
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
                data-testid="confirm-admin-return-receive-submit-btn"
                disabled={receiveSubmitting}
                onClick={handleConfirmAdminReceive}
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
    </div>
  );
}



