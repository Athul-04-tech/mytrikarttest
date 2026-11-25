import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  Sparkles,
  Plus,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Eye,
  ArrowLeft,
  XCircle,
  Send,
  Receipt,
  BookOpen,
  ShieldAlert,
  Info,
  X,
  Upload,
  Image as ImageIcon,
  Clock,
  Ban,
} from 'lucide-react';
import { apiRequest } from '../../../utils/api';
import {
  AD_STATUSES,
  AD_STATUS_LABELS,
  AD_TYPES,
  AD_TYPE_LABELS,
  formatAdTypeLabel,
  AD_PLACEMENTS,
  AD_PLACEMENT_LABELS,
  AD_CREATIVE_MODERATION_LABELS,
  AD_PAYMENT_STATUS_LABELS,
  AD_LEDGER_ENTRY_TYPE_LABELS,
  formatAdLedgerEntryTypeLabel,
  formatAdEndReasonLabel,
  isPositiveMoneyString,
  getSellerAdNextAction,
  getAdStatusBadgeClass,
  getAdPaymentStatusBadgeClass,
  getAdLedgerBadgeClass,
  formatAdDateTime,
  formatAdPlacementLabel,
  isAdCreativeRejected,
  getAdRejectionReason,
  useAuthenticatedImageUrl,
  parseAdvertisingApiError,
} from '../../../utils/advertisingUtils';

const CREATE_AD_FIELDS = ['product_id', 'name', 'ad_type', 'placement'];
const CREATIVE_UPLOAD_FIELDS = ['image', 'placement', 'reason'];

export default function SellerAdvertisingView({ vendorProfile }) {
  // 'ads' | 'create' | 'detail' | 'payments' | 'ledger'
  const [activeTab, setActiveTab] = useState('ads');

  // Data state
  const [ads, setAds] = useState([]);
  const [payments, setPayments] = useState([]);
  const [ledgerEntries, setLedgerEntries] = useState([]);
  const [sellerProducts, setSellerProducts] = useState([]);
  const [pricing, setPricing] = useState({
    as_of_date: '',
    placements: {},
  });
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  // Server restriction reason when seller cannot sell (may_sell === false or 403 from server)
  const [serverRestrictionReason, setServerRestrictionReason] = useState('');

  // Feedback & Notice banners
  const [feedbackBanner, setFeedbackBanner] = useState('');
  const [paymentRequestedNotice, setPaymentRequestedNotice] = useState(false);

  // Selected ad detail state
  const [selectedAdId, setSelectedAdId] = useState(null);
  const [selectedAd, setSelectedAd] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState('');

  // Guided Create ad form state (Step 1: Type, Step 2: Placement & Product; NO amount input anywhere)
  const [createAdType, setCreateAdType] = useState('picture');
  const [createPlacement, setCreatePlacement] = useState('header_banner');
  const [createProductId, setCreateProductId] = useState('');
  const [createName, setCreateName] = useState('');
  const [createFieldErrors, setCreateFieldErrors] = useState({});
  const [createGeneralError, setCreateGeneralError] = useState('');
  const [createSubmitting, setCreateSubmitting] = useState(false);

  // Simulated test payment state (Step 4)
  const [simulatedPaymentSubmitting, setSimulatedPaymentSubmitting] =
    useState(false);
  const [simulatedPaymentError, setSimulatedPaymentError] = useState('');

  // Creative upload form state (Phase 2)
  const [creativePlacement, setCreativePlacement] = useState('header_banner');
  const [creativeFile, setCreativeFile] = useState(null);
  const [creativeFilePreviewUrl, setCreativeFilePreviewUrl] = useState('');
  const [creativeReason, setCreativeReason] = useState('');
  const [creativeFieldErrors, setCreativeFieldErrors] = useState({});
  const [creativeGeneralError, setCreativeGeneralError] = useState('');
  const [creativeUploading, setCreativeUploading] = useState(false);
  const fileInputRef = useRef(null);

  // Action Confirm Dialog state: { action: 'request-payment' | 'cancel' | 'submit-review', ad: obj }
  const [actionDialog, setActionDialog] = useState(null);
  const [dialogReason, setDialogReason] = useState('');
  const [actionError, setActionError] = useState('');
  const [actionSubmitting, setActionSubmitting] = useState(false);
  const dialogRef = useRef(null);

  useEffect(() => {
    const el = dialogRef.current;
    if (!el) return;
    if (actionDialog) {
      if (typeof el.showModal === 'function') {
        if (!el.open) {
          try {
            el.showModal();
          } catch {
            el.setAttribute('open', '');
          }
        }
      } else {
        el.setAttribute('open', '');
      }
    } else if (el.open) {
      if (typeof el.close === 'function') {
        try {
          el.close();
        } catch {
          el.removeAttribute('open');
        }
      } else {
        el.removeAttribute('open');
      }
    }
  }, [actionDialog]);

  // Manage local file preview URL lifecycle and revoke on change/unmount
  useEffect(() => {
    if (!creativeFile) {
      setCreativeFilePreviewUrl('');
      return undefined;
    }
    let objectUrl = '';
    if (typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function') {
      try {
        objectUrl = URL.createObjectURL(creativeFile);
        setCreativeFilePreviewUrl(objectUrl);
      } catch {
        setCreativeFilePreviewUrl('');
      }
    }
    return () => {
      if (
        objectUrl &&
        typeof URL !== 'undefined' &&
        typeof URL.revokeObjectURL === 'function'
      ) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [creativeFile]);

  // Authenticated blob URL for the stored active creative image
  const storedCreativeImageUrl = selectedAd?.active_creative?.image_url || '';
  const {
    blobUrl: storedCreativeBlobUrl,
    loading: storedCreativeImgLoading,
    error: storedCreativeImgError,
  } = useAuthenticatedImageUrl(storedCreativeImageUrl);

  const cannotSell =
    vendorProfile?.may_sell === false || Boolean(serverRestrictionReason);

  const restrictionMessage =
    serverRestrictionReason ||
    vendorProfile?.control_reason ||
    (vendorProfile?.onboarding_status &&
    vendorProfile.onboarding_status !== 'approved' &&
    vendorProfile.onboarding_status !== 'store_published'
      ? `Seller must be approved and allowed to sell (current status: ${vendorProfile.onboarding_status}).`
      : 'Seller must be approved and allowed to sell.');

  const loadAll = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const [adsData, paymentsData, ledgerData, productsData, pricingData] =
        await Promise.all([
          apiRequest('/api/advertising/ads/'),
          apiRequest('/api/advertising/payments/'),
          apiRequest('/api/advertising/ledger/'),
          apiRequest('/api/products/vendor/products/').catch(() => []),
          apiRequest('/api/advertising/pricing/').catch(() => ({
            as_of_date: '',
            placements: {},
          })),
        ]);

      setAds(Array.isArray(adsData) ? adsData : adsData?.results || []);
      setPayments(
        Array.isArray(paymentsData)
          ? paymentsData
          : paymentsData?.results || []
      );
      setLedgerEntries(
        Array.isArray(ledgerData) ? ledgerData : ledgerData?.results || []
      );
      const rawProducts = Array.isArray(productsData)
        ? productsData
        : productsData?.results || [];
      setSellerProducts(rawProducts);
      setPricing(
        pricingData && typeof pricingData === 'object'
          ? {
              as_of_date: pricingData.as_of_date || '',
              placements: pricingData.placements || {},
            }
          : { as_of_date: '', placements: {} }
      );
    } catch (err) {
      if (err?.status === 403) {
        setServerRestrictionReason(
          err?.data?.detail || 'Seller must be approved and allowed to sell.'
        );
      }
      setLoadError(
        err?.data?.detail ||
          err?.message ||
          'Failed to load advertising records from the server.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchAdDetail = useCallback(async (adId) => {
    if (!adId) return null;
    setDetailLoading(true);
    setDetailError('');
    try {
      const data = await apiRequest(`/api/advertising/ads/${adId}/`);
      setSelectedAd(data);
      if (data?.active_creative?.placement || data?.placement) {
        setCreativePlacement(data.active_creative?.placement || data.placement);
      }
      setAds((prev) => prev.map((a) => (a.id === data.id ? data : a)));
      return data;
    } catch (err) {
      setSelectedAd(null);
      setDetailError(
        err?.data?.detail ||
          err?.message ||
          `Failed to load advertisement #${adId}.`
      );
      return null;
    } finally {
      setDetailLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  // Published active INR products owned by this seller
  const publishedProducts = useMemo(() => {
    return sellerProducts.filter(
      (p) =>
        (p.status === 'published' || p.status === 'PUBLISHED') &&
        p.is_active !== false &&
        (!p.base_currency || p.base_currency === 'INR')
    );
  }, [sellerProducts]);

  useEffect(() => {
    if (
      activeTab === 'create' &&
      !createProductId &&
      publishedProducts.length > 0
    ) {
      setCreateProductId(String(publishedProducts[0].id));
    }
  }, [activeTab, createProductId, publishedProducts]);

  const productMap = useMemo(() => {
    const map = {};
    sellerProducts.forEach((p) => {
      map[p.id] = p;
    });
    return map;
  }, [sellerProducts]);

  const formatProductLabel = (adOrProductId) => {
    if (adOrProductId && typeof adOrProductId === 'object') {
      if (adOrProductId.product_name) {
        return `${adOrProductId.product_name} (#${adOrProductId.product_id})`;
      }
      const prod = productMap[adOrProductId.product_id];
      if (prod) {
        return `${prod.name} (#${prod.id})`;
      }
      return `Product #${adOrProductId.product_id}`;
    }
    const prod = productMap[adOrProductId];
    if (prod) {
      return `${prod.name} (#${prod.id})`;
    }
    return `Product #${adOrProductId}`;
  };

  const resetCreativeForm = (defaultPlacement = 'header_banner') => {
    setCreativePlacement(defaultPlacement);
    setCreativeFile(null);
    setCreativeReason('');
    setCreativeFieldErrors({});
    setCreativeGeneralError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const openAdDetail = async (adOrId) => {
    const adId = typeof adOrId === 'object' ? adOrId.id : adOrId;
    setSelectedAdId(adId);
    if (typeof adOrId === 'object' && adOrId !== null) {
      setSelectedAd(adOrId);
      resetCreativeForm(
        adOrId.active_creative?.placement || adOrId.placement || 'header_banner'
      );
    } else {
      resetCreativeForm('header_banner');
    }
    setPaymentRequestedNotice(false);
    setActiveTab('detail');
    await fetchAdDetail(adId);
  };

  const openCreateForm = () => {
    setFeedbackBanner('');
    setPaymentRequestedNotice(false);
    setCreateFieldErrors({});
    setCreateGeneralError('');
    setCreateAdType('picture');
    setCreatePlacement('header_banner');
    setCreateProductId(
      publishedProducts[0]?.id ? String(publishedProducts[0].id) : ''
    );
    setCreateName('');
    setActiveTab('create');
  };

  const handleCreateAdSubmit = async (e) => {
    e.preventDefault();
    setCreateFieldErrors({});
    setCreateGeneralError('');
    setFeedbackBanner('');

    setCreateSubmitting(true);
    try {
      const payload = {
        product_id:
          String(createProductId).trim() !== ''
            ? Number(createProductId)
            : createProductId,
        name: createName,
        ad_type: createAdType,
        placement: createPlacement,
      };

      const created = await apiRequest('/api/advertising/ads/', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      await loadAll();
      setSelectedAdId(created.id);
      setSelectedAd(created);
      resetCreativeForm(created.placement || createPlacement || 'header_banner');
      setPaymentRequestedNotice(false);
      setSimulatedPaymentError('');
      setActiveTab('detail');
      setFeedbackBanner(
        `Advertisement "${created.name}" (#${created.id}) created. Next step: Add your picture.`
      );
    } catch (err) {
      if (err?.status === 403) {
        const msg =
          err?.data?.detail || 'Seller must be approved and allowed to sell.';
        setServerRestrictionReason(msg);
      }
      const parsed = parseAdvertisingApiError(err, CREATE_AD_FIELDS);
      setCreateFieldErrors(parsed.fieldErrors);
      setCreateGeneralError(parsed.generalError);
    } finally {
      setCreateSubmitting(false);
    }
  };

  const handleSimulatedPaymentSubmit = async () => {
    if (!selectedAd) return;
    setSimulatedPaymentError('');
    setFeedbackBanner('');
    setSimulatedPaymentSubmitting(true);
    try {
      await apiRequest(
        `/api/advertising/ads/${selectedAd.id}/simulated-payment/`,
        {
          method: 'POST',
          body: JSON.stringify({}),
        }
      );

      await fetchAdDetail(selectedAd.id);
      await loadAll();
      setPaymentRequestedNotice(false);
      setFeedbackBanner(
        `Test payment recorded for Advertisement #${selectedAd.id}. You can now submit it for review.`
      );
    } catch (err) {
      if (err?.status === 403) {
        const msg =
          err?.data?.detail ||
          'Seller must be approved and allowed to sell to change advertisements.';
        setServerRestrictionReason(msg);
      }
      const parsed = parseAdvertisingApiError(err);
      setSimulatedPaymentError(
        parsed.generalError || 'Failed to record test payment.'
      );
      await fetchAdDetail(selectedAd.id);
      await loadAll();
    } finally {
      setSimulatedPaymentSubmitting(false);
    }
  };

  const handleCreativeFileChange = (e) => {
    const file = e.target.files?.[0] || null;
    setCreativeFile(file);
    setCreativeFieldErrors((fe) => ({ ...fe, image: '' }));
    setCreativeGeneralError('');
  };

  const handleCreativeUploadSubmit = async (e) => {
    e.preventDefault();
    if (!selectedAd) return;

    setCreativeFieldErrors({});
    setCreativeGeneralError('');
    setFeedbackBanner('');

    if (!creativeFile) {
      setCreativeFieldErrors({
        image: 'Please choose an image file before uploading.',
      });
      return;
    }

    setCreativeUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', creativeFile);
      formData.append('placement', creativePlacement);
      if (creativeReason.trim()) {
        formData.append('reason', creativeReason.trim());
      }

      await apiRequest(`/api/advertising/ads/${selectedAd.id}/creative/`, {
        method: 'POST',
        body: formData,
      });

      setCreativeFile(null);
      setCreativeReason('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      await fetchAdDetail(selectedAd.id);
      await loadAll();
      setFeedbackBanner(
        `Creative photo uploaded for Advertisement #${selectedAd.id}. You can now submit it for review.`
      );
    } catch (err) {
      if (err?.status === 403) {
        const msg =
          err?.data?.detail ||
          'Seller must be approved and allowed to sell to upload advertisement creatives.';
        setServerRestrictionReason(msg);
      }
      const parsed = parseAdvertisingApiError(err, CREATIVE_UPLOAD_FIELDS);
      setCreativeFieldErrors(parsed.fieldErrors);
      if (!parsed.fieldErrors.image && !parsed.fieldErrors.placement) {
        setCreativeGeneralError(parsed.generalError);
      }
      if (err?.status === 409) {
        await fetchAdDetail(selectedAd.id);
        await loadAll();
      }
    } finally {
      setCreativeUploading(false);
    }
  };

  const openActionDialog = (action, ad) => {
    setFeedbackBanner('');
    setActionError('');
    setDialogReason('');
    setActionDialog({ action, ad });
  };

  const closeActionDialog = () => {
    setActionDialog(null);
    setActionError('');
    setDialogReason('');
  };

  const handleConfirmAction = async (e) => {
    e.preventDefault();
    if (!actionDialog) return;
    setActionError('');
    setActionSubmitting(true);

    const { action, ad } = actionDialog;
    try {
      let endpoint = `/api/advertising/ads/${ad.id}/cancel/`;
      if (action === 'request-payment') {
        endpoint = `/api/advertising/ads/${ad.id}/request-payment/`;
      } else if (action === 'submit-review') {
        endpoint = `/api/advertising/ads/${ad.id}/submit/`;
      }

      const body =
        (action === 'cancel' || action === 'submit-review') &&
        dialogReason.trim()
          ? { reason: dialogReason.trim() }
          : {};

      const updated = await apiRequest(endpoint, {
        method: 'POST',
        body: JSON.stringify(body),
      });

      await loadAll();
      setSelectedAdId(updated.id);
      setSelectedAd(updated);
      closeActionDialog();

      if (action === 'request-payment') {
        setPaymentRequestedNotice(true);
        setFeedbackBanner(
          'Payment is added by the platform team. Nothing has been charged.'
        );
      } else if (action === 'submit-review') {
        setPaymentRequestedNotice(false);
        setFeedbackBanner(
          `Advertisement "${updated.name}" (#${updated.id}) submitted for review.`
        );
      } else {
        setPaymentRequestedNotice(false);
        setFeedbackBanner(
          `Advertisement "${updated.name}" (#${updated.id}) cancelled.`
        );
      }
    } catch (err) {
      if (err?.status === 403) {
        const msg =
          err?.data?.detail ||
          'Seller must be approved and allowed to sell to change advertisements.';
        setServerRestrictionReason(msg);
      }
      const parsed = parseAdvertisingApiError(err, ['reason']);
      setActionError(parsed.generalError);
      await loadAll();
      if (ad?.id && activeTab === 'detail') {
        await fetchAdDetail(ad.id);
      }
    } finally {
      setActionSubmitting(false);
    }
  };

  const filteredAds = useMemo(() => {
    if (!statusFilter) return ads;
    if (statusFilter === 'rejected') {
      return ads.filter((a) => isAdCreativeRejected(a));
    }
    return ads.filter((a) => a.status === statusFilter);
  }, [ads, statusFilter]);

  const adDetailPayments = useMemo(() => {
    if (!selectedAd) return [];
    return payments.filter(
      (p) => Number(p.advertisement_id) === Number(selectedAd.id)
    );
  }, [payments, selectedAd]);

  const adDetailLedger = useMemo(() => {
    if (!selectedAd) return [];
    return ledgerEntries.filter(
      (l) => Number(l.advertisement_id) === Number(selectedAd.id)
    );
  }, [ledgerEntries, selectedAd]);

  const selectedAdRejected = isAdCreativeRejected(selectedAd);
  const selectedAdRejectionReason = getAdRejectionReason(selectedAd);
  const selectedAdPlacement =
    selectedAd?.placement ||
    selectedAd?.active_creative?.placement ||
    'header_banner';
  const selectedAdPlacementPricing =
    pricing.placements?.[selectedAdPlacement] || null;
  const anySimulatedPaymentEnabled = Object.values(
    pricing.placements || {}
  ).some((p) => Boolean(p?.simulated_payment_enabled));
  const simulatedPaymentEnabledForAd = Boolean(
    selectedAdPlacementPricing?.simulated_payment_enabled ??
      anySimulatedPaymentEnabled
  );
  const nextAction = getSellerAdNextAction(
    selectedAd,
    simulatedPaymentEnabledForAd
  );
  const canUploadOrReplaceCreative = nextAction?.key === 'add_picture';
  const canRequestPayment = nextAction?.key === 'request_payment';
  const canPayTest = nextAction?.key === 'pay_test';
  const canSubmitForReview = nextAction?.key === 'submit_review';
  const createChosenPlacementPricing =
    pricing.placements?.[createPlacement] || null;

  const dialogTestId =
    actionDialog?.action === 'cancel'
      ? 'seller-cancel-ad-dialog'
      : actionDialog?.action === 'submit-review'
      ? 'seller-submit-review-dialog'
      : 'seller-request-payment-dialog';

  return (
    <div data-testid="seller-advertising-view" className="space-y-6">
      {/* Header & Sub-Navigation */}
      <div className="p-6 rounded-3xl border border-[#EAE3DC] bg-white shadow-2xs flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#FFF3EC] text-[#1A2420] border border-[#FA661C]/30">
              Advertising Phase 2
            </span>
            <span className="text-xs text-[#6B6058] font-medium">
              Manual Platform Credit • Creative Upload &amp; Review • INR Only
            </span>
          </div>
          <h1 className="font-['Outfit'] font-extrabold text-xl sm:text-2xl text-[#1A2420]">
            Product Advertisements &amp; Creative Review
          </h1>
          <p className="text-xs text-[#6B6058]">
            Create product advertisements, request manual funding, upload a placement creative photo once funded, and submit for platform review.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            data-testid="seller-advertising-refresh-btn"
            onClick={loadAll}
            disabled={loading}
            className="px-3.5 py-2 rounded-xl border border-[#EAE3DC] bg-white hover:bg-[#FFF3EC] text-xs font-bold text-[#1A2420] inline-flex items-center space-x-1.5 cursor-pointer"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 text-[#FA661C] ${
                loading ? 'animate-spin' : ''
              }`}
            />
            <span>Refresh</span>
          </button>

          <button
            type="button"
            data-testid="seller-open-create-ad-btn"
            disabled={cannotSell}
            onClick={openCreateForm}
            className="px-4 py-2 rounded-xl bg-[#FA661C] hover:bg-[#E0530B] disabled:opacity-45 disabled:cursor-not-allowed text-white text-xs font-bold inline-flex items-center space-x-1.5 cursor-pointer shadow-2xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Advertisement</span>
          </button>
        </div>
      </div>

      {/* Seller Restriction Banner (when seller cannot sell) */}
      {cannotSell && (
        <div
          data-testid="seller-advertising-restriction-banner"
          role="alert"
          className="p-4 rounded-2xl bg-[#FFFBEB] border border-[#F59E0B] flex items-start space-x-3 text-xs text-[#92400E]"
        >
          <ShieldAlert className="w-5 h-5 text-[#D97706] shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="font-bold text-sm">
              Advertising Changes Disabled for Your Account
            </div>
            <p data-testid="seller-advertising-restriction-reason">
              {restrictionMessage}
            </p>
          </div>
        </div>
      )}

      {/* Feedback Banner */}
      {feedbackBanner && (
        <div
          data-testid="seller-advertising-feedback-banner"
          role="status"
          className="p-4 rounded-2xl bg-[#ECFDF5] border border-[#10B981]/40 flex items-center justify-between gap-3 text-xs text-[#065F46]"
        >
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-[#10B981] shrink-0" />
            <span className="font-semibold">{feedbackBanner}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedbackBanner('')}
            className="text-[#065F46] hover:text-[#047857] cursor-pointer"
            aria-label="Dismiss notification"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Load Error Banner */}
      {loadError && (
        <div
          data-testid="seller-advertising-error"
          role="alert"
          className="p-4 rounded-2xl bg-[#FFF3F3] border border-[#FCA5A5] flex items-center justify-between gap-3 text-xs text-[#991B1B]"
        >
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-[#DC2626] shrink-0" />
            <span>{loadError}</span>
          </div>
          <button
            type="button"
            onClick={loadAll}
            className="px-3 py-1.5 rounded-xl bg-[#DC2626] text-white font-bold cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* Tabs Navigation */}
      <div className="flex flex-wrap gap-2 border-b border-[#EAE3DC] pb-3">
        <button
          type="button"
          data-testid="seller-ad-tab-ads"
          onClick={() => setActiveTab('ads')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold inline-flex items-center space-x-2 cursor-pointer ${
            activeTab === 'ads' || activeTab === 'detail'
              ? 'bg-[#FA661C] text-white shadow-2xs'
              : 'bg-white text-[#6B6058] border border-[#EAE3DC] hover:text-[#1A2420]'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>My Ads ({ads.length})</span>
        </button>

        <button
          type="button"
          data-testid="seller-ad-tab-payments"
          onClick={() => setActiveTab('payments')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold inline-flex items-center space-x-2 cursor-pointer ${
            activeTab === 'payments'
              ? 'bg-[#FA661C] text-white shadow-2xs'
              : 'bg-white text-[#6B6058] border border-[#EAE3DC] hover:text-[#1A2420]'
          }`}
        >
          <Receipt className="w-4 h-4" />
          <span>Payments ({payments.length})</span>
        </button>

        <button
          type="button"
          data-testid="seller-ad-tab-ledger"
          onClick={() => setActiveTab('ledger')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold inline-flex items-center space-x-2 cursor-pointer ${
            activeTab === 'ledger'
              ? 'bg-[#FA661C] text-white shadow-2xs'
              : 'bg-white text-[#6B6058] border border-[#EAE3DC] hover:text-[#1A2420]'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Ledger ({ledgerEntries.length})</span>
        </button>
      </div>

      {/* TAB 1: MY ADS LIST */}
      {activeTab === 'ads' && (
        <section
          data-testid="seller-ads-list-panel"
          className="rounded-3xl border border-[#EAE3DC] bg-white shadow-2xs overflow-hidden"
        >
          <div className="p-5 border-b border-[#EAE3DC] flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-['Outfit'] font-extrabold text-base text-[#1A2420]">
                My Product Advertisements
              </h2>
              <p className="text-xs text-[#6B6058]">
                All money amounts are shown directly from the server ledger in INR.
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <label
                htmlFor="seller-ads-status-filter"
                className="text-xs font-bold text-[#6B6058]"
              >
                Status:
              </label>
              <select
                id="seller-ads-status-filter"
                data-testid="seller-ads-status-filter"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 rounded-xl border border-[#EAE3DC] text-xs bg-white font-semibold"
              >
                <option value="">All Statuses</option>
                {AD_STATUSES.map((st) => (
                  <option key={st.value} value={st.value}>
                    {st.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {loading ? (
            <div className="p-8 text-center text-xs text-[#6B6058]">
              Loading your advertisements...
            </div>
          ) : filteredAds.length === 0 ? (
            <div
              data-testid="seller-ads-empty"
              className="p-8 text-center text-xs text-[#6B6058]"
            >
              No advertisements found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table
                data-testid="seller-ads-table"
                className="w-full text-left border-collapse text-xs"
              >
                <caption className="sr-only">
                  Seller advertisements list
                </caption>
                <thead>
                  <tr className="bg-[#FFF3EC]/60 border-b border-[#EAE3DC] text-[#6B6058] uppercase text-[10px] font-black tracking-wider">
                    <th scope="col" className="py-3 px-4">
                      Name
                    </th>
                    <th scope="col" className="py-3 px-4">
                      Product
                    </th>
                    <th scope="col" className="py-3 px-4">
                      Status
                    </th>
                    <th scope="col" className="py-3 px-4">
                      Placement
                    </th>
                    <th scope="col" className="py-3 px-4 text-right">
                      Price
                    </th>
                    <th scope="col" className="py-3 px-4 text-right">
                      Funded
                    </th>
                    <th scope="col" className="py-3 px-4 text-right">
                      Spent
                    </th>
                    <th scope="col" className="py-3 px-4 text-right">
                      Remaining
                    </th>
                    <th scope="col" className="py-3 px-4 text-right">
                      Billed Clicks
                    </th>
                    <th scope="col" className="py-3 px-4">
                      End Reason
                    </th>
                    <th scope="col" className="py-3 px-4 text-right">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EAE3DC]">
                  {filteredAds.map((ad) => {
                    const adRejected = isAdCreativeRejected(ad);
                    return (
                      <tr
                        key={ad.id}
                        data-testid={`seller-ad-row-${ad.id}`}
                        className="hover:bg-[#FFF3EC]/20"
                      >
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-[#1A2420]">{ad.name}</div>
                          <div className="font-mono text-[11px] text-[#6B6058]">
                            Ad #{ad.id}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-[#1A2420]">
                          {formatProductLabel(ad)}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex flex-wrap items-center gap-1">
                            <span
                              data-testid={`seller-ad-status-${ad.id}`}
                              className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${getAdStatusBadgeClass(
                                ad.status
                              )}`}
                            >
                              {AD_STATUS_LABELS[ad.status] || ad.status}
                            </span>
                            {adRejected && ad.status !== 'rejected' && (
                              <span
                                data-testid={`seller-ad-creative-rejected-badge-${ad.id}`}
                                className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${getAdStatusBadgeClass(
                                  'rejected'
                                )}`}
                              >
                                Creative Rejected
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-[#1A2420] font-semibold">
                          {formatAdPlacementLabel(
                            ad.placement || ad.active_creative?.placement
                          )}
                        </td>
                        <td
                          data-testid={`seller-ad-intended-${ad.id}`}
                          className="py-3.5 px-4 text-right font-mono font-bold text-[#1A2420]"
                        >
                          {ad.currency} {ad.intended_amount}
                        </td>
                        <td
                          data-testid={`seller-ad-funded-${ad.id}`}
                          className="py-3.5 px-4 text-right font-mono font-bold text-[#059669]"
                        >
                          {ad.currency} {ad.funded}
                        </td>
                        <td
                          data-testid={`seller-ad-spent-${ad.id}`}
                          className="py-3.5 px-4 text-right font-mono font-bold text-[#1A2420]"
                        >
                          {ad.currency} {ad.spent}
                        </td>
                        <td
                          data-testid={`seller-ad-remaining-${ad.id}`}
                          className="py-3.5 px-4 text-right font-mono font-bold text-[#1A2420]"
                        >
                          {ad.currency} {ad.remaining}
                        </td>
                        <td
                          data-testid={`seller-ad-billed-clicks-${ad.id}`}
                          className="py-3.5 px-4 text-right font-mono font-bold text-[#1A2420]"
                        >
                          {ad.billed_click_count ?? 0}
                        </td>
                        <td
                          data-testid={`seller-ad-end-reason-${ad.id}`}
                          className="py-3.5 px-4 text-[#1A2420] font-semibold"
                        >
                          {ad.end_reason
                            ? formatAdEndReasonLabel(ad.end_reason)
                            : '—'}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex flex-wrap justify-end gap-1.5">
                            <button
                              type="button"
                              data-testid={`seller-view-ad-btn-${ad.id}`}
                              aria-label={`View Detail for advertisement ${ad.name}`}
                              onClick={() => openAdDetail(ad)}
                              className="px-2.5 py-1.5 rounded-xl border border-[#EAE3DC] bg-white hover:bg-[#FFF3EC] text-xs font-bold text-[#1A2420] inline-flex items-center space-x-1 cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>View Detail</span>
                            </button>

                            {ad.status === 'created' &&
                              Boolean(ad.active_creative) &&
                              ad.active_creative.moderation_state === 'draft' && (
                                <button
                                  type="button"
                                  data-testid={`seller-row-request-payment-btn-${ad.id}`}
                                  disabled={cannotSell}
                                  onClick={() =>
                                    openActionDialog('request-payment', ad)
                                  }
                                  className="px-2.5 py-1.5 rounded-xl bg-[#1D4ED8] hover:bg-[#1E40AF] disabled:opacity-45 disabled:cursor-not-allowed text-white text-xs font-bold inline-flex items-center space-x-1 cursor-pointer"
                                >
                                  <Send className="w-3.5 h-3.5" />
                                  <span>Request payment</span>
                                </button>
                              )}

                            {(ad.status === 'created' ||
                              ad.status === 'awaiting_payment') && (
                              <button
                                type="button"
                                data-testid={`seller-row-cancel-ad-btn-${ad.id}`}
                                disabled={cannotSell}
                                onClick={() => openActionDialog('cancel', ad)}
                                className="px-2.5 py-1.5 rounded-xl border border-[#FCA5A5] bg-[#FFF3F3] hover:bg-[#FEE2E2] disabled:opacity-45 disabled:cursor-not-allowed text-[#DC2626] text-xs font-bold inline-flex items-center space-x-1 cursor-pointer"
                              >
                                <XCircle className="w-3.5 h-3.5" />
                                <span>Cancel</span>
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
        </section>
      )}

      {/* TAB 2: GUIDED CREATE AD FLOW (Step 1: Type, Step 2: Placement & Product; NO amount input) */}
      {activeTab === 'create' && (
        <section
          data-testid="seller-create-ad-panel"
          className="rounded-3xl border border-[#EAE3DC] bg-white shadow-2xs p-6 space-y-5"
        >
          <div className="flex items-center justify-between border-b border-[#EAE3DC] pb-4">
            <div className="flex items-center space-x-3">
              <button
                type="button"
                data-testid="seller-create-ad-back-btn"
                onClick={() => setActiveTab('ads')}
                className="px-3 py-1.5 rounded-xl border border-[#EAE3DC] bg-white hover:bg-[#FFF3EC] text-xs font-bold text-[#1A2420] inline-flex items-center space-x-1.5 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5 text-[#FA661C]" />
                <span>Back to My Ads</span>
              </button>
              <h2
                id="seller-create-ad-heading"
                className="font-['Outfit'] font-extrabold text-lg text-[#1A2420]"
              >
                Create Product Advertisement
              </h2>
            </div>
          </div>

          {/* Guided Steps Indicator */}
          <ol
            data-testid="seller-guided-flow-steps"
            className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs"
          >
            <li className="p-3 rounded-2xl border border-[#FA661C] bg-[#FFF3EC] font-bold text-[#1A2420]">
              1. Choose Type (Picture / Video)
            </li>
            <li className="p-3 rounded-2xl border border-[#FA661C] bg-[#FFF3EC] font-bold text-[#1A2420]">
              2. Choose Placement &amp; Product
            </li>
            <li className="p-3 rounded-2xl border border-[#EAE3DC] bg-[#F9F6F0] font-semibold text-[#6B6058]">
              3. Add Your Picture
            </li>
            <li className="p-3 rounded-2xl border border-[#EAE3DC] bg-[#F9F6F0] font-semibold text-[#6B6058]">
              4. Pay Fixed Price &amp; Submit
            </li>
          </ol>

          <div className="p-4 rounded-2xl bg-[#F9F6F0] border border-[#EAE3DC] text-xs text-[#6B6058]">
            Choose Picture, select your published INR product and placement, and create the advertisement at the platform&apos;s fixed price. Next, you will upload your creative picture before paying.
          </div>

          {createGeneralError && (
            <div
              data-testid="seller-ad-create-error"
              role="alert"
              className="p-4 rounded-2xl bg-[#FFF3F3] border border-[#FCA5A5] text-xs text-[#991B1B]"
            >
              {createGeneralError}
            </div>
          )}

          <form
            onSubmit={handleCreateAdSubmit}
            aria-labelledby="seller-create-ad-heading"
            data-testid="seller-create-ad-form"
            className="space-y-5"
            noValidate
          >
            {/* Step 1: Advertisement Type (Picture vs Video Coming Soon) */}
            <fieldset className="space-y-2">
              <legend className="block text-xs font-bold text-[#1A2420] mb-1">
                Step 1: Choose Advertisement Type{' '}
                <span aria-hidden="true" className="text-[#DC2626]">
                  *
                </span>
              </legend>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {AD_TYPES.map((typeOpt) => {
                  const isSelected = createAdType === typeOpt.value;
                  return (
                    <label
                      key={typeOpt.value}
                      data-testid={`seller-ad-type-card-${typeOpt.value}`}
                      className={`p-4 rounded-2xl border flex items-center justify-between gap-3 text-xs ${
                        typeOpt.disabled
                          ? 'border-[#EAE3DC] bg-[#F3F4F6] text-[#6B6058] opacity-70 cursor-not-allowed'
                          : isSelected
                          ? 'border-[#FA661C] bg-[#FFF3EC]/70 text-[#1A2420] font-bold cursor-pointer'
                          : 'border-[#EAE3DC] bg-white text-[#1A2420] hover:bg-[#FFF3EC]/30 cursor-pointer'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <input
                          type="radio"
                          name="ad_type"
                          value={typeOpt.value}
                          data-testid={`seller-ad-type-option-${typeOpt.value}`}
                          checked={isSelected}
                          disabled={typeOpt.disabled}
                          onChange={() => {
                            if (!typeOpt.disabled) {
                              setCreateAdType(typeOpt.value);
                              setCreateFieldErrors((fe) => ({
                                ...fe,
                                ad_type: '',
                              }));
                            }
                          }}
                        />
                        <span className="text-sm font-bold">
                          {typeOpt.label}
                        </span>
                      </div>
                      {typeOpt.badge && (
                        <span
                          data-testid={`seller-ad-type-badge-${typeOpt.value}`}
                          className="px-2.5 py-0.5 rounded-full bg-[#E5E7EB] text-[#374151] text-[10px] font-extrabold uppercase"
                        >
                          {typeOpt.badge}
                        </span>
                      )}
                    </label>
                  );
                })}
              </div>
              {createFieldErrors.ad_type && (
                <p
                  data-testid="seller-ad-error-ad_type"
                  className="text-[11px] font-semibold text-[#DC2626] mt-1"
                >
                  {createFieldErrors.ad_type}
                </p>
              )}
            </fieldset>

            {/* Step 2: Product, Placement, Name, and Fixed Price Display (NO amount input) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label
                  htmlFor="seller-ad-product"
                  className="block text-xs font-bold text-[#1A2420] mb-1"
                >
                  Published Product{' '}
                  <span aria-hidden="true" className="text-[#DC2626]">
                    *
                  </span>
                </label>
                <select
                  id="seller-ad-product"
                  name="product_id"
                  data-testid="seller-ad-product-select"
                  value={createProductId}
                  aria-invalid={Boolean(createFieldErrors.product_id)}
                  onChange={(e) => {
                    setCreateProductId(e.target.value);
                    setCreateFieldErrors((fe) => ({ ...fe, product_id: '' }));
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-[#EAE3DC] text-xs bg-white font-semibold"
                >
                  <option value="">Select published product...</option>
                  {publishedProducts.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} (#{p.id})
                    </option>
                  ))}
                </select>
                {createFieldErrors.product_id && (
                  <p
                    data-testid="seller-ad-error-product_id"
                    className="text-[11px] font-semibold text-[#DC2626] mt-1"
                  >
                    {createFieldErrors.product_id}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="seller-ad-placement"
                  className="block text-xs font-bold text-[#1A2420] mb-1"
                >
                  Placement{' '}
                  <span aria-hidden="true" className="text-[#DC2626]">
                    *
                  </span>
                </label>
                <select
                  id="seller-ad-placement"
                  name="placement"
                  data-testid="seller-ad-placement-select"
                  value={createPlacement}
                  aria-invalid={Boolean(createFieldErrors.placement)}
                  onChange={(e) => {
                    setCreatePlacement(e.target.value);
                    setCreateFieldErrors((fe) => ({ ...fe, placement: '' }));
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-[#EAE3DC] text-xs bg-white font-semibold"
                >
                  {AD_PLACEMENTS.map((pl) => (
                    <option key={pl.value} value={pl.value}>
                      {pl.label}
                    </option>
                  ))}
                </select>
                {createFieldErrors.placement && (
                  <p
                    data-testid="seller-ad-error-placement"
                    className="text-[11px] font-semibold text-[#DC2626] mt-1"
                  >
                    {createFieldErrors.placement}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="seller-ad-name"
                  className="block text-xs font-bold text-[#1A2420] mb-1"
                >
                  Advertisement Name{' '}
                  <span aria-hidden="true" className="text-[#DC2626]">
                    *
                  </span>
                </label>
                <input
                  id="seller-ad-name"
                  name="name"
                  data-testid="seller-ad-name-input"
                  type="text"
                  maxLength={100}
                  placeholder="e.g. Festive Flagship Promotion"
                  value={createName}
                  aria-invalid={Boolean(createFieldErrors.name)}
                  onChange={(e) => {
                    setCreateName(e.target.value);
                    setCreateFieldErrors((fe) => ({ ...fe, name: '' }));
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-[#EAE3DC] text-xs"
                />
                {createFieldErrors.name && (
                  <p
                    data-testid="seller-ad-error-name"
                    className="text-[11px] font-semibold text-[#DC2626] mt-1"
                  >
                    {createFieldErrors.name}
                  </p>
                )}
              </div>
            </div>

            {/* Platform Fixed Price & Click Amount Summary for the Chosen Placement */}
            <div
              data-testid="seller-create-placement-pricing-card"
              className="p-4 rounded-2xl border border-[#EAE3DC] bg-[#FFF3EC]/50 flex flex-wrap items-center justify-between gap-3 text-xs"
            >
              {createChosenPlacementPricing?.ad_price ? (
                <div className="space-y-1">
                  <div
                    data-testid="seller-create-placement-price"
                    className="font-mono font-extrabold text-sm text-[#1A2420]"
                  >
                    Price: {createChosenPlacementPricing.currency || 'INR'}{' '}
                    {createChosenPlacementPricing.ad_price} for this advertisement
                  </div>
                  {createChosenPlacementPricing.click_amount && (
                    <div
                      data-testid="seller-create-placement-click-amount"
                      className="font-mono text-[#6B6058] font-semibold"
                    >
                      Click deduction:{' '}
                      {createChosenPlacementPricing.currency || 'INR'}{' '}
                      {createChosenPlacementPricing.click_amount} per click
                    </div>
                  )}
                </div>
              ) : (
                <div
                  data-testid="seller-create-placement-unavailable"
                  className="text-[#991B1B] font-bold"
                >
                  Placement unavailable: Advertising price is not set for this placement.
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setActiveTab('ads')}
                className="px-4 py-2 rounded-xl border border-[#EAE3DC] text-xs font-bold text-[#6B6058] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                data-testid="seller-ad-create-submit-btn"
                disabled={createSubmitting || cannotSell}
                className="px-5 py-2.5 rounded-xl bg-[#FA661C] hover:bg-[#E0530B] disabled:opacity-45 disabled:cursor-not-allowed text-white text-xs font-bold cursor-pointer"
              >
                {createSubmitting
                  ? 'Creating...'
                  : 'Continue to Step 3: Add Your Picture'}
              </button>
            </div>
          </form>
        </section>
      )}

      {/* TAB 3: AD DETAIL VIEW */}
      {activeTab === 'detail' && (
        <section
          data-testid="seller-ad-detail-panel"
          className="rounded-3xl border border-[#EAE3DC] bg-white shadow-2xs p-6 space-y-6"
        >
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#EAE3DC] pb-4">
            <button
              type="button"
              data-testid="seller-ad-detail-back-btn"
              onClick={() => setActiveTab('ads')}
              className="px-3 py-1.5 rounded-xl border border-[#EAE3DC] bg-white hover:bg-[#FFF3EC] text-xs font-bold text-[#1A2420] inline-flex items-center space-x-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-[#FA661C]" />
              <span>Back to My Ads</span>
            </button>

            {selectedAd && (
              <div className="flex flex-wrap items-center gap-2">
                <span
                  data-testid="seller-ad-detail-status-badge"
                  className={`px-3 py-1 rounded-full text-xs font-extrabold uppercase ${getAdStatusBadgeClass(
                    selectedAd.status
                  )}`}
                >
                  {AD_STATUS_LABELS[selectedAd.status] || selectedAd.status}
                </span>

                {selectedAdRejected && selectedAd.status !== 'rejected' && (
                  <span
                    data-testid="seller-ad-detail-rejected-badge"
                    className={`px-3 py-1 rounded-full text-xs font-extrabold uppercase ${getAdStatusBadgeClass(
                      'rejected'
                    )}`}
                  >
                    Creative Rejected
                  </span>
                )}

                {/* Single next valid workflow action button based on server status & creative state */}
                {canRequestPayment && (
                  <button
                    type="button"
                    data-testid="seller-ad-request-payment-btn"
                    disabled={cannotSell}
                    onClick={() =>
                      openActionDialog('request-payment', selectedAd)
                    }
                    className="px-3.5 py-1.5 rounded-xl bg-[#1D4ED8] hover:bg-[#1E40AF] disabled:opacity-45 disabled:cursor-not-allowed text-white text-xs font-bold inline-flex items-center space-x-1.5 cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Request payment</span>
                  </button>
                )}

                {canPayTest && (
                  <button
                    type="button"
                    data-testid="seller-ad-pay-test-btn"
                    disabled={cannotSell || simulatedPaymentSubmitting}
                    onClick={handleSimulatedPaymentSubmit}
                    className="px-3.5 py-1.5 rounded-xl bg-[#FA661C] hover:bg-[#E0530B] disabled:opacity-45 disabled:cursor-not-allowed text-white text-xs font-bold inline-flex items-center space-x-1.5 cursor-pointer"
                  >
                    <Receipt className="w-3.5 h-3.5" />
                    <span>
                      {simulatedPaymentSubmitting ? 'Paying...' : 'Pay (test)'}
                    </span>
                  </button>
                )}

                {/* Submit for review button: shown ONLY when ad is funded and has a draft creative */}
                {canSubmitForReview && (
                  <button
                    type="button"
                    data-testid="seller-submit-for-review-btn"
                    disabled={cannotSell}
                    onClick={() =>
                      openActionDialog('submit-review', selectedAd)
                    }
                    className="px-3.5 py-1.5 rounded-xl bg-[#059669] hover:bg-[#047857] disabled:opacity-45 disabled:cursor-not-allowed text-white text-xs font-bold inline-flex items-center space-x-1.5 cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Submit for review</span>
                  </button>
                )}

                {/* Cancel button: shown ONLY before funded (created or awaiting_payment) */}
                {(selectedAd.status === 'created' ||
                  selectedAd.status === 'awaiting_payment') && (
                  <button
                    type="button"
                    data-testid="seller-ad-cancel-btn"
                    disabled={cannotSell}
                    onClick={() => openActionDialog('cancel', selectedAd)}
                    className="px-3.5 py-1.5 rounded-xl border border-[#FCA5A5] bg-[#FFF3F3] hover:bg-[#FEE2E2] disabled:opacity-45 disabled:cursor-not-allowed text-[#DC2626] text-xs font-bold inline-flex items-center space-x-1.5 cursor-pointer"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Cancel</span>
                  </button>
                )}
              </div>
            )}
          </div>

          {detailLoading ? (
            <div className="p-8 text-center text-xs text-[#6B6058]">
              Loading advertisement details...
            </div>
          ) : detailError ? (
            <div
              data-testid="seller-ad-detail-error"
              role="alert"
              className="p-4 rounded-2xl bg-[#FFF3F3] border border-[#FCA5A5] text-xs text-[#991B1B]"
            >
              {detailError}
            </div>
          ) : selectedAd ? (
            <div className="space-y-6">
              {/* Status-driven Next Action Banner */}
              {nextAction && (
                <div
                  data-testid="seller-ad-next-action-banner"
                  className="p-4 rounded-2xl border border-[#EAE3DC] bg-[#FFF3EC]/70 flex flex-wrap items-center justify-between gap-3 text-xs text-[#1A2420]"
                >
                  <div>
                    <span className="text-[10px] font-black uppercase text-[#FA661C] tracking-wider block">
                      Next Step
                    </span>
                    <span
                      data-testid="seller-ad-next-action-label"
                      className="font-extrabold text-sm text-[#1A2420]"
                    >
                      {nextAction.label}
                    </span>
                  </div>
                  <div className="font-mono font-bold text-[#1A2420]">
                    Price: {selectedAd.currency || 'INR'}{' '}
                    {selectedAd.intended_amount} for this advertisement
                  </div>
                </div>
              )}

              {/* Step 4 Payment Section: shown when ad is awaiting_payment (after creative upload & request-payment) */}
              {(selectedAd.status === 'awaiting_payment' ||
                paymentRequestedNotice) && (
                <div
                  data-testid="seller-payment-step-panel"
                  className="space-y-3"
                >
                  {simulatedPaymentEnabledForAd && canPayTest ? (
                    <div
                      data-testid="seller-test-payment-banner"
                      role="status"
                      className="p-4 rounded-2xl bg-[#FFFBEB] border border-[#F59E0B] flex flex-wrap items-center justify-between gap-3 text-xs text-[#92400E]"
                    >
                      <div className="flex items-center space-x-3">
                        <Info className="w-5 h-5 text-[#D97706] shrink-0" />
                        <div className="space-y-0.5">
                          <div className="font-extrabold text-sm">
                            Test payment. No real money is charged.
                          </div>
                          <div>
                            Price: {selectedAd.currency || 'INR'}{' '}
                            {selectedAd.intended_amount} for this advertisement
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div
                      data-testid="seller-awaiting-payment-notice"
                      role="status"
                      className="p-4 rounded-2xl bg-[#EFF6FF] border border-[#93C5FD] flex items-center space-x-3 text-xs text-[#1E3A8A] font-bold"
                    >
                      <Info className="w-5 h-5 text-[#1D4ED8] shrink-0" />
                      <span>
                        Payment is added by the platform team. Nothing has been charged.
                      </span>
                    </div>
                  )}

                  {simulatedPaymentError && (
                    <div
                      data-testid="seller-simulated-payment-error"
                      role="alert"
                      className="p-3.5 rounded-xl bg-[#FFF3F3] border border-[#FCA5A5] text-xs text-[#991B1B]"
                    >
                      {simulatedPaymentError}
                    </div>
                  )}
                </div>
              )}

              {/* Pending review state: "Waiting for review" notice */}
              {selectedAd.status === 'pending_review' && (
                <div
                  data-testid="seller-waiting-for-review-notice"
                  role="status"
                  className="p-4 rounded-2xl bg-[#EEF2FF] border border-[#A5B4FC] flex items-center space-x-3 text-xs text-[#3730A3] font-bold"
                >
                  <Clock className="w-5 h-5 text-[#4338CA] shrink-0" />
                  <div>
                    <div className="text-sm font-extrabold">
                      Waiting for review
                    </div>
                    <p className="font-normal mt-0.5">
                      Your creative has been submitted to the platform team for moderation. Replacing the photo is locked while review is pending.
                    </p>
                  </div>
                </div>
              )}

              {/* Rejected creative state: show staff rejection reason clearly */}
              {selectedAdRejected && (
                <div
                  data-testid="seller-ad-rejected-banner"
                  role="alert"
                  className="p-4 rounded-2xl bg-[#FFF3F3] border border-[#FCA5A5] flex items-start space-x-3 text-xs text-[#991B1B]"
                >
                  <AlertCircle className="w-5 h-5 text-[#DC2626] shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <div className="font-extrabold text-sm">
                      Creative Rejected by Platform Moderation
                    </div>
                    <p data-testid="seller-ad-rejection-reason">
                      Reason: {selectedAdRejectionReason || 'Creative rejected.'}
                    </p>
                    <p className="text-[#7F1D1D]">
                      Upload a replacement photo below and submit the advertisement for review again.
                    </p>
                  </div>
                </div>
              )}

              {/* Approved state: show Approved, placement, click amount snapshotted on the ad, and mandatory note */}
              {selectedAd.status === 'approved' && (
                <div
                  data-testid="seller-ad-approved-banner"
                  role="status"
                  className="p-5 rounded-2xl bg-[#ECFDF5] border border-[#6EE7B7] space-y-2 text-xs text-[#065F46]"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center space-x-2">
                      <CheckCircle2 className="w-5 h-5 text-[#059669] shrink-0" />
                      <span className="font-extrabold text-sm">
                        Approved
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 font-mono font-bold">
                      <span data-testid="seller-ad-approved-placement">
                        Placement: {formatAdPlacementLabel(selectedAd.placement)}
                      </span>
                      <span data-testid="seller-ad-click-rate-snapshot">
                        Click Price: {selectedAd.currency}{' '}
                        {selectedAd.click_rate_snapshot ?? '—'} per click
                      </span>
                    </div>
                  </div>
                  <p
                    data-testid="seller-ad-approved-note"
                    className="font-bold text-[#047857]"
                  >
                    Your advertisement is approved. It will start showing in a later release.
                  </p>
                </div>
              )}

              {/* Running state: show Running with spent and remaining as sent (no estimates, no progress percentage, no clicks left) */}
              {selectedAd.status === 'running' && (
                <div
                  data-testid="seller-ad-running-banner"
                  role="status"
                  className="p-5 rounded-2xl bg-[#D1FAE5] border border-[#34D399] space-y-2 text-xs text-[#065F46]"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center space-x-2">
                      <CheckCircle2 className="w-5 h-5 text-[#059669] shrink-0" />
                      <span
                        data-testid="seller-ad-running-label"
                        className="font-extrabold text-sm"
                      >
                        Running
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 font-mono font-bold">
                      <span data-testid="seller-ad-running-spent">
                        Spent: {selectedAd.currency || 'INR'} {selectedAd.spent}
                      </span>
                      <span data-testid="seller-ad-running-remaining">
                        Remaining: {selectedAd.currency || 'INR'}{' '}
                        {selectedAd.remaining}
                      </span>
                      <span data-testid="seller-ad-running-billed-clicks">
                        Billed Clicks: {selectedAd.billed_click_count ?? 0}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Ended state: show "This advertisement has ended" with end reason, and "Unused amount: <as sent>" if remaining > 0 */}
              {selectedAd.status === 'ended' && (
                <div
                  data-testid="seller-ad-ended-banner"
                  role="status"
                  className="p-5 rounded-2xl bg-[#F3F4F6] border border-[#9CA3AF] space-y-2 text-xs text-[#1F2937]"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="font-extrabold text-sm">
                      This advertisement has ended
                    </div>
                    <span
                      data-testid="seller-ad-ended-reason"
                      className="font-bold text-[#374151]"
                    >
                      End reason: {formatAdEndReasonLabel(selectedAd.end_reason)}
                    </span>
                  </div>
                  {isPositiveMoneyString(selectedAd.remaining) && (
                    <div
                      data-testid="seller-ad-ended-unused-amount"
                      className="font-mono font-bold text-[#1F2937]"
                    >
                      Unused amount: {selectedAd.currency || 'INR'}{' '}
                      {selectedAd.remaining}
                    </div>
                  )}
                </div>
              )}

              {/* Taken down / cancelled state */}
              {(selectedAd.status === 'taken_down' ||
                selectedAd.status === 'cancelled') && (
                <div
                  data-testid="seller-ad-terminal-banner"
                  role="status"
                  className="p-4 rounded-2xl bg-[#F3F4F6] border border-[#D1D5DB] flex items-start space-x-3 text-xs text-[#374151]"
                >
                  <Ban className="w-5 h-5 text-[#4B5563] shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <div className="font-bold text-sm">
                      Status:{' '}
                      {AD_STATUS_LABELS[selectedAd.status] || selectedAd.status}
                    </div>
                    {selectedAdRejectionReason && (
                      <p data-testid="seller-ad-terminal-reason">
                        Reason: {selectedAdRejectionReason}
                      </p>
                    )}
                    {selectedAd.status === 'taken_down' && (
                      <p>
                        This advertisement has been taken down and cannot be resubmitted.
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Figures & Metadata (No stored budget shown as money truth; show funded, spent, remaining, billed clicks, end reason) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 text-xs">
                <div className="p-4 rounded-2xl border border-[#EAE3DC] bg-[#F9F6F0]/60 space-y-1">
                  <span className="text-[10px] font-black uppercase text-[#6B6058]">
                    Advertisement &amp; Product
                  </span>
                  <div
                    data-testid="seller-ad-detail-name"
                    className="font-bold text-sm text-[#1A2420]"
                  >
                    {selectedAd.name} (#{selectedAd.id})
                  </div>
                  <div
                    data-testid="seller-ad-detail-product"
                    className="text-[#6B6058] font-semibold"
                  >
                    {formatProductLabel(selectedAd)}
                  </div>
                  <div className="text-[11px] text-[#6B6058]">
                    Created: {formatAdDateTime(selectedAd.created_at)}
                  </div>
                </div>

                <div className="p-4 rounded-2xl border border-[#EAE3DC] bg-[#F9F6F0]/60 space-y-1">
                  <span className="text-[10px] font-black uppercase text-[#6B6058]">
                    Fixed Advertisement Price
                  </span>
                  <div
                    data-testid="seller-ad-detail-intended"
                    className="font-mono font-extrabold text-base text-[#1A2420]"
                  >
                    {selectedAd.currency} {selectedAd.intended_amount}
                  </div>
                  <div className="text-[11px] text-[#6B6058]">
                    Type: {formatAdTypeLabel(selectedAd.ad_type)} • Placement:{' '}
                    {formatAdPlacementLabel(
                      selectedAd.placement ||
                        selectedAd.active_creative?.placement
                    )}
                  </div>
                </div>

                <div className="p-4 rounded-2xl border border-[#EAE3DC] bg-[#F9F6F0]/60 space-y-1">
                  <span className="text-[10px] font-black uppercase text-[#6B6058]">
                    Funded (Ledger Net)
                  </span>
                  <div
                    data-testid="seller-ad-detail-funded"
                    className="font-mono font-extrabold text-base text-[#059669]"
                  >
                    {selectedAd.currency} {selectedAd.funded}
                  </div>
                  <div
                    data-testid="seller-ad-detail-spent"
                    className="text-[11px] font-mono text-[#6B6058]"
                  >
                    Spent: {selectedAd.currency} {selectedAd.spent}
                  </div>
                </div>

                <div className="p-4 rounded-2xl border border-[#EAE3DC] bg-[#F9F6F0]/60 space-y-1">
                  <span className="text-[10px] font-black uppercase text-[#6B6058]">
                    Remaining Balance
                  </span>
                  <div
                    data-testid="seller-ad-detail-remaining"
                    className="font-mono font-extrabold text-base text-[#1A2420]"
                  >
                    {selectedAd.currency} {selectedAd.remaining}
                  </div>
                  <div className="text-[11px] text-[#6B6058]">
                    Updated: {formatAdDateTime(selectedAd.updated_at)}
                  </div>
                </div>

                <div className="p-4 rounded-2xl border border-[#EAE3DC] bg-[#F9F6F0]/60 space-y-1">
                  <span className="text-[10px] font-black uppercase text-[#6B6058]">
                    Billed Clicks &amp; End Reason
                  </span>
                  <div
                    data-testid="seller-ad-detail-billed-clicks"
                    className="font-mono font-extrabold text-base text-[#1A2420]"
                  >
                    {selectedAd.billed_click_count ?? 0}
                  </div>
                  <div
                    data-testid="seller-ad-detail-end-reason"
                    className="text-[11px] text-[#6B6058] font-semibold"
                  >
                    End reason:{' '}
                    {selectedAd.end_reason
                      ? formatAdEndReasonLabel(selectedAd.end_reason)
                      : '—'}
                  </div>
                </div>
              </div>

              {/* CREATIVE PANEL (Shown during Step 3 Add your picture, or whenever an active creative or post-funding state exists) */}
              {(canUploadOrReplaceCreative ||
                Boolean(selectedAd.active_creative) ||
                selectedAd.status === 'created' ||
                selectedAd.status === 'awaiting_payment' ||
                selectedAd.status === 'funded' ||
                selectedAd.status === 'pending_review' ||
                selectedAd.status === 'approved' ||
                selectedAd.status === 'running' ||
                selectedAd.status === 'ended' ||
                selectedAd.status === 'taken_down') && (
                <div
                  data-testid="seller-creative-panel"
                  className="p-5 rounded-2xl border border-[#EAE3DC] bg-[#F9F6F0]/40 space-y-5"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#EAE3DC] pb-3">
                    <div>
                      <h3 className="font-['Outfit'] font-extrabold text-base text-[#1A2420] flex items-center gap-2">
                        <ImageIcon className="w-4 h-4 text-[#FA661C]" />
                        <span>Advertisement Creative &amp; Placement</span>
                      </h3>
                      <p
                        data-testid="seller-creative-help-text"
                        className="text-xs text-[#6B6058] mt-0.5"
                      >
                        Allowed formats: JPEG, PNG, and WebP up to 5 MiB (5242880 bytes). Required aspect ratio: Header banner 3:1; Product page top 4:3.
                      </p>
                    </div>
                  </div>

                  {/* Stored Creative Display (fetched with JWT Authorization header into a Blob URL) */}
                  {selectedAd.active_creative && (
                    <div
                      data-testid="seller-stored-creative-card"
                      className="p-4 rounded-2xl border border-[#EAE3DC] bg-white space-y-3"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                        <div className="font-bold text-[#1A2420]">
                          Stored Creative #{selectedAd.active_creative.id} •{' '}
                          {formatAdPlacementLabel(
                            selectedAd.active_creative.placement
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-2 text-[11px] text-[#6B6058] font-mono">
                          <span>
                            {selectedAd.active_creative.width} ×{' '}
                            {selectedAd.active_creative.height} px
                          </span>
                          <span>•</span>
                          <span>
                            {selectedAd.active_creative.content_type} (
                            {selectedAd.active_creative.size} bytes)
                          </span>
                          <span>•</span>
                          <span
                            data-testid="seller-stored-creative-moderation-state"
                            className="font-bold text-[#1A2420]"
                          >
                            {AD_CREATIVE_MODERATION_LABELS[
                              selectedAd.active_creative.moderation_state
                            ] || selectedAd.active_creative.moderation_state}
                          </span>
                        </div>
                      </div>

                      {storedCreativeImgLoading ? (
                        <div className="p-6 text-center text-xs text-[#6B6058]">
                          Loading authenticated creative image...
                        </div>
                      ) : storedCreativeImgError ? (
                        <div
                          data-testid="seller-stored-creative-img-error"
                          className="p-3 rounded-xl bg-[#FFF3F3] border border-[#FCA5A5] text-xs text-[#991B1B]"
                        >
                          {storedCreativeImgError}
                        </div>
                      ) : storedCreativeBlobUrl ? (
                        <div className="rounded-xl border border-[#EAE3DC] bg-[#F9F6F0] p-3 flex justify-center">
                          <img
                            data-testid="seller-stored-creative-img"
                            src={storedCreativeBlobUrl}
                            alt={`Stored creative for ${selectedAd.name}`}
                            className="max-h-56 object-contain rounded-lg"
                          />
                        </div>
                      ) : null}
                    </div>
                  )}

                  {/* Creative Upload / Replace Form (shown when ad is created, awaiting_payment, funded, or rejected before review) */}
                  {(canUploadOrReplaceCreative ||
                    ((selectedAd.status === 'created' ||
                      selectedAd.status === 'awaiting_payment' ||
                      selectedAd.status === 'funded' ||
                      selectedAd.status === 'rejected') &&
                      (!selectedAd.active_creative ||
                        selectedAd.active_creative.moderation_state === 'draft' ||
                        selectedAd.active_creative.moderation_state === 'rejected'))) && (
                    <form
                      onSubmit={handleCreativeUploadSubmit}
                      data-testid="seller-creative-upload-form"
                      className="p-4 rounded-2xl border border-[#EAE3DC] bg-white space-y-4"
                      noValidate
                    >
                      <div className="font-bold text-xs text-[#1A2420]">
                        {selectedAd.active_creative
                          ? 'Replace Creative Photo'
                          : 'Upload Creative Photo'}
                      </div>

                      {creativeGeneralError && (
                        <div
                          data-testid="seller-creative-general-error"
                          role="alert"
                          className="p-3 rounded-xl bg-[#FFF3F3] border border-[#FCA5A5] text-xs text-[#991B1B]"
                        >
                          {creativeGeneralError}
                        </div>
                      )}

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                          <label
                            htmlFor="seller-creative-placement"
                            className="block text-xs font-bold text-[#1A2420] mb-1"
                          >
                            Placement{' '}
                            <span aria-hidden="true" className="text-[#DC2626]">
                              *
                            </span>
                          </label>
                          <select
                            id="seller-creative-placement"
                            name="placement"
                            data-testid="seller-creative-placement-select"
                            value={creativePlacement}
                            disabled={cannotSell || creativeUploading}
                            onChange={(e) => {
                              setCreativePlacement(e.target.value);
                              setCreativeFieldErrors((fe) => ({
                                ...fe,
                                placement: '',
                              }));
                            }}
                            className="w-full px-3 py-2 rounded-xl border border-[#EAE3DC] text-xs bg-white font-semibold"
                          >
                            {AD_PLACEMENTS.map((pl) => (
                              <option key={pl.value} value={pl.value}>
                                {pl.label}
                              </option>
                            ))}
                          </select>
                          {creativeFieldErrors.placement && (
                            <p
                              data-testid="seller-creative-error-placement"
                              className="text-[11px] font-semibold text-[#DC2626] mt-1"
                            >
                              {creativeFieldErrors.placement}
                            </p>
                          )}
                        </div>

                        <div>
                          <label
                            htmlFor="seller-creative-file"
                            className="block text-xs font-bold text-[#1A2420] mb-1"
                          >
                            Creative Photo{' '}
                            <span aria-hidden="true" className="text-[#DC2626]">
                              *
                            </span>
                          </label>
                          <input
                            ref={fileInputRef}
                            id="seller-creative-file"
                            name="image"
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            data-testid="seller-creative-file-input"
                            disabled={cannotSell || creativeUploading}
                            onChange={handleCreativeFileChange}
                            className="w-full px-3 py-1.5 rounded-xl border border-[#EAE3DC] text-xs bg-white"
                          />
                          {creativeFieldErrors.image && (
                            <p
                              data-testid="seller-creative-error-image"
                              role="alert"
                              className="text-[11px] font-semibold text-[#DC2626] mt-1"
                            >
                              {creativeFieldErrors.image}
                            </p>
                          )}
                        </div>

                        <div>
                          <label
                            htmlFor="seller-creative-reason"
                            className="block text-xs font-bold text-[#1A2420] mb-1"
                          >
                            Note / Reason (optional)
                          </label>
                          <input
                            id="seller-creative-reason"
                            name="reason"
                            type="text"
                            data-testid="seller-creative-reason-input"
                            value={creativeReason}
                            disabled={cannotSell || creativeUploading}
                            onChange={(e) => setCreativeReason(e.target.value)}
                            placeholder="Optional note for creative upload"
                            className="w-full px-3 py-2 rounded-xl border border-[#EAE3DC] text-xs"
                          />
                        </div>
                      </div>

                      {/* Local preview of the chosen file before upload */}
                      {creativeFile && (
                        <div
                          data-testid="seller-creative-local-preview"
                          className="p-3 rounded-xl border border-[#EAE3DC] bg-[#F9F6F0] space-y-2"
                        >
                          <div className="text-[11px] font-bold text-[#6B6058]">
                            Selected File Preview Before Upload:{' '}
                            <span className="font-mono text-[#1A2420]">
                              {creativeFile.name} ({creativeFile.size} bytes)
                            </span>
                          </div>
                          {creativeFilePreviewUrl && (
                            <img
                              data-testid="seller-creative-local-preview-img"
                              src={creativeFilePreviewUrl}
                              alt="Selected creative preview before upload"
                              className="max-h-40 object-contain rounded-lg"
                            />
                          )}
                        </div>
                      )}

                      <div className="flex justify-end gap-2">
                        <button
                          type="submit"
                          data-testid="seller-creative-upload-btn"
                          disabled={cannotSell || creativeUploading}
                          className="px-4 py-2 rounded-xl bg-[#FA661C] hover:bg-[#E0530B] disabled:opacity-45 disabled:cursor-not-allowed text-white text-xs font-bold inline-flex items-center space-x-1.5 cursor-pointer"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          <span>
                            {creativeUploading
                              ? 'Uploading...'
                              : selectedAd.active_creative
                              ? 'Replace Creative Photo'
                              : 'Upload Creative Photo'}
                          </span>
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              )}

              {/* Payment & Ledger History for this Advertisement */}
              <div className="space-y-3">
                <h3 className="font-['Outfit'] font-extrabold text-sm text-[#1A2420]">
                  Payment History for Ad #{selectedAd.id} (
                  {adDetailPayments.length})
                </h3>
                {adDetailPayments.length === 0 ? (
                  <p className="text-xs text-[#6B6058] italic">
                    No manual credit payments recorded for this advertisement yet.
                  </p>
                ) : (
                  <div className="overflow-x-auto rounded-2xl border border-[#EAE3DC]">
                    <table className="w-full text-left border-collapse text-xs">
                      <caption className="sr-only">
                        Payments for advertisement #{selectedAd.id}
                      </caption>
                      <thead>
                        <tr className="bg-[#FFF3EC]/60 border-b border-[#EAE3DC] text-[#6B6058] uppercase text-[10px] font-black">
                          <th scope="col" className="py-2.5 px-3">
                            Payment ID
                          </th>
                          <th scope="col" className="py-2.5 px-3">
                            Status
                          </th>
                          <th scope="col" className="py-2.5 px-3 text-right">
                            Amount
                          </th>
                          <th scope="col" className="py-2.5 px-3">
                            Reference &amp; Date
                          </th>
                          <th scope="col" className="py-2.5 px-3">
                            Reason
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#EAE3DC]">
                        {adDetailPayments.map((pmt) => (
                          <tr key={pmt.id}>
                            <td className="py-2.5 px-3 font-mono font-bold">
                              #{pmt.id}
                            </td>
                            <td className="py-2.5 px-3">
                              <span
                                className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${getAdPaymentStatusBadgeClass(
                                  pmt.status
                                )}`}
                              >
                                {AD_PAYMENT_STATUS_LABELS[pmt.status] ||
                                  pmt.status}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono font-bold">
                              {pmt.currency} {pmt.amount}
                            </td>
                            <td className="py-2.5 px-3 font-mono text-[11px]">
                              {pmt.external_reference || '—'} •{' '}
                              {pmt.received_date}
                            </td>
                            <td className="py-2.5 px-3">{pmt.reason}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <h3 className="font-['Outfit'] font-extrabold text-sm text-[#1A2420]">
                  Immutable Ledger Entries for Ad #{selectedAd.id} (
                  {adDetailLedger.length})
                </h3>
                {adDetailLedger.length === 0 ? (
                  <p className="text-xs text-[#6B6058] italic">
                    No ledger entries recorded for this advertisement yet.
                  </p>
                ) : (
                  <div className="overflow-x-auto rounded-2xl border border-[#EAE3DC]">
                    <table className="w-full text-left border-collapse text-xs">
                      <caption className="sr-only">
                        Ledger entries for advertisement #{selectedAd.id}
                      </caption>
                      <thead>
                        <tr className="bg-[#FFF3EC]/60 border-b border-[#EAE3DC] text-[#6B6058] uppercase text-[10px] font-black">
                          <th scope="col" className="py-2.5 px-3">
                            Entry ID
                          </th>
                          <th scope="col" className="py-2.5 px-3">
                            Type
                          </th>
                          <th scope="col" className="py-2.5 px-3 text-right">
                            Amount
                          </th>
                          <th scope="col" className="py-2.5 px-3">
                            Reference &amp; Reverses
                          </th>
                          <th scope="col" className="py-2.5 px-3">
                            Reason
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#EAE3DC]">
                        {adDetailLedger.map((entry) => (
                          <tr key={entry.id}>
                            <td className="py-2.5 px-3 font-mono font-bold">
                              #{entry.id}
                            </td>
                            <td className="py-2.5 px-3">
                              <span
                                data-testid={`seller-ad-detail-ledger-type-${entry.id}`}
                                className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${getAdLedgerBadgeClass(
                                  entry.entry_type
                                )}`}
                              >
                                {formatAdLedgerEntryTypeLabel(
                                  entry.entry_type,
                                  entry.entry_type_label
                                )}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono font-bold">
                              {entry.currency} {entry.amount}
                            </td>
                            <td className="py-2.5 px-3 font-mono text-[11px]">
                              {entry.reference || '—'}
                              {entry.reverses_id
                                ? ` (Reverses #${entry.reverses_id})`
                                : ''}
                            </td>
                            <td className="py-2.5 px-3">{entry.reason}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </section>
      )}

      {/* TAB 4: READ-ONLY PAYMENTS TABLE */}
      {activeTab === 'payments' && (
        <section
          data-testid="seller-ad-payments-panel"
          className="rounded-3xl border border-[#EAE3DC] bg-white shadow-2xs overflow-hidden"
        >
          <div className="p-5 border-b border-[#EAE3DC]">
            <h2 className="font-['Outfit'] font-extrabold text-base text-[#1A2420]">
              Advertising Payments (Read-Only)
            </h2>
            <p className="text-xs text-[#6B6058]">
              Manual funding receipts recorded by platform administrators for your advertisements.
            </p>
          </div>

          {payments.length === 0 ? (
            <div
              data-testid="seller-ad-payments-empty"
              className="p-8 text-center text-xs text-[#6B6058]"
            >
              No advertising payments recorded yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table
                data-testid="seller-ad-payments-table"
                className="w-full text-left border-collapse text-xs"
              >
                <caption className="sr-only">
                  Seller advertising payments
                </caption>
                <thead>
                  <tr className="bg-[#FFF3EC]/60 border-b border-[#EAE3DC] text-[#6B6058] uppercase text-[10px] font-black tracking-wider">
                    <th scope="col" className="py-3 px-4">
                      ID
                    </th>
                    <th scope="col" className="py-3 px-4">
                      Advertisement
                    </th>
                    <th scope="col" className="py-3 px-4">
                      Source &amp; Status
                    </th>
                    <th scope="col" className="py-3 px-4 text-right">
                      Amount
                    </th>
                    <th scope="col" className="py-3 px-4">
                      External Reference
                    </th>
                    <th scope="col" className="py-3 px-4">
                      Received Date
                    </th>
                    <th scope="col" className="py-3 px-4">
                      Reason
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EAE3DC]">
                  {payments.map((pmt) => (
                    <tr
                      key={pmt.id}
                      data-testid={`seller-ad-payment-row-${pmt.id}`}
                    >
                      <td className="py-3.5 px-4 font-mono font-bold">
                        #{pmt.id}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-semibold">
                        Ad #{pmt.advertisement_id}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${getAdPaymentStatusBadgeClass(
                            pmt.status
                          )}`}
                        >
                          {AD_PAYMENT_STATUS_LABELS[pmt.status] || pmt.status}
                        </span>
                        <span className="ml-1.5 font-mono text-[11px] text-[#6B6058]">
                          ({pmt.source})
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold">
                        {pmt.currency} {pmt.amount}
                      </td>
                      <td className="py-3.5 px-4 font-mono">
                        {pmt.external_reference || '—'}
                      </td>
                      <td className="py-3.5 px-4 font-mono">
                        {pmt.received_date}
                      </td>
                      <td className="py-3.5 px-4">{pmt.reason}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {/* TAB 5: READ-ONLY LEDGER TABLE */}
      {activeTab === 'ledger' && (
        <section
          data-testid="seller-ad-ledger-panel"
          className="rounded-3xl border border-[#EAE3DC] bg-white shadow-2xs overflow-hidden"
        >
          <div className="p-5 border-b border-[#EAE3DC]">
            <h2 className="font-['Outfit'] font-extrabold text-base text-[#1A2420]">
              Advertising Ledger Entries (Read-Only)
            </h2>
            <p className="text-xs text-[#6B6058]">
              Append-only ledger of payment credits and payment reversals for your advertisements.
            </p>
          </div>

          {ledgerEntries.length === 0 ? (
            <div
              data-testid="seller-ad-ledger-empty"
              className="p-8 text-center text-xs text-[#6B6058]"
            >
              No advertising ledger entries recorded yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table
                data-testid="seller-ad-ledger-table"
                className="w-full text-left border-collapse text-xs"
              >
                <caption className="sr-only">
                  Seller advertising ledger entries
                </caption>
                <thead>
                  <tr className="bg-[#FFF3EC]/60 border-b border-[#EAE3DC] text-[#6B6058] uppercase text-[10px] font-black tracking-wider">
                    <th scope="col" className="py-3 px-4">
                      Entry ID
                    </th>
                    <th scope="col" className="py-3 px-4">
                      Advertisement &amp; Payment
                    </th>
                    <th scope="col" className="py-3 px-4">
                      Entry Type
                    </th>
                    <th scope="col" className="py-3 px-4 text-right">
                      Amount
                    </th>
                    <th scope="col" className="py-3 px-4">
                      Reference &amp; Reverses
                    </th>
                    <th scope="col" className="py-3 px-4">
                      Reason
                    </th>
                    <th scope="col" className="py-3 px-4">
                      Created At
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EAE3DC]">
                  {ledgerEntries.map((entry) => (
                    <tr
                      key={entry.id}
                      data-testid={`seller-ad-ledger-row-${entry.id}`}
                    >
                      <td className="py-3.5 px-4 font-mono font-bold">
                        #{entry.id}
                      </td>
                      <td className="py-3.5 px-4 font-mono">
                        Ad #{entry.advertisement_id}
                        {entry.ad_payment_id
                          ? ` • Payment #${entry.ad_payment_id}`
                          : ''}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          data-testid={`seller-ad-ledger-type-${entry.id}`}
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${getAdLedgerBadgeClass(
                            entry.entry_type
                          )}`}
                        >
                          {formatAdLedgerEntryTypeLabel(
                            entry.entry_type,
                            entry.entry_type_label
                          )}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold">
                        {entry.currency} {entry.amount}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[11px]">
                        {entry.reference || '—'}
                        {entry.refund_date
                          ? ` • Refund Date: ${entry.refund_date}`
                          : ''}
                        {entry.reverses_id
                          ? ` • Reverses #${entry.reverses_id}`
                          : ''}
                      </td>
                      <td className="py-3.5 px-4">{entry.reason}</td>
                      <td className="py-3.5 px-4 text-[11px] text-[#6B6058]">
                        {formatAdDateTime(entry.created_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {/* NATIVE MODAL DIALOG: REQUEST PAYMENT, SUBMIT FOR REVIEW, OR CANCEL AD */}
      <dialog
        ref={dialogRef}
        aria-labelledby="seller-ad-action-dialog-title"
        data-testid={dialogTestId}
        onClose={closeActionDialog}
        className="rounded-3xl border border-[#EAE3DC] bg-white shadow-2xl max-w-md w-full p-0 m-auto text-[#1A2420]"
      >
        {actionDialog && (
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#EAE3DC] pb-3">
              <h3
                id="seller-ad-action-dialog-title"
                className="font-['Outfit'] font-extrabold text-lg text-[#1A2420]"
              >
                {actionDialog.action === 'request-payment'
                  ? `Request Manual Funding — Ad #${actionDialog.ad?.id}`
                  : actionDialog.action === 'submit-review'
                  ? `Submit for Review — Ad #${actionDialog.ad?.id}`
                  : `Cancel Advertisement — Ad #${actionDialog.ad?.id}`}
              </h3>
              <button
                type="button"
                onClick={closeActionDialog}
                className="p-1 text-[#6B6058] hover:text-[#1A2420] cursor-pointer"
                aria-label="Close confirmation dialog"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-[#6B6058]">
              {actionDialog.action === 'request-payment'
                ? `Request manual payment credit for "${actionDialog.ad?.name}" (intended amount: ${actionDialog.ad?.currency} ${actionDialog.ad?.intended_amount})? Payment is added by the platform team. Nothing has been charged.`
                : actionDialog.action === 'submit-review'
                ? `Submit "${actionDialog.ad?.name}" (#${actionDialog.ad?.id}) for platform moderation review? Replacing the photo will be locked while review is pending.`
                : `Cancel unfunded advertisement "${actionDialog.ad?.name}" (#${actionDialog.ad?.id})? Once cancelled, it cannot be funded.`}
            </p>

            {actionError && (
              <div
                data-testid="seller-ad-action-dialog-error"
                role="alert"
                className="p-3.5 rounded-xl bg-[#FFF3F3] border border-[#FCA5A5] text-xs text-[#991B1B]"
              >
                {actionError}
              </div>
            )}

            <form
              onSubmit={handleConfirmAction}
              className="space-y-3"
              noValidate
            >
              {(actionDialog.action === 'cancel' ||
                actionDialog.action === 'submit-review') && (
                <div>
                  <label
                    htmlFor="seller-dialog-reason"
                    className="block text-xs font-bold text-[#1A2420] mb-1"
                  >
                    {actionDialog.action === 'submit-review'
                      ? 'Submission Note / Reason (optional)'
                      : 'Cancellation Reason (optional)'}
                  </label>
                  <textarea
                    id="seller-dialog-reason"
                    name="reason"
                    data-testid={
                      actionDialog.action === 'submit-review'
                        ? 'seller-submit-review-reason-input'
                        : 'seller-cancel-ad-reason-input'
                    }
                    rows={2}
                    value={dialogReason}
                    onChange={(e) => setDialogReason(e.target.value)}
                    placeholder={
                      actionDialog.action === 'submit-review'
                        ? 'Optional note for moderation review'
                        : 'Seller cancelled before funding'
                    }
                    className="w-full px-3 py-2 rounded-xl border border-[#EAE3DC] text-xs"
                  />
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={closeActionDialog}
                  className="px-4 py-2 rounded-xl border border-[#EAE3DC] text-xs font-bold text-[#6B6058] cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="submit"
                  data-testid={
                    actionDialog.action === 'cancel'
                      ? 'seller-confirm-cancel-ad-btn'
                      : actionDialog.action === 'submit-review'
                      ? 'seller-confirm-submit-review-btn'
                      : 'seller-confirm-request-payment-btn'
                  }
                  disabled={actionSubmitting}
                  className={`px-4 py-2 rounded-xl text-white text-xs font-bold cursor-pointer ${
                    actionDialog.action === 'cancel'
                      ? 'bg-[#DC2626] hover:bg-[#B91C1C]'
                      : actionDialog.action === 'submit-review'
                      ? 'bg-[#059669] hover:bg-[#047857]'
                      : 'bg-[#1D4ED8] hover:bg-[#1E40AF]'
                  }`}
                >
                  {actionSubmitting
                    ? 'Confirming...'
                    : actionDialog.action === 'cancel'
                    ? 'Confirm Cancel'
                    : actionDialog.action === 'submit-review'
                    ? 'Confirm Submit for Review'
                    : 'Confirm Request Payment'}
                </button>
              </div>
            </form>
          </div>
        )}
      </dialog>
    </div>
  );
}
