import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
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
} from 'lucide-react';
import { apiRequest } from '../../../utils/api';
import AuthContext from '../../../context/AuthContext';
import {
  STORAGE_REQUEST_STATUSES,
  formatStorageStatusLabel,
  getStorageStatusBadgeClass,
  formatAttributesSnapshot,
  formatDimensionsCm,
  formatWeightKg,
  formatDateTime,
  parseWarehouseApiError,
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

export default function SellerWarehouseView({ vendorProfile }) {
  const navigate = useNavigate();
  const auth = React.useContext(AuthContext);
  const logout = auth?.logout;

  const [activeTab, setActiveTab] = useState('requests'); // 'requests' | 'stock'

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
    items: [{ variant_id: '', quantity: '1' }],
  });
  const [createFieldErrors, setCreateFieldErrors] = useState({});
  const [createFormError, setCreateFormError] = useState('');
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [duplicateVariantWarning, setDuplicateVariantWarning] = useState('');

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
          variant_id:
            sellerVariants.length === 1 ? String(sellerVariants[0].id) : '',
          quantity: '1',
        },
      ],
    });
    setCreateFieldErrors({});
    setCreateFormError('');
    setDuplicateVariantWarning('');
    setFeedback(null);
    setCreateOpen(true);
  };

  const handleCreateFieldChange = (field, value) => {
    setCreateForm((prev) => ({ ...prev, [field]: value }));
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
    setCreateForm((prev) => ({
      ...prev,
      items: [...prev.items, { variant_id: '', quantity: '1' }],
    }));
  };

  const handleRemoveItemRow = (index) => {
    setDuplicateVariantWarning('');
    setCreateForm((prev) => ({
      ...prev,
      items: prev.items.filter((_, idx) => idx !== index),
    }));
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setCreateSubmitting(true);
    setCreateFieldErrors({});
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
      items: createForm.items
        .filter((r) => String(r.variant_id).trim() !== '')
        .map((r) => ({
          variant_id: Number(r.variant_id),
          quantity:
            String(r.quantity).trim() === '' ? 0 : Number(r.quantity),
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
      const { fieldErrors, formError } = parseWarehouseApiError(
        err,
        CREATE_KNOWN_FIELDS
      );
      setCreateFieldErrors(fieldErrors);
      if (Object.keys(fieldErrors).length === 0) {
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
                    const itemCount = Array.isArray(req.items)
                      ? req.items.length
                      : 0;
                    const totalUnits = Array.isArray(req.items)
                      ? req.items.reduce(
                          (acc, it) => acc + (Number(it.requested_quantity) || 0),
                          0
                        )
                      : 0;
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
                          {itemCount} {itemCount === 1 ? 'SKU' : 'SKUs'} ({totalUnits}{' '}
                          units)
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
                selectedRequest && (
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

                      {/* State-Dependent Seller Action Buttons */}
                      <div className="flex flex-wrap items-center gap-2">
                        {selectedRequest.status === 'requested' && (
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

                        {selectedRequest.status === 'accepted' && (
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

                        {selectedRequest.status === 'discrepancy' &&
                          selectedRequest.seller_discrepancy_action ===
                            'pending' && (
                            <>
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
                            </>
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

                    {/* Discrepancy & Resolution Summary */}
                    {(selectedRequest.status === 'discrepancy' ||
                      selectedRequest.seller_discrepancy_action !== 'pending' ||
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

                    {/* Request Items Table (Requested, Accepted, Received shown separately) */}
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="border-b border-[#EAE3DC] text-[#6B6058] uppercase text-[10px]">
                            <th className="py-2 px-2.5">SKU & Product</th>
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
                )
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

      {/* CREATE NEW STORAGE REQUEST MODAL */}
      {createOpen && (
        <div
          data-testid="create-storage-request-modal"
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 overflow-y-auto"
        >
          <div className="bg-white rounded-3xl border border-[#EAE3DC] max-w-2xl w-full p-6 space-y-5 shadow-xl my-8">
            <div className="flex items-center justify-between border-b border-[#EAE3DC] pb-3">
              <h2 className="font-['Outfit'] font-extrabold text-lg text-[#1A2420]">
                New Warehouse Storage Request
              </h2>
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

              {/* Variants Picker Section */}
              <div className="space-y-2 border-t border-[#EAE3DC] pt-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#1A2420]">
                    Inbound Variant Items *
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

                {createForm.items.map((row, idx) => (
                  <div
                    key={idx}
                    data-testid={`sr-item-row-${idx}`}
                    className="flex flex-col sm:flex-row sm:items-center gap-2"
                  >
                    <select
                      data-testid={`sr-item-variant-select-${idx}`}
                      value={row.variant_id}
                      onChange={(e) =>
                        handleItemChange(idx, 'variant_id', e.target.value)
                      }
                      className="flex-1 px-3 py-2 rounded-xl border border-[#EAE3DC] bg-white"
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

                    <input
                      type="number"
                      data-testid={`sr-item-qty-input-${idx}`}
                      value={row.quantity}
                      onChange={(e) =>
                        handleItemChange(idx, 'quantity', e.target.value)
                      }
                      placeholder="Quantity"
                      className="w-28 px-3 py-2 rounded-xl border border-[#EAE3DC] font-mono"
                    />

                    <button
                      type="button"
                      onClick={() => handleRemoveItemRow(idx)}
                      data-testid={`sr-remove-item-btn-${idx}`}
                      aria-label="Remove item row"
                      className="p-2 rounded-xl border border-[#EAE3DC] text-[#DC2626] hover:bg-[#FFF3F3] cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}

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

              <div className="flex justify-end space-x-2 pt-3 border-t border-[#EAE3DC]">
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
            </form>
          </div>
        </div>
      )}

      {/* STATE-DEPENDENT ACTION MODAL (Cancel / Dispatch / Acknowledge / Dispute) */}
      {actionModal && (
        <div
          data-testid="seller-request-action-modal"
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
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
        </div>
      )}
    </div>
  );
}
