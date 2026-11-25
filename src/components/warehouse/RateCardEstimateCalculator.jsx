import React, { useState } from 'react';
import {
  Calculator,
  AlertCircle,
  Info,
  Plus,
  Trash2,
} from 'lucide-react';
import { apiRequest } from '../../utils/api';
import { parseRateCardApiError } from '../../utils/warehouseUtils';

const ESTIMATE_KNOWN_FIELDS = [
  'warehouse_id',
  'as_of_date',
  'length',
  'width',
  'height',
  'weight',
  'quantity',
  'storage_days',
  'packing',
];

function isNegativeInput(val) {
  const s = String(val ?? '').trim();
  return s.startsWith('-');
}

export default function RateCardEstimateCalculator({
  isAdmin = false,
  warehouses = [],
  rateCards = [],
  defaultWarehouseId = '',
  defaultAsOfDate = '',
  onUnauthorized,
}) {
  const [warehouseId, setWarehouseId] = useState(
    defaultWarehouseId ? String(defaultWarehouseId) : ''
  );
  const [asOfDate, setAsOfDate] = useState(defaultAsOfDate || '');
  const [length, setLength] = useState('');
  const [width, setWidth] = useState('');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [storageDays, setStorageDays] = useState('1');
  const [packingRows, setPackingRows] = useState([]);

  const [fieldErrors, setFieldErrors] = useState({});
  const [packingLineErrors, setPackingLineErrors] = useState([]);
  const [generalError, setGeneralError] = useState('');
  const [errorStatus, setErrorStatus] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [estimateResult, setEstimateResult] = useState(null);

  // Collect packing items from approved or superseded rate cards (filtered by selected warehouse for admin)
  const relevantCards = (rateCards || []).filter((card) => {
    if (!['approved', 'superseded'].includes(card.status)) return false;
    if (isAdmin && warehouseId && String(card.warehouse) !== String(warehouseId)) {
      return false;
    }
    if (asOfDate && card.effective_from) {
      if (card.effective_from > asOfDate) return false;
      if (card.effective_to && card.effective_to < asOfDate) return false;
    }
    return true;
  });

  const knownPackingItems = [];
  const seenItemIds = new Set();
  relevantCards.forEach((card) => {
    (card.packing_items || []).forEach((item) => {
      if (!seenItemIds.has(item.id)) {
        seenItemIds.add(item.id);
        knownPackingItems.push({
          ...item,
          version: card.version,
          currency: card.currency || 'INR',
        });
      }
    });
  });

  const handleAddPackingRow = (prefillItemId = '') => {
    setPackingRows((prev) => [
      ...prev,
      {
        item_id: prefillItemId ? String(prefillItemId) : '',
        quantity: '1',
      },
    ]);
    setFieldErrors((fe) => ({ ...fe, packing: '' }));
  };

  const handleRemovePackingRow = (idx) => {
    setPackingRows((prev) => prev.filter((_, i) => i !== idx));
    setPackingLineErrors((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleUpdatePackingRow = (idx, key, val) => {
    setPackingRows((prev) =>
      prev.map((row, i) => (i === idx ? { ...row, [key]: val } : row))
    );
    setPackingLineErrors((prev) => {
      const next = [...prev];
      if (next[idx]) {
        next[idx] = { ...next[idx], [key]: '' };
      }
      return next;
    });
    setFieldErrors((fe) => ({ ...fe, packing: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFieldErrors({});
    setPackingLineErrors([]);
    setGeneralError('');
    setErrorStatus(null);

    // Client checks limited to obvious things (negative numbers)
    const clientFieldErrs = {};
    if (isNegativeInput(length)) clientFieldErrs.length = 'Length cannot be negative.';
    if (isNegativeInput(width)) clientFieldErrs.width = 'Width cannot be negative.';
    if (isNegativeInput(height)) clientFieldErrs.height = 'Height cannot be negative.';
    if (isNegativeInput(weight)) clientFieldErrs.weight = 'Weight cannot be negative.';
    if (isNegativeInput(quantity)) clientFieldErrs.quantity = 'Quantity cannot be negative.';
    if (isNegativeInput(storageDays)) {
      clientFieldErrs.storage_days = 'Storage days cannot be negative.';
    }

    const clientPackErrs = [];
    let hasClientPackErr = false;
    packingRows.forEach((row, idx) => {
      const rErr = {};
      if (isNegativeInput(row.item_id)) {
        rErr.item_id = 'Packing item ID must be a positive integer.';
        hasClientPackErr = true;
      }
      if (isNegativeInput(row.quantity)) {
        rErr.quantity = 'Quantity cannot be negative.';
        hasClientPackErr = true;
      }
      clientPackErrs[idx] = rErr;
    });

    if (Object.keys(clientFieldErrs).length > 0 || hasClientPackErr) {
      setFieldErrors(clientFieldErrs);
      setPackingLineErrors(clientPackErrs);
      setGeneralError('Please correct negative values before requesting an estimate.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        as_of_date: asOfDate,
        length: String(length).trim(),
        width: String(width).trim(),
        height: String(height).trim(),
        weight: String(weight).trim(),
        quantity:
          String(quantity).trim() !== '' ? Number(quantity) : quantity,
        storage_days:
          String(storageDays).trim() !== '' ? Number(storageDays) : storageDays,
        packing: packingRows
          .filter(
            (r) => String(r.item_id).trim() !== '' || String(r.quantity).trim() !== ''
          )
          .map((r) => ({
            item_id:
              String(r.item_id).trim() !== '' ? Number(r.item_id) : r.item_id,
            quantity:
              String(r.quantity).trim() !== '' ? Number(r.quantity) : r.quantity,
          })),
      };

      if (isAdmin) {
        if (String(warehouseId).trim() !== '') {
          payload.warehouse_id = Number(warehouseId);
        }
      }

      const endpoint = isAdmin
        ? '/api/admin/warehouse/rate-cards/estimate/'
        : '/api/warehouse/rate-cards/estimate/';

      const data = await apiRequest(endpoint, {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      setEstimateResult(data);
    } catch (err) {
      setEstimateResult(null);
      setErrorStatus(err?.status || null);
      if (err?.status === 401 && onUnauthorized) {
        await onUnauthorized();
        return;
      }
      const parsed = parseRateCardApiError(err, ESTIMATE_KNOWN_FIELDS);
      setFieldErrors(parsed.fieldErrors);
      setPackingLineErrors(parsed.packingLineErrors);
      setGeneralError(parsed.generalError);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      data-testid={
        isAdmin ? 'admin-estimate-calculator' : 'manager-estimate-calculator'
      }
      className="rounded-3xl border border-[#EAE3DC] bg-white shadow-2xs p-6 space-y-5"
    >
      {/* Prominent Non-Binding Estimate Banner */}
      <div
        data-testid="estimate-only-disclaimer"
        className="p-4 rounded-2xl border-2 border-dashed border-[#6B6058]/40 bg-[#F9F6F0] flex items-start space-x-3"
      >
        <Calculator className="w-5 h-5 text-[#1A2420] shrink-0 mt-0.5" />
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3
              id="estimate-calc-heading"
              className="font-['Outfit'] font-extrabold text-base text-[#1A2420]"
            >
              Read-Only Warehouse Rate Estimate Calculator
            </h3>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-[#EAE3DC] text-[#1A2420]">
              Estimate only. Nothing is charged or saved.
            </span>
          </div>
          <p
            id="estimate-envelope-help"
            className="text-xs text-[#6B6058] leading-relaxed"
          >
            Each size band on an approved rate card is a <strong>MAXIMUM envelope</strong> (maximum length, width, height in <code>cm</code> and maximum weight in <code>kg</code>). The server picks the smallest band that fits all four measurements and returns all calculated amounts. If no band fits, the server returns a 400 error.
          </p>
        </div>
      </div>

      {/* Top-level 400 / 404 / General Error Alert */}
      {generalError && (
        <div
          data-testid="estimate-error-alert"
          role="alert"
          className="p-4 rounded-2xl bg-[#FFF3F3] border border-[#FCA5A5] flex items-start space-x-3 text-xs text-[#991B1B]"
        >
          <AlertCircle className="w-4 h-4 text-[#DC2626] shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <div className="font-bold">
              {errorStatus === 404
                ? 'No Applicable Approved Rate Card (404)'
                : errorStatus === 400
                ? 'Estimate Request Refused (400)'
                : 'Estimate Request Failed'}
            </div>
            <p data-testid="estimate-error-message">{generalError}</p>
          </div>
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        aria-labelledby="estimate-calc-heading"
        data-testid="rate-card-estimate-form"
        className="space-y-5"
        noValidate
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {isAdmin && (
            <div>
              <label
                htmlFor="estimate-warehouse-select"
                className="block text-xs font-bold text-[#1A2420] mb-1"
              >
                Warehouse <span aria-hidden="true" className="text-[#DC2626]">*</span>
              </label>
              <select
                id="estimate-warehouse-select"
                name="warehouse_id"
                data-testid="estimate-warehouse-select"
                value={warehouseId}
                aria-invalid={Boolean(fieldErrors.warehouse_id)}
                aria-describedby={
                  fieldErrors.warehouse_id ? 'estimate-err-warehouse_id' : undefined
                }
                onChange={(e) => {
                  setWarehouseId(e.target.value);
                  setFieldErrors((fe) => ({ ...fe, warehouse_id: '' }));
                }}
                className="w-full px-3 py-2 rounded-xl border border-[#EAE3DC] text-xs bg-white font-semibold"
              >
                <option value="">Select warehouse...</option>
                {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name} ({w.code}) — #{w.id}
                  </option>
                ))}
              </select>
              {fieldErrors.warehouse_id && (
                <p
                  id="estimate-err-warehouse_id"
                  data-testid="estimate-error-warehouse_id"
                  className="text-[11px] font-semibold text-[#DC2626] mt-1"
                >
                  {fieldErrors.warehouse_id}
                </p>
              )}
            </div>
          )}

          <div>
            <label
              htmlFor="estimate-as-of-date"
              className="block text-xs font-bold text-[#1A2420] mb-1"
            >
              As-Of Date <span aria-hidden="true" className="text-[#DC2626]">*</span>
            </label>
            <input
              id="estimate-as-of-date"
              name="as_of_date"
              data-testid="estimate-as-of-date-input"
              type="date"
              value={asOfDate}
              aria-invalid={Boolean(fieldErrors.as_of_date)}
              aria-describedby={
                fieldErrors.as_of_date ? 'estimate-err-as_of_date' : undefined
              }
              onChange={(e) => {
                setAsOfDate(e.target.value);
                setFieldErrors((fe) => ({ ...fe, as_of_date: '' }));
              }}
              className="w-full px-3 py-2 rounded-xl border border-[#EAE3DC] text-xs font-mono"
            />
            {fieldErrors.as_of_date && (
              <p
                id="estimate-err-as_of_date"
                data-testid="estimate-error-as_of_date"
                className="text-[11px] font-semibold text-[#DC2626] mt-1"
              >
                {fieldErrors.as_of_date}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="estimate-quantity"
              className="block text-xs font-bold text-[#1A2420] mb-1"
            >
              Quantity <span aria-hidden="true" className="text-[#DC2626]">*</span>
            </label>
            <div className="flex items-center gap-1.5">
              <input
                id="estimate-quantity"
                name="quantity"
                data-testid="estimate-quantity-input"
                type="number"
                min="1"
                value={quantity}
                aria-invalid={Boolean(fieldErrors.quantity)}
                aria-describedby={
                  fieldErrors.quantity ? 'estimate-err-quantity' : undefined
                }
                onChange={(e) => {
                  setQuantity(e.target.value);
                  setFieldErrors((fe) => ({ ...fe, quantity: '' }));
                }}
                className="w-full px-3 py-2 rounded-xl border border-[#EAE3DC] text-xs font-mono"
              />
              <span className="text-xs font-mono font-bold text-[#6B6058] shrink-0">
                units
              </span>
            </div>
            {fieldErrors.quantity && (
              <p
                id="estimate-err-quantity"
                data-testid="estimate-error-quantity"
                className="text-[11px] font-semibold text-[#DC2626] mt-1"
              >
                {fieldErrors.quantity}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="estimate-storage-days"
              className="block text-xs font-bold text-[#1A2420] mb-1"
            >
              Storage Days <span aria-hidden="true" className="text-[#DC2626]">*</span>
            </label>
            <div className="flex items-center gap-1.5">
              <input
                id="estimate-storage-days"
                name="storage_days"
                data-testid="estimate-storage-days-input"
                type="number"
                min="0"
                value={storageDays}
                aria-invalid={Boolean(fieldErrors.storage_days)}
                aria-describedby={
                  fieldErrors.storage_days ? 'estimate-err-storage_days' : undefined
                }
                onChange={(e) => {
                  setStorageDays(e.target.value);
                  setFieldErrors((fe) => ({ ...fe, storage_days: '' }));
                }}
                className="w-full px-3 py-2 rounded-xl border border-[#EAE3DC] text-xs font-mono"
              />
              <span className="text-xs font-mono font-bold text-[#6B6058] shrink-0">
                days
              </span>
            </div>
            {fieldErrors.storage_days && (
              <p
                id="estimate-err-storage_days"
                data-testid="estimate-error-storage_days"
                className="text-[11px] font-semibold text-[#DC2626] mt-1"
              >
                {fieldErrors.storage_days}
              </p>
            )}
          </div>
        </div>

        {/* Unit Dimensions & Weight Fieldset */}
        <fieldset className="p-4 rounded-2xl border border-[#EAE3DC] bg-[#F9F6F0]/50 space-y-3">
          <legend className="px-2 text-xs font-extrabold text-[#1A2420]">
            Unit Dimensions &amp; Weight (Checked Against Size Band Maximum Envelopes)
          </legend>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label
                htmlFor="estimate-length"
                className="block text-xs font-bold text-[#1A2420] mb-1"
              >
                Length <span aria-hidden="true" className="text-[#DC2626]">*</span>
              </label>
              <div className="flex items-center gap-1.5">
                <input
                  id="estimate-length"
                  name="length"
                  data-testid="estimate-length-input"
                  type="text"
                  inputMode="decimal"
                  placeholder="e.g. 8"
                  value={length}
                  aria-invalid={Boolean(fieldErrors.length)}
                  aria-describedby={
                    fieldErrors.length ? 'estimate-err-length' : 'estimate-envelope-help'
                  }
                  onChange={(e) => {
                    setLength(e.target.value);
                    setFieldErrors((fe) => ({ ...fe, length: '' }));
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-[#EAE3DC] bg-white text-xs font-mono"
                />
                <span className="text-xs font-mono font-bold text-[#6B6058] shrink-0">
                  cm
                </span>
              </div>
              {fieldErrors.length && (
                <p
                  id="estimate-err-length"
                  data-testid="estimate-error-length"
                  className="text-[11px] font-semibold text-[#DC2626] mt-1"
                >
                  {fieldErrors.length}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="estimate-width"
                className="block text-xs font-bold text-[#1A2420] mb-1"
              >
                Width <span aria-hidden="true" className="text-[#DC2626]">*</span>
              </label>
              <div className="flex items-center gap-1.5">
                <input
                  id="estimate-width"
                  name="width"
                  data-testid="estimate-width-input"
                  type="text"
                  inputMode="decimal"
                  placeholder="e.g. 8"
                  value={width}
                  aria-invalid={Boolean(fieldErrors.width)}
                  aria-describedby={
                    fieldErrors.width ? 'estimate-err-width' : 'estimate-envelope-help'
                  }
                  onChange={(e) => {
                    setWidth(e.target.value);
                    setFieldErrors((fe) => ({ ...fe, width: '' }));
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-[#EAE3DC] bg-white text-xs font-mono"
                />
                <span className="text-xs font-mono font-bold text-[#6B6058] shrink-0">
                  cm
                </span>
              </div>
              {fieldErrors.width && (
                <p
                  id="estimate-err-width"
                  data-testid="estimate-error-width"
                  className="text-[11px] font-semibold text-[#DC2626] mt-1"
                >
                  {fieldErrors.width}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="estimate-height"
                className="block text-xs font-bold text-[#1A2420] mb-1"
              >
                Height <span aria-hidden="true" className="text-[#DC2626]">*</span>
              </label>
              <div className="flex items-center gap-1.5">
                <input
                  id="estimate-height"
                  name="height"
                  data-testid="estimate-height-input"
                  type="text"
                  inputMode="decimal"
                  placeholder="e.g. 8"
                  value={height}
                  aria-invalid={Boolean(fieldErrors.height)}
                  aria-describedby={
                    fieldErrors.height ? 'estimate-err-height' : 'estimate-envelope-help'
                  }
                  onChange={(e) => {
                    setHeight(e.target.value);
                    setFieldErrors((fe) => ({ ...fe, height: '' }));
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-[#EAE3DC] bg-white text-xs font-mono"
                />
                <span className="text-xs font-mono font-bold text-[#6B6058] shrink-0">
                  cm
                </span>
              </div>
              {fieldErrors.height && (
                <p
                  id="estimate-err-height"
                  data-testid="estimate-error-height"
                  className="text-[11px] font-semibold text-[#DC2626] mt-1"
                >
                  {fieldErrors.height}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="estimate-weight"
                className="block text-xs font-bold text-[#1A2420] mb-1"
              >
                Weight <span aria-hidden="true" className="text-[#DC2626]">*</span>
              </label>
              <div className="flex items-center gap-1.5">
                <input
                  id="estimate-weight"
                  name="weight"
                  data-testid="estimate-weight-input"
                  type="text"
                  inputMode="decimal"
                  placeholder="e.g. 1"
                  value={weight}
                  aria-invalid={Boolean(fieldErrors.weight)}
                  aria-describedby={
                    fieldErrors.weight ? 'estimate-err-weight' : 'estimate-envelope-help'
                  }
                  onChange={(e) => {
                    setWeight(e.target.value);
                    setFieldErrors((fe) => ({ ...fe, weight: '' }));
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-[#EAE3DC] bg-white text-xs font-mono"
                />
                <span className="text-xs font-mono font-bold text-[#6B6058] shrink-0">
                  kg
                </span>
              </div>
              {fieldErrors.weight && (
                <p
                  id="estimate-err-weight"
                  data-testid="estimate-error-weight"
                  className="text-[11px] font-semibold text-[#DC2626] mt-1"
                >
                  {fieldErrors.weight}
                </p>
              )}
            </div>
          </div>
        </fieldset>

        {/* Packing Selections Fieldset */}
        <fieldset className="p-4 rounded-2xl border border-[#EAE3DC] bg-[#F9F6F0]/50 space-y-3">
          <legend className="px-2 text-xs font-extrabold text-[#1A2420]">
            Optional Packing Materials &amp; Quantities
          </legend>

          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs text-[#6B6058]">
              Select packing materials from the rate card covering the chosen date or enter packing item IDs and quantities.
            </p>
            <button
              type="button"
              data-testid="estimate-add-packing-btn"
              onClick={() => handleAddPackingRow('')}
              className="px-3 py-1.5 rounded-xl border border-[#EAE3DC] bg-white hover:bg-[#FFF3EC] text-xs font-bold text-[#1A2420] inline-flex items-center space-x-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-[#FA661C]" />
              <span>Add Packing Line</span>
            </button>
          </div>

          {knownPackingItems.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="text-[11px] font-bold text-[#6B6058]">
                Available on matching card(s):
              </span>
              {knownPackingItems.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  data-testid={`estimate-quick-add-packing-${item.id}`}
                  onClick={() => handleAddPackingRow(item.id)}
                  className="px-2.5 py-1 rounded-lg border border-[#EAE3DC] bg-white hover:bg-[#FFF3EC] text-[11px] font-mono font-semibold text-[#1A2420] cursor-pointer"
                >
                  + #{item.id} {item.name} ({item.currency} {item.price_per_unit} / {item.unit})
                </button>
              ))}
            </div>
          )}

          {fieldErrors.packing && (
            <p
              data-testid="estimate-error-packing"
              className="text-[11px] font-semibold text-[#DC2626]"
            >
              {fieldErrors.packing}
            </p>
          )}

          {packingRows.length > 0 && (
            <div className="space-y-2">
              {packingRows.map((row, idx) => {
                const rErr = packingLineErrors[idx] || {};
                return (
                  <div
                    key={idx}
                    data-testid={`estimate-packing-row-${idx}`}
                    className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-start p-3 rounded-xl border border-[#EAE3DC] bg-white"
                  >
                    <div>
                      <label
                        htmlFor={`estimate-pack-id-${idx}`}
                        className="block text-[11px] font-bold text-[#1A2420] mb-1"
                      >
                        Packing Item ID
                      </label>
                      <input
                        id={`estimate-pack-id-${idx}`}
                        name={`packing_item_id_${idx}`}
                        data-testid={`estimate-packing-item-id-${idx}`}
                        type="number"
                        min="1"
                        placeholder="e.g. 1"
                        value={row.item_id}
                        aria-invalid={Boolean(rErr.item_id)}
                        onChange={(e) =>
                          handleUpdatePackingRow(idx, 'item_id', e.target.value)
                        }
                        className="w-full px-3 py-1.5 rounded-xl border border-[#EAE3DC] text-xs font-mono"
                      />
                      {rErr.item_id && (
                        <p
                          data-testid={`estimate-packing-error-item_id-${idx}`}
                          className="text-[11px] font-semibold text-[#DC2626] mt-1"
                        >
                          {rErr.item_id}
                        </p>
                      )}
                    </div>

                    <div>
                      <label
                        htmlFor={`estimate-pack-qty-${idx}`}
                        className="block text-[11px] font-bold text-[#1A2420] mb-1"
                      >
                        Quantity
                      </label>
                      <div className="flex items-center gap-1.5">
                        <input
                          id={`estimate-pack-qty-${idx}`}
                          name={`packing_quantity_${idx}`}
                          data-testid={`estimate-packing-quantity-${idx}`}
                          type="number"
                          min="1"
                          value={row.quantity}
                          aria-invalid={Boolean(rErr.quantity)}
                          onChange={(e) =>
                            handleUpdatePackingRow(idx, 'quantity', e.target.value)
                          }
                          className="w-full px-3 py-1.5 rounded-xl border border-[#EAE3DC] text-xs font-mono"
                        />
                        <span className="text-xs font-mono text-[#6B6058]">qty</span>
                      </div>
                      {rErr.quantity && (
                        <p
                          data-testid={`estimate-packing-error-quantity-${idx}`}
                          className="text-[11px] font-semibold text-[#DC2626] mt-1"
                        >
                          {rErr.quantity}
                        </p>
                      )}
                    </div>

                    <div className="flex items-end justify-end pt-5">
                      <button
                        type="button"
                        data-testid={`estimate-remove-packing-btn-${idx}`}
                        aria-label={`Remove packing line ${idx + 1}`}
                        onClick={() => handleRemovePackingRow(idx)}
                        className="px-3 py-1.5 rounded-xl border border-[#FCA5A5] bg-[#FFF3F3] hover:bg-[#FEE2E2] text-xs font-bold text-[#DC2626] inline-flex items-center space-x-1 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Remove</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </fieldset>

        <div className="flex justify-end">
          <button
            type="submit"
            data-testid="estimate-submit-btn"
            disabled={submitting}
            className="px-5 py-2.5 rounded-xl bg-[#1A2420] hover:bg-[#334139] text-white text-xs font-bold inline-flex items-center space-x-2 cursor-pointer"
          >
            <Calculator className="w-4 h-4" />
            <span>{submitting ? 'Calculating Estimate...' : 'Calculate Read-Only Estimate'}</span>
          </button>
        </div>
      </form>

      {/* Server Estimate Result Breakdown (Strictly Server Values Only) */}
      {estimateResult && (
        <section
          data-testid="estimate-result-panel"
          aria-label="Read-Only Server Estimate Breakdown"
          className="p-5 rounded-2xl border-2 border-dashed border-[#6B6058] bg-[#F5F1EC] space-y-4"
        >
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#EAE3DC] pb-3">
            <div className="flex items-center space-x-2">
              <Info className="w-4 h-4 text-[#1A2420]" />
              <span className="font-['Outfit'] font-extrabold text-sm text-[#1A2420]">
                Estimate only. Nothing is charged or saved.
              </span>
            </div>
            <span
              data-testid="estimate-flag-badge"
              className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-white border border-[#EAE3DC] text-[#1A2420]"
            >
              estimate: {String(estimateResult.estimate)}
            </span>
          </div>

          {estimateResult.note && (
            <p
              data-testid="estimate-server-note"
              className="text-xs font-semibold text-[#3D3630] bg-white/80 p-3 rounded-xl border border-[#EAE3DC]"
            >
              Server note: {estimateResult.note}
            </p>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-white border border-[#EAE3DC]">
              <span className="block text-[10px] font-black uppercase text-[#6B6058]">
                Rate Card Version
              </span>
              <span
                data-testid="estimate-card-version"
                className="font-mono font-extrabold text-sm text-[#1A2420]"
              >
                v{estimateResult.version} (Card #{estimateResult.rate_card_id})
              </span>
              <div className="text-[11px] text-[#6B6058] mt-0.5">
                As of {estimateResult.as_of_date}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-white border border-[#EAE3DC]">
              <span className="block text-[10px] font-black uppercase text-[#6B6058]">
                Size Band Selected by Server
              </span>
              <span
                data-testid="estimate-band-used"
                className="font-bold text-sm text-[#1A2420]"
              >
                {estimateResult.band?.label || '—'}
              </span>
              {estimateResult.band?.id !== undefined && (
                <div className="text-[11px] font-mono text-[#6B6058] mt-0.5">
                  Band #{estimateResult.band.id}
                </div>
              )}
            </div>

            <div className="p-3 rounded-xl bg-white border border-[#EAE3DC]">
              <span className="block text-[10px] font-black uppercase text-[#6B6058]">
                Free Storage Days Applied
              </span>
              <span
                data-testid="estimate-free-days-applied"
                className="font-mono font-extrabold text-sm text-[#1A2420]"
              >
                {estimateResult.free_days_applied} days
              </span>
              <div
                data-testid="estimate-billable-days"
                className="text-[11px] text-[#6B6058] mt-0.5"
              >
                Billable storage days: {estimateResult.billable_storage_days}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-white border border-[#EAE3DC]">
              <span className="block text-[10px] font-black uppercase text-[#6B6058]">
                Minimum Charge Top-Up Applied
              </span>
              <span
                data-testid="estimate-minimum-applied"
                className="font-mono font-extrabold text-sm text-[#1A2420]"
              >
                {estimateResult.currency} {estimateResult.minimum_charge_applied}
              </span>
            </div>
          </div>

          <div className="rounded-xl bg-white border border-[#EAE3DC] p-4 space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-[#EAE3DC]/60">
              <span className="text-[#6B6058] font-medium">Storage Charge</span>
              <span
                data-testid="estimate-storage-charge"
                className="font-mono font-bold text-[#1A2420]"
              >
                {estimateResult.currency} {estimateResult.storage_charge}
              </span>
            </div>

            <div className="flex justify-between py-1 border-b border-[#EAE3DC]/60">
              <span className="text-[#6B6058] font-medium">Handling Charge</span>
              <span
                data-testid="estimate-handling-charge"
                className="font-mono font-bold text-[#1A2420]"
              >
                {estimateResult.currency} {estimateResult.handling_charge}
              </span>
            </div>

            <div className="flex justify-between py-1 border-b border-[#EAE3DC]/60">
              <span className="text-[#6B6058] font-medium">
                Minimum Charge Applied (before packing)
              </span>
              <span className="font-mono font-bold text-[#1A2420]">
                {estimateResult.currency} {estimateResult.minimum_charge_applied}
              </span>
            </div>

            <div className="flex justify-between py-1 border-b border-[#EAE3DC]/60">
              <span className="text-[#6B6058] font-medium">Packing Charge</span>
              <span
                data-testid="estimate-packing-charge"
                className="font-mono font-bold text-[#1A2420]"
              >
                {estimateResult.currency} {estimateResult.packing_charge}
              </span>
            </div>

            {Array.isArray(estimateResult.packing) &&
              estimateResult.packing.length > 0 && (
                <div
                  data-testid="estimate-packing-lines"
                  className="pl-4 py-1 space-y-1 border-b border-[#EAE3DC]/60 text-[11px] text-[#6B6058]"
                >
                  {estimateResult.packing.map((line, i) => (
                    <div
                      key={`${line.item_id}-${i}`}
                      data-testid={`estimate-packing-line-${line.item_id}`}
                      className="flex justify-between font-mono"
                    >
                      <span>
                        {line.name} (#{line.item_id}) × {line.quantity}
                      </span>
                      <span>
                        {estimateResult.currency} {line.amount}
                      </span>
                    </div>
                  ))}
                </div>
              )}

            <div className="flex justify-between pt-2 text-sm">
              <span className="font-extrabold text-[#1A2420]">
                Estimated Hypothetical Total (Not Billed)
              </span>
              <span
                data-testid="estimate-total"
                className="font-mono font-extrabold text-[#1A2420]"
              >
                {estimateResult.currency} {estimateResult.total}
              </span>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

