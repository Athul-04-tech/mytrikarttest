import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Warehouse,
  User,
  MapPin,
  LogOut,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  ShieldAlert,
  ClipboardList,
  Boxes,
  History,
  ArrowLeft,
  Check,
  XCircle,
  PackageCheck,
  Scale,
  Lock,
  ChevronLeft,
  ChevronRight,
  FileText,
  X,
} from 'lucide-react';
import { apiRequest } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import ManagerRateCardsSection from '../components/warehouse/ManagerRateCardsSection';
import {
  STORAGE_REQUEST_STATUSES,
  STATUS_LABELS,
  getStatusBadgeClass,
  DISCREPANCY_ACTION_LABELS,
  MOVEMENT_TYPE_LABELS,
  formatAttributesSnapshot,
  formatDimensionsCm,
  formatWeightKg,
  formatDateTime,
  parseWarehouseApiError,
} from '../utils/warehouseUtils';

export default function WarehouseDashboardPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser, logout } = useAuth();

  // Derive active tab from URL path
  const deriveSectionFromPath = (pathname) => {
    if (pathname.startsWith('/warehouse/requests')) return 'requests';
    if (pathname.startsWith('/warehouse/stock')) return 'stock';
    if (pathname.startsWith('/warehouse/movements')) return 'movements';
    if (pathname.startsWith('/warehouse/rate-cards')) return 'rate-cards';
    return 'home';
  };

  const deriveRateCardSubView = (pathname) => {
    if (pathname.startsWith('/warehouse/rate-cards/estimate')) return 'estimate';
    if (pathname.startsWith('/warehouse/rate-cards/new')) return 'editor';
    return 'list';
  };

  const [activeSection, setActiveSection] = useState(() =>
    deriveSectionFromPath(location.pathname)
  );

  useEffect(() => {
    setActiveSection(deriveSectionFromPath(location.pathname));
  }, [location.pathname]);

  const switchSection = (sectionId, routePath) => {
    setActiveSection(sectionId);
    navigate(routePath);
  };

  // Home / Me state
  const [meData, setMeData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [noAssignmentMsg, setNoAssignmentMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [feedbackBanner, setFeedbackBanner] = useState('');

  // Requests queue state
  const [requests, setRequests] = useState([]);
  const [requestsCount, setRequestsCount] = useState(0);
  const [requestsPage, setRequestsPage] = useState(1);
  const [requestsNext, setRequestsNext] = useState(null);
  const [requestsPrev, setRequestsPrev] = useState(null);
  const [requestsStatusFilter, setRequestsStatusFilter] = useState('');
  const [requestsLoading, setRequestsLoading] = useState(false);
  const [requestsError, setRequestsError] = useState('');

  // Selected request detail state
  const [selectedRequestId, setSelectedRequestId] = useState(null);
  const [requestDetail, setRequestDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState('');
  const [conflictAlert, setConflictAlert] = useState('');

  // Accept / Reject / Close modal state
  const [decisionModal, setDecisionModal] = useState(null); // { type: 'accept' | 'reject' | 'close', request: obj }
  const [acceptWindowStart, setAcceptWindowStart] = useState('');
  const [acceptWindowEnd, setAcceptWindowEnd] = useState('');
  const [acceptInstructions, setAcceptInstructions] = useState('');
  const [acceptItemQuantities, setAcceptItemQuantities] = useState({});
  const [decisionReason, setDecisionReason] = useState('');
  const [decisionFieldErrors, setDecisionFieldErrors] = useState({});
  const [decisionItemErrors, setDecisionItemErrors] = useState([]);
  const [decisionGeneralError, setDecisionGeneralError] = useState('');
  const [decisionSubmitting, setDecisionSubmitting] = useState(false);

  // Receive form state (inline or panel when request.status === 'in_transit')
  const [receiveItemsForm, setReceiveItemsForm] = useState({});
  const [receiveNotes, setReceiveNotes] = useState('');
  const [receiveReason, setReceiveReason] = useState('');
  const [receiveFieldErrors, setReceiveFieldErrors] = useState({});
  const [receiveItemErrors, setReceiveItemErrors] = useState([]);
  const [receiveGeneralError, setReceiveGeneralError] = useState('');
  const [receiveSubmitting, setReceiveSubmitting] = useState(false);

  // Discrepancy Resolve form state (when request.status === 'discrepancy')
  const [resolveItemQuantities, setResolveItemQuantities] = useState({});
  const [resolveReason, setResolveReason] = useState('');
  const [resolveFieldErrors, setResolveFieldErrors] = useState({});
  const [resolveItemErrors, setResolveItemErrors] = useState([]);
  const [resolveGeneralError, setResolveGeneralError] = useState('');
  const [resolveSubmitting, setResolveSubmitting] = useState(false);

  // Stock tab state
  const [stockRows, setStockRows] = useState([]);
  const [stockCount, setStockCount] = useState(0);
  const [stockPage, setStockPage] = useState(1);
  const [stockNext, setStockNext] = useState(null);
  const [stockPrev, setStockPrev] = useState(null);
  const [stockSellerFilter, setStockSellerFilter] = useState('');
  const [stockVariantFilter, setStockVariantFilter] = useState('');
  const [stockLoading, setStockLoading] = useState(false);
  const [stockError, setStockError] = useState('');

  // Movements tab state
  const [movements, setMovements] = useState([]);
  const [movementsCount, setMovementsCount] = useState(0);
  const [movementsPage, setMovementsPage] = useState(1);
  const [movementsNext, setMovementsNext] = useState(null);
  const [movementsPrev, setMovementsPrev] = useState(null);
  const [movementsLoading, setMovementsLoading] = useState(false);
  const [movementsError, setMovementsError] = useState('');

  const authNavRef = useRef({ logout, navigate });
  authNavRef.current = { logout, navigate };

  const handleUnauthorized = useCallback(async () => {
    if (authNavRef.current.logout) {
      await authNavRef.current.logout();
    }
    authNavRef.current.navigate('/login', { replace: true });
  }, []);

  const fetchWarehouseMe = useCallback(async () => {
    setLoading(true);
    setNoAssignmentMsg('');
    setErrorMsg('');

    try {
      const data = await apiRequest('/api/warehouse/me/');
      if (!data || !data.warehouse) {
        setMeData(data || null);
        setNoAssignmentMsg(
          'No active warehouse assignment found for your account. Please contact a platform administrator.'
        );
      } else {
        setMeData(data);
      }
    } catch (err) {
      const status = err?.status;
      const detail = err?.data?.detail || err?.message || '';

      if (status === 401) {
        await handleUnauthorized();
        return;
      }

      if (
        status === 403 &&
        /active warehouse manager assignment is required/i.test(String(detail))
      ) {
        setMeData(null);
        setNoAssignmentMsg(String(detail));
      } else if (status === 404) {
        setMeData(null);
        setNoAssignmentMsg(
          detail || 'No active warehouse assignment found for your account.'
        );
      } else {
        setMeData(null);
        setErrorMsg(
          detail || 'Unable to load warehouse details from the server.'
        );
      }
    } finally {
      setLoading(false);
    }
  }, [handleUnauthorized]);

  // Initialize receive and resolve form state whenever requestDetail loads
  const initFormsForDetail = useCallback((detail) => {
    if (!detail || !Array.isArray(detail.items)) return;

    const initialReceive = {};
    const initialResolve = {};
    detail.items.forEach((item) => {
      const defaultQty =
        item.accepted_quantity != null
          ? String(item.accepted_quantity)
          : String(item.requested_quantity ?? 0);
      initialReceive[item.id] = {
        counted_quantity:
          item.received_quantity != null ? String(item.received_quantity) : defaultQty,
        good_quantity:
          item.good_quantity != null ? String(item.good_quantity) : defaultQty,
        damaged_quantity:
          item.damaged_quantity != null ? String(item.damaged_quantity) : '0',
        length:
          item.measured_length_cm != null
            ? String(item.measured_length_cm)
            : item.length_cm != null
            ? String(item.length_cm)
            : '',
        width:
          item.measured_width_cm != null
            ? String(item.measured_width_cm)
            : item.width_cm != null
            ? String(item.width_cm)
            : '',
        height:
          item.measured_height_cm != null
            ? String(item.measured_height_cm)
            : item.height_cm != null
            ? String(item.height_cm)
            : '',
        weight:
          item.measured_weight_kg != null
            ? String(item.measured_weight_kg)
            : item.weight_kg != null
            ? String(item.weight_kg)
            : '',
        location: item.location || item.storage_location || '',
        discrepancy_reason: item.discrepancy_reason || '',
      };
      initialResolve[item.id] =
        item.good_quantity != null
          ? String(item.good_quantity)
          : item.accepted_quantity != null
          ? String(item.accepted_quantity)
          : String(item.requested_quantity ?? 0);
    });

    setReceiveItemsForm(initialReceive);
    setReceiveNotes(detail.notes || '');
    setReceiveReason('');
    setReceiveFieldErrors({});
    setReceiveItemErrors([]);
    setReceiveGeneralError('');

    setResolveItemQuantities(initialResolve);
    setResolveReason('');
    setResolveFieldErrors({});
    setResolveItemErrors([]);
    setResolveGeneralError('');
  }, []);

  const fetchRequests = useCallback(
    async (page = requestsPage, status = requestsStatusFilter) => {
      setRequestsLoading(true);
      setRequestsError('');
      try {
        const params = new URLSearchParams();
        if (page > 1) params.set('page', String(page));
        if (status) params.set('status', status);
        const qs = params.toString() ? `?${params.toString()}` : '';
        const data = await apiRequest(`/api/warehouse/storage-requests/${qs}`);
        const rows = Array.isArray(data) ? data : data?.results || [];
        setRequests(rows);
        setRequestsCount(typeof data?.count === 'number' ? data.count : rows.length);
        setRequestsNext(data?.next || null);
        setRequestsPrev(data?.previous || null);
      } catch (err) {
        if (err?.status === 401) {
          await handleUnauthorized();
          return;
        }
        setRequestsError(
          err?.data?.detail || err?.message || 'Failed to load storage requests queue.'
        );
      } finally {
        setRequestsLoading(false);
      }
    },
    [requestsPage, requestsStatusFilter, handleUnauthorized]
  );

  const fetchRequestDetail = useCallback(
    async (reqId, preserveForms = false) => {
      if (!reqId) return null;
      setDetailLoading(true);
      setDetailError('');
      try {
        const data = await apiRequest(`/api/warehouse/storage-requests/${reqId}/`);
        setRequestDetail(data);
        if (!preserveForms) {
          initFormsForDetail(data);
        }
        return data;
      } catch (err) {
        if (err?.status === 401) {
          await handleUnauthorized();
          return null;
        }
        setDetailError(
          err?.data?.detail || err?.message || `Failed to load storage request #${reqId}.`
        );
        return null;
      } finally {
        setDetailLoading(false);
      }
    },
    [initFormsForDetail, handleUnauthorized]
  );

  const fetchStock = useCallback(
    async (
      page = stockPage,
      sellerId = stockSellerFilter,
      variantId = stockVariantFilter
    ) => {
      setStockLoading(true);
      setStockError('');
      try {
        const params = new URLSearchParams();
        if (page > 1) params.set('page', String(page));
        if (String(sellerId).trim()) params.set('seller_id', String(sellerId).trim());
        if (String(variantId).trim()) params.set('variant_id', String(variantId).trim());
        const qs = params.toString() ? `?${params.toString()}` : '';
        const data = await apiRequest(`/api/warehouse/stock/${qs}`);
        const rows = Array.isArray(data) ? data : data?.results || [];
        setStockRows(rows);
        setStockCount(typeof data?.count === 'number' ? data.count : rows.length);
        setStockNext(data?.next || null);
        setStockPrev(data?.previous || null);
      } catch (err) {
        if (err?.status === 401) {
          await handleUnauthorized();
          return;
        }
        setStockError(
          err?.data?.detail || err?.message || 'Failed to load warehouse stock.'
        );
      } finally {
        setStockLoading(false);
      }
    },
    [stockPage, stockSellerFilter, stockVariantFilter, handleUnauthorized]
  );

  const fetchMovements = useCallback(
    async (page = movementsPage) => {
      setMovementsLoading(true);
      setMovementsError('');
      try {
        const qs = page > 1 ? `?page=${page}` : '';
        const data = await apiRequest(`/api/warehouse/movements/${qs}`);
        const rows = Array.isArray(data) ? data : data?.results || [];
        setMovements(rows);
        setMovementsCount(typeof data?.count === 'number' ? data.count : rows.length);
        setMovementsNext(data?.next || null);
        setMovementsPrev(data?.previous || null);
      } catch (err) {
        if (err?.status === 401) {
          await handleUnauthorized();
          return;
        }
        setMovementsError(
          err?.data?.detail || err?.message || 'Failed to load stock movements.'
        );
      } finally {
        setMovementsLoading(false);
      }
    },
    [movementsPage, handleUnauthorized]
  );

  useEffect(() => {
    const titles = {
      home: 'Warehouse Manager Home — MytriKart',
      requests: 'Storage Requests Queue — MytriKart Warehouse',
      stock: 'Warehouse Stock Lots — MytriKart Warehouse',
      movements: 'Warehouse Stock Movements — MytriKart Warehouse',
      'rate-cards': 'Warehouse Rate Cards & Estimates — MytriKart Warehouse',
    };
    document.title = titles[activeSection] || 'Warehouse Manager Home — MytriKart';
  }, [activeSection]);

  useEffect(() => {
    fetchWarehouseMe();
  }, [fetchWarehouseMe]);

  const hasAssignedWarehouse = Boolean(meData?.warehouse);

  useEffect(() => {
    if (!hasAssignedWarehouse) return;
    if (activeSection === 'requests') {
      fetchRequests(requestsPage, requestsStatusFilter);
    } else if (activeSection === 'stock') {
      fetchStock(stockPage, stockSellerFilter, stockVariantFilter);
    } else if (activeSection === 'movements') {
      fetchMovements(movementsPage);
    }
  }, [
    hasAssignedWarehouse,
    activeSection,
    requestsPage,
    requestsStatusFilter,
    stockPage,
    stockSellerFilter,
    stockVariantFilter,
    movementsPage,
    fetchRequests,
    fetchStock,
    fetchMovements,
  ]);

  useEffect(() => {
    if (selectedRequestId) {
      fetchRequestDetail(selectedRequestId);
    }
  }, [selectedRequestId, fetchRequestDetail]);

  const handleRefreshCurrent = async () => {
    await fetchWarehouseMe();
    if (activeSection === 'requests') {
      await fetchRequests(requestsPage, requestsStatusFilter);
      if (selectedRequestId) {
        await fetchRequestDetail(selectedRequestId);
      }
    } else if (activeSection === 'stock') {
      await fetchStock(stockPage, stockSellerFilter, stockVariantFilter);
    } else if (activeSection === 'movements') {
      await fetchMovements(movementsPage);
    }
  };

  const handleSignOut = async () => {
    if (logout) {
      await logout();
    }
    navigate('/login', { replace: true });
  };

  // Open Accept / Reject / Close Modal
  const openDecisionModal = (type, reqObj) => {
    setFeedbackBanner('');
    setConflictAlert('');
    setDecisionFieldErrors({});
    setDecisionItemErrors([]);
    setDecisionGeneralError('');
    setDecisionReason('');
    setAcceptWindowStart('');
    setAcceptWindowEnd('');
    setAcceptInstructions(reqObj?.receiving_instructions || '');

    const qtyMap = {};
    (reqObj?.items || []).forEach((it) => {
      qtyMap[it.id] = String(it.requested_quantity ?? 1);
    });
    setAcceptItemQuantities(qtyMap);
    setDecisionModal({ type, request: reqObj });
  };

  const handleDecisionSubmit = async (e) => {
    e.preventDefault();
    if (!decisionModal) return;
    setDecisionFieldErrors({});
    setDecisionItemErrors([]);
    setDecisionGeneralError('');
    setDecisionSubmitting(true);

    const { type, request } = decisionModal;
    try {
      let updated;
      if (type === 'accept') {
        const payload = {
          reason: decisionReason,
          instructions: acceptInstructions,
          items: (request.items || []).map((it) => ({
            item_id: Number(it.id),
            accepted_quantity:
              acceptItemQuantities[it.id] !== undefined &&
              String(acceptItemQuantities[it.id]).trim() !== ''
                ? Number(acceptItemQuantities[it.id])
                : Number(it.requested_quantity),
          })),
        };
        if (acceptWindowStart) {
          payload.receiving_window_start = new Date(acceptWindowStart).toISOString();
        }
        if (acceptWindowEnd) {
          payload.receiving_window_end = new Date(acceptWindowEnd).toISOString();
        }
        updated = await apiRequest(
          `/api/warehouse/storage-requests/${request.id}/accept/`,
          {
            method: 'POST',
            body: JSON.stringify(payload),
          }
        );
        setFeedbackBanner(
          `Storage request #${updated.id} accepted (status: ${STATUS_LABELS[updated.status] || updated.status}).`
        );
      } else if (type === 'reject') {
        updated = await apiRequest(
          `/api/warehouse/storage-requests/${request.id}/reject/`,
          {
            method: 'POST',
            body: JSON.stringify({ reason: decisionReason }),
          }
        );
        setFeedbackBanner(`Storage request #${updated.id} rejected.`);
      } else if (type === 'close') {
        updated = await apiRequest(
          `/api/warehouse/storage-requests/${request.id}/close/`,
          {
            method: 'POST',
            body: JSON.stringify({ reason: decisionReason }),
          }
        );
        setFeedbackBanner(`Storage request #${updated.id} closed.`);
      }

      setDecisionModal(null);
      if (updated) {
        setRequestDetail(updated);
        initFormsForDetail(updated);
      }
      await fetchRequests(requestsPage, requestsStatusFilter);
    } catch (err) {
      const parsed = parseWarehouseApiError(err);
      if (err?.status === 409) {
        const msg =
          parsed.generalError ||
          err?.data?.detail ||
          'This storage request state has already changed.';
        setDecisionModal(null);
        setConflictAlert(msg);
        await fetchRequests(requestsPage, requestsStatusFilter);
        if (request?.id) {
          await fetchRequestDetail(request.id);
        }
      } else {
        setDecisionFieldErrors(parsed.fieldErrors);
        setDecisionItemErrors(parsed.itemErrors);
        setDecisionGeneralError(parsed.generalError);
      }
    } finally {
      setDecisionSubmitting(false);
    }
  };

  // Submit Receive Form (`POST /api/warehouse/storage-requests/{id}/receive/`)
  const handleReceiveSubmit = async (e) => {
    e.preventDefault();
    if (!requestDetail) return;
    setReceiveFieldErrors({});
    setReceiveItemErrors([]);
    setReceiveGeneralError('');
    setConflictAlert('');
    setFeedbackBanner('');

    // Client check: good + damaged === counted for each item
    const itemsList = requestDetail.items || [];
    const clientItemErrors = [];
    let hasClientCountMismatch = false;

    itemsList.forEach((item, idx) => {
      const row = receiveItemsForm[item.id] || {};
      const counted = Number(row.counted_quantity);
      const good = Number(row.good_quantity);
      const damaged = Number(row.damaged_quantity);
      if (
        row.counted_quantity !== '' &&
        row.good_quantity !== '' &&
        row.damaged_quantity !== '' &&
        !Number.isNaN(counted) &&
        !Number.isNaN(good) &&
        !Number.isNaN(damaged) &&
        good + damaged !== counted
      ) {
        hasClientCountMismatch = true;
        clientItemErrors[idx] = {
          counted_quantity: `Good (${good}) + Damaged (${damaged}) must equal Counted (${counted}).`,
        };
      } else {
        clientItemErrors[idx] = {};
      }
    });

    if (hasClientCountMismatch) {
      setReceiveItemErrors(clientItemErrors);
      setReceiveGeneralError(
        'Good quantity plus damaged quantity must equal counted quantity for every item.'
      );
      return;
    }

    setReceiveSubmitting(true);
    try {
      const payload = {
        notes: receiveNotes,
        reason: receiveReason,
        items: itemsList.map((item) => {
          const row = receiveItemsForm[item.id] || {};
          return {
            item_id: Number(item.id),
            counted_quantity:
              row.counted_quantity !== '' ? Number(row.counted_quantity) : 0,
            good_quantity: row.good_quantity !== '' ? Number(row.good_quantity) : 0,
            damaged_quantity:
              row.damaged_quantity !== '' ? Number(row.damaged_quantity) : 0,
            length: row.length,
            width: row.width,
            height: row.height,
            weight: row.weight,
            location: row.location || '',
            discrepancy_reason: row.discrepancy_reason || '',
          };
        }),
      };

      const updated = await apiRequest(
        `/api/warehouse/storage-requests/${requestDetail.id}/receive/`,
        {
          method: 'POST',
          body: JSON.stringify(payload),
        }
      );

      setRequestDetail(updated);
      initFormsForDetail(updated);
      setFeedbackBanner(
        `Shipment received for request #${updated.id}. Resulting status: ${
          STATUS_LABELS[updated.status] || updated.status
        }.`
      );
      await fetchRequests(requestsPage, requestsStatusFilter);
    } catch (err) {
      const parsed = parseWarehouseApiError(err);
      if (err?.status === 409) {
        const msg =
          parsed.generalError ||
          err?.data?.detail ||
          'This shipment was already received or its status changed.';
        setConflictAlert(msg);
        await fetchRequestDetail(requestDetail.id);
        await fetchRequests(requestsPage, requestsStatusFilter);
      } else {
        setReceiveFieldErrors(parsed.fieldErrors);
        setReceiveItemErrors(parsed.itemErrors);
        setReceiveGeneralError(parsed.generalError);
      }
    } finally {
      setReceiveSubmitting(false);
    }
  };

  // Submit Resolve Form (`POST /api/warehouse/storage-requests/{id}/resolve/`)
  const handleResolveSubmit = async (e) => {
    e.preventDefault();
    if (!requestDetail) return;
    setResolveFieldErrors({});
    setResolveItemErrors([]);
    setResolveGeneralError('');
    setConflictAlert('');
    setFeedbackBanner('');
    setResolveSubmitting(true);

    try {
      const payload = {
        reason: resolveReason,
        items: (requestDetail.items || []).map((it) => ({
          item_id: Number(it.id),
          accepted_quantity:
            resolveItemQuantities[it.id] !== undefined &&
            String(resolveItemQuantities[it.id]).trim() !== ''
              ? Number(resolveItemQuantities[it.id])
              : Number(it.good_quantity ?? 0),
        })),
      };

      const updated = await apiRequest(
        `/api/warehouse/storage-requests/${requestDetail.id}/resolve/`,
        {
          method: 'POST',
          body: JSON.stringify(payload),
        }
      );

      setRequestDetail(updated);
      initFormsForDetail(updated);
      setFeedbackBanner(
        `Discrepancy resolved for request #${updated.id}. Status is now ${
          STATUS_LABELS[updated.status] || updated.status
        }.`
      );
      await fetchRequests(requestsPage, requestsStatusFilter);
    } catch (err) {
      const parsed = parseWarehouseApiError(err);
      if (err?.status === 409) {
        const msg =
          parsed.generalError ||
          err?.data?.detail ||
          'Cannot resolve discrepancy in current state.';
        setConflictAlert(msg);
        setResolveGeneralError(msg);
        await fetchRequestDetail(requestDetail.id, true);
        await fetchRequests(requestsPage, requestsStatusFilter);
      } else {
        setResolveFieldErrors(parsed.fieldErrors);
        setResolveItemErrors(parsed.itemErrors);
        setResolveGeneralError(parsed.generalError);
      }
    } finally {
      setResolveSubmitting(false);
    }
  };

  const profile = meData?.profile || currentUser || {};
  const warehouse = meData?.warehouse || null;
  const fullName =
    `${profile.first_name || ''} ${profile.last_name || ''}`.trim() ||
    profile.fullName ||
    profile.name ||
    '—';
  const warehouseActive =
    warehouse && warehouse.is_active !== undefined
      ? Boolean(warehouse.is_active)
      : true;

  const formattedAddress = warehouse
    ? [
        warehouse.address_line1,
        warehouse.address_line2,
        warehouse.city,
        warehouse.state,
        warehouse.postal_code,
        warehouse.country,
      ]
        .filter((part) => part && String(part).trim())
        .join(', ')
    : '';

  return (
    <div className="min-h-screen bg-[#FFFFFF] text-[#1A2420] flex flex-col font-sans selection:bg-[#FF811A]/30 selection:text-[#FA661C]">
      {/* Top Bar with Phase 2 Navigation */}
      <header className="border-b border-[#EAE3DC] bg-white px-4 sm:px-8 py-4 sticky top-0 z-30 shadow-2xs">
        <div className="max-w-6xl mx-auto flex flex-col gap-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              <img
                src="/mytrikart-logo.png"
                alt="MytriKart Logo"
                className="h-8 w-auto object-contain"
              />
              <span className="text-[#EAE3DC]">|</span>
              <div className="flex items-center space-x-2">
                <Warehouse className="w-4 h-4 text-[#FA661C]" />
                <span className="font-['Outfit'] font-extrabold text-sm sm:text-base text-[#1A2420]">
                  Warehouse Operations Portal
                </span>
                {warehouse && (
                  <span className="hidden md:inline-block px-2 py-0.5 rounded-full text-[11px] font-mono font-bold bg-[#FFF3EC] text-[#FA661C] border border-[#FA661C]/20">
                    {warehouse.code}
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-2.5">
              <button
                type="button"
                onClick={handleRefreshCurrent}
                disabled={loading || requestsLoading || stockLoading || movementsLoading}
                data-testid="warehouse-refresh-btn"
                className="px-3 py-2 rounded-xl border border-[#EAE3DC] bg-white hover:bg-[#FFF3EC] text-xs font-bold text-[#1A2420] flex items-center space-x-1.5 transition-colors cursor-pointer"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 text-[#FA661C] ${
                    loading || requestsLoading || stockLoading || movementsLoading
                      ? 'animate-spin'
                      : ''
                  }`}
                />
                <span className="hidden sm:inline">Refresh</span>
              </button>

              <button
                type="button"
                onClick={handleSignOut}
                data-testid="warehouse-signout-btn"
                className="px-3.5 py-2 rounded-xl bg-[#D7263D] hover:bg-[#B91C1C] text-white text-xs font-bold flex items-center space-x-1.5 transition-colors cursor-pointer shadow-2xs"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>

          {/* Navigation Bar (Home, Requests, Stock, Movements) */}
          <nav
            aria-label="Warehouse Manager Navigation"
            className="flex flex-wrap items-center gap-2 pt-1"
          >
            <button
              type="button"
              data-testid="warehouse-nav-home"
              onClick={() => {
                setSelectedRequestId(null);
                switchSection('home', '/warehouse/dashboard');
              }}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all cursor-pointer ${
                activeSection === 'home'
                  ? 'bg-[#FA661C] text-white shadow-xs'
                  : 'bg-white text-[#6B6058] border border-[#EAE3DC] hover:text-[#FA661C]'
              }`}
            >
              <Warehouse className="w-3.5 h-3.5" />
              <span>Home</span>
            </button>

            <button
              type="button"
              data-testid="warehouse-nav-requests"
              onClick={() => switchSection('requests', '/warehouse/requests')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all cursor-pointer ${
                activeSection === 'requests'
                  ? 'bg-[#FA661C] text-white shadow-xs'
                  : 'bg-white text-[#6B6058] border border-[#EAE3DC] hover:text-[#FA661C]'
              }`}
            >
              <ClipboardList className="w-3.5 h-3.5" />
              <span>Requests</span>
            </button>

            <button
              type="button"
              data-testid="warehouse-nav-stock"
              onClick={() => {
                setSelectedRequestId(null);
                switchSection('stock', '/warehouse/stock');
              }}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all cursor-pointer ${
                activeSection === 'stock'
                  ? 'bg-[#FA661C] text-white shadow-xs'
                  : 'bg-white text-[#6B6058] border border-[#EAE3DC] hover:text-[#FA661C]'
              }`}
            >
              <Boxes className="w-3.5 h-3.5" />
              <span>Stock</span>
            </button>

            <button
              type="button"
              data-testid="warehouse-nav-movements"
              onClick={() => {
                setSelectedRequestId(null);
                switchSection('movements', '/warehouse/movements');
              }}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all cursor-pointer ${
                activeSection === 'movements'
                  ? 'bg-[#FA661C] text-white shadow-xs'
                  : 'bg-white text-[#6B6058] border border-[#EAE3DC] hover:text-[#FA661C]'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>Movements</span>
            </button>

            <button
              type="button"
              data-testid="warehouse-nav-rate-cards"
              onClick={() => {
                setSelectedRequestId(null);
                switchSection('rate-cards', '/warehouse/rate-cards');
              }}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all cursor-pointer ${
                activeSection === 'rate-cards'
                  ? 'bg-[#FA661C] text-white shadow-xs'
                  : 'bg-white text-[#6B6058] border border-[#EAE3DC] hover:text-[#FA661C]'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Rate Cards</span>
            </button>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {loading ? (
          <div
            data-testid="warehouse-loading-state"
            className="p-8 rounded-3xl border border-[#EAE3DC] bg-white text-center space-y-2"
          >
            <RefreshCw className="w-6 h-6 text-[#FA661C] animate-spin mx-auto" />
            <p className="text-xs font-bold text-[#6B6058]">
              Loading assigned warehouse and manager profile...
            </p>
          </div>
        ) : errorMsg ? (
          <div
            data-testid="warehouse-error-state"
            role="alert"
            className="p-6 rounded-3xl border border-[#FCA5A5] bg-[#FFF3F3] space-y-3"
          >
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-[#DC2626] shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h2 className="font-['Outfit'] font-extrabold text-base text-[#991B1B]">
                  Error Loading Warehouse Workspace
                </h2>
                <p className="text-xs text-[#7F1D1D]">{errorMsg}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={fetchWarehouseMe}
              className="px-4 py-2 rounded-xl bg-[#DC2626] hover:bg-[#B91C1C] text-white text-xs font-bold cursor-pointer"
            >
              Retry
            </button>
          </div>
        ) : (
          <>
            {/* Feedback Banner */}
            {feedbackBanner && (
              <div
                data-testid="warehouse-manager-feedback-banner"
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

            {/* 409 Conflict Banner */}
            {conflictAlert && (
              <div
                data-testid="warehouse-manager-conflict-alert"
                role="alert"
                className="p-4 rounded-2xl bg-[#FFFBEB] border border-[#F59E0B] flex items-center justify-between gap-3 text-xs text-[#92400E]"
              >
                <div className="flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 text-[#D97706] shrink-0" />
                  <span className="font-bold">
                    {conflictAlert} (Reloaded latest state from server.)
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setConflictAlert('')}
                  className="text-[#92400E] hover:text-[#78350F] cursor-pointer"
                  aria-label="Dismiss conflict alert"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* No Active Assignment Banner */}
            {noAssignmentMsg && (
              <div
                data-testid="warehouse-no-assignment-state"
                role="alert"
                className="p-6 rounded-3xl border border-[#F59E0B]/50 bg-[#FFFBEB] flex items-start space-x-3"
              >
                <ShieldAlert className="w-6 h-6 text-[#D97706] shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h2 className="font-['Outfit'] font-extrabold text-base text-[#92400E]">
                    No Active Warehouse Assignment
                  </h2>
                  <p className="text-xs text-[#78350F]">{noAssignmentMsg}</p>
                </div>
              </div>
            )}

            {/* SECTION 1: HOME */}
            {activeSection === 'home' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {warehouse && (
                  <section
                    data-testid="assigned-warehouse-card"
                    aria-label="Assigned Warehouse"
                    className="p-6 rounded-3xl border border-[#EAE3DC] bg-white shadow-xs space-y-4"
                  >
                    <div className="flex items-start justify-between gap-3 border-b border-[#EAE3DC] pb-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-2xl bg-[#FFF3EC] text-[#FA661C] flex items-center justify-center shrink-0">
                          <Warehouse className="w-5 h-5" />
                        </div>
                        <div>
                          <span className="text-[10px] font-black uppercase tracking-wider text-[#6B6058]">
                            Assigned Facility
                          </span>
                          <h2
                            data-testid="assigned-warehouse-name"
                            className="font-['Outfit'] font-extrabold text-lg text-[#1A2420]"
                          >
                            {warehouse.name}
                          </h2>
                        </div>
                      </div>

                      <span
                        data-testid="assigned-warehouse-status"
                        className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                          warehouseActive
                            ? 'bg-[#ECFDF5] text-[#065F46] border border-[#10B981]/30'
                            : 'bg-[#FFF3F3] text-[#991B1B] border border-[#FCA5A5]'
                        }`}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{warehouseActive ? 'Active' : 'Inactive'}</span>
                      </span>
                    </div>

                    <dl className="space-y-3 text-xs">
                      <div className="flex justify-between py-1.5 border-b border-[#EAE3DC]/60">
                        <dt className="text-[#6B6058] font-medium">Warehouse Code</dt>
                        <dd
                          data-testid="assigned-warehouse-code"
                          className="font-mono font-bold text-[#1A2420]"
                        >
                          {warehouse.code}
                        </dd>
                      </div>
                      <div className="flex justify-between py-1.5 border-b border-[#EAE3DC]/60">
                        <dt className="text-[#6B6058] font-medium">Warehouse ID</dt>
                        <dd className="font-mono font-semibold text-[#1A2420]">
                          #{warehouse.id}
                        </dd>
                      </div>
                      <div className="space-y-1 pt-1">
                        <dt className="text-[#6B6058] font-medium flex items-center space-x-1.5">
                          <MapPin className="w-3.5 h-3.5 text-[#FA661C]" />
                          <span>Facility Address</span>
                        </dt>
                        <dd
                          data-testid="assigned-warehouse-address"
                          className="text-xs font-semibold text-[#1A2420] pl-5 leading-relaxed"
                        >
                          {formattedAddress || '—'}
                        </dd>
                      </div>
                    </dl>
                  </section>
                )}

                <section
                  data-testid="manager-profile-card"
                  aria-label="Manager Profile"
                  className="p-6 rounded-3xl border border-[#EAE3DC] bg-white shadow-xs space-y-4"
                >
                  <div className="flex items-center space-x-3 border-b border-[#EAE3DC] pb-4">
                    <div className="w-10 h-10 rounded-2xl bg-[#FFF3EC] text-[#FA661C] flex items-center justify-center shrink-0">
                      <User className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-wider text-[#6B6058]">
                        Authenticated Profile
                      </span>
                      <h2
                        data-testid="manager-profile-username"
                        className="font-['Outfit'] font-extrabold text-lg text-[#1A2420]"
                      >
                        {profile.username || '—'}
                      </h2>
                    </div>
                  </div>

                  <dl className="space-y-3 text-xs">
                    <div className="flex justify-between py-1.5 border-b border-[#EAE3DC]/60">
                      <dt className="text-[#6B6058] font-medium">Full Name</dt>
                      <dd
                        data-testid="manager-profile-fullname"
                        className="font-bold text-[#1A2420]"
                      >
                        {fullName}
                      </dd>
                    </div>
                    {profile.id !== undefined && (
                      <div className="flex justify-between py-1.5 border-b border-[#EAE3DC]/60">
                        <dt className="text-[#6B6058] font-medium">User ID</dt>
                        <dd className="font-mono font-semibold text-[#1A2420]">
                          #{profile.id}
                        </dd>
                      </div>
                    )}
                    {(profile.email || currentUser?.email) && (
                      <div className="flex justify-between py-1.5 border-b border-[#EAE3DC]/60">
                        <dt className="text-[#6B6058] font-medium">Email</dt>
                        <dd className="font-semibold text-[#1A2420]">
                          {profile.email || currentUser?.email}
                        </dd>
                      </div>
                    )}
                    <div className="flex justify-between py-1.5">
                      <dt className="text-[#6B6058] font-medium">Role</dt>
                      <dd className="font-mono font-bold text-[#FA661C]">
                        {currentUser?.role || 'warehouse_manager'}
                      </dd>
                    </div>
                  </dl>
                </section>
              </div>
            )}

            {/* SECTION 2: STORAGE REQUESTS QUEUE & DETAIL */}
            {activeSection === 'requests' && warehouse && (
              <>
                {selectedRequestId ? (
                  /* REQUEST DETAIL VIEW */
                  <section
                    data-testid="manager-request-detail-panel"
                    className="rounded-3xl border border-[#EAE3DC] bg-white shadow-2xs p-6 space-y-6"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#EAE3DC] pb-4">
                      <button
                        type="button"
                        data-testid="manager-back-to-requests-btn"
                        onClick={() => {
                          setSelectedRequestId(null);
                          setRequestDetail(null);
                          setConflictAlert('');
                          fetchRequests(requestsPage, requestsStatusFilter);
                        }}
                        className="px-3 py-1.5 rounded-xl border border-[#EAE3DC] bg-white hover:bg-[#FFF3EC] text-xs font-bold text-[#1A2420] inline-flex items-center space-x-1.5 cursor-pointer"
                      >
                        <ArrowLeft className="w-3.5 h-3.5 text-[#FA661C]" />
                        <span>Back to Requests Queue</span>
                      </button>

                      {requestDetail && (
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            data-testid="manager-detail-status-badge"
                            className={`px-3 py-1 rounded-full text-xs font-extrabold uppercase ${getStatusBadgeClass(
                              requestDetail.status
                            )}`}
                          >
                            {STATUS_LABELS[requestDetail.status] || requestDetail.status}
                          </span>

                          {requestDetail.status === 'requested' && (
                            <>
                              <button
                                type="button"
                                data-testid="manager-open-accept-btn"
                                onClick={() => openDecisionModal('accept', requestDetail)}
                                className="px-3.5 py-1.5 rounded-xl bg-[#059669] hover:bg-[#047857] text-white text-xs font-bold inline-flex items-center space-x-1.5 cursor-pointer"
                              >
                                <Check className="w-3.5 h-3.5" />
                                <span>Accept Request</span>
                              </button>
                              <button
                                type="button"
                                data-testid="manager-open-reject-btn"
                                onClick={() => openDecisionModal('reject', requestDetail)}
                                className="px-3.5 py-1.5 rounded-xl bg-[#DC2626] hover:bg-[#B91C1C] text-white text-xs font-bold inline-flex items-center space-x-1.5 cursor-pointer"
                              >
                                <XCircle className="w-3.5 h-3.5" />
                                <span>Reject Request</span>
                              </button>
                            </>
                          )}

                          {requestDetail.status === 'received' && (
                            <button
                              type="button"
                              data-testid="manager-open-close-btn"
                              onClick={() => openDecisionModal('close', requestDetail)}
                              className="px-3.5 py-1.5 rounded-xl bg-[#1A2420] hover:bg-[#334139] text-white text-xs font-bold inline-flex items-center space-x-1.5 cursor-pointer"
                            >
                              <Lock className="w-3.5 h-3.5" />
                              <span>Close Request</span>
                            </button>
                          )}
                        </div>
                      )}
                    </div>

                    {detailLoading ? (
                      <div className="p-8 text-center text-xs text-[#6B6058]">
                        Loading storage request #{selectedRequestId}...
                      </div>
                    ) : detailError ? (
                      <div
                        data-testid="manager-detail-error"
                        role="alert"
                        className="p-4 rounded-2xl bg-[#FFF3F3] border border-[#FCA5A5] text-xs text-[#991B1B]"
                      >
                        {detailError}
                      </div>
                    ) : requestDetail ? (
                      <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                          <div className="p-4 rounded-2xl border border-[#EAE3DC] bg-[#FFF3EC]/20 space-y-1.5">
                            <span className="text-[10px] font-black uppercase text-[#6B6058]">
                              Request & Seller
                            </span>
                            <div className="font-bold text-sm text-[#1A2420]">
                              Request #{requestDetail.id}
                            </div>
                            <div
                              data-testid="manager-detail-seller-name"
                              className="font-bold text-[#FA661C]"
                            >
                              {requestDetail.seller_business_name} (Seller #{requestDetail.vendor_id ?? requestDetail.seller})
                            </div>
                            <div className="text-[#6B6058]">
                              Expected Arrival: {requestDetail.expected_arrival || '—'}
                            </div>
                            <div className="text-[#6B6058]">
                              Created: {formatDateTime(requestDetail.created_at)}
                            </div>
                          </div>

                          <div className="p-4 rounded-2xl border border-[#EAE3DC] bg-[#FFF3EC]/20 space-y-1.5">
                            <span className="text-[10px] font-black uppercase text-[#6B6058]">
                              Shipment & Tracking
                            </span>
                            <div>
                              <span className="text-[#6B6058]">Courier:</span>{' '}
                              <span className="font-semibold text-[#1A2420]">
                                {requestDetail.courier_name || requestDetail.courier || '—'}
                              </span>
                            </div>
                            <div>
                              <span className="text-[#6B6058]">Tracking Ref:</span>{' '}
                              <span className="font-mono font-semibold text-[#1A2420]">
                                {requestDetail.tracking_reference || '—'}
                              </span>
                            </div>
                            {requestDetail.dispatched_at && (
                              <div className="text-[#6B6058]">
                                Dispatched: {formatDateTime(requestDetail.dispatched_at)}
                              </div>
                            )}
                            {(requestDetail.seller_notes || requestDetail.notes) && (
                              <div className="text-[#6B6058]">
                                Notes: {requestDetail.seller_notes || requestDetail.notes}
                              </div>
                            )}
                          </div>

                          <div className="p-4 rounded-2xl border border-[#EAE3DC] bg-[#FFF3EC]/20 space-y-1.5">
                            <span className="text-[10px] font-black uppercase text-[#6B6058]">
                              Decision & Receiving
                            </span>
                            {requestDetail.decision_reason ? (
                              <div>
                                <span className="text-[#6B6058]">Decision Reason:</span>{' '}
                                <span className="font-semibold text-[#1A2420]">
                                  {requestDetail.decision_reason}
                                </span>
                              </div>
                            ) : (
                              <div className="text-[#6B6058]">No decision recorded yet.</div>
                            )}
                            {(requestDetail.manager_instructions ||
                              requestDetail.receiving_instructions) && (
                              <div>
                                <span className="text-[#6B6058]">Instructions:</span>{' '}
                                <span className="font-semibold text-[#1A2420]">
                                  {requestDetail.manager_instructions ||
                                    requestDetail.receiving_instructions}
                                </span>
                              </div>
                            )}
                            {requestDetail.received_at && (
                              <div className="text-[#6B6058]">
                                Received: {formatDateTime(requestDetail.received_at)}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Items Snapshot & Counts Table */}
                        <div className="space-y-2">
                          <h3 className="font-['Outfit'] font-extrabold text-sm text-[#1A2420]">
                            Item Snapshots & Counts ({requestDetail.items?.length || 0})
                          </h3>
                          <div className="overflow-x-auto rounded-2xl border border-[#EAE3DC]">
                            <table className="w-full text-left border-collapse text-xs">
                              <thead>
                                <tr className="bg-[#FFF3EC]/60 border-b border-[#EAE3DC] text-[#6B6058] uppercase text-[10px] font-black tracking-wider">
                                  <th className="py-3 px-4">Item Snapshot</th>
                                  <th className="py-3 px-4 text-right">Requested</th>
                                  <th className="py-3 px-4 text-right">Accepted</th>
                                  <th className="py-3 px-4 text-right">Counted</th>
                                  <th className="py-3 px-4 text-right">Good</th>
                                  <th className="py-3 px-4 text-right">Damaged</th>
                                  <th className="py-3 px-4">Dimensions / Weight</th>
                                  <th className="py-3 px-4">Location & Discrepancy</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-[#EAE3DC]">
                                {(requestDetail.items || []).map((item) => (
                                  <tr
                                    key={item.id}
                                    data-testid={`manager-detail-item-row-${item.id}`}
                                  >
                                    <td className="py-3 px-4">
                                      <div className="font-bold text-[#1A2420]">
                                        {item.product_name_snapshot}
                                      </div>
                                      <div className="font-mono text-[11px] text-[#FA661C]">
                                        SKU: {item.sku_snapshot} • Variant #{item.variant_id ?? item.variant}
                                      </div>
                                      <div className="text-[11px] text-[#6B6058]">
                                        {formatAttributesSnapshot(item.attributes_snapshot)}
                                      </div>
                                    </td>
                                    <td className="py-3 px-4 text-right font-mono font-bold">
                                      {item.requested_quantity}
                                    </td>
                                    <td className="py-3 px-4 text-right font-mono font-bold text-[#059669]">
                                      {item.accepted_quantity ?? '—'}
                                    </td>
                                    <td className="py-3 px-4 text-right font-mono font-bold">
                                      {item.received_quantity ?? '—'}
                                    </td>
                                    <td className="py-3 px-4 text-right font-mono font-bold text-[#065F46]">
                                      {item.good_quantity ?? '—'}
                                    </td>
                                    <td className="py-3 px-4 text-right font-mono font-bold text-[#DC2626]">
                                      {item.damaged_quantity ?? '—'}
                                    </td>
                                    <td className="py-3 px-4 font-mono text-[11px]">
                                      <div>
                                        {formatDimensionsCm(
                                          item.measured_length_cm ?? item.length_cm,
                                          item.measured_width_cm ?? item.width_cm,
                                          item.measured_height_cm ?? item.height_cm
                                        )}
                                      </div>
                                      <div className="text-[#6B6058]">
                                        {formatWeightKg(
                                          item.measured_weight_kg ?? item.weight_kg
                                        )}
                                      </div>
                                    </td>
                                    <td className="py-3 px-4 text-[11px]">
                                      <div className="font-mono font-semibold">
                                        {item.location || item.storage_location || '—'}
                                      </div>
                                      {item.discrepancy_reason && (
                                        <div className="text-[#DC2626] font-semibold mt-0.5">
                                          Discrepancy: {item.discrepancy_reason}
                                        </div>
                                      )}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>

                        {/* RECEIVE FORM (Only when status === 'in_transit') */}
                        {requestDetail.status === 'in_transit' && (
                          <form
                            onSubmit={handleReceiveSubmit}
                            data-testid="manager-receive-form"
                            className="p-5 rounded-2xl border-2 border-[#FA661C]/30 bg-[#FFF3EC]/20 space-y-4"
                            noValidate
                          >
                            <div className="flex items-center space-x-2">
                              <PackageCheck className="w-5 h-5 text-[#FA661C]" />
                              <h3 className="font-['Outfit'] font-extrabold text-base text-[#1A2420]">
                                Receive & Count Shipment
                              </h3>
                            </div>
                            <p className="text-xs text-[#6B6058]">
                              Enter physical counts, dimensions in centimetres (`cm`), weight in kilograms (`kg`), and storage bin location for each item. Good quantity + Damaged quantity must equal Counted quantity.
                            </p>

                            {receiveGeneralError && (
                              <div
                                data-testid="manager-receive-general-error"
                                role="alert"
                                className="p-3.5 rounded-xl bg-[#FFF3F3] border border-[#FCA5A5] text-xs text-[#991B1B]"
                              >
                                {receiveGeneralError}
                              </div>
                            )}

                            <div className="space-y-4">
                              {(requestDetail.items || []).map((item, idx) => {
                                const row = receiveItemsForm[item.id] || {};
                                const iErr = receiveItemErrors[idx] || {};
                                const updateRow = (field, val) => {
                                  setReceiveItemsForm((prev) => ({
                                    ...prev,
                                    [item.id]: {
                                      ...(prev[item.id] || {}),
                                      [field]: val,
                                    },
                                  }));
                                };

                                return (
                                  <div
                                    key={item.id}
                                    data-testid={`receive-item-card-${item.id}`}
                                    className="p-4 rounded-2xl border border-[#EAE3DC] bg-white space-y-3"
                                  >
                                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#EAE3DC] pb-2">
                                      <div>
                                        <span className="font-bold text-xs text-[#1A2420]">
                                          {item.product_name_snapshot}
                                        </span>{' '}
                                        <span className="font-mono text-[11px] text-[#FA661C]">
                                          ({item.sku_snapshot})
                                        </span>
                                      </div>
                                      <span className="text-xs font-mono font-bold text-[#6B6058]">
                                        Accepted Expected: {item.accepted_quantity ?? item.requested_quantity}
                                      </span>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                      <div>
                                        <label
                                          htmlFor={`recv-counted-${item.id}`}
                                          className="block text-[11px] font-bold text-[#1A2420] mb-1"
                                        >
                                          Counted Qty <span className="text-[#DC2626]">*</span>
                                        </label>
                                        <input
                                          id={`recv-counted-${item.id}`}
                                          data-testid={`receive-counted-${item.id}`}
                                          type="number"
                                          min="0"
                                          value={row.counted_quantity ?? ''}
                                          onChange={(e) =>
                                            updateRow('counted_quantity', e.target.value)
                                          }
                                          className="w-full px-3 py-2 rounded-xl border border-[#EAE3DC] text-xs font-mono"
                                        />
                                        {iErr.counted_quantity && (
                                          <p
                                            data-testid={`receive-error-counted-${item.id}`}
                                            className="text-[11px] font-semibold text-[#DC2626] mt-1"
                                          >
                                            {iErr.counted_quantity}
                                          </p>
                                        )}
                                      </div>

                                      <div>
                                        <label
                                          htmlFor={`recv-good-${item.id}`}
                                          className="block text-[11px] font-bold text-[#1A2420] mb-1"
                                        >
                                          Good Qty <span className="text-[#DC2626]">*</span>
                                        </label>
                                        <input
                                          id={`recv-good-${item.id}`}
                                          data-testid={`receive-good-${item.id}`}
                                          type="number"
                                          min="0"
                                          value={row.good_quantity ?? ''}
                                          onChange={(e) =>
                                            updateRow('good_quantity', e.target.value)
                                          }
                                          className="w-full px-3 py-2 rounded-xl border border-[#EAE3DC] text-xs font-mono"
                                        />
                                        {iErr.good_quantity && (
                                          <p className="text-[11px] font-semibold text-[#DC2626] mt-1">
                                            {iErr.good_quantity}
                                          </p>
                                        )}
                                      </div>

                                      <div>
                                        <label
                                          htmlFor={`recv-damaged-${item.id}`}
                                          className="block text-[11px] font-bold text-[#1A2420] mb-1"
                                        >
                                          Damaged Qty <span className="text-[#DC2626]">*</span>
                                        </label>
                                        <input
                                          id={`recv-damaged-${item.id}`}
                                          data-testid={`receive-damaged-${item.id}`}
                                          type="number"
                                          min="0"
                                          value={row.damaged_quantity ?? ''}
                                          onChange={(e) =>
                                            updateRow('damaged_quantity', e.target.value)
                                          }
                                          className="w-full px-3 py-2 rounded-xl border border-[#EAE3DC] text-xs font-mono"
                                        />
                                        {iErr.damaged_quantity && (
                                          <p className="text-[11px] font-semibold text-[#DC2626] mt-1">
                                            {iErr.damaged_quantity}
                                          </p>
                                        )}
                                      </div>
                                    </div>

                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                      <div>
                                        <label
                                          htmlFor={`recv-length-${item.id}`}
                                          className="block text-[11px] font-bold text-[#1A2420] mb-1"
                                        >
                                          Length (cm) <span className="text-[#DC2626]">*</span>
                                        </label>
                                        <input
                                          id={`recv-length-${item.id}`}
                                          data-testid={`receive-length-${item.id}`}
                                          type="text"
                                          value={row.length ?? ''}
                                          onChange={(e) => updateRow('length', e.target.value)}
                                          placeholder="e.g. 30.00"
                                          className="w-full px-3 py-2 rounded-xl border border-[#EAE3DC] text-xs font-mono"
                                        />
                                        {iErr.length && (
                                          <p className="text-[11px] font-semibold text-[#DC2626] mt-1">
                                            {iErr.length}
                                          </p>
                                        )}
                                      </div>

                                      <div>
                                        <label
                                          htmlFor={`recv-width-${item.id}`}
                                          className="block text-[11px] font-bold text-[#1A2420] mb-1"
                                        >
                                          Width (cm) <span className="text-[#DC2626]">*</span>
                                        </label>
                                        <input
                                          id={`recv-width-${item.id}`}
                                          data-testid={`receive-width-${item.id}`}
                                          type="text"
                                          value={row.width ?? ''}
                                          onChange={(e) => updateRow('width', e.target.value)}
                                          placeholder="e.g. 20.00"
                                          className="w-full px-3 py-2 rounded-xl border border-[#EAE3DC] text-xs font-mono"
                                        />
                                        {iErr.width && (
                                          <p className="text-[11px] font-semibold text-[#DC2626] mt-1">
                                            {iErr.width}
                                          </p>
                                        )}
                                      </div>

                                      <div>
                                        <label
                                          htmlFor={`recv-height-${item.id}`}
                                          className="block text-[11px] font-bold text-[#1A2420] mb-1"
                                        >
                                          Height (cm) <span className="text-[#DC2626]">*</span>
                                        </label>
                                        <input
                                          id={`recv-height-${item.id}`}
                                          data-testid={`receive-height-${item.id}`}
                                          type="text"
                                          value={row.height ?? ''}
                                          onChange={(e) => updateRow('height', e.target.value)}
                                          placeholder="e.g. 15.00"
                                          className="w-full px-3 py-2 rounded-xl border border-[#EAE3DC] text-xs font-mono"
                                        />
                                        {iErr.height && (
                                          <p className="text-[11px] font-semibold text-[#DC2626] mt-1">
                                            {iErr.height}
                                          </p>
                                        )}
                                      </div>

                                      <div>
                                        <label
                                          htmlFor={`recv-weight-${item.id}`}
                                          className="block text-[11px] font-bold text-[#1A2420] mb-1"
                                        >
                                          Weight (kg) <span className="text-[#DC2626]">*</span>
                                        </label>
                                        <input
                                          id={`recv-weight-${item.id}`}
                                          data-testid={`receive-weight-${item.id}`}
                                          type="text"
                                          value={row.weight ?? ''}
                                          onChange={(e) => updateRow('weight', e.target.value)}
                                          placeholder="e.g. 1.250"
                                          className="w-full px-3 py-2 rounded-xl border border-[#EAE3DC] text-xs font-mono"
                                        />
                                        {iErr.weight && (
                                          <p className="text-[11px] font-semibold text-[#DC2626] mt-1">
                                            {iErr.weight}
                                          </p>
                                        )}
                                      </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                      <div>
                                        <label
                                          htmlFor={`recv-location-${item.id}`}
                                          className="block text-[11px] font-bold text-[#1A2420] mb-1"
                                        >
                                          Storage Bin / Location{' '}
                                          <span className="text-[#DC2626]">*</span>
                                        </label>
                                        <input
                                          id={`recv-location-${item.id}`}
                                          data-testid={`receive-location-${item.id}`}
                                          type="text"
                                          value={row.location ?? ''}
                                          onChange={(e) => updateRow('location', e.target.value)}
                                          placeholder="e.g. A1-R2-B3"
                                          className="w-full px-3 py-2 rounded-xl border border-[#EAE3DC] text-xs font-mono"
                                        />
                                        {iErr.location && (
                                          <p
                                            data-testid={`receive-error-location-${item.id}`}
                                            className="text-[11px] font-semibold text-[#DC2626] mt-1"
                                          >
                                            {iErr.location}
                                          </p>
                                        )}
                                      </div>

                                      <div>
                                        <label
                                          htmlFor={`recv-disc-reason-${item.id}`}
                                          className="block text-[11px] font-bold text-[#1A2420] mb-1"
                                        >
                                          Item Discrepancy Reason (if short/damaged)
                                        </label>
                                        <input
                                          id={`recv-disc-reason-${item.id}`}
                                          data-testid={`receive-discrepancy-reason-${item.id}`}
                                          type="text"
                                          value={row.discrepancy_reason ?? ''}
                                          onChange={(e) =>
                                            updateRow('discrepancy_reason', e.target.value)
                                          }
                                          placeholder="Optional explanation for short count or damage..."
                                          className="w-full px-3 py-2 rounded-xl border border-[#EAE3DC] text-xs"
                                        />
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div>
                                <label
                                  htmlFor="recv-notes"
                                  className="block text-xs font-bold text-[#1A2420] mb-1"
                                >
                                  Receiving Notes (optional)
                                </label>
                                <textarea
                                  id="recv-notes"
                                  data-testid="receive-notes-input"
                                  rows={2}
                                  value={receiveNotes}
                                  onChange={(e) => setReceiveNotes(e.target.value)}
                                  className="w-full px-3 py-2 rounded-xl border border-[#EAE3DC] text-xs bg-white"
                                />
                              </div>

                              <div>
                                <label
                                  htmlFor="recv-reason"
                                  className="block text-xs font-bold text-[#1A2420] mb-1"
                                >
                                  Audit Reason <span className="text-[#DC2626]">*</span>
                                </label>
                                <textarea
                                  id="recv-reason"
                                  data-testid="receive-reason-input"
                                  rows={2}
                                  value={receiveReason}
                                  onChange={(e) => {
                                    setReceiveReason(e.target.value);
                                    setReceiveFieldErrors((fe) => ({ ...fe, reason: '' }));
                                  }}
                                  placeholder="Enter mandatory receiving audit reason..."
                                  className="w-full px-3 py-2 rounded-xl border border-[#EAE3DC] text-xs bg-white"
                                />
                                {receiveFieldErrors.reason && (
                                  <p
                                    data-testid="receive-error-reason"
                                    className="text-[11px] font-semibold text-[#DC2626] mt-1"
                                  >
                                    {receiveFieldErrors.reason}
                                  </p>
                                )}
                              </div>
                            </div>

                            <div className="flex justify-end">
                              <button
                                type="submit"
                                data-testid="receive-submit-btn"
                                disabled={receiveSubmitting}
                                className="px-5 py-2.5 rounded-xl bg-[#FA661C] hover:bg-[#E0530B] text-white text-xs font-bold cursor-pointer shadow-xs"
                              >
                                {receiveSubmitting
                                  ? 'Recording Receipt...'
                                  : 'Confirm & Record Receipt'}
                              </button>
                            </div>
                          </form>
                        )}

                        {/* DISCREPANCY VIEW & RESOLVE FORM (when status === 'discrepancy' or discrepancy info exists) */}
                        {(requestDetail.status === 'discrepancy' ||
                          requestDetail.seller_discrepancy_action !== 'none') && (
                          <div
                            data-testid="manager-discrepancy-panel"
                            className="p-5 rounded-2xl border border-[#FCA5A5] bg-[#FFF3F3]/60 space-y-4"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center space-x-2">
                                <Scale className="w-5 h-5 text-[#DC2626]" />
                                <h3 className="font-['Outfit'] font-extrabold text-base text-[#991B1B]">
                                  Discrepancy & Resolution Status
                                </h3>
                              </div>
                              <span
                                data-testid="manager-seller-discrepancy-action"
                                className="px-2.5 py-1 rounded-full text-xs font-bold bg-white text-[#991B1B] border border-[#FCA5A5]"
                              >
                                {DISCREPANCY_ACTION_LABELS[
                                  requestDetail.seller_discrepancy_action
                                ] || requestDetail.seller_discrepancy_action}
                              </span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                              <div>
                                <span className="text-[#7F1D1D] font-semibold">
                                  Seller Response Reason:
                                </span>{' '}
                                <span
                                  data-testid="manager-seller-response-reason"
                                  className="font-bold text-[#1A2420]"
                                >
                                  {requestDetail.seller_response_reason || '—'}
                                </span>
                                {requestDetail.seller_responded_at && (
                                  <div className="text-[11px] text-[#7F1D1D]">
                                    Responded at:{' '}
                                    {formatDateTime(requestDetail.seller_responded_at)}
                                  </div>
                                )}
                              </div>

                              {(requestDetail.resolution_reason ||
                                requestDetail.discrepancy_resolution_reason) && (
                                <div>
                                  <span className="text-[#7F1D1D] font-semibold">
                                    Resolution Reason:
                                  </span>{' '}
                                  <span className="font-bold text-[#1A2420]">
                                    {requestDetail.resolution_reason ||
                                      requestDetail.discrepancy_resolution_reason}
                                  </span>
                                  {(requestDetail.resolved_at ||
                                    requestDetail.discrepancy_resolved_at) && (
                                    <div className="text-[11px] text-[#7F1D1D]">
                                      Resolved at:{' '}
                                      {formatDateTime(
                                        requestDetail.resolved_at ||
                                          requestDetail.discrepancy_resolved_at
                                      )}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>

                            {requestDetail.status === 'discrepancy' && (
                              <form
                                onSubmit={handleResolveSubmit}
                                data-testid="manager-resolve-form"
                                className="p-4 rounded-2xl border border-[#EAE3DC] bg-white space-y-3"
                                noValidate
                              >
                                <h4 className="font-['Outfit'] font-extrabold text-sm text-[#1A2420]">
                                  Resolve Discrepancy (Final Accepted Quantities)
                                </h4>
                                {requestDetail.seller_discrepancy_action === 'pending' && (
                                  <p className="text-xs text-[#92400E] bg-[#FFFBEB] p-2.5 rounded-xl border border-[#F59E0B]/40 font-semibold">
                                    Note: The seller has not acknowledged or disputed this discrepancy yet. Warehouse managers can resolve after the seller responds (admins can resolve at any time).
                                  </p>
                                )}

                                {resolveGeneralError && (
                                  <div
                                    data-testid="manager-resolve-general-error"
                                    role="alert"
                                    className="p-3 rounded-xl bg-[#FFF3F3] border border-[#FCA5A5] text-xs text-[#991B1B]"
                                  >
                                    {resolveGeneralError}
                                  </div>
                                )}

                                <div className="space-y-2">
                                  {(requestDetail.items || []).map((item, idx) => {
                                    const iErr = resolveItemErrors[idx] || {};
                                    return (
                                      <div
                                        key={item.id}
                                        className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl border border-[#EAE3DC]"
                                      >
                                        <div className="text-xs">
                                          <div className="font-bold text-[#1A2420]">
                                            {item.product_name_snapshot} ({item.sku_snapshot})
                                          </div>
                                          <div className="text-[11px] text-[#6B6058]">
                                            Requested: {item.requested_quantity} • Counted:{' '}
                                            {item.received_quantity} • Good Initially:{' '}
                                            {item.good_quantity} • Damaged: {item.damaged_quantity}
                                          </div>
                                        </div>
                                        <div className="w-40">
                                          <label
                                            htmlFor={`resolve-qty-${item.id}`}
                                            className="block text-[10px] font-black uppercase text-[#6B6058] mb-1"
                                          >
                                            Final Accepted Qty
                                          </label>
                                          <input
                                            id={`resolve-qty-${item.id}`}
                                            data-testid={`manager-resolve-qty-${item.id}`}
                                            type="number"
                                            min="0"
                                            value={resolveItemQuantities[item.id] ?? ''}
                                            onChange={(e) =>
                                              setResolveItemQuantities((prev) => ({
                                                ...prev,
                                                [item.id]: e.target.value,
                                              }))
                                            }
                                            className="w-full px-3 py-1.5 rounded-xl border border-[#EAE3DC] text-xs font-mono"
                                          />
                                          {iErr.accepted_quantity && (
                                            <p className="text-[11px] font-semibold text-[#DC2626] mt-1">
                                              {iErr.accepted_quantity}
                                            </p>
                                          )}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>

                                <div>
                                  <label
                                    htmlFor="manager-resolve-reason"
                                    className="block text-xs font-bold text-[#1A2420] mb-1"
                                  >
                                    Resolution Reason <span className="text-[#DC2626]">*</span>
                                  </label>
                                  <textarea
                                    id="manager-resolve-reason"
                                    data-testid="manager-resolve-reason-input"
                                    rows={2}
                                    value={resolveReason}
                                    onChange={(e) => {
                                      setResolveReason(e.target.value);
                                      setResolveFieldErrors((fe) => ({ ...fe, reason: '' }));
                                    }}
                                    placeholder="Explain how the discrepancy was resolved..."
                                    className="w-full px-3 py-2 rounded-xl border border-[#EAE3DC] text-xs"
                                  />
                                  {resolveFieldErrors.reason && (
                                    <p
                                      data-testid="manager-resolve-error-reason"
                                      className="text-[11px] font-semibold text-[#DC2626] mt-1"
                                    >
                                      {resolveFieldErrors.reason}
                                    </p>
                                  )}
                                </div>

                                <div className="flex justify-end">
                                  <button
                                    type="submit"
                                    data-testid="manager-resolve-submit-btn"
                                    disabled={resolveSubmitting}
                                    className="px-4 py-2 rounded-xl bg-[#FA661C] hover:bg-[#E0530B] text-white text-xs font-bold cursor-pointer"
                                  >
                                    {resolveSubmitting
                                      ? 'Resolving...'
                                      : 'Resolve Discrepancy'}
                                  </button>
                                </div>
                              </form>
                            )}
                          </div>
                        )}
                      </div>
                    ) : null}
                  </section>
                ) : (
                  /* REQUESTS QUEUE TABLE */
                  <section
                    data-testid="manager-requests-queue-panel"
                    className="rounded-3xl border border-[#EAE3DC] bg-white shadow-2xs overflow-hidden"
                  >
                    <div className="p-5 border-b border-[#EAE3DC] flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <h2 className="font-['Outfit'] font-extrabold text-base text-[#1A2420]">
                          Storage Requests Queue — {warehouse.name}
                        </h2>
                        <p className="text-xs text-[#6B6058]">
                          Review incoming seller storage requests, record physical counts on arrival, and resolve discrepancies.
                        </p>
                      </div>

                      <div className="flex items-center space-x-2">
                        <label
                          htmlFor="manager-requests-status-filter"
                          className="text-xs font-bold text-[#6B6058]"
                        >
                          Status:
                        </label>
                        <select
                          id="manager-requests-status-filter"
                          data-testid="manager-requests-status-filter"
                          value={requestsStatusFilter}
                          onChange={(e) => {
                            setRequestsStatusFilter(e.target.value);
                            setRequestsPage(1);
                          }}
                          className="px-3 py-2 rounded-xl border border-[#EAE3DC] text-xs bg-white font-semibold"
                        >
                          <option value="">All Statuses</option>
                          {STORAGE_REQUEST_STATUSES.map((st) => {
                            const val = typeof st === 'string' ? st : st.value;
                            const lbl =
                              typeof st === 'string'
                                ? STATUS_LABELS[st] || st
                                : st.label;
                            return (
                              <option key={val} value={val}>
                                {lbl}
                              </option>
                            );
                          })}
                        </select>
                      </div>
                    </div>

                    {requestsError && (
                      <div
                        data-testid="manager-requests-error"
                        role="alert"
                        className="m-5 p-4 rounded-2xl bg-[#FFF3F3] border border-[#FCA5A5] text-xs text-[#991B1B]"
                      >
                        {requestsError}
                      </div>
                    )}

                    {requestsLoading ? (
                      <div className="p-8 text-center text-xs text-[#6B6058]">
                        Loading storage requests queue...
                      </div>
                    ) : requests.length === 0 ? (
                      <div
                        data-testid="manager-requests-empty"
                        className="p-8 text-center text-xs text-[#6B6058]"
                      >
                        No storage requests found for the selected status.
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-xs">
                          <thead>
                            <tr className="bg-[#FFF3EC]/60 border-b border-[#EAE3DC] text-[#6B6058] uppercase text-[10px] font-black tracking-wider">
                              <th className="py-3 px-4">ID</th>
                              <th className="py-3 px-4">Seller</th>
                              <th className="py-3 px-4">Items</th>
                              <th className="py-3 px-4">Expected / Tracking</th>
                              <th className="py-3 px-4">Status</th>
                              <th className="py-3 px-4 text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#EAE3DC]">
                            {requests.map((req) => (
                              <tr
                                key={req.id}
                                data-testid={`manager-request-row-${req.id}`}
                                className="hover:bg-[#FFF3EC]/20"
                              >
                                <td className="py-3.5 px-4 font-mono font-bold text-[#1A2420]">
                                  #{req.id}
                                </td>
                                <td className="py-3.5 px-4">
                                  <div className="font-bold text-[#1A2420]">
                                    {req.seller_business_name}
                                  </div>
                                  <div className="font-mono text-[11px] text-[#6B6058]">
                                    Seller #{req.vendor_id ?? req.seller}
                                  </div>
                                </td>
                                <td className="py-3.5 px-4">
                                  {(req.items || []).map((it) => (
                                    <div key={it.id} className="text-[11px]">
                                      <span className="font-semibold text-[#1A2420]">
                                        {it.sku_snapshot}
                                      </span>{' '}
                                      × {it.requested_quantity}
                                    </div>
                                  ))}
                                </td>
                                <td className="py-3.5 px-4 text-[11px] text-[#6B6058]">
                                  <div>Arrival: {req.expected_arrival || '—'}</div>
                                  {req.tracking_reference && (
                                    <div className="font-mono">
                                      Ref: {req.tracking_reference}
                                    </div>
                                  )}
                                </td>
                                <td className="py-3.5 px-4">
                                  <span
                                    data-testid={`manager-request-status-${req.id}`}
                                    className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${getStatusBadgeClass(
                                      req.status
                                    )}`}
                                  >
                                    {STATUS_LABELS[req.status] || req.status}
                                  </span>
                                </td>
                                <td className="py-3.5 px-4 text-right">
                                  <button
                                    type="button"
                                    data-testid={`manager-inspect-request-btn-${req.id}`}
                                    onClick={() => setSelectedRequestId(req.id)}
                                    className="px-3 py-1.5 rounded-xl border border-[#EAE3DC] bg-white hover:bg-[#FFF3EC] text-xs font-bold text-[#FA661C] cursor-pointer"
                                  >
                                    Inspect & Manage
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {(requestsPrev || requestsNext) && (
                      <div className="px-6 py-3 border-t border-[#EAE3DC] flex items-center justify-between text-xs">
                        <span className="text-[#6B6058]">
                          Page {requestsPage} • Total {requestsCount}
                        </span>
                        <div className="flex items-center space-x-2">
                          <button
                            type="button"
                            disabled={!requestsPrev}
                            onClick={() => setRequestsPage((p) => Math.max(1, p - 1))}
                            className="px-3 py-1.5 rounded-lg border border-[#EAE3DC] disabled:opacity-40 font-bold cursor-pointer inline-flex items-center space-x-1"
                          >
                            <ChevronLeft className="w-3.5 h-3.5" />
                            <span>Previous</span>
                          </button>
                          <button
                            type="button"
                            disabled={!requestsNext}
                            onClick={() => setRequestsPage((p) => p + 1)}
                            className="px-3 py-1.5 rounded-lg border border-[#EAE3DC] disabled:opacity-40 font-bold cursor-pointer inline-flex items-center space-x-1"
                          >
                            <span>Next</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    )}
                  </section>
                )}
              </>
            )}

            {/* SECTION 3: WAREHOUSE STOCK (READ-ONLY) */}
            {activeSection === 'stock' && warehouse && (
              <section
                data-testid="manager-stock-panel"
                className="rounded-3xl border border-[#EAE3DC] bg-white shadow-2xs overflow-hidden"
              >
                <div className="p-5 border-b border-[#EAE3DC] flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <h2 className="font-['Outfit'] font-extrabold text-base text-[#1A2420]">
                      Warehouse Stock Lots (Read-Only)
                    </h2>
                    <p className="text-xs text-[#6B6058]">
                      Physical stock lots held in {warehouse.name}. Warehouse custody stock is tracked separately from storefront sellable stock.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-end gap-2.5">
                    <div>
                      <label
                        htmlFor="manager-stock-seller-filter"
                        className="block text-[10px] font-black uppercase text-[#6B6058] mb-1"
                      >
                        Seller ID
                      </label>
                      <input
                        id="manager-stock-seller-filter"
                        data-testid="manager-stock-seller-filter"
                        type="text"
                        value={stockSellerFilter}
                        onChange={(e) => {
                          setStockSellerFilter(e.target.value);
                          setStockPage(1);
                        }}
                        placeholder="e.g. 8"
                        className="w-24 px-3 py-1.5 rounded-xl border border-[#EAE3DC] text-xs font-mono"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="manager-stock-variant-filter"
                        className="block text-[10px] font-black uppercase text-[#6B6058] mb-1"
                      >
                        Variant ID
                      </label>
                      <input
                        id="manager-stock-variant-filter"
                        data-testid="manager-stock-variant-filter"
                        type="text"
                        value={stockVariantFilter}
                        onChange={(e) => {
                          setStockVariantFilter(e.target.value);
                          setStockPage(1);
                        }}
                        placeholder="e.g. 22"
                        className="w-24 px-3 py-1.5 rounded-xl border border-[#EAE3DC] text-xs font-mono"
                      />
                    </div>
                  </div>
                </div>

                {stockError && (
                  <div
                    data-testid="manager-stock-error"
                    role="alert"
                    className="m-5 p-4 rounded-2xl bg-[#FFF3F3] border border-[#FCA5A5] text-xs text-[#991B1B]"
                  >
                    {stockError}
                  </div>
                )}

                {stockLoading ? (
                  <div className="p-8 text-center text-xs text-[#6B6058]">
                    Loading warehouse stock lots...
                  </div>
                ) : stockRows.length === 0 ? (
                  <div
                    data-testid="manager-stock-empty"
                    className="p-8 text-center text-xs text-[#6B6058]"
                  >
                    No warehouse stock lots match the current filters.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-[#FFF3EC]/60 border-b border-[#EAE3DC] text-[#6B6058] uppercase text-[10px] font-black tracking-wider">
                          <th className="py-3 px-4">Lot ID</th>
                          <th className="py-3 px-4">Seller</th>
                          <th className="py-3 px-4">Product & SKU Snapshot</th>
                          <th className="py-3 px-4 text-right">Received</th>
                          <th className="py-3 px-4 text-right">Available</th>
                          <th className="py-3 px-4 text-right">Damaged</th>
                          <th className="py-3 px-4">Dimensions & Weight</th>
                          <th className="py-3 px-4">Location</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#EAE3DC]">
                        {stockRows.map((lot) => (
                          <tr
                            key={lot.id}
                            data-testid={`manager-stock-row-${lot.id}`}
                            className="hover:bg-[#FFF3EC]/20"
                          >
                            <td className="py-3.5 px-4 font-mono font-bold text-[#1A2420]">
                              Lot #{lot.id}
                              <div className="text-[10px] text-[#6B6058]">
                                Item #{lot.source_request_item ?? lot.storage_request}
                              </div>
                            </td>
                            <td className="py-3.5 px-4">
                              <div className="font-bold text-[#1A2420]">
                                {lot.vendor_business_name || lot.seller_business_name}
                              </div>
                              <div className="font-mono text-[11px] text-[#6B6058]">
                                Seller #{lot.vendor ?? lot.seller}
                              </div>
                            </td>
                            <td className="py-3.5 px-4">
                              <div className="font-bold text-[#1A2420]">
                                {lot.product_name_snapshot}
                              </div>
                              <div className="font-mono text-[11px] text-[#FA661C]">
                                {lot.sku_snapshot} • Variant #{lot.variant_id ?? lot.variant}
                              </div>
                              <div className="text-[11px] text-[#6B6058]">
                                {formatAttributesSnapshot(lot.attributes_snapshot)}
                              </div>
                            </td>
                            <td className="py-3.5 px-4 text-right font-mono font-bold">
                              {lot.received_quantity}
                            </td>
                            <td className="py-3.5 px-4 text-right font-mono font-bold text-[#059669]">
                              {lot.available_quantity}
                            </td>
                            <td className="py-3.5 px-4 text-right font-mono font-bold text-[#DC2626]">
                              {lot.quarantined_quantity ?? lot.damaged_quantity ?? 0}
                            </td>
                            <td className="py-3.5 px-4 font-mono text-[11px]">
                              <div>
                                {formatDimensionsCm(
                                  lot.measured_length_cm ?? lot.length_cm,
                                  lot.measured_width_cm ?? lot.width_cm,
                                  lot.measured_height_cm ?? lot.height_cm
                                )}
                              </div>
                              <div className="text-[#6B6058]">
                                {formatWeightKg(
                                  lot.measured_weight_kg ?? lot.weight_kg
                                )}
                              </div>
                            </td>
                            <td className="py-3.5 px-4 font-mono text-xs font-semibold text-[#1A2420]">
                              {lot.location || lot.storage_location || '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {(stockPrev || stockNext) && (
                  <div className="px-6 py-3 border-t border-[#EAE3DC] flex items-center justify-between text-xs">
                    <span className="text-[#6B6058]">
                      Page {stockPage} • Total {stockCount}
                    </span>
                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        disabled={!stockPrev}
                        onClick={() => setStockPage((p) => Math.max(1, p - 1))}
                        className="px-3 py-1.5 rounded-lg border border-[#EAE3DC] disabled:opacity-40 font-bold cursor-pointer"
                      >
                        Previous
                      </button>
                      <button
                        type="button"
                        disabled={!stockNext}
                        onClick={() => setStockPage((p) => p + 1)}
                        className="px-3 py-1.5 rounded-lg border border-[#EAE3DC] disabled:opacity-40 font-bold cursor-pointer"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </section>
            )}

            {/* SECTION 4: STOCK MOVEMENTS LOG (READ-ONLY) */}
            {activeSection === 'movements' && warehouse && (
              <section
                data-testid="manager-movements-panel"
                className="rounded-3xl border border-[#EAE3DC] bg-white shadow-2xs overflow-hidden"
              >
                <div className="p-5 border-b border-[#EAE3DC] flex items-center justify-between">
                  <div>
                    <h2 className="font-['Outfit'] font-extrabold text-base text-[#1A2420]">
                      Append-Only Stock Movements Log (Read-Only)
                    </h2>
                    <p className="text-xs text-[#6B6058]">
                      Every receiving event and discrepancy resolution is recorded permanently.
                    </p>
                  </div>
                  <span className="text-xs font-bold text-[#6B6058]">
                    Total: {movementsCount}
                  </span>
                </div>

                {movementsError && (
                  <div
                    data-testid="manager-movements-error"
                    role="alert"
                    className="m-5 p-4 rounded-2xl bg-[#FFF3F3] border border-[#FCA5A5] text-xs text-[#991B1B]"
                  >
                    {movementsError}
                  </div>
                )}

                {movementsLoading ? (
                  <div className="p-8 text-center text-xs text-[#6B6058]">
                    Loading stock movements...
                  </div>
                ) : movements.length === 0 ? (
                  <div
                    data-testid="manager-movements-empty"
                    className="p-8 text-center text-xs text-[#6B6058]"
                  >
                    No stock movements recorded yet.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-[#FFF3EC]/60 border-b border-[#EAE3DC] text-[#6B6058] uppercase text-[10px] font-black tracking-wider">
                          <th className="py-3 px-4">ID & Time</th>
                          <th className="py-3 px-4">Movement Type</th>
                          <th className="py-3 px-4">SKU & Lot</th>
                          <th className="py-3 px-4 text-right">Delta</th>
                          <th className="py-3 px-4 text-right">Before → After</th>
                          <th className="py-3 px-4">Actor & Reason</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#EAE3DC]">
                        {movements.map((mv) => (
                          <tr
                            key={mv.id}
                            data-testid={`manager-movement-row-${mv.id}`}
                            className="hover:bg-[#FFF3EC]/20"
                          >
                            <td className="py-3.5 px-4">
                              <div className="font-mono font-bold text-[#1A2420]">
                                #{mv.id}
                              </div>
                              <div className="text-[11px] text-[#6B6058]">
                                {formatDateTime(mv.occurred_at)}
                              </div>
                            </td>
                            <td className="py-3.5 px-4">
                              <span className="inline-block px-2 py-0.5 rounded bg-[#FFF3EC] text-[#FA661C] font-mono font-bold text-[11px]">
                                {MOVEMENT_TYPE_LABELS[mv.movement_type] || mv.movement_type}
                              </span>
                            </td>
                            <td className="py-3.5 px-4">
                              <div className="font-bold text-[#1A2420]">
                                {mv.product_name_snapshot}
                              </div>
                              <div className="font-mono text-[11px] text-[#6B6058]">
                                {mv.sku_snapshot} • Lot #{mv.lot} • Req #{mv.storage_request}
                              </div>
                            </td>
                            <td className="py-3.5 px-4 text-right font-mono font-extrabold">
                              {mv.quantity_delta > 0
                                ? `+${mv.quantity_delta}`
                                : mv.quantity_delta}
                            </td>
                            <td className="py-3.5 px-4 text-right font-mono text-[11px] text-[#6B6058]">
                              {mv.before_quantity} → {mv.after_quantity}
                            </td>
                            <td className="py-3.5 px-4">
                              <div className="font-bold text-[#1A2420]">
                                {mv.actor_username}
                              </div>
                              <div className="text-[11px] text-[#6B6058]">{mv.reason}</div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {(movementsPrev || movementsNext) && (
                  <div className="px-6 py-3 border-t border-[#EAE3DC] flex items-center justify-between text-xs">
                    <span className="text-[#6B6058]">
                      Page {movementsPage} • Total {movementsCount}
                    </span>
                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        disabled={!movementsPrev}
                        onClick={() => setMovementsPage((p) => Math.max(1, p - 1))}
                        className="px-3 py-1.5 rounded-lg border border-[#EAE3DC] disabled:opacity-40 font-bold cursor-pointer"
                      >
                        Previous
                      </button>
                      <button
                        type="button"
                        disabled={!movementsNext}
                        onClick={() => setMovementsPage((p) => p + 1)}
                        className="px-3 py-1.5 rounded-lg border border-[#EAE3DC] disabled:opacity-40 font-bold cursor-pointer"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </section>
            )}

            {/* SECTION 5: WAREHOUSE RATE CARDS & READ-ONLY ESTIMATE CALCULATOR (Phase 3a) */}
            {activeSection === 'rate-cards' && warehouse && (
              <ManagerRateCardsSection
                warehouse={warehouse}
                initialSubView={deriveRateCardSubView(location.pathname)}
                onUnauthorized={handleUnauthorized}
              />
            )}
          </>
        )}
      </main>

      {/* MODAL: ACCEPT / REJECT / CLOSE STORAGE REQUEST */}
      {decisionModal && (
        <div
          data-testid="manager-decision-modal"
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-[#1A1A1A]/60 backdrop-blur-2xs flex items-center justify-center p-4"
        >
          <div className="bg-white rounded-3xl border border-[#EAE3DC] shadow-2xl max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#EAE3DC] pb-3">
              <h3 className="font-['Outfit'] font-extrabold text-lg text-[#1A2420]">
                {decisionModal.type === 'accept' &&
                  `Accept Storage Request #${decisionModal.request?.id}`}
                {decisionModal.type === 'reject' &&
                  `Reject Storage Request #${decisionModal.request?.id}`}
                {decisionModal.type === 'close' &&
                  `Close Storage Request #${decisionModal.request?.id}`}
              </h3>
              <button
                type="button"
                onClick={() => setDecisionModal(null)}
                className="p-1 text-[#6B6058] hover:text-[#1A2420] cursor-pointer"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {decisionGeneralError && (
              <div
                data-testid="manager-decision-general-error"
                role="alert"
                className="p-3.5 rounded-xl bg-[#FFF3F3] border border-[#FCA5A5] text-xs text-[#991B1B]"
              >
                {decisionGeneralError}
              </div>
            )}

            <form onSubmit={handleDecisionSubmit} className="space-y-3" noValidate>
              {decisionModal.type === 'accept' && (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label
                        htmlFor="accept-win-start"
                        className="block text-xs font-bold text-[#1A2420] mb-1"
                      >
                        Receiving Window Start (optional)
                      </label>
                      <input
                        id="accept-win-start"
                        data-testid="accept-window-start-input"
                        type="datetime-local"
                        value={acceptWindowStart}
                        onChange={(e) => setAcceptWindowStart(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-[#EAE3DC] text-xs"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="accept-win-end"
                        className="block text-xs font-bold text-[#1A2420] mb-1"
                      >
                        Receiving Window End (optional)
                      </label>
                      <input
                        id="accept-win-end"
                        data-testid="accept-window-end-input"
                        type="datetime-local"
                        value={acceptWindowEnd}
                        onChange={(e) => setAcceptWindowEnd(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-[#EAE3DC] text-xs"
                      />
                      {decisionFieldErrors.receiving_window_end && (
                        <p className="text-[11px] font-semibold text-[#DC2626] mt-1">
                          {decisionFieldErrors.receiving_window_end}
                        </p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="accept-instructions"
                      className="block text-xs font-bold text-[#1A2420] mb-1"
                    >
                      Receiving Instructions (optional)
                    </label>
                    <textarea
                      id="accept-instructions"
                      data-testid="accept-instructions-input"
                      rows={2}
                      value={acceptInstructions}
                      onChange={(e) => setAcceptInstructions(e.target.value)}
                      placeholder="Dock gate, packaging or labeling instructions..."
                      className="w-full px-3 py-2 rounded-xl border border-[#EAE3DC] text-xs"
                    />
                  </div>

                  <div className="space-y-2">
                    <span className="block text-xs font-bold text-[#1A2420]">
                      Per-Item Accepted Quantities
                    </span>
                    {(decisionModal.request?.items || []).map((it, idx) => {
                      const iErr = decisionItemErrors[idx] || {};
                      return (
                        <div
                          key={it.id}
                          className="flex items-center justify-between gap-3 p-2.5 rounded-xl border border-[#EAE3DC]"
                        >
                          <div className="text-xs">
                            <div className="font-bold text-[#1A2420]">
                              {it.product_name_snapshot}
                            </div>
                            <div className="font-mono text-[11px] text-[#6B6058]">
                              {it.sku_snapshot} (Requested: {it.requested_quantity})
                            </div>
                          </div>
                          <div className="w-28">
                            <input
                              type="number"
                              min="1"
                              max={it.requested_quantity}
                              data-testid={`accept-item-qty-${it.id}`}
                              value={acceptItemQuantities[it.id] ?? ''}
                              onChange={(e) =>
                                setAcceptItemQuantities((prev) => ({
                                  ...prev,
                                  [it.id]: e.target.value,
                                }))
                              }
                              className="w-full px-2.5 py-1.5 rounded-xl border border-[#EAE3DC] text-xs font-mono"
                            />
                            {iErr.accepted_quantity && (
                              <p className="text-[10px] font-semibold text-[#DC2626] mt-0.5">
                                {iErr.accepted_quantity}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}

              <div>
                <label
                  htmlFor="decision-reason"
                  className="block text-xs font-bold text-[#1A2420] mb-1"
                >
                  Reason <span className="text-[#DC2626]">*</span>
                </label>
                <textarea
                  id="decision-reason"
                  data-testid="manager-decision-reason-input"
                  rows={2}
                  value={decisionReason}
                  onChange={(e) => {
                    setDecisionReason(e.target.value);
                    setDecisionFieldErrors((fe) => ({ ...fe, reason: '' }));
                  }}
                  placeholder="Enter mandatory audit reason..."
                  className="w-full px-3 py-2 rounded-xl border border-[#EAE3DC] text-xs"
                />
                {decisionFieldErrors.reason && (
                  <p
                    data-testid="manager-decision-error-reason"
                    className="text-[11px] font-semibold text-[#DC2626] mt-1"
                  >
                    {decisionFieldErrors.reason}
                  </p>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setDecisionModal(null)}
                  className="px-4 py-2 rounded-xl border border-[#EAE3DC] text-xs font-bold text-[#6B6058] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  data-testid="manager-decision-submit-btn"
                  disabled={decisionSubmitting}
                  className={`px-4 py-2 rounded-xl text-white text-xs font-bold cursor-pointer ${
                    decisionModal.type === 'reject'
                      ? 'bg-[#DC2626] hover:bg-[#B91C1C]'
                      : decisionModal.type === 'accept'
                      ? 'bg-[#059669] hover:bg-[#047857]'
                      : 'bg-[#1A2420] hover:bg-[#334139]'
                  }`}
                >
                  {decisionSubmitting
                    ? 'Submitting...'
                    : decisionModal.type === 'accept'
                    ? 'Confirm Accept'
                    : decisionModal.type === 'reject'
                    ? 'Confirm Reject'
                    : 'Confirm Close'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
