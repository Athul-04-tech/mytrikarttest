/**
 * Utilities for Advertising Phase 1, Phase 2 & Phase 3 Part 1 (Storefront, Seller & Admin screens).
 * Handles status labels, badge classes, placement labels, click-rate status labels,
 * ledger entry type labels, click decision/reason labels, authenticated creative image blob URL loading,
 * and server error extraction without raw field keys or browser-side floating-point money calculations.
 */
import { useState, useEffect } from 'react';
import { fetchProtectedFile } from './api';

export const AD_STATUSES = [
  { value: 'created', label: 'Created' },
  { value: 'awaiting_payment', label: 'Awaiting Payment' },
  { value: 'funded', label: 'Funded' },
  { value: 'pending_review', label: 'Pending Review' },
  { value: 'approved', label: 'Approved' },
  { value: 'running', label: 'Running' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'taken_down', label: 'Taken Down' },
  { value: 'ended', label: 'Ended' },
  { value: 'cancelled', label: 'Cancelled' },
];

export const AD_STATUS_LABELS = {
  created: 'Created',
  awaiting_payment: 'Awaiting Payment',
  funded: 'Funded',
  pending_review: 'Pending Review',
  approved: 'Approved',
  running: 'Running',
  rejected: 'Rejected',
  taken_down: 'Taken Down',
  ended: 'Ended',
  cancelled: 'Cancelled',
};

export const AD_REFUNDABLE_STATUSES = [
  'funded',
  'approved',
  'taken_down',
  'ended',
];

export const AD_TYPES = [
  { value: 'picture', label: 'Picture', disabled: false },
  { value: 'video', label: 'Video', disabled: true, badge: 'Coming soon' },
];

export const AD_TYPE_LABELS = {
  picture: 'Picture',
  video: 'Video',
};

export function formatAdTypeLabel(adType) {
  if (!adType) return '—';
  return AD_TYPE_LABELS[adType] || String(adType);
}

export const AD_PLACEMENTS = [
  { value: 'header_banner', label: 'Header Banner' },
  { value: 'product_page_top', label: 'Product Page Top' },
];

export const AD_PLACEMENT_LABELS = {
  header_banner: 'Header Banner',
  product_page_top: 'Product Page Top',
};

export const AD_CREATIVE_MODERATION_LABELS = {
  draft: 'Draft',
  pending_review: 'Pending Review',
  approved: 'Approved',
  rejected: 'Rejected',
};

export const AD_CLICK_RATE_STATUSES = [
  { value: 'approved', label: 'Approved' },
  { value: 'superseded', label: 'Superseded' },
];

export const AD_CLICK_RATE_STATUS_LABELS = {
  approved: 'Approved',
  superseded: 'Superseded',
};

export const AD_PRICE_STATUSES = [
  { value: 'approved', label: 'Approved' },
  { value: 'superseded', label: 'Superseded' },
];

export const AD_PRICE_STATUS_LABELS = {
  approved: 'Approved',
  superseded: 'Superseded',
};

export const AD_PAYMENT_STATUSES = [
  { value: 'recorded', label: 'Recorded' },
  { value: 'reversed', label: 'Reversed' },
];

export const AD_PAYMENT_STATUS_LABELS = {
  recorded: 'Recorded',
  reversed: 'Reversed',
};

/**
 * Plain labels for all 5 AdLedgerEntry.Type values in one central map.
 * Used in both the admin and seller ledger tables, falling back to raw code if unknown.
 */
export const AD_LEDGER_ENTRY_TYPE_LABELS = {
  payment_credit: 'Payment credit',
  payment_reversal: 'Payment reversal',
  payment_refund: 'Refund of unspent money',
  click_charge: 'Click charge',
  click_charge_reversal: 'Click charge reversal',
};

export function formatAdLedgerEntryTypeLabel(entryType, serverLabel) {
  if (!entryType) return serverLabel || '—';
  if (AD_LEDGER_ENTRY_TYPE_LABELS[entryType]) {
    return AD_LEDGER_ENTRY_TYPE_LABELS[entryType];
  }
  return serverLabel || String(entryType);
}

export const AD_CLICK_DECISIONS = [
  { value: 'eligible', label: 'Would be billable' },
  { value: 'billed', label: 'Billed' },
  { value: 'not_billable', label: 'Not billable' },
];

export const AD_CLICK_DECISION_LABELS = {
  eligible: 'Would be billable',
  billed: 'Billed',
  not_billable: 'Not billable',
};

export const AD_CLICK_REASONS = [
  { value: 'eligible', label: 'Would be billable' },
  { value: 'billed', label: 'Billed' },
  { value: 'daily_cap_reached', label: 'Daily billing cap reached' },
  { value: 'expired_token', label: 'Expired token' },
  { value: 'replay', label: 'Token already used' },
  { value: 'too_fast', label: 'Minimum delay not met' },
  { value: 'seller_self_click', label: 'Seller self-click' },
  { value: 'staff_click', label: 'Staff click' },
  { value: 'ad_not_servable', label: 'Advertisement not servable' },
  { value: 'product_ineligible', label: 'Product ineligible' },
  { value: 'insufficient_budget', label: 'Insufficient remaining budget' },
  { value: 'rate_limited', label: 'Network click limit exceeded' },
  { value: 'limiter_unavailable', label: 'Network limiter unavailable' },
];

export const AD_CLICK_REASON_LABELS = {
  eligible: 'Would be billable',
  billed: 'Billed',
  daily_cap_reached: 'Daily billing cap reached',
  expired_token: 'Expired token',
  replay: 'Token already used',
  too_fast: 'Minimum delay not met',
  seller_self_click: 'Seller self-click',
  staff_click: 'Staff click',
  ad_not_servable: 'Advertisement not servable',
  product_ineligible: 'Product ineligible',
  insufficient_budget: 'Insufficient remaining budget',
  rate_limited: 'Network click limit exceeded',
  limiter_unavailable: 'Network limiter unavailable',
};

export const AD_END_REASON_LABELS = {
  budget_exhausted: 'Your budget has been used up',
};

export function formatAdEndReasonLabel(endReason) {
  if (!endReason) return '—';
  return AD_END_REASON_LABELS[endReason] || String(endReason);
}

export function formatAdClickDecisionLabel(decision) {
  if (!decision) return '—';
  return AD_CLICK_DECISION_LABELS[decision] || String(decision);
}

export function formatAdClickReasonLabel(reasonCode) {
  if (!reasonCode) return '—';
  return AD_CLICK_REASON_LABELS[reasonCode] || String(reasonCode);
}

export function getAdClickDecisionBadgeClass(decision) {
  switch (decision) {
    case 'billed':
      return 'bg-[#EFF6FF] text-[#1D4ED8] border border-[#93C5FD]';
    case 'eligible':
      return 'bg-[#ECFDF5] text-[#065F46] border border-[#6EE7B7]';
    case 'not_billable':
      return 'bg-[#F3F4F6] text-[#374151] border border-[#D1D5DB]';
    default:
      return 'bg-[#F3F4F6] text-[#374151] border border-[#D1D5DB]';
  }
}

/**
 * Checks whether a server Decimal string (e.g. "750.00") is strictly greater than zero
 * using string character inspection only (no floating-point conversion or browser money maths).
 */
export function isPositiveMoneyString(val) {
  if (val === null || val === undefined) return false;
  const s = String(val).trim();
  if (!s || s.startsWith('-')) return false;
  return /[1-9]/.test(s);
}

export function canOfferUnspentRefund(ad) {
  if (!ad) return false;
  return (
    AD_REFUNDABLE_STATUSES.includes(ad.status) &&
    isPositiveMoneyString(ad.remaining)
  );
}

export function formatAdStatusLabel(status) {
  if (!status) return '—';
  return AD_STATUS_LABELS[status] || String(status).replace(/_/g, ' ');
}

export function formatAdPlacementLabel(placement) {
  if (!placement) return '—';
  return AD_PLACEMENT_LABELS[placement] || String(placement).replace(/_/g, ' ');
}

export function isAdCreativeRejected(ad) {
  if (!ad) return false;
  return (
    ad.status === 'rejected' ||
    ad.active_creative?.moderation_state === 'rejected' ||
    (ad.status === 'funded' && Boolean(ad.rejection_reason))
  );
}

export function getAdRejectionReason(ad) {
  if (!ad) return '';
  return (
    ad.rejection_reason ||
    ad.active_creative?.rejection_reason ||
    ''
  );
}

/**
 * Returns the single primary next valid action or status indicator for the seller
 * guided flow / Ad Detail view based on the advertisement's real server status and creative state.
 *
 * Possible keys:
 * - 'add_picture': ad needs a draft creative uploaded or a rejected creative replaced
 * - 'request_payment': ad is in 'created' with a valid draft creative and ready to request payment
 * - 'pay_test': ad is in 'awaiting_payment' (with a draft creative) and simulated_payment_enabled is true
 * - 'awaiting_platform_payment': ad is in 'awaiting_payment' (with a draft creative) and simulated_payment_enabled is false
 * - 'submit_review': ad is in 'funded' with a valid draft creative ready to submit for review
 * - 'waiting_for_review': ad is in 'pending_review'
 * - 'approved': ad is in 'approved'
 * - 'running': ad is in 'running'
 * - 'ended': ad is in 'ended'
 * - 'taken_down': ad is in 'taken_down'
 * - 'cancelled': ad is in 'cancelled'
 */
export function getSellerAdNextAction(ad, simulatedPaymentEnabled = false) {
  if (!ad) return null;
  const status = ad.status;
  const hasDraftCreative =
    Boolean(ad.active_creative) &&
    ad.active_creative.moderation_state === 'draft';
  const creativeRejected = isAdCreativeRejected(ad);

  if (status === 'created') {
    if (!hasDraftCreative || creativeRejected) {
      return { key: 'add_picture', label: 'Add your picture' };
    }
    return { key: 'request_payment', label: 'Request payment' };
  }

  if (status === 'awaiting_payment') {
    if (!hasDraftCreative || creativeRejected) {
      return { key: 'add_picture', label: 'Add your picture' };
    }
    if (simulatedPaymentEnabled) {
      return { key: 'pay_test', label: 'Pay (test)' };
    }
    return {
      key: 'awaiting_platform_payment',
      label: 'Payment is added by the platform team. Nothing has been charged.',
    };
  }

  if (status === 'funded' || status === 'rejected') {
    if (!hasDraftCreative || creativeRejected) {
      return { key: 'add_picture', label: 'Add your picture' };
    }
    return { key: 'submit_review', label: 'Submit for review' };
  }

  if (status === 'pending_review') {
    return { key: 'waiting_for_review', label: 'Waiting for review' };
  }

  if (status === 'approved') {
    return { key: 'approved', label: 'Approved' };
  }

  if (status === 'running') {
    return { key: 'running', label: 'Running' };
  }

  if (status === 'ended') {
    return { key: 'ended', label: 'Ended' };
  }

  if (status === 'taken_down') {
    return { key: 'taken_down', label: 'Taken Down' };
  }

  if (status === 'cancelled') {
    return { key: 'cancelled', label: 'Cancelled' };
  }

  return null;
}

export function getAdStatusBadgeClass(status) {
  switch (status) {
    case 'created':
      return 'bg-[#FEF3C7] text-[#92400E] border border-[#FCD34D]';
    case 'awaiting_payment':
      return 'bg-[#EFF6FF] text-[#1D4ED8] border border-[#93C5FD]';
    case 'funded':
      return 'bg-[#ECFDF5] text-[#065F46] border border-[#6EE7B7]';
    case 'pending_review':
      return 'bg-[#EEF2FF] text-[#3730A3] border border-[#A5B4FC]';
    case 'approved':
    case 'running':
      return 'bg-[#D1FAE5] text-[#065F46] border border-[#34D399]';
    case 'rejected':
      return 'bg-[#FFF3F3] text-[#991B1B] border border-[#FCA5A5]';
    case 'taken_down':
      return 'bg-[#FEF2F2] text-[#7F1D1D] border border-[#F87171]';
    case 'ended':
      return 'bg-[#F3F4F6] text-[#1F2937] border border-[#9CA3AF]';
    case 'cancelled':
      return 'bg-[#F3F4F6] text-[#374151] border border-[#D1D5DB]';
    default:
      return 'bg-[#F3F4F6] text-[#374151] border border-[#D1D5DB]';
  }
}

export function getAdClickRateStatusBadgeClass(status) {
  switch (status) {
    case 'approved':
      return 'bg-[#ECFDF5] text-[#065F46] border border-[#6EE7B7]';
    case 'superseded':
      return 'bg-[#F3F4F6] text-[#374151] border border-[#D1D5DB]';
    default:
      return 'bg-[#F3F4F6] text-[#374151] border border-[#D1D5DB]';
  }
}

export function getAdPaymentStatusBadgeClass(status) {
  switch (status) {
    case 'recorded':
      return 'bg-[#ECFDF5] text-[#065F46] border border-[#6EE7B7]';
    case 'reversed':
      return 'bg-[#FFF3F3] text-[#991B1B] border border-[#FCA5A5]';
    default:
      return 'bg-[#F3F4F6] text-[#374151] border border-[#D1D5DB]';
  }
}

export function getAdLedgerBadgeClass(entryType) {
  switch (entryType) {
    case 'payment_credit':
    case 'click_charge_reversal':
      return 'bg-[#ECFDF5] text-[#065F46] border border-[#6EE7B7]';
    case 'payment_reversal':
    case 'payment_refund':
      return 'bg-[#FFF3F3] text-[#991B1B] border border-[#FCA5A5]';
    case 'click_charge':
      return 'bg-[#EFF6FF] text-[#1D4ED8] border border-[#93C5FD]';
    default:
      return 'bg-[#F3F4F6] text-[#374151] border border-[#D1D5DB]';
  }
}

export function formatAdDateTime(iso) {
  if (!iso) return '—';
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return String(iso);
    return d.toLocaleString('en-IN', {
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

/**
 * Fetches an authenticated creative image endpoint (/api/advertising/creatives/{id}/image/)
 * with the JWT Authorization header, creates an object URL from the returned Blob,
 * and revokes the URL when the endpoint changes or the component unmounts.
 */
export function useAuthenticatedImageUrl(imageUrl) {
  const [blobUrl, setBlobUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!imageUrl) {
      setBlobUrl('');
      setLoading(false);
      setError('');
      return undefined;
    }

    let cancelled = false;
    let currentObjectUrl = '';
    setLoading(true);
    setError('');

    fetchProtectedFile(imageUrl)
      .then((blob) => {
        if (cancelled) return;
        if (typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function') {
          currentObjectUrl = URL.createObjectURL(blob);
          setBlobUrl(currentObjectUrl);
        } else {
          setBlobUrl(imageUrl);
        }
      })
      .catch((err) => {
        if (cancelled) return;
        setBlobUrl('');
        setError(err?.data?.detail || err?.message || 'Unable to load creative image.');
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
      if (
        currentObjectUrl &&
        typeof URL !== 'undefined' &&
        typeof URL.revokeObjectURL === 'function'
      ) {
        URL.revokeObjectURL(currentObjectUrl);
      }
    };
  }, [imageUrl]);

  return { blobUrl, loading, error };
}

function flattenErr(val) {
  if (val === null || val === undefined) return '';
  if (typeof val === 'string') return val;
  if (Array.isArray(val)) {
    return val
      .map((item) => flattenErr(item))
      .filter(Boolean)
      .join(' ');
  }
  if (typeof val === 'object') {
    return Object.values(val)
      .map((v) => flattenErr(v))
      .filter(Boolean)
      .join(' ');
  }
  return String(val);
}

/**
 * Extracts fieldErrors and generalError from DRF or custom {"detail": ...} payloads
 * without exposing raw JSON keys.
 */
export function parseAdvertisingApiError(err, knownFields = []) {
  const fieldErrors = {};
  const generalMessages = [];
  const data = err?.data;

  const assignInferredField = (text) => {
    if (!text) return;
    if (
      /external reference|transfer reference|reference already exists|unique_reference|for this advertisement or reference/i.test(
        text
      ) &&
      knownFields.includes('external_reference')
    ) {
      fieldErrors.external_reference = text;
    } else if (/intended_amount|intended amount/i.test(text) && knownFields.includes('intended_amount')) {
      fieldErrors.intended_amount = text;
    } else if (/payment must be at least|payment amount/i.test(text) && knownFields.includes('amount')) {
      fieldErrors.amount = text;
    } else if (/product/i.test(text) && knownFields.includes('product_id')) {
      fieldErrors.product_id = text;
    } else if (/confirm_reversal/i.test(text) && knownFields.includes('confirm_reversal')) {
      fieldErrors.confirm_reversal = text;
    } else if (/confirm_refund/i.test(text) && knownFields.includes('confirm_refund')) {
      fieldErrors.confirm_refund = text;
    } else if (/refunded_date|refund date/i.test(text) && knownFields.includes('refunded_date')) {
      fieldErrors.refunded_date = text;
    } else if (/outcome/i.test(text) && knownFields.includes('outcome')) {
      fieldErrors.outcome = text;
    } else if (
      /backdated|effective date|effective_from|click-rate version|advertising price version|advertising-price version|overlaps an existing/i.test(
        text
      ) &&
      knownFields.includes('effective_from')
    ) {
      fieldErrors.effective_from = text;
    } else if (
      /advertising price is not set for this placement/i.test(text) &&
      knownFields.includes('placement')
    ) {
      fieldErrors.placement = text;
    } else if (
      /video ads are not available yet/i.test(text) &&
      knownFields.includes('ad_type')
    ) {
      fieldErrors.ad_type = text;
    } else if (
      /advertising price|ad_price|click amount must be in force|at least one click amount/i.test(
        text
      ) &&
      knownFields.includes('ad_price')
    ) {
      fieldErrors.ad_price = text;
    } else if (
      /amount per click|amount_per_click|click rate|click amount cannot exceed/i.test(
        text
      ) &&
      knownFields.includes('amount_per_click')
    ) {
      fieldErrors.amount_per_click = text;
    } else if (
      /image|aspect ratio|jpeg|png|webp|bytes|pixel limit|readable image/i.test(text) &&
      knownFields.includes('image')
    ) {
      fieldErrors.image = text;
    } else if (/placement/i.test(text) && knownFields.includes('placement')) {
      fieldErrors.placement = text;
    } else if (
      /no unspent balance|only a funded, approved, taken-down, or ended advertisement can be refunded/i.test(
        text
      ) &&
      knownFields.includes('reason') &&
      !fieldErrors.reason
    ) {
      fieldErrors.reason = text;
    } else if (/reason/i.test(text) && knownFields.includes('reason') && !fieldErrors.reason) {
      fieldErrors.reason = text;
    } else if (
      (/awaiting payment|recorded payment already exists|one_recorded_payment_per_ad/i.test(text)) &&
      knownFields.includes('amount') &&
      !fieldErrors.amount
    ) {
      fieldErrors.amount = text;
    }
  };

  if (data && typeof data === 'object' && !Array.isArray(data)) {
    const source =
      data.detail &&
      typeof data.detail === 'object' &&
      !Array.isArray(data.detail)
        ? data.detail
        : data;

    for (const [key, val] of Object.entries(source)) {
      const text = flattenErr(val);
      if (!text) continue;

      if (
        key === 'detail' ||
        key === 'non_field_errors' ||
        key === '__all__' ||
        key === 'message'
      ) {
        generalMessages.push(text);
        assignInferredField(text);
      } else if (key === 'product' && knownFields.includes('product_id')) {
        fieldErrors.product_id = text;
      } else if (knownFields.includes(key)) {
        fieldErrors[key] = text;
      } else {
        fieldErrors[key] = text;
        generalMessages.push(text);
      }
    }
  } else if (Array.isArray(data)) {
    const text = flattenErr(data);
    if (text) {
      generalMessages.push(text);
      assignInferredField(text);
    }
  } else if (typeof data === 'string' && data.trim()) {
    const text = data.trim();
    generalMessages.push(text);
    assignInferredField(text);
  }

  if (generalMessages.length === 0 && Object.keys(fieldErrors).length === 0) {
    generalMessages.push(err?.message || 'Request failed. Please try again.');
  }

  const combined = generalMessages.join(' ');
  return {
    fieldErrors,
    generalError: combined,
  };
}
