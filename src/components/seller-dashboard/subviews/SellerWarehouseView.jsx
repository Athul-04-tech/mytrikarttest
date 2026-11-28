import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Warehouse,
  Plus,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Package,
  Truck,
  XCircle,
  ShieldAlert,
  Eye,
  Trash2,
  X,
  Info,
  Scale,
  FileText,
} from 'lucide-react';
import { apiRequest } from '../../../utils/api';
import AuthContext from '../../../context/AuthContext';
import SellerHandoversSection from '../../warehouse/SellerHandoversSection';
import SellerReturnsSection from '../../warehouse/SellerReturnsSection';
import {
  STORAGE_REQUEST_STATUSES,
  formatStorageStatusLabel,
  getStorageStatusBadgeClass,
  getValidStorageRequestActions,
  hasNonZeroMoneyString,
  formatAttributesSnapshot,
  formatDimensionsCm,
  formatWeightKg,
  formatDateTime,
  parseWarehouseApiError,
  canSellerConfirmHandback,
} from '../../../utils/warehouseUtils';

const CREATE_KNOWN_FIELDS = [
  'warehouse_id',
  'expected_arrival',
  'courier',
  'tracking_reference',
  'notes',
  'reason',
  'items',
];

const ACTION_KNOWN_FIELDS = ['courier', 'tracking_reference', 'reason'];

const EMPTY_CREATE_ITEM = {
  variant_id: '',
  quantity: '1',
  declared_length_cm: '',
  declared_width_cm: '',
  declared_height_cm: '',
  declared_weight_kg: '',
  expected_storage_days: '',
};

export default function SellerWarehouseView({ vendorProfile }) {
  const navigate = useNavigate();
  const params = useParams();
  const routeRequestId = params?.requestId ? Number(params.requestId) : null;
  const auth = React.useContext(AuthContext);
  const logout = auth?.logout;

  const [activeTab, setActiveTab] = useState('requests'); // 'requests' | 'stock' | 'handovers' | 'returns'
  const [handoversAvailable, setHandoversAvailable] = useState(true);
  const [returnsAvailable, setReturnsAvailable] = useState(true);

  // Available warehouses & seller variants
  const [availableWarehouses, setAvailableWarehouses] = useState([]);
  const [sellerVariants, setSellerVariants] = useState([]);
  const [sellingRestrictionMsg, setSellingRestrictionMsg] = useState('');

  // Requests state
  const [requests, setRequests] = useState([]);
  const [requestsCount, setRequestsCount] = useState(0);
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [feedback, setFeedback] = useState(null);

  // Selected request detail
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState('');

  // My stock state
  const [stockLots, setStockLots] = useState([]);
  const [stockCount, setStockCount] = useState(0);
  const [selectedLot, setSelectedLot] = useState(null);
  const [lotDetailLoading, setLotDetailLoading] = useState(false);

  // Create request modal state
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    warehouse_id: '',
    expected_arrival: '',
    courier: '',
    tracking_reference: '',
    notes: '',
    reason: '',
    items: [{ ...EMPTY_CREATE_ITEM }],
  });
  const [createFieldErrors, setCreateFieldErrors] = useState({});
  const [createItemErrors, setCreateItemErrors] = useState([]);
  const [createFormError, setCreateFormError] = useState('');
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [duplicateVariantWarning, setDuplicateVariantWarning] = useState('');

  // Optional seller price preview state (POST /api/warehouse/estimate/)
  const [previewQuote, setPreviewQuote] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  // State-dependent action dialog state ('cancel' | 'dispatch' | 'acknowledge' | 'dispute')
  const [actionModal, setActionModal] = useState(null);
  const [actionForm, setActionForm] = useState({
    courier: '',
    tracking_reference: '',
    reason: '',
  });
  const [actionFieldErrors, setActionFieldErrors] = useState({});
  const [actionFormError, setActionFormError] = useState('');
  const [actionSubmitting, setActionSubmitting] = useState(false);

  // Seller "Confirm goods received back" (`POST /api/warehouse/storage-requests/<pk>/confirm-return/`) dialog state
  const [confirmReturnModal, setConfirmReturnModal] = useState(null); // { request }
  const [confirmReturnForm, setConfirmReturnForm] = useState({
    receipt_reference: '',
    note: '',
  });
  const [confirmReturnFieldErrors, setConfirmReturnFieldErrors] = useState({});
  const [confirmReturnGeneralError, setConfirmReturnGeneralError] =
    useState('');
  const [confirmReturnSubmitting, setConfirmReturnSubmitting] = useState(false);
  const [confirmReturnResult, setConfirmReturnResult] = useState(null);

  const openConfirmReturnModal = (req) => {
    setConfirmReturnModal({ request: req });
    setConfirmReturnForm({ receipt_reference: '', note: '' });
    setConfirmReturnFieldErrors({});
    setConfirmReturnGeneralError('');
  };

  const handleConfirmReturnSubmit = async (e) => {
    e.preventDefault();
    if (!confirmReturnModal?.request || confirmReturnSubmitting) return;
    setConfirmReturnFieldErrors({});
    setConfirmReturnGeneralError('');
    setConfirmReturnSubmitting(true);

    const reqId = confirmReturnModal.request.id;
    try {
      const res = await apiRequest(
        `/api/warehouse/storage-requests/${reqId}/confirm-return/`,
        {
          method: 'POST',
          body: JSON.stringify({
            receipt_reference: confirmReturnForm.receipt_reference,
            note: confirmReturnForm.note,
          }),
        }
      );
      setConfirmReturnModal(null);
      setConfirmReturnResult(res);
      setFeedback({
        type: 'success',
        text: `Confirmed goods received back for Request #${reqId} (Receipt reference: ${res.receipt_reference}).`,
      });
      const updated = await apiRequest(
        `/api/warehouse/storage-requests/${reqId}/`
      ).catch(() => null);
      if (updated) {
        setSelectedRequest(updated);
      } else {
        setSelectedRequest((prev) =>
          prev && prev.id === reqId
            ? { ...prev, handback_confirmed_at: res.handback_confirmed_at }
            : prev
        );
      }
      await loadData();
    } catch (err) {
      const parsed = parseWarehouseApiError(err, [
        'receipt_reference',
        'note',
      ]);
      setConfirmReturnFieldErrors(parsed.fieldErrors);
      if (Object.keys(parsed.fieldErrors).length === 0 || err?.status === 409) {
        setConfirmReturnGeneralError(parsed.generalError);
      }
    } finally {
      setConfirmReturnSubmitting(false);
    }
  };

  const authNavRef = useRef({ logout, navigate, vendorProfile });
  authNavRef.current = { logout, navigate, vendorProfile };

  const handleUnauthorized = useCallback(async () => {
    if (authNavRef.current.logout) await authNavRef.current.logout();
    authNavRef.current.navigate('/login', { replace: true });
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    setErrorMsg('');

    try {
      const [reqRes, stockRes, prodRes] = await Promise.all([
        apiRequest('/api/warehouse/storage-requests/'),
        apiRequest('/api/warehouse/my-stock/'),
        apiRequest('/api/products/vendor/products/').catch(() => []),
      ]);

      const reqList = Array.isArray(reqRes) ? reqRes : reqRes?.results || [];
      setRequests(reqList);
      setRequestsCount(
        typeof reqRes?.count === 'number' ? reqRes.count : reqList.length
      );

      const lotsList = Array.isArray(stockRes)
        ? stockRes
        : stockRes?.results || [];
      setStockLots(lotsList);
      setStockCount(
        typeof stockRes?.count === 'number' ? stockRes.count : lotsList.length
      );

      // Extract real variants from seller's products
      const prodList = Array.isArray(prodRes)
        ? prodRes
        : prodRes?.results || [];
      const flattenedVariants = [];
      for (const prod of prodList) {
        if (prod.is_active === false) continue;
        const vars = Array.isArray(prod.variants) ? prod.variants : [];
        for (const v of vars) {
          if (v.is_active === false) continue;
          flattenedVariants.push({
            id: v.id,
            sku_code: v.sku_code || v.sku || `VAR-${v.id}`,
            product_id: prod.id,
            product_name: prod.name,
            attributes: v.attributes || {},
          });
        }
      }
      setSellerVariants(flattenedVariants);

      // Load available warehouses (returns 403 if seller may_sell is false)
      try {
        const availRes = await apiRequest('/api/warehouse/available/');
        const availList = Array.isArray(availRes)
          ? availRes
          : availRes?.results || [];
        setAvailableWarehouses(availList);
        const vp = authNavRef.current.vendorProfile;
        if (vp?.may_sell === false) {
          setSellingRestrictionMsg(
            vp.control_reason ||
              'This seller cannot create storage requests while selling is disabled.'
          );
        } else {
          setSellingRestrictionMsg('');
        }
      } catch (availErr) {
        if (availErr?.status === 401) {
          await handleUnauthorized();
          return;
        }
        if (availErr?.status === 403) {
          const vp = authNavRef.current.vendorProfile;
          const msg =
            availErr?.data?.detail ||
            vp?.control_reason ||
            'This seller cannot create storage requests while selling is disabled.';
          setSellingRestrictionMsg(String(msg));
          setAvailableWarehouses([]);
        } else {
          throw availErr;
        }
      }
    } catch (err) {
      if (err?.status === 401) {
        await handleUnauthorized();
        return;
      }
      const { formError } = parseWarehouseApiError(err);
      setErrorMsg(formError || 'Failed to load warehouse storage data.');
    } finally {
      setLoading(false);
    }
  }, [handleUnauthorized, vendorProfile?.may_sell, vendorProfile?.control_reason]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const warehouseMap = useMemo(() => {
    const map = {};
    for (const w of availableWarehouses) {
      map[w.id] = w;
    }
    return map;
  }, [availableWarehouses]);

  const formatWarehouseLabel = (whId) => {
    const w = warehouseMap[whId];
    if (w) {
      return `${w.name} (${w.code}${w.city ? `, ${w.city}` : ''})`;
    }
    return `Warehouse #${whId}`;
  };

  const filteredRequests = useMemo(() => {
    if (!statusFilter) return requests;
    return requests.filter((r) => r.status === statusFilter);
  }, [requests, statusFilter]);

  const cannotSell =
    Boolean(sellingRestrictionMsg) || vendorProfile?.may_sell === false;

  // Fetch single request detail from GET /api/warehouse/storage-requests/{id}/
  const fetchRequestDetail = useCallback(
    async (requestId) => {
      setDetailLoading(true);
      setDetailError('');
      try {
        const data = await apiRequest(
          `/api/warehouse/storage-requests/${requestId}/`
        );
        setSelectedRequest(data);
        setRequests((prev) =>
          prev.map((r) => (r.id === data.id ? data : r))
        );
      } catch (err) {
        if (err?.status === 401) {
          await handleUnauthorized();
          return;
        }
        if (err?.status === 404) {
          setDetailError('Storage request not found.');
        } else {
          const { formError } = parseWarehouseApiError(err);
          setDetailError(formError || 'Failed to load storage request detail.');
        }
      } finally {
        setDetailLoading(false);
      }
    },
    [handleUnauthorized]
  );

  useEffect(() => {
    if (routeRequestId && !Number.isNaN(routeRequestId)) {
      fetchRequestDetail(routeRequestId);
    }
  }, [routeRequestId, fetchRequestDetail]);

  const openLotDetail = async (lotId) => {
    setLotDetailLoading(true);
    try {
      const data = await apiRequest(`/api/warehouse/my-stock/${lotId}/`);
      setSelectedLot(data);
    } catch (err) {
      if (err?.status === 401) {
        await handleUnauthorized();
        return;
      }
      const { formError } = parseWarehouseApiError(err);
      setFeedback({ type: 'error', text: formError });
    } finally {
      setLotDetailLoading(false);
    }
  };

  // Create storage request modal handlers
  const openCreateModal = () => {
    if (cannotSell) return;
    setCreateForm({
      warehouse_id:
        availableWarehouses.length === 1
          ? String(availableWarehouses[0].id)
          : '',
      expected_arrival: '',
      courier: '',
      tracking_reference: '',
      notes: '',
      reason: '',
      items: [
        {
          ...EMPTY_CREATE_ITEM,
          variant_id:
            sellerVariants.length === 1 ? String(sellerVariants[0].id) : '',
        },
      ],
    });
    setCreateFieldErrors({});
    setCreateItemErrors([]);
    setCreateFormError('');
    setDuplicateVariantWarning('');
    setPreviewQuote(null);
    setPreviewLoading(false);
    setFeedback(null);
    setCreateOpen(true);
  };

  const handleCreateFieldChange = (field, value) => {
    setCreateForm((prev) => ({ ...prev, [field]: value }));
    setPreviewQuote(null);
    if (createFieldErrors[field]) {
      setCreateFieldErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
    if (createFormError) setCreateFormError('');
  };

  const handleItemChange = (index, field, value) => {
    setDuplicateVariantWarning('');
    setPreviewQuote(null);
    if (field === 'variant_id' && value) {
      const alreadyUsed = createForm.items.some(
        (row, idx) => idx !== index && String(row.variant_id) === String(value)
      );
      if (alreadyUsed) {
        setDuplicateVariantWarning(
          'Duplicate variants are not allowed in one storage request.'
        );
        return;
      }
    }
    setCreateForm((prev) => {
      const updated = prev.items.map((row, idx) =>
        idx === index ? { ...row, [field]: value } : row
      );
      return { ...prev, items: updated };
    });
    if (createItemErrors[index]?.[field] || createItemErrors[index]?._error) {
      setCreateItemErrors((prev) => {
        const next = [...prev];
        if (next[index]) {
          next[index] = { ...next[index] };
          delete next[index][field];
          delete next[index]._error;
        }
        return next;
      });
    }
    if (createFieldErrors.items) {
      setCreateFieldErrors((prev) => {
        const next = { ...prev };
        delete next.items;
        return next;
      });
    }
    if (createFormError) setCreateFormError('');
  };

  const handleAddItemRow = () => {
    setDuplicateVariantWarning('');
    setPreviewQuote(null);
    setCreateForm((prev) => ({
      ...prev,
      items: [...prev.items, { ...EMPTY_CREATE_ITEM }],
    }));
  };

  const handleRemoveItemRow = (index) => {
    setDuplicateVariantWarning('');
    setPreviewQuote(null);
    setCreateForm((prev) => ({
      ...prev,
      items: prev.items.filter((_, idx) => idx !== index),
    }));
    setCreateItemErrors((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleCheckPrice = async () => {
    setPreviewLoading(true);
    setPreviewQuote(null);
    setCreateFieldErrors({});
    setCreateItemErrors([]);
    setCreateFormError('');
    setDuplicateVariantWarning('');

    const chosenIds = createForm.items
      .map((r) => String(r.variant_id).trim())
      .filter(Boolean);
    if (chosenIds.length !== new Set(chosenIds).size) {
      setDuplicateVariantWarning(
        'Duplicate variants are not allowed in one storage request.'
      );
      setPreviewLoading(false);
      return;
    }

    const payload = {
      warehouse_id: createForm.warehouse_id
        ? Number(createForm.warehouse_id)
        : null,
      expected_arrival: createForm.expected_arrival,
      items: createForm.items.map((r) => ({
        variant_id:
          String(r.variant_id).trim() === '' ? null : Number(r.variant_id),
        quantity:
          String(r.quantity).trim() === '' ? null : Number(r.quantity),
        declared_length_cm: r.declared_length_cm,
        declared_width_cm: r.declared_width_cm,
        declared_height_cm: r.declared_height_cm,
        declared_weight_kg: r.declared_weight_kg,
        expected_storage_days:
          String(r.expected_storage_days).trim() === ''
            ? null
            : Number(r.expected_storage_days),
      })),
    };

    try {
      const res = await apiRequest('/api/warehouse/estimate/', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      setPreviewQuote(res);
    } catch (err) {
      if (err?.status === 401) {
        await handleUnauthorized();
        return;
      }
      const { fieldErrors, itemErrors, formError } = parseWarehouseApiError(
        err,
        CREATE_KNOWN_FIELDS
      );
      setCreateFieldErrors(fieldErrors);
      setCreateItemErrors(itemErrors);
      if (
        err?.status === 409 ||
        err?.data?.detail ||
        (Object.keys(fieldErrors).length === 0 && itemErrors.length === 0)
      ) {
        setCreateFormError(formError);
      }
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setCreateSubmitting(true);
    setCreateFieldErrors({});
    setCreateItemErrors([]);
    setCreateFormError('');
    setDuplicateVariantWarning('');

    // Block duplicate non-empty variants in the form
    const chosenIds = createForm.items
      .map((r) => String(r.variant_id).trim())
      .filter(Boolean);
    if (chosenIds.length !== new Set(chosenIds).size) {
      setDuplicateVariantWarning(
        'Duplicate variants are not allowed in one storage request.'
      );
      setCreateSubmitting(false);
      return;
    }

    const payload = {
      warehouse_id: createForm.warehouse_id
        ? Number(createForm.warehouse_id)
        : null,
      expected_arrival: createForm.expected_arrival,
      courier: createForm.courier,
      tracking_reference: createForm.tracking_reference,
      notes: createForm.notes,
      reason: createForm.reason,
      items: createForm.items.map((r) => ({
        variant_id:
          String(r.variant_id).trim() === '' ? null : Number(r.variant_id),
        quantity:
          String(r.quantity).trim() === '' ? null : Number(r.quantity),
        declared_length_cm: r.declared_length_cm,
        declared_width_cm: r.declared_width_cm,
        declared_height_cm: r.declared_height_cm,
        declared_weight_kg: r.declared_weight_kg,
        expected_storage_days:
          String(r.expected_storage_days).trim() === ''
            ? null
            : Number(r.expected_storage_days),
      })),
    };

    try {
      const created = await apiRequest('/api/warehouse/storage-requests/', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      setCreateOpen(false);
      await loadData();
      setSelectedRequest(created);
      setFeedback({
        type: 'success',
        text: `Storage request #${created.id} submitted (${formatStorageStatusLabel(
          created.status
        )}).`,
      });
    } catch (err) {
      if (err?.status === 401) {
        await handleUnauthorized();
        return;
      }
      if (err?.status === 403) {
        const msg =
          err?.data?.detail ||
          'This seller cannot create storage requests while selling is disabled.';
        setSellingRestrictionMsg(String(msg));
        setCreateFormError(String(msg));
        return;
      }
      const { fieldErrors, itemErrors, formError } = parseWarehouseApiError(
        err,
        CREATE_KNOWN_FIELDS
      );
      setCreateFieldErrors(fieldErrors);
      setCreateItemErrors(itemErrors);
      if (Object.keys(fieldErrors).length === 0 && itemErrors.length === 0) {
        setCreateFormError(formError);
      } else if (err?.data?.detail) {
        setCreateFormError(formError);
      }
    } finally {
      setCreateSubmitting(false);
    }
  };

  // Open state-dependent action modal
  const openActionModal = (type, reqObj) => {
    setFeedback(null);
    setActionModal({ type, request: reqObj });
    setActionForm({
      courier: reqObj.courier_name || '',
      tracking_reference: reqObj.tracking_reference || '',
      reason: '',
    });
    setActionFieldErrors({});
    setActionFormError('');
  };

  const handleActionSubmit = async (e) => {
    e.preventDefault();
    if (!actionModal) return;

    setActionSubmitting(true);
    setActionFieldErrors({});
    setActionFormError('');

    const { type, request } = actionModal;
    let endpoint = '';
    let body = {};

    if (type === 'cancel') {
      endpoint = `/api/warehouse/storage-requests/${request.id}/cancel/`;
      body = { reason: actionForm.reason };
    } else if (type === 'dispatch') {
      endpoint = `/api/warehouse/storage-requests/${request.id}/dispatch/`;
      body = {
        courier: actionForm.courier,
        tracking_reference: actionForm.tracking_reference,
        reason: actionForm.reason,
      };
    } else if (type === 'acknowledge') {
      endpoint = `/api/warehouse/storage-requests/${request.id}/acknowledge/`;
      body = { reason: actionForm.reason };
    } else if (type === 'dispute') {
      endpoint = `/api/warehouse/storage-requests/${request.id}/dispute/`;
      body = { reason: actionForm.reason };
    }

    try {
      const updated = await apiRequest(endpoint, {
        method: 'POST',
        body: JSON.stringify(body),
      });
      setActionModal(null);
      setSelectedRequest(updated);
      await loadData();
      setFeedback({
        type: 'success',
        text: `Request #${updated.id} updated (${formatStorageStatusLabel(
          updated.status
        )}).`,
      });
    } catch (err) {
      if (err?.status === 401) {
        await handleUnauthorized();
        return;
      }
      const { fieldErrors, formError } = parseWarehouseApiError(
        err,
        ACTION_KNOWN_FIELDS
      );
      if (err?.status === 409) {
        setActionFormError(
          formError || 'Request state changed on the server. Refetching latest state.'
        );
        await fetchRequestDetail(request.id);
        await loadData();
        return;
      }
      setActionFieldErrors(fieldErrors);
      if (Object.keys(fieldErrors).length === 0) {
        setActionFormError(formError);
      }
    } finally {
      setActionSubmitting(false);
    }
  };

  return (
    <div data-testid="seller-warehouse-view" className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-3xl border border-[#EAE3DC] p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <Warehouse className="w-5 h-5 text-[#FA661C]" />
            <span className="text-[11px] font-black uppercase tracking-wider text-[#FA661C]">
              Platform Warehouse Custody
            </span>
          </div>
          <h1 className="font-['Outfit'] font-extrabold text-xl sm:text-2xl text-[#1A2420]">
            Warehouse Storage & Inbound Requests
          </h1>
          <p className="text-xs text-[#6B6058]">
            Send inventory to a platform warehouse, track inbound receiving counts, and inspect your warehouse stock lots.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={loadData}
            disabled={loading}
            data-testid="seller-warehouse-refresh-btn"
            className="px-3.5 py-2 rounded-xl border border-[#EAE3DC] bg-white hover:bg-[#FFF3EC] text-xs font-bold text-[#1A2420] flex items-center space-x-1.5 cursor-pointer"
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
            onClick={openCreateModal}
            disabled={cannotSell}
            data-testid="open-create-storage-request-btn"
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-2xs ${
              cannotSell
                ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                : 'bg-[#FA661C] hover:bg-[#E0530B] text-white cursor-pointer'
            }`}
          >
            <Plus className="w-4 h-4" />
            <span>New Storage Request</span>
          </button>
        </div>
      </div>

      {/* Explicit Custody & Phase Scope Notice */}
      <div
        data-testid="seller-warehouse-custody-notice"
        className="p-4 rounded-2xl border border-[#EAE3DC] bg-[#FFF8F2] flex items-start space-x-3 text-xs text-[#6B6058]"
      >
        <Info className="w-4 h-4 text-[#FA661C] shrink-0 mt-0.5" />
        <p>
          <strong className="text-[#1A2420]">Warehouse Custody Stock Only:</strong>{' '}
          Quantities shown here reflect stock physically held in platform warehouses. They do not alter your product listing stock or customer checkout availability.
        </p>
      </div>

      {/* Selling Restriction Alert (403 / may_sell === false) */}
      {cannotSell && (
        <div
          data-testid="seller-warehouse-restriction-alert"
          role="alert"
          className="p-5 rounded-2xl border border-[#FCA5A5] bg-[#FFF3F3] flex items-start space-x-3"
        >
          <ShieldAlert className="w-5 h-5 text-[#DC2626] shrink-0 mt-0.5" />
          <div className="space-y-1 text-xs">
            <h2 className="font-bold text-sm text-[#991B1B]">
              New Storage Requests Disabled
            </h2>
            <p className="text-[#7F1D1D] font-medium">
              {sellingRestrictionMsg ||
                'This seller cannot create storage requests while selling is disabled.'}
            </p>
            {vendorProfile?.control_reason &&
              vendorProfile.control_reason !== sellingRestrictionMsg && (
                <p className="text-[#7F1D1D]">
                  Reason: <strong>{vendorProfile.control_reason}</strong>
                </p>
              )}
          </div>
        </div>
      )}

      {/* Feedback Banner */}
      {feedback && (
        <div
          data-testid="seller-warehouse-feedback"
          role="status"
          className={`p-4 rounded-2xl border flex items-center justify-between text-xs font-bold ${
            feedback.type === 'error'
              ? 'bg-[#FFF3F3] border-[#FCA5A5] text-[#991B1B]'
              : 'bg-[#ECFDF5] border-[#6EE7B7] text-[#065F46]'
          }`}
        >
          <div className="flex items-center space-x-2">
            {feedback.type === 'error' ? (
              <AlertCircle className="w-4 h-4 shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            )}
            <span>{feedback.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-xs underline ml-4 cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Error State */}
      {errorMsg && (
        <div
          data-testid="seller-warehouse-error"
          role="alert"
          className="p-5 rounded-2xl border border-[#FCA5A5] bg-[#FFF3F3] flex items-center justify-between text-xs text-[#991B1B]"
        >
          <div className="flex items-center space-x-2.5">
            <AlertCircle className="w-5 h-5 text-[#DC2626] shrink-0" />
            <div>
              <span className="font-bold block text-sm">
                Unable to Load Warehouse Storage Data
              </span>
              <span>{errorMsg}</span>
            </div>
          </div>
          <button
            type="button"
            onClick={loadData}
            className="px-3.5 py-1.5 rounded-xl bg-[#DC2626] text-white font-bold cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* Sub-navigation Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-[#EAE3DC] pb-3">
        <button
          type="button"
          onClick={() => setActiveTab('requests')}
          data-testid="seller-wh-tab-requests"
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-2 cursor-pointer transition-colors ${
            activeTab === 'requests'
              ? 'bg-[#FA661C] text-white'
              : 'bg-white border border-[#EAE3DC] text-[#6B6058] hover:text-[#1A2420]'
          }`}
        >
          <Truck className="w-3.5 h-3.5" />
          <span>My Storage Requests ({requestsCount})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('stock')}
          data-testid="seller-wh-tab-stock"
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-2 cursor-pointer transition-colors ${
            activeTab === 'stock'
              ? 'bg-[#FA661C] text-white'
              : 'bg-white border border-[#EAE3DC] text-[#6B6058] hover:text-[#1A2420]'
          }`}
        >
          <Package className="w-3.5 h-3.5" />
          <span>My Warehouse Stock ({stockCount})</span>
        </button>

        {handoversAvailable && (
          <button
            type="button"
            onClick={() => setActiveTab('handovers')}
            data-testid="seller-wh-tab-handovers"
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-2 cursor-pointer transition-colors ${
              activeTab === 'handovers'
                ? 'bg-[#FA661C] text-white'
                : 'bg-white border border-[#EAE3DC] text-[#6B6058] hover:text-[#1A2420]'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Handovers to Hub</span>
          </button>
        )}

        {returnsAvailable && (
          <button
            type="button"
            onClick={() => setActiveTab('returns')}
            data-testid="seller-wh-tab-returns"
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-2 cursor-pointer transition-colors ${
              activeTab === 'returns'
                ? 'bg-[#FA661C] text-white'
                : 'bg-white border border-[#EAE3DC] text-[#6B6058] hover:text-[#1A2420]'
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            <span>Returned Goods</span>
          </button>
        )}
      </div>

      {/* TAB 1: MY STORAGE REQUESTS */}
      {activeTab === 'requests' && (
        <div
          data-testid="seller-requests-panel"
          className="bg-white rounded-3xl border border-[#EAE3DC] p-5 sm:p-6 shadow-xs space-y-5"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <h2 className="font-['Outfit'] font-bold text-base text-[#1A2420]">
              Inbound Storage Requests
            </h2>

            <div className="flex items-center space-x-2">
              <label
                htmlFor="seller-request-status-filter"
                className="text-xs font-bold text-[#6B6058]"
              >
                Status:
              </label>
              <select
                id="seller-request-status-filter"
                data-testid="seller-request-status-filter"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-[#EAE3DC] text-xs font-semibold text-[#1A2420] bg-white"
              >
                <option value="">All Statuses</option>
                {STORAGE_REQUEST_STATUSES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {loading ? (
            <div className="py-10 text-center text-xs text-[#6B6058]">
              Loading storage requests...
            </div>
          ) : filteredRequests.length === 0 ? (
            <div
              data-testid="seller-requests-empty"
              className="py-10 text-center space-y-2 border border-dashed border-[#EAE3DC] rounded-2xl"
            >
              <Truck className="w-7 h-7 text-[#6B6058] mx-auto opacity-60" />
              <p className="text-xs font-bold text-[#1A2420]">
                No storage requests found
              </p>
              <p className="text-xs text-[#6B6058]">
                {statusFilter
                  ? 'No requests match the selected status filter.'
                  : 'You have not submitted any warehouse storage requests yet.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-[#EAE3DC] text-[#6B6058] uppercase text-[10px]">
                    <th className="py-2.5 px-3">Request ID</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Warehouse</th>
                    <th className="py-2.5 px-3">Items</th>
                    <th className="py-2.5 px-3">Expected Arrival</th>
                    <th className="py-2.5 px-3">Created</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EAE3DC]/60">
                  {filteredRequests.map((req) => {
                    const itemsList = Array.isArray(req.items) ? req.items : [];
                    return (
                      <tr
                        key={req.id}
                        data-testid={`seller-request-row-${req.id}`}
                        className="hover:bg-[#FFF8F2]/60"
                      >
                        <td className="py-3 px-3 font-mono font-bold text-[#1A2420]">
                          #{req.id}
                        </td>
                        <td className="py-3 px-3">
                          <span
                            data-testid={`seller-request-status-${req.id}`}
                            className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${getStorageStatusBadgeClass(
                              req.status
                            )}`}
                          >
                            {formatStorageStatusLabel(req.status)}
                          </span>
                        </td>
                        <td className="py-3 px-3 font-semibold text-[#1A2420]">
                          {formatWarehouseLabel(req.warehouse)}
                        </td>
                        <td className="py-3 px-3 text-[#6B6058]">
                          {itemsList.length === 0 ? (
                            '0 SKUs'
                          ) : (
                            <div className="space-y-0.5">
                              {itemsList.map((it) => (
                                <div key={it.id} className="font-mono text-[11px]">
                                  <span className="font-bold text-[#1A2420]">
                                    {it.sku_snapshot}
                                  </span>{' '}
                                  × {it.requested_quantity}
                                </div>
                              ))}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-3 font-mono text-[#1A2420]">
                          {req.expected_arrival || '—'}
                        </td>
                        <td className="py-3 px-3 text-[#6B6058]">
                          {formatDateTime(req.created_at)}
                        </td>
                        <td className="py-3 px-3 text-right space-x-2">
                          <button
                            type="button"
                            onClick={() => fetchRequestDetail(req.id)}
                            data-testid={`seller-view-request-btn-${req.id}`}
                            className="px-3 py-1.5 rounded-lg border border-[#EAE3DC] bg-white hover:bg-[#FFF3EC] font-bold text-[#FA661C] inline-flex items-center space-x-1 cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Details</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Selected Request Detail Panel */}
          {(detailLoading || detailError || selectedRequest) && (
            <div
              data-testid="seller-request-detail-panel"
              className="mt-6 pt-6 border-t border-[#EAE3DC] space-y-5"
            >
              {detailLoading ? (
                <p className="text-xs text-[#6B6058]">
                  Loading request details...
                </p>
              ) : detailError ? (
                <div
                  role="alert"
                  className="p-4 rounded-2xl bg-[#FFF3F3] border border-[#FCA5A5] text-xs text-[#991B1B]"
                >
                  {detailError}
                </div>
              ) : (
                selectedRequest && (() => {
                  const validSellerActions = getValidStorageRequestActions(
                    selectedRequest.status,
                    'seller',
                    selectedRequest.seller_discrepancy_action
                  );
                  const quote = selectedRequest.quote_snapshot;
                  const hasQuote =
                    quote &&
                    typeof quote === 'object' &&
                    Object.keys(quote).length > 0;
                  const quoteDate =
                    selectedRequest.quote_as_of_date || quote?.date || '—';
                  const quoteVersion =
                    selectedRequest.quote_rate_card_version ??
                    quote?.rate_card_version ??
                    '—';
                  const quoteCurrency = quote?.currency || 'INR';
                  const mismatchesList = Array.isArray(
                    selectedRequest.measurement_mismatches
                  )
                    ? selectedRequest.measurement_mismatches
                    : [];
                  const mismatchByItemId = {};
                  mismatchesList.forEach((m) => {
                    if (m && m.item_id != null) {
                      mismatchByItemId[m.item_id] = m.dimensions || {};
                    }
                  });
                  const hasMeasuredData = (selectedRequest.items || []).some(
                    (it) =>
                      it.measured_length_cm != null ||
                      it.measured_width_cm != null ||
                      it.measured_height_cm != null ||
                      it.measured_weight_kg != null
                  );

                  return (
                    <div className="space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div className="flex items-center space-x-3">
                          <h3 className="font-['Outfit'] font-extrabold text-lg text-[#1A2420]">
                            Storage Request #{selectedRequest.id}
                          </h3>
                          <span
                            data-testid="seller-detail-status-badge"
                            className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${getStorageStatusBadgeClass(
                              selectedRequest.status
                            )}`}
                          >
                            {formatStorageStatusLabel(selectedRequest.status)}
                          </span>
                        </div>

                        {/* State-Dependent Seller Action Buttons (Strictly following Status Table) */}
                        <div className="flex flex-wrap items-center gap-2">
                          {validSellerActions.includes('cancel') && (
                            <button
                              type="button"
                              onClick={() =>
                                openActionModal('cancel', selectedRequest)
                              }
                              data-testid="seller-cancel-request-btn"
                              className="px-3.5 py-1.5 rounded-xl bg-[#DC2626] hover:bg-[#B91C1C] text-white text-xs font-bold flex items-center space-x-1.5 cursor-pointer"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              <span>Cancel Request</span>
                            </button>
                          )}

                          {validSellerActions.includes('dispatch') && (
                            <button
                              type="button"
                              onClick={() =>
                                openActionModal('dispatch', selectedRequest)
                              }
                              data-testid="seller-dispatch-request-btn"
                              className="px-3.5 py-1.5 rounded-xl bg-[#FA661C] hover:bg-[#E0530B] text-white text-xs font-bold flex items-center space-x-1.5 cursor-pointer"
                            >
                              <Truck className="w-3.5 h-3.5" />
                              <span>Mark Dispatched</span>
                            </button>
                          )}

                          {validSellerActions.includes('acknowledge') && (
                            <button
                              type="button"
                              onClick={() =>
                                openActionModal('acknowledge', selectedRequest)
                              }
                              data-testid="seller-acknowledge-discrepancy-btn"
                              className="px-3.5 py-1.5 rounded-xl bg-[#059669] hover:bg-[#047857] text-white text-xs font-bold cursor-pointer"
                            >
                              Acknowledge Discrepancy
                            </button>
                          )}

                          {validSellerActions.includes('dispute') && (
                            <button
                              type="button"
                              onClick={() =>
                                openActionModal('dispute', selectedRequest)
                              }
                              data-testid="seller-dispute-discrepancy-btn"
                              className="px-3.5 py-1.5 rounded-xl bg-[#DC2626] hover:bg-[#B91C1C] text-white text-xs font-bold cursor-pointer"
                            >
                              Dispute Discrepancy
                            </button>
                          )}

                          {canSellerConfirmHandback(selectedRequest) && (
                            <button
                              type="button"
                              onClick={() =>
                                openConfirmReturnModal(selectedRequest)
                              }
                              data-testid="seller-confirm-return-btn"
                              className="px-3.5 py-1.5 rounded-xl bg-[#6B21A8] hover:bg-[#581C87] text-white text-xs font-bold cursor-pointer"
                            >
                              Confirm goods received back
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => setSelectedRequest(null)}
                            className="px-3 py-1.5 rounded-xl border border-[#EAE3DC] text-xs font-bold text-[#6B6058] hover:text-[#1A2420] cursor-pointer"
                          >
                            Close View
                          </button>
                        </div>
                      </div>

                      {/* Refund Status Banner (replaces outdated "not been processed" text) */}
                      {hasNonZeroMoneyString(selectedRequest.refunded_amount) ? (
                        <div
                          data-testid="seller-fee-refunded-banner"
                          role="status"
                          className="p-4 rounded-2xl border border-[#6EE7B7] bg-[#ECFDF5] flex items-start space-x-3 text-xs text-[#065F46]"
                        >
                          <CheckCircle2 className="w-4 h-4 text-[#059669] shrink-0 mt-0.5" />
                          <span className="font-bold">
                            The warehouse fee was refunded to your wallet.
                          </span>
                        </div>
                      ) : selectedRequest.refund_due === true ? (
                        <div
                          data-testid="seller-refund-due-banner"
                          role="status"
                          className="p-4 rounded-2xl border border-[#F59E0B] bg-[#FFFBEB] flex items-start space-x-3 text-xs text-[#92400E]"
                        >
                          <Info className="w-4 h-4 text-[#D97706] shrink-0 mt-0.5" />
                          <span className="font-bold">
                            A refund is due and will be recorded by the platform.
                          </span>
                        </div>
                      ) : null}

                      {/* Charged & Refunded Amounts (shown ONLY when server sends non-zero amounts) */}
                      {(hasNonZeroMoneyString(selectedRequest.charged_amount) ||
                        hasNonZeroMoneyString(selectedRequest.refunded_amount)) && (
                        <div
                          data-testid="seller-charge-refund-summary"
                          className="flex flex-wrap items-center gap-3 p-3.5 rounded-2xl border border-[#EAE3DC] bg-[#FFF8F2] text-xs"
                        >
                          {hasNonZeroMoneyString(selectedRequest.charged_amount) && (
                            <span
                              data-testid="seller-charged-amount"
                              className="px-3 py-1 rounded-xl bg-white border border-[#EAE3DC] font-mono font-bold text-[#1A2420]"
                            >
                              Charged: {selectedRequest.charged_amount}
                            </span>
                          )}
                          {hasNonZeroMoneyString(selectedRequest.refunded_amount) && (
                            <span
                              data-testid="seller-refunded-amount"
                              className="px-3 py-1 rounded-xl bg-[#ECFDF5] border border-[#6EE7B7] font-mono font-bold text-[#065F46]"
                            >
                              Refunded: {selectedRequest.refunded_amount}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Decline & Recall Status Panel (recall_pending / recalled / decline_reason) */}
                      {(selectedRequest.status === 'recall_pending' ||
                        selectedRequest.status === 'recalled' ||
                        selectedRequest.decline_reason) && (
                        <div
                          data-testid="seller-decline-recall-panel"
                          className="p-4 rounded-2xl border border-[#FCA5A5] bg-[#FFF3F3] space-y-2 text-xs"
                        >
                          {selectedRequest.status === 'recall_pending' && (
                            <div
                              data-testid="seller-recall-pending-notice"
                              className="font-extrabold text-sm text-[#991B1B] flex items-center space-x-2"
                            >
                              <ShieldAlert className="w-4 h-4 text-[#DC2626] shrink-0" />
                              <span>
                                Please collect your goods — Recall Pending
                              </span>
                            </div>
                          )}

                          {selectedRequest.status === 'recalled' && (
                            <div
                              data-testid="seller-recalled-notice"
                              className="font-extrabold text-sm text-[#6B21A8]"
                            >
                              Goods Recalled (Handback Recorded)
                            </div>
                          )}

                          {selectedRequest.decline_reason && (
                            <div>
                              <span className="text-[#7F1D1D] font-semibold">
                                Manager Decline Reason:{' '}
                              </span>
                              <strong
                                data-testid="seller-decline-reason"
                                className="text-[#991B1B]"
                              >
                                {selectedRequest.decline_reason}
                              </strong>
                              {selectedRequest.declined_at && (
                                <span className="text-[#7F1D1D] ml-2">
                                  ({formatDateTime(selectedRequest.declined_at)})
                                </span>
                              )}
                            </div>
                          )}

                          {selectedRequest.status === 'recalled' && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-[#FCA5A5]/50">
                              <div>
                                <span className="text-[#7F1D1D] font-semibold">
                                  Handback Reference:{' '}
                                </span>
                                <strong
                                  data-testid="seller-recall-reference"
                                  className="font-mono text-[#1A2420]"
                                >
                                  {selectedRequest.recall_reference || '—'}
                                </strong>
                              </div>
                              <div>
                                <span className="text-[#7F1D1D] font-semibold">
                                  Handback Date:{' '}
                                </span>
                                <strong
                                  data-testid="seller-recalled-date"
                                  className="text-[#1A2420]"
                                >
                                  {formatDateTime(selectedRequest.recalled_at)}
                                </strong>
                              </div>
                            </div>
                          )}

                          {/* Confirmed Handback State & Returned Stock Summary */}
                          {selectedRequest.handback_confirmed_at && (
                            <div
                              data-testid="seller-handback-confirmed-panel"
                              className="mt-2 p-3 rounded-xl bg-[#ECFDF5] border border-[#6EE7B7] text-[#065F46] space-y-1"
                            >
                              <div className="font-bold flex items-center space-x-1.5">
                                <CheckCircle2 className="w-4 h-4 text-[#059669] shrink-0" />
                                <span>
                                  Goods return confirmed at{' '}
                                  {formatDateTime(
                                    selectedRequest.handback_confirmed_at
                                  )}
                                </span>
                              </div>
                              {confirmReturnResult &&
                                confirmReturnResult.request_id ===
                                  selectedRequest.id && (
                                  <div
                                    data-testid="seller-handback-receipt-ref"
                                    className="text-[11px] font-mono"
                                  >
                                    Receipt reference:{' '}
                                    {confirmReturnResult.receipt_reference}
                                  </div>
                                )}
                              <div
                                data-testid="seller-handback-returned-stock"
                                className="text-[11px]"
                              >
                                {(selectedRequest.items || []).map((it) => (
                                  <div key={it.id}>
                                    {it.product_name_snapshot} (
                                    {it.sku_snapshot}): Returned quantity{' '}
                                    <strong>
                                      {it.returned_quantity ?? 0}
                                    </strong>{' '}
                                    (Held: {it.held_quantity ?? 0})
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Stock Availability Truthfulness Notice for Mismatch / Discrepancy / Unreceived */}
                      {(selectedRequest.status === 'mismatch' ||
                        selectedRequest.status === 'discrepancy' ||
                        selectedRequest.status === 'recall_pending' ||
                        selectedRequest.status === 'recalled') && (
                        <div
                          data-testid="seller-stock-held-back-notice"
                          className="p-3.5 rounded-2xl border border-[#EAE3DC] bg-[#F9FAFB] text-xs text-[#374151] font-semibold"
                        >
                          Stock from this request is not marked as available warehouse inventory while the request is in{' '}
                          <span className="font-bold">
                            {formatStorageStatusLabel(selectedRequest.status)}
                          </span>{' '}
                          status.
                        </div>
                      )}

                      {/* Metadata Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 p-4 rounded-2xl bg-[#FFF8F2] border border-[#EAE3DC] text-xs">
                        <div>
                          <span className="text-[#6B6058] block">Warehouse</span>
                          <strong className="text-[#1A2420]">
                            {formatWarehouseLabel(selectedRequest.warehouse)}
                          </strong>
                        </div>
                        <div>
                          <span className="text-[#6B6058] block">
                            Expected Arrival
                          </span>
                          <strong className="font-mono text-[#1A2420]">
                            {selectedRequest.expected_arrival || '—'}
                          </strong>
                        </div>
                        <div>
                          <span className="text-[#6B6058] block">
                            Courier & Tracking
                          </span>
                          <strong className="text-[#1A2420]">
                            {selectedRequest.courier_name || '—'} •{' '}
                            <span className="font-mono">
                              {selectedRequest.tracking_reference || '—'}
                            </span>
                          </strong>
                        </div>
                        {selectedRequest.seller_notes && (
                          <div>
                            <span className="text-[#6B6058] block">
                              Seller Notes
                            </span>
                            <span className="text-[#1A2420]">
                              {selectedRequest.seller_notes}
                            </span>
                          </div>
                        )}
                        {selectedRequest.decision_reason && (
                          <div>
                            <span className="text-[#6B6058] block">
                              Warehouse Decision Reason
                            </span>
                            <strong className="text-[#1A2420]">
                              {selectedRequest.decision_reason}
                            </strong>
                          </div>
                        )}
                        {selectedRequest.manager_instructions && (
                          <div>
                            <span className="text-[#6B6058] block">
                              Receiving Instructions
                            </span>
                            <span className="text-[#1A2420]">
                              {selectedRequest.manager_instructions}
                            </span>
                          </div>
                        )}
                        {(selectedRequest.receiving_window_start ||
                          selectedRequest.receiving_window_end) && (
                          <div>
                            <span className="text-[#6B6058] block">
                              Receiving Window
                            </span>
                            <span className="text-[#1A2420]">
                              {formatDateTime(
                                selectedRequest.receiving_window_start
                              )}{' '}
                              –{' '}
                              {formatDateTime(
                                selectedRequest.receiving_window_end
                              )}
                            </span>
                          </div>
                        )}
                        {selectedRequest.receiving_notes && (
                          <div>
                            <span className="text-[#6B6058] block">
                              Receiving Notes
                            </span>
                            <span className="text-[#1A2420]">
                              {selectedRequest.receiving_notes}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Saved Price Quote Section (Verbatim from Server) */}
                      {hasQuote && (
                        <div
                          data-testid="seller-saved-quote-panel"
                          className="p-4 rounded-2xl border border-[#EAE3DC] bg-white space-y-3 text-xs"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#EAE3DC] pb-2.5">
                            <div className="flex items-center space-x-2">
                              <FileText className="w-4 h-4 text-[#FA661C]" />
                              <h4 className="font-['Outfit'] font-extrabold text-sm text-[#1A2420]">
                                Saved Price Quote
                              </h4>
                            </div>
                            <span
                              data-testid="seller-quote-caption"
                              className="font-mono font-semibold text-[#6B6058]"
                            >
                              as quoted on {quoteDate} using rate card version{' '}
                              {quoteVersion}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 p-3 rounded-xl bg-[#FFF8F2] border border-[#EAE3DC]">
                            <div>
                              <span className="text-[#6B6058] block text-[11px]">
                                Storage Charge
                              </span>
                              <strong
                                data-testid="seller-quote-storage-charge"
                                className="font-mono text-[#1A2420]"
                              >
                                {quoteCurrency} {quote.storage_charge ?? '—'}
                              </strong>
                            </div>
                            <div>
                              <span className="text-[#6B6058] block text-[11px]">
                                Handling Charge
                              </span>
                              <strong
                                data-testid="seller-quote-handling-charge"
                                className="font-mono text-[#1A2420]"
                              >
                                {quoteCurrency} {quote.handling_charge ?? '—'}
                              </strong>
                            </div>
                            <div>
                              <span className="text-[#6B6058] block text-[11px]">
                                Packing Charge
                              </span>
                              <strong
                                data-testid="seller-quote-packing-charge"
                                className="font-mono text-[#1A2420]"
                              >
                                {quoteCurrency} {quote.packing_charge ?? '—'}
                              </strong>
                            </div>
                            <div>
                              <span className="text-[#6B6058] block text-[11px]">
                                Minimum Charge Applied
                              </span>
                              <strong
                                data-testid="seller-quote-minimum-applied"
                                className="font-mono text-[#1A2420]"
                              >
                                {quoteCurrency}{' '}
                                {quote.minimum_charge_applied ?? '—'}
                              </strong>
                            </div>
                            <div>
                              <span className="text-[#6B6058] block text-[11px]">
                                Quote Total
                              </span>
                              <strong
                                data-testid="seller-quote-total"
                                className="font-mono text-sm text-[#FA661C]"
                              >
                                {quoteCurrency} {quote.total ?? '—'}
                              </strong>
                            </div>
                          </div>

                          {Array.isArray(quote.items) &&
                            quote.items.length > 0 && (
                              <div className="overflow-x-auto">
                                <table
                                  data-testid="seller-quote-lines-table"
                                  className="w-full text-left border-collapse text-xs"
                                >
                                  <thead>
                                    <tr className="border-b border-[#EAE3DC] text-[#6B6058] uppercase text-[10px]">
                                      <th className="py-2 px-2">Item / Variant</th>
                                      <th className="py-2 px-2">Size Band</th>
                                      <th className="py-2 px-2">Qty</th>
                                      <th className="py-2 px-2">
                                        Free / Billable Days
                                      </th>
                                      <th className="py-2 px-2">Storage</th>
                                      <th className="py-2 px-2">Handling</th>
                                      <th className="py-2 px-2">Packing</th>
                                      <th className="py-2 px-2 text-right">
                                        Line Total
                                      </th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-[#EAE3DC]/60">
                                    {quote.items.map((line, lIdx) => (
                                      <tr
                                        key={line.item_id ?? lIdx}
                                        data-testid={`seller-quote-line-${
                                          line.item_id ?? lIdx
                                        }`}
                                      >
                                        <td className="py-2 px-2 font-mono">
                                          Item #{line.item_id ?? '—'} (Variant #
                                          {line.variant_id ?? '—'})
                                        </td>
                                        <td className="py-2 px-2 font-semibold text-[#1A2420]">
                                          {line.band?.label || '—'}
                                        </td>
                                        <td className="py-2 px-2 font-mono">
                                          {line.quantity ?? '—'}
                                        </td>
                                        <td className="py-2 px-2 font-mono">
                                          {line.free_days_applied ?? 0} free /{' '}
                                          {line.billable_storage_days ?? '—'}{' '}
                                          billable
                                        </td>
                                        <td className="py-2 px-2 font-mono">
                                          {line.currency || quoteCurrency}{' '}
                                          {line.storage_charge}
                                        </td>
                                        <td className="py-2 px-2 font-mono">
                                          {line.currency || quoteCurrency}{' '}
                                          {line.handling_charge}
                                        </td>
                                        <td className="py-2 px-2 font-mono">
                                          {line.currency || quoteCurrency}{' '}
                                          {line.packing_charge}
                                        </td>
                                        <td className="py-2 px-2 font-mono font-bold text-right">
                                          {line.currency || quoteCurrency}{' '}
                                          {line.total}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            )}
                        </div>
                      )}

                      {/* Measurement Mismatches & Declared vs Measured Table */}
                      {(mismatchesList.length > 0 ||
                        selectedRequest.status === 'mismatch' ||
                        hasMeasuredData) && (
                        <div
                          data-testid="seller-measurement-mismatches-panel"
                          className="p-4 rounded-2xl border border-[#FCA5A5] bg-[#FFF3F3]/60 space-y-3 text-xs"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center space-x-2">
                              <Scale className="w-4 h-4 text-[#DC2626]" />
                              <h4 className="font-['Outfit'] font-extrabold text-sm text-[#991B1B]">
                                Declared vs. Measured Dimensions & Weight
                              </h4>
                            </div>
                            {selectedRequest.measurement_tolerance_percent !=
                              null && (
                              <span
                                data-testid="seller-measurement-tolerance"
                                className="px-2.5 py-0.5 rounded-full bg-white border border-[#FCA5A5] font-mono font-bold text-[#991B1B]"
                              >
                                Tolerance:{' '}
                                {selectedRequest.measurement_tolerance_percent}%
                              </span>
                            )}
                          </div>

                          <div className="overflow-x-auto bg-white rounded-xl border border-[#EAE3DC]">
                            <table
                              data-testid="seller-declared-vs-measured-table"
                              className="w-full text-left border-collapse text-xs"
                            >
                              <thead>
                                <tr className="border-b border-[#EAE3DC] text-[#6B6058] uppercase text-[10px]">
                                  <th className="py-2 px-3">Item</th>
                                  <th className="py-2 px-3">
                                    Length (cm) Declared → Measured
                                  </th>
                                  <th className="py-2 px-3">
                                    Width (cm) Declared → Measured
                                  </th>
                                  <th className="py-2 px-3">
                                    Height (cm) Declared → Measured
                                  </th>
                                  <th className="py-2 px-3">
                                    Weight (kg) Declared → Measured
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-[#EAE3DC]/60">
                                {(selectedRequest.items || []).map((item) => {
                                  const mm = mismatchByItemId[item.id] || {};
                                  return (
                                    <tr
                                      key={item.id}
                                      data-testid={`seller-mismatch-row-${item.id}`}
                                    >
                                      <td className="py-2 px-3 font-semibold text-[#1A2420]">
                                        {item.sku_snapshot} (#{item.id})
                                      </td>
                                      <td className="py-2 px-3 font-mono">
                                        {mm.length_cm ? (
                                          <span
                                            data-testid={`mismatch-dim-${item.id}-length_cm`}
                                            className="font-bold text-[#DC2626]"
                                          >
                                            {mm.length_cm.declared} →{' '}
                                            {mm.length_cm.measured} (Mismatch)
                                          </span>
                                        ) : (
                                          <span>
                                            {item.declared_length_cm ?? '—'} →{' '}
                                            {item.measured_length_cm ?? '—'}
                                          </span>
                                        )}
                                      </td>
                                      <td className="py-2 px-3 font-mono">
                                        {mm.width_cm ? (
                                          <span
                                            data-testid={`mismatch-dim-${item.id}-width_cm`}
                                            className="font-bold text-[#DC2626]"
                                          >
                                            {mm.width_cm.declared} →{' '}
                                            {mm.width_cm.measured} (Mismatch)
                                          </span>
                                        ) : (
                                          <span>
                                            {item.declared_width_cm ?? '—'} →{' '}
                                            {item.measured_width_cm ?? '—'}
                                          </span>
                                        )}
                                      </td>
                                      <td className="py-2 px-3 font-mono">
                                        {mm.height_cm ? (
                                          <span
                                            data-testid={`mismatch-dim-${item.id}-height_cm`}
                                            className="font-bold text-[#DC2626]"
                                          >
                                            {mm.height_cm.declared} →{' '}
                                            {mm.height_cm.measured} (Mismatch)
                                          </span>
                                        ) : (
                                          <span>
                                            {item.declared_height_cm ?? '—'} →{' '}
                                            {item.measured_height_cm ?? '—'}
                                          </span>
                                        )}
                                      </td>
                                      <td className="py-2 px-3 font-mono">
                                        {mm.weight_kg ? (
                                          <span
                                            data-testid={`mismatch-dim-${item.id}-weight_kg`}
                                            className="font-bold text-[#DC2626]"
                                          >
                                            {mm.weight_kg.declared} →{' '}
                                            {mm.weight_kg.measured} (Mismatch)
                                          </span>
                                        ) : (
                                          <span>
                                            {item.declared_weight_kg ?? '—'} →{' '}
                                            {item.measured_weight_kg ?? '—'}
                                          </span>
                                        )}
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}

                      {/* Discrepancy & Resolution Summary */}
                      {(selectedRequest.status === 'discrepancy' ||
                        (selectedRequest.seller_discrepancy_action &&
                          selectedRequest.seller_discrepancy_action !==
                            'pending') ||
                        selectedRequest.resolution_reason) && (
                        <div
                          data-testid="seller-discrepancy-summary"
                          className="p-4 rounded-2xl border border-[#F59E0B]/40 bg-[#FFFBEB] space-y-1.5 text-xs"
                        >
                          <div className="font-bold text-[#92400E]">
                            Discrepancy & Resolution Details
                          </div>
                          <div>
                            <span className="text-[#78350F]">
                              Seller Response:{' '}
                            </span>
                            <strong className="uppercase text-[#92400E]">
                              {selectedRequest.seller_discrepancy_action ||
                                'pending'}
                            </strong>
                            {selectedRequest.seller_response_reason && (
                              <span className="text-[#78350F]">
                                {' '}
                                — {selectedRequest.seller_response_reason}
                              </span>
                            )}
                          </div>
                          {selectedRequest.resolution_reason && (
                            <div>
                              <span className="text-[#78350F]">
                                Resolution Reason:{' '}
                              </span>
                              <strong className="text-[#92400E]">
                                {selectedRequest.resolution_reason}
                              </strong>{' '}
                              (at {formatDateTime(selectedRequest.resolved_at)})
                            </div>
                          )}
                        </div>
                      )}

                      {/* Request Items Table (with Declared Size, Weight, Storage Days, and Counts) */}
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-xs">
                          <thead>
                            <tr className="border-b border-[#EAE3DC] text-[#6B6058] uppercase text-[10px]">
                              <th className="py-2 px-2.5">SKU & Product</th>
                              <th className="py-2 px-2.5">
                                Declared Size (L×W×H cm) & Weight
                              </th>
                              <th className="py-2 px-2.5">Storage Days</th>
                              <th className="py-2 px-2.5">Requested</th>
                              <th className="py-2 px-2.5">Accepted</th>
                              <th className="py-2 px-2.5">Received</th>
                              <th className="py-2 px-2.5">Good / Damaged</th>
                              <th className="py-2 px-2.5">Resolved</th>
                              <th className="py-2 px-2.5">Condition & Notes</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#EAE3DC]/60">
                            {(selectedRequest.items || []).map((item) => {
                              const attrsText = formatAttributesSnapshot(
                                item.attributes_snapshot
                              );
                              return (
                                <tr
                                  key={item.id}
                                  data-testid={`seller-detail-item-${item.id}`}
                                >
                                  <td className="py-2.5 px-2.5">
                                    <div className="font-mono font-bold text-[#1A2420]">
                                      {item.sku_snapshot}
                                    </div>
                                    <div className="text-[#6B6058]">
                                      {item.product_name_snapshot}
                                      {attrsText ? ` (${attrsText})` : ''}
                                    </div>
                                  </td>
                                  <td
                                    data-testid={`item-declared-dims-${item.id}`}
                                    className="py-2.5 px-2.5 font-mono text-[11px]"
                                  >
                                    <div>
                                      {formatDimensionsCm(
                                        item.declared_length_cm,
                                        item.declared_width_cm,
                                        item.declared_height_cm
                                      )}
                                    </div>
                                    <div className="text-[#6B6058]">
                                      {formatWeightKg(item.declared_weight_kg)}
                                    </div>
                                  </td>
                                  <td
                                    data-testid={`item-storage-days-${item.id}`}
                                    className="py-2.5 px-2.5 font-mono"
                                  >
                                    {item.expected_storage_days != null
                                      ? `${item.expected_storage_days} days`
                                      : '—'}
                                  </td>
                                  <td
                                    data-testid={`item-requested-qty-${item.id}`}
                                    className="py-2.5 px-2.5 font-mono font-bold"
                                  >
                                    {item.requested_quantity}
                                  </td>
                                  <td
                                    data-testid={`item-accepted-qty-${item.id}`}
                                    className="py-2.5 px-2.5 font-mono"
                                  >
                                    {item.accepted_quantity ?? '—'}
                                  </td>
                                  <td
                                    data-testid={`item-received-qty-${item.id}`}
                                    className="py-2.5 px-2.5 font-mono"
                                  >
                                    {item.received_quantity ?? '—'}
                                  </td>
                                  <td className="py-2.5 px-2.5 font-mono">
                                    {item.good_quantity !== null &&
                                    item.good_quantity !== undefined
                                      ? `${item.good_quantity} good / ${
                                          item.damaged_quantity ?? 0
                                        } damaged`
                                      : '—'}
                                  </td>
                                  <td
                                    data-testid={`item-resolved-qty-${item.id}`}
                                    className="py-2.5 px-2.5 font-mono font-bold"
                                  >
                                    {item.resolved_quantity ?? '—'}
                                  </td>
                                  <td className="py-2.5 px-2.5">
                                    <span className="uppercase font-bold text-[10px]">
                                      {item.condition || 'uninspected'}
                                    </span>
                                    {item.discrepancy_reason && (
                                      <div className="text-[#991B1B] text-[11px]">
                                        {item.discrepancy_reason}
                                      </div>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  );
                })()
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: MY WAREHOUSE STOCK */}
      {activeTab === 'stock' && (
        <div
          data-testid="seller-stock-panel"
          className="bg-white rounded-3xl border border-[#EAE3DC] p-5 sm:p-6 shadow-xs space-y-4"
        >
          <div className="flex items-center justify-between">
            <h2 className="font-['Outfit'] font-bold text-base text-[#1A2420]">
              My Warehouse Stock Lots (Read-Only)
            </h2>
          </div>

          {loading ? (
            <div className="py-10 text-center text-xs text-[#6B6058]">
              Loading warehouse stock lots...
            </div>
          ) : stockLots.length === 0 ? (
            <div
              data-testid="seller-stock-empty"
              className="py-10 text-center space-y-2 border border-dashed border-[#EAE3DC] rounded-2xl"
            >
              <Package className="w-7 h-7 text-[#6B6058] mx-auto opacity-60" />
              <p className="text-xs font-bold text-[#1A2420]">
                No warehouse stock lots yet
              </p>
              <p className="text-xs text-[#6B6058]">
                Stock lots appear here once a warehouse manager receives your inbound storage request.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-[#EAE3DC] text-[#6B6058] uppercase text-[10px]">
                    <th className="py-2.5 px-3">Lot #</th>
                    <th className="py-2.5 px-3">Variant & Product</th>
                    <th className="py-2.5 px-3">Kind / Status</th>
                    <th className="py-2.5 px-3">Received</th>
                    <th className="py-2.5 px-3">Available</th>
                    <th className="py-2.5 px-3">Quarantined</th>
                    <th className="py-2.5 px-3">Released</th>
                    <th className="py-2.5 px-3">Location</th>
                    <th className="py-2.5 px-3">Received Date</th>
                    <th className="py-2.5 px-3 text-right">Inspect</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EAE3DC]/60">
                  {stockLots.map((lot) => (
                    <tr
                      key={lot.id}
                      data-testid={`seller-stock-row-${lot.id}`}
                      className="hover:bg-[#FFF8F2]/60"
                    >
                      <td className="py-3 px-3 font-mono font-bold">
                        #{lot.id}
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-mono font-bold text-[#1A2420]">
                          {lot.sku_snapshot}
                        </div>
                        <div className="text-[#6B6058]">
                          {lot.product_name_snapshot}
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <span className="uppercase font-bold text-[10px] px-2 py-0.5 rounded bg-[#FFF3EC] text-[#FA661C]">
                          {lot.kind} • {lot.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-mono font-bold">
                        {lot.received_quantity}
                      </td>
                      <td className="py-3 px-3 font-mono font-bold text-[#065F46]">
                        {lot.available_quantity}
                      </td>
                      <td className="py-3 px-3 font-mono font-bold text-[#991B1B]">
                        {lot.quarantined_quantity}
                      </td>
                      <td className="py-3 px-3 font-mono">
                        {lot.released_quantity}
                      </td>
                      <td className="py-3 px-3 font-mono font-semibold">
                        {lot.location}
                      </td>
                      <td className="py-3 px-3 text-[#6B6058]">
                        {formatDateTime(lot.received_at)}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <button
                          type="button"
                          onClick={() => openLotDetail(lot.id)}
                          disabled={lotDetailLoading}
                          data-testid={`seller-inspect-lot-btn-${lot.id}`}
                          className="px-2.5 py-1 rounded-lg border border-[#EAE3DC] text-xs font-bold text-[#FA661C] hover:bg-[#FFF3EC] cursor-pointer"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {selectedLot && (
            <div
              data-testid="seller-lot-detail-card"
              className="p-4 rounded-2xl border border-[#EAE3DC] bg-[#FFF8F2] space-y-2 text-xs"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm text-[#1A2420]">
                  Stock Lot #{selectedLot.id} — {selectedLot.sku_snapshot}
                </h3>
                <button
                  type="button"
                  onClick={() => setSelectedLot(null)}
                  className="text-xs font-bold text-[#6B6058] cursor-pointer"
                >
                  Close
                </button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <span className="text-[#6B6058] block">Dimensions</span>
                  <strong className="font-mono">
                    {formatDimensionsCm(
                      selectedLot.measured_length_cm,
                      selectedLot.measured_width_cm,
                      selectedLot.measured_height_cm
                    )}
                  </strong>
                </div>
                <div>
                  <span className="text-[#6B6058] block">Unit Weight</span>
                  <strong className="font-mono">
                    {formatWeightKg(selectedLot.measured_weight_kg)}
                  </strong>
                </div>
                <div>
                  <span className="text-[#6B6058] block">Location</span>
                  <strong className="font-mono">{selectedLot.location}</strong>
                </div>
                <div>
                  <span className="text-[#6B6058] block">Warehouse</span>
                  <strong>{formatWarehouseLabel(selectedLot.warehouse)}</strong>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: HANDOVERS TO PLATFORM HUB (Phase D) */}
      {activeTab === 'handovers' && handoversAvailable && (
        <SellerHandoversSection
          onFeatureDisabled={() => {
            setHandoversAvailable(false);
            setActiveTab('requests');
          }}
          onUnauthorized={handleUnauthorized}
        />
      )}

      {/* TAB 4: RETURNED GOODS & HANDBACK CONFIRMATION (Phase E) */}
      {activeTab === 'returns' && returnsAvailable && (
        <SellerReturnsSection
          onFeatureDisabled={() => {
            setReturnsAvailable(false);
            setActiveTab('requests');
          }}
          onUnauthorized={handleUnauthorized}
        />
      )}

      {/* CREATE NEW STORAGE REQUEST MODAL (Native <dialog>) */}
      {createOpen && (
        <dialog
          open
          data-testid="create-storage-request-modal"
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 overflow-y-auto w-full h-full m-0 border-0"
        >
          <div className="bg-white rounded-3xl border border-[#EAE3DC] max-w-3xl w-full p-6 space-y-5 shadow-xl my-8">
            <div className="flex items-center justify-between border-b border-[#EAE3DC] pb-3">
              <div>
                <h2 className="font-['Outfit'] font-extrabold text-lg text-[#1A2420]">
                  New Warehouse Storage Request
                </h2>
                <p className="text-[11px] text-[#6B6058]">
                  Declare item dimensions (cm), weight (kg), and expected storage days. The price quote is calculated and saved by the server after submission.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setCreateOpen(false)}
                className="p-1 text-[#6B6058] hover:text-[#1A2420] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {createFormError && (
              <div
                data-testid="create-request-form-error"
                role="alert"
                className="p-3 rounded-xl bg-[#FFF3F3] border border-[#FCA5A5] text-xs font-bold text-[#991B1B]"
              >
                {createFormError}
              </div>
            )}

            <form
              onSubmit={handleCreateSubmit}
              noValidate
              className="space-y-4 text-xs"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="sr-warehouse-select"
                    className="block font-bold text-[#1A2420] mb-1"
                  >
                    Destination Warehouse *
                  </label>
                  <select
                    id="sr-warehouse-select"
                    data-testid="sr-warehouse-select"
                    value={createForm.warehouse_id}
                    onChange={(e) =>
                      handleCreateFieldChange('warehouse_id', e.target.value)
                    }
                    className="w-full px-3 py-2 rounded-xl border border-[#EAE3DC] bg-white font-semibold"
                  >
                    <option value="">Select active warehouse...</option>
                    {availableWarehouses.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name} ({w.code} — {w.city})
                      </option>
                    ))}
                  </select>
                  {createFieldErrors.warehouse_id && (
                    <p
                      data-testid="sr-error-warehouse_id"
                      className="mt-1 text-[#DC2626] font-semibold"
                    >
                      {createFieldErrors.warehouse_id}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="sr-expected-arrival"
                    className="block font-bold text-[#1A2420] mb-1"
                  >
                    Expected Arrival Date *
                  </label>
                  <input
                    id="sr-expected-arrival"
                    type="date"
                    data-testid="sr-expected-arrival-input"
                    value={createForm.expected_arrival}
                    onChange={(e) =>
                      handleCreateFieldChange(
                        'expected_arrival',
                        e.target.value
                      )
                    }
                    className="w-full px-3 py-2 rounded-xl border border-[#EAE3DC]"
                  />
                  {createFieldErrors.expected_arrival && (
                    <p
                      data-testid="sr-error-expected_arrival"
                      className="mt-1 text-[#DC2626] font-semibold"
                    >
                      {createFieldErrors.expected_arrival}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="sr-courier"
                    className="block font-bold text-[#1A2420] mb-1"
                  >
                    Courier Name *
                  </label>
                  <input
                    id="sr-courier"
                    type="text"
                    data-testid="sr-courier-input"
                    value={createForm.courier}
                    onChange={(e) =>
                      handleCreateFieldChange('courier', e.target.value)
                    }
                    placeholder="e.g. BlueDart Logistics"
                    className="w-full px-3 py-2 rounded-xl border border-[#EAE3DC]"
                  />
                  {createFieldErrors.courier && (
                    <p
                      data-testid="sr-error-courier"
                      className="mt-1 text-[#DC2626] font-semibold"
                    >
                      {createFieldErrors.courier}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="sr-tracking"
                    className="block font-bold text-[#1A2420] mb-1"
                  >
                    Tracking Reference *
                  </label>
                  <input
                    id="sr-tracking"
                    type="text"
                    data-testid="sr-tracking-input"
                    value={createForm.tracking_reference}
                    onChange={(e) =>
                      handleCreateFieldChange(
                        'tracking_reference',
                        e.target.value
                      )
                    }
                    placeholder="e.g. AWB-982341"
                    className="w-full px-3 py-2 rounded-xl border border-[#EAE3DC]"
                  />
                  {createFieldErrors.tracking_reference && (
                    <p
                      data-testid="sr-error-tracking_reference"
                      className="mt-1 text-[#DC2626] font-semibold"
                    >
                      {createFieldErrors.tracking_reference}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label
                  htmlFor="sr-notes"
                  className="block font-bold text-[#1A2420] mb-1"
                >
                  Handling / Inbound Notes (Optional)
                </label>
                <textarea
                  id="sr-notes"
                  rows={2}
                  data-testid="sr-notes-input"
                  value={createForm.notes}
                  onChange={(e) =>
                    handleCreateFieldChange('notes', e.target.value)
                  }
                  className="w-full px-3 py-2 rounded-xl border border-[#EAE3DC]"
                />
                {createFieldErrors.notes && (
                  <p
                    data-testid="sr-error-notes"
                    className="mt-1 text-[#DC2626] font-semibold"
                  >
                    {createFieldErrors.notes}
                  </p>
                )}
              </div>

              {/* Variants & Declared Size/Weight Section */}
              <div className="space-y-3 border-t border-[#EAE3DC] pt-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#1A2420]">
                    Inbound Variant Items & Declared Measurements *
                  </span>
                  <button
                    type="button"
                    onClick={handleAddItemRow}
                    data-testid="sr-add-item-btn"
                    className="px-2.5 py-1 rounded-lg bg-[#FFF3EC] text-[#FA661C] font-bold flex items-center space-x-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Variant Row</span>
                  </button>
                </div>

                {duplicateVariantWarning && (
                  <p
                    data-testid="sr-duplicate-variant-warning"
                    className="text-[#DC2626] font-semibold"
                  >
                    {duplicateVariantWarning}
                  </p>
                )}

                {createForm.items.map((row, idx) => {
                  const rowErr = createItemErrors[idx] || {};
                  return (
                    <div
                      key={idx}
                      data-testid={`sr-item-row-${idx}`}
                      className="p-3.5 rounded-2xl border border-[#EAE3DC] bg-[#FFF8F2]/50 space-y-3"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start gap-2">
                        <div className="flex-1">
                          <label
                            htmlFor={`sr-variant-${idx}`}
                            className="block text-[11px] font-bold text-[#1A2420] mb-1"
                          >
                            Product Variant *
                          </label>
                          <select
                            id={`sr-variant-${idx}`}
                            data-testid={`sr-item-variant-select-${idx}`}
                            value={row.variant_id}
                            onChange={(e) =>
                              handleItemChange(idx, 'variant_id', e.target.value)
                            }
                            className="w-full px-3 py-2 rounded-xl border border-[#EAE3DC] bg-white"
                          >
                            <option value="">Select your product variant...</option>
                            {sellerVariants.map((v) => {
                              const attrs = formatAttributesSnapshot(v.attributes);
                              return (
                                <option key={v.id} value={v.id}>
                                  {v.sku_code} — {v.product_name}
                                  {attrs ? ` (${attrs})` : ''}
                                </option>
                              );
                            })}
                          </select>
                          {rowErr.variant_id && (
                            <p
                              data-testid={`sr-item-error-variant_id-${idx}`}
                              className="mt-1 text-[#DC2626] font-semibold text-[11px]"
                            >
                              {rowErr.variant_id}
                            </p>
                          )}
                        </div>

                        <div className="w-full sm:w-28">
                          <label
                            htmlFor={`sr-qty-${idx}`}
                            className="block text-[11px] font-bold text-[#1A2420] mb-1"
                          >
                            Quantity *
                          </label>
                          <input
                            id={`sr-qty-${idx}`}
                            type="number"
                            min="1"
                            data-testid={`sr-item-qty-input-${idx}`}
                            value={row.quantity}
                            onChange={(e) =>
                              handleItemChange(idx, 'quantity', e.target.value)
                            }
                            placeholder="Qty"
                            className="w-full px-3 py-2 rounded-xl border border-[#EAE3DC] font-mono bg-white"
                          />
                          {rowErr.quantity && (
                            <p
                              data-testid={`sr-item-error-quantity-${idx}`}
                              className="mt-1 text-[#DC2626] font-semibold text-[11px]"
                            >
                              {rowErr.quantity}
                            </p>
                          )}
                        </div>

                        <div className="w-full sm:w-36">
                          <label
                            htmlFor={`sr-days-${idx}`}
                            className="block text-[11px] font-bold text-[#1A2420] mb-1"
                          >
                            Storage Days *
                          </label>
                          <input
                            id={`sr-days-${idx}`}
                            type="number"
                            min="1"
                            data-testid={`sr-item-storage-days-input-${idx}`}
                            value={row.expected_storage_days}
                            onChange={(e) =>
                              handleItemChange(
                                idx,
                                'expected_storage_days',
                                e.target.value
                              )
                            }
                            placeholder="Days"
                            className="w-full px-3 py-2 rounded-xl border border-[#EAE3DC] font-mono bg-white"
                          />
                          {rowErr.expected_storage_days && (
                            <p
                              data-testid={`sr-item-error-expected_storage_days-${idx}`}
                              className="mt-1 text-[#DC2626] font-semibold text-[11px]"
                            >
                              {rowErr.expected_storage_days}
                            </p>
                          )}
                        </div>

                        <div className="pt-5">
                          <button
                            type="button"
                            onClick={() => handleRemoveItemRow(idx)}
                            data-testid={`sr-remove-item-btn-${idx}`}
                            aria-label="Remove item row"
                            className="p-2 rounded-xl border border-[#EAE3DC] bg-white text-[#DC2626] hover:bg-[#FFF3F3] cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        <div>
                          <label
                            htmlFor={`sr-length-${idx}`}
                            className="block text-[11px] font-bold text-[#1A2420] mb-1"
                          >
                            Length (cm) *
                          </label>
                          <input
                            id={`sr-length-${idx}`}
                            type="text"
                            data-testid={`sr-item-length-input-${idx}`}
                            value={row.declared_length_cm}
                            onChange={(e) =>
                              handleItemChange(
                                idx,
                                'declared_length_cm',
                                e.target.value
                              )
                            }
                            placeholder="e.g. 10.000"
                            className="w-full px-3 py-1.5 rounded-xl border border-[#EAE3DC] font-mono bg-white"
                          />
                          {rowErr.declared_length_cm && (
                            <p
                              data-testid={`sr-item-error-declared_length_cm-${idx}`}
                              className="mt-1 text-[#DC2626] font-semibold text-[11px]"
                            >
                              {rowErr.declared_length_cm}
                            </p>
                          )}
                        </div>

                        <div>
                          <label
                            htmlFor={`sr-width-${idx}`}
                            className="block text-[11px] font-bold text-[#1A2420] mb-1"
                          >
                            Width (cm) *
                          </label>
                          <input
                            id={`sr-width-${idx}`}
                            type="text"
                            data-testid={`sr-item-width-input-${idx}`}
                            value={row.declared_width_cm}
                            onChange={(e) =>
                              handleItemChange(
                                idx,
                                'declared_width_cm',
                                e.target.value
                              )
                            }
                            placeholder="e.g. 10.000"
                            className="w-full px-3 py-1.5 rounded-xl border border-[#EAE3DC] font-mono bg-white"
                          />
                          {rowErr.declared_width_cm && (
                            <p
                              data-testid={`sr-item-error-declared_width_cm-${idx}`}
                              className="mt-1 text-[#DC2626] font-semibold text-[11px]"
                            >
                              {rowErr.declared_width_cm}
                            </p>
                          )}
                        </div>

                        <div>
                          <label
                            htmlFor={`sr-height-${idx}`}
                            className="block text-[11px] font-bold text-[#1A2420] mb-1"
                          >
                            Height (cm) *
                          </label>
                          <input
                            id={`sr-height-${idx}`}
                            type="text"
                            data-testid={`sr-item-height-input-${idx}`}
                            value={row.declared_height_cm}
                            onChange={(e) =>
                              handleItemChange(
                                idx,
                                'declared_height_cm',
                                e.target.value
                              )
                            }
                            placeholder="e.g. 10.000"
                            className="w-full px-3 py-1.5 rounded-xl border border-[#EAE3DC] font-mono bg-white"
                          />
                          {rowErr.declared_height_cm && (
                            <p
                              data-testid={`sr-item-error-declared_height_cm-${idx}`}
                              className="mt-1 text-[#DC2626] font-semibold text-[11px]"
                            >
                              {rowErr.declared_height_cm}
                            </p>
                          )}
                        </div>

                        <div>
                          <label
                            htmlFor={`sr-weight-${idx}`}
                            className="block text-[11px] font-bold text-[#1A2420] mb-1"
                          >
                            Weight (kg) *
                          </label>
                          <input
                            id={`sr-weight-${idx}`}
                            type="text"
                            data-testid={`sr-item-weight-input-${idx}`}
                            value={row.declared_weight_kg}
                            onChange={(e) =>
                              handleItemChange(
                                idx,
                                'declared_weight_kg',
                                e.target.value
                              )
                            }
                            placeholder="e.g. 1.000"
                            className="w-full px-3 py-1.5 rounded-xl border border-[#EAE3DC] font-mono bg-white"
                          />
                          {rowErr.declared_weight_kg && (
                            <p
                              data-testid={`sr-item-error-declared_weight_kg-${idx}`}
                              className="mt-1 text-[#DC2626] font-semibold text-[11px]"
                            >
                              {rowErr.declared_weight_kg}
                            </p>
                          )}
                        </div>
                      </div>

                      {rowErr._error && (
                        <p
                          data-testid={`sr-item-error-row-${idx}`}
                          className="text-[#DC2626] font-semibold text-[11px]"
                        >
                          {rowErr._error}
                        </p>
                      )}
                    </div>
                  );
                })}

                {createFieldErrors.items && (
                  <p
                    data-testid="sr-error-items"
                    className="mt-1 text-[#DC2626] font-semibold"
                  >
                    {createFieldErrors.items}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="sr-reason"
                  className="block font-bold text-[#1A2420] mb-1"
                >
                  Audit Reason *
                </label>
                <input
                  id="sr-reason"
                  type="text"
                  data-testid="sr-reason-input"
                  value={createForm.reason}
                  onChange={(e) =>
                    handleCreateFieldChange('reason', e.target.value)
                  }
                  placeholder="Reason for sending stock to warehouse"
                  className="w-full px-3 py-2 rounded-xl border border-[#EAE3DC]"
                />
                {createFieldErrors.reason && (
                  <p
                    data-testid="sr-error-reason"
                    className="mt-1 text-[#DC2626] font-semibold"
                  >
                    {createFieldErrors.reason}
                  </p>
                )}
              </div>

              {/* Optional Price Preview Result Panel */}
              {previewQuote && previewQuote.quote_snapshot && (
                <div
                  data-testid="sr-price-preview-panel"
                  className="p-4 rounded-2xl border border-[#6EE7B7] bg-[#ECFDF5]/60 space-y-3 text-xs"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#6EE7B7]/60 pb-2">
                    <span
                      data-testid="sr-price-preview-disclaimer"
                      className="font-bold text-[#065F46]"
                    >
                      Estimated price. Nothing is charged until the warehouse accepts.
                    </span>
                    <span
                      data-testid="sr-price-preview-caption"
                      className="font-mono text-[11px] font-semibold text-[#047857]"
                    >
                      as quoted on{' '}
                      {previewQuote.quote_as_of_date ||
                        previewQuote.quote_snapshot.date}{' '}
                      using rate card version{' '}
                      {previewQuote.quote_rate_card_version ??
                        previewQuote.quote_snapshot.rate_card_version}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 p-2.5 rounded-xl bg-white border border-[#EAE3DC]">
                    <div>
                      <span className="text-[#6B6058] block text-[10px]">
                        Storage Charge
                      </span>
                      <strong
                        data-testid="sr-price-preview-storage"
                        className="font-mono"
                      >
                        {previewQuote.quote_snapshot.currency}{' '}
                        {previewQuote.quote_snapshot.storage_charge}
                      </strong>
                    </div>
                    <div>
                      <span className="text-[#6B6058] block text-[10px]">
                        Handling Charge
                      </span>
                      <strong
                        data-testid="sr-price-preview-handling"
                        className="font-mono"
                      >
                        {previewQuote.quote_snapshot.currency}{' '}
                        {previewQuote.quote_snapshot.handling_charge}
                      </strong>
                    </div>
                    <div>
                      <span className="text-[#6B6058] block text-[10px]">
                        Packing Charge
                      </span>
                      <strong
                        data-testid="sr-price-preview-packing"
                        className="font-mono"
                      >
                        {previewQuote.quote_snapshot.currency}{' '}
                        {previewQuote.quote_snapshot.packing_charge}
                      </strong>
                    </div>
                    <div>
                      <span className="text-[#6B6058] block text-[10px]">
                        Minimum Applied
                      </span>
                      <strong
                        data-testid="sr-price-preview-minimum"
                        className="font-mono"
                      >
                        {previewQuote.quote_snapshot.currency}{' '}
                        {previewQuote.quote_snapshot.minimum_charge_applied}
                      </strong>
                    </div>
                    <div>
                      <span className="text-[#6B6058] block text-[10px]">
                        Estimated Total
                      </span>
                      <strong
                        data-testid="sr-price-preview-total"
                        className="font-mono text-sm text-[#065F46]"
                      >
                        {previewQuote.quote_snapshot.currency}{' '}
                        {previewQuote.quote_snapshot.total}
                      </strong>
                    </div>
                  </div>

                  {Array.isArray(previewQuote.quote_snapshot.items) &&
                    previewQuote.quote_snapshot.items.length > 0 && (
                      <div className="overflow-x-auto bg-white rounded-xl border border-[#EAE3DC]">
                        <table
                          data-testid="sr-price-preview-lines"
                          className="w-full text-left border-collapse text-xs"
                        >
                          <thead>
                            <tr className="border-b border-[#EAE3DC] text-[#6B6058] uppercase text-[10px]">
                              <th className="py-1.5 px-2">Variant</th>
                              <th className="py-1.5 px-2">Size Band</th>
                              <th className="py-1.5 px-2">Qty</th>
                              <th className="py-1.5 px-2">
                                Free / Billable Days
                              </th>
                              <th className="py-1.5 px-2">Storage</th>
                              <th className="py-1.5 px-2">Handling</th>
                              <th className="py-1.5 px-2 text-right">
                                Line Total
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#EAE3DC]/60">
                            {previewQuote.quote_snapshot.items.map(
                              (line, lIdx) => (
                                <tr
                                  key={lIdx}
                                  data-testid={`sr-price-preview-line-${lIdx}`}
                                >
                                  <td className="py-1.5 px-2 font-mono">
                                    Variant #{line.variant_id}
                                  </td>
                                  <td className="py-1.5 px-2 font-semibold">
                                    {line.band?.label || '—'}
                                  </td>
                                  <td className="py-1.5 px-2 font-mono">
                                    {line.quantity}
                                  </td>
                                  <td className="py-1.5 px-2 font-mono">
                                    {line.free_days_applied ?? 0} free /{' '}
                                    {line.billable_storage_days ?? '—'} billable
                                  </td>
                                  <td className="py-1.5 px-2 font-mono">
                                    {line.currency}{' '}
                                    {line.storage_charge}
                                  </td>
                                  <td className="py-1.5 px-2 font-mono">
                                    {line.currency}{' '}
                                    {line.handling_charge}
                                  </td>
                                  <td className="py-1.5 px-2 font-mono font-bold text-right">
                                    {line.currency} {line.total}
                                  </td>
                                </tr>
                              )
                            )}
                          </tbody>
                        </table>
                      </div>
                    )}
                </div>
              )}

              <div className="flex flex-wrap justify-between items-center gap-2 pt-3 border-t border-[#EAE3DC]">
                <button
                  type="button"
                  onClick={handleCheckPrice}
                  disabled={previewLoading || createSubmitting || cannotSell}
                  data-testid="sr-check-price-btn"
                  className="px-4 py-2 rounded-xl border border-[#FA661C] bg-[#FFF3EC] hover:bg-[#FFE4D1] text-[#FA661C] font-bold cursor-pointer disabled:opacity-50"
                >
                  {previewLoading ? 'Checking price...' : 'Check price'}
                </button>
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => setCreateOpen(false)}
                    className="px-4 py-2 rounded-xl border border-[#EAE3DC] font-bold text-[#6B6058] cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={createSubmitting || cannotSell}
                    data-testid="sr-submit-btn"
                    className="px-5 py-2 rounded-xl bg-[#FA661C] hover:bg-[#E0530B] text-white font-bold cursor-pointer disabled:opacity-50"
                  >
                    {createSubmitting ? 'Submitting...' : 'Submit Storage Request'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </dialog>
      )}

      {/* STATE-DEPENDENT ACTION MODAL (Native <dialog>: Cancel / Dispatch / Acknowledge / Dispute) */}
      {actionModal && (
        <dialog
          open
          data-testid="seller-request-action-modal"
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 w-full h-full m-0 border-0"
        >
          <div className="bg-white rounded-3xl border border-[#EAE3DC] max-w-md w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-[#EAE3DC] pb-3">
              <h3 className="font-['Outfit'] font-extrabold text-base text-[#1A2420]">
                {actionModal.type === 'cancel' &&
                  `Cancel Storage Request #${actionModal.request.id}`}
                {actionModal.type === 'dispatch' &&
                  `Dispatch Storage Request #${actionModal.request.id}`}
                {actionModal.type === 'acknowledge' &&
                  `Acknowledge Discrepancy on #${actionModal.request.id}`}
                {actionModal.type === 'dispute' &&
                  `Dispute Discrepancy on #${actionModal.request.id}`}
              </h3>
              <button
                type="button"
                onClick={() => setActionModal(null)}
                className="p-1 text-[#6B6058] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {actionFormError && (
              <div
                data-testid="seller-action-form-error"
                role="alert"
                className="p-3 rounded-xl bg-[#FFF3F3] border border-[#FCA5A5] text-xs font-bold text-[#991B1B]"
              >
                {actionFormError}
              </div>
            )}

            <form
              onSubmit={handleActionSubmit}
              noValidate
              className="space-y-3 text-xs"
            >
              {actionModal.type === 'dispatch' && (
                <>
                  <div>
                    <label
                      htmlFor="dispatch-courier"
                      className="block font-bold text-[#1A2420] mb-1"
                    >
                      Courier Name *
                    </label>
                    <input
                      id="dispatch-courier"
                      type="text"
                      data-testid="seller-action-courier-input"
                      value={actionForm.courier}
                      onChange={(e) => {
                        setActionForm((p) => ({
                          ...p,
                          courier: e.target.value,
                        }));
                        setActionFieldErrors((p) => ({ ...p, courier: '' }));
                      }}
                      className="w-full px-3 py-2 rounded-xl border border-[#EAE3DC]"
                    />
                    {actionFieldErrors.courier && (
                      <p
                        data-testid="seller-action-error-courier"
                        className="mt-1 text-[#DC2626] font-semibold"
                      >
                        {actionFieldErrors.courier}
                      </p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="dispatch-tracking"
                      className="block font-bold text-[#1A2420] mb-1"
                    >
                      Tracking Reference *
                    </label>
                    <input
                      id="dispatch-tracking"
                      type="text"
                      data-testid="seller-action-tracking-input"
                      value={actionForm.tracking_reference}
                      onChange={(e) => {
                        setActionForm((p) => ({
                          ...p,
                          tracking_reference: e.target.value,
                        }));
                        setActionFieldErrors((p) => ({
                          ...p,
                          tracking_reference: '',
                        }));
                      }}
                      className="w-full px-3 py-2 rounded-xl border border-[#EAE3DC]"
                    />
                    {actionFieldErrors.tracking_reference && (
                      <p
                        data-testid="seller-action-error-tracking_reference"
                        className="mt-1 text-[#DC2626] font-semibold"
                      >
                        {actionFieldErrors.tracking_reference}
                      </p>
                    )}
                  </div>
                </>
              )}

              <div>
                <label
                  htmlFor="seller-action-reason"
                  className="block font-bold text-[#1A2420] mb-1"
                >
                  Reason *
                </label>
                <textarea
                  id="seller-action-reason"
                  rows={2}
                  data-testid="seller-action-reason-input"
                  value={actionForm.reason}
                  onChange={(e) => {
                    setActionForm((p) => ({ ...p, reason: e.target.value }));
                    setActionFieldErrors((p) => ({ ...p, reason: '' }));
                  }}
                  placeholder="Provide a reason for the audit trail"
                  className="w-full px-3 py-2 rounded-xl border border-[#EAE3DC]"
                />
                {actionFieldErrors.reason && (
                  <p
                    data-testid="seller-action-error-reason"
                    className="mt-1 text-[#DC2626] font-semibold"
                  >
                    {actionFieldErrors.reason}
                  </p>
                )}
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActionModal(null)}
                  className="px-3.5 py-1.5 rounded-xl border border-[#EAE3DC] font-bold text-[#6B6058] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionSubmitting}
                  data-testid="seller-action-submit-btn"
                  className="px-4 py-1.5 rounded-xl bg-[#FA661C] hover:bg-[#E0530B] text-white font-bold cursor-pointer disabled:opacity-50"
                >
                  {actionSubmitting ? 'Confirming...' : 'Confirm'}
                </button>
              </div>
            </form>
          </div>
        </dialog>
      )}

      {/* NATIVE <dialog>: CONFIRM GOODS RECEIVED BACK */}
      {confirmReturnModal && (
        <dialog
          open
          data-testid="seller-confirm-return-dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-[#1A2420]/50 backdrop-blur-2xs flex items-center justify-center p-4 w-full h-full m-0 border-0"
        >
          <div className="bg-white rounded-3xl border border-[#EAE3DC] shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#EAE3DC] pb-3">
              <h3 className="font-['Outfit'] font-extrabold text-base text-[#1A2420]">
                Confirm goods received back — Request #{confirmReturnModal.request?.id}
              </h3>
              <button
                type="button"
                onClick={() => setConfirmReturnModal(null)}
                className="p-1.5 rounded-lg text-[#6B6058] hover:bg-[#FFF3EC] cursor-pointer"
                aria-label="Close confirm return dialog"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-[#6B6058]">
              Confirm that you have physically received the recalled goods back from the warehouse. This restores the held units to your seller stock.
            </p>

            {confirmReturnGeneralError && (
              <div
                data-testid="seller-confirm-return-general-error"
                role="alert"
                className="p-3 rounded-xl bg-[#FFF3F3] border border-[#FCA5A5] text-xs font-bold text-[#991B1B]"
              >
                {confirmReturnGeneralError}
              </div>
            )}

            <form
              onSubmit={handleConfirmReturnSubmit}
              noValidate
              className="space-y-3 text-xs"
            >
              <div>
                <label
                  htmlFor="confirm-return-receipt-ref"
                  className="block font-bold text-[#1A2420] mb-1"
                >
                  Receipt Reference *
                </label>
                <input
                  id="confirm-return-receipt-ref"
                  type="text"
                  data-testid="seller-confirm-return-receipt-input"
                  value={confirmReturnForm.receipt_reference}
                  onChange={(e) => {
                    setConfirmReturnForm((p) => ({
                      ...p,
                      receipt_reference: e.target.value,
                    }));
                    setConfirmReturnFieldErrors((fe) => ({
                      ...fe,
                      receipt_reference: '',
                    }));
                  }}
                  placeholder="e.g. SELLER-RCPT-2026-01"
                  className="w-full px-3 py-2 rounded-xl border border-[#EAE3DC] font-mono"
                />
                {confirmReturnFieldErrors.receipt_reference && (
                  <p
                    data-testid="seller-confirm-return-error-receipt_reference"
                    className="mt-1 text-[#DC2626] font-semibold"
                  >
                    {confirmReturnFieldErrors.receipt_reference}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="confirm-return-note"
                  className="block font-bold text-[#1A2420] mb-1"
                >
                  Note (optional)
                </label>
                <textarea
                  id="confirm-return-note"
                  rows={2}
                  data-testid="seller-confirm-return-note-input"
                  value={confirmReturnForm.note}
                  onChange={(e) =>
                    setConfirmReturnForm((p) => ({
                      ...p,
                      note: e.target.value,
                    }))
                  }
                  placeholder="Optional receipt notes"
                  className="w-full px-3 py-2 rounded-xl border border-[#EAE3DC]"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setConfirmReturnModal(null)}
                  className="px-3.5 py-1.5 rounded-xl border border-[#EAE3DC] font-bold text-[#6B6058] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={confirmReturnSubmitting}
                  data-testid="seller-confirm-return-submit-btn"
                  className="px-4 py-1.5 rounded-xl bg-[#6B21A8] hover:bg-[#581C87] text-white font-bold cursor-pointer disabled:opacity-50"
                >
                  {confirmReturnSubmitting
                    ? 'Confirming…'
                    : 'Confirm Return'}
                </button>
              </div>
            </form>
          </div>
        </dialog>
      )}
    </div>
  );
}
