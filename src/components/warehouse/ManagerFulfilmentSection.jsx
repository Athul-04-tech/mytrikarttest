import React, { useState, useEffect, useCallback } from 'react';
import {
  Package,
  Truck,
  Printer,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  RefreshCw,
  ArrowLeft,
  Clock,
  Boxes,
  X,
} from 'lucide-react';
import { apiRequest } from '../../utils/api';
import {
  SHIPMENT_STATUS_LABELS,
  SHIPMENT_EVENT_LABELS,
  formatShipmentStatusLabel,
  getShipmentStatusBadgeClass,
  formatOrderAgeSeconds,
  formatDateTime,
  parseWarehouseApiError,
} from '../../utils/warehouseUtils';

const SHIPMENT_STEPS = [
  { key: 'picking', label: '1. Picking' },
  { key: 'picked', label: '2. Picked' },
  { key: 'packed', label: '3. Packed' },
  { key: 'shipped', label: '4. Shipped' },
  { key: 'delivered', label: '5. Delivered' },
];

export default function ManagerFulfilmentSection({
  initialShipmentId = null,
  onSelectShipmentId,
  onFeatureDisabled,
  onUnauthorized,
}) {
  // Feature switch state: when 404 is returned ("Warehouse pick and pack is disabled."), hide quietly
  const [featureDisabled, setFeatureDisabled] = useState(false);

  // Queue state
  const [queueRows, setQueueRows] = useState([]);
  const [queueLoading, setQueueLoading] = useState(true);
  const [queueError, setQueueError] = useState('');
  const [startingVendorOrderId, setStartingVendorOrderId] = useState(null);

  // Active shipment detail state
  const [activeShipmentId, setActiveShipmentId] = useState(initialShipmentId);
  const [shipment, setShipment] = useState(null);
  const [shipmentLoading, setShipmentLoading] = useState(false);
  const [shipmentError, setShipmentError] = useState('');
  const [actionBanner, setActionBanner] = useState('');

  // Per-line pick inputs & in-flight state
  const [pickInputs, setPickInputs] = useState({});
  const [lineFieldErrors, setLineFieldErrors] = useState({});
  const [pickingLineId, setPickingLineId] = useState(null);

  // Short-pick native <dialog> state
  const [shortPickModal, setShortPickModal] = useState(null); // { line, pickedQuantity }
  const [shortPickReason, setShortPickReason] = useState('');
  const [shortPickFieldErrors, setShortPickFieldErrors] = useState({});
  const [shortPickGeneralError, setShortPickGeneralError] = useState('');
  const [shortPickSubmitting, setShortPickSubmitting] = useState(false);

  // Pack form state
  const [packForm, setPackForm] = useState({
    weight_kg: '',
    length_cm: '',
    width_cm: '',
    height_cm: '',
    seal_number: '',
    packaging_note: '',
  });
  const [packFieldErrors, setPackFieldErrors] = useState({});
  const [packGeneralError, setPackGeneralError] = useState('');
  const [packSubmitting, setPackSubmitting] = useState(false);

  // Label print view state (fetched with user's auth token)
  const [labelHtml, setLabelHtml] = useState('');
  const [labelLoading, setLabelLoading] = useState(false);
  const [labelError, setLabelError] = useState('');

  // Ship form & confirmation <dialog> state
  const [shipForm, setShipForm] = useState({
    courier_name: '',
    tracking_number: '',
  });
  const [shipFieldErrors, setShipFieldErrors] = useState({});
  const [shipGeneralError, setShipGeneralError] = useState('');
  const [shipConfirmOpen, setShipConfirmOpen] = useState(false);
  const [shipSubmitting, setShipSubmitting] = useState(false);

  // Deliver confirmation <dialog> state
  const [deliverConfirmOpen, setDeliverConfirmOpen] = useState(false);
  const [deliverNote, setDeliverNote] = useState('');
  const [deliverError, setDeliverError] = useState('');
  const [deliverSubmitting, setDeliverSubmitting] = useState(false);

  useEffect(() => {
    setActiveShipmentId(initialShipmentId);
  }, [initialShipmentId]);

  const handle404DisableCheck = useCallback(
    (err) => {
      const detail = String(err?.data?.detail || err?.message || '');
      if (
        err?.status === 404 &&
        (/disabled/i.test(detail) || detail === 'HTTP 404 Error' || !activeShipmentId)
      ) {
        setFeatureDisabled(true);
        if (onFeatureDisabled) onFeatureDisabled();
        return true;
      }
      return false;
    },
    [activeShipmentId, onFeatureDisabled]
  );

  const initShipmentForms = useCallback((shp) => {
    if (!shp) return;
    const nextPick = {};
    (shp.lines || []).forEach((line) => {
      nextPick[line.id] =
        line.picked_quantity !== null &&
        line.picked_quantity !== undefined &&
        line.picked_quantity > 0
          ? String(line.picked_quantity)
          : String(line.expected_quantity ?? '');
    });
    setPickInputs(nextPick);
    setLineFieldErrors({});

    if (shp.package) {
      setPackForm({
        weight_kg: String(shp.package.weight_kg ?? ''),
        length_cm: String(shp.package.length_cm ?? ''),
        width_cm: String(shp.package.width_cm ?? ''),
        height_cm: String(shp.package.height_cm ?? ''),
        seal_number: String(shp.package.seal_number ?? ''),
        packaging_note: String(shp.package.packaging_note ?? ''),
      });
    } else {
      setPackForm({
        weight_kg: '',
        length_cm: '',
        width_cm: '',
        height_cm: '',
        seal_number: '',
        packaging_note: '',
      });
    }
    setPackFieldErrors({});
    setPackGeneralError('');

    setShipForm({
      courier_name: shp.courier_name || '',
      tracking_number: shp.tracking_number || '',
    });
    setShipFieldErrors({});
    setShipGeneralError('');
  }, []);

  const fetchQueue = useCallback(async () => {
    setQueueLoading(true);
    setQueueError('');
    try {
      const data = await apiRequest('/api/warehouse/shipments/queue/');
      const rows = Array.isArray(data) ? data : data?.results || [];
      setQueueRows(rows);
      setFeatureDisabled(false);
    } catch (err) {
      if (err?.status === 401 && onUnauthorized) {
        await onUnauthorized();
        return;
      }
      if (handle404DisableCheck(err)) {
        return;
      }
      setQueueError(
        err?.data?.detail || err?.message || 'Failed to load pick & pack queue.'
      );
    } finally {
      setQueueLoading(false);
    }
  }, [handle404DisableCheck, onUnauthorized]);

  const fetchShipmentDetail = useCallback(
    async (shipmentId, preserveInputs = false) => {
      if (!shipmentId) return null;
      setShipmentLoading(true);
      setShipmentError('');
      try {
        const data = await apiRequest(`/api/warehouse/shipments/${shipmentId}/`);
        setShipment(data);
        if (!preserveInputs) {
          initShipmentForms(data);
        }
        return data;
      } catch (err) {
        if (err?.status === 401 && onUnauthorized) {
          await onUnauthorized();
          return null;
        }
        if (
          err?.status === 404 &&
          /disabled/i.test(String(err?.data?.detail || ''))
        ) {
          setFeatureDisabled(true);
          if (onFeatureDisabled) onFeatureDisabled();
          return null;
        }
        setShipmentError(
          err?.data?.detail ||
            err?.message ||
            `Failed to load shipment #${shipmentId}.`
        );
        return null;
      } finally {
        setShipmentLoading(false);
      }
    },
    [initShipmentForms, onFeatureDisabled, onUnauthorized]
  );

  useEffect(() => {
    fetchQueue();
  }, [fetchQueue]);

  useEffect(() => {
    if (activeShipmentId) {
      fetchShipmentDetail(activeShipmentId);
    } else {
      setShipment(null);
      setLabelHtml('');
    }
  }, [activeShipmentId, fetchShipmentDetail]);

  // If feature is disabled (404), hide quietly
  if (featureDisabled) {
    return null;
  }

  const openShipment = (shipmentId) => {
    setActiveShipmentId(shipmentId);
    setActionBanner('');
    setShipmentError('');
    setLabelHtml('');
    setLabelError('');
    if (onSelectShipmentId) onSelectShipmentId(shipmentId);
  };

  const backToQueue = () => {
    setActiveShipmentId(null);
    setShipment(null);
    setActionBanner('');
    setShipmentError('');
    setLabelHtml('');
    setLabelError('');
    if (onSelectShipmentId) onSelectShipmentId(null);
    fetchQueue();
  };

  // Start Picking (`POST /api/warehouse/vendor-orders/<vendor_order_id>/start-picking/`)
  const handleStartPicking = async (row) => {
    if (startingVendorOrderId !== null) return;
    if (row.shipment?.id) {
      openShipment(row.shipment.id);
      return;
    }
    setStartingVendorOrderId(row.vendor_order_id);
    setQueueError('');
    setActionBanner('');
    try {
      const created = await apiRequest(
        `/api/warehouse/vendor-orders/${row.vendor_order_id}/start-picking/`,
        {
          method: 'POST',
          body: JSON.stringify({}),
        }
      );
      setShipment(created);
      initShipmentForms(created);
      setActiveShipmentId(created.id);
      if (onSelectShipmentId) onSelectShipmentId(created.id);
      setActionBanner(`Started picking for shipment #${created.id}.`);
    } catch (err) {
      const parsed = parseWarehouseApiError(err);
      setQueueError(
        parsed.generalError ||
          err?.data?.detail ||
          'Failed to start picking for this order.'
      );
    } finally {
      setStartingVendorOrderId(null);
    }
  };

  // Submit full or short pick (`POST /api/warehouse/shipments/<pk>/lines/<line_id>/pick/`)
  const executePickConfirm = async (line, pickedQtyNum, exceptionReason = '') => {
    if (!shipment || pickingLineId !== null || shortPickSubmitting) return false;
    setPickingLineId(line.id);
    setLineFieldErrors((prev) => ({ ...prev, [line.id]: {} }));
    setShipmentError('');
    setActionBanner('');

    try {
      const updated = await apiRequest(
        `/api/warehouse/shipments/${shipment.id}/lines/${line.id}/pick/`,
        {
          method: 'POST',
          body: JSON.stringify({
            picked_quantity: pickedQtyNum,
            exception_reason: exceptionReason,
          }),
        }
      );
      setShipment(updated);
      initShipmentForms(updated);
      setActionBanner(
        `Confirmed pick for ${line.sku} (${pickedQtyNum} of ${line.expected_quantity}).`
      );
      return true;
    } catch (err) {
      const parsed = parseWarehouseApiError(err, [
        'picked_quantity',
        'exception_reason',
      ]);
      if (shortPickModal) {
        setShortPickFieldErrors(parsed.fieldErrors);
        setShortPickGeneralError(parsed.generalError);
      } else {
        setLineFieldErrors((prev) => ({
          ...prev,
          [line.id]: parsed.fieldErrors,
        }));
        if (Object.keys(parsed.fieldErrors).length === 0 || err?.status === 409) {
          setShipmentError(parsed.generalError);
        }
      }
      return false;
    } finally {
      setPickingLineId(null);
    }
  };

  const handleClickConfirmLinePick = async (line) => {
    if (pickingLineId !== null) return;
    const rawVal = pickInputs[line.id] ?? '';
    const pickedQtyNum = rawVal === '' ? NaN : Number(rawVal);

    if (Number.isNaN(pickedQtyNum) || pickedQtyNum < 0) {
      setLineFieldErrors((prev) => ({
        ...prev,
        [line.id]: { picked_quantity: 'Enter a valid non-negative integer.' },
      }));
      return;
    }

    // If picked quantity is less than expected quantity, open native <dialog> for short pick reason
    if (pickedQtyNum < line.expected_quantity) {
      setShortPickModal({ line, pickedQuantity: pickedQtyNum });
      setShortPickReason('');
      setShortPickFieldErrors({});
      setShortPickGeneralError('');
      return;
    }

    await executePickConfirm(line, pickedQtyNum, '');
  };

  const handleConfirmShortPickDialog = async (e) => {
    e.preventDefault();
    if (!shortPickModal || shortPickSubmitting) return;
    setShortPickFieldErrors({});
    setShortPickGeneralError('');
    setShortPickSubmitting(true);
    try {
      const updated = await apiRequest(
        `/api/warehouse/shipments/${shipment.id}/lines/${shortPickModal.line.id}/pick/`,
        {
          method: 'POST',
          body: JSON.stringify({
            picked_quantity: shortPickModal.pickedQuantity,
            exception_reason: shortPickReason,
          }),
        }
      );
      setShortPickModal(null);
      setShipment(updated);
      initShipmentForms(updated);
      setActionBanner(
        `Short pick recorded for ${shortPickModal.line.sku}. Shipment is now in Exception status.`
      );
    } catch (err) {
      const parsed = parseWarehouseApiError(err, [
        'picked_quantity',
        'exception_reason',
      ]);
      setShortPickFieldErrors(parsed.fieldErrors);
      if (Object.keys(parsed.fieldErrors).length === 0 || err?.status === 409) {
        setShortPickGeneralError(parsed.generalError);
      }
    } finally {
      setShortPickSubmitting(false);
    }
  };

  // Pack shipment (`POST /api/warehouse/shipments/<pk>/pack/`)
  const handlePackSubmit = async (e) => {
    e.preventDefault();
    if (!shipment || packSubmitting) return;
    setPackFieldErrors({});
    setPackGeneralError('');
    setShipmentError('');
    setActionBanner('');
    setPackSubmitting(true);

    try {
      const updated = await apiRequest(
        `/api/warehouse/shipments/${shipment.id}/pack/`,
        {
          method: 'POST',
          body: JSON.stringify({
            weight_kg: packForm.weight_kg,
            length_cm: packForm.length_cm,
            width_cm: packForm.width_cm,
            height_cm: packForm.height_cm,
            seal_number: packForm.seal_number,
            packaging_note: packForm.packaging_note,
          }),
        }
      );
      setShipment(updated);
      initShipmentForms(updated);
      setActionBanner(`Shipment #${updated.id} packed with seal ${packForm.seal_number}.`);
    } catch (err) {
      const parsed = parseWarehouseApiError(err, [
        'weight_kg',
        'length_cm',
        'width_cm',
        'height_cm',
        'seal_number',
        'packaging_note',
      ]);
      setPackFieldErrors(parsed.fieldErrors);
      if (Object.keys(parsed.fieldErrors).length === 0 || err?.status === 409) {
        setPackGeneralError(parsed.generalError);
      }
    } finally {
      setPackSubmitting(false);
    }
  };

  // Fetch printable shipping label HTML with user's auth token (`GET /api/warehouse/shipments/<pk>/label/`)
  const handlePrintLabel = async () => {
    if (!shipment || labelLoading) return;
    setLabelLoading(true);
    setLabelError('');
    try {
      const res = await apiRequest(
        `/api/warehouse/shipments/${shipment.id}/label/`
      );
      // apiRequest parses non-JSON text responses as { message: text }
      const htmlString =
        typeof res === 'string'
          ? res
          : typeof res?.message === 'string'
          ? res.message
          : '';
      setLabelHtml(htmlString);

      // If window.open is available, open print window and call print()
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
      setLabelError(
        parsed.generalError ||
          err?.data?.detail ||
          'Failed to fetch shipping label.'
      );
    } finally {
      setLabelLoading(false);
    }
  };

  // Open Ship confirmation dialog
  const handleOpenShipDialog = (e) => {
    e.preventDefault();
    setShipFieldErrors({});
    setShipGeneralError('');
    setShipConfirmOpen(true);
  };

  // Confirm Ship (`POST /api/warehouse/shipments/<pk>/ship/`)
  const handleConfirmShip = async () => {
    if (!shipment || shipSubmitting) return;
    setShipFieldErrors({});
    setShipGeneralError('');
    setShipmentError('');
    setActionBanner('');
    setShipSubmitting(true);

    try {
      const updated = await apiRequest(
        `/api/warehouse/shipments/${shipment.id}/ship/`,
        {
          method: 'POST',
          body: JSON.stringify({
            courier_name: shipForm.courier_name,
            tracking_number: shipForm.tracking_number,
          }),
        }
      );
      setShipConfirmOpen(false);
      setShipment(updated);
      initShipmentForms(updated);
      setActionBanner(
        `Shipment #${updated.id} dispatched via ${updated.courier_name} (${updated.tracking_number}).`
      );
    } catch (err) {
      const parsed = parseWarehouseApiError(err, [
        'courier_name',
        'tracking_number',
      ]);
      setShipFieldErrors(parsed.fieldErrors);
      setShipGeneralError(parsed.generalError);
      if (Object.keys(parsed.fieldErrors).length > 0) {
        setShipConfirmOpen(false);
      }
    } finally {
      setShipSubmitting(false);
    }
  };

  // Confirm Deliver (`POST /api/warehouse/shipments/<pk>/deliver/`)
  const handleConfirmDeliver = async (e) => {
    if (e) e.preventDefault();
    if (!shipment || deliverSubmitting) return;
    setDeliverError('');
    setShipmentError('');
    setActionBanner('');
    setDeliverSubmitting(true);

    try {
      const updated = await apiRequest(
        `/api/warehouse/shipments/${shipment.id}/deliver/`,
        {
          method: 'POST',
          body: JSON.stringify({ note: deliverNote }),
        }
      );
      setDeliverConfirmOpen(false);
      setDeliverNote('');
      setShipment(updated);
      initShipmentForms(updated);
      setActionBanner(`Shipment #${updated.id} marked delivered.`);
    } catch (err) {
      const parsed = parseWarehouseApiError(err, ['note']);
      setDeliverError(
        parsed.generalError ||
          err?.data?.detail ||
          'Failed to mark shipment delivered.'
      );
    } finally {
      setDeliverSubmitting(false);
    }
  };

  const canPrintLabel =
    shipment &&
    ['packed', 'shipped', 'delivered'].includes(shipment.status);

  return (
    <section
      data-testid="manager-fulfilment-section"
      className="space-y-5 text-xs"
    >
      {/* Feedback & Error Banners */}
      {actionBanner && (
        <div
          data-testid="fulfilment-action-banner"
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
            className="text-xs underline cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* VIEW 1: PICK AND PACK QUEUE */}
      {!activeShipmentId ? (
        <div className="bg-white rounded-3xl border border-[#EAE3DC] p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#EAE3DC] pb-4">
            <div>
              <div className="flex items-center space-x-2">
                <Package className="w-4 h-4 text-[#FA661C]" />
                <span className="text-[11px] font-black uppercase tracking-wider text-[#FA661C]">
                  Stored-Stock Order Fulfilment
                </span>
              </div>
              <h2 className="font-['Outfit'] font-extrabold text-lg sm:text-xl text-[#1A2420] mt-0.5">
                Pick &amp; Pack Queue
              </h2>
              <p className="text-xs text-[#6B6058]">
                Paid orders allocated to verified stock lots at this warehouse.
              </p>
            </div>

            <button
              type="button"
              onClick={fetchQueue}
              disabled={queueLoading}
              data-testid="refresh-pick-queue-btn"
              className="px-3.5 py-2 rounded-xl border border-[#EAE3DC] bg-white hover:bg-[#FFF3EC] font-bold text-[#1A2420] flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 text-[#FA661C] ${
                  queueLoading ? 'animate-spin' : ''
                }`}
              />
              <span>Refresh Queue</span>
            </button>
          </div>

          {queueError && (
            <div
              role="alert"
              data-testid="pick-queue-error"
              className="p-4 rounded-2xl border border-[#FCA5A5] bg-[#FFF3F3] text-[#991B1B] font-bold flex items-center space-x-2"
            >
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{queueError}</span>
            </div>
          )}

          {queueLoading ? (
            <div
              data-testid="pick-queue-loading"
              className="py-12 text-center text-[#6B6058] font-semibold"
            >
              Loading pick &amp; pack queue…
            </div>
          ) : queueRows.length === 0 ? (
            <div
              data-testid="pick-queue-empty"
              className="py-12 text-center border border-dashed border-[#EAE3DC] rounded-2xl space-y-2"
            >
              <Boxes className="w-8 h-8 text-[#FA661C] mx-auto opacity-80" />
              <p className="font-bold text-sm text-[#1A2420]">
                No orders ready to pick
              </p>
              <p className="text-[#6B6058]">
                Paid orders stored at your warehouse will appear here automatically.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {queueRows.map((row) => {
                const isStarting =
                  startingVendorOrderId === row.vendor_order_id;
                const existingShp = row.shipment;
                return (
                  <div
                    key={row.vendor_order_id}
                    data-testid={`queue-order-card-${row.vendor_order_id}`}
                    className="p-4 rounded-2xl border border-[#EAE3DC] bg-[#FFF8F2]/50 space-y-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#EAE3DC] pb-2.5">
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="font-mono font-extrabold text-sm text-[#FA661C]">
                          Vendor Order #{row.vendor_order_id}
                        </span>
                        <span className="font-mono text-xs text-[#1A2420] font-bold">
                          Order {row.order_number}
                        </span>
                        <span
                          data-testid={`queue-order-age-${row.vendor_order_id}`}
                          className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-white border border-[#EAE3DC] text-[11px] font-mono text-[#6B6058]"
                        >
                          <Clock className="w-3 h-3 text-[#FA661C]" />
                          <span>
                            Age: {formatOrderAgeSeconds(row.order_age_seconds)}
                          </span>
                        </span>
                        {existingShp && (
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${getShipmentStatusBadgeClass(
                              existingShp.status
                            )}`}
                          >
                            {formatShipmentStatusLabel(existingShp.status)} (
                            {existingShp.label_number})
                          </span>
                        )}
                      </div>

                      <div>
                        {existingShp ? (
                          <button
                            type="button"
                            data-testid={`open-shipment-btn-${row.vendor_order_id}`}
                            onClick={() => openShipment(existingShp.id)}
                            className="px-4 py-2 rounded-xl bg-[#1A2420] hover:bg-[#334139] text-white font-bold cursor-pointer"
                          >
                            Open Shipment #{existingShp.id}
                          </button>
                        ) : (
                          <button
                            type="button"
                            data-testid={`start-picking-btn-${row.vendor_order_id}`}
                            disabled={startingVendorOrderId !== null}
                            onClick={() => handleStartPicking(row)}
                            className="px-4 py-2 rounded-xl bg-[#FA661C] hover:bg-[#E0530B] text-white font-bold cursor-pointer disabled:opacity-50"
                          >
                            {isStarting ? 'Starting…' : 'Start picking'}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Items & Lot/Location Breakdown */}
                    <div className="overflow-x-auto bg-white rounded-xl border border-[#EAE3DC]">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="border-b border-[#EAE3DC] text-[#6B6058] uppercase text-[10px]">
                            <th className="py-2 px-3">Product</th>
                            <th className="py-2 px-3">SKU</th>
                            <th className="py-2 px-3 text-right">Quantity</th>
                            <th className="py-2 px-3">Lot / Location</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#EAE3DC]/60">
                          {(row.items || []).map((item) => (
                            <tr
                              key={item.order_item_id}
                              data-testid={`queue-item-row-${item.order_item_id}`}
                            >
                              <td className="py-2 px-3 font-bold text-[#1A2420]">
                                {item.product_name}
                              </td>
                              <td className="py-2 px-3 font-mono text-[#FA661C]">
                                {item.sku}
                              </td>
                              <td className="py-2 px-3 text-right font-mono font-bold">
                                {item.quantity}
                              </td>
                              <td className="py-2 px-3 font-mono text-[11px] text-[#1A2420]">
                                {Array.isArray(item.lots) && item.lots.length > 0
                                  ? item.lots
                                      .map(
                                        (l) =>
                                          `Lot #${l.lot_id} • ${l.location} (Qty: ${l.quantity})`
                                      )
                                      .join(', ')
                                  : '—'}
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
        </div>
      ) : (
        /* VIEW 2: SHIPMENT DETAIL & STEP WORKFLOW */
        <div
          data-testid="manager-shipment-detail"
          className="bg-white rounded-3xl border border-[#EAE3DC] p-5 sm:p-6 shadow-xs space-y-6"
        >
          {/* Top Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#EAE3DC] pb-4">
            <div className="flex items-center space-x-3">
              <button
                type="button"
                data-testid="shipment-back-to-queue-btn"
                onClick={backToQueue}
                className="p-2 rounded-xl border border-[#EAE3DC] hover:bg-[#FFF3EC] text-[#1A2420] cursor-pointer"
                title="Back to Pick & Pack Queue"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div>
                <div className="flex items-center space-x-2.5 flex-wrap">
                  <h2 className="font-['Outfit'] font-extrabold text-lg sm:text-xl text-[#1A2420]">
                    Shipment #{shipment?.id || activeShipmentId}
                  </h2>
                  {shipment && (
                    <span
                      data-testid="shipment-status-badge"
                      className={`px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase ${getShipmentStatusBadgeClass(
                        shipment.status
                      )}`}
                    >
                      {formatShipmentStatusLabel(shipment.status)}
                    </span>
                  )}
                  {shipment?.label_number && (
                    <span
                      data-testid="shipment-label-number"
                      className="font-mono text-xs font-bold text-[#FA661C] bg-[#FFF3EC] px-2.5 py-0.5 rounded-lg"
                    >
                      {shipment.label_number}
                    </span>
                  )}
                </div>
                {shipment && (
                  <p className="text-[11px] text-[#6B6058] mt-0.5">
                    Order {shipment.order_number} • Vendor Order #
                    {shipment.vendor_order_id} • Warehouse #
                    {shipment.warehouse_id}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {canPrintLabel && (
                <button
                  type="button"
                  data-testid="shipment-print-label-btn"
                  disabled={labelLoading}
                  onClick={handlePrintLabel}
                  className="px-4 py-2 rounded-xl bg-[#1A2420] hover:bg-[#334139] text-white font-bold flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Printer className="w-3.5 h-3.5 text-[#FF811A]" />
                  <span>{labelLoading ? 'Loading label…' : 'Print label'}</span>
                </button>
              )}

              <button
                type="button"
                data-testid="shipment-refresh-btn"
                disabled={shipmentLoading}
                onClick={() => fetchShipmentDetail(activeShipmentId, true)}
                className="px-3.5 py-2 rounded-xl border border-[#EAE3DC] bg-white hover:bg-[#FFF3EC] font-bold text-[#1A2420] flex items-center space-x-1.5 cursor-pointer"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 text-[#FA661C] ${
                    shipmentLoading ? 'animate-spin' : ''
                  }`}
                />
                <span>Refresh</span>
              </button>
            </div>
          </div>

          {shipmentError && (
            <div
              role="alert"
              data-testid="shipment-detail-error"
              className="p-4 rounded-2xl border border-[#FCA5A5] bg-[#FFF3F3] text-[#991B1B] font-bold flex items-center space-x-2"
            >
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{shipmentError}</span>
            </div>
          )}

          {labelError && (
            <div
              role="alert"
              data-testid="shipment-label-error"
              className="p-3.5 rounded-2xl border border-[#FCA5A5] bg-[#FFF3F3] text-[#991B1B] font-bold"
            >
              {labelError}
            </div>
          )}

          {shipmentLoading && !shipment ? (
            <div className="py-12 text-center text-[#6B6058]">
              Loading shipment details…
            </div>
          ) : shipment ? (
            <>
              {/* Step Display driven strictly by server status */}
              <div
                data-testid="shipment-step-bar"
                className="p-4 rounded-2xl bg-[#FFF8F2] border border-[#EAE3DC] space-y-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  {SHIPMENT_STEPS.map((st) => {
                    const stepOrder = [
                      'picking',
                      'picked',
                      'packed',
                      'shipped',
                      'delivered',
                    ];
                    const currentIdx = stepOrder.indexOf(shipment.status);
                    const thisIdx = stepOrder.indexOf(st.key);
                    const isCurrent = shipment.status === st.key;
                    const isDone = currentIdx > thisIdx;

                    return (
                      <div
                        key={st.key}
                        data-testid={`shipment-step-${st.key}`}
                        data-active={isCurrent ? 'true' : 'false'}
                        className={`flex-1 min-w-[110px] py-2 px-3 rounded-xl border text-center font-bold transition-all ${
                          isCurrent
                            ? 'bg-[#FA661C] text-white border-[#FA661C] shadow-xs'
                            : isDone
                            ? 'bg-[#ECFDF5] text-[#065F46] border-[#6EE7B7]'
                            : 'bg-white text-[#6B6058] border-[#EAE3DC]'
                        }`}
                      >
                        {st.label}
                      </div>
                    );
                  })}

                  {shipment.status === 'exception' && (
                    <div
                      data-testid="shipment-step-exception"
                      data-active="true"
                      className="flex-1 min-w-[120px] py-2 px-3 rounded-xl border bg-[#DC2626] text-white border-[#DC2626] text-center font-extrabold"
                    >
                      Exception (Held)
                    </div>
                  )}
                </div>
              </div>

              {/* Exception Callout Banner when status === 'exception' */}
              {shipment.status === 'exception' && (
                <div
                  data-testid="shipment-exception-banner"
                  role="alert"
                  className="p-4 rounded-2xl border-2 border-[#DC2626] bg-[#FFF3F3] text-[#991B1B] space-y-1.5"
                >
                  <div className="flex items-center space-x-2 font-extrabold text-sm">
                    <AlertTriangle className="w-5 h-5 text-[#DC2626] shrink-0" />
                    <span>
                      Short Pick Exception — Held for Admin Action
                    </span>
                  </div>
                  <p className="text-xs">
                    The order is held for admin action; stock has not been changed.
                  </p>
                  {(shipment.lines || [])
                    .filter((l) => l.exception_reason)
                    .map((l) => (
                      <p
                        key={l.id}
                        data-testid={`shipment-exception-reason-${l.id}`}
                        className="font-bold text-xs pt-1"
                      >
                        {l.sku}: {l.exception_reason} (Picked {l.picked_quantity}{' '}
                        of {l.expected_quantity})
                      </p>
                    ))}
                </div>
              )}

              {/* STEP 1: PICKING LINES TABLE */}
              <div className="space-y-3">
                <h3 className="font-['Outfit'] font-extrabold text-base text-[#1A2420]">
                  Shipment Lines &amp; Lot Reservations
                </h3>
                <div className="overflow-x-auto rounded-2xl border border-[#EAE3DC]">
                  <table
                    data-testid="shipment-lines-table"
                    className="w-full text-left border-collapse text-xs"
                  >
                    <thead>
                      <tr className="bg-[#FFF3EC]/60 border-b border-[#EAE3DC] text-[#6B6058] uppercase text-[10px]">
                        <th className="py-2.5 px-3">Product &amp; SKU</th>
                        <th className="py-2.5 px-3">Lot / Location</th>
                        <th className="py-2.5 px-3 text-right">Expected Qty</th>
                        <th className="py-2.5 px-3 text-right">Picked Qty</th>
                        <th className="py-2.5 px-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#EAE3DC]">
                      {(shipment.lines || []).map((line) => {
                        const lErr = lineFieldErrors[line.id] || {};
                        const isLineConfirmed =
                          line.picked_quantity === line.expected_quantity &&
                          !line.exception_reason &&
                          shipment.status !== 'picking';
                        const canPickLine = shipment.status === 'picking';

                        return (
                          <tr
                            key={line.id}
                            data-testid={`shipment-line-row-${line.id}`}
                          >
                            <td className="py-3 px-3">
                              <div className="font-bold text-[#1A2420]">
                                {line.product_name}
                              </div>
                              <div className="font-mono text-[11px] text-[#FA661C]">
                                {line.sku} • Order Item #{line.order_item_id}
                              </div>
                              {line.exception_reason && (
                                <div
                                  data-testid={`line-exception-text-${line.id}`}
                                  className="mt-1 text-[11px] font-bold text-[#DC2626]"
                                >
                                  Exception: {line.exception_reason}
                                </div>
                              )}
                            </td>
                            <td className="py-3 px-3 font-mono text-[11px]">
                              {Array.isArray(line.lot_reservations) &&
                              line.lot_reservations.length > 0
                                ? line.lot_reservations
                                    .map(
                                      (lr) =>
                                        `Lot #${lr.lot_id} • ${lr.location} (Qty: ${lr.quantity}, ${lr.reservation_status})`
                                    )
                                    .join(', ')
                                : '—'}
                            </td>
                            <td
                              data-testid={`line-expected-qty-${line.id}`}
                              className="py-3 px-3 text-right font-mono font-bold text-sm"
                            >
                              {line.expected_quantity}
                            </td>
                            <td className="py-3 px-3 text-right">
                              {canPickLine ? (
                                <div className="inline-block w-28 text-left">
                                  <input
                                    type="number"
                                    min="0"
                                    max={line.expected_quantity}
                                    data-testid={`line-pick-input-${line.id}`}
                                    aria-label={`Picked quantity for ${line.sku}`}
                                    value={pickInputs[line.id] ?? ''}
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      setPickInputs((prev) => ({
                                        ...prev,
                                        [line.id]: val,
                                      }));
                                      setLineFieldErrors((prev) => ({
                                        ...prev,
                                        [line.id]: {},
                                      }));
                                    }}
                                    className="w-full px-2.5 py-1.5 rounded-xl border border-[#EAE3DC] font-mono text-right"
                                  />
                                  {lErr.picked_quantity && (
                                    <p
                                      data-testid={`line-pick-error-${line.id}`}
                                      className="text-[10px] font-semibold text-[#DC2626] mt-0.5"
                                    >
                                      {lErr.picked_quantity}
                                    </p>
                                  )}
                                </div>
                              ) : (
                                <span
                                  data-testid={`line-picked-qty-${line.id}`}
                                  className="font-mono font-bold text-sm"
                                >
                                  {line.picked_quantity}
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-3 text-right">
                              {canPickLine ? (
                                <button
                                  type="button"
                                  data-testid={`confirm-pick-btn-${line.id}`}
                                  disabled={pickingLineId !== null}
                                  onClick={() => handleClickConfirmLinePick(line)}
                                  className="px-3.5 py-1.5 rounded-xl bg-[#FA661C] hover:bg-[#E0530B] text-white font-bold cursor-pointer disabled:opacity-50"
                                >
                                  {pickingLineId === line.id
                                    ? 'Confirming…'
                                    : 'Confirm'}
                                </button>
                              ) : isLineConfirmed ? (
                                <span className="text-[#059669] font-bold">
                                  Picked ✓
                                </span>
                              ) : (
                                <span className="text-[#6B6058]">—</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* STEP 2: PACK FORM (active when status === 'picked'; read-only summary when package exists) */}
              {shipment.status === 'picked' && (
                <form
                  onSubmit={handlePackSubmit}
                  data-testid="shipment-pack-form"
                  className="p-5 rounded-2xl border border-[#EAE3DC] bg-[#FFF8F2]/60 space-y-4"
                  noValidate
                >
                  <div className="border-b border-[#EAE3DC] pb-2.5">
                    <h3 className="font-['Outfit'] font-extrabold text-base text-[#1A2420]">
                      Pack Shipment
                    </h3>
                    <p className="text-[11px] text-[#6B6058]">
                      Enter package weight, dimensions, and tamper-evident seal number.
                    </p>
                  </div>

                  {packGeneralError && (
                    <div
                      role="alert"
                      data-testid="pack-general-error"
                      className="p-3 rounded-xl border border-[#FCA5A5] bg-[#FFF3F3] text-[#991B1B] font-bold"
                    >
                      {packGeneralError}
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                    <div>
                      <label
                        htmlFor="pack-weight"
                        className="block font-bold text-[#1A2420] mb-1"
                      >
                        Weight (kg) *
                      </label>
                      <input
                        id="pack-weight"
                        type="text"
                        data-testid="pack-weight-input"
                        value={packForm.weight_kg}
                        onChange={(e) => {
                          setPackForm((p) => ({
                            ...p,
                            weight_kg: e.target.value,
                          }));
                          setPackFieldErrors((fe) => ({ ...fe, weight_kg: '' }));
                        }}
                        placeholder="e.g. 1.250"
                        className="w-full px-3 py-2 rounded-xl border border-[#EAE3DC] bg-white font-mono"
                      />
                      {packFieldErrors.weight_kg && (
                        <p
                          data-testid="pack-error-weight_kg"
                          className="mt-1 text-[11px] font-semibold text-[#DC2626]"
                        >
                          {packFieldErrors.weight_kg}
                        </p>
                      )}
                    </div>

                    <div>
                      <label
                        htmlFor="pack-length"
                        className="block font-bold text-[#1A2420] mb-1"
                      >
                        Length (cm) *
                      </label>
                      <input
                        id="pack-length"
                        type="text"
                        data-testid="pack-length-input"
                        value={packForm.length_cm}
                        onChange={(e) => {
                          setPackForm((p) => ({
                            ...p,
                            length_cm: e.target.value,
                          }));
                          setPackFieldErrors((fe) => ({ ...fe, length_cm: '' }));
                        }}
                        placeholder="e.g. 30.00"
                        className="w-full px-3 py-2 rounded-xl border border-[#EAE3DC] bg-white font-mono"
                      />
                      {packFieldErrors.length_cm && (
                        <p
                          data-testid="pack-error-length_cm"
                          className="mt-1 text-[11px] font-semibold text-[#DC2626]"
                        >
                          {packFieldErrors.length_cm}
                        </p>
                      )}
                    </div>

                    <div>
                      <label
                        htmlFor="pack-width"
                        className="block font-bold text-[#1A2420] mb-1"
                      >
                        Width (cm) *
                      </label>
                      <input
                        id="pack-width"
                        type="text"
                        data-testid="pack-width-input"
                        value={packForm.width_cm}
                        onChange={(e) => {
                          setPackForm((p) => ({
                            ...p,
                            width_cm: e.target.value,
                          }));
                          setPackFieldErrors((fe) => ({ ...fe, width_cm: '' }));
                        }}
                        placeholder="e.g. 20.00"
                        className="w-full px-3 py-2 rounded-xl border border-[#EAE3DC] bg-white font-mono"
                      />
                      {packFieldErrors.width_cm && (
                        <p
                          data-testid="pack-error-width_cm"
                          className="mt-1 text-[11px] font-semibold text-[#DC2626]"
                        >
                          {packFieldErrors.width_cm}
                        </p>
                      )}
                    </div>

                    <div>
                      <label
                        htmlFor="pack-height"
                        className="block font-bold text-[#1A2420] mb-1"
                      >
                        Height (cm) *
                      </label>
                      <input
                        id="pack-height"
                        type="text"
                        data-testid="pack-height-input"
                        value={packForm.height_cm}
                        onChange={(e) => {
                          setPackForm((p) => ({
                            ...p,
                            height_cm: e.target.value,
                          }));
                          setPackFieldErrors((fe) => ({ ...fe, height_cm: '' }));
                        }}
                        placeholder="e.g. 15.00"
                        className="w-full px-3 py-2 rounded-xl border border-[#EAE3DC] bg-white font-mono"
                      />
                      {packFieldErrors.height_cm && (
                        <p
                          data-testid="pack-error-height_cm"
                          className="mt-1 text-[11px] font-semibold text-[#DC2626]"
                        >
                          {packFieldErrors.height_cm}
                        </p>
                      )}
                    </div>

                    <div>
                      <label
                        htmlFor="pack-seal"
                        className="block font-bold text-[#1A2420] mb-1"
                      >
                        Seal Number *
                      </label>
                      <input
                        id="pack-seal"
                        type="text"
                        data-testid="pack-seal-input"
                        value={packForm.seal_number}
                        onChange={(e) => {
                          setPackForm((p) => ({
                            ...p,
                            seal_number: e.target.value,
                          }));
                          setPackFieldErrors((fe) => ({
                            ...fe,
                            seal_number: '',
                          }));
                        }}
                        placeholder="e.g. SEAL-2026-001"
                        className="w-full px-3 py-2 rounded-xl border border-[#EAE3DC] bg-white font-mono"
                      />
                      {packFieldErrors.seal_number && (
                        <p
                          data-testid="pack-error-seal_number"
                          className="mt-1 text-[11px] font-semibold text-[#DC2626]"
                        >
                          {packFieldErrors.seal_number}
                        </p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="pack-note"
                      className="block font-bold text-[#1A2420] mb-1"
                    >
                      Packaging Note (optional)
                    </label>
                    <input
                      id="pack-note"
                      type="text"
                      data-testid="pack-note-input"
                      value={packForm.packaging_note}
                      onChange={(e) =>
                        setPackForm((p) => ({
                          ...p,
                          packaging_note: e.target.value,
                        }))
                      }
                      placeholder="Optional packing remarks"
                      className="w-full px-3 py-2 rounded-xl border border-[#EAE3DC] bg-white"
                    />
                    {packFieldErrors.packaging_note && (
                      <p
                        data-testid="pack-error-packaging_note"
                        className="mt-1 text-[11px] font-semibold text-[#DC2626]"
                      >
                        {packFieldErrors.packaging_note}
                      </p>
                    )}
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      data-testid="pack-submit-btn"
                      disabled={packSubmitting}
                      className="px-5 py-2.5 rounded-xl bg-[#FA661C] hover:bg-[#E0530B] text-white font-bold cursor-pointer disabled:opacity-50"
                    >
                      {packSubmitting ? 'Packing…' : 'Confirm Pack'}
                    </button>
                  </div>
                </form>
              )}

              {/* Package summary card when already packed */}
              {shipment.package && (
                <div
                  data-testid="shipment-package-summary"
                  className="p-4 rounded-2xl border border-[#EAE3DC] bg-[#FFF8F2] grid grid-cols-2 sm:grid-cols-4 gap-3"
                >
                  <div>
                    <span className="text-[#6B6058] block text-[10px]">
                      Package Weight
                    </span>
                    <strong className="font-mono">
                      {shipment.package.weight_kg} kg
                    </strong>
                  </div>
                  <div>
                    <span className="text-[#6B6058] block text-[10px]">
                      Dimensions (L × W × H)
                    </span>
                    <strong className="font-mono">
                      {shipment.package.length_cm} × {shipment.package.width_cm}{' '}
                      × {shipment.package.height_cm} cm
                    </strong>
                  </div>
                  <div>
                    <span className="text-[#6B6058] block text-[10px]">
                      Seal Number
                    </span>
                    <strong
                      data-testid="shipment-package-seal"
                      className="font-mono text-[#FA661C]"
                    >
                      {shipment.package.seal_number}
                    </strong>
                  </div>
                  <div>
                    <span className="text-[#6B6058] block text-[10px]">
                      Packaging Note
                    </span>
                    <span>{shipment.package.packaging_note || '—'}</span>
                  </div>
                </div>
              )}

              {/* ISOLATED PRINTABLE LABEL FRAME (shows verbatim HTML returned by server) */}
              {labelHtml && (
                <div
                  data-testid="shipment-label-print-view"
                  className="p-4 rounded-2xl border-2 border-[#1A2420] bg-white space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-sm text-[#1A2420]">
                      Shipping Label Print View ({shipment.label_number})
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        data-testid="trigger-iframe-print-btn"
                        onClick={() => {
                          const frame = document.getElementById(
                            'shipment-label-iframe'
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
                        onClick={() => setLabelHtml('')}
                        className="px-3 py-1.5 rounded-xl border border-[#EAE3DC] text-[#6B6058] font-bold cursor-pointer"
                      >
                        Close Label
                      </button>
                    </div>
                  </div>
                  <iframe
                    id="shipment-label-iframe"
                    data-testid="shipment-label-iframe"
                    title="Warehouse Shipping Label"
                    srcDoc={labelHtml}
                    className="w-full h-96 rounded-xl border border-[#EAE3DC]"
                  />
                </div>
              )}

              {/* STEP 3: SHIP FORM (active only when status === 'packed') */}
              {shipment.status === 'packed' && (
                <form
                  onSubmit={handleOpenShipDialog}
                  data-testid="shipment-ship-form"
                  className="p-5 rounded-2xl border border-[#EAE3DC] bg-[#FFF8F2]/60 space-y-4"
                  noValidate
                >
                  <div className="border-b border-[#EAE3DC] pb-2.5">
                    <h3 className="font-['Outfit'] font-extrabold text-base text-[#1A2420]">
                      Dispatch / Ship Parcel
                    </h3>
                    <p className="text-[11px] text-[#6B6058]">
                      Enter courier name and tracking number to dispatch the packed parcel.
                    </p>
                  </div>

                  {shipGeneralError && (
                    <div
                      role="alert"
                      data-testid="ship-general-error"
                      className="p-3 rounded-xl border border-[#FCA5A5] bg-[#FFF3F3] text-[#991B1B] font-bold"
                    >
                      {shipGeneralError}
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label
                        htmlFor="ship-courier"
                        className="block font-bold text-[#1A2420] mb-1"
                      >
                        Courier Name *
                      </label>
                      <input
                        id="ship-courier"
                        type="text"
                        data-testid="ship-courier-input"
                        value={shipForm.courier_name}
                        onChange={(e) => {
                          setShipForm((s) => ({
                            ...s,
                            courier_name: e.target.value,
                          }));
                          setShipFieldErrors((fe) => ({
                            ...fe,
                            courier_name: '',
                          }));
                        }}
                        placeholder="e.g. BlueDart"
                        className="w-full px-3 py-2 rounded-xl border border-[#EAE3DC] bg-white"
                      />
                      {shipFieldErrors.courier_name && (
                        <p
                          data-testid="ship-error-courier_name"
                          className="mt-1 text-[11px] font-semibold text-[#DC2626]"
                        >
                          {shipFieldErrors.courier_name}
                        </p>
                      )}
                    </div>

                    <div>
                      <label
                        htmlFor="ship-tracking"
                        className="block font-bold text-[#1A2420] mb-1"
                      >
                        Tracking Number *
                      </label>
                      <input
                        id="ship-tracking"
                        type="text"
                        data-testid="ship-tracking-input"
                        value={shipForm.tracking_number}
                        onChange={(e) => {
                          setShipForm((s) => ({
                            ...s,
                            tracking_number: e.target.value,
                          }));
                          setShipFieldErrors((fe) => ({
                            ...fe,
                            tracking_number: '',
                          }));
                        }}
                        placeholder="e.g. BD-TRACK-9001"
                        className="w-full px-3 py-2 rounded-xl border border-[#EAE3DC] bg-white font-mono"
                      />
                      {shipFieldErrors.tracking_number && (
                        <p
                          data-testid="ship-error-tracking_number"
                          className="mt-1 text-[11px] font-semibold text-[#DC2626]"
                        >
                          {shipFieldErrors.tracking_number}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      data-testid="open-ship-confirm-btn"
                      disabled={shipSubmitting}
                      className="px-5 py-2.5 rounded-xl bg-[#FA661C] hover:bg-[#E0530B] text-white font-bold cursor-pointer disabled:opacity-50"
                    >
                      Ship Parcel
                    </button>
                  </div>
                </form>
              )}

              {/* STEP 4: DELIVER ACTION (active only when status === 'shipped') */}
              {(shipment.status === 'shipped' ||
                shipment.status === 'delivered') && (
                <div
                  data-testid="shipment-carrier-summary"
                  className="p-4 rounded-2xl border border-[#EAE3DC] bg-[#EFF6FF]/60 flex flex-wrap items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2 font-bold text-[#1E40AF]">
                      <Truck className="w-4 h-4" />
                      <span>
                        Courier: {shipment.courier_name} • Tracking:{' '}
                        <span className="font-mono">
                          {shipment.tracking_number}
                        </span>
                      </span>
                    </div>
                    <div className="text-[11px] text-[#6B6058]">
                      Shipped at: {formatDateTime(shipment.shipped_at)}
                      {shipment.delivered_at &&
                        ` • Delivered at: ${formatDateTime(
                          shipment.delivered_at
                        )}`}
                    </div>
                  </div>

                  {shipment.status === 'shipped' && (
                    <button
                      type="button"
                      data-testid="open-deliver-confirm-btn"
                      disabled={deliverSubmitting}
                      onClick={() => {
                        setDeliverError('');
                        setDeliverConfirmOpen(true);
                      }}
                      className="px-5 py-2.5 rounded-xl bg-[#059669] hover:bg-[#047857] text-white font-bold cursor-pointer disabled:opacity-50"
                    >
                      Mark Delivered
                    </button>
                  )}
                </div>
              )}

              {/* EVENT HISTORY LIST (from server if present, or lifecycle timestamps from server) */}
              <div
                data-testid="shipment-event-history"
                className="pt-4 border-t border-[#EAE3DC] space-y-3"
              >
                <h3 className="font-['Outfit'] font-extrabold text-sm text-[#1A2420]">
                  Shipment Event History
                </h3>
                {Array.isArray(shipment.events) && shipment.events.length > 0 ? (
                  <div className="divide-y divide-[#EAE3DC] rounded-2xl border border-[#EAE3DC] bg-[#FFF8F2]/40">
                    {shipment.events.map((ev) => (
                      <div
                        key={ev.id}
                        data-testid={`shipment-event-row-${ev.id}`}
                        className="p-3 flex flex-wrap items-center justify-between gap-2 text-xs"
                      >
                        <div>
                          <span className="font-bold text-[#1A2420]">
                            {SHIPMENT_EVENT_LABELS[ev.event] || ev.event}
                          </span>
                          {ev.before_status && (
                            <span className="text-[#6B6058] ml-2 font-mono text-[11px]">
                              ({ev.before_status} → {ev.after_status})
                            </span>
                          )}
                          {ev.note && (
                            <p className="text-[11px] text-[#6B6058] mt-0.5">
                              {ev.note}
                            </p>
                          )}
                        </div>
                        <div className="text-right text-[11px] text-[#6B6058]">
                          {ev.actor_username && (
                            <span className="font-mono font-semibold mr-2">
                              @{ev.actor_username}
                            </span>
                          )}
                          <span>{formatDateTime(ev.occurred_at)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 text-xs">
                    <div className="p-3 rounded-xl border border-[#EAE3DC] bg-[#FFF8F2]/40">
                      <span className="text-[10px] text-[#6B6058] block">
                        Picking Started
                      </span>
                      <strong className="font-mono">
                        {formatDateTime(shipment.created_at)}
                      </strong>
                    </div>
                    {shipment.packed_at && (
                      <div className="p-3 rounded-xl border border-[#EAE3DC] bg-[#FFF8F2]/40">
                        <span className="text-[10px] text-[#6B6058] block">
                          Packed
                        </span>
                        <strong className="font-mono">
                          {formatDateTime(shipment.packed_at)}
                        </strong>
                      </div>
                    )}
                    {shipment.shipped_at && (
                      <div className="p-3 rounded-xl border border-[#EAE3DC] bg-[#FFF8F2]/40">
                        <span className="text-[10px] text-[#6B6058] block">
                          Shipped
                        </span>
                        <strong className="font-mono">
                          {formatDateTime(shipment.shipped_at)}
                        </strong>
                      </div>
                    )}
                    {shipment.delivered_at && (
                      <div className="p-3 rounded-xl border border-[#EAE3DC] bg-[#FFF8F2]/40">
                        <span className="text-[10px] text-[#6B6058] block">
                          Delivered
                        </span>
                        <strong className="font-mono">
                          {formatDateTime(shipment.delivered_at)}
                        </strong>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </>
          ) : null}
        </div>
      )}

      {/* NATIVE <dialog> 1: SHORT PICK CONFIRMATION */}
      {shortPickModal && (
        <dialog
          open
          data-testid="short-pick-dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-[#1A1A1A]/60 backdrop-blur-2xs flex items-center justify-center p-4 w-full h-full m-0 border-0"
        >
          <div className="bg-white rounded-3xl border border-[#EAE3DC] shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#EAE3DC] pb-3">
              <h3 className="font-['Outfit'] font-extrabold text-lg text-[#1A2420]">
                Confirm Short Pick — {shortPickModal.line.sku}
              </h3>
              <button
                type="button"
                onClick={() => setShortPickModal(null)}
                className="p-1 text-[#6B6058] hover:text-[#1A2420] cursor-pointer"
                aria-label="Close short pick dialog"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div
              data-testid="short-pick-warning-text"
              className="p-3.5 rounded-xl bg-[#FFFBEB] border border-[#F59E0B] text-xs font-bold text-[#92400E]"
            >
              The order will be held for admin action; stock is not changed.
            </div>

            <p className="text-xs text-[#6B6058]">
              Expected quantity:{' '}
              <strong>{shortPickModal.line.expected_quantity}</strong> • Picked
              quantity: <strong>{shortPickModal.pickedQuantity}</strong>
            </p>

            {shortPickGeneralError && (
              <div
                role="alert"
                data-testid="short-pick-general-error"
                className="p-3 rounded-xl bg-[#FFF3F3] border border-[#FCA5A5] text-xs text-[#991B1B] font-bold"
              >
                {shortPickGeneralError}
              </div>
            )}

            <form
              onSubmit={handleConfirmShortPickDialog}
              className="space-y-3"
              noValidate
            >
              <div>
                <label
                  htmlFor="short-pick-reason"
                  className="block font-bold text-[#1A2420] mb-1"
                >
                  Short Pick Reason *
                </label>
                <textarea
                  id="short-pick-reason"
                  data-testid="short-pick-reason-input"
                  rows={2}
                  value={shortPickReason}
                  onChange={(e) => {
                    setShortPickReason(e.target.value);
                    setShortPickFieldErrors((fe) => ({
                      ...fe,
                      exception_reason: '',
                    }));
                  }}
                  placeholder="Explain why fewer units were available to pick..."
                  className="w-full px-3 py-2 rounded-xl border border-[#EAE3DC]"
                />
                {shortPickFieldErrors.exception_reason && (
                  <p
                    data-testid="short-pick-error-exception_reason"
                    className="mt-1 text-[11px] font-semibold text-[#DC2626]"
                  >
                    {shortPickFieldErrors.exception_reason}
                  </p>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShortPickModal(null)}
                  className="px-4 py-2 rounded-xl border border-[#EAE3DC] font-bold text-[#6B6058] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  data-testid="short-pick-submit-btn"
                  disabled={shortPickSubmitting}
                  className="px-4 py-2 rounded-xl bg-[#DC2626] hover:bg-[#B91C1C] text-white font-bold cursor-pointer disabled:opacity-50"
                >
                  {shortPickSubmitting
                    ? 'Recording…'
                    : 'Confirm Short Pick'}
                </button>
              </div>
            </form>
          </div>
        </dialog>
      )}

      {/* NATIVE <dialog> 2: SHIP CONFIRMATION */}
      {shipConfirmOpen && (
        <dialog
          open
          data-testid="ship-confirm-dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-[#1A1A1A]/60 backdrop-blur-2xs flex items-center justify-center p-4 w-full h-full m-0 border-0"
        >
          <div className="bg-white rounded-3xl border border-[#EAE3DC] shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#EAE3DC] pb-3">
              <h3 className="font-['Outfit'] font-extrabold text-lg text-[#1A2420]">
                Confirm Shipment Dispatch
              </h3>
              <button
                type="button"
                onClick={() => setShipConfirmOpen(false)}
                className="p-1 text-[#6B6058] hover:text-[#1A2420] cursor-pointer"
                aria-label="Close ship dialog"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div
              data-testid="ship-confirm-warning-text"
              className="p-3.5 rounded-xl bg-[#EFF6FF] border border-[#93C5FD] text-xs font-bold text-[#1E40AF]"
            >
              This takes the goods out of stock and marks the order shipped.
            </div>

            <div className="text-xs space-y-1 text-[#1A2420]">
              <div>
                Courier: <strong>{shipForm.courier_name || '—'}</strong>
              </div>
              <div>
                Tracking Number:{' '}
                <strong className="font-mono">
                  {shipForm.tracking_number || '—'}
                </strong>
              </div>
            </div>

            {shipGeneralError && (
              <div
                role="alert"
                data-testid="ship-dialog-general-error"
                className="p-3 rounded-xl bg-[#FFF3F3] border border-[#FCA5A5] text-xs text-[#991B1B] font-bold"
              >
                {shipGeneralError}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShipConfirmOpen(false)}
                className="px-4 py-2 rounded-xl border border-[#EAE3DC] font-bold text-[#6B6058] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                data-testid="ship-confirm-submit-btn"
                disabled={shipSubmitting}
                onClick={handleConfirmShip}
                className="px-4 py-2 rounded-xl bg-[#FA661C] hover:bg-[#E0530B] text-white font-bold cursor-pointer disabled:opacity-50"
              >
                {shipSubmitting ? 'Shipping…' : 'Confirm Ship'}
              </button>
            </div>
          </div>
        </dialog>
      )}

      {/* NATIVE <dialog> 3: DELIVER CONFIRMATION */}
      {deliverConfirmOpen && (
        <dialog
          open
          data-testid="deliver-confirm-dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-[#1A1A1A]/60 backdrop-blur-2xs flex items-center justify-center p-4 w-full h-full m-0 border-0"
        >
          <div className="bg-white rounded-3xl border border-[#EAE3DC] shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#EAE3DC] pb-3">
              <h3 className="font-['Outfit'] font-extrabold text-lg text-[#1A2420]">
                Confirm Delivery — Shipment #{shipment?.id}
              </h3>
              <button
                type="button"
                onClick={() => setDeliverConfirmOpen(false)}
                className="p-1 text-[#6B6058] hover:text-[#1A2420] cursor-pointer"
                aria-label="Close deliver dialog"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-[#6B6058]">
              Confirm that this shipment has been delivered to the customer.
            </p>

            {deliverError && (
              <div
                role="alert"
                data-testid="deliver-dialog-error"
                className="p-3 rounded-xl bg-[#FFF3F3] border border-[#FCA5A5] text-xs text-[#991B1B] font-bold"
              >
                {deliverError}
              </div>
            )}

            <form
              onSubmit={handleConfirmDeliver}
              className="space-y-3"
              noValidate
            >
              <div>
                <label
                  htmlFor="deliver-note"
                  className="block font-bold text-[#1A2420] mb-1"
                >
                  Delivery Note (optional)
                </label>
                <input
                  id="deliver-note"
                  type="text"
                  data-testid="deliver-note-input"
                  value={deliverNote}
                  onChange={(e) => setDeliverNote(e.target.value)}
                  placeholder="Optional delivery remarks"
                  className="w-full px-3 py-2 rounded-xl border border-[#EAE3DC]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setDeliverConfirmOpen(false)}
                  className="px-4 py-2 rounded-xl border border-[#EAE3DC] font-bold text-[#6B6058] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  data-testid="deliver-confirm-submit-btn"
                  disabled={deliverSubmitting}
                  className="px-4 py-2 rounded-xl bg-[#059669] hover:bg-[#047857] text-white font-bold cursor-pointer disabled:opacity-50"
                >
                  {deliverSubmitting ? 'Saving…' : 'Confirm Delivered'}
                </button>
              </div>
            </form>
          </div>
        </dialog>
      )}
    </section>
  );
}

