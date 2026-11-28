/**
 * Utilities for customer order pricing, cart summary, customer_charges, and admin delivery & packaging fee rules.
 *
 * RULE: All money and percentage strings from the server are displayed verbatim.
 * Never use browser money maths (no adding, subtracting, rounding, or formatting conversions).
 */

export const SUPPORTED_FEE_CURRENCIES = ['INR', 'AED', 'EUR'];

export const FEE_RULE_STATUS_LABELS = {
  approved: 'Approved',
  superseded: 'Superseded',
};

export const ORDER_CHARGE_KIND_LABELS = {
  delivery: 'Delivery charge',
  packaging: 'Packaging fee',
};

/**
 * Checks whether a decimal money string from the server is present and strictly non-zero
 * using pure string character inspection (no browser money math).
 */
export function isNonZeroMoneyString(val) {
  if (val === null || val === undefined) return false;
  const s = String(val).trim();
  if (!s) return false;
  const digitsOnly = s.replace(/^[-+]/, '').replace(/\./g, '');
  if (!digitsOnly || !/^\d+$/.test(digitsOnly)) return false;
  return /[1-9]/.test(digitsOnly);
}

/**
 * Formats a currency code + verbatim server money string without altering the string digits.
 */
export function formatVerbatimMoney(currency, amountStr) {
  if (amountStr === null || amountStr === undefined || amountStr === '') {
    return '—';
  }
  const cur = currency ? String(currency).trim().toUpperCase() : 'INR';
  return `${cur} ${String(amountStr)}`;
}

/**
 * Determines how the delivery charge line in the cart/checkout summary should be rendered:
 * - If server sends non-empty `delivery_message` (e.g. "No delivery fee configured"), show `delivery_message` as sent.
 * - Else if `delivery_charge` is zero ("0.00") AND a delivery rule exists (`delivery_rule_id != null`),
 *   show "Free delivery".
 * - Otherwise show the verbatim currency and `delivery_charge` string.
 */
export function getCartSummaryDeliveryDisplay(summary) {
  if (!summary || typeof summary !== 'object') {
    return { type: 'none', text: '—' };
  }
  const message =
    typeof summary.delivery_message === 'string'
      ? summary.delivery_message.trim()
      : '';
  if (message) {
    return { type: 'message', text: message };
  }
  const hasRule =
    summary.delivery_rule_id !== null &&
    summary.delivery_rule_id !== undefined;
  const isZero = !isNonZeroMoneyString(summary.delivery_charge);
  if (isZero && hasRule) {
    return { type: 'free', text: 'Free delivery' };
  }
  return {
    type: 'amount',
    text: formatVerbatimMoney(summary.currency, summary.delivery_charge),
  };
}

/**
 * Parses DRF / Django validation errors (400 / 409 / 403) into `{ fieldErrors, generalError }`.
 * Maps 409 overlap messages to `effective_from` when appropriate so they appear under the date field.
 */
export function parseFeeRuleApiError(err) {
  const fieldErrors = {};
  let generalError = '';
  const data = err?.data;

  const toText = (val) => {
    if (Array.isArray(val)) {
      return val
        .map((v) => (typeof v === 'string' ? v : JSON.stringify(v)))
        .join(' ');
    }
    if (typeof val === 'string') return val;
    if (val && typeof val === 'object') {
      return Object.values(val).flat().join(' ');
    }
    return String(val ?? '');
  };

  if (!data) {
    generalError = err?.message || 'Request failed.';
    return { fieldErrors, generalError };
  }

  if (typeof data === 'string') {
    if (/overlap|backdated|effective/i.test(data)) {
      fieldErrors.effective_from = data;
    } else {
      generalError = data;
    }
    return { fieldErrors, generalError };
  }

  if (Array.isArray(data)) {
    const msg = toText(data);
    if (/overlap|backdated|effective/i.test(msg)) {
      fieldErrors.effective_from = msg;
    } else {
      generalError = msg;
    }
    return { fieldErrors, generalError };
  }

  if (typeof data === 'object') {
    for (const [key, val] of Object.entries(data)) {
      const msg = toText(val);
      if (!msg) continue;
      if (key === 'detail' || key === 'message') {
        if (/overlap|backdated|effective/i.test(msg) && !fieldErrors.effective_from) {
          fieldErrors.effective_from = msg;
        }
        generalError = msg;
      } else if (key === 'non_field_errors' || key === '__all__') {
        if (/overlap|backdated|effective/i.test(msg) && !fieldErrors.effective_from) {
          fieldErrors.effective_from = msg;
        } else {
          generalError = generalError ? `${generalError} ${msg}` : msg;
        }
      } else {
        fieldErrors[key] = msg;
      }
    }
  }

  if (!generalError && Object.keys(fieldErrors).length === 0) {
    generalError = err?.message || 'Request failed.';
  }

  return { fieldErrors, generalError };
}

