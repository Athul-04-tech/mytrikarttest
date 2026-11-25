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
  closed: 'Closed',
  cancelled: 'Cancelled',
};

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
};

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
      return 'bg-[#FFF3F3] text-[#991B1B] border-[#FCA5A5]';
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

/**
 * Extracts fieldErrors, itemErrors, and top-level formError/generalError from an ApiError,
 * never prefixing raw backend field keys.
 */
export function parseWarehouseApiError(err, knownFields = []) {
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
      if (key === 'items' && Array.isArray(val)) {
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
        }
        const text = flattenErrorValue(val);
        if (text) {
          fieldErrors.items = text;
          generalMessages.push(text);
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
