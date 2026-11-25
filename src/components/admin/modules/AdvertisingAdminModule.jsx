import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Sparkles,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  ShieldAlert,
  PlusCircle,
  RotateCcw,
  Filter,
  Scale,
  CreditCard,
  BookOpen,
  Megaphone,
  ClipboardCheck,
  Tag,
  Eye,
  XCircle,
  Ban,
  Info,
  X,
  MousePointerClick,
  Banknote,
} from 'lucide-react';
import { apiRequest } from '../../../utils/api';
import { useAuth } from '../../../context/AuthContext';
import {
  AD_STATUSES,
  AD_STATUS_LABELS,
  AD_PLACEMENTS,
  AD_PLACEMENT_LABELS,
  AD_CREATIVE_MODERATION_LABELS,
  AD_CLICK_RATE_STATUSES,
  AD_CLICK_RATE_STATUS_LABELS,
  AD_PRICE_STATUSES,
  AD_PRICE_STATUS_LABELS,
  AD_PAYMENT_STATUSES,
  AD_PAYMENT_STATUS_LABELS,
  AD_LEDGER_ENTRY_TYPE_LABELS,
  AD_CLICK_DECISIONS,
  AD_CLICK_REASONS,
  formatAdLedgerEntryTypeLabel,
  formatAdEndReasonLabel,
  formatAdClickDecisionLabel,
  formatAdClickReasonLabel,
  getAdClickDecisionBadgeClass,
  canOfferUnspentRefund,
  getAdStatusBadgeClass,
  getAdClickRateStatusBadgeClass,
  getAdPaymentStatusBadgeClass,
  getAdLedgerBadgeClass,
  formatAdDateTime,
  formatAdPlacementLabel,
  isAdCreativeRejected,
  getAdRejectionReason,
  useAuthenticatedImageUrl,
  parseAdvertisingApiError,
} from '../../../utils/advertisingUtils';

function openNativeDialog(dialogEl) {
  if (!dialogEl) return;
  if (typeof dialogEl.showModal === 'function') {
    try {
      if (!dialogEl.open) dialogEl.showModal();
    } catch {
      dialogEl.setAttribute('open', '');
    }
  } else {
    dialogEl.setAttribute('open', '');
  }
}

function closeNativeDialog(dialogEl) {
  if (!dialogEl) return;
  if (typeof dialogEl.close === 'function') {
    try {
      if (dialogEl.open) dialogEl.close();
    } catch {
      dialogEl.removeAttribute('open');
    }
  } else {
    dialogEl.removeAttribute('open');
  }
}

function getTodayIsoDate() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export default function AdvertisingAdminModule() {
  const { currentUser } = useAuth();
  const isSuperuser = currentUser?.is_superuser !== false;

  // 'ads' | 'review_queue' | 'click_rates' | 'clicks' | 'payments' | 'ledger' | 'reconciliation'
  const [activeTab, setActiveTab] = useState('ads');

  // Shared filter controls (for ads, payments, ledger, reconciliation)
  const [sellerFilter, setSellerFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [adFilter, setAdFilter] = useState('');

  // Review Queue filters & state (Phase 2: default filter pending_review)
  const [reviewQueueStatusFilter, setReviewQueueStatusFilter] =
    useState('pending_review');
  const [reviewQueuePlacementFilter, setReviewQueuePlacementFilter] =
    useState('');
  const [reviewQueueSellerFilter, setReviewQueueSellerFilter] = useState('');
  const [reviewQueueItems, setReviewQueueItems] = useState([]);
  const [selectedReviewAd, setSelectedReviewAd] = useState(null);

  // Click Rates filters & state (Phase 2: any staff admin can schedule)
  const [clickRatePlacementFilter, setClickRatePlacementFilter] = useState('');
  const [clickRateStatusFilter, setClickRateStatusFilter] = useState('');
  const [clickRatesCurrent, setClickRatesCurrent] = useState({
    as_of_date: '',
    placements: {},
  });
  const [clickRatesHistory, setClickRatesHistory] = useState([]);

  // Ad Prices filters & state (any staff admin can schedule)
  const [adPricePlacementFilter, setAdPricePlacementFilter] = useState('');
  const [adPriceStatusFilter, setAdPriceStatusFilter] = useState('');
  const [adPricesCurrent, setAdPricesCurrent] = useState({
    as_of_date: '',
    placements: {},
  });
  const [adPricesHistory, setAdPricesHistory] = useState([]);

  // Clicks tab filters & state (Phase 3 Part 1: read-only staff click log + per-ad counts)
  const [clicksAdFilter, setClicksAdFilter] = useState('');
  const [clicksDecisionFilter, setClicksDecisionFilter] = useState('');
  const [clicksReasonFilter, setClicksReasonFilter] = useState('');
  const [clicksDateFromFilter, setClicksDateFromFilter] = useState('');
  const [clicksDateToFilter, setClicksDateToFilter] = useState('');
  const [clicksResults, setClicksResults] = useState([]);
  const [clicksCountsByAd, setClicksCountsByAd] = useState([]);

  // Schedule new click rate form state (any staff admin)
  const [newRatePlacement, setNewRatePlacement] = useState('header_banner');
  const [newRateAmount, setNewRateAmount] = useState('');
  const [newRateEffectiveFrom, setNewRateEffectiveFrom] = useState('');
  const [newRateReason, setNewRateReason] = useState('');
  const [newRateFieldErrors, setNewRateFieldErrors] = useState({});
  const [newRateGeneralError, setNewRateGeneralError] = useState('');
  const [newRateSubmitting, setNewRateSubmitting] = useState(false);

  // Schedule new ad price form state (any staff admin)
  const [newPricePlacement, setNewPricePlacement] = useState('header_banner');
  const [newPriceAmount, setNewPriceAmount] = useState('');
  const [newPriceEffectiveFrom, setNewPriceEffectiveFrom] = useState('');
  const [newPriceReason, setNewPriceReason] = useState('');
  const [newPriceFieldErrors, setNewPriceFieldErrors] = useState({});
  const [newPriceGeneralError, setNewPriceGeneralError] = useState('');
  const [newPriceSubmitting, setNewPriceSubmitting] = useState(false);

  // Phase 1 server data
  const [ads, setAds] = useState([]);
  const [payments, setPayments] = useState([]);
  const [ledger, setLedger] = useState([]);
  const [reconciliation, setReconciliation] = useState({
    advertisements: [],
    totals: {
      funded: '0.00',
      funded_real: '0.00',
      funded_simulated: '0.00',
      spent: '0.00',
      remaining: '0.00',
    },
  });

  const [loading, setLoading] = useState(true);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [feedbackBanner, setFeedbackBanner] = useState(null); // { type: 'success' | 'error' | 'warning', text: string }

  // Manual credit dialog state
  const [creditTargetAd, setCreditTargetAd] = useState(null);
  const [creditAmount, setCreditAmount] = useState('');
  const [creditExternalRef, setCreditExternalRef] = useState('');
  const [creditReceivedDate, setCreditReceivedDate] = useState(getTodayIsoDate);
  const [creditReason, setCreditReason] = useState('');
  const [creditFieldErrors, setCreditFieldErrors] = useState({});
  const [creditDialogError, setCreditDialogError] = useState('');
  const [creditSubmitting, setCreditSubmitting] = useState(false);

  // Reverse payment dialog state
  const [reverseTargetPayment, setReverseTargetPayment] = useState(null);
  const [reverseReason, setReverseReason] = useState('');
  const [reverseConfirm, setReverseConfirm] = useState(false);
  const [reverseOutcome, setReverseOutcome] = useState('error_correction');
  const [reverseFieldErrors, setReverseFieldErrors] = useState({});
  const [reverseDialogError, setReverseDialogError] = useState('');
  const [reverseSubmitting, setReverseSubmitting] = useState(false);

  // Refund unspent money dialog state (Phase 3 Part 1: superuser only)
  const [refundTargetAd, setRefundTargetAd] = useState(null);
  const [refundExternalRef, setRefundExternalRef] = useState('');
  const [refundDate, setRefundDate] = useState(getTodayIsoDate);
  const [refundReason, setRefundReason] = useState('');
  const [refundConfirm, setRefundConfirm] = useState(false);
  const [refundFieldErrors, setRefundFieldErrors] = useState({});
  const [refundDialogError, setRefundDialogError] = useState('');
  const [refundSubmitting, setRefundSubmitting] = useState(false);

  // Review Queue moderation dialog state: { action: 'approve' | 'reject' | 'take-down', ad: obj }
  const [reviewActionTarget, setReviewActionTarget] = useState(null);
  const [reviewActionReason, setReviewActionReason] = useState('');
  const [reviewActionFieldErrors, setReviewActionFieldErrors] = useState({});
  const [reviewActionDialogError, setReviewActionDialogError] = useState('');
  const [reviewActionSubmitting, setReviewActionSubmitting] = useState(false);

  // Reverse click charge dialog state (Phase 3 Part 2: superuser only)
  const [reverseClickTarget, setReverseClickTarget] = useState(null);
  const [reverseClickReason, setReverseClickReason] = useState('');
  const [reverseClickConfirm, setReverseClickConfirm] = useState(false);
  const [reverseClickFieldErrors, setReverseClickFieldErrors] = useState({});
  const [reverseClickDialogError, setReverseClickDialogError] = useState('');
  const [reverseClickSubmitting, setReverseClickSubmitting] = useState(false);

  const manualCreditDialogRef = useRef(null);
  const reversePaymentDialogRef = useRef(null);
  const refundUnspentDialogRef = useRef(null);
  const reviewActionDialogRef = useRef(null);
  const reverseClickChargeDialogRef = useRef(null);

  // Authenticated blob URL for the inspected review item's creative image
  const inspectedCreativeImageUrl =
    selectedReviewAd?.active_creative?.image_url || '';
  const {
    blobUrl: inspectedCreativeBlobUrl,
    loading: inspectedCreativeImgLoading,
    error: inspectedCreativeImgError,
  } = useAuthenticatedImageUrl(inspectedCreativeImageUrl);

  const buildQueryParams = useCallback(
    ({ includeStatus = true } = {}) => {
      const params = new URLSearchParams();
      if (sellerFilter.trim()) params.set('seller', sellerFilter.trim());
      if (includeStatus && statusFilter.trim())
        params.set('status', statusFilter.trim());
      if (adFilter.trim()) params.set('advertisement', adFilter.trim());
      const qs = params.toString();
      return qs ? `?${qs}` : '';
    },
    [sellerFilter, statusFilter, adFilter]
  );

  const buildReviewQueueQueryParams = useCallback(() => {
    const params = new URLSearchParams();
    if (reviewQueueStatusFilter.trim()) {
      params.set('status', reviewQueueStatusFilter.trim());
    }
    if (reviewQueuePlacementFilter.trim()) {
      params.set('placement', reviewQueuePlacementFilter.trim());
    }
    if (reviewQueueSellerFilter.trim()) {
      params.set('seller', reviewQueueSellerFilter.trim());
    }
    const qs = params.toString();
    return qs ? `?${qs}` : '';
  }, [
    reviewQueueStatusFilter,
    reviewQueuePlacementFilter,
    reviewQueueSellerFilter,
  ]);

  const buildClickRatesQueryParams = useCallback(() => {
    const params = new URLSearchParams();
    if (clickRatePlacementFilter.trim()) {
      params.set('placement', clickRatePlacementFilter.trim());
    }
    if (clickRateStatusFilter.trim()) {
      params.set('status', clickRateStatusFilter.trim());
    }
    const qs = params.toString();
    return qs ? `?${qs}` : '';
  }, [clickRatePlacementFilter, clickRateStatusFilter]);

  const buildAdPricesQueryParams = useCallback(() => {
    const params = new URLSearchParams();
    if (adPricePlacementFilter.trim()) {
      params.set('placement', adPricePlacementFilter.trim());
    }
    if (adPriceStatusFilter.trim()) {
      params.set('status', adPriceStatusFilter.trim());
    }
    const qs = params.toString();
    return qs ? `?${qs}` : '';
  }, [adPricePlacementFilter, adPriceStatusFilter]);

  const buildClicksQueryParams = useCallback(() => {
    const params = new URLSearchParams();
    if (clicksAdFilter.trim()) {
      params.set('ad', clicksAdFilter.trim());
    }
    if (clicksDecisionFilter.trim()) {
      params.set('decision', clicksDecisionFilter.trim());
    }
    if (clicksReasonFilter.trim()) {
      params.set('reason_code', clicksReasonFilter.trim());
    }
    if (clicksDateFromFilter.trim()) {
      params.set('date_from', clicksDateFromFilter.trim());
    }
    if (clicksDateToFilter.trim()) {
      params.set('date_to', clicksDateToFilter.trim());
    }
    const qs = params.toString();
    return qs ? `?${qs}` : '';
  }, [
    clicksAdFilter,
    clicksDecisionFilter,
    clicksReasonFilter,
    clicksDateFromFilter,
    clicksDateToFilter,
  ]);

  const fetchAllAdminAdvertising = useCallback(
    async ({ silent = false } = {}) => {
      if (!silent) setLoading(true);
      setLoadError('');
      try {
        const qsWithStatus = buildQueryParams({ includeStatus: true });
        const qsNoStatus = buildQueryParams({ includeStatus: false });
        const rqQs = buildReviewQueueQueryParams();
        const crQs = buildClickRatesQueryParams();
        const apQs = buildAdPricesQueryParams();
        const clQs = buildClicksQueryParams();

        const [
          adsRes,
          paymentsRes,
          ledgerRes,
          reconRes,
          reviewQueueRes,
          clickRatesCurrentRes,
          clickRatesHistoryRes,
          adPricesCurrentRes,
          adPricesHistoryRes,
          clicksRes,
        ] = await Promise.all([
          apiRequest(`/api/admin/advertising/ads/${qsWithStatus}`),
          apiRequest(`/api/admin/advertising/payments/${qsWithStatus}`),
          apiRequest(`/api/admin/advertising/ledger/${qsNoStatus}`),
          apiRequest(`/api/admin/advertising/reconciliation/${qsNoStatus}`),
          apiRequest(`/api/admin/advertising/review-queue/${rqQs}`).catch(
            () => []
          ),
          apiRequest('/api/admin/advertising/click-rates/current/').catch(
            () => ({ as_of_date: '', placements: {} })
          ),
          apiRequest(`/api/admin/advertising/click-rates/${crQs}`).catch(
            () => []
          ),
          apiRequest('/api/admin/advertising/ad-prices/current/').catch(() => ({
            as_of_date: '',
            placements: {},
          })),
          apiRequest(`/api/admin/advertising/ad-prices/${apQs}`).catch(() => []),
          apiRequest(`/api/admin/advertising/clicks/${clQs}`).catch(() => ({
            results: [],
            counts_by_ad: [],
          })),
        ]);

        const nextAds = Array.isArray(adsRes) ? adsRes : [];
        const nextReviewQueue = Array.isArray(reviewQueueRes)
          ? reviewQueueRes
          : [];

        setAds(nextAds);
        setPayments(Array.isArray(paymentsRes) ? paymentsRes : []);
        setLedger(Array.isArray(ledgerRes) ? ledgerRes : []);
        setReconciliation(
          reconRes && typeof reconRes === 'object'
            ? {
                advertisements: Array.isArray(reconRes.advertisements)
                  ? reconRes.advertisements
                  : [],
                totals: reconRes.totals || {
                  funded: '0.00',
                  funded_real: '0.00',
                  funded_simulated: '0.00',
                  spent: '0.00',
                  remaining: '0.00',
                },
              }
            : {
                advertisements: [],
                totals: {
                  funded: '0.00',
                  funded_real: '0.00',
                  funded_simulated: '0.00',
                  spent: '0.00',
                  remaining: '0.00',
                },
              }
        );
        setReviewQueueItems(nextReviewQueue);
        setClickRatesCurrent(
          clickRatesCurrentRes && typeof clickRatesCurrentRes === 'object'
            ? {
                as_of_date: clickRatesCurrentRes.as_of_date || '',
                placements: clickRatesCurrentRes.placements || {},
              }
            : { as_of_date: '', placements: {} }
        );
        setClickRatesHistory(
          Array.isArray(clickRatesHistoryRes) ? clickRatesHistoryRes : []
        );
        setAdPricesCurrent(
          adPricesCurrentRes && typeof adPricesCurrentRes === 'object'
            ? {
                as_of_date: adPricesCurrentRes.as_of_date || '',
                placements: adPricesCurrentRes.placements || {},
              }
            : { as_of_date: '', placements: {} }
        );
        setAdPricesHistory(
          Array.isArray(adPricesHistoryRes) ? adPricesHistoryRes : []
        );
        setClicksResults(
          Array.isArray(clicksRes?.results) ? clicksRes.results : []
        );
        setClicksCountsByAd(
          Array.isArray(clicksRes?.counts_by_ad) ? clicksRes.counts_by_ad : []
        );

        // Keep selectedReviewAd in sync with refreshed server records
        setSelectedReviewAd((prev) => {
          if (!prev) return null;
          const updatedInQueue = nextReviewQueue.find((a) => a.id === prev.id);
          if (updatedInQueue) return updatedInQueue;
          const updatedInAds = nextAds.find((a) => a.id === prev.id);
          return updatedInAds || prev;
        });
      } catch (err) {
        const parsed = parseAdvertisingApiError(err);
        setLoadError(
          parsed.generalError || 'Unable to load admin advertising records.'
        );
      } finally {
        if (!silent) setLoading(false);
        setHasLoadedOnce(true);
      }
    },
    [
      buildQueryParams,
      buildReviewQueueQueryParams,
      buildClickRatesQueryParams,
      buildAdPricesQueryParams,
      buildClicksQueryParams,
    ]
  );

  useEffect(() => {
    fetchAllAdminAdvertising();
  }, [fetchAllAdminAdvertising]);

  const formatSellerLabel = (row) => {
    if (!row) return '—';
    if (row.seller_name) {
      return `${row.seller_name} (#${row.seller_id})`;
    }
    return `Seller #${row.seller_id}`;
  };

  const formatProductLabel = (row) => {
    if (!row) return '—';
    if (row.product_name) {
      return `${row.product_name} (#${row.product_id})`;
    }
    return `Product #${row.product_id}`;
  };

  // Manual credit handlers
  const openManualCreditModal = (ad) => {
    setCreditTargetAd(ad);
    setCreditAmount(ad?.intended_amount ? String(ad.intended_amount) : '');
    setCreditExternalRef('');
    setCreditReceivedDate(getTodayIsoDate());
    setCreditReason('');
    setCreditFieldErrors({});
    setCreditDialogError('');
    openNativeDialog(manualCreditDialogRef.current);
  };

  const closeManualCreditModal = () => {
    closeNativeDialog(manualCreditDialogRef.current);
    setCreditTargetAd(null);
  };

  const handleManualCreditSubmit = async (e) => {
    e.preventDefault();
    if (!creditTargetAd) return;

    setCreditFieldErrors({});
    setCreditDialogError('');
    setCreditSubmitting(true);

    try {
      await apiRequest(
        `/api/admin/advertising/ads/${creditTargetAd.id}/manual-credit/`,
        {
          method: 'POST',
          body: JSON.stringify({
            amount: creditAmount.trim(),
            external_reference: creditExternalRef.trim(),
            received_date: creditReceivedDate,
            reason: creditReason.trim(),
          }),
        }
      );

      closeManualCreditModal();
      setFeedbackBanner({
        type: 'success',
        text: `Manual credit recorded for Advertisement #${creditTargetAd.id} (${creditTargetAd.name}).`,
      });
      setCreditSubmitting(false);
      await fetchAllAdminAdvertising({ silent: true });
    } catch (err) {
      const parsed = parseAdvertisingApiError(err, [
        'amount',
        'external_reference',
        'received_date',
        'reason',
      ]);
      setCreditFieldErrors(parsed.fieldErrors);
      setCreditDialogError(
        parsed.generalError || 'Failed to record manual credit.'
      );
      setCreditSubmitting(false);
      if (err?.status === 403) {
        setFeedbackBanner({
          type: 'error',
          text:
            parsed.generalError ||
            'You do not have permission to perform this action.',
        });
      }
      if (err?.status === 409) {
        await fetchAllAdminAdvertising({ silent: true });
      }
    }
  };

  // Reverse payment handlers
  const openReversePaymentModal = (payment) => {
    setReverseTargetPayment(payment);
    setReverseReason('');
    setReverseConfirm(false);
    setReverseOutcome('error_correction');
    setReverseFieldErrors({});
    setReverseDialogError('');
    openNativeDialog(reversePaymentDialogRef.current);
  };

  const closeReversePaymentModal = () => {
    closeNativeDialog(reversePaymentDialogRef.current);
    setReverseTargetPayment(null);
  };

  const handleReversePaymentSubmit = async (e) => {
    e.preventDefault();
    if (!reverseTargetPayment) return;

    setReverseFieldErrors({});
    setReverseDialogError('');

    if (!reverseConfirm) {
      setReverseFieldErrors({
        confirm_reversal:
          'You must confirm the payment reversal before submitting.',
      });
      return;
    }

    setReverseSubmitting(true);
    try {
      await apiRequest(
        `/api/admin/advertising/payments/${reverseTargetPayment.id}/reverse/`,
        {
          method: 'POST',
          body: JSON.stringify({
            reason: reverseReason.trim(),
            confirm_reversal: Boolean(reverseConfirm),
            outcome: reverseOutcome,
          }),
        }
      );

      closeReversePaymentModal();
      setFeedbackBanner({
        type: 'success',
        text: `Payment #${reverseTargetPayment.id} reversed with outcome "${reverseOutcome}".`,
      });
      setReverseSubmitting(false);
      await fetchAllAdminAdvertising({ silent: true });
    } catch (err) {
      const parsed = parseAdvertisingApiError(err, [
        'reason',
        'confirm_reversal',
        'outcome',
      ]);
      setReverseFieldErrors(parsed.fieldErrors);
      setReverseDialogError(parsed.generalError || 'Failed to reverse payment.');
      setReverseSubmitting(false);
      if (err?.status === 403) {
        setFeedbackBanner({
          type: 'error',
          text:
            parsed.generalError ||
            'You do not have permission to perform this action.',
        });
      }
      if (err?.status === 409) {
        await fetchAllAdminAdvertising({ silent: true });
      }
    }
  };

  // Refund unspent money handlers (Phase 3 Part 1: superuser only)
  const openRefundUnspentModal = (ad) => {
    setRefundTargetAd(ad);
    setRefundExternalRef('');
    setRefundDate(getTodayIsoDate());
    setRefundReason('');
    setRefundConfirm(false);
    setRefundFieldErrors({});
    setRefundDialogError('');
    openNativeDialog(refundUnspentDialogRef.current);
  };

  const closeRefundUnspentModal = () => {
    closeNativeDialog(refundUnspentDialogRef.current);
    setRefundTargetAd(null);
  };

  const handleRefundUnspentSubmit = async (e) => {
    e.preventDefault();
    if (!refundTargetAd) return;

    setRefundFieldErrors({});
    setRefundDialogError('');

    if (!refundConfirm) {
      setRefundFieldErrors({
        confirm_refund:
          'Set confirm_refund to true after the external transfer is complete.',
      });
      return;
    }

    setRefundSubmitting(true);
    try {
      await apiRequest(
        `/api/admin/advertising/ads/${refundTargetAd.id}/refund-unspent/`,
        {
          method: 'POST',
          body: JSON.stringify({
            reason: refundReason.trim(),
            confirm_refund: Boolean(refundConfirm),
            external_reference: refundExternalRef.trim(),
            refunded_date: refundDate,
          }),
        }
      );

      closeRefundUnspentModal();
      setFeedbackBanner({
        type: 'success',
        text: `Refund of unspent money (${refundTargetAd.currency || 'INR'} ${refundTargetAd.remaining}) recorded for Advertisement #${refundTargetAd.id} (${refundTargetAd.name}).`,
      });
      setRefundSubmitting(false);
      await fetchAllAdminAdvertising({ silent: true });
    } catch (err) {
      const parsed = parseAdvertisingApiError(err, [
        'reason',
        'confirm_refund',
        'external_reference',
        'refunded_date',
      ]);
      setRefundFieldErrors(parsed.fieldErrors);
      setRefundDialogError(
        parsed.generalError || 'Failed to record unspent refund.'
      );
      setRefundSubmitting(false);
      if (err?.status === 403) {
        setFeedbackBanner({
          type: 'error',
          text:
            parsed.generalError ||
            'A superuser account is required.',
        });
      }
      if (err?.status === 409) {
        await fetchAllAdminAdvertising({ silent: true });
      }
    }
  };

  // Reverse click charge handlers (Phase 3 Part 2: superuser only)
  const openReverseClickChargeModal = (click) => {
    setReverseClickTarget(click);
    setReverseClickReason('');
    setReverseClickConfirm(false);
    setReverseClickFieldErrors({});
    setReverseClickDialogError('');
    openNativeDialog(reverseClickChargeDialogRef.current);
  };

  const closeReverseClickChargeModal = () => {
    closeNativeDialog(reverseClickChargeDialogRef.current);
    setReverseClickTarget(null);
    setReverseClickReason('');
    setReverseClickConfirm(false);
    setReverseClickFieldErrors({});
    setReverseClickDialogError('');
  };

  const handleReverseClickChargeSubmit = async (e) => {
    e.preventDefault();
    if (!reverseClickTarget) return;

    setReverseClickFieldErrors({});
    setReverseClickDialogError('');

    if (!reverseClickConfirm) {
      setReverseClickFieldErrors({
        confirm_reversal: 'Set confirm_reversal to true.',
      });
      return;
    }

    setReverseClickSubmitting(true);
    try {
      await apiRequest(
        `/api/admin/advertising/clicks/${reverseClickTarget.id}/reverse-charge/`,
        {
          method: 'POST',
          body: JSON.stringify({
            reason: reverseClickReason.trim(),
            confirm_reversal: Boolean(reverseClickConfirm),
          }),
        }
      );

      closeReverseClickChargeModal();
      setFeedbackBanner({
        type: 'success',
        text: `Click charge reversed for Click #${reverseClickTarget.id} (Ad #${reverseClickTarget.advertisement_id}).`,
      });
      setReverseClickSubmitting(false);
      await fetchAllAdminAdvertising({ silent: true });
    } catch (err) {
      const parsed = parseAdvertisingApiError(err, [
        'reason',
        'confirm_reversal',
      ]);
      setReverseClickFieldErrors(parsed.fieldErrors);
      setReverseClickDialogError(
        parsed.generalError || 'Failed to reverse click charge.'
      );
      setReverseClickSubmitting(false);
      if (err?.status === 403) {
        setFeedbackBanner({
          type: 'error',
          text:
            parsed.generalError ||
            'A superuser account is required.',
        });
      }
      if (err?.status === 409) {
        await fetchAllAdminAdvertising({ silent: true });
      }
    }
  };

  // Review Queue moderation handlers (Approve / Reject / Take down)
  const openReviewActionModal = (action, ad) => {
    setReviewActionTarget({ action, ad });
    setReviewActionReason('');
    setReviewActionFieldErrors({});
    setReviewActionDialogError('');
    openNativeDialog(reviewActionDialogRef.current);
  };

  const closeReviewActionModal = () => {
    closeNativeDialog(reviewActionDialogRef.current);
    setReviewActionTarget(null);
    setReviewActionReason('');
    setReviewActionFieldErrors({});
    setReviewActionDialogError('');
  };

  const handleReviewActionSubmit = async (e) => {
    e.preventDefault();
    if (!reviewActionTarget) return;

    setReviewActionFieldErrors({});
    setReviewActionDialogError('');

    const trimmedReason = reviewActionReason.trim();
    if (!trimmedReason) {
      setReviewActionFieldErrors({
        reason: 'A reason is required and cannot be blank.',
      });
      return;
    }

    const { action, ad } = reviewActionTarget;
    const endpoint = `/api/admin/advertising/ads/${ad.id}/${action}/`;

    setReviewActionSubmitting(true);
    try {
      const updated = await apiRequest(endpoint, {
        method: 'POST',
        body: JSON.stringify({ reason: trimmedReason }),
      });

      closeReviewActionModal();
      setSelectedReviewAd(updated);

      const actionPastTense =
        action === 'approve'
          ? 'approved'
          : action === 'reject'
          ? 'rejected'
          : 'taken down';

      setFeedbackBanner({
        type: 'success',
        text: `Advertisement #${ad.id} (${ad.name}) ${actionPastTense}.`,
      });
      setReviewActionSubmitting(false);
      await fetchAllAdminAdvertising({ silent: true });
    } catch (err) {
      const parsed = parseAdvertisingApiError(err, ['reason']);
      setReviewActionFieldErrors(parsed.fieldErrors);
      setReviewActionDialogError(
        parsed.generalError || `Failed to ${action} advertisement.`
      );
      setReviewActionSubmitting(false);

      // On 409 Conflict, refresh the item and the review queue while keeping the dialog error visible
      if (err?.status === 409) {
        await fetchAllAdminAdvertising({ silent: true });
      }
    }
  };

  // Schedule new click rate handler (any staff admin)
  const handleScheduleClickRateSubmit = async (e) => {
    e.preventDefault();
    setNewRateFieldErrors({});
    setNewRateGeneralError('');
    setFeedbackBanner(null);
    setNewRateSubmitting(true);

    try {
      const created = await apiRequest('/api/admin/advertising/click-rates/', {
        method: 'POST',
        body: JSON.stringify({
          placement: newRatePlacement,
          amount_per_click: newRateAmount.trim(),
          currency: 'INR',
          effective_from: newRateEffectiveFrom,
          reason: newRateReason.trim(),
        }),
      });

      setNewRateAmount('');
      setNewRateEffectiveFrom('');
      setNewRateReason('');
      setFeedbackBanner({
        type: 'success',
        text: `Scheduled new click rate #${created.id} for ${formatAdPlacementLabel(
          created.placement
        )} (${created.amount_per_click} INR per click effective ${created.effective_from}).`,
      });
      await fetchAllAdminAdvertising({ silent: true });
    } catch (err) {
      const parsed = parseAdvertisingApiError(err, [
        'placement',
        'amount_per_click',
        'currency',
        'effective_from',
        'reason',
      ]);
      setNewRateFieldErrors(parsed.fieldErrors);
      setNewRateGeneralError(parsed.generalError);
      if (err?.status === 403) {
        setFeedbackBanner({
          type: 'error',
          text:
            parsed.generalError ||
            'You do not have permission to perform this action.',
        });
      }
    } finally {
      setNewRateSubmitting(false);
    }
  };

  // Schedule new ad price handler (any staff admin)
  const handleScheduleAdPriceSubmit = async (e) => {
    e.preventDefault();
    setNewPriceFieldErrors({});
    setNewPriceGeneralError('');
    setFeedbackBanner(null);
    setNewPriceSubmitting(true);

    try {
      const created = await apiRequest('/api/admin/advertising/ad-prices/', {
        method: 'POST',
        body: JSON.stringify({
          placement: newPricePlacement,
          ad_price: newPriceAmount.trim(),
          currency: 'INR',
          effective_from: newPriceEffectiveFrom,
          reason: newPriceReason.trim(),
        }),
      });

      setNewPriceAmount('');
      setNewPriceEffectiveFrom('');
      setNewPriceReason('');
      setFeedbackBanner({
        type: 'success',
        text: `Scheduled new advertising price #${created.id} for ${formatAdPlacementLabel(
          created.placement
        )} (${created.ad_price} INR per ad effective ${created.effective_from}).`,
      });
      await fetchAllAdminAdvertising({ silent: true });
    } catch (err) {
      const parsed = parseAdvertisingApiError(err, [
        'placement',
        'ad_price',
        'currency',
        'effective_from',
        'reason',
      ]);
      setNewPriceFieldErrors(parsed.fieldErrors);
      setNewPriceGeneralError(parsed.generalError);
      if (err?.status === 403) {
        setFeedbackBanner({
          type: 'error',
          text:
            parsed.generalError ||
            'You do not have permission to perform this action.',
        });
      }
    } finally {
      setNewPriceSubmitting(false);
    }
  };

  const filteredLedger = statusFilter.trim()
    ? ledger.filter((entry) => entry.entry_type === statusFilter.trim())
    : ledger;

  const statusOptionsForActiveTab = () => {
    if (activeTab === 'payments') {
      return AD_PAYMENT_STATUSES;
    }
    if (activeTab === 'ledger') {
      return Object.entries(AD_LEDGER_ENTRY_TYPE_LABELS).map(
        ([value, label]) => ({
          value,
          label,
        })
      );
    }
    return AD_STATUSES;
  };

  const hasAnyReconciliationRowFlag = (row) =>
    Boolean(
      row?.has_status_ledger_disagreement ||
        row?.has_spend_above_funded ||
        row?.has_negative_remaining ||
        row?.has_ended_click_balance ||
        row?.has_running_below_click_amount ||
        row?.has_billed_click_without_charge ||
        row?.has_charge_without_billed_click ||
        row?.has_duplicate_click_token ||
        row?.has_running_ineligible_entity ||
        row?.has_refund_status_disagreement
    );

  const hasAnyReconciliationDisagreement = reconciliation.advertisements.some(
    (item) => hasAnyReconciliationRowFlag(item)
  );

  const showSharedFilterBar =
    activeTab === 'ads' ||
    activeTab === 'payments' ||
    activeTab === 'ledger' ||
    activeTab === 'reconciliation';

  return (
    <div className="space-y-6" data-testid="advertising-admin-module">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  Advertising Administration (Phase 3 Part 1)
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Staff review queue (approve, reject, take down), read-only click price tables, recorded click list, advertisements, payments, ledger, and reconciliation. Superuser write access for manual credits, payment reversals, unspent refunds, and scheduling new click rates.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => fetchAllAdminAdvertising()}
              data-testid="admin-ad-refresh-btn"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 text-xs font-semibold transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Refresh
            </button>
          </div>
        </div>

        {/* Non-superuser read-only notice for superuser-only money actions */}
        {!isSuperuser && (
          <div
            data-testid="admin-ad-non-superuser-banner"
            className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 flex items-start gap-2.5 text-amber-900 text-xs"
          >
            <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">
                Staff Mode (Non-Superuser Account)
              </p>
              <p className="mt-0.5 text-amber-800">
                Any staff admin can review advertisements (approve, reject, take down), schedule advertising prices and click prices, and inspect recorded clicks. Recording manual credits, reversing payments, recording refunds of unspent money, and reversing click charges require superuser privileges and are rejected by the server with HTTP 403.
              </p>
            </div>
          </div>
        )}

        {/* Feedback Banner */}
        {feedbackBanner && (
          <div
            data-testid="admin-ad-feedback-banner"
            className={`mt-4 rounded-xl border px-4 py-3 flex items-start gap-2.5 text-xs ${
              feedbackBanner.type === 'success'
                ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
                : 'border-red-200 bg-red-50 text-red-900'
            }`}
          >
            {feedbackBanner.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            )}
            <div className="flex-1 font-medium">{feedbackBanner.text}</div>
            <button
              type="button"
              onClick={() => setFeedbackBanner(null)}
              className="text-slate-400 hover:text-slate-600 font-bold"
            >
              ×
            </button>
          </div>
        )}

        {loadError && (
          <div
            data-testid="admin-ad-load-error"
            className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-800"
          >
            {loadError}
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
          <div className="flex flex-wrap items-center gap-2" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'ads'}
              data-testid="admin-ad-tab-ads"
              onClick={() => {
                setStatusFilter('');
                setActiveTab('ads');
              }}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors ${
                activeTab === 'ads'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Megaphone className="w-3.5 h-3.5" />
              Advertisements ({ads.length})
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'review_queue'}
              data-testid="admin-ad-tab-review-queue"
              onClick={() => setActiveTab('review_queue')}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors ${
                activeTab === 'review_queue'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <ClipboardCheck className="w-3.5 h-3.5" />
              Review Queue ({reviewQueueItems.length})
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'ad_prices'}
              data-testid="admin-ad-tab-ad-prices"
              onClick={() => setActiveTab('ad_prices')}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors ${
                activeTab === 'ad_prices'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Banknote className="w-3.5 h-3.5" />
              Ad Prices ({adPricesHistory.length})
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'click_rates'}
              data-testid="admin-ad-tab-click-rates"
              onClick={() => setActiveTab('click_rates')}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors ${
                activeTab === 'click_rates'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Tag className="w-3.5 h-3.5" />
              Click Prices ({clickRatesHistory.length})
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'clicks'}
              data-testid="admin-ad-tab-clicks"
              onClick={() => setActiveTab('clicks')}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors ${
                activeTab === 'clicks'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <MousePointerClick className="w-3.5 h-3.5" />
              Clicks ({clicksResults.length})
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'payments'}
              data-testid="admin-ad-tab-payments"
              onClick={() => {
                setStatusFilter('');
                setActiveTab('payments');
              }}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors ${
                activeTab === 'payments'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <CreditCard className="w-3.5 h-3.5" />
              Payments ({payments.length})
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'ledger'}
              data-testid="admin-ad-tab-ledger"
              onClick={() => {
                setStatusFilter('');
                setActiveTab('ledger');
              }}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors ${
                activeTab === 'ledger'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              Ledger ({filteredLedger.length})
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'reconciliation'}
              data-testid="admin-ad-tab-reconciliation"
              onClick={() => {
                setStatusFilter('');
                setActiveTab('reconciliation');
              }}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors ${
                activeTab === 'reconciliation'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Scale className="w-3.5 h-3.5" />
              Reconciliation
              {hasAnyReconciliationDisagreement && (
                <span className="ml-1 px-1.5 py-0.5 rounded-full bg-red-600 text-white text-[10px] font-bold">
                  Mismatch
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Shared Filter Bar (for ads, payments, ledger, reconciliation) */}
        {showSharedFilterBar && (
          <div
            data-testid="admin-ad-filters"
            className="mt-4 grid grid-cols-1 sm:grid-cols-4 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200/70"
          >
            <div>
              <label
                htmlFor="admin-filter-seller"
                className="block text-[11px] font-semibold text-slate-600 mb-1"
              >
                Filter by Seller ID
              </label>
              <input
                id="admin-filter-seller"
                data-testid="admin-filter-seller"
                type="text"
                inputMode="numeric"
                value={sellerFilter}
                onChange={(e) => setSellerFilter(e.target.value)}
                placeholder="All sellers (e.g. 5)"
                className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-800"
              />
            </div>

            <div>
              <label
                htmlFor="admin-filter-status"
                className="block text-[11px] font-semibold text-slate-600 mb-1"
              >
                Filter by Status
              </label>
              <select
                id="admin-filter-status"
                data-testid="admin-filter-status"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                disabled={activeTab === 'reconciliation'}
                className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-800 disabled:bg-slate-100 disabled:text-slate-400"
              >
                <option value="">All statuses</option>
                {statusOptionsForActiveTab().map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="admin-filter-advertisement"
                className="block text-[11px] font-semibold text-slate-600 mb-1"
              >
                Filter by Advertisement ID
              </label>
              <input
                id="admin-filter-advertisement"
                data-testid="admin-filter-advertisement"
                type="text"
                inputMode="numeric"
                value={adFilter}
                onChange={(e) => setAdFilter(e.target.value)}
                placeholder="All ads (e.g. 1)"
                className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-800"
              />
            </div>

            <div className="flex items-end gap-2">
              <button
                type="button"
                data-testid="admin-filter-clear-btn"
                onClick={() => {
                  setSellerFilter('');
                  setStatusFilter('');
                  setAdFilter('');
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 text-xs font-semibold"
              >
                <Filter className="w-3.5 h-3.5" />
                Clear Filters
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      {loading && !hasLoadedOnce ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-sm text-slate-500">
          Loading advertising administration records...
        </div>
      ) : (
        <>
          {/* TAB 1: ADVERTISEMENTS (No stored budget shown as money truth; show funded, spent, remaining, seller_name, product_name) */}
          {activeTab === 'ads' && (
            <div
              className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden"
              data-testid="admin-ads-table-section"
            >
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    All Advertisements
                  </h3>
                  <p className="text-xs text-slate-500">
                    Superusers can record manual credits for advertisements awaiting payment and record refunds of unspent money when remaining balance is above zero. Staff can moderate submitted ads or take down approved ads.
                  </p>
                </div>
              </div>

              {ads.length === 0 ? (
                <div
                  className="p-8 text-center text-sm text-slate-500"
                  data-testid="admin-ads-empty"
                >
                  No advertisements match the selected filters.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                        <th className="py-3 px-4">ID</th>
                        <th className="py-3 px-4">Seller</th>
                        <th className="py-3 px-4">Product</th>
                        <th className="py-3 px-4">Name</th>
                        <th className="py-3 px-4">Placement</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4">Intended</th>
                        <th className="py-3 px-4">Funded</th>
                        <th className="py-3 px-4">Spent</th>
                        <th className="py-3 px-4">Remaining</th>
                        <th className="py-3 px-4">Billed Clicks</th>
                        <th className="py-3 px-4">End Reason</th>
                        <th className="py-3 px-4">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                      {ads.map((ad) => {
                        const adRejected = isAdCreativeRejected(ad);
                        const refundable = canOfferUnspentRefund(ad);
                        return (
                          <tr
                            key={ad.id}
                            data-testid={`admin-ad-row-${ad.id}`}
                            className="hover:bg-slate-50/80"
                          >
                            <td className="py-3 px-4 font-semibold text-slate-900">
                              #{ad.id}
                            </td>
                            <td
                              className="py-3 px-4"
                              data-testid={`admin-ad-seller-${ad.id}`}
                            >
                              {formatSellerLabel(ad)}
                            </td>
                            <td
                              className="py-3 px-4"
                              data-testid={`admin-ad-product-${ad.id}`}
                            >
                              {formatProductLabel(ad)}
                            </td>
                            <td className="py-3 px-4 font-medium text-slate-900">
                              {ad.name}
                            </td>
                            <td className="py-3 px-4">
                              {formatAdPlacementLabel(
                                ad.placement || ad.active_creative?.placement
                              )}
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex flex-wrap items-center gap-1">
                                <span
                                  data-testid={`admin-ad-status-${ad.id}`}
                                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${getAdStatusBadgeClass(
                                    ad.status
                                  )}`}
                                >
                                  {AD_STATUS_LABELS[ad.status] || ad.status}
                                </span>
                                {adRejected && ad.status !== 'rejected' && (
                                  <span
                                    data-testid={`admin-ad-creative-rejected-${ad.id}`}
                                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${getAdStatusBadgeClass(
                                      'rejected'
                                    )}`}
                                  >
                                    Creative Rejected
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="py-3 px-4 font-mono">
                              {ad.currency || 'INR'} {ad.intended_amount}
                            </td>
                            <td
                              className="py-3 px-4 font-mono"
                              data-testid={`admin-ad-funded-${ad.id}`}
                            >
                              {ad.currency || 'INR'} {ad.funded}
                            </td>
                            <td
                              className="py-3 px-4 font-mono"
                              data-testid={`admin-ad-spent-${ad.id}`}
                            >
                              {ad.currency || 'INR'} {ad.spent}
                            </td>
                            <td
                              className="py-3 px-4 font-mono"
                              data-testid={`admin-ad-remaining-${ad.id}`}
                            >
                              {ad.currency || 'INR'} {ad.remaining}
                            </td>
                            <td
                              className="py-3 px-4 font-mono"
                              data-testid={`admin-ad-billed-clicks-${ad.id}`}
                            >
                              {ad.billed_click_count ?? 0}
                            </td>
                            <td
                              className="py-3 px-4"
                              data-testid={`admin-ad-end-reason-${ad.id}`}
                            >
                              {ad.end_reason
                                ? formatAdEndReasonLabel(ad.end_reason)
                                : '—'}
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex flex-wrap items-center gap-1.5">
                                <button
                                  type="button"
                                  disabled={!isSuperuser}
                                  onClick={() => openManualCreditModal(ad)}
                                  data-testid={`open-manual-credit-btn-${ad.id}`}
                                  title={
                                    !isSuperuser
                                      ? 'Superuser permission required to record manual credits'
                                      : 'Record manual credit for this advertisement'
                                  }
                                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-amber-600 text-white hover:bg-amber-700 disabled:bg-slate-200 disabled:text-slate-500 disabled:cursor-not-allowed text-[11px] font-semibold transition-colors"
                                >
                                  <PlusCircle className="w-3.5 h-3.5" />
                                  {isSuperuser
                                    ? 'Record Manual Credit'
                                    : 'Manual Credit (Superuser Only)'}
                                </button>
                                {!isSuperuser && (
                                  <button
                                    type="button"
                                    onClick={() => openManualCreditModal(ad)}
                                    data-testid={`attempt-manual-credit-btn-${ad.id}`}
                                    className="inline-flex items-center gap-1 px-2 py-1 rounded-lg border border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100 text-[10px] font-semibold"
                                  >
                                    Verify Server 403
                                  </button>
                                )}

                                {/* Refund unspent money: offered ONLY when remaining > 0 and status is funded, approved, taken_down, or ended */}
                                {refundable && (
                                  <>
                                    <button
                                      type="button"
                                      disabled={!isSuperuser}
                                      onClick={() => openRefundUnspentModal(ad)}
                                      data-testid={`open-refund-unspent-btn-${ad.id}`}
                                      title={
                                        !isSuperuser
                                          ? 'Superuser permission required to record refunds of unspent money'
                                          : 'Record refund of unspent money for this advertisement'
                                      }
                                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-indigo-200 bg-indigo-50 text-indigo-800 hover:bg-indigo-100 disabled:bg-slate-200 disabled:border-slate-200 disabled:text-slate-500 disabled:cursor-not-allowed text-[11px] font-semibold transition-colors"
                                    >
                                      <Banknote className="w-3.5 h-3.5" />
                                      {isSuperuser
                                        ? 'Refund Unspent Money'
                                        : 'Refund Unspent (Superuser Only)'}
                                    </button>
                                    {!isSuperuser && (
                                      <button
                                        type="button"
                                        onClick={() => openRefundUnspentModal(ad)}
                                        data-testid={`attempt-refund-unspent-btn-${ad.id}`}
                                        className="inline-flex items-center gap-1 px-2 py-1 rounded-lg border border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100 text-[10px] font-semibold"
                                      >
                                        Verify Refund 403
                                      </button>
                                    )}
                                  </>
                                )}

                                {(ad.status === 'approved' ||
                                  ad.status === 'running') && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      openReviewActionModal('take-down', ad)
                                    }
                                    data-testid={`admin-ads-takedown-btn-${ad.id}`}
                                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 text-[11px] font-semibold"
                                  >
                                    <Ban className="w-3.5 h-3.5" />
                                    Take down
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: REVIEW QUEUE (Phase 2) */}
          {activeTab === 'review_queue' && (
            <div
              className="space-y-4"
              data-testid="admin-review-queue-section"
            >
              {/* Review Queue Filters */}
              <div
                data-testid="admin-review-queue-filters"
                className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm grid grid-cols-1 sm:grid-cols-4 gap-3"
              >
                <div>
                  <label
                    htmlFor="admin-rq-filter-status"
                    className="block text-[11px] font-semibold text-slate-600 mb-1"
                  >
                    Queue Status Filter
                  </label>
                  <select
                    id="admin-rq-filter-status"
                    data-testid="admin-rq-filter-status"
                    value={reviewQueueStatusFilter}
                    onChange={(e) => setReviewQueueStatusFilter(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-800"
                  >
                    {AD_STATUSES.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="admin-rq-filter-placement"
                    className="block text-[11px] font-semibold text-slate-600 mb-1"
                  >
                    Placement Filter
                  </label>
                  <select
                    id="admin-rq-filter-placement"
                    data-testid="admin-rq-filter-placement"
                    value={reviewQueuePlacementFilter}
                    onChange={(e) =>
                      setReviewQueuePlacementFilter(e.target.value)
                    }
                    className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-800"
                  >
                    <option value="">All Placements</option>
                    {AD_PLACEMENTS.map((pl) => (
                      <option key={pl.value} value={pl.value}>
                        {pl.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="admin-rq-filter-seller"
                    className="block text-[11px] font-semibold text-slate-600 mb-1"
                  >
                    Seller ID Filter
                  </label>
                  <input
                    id="admin-rq-filter-seller"
                    data-testid="admin-rq-filter-seller"
                    type="text"
                    inputMode="numeric"
                    value={reviewQueueSellerFilter}
                    onChange={(e) => setReviewQueueSellerFilter(e.target.value)}
                    placeholder="All sellers"
                    className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-800"
                  />
                </div>

                <div className="flex items-end">
                  <button
                    type="button"
                    data-testid="admin-rq-filter-reset-btn"
                    onClick={() => {
                      setReviewQueueStatusFilter('pending_review');
                      setReviewQueuePlacementFilter('');
                      setReviewQueueSellerFilter('');
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 text-xs font-semibold"
                  >
                    <Filter className="w-3.5 h-3.5" />
                    Reset Queue Filter
                  </button>
                </div>
              </div>

              {/* Selected Review Item Detail Card (photo, product, funded figure, moderation actions) */}
              {selectedReviewAd && (
                <div
                  data-testid="admin-review-item-detail"
                  className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3
                          data-testid="admin-review-detail-title"
                          className="text-base font-bold text-slate-900"
                        >
                          Advertisement #{selectedReviewAd.id}:{' '}
                          {selectedReviewAd.name}
                        </h3>
                        <span
                          data-testid="admin-review-detail-status"
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${getAdStatusBadgeClass(
                            selectedReviewAd.status
                          )}`}
                        >
                          {AD_STATUS_LABELS[selectedReviewAd.status] ||
                            selectedReviewAd.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Inspect the authenticated creative photo, product details, and funded balance before approving, rejecting, or taking down.
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {selectedReviewAd.status === 'pending_review' && (
                        <>
                          <button
                            type="button"
                            data-testid="admin-open-approve-ad-btn"
                            onClick={() =>
                              openReviewActionModal('approve', selectedReviewAd)
                            }
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 text-xs font-semibold"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Approve
                          </button>

                          <button
                            type="button"
                            data-testid="admin-open-reject-ad-btn"
                            onClick={() =>
                              openReviewActionModal('reject', selectedReviewAd)
                            }
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-red-600 text-white hover:bg-red-700 text-xs font-semibold"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            Reject
                          </button>
                        </>
                      )}

                      {/* Take down is offered on approved or running ads */}
                      {(selectedReviewAd.status === 'approved' ||
                        selectedReviewAd.status === 'running') && (
                        <button
                          type="button"
                          data-testid="admin-open-takedown-ad-btn"
                          onClick={() =>
                            openReviewActionModal('take-down', selectedReviewAd)
                          }
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-red-300 bg-red-50 text-red-800 hover:bg-red-100 text-xs font-semibold"
                        >
                          <Ban className="w-3.5 h-3.5" />
                          Take down
                        </button>
                      )}

                      <button
                        type="button"
                        data-testid="admin-close-review-detail-btn"
                        onClick={() => setSelectedReviewAd(null)}
                        className="inline-flex items-center gap-1 px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 text-xs font-semibold"
                      >
                        <X className="w-3.5 h-3.5" />
                        Close Detail
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
                    <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-1">
                      <span className="text-[10px] font-bold uppercase text-slate-500">
                        Seller
                      </span>
                      <div
                        data-testid="admin-review-detail-seller"
                        className="font-semibold text-slate-900"
                      >
                        {formatSellerLabel(selectedReviewAd)}
                      </div>
                    </div>

                    <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-1">
                      <span className="text-[10px] font-bold uppercase text-slate-500">
                        Product
                      </span>
                      <div
                        data-testid="admin-review-detail-product"
                        className="font-semibold text-slate-900"
                      >
                        {formatProductLabel(selectedReviewAd)}
                      </div>
                    </div>

                    <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-1">
                      <span className="text-[10px] font-bold uppercase text-slate-500">
                        Placement &amp; Snapshot
                      </span>
                      <div
                        data-testid="admin-review-detail-placement"
                        className="font-semibold text-slate-900"
                      >
                        {formatAdPlacementLabel(
                          selectedReviewAd.active_creative?.placement ||
                            selectedReviewAd.placement
                        )}
                      </div>
                      {selectedReviewAd.click_rate_snapshot && (
                        <div
                          data-testid="admin-review-detail-click-snapshot"
                          className="font-mono text-[11px] text-slate-600"
                        >
                          Snapshotted: {selectedReviewAd.currency || 'INR'}{' '}
                          {selectedReviewAd.click_rate_snapshot} per click
                        </div>
                      )}
                    </div>

                    <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-1">
                      <span className="text-[10px] font-bold uppercase text-slate-500">
                        Funded Amount (Ledger)
                      </span>
                      <div
                        data-testid="admin-review-detail-funded"
                        className="font-mono font-bold text-sm text-emerald-700"
                      >
                        {selectedReviewAd.currency || 'INR'}{' '}
                        {selectedReviewAd.funded}
                      </div>
                      <div className="font-mono text-[11px] text-slate-600">
                        Remaining: {selectedReviewAd.currency || 'INR'}{' '}
                        {selectedReviewAd.remaining}
                      </div>
                    </div>
                  </div>

                  {/* Authenticated Creative Image Preview */}
                  <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                      <span className="font-bold text-slate-800">
                        Uploaded Creative Photo
                      </span>
                      {selectedReviewAd.active_creative && (
                        <span className="font-mono text-[11px] text-slate-600">
                          Creative #{selectedReviewAd.active_creative.id} •{' '}
                          {selectedReviewAd.active_creative.width} ×{' '}
                          {selectedReviewAd.active_creative.height} px •{' '}
                          {selectedReviewAd.active_creative.content_type} (
                          {selectedReviewAd.active_creative.size} bytes) •{' '}
                          {AD_CREATIVE_MODERATION_LABELS[
                            selectedReviewAd.active_creative.moderation_state
                          ] ||
                            selectedReviewAd.active_creative.moderation_state}
                        </span>
                      )}
                    </div>

                    {!selectedReviewAd.active_creative ? (
                      <p className="text-xs text-slate-500 italic">
                        No active creative attached to this advertisement.
                      </p>
                    ) : inspectedCreativeImgLoading ? (
                      <div className="p-6 text-center text-xs text-slate-500">
                        Loading authenticated creative photo...
                      </div>
                    ) : inspectedCreativeImgError ? (
                      <div
                        data-testid="admin-review-creative-img-error"
                        className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-800"
                      >
                        {inspectedCreativeImgError}
                      </div>
                    ) : inspectedCreativeBlobUrl ? (
                      <div className="rounded-lg border border-slate-200 bg-white p-3 flex justify-center">
                        <img
                          data-testid="admin-review-creative-img"
                          src={inspectedCreativeBlobUrl}
                          alt={`Creative for advertisement ${selectedReviewAd.name}`}
                          className="max-h-60 object-contain rounded"
                        />
                      </div>
                    ) : null}
                  </div>
                </div>
              )}

              {/* Review Queue Table */}
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100">
                  <h3 className="text-sm font-bold text-slate-900">
                    Moderation Review Queue
                  </h3>
                  <p className="text-xs text-slate-500">
                    Default filter shows advertisements in `pending_review`. Open an item to view the creative photo, product, and funded amount.
                  </p>
                </div>

                {reviewQueueItems.length === 0 ? (
                  <div
                    data-testid="admin-review-queue-empty"
                    className="p-8 text-center text-sm text-slate-500"
                  >
                    No advertisements in the review queue for the selected filter.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table
                      data-testid="admin-review-queue-table"
                      className="w-full text-left border-collapse"
                    >
                      <thead>
                        <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                          <th className="py-3 px-4">Advertisement</th>
                          <th className="py-3 px-4">Seller Name</th>
                          <th className="py-3 px-4">Product Name</th>
                          <th className="py-3 px-4">Placement</th>
                          <th className="py-3 px-4">Funded Amount</th>
                          <th className="py-3 px-4">Submitted Time</th>
                          <th className="py-3 px-4">Status</th>
                          <th className="py-3 px-4">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                        {reviewQueueItems.map((item) => {
                          const itemPlacement =
                            item.active_creative?.placement || item.placement;
                          const submittedTime =
                            item.active_creative?.updated_at || item.updated_at;
                          return (
                            <tr
                              key={item.id}
                              data-testid={`admin-rq-row-${item.id}`}
                              className="hover:bg-slate-50/80"
                            >
                              <td className="py-3 px-4">
                                <div className="font-semibold text-slate-900">
                                  #{item.id} — {item.name}
                                </div>
                              </td>
                              <td
                                className="py-3 px-4"
                                data-testid={`admin-rq-seller-${item.id}`}
                              >
                                {formatSellerLabel(item)}
                              </td>
                              <td
                                className="py-3 px-4"
                                data-testid={`admin-rq-product-${item.id}`}
                              >
                                {formatProductLabel(item)}
                              </td>
                              <td
                                className="py-3 px-4"
                                data-testid={`admin-rq-placement-${item.id}`}
                              >
                                {formatAdPlacementLabel(itemPlacement)}
                              </td>
                              <td
                                className="py-3 px-4 font-mono font-semibold"
                                data-testid={`admin-rq-funded-${item.id}`}
                              >
                                {item.currency || 'INR'} {item.funded}
                              </td>
                              <td
                                className="py-3 px-4 text-slate-500"
                                data-testid={`admin-rq-submitted-${item.id}`}
                              >
                                {formatAdDateTime(submittedTime)}
                              </td>
                              <td className="py-3 px-4">
                                <span
                                  data-testid={`admin-rq-status-${item.id}`}
                                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${getAdStatusBadgeClass(
                                    item.status
                                  )}`}
                                >
                                  {AD_STATUS_LABELS[item.status] || item.status}
                                </span>
                              </td>
                              <td className="py-3 px-4">
                                <div className="flex flex-wrap items-center gap-1.5">
                                  <button
                                    type="button"
                                    data-testid={`admin-rq-inspect-btn-${item.id}`}
                                    onClick={() => setSelectedReviewAd(item)}
                                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-800 hover:bg-slate-100 text-[11px] font-semibold"
                                  >
                                    <Eye className="w-3.5 h-3.5" />
                                    Inspect
                                  </button>

                                  {item.status === 'pending_review' && (
                                    <>
                                      <button
                                        type="button"
                                        data-testid={`admin-rq-approve-btn-${item.id}`}
                                        onClick={() => {
                                          setSelectedReviewAd(item);
                                          openReviewActionModal(
                                            'approve',
                                            item
                                          );
                                        }}
                                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 text-[11px] font-semibold"
                                      >
                                        <CheckCircle2 className="w-3.5 h-3.5" />
                                        Approve
                                      </button>

                                      <button
                                        type="button"
                                        data-testid={`admin-rq-reject-btn-${item.id}`}
                                        onClick={() => {
                                          setSelectedReviewAd(item);
                                          openReviewActionModal('reject', item);
                                        }}
                                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-red-600 text-white hover:bg-red-700 text-[11px] font-semibold"
                                      >
                                        <XCircle className="w-3.5 h-3.5" />
                                        Reject
                                      </button>
                                    </>
                                  )}

                                  {(item.status === 'approved' ||
                                    item.status === 'running') && (
                                    <button
                                      type="button"
                                      data-testid={`admin-rq-takedown-btn-${item.id}`}
                                      onClick={() => {
                                        setSelectedReviewAd(item);
                                        openReviewActionModal(
                                          'take-down',
                                          item
                                        );
                                      }}
                                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 text-[11px] font-semibold"
                                    >
                                      <Ban className="w-3.5 h-3.5" />
                                      Take down
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2B: AD PRICES (Enabled for ANY staff admin) */}
          {activeTab === 'ad_prices' && (
            <div className="space-y-4" data-testid="admin-ad-prices-section">
              {/* Mandatory Help Text */}
              <div
                data-testid="admin-ad-prices-help-text"
                className="rounded-2xl border border-blue-200 bg-blue-50 px-5 py-3.5 flex items-center gap-3 text-xs text-blue-900 font-semibold"
              >
                <Info className="w-4 h-4 text-blue-700 shrink-0" />
                <span>
                  A price cannot be edited. To change it, schedule a new version.
                </span>
              </div>

              {/* Current & Next Scheduled Price per Placement */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {AD_PLACEMENTS.map((pl) => {
                  const placementInfo =
                    adPricesCurrent.placements?.[pl.value] || {};
                  const currentPrice = placementInfo.current || null;
                  const nextPrice = placementInfo.next || null;
                  return (
                    <div
                      key={pl.value}
                      data-testid={`ad-price-card-${pl.value}`}
                      className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-3"
                    >
                      <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                        <div>
                          <h3 className="text-sm font-bold text-slate-900">
                            {placementInfo.label || pl.label}
                          </h3>
                          <p className="text-[11px] text-slate-500 font-mono">
                            {pl.value}
                          </p>
                        </div>
                        {adPricesCurrent.as_of_date && (
                          <span className="text-[11px] text-slate-500">
                            As of {adPricesCurrent.as_of_date}
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        <div className="p-3 rounded-xl border border-emerald-200 bg-emerald-50/60 space-y-1">
                          <span className="text-[10px] font-bold uppercase text-emerald-800">
                            Current Price in Force
                          </span>
                          {currentPrice ? (
                            <>
                              <div
                                data-testid={`ad-price-current-amount-${pl.value}`}
                                className="font-mono font-bold text-sm text-emerald-950"
                              >
                                {currentPrice.ad_price}{' '}
                                {currentPrice.currency || 'INR'} per ad
                              </div>
                              <div className="text-[11px] text-emerald-800">
                                Effective from: {currentPrice.effective_from}
                              </div>
                            </>
                          ) : (
                            <div
                              data-testid={`ad-price-current-none-${pl.value}`}
                              className="text-slate-500 italic"
                            >
                              No price currently in force
                            </div>
                          )}
                        </div>

                        <div className="p-3 rounded-xl border border-slate-200 bg-slate-50 space-y-1">
                          <span className="text-[10px] font-bold uppercase text-slate-500">
                            Next Scheduled Price
                          </span>
                          {nextPrice ? (
                            <>
                              <div
                                data-testid={`ad-price-next-amount-${pl.value}`}
                                className="font-mono font-bold text-sm text-slate-900"
                              >
                                {nextPrice.ad_price}{' '}
                                {nextPrice.currency || 'INR'} per ad
                              </div>
                              <div className="text-[11px] text-slate-600">
                                Effective from: {nextPrice.effective_from}
                              </div>
                            </>
                          ) : (
                            <div
                              data-testid={`ad-price-next-none-${pl.value}`}
                              className="text-slate-500 italic"
                            >
                              None scheduled
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Schedule New Price Form (enabled for ANY staff admin) */}
              <div
                data-testid="schedule-ad-price-form-card"
                className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-4"
              >
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      Schedule new price
                    </h3>
                    <p className="text-xs text-slate-500">
                      Creates a new versioned fixed advertisement price for the selected placement on a non-overlapping effective date.
                    </p>
                  </div>
                </div>

                {newPriceGeneralError && (
                  <div
                    data-testid="ad-price-general-error"
                    role="alert"
                    className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-800 font-medium"
                  >
                    {newPriceGeneralError}
                  </div>
                )}

                <form
                  onSubmit={handleScheduleAdPriceSubmit}
                  data-testid="schedule-ad-price-form"
                  className="space-y-4"
                  noValidate
                >
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                    <div>
                      <label
                        htmlFor="ad-price-placement"
                        className="block text-xs font-semibold text-slate-700 mb-1"
                      >
                        Placement
                      </label>
                      <select
                        id="ad-price-placement"
                        data-testid="ad-price-placement-select"
                        value={newPricePlacement}
                        onChange={(e) => {
                          setNewPricePlacement(e.target.value);
                          setNewPriceFieldErrors((fe) => ({
                            ...fe,
                            placement: '',
                          }));
                        }}
                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900"
                      >
                        {AD_PLACEMENTS.map((pl) => (
                          <option key={pl.value} value={pl.value}>
                            {pl.label}
                          </option>
                        ))}
                      </select>
                      {newPriceFieldErrors.placement && (
                        <p
                          data-testid="ad-price-error-placement"
                          className="mt-1 text-xs text-red-600 font-medium"
                        >
                          {newPriceFieldErrors.placement}
                        </p>
                      )}
                    </div>

                    <div>
                      <label
                        htmlFor="ad-price-amount"
                        className="block text-xs font-semibold text-slate-700 mb-1"
                      >
                        Price per Advertisement
                      </label>
                      <div className="flex items-center gap-1.5">
                        <input
                          id="ad-price-amount"
                          data-testid="ad-price-amount-input"
                          type="text"
                          inputMode="decimal"
                          value={newPriceAmount}
                          onChange={(e) => {
                            setNewPriceAmount(e.target.value);
                            setNewPriceFieldErrors((fe) => ({
                              ...fe,
                              ad_price: '',
                            }));
                          }}
                          placeholder="e.g. 20.00"
                          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 font-mono"
                        />
                        <span className="text-[11px] font-bold text-slate-600 shrink-0">
                          INR per ad
                        </span>
                      </div>
                      {newPriceFieldErrors.ad_price && (
                        <p
                          data-testid="ad-price-error-ad_price"
                          className="mt-1 text-xs text-red-600 font-medium"
                        >
                          {newPriceFieldErrors.ad_price}
                        </p>
                      )}
                    </div>

                    <div>
                      <label
                        htmlFor="ad-price-effective-from"
                        className="block text-xs font-semibold text-slate-700 mb-1"
                      >
                        Effective From
                      </label>
                      <input
                        id="ad-price-effective-from"
                        data-testid="ad-price-effective-from-input"
                        type="date"
                        value={newPriceEffectiveFrom}
                        onChange={(e) => {
                          setNewPriceEffectiveFrom(e.target.value);
                          setNewPriceFieldErrors((fe) => ({
                            ...fe,
                            effective_from: '',
                          }));
                        }}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900"
                      />
                      {newPriceFieldErrors.effective_from && (
                        <p
                          data-testid="ad-price-error-effective_from"
                          className="mt-1 text-xs text-red-600 font-medium"
                        >
                          {newPriceFieldErrors.effective_from}
                        </p>
                      )}
                    </div>

                    <div>
                      <label
                        htmlFor="ad-price-reason"
                        className="block text-xs font-semibold text-slate-700 mb-1"
                      >
                        Reason
                      </label>
                      <input
                        id="ad-price-reason"
                        data-testid="ad-price-reason-input"
                        type="text"
                        value={newPriceReason}
                        onChange={(e) => {
                          setNewPriceReason(e.target.value);
                          setNewPriceFieldErrors((fe) => ({
                            ...fe,
                            reason: '',
                          }));
                        }}
                        placeholder="Reason for scheduling price"
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900"
                      />
                      {newPriceFieldErrors.reason && (
                        <p
                          data-testid="ad-price-error-reason"
                          className="mt-1 text-xs text-red-600 font-medium"
                        >
                          {newPriceFieldErrors.reason}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-end gap-2">
                    <button
                      type="submit"
                      data-testid="ad-price-submit-btn"
                      disabled={newPriceSubmitting}
                      className="px-4 py-2 rounded-xl bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-50 text-xs font-semibold"
                    >
                      {newPriceSubmitting
                        ? 'Scheduling...'
                        : 'Schedule new price'}
                    </button>
                  </div>
                </form>
              </div>

              {/* Ad Prices Version History Table */}
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      Ad Price Version History
                    </h3>
                    <p className="text-xs text-slate-500">
                      Immutable history of all approved and superseded fixed advertisement prices per placement.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <select
                      data-testid="ad-price-history-filter-placement"
                      value={adPricePlacementFilter}
                      onChange={(e) =>
                        setAdPricePlacementFilter(e.target.value)
                      }
                      aria-label="Filter ad price history by placement"
                      className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-800"
                    >
                      <option value="">All placements</option>
                      {AD_PLACEMENTS.map((pl) => (
                        <option key={pl.value} value={pl.value}>
                          {pl.label}
                        </option>
                      ))}
                    </select>

                    <select
                      data-testid="ad-price-history-filter-status"
                      value={adPriceStatusFilter}
                      onChange={(e) => setAdPriceStatusFilter(e.target.value)}
                      aria-label="Filter ad price history by status"
                      className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-800"
                    >
                      <option value="">All statuses</option>
                      {AD_PRICE_STATUSES.map((st) => (
                        <option key={st.value} value={st.value}>
                          {st.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {adPricesHistory.length === 0 ? (
                  <div
                    data-testid="ad-price-history-empty"
                    className="p-8 text-center text-sm text-slate-500"
                  >
                    No advertising-price versions found.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table
                      data-testid="ad-price-history-table"
                      className="w-full text-left border-collapse"
                    >
                      <thead>
                        <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                          <th className="py-3 px-4">ID</th>
                          <th className="py-3 px-4">Placement</th>
                          <th className="py-3 px-4">Amount</th>
                          <th className="py-3 px-4">Status</th>
                          <th className="py-3 px-4">Effective From</th>
                          <th className="py-3 px-4">Effective To</th>
                          <th className="py-3 px-4">Reason</th>
                          <th className="py-3 px-4">Created At</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                        {adPricesHistory.map((price) => (
                          <tr
                            key={price.id}
                            data-testid={`ad-price-row-${price.id}`}
                            className="hover:bg-slate-50/80"
                          >
                            <td className="py-3 px-4 font-semibold text-slate-900">
                              #{price.id}
                            </td>
                            <td className="py-3 px-4">
                              {formatAdPlacementLabel(price.placement)}
                            </td>
                            <td
                              className="py-3 px-4 font-mono font-semibold"
                              data-testid={`ad-price-amount-${price.id}`}
                            >
                              {price.ad_price} {price.currency || 'INR'} per ad
                            </td>
                            <td className="py-3 px-4">
                              <span
                                data-testid={`ad-price-status-${price.id}`}
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${getAdClickRateStatusBadgeClass(
                                  price.status
                                )}`}
                              >
                                {AD_PRICE_STATUS_LABELS[price.status] ||
                                  price.status}
                              </span>
                            </td>
                            <td className="py-3 px-4 font-mono">
                              {price.effective_from}
                            </td>
                            <td className="py-3 px-4 font-mono">
                              {price.effective_to || '—'}
                            </td>
                            <td className="py-3 px-4">{price.reason}</td>
                            <td className="py-3 px-4 text-slate-500">
                              {formatAdDateTime(price.created_at)}
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

          {/* TAB 3: CLICK PRICES (Enabled for ANY staff admin) */}
          {activeTab === 'click_rates' && (
            <div
              className="space-y-4"
              data-testid="admin-click-rates-section"
            >
              {/* Mandatory Help Text */}
              <div
                data-testid="admin-click-rates-help-text"
                className="rounded-2xl border border-blue-200 bg-blue-50 px-5 py-3.5 flex items-center gap-3 text-xs text-blue-900 font-semibold"
              >
                <Info className="w-4 h-4 text-blue-700 shrink-0" />
                <span>
                  A rate cannot be edited. To change it, schedule a new version for a future date.
                </span>
              </div>

              {/* Current & Next Scheduled Rate per Placement */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {AD_PLACEMENTS.map((pl) => {
                  const placementInfo =
                    clickRatesCurrent.placements?.[pl.value] || {};
                  const currentRate = placementInfo.current || null;
                  const nextRate = placementInfo.next || null;
                  return (
                    <div
                      key={pl.value}
                      data-testid={`click-rate-card-${pl.value}`}
                      className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-3"
                    >
                      <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                        <div>
                          <h3 className="text-sm font-bold text-slate-900">
                            {placementInfo.label || pl.label}
                          </h3>
                          <p className="text-[11px] text-slate-500 font-mono">
                            {pl.value}
                          </p>
                        </div>
                        {clickRatesCurrent.as_of_date && (
                          <span className="text-[11px] text-slate-500">
                            As of {clickRatesCurrent.as_of_date}
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        <div className="p-3 rounded-xl border border-emerald-200 bg-emerald-50/60 space-y-1">
                          <span className="text-[10px] font-bold uppercase text-emerald-800">
                            Current Rate in Force
                          </span>
                          {currentRate ? (
                            <>
                              <div
                                data-testid={`click-rate-current-amount-${pl.value}`}
                                className="font-mono font-bold text-sm text-emerald-950"
                              >
                                {currentRate.amount_per_click}{' '}
                                {currentRate.currency || 'INR'} per click
                              </div>
                              <div className="text-[11px] text-emerald-800">
                                Effective from: {currentRate.effective_from}
                              </div>
                            </>
                          ) : (
                            <div
                              data-testid={`click-rate-current-none-${pl.value}`}
                              className="text-slate-500 italic"
                            >
                              No rate currently in force
                            </div>
                          )}
                        </div>

                        <div className="p-3 rounded-xl border border-slate-200 bg-slate-50 space-y-1">
                          <span className="text-[10px] font-bold uppercase text-slate-500">
                            Next Scheduled Rate
                          </span>
                          {nextRate ? (
                            <>
                              <div
                                data-testid={`click-rate-next-amount-${pl.value}`}
                                className="font-mono font-bold text-sm text-slate-900"
                              >
                                {nextRate.amount_per_click}{' '}
                                {nextRate.currency || 'INR'} per click
                              </div>
                              <div className="text-[11px] text-slate-600">
                                Effective from: {nextRate.effective_from}
                              </div>
                            </>
                          ) : (
                            <div
                              data-testid={`click-rate-next-none-${pl.value}`}
                              className="text-slate-500 italic"
                            >
                              None scheduled
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Schedule New Rate Form (enabled for ANY staff admin) */}
              <div
                data-testid="schedule-click-rate-form-card"
                className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-4"
              >
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      Schedule new rate
                    </h3>
                    <p className="text-xs text-slate-500">
                      Creates a new versioned click price for the selected placement on a non-overlapping effective date.
                    </p>
                  </div>
                </div>

                {newRateGeneralError && (
                  <div
                    data-testid="click-rate-general-error"
                    role="alert"
                    className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-800 font-medium"
                  >
                    {newRateGeneralError}
                  </div>
                )}

                <form
                  onSubmit={handleScheduleClickRateSubmit}
                  data-testid="schedule-click-rate-form"
                  className="space-y-4"
                  noValidate
                >
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                    <div>
                      <label
                        htmlFor="click-rate-placement"
                        className="block text-xs font-semibold text-slate-700 mb-1"
                      >
                        Placement
                      </label>
                      <select
                        id="click-rate-placement"
                        data-testid="click-rate-placement-select"
                        value={newRatePlacement}
                        onChange={(e) => {
                          setNewRatePlacement(e.target.value);
                          setNewRateFieldErrors((fe) => ({
                            ...fe,
                            placement: '',
                          }));
                        }}
                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900"
                      >
                        {AD_PLACEMENTS.map((pl) => (
                          <option key={pl.value} value={pl.value}>
                            {pl.label}
                          </option>
                        ))}
                      </select>
                      {newRateFieldErrors.placement && (
                        <p
                          data-testid="click-rate-error-placement"
                          className="mt-1 text-xs text-red-600 font-medium"
                        >
                          {newRateFieldErrors.placement}
                        </p>
                      )}
                    </div>

                    <div>
                      <label
                        htmlFor="click-rate-amount"
                        className="block text-xs font-semibold text-slate-700 mb-1"
                      >
                        Amount per Click
                      </label>
                      <div className="flex items-center gap-1.5">
                        <input
                          id="click-rate-amount"
                          data-testid="click-rate-amount-input"
                          type="text"
                          inputMode="decimal"
                          value={newRateAmount}
                          onChange={(e) => {
                            setNewRateAmount(e.target.value);
                            setNewRateFieldErrors((fe) => ({
                              ...fe,
                              amount_per_click: '',
                            }));
                          }}
                          placeholder="e.g. 1.50"
                          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 font-mono"
                        />
                        <span className="text-[11px] font-bold text-slate-600 shrink-0">
                          INR per click
                        </span>
                      </div>
                      {newRateFieldErrors.amount_per_click && (
                        <p
                          data-testid="click-rate-error-amount_per_click"
                          className="mt-1 text-xs text-red-600 font-medium"
                        >
                          {newRateFieldErrors.amount_per_click}
                        </p>
                      )}
                    </div>

                    <div>
                      <label
                        htmlFor="click-rate-effective-from"
                        className="block text-xs font-semibold text-slate-700 mb-1"
                      >
                        Effective From
                      </label>
                      <input
                        id="click-rate-effective-from"
                        data-testid="click-rate-effective-from-input"
                        type="date"
                        value={newRateEffectiveFrom}
                        onChange={(e) => {
                          setNewRateEffectiveFrom(e.target.value);
                          setNewRateFieldErrors((fe) => ({
                            ...fe,
                            effective_from: '',
                          }));
                        }}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900"
                      />
                      {newRateFieldErrors.effective_from && (
                        <p
                          data-testid="click-rate-error-effective_from"
                          className="mt-1 text-xs text-red-600 font-medium"
                        >
                          {newRateFieldErrors.effective_from}
                        </p>
                      )}
                    </div>

                    <div>
                      <label
                        htmlFor="click-rate-reason"
                        className="block text-xs font-semibold text-slate-700 mb-1"
                      >
                        Reason
                      </label>
                      <input
                        id="click-rate-reason"
                        data-testid="click-rate-reason-input"
                        type="text"
                        value={newRateReason}
                        onChange={(e) => {
                          setNewRateReason(e.target.value);
                          setNewRateFieldErrors((fe) => ({
                            ...fe,
                            reason: '',
                          }));
                        }}
                        placeholder="Reason for scheduling rate"
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900"
                      />
                      {newRateFieldErrors.reason && (
                        <p
                          data-testid="click-rate-error-reason"
                          className="mt-1 text-xs text-red-600 font-medium"
                        >
                          {newRateFieldErrors.reason}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-end gap-2">
                    <button
                      type="submit"
                      data-testid="click-rate-submit-btn"
                      disabled={newRateSubmitting}
                      className="px-4 py-2 rounded-xl bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-50 text-xs font-semibold"
                    >
                      {newRateSubmitting
                        ? 'Scheduling...'
                        : 'Schedule new rate'}
                    </button>
                  </div>
                </form>
              </div>

              {/* Click Rates Version History Table */}
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      Click Rate Version History
                    </h3>
                    <p className="text-xs text-slate-500">
                      Immutable history of all approved and superseded click rates per placement.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <select
                      data-testid="click-rate-history-filter-placement"
                      value={clickRatePlacementFilter}
                      onChange={(e) =>
                        setClickRatePlacementFilter(e.target.value)
                      }
                      aria-label="Filter click rate history by placement"
                      className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-800"
                    >
                      <option value="">All placements</option>
                      {AD_PLACEMENTS.map((pl) => (
                        <option key={pl.value} value={pl.value}>
                          {pl.label}
                        </option>
                      ))}
                    </select>

                    <select
                      data-testid="click-rate-history-filter-status"
                      value={clickRateStatusFilter}
                      onChange={(e) => setClickRateStatusFilter(e.target.value)}
                      aria-label="Filter click rate history by status"
                      className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-800"
                    >
                      <option value="">All statuses</option>
                      {AD_CLICK_RATE_STATUSES.map((st) => (
                        <option key={st.value} value={st.value}>
                          {st.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {clickRatesHistory.length === 0 ? (
                  <div
                    data-testid="click-rate-history-empty"
                    className="p-8 text-center text-sm text-slate-500"
                  >
                    No click-rate versions found.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table
                      data-testid="click-rate-history-table"
                      className="w-full text-left border-collapse"
                    >
                      <thead>
                        <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                          <th className="py-3 px-4">ID</th>
                          <th className="py-3 px-4">Placement</th>
                          <th className="py-3 px-4">Amount</th>
                          <th className="py-3 px-4">Status</th>
                          <th className="py-3 px-4">Effective From</th>
                          <th className="py-3 px-4">Effective To</th>
                          <th className="py-3 px-4">Reason</th>
                          <th className="py-3 px-4">Created At</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                        {clickRatesHistory.map((rate) => (
                          <tr
                            key={rate.id}
                            data-testid={`click-rate-row-${rate.id}`}
                            className="hover:bg-slate-50/80"
                          >
                            <td className="py-3 px-4 font-semibold text-slate-900">
                              #{rate.id}
                            </td>
                            <td className="py-3 px-4">
                              {formatAdPlacementLabel(rate.placement)}
                            </td>
                            <td
                              className="py-3 px-4 font-mono font-semibold"
                              data-testid={`click-rate-amount-${rate.id}`}
                            >
                              {rate.amount_per_click} {rate.currency || 'INR'}{' '}
                              per click
                            </td>
                            <td className="py-3 px-4">
                              <span
                                data-testid={`click-rate-status-${rate.id}`}
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${getAdClickRateStatusBadgeClass(
                                  rate.status
                                )}`}
                              >
                                {AD_CLICK_RATE_STATUS_LABELS[rate.status] ||
                                  rate.status}
                              </span>
                            </td>
                            <td className="py-3 px-4 font-mono">
                              {rate.effective_from}
                            </td>
                            <td className="py-3 px-4 font-mono">
                              {rate.effective_to || '—'}
                            </td>
                            <td className="py-3 px-4">{rate.reason}</td>
                            <td className="py-3 px-4 text-slate-500">
                              {formatAdDateTime(rate.created_at)}
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

          {/* TAB 4: CLICKS (Phase 3 Part 1: staff read-only click log & per-ad counts by decision and reason; never shows token ids) */}
          {activeTab === 'clicks' && (
            <div className="space-y-4" data-testid="admin-clicks-section">
              {/* Clicks Filters */}
              <div
                data-testid="admin-clicks-filters"
                className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm grid grid-cols-1 sm:grid-cols-6 gap-3"
              >
                <div>
                  <label
                    htmlFor="admin-clicks-filter-ad"
                    className="block text-[11px] font-semibold text-slate-600 mb-1"
                  >
                    Advertisement ID
                  </label>
                  <input
                    id="admin-clicks-filter-ad"
                    data-testid="admin-clicks-filter-ad"
                    type="text"
                    inputMode="numeric"
                    value={clicksAdFilter}
                    onChange={(e) => setClicksAdFilter(e.target.value)}
                    placeholder="All ads (e.g. 7)"
                    className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-800"
                  />
                </div>

                <div>
                  <label
                    htmlFor="admin-clicks-filter-decision"
                    className="block text-[11px] font-semibold text-slate-600 mb-1"
                  >
                    Decision
                  </label>
                  <select
                    id="admin-clicks-filter-decision"
                    data-testid="admin-clicks-filter-decision"
                    value={clicksDecisionFilter}
                    onChange={(e) => setClicksDecisionFilter(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-800"
                  >
                    <option value="">All decisions</option>
                    {AD_CLICK_DECISIONS.map((dec) => (
                      <option key={dec.value} value={dec.value}>
                        {dec.label} ({dec.value})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="admin-clicks-filter-reason"
                    className="block text-[11px] font-semibold text-slate-600 mb-1"
                  >
                    Reason Code
                  </label>
                  <select
                    id="admin-clicks-filter-reason"
                    data-testid="admin-clicks-filter-reason"
                    value={clicksReasonFilter}
                    onChange={(e) => setClicksReasonFilter(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-800"
                  >
                    <option value="">All reason codes</option>
                    {AD_CLICK_REASONS.map((rsn) => (
                      <option key={rsn.value} value={rsn.value}>
                        {rsn.label} ({rsn.value})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="admin-clicks-filter-date-from"
                    className="block text-[11px] font-semibold text-slate-600 mb-1"
                  >
                    Date From
                  </label>
                  <input
                    id="admin-clicks-filter-date-from"
                    data-testid="admin-clicks-filter-date-from"
                    type="date"
                    value={clicksDateFromFilter}
                    onChange={(e) => setClicksDateFromFilter(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-800"
                  />
                </div>

                <div>
                  <label
                    htmlFor="admin-clicks-filter-date-to"
                    className="block text-[11px] font-semibold text-slate-600 mb-1"
                  >
                    Date To
                  </label>
                  <input
                    id="admin-clicks-filter-date-to"
                    data-testid="admin-clicks-filter-date-to"
                    type="date"
                    value={clicksDateToFilter}
                    onChange={(e) => setClicksDateToFilter(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-800"
                  />
                </div>

                <div className="flex items-end">
                  <button
                    type="button"
                    data-testid="admin-clicks-filter-clear-btn"
                    onClick={() => {
                      setClicksAdFilter('');
                      setClicksDecisionFilter('');
                      setClicksReasonFilter('');
                      setClicksDateFromFilter('');
                      setClicksDateToFilter('');
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 text-xs font-semibold"
                  >
                    <Filter className="w-3.5 h-3.5" />
                    Clear Click Filters
                  </button>
                </div>
              </div>

              {/* Per-Ad Counts by Decision and Reason */}
              <div
                data-testid="admin-clicks-counts-by-ad"
                className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden"
              >
                <div className="px-6 py-4 border-b border-slate-100">
                  <h3 className="text-sm font-bold text-slate-900">
                    Per-Advertisement Click Counts by Decision &amp; Reason
                  </h3>
                  <p className="text-xs text-slate-500">
                    Read-only summary of recorded click evaluations per advertisement from the server.
                  </p>
                </div>

                {clicksCountsByAd.length === 0 ? (
                  <div
                    data-testid="admin-clicks-counts-empty"
                    className="p-6 text-center text-xs text-slate-500"
                  >
                    No per-advertisement click counts for the selected filters.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                          <th className="py-3 px-4">Advertisement</th>
                          <th className="py-3 px-4">Counts by Decision</th>
                          <th className="py-3 px-4">Counts by Reason</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700">
                        {clicksCountsByAd.map((group) => (
                          <tr
                            key={group.advertisement_id}
                            data-testid={`admin-clicks-count-row-${group.advertisement_id}`}
                            className="hover:bg-slate-50/80"
                          >
                            <td className="py-3 px-4 font-semibold text-slate-900">
                              Ad #{group.advertisement_id}
                            </td>
                            <td
                              className="py-3 px-4"
                              data-testid={`admin-clicks-by-decision-${group.advertisement_id}`}
                            >
                              <div className="flex flex-wrap gap-1.5">
                                {Object.entries(group.by_decision || {}).map(
                                  ([decCode, count]) => (
                                    <span
                                      key={decCode}
                                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${getAdClickDecisionBadgeClass(
                                        decCode
                                      )}`}
                                    >
                                      <span>
                                        {formatAdClickDecisionLabel(decCode)}
                                      </span>
                                      <span className="font-mono text-[10px] opacity-80">
                                        ({decCode})
                                      </span>
                                      <span className="font-mono font-bold">
                                        : {count}
                                      </span>
                                    </span>
                                  )
                                )}
                              </div>
                            </td>
                            <td
                              className="py-3 px-4"
                              data-testid={`admin-clicks-by-reason-${group.advertisement_id}`}
                            >
                              <div className="flex flex-wrap gap-1.5">
                                {Object.entries(group.by_reason || {}).map(
                                  ([rsnCode, count]) => (
                                    <span
                                      key={rsnCode}
                                      className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-800 border border-slate-200 text-[11px] font-semibold"
                                    >
                                      <span>
                                        {formatAdClickReasonLabel(rsnCode)}
                                      </span>
                                      <span className="font-mono text-[10px] text-slate-500">
                                        ({rsnCode})
                                      </span>
                                      <span className="font-mono font-bold">
                                        : {count}
                                      </span>
                                    </span>
                                  )
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

              {/* Recorded Clicks Table (Never shows token ids; offers Reverse Click Charge on billed clicks) */}
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      Recorded Clicks
                    </h3>
                    <p className="text-xs text-slate-500">
                      Append-only log of recorded storefront click evaluations with plain labels and raw reason codes. Superusers can reverse a billed click charge with a compensating entry.
                    </p>
                  </div>
                  {!isSuperuser && (
                    <span
                      data-testid="admin-clicks-readonly-note"
                      className="px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-900 text-[11px] font-semibold"
                    >
                      Read-only for non-superuser staff (reversing a billed click charge requires superuser permission)
                    </span>
                  )}
                </div>

                {clicksResults.length === 0 ? (
                  <div
                    data-testid="admin-clicks-empty"
                    className="p-8 text-center text-sm text-slate-500"
                  >
                    No recorded clicks match the selected filters.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table
                      data-testid="admin-clicks-table"
                      className="w-full text-left border-collapse"
                    >
                      <thead>
                        <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                          <th className="py-3 px-4">Click ID</th>
                          <th className="py-3 px-4">Advertisement</th>
                          <th className="py-3 px-4">Creative</th>
                          <th className="py-3 px-4">Placement</th>
                          <th className="py-3 px-4">Decision</th>
                          <th className="py-3 px-4">Reason</th>
                          <th className="py-3 px-4">Click Amount Snapshot</th>
                          <th className="py-3 px-4">Issued At</th>
                          <th className="py-3 px-4">Clicked At</th>
                          <th className="py-3 px-4">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                        {clicksResults.map((click) => (
                          <tr
                            key={click.id}
                            data-testid={`admin-click-row-${click.id}`}
                            className="hover:bg-slate-50/80"
                          >
                            <td className="py-3 px-4 font-semibold text-slate-900">
                              #{click.id}
                            </td>
                            <td className="py-3 px-4">
                              Ad #{click.advertisement_id}
                            </td>
                            <td className="py-3 px-4">
                              Creative #{click.creative_id}
                            </td>
                            <td className="py-3 px-4">
                              {formatAdPlacementLabel(click.placement)}
                            </td>
                            <td className="py-3 px-4">
                              <span
                                data-testid={`admin-click-decision-${click.id}`}
                                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${getAdClickDecisionBadgeClass(
                                  click.decision
                                )}`}
                              >
                                <span>
                                  {formatAdClickDecisionLabel(click.decision)}
                                </span>
                                <span className="font-mono text-[10px] opacity-80">
                                  ({click.decision})
                                </span>
                              </span>
                            </td>
                            <td
                              className="py-3 px-4"
                              data-testid={`admin-click-reason-${click.id}`}
                            >
                              <div className="font-semibold text-slate-900">
                                {formatAdClickReasonLabel(click.reason_code)}
                              </div>
                              <div className="font-mono text-[10px] text-slate-500">
                                {click.reason_code}
                              </div>
                            </td>
                            <td
                              className="py-3 px-4 font-mono"
                              data-testid={`admin-click-amount-${click.id}`}
                            >
                              INR {click.click_amount_snapshot}
                            </td>
                            <td className="py-3 px-4 text-slate-500">
                              {formatAdDateTime(click.issued_at)}
                            </td>
                            <td className="py-3 px-4 text-slate-500">
                              {formatAdDateTime(click.clicked_at)}
                            </td>
                            <td className="py-3 px-4">
                              {click.decision === 'billed' ? (
                                <div className="flex flex-wrap items-center gap-1.5">
                                  <button
                                    type="button"
                                    disabled={!isSuperuser}
                                    onClick={() =>
                                      openReverseClickChargeModal(click)
                                    }
                                    data-testid={`open-reverse-click-charge-btn-${click.id}`}
                                    title={
                                      !isSuperuser
                                        ? 'Superuser permission required to reverse a click charge'
                                        : 'Reverse this billed click charge'
                                    }
                                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 disabled:bg-slate-200 disabled:border-slate-200 disabled:text-slate-500 disabled:cursor-not-allowed text-[11px] font-semibold transition-colors"
                                  >
                                    <RotateCcw className="w-3.5 h-3.5" />
                                    {isSuperuser
                                      ? 'Reverse Click Charge'
                                      : 'Reverse Charge (Superuser Only)'}
                                  </button>
                                  {!isSuperuser && (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        openReverseClickChargeModal(click)
                                      }
                                      data-testid={`attempt-reverse-click-charge-btn-${click.id}`}
                                      className="inline-flex items-center gap-1 px-2 py-1 rounded-lg border border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100 text-[10px] font-semibold"
                                    >
                                      Verify 403
                                    </button>
                                  )}
                                </div>
                              ) : (
                                <span className="text-slate-400">—</span>
                              )}
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

          {/* TAB 5: PAYMENTS */}
          {activeTab === 'payments' && (
            <div
              className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden"
              data-testid="admin-payments-table-section"
            >
              <div className="px-6 py-4 border-b border-slate-100">
                <h3 className="text-sm font-bold text-slate-900">
                  Recorded &amp; Reversed Payments
                </h3>
                <p className="text-xs text-slate-500">
                  Superusers can reverse a recorded payment when no funded amount has been spent.
                </p>
              </div>

              {payments.length === 0 ? (
                <div
                  className="p-8 text-center text-sm text-slate-500"
                  data-testid="admin-payments-empty"
                >
                  No payment records match the selected filters.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                        <th className="py-3 px-4">ID</th>
                        <th className="py-3 px-4">Ad ID</th>
                        <th className="py-3 px-4">Seller</th>
                        <th className="py-3 px-4">Amount</th>
                        <th className="py-3 px-4">External Reference</th>
                        <th className="py-3 px-4">Received Date</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4">Reason</th>
                        <th className="py-3 px-4">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                      {payments.map((payment) => (
                        <tr
                          key={payment.id}
                          data-testid={`admin-payment-row-${payment.id}`}
                          className="hover:bg-slate-50/80"
                        >
                          <td className="py-3 px-4 font-semibold text-slate-900">
                            #{payment.id}
                          </td>
                          <td className="py-3 px-4">
                            Ad #{payment.advertisement_id}
                          </td>
                          <td className="py-3 px-4">
                            Seller #{payment.seller_id}
                          </td>
                          <td className="py-3 px-4 font-mono">
                            {payment.currency || 'INR'} {payment.amount}
                          </td>
                          <td className="py-3 px-4 font-mono">
                            {payment.external_reference}
                          </td>
                          <td className="py-3 px-4">{payment.received_date}</td>
                          <td className="py-3 px-4">
                            <span
                              data-testid={`admin-payment-status-${payment.id}`}
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${getAdPaymentStatusBadgeClass(
                                payment.status
                              )}`}
                            >
                              {AD_PAYMENT_STATUS_LABELS[payment.status] ||
                                payment.status}
                            </span>
                          </td>
                          <td
                            className="py-3 px-4 max-w-xs truncate"
                            title={payment.reason}
                          >
                            {payment.reason}
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <button
                                type="button"
                                disabled={!isSuperuser}
                                onClick={() => openReversePaymentModal(payment)}
                                data-testid={`open-reverse-payment-btn-${payment.id}`}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 disabled:bg-slate-200 disabled:border-slate-200 disabled:text-slate-500 disabled:cursor-not-allowed text-[11px] font-semibold transition-colors"
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                                {isSuperuser
                                  ? 'Reverse Payment'
                                  : 'Reverse (Superuser Only)'}
                              </button>
                              {!isSuperuser && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    openReversePaymentModal(payment)
                                  }
                                  data-testid={`attempt-reverse-payment-btn-${payment.id}`}
                                  className="inline-flex items-center gap-1 px-2 py-1 rounded-lg border border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100 text-[10px] font-semibold"
                                >
                                  Verify Server 403
                                </button>
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
          )}

          {/* TAB 6: LEDGER */}
          {activeTab === 'ledger' && (
            <div
              className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden"
              data-testid="admin-ledger-table-section"
            >
              <div className="px-6 py-4 border-b border-slate-100">
                <h3 className="text-sm font-bold text-slate-900">
                  Immutable Advertising Ledger
                </h3>
                <p className="text-xs text-slate-500">
                  Append-only financial ledger of all recorded credits, reversals, refunds of unspent money, and click entries.
                </p>
              </div>

              {filteredLedger.length === 0 ? (
                <div
                  className="p-8 text-center text-sm text-slate-500"
                  data-testid="admin-ledger-empty"
                >
                  No ledger entries match the selected filters.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                        <th className="py-3 px-4">Entry ID</th>
                        <th className="py-3 px-4">Ad ID</th>
                        <th className="py-3 px-4">Payment ID</th>
                        <th className="py-3 px-4">Seller</th>
                        <th className="py-3 px-4">Entry Type</th>
                        <th className="py-3 px-4">Amount</th>
                        <th className="py-3 px-4">Reference</th>
                        <th className="py-3 px-4">Reverses</th>
                        <th className="py-3 px-4">Reason</th>
                        <th className="py-3 px-4">Created At</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                      {filteredLedger.map((entry) => (
                        <tr
                          key={entry.id}
                          data-testid={`admin-ledger-row-${entry.id}`}
                          className="hover:bg-slate-50/80"
                        >
                          <td className="py-3 px-4 font-semibold text-slate-900">
                            #{entry.id}
                          </td>
                          <td className="py-3 px-4">
                            Ad #{entry.advertisement_id}
                          </td>
                          <td className="py-3 px-4">
                            {entry.ad_payment_id
                              ? `Payment #${entry.ad_payment_id}`
                              : '—'}
                          </td>
                          <td className="py-3 px-4">
                            Seller #{entry.seller_id}
                          </td>
                          <td className="py-3 px-4">
                            <span
                              data-testid={`admin-ledger-type-${entry.id}`}
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${getAdLedgerBadgeClass(
                                entry.entry_type
                              )}`}
                            >
                              {formatAdLedgerEntryTypeLabel(
                                entry.entry_type,
                                entry.entry_type_label
                              )}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-mono">
                            {entry.currency || 'INR'} {entry.amount}
                          </td>
                          <td className="py-3 px-4 font-mono">
                            {entry.reference || '—'}
                            {entry.refund_date ? ` (${entry.refund_date})` : ''}
                          </td>
                          <td className="py-3 px-4">
                            {entry.reverses_id
                              ? `Entry #${entry.reverses_id}`
                              : '—'}
                          </td>
                          <td
                            className="py-3 px-4 max-w-xs truncate"
                            title={entry.reason}
                          >
                            {entry.reason}
                          </td>
                          <td className="py-3 px-4 text-slate-500">
                            {formatAdDateTime(entry.created_at)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 7: RECONCILIATION (No stored budget shown as money truth; show funded, real vs simulated funded, spent, remaining, and all server reconciliation flags) */}
          {activeTab === 'reconciliation' && (
            <div className="space-y-4" data-testid="admin-reconciliation-section">
              {/* Totals Summary */}
              <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
                <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Total Funded (Ledger)
                  </p>
                  <p
                    className="mt-2 text-2xl font-bold text-slate-900 font-mono"
                    data-testid="recon-total-funded"
                  >
                    INR {String(reconciliation.totals?.funded ?? '0.00')}
                  </p>
                </div>
                <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Funded (Real)
                  </p>
                  <p
                    className="mt-2 text-2xl font-bold text-emerald-700 font-mono"
                    data-testid="recon-total-funded-real"
                  >
                    INR {String(reconciliation.totals?.funded_real ?? '0.00')}
                  </p>
                </div>
                <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Funded (Simulated Test)
                  </p>
                  <p
                    className="mt-2 text-2xl font-bold text-blue-700 font-mono"
                    data-testid="recon-total-funded-simulated"
                  >
                    INR {String(reconciliation.totals?.funded_simulated ?? '0.00')}
                  </p>
                </div>
                <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Total Spent (Ledger)
                  </p>
                  <p
                    className="mt-2 text-2xl font-bold text-slate-900 font-mono"
                    data-testid="recon-total-spent"
                  >
                    INR {String(reconciliation.totals?.spent ?? '0.00')}
                  </p>
                </div>
                <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Total Remaining (Ledger)
                  </p>
                  <p
                    className="mt-2 text-2xl font-bold text-slate-900 font-mono"
                    data-testid="recon-total-remaining"
                  >
                    INR {String(reconciliation.totals?.remaining ?? '0.00')}
                  </p>
                </div>
              </div>

              {/* Plain help text for all reconciliation flag fields returned by the API */}
              <div
                data-testid="recon-flags-help-text"
                className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-3.5 text-xs text-slate-700 space-y-1"
              >
                <div className="font-bold text-slate-900 flex items-center gap-1.5">
                  <Info className="w-4 h-4 text-slate-600" />
                  <span>Server Reconciliation Flags Reference</span>
                </div>
                <p className="text-slate-600">
                  Each flag below comes directly from the server without browser calculation: <strong>Status vs. Ledger Disagreement</strong> (status does not match recorded payments or ledger entries), <strong>Spend Above Funded</strong> (spent exceeds net funded amount), <strong>Negative Remaining</strong> (remaining balance is below zero), <strong>Ended With Click Balance</strong> (status is ended while remaining balance can still cover a click without a charge reversal), <strong>Info: Ended Balance After Charge Reversal</strong> (informational: an ended advertisement received a click-charge reversal that restored remaining balance to at least one click, while staying ended), <strong>Simulated Test Funding (`has_simulated_funding`)</strong> (This ad was funded by a test payment, not real money), <strong>Running Below Click Amount</strong> (running ad has remaining balance below its snapshotted click amount), <strong>Billed Click Without Charge</strong> (a billed click lacks a matching click-charge entry), <strong>Charge Without Billed Click</strong> (a click-charge entry lacks a billed click), <strong>Duplicate Click Token</strong> (duplicate click token recorded), <strong>Running Ineligible Entity</strong> (running ad whose seller or product is no longer eligible), and <strong>Refund Status Disagreement</strong> (a payment refund exists on an ad that is neither cancelled nor ended).
                </p>
              </div>

              {/* Per-Ad Reconciliation Table */}
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      Per-Advertisement Ledger Reconciliation
                    </h3>
                    <p className="text-xs text-slate-500">
                      Compares each advertisement&apos;s status against derived immutable ledger totals (including real vs simulated funding).
                    </p>
                  </div>
                  <div data-testid="recon-overall-status">
                    {hasAnyReconciliationDisagreement ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-100 text-red-800 border border-red-300 text-xs font-bold">
                        <AlertCircle className="w-3.5 h-3.5" />
                        Status / Ledger Mismatch Detected
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        All Advertisements Reconciled
                      </span>
                    )}
                  </div>
                </div>

                {reconciliation.advertisements.length === 0 ? (
                  <div
                    className="p-8 text-center text-sm text-slate-500"
                    data-testid="admin-recon-empty"
                  >
                    No advertisements to reconcile for the current filters.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                          <th className="py-3 px-4">Ad ID</th>
                          <th className="py-3 px-4">Seller</th>
                          <th className="py-3 px-4">Status</th>
                          <th className="py-3 px-4">Funded</th>
                          <th className="py-3 px-4">Funded (Real)</th>
                          <th className="py-3 px-4">Funded (Simulated)</th>
                          <th className="py-3 px-4">Spent</th>
                          <th className="py-3 px-4">Remaining</th>
                          <th className="py-3 px-4">Mismatch &amp; Diagnostic Flags</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                        {reconciliation.advertisements.map((row) => {
                          const hasStatusMismatch = Boolean(
                            row.has_status_ledger_disagreement
                          );
                          const hasSpendAboveFunded = Boolean(
                            row.has_spend_above_funded
                          );
                          const hasNegativeRemaining = Boolean(
                            row.has_negative_remaining
                          );
                          const hasEndedClickBalance = Boolean(
                            row.has_ended_click_balance
                          );
                          const infoEndedBalanceAfterChargeReversal = Boolean(
                            row.info_ended_balance_after_charge_reversal
                          );
                          const hasRunningBelowClickAmount = Boolean(
                            row.has_running_below_click_amount
                          );
                          const hasBilledClickWithoutCharge = Boolean(
                            row.has_billed_click_without_charge
                          );
                          const hasChargeWithoutBilledClick = Boolean(
                            row.has_charge_without_billed_click
                          );
                          const hasDuplicateClickToken = Boolean(
                            row.has_duplicate_click_token
                          );
                          const hasRunningIneligibleEntity = Boolean(
                            row.has_running_ineligible_entity
                          );
                          const hasRefundStatusDisagreement = Boolean(
                            row.has_refund_status_disagreement
                          );
                          const hasSimulatedFunding = Boolean(
                            row.has_simulated_funding
                          );
                          const hasAnyFlag = hasAnyReconciliationRowFlag(row);
                          return (
                            <tr
                              key={row.advertisement_id}
                              data-testid={`recon-row-${row.advertisement_id}`}
                              className={
                                hasAnyFlag
                                  ? 'bg-red-50/60'
                                  : 'hover:bg-slate-50/80'
                              }
                            >
                              <td className="py-3 px-4 font-semibold text-slate-900">
                                #{row.advertisement_id}
                              </td>
                              <td className="py-3 px-4">
                                Seller #{row.seller_id}
                              </td>
                              <td className="py-3 px-4">
                                <span
                                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${getAdStatusBadgeClass(
                                    row.status
                                  )}`}
                                >
                                  {AD_STATUS_LABELS[row.status] || row.status}
                                </span>
                              </td>
                              <td
                                className="py-3 px-4 font-mono"
                                data-testid={`recon-funded-${row.advertisement_id}`}
                              >
                                INR {String(row.funded)}
                              </td>
                              <td
                                className="py-3 px-4 font-mono text-emerald-700"
                                data-testid={`recon-funded-real-${row.advertisement_id}`}
                              >
                                INR {String(row.funded_real ?? row.funded ?? '0.00')}
                              </td>
                              <td
                                className="py-3 px-4 font-mono text-blue-700"
                                data-testid={`recon-funded-simulated-${row.advertisement_id}`}
                              >
                                INR {String(row.funded_simulated ?? '0.00')}
                              </td>
                              <td
                                className="py-3 px-4 font-mono"
                                data-testid={`recon-spent-${row.advertisement_id}`}
                              >
                                INR {String(row.spent)}
                              </td>
                              <td
                                className="py-3 px-4 font-mono"
                                data-testid={`recon-remaining-${row.advertisement_id}`}
                              >
                                INR {String(row.remaining)}
                              </td>
                              <td className="py-3 px-4">
                                <div className="flex flex-wrap items-center gap-1.5">
                                  <span
                                    data-testid={`recon-mismatch-flag-${row.advertisement_id}`}
                                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                                      hasStatusMismatch
                                        ? 'bg-red-100 text-red-800 border border-red-300'
                                        : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    }`}
                                  >
                                    {hasStatusMismatch
                                      ? 'Mismatch: Status vs Ledger Disagreement'
                                      : 'No Mismatch (Consistent)'}
                                  </span>

                                  {hasSimulatedFunding && (
                                    <span
                                      data-testid={`recon-flag-simulated-funding-${row.advertisement_id}`}
                                      title="This ad was funded by a test payment, not real money"
                                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-50 text-blue-800 border border-blue-200 text-[11px] font-semibold"
                                    >
                                      <Info className="w-3 h-3 text-blue-600" />
                                      This ad was funded by a test payment, not real money
                                    </span>
                                  )}

                                  {hasSpendAboveFunded && (
                                    <span
                                      data-testid={`recon-flag-spend-above-funded-${row.advertisement_id}`}
                                      className="inline-flex items-center px-2.5 py-1 rounded-full bg-red-100 text-red-800 border border-red-300 text-[11px] font-bold"
                                    >
                                      Spend Above Funded
                                    </span>
                                  )}

                                  {hasNegativeRemaining && (
                                    <span
                                      data-testid={`recon-flag-negative-remaining-${row.advertisement_id}`}
                                      className="inline-flex items-center px-2.5 py-1 rounded-full bg-red-100 text-red-800 border border-red-300 text-[11px] font-bold"
                                    >
                                      Negative Remaining Balance
                                    </span>
                                  )}

                                  {hasEndedClickBalance && (
                                    <span
                                      data-testid={`recon-flag-ended-click-balance-${row.advertisement_id}`}
                                      className="inline-flex items-center px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-300 text-[11px] font-bold"
                                    >
                                      Ended With Remaining Click Balance
                                    </span>
                                  )}

                                  {infoEndedBalanceAfterChargeReversal && (
                                    <span
                                      data-testid={`recon-info-ended-balance-after-reversal-${row.advertisement_id}`}
                                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-50 text-blue-800 border border-blue-200 text-[11px] font-semibold"
                                    >
                                      <Info className="w-3 h-3 text-blue-600" />
                                      Info: Ended Balance After Charge Reversal
                                    </span>
                                  )}

                                  {hasRunningBelowClickAmount && (
                                    <span
                                      data-testid={`recon-flag-running-below-click-amount-${row.advertisement_id}`}
                                      className="inline-flex items-center px-2.5 py-1 rounded-full bg-red-100 text-red-800 border border-red-300 text-[11px] font-bold"
                                    >
                                      Running Below Click Amount
                                    </span>
                                  )}

                                  {hasBilledClickWithoutCharge && (
                                    <span
                                      data-testid={`recon-flag-billed-click-without-charge-${row.advertisement_id}`}
                                      className="inline-flex items-center px-2.5 py-1 rounded-full bg-red-100 text-red-800 border border-red-300 text-[11px] font-bold"
                                    >
                                      Billed Click Without Charge
                                    </span>
                                  )}

                                  {hasChargeWithoutBilledClick && (
                                    <span
                                      data-testid={`recon-flag-charge-without-billed-click-${row.advertisement_id}`}
                                      className="inline-flex items-center px-2.5 py-1 rounded-full bg-red-100 text-red-800 border border-red-300 text-[11px] font-bold"
                                    >
                                      Charge Without Billed Click
                                    </span>
                                  )}

                                  {hasDuplicateClickToken && (
                                    <span
                                      data-testid={`recon-flag-duplicate-click-token-${row.advertisement_id}`}
                                      className="inline-flex items-center px-2.5 py-1 rounded-full bg-red-100 text-red-800 border border-red-300 text-[11px] font-bold"
                                    >
                                      Duplicate Click Token
                                    </span>
                                  )}

                                  {hasRunningIneligibleEntity && (
                                    <span
                                      data-testid={`recon-flag-running-ineligible-entity-${row.advertisement_id}`}
                                      className="inline-flex items-center px-2.5 py-1 rounded-full bg-red-100 text-red-800 border border-red-300 text-[11px] font-bold"
                                    >
                                      Running Ineligible Entity
                                    </span>
                                  )}

                                  {hasRefundStatusDisagreement && (
                                    <span
                                      data-testid={`recon-flag-refund-status-${row.advertisement_id}`}
                                      className="inline-flex items-center px-2.5 py-1 rounded-full bg-red-100 text-red-800 border border-red-300 text-[11px] font-bold"
                                    >
                                      Refund Status Disagreement
                                    </span>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {/* NATIVE DIALOG 1: MANUAL CREDIT (SUPERUSER) */}
      <dialog
        ref={manualCreditDialogRef}
        data-testid="manual-credit-dialog"
        aria-labelledby="manual-credit-dialog-title"
        className="rounded-2xl border border-slate-200 bg-white p-0 shadow-2xl max-w-lg w-full backdrop:bg-slate-900/50"
      >
        <form onSubmit={handleManualCreditSubmit} className="p-6 space-y-4">
          <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <h3
                id="manual-credit-dialog-title"
                className="text-base font-bold text-slate-900"
              >
                Record Manual Credit
              </h3>
              {creditTargetAd && (
                <p className="text-xs text-slate-500 mt-0.5">
                  Advertisement #{creditTargetAd.id}: {creditTargetAd.name}{' '}
                  (Intended: INR {creditTargetAd.intended_amount})
                </p>
              )}
            </div>
          </div>

          {!isSuperuser && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
              Non-superuser account detected. Submitting will be checked and refused by the server with HTTP 403.
            </div>
          )}

          {creditDialogError && (
            <div
              data-testid="manual-credit-dialog-error"
              role="alert"
              className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-800 font-medium"
            >
              {creditDialogError}
            </div>
          )}

          <div>
            <label
              htmlFor="manual-credit-amount"
              className="block text-xs font-semibold text-slate-700 mb-1"
            >
              Payment Amount
            </label>
            <div className="flex items-center gap-2">
              <span className="px-3 py-2 rounded-lg bg-slate-100 border border-slate-300 text-xs font-bold text-slate-700">
                INR
              </span>
              <input
                id="manual-credit-amount"
                data-testid="manual-credit-amount-input"
                type="text"
                inputMode="decimal"
                value={creditAmount}
                onChange={(e) => setCreditAmount(e.target.value)}
                placeholder="e.g. 500.00"
                required
                className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 font-mono"
              />
            </div>
            {creditFieldErrors.amount && (
              <p
                data-testid="manual-credit-error-amount"
                className="mt-1 text-xs text-red-600 font-medium"
              >
                {creditFieldErrors.amount}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="manual-credit-reference"
              className="block text-xs font-semibold text-slate-700 mb-1"
            >
              External Reference
            </label>
            <input
              id="manual-credit-reference"
              data-testid="manual-credit-reference-input"
              type="text"
              value={creditExternalRef}
              onChange={(e) => setCreditExternalRef(e.target.value)}
              placeholder="e.g. NEFT-UTR-2026-001"
              required
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 font-mono"
            />
            {creditFieldErrors.external_reference && (
              <p
                data-testid="manual-credit-error-external_reference"
                className="mt-1 text-xs text-red-600 font-medium"
              >
                {creditFieldErrors.external_reference}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="manual-credit-date"
              className="block text-xs font-semibold text-slate-700 mb-1"
            >
              Received Date
            </label>
            <input
              id="manual-credit-date"
              data-testid="manual-credit-date-input"
              type="date"
              value={creditReceivedDate}
              onChange={(e) => setCreditReceivedDate(e.target.value)}
              required
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900"
            />
            {creditFieldErrors.received_date && (
              <p
                data-testid="manual-credit-error-received_date"
                className="mt-1 text-xs text-red-600 font-medium"
              >
                {creditFieldErrors.received_date}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="manual-credit-reason"
              className="block text-xs font-semibold text-slate-700 mb-1"
            >
              Reason / Audit Note
            </label>
            <textarea
              id="manual-credit-reason"
              data-testid="manual-credit-reason-input"
              rows={2}
              value={creditReason}
              onChange={(e) => setCreditReason(e.target.value)}
              placeholder="Reason for manual credit"
              required
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900"
            />
            {creditFieldErrors.reason && (
              <p
                data-testid="manual-credit-error-reason"
                className="mt-1 text-xs text-red-600 font-medium"
              >
                {creditFieldErrors.reason}
              </p>
            )}
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={closeManualCreditModal}
              data-testid="manual-credit-cancel-btn"
              className="px-4 py-2 rounded-xl border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={creditSubmitting}
              data-testid="manual-credit-submit-btn"
              className="px-4 py-2 rounded-xl bg-amber-600 text-white hover:bg-amber-700 disabled:opacity-50 text-xs font-semibold"
            >
              {creditSubmitting ? 'Recording...' : 'Confirm Manual Credit'}
            </button>
          </div>
        </form>
      </dialog>

      {/* NATIVE DIALOG 2: REVERSE PAYMENT (SUPERUSER) */}
      <dialog
        ref={reversePaymentDialogRef}
        data-testid="reverse-payment-dialog"
        aria-labelledby="reverse-payment-dialog-title"
        className="rounded-2xl border border-slate-200 bg-white p-0 shadow-2xl max-w-lg w-full backdrop:bg-slate-900/50"
      >
        <form onSubmit={handleReversePaymentSubmit} className="p-6 space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h3
              id="reverse-payment-dialog-title"
              className="text-base font-bold text-slate-900"
            >
              Reverse Advertising Payment
            </h3>
            {reverseTargetPayment && (
              <p className="text-xs text-slate-500 mt-0.5">
                Payment #{reverseTargetPayment.id} (Ad #
                {reverseTargetPayment.advertisement_id} •{' '}
                {reverseTargetPayment.currency || 'INR'}{' '}
                {reverseTargetPayment.amount} • Ref:{' '}
                {reverseTargetPayment.external_reference})
              </p>
            )}
          </div>

          {!isSuperuser && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
              Non-superuser account detected. Submitting will be checked and refused by the server with HTTP 403.
            </div>
          )}

          {reverseDialogError && (
            <div
              data-testid="reverse-payment-dialog-error"
              role="alert"
              className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-800 font-medium"
            >
              {reverseDialogError}
            </div>
          )}

          <div>
            <label
              htmlFor="reverse-payment-reason"
              className="block text-xs font-semibold text-slate-700 mb-1"
            >
              Reason for Reversal
            </label>
            <textarea
              id="reverse-payment-reason"
              data-testid="reverse-payment-reason-input"
              rows={2}
              value={reverseReason}
              onChange={(e) => setReverseReason(e.target.value)}
              placeholder="Explain why this recorded payment is being reversed"
              required
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900"
            />
            {reverseFieldErrors.reason && (
              <p
                data-testid="reverse-payment-error-reason"
                className="mt-1 text-xs text-red-600 font-medium"
              >
                {reverseFieldErrors.reason}
              </p>
            )}
          </div>

          <fieldset className="space-y-2">
            <legend className="block text-xs font-semibold text-slate-700 mb-1">
              Reversal Outcome
            </legend>

            <label className="flex items-start gap-2.5 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
              <input
                type="radio"
                name="reversal_outcome"
                value="error_correction"
                data-testid="reverse-outcome-error_correction"
                checked={reverseOutcome === 'error_correction'}
                onChange={() => setReverseOutcome('error_correction')}
                className="mt-0.5"
              />
              <div className="text-xs">
                <span className="font-bold text-slate-900">
                  Error correction (`error_correction`)
                </span>
                <p className="text-slate-600 mt-0.5">
                  Reverses the payment entry and returns the advertisement to awaiting payment so a corrected credit can be recorded.
                </p>
              </div>
            </label>

            <label className="flex items-start gap-2.5 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
              <input
                type="radio"
                name="reversal_outcome"
                value="refund"
                data-testid="reverse-outcome-refund"
                checked={reverseOutcome === 'refund'}
                onChange={() => setReverseOutcome('refund')}
                className="mt-0.5"
              />
              <div className="text-xs">
                <span className="font-bold text-slate-900">
                  Refund (`refund`)
                </span>
                <p className="text-slate-600 mt-0.5">
                  Reverses the payment entry and cancels the advertisement permanently.
                </p>
              </div>
            </label>

            {reverseFieldErrors.outcome && (
              <p
                data-testid="reverse-payment-error-outcome"
                className="mt-1 text-xs text-red-600 font-medium"
              >
                {reverseFieldErrors.outcome}
              </p>
            )}
          </fieldset>

          <div>
            <label className="flex items-start gap-2.5 p-3 rounded-xl border border-amber-200 bg-amber-50/60 cursor-pointer">
              <input
                type="checkbox"
                data-testid="reverse-confirm-checkbox"
                checked={reverseConfirm}
                onChange={(e) => setReverseConfirm(e.target.checked)}
                className="mt-0.5"
              />
              <span className="text-xs font-semibold text-slate-800">
                I confirm this payment reversal (`confirm_reversal: true`) and understand an offsetting debit entry will be appended to the ledger.
              </span>
            </label>
            {reverseFieldErrors.confirm_reversal && (
              <p
                data-testid="reverse-payment-error-confirm_reversal"
                className="mt-1 text-xs text-red-600 font-medium"
              >
                {reverseFieldErrors.confirm_reversal}
              </p>
            )}
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={closeReversePaymentModal}
              data-testid="reverse-payment-cancel-btn"
              className="px-4 py-2 rounded-xl border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={reverseSubmitting}
              data-testid="reverse-payment-submit-btn"
              className="px-4 py-2 rounded-xl bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 text-xs font-semibold"
            >
              {reverseSubmitting ? 'Reversing...' : 'Confirm Payment Reversal'}
            </button>
          </div>
        </form>
      </dialog>

      {/* NATIVE DIALOG 3: REFUND UNSPENT MONEY (SUPERUSER) */}
      <dialog
        ref={refundUnspentDialogRef}
        data-testid="refund-unspent-dialog"
        aria-labelledby="refund-unspent-dialog-title"
        className="rounded-2xl border border-slate-200 bg-white p-0 shadow-2xl max-w-lg w-full backdrop:bg-slate-900/50"
      >
        <form
          onSubmit={handleRefundUnspentSubmit}
          className="p-6 space-y-4"
          noValidate
        >
          <div className="border-b border-slate-100 pb-3">
            <h3
              id="refund-unspent-dialog-title"
              className="text-base font-bold text-slate-900"
            >
              Refund Unspent Money
            </h3>
            {refundTargetAd && (
              <p className="text-xs text-slate-500 mt-0.5">
                Advertisement #{refundTargetAd.id}: {refundTargetAd.name} •
                Status:{' '}
                {AD_STATUS_LABELS[refundTargetAd.status] ||
                  refundTargetAd.status}
              </p>
            )}
          </div>

          {/* Mandatory plain help text & exact server remaining amount */}
          <div className="rounded-xl border border-indigo-200 bg-indigo-50/70 p-3.5 space-y-2 text-xs text-indigo-950">
            <p
              data-testid="refund-unspent-dialog-help-text"
              className="font-semibold"
            >
              Record that you have refunded the unspent amount to the seller by bank transfer. This records the refund; it does not send money.
            </p>
            {refundTargetAd && (
              <div className="flex items-center justify-between pt-1 border-t border-indigo-200/70">
                <span className="font-medium text-indigo-900">
                  Unspent Remaining Amount (from server):
                </span>
                <span
                  data-testid="refund-unspent-remaining-amount"
                  className="font-mono font-bold text-sm text-indigo-950"
                >
                  {refundTargetAd.currency || 'INR'}{' '}
                  {String(refundTargetAd.remaining ?? '0.00')}
                </span>
              </div>
            )}
          </div>

          {!isSuperuser && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
              Non-superuser account detected. Submitting will be checked and refused by the server with HTTP 403.
            </div>
          )}

          {refundDialogError && (
            <div
              data-testid="refund-unspent-dialog-error"
              role="alert"
              className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-800 font-medium"
            >
              {refundDialogError}
            </div>
          )}

          <div>
            <label
              htmlFor="refund-unspent-reference"
              className="block text-xs font-semibold text-slate-700 mb-1"
            >
              External Bank Transfer Reference
            </label>
            <input
              id="refund-unspent-reference"
              data-testid="refund-unspent-reference-input"
              type="text"
              value={refundExternalRef}
              onChange={(e) => {
                setRefundExternalRef(e.target.value);
                setRefundFieldErrors((fe) => ({
                  ...fe,
                  external_reference: '',
                }));
              }}
              placeholder="e.g. NEFT-REFUND-2026-001"
              required
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 font-mono"
            />
            {refundFieldErrors.external_reference && (
              <p
                data-testid="refund-unspent-error-external_reference"
                className="mt-1 text-xs text-red-600 font-medium"
              >
                {refundFieldErrors.external_reference}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="refund-unspent-date"
              className="block text-xs font-semibold text-slate-700 mb-1"
            >
              Refunded Date
            </label>
            <input
              id="refund-unspent-date"
              data-testid="refund-unspent-date-input"
              type="date"
              value={refundDate}
              onChange={(e) => {
                setRefundDate(e.target.value);
                setRefundFieldErrors((fe) => ({ ...fe, refunded_date: '' }));
              }}
              required
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900"
            />
            {refundFieldErrors.refunded_date && (
              <p
                data-testid="refund-unspent-error-refunded_date"
                className="mt-1 text-xs text-red-600 font-medium"
              >
                {refundFieldErrors.refunded_date}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="refund-unspent-reason"
              className="block text-xs font-semibold text-slate-700 mb-1"
            >
              Reason for Refund
            </label>
            <textarea
              id="refund-unspent-reason"
              data-testid="refund-unspent-reason-input"
              rows={2}
              value={refundReason}
              onChange={(e) => {
                setRefundReason(e.target.value);
                setRefundFieldErrors((fe) => ({ ...fe, reason: '' }));
              }}
              placeholder="Why the unspent balance is being refunded"
              required
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900"
            />
            {refundFieldErrors.reason && (
              <p
                data-testid="refund-unspent-error-reason"
                className="mt-1 text-xs text-red-600 font-medium"
              >
                {refundFieldErrors.reason}
              </p>
            )}
          </div>

          <div>
            <label className="flex items-start gap-2.5 p-3 rounded-xl border border-amber-200 bg-amber-50/60 cursor-pointer">
              <input
                type="checkbox"
                data-testid="refund-unspent-confirm-checkbox"
                checked={refundConfirm}
                onChange={(e) => {
                  setRefundConfirm(e.target.checked);
                  setRefundFieldErrors((fe) => ({
                    ...fe,
                    confirm_refund: '',
                  }));
                }}
                className="mt-0.5"
              />
              <span className="text-xs font-semibold text-slate-800">
                I confirm that the external bank transfer refund has been sent (`confirm_refund: true`).
              </span>
            </label>
            {refundFieldErrors.confirm_refund && (
              <p
                data-testid="refund-unspent-error-confirm_refund"
                className="mt-1 text-xs text-red-600 font-medium"
              >
                {refundFieldErrors.confirm_refund}
              </p>
            )}
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={closeRefundUnspentModal}
              data-testid="refund-unspent-cancel-btn"
              className="px-4 py-2 rounded-xl border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={refundSubmitting}
              data-testid="refund-unspent-submit-btn"
              className="px-4 py-2 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 text-xs font-semibold"
            >
              {refundSubmitting ? 'Recording...' : 'Confirm Unspent Refund'}
            </button>
          </div>
        </form>
      </dialog>

      {/* NATIVE DIALOG 4: APPROVE / REJECT / TAKE DOWN ADVERTISEMENT (STAFF & SUPERUSER) */}
      <dialog
        ref={reviewActionDialogRef}
        data-testid="admin-review-action-dialog"
        aria-labelledby="admin-review-action-dialog-title"
        className="rounded-2xl border border-slate-200 bg-white p-0 shadow-2xl max-w-lg w-full backdrop:bg-slate-900/50"
      >
        <form
          onSubmit={handleReviewActionSubmit}
          className="p-6 space-y-4"
          noValidate
        >
          <div className="border-b border-slate-100 pb-3">
            <h3
              id="admin-review-action-dialog-title"
              className="text-base font-bold text-slate-900"
            >
              {reviewActionTarget?.action === 'approve'
                ? 'Approve Advertisement'
                : reviewActionTarget?.action === 'reject'
                ? 'Reject Creative'
                : 'Take Down Advertisement'}
            </h3>
            {reviewActionTarget?.ad && (
              <p className="text-xs text-slate-500 mt-0.5">
                Advertisement #{reviewActionTarget.ad.id}:{' '}
                {reviewActionTarget.ad.name} •{' '}
                {formatProductLabel(reviewActionTarget.ad)} • Funded:{' '}
                {reviewActionTarget.ad.currency || 'INR'}{' '}
                {reviewActionTarget.ad.funded}
              </p>
            )}
          </div>

          {reviewActionDialogError && (
            <div
              data-testid="admin-review-dialog-error"
              role="alert"
              className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-800 font-medium"
            >
              {reviewActionDialogError}
            </div>
          )}

          <div>
            <label
              htmlFor="admin-review-action-reason"
              className="block text-xs font-semibold text-slate-700 mb-1"
            >
              Reason{' '}
              <span aria-hidden="true" className="text-red-600">
                *
              </span>
            </label>
            <textarea
              id="admin-review-action-reason"
              data-testid="admin-review-reason-input"
              rows={3}
              value={reviewActionReason}
              onChange={(e) => {
                setReviewActionReason(e.target.value);
                setReviewActionFieldErrors((fe) => ({ ...fe, reason: '' }));
              }}
              placeholder={
                reviewActionTarget?.action === 'approve'
                  ? 'Reason for approving this advertisement creative'
                  : reviewActionTarget?.action === 'reject'
                  ? 'Reason for rejecting this creative (shown to the seller)'
                  : 'Reason for taking down this approved advertisement'
              }
              required
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900"
            />
            {reviewActionFieldErrors.reason && (
              <p
                data-testid="admin-review-error-reason"
                className="mt-1 text-xs text-red-600 font-medium"
              >
                {reviewActionFieldErrors.reason}
              </p>
            )}
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={closeReviewActionModal}
              data-testid="admin-review-cancel-btn"
              className="px-4 py-2 rounded-xl border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={reviewActionSubmitting}
              data-testid="admin-review-submit-btn"
              className={`px-4 py-2 rounded-xl text-white disabled:opacity-50 text-xs font-semibold ${
                reviewActionTarget?.action === 'approve'
                  ? 'bg-emerald-600 hover:bg-emerald-700'
                  : 'bg-red-600 hover:bg-red-700'
              }`}
            >
              {reviewActionSubmitting
                ? 'Submitting...'
                : reviewActionTarget?.action === 'approve'
                ? 'Confirm Approval'
                : reviewActionTarget?.action === 'reject'
                ? 'Confirm Rejection'
                : 'Confirm Take Down'}
            </button>
          </div>
        </form>
      </dialog>

      {/* NATIVE DIALOG 5: REVERSE CLICK CHARGE (SUPERUSER) */}
      <dialog
        ref={reverseClickChargeDialogRef}
        data-testid="reverse-click-charge-dialog"
        aria-labelledby="reverse-click-charge-dialog-title"
        className="rounded-2xl border border-slate-200 bg-white p-0 shadow-2xl max-w-lg w-full backdrop:bg-slate-900/50"
      >
        <form
          onSubmit={handleReverseClickChargeSubmit}
          className="p-6 space-y-4"
          noValidate
        >
          <div className="border-b border-slate-100 pb-3">
            <h3
              id="reverse-click-charge-dialog-title"
              className="text-base font-bold text-slate-900"
            >
              Reverse Click Charge
            </h3>
            {reverseClickTarget && (
              <p className="text-xs text-slate-500 mt-0.5">
                Click #{reverseClickTarget.id} • Ad #
                {reverseClickTarget.advertisement_id} • Snapshotted Charge: INR{' '}
                {reverseClickTarget.click_amount_snapshot}
              </p>
            )}
          </div>

          <div className="rounded-xl border border-blue-200 bg-blue-50/70 p-3.5 text-xs text-blue-950">
            <p
              data-testid="reverse-click-charge-help-text"
              className="font-semibold"
            >
              This adds a compensating entry that gives the click amount back to the advertisement&apos;s remaining budget. The original click and charge are kept. An ended advertisement stays ended.
            </p>
          </div>

          {!isSuperuser && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
              Non-superuser account detected. Submitting will be checked and refused by the server with HTTP 403.
            </div>
          )}

          {reverseClickDialogError && (
            <div
              data-testid="reverse-click-charge-dialog-error"
              role="alert"
              className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-800 font-medium"
            >
              {reverseClickDialogError}
            </div>
          )}

          <div>
            <label
              htmlFor="reverse-click-charge-reason"
              className="block text-xs font-semibold text-slate-700 mb-1"
            >
              Reason for Reversal
            </label>
            <textarea
              id="reverse-click-charge-reason"
              data-testid="reverse-click-charge-reason-input"
              rows={2}
              value={reverseClickReason}
              onChange={(e) => {
                setReverseClickReason(e.target.value);
                setReverseClickFieldErrors((fe) => ({ ...fe, reason: '' }));
              }}
              placeholder="Reason for reversing this billed click charge"
              required
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900"
            />
            {reverseClickFieldErrors.reason && (
              <p
                data-testid="reverse-click-charge-error-reason"
                className="mt-1 text-xs text-red-600 font-medium"
              >
                {reverseClickFieldErrors.reason}
              </p>
            )}
          </div>

          <div>
            <label className="flex items-start gap-2.5 p-3 rounded-xl border border-amber-200 bg-amber-50/60 cursor-pointer">
              <input
                type="checkbox"
                data-testid="reverse-click-charge-confirm-checkbox"
                checked={reverseClickConfirm}
                onChange={(e) => {
                  setReverseClickConfirm(e.target.checked);
                  setReverseClickFieldErrors((fe) => ({
                    ...fe,
                    confirm_reversal: '',
                  }));
                }}
                className="mt-0.5"
              />
              <span className="text-xs font-semibold text-slate-800">
                I confirm this click-charge reversal (`confirm_reversal: true`).
              </span>
            </label>
            {reverseClickFieldErrors.confirm_reversal && (
              <p
                data-testid="reverse-click-charge-error-confirm_reversal"
                className="mt-1 text-xs text-red-600 font-medium"
              >
                {reverseClickFieldErrors.confirm_reversal}
              </p>
            )}
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={closeReverseClickChargeModal}
              data-testid="reverse-click-charge-cancel-btn"
              className="px-4 py-2 rounded-xl border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={reverseClickSubmitting}
              data-testid="reverse-click-charge-submit-btn"
              className="px-4 py-2 rounded-xl bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 text-xs font-semibold"
            >
              {reverseClickSubmitting
                ? 'Reversing...'
                : 'Confirm Click Charge Reversal'}
            </button>
          </div>
        </form>
      </dialog>
    </div>
  );
}
