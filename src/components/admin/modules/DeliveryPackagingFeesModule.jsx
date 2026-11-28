import React, { useState, useEffect, useCallback } from 'react';
import {
  Truck,
  Package,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Calendar,
  Info,
  Lock,
  PlusCircle,
} from 'lucide-react';
import { apiRequest } from '../../../utils/api';
import { useAuth } from '../../../context/AuthContext';
import {
  SUPPORTED_FEE_CURRENCIES,
  FEE_RULE_STATUS_LABELS,
  formatVerbatimMoney,
  parseFeeRuleApiError,
} from '../../../utils/orderPricingUtils';

function getTodayIsoDate() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export default function DeliveryPackagingFeesModule() {
  const { currentUser } = useAuth();
  const isStaffAdmin =
    Boolean(currentUser?.is_staff) ||
    Boolean(currentUser?.is_superuser) ||
    currentUser?.role === 'admin';

  // 'delivery' | 'packaging'
  const [activeTab, setActiveTab] = useState('delivery');
  const [currencyFilter, setCurrencyFilter] = useState('ALL');

  // Current & Next schedule per currency: { INR: { as_of_date, in_force, next }, AED: ..., EUR: ... }
  const [deliveryCurrentByCurrency, setDeliveryCurrentByCurrency] = useState({});
  const [packagingCurrentByCurrency, setPackagingCurrentByCurrency] = useState({});

  // Full version history rows
  const [deliveryHistory, setDeliveryHistory] = useState([]);
  const [packagingHistory, setPackagingHistory] = useState([]);

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [feedbackBanner, setFeedbackBanner] = useState(null);

  // Schedule new delivery rule form state (any staff admin)
  const [deliveryForm, setDeliveryForm] = useState({
    currency: 'INR',
    free_threshold: '',
    flat_fee: '',
    tax_rate: '0.00',
    effective_from: getTodayIsoDate(),
    reason: '',
  });
  const [deliveryFieldErrors, setDeliveryFieldErrors] = useState({});
  const [deliveryGeneralError, setDeliveryGeneralError] = useState('');
  const [deliverySubmitting, setDeliverySubmitting] = useState(false);

  // Schedule new packaging rule form state (any staff admin)
  const [packagingForm, setPackagingForm] = useState({
    currency: 'INR',
    fee_per_parcel: '',
    tax_rate: '0.00',
    effective_from: getTodayIsoDate(),
    reason: '',
  });
  const [packagingFieldErrors, setPackagingFieldErrors] = useState({});
  const [packagingGeneralError, setPackagingGeneralError] = useState('');
  const [packagingSubmitting, setPackagingSubmitting] = useState(false);

  const fetchAllFeeRules = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    setLoadError('');
    try {
      const [
        delListRes,
        pkgListRes,
        delCurInr,
        delCurAed,
        delCurEur,
        pkgCurInr,
        pkgCurAed,
        pkgCurEur,
      ] = await Promise.all([
        apiRequest('/api/admin/orders/delivery-fee-rules/'),
        apiRequest('/api/admin/orders/packaging-fee-rules/'),
        apiRequest('/api/admin/orders/delivery-fee-rules/current/?currency=INR').catch(
          () => ({ currency: 'INR', in_force: null, next: null })
        ),
        apiRequest('/api/admin/orders/delivery-fee-rules/current/?currency=AED').catch(
          () => ({ currency: 'AED', in_force: null, next: null })
        ),
        apiRequest('/api/admin/orders/delivery-fee-rules/current/?currency=EUR').catch(
          () => ({ currency: 'EUR', in_force: null, next: null })
        ),
        apiRequest('/api/admin/orders/packaging-fee-rules/current/?currency=INR').catch(
          () => ({ currency: 'INR', in_force: null, next: null })
        ),
        apiRequest('/api/admin/orders/packaging-fee-rules/current/?currency=AED').catch(
          () => ({ currency: 'AED', in_force: null, next: null })
        ),
        apiRequest('/api/admin/orders/packaging-fee-rules/current/?currency=EUR').catch(
          () => ({ currency: 'EUR', in_force: null, next: null })
        ),
      ]);

      const delRows = Array.isArray(delListRes)
        ? delListRes
        : Array.isArray(delListRes?.results)
        ? delListRes.results
        : [];
      const pkgRows = Array.isArray(pkgListRes)
        ? pkgListRes
        : Array.isArray(pkgListRes?.results)
        ? pkgListRes.results
        : [];

      setDeliveryHistory(delRows);
      setPackagingHistory(pkgRows);
      setDeliveryCurrentByCurrency({
        INR: delCurInr || { currency: 'INR', in_force: null, next: null },
        AED: delCurAed || { currency: 'AED', in_force: null, next: null },
        EUR: delCurEur || { currency: 'EUR', in_force: null, next: null },
      });
      setPackagingCurrentByCurrency({
        INR: pkgCurInr || { currency: 'INR', in_force: null, next: null },
        AED: pkgCurAed || { currency: 'AED', in_force: null, next: null },
        EUR: pkgCurEur || { currency: 'EUR', in_force: null, next: null },
      });
    } catch (err) {
      const { generalError } = parseFeeRuleApiError(err);
      setLoadError(
        generalError || 'Failed to load delivery and packaging fee rules.'
      );
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllFeeRules();
  }, [fetchAllFeeRules]);

  const handleDeliveryChange = (field, value) => {
    setDeliveryForm((prev) => ({ ...prev, [field]: value }));
    setDeliveryFieldErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const handlePackagingChange = (field, value) => {
    setPackagingForm((prev) => ({ ...prev, [field]: value }));
    setPackagingFieldErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const handleScheduleDeliveryRule = async (e) => {
    e.preventDefault();
    setDeliveryFieldErrors({});
    setDeliveryGeneralError('');
    setFeedbackBanner(null);
    setDeliverySubmitting(true);
    try {
      const payload = {
        currency: deliveryForm.currency.trim().toUpperCase(),
        free_threshold: deliveryForm.free_threshold,
        flat_fee: deliveryForm.flat_fee,
        tax_rate:
          deliveryForm.tax_rate === '' ? '0.00' : deliveryForm.tax_rate,
        effective_from: deliveryForm.effective_from,
        reason: deliveryForm.reason,
      };
      const created = await apiRequest(
        '/api/admin/orders/delivery-fee-rules/',
        {
          method: 'POST',
          body: JSON.stringify(payload),
        }
      );
      setFeedbackBanner({
        type: 'success',
        text: `Scheduled Delivery Fee Rule v${created.version} (${created.currency}) effective ${created.effective_from}.`,
      });
      setDeliveryForm((prev) => ({
        ...prev,
        free_threshold: '',
        flat_fee: '',
        tax_rate: '0.00',
        reason: '',
      }));
      await fetchAllFeeRules({ silent: true });
    } catch (err) {
      const { fieldErrors, generalError } = parseFeeRuleApiError(err);
      setDeliveryFieldErrors(fieldErrors);
      setDeliveryGeneralError(generalError);
    } finally {
      setDeliverySubmitting(false);
    }
  };

  const handleSchedulePackagingRule = async (e) => {
    e.preventDefault();
    setPackagingFieldErrors({});
    setPackagingGeneralError('');
    setFeedbackBanner(null);
    setPackagingSubmitting(true);
    try {
      const payload = {
        currency: packagingForm.currency.trim().toUpperCase(),
        fee_per_parcel: packagingForm.fee_per_parcel,
        tax_rate:
          packagingForm.tax_rate === '' ? '0.00' : packagingForm.tax_rate,
        effective_from: packagingForm.effective_from,
        reason: packagingForm.reason,
      };
      const created = await apiRequest(
        '/api/admin/orders/packaging-fee-rules/',
        {
          method: 'POST',
          body: JSON.stringify(payload),
        }
      );
      setFeedbackBanner({
        type: 'success',
        text: `Scheduled Packaging Fee Rule v${created.version} (${created.currency}) effective ${created.effective_from}.`,
      });
      setPackagingForm((prev) => ({
        ...prev,
        fee_per_parcel: '',
        tax_rate: '0.00',
        reason: '',
      }));
      await fetchAllFeeRules({ silent: true });
    } catch (err) {
      const { fieldErrors, generalError } = parseFeeRuleApiError(err);
      setPackagingFieldErrors(fieldErrors);
      setPackagingGeneralError(generalError);
    } finally {
      setPackagingSubmitting(false);
    }
  };

  const filteredDeliveryHistory =
    currencyFilter === 'ALL'
      ? deliveryHistory
      : deliveryHistory.filter((r) => r.currency === currencyFilter);

  const filteredPackagingHistory =
    currencyFilter === 'ALL'
      ? packagingHistory
      : packagingHistory.filter((r) => r.currency === currencyFilter);

  const getStatusBadgeCls = (status) => {
    if (status === 'approved') {
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    }
    return 'bg-[#F4F1EE] text-[#6B6058] border-[#EAE3DC]';
  };

  return (
    <div
      data-testid="delivery-packaging-fees-admin-module"
      className="space-y-6 text-xs"
    >
      {/* Header */}
      <div className="bg-white rounded-3xl border border-[#EAE3DC] p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <Truck className="w-5 h-5 text-[#FA661C]" />
            <span className="text-[11px] font-black uppercase tracking-wider text-[#FA661C]">
              Customer Order Pricing Schedule
            </span>
          </div>
          <h1 className="font-['Outfit'] font-extrabold text-xl sm:text-2xl text-[#1A2420]">
            Delivery and Packaging Fees
          </h1>
          <p
            data-testid="fee-rule-immutability-help"
            className="text-xs text-[#6B6058] font-medium"
          >
            A fee rule cannot be edited. To change it, schedule a new version.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => fetchAllFeeRules()}
            disabled={loading}
            data-testid="refresh-fee-rules-btn"
            className="px-4 py-2 rounded-xl border border-[#EAE3DC] bg-white hover:bg-[#FFF3EC] text-[#1A2420] font-bold flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
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

      {/* Read-only note for roles that cannot create */}
      {!isStaffAdmin && (
        <div
          data-testid="fee-rules-readonly-notice"
          className="p-4 rounded-2xl border border-amber-300 bg-amber-50 text-amber-900 flex items-center space-x-2.5 font-semibold"
        >
          <Lock className="w-4 h-4 text-amber-700 shrink-0" />
          <span>
            Read-only view: Only staff administrators can schedule new delivery
            or packaging fee rules.
          </span>
        </div>
      )}

      {/* Feedback Banner */}
      {feedbackBanner && (
        <div
          data-testid="fee-rules-feedback-banner"
          className={`p-4 rounded-2xl border flex items-center justify-between gap-3 ${
            feedbackBanner.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-red-50 border-red-200 text-red-900'
          }`}
        >
          <div className="flex items-center space-x-2 font-bold">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{feedbackBanner.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedbackBanner(null)}
            className="text-xs underline font-semibold cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Load Error */}
      {loadError && (
        <div
          role="alert"
          data-testid="fee-rules-load-error"
          className="p-4 rounded-2xl border border-red-200 bg-red-50 text-red-800 flex items-center space-x-2 font-bold"
        >
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{loadError}</span>
        </div>
      )}

      {/* Mode Switch Tabs: Delivery Fees vs Packaging Fees */}
      <div className="bg-[#FFF3EC] p-1.5 rounded-2xl border border-[#EAE3DC] grid grid-cols-2 gap-2">
        <button
          type="button"
          data-testid="tab-delivery-fee-rules"
          onClick={() => setActiveTab('delivery')}
          className={`py-2.5 px-4 rounded-xl font-bold transition-all cursor-pointer flex items-center justify-center space-x-2 ${
            activeTab === 'delivery'
              ? 'bg-[#FA661C] text-white shadow-xs'
              : 'text-[#6B6058] hover:text-[#FA661C]'
          }`}
        >
          <Truck className="w-4 h-4" />
          <span>Delivery Fee Rules ({deliveryHistory.length})</span>
        </button>

        <button
          type="button"
          data-testid="tab-packaging-fee-rules"
          onClick={() => setActiveTab('packaging')}
          className={`py-2.5 px-4 rounded-xl font-bold transition-all cursor-pointer flex items-center justify-center space-x-2 ${
            activeTab === 'packaging'
              ? 'bg-[#FA661C] text-white shadow-xs'
              : 'text-[#6B6058] hover:text-[#FA661C]'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>Packaging Fee Rules ({packagingHistory.length})</span>
        </button>
      </div>

      {/* ================= DELIVERY FEE RULES TAB ================= */}
      {activeTab === 'delivery' && (
        <div data-testid="delivery-fee-rules-section" className="space-y-6">
          {/* 1. In Force Today & Next Scheduled per Currency */}
          <div className="bg-white rounded-3xl border border-[#EAE3DC] p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-[#EAE3DC] pb-3">
              <div>
                <h2 className="font-['Outfit'] font-extrabold text-base text-[#1A2420]">
                  Delivery Fee Schedule by Currency (In Force Today &amp; Next Scheduled)
                </h2>
                <p className="text-[11px] text-[#6B6058]">
                  Free delivery when item subtotal is at or above the threshold; otherwise the flat fee applies per order.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {SUPPORTED_FEE_CURRENCIES.map((cur) => {
                const sched = deliveryCurrentByCurrency[cur] || {};
                const inForce = sched.in_force;
                const nextRule = sched.next;
                return (
                  <div
                    key={cur}
                    data-testid={`delivery-current-card-${cur}`}
                    className="p-4 rounded-2xl border border-[#EAE3DC] bg-[#FFF8F2]/60 space-y-3"
                  >
                    <div className="flex items-center justify-between border-b border-[#EAE3DC] pb-2">
                      <span className="font-['Outfit'] font-black text-sm text-[#FA661C]">
                        {cur}
                      </span>
                      {sched.as_of_date && (
                        <span className="text-[10px] font-mono text-[#6B6058]">
                          As of {sched.as_of_date}
                        </span>
                      )}
                    </div>

                    {/* In Force Today */}
                    <div
                      data-testid={`delivery-in-force-${cur}`}
                      className="p-3 rounded-xl bg-white border border-[#EAE3DC] space-y-1"
                    >
                      <span className="text-[10px] font-black uppercase text-emerald-700 block">
                        In Force Today
                      </span>
                      {inForce ? (
                        <div className="space-y-1">
                          <div className="flex justify-between">
                            <span className="text-[#6B6058]">Flat Fee:</span>
                            <strong
                              data-testid={`delivery-in-force-fee-${cur}`}
                              className="font-mono text-[#1A2420]"
                            >
                              {formatVerbatimMoney(inForce.currency, inForce.flat_fee)}
                            </strong>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-[#6B6058]">Free Threshold:</span>
                            <strong
                              data-testid={`delivery-in-force-threshold-${cur}`}
                              className="font-mono text-[#1A2420]"
                            >
                              {formatVerbatimMoney(
                                inForce.currency,
                                inForce.free_threshold
                              )}
                            </strong>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-[#6B6058]">Tax Rate:</span>
                            <span
                              data-testid={`delivery-in-force-tax-${cur}`}
                              className="font-mono text-[#1A2420]"
                            >
                              {inForce.tax_rate}%
                            </span>
                          </div>
                          <div className="text-[10px] text-[#6B6058] pt-1 border-t border-[#EAE3DC]/60">
                            v{inForce.version} • From {inForce.effective_from}
                            {inForce.effective_to
                              ? ` to ${inForce.effective_to}`
                              : ''}
                          </div>
                        </div>
                      ) : (
                        <p className="text-[#6B6058] italic">
                          No delivery fee rule in force today
                        </p>
                      )}
                    </div>

                    {/* Next Scheduled */}
                    <div
                      data-testid={`delivery-next-${cur}`}
                      className="p-3 rounded-xl bg-white border border-[#EAE3DC] space-y-1"
                    >
                      <span className="text-[10px] font-black uppercase text-[#1E64D4] block">
                        Next Scheduled
                      </span>
                      {nextRule ? (
                        <div className="space-y-1">
                          <div className="flex justify-between">
                            <span className="text-[#6B6058]">Flat Fee:</span>
                            <strong
                              data-testid={`delivery-next-fee-${cur}`}
                              className="font-mono text-[#1A2420]"
                            >
                              {formatVerbatimMoney(
                                nextRule.currency,
                                nextRule.flat_fee
                              )}
                            </strong>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-[#6B6058]">Free Threshold:</span>
                            <strong
                              data-testid={`delivery-next-threshold-${cur}`}
                              className="font-mono text-[#1A2420]"
                            >
                              {formatVerbatimMoney(
                                nextRule.currency,
                                nextRule.free_threshold
                              )}
                            </strong>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-[#6B6058]">Tax Rate:</span>
                            <span className="font-mono text-[#1A2420]">
                              {nextRule.tax_rate}%
                            </span>
                          </div>
                          <div className="text-[10px] text-[#6B6058] pt-1 border-t border-[#EAE3DC]/60">
                            v{nextRule.version} • Starts {nextRule.effective_from}
                          </div>
                        </div>
                      ) : (
                        <p className="text-[#6B6058] italic">
                          None scheduled
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 2. Schedule New Delivery Fee Rule Form */}
          {isStaffAdmin && (
            <div className="bg-white rounded-3xl border border-[#EAE3DC] p-5 sm:p-6 shadow-xs space-y-4">
              <div className="border-b border-[#EAE3DC] pb-3">
                <h2 className="font-['Outfit'] font-extrabold text-base text-[#1A2420] flex items-center space-x-2">
                  <PlusCircle className="w-4 h-4 text-[#FA661C]" />
                  <span>Schedule New Delivery Fee Rule</span>
                </h2>
                <p className="text-[11px] text-[#6B6058] mt-0.5">
                  A fee rule cannot be edited. To change it, schedule a new version.
                </p>
              </div>

              {deliveryGeneralError && (
                <div
                  role="alert"
                  data-testid="delivery-form-general-error"
                  className="p-3 rounded-xl border border-red-200 bg-red-50 text-red-800 font-bold flex items-center space-x-2"
                >
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>{deliveryGeneralError}</span>
                </div>
              )}

              <form
                onSubmit={handleScheduleDeliveryRule}
                data-testid="schedule-delivery-fee-form"
                className="space-y-4"
                noValidate
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                  {/* Currency */}
                  <div>
                    <label
                      htmlFor="delivery-currency"
                      className="block font-bold text-[#1A2420] mb-1"
                    >
                      Currency *
                    </label>
                    <select
                      id="delivery-currency"
                      data-testid="delivery-currency-input"
                      value={deliveryForm.currency}
                      onChange={(e) =>
                        handleDeliveryChange('currency', e.target.value)
                      }
                      className="w-full px-3 py-2 rounded-xl border border-[#EAE3DC] bg-white font-bold"
                    >
                      {SUPPORTED_FEE_CURRENCIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                    {deliveryFieldErrors.currency && (
                      <p
                        data-testid="delivery-error-currency"
                        className="mt-1 text-red-600 font-semibold text-[11px]"
                      >
                        {deliveryFieldErrors.currency}
                      </p>
                    )}
                  </div>

                  {/* Free-delivery threshold */}
                  <div>
                    <label
                      htmlFor="delivery-free-threshold"
                      className="block font-bold text-[#1A2420] mb-1"
                    >
                      Free-Delivery Threshold *
                    </label>
                    <input
                      id="delivery-free-threshold"
                      type="text"
                      data-testid="delivery-free-threshold-input"
                      value={deliveryForm.free_threshold}
                      onChange={(e) =>
                        handleDeliveryChange('free_threshold', e.target.value)
                      }
                      placeholder="e.g. 500.00"
                      className="w-full px-3 py-2 rounded-xl border border-[#EAE3DC] font-mono"
                    />
                    {deliveryFieldErrors.free_threshold && (
                      <p
                        data-testid="delivery-error-free_threshold"
                        className="mt-1 text-red-600 font-semibold text-[11px]"
                      >
                        {deliveryFieldErrors.free_threshold}
                      </p>
                    )}
                  </div>

                  {/* Flat fee */}
                  <div>
                    <label
                      htmlFor="delivery-flat-fee"
                      className="block font-bold text-[#1A2420] mb-1"
                    >
                      Flat Fee *
                    </label>
                    <input
                      id="delivery-flat-fee"
                      type="text"
                      data-testid="delivery-flat-fee-input"
                      value={deliveryForm.flat_fee}
                      onChange={(e) =>
                        handleDeliveryChange('flat_fee', e.target.value)
                      }
                      placeholder="e.g. 40.00"
                      className="w-full px-3 py-2 rounded-xl border border-[#EAE3DC] font-mono"
                    />
                    {deliveryFieldErrors.flat_fee && (
                      <p
                        data-testid="delivery-error-flat_fee"
                        className="mt-1 text-red-600 font-semibold text-[11px]"
                      >
                        {deliveryFieldErrors.flat_fee}
                      </p>
                    )}
                  </div>

                  {/* Tax rate */}
                  <div>
                    <label
                      htmlFor="delivery-tax-rate"
                      className="block font-bold text-[#1A2420] mb-1"
                    >
                      Tax Rate (%)
                    </label>
                    <input
                      id="delivery-tax-rate"
                      type="text"
                      data-testid="delivery-tax-rate-input"
                      value={deliveryForm.tax_rate}
                      onChange={(e) =>
                        handleDeliveryChange('tax_rate', e.target.value)
                      }
                      placeholder="0.00"
                      className="w-full px-3 py-2 rounded-xl border border-[#EAE3DC] font-mono"
                    />
                    <p
                      data-testid="delivery-tax-rate-help"
                      className="mt-1 text-[10px] text-[#6B6058]"
                    >
                      Tax treatment is not decided yet. Leave at 0 unless your accountant confirms.
                    </p>
                    {deliveryFieldErrors.tax_rate && (
                      <p
                        data-testid="delivery-error-tax_rate"
                        className="mt-1 text-red-600 font-semibold text-[11px]"
                      >
                        {deliveryFieldErrors.tax_rate}
                      </p>
                    )}
                  </div>

                  {/* Effective from */}
                  <div>
                    <label
                      htmlFor="delivery-effective-from"
                      className="block font-bold text-[#1A2420] mb-1"
                    >
                      Effective From *
                    </label>
                    <input
                      id="delivery-effective-from"
                      type="date"
                      data-testid="delivery-effective-from-input"
                      value={deliveryForm.effective_from}
                      onChange={(e) =>
                        handleDeliveryChange('effective_from', e.target.value)
                      }
                      className="w-full px-3 py-2 rounded-xl border border-[#EAE3DC] font-mono"
                    />
                    {deliveryFieldErrors.effective_from && (
                      <p
                        data-testid="delivery-error-effective_from"
                        className="mt-1 text-red-600 font-semibold text-[11px]"
                      >
                        {deliveryFieldErrors.effective_from}
                      </p>
                    )}
                  </div>
                </div>

                {/* Reason */}
                <div>
                  <label
                    htmlFor="delivery-reason"
                    className="block font-bold text-[#1A2420] mb-1"
                  >
                    Reason *
                  </label>
                  <input
                    id="delivery-reason"
                    type="text"
                    data-testid="delivery-reason-input"
                    value={deliveryForm.reason}
                    onChange={(e) =>
                      handleDeliveryChange('reason', e.target.value)
                    }
                    placeholder="Audit reason for scheduling this delivery fee version"
                    className="w-full px-3 py-2 rounded-xl border border-[#EAE3DC]"
                  />
                  {deliveryFieldErrors.reason && (
                    <p
                      data-testid="delivery-error-reason"
                      className="mt-1 text-red-600 font-semibold text-[11px]"
                    >
                      {deliveryFieldErrors.reason}
                    </p>
                  )}
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={deliverySubmitting}
                    data-testid="delivery-submit-btn"
                    className="px-5 py-2.5 rounded-xl bg-[#FA661C] hover:bg-[#E0530B] text-white font-bold cursor-pointer disabled:opacity-50"
                  >
                    {deliverySubmitting
                      ? 'Scheduling...'
                      : 'Schedule Delivery Fee Rule'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* 3. Delivery Fee Version History Table (No edit or delete controls) */}
          <div className="bg-white rounded-3xl border border-[#EAE3DC] p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#EAE3DC] pb-3">
              <h2 className="font-['Outfit'] font-extrabold text-base text-[#1A2420]">
                Delivery Fee Version History
              </h2>
              <div className="flex items-center space-x-2">
                <span className="text-[#6B6058] font-bold">Currency:</span>
                {['ALL', ...SUPPORTED_FEE_CURRENCIES].map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setCurrencyFilter(c)}
                    className={`px-2.5 py-1 rounded-lg font-bold cursor-pointer ${
                      currencyFilter === c
                        ? 'bg-[#FA661C] text-white'
                        : 'bg-[#FFF3EC] text-[#6B6058]'
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            {filteredDeliveryHistory.length === 0 ? (
              <p className="text-center py-8 text-[#6B6058]">
                No delivery fee rules recorded yet.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table
                  data-testid="delivery-history-table"
                  className="w-full text-left border-collapse"
                >
                  <thead>
                    <tr className="border-b border-[#EAE3DC] text-[#6B6058] uppercase text-[10px]">
                      <th className="py-2.5 px-3">Currency</th>
                      <th className="py-2.5 px-3">Version</th>
                      <th className="py-2.5 px-3">Free Threshold</th>
                      <th className="py-2.5 px-3">Flat Fee</th>
                      <th className="py-2.5 px-3">Tax Rate</th>
                      <th className="py-2.5 px-3">Effective From</th>
                      <th className="py-2.5 px-3">Effective To</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3">Reason</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EAE3DC]/60">
                    {filteredDeliveryHistory.map((rule) => (
                      <tr
                        key={rule.id}
                        data-testid={`delivery-rule-row-${rule.id}`}
                        className="hover:bg-[#FFF8F2]/50"
                      >
                        <td className="py-2.5 px-3 font-bold">
                          {rule.currency}
                        </td>
                        <td className="py-2.5 px-3 font-mono font-bold">
                          v{rule.version}
                        </td>
                        <td className="py-2.5 px-3 font-mono">
                          {formatVerbatimMoney(
                            rule.currency,
                            rule.free_threshold
                          )}
                        </td>
                        <td className="py-2.5 px-3 font-mono font-bold">
                          {formatVerbatimMoney(rule.currency, rule.flat_fee)}
                        </td>
                        <td className="py-2.5 px-3 font-mono">
                          {rule.tax_rate}%
                        </td>
                        <td className="py-2.5 px-3 font-mono">
                          {rule.effective_from}
                        </td>
                        <td className="py-2.5 px-3 font-mono">
                          {rule.effective_to || '—'}
                        </td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getStatusBadgeCls(
                              rule.status
                            )}`}
                          >
                            {FEE_RULE_STATUS_LABELS[rule.status] || rule.status}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-[#1A2420]">
                          {rule.reason}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================= PACKAGING FEE RULES TAB ================= */}
      {activeTab === 'packaging' && (
        <div data-testid="packaging-fee-rules-section" className="space-y-6">
          {/* 1. In Force Today & Next Scheduled per Currency */}
          <div className="bg-white rounded-3xl border border-[#EAE3DC] p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-[#EAE3DC] pb-3">
              <div>
                <h2 className="font-['Outfit'] font-extrabold text-base text-[#1A2420]">
                  Packaging Fee Schedule by Currency (In Force Today &amp; Next Scheduled)
                </h2>
                <p className="text-[11px] text-[#6B6058]">
                  Applied once per seller parcel in an order.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {SUPPORTED_FEE_CURRENCIES.map((cur) => {
                const sched = packagingCurrentByCurrency[cur] || {};
                const inForce = sched.in_force;
                const nextRule = sched.next;
                return (
                  <div
                    key={cur}
                    data-testid={`packaging-current-card-${cur}`}
                    className="p-4 rounded-2xl border border-[#EAE3DC] bg-[#FFF8F2]/60 space-y-3"
                  >
                    <div className="flex items-center justify-between border-b border-[#EAE3DC] pb-2">
                      <span className="font-['Outfit'] font-black text-sm text-[#FA661C]">
                        {cur}
                      </span>
                      {sched.as_of_date && (
                        <span className="text-[10px] font-mono text-[#6B6058]">
                          As of {sched.as_of_date}
                        </span>
                      )}
                    </div>

                    {/* In Force Today */}
                    <div
                      data-testid={`packaging-in-force-${cur}`}
                      className="p-3 rounded-xl bg-white border border-[#EAE3DC] space-y-1"
                    >
                      <span className="text-[10px] font-black uppercase text-emerald-700 block">
                        In Force Today
                      </span>
                      {inForce ? (
                        <div className="space-y-1">
                          <div className="flex justify-between">
                            <span className="text-[#6B6058]">Fee per Parcel:</span>
                            <strong
                              data-testid={`packaging-in-force-fee-${cur}`}
                              className="font-mono text-[#1A2420]"
                            >
                              {formatVerbatimMoney(
                                inForce.currency,
                                inForce.fee_per_parcel
                              )}
                            </strong>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-[#6B6058]">Tax Rate:</span>
                            <span
                              data-testid={`packaging-in-force-tax-${cur}`}
                              className="font-mono text-[#1A2420]"
                            >
                              {inForce.tax_rate}%
                            </span>
                          </div>
                          <div className="text-[10px] text-[#6B6058] pt-1 border-t border-[#EAE3DC]/60">
                            v{inForce.version} • From {inForce.effective_from}
                            {inForce.effective_to
                              ? ` to ${inForce.effective_to}`
                              : ''}
                          </div>
                        </div>
                      ) : (
                        <p className="text-[#6B6058] italic">
                          No packaging fee rule in force today
                        </p>
                      )}
                    </div>

                    {/* Next Scheduled */}
                    <div
                      data-testid={`packaging-next-${cur}`}
                      className="p-3 rounded-xl bg-white border border-[#EAE3DC] space-y-1"
                    >
                      <span className="text-[10px] font-black uppercase text-[#1E64D4] block">
                        Next Scheduled
                      </span>
                      {nextRule ? (
                        <div className="space-y-1">
                          <div className="flex justify-between">
                            <span className="text-[#6B6058]">Fee per Parcel:</span>
                            <strong
                              data-testid={`packaging-next-fee-${cur}`}
                              className="font-mono text-[#1A2420]"
                            >
                              {formatVerbatimMoney(
                                nextRule.currency,
                                nextRule.fee_per_parcel
                              )}
                            </strong>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-[#6B6058]">Tax Rate:</span>
                            <span className="font-mono text-[#1A2420]">
                              {nextRule.tax_rate}%
                            </span>
                          </div>
                          <div className="text-[10px] text-[#6B6058] pt-1 border-t border-[#EAE3DC]/60">
                            v{nextRule.version} • Starts {nextRule.effective_from}
                          </div>
                        </div>
                      ) : (
                        <p className="text-[#6B6058] italic">
                          None scheduled
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 2. Schedule New Packaging Fee Rule Form */}
          {isStaffAdmin && (
            <div className="bg-white rounded-3xl border border-[#EAE3DC] p-5 sm:p-6 shadow-xs space-y-4">
              <div className="border-b border-[#EAE3DC] pb-3">
                <h2 className="font-['Outfit'] font-extrabold text-base text-[#1A2420] flex items-center space-x-2">
                  <PlusCircle className="w-4 h-4 text-[#FA661C]" />
                  <span>Schedule New Packaging Fee Rule</span>
                </h2>
                <p className="text-[11px] text-[#6B6058] mt-0.5">
                  A fee rule cannot be edited. To change it, schedule a new version.
                </p>
              </div>

              {packagingGeneralError && (
                <div
                  role="alert"
                  data-testid="packaging-form-general-error"
                  className="p-3 rounded-xl border border-red-200 bg-red-50 text-red-800 font-bold flex items-center space-x-2"
                >
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>{packagingGeneralError}</span>
                </div>
              )}

              <form
                onSubmit={handleSchedulePackagingRule}
                data-testid="schedule-packaging-fee-form"
                className="space-y-4"
                noValidate
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Currency */}
                  <div>
                    <label
                      htmlFor="packaging-currency"
                      className="block font-bold text-[#1A2420] mb-1"
                    >
                      Currency *
                    </label>
                    <select
                      id="packaging-currency"
                      data-testid="packaging-currency-input"
                      value={packagingForm.currency}
                      onChange={(e) =>
                        handlePackagingChange('currency', e.target.value)
                      }
                      className="w-full px-3 py-2 rounded-xl border border-[#EAE3DC] bg-white font-bold"
                    >
                      {SUPPORTED_FEE_CURRENCIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                    {packagingFieldErrors.currency && (
                      <p
                        data-testid="packaging-error-currency"
                        className="mt-1 text-red-600 font-semibold text-[11px]"
                      >
                        {packagingFieldErrors.currency}
                      </p>
                    )}
                  </div>

                  {/* Fee per parcel */}
                  <div>
                    <label
                      htmlFor="packaging-fee-per-parcel"
                      className="block font-bold text-[#1A2420] mb-1"
                    >
                      Fee per Parcel *
                    </label>
                    <input
                      id="packaging-fee-per-parcel"
                      type="text"
                      data-testid="packaging-fee-per-parcel-input"
                      value={packagingForm.fee_per_parcel}
                      onChange={(e) =>
                        handlePackagingChange('fee_per_parcel', e.target.value)
                      }
                      placeholder="e.g. 15.00"
                      className="w-full px-3 py-2 rounded-xl border border-[#EAE3DC] font-mono"
                    />
                    {packagingFieldErrors.fee_per_parcel && (
                      <p
                        data-testid="packaging-error-fee_per_parcel"
                        className="mt-1 text-red-600 font-semibold text-[11px]"
                      >
                        {packagingFieldErrors.fee_per_parcel}
                      </p>
                    )}
                  </div>

                  {/* Tax rate */}
                  <div>
                    <label
                      htmlFor="packaging-tax-rate"
                      className="block font-bold text-[#1A2420] mb-1"
                    >
                      Tax Rate (%)
                    </label>
                    <input
                      id="packaging-tax-rate"
                      type="text"
                      data-testid="packaging-tax-rate-input"
                      value={packagingForm.tax_rate}
                      onChange={(e) =>
                        handlePackagingChange('tax_rate', e.target.value)
                      }
                      placeholder="0.00"
                      className="w-full px-3 py-2 rounded-xl border border-[#EAE3DC] font-mono"
                    />
                    <p
                      data-testid="packaging-tax-rate-help"
                      className="mt-1 text-[10px] text-[#6B6058]"
                    >
                      Tax treatment is not decided yet. Leave at 0 unless your accountant confirms.
                    </p>
                    {packagingFieldErrors.tax_rate && (
                      <p
                        data-testid="packaging-error-tax_rate"
                        className="mt-1 text-red-600 font-semibold text-[11px]"
                      >
                        {packagingFieldErrors.tax_rate}
                      </p>
                    )}
                  </div>

                  {/* Effective from */}
                  <div>
                    <label
                      htmlFor="packaging-effective-from"
                      className="block font-bold text-[#1A2420] mb-1"
                    >
                      Effective From *
                    </label>
                    <input
                      id="packaging-effective-from"
                      type="date"
                      data-testid="packaging-effective-from-input"
                      value={packagingForm.effective_from}
                      onChange={(e) =>
                        handlePackagingChange('effective_from', e.target.value)
                      }
                      className="w-full px-3 py-2 rounded-xl border border-[#EAE3DC] font-mono"
                    />
                    {packagingFieldErrors.effective_from && (
                      <p
                        data-testid="packaging-error-effective_from"
                        className="mt-1 text-red-600 font-semibold text-[11px]"
                      >
                        {packagingFieldErrors.effective_from}
                      </p>
                    )}
                  </div>
                </div>

                {/* Reason */}
                <div>
                  <label
                    htmlFor="packaging-reason"
                    className="block font-bold text-[#1A2420] mb-1"
                  >
                    Reason *
                  </label>
                  <input
                    id="packaging-reason"
                    type="text"
                    data-testid="packaging-reason-input"
                    value={packagingForm.reason}
                    onChange={(e) =>
                      handlePackagingChange('reason', e.target.value)
                    }
                    placeholder="Audit reason for scheduling this packaging fee version"
                    className="w-full px-3 py-2 rounded-xl border border-[#EAE3DC]"
                  />
                  {packagingFieldErrors.reason && (
                    <p
                      data-testid="packaging-error-reason"
                      className="mt-1 text-red-600 font-semibold text-[11px]"
                    >
                      {packagingFieldErrors.reason}
                    </p>
                  )}
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={packagingSubmitting}
                    data-testid="packaging-submit-btn"
                    className="px-5 py-2.5 rounded-xl bg-[#FA661C] hover:bg-[#E0530B] text-white font-bold cursor-pointer disabled:opacity-50"
                  >
                    {packagingSubmitting
                      ? 'Scheduling...'
                      : 'Schedule Packaging Fee Rule'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* 3. Packaging Fee Version History Table (No edit or delete controls) */}
          <div className="bg-white rounded-3xl border border-[#EAE3DC] p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#EAE3DC] pb-3">
              <h2 className="font-['Outfit'] font-extrabold text-base text-[#1A2420]">
                Packaging Fee Version History
              </h2>
              <div className="flex items-center space-x-2">
                <span className="text-[#6B6058] font-bold">Currency:</span>
                {['ALL', ...SUPPORTED_FEE_CURRENCIES].map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setCurrencyFilter(c)}
                    className={`px-2.5 py-1 rounded-lg font-bold cursor-pointer ${
                      currencyFilter === c
                        ? 'bg-[#FA661C] text-white'
                        : 'bg-[#FFF3EC] text-[#6B6058]'
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            {filteredPackagingHistory.length === 0 ? (
              <p className="text-center py-8 text-[#6B6058]">
                No packaging fee rules recorded yet.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table
                  data-testid="packaging-history-table"
                  className="w-full text-left border-collapse"
                >
                  <thead>
                    <tr className="border-b border-[#EAE3DC] text-[#6B6058] uppercase text-[10px]">
                      <th className="py-2.5 px-3">Currency</th>
                      <th className="py-2.5 px-3">Version</th>
                      <th className="py-2.5 px-3">Fee per Parcel</th>
                      <th className="py-2.5 px-3">Tax Rate</th>
                      <th className="py-2.5 px-3">Effective From</th>
                      <th className="py-2.5 px-3">Effective To</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3">Reason</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EAE3DC]/60">
                    {filteredPackagingHistory.map((rule) => (
                      <tr
                        key={rule.id}
                        data-testid={`packaging-rule-row-${rule.id}`}
                        className="hover:bg-[#FFF8F2]/50"
                      >
                        <td className="py-2.5 px-3 font-bold">
                          {rule.currency}
                        </td>
                        <td className="py-2.5 px-3 font-mono font-bold">
                          v{rule.version}
                        </td>
                        <td className="py-2.5 px-3 font-mono font-bold">
                          {formatVerbatimMoney(
                            rule.currency,
                            rule.fee_per_parcel
                          )}
                        </td>
                        <td className="py-2.5 px-3 font-mono">
                          {rule.tax_rate}%
                        </td>
                        <td className="py-2.5 px-3 font-mono">
                          {rule.effective_from}
                        </td>
                        <td className="py-2.5 px-3 font-mono">
                          {rule.effective_to || '—'}
                        </td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getStatusBadgeCls(
                              rule.status
                            )}`}
                          >
                            {FEE_RULE_STATUS_LABELS[rule.status] || rule.status}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-[#1A2420]">
                          {rule.reason}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

