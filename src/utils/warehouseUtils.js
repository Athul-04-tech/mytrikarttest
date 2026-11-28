/**
 * Shared utilities for Warehouse Phase 1 & Phase 2 screens.
 * Handles error extraction (without raw field keys) and exact string formatting
 * for quantities, dimensions (cm), and weights (kg).
 */

export const STORAGE_REQUEST_STATUSES = [
  { value: 'requested', label: 'Requested' },
  { value: 'accepted', label: 'Accepted' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'in_transit', label: 'In Transit' },
  { value: 'received', label: 'Received' },
  { value: 'discrepancy', label: 'Discrepancy' },
  { value: 'mismatch', label: 'Measurement Mismatch' },
  { value: 'recall_pending', label: 'Recall Pending' },
  { value: 'recalled', label: 'Recalled' },
  { value: 'closed', label: 'Closed' },
  { value: 'cancelled', label: 'Cancelled' },
];

export const STATUS_LABELS = {
  requested: 'Requested',
  accepted: 'Accepted',
  rejected: 'Rejected',
  in_transit: 'In Transit',
  received: 'Received',
  discrepancy: 'Discrepancy',
  mismatch: 'Measurement Mismatch',
  recall_pending: 'Recall Pending',
  recalled: 'Recalled',
  closed: 'Closed',
  cancelled: 'Cancelled',
};

/**
 * Single source of truth for valid storage-request actions by status and role,
 * confirmed against MytrikartBCK/warehouse/services.py.
 *
 * Status table:
 * - requested: manager Accept or Reject; seller Cancel
 * - accepted: seller Dispatch (courier, tracking); manager Decline
 * - in_transit: manager Receive; manager Decline
 * - received: manager Close; manager Decline
 * - discrepancy: seller Acknowledge or Dispute; manager Resolve (after the seller responds); manager Decline
 * - mismatch: manager Decline
 * - recall_pending: manager Record handback ('recall')
 * - rejected, cancelled, closed, recalled: no actions
 */
export function getValidStorageRequestActions(
  status,
  role,
  sellerDiscrepancyAction = 'pending'
) {
  const normalizedRole =
    role === 'vendor' || role === 'seller' ? 'seller' : role;

  if (normalizedRole === 'seller') {
    switch (status) {
      case 'requested':
        return ['cancel'];
      case 'accepted':
        return ['dispatch'];
      case 'discrepancy':
        if (
          !sellerDiscrepancyAction ||
          sellerDiscrepancyAction === 'pending'
        ) {
          return ['acknowledge', 'dispute'];
        }
        return [];
      default:
        return [];
    }
  }

  if (normalizedRole === 'warehouse_manager' || normalizedRole === 'manager') {
    switch (status) {
      case 'requested':
        return ['accept', 'reject'];
      case 'accepted':
        return ['decline'];
      case 'in_transit':
        return ['receive', 'decline'];
      case 'received':
        return ['close', 'decline'];
      case 'discrepancy':
        if (
          sellerDiscrepancyAction === 'acknowledged' ||
          sellerDiscrepancyAction === 'disputed'
        ) {
          return ['resolve', 'decline'];
        }
        return ['decline'];
      case 'mismatch':
        return ['decline'];
      case 'recall_pending':
        return ['recall'];
      default:
        return [];
    }
  }

  return [];
}

export const DISCREPANCY_ACTION_LABELS = {
  none: 'No Discrepancy',
  pending: 'Pending Seller Response',
  acknowledged: 'Seller Acknowledged',
  disputed: 'Seller Disputed',
};

export const MOVEMENT_TYPE_LABELS = {
  inbound_received: 'Inbound Received (Good)',
  inbound_damaged: 'Inbound Quarantined (Damaged)',
  discrepancy_adjustment: 'Discrepancy Adjustment',
  compensating_adjustment: 'Compensating Adjustment',
  receipt: 'Receipt',
  quarantine: 'Quarantine',
  reserve: 'Reserve Sellable Quantity',
  release_reservation: 'Release Reserved Quantity',
  reclassification: 'Reclassify Quarantined Stock',
  pick_dispatch: 'Picked Stock Dispatched',
};

export const SHIPMENT_STATUSES = [
  { value: 'awaiting_pick', label: 'Awaiting Pick' },
  { value: 'picking', label: 'Picking' },
  { value: 'picked', label: 'Picked' },
  { value: 'packed', label: 'Packed' },
  { value: 'shipped', label: 'Shipped' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'exception', label: 'Exception' },
  { value: 'cancelled', label: 'Cancelled' },
];

export const SHIPMENT_STATUS_LABELS = {
  awaiting_pick: 'Awaiting Pick',
  picking: 'Picking',
  picked: 'Picked',
  packed: 'Packed',
  shipped: 'Shipped',
  delivered: 'Delivered',
  exception: 'Exception',
  cancelled: 'Cancelled',
};

export const SHIPMENT_EVENT_LABELS = {
  picking_started: 'Picking started',
  pick_confirmed: 'Pick confirmed',
  short_pick: 'Short pick exception',
  packed: 'Packed',
  label_generated: 'Label generated',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

export const FULFILMENT_STAGE_LABELS = {
  awaiting_dispatch_to_hub:
    'Waiting for the seller to send it to our warehouse',
  in_transit_to_hub: 'On its way to our warehouse',
  received_at_hub: 'Received at our warehouse',
  packed: 'Packed',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

export function formatFulfilmentStageLabel(stageCode) {
  if (stageCode === null || stageCode === undefined || stageCode === '') {
    return '';
  }
  if (Object.prototype.hasOwnProperty.call(FULFILMENT_STAGE_LABELS, stageCode)) {
    return FULFILMENT_STAGE_LABELS[stageCode];
  }
  return String(stageCode);
}

export const HANDOVER_STATUS_LABELS = {
  awaiting_dispatch: 'Awaiting Dispatch',
  in_transit: 'In Transit',
  received: 'Received',
  rejected: 'Rejected',
  cancelled: 'Cancelled',
  overdue: 'Overdue',
};

export function formatHandoverStatusLabel(status) {
  if (!status) return '—';
  if (HANDOVER_STATUS_LABELS[status]) return HANDOVER_STATUS_LABELS[status];
  return String(status);
}

export function getHandoverStatusBadgeClass(status) {
  switch (status) {
    case 'awaiting_dispatch':
      return 'bg-[#FEF3C7] text-[#92400E] border border-[#FCD34D]';
    case 'in_transit':
      return 'bg-[#EFF6FF] text-[#1D4ED8] border border-[#93C5FD]';
    case 'received':
      return 'bg-[#ECFDF5] text-[#065F46] border border-[#6EE7B7]';
    case 'rejected':
    case 'overdue':
      return 'bg-[#FFF3F3] text-[#991B1B] border border-[#FCA5A5]';
    case 'cancelled':
      return 'bg-[#F9FAFB] text-[#6B7280] border border-[#E5E7EB]';
    default:
      return 'bg-[#F3F4F6] text-[#374151] border border-[#D1D5DB]';
  }
}

export function isHandoverMarkedOverdueByServer(handover) {
  if (!handover || typeof handover !== 'object') return false;
  return (
    handover.is_overdue === true ||
    handover.overdue === true ||
    handover.status === 'overdue'
  );
}

export const HANDOVER_LINE_CONDITIONS = [
  { value: 'good', label: 'Good' },
  { value: 'damaged', label: 'Damaged' },
  { value: 'wrong_item', label: 'Wrong item' },
  { value: 'missing', label: 'Missing' },
];

export const RETURN_INSPECTION_RESULTS = [
  { value: 'resellable', label: 'Resellable' },
  { value: 'damaged', label: 'Damaged' },
  { value: 'wrong_item', label: 'Wrong item' },
  { value: 'missing', label: 'Missing' },
];

export const RETURN_INSPECTION_LABELS = {
  resellable: 'Resellable',
  damaged: 'Damaged',
  wrong_item: 'Wrong item',
  missing: 'Missing',
};

export function formatReturnInspectionLabel(result) {
  if (!result) return '—';
  if (Object.prototype.hasOwnProperty.call(RETURN_INSPECTION_LABELS, result)) {
    return RETURN_INSPECTION_LABELS[result];
  }
  return String(result);
}

export const RETURN_DESTINATION_LABELS = {
  lot: 'Shelf (Verified available lot)',
  quarantine_lot: 'Quarantine (Never sold)',
  seller_handback: 'Handed back to seller',
  none: 'No stock change',
};

export function formatReturnDestinationLabel(dest) {
  if (!dest) return '—';
  if (Object.prototype.hasOwnProperty.call(RETURN_DESTINATION_LABELS, dest)) {
    return RETURN_DESTINATION_LABELS[dest];
  }
  return String(dest);
}

export function getReturnDestinationBadgeClass(dest) {
  switch (dest) {
    case 'lot':
      return 'bg-[#ECFDF5] text-[#065F46] border border-[#6EE7B7]';
    case 'quarantine_lot':
      return 'bg-[#FFF3F3] text-[#991B1B] border border-[#FCA5A5]';
    case 'seller_handback':
      return 'bg-[#F3E8FF] text-[#6B21A8] border border-[#D8B4FE]';
    case 'none':
    default:
      return 'bg-[#F3F4F6] text-[#374151] border border-[#D1D5DB]';
  }
}

export const REFUND_BREAKDOWN_LABELS = {
  items_including_tax: 'Items (including tax)',
  item_tax: 'Item tax',
  coupon_discount_share: 'Coupon discount share',
  packaging_fee_including_tax: 'Packaging fee (including tax)',
  delivery_fee_including_tax: 'Delivery fee (including tax)',
};

export function formatRefundBreakdownLabel(key) {
  if (!key) return '';
  if (Object.prototype.hasOwnProperty.call(REFUND_BREAKDOWN_LABELS, key)) {
    return REFUND_BREAKDOWN_LABELS[key];
  }
  return String(key);
}

export function formatShipmentStatusLabel(status) {
  if (!status) return '—';
  if (SHIPMENT_STATUS_LABELS[status]) return SHIPMENT_STATUS_LABELS[status];
  return String(status).replace(/_/g, ' ');
}

export function getShipmentStatusBadgeClass(status) {
  switch (status) {
    case 'awaiting_pick':
      return 'bg-[#FEF3C7] text-[#92400E] border border-[#FCD34D]';
    case 'picking':
      return 'bg-[#EFF6FF] text-[#1D4ED8] border border-[#93C5FD]';
    case 'picked':
      return 'bg-[#F0FDFA] text-[#0F766E] border border-[#5EEAD4]';
    case 'packed':
      return 'bg-[#F3E8FF] text-[#6B21A8] border border-[#D8B4FE]';
    case 'shipped':
      return 'bg-[#EFF6FF] text-[#1E40AF] border border-[#93C5FD]';
    case 'delivered':
      return 'bg-[#ECFDF5] text-[#065F46] border border-[#6EE7B7]';
    case 'exception':
      return 'bg-[#FFF3F3] text-[#991B1B] border border-[#FCA5A5]';
    default:
      return 'bg-[#F3F4F6] text-[#374151] border border-[#D1D5DB]';
  }
}

export function formatOrderAgeSeconds(seconds) {
  if (seconds === null || seconds === undefined) return '—';
  const sec = Number(seconds);
  if (Number.isNaN(sec) || sec < 0) return String(seconds);
  if (sec < 60) return `${sec}s`;
  const mins = Math.floor(sec / 60);
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  const remMins = mins % 60;
  if (hrs < 24) return `${hrs}h ${remMins}m`;
  const days = Math.floor(hrs / 24);
  const remHrs = hrs % 24;
  return `${days}d ${remHrs}h`;
}

/**
 * Checks whether a storage request is eligible to display the seller's
 * "Confirm goods received back" action based on server status fields.
 * Eligible when status is 'recalled' (or declined after dispatch into 'recall_pending')
 * and handback_confirmed_at is not yet set.
 */
export function canSellerConfirmHandback(storageRequest) {
  if (!storageRequest || typeof storageRequest !== 'object') return false;
  if (storageRequest.handback_confirmed_at) return false;
  if (storageRequest.status === 'recalled') return true;
  if (
    storageRequest.status === 'recall_pending' &&
    Boolean(storageRequest.dispatched_at)
  ) {
    return true;
  }
  return false;
}

export const RATE_CARD_STATUSES = [
  { value: 'draft', label: 'Draft' },
  { value: 'submitted', label: 'Submitted' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'superseded', label: 'Superseded' },
];

export const RATE_CARD_STATUS_LABELS = {
  draft: 'Draft',
  submitted: 'Submitted',
  approved: 'Approved',
  rejected: 'Rejected',
  superseded: 'Superseded',
};

export function formatRateCardStatusLabel(status) {
  if (!status) return '—';
  if (RATE_CARD_STATUS_LABELS[status]) return RATE_CARD_STATUS_LABELS[status];
  return String(status).replace(/_/g, ' ');
}

export function getRateCardStatusBadgeClass(status) {
  switch (status) {
    case 'draft':
      return 'bg-[#FEF3C7] text-[#92400E] border border-[#FCD34D]';
    case 'submitted':
      return 'bg-[#EFF6FF] text-[#1D4ED8] border border-[#93C5FD]';
    case 'approved':
      return 'bg-[#ECFDF5] text-[#065F46] border border-[#6EE7B7]';
    case 'rejected':
      return 'bg-[#FFF3F3] text-[#991B1B] border border-[#FCA5A5]';
    case 'superseded':
      return 'bg-[#F3F4F6] text-[#374151] border border-[#D1D5DB]';
    default:
      return 'bg-[#F3F4F6] text-[#374151] border border-[#D1D5DB]';
  }
}

export function formatStorageStatusLabel(status) {
  if (!status) return '—';
  if (STATUS_LABELS[status]) return STATUS_LABELS[status];
  const found = STORAGE_REQUEST_STATUSES.find((s) => s.value === status);
  if (found) return found.label;
  return String(status).replace(/_/g, ' ');
}

export function getStorageStatusBadgeClass(status) {
  switch (status) {
    case 'requested':
      return 'bg-[#EFF6FF] text-[#1D4ED8] border-[#93C5FD]';
    case 'accepted':
      return 'bg-[#F0FDFA] text-[#0F766E] border-[#5EEAD4]';
    case 'in_transit':
      return 'bg-[#FEF3C7] text-[#92400E] border-[#FCD34D]';
    case 'received':
      return 'bg-[#ECFDF5] text-[#065F46] border-[#6EE7B7]';
    case 'discrepancy':
    case 'mismatch':
      return 'bg-[#FFF3F3] text-[#991B1B] border-[#FCA5A5]';
    case 'recall_pending':
      return 'bg-[#FEF3C7] text-[#92400E] border-[#F59E0B]';
    case 'recalled':
      return 'bg-[#F3E8FF] text-[#6B21A8] border-[#D8B4FE]';
    case 'closed':
      return 'bg-[#F3F4F6] text-[#374151] border-[#D1D5DB]';
    case 'rejected':
    case 'cancelled':
      return 'bg-[#F9FAFB] text-[#6B7280] border-[#E5E7EB]';
    default:
      return 'bg-[#F3F4F6] text-[#374151] border-[#D1D5DB]';
  }
}

export const getStatusBadgeClass = getStorageStatusBadgeClass;

/**
 * Checks whether a server money string is present and non-zero (e.g. "30.15")
 * without using browser money math.
 */
export function hasNonZeroMoneyString(val) {
  if (val === null || val === undefined) return false;
  const trimmed = String(val).trim();
  if (!trimmed) return false;
  return !/^[-+]?0+(\.0+)?$/.test(trimmed);
}

export function formatAttributesSnapshot(attrs) {
  if (!attrs || typeof attrs !== 'object') return '';
  const entries = Object.entries(attrs).filter(
    ([, val]) => val !== null && val !== undefined && String(val).trim() !== ''
  );
  if (entries.length === 0) return '';
  return entries.map(([k, v]) => `${k}: ${v}`).join(', ');
}

export function formatDimensionsCm(lengthStr, widthStr, heightStr) {
  if (
    lengthStr === null ||
    lengthStr === undefined ||
    widthStr === null ||
    widthStr === undefined ||
    heightStr === null ||
    heightStr === undefined
  ) {
    return '—';
  }
  return `${String(lengthStr)} × ${String(widthStr)} × ${String(heightStr)} cm`;
}

export function formatWeightKg(weightStr) {
  if (weightStr === null || weightStr === undefined || weightStr === '') {
    return '—';
  }
  return `${String(weightStr)} kg`;
}

export function formatDateTime(iso) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return String(iso);
  }
}

function flattenErrorValue(val) {
  if (val === null || val === undefined) return '';
  if (typeof val === 'string') return val;
  if (Array.isArray(val)) {
    return val
      .map((item) => flattenErrorValue(item))
      .filter(Boolean)
      .join(' ');
  }
  if (typeof val === 'object') {
    return Object.values(val)
      .map((v) => flattenErrorValue(v))
      .filter(Boolean)
      .join(' ');
  }
  return String(val);
}

function mapItemErrorStringToRow(str, itemErrors, itemIds = []) {
  const match = String(str).match(/^Item\s+(\d+):\s*(.+)$/i);
  if (!match) return;
  const rawNum = Number(match[1]);
  const msgText = String(str);
  let targetIdx = -1;
  if (Array.isArray(itemIds) && itemIds.length > 0) {
    const foundById = itemIds.findIndex((id) => Number(id) === rawNum);
    if (foundById !== -1) {
      targetIdx = foundById;
    }
  }
  if (targetIdx === -1) {
    if (rawNum >= 1 && (!itemIds.length || rawNum <= Math.max(itemIds.length, 1))) {
      targetIdx = rawNum - 1;
    } else {
      targetIdx = rawNum;
    }
  }
  if (targetIdx < 0) targetIdx = 0;
  const existing = itemErrors[targetIdx] || {};
  existing._error = existing._error ? `${existing._error} ${msgText}` : msgText;
  if (/location/i.test(msgText) && !existing.location) {
    existing.location = msgText;
  }
  if (/good and damaged|counted/i.test(msgText) && !existing.counted_quantity) {
    existing.counted_quantity = msgText;
  }
  if (/accepted quantity/i.test(msgText) && !existing.accepted_quantity) {
    existing.accepted_quantity = msgText;
  }
  if (/variant/i.test(msgText) && !existing.variant_id) {
    existing.variant_id = msgText;
  }
  if (/quantity must be greater/i.test(msgText) && !existing.quantity) {
    existing.quantity = msgText;
  }
  if (/measurement|dimensions and weight/i.test(msgText) && !existing.declared_length_cm) {
    existing.declared_length_cm = msgText;
  }
  itemErrors[targetIdx] = existing;
}

/**
 * Extracts fieldErrors, itemErrors, and top-level formError/generalError from an ApiError,
 * never prefixing raw backend field keys.
 */
export function parseWarehouseApiError(err, knownFields = [], itemIds = []) {
  const fieldErrors = {};
  const itemErrors = [];
  const generalMessages = [];
  const data = err?.data;

  if (data && typeof data === 'object' && !Array.isArray(data)) {
    const source =
      data.detail &&
      typeof data.detail === 'object' &&
      !Array.isArray(data.detail)
        ? data.detail
        : data;

    for (const [key, val] of Object.entries(source)) {
      if (key === 'items') {
        if (Array.isArray(val)) {
          const hasDictItem = val.some(
            (entry) => entry && typeof entry === 'object' && !Array.isArray(entry)
          );
          if (hasDictItem) {
            val.forEach((entry, idx) => {
              if (entry && typeof entry === 'object' && !Array.isArray(entry)) {
                const rowErr = {};
                Object.entries(entry).forEach(([k, v]) => {
                  rowErr[k] = flattenErrorValue(v);
                });
                itemErrors[idx] = rowErr;
              } else if (entry) {
                itemErrors[idx] = { _error: flattenErrorValue(entry) };
              }
            });
          } else {
            val.forEach((entry) => {
              if (typeof entry === 'string') {
                mapItemErrorStringToRow(entry, itemErrors, itemIds);
              }
            });
          }
          const text = flattenErrorValue(val);
          if (text) {
            fieldErrors.items = text;
            generalMessages.push(text);
          }
          continue;
        } else if (typeof val === 'string') {
          mapItemErrorStringToRow(val, itemErrors, itemIds);
          fieldErrors.items = val;
          generalMessages.push(val);
          continue;
        }
      }

      const text = flattenErrorValue(val);
      if (!text) continue;

      if (
        key === 'detail' ||
        key === 'non_field_errors' ||
        key === '__all__' ||
        key === 'message'
      ) {
        generalMessages.push(text);
      } else if (knownFields.includes(key)) {
        fieldErrors[key] = text;
      } else {
        fieldErrors[key] = text;
        generalMessages.push(text);
      }
    }
  } else if (Array.isArray(data)) {
    const text = flattenErrorValue(data);
    if (text) generalMessages.push(text);
  } else if (typeof data === 'string' && data.trim()) {
    generalMessages.push(data.trim());
  }

  if (generalMessages.length === 0 && Object.keys(fieldErrors).length === 0) {
    generalMessages.push(err?.message || 'Request failed. Please try again.');
  }

  const combined = generalMessages.join(' ');
  return {
    fieldErrors,
    itemErrors,
    formError: combined,
    generalError: combined,
  };
}

/**
 * Extracts fieldErrors, bandErrors (for size_bands rows), packingErrors (for packing_items rows),
 * packingLineErrors (for estimate packing rows), and generalError from an ApiError
 * without exposing raw JSON keys.
 */
export function parseRateCardApiError(err, knownFields = []) {
  const fieldErrors = {};
  const bandErrors = [];
  const packingErrors = [];
  const packingLineErrors = [];
  const generalMessages = [];
  const data = err?.data;

  const extractCollectionErrors = (arr, targetRows) => {
    const hasDictRow = arr.some(
      (entry) => entry && typeof entry === 'object' && !Array.isArray(entry) && Object.keys(entry).length > 0
    );
    if (hasDictRow) {
      arr.forEach((entry, idx) => {
        if (entry && typeof entry === 'object' && !Array.isArray(entry)) {
          const rowErr = {};
          Object.entries(entry).forEach(([k, v]) => {
            const msg = flattenErrorValue(v);
            if (msg) rowErr[k] = msg;
          });
          targetRows[idx] = rowErr;
        } else if (entry) {
          targetRows[idx] = { _error: flattenErrorValue(entry) };
        }
      });
      return true;
    }
    return false;
  };

  if (data && typeof data === 'object' && !Array.isArray(data)) {
    const source =
      data.detail &&
      typeof data.detail === 'object' &&
      !Array.isArray(data.detail)
        ? data.detail
        : data;

    for (const [key, val] of Object.entries(source)) {
      if (key === 'size_bands' && Array.isArray(val)) {
        const hadRowDicts = extractCollectionErrors(val, bandErrors);
        const text = flattenErrorValue(val);
        if (!hadRowDicts && text) {
          fieldErrors.size_bands = text;
          generalMessages.push(text);
        } else if (hadRowDicts) {
          fieldErrors.size_bands = 'Please correct the highlighted size band fields.';
        }
        continue;
      }

      if (key === 'packing_items' && Array.isArray(val)) {
        const hadRowDicts = extractCollectionErrors(val, packingErrors);
        const text = flattenErrorValue(val);
        if (!hadRowDicts && text) {
          fieldErrors.packing_items = text;
          generalMessages.push(text);
        } else if (hadRowDicts) {
          fieldErrors.packing_items = 'Please correct the highlighted packing item fields.';
        }
        continue;
      }

      if (key === 'packing' && Array.isArray(val)) {
        const hadRowDicts = extractCollectionErrors(val, packingLineErrors);
        const text = flattenErrorValue(val);
        if (text) {
          fieldErrors.packing = text;
          if (!hadRowDicts) generalMessages.push(text);
        }
        continue;
      }

      const text = flattenErrorValue(val);
      if (!text) continue;

      if (
        key === 'detail' ||
        key === 'non_field_errors' ||
        key === '__all__' ||
        key === 'message'
      ) {
        generalMessages.push(text);
      } else if (knownFields.includes(key)) {
        fieldErrors[key] = text;
      } else {
        fieldErrors[key] = text;
        generalMessages.push(text);
      }
    }
  } else if (Array.isArray(data)) {
    const text = flattenErrorValue(data);
    if (text) generalMessages.push(text);
  } else if (typeof data === 'string' && data.trim()) {
    generalMessages.push(data.trim());
  }

  if (
    generalMessages.length === 0 &&
    Object.keys(fieldErrors).length === 0 &&
    bandErrors.length === 0 &&
    packingErrors.length === 0 &&
    packingLineErrors.length === 0
  ) {
    generalMessages.push(err?.message || 'Request failed. Please try again.');
  }

  const combined = generalMessages.join(' ');
  return {
    fieldErrors,
    bandErrors,
    packingErrors,
    packingLineErrors,
    formError: combined,
    generalError: combined,
  };
}
