import React, { useState, useEffect, useCallback } from 'react';
import {
  Warehouse,
  Users,
  History,
  Plus,
  Edit,
  Ban,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Copy,
  Check,
  KeyRound,
  ShieldAlert,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Boxes,
  ArrowRightLeft,
  Scale,
  FileText,
  X,
} from 'lucide-react';
import { apiRequest } from '../../../utils/api';
import AdminRateCardsSection from '../../warehouse/AdminRateCardsSection';
import {
  AdminShipmentsSection,
  AdminStockReconciliationSection,
  AdminHubOperationsSection,
  AdminReturnsSection,
} from '../../warehouse/AdminFulfilmentSection';
import {
  STORAGE_REQUEST_STATUSES,
  STATUS_LABELS,
  getStatusBadgeClass,
  DISCREPANCY_ACTION_LABELS,
  MOVEMENT_TYPE_LABELS,
  formatAttributesSnapshot,
  formatDimensionsCm,
  formatWeightKg,
  parseWarehouseApiError,
} from '../../../utils/warehouseUtils';

const KNOWN_FIELDS = [
  'name',
  'code',
  'address_line1',
  'address_line2',
  'city',
  'state',
  'postal_code',
  'country',
  'username',
  'email',
  'full_name',
  'warehouse_id',
  'user_id',
  'reason',
];

function normalizeFieldMsg(val) {
  if (Array.isArray(val)) {
    return val.map((item) => String(item)).join(' ');
  }
  if (val && typeof val === 'object') {
    return Object.values(val)
      .map((v) => normalizeFieldMsg(v))
      .join(' ');
  }
  return String(val || '');
}

/**
  * Extracts field-level errors and general error message from DRF or _validation_response payloads
  * without exposing raw JSON keys.
  */
export function parseWarehouseErrors(err) {
  const fieldErrors = {};
  const generalMessages = [];
  const data = err?.data;

  if (!data) {
    return {
      fieldErrors,
      generalError: err?.message || 'Request failed. Please try again.',
    };
  }

  if (typeof data === 'string') {
    return { fieldErrors, generalError: data };
  }

  const inspectObject = (obj) => {
    if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return;
    Object.entries(obj).forEach(([key, val]) => {
      if (key === 'detail') {
        if (typeof val === 'string') {
          generalMessages.push(val);
        } else if (Array.isArray(val)) {
          generalMessages.push(val.map((v) => String(v)).join(' '));
        } else if (val && typeof val === 'object') {
          inspectObject(val);
        }
        return;
      }
      if (key === 'non_field_errors' || key === '__all__') {
        generalMessages.push(normalizeFieldMsg(val));
        return;
      }
      if (KNOWN_FIELDS.includes(key)) {
        fieldErrors[key] = normalizeFieldMsg(val);
      } else {
        generalMessages.push(normalizeFieldMsg(val));
      }
    });
  };

  inspectObject(data);

  return {
    fieldErrors,
    generalError:
      generalMessages.filter(Boolean).join(' ') ||
      (Object.keys(fieldErrors).length === 0
        ? err?.message || 'Validation failed.'
        : ''),
  };
}

function formatDateTime(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return String(iso);
  return d.toLocaleString();
}

const INVITE_STATUS_DISPLAY = {
  pending: 'Invite Pending',
  used: 'Setup Completed',
  revoked: 'Invite Revoked',
  expired: 'Invite Expired',
  none: 'No Invite',
};

function deriveInviteStatus(userId, userObj, auditRows, assignmentRow) {
  if (assignmentRow?.user_is_active === false && assignmentRow?.invite_status === 'used') {
    return 'Deactivated';
  }
  if (assignmentRow?.invite_status) {
    return INVITE_STATUS_DISPLAY[assignmentRow.invite_status] || assignmentRow.invite_status;
  }

  const userAudits = (auditRows || []).filter((a) => {
    if (a.object_type === 'User' && Number(a.object_id) === Number(userId)) {
      return true;
    }
    if (
      a.object_type === 'WarehouseInvite' &&
      Number(a.new_values?.user_id) === Number(userId)
    ) {
      return true;
    }
    return false;
  });

  const userInviteIds = new Set(
    (auditRows || [])
      .filter(
        (a) =>
          a.object_type === 'WarehouseInvite' &&
          (a.action === 'invite_created' || a.action === 'invite_reissued') &&
          Number(a.new_values?.user_id) === Number(userId)
      )
      .map((a) => Number(a.object_id))
  );

  const relatedInviteAudits = (auditRows || []).filter(
    (a) =>
      (a.object_type === 'WarehouseInvite' &&
        (userInviteIds.has(Number(a.object_id)) ||
          Number(a.new_values?.user_id) === Number(userId))) ||
      (a.object_type === 'User' && Number(a.object_id) === Number(userId))
  );

  if (relatedInviteAudits.length > 0) {
    const latest = relatedInviteAudits[0];
    if (latest.action === 'manager_deactivated') {
      return 'Deactivated';
    }
    if (latest.action === 'manager_setup_completed') {
      return 'Setup Completed';
    }
    if (latest.action === 'invite_revoked') {
      return 'Invite Revoked';
    }
    if (latest.action === 'invite_reissued') {
      const exp = latest.new_values?.expires_at;
      if (exp && new Date(exp) <= new Date()) return 'Invite Expired';
      return 'Invite Reissued (Pending)';
    }
    if (latest.action === 'invite_created') {
      const exp = latest.new_values?.expires_at;
      if (exp && new Date(exp) <= new Date()) return 'Invite Expired';
      return 'Invite Pending';
    }
  }

  if (userObj) {
    return userObj.is_active ? 'Setup Completed' : 'Inactive / Pending';
  }
  if (userAudits.length > 0) {
    return 'Recorded';
  }
  return assignmentRow?.active_to ? 'Ended' : 'Active';
}

export default function WarehouseModule({ initialTab = 'warehouses' } = {}) {
  // 'warehouses' | 'managers' | 'requests' | 'stock' | 'movements' | 'rate-cards' | 'audit'
  const [activeTab, setActiveTab] = useState(initialTab);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  // Shared error/loading states
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [forbiddenError, setForbiddenError] = useState('');
  const [feedbackBanner, setFeedbackBanner] = useState('');

  // Tab 1: Warehouses state
  const [warehouses, setWarehouses] = useState([]);
  const [warehousesCount, setWarehousesCount] = useState(0);
  const [warehousesPage, setWarehousesPage] = useState(1);
  const [warehousesNext, setWarehousesNext] = useState(null);
  const [warehousesPrev, setWarehousesPrev] = useState(null);

  // Tab 2: Managers & Assignments state
  const [assignments, setAssignments] = useState([]);
  const [assignmentsCount, setAssignmentsCount] = useState(0);
  const [assignmentsPage, setAssignmentsPage] = useState(1);
  const [assignmentsNext, setAssignmentsNext] = useState(null);
  const [assignmentsPrev, setAssignmentsPrev] = useState(null);
  const [managerFilterWarehouseId, setManagerFilterWarehouseId] = useState('');
  const [managerFilterUserId, setManagerFilterUserId] = useState('');
  const [managerFilterActive, setManagerFilterActive] = useState('');
  const [managerUsersMap, setManagerUsersMap] = useState({});
  const [recentInviteAudits, setRecentInviteAudits] = useState([]);

  // Tab 3: Audit state
  const [auditLogs, setAuditLogs] = useState([]);
  const [auditCount, setAuditCount] = useState(0);
  const [auditPage, setAuditPage] = useState(1);
  const [auditNext, setAuditNext] = useState(null);
  const [auditPrev, setAuditPrev] = useState(null);
  const [auditFilterAction, setAuditFilterAction] = useState('');
  const [auditFilterObjectType, setAuditFilterObjectType] = useState('');
  const [auditFilterObjectId, setAuditFilterObjectId] = useState('');

  // Tab 4 (Phase 2): Storage Requests Oversight state
  const [adminRequests, setAdminRequests] = useState([]);
  const [adminRequestsCount, setAdminRequestsCount] = useState(0);
  const [adminRequestsPage, setAdminRequestsPage] = useState(1);
  const [adminRequestsNext, setAdminRequestsNext] = useState(null);
  const [adminRequestsPrev, setAdminRequestsPrev] = useState(null);
  const [reqFilterStatus, setReqFilterStatus] = useState('');
  const [reqFilterWarehouseId, setReqFilterWarehouseId] = useState('');
  const [reqFilterSellerId, setReqFilterSellerId] = useState('');
  const [adminRequestsLoading, setAdminRequestsLoading] = useState(false);
  const [adminRequestsError, setAdminRequestsError] = useState('');
  const [selectedAdminRequest, setSelectedAdminRequest] = useState(null);

  // Admin Resolve Discrepancy Modal / Form state
  const [adminResolveQuantities, setAdminResolveQuantities] = useState({});
  const [adminResolveReason, setAdminResolveReason] = useState('');
  const [adminResolveFieldErrors, setAdminResolveFieldErrors] = useState({});
  const [adminResolveItemErrors, setAdminResolveItemErrors] = useState([]);
  const [adminResolveGeneralError, setAdminResolveGeneralError] = useState('');
  const [adminResolveSubmitting, setAdminResolveSubmitting] = useState(false);

  // Tab 5 (Phase 2): Admin Warehouse Stock state
  const [adminStock, setAdminStock] = useState([]);
  const [adminStockCount, setAdminStockCount] = useState(0);
  const [adminStockPage, setAdminStockPage] = useState(1);
  const [adminStockNext, setAdminStockNext] = useState(null);
  const [adminStockPrev, setAdminStockPrev] = useState(null);
  const [adminStockWarehouseFilter, setAdminStockWarehouseFilter] = useState('');
  const [adminStockSellerFilter, setAdminStockSellerFilter] = useState('');
  const [adminStockLoading, setAdminStockLoading] = useState(false);
  const [adminStockError, setAdminStockError] = useState('');

  // Tab 6 (Phase 2): Admin Stock Movements state
  const [adminMovements, setAdminMovements] = useState([]);
  const [adminMovementsCount, setAdminMovementsCount] = useState(0);
  const [adminMovementsPage, setAdminMovementsPage] = useState(1);
  const [adminMovementsNext, setAdminMovementsNext] = useState(null);
  const [adminMovementsPrev, setAdminMovementsPrev] = useState(null);
  const [mvFilterWarehouseId, setMvFilterWarehouseId] = useState('');
  const [mvFilterSellerId, setMvFilterSellerId] = useState('');
  const [mvFilterVariantId, setMvFilterVariantId] = useState('');
  const [adminMovementsLoading, setAdminMovementsLoading] = useState(false);
  const [adminMovementsError, setAdminMovementsError] = useState('');

  // Warehouse Create / Edit / Deactivate Modal State
  const [warehouseModal, setWarehouseModal] = useState(null);
  const [warehouseForm, setWarehouseForm] = useState({
    name: '',
    code: '',
    address_line1: '',
    address_line2: '',
    city: '',
    state: '',
    postal_code: '',
    country: 'IN',
    reason: '',
  });
  const [warehouseFieldErrors, setWarehouseFieldErrors] = useState({});
  const [warehouseGeneralError, setWarehouseGeneralError] = useState('');
  const [warehouseSubmitting, setWarehouseSubmitting] = useState(false);

  // Invite Manager Modal & One-Time Setup Link State (in-memory only, cleared on close)
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [inviteForm, setInviteForm] = useState({
    username: '',
    email: '',
    full_name: '',
    warehouse_id: '',
    reason: '',
  });
  const [inviteFieldErrors, setInviteFieldErrors] = useState({});
  const [inviteGeneralError, setInviteGeneralError] = useState('');
  const [inviteSubmitting, setInviteSubmitting] = useState(false);
  const [oneTimeSetupLink, setOneTimeSetupLink] = useState('');
  const [setupLinkMeta, setSetupLinkMeta] = useState(null);
  const [copiedSetupLink, setCopiedSetupLink] = useState(false);

  // Manager Action Confirm Dialog State
  const [managerActionModal, setManagerActionModal] = useState(null);
  const [managerActionWarehouseId, setManagerActionWarehouseId] = useState('');
  const [managerActionReason, setManagerActionReason] = useState('');
  const [managerActionFieldErrors, setManagerActionFieldErrors] = useState({});
  const [managerActionGeneralError, setManagerActionGeneralError] = useState('');
  const [managerActionSubmitting, setManagerActionSubmitting] = useState(false);

  const buildOriginSetupUrl = (rawToken) => {
    const origin =
      typeof window !== 'undefined' && window.location?.origin
        ? window.location.origin
        : 'http://localhost:5173';
    return `${origin}/warehouse/setup?token=${encodeURIComponent(rawToken)}`;
  };

  // Fetch Warehouses
  const fetchWarehouses = useCallback(
    async (page = warehousesPage) => {
      const qs = page > 1 ? `?page=${page}` : '';
      const data = await apiRequest(`/api/admin/warehouse/warehouses/${qs}`);
      const results = Array.isArray(data) ? data : data?.results || [];
      setWarehouses(results);
      setWarehousesCount(
        typeof data?.count === 'number' ? data.count : results.length
      );
      setWarehousesNext(data?.next || null);
      setWarehousesPrev(data?.previous || null);
      return results;
    },
    [warehousesPage]
  );

  // Fetch Managers & Supplemental User/Invite Status
  const fetchManagers = useCallback(
    async (
      page = assignmentsPage,
      whFilter = managerFilterWarehouseId,
      uFilter = managerFilterUserId,
      actFilter = managerFilterActive
    ) => {
      const params = new URLSearchParams();
      if (page > 1) params.set('page', String(page));
      if (whFilter) params.set('warehouse_id', String(whFilter));
      if (uFilter.trim()) params.set('user_id', uFilter.trim());
      if (actFilter) params.set('active', actFilter);
      const qs = params.toString() ? `?${params.toString()}` : '';

      const [mgrData, usersData, inviteAuditData] = await Promise.all([
        apiRequest(`/api/admin/warehouse/managers/${qs}`),
        apiRequest('/api/accounts/users/?role=warehouse_manager&page_size=100').catch(
          () => null
        ),
        apiRequest('/api/admin/warehouse/audit/?page_size=100').catch(() => null),
      ]);

      const rows = Array.isArray(mgrData) ? mgrData : mgrData?.results || [];
      setAssignments(rows);
      setAssignmentsCount(
        typeof mgrData?.count === 'number' ? mgrData.count : rows.length
      );
      setAssignmentsNext(mgrData?.next || null);
      setAssignmentsPrev(mgrData?.previous || null);

      if (usersData) {
        const userRows = Array.isArray(usersData)
          ? usersData
          : usersData?.results || [];
        const map = {};
        userRows.forEach((u) => {
          map[u.id] = u;
        });
        setManagerUsersMap(map);
      }

      if (inviteAuditData) {
        const auditRows = Array.isArray(inviteAuditData)
          ? inviteAuditData
          : inviteAuditData?.results || [];
        setRecentInviteAudits(auditRows);
      }
    },
    [
      assignmentsPage,
      managerFilterWarehouseId,
      managerFilterUserId,
      managerFilterActive,
    ]
  );

  // Fetch Audit Log
  const fetchAudit = useCallback(
    async (
      page = auditPage,
      act = auditFilterAction,
      objType = auditFilterObjectType,
      objId = auditFilterObjectId
    ) => {
      const params = new URLSearchParams();
      if (page > 1) params.set('page', String(page));
      if (act.trim()) params.set('action', act.trim());
      if (objType.trim()) params.set('object_type', objType.trim());
      if (objId.trim()) params.set('object_id', objId.trim());
      const qs = params.toString() ? `?${params.toString()}` : '';

      const data = await apiRequest(`/api/admin/warehouse/audit/${qs}`);
      const rows = Array.isArray(data) ? data : data?.results || [];
      setAuditLogs(rows);
      setAuditCount(typeof data?.count === 'number' ? data.count : rows.length);
      setAuditNext(data?.next || null);
      setAuditPrev(data?.previous || null);
    },
    [auditPage, auditFilterAction, auditFilterObjectType, auditFilterObjectId]
  );

  // Fetch Admin Storage Requests (Phase 2)
  const fetchAdminRequests = useCallback(
    async (
      page = adminRequestsPage,
      status = reqFilterStatus,
      whId = reqFilterWarehouseId,
      sellerId = reqFilterSellerId
    ) => {
      setAdminRequestsLoading(true);
      setAdminRequestsError('');
      try {
        const params = new URLSearchParams();
        if (page > 1) params.set('page', String(page));
        if (status) params.set('status', status);
        if (whId) params.set('warehouse_id', String(whId));
        if (String(sellerId).trim()) params.set('seller_id', String(sellerId).trim());
        const qs = params.toString() ? `?${params.toString()}` : '';
        const data = await apiRequest(`/api/admin/warehouse/storage-requests/${qs}`);
        const rows = Array.isArray(data) ? data : data?.results || [];
        setAdminRequests(rows);
        setAdminRequestsCount(
          typeof data?.count === 'number' ? data.count : rows.length
        );
        setAdminRequestsNext(data?.next || null);
        setAdminRequestsPrev(data?.previous || null);
        return rows;
      } catch (err) {
        setAdminRequestsError(
          err?.data?.detail ||
            err?.message ||
            'Failed to load admin storage requests.'
        );
        return [];
      } finally {
        setAdminRequestsLoading(false);
      }
    },
    [adminRequestsPage, reqFilterStatus, reqFilterWarehouseId, reqFilterSellerId]
  );

  // Fetch Admin Warehouse Stock (Phase 2)
  const fetchAdminStock = useCallback(
    async (page = adminStockPage) => {
      setAdminStockLoading(true);
      setAdminStockError('');
      try {
        const qs = page > 1 ? `?page=${page}` : '';
        const data = await apiRequest(`/api/admin/warehouse/stock/${qs}`);
        const rows = Array.isArray(data) ? data : data?.results || [];
        setAdminStock(rows);
        setAdminStockCount(
          typeof data?.count === 'number' ? data.count : rows.length
        );
        setAdminStockNext(data?.next || null);
        setAdminStockPrev(data?.previous || null);
      } catch (err) {
        setAdminStockError(
          err?.data?.detail || err?.message || 'Failed to load admin warehouse stock.'
        );
      } finally {
        setAdminStockLoading(false);
      }
    },
    [adminStockPage]
  );

  // Fetch Admin Stock Movements (Phase 2)
  const fetchAdminMovements = useCallback(
    async (
      page = adminMovementsPage,
      whId = mvFilterWarehouseId,
      sellerId = mvFilterSellerId,
      variantId = mvFilterVariantId
    ) => {
      setAdminMovementsLoading(true);
      setAdminMovementsError('');
      try {
        const params = new URLSearchParams();
        if (page > 1) params.set('page', String(page));
        if (whId) params.set('warehouse_id', String(whId));
        if (String(sellerId).trim()) params.set('seller_id', String(sellerId).trim());
        if (String(variantId).trim()) {
          params.set('variant_id', String(variantId).trim());
        }
        const qs = params.toString() ? `?${params.toString()}` : '';
        const data = await apiRequest(`/api/admin/warehouse/movements/${qs}`);
        const rows = Array.isArray(data) ? data : data?.results || [];
        setAdminMovements(rows);
        setAdminMovementsCount(
          typeof data?.count === 'number' ? data.count : rows.length
        );
        setAdminMovementsNext(data?.next || null);
        setAdminMovementsPrev(data?.previous || null);
      } catch (err) {
        setAdminMovementsError(
          err?.data?.detail || err?.message || 'Failed to load admin stock movements.'
        );
      } finally {
        setAdminMovementsLoading(false);
      }
    },
    [adminMovementsPage, mvFilterWarehouseId, mvFilterSellerId, mvFilterVariantId]
  );

  const loadAll = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    setForbiddenError('');
    try {
      await Promise.all([
        fetchWarehouses(warehousesPage),
        fetchManagers(
          assignmentsPage,
          managerFilterWarehouseId,
          managerFilterUserId,
          managerFilterActive
        ),
        fetchAudit(
          auditPage,
          auditFilterAction,
          auditFilterObjectType,
          auditFilterObjectId
        ),
      ]);
    } catch (err) {
      if (err?.status === 401 || err?.status === 403) {
        setForbiddenError(
          err?.data?.detail ||
            'Admin staff authorization is required to access warehouse administration.'
        );
      } else {
        setLoadError(
          err?.data?.detail ||
            err?.message ||
            'Failed to load warehouse administration data from the server.'
        );
      }
    } finally {
      setLoading(false);
    }
  }, [
    fetchWarehouses,
    fetchManagers,
    fetchAudit,
    warehousesPage,
    assignmentsPage,
    managerFilterWarehouseId,
    managerFilterUserId,
    managerFilterActive,
    auditPage,
    auditFilterAction,
    auditFilterObjectType,
    auditFilterObjectId,
  ]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  useEffect(() => {
    if (activeTab === 'requests') {
      fetchAdminRequests(
        adminRequestsPage,
        reqFilterStatus,
        reqFilterWarehouseId,
        reqFilterSellerId
      );
    } else if (activeTab === 'stock') {
      fetchAdminStock(adminStockPage);
    } else if (activeTab === 'movements') {
      fetchAdminMovements(
        adminMovementsPage,
        mvFilterWarehouseId,
        mvFilterSellerId,
        mvFilterVariantId
      );
    }
  }, [
    activeTab,
    adminRequestsPage,
    reqFilterStatus,
    reqFilterWarehouseId,
    reqFilterSellerId,
    adminStockPage,
    adminMovementsPage,
    mvFilterWarehouseId,
    mvFilterSellerId,
    mvFilterVariantId,
    fetchAdminRequests,
    fetchAdminStock,
    fetchAdminMovements,
  ]);

  const handleRefreshAll = async () => {
    await loadAll();
    if (activeTab === 'requests') {
      await fetchAdminRequests(
        adminRequestsPage,
        reqFilterStatus,
        reqFilterWarehouseId,
        reqFilterSellerId
      );
    } else if (activeTab === 'stock') {
      await fetchAdminStock(adminStockPage);
    } else if (activeTab === 'movements') {
      await fetchAdminMovements(
        adminMovementsPage,
        mvFilterWarehouseId,
        mvFilterSellerId,
        mvFilterVariantId
      );
    }
  };

  // Inspect / Open Admin Request Detail & Resolve Form
  const openAdminRequestDetail = (req) => {
    setFeedbackBanner('');
    setAdminResolveFieldErrors({});
    setAdminResolveItemErrors([]);
    setAdminResolveGeneralError('');
    setAdminResolveReason('');
    const qtyMap = {};
    (req.items || []).forEach((it) => {
      qtyMap[it.id] =
        it.good_quantity != null
          ? String(it.good_quantity)
          : it.accepted_quantity != null
          ? String(it.accepted_quantity)
          : String(it.requested_quantity ?? 0);
    });
    setAdminResolveQuantities(qtyMap);
    setSelectedAdminRequest(req);
  };

  // Submit Admin Resolve Discrepancy (`POST /api/admin/warehouse/storage-requests/{id}/resolve/`)
  const handleAdminResolveSubmit = async (e) => {
    e.preventDefault();
    if (!selectedAdminRequest) return;
    setAdminResolveFieldErrors({});
    setAdminResolveItemErrors([]);
    setAdminResolveGeneralError('');
    setAdminResolveSubmitting(true);

    try {
      const payload = {
        reason: adminResolveReason,
        items: (selectedAdminRequest.items || []).map((it) => ({
          item_id: Number(it.id),
          accepted_quantity:
            adminResolveQuantities[it.id] !== undefined &&
            String(adminResolveQuantities[it.id]).trim() !== ''
              ? Number(adminResolveQuantities[it.id])
              : Number(it.good_quantity ?? 0),
        })),
      };

      const updated = await apiRequest(
        `/api/admin/warehouse/storage-requests/${selectedAdminRequest.id}/resolve/`,
        {
          method: 'POST',
          body: JSON.stringify(payload),
        }
      );

      setSelectedAdminRequest(updated);
      setFeedbackBanner(
        `Admin resolved discrepancy on storage request #${updated.id}. Status is now ${
          STATUS_LABELS[updated.status] || updated.status
        }.`
      );
      await fetchAdminRequests(
        adminRequestsPage,
        reqFilterStatus,
        reqFilterWarehouseId,
        reqFilterSellerId
      );
      await fetchAudit(
        auditPage,
        auditFilterAction,
        auditFilterObjectType,
        auditFilterObjectId
      );
    } catch (err) {
      const parsed = parseWarehouseApiError(err);
      setAdminResolveFieldErrors(parsed.fieldErrors);
      setAdminResolveItemErrors(parsed.itemErrors);
      setAdminResolveGeneralError(parsed.generalError);
      if (err?.status === 409) {
        const rows = await fetchAdminRequests(
          adminRequestsPage,
          reqFilterStatus,
          reqFilterWarehouseId,
          reqFilterSellerId
        );
        const refreshed = rows.find((r) => r.id === selectedAdminRequest.id);
        if (refreshed) setSelectedAdminRequest(refreshed);
      }
    } finally {
      setAdminResolveSubmitting(false);
    }
  };

  // Open Warehouse Create / Edit / Deactivate Modal
  const openCreateWarehouseModal = () => {
    setFeedbackBanner('');
    setWarehouseFieldErrors({});
    setWarehouseGeneralError('');
    setWarehouseForm({
      name: '',
      code: '',
      address_line1: '',
      address_line2: '',
      city: '',
      state: '',
      postal_code: '',
      country: 'IN',
      reason: '',
    });
    setWarehouseModal({ mode: 'create', record: null });
  };

  const openEditWarehouseModal = (wh) => {
    setFeedbackBanner('');
    setWarehouseFieldErrors({});
    setWarehouseGeneralError('');
    setWarehouseForm({
      name: wh.name || '',
      code: wh.code || '',
      address_line1: wh.address_line1 || '',
      address_line2: wh.address_line2 || '',
      city: wh.city || '',
      state: wh.state || '',
      postal_code: wh.postal_code || '',
      country: wh.country || 'IN',
      reason: '',
    });
    setWarehouseModal({ mode: 'edit', record: wh });
  };

  const openDeactivateWarehouseModal = (wh) => {
    setFeedbackBanner('');
    setWarehouseFieldErrors({});
    setWarehouseGeneralError('');
    setWarehouseForm((prev) => ({ ...prev, reason: '' }));
    setWarehouseModal({ mode: 'deactivate', record: wh });
  };

  const handleWarehouseModalSubmit = async (e) => {
    e.preventDefault();
    if (!warehouseModal) return;
    setWarehouseFieldErrors({});
    setWarehouseGeneralError('');
    setWarehouseSubmitting(true);

    try {
      if (warehouseModal.mode === 'create') {
        const created = await apiRequest('/api/admin/warehouse/warehouses/', {
          method: 'POST',
          body: JSON.stringify(warehouseForm),
        });
        setWarehouseModal(null);
        setFeedbackBanner(
          `Warehouse "${created.name}" (${created.code}) created.`
        );
      } else if (warehouseModal.mode === 'edit') {
        const updated = await apiRequest(
          `/api/admin/warehouse/warehouses/${warehouseModal.record.id}/`,
          {
            method: 'PATCH',
            body: JSON.stringify(warehouseForm),
          }
        );
        setWarehouseModal(null);
        setFeedbackBanner(
          `Warehouse "${updated.name}" (${updated.code}) updated.`
        );
      } else if (warehouseModal.mode === 'deactivate') {
        await apiRequest(
          `/api/admin/warehouse/warehouses/${warehouseModal.record.id}/`,
          {
            method: 'DELETE',
            body: JSON.stringify({ reason: warehouseForm.reason }),
          }
        );
        const deactivatedName = warehouseModal.record.name;
        setWarehouseModal(null);
        setFeedbackBanner(`Warehouse "${deactivatedName}" deactivated.`);
      }
      await loadAll();
    } catch (err) {
      const parsed = parseWarehouseErrors(err);
      setWarehouseFieldErrors(parsed.fieldErrors);
      setWarehouseGeneralError(parsed.generalError);
    } finally {
      setWarehouseSubmitting(false);
    }
  };

  // Invite Manager Modal handlers
  const activeWarehouses = warehouses.filter((w) => w.is_active);

  const openInviteModal = () => {
    setFeedbackBanner('');
    setInviteFieldErrors({});
    setInviteGeneralError('');
    setOneTimeSetupLink('');
    setSetupLinkMeta(null);
    setCopiedSetupLink(false);
    setInviteForm({
      username: '',
      email: '',
      full_name: '',
      warehouse_id: activeWarehouses[0]?.id ? String(activeWarehouses[0].id) : '',
      reason: '',
    });
    setInviteModalOpen(true);
  };

  const closeInviteModal = () => {
    setOneTimeSetupLink('');
    setSetupLinkMeta(null);
    setCopiedSetupLink(false);
    setInviteModalOpen(false);
    setInviteFieldErrors({});
    setInviteGeneralError('');
  };

  const handleInviteSubmit = async (e) => {
    e.preventDefault();
    setInviteFieldErrors({});
    setInviteGeneralError('');
    setInviteSubmitting(true);

    try {
      const payload = {
        username: inviteForm.username,
        email: inviteForm.email,
        full_name: inviteForm.full_name,
        warehouse_id: inviteForm.warehouse_id ? Number(inviteForm.warehouse_id) : '',
        reason: inviteForm.reason,
      };
      const res = await apiRequest('/api/accounts/users/warehouse-invite/', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      const link = buildOriginSetupUrl(res.setup_token);
      setOneTimeSetupLink(link);
      setSetupLinkMeta({
        username: res.username,
        email: res.email,
        expires_at: res.expires_at,
      });
      setFeedbackBanner(
        `Manager "${res.username}" invited. Copy the one-time setup link now.`
      );
      await loadAll();
    } catch (err) {
      const parsed = parseWarehouseErrors(err);
      setInviteFieldErrors(parsed.fieldErrors);
      setInviteGeneralError(parsed.generalError);
    } finally {
      setInviteSubmitting(false);
    }
  };

  const handleCopySetupLink = async () => {
    if (!oneTimeSetupLink) return;
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(oneTimeSetupLink);
      }
      setCopiedSetupLink(true);
    } catch {
      setCopiedSetupLink(true);
    }
  };

  // Manager Action Confirm Dialog handlers
  const openManagerActionDialog = (type, row) => {
    setFeedbackBanner('');
    setManagerActionFieldErrors({});
    setManagerActionGeneralError('');
    setManagerActionReason('');
    const defaultWh =
      activeWarehouses.find((w) => Number(w.id) !== Number(row.warehouse))?.id ||
      activeWarehouses[0]?.id ||
      '';
    setManagerActionWarehouseId(defaultWh ? String(defaultWh) : '');
    setManagerActionModal({
      type,
      userId: row.user,
      username: row.username,
      currentWarehouseId: row.warehouse,
      currentWarehouseName: row.warehouse_name,
    });
  };

  const closeManagerActionDialog = () => {
    setManagerActionModal(null);
    setManagerActionReason('');
    setManagerActionFieldErrors({});
    setManagerActionGeneralError('');
  };

  const handleManagerActionSubmit = async (e) => {
    e.preventDefault();
    if (!managerActionModal) return;
    setManagerActionFieldErrors({});
    setManagerActionGeneralError('');
    setManagerActionSubmitting(true);

    const { type, userId, username } = managerActionModal;

    try {
      if (type === 'reissue') {
        const res = await apiRequest('/api/accounts/warehouse-invite/reissue/', {
          method: 'POST',
          body: JSON.stringify({
            user_id: Number(userId),
            reason: managerActionReason,
          }),
        });
        closeManagerActionDialog();
        const link = buildOriginSetupUrl(res.setup_token);
        setOneTimeSetupLink(link);
        setSetupLinkMeta({
          username,
          expires_at: res.expires_at,
        });
        setCopiedSetupLink(false);
        setInviteModalOpen(true);
        setFeedbackBanner(
          `Invite reissued for "${username}". Copy the new one-time setup link now.`
        );
      } else if (type === 'revoke') {
        const res = await apiRequest('/api/accounts/warehouse-invite/revoke/', {
          method: 'POST',
          body: JSON.stringify({
            user_id: Number(userId),
            reason: managerActionReason,
          }),
        });
        closeManagerActionDialog();
        setFeedbackBanner(
          `Invite revoked for "${username}" (${res?.revoked_count ?? 0} active invite(s) revoked).`
        );
      } else if (type === 'assign') {
        const res = await apiRequest('/api/admin/warehouse/managers/assign/', {
          method: 'POST',
          body: JSON.stringify({
            user_id: Number(userId),
            warehouse_id: managerActionWarehouseId
              ? Number(managerActionWarehouseId)
              : '',
            reason: managerActionReason,
          }),
        });
        closeManagerActionDialog();
        setFeedbackBanner(
          `Assigned "${username}" to warehouse "${res.warehouse_name || `#${res.warehouse}`}".`
        );
      } else if (type === 'end-assignment') {
        await apiRequest(
          `/api/admin/warehouse/managers/${userId}/end-assignment/`,
          {
            method: 'POST',
            body: JSON.stringify({ reason: managerActionReason }),
          }
        );
        closeManagerActionDialog();
        setFeedbackBanner(`Ended active warehouse assignment for "${username}".`);
      } else if (type === 'deactivate') {
        await apiRequest(
          `/api/admin/warehouse/managers/${userId}/deactivate/`,
          {
            method: 'POST',
            body: JSON.stringify({ reason: managerActionReason }),
          }
        );
        closeManagerActionDialog();
        setFeedbackBanner(
          `Warehouse manager "${username}" deactivated and tokens invalidated.`
        );
      }
      await loadAll();
    } catch (err) {
      const parsed = parseWarehouseErrors(err);
      setManagerActionFieldErrors(parsed.fieldErrors);
      setManagerActionGeneralError(parsed.generalError);
    } finally {
      setManagerActionSubmitting(false);
    }
  };

  // Filtered admin stock (client-side warehouse/seller filter on loaded stock rows)
  const filteredAdminStock = adminStock.filter((lot) => {
    if (
      adminStockWarehouseFilter &&
      String(lot.warehouse) !== String(adminStockWarehouseFilter)
    ) {
      return false;
    }
    if (
      adminStockSellerFilter.trim() &&
      String(lot.vendor ?? lot.seller) !== String(adminStockSellerFilter.trim())
    ) {
      return false;
    }
    return true;
  });

  if (forbiddenError) {
    return (
      <div
        data-testid="warehouse-admin-forbidden"
        role="alert"
        className="p-8 rounded-3xl border border-[#FCA5A5] bg-[#FFF3F3] text-center space-y-3"
      >
        <ShieldAlert className="w-8 h-8 text-[#DC2626] mx-auto" />
        <h2 className="font-['Outfit'] font-extrabold text-xl text-[#991B1B]">
          Admin Authorization Required
        </h2>
        <p className="text-xs text-[#7F1D1D] max-w-md mx-auto">{forbiddenError}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-6 rounded-3xl border border-[#EAE3DC] bg-white shadow-2xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#FFF3EC] text-[#FA661C] border border-[#FA661C]/20">
              Warehouse Phase 1 & Phase 2
            </span>
            <span className="text-xs text-[#6B6058] font-medium">
              Audited Administration & Oversight
            </span>
          </div>
          <h1 className="font-['Outfit'] font-extrabold text-xl sm:text-2xl text-[#1A2420]">
            Warehouse, Manager & Storage Oversight
          </h1>
          <p className="text-xs text-[#6B6058]">
            Manage physical warehouses, manager invites, storage requests across all facilities, discrepancy resolution, warehouse stock lots, and immutable audit logs.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={handleRefreshAll}
            disabled={loading}
            data-testid="warehouse-admin-refresh-btn"
            className="px-3.5 py-2 rounded-xl border border-[#EAE3DC] bg-white hover:bg-[#FFF3EC] text-xs font-bold text-[#1A2420] flex items-center space-x-1.5 transition-colors cursor-pointer"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 text-[#FA661C] ${loading ? 'animate-spin' : ''}`}
            />
            <span>Refresh</span>
          </button>

          <button
            type="button"
            onClick={openCreateWarehouseModal}
            data-testid="open-create-warehouse-btn"
            className="px-3.5 py-2 rounded-xl border border-[#FA661C] bg-[#FFF3EC] hover:bg-[#FA661C] text-[#FA661C] hover:text-white text-xs font-bold flex items-center space-x-1.5 transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Warehouse</span>
          </button>

          <button
            type="button"
            onClick={openInviteModal}
            data-testid="open-invite-manager-btn"
            className="px-4 py-2 rounded-xl bg-[#FA661C] hover:bg-[#E0530B] text-white text-xs font-bold flex items-center space-x-1.5 transition-colors cursor-pointer shadow-xs"
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>Invite a Manager</span>
          </button>
        </div>
      </div>

      {/* Server Confirmation Banner */}
      {feedbackBanner && (
        <div
          data-testid="warehouse-feedback-banner"
          role="status"
          className="p-4 rounded-2xl bg-[#ECFDF5] border border-[#10B981]/40 flex items-center justify-between gap-3 text-xs text-[#065F46]"
        >
          <div className="flex items-center space-x-2.5">
            <CheckCircle2 className="w-4 h-4 text-[#10B981] shrink-0" />
            <span className="font-semibold">{feedbackBanner}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedbackBanner('')}
            className="text-[#065F46] hover:text-[#047857] cursor-pointer"
            aria-label="Dismiss message"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Backend Stopped / Network Error State */}
      {loadError && (
        <div
          data-testid="warehouse-admin-error"
          role="alert"
          className="p-6 rounded-3xl border border-[#FCA5A5] bg-[#FFF3F3] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
        >
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-[#DC2626] shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h2 className="font-['Outfit'] font-extrabold text-sm text-[#991B1B]">
                Error Loading Warehouse Administration Data
              </h2>
              <p className="text-xs text-[#7F1D1D]">{loadError}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={loadAll}
            className="px-4 py-2 rounded-xl bg-[#DC2626] hover:bg-[#B91C1C] text-white text-xs font-bold cursor-pointer shrink-0"
          >
            Retry
          </button>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-[#EAE3DC] pb-3">
        <button
          type="button"
          data-testid="warehouse-tab-warehouses"
          onClick={() => setActiveTab('warehouses')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center space-x-2 transition-all cursor-pointer ${
            activeTab === 'warehouses'
              ? 'bg-[#FA661C] text-white shadow-xs'
              : 'bg-white text-[#6B6058] border border-[#EAE3DC] hover:text-[#FA661C]'
          }`}
        >
          <Warehouse className="w-4 h-4" />
          <span>Warehouses ({warehousesCount})</span>
        </button>

        <button
          type="button"
          data-testid="warehouse-tab-managers"
          onClick={() => setActiveTab('managers')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center space-x-2 transition-all cursor-pointer ${
            activeTab === 'managers'
              ? 'bg-[#FA661C] text-white shadow-xs'
              : 'bg-white text-[#6B6058] border border-[#EAE3DC] hover:text-[#FA661C]'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Managers & Assignments ({assignmentsCount})</span>
        </button>

        <button
          type="button"
          data-testid="warehouse-tab-requests"
          onClick={() => setActiveTab('requests')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center space-x-2 transition-all cursor-pointer ${
            activeTab === 'requests'
              ? 'bg-[#FA661C] text-white shadow-xs'
              : 'bg-white text-[#6B6058] border border-[#EAE3DC] hover:text-[#FA661C]'
          }`}
        >
          <ClipboardList className="w-4 h-4" />
          <span>Storage Requests</span>
        </button>

        <button
          type="button"
          data-testid="warehouse-tab-stock"
          onClick={() => setActiveTab('stock')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center space-x-2 transition-all cursor-pointer ${
            activeTab === 'stock'
              ? 'bg-[#FA661C] text-white shadow-xs'
              : 'bg-white text-[#6B6058] border border-[#EAE3DC] hover:text-[#FA661C]'
          }`}
        >
          <Boxes className="w-4 h-4" />
          <span>Warehouse Stock</span>
        </button>

        <button
          type="button"
          data-testid="warehouse-tab-movements"
          onClick={() => setActiveTab('movements')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center space-x-2 transition-all cursor-pointer ${
            activeTab === 'movements'
              ? 'bg-[#FA661C] text-white shadow-xs'
              : 'bg-white text-[#6B6058] border border-[#EAE3DC] hover:text-[#FA661C]'
          }`}
        >
          <ArrowRightLeft className="w-4 h-4" />
          <span>Stock Movements</span>
        </button>

        <button
          type="button"
          data-testid="warehouse-tab-rate-cards"
          onClick={() => setActiveTab('rate-cards')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center space-x-2 transition-all cursor-pointer ${
            activeTab === 'rate-cards'
              ? 'bg-[#FA661C] text-white shadow-xs'
              : 'bg-white text-[#6B6058] border border-[#EAE3DC] hover:text-[#FA661C]'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Rate Cards</span>
        </button>

        <button
          type="button"
          data-testid="warehouse-tab-shipments"
          onClick={() => setActiveTab('shipments')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center space-x-2 transition-all cursor-pointer ${
            activeTab === 'shipments'
              ? 'bg-[#FA661C] text-white shadow-xs'
              : 'bg-white text-[#6B6058] border border-[#EAE3DC] hover:text-[#FA661C]'
          }`}
        >
          <Boxes className="w-4 h-4" />
          <span>Shipments</span>
        </button>

        <button
          type="button"
          data-testid="warehouse-tab-reconciliation"
          onClick={() => setActiveTab('reconciliation')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center space-x-2 transition-all cursor-pointer ${
            activeTab === 'reconciliation'
              ? 'bg-[#FA661C] text-white shadow-xs'
              : 'bg-white text-[#6B6058] border border-[#EAE3DC] hover:text-[#FA661C]'
          }`}
        >
          <Scale className="w-4 h-4" />
          <span>Stock Reconciliation</span>
        </button>

        <button
          type="button"
          data-testid="warehouse-tab-hub-assignments"
          onClick={() => setActiveTab('hub-assignments')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center space-x-2 transition-all cursor-pointer ${
            activeTab === 'hub-assignments'
              ? 'bg-[#FA661C] text-white shadow-xs'
              : 'bg-white text-[#6B6058] border border-[#EAE3DC] hover:text-[#FA661C]'
          }`}
        >
          <Warehouse className="w-4 h-4" />
          <span>Hub Assignments &amp; Handovers</span>
        </button>

        <button
          type="button"
          data-testid="warehouse-tab-returns"
          onClick={() => setActiveTab('returns')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center space-x-2 transition-all cursor-pointer ${
            activeTab === 'returns'
              ? 'bg-[#FA661C] text-white shadow-xs'
              : 'bg-white text-[#6B6058] border border-[#EAE3DC] hover:text-[#FA661C]'
          }`}
        >
          <Boxes className="w-4 h-4" />
          <span>Warehouse Returns</span>
        </button>

        <button
          type="button"
          data-testid="warehouse-tab-audit"
          onClick={() => setActiveTab('audit')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center space-x-2 transition-all cursor-pointer ${
            activeTab === 'audit'
              ? 'bg-[#FA661C] text-white shadow-xs'
              : 'bg-white text-[#6B6058] border border-[#EAE3DC] hover:text-[#FA661C]'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Audit Log ({auditCount})</span>
        </button>
      </div>

      {/* TAB 1: WAREHOUSES */}
      {activeTab === 'warehouses' && !loadError && (
        <section
          data-testid="warehouses-panel"
          className="rounded-3xl border border-[#EAE3DC] bg-white shadow-2xs overflow-hidden"
        >
          <div className="px-6 py-4 border-b border-[#EAE3DC] flex items-center justify-between">
            <div>
              <h2 className="font-['Outfit'] font-extrabold text-base text-[#1A2420]">
                Registered Warehouses
              </h2>
              <p className="text-xs text-[#6B6058]">
                Every creation, update, and deactivation requires an audit reason.
              </p>
            </div>
            <span className="text-xs font-bold text-[#6B6058]">
              Total: {warehousesCount}
            </span>
          </div>

          {loading ? (
            <div className="p-8 text-center text-xs text-[#6B6058]">
              Loading warehouses from server...
            </div>
          ) : warehouses.length === 0 ? (
            <div className="p-8 text-center text-xs text-[#6B6058]">
              No warehouses found on the server.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#FFF3EC]/60 border-b border-[#EAE3DC] text-[#6B6058] uppercase text-[10px] font-black tracking-wider">
                    <th className="py-3 px-4">ID</th>
                    <th className="py-3 px-4">Name & Code</th>
                    <th className="py-3 px-4">Address</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Updated</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EAE3DC]">
                  {warehouses.map((wh) => (
                    <tr
                      key={wh.id}
                      data-testid={`warehouse-row-${wh.id}`}
                      className="hover:bg-[#FFF3EC]/20"
                    >
                      <td className="py-3.5 px-4 font-mono font-bold text-[#1A2420]">
                        #{wh.id}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-[#1A2420]">{wh.name}</div>
                        <div className="font-mono text-[11px] text-[#6B6058]">
                          Code: {wh.code}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-[#6B6058]">
                        {[
                          wh.address_line1,
                          wh.address_line2,
                          wh.city,
                          wh.state,
                          wh.postal_code,
                          wh.country,
                        ]
                          .filter(Boolean)
                          .join(', ')}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          data-testid={`warehouse-status-${wh.id}`}
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                            wh.is_active
                              ? 'bg-[#ECFDF5] text-[#065F46] border border-[#10B981]/30'
                              : 'bg-[#FFF3F3] text-[#991B1B] border border-[#FCA5A5]'
                          }`}
                        >
                          {wh.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-[11px] text-[#6B6058]">
                        {formatDateTime(wh.updated_at)}
                      </td>
                      <td className="py-3.5 px-4 text-right space-x-2 whitespace-nowrap">
                        <button
                          type="button"
                          data-testid={`edit-warehouse-btn-${wh.id}`}
                          onClick={() => openEditWarehouseModal(wh)}
                          className="px-2.5 py-1.5 rounded-lg border border-[#EAE3DC] bg-white hover:bg-[#FFF3EC] text-[#1A2420] font-bold text-[11px] inline-flex items-center space-x-1 cursor-pointer"
                        >
                          <Edit className="w-3 h-3 text-[#FA661C]" />
                          <span>Edit</span>
                        </button>

                        {wh.is_active && (
                          <button
                            type="button"
                            data-testid={`deactivate-warehouse-btn-${wh.id}`}
                            onClick={() => openDeactivateWarehouseModal(wh)}
                            className="px-2.5 py-1.5 rounded-lg border border-[#FCA5A5] bg-[#FFF3F3] hover:bg-[#FEE2E2] text-[#DC2626] font-bold text-[11px] inline-flex items-center space-x-1 cursor-pointer"
                          >
                            <Ban className="w-3 h-3" />
                            <span>Deactivate</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {(warehousesPrev || warehousesNext) && (
            <div className="px-6 py-3 border-t border-[#EAE3DC] flex items-center justify-between text-xs">
              <span className="text-[#6B6058]">Page {warehousesPage}</span>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  disabled={!warehousesPrev}
                  onClick={() => setWarehousesPage((p) => Math.max(1, p - 1))}
                  className="px-3 py-1.5 rounded-lg border border-[#EAE3DC] disabled:opacity-40 font-bold cursor-pointer"
                >
                  Previous
                </button>
                <button
                  type="button"
                  disabled={!warehousesNext}
                  onClick={() => setWarehousesPage((p) => p + 1)}
                  className="px-3 py-1.5 rounded-lg border border-[#EAE3DC] disabled:opacity-40 font-bold cursor-pointer"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </section>
      )}

      {/* TAB 2: MANAGERS & ASSIGNMENTS */}
      {activeTab === 'managers' && !loadError && (
        <section
          data-testid="managers-panel"
          className="rounded-3xl border border-[#EAE3DC] bg-white shadow-2xs overflow-hidden space-y-4"
        >
          <div className="p-5 border-b border-[#EAE3DC] flex flex-wrap items-end justify-between gap-3">
            <div className="flex flex-wrap items-end gap-3">
              <div>
                <label
                  htmlFor="mgr-filter-warehouse"
                  className="block text-[10px] font-black uppercase text-[#6B6058] mb-1"
                >
                  Filter by Warehouse
                </label>
                <select
                  id="mgr-filter-warehouse"
                  data-testid="manager-filter-warehouse"
                  value={managerFilterWarehouseId}
                  onChange={(e) => {
                    setManagerFilterWarehouseId(e.target.value);
                    setAssignmentsPage(1);
                  }}
                  className="px-3 py-2 rounded-xl border border-[#EAE3DC] text-xs bg-white"
                >
                  <option value="">All Warehouses</option>
                  {warehouses.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name} ({w.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="mgr-filter-user"
                  className="block text-[10px] font-black uppercase text-[#6B6058] mb-1"
                >
                  User ID
                </label>
                <input
                  id="mgr-filter-user"
                  data-testid="manager-filter-userid"
                  type="text"
                  value={managerFilterUserId}
                  onChange={(e) => {
                    setManagerFilterUserId(e.target.value);
                    setAssignmentsPage(1);
                  }}
                  placeholder="e.g. 195"
                  className="w-28 px-3 py-2 rounded-xl border border-[#EAE3DC] text-xs"
                />
              </div>

              <div>
                <label
                  htmlFor="mgr-filter-active"
                  className="block text-[10px] font-black uppercase text-[#6B6058] mb-1"
                >
                  Assignment Status
                </label>
                <select
                  id="mgr-filter-active"
                  data-testid="manager-filter-active"
                  value={managerFilterActive}
                  onChange={(e) => {
                    setManagerFilterActive(e.target.value);
                    setAssignmentsPage(1);
                  }}
                  className="px-3 py-2 rounded-xl border border-[#EAE3DC] text-xs bg-white"
                >
                  <option value="">All Assignments</option>
                  <option value="true">Active Only</option>
                  <option value="false">Ended / Inactive</option>
                </select>
              </div>
            </div>

            <button
              type="button"
              onClick={openInviteModal}
              className="px-4 py-2 rounded-xl bg-[#FA661C] hover:bg-[#E0530B] text-white text-xs font-bold flex items-center space-x-1.5 cursor-pointer"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Invite a Manager</span>
            </button>
          </div>

          {loading ? (
            <div className="p-8 text-center text-xs text-[#6B6058]">
              Loading warehouse manager assignments...
            </div>
          ) : assignments.length === 0 ? (
            <div className="p-8 text-center text-xs text-[#6B6058]">
              No manager assignments match the current filters.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#FFF3EC]/60 border-b border-[#EAE3DC] text-[#6B6058] uppercase text-[10px] font-black tracking-wider">
                    <th className="py-3 px-4">Manager</th>
                    <th className="py-3 px-4">Email</th>
                    <th className="py-3 px-4">Warehouse</th>
                    <th className="py-3 px-4">Assignment Status</th>
                    <th className="py-3 px-4">Invite Status</th>
                    <th className="py-3 px-4 text-right">Audited Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EAE3DC]">
                  {assignments.map((row) => {
                    const userObj = managerUsersMap[row.user];
                    const email = row.email || userObj?.email || '—';
                    const isEnded = Boolean(row.active_to);
                    const inviteStatus = deriveInviteStatus(
                      row.user,
                      userObj,
                      recentInviteAudits,
                      row
                    );

                    return (
                      <tr
                        key={row.id}
                        data-testid={`manager-assignment-row-${row.id}`}
                        className="hover:bg-[#FFF3EC]/20"
                      >
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-[#1A2420]">
                            {row.username}
                          </div>
                          <div className="font-mono text-[11px] text-[#6B6058]">
                            User #{row.user} • Assignment #{row.id}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-[#1A2420]">{email}</td>
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-[#1A2420]">
                            {row.warehouse_name}
                          </div>
                          <div className="font-mono text-[11px] text-[#6B6058]">
                            Warehouse #{row.warehouse}
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            data-testid={`assignment-status-${row.id}`}
                            className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                              !isEnded
                                ? 'bg-[#ECFDF5] text-[#065F46] border border-[#10B981]/30'
                                : 'bg-slate-100 text-slate-700 border border-slate-300'
                            }`}
                          >
                            {!isEnded ? 'Active' : 'Ended'}
                          </span>
                          <div className="text-[10px] text-[#6B6058] mt-1">
                            From: {formatDateTime(row.active_from)}
                            {row.active_to
                              ? ` • To: ${formatDateTime(row.active_to)}`
                              : ''}
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            data-testid={`invite-status-${row.id}`}
                            className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#FFF3EC] text-[#FA661C] border border-[#FA661C]/20"
                          >
                            {inviteStatus}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex flex-wrap justify-end gap-1.5">
                            <button
                              type="button"
                              data-testid={`reissue-invite-btn-${row.user}`}
                              onClick={() => openManagerActionDialog('reissue', row)}
                              className="px-2.5 py-1 rounded-lg border border-[#EAE3DC] bg-white hover:bg-[#FFF3EC] text-[11px] font-bold text-[#1A2420] cursor-pointer"
                            >
                              Reissue Invite
                            </button>
                            <button
                              type="button"
                              data-testid={`revoke-invite-btn-${row.user}`}
                              onClick={() => openManagerActionDialog('revoke', row)}
                              className="px-2.5 py-1 rounded-lg border border-[#EAE3DC] bg-white hover:bg-[#FFF3EC] text-[11px] font-bold text-[#1A2420] cursor-pointer"
                            >
                              Revoke Invite
                            </button>
                            <button
                              type="button"
                              data-testid={`assign-warehouse-btn-${row.user}`}
                              onClick={() => openManagerActionDialog('assign', row)}
                              className="px-2.5 py-1 rounded-lg border border-[#EAE3DC] bg-white hover:bg-[#FFF3EC] text-[11px] font-bold text-[#FA661C] cursor-pointer"
                            >
                              Assign / Change Warehouse
                            </button>
                            {!isEnded && (
                              <button
                                type="button"
                                data-testid={`end-assignment-btn-${row.user}`}
                                onClick={() =>
                                  openManagerActionDialog('end-assignment', row)
                                }
                                className="px-2.5 py-1 rounded-lg border border-[#F59E0B]/40 bg-[#FFFBEB] hover:bg-[#FEF3C7] text-[11px] font-bold text-[#92400E] cursor-pointer"
                              >
                                End Assignment
                              </button>
                            )}
                            <button
                              type="button"
                              data-testid={`deactivate-manager-btn-${row.user}`}
                              onClick={() =>
                                openManagerActionDialog('deactivate', row)
                              }
                              className="px-2.5 py-1 rounded-lg border border-[#FCA5A5] bg-[#FFF3F3] hover:bg-[#FEE2E2] text-[11px] font-bold text-[#DC2626] cursor-pointer"
                            >
                              Deactivate
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {(assignmentsPrev || assignmentsNext) && (
            <div className="px-6 py-3 border-t border-[#EAE3DC] flex items-center justify-between text-xs">
              <span className="text-[#6B6058]">Page {assignmentsPage}</span>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  disabled={!assignmentsPrev}
                  onClick={() => setAssignmentsPage((p) => Math.max(1, p - 1))}
                  className="px-3 py-1.5 rounded-lg border border-[#EAE3DC] disabled:opacity-40 font-bold cursor-pointer"
                >
                  Previous
                </button>
                <button
                  type="button"
                  disabled={!assignmentsNext}
                  onClick={() => setAssignmentsPage((p) => p + 1)}
                  className="px-3 py-1.5 rounded-lg border border-[#EAE3DC] disabled:opacity-40 font-bold cursor-pointer"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </section>
      )}

      {/* TAB 3 (Phase 2): ADMIN STORAGE REQUESTS & DISCREPANCY RESOLUTION */}
      {activeTab === 'requests' && !loadError && (
        <section
          data-testid="admin-requests-panel"
          className="rounded-3xl border border-[#EAE3DC] bg-white shadow-2xs overflow-hidden space-y-4"
        >
          <div className="p-5 border-b border-[#EAE3DC] flex flex-wrap items-end justify-between gap-3">
            <div className="flex flex-wrap items-end gap-3">
              <div>
                <label
                  htmlFor="admin-req-filter-status"
                  className="block text-[10px] font-black uppercase text-[#6B6058] mb-1"
                >
                  Status
                </label>
                <select
                  id="admin-req-filter-status"
                  data-testid="admin-req-filter-status"
                  value={reqFilterStatus}
                  onChange={(e) => {
                    setReqFilterStatus(e.target.value);
                    setAdminRequestsPage(1);
                  }}
                  className="px-3 py-2 rounded-xl border border-[#EAE3DC] text-xs bg-white"
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

              <div>
                <label
                  htmlFor="admin-req-filter-warehouse"
                  className="block text-[10px] font-black uppercase text-[#6B6058] mb-1"
                >
                  Warehouse
                </label>
                <select
                  id="admin-req-filter-warehouse"
                  data-testid="admin-req-filter-warehouse"
                  value={reqFilterWarehouseId}
                  onChange={(e) => {
                    setReqFilterWarehouseId(e.target.value);
                    setAdminRequestsPage(1);
                  }}
                  className="px-3 py-2 rounded-xl border border-[#EAE3DC] text-xs bg-white"
                >
                  <option value="">All Warehouses</option>
                  {warehouses.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name} ({w.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="admin-req-filter-seller"
                  className="block text-[10px] font-black uppercase text-[#6B6058] mb-1"
                >
                  Seller ID
                </label>
                <input
                  id="admin-req-filter-seller"
                  data-testid="admin-req-filter-seller"
                  type="text"
                  value={reqFilterSellerId}
                  onChange={(e) => {
                    setReqFilterSellerId(e.target.value);
                    setAdminRequestsPage(1);
                  }}
                  placeholder="e.g. 8"
                  className="w-28 px-3 py-2 rounded-xl border border-[#EAE3DC] text-xs font-mono"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                data-testid="admin-discrepancy-queue-btn"
                onClick={() => {
                  setReqFilterStatus((prev) =>
                    prev === 'discrepancy' ? '' : 'discrepancy'
                  );
                  setAdminRequestsPage(1);
                }}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold inline-flex items-center space-x-1.5 cursor-pointer border ${
                  reqFilterStatus === 'discrepancy'
                    ? 'bg-[#DC2626] text-white border-[#DC2626]'
                    : 'bg-[#FFF3F3] text-[#DC2626] border-[#FCA5A5] hover:bg-[#FEE2E2]'
                }`}
              >
                <Scale className="w-3.5 h-3.5" />
                <span>
                  {reqFilterStatus === 'discrepancy'
                    ? 'Showing Discrepancies Only'
                    : 'Discrepancy Queue'}
                </span>
              </button>
            </div>
          </div>

          {adminRequestsError && (
            <div
              data-testid="admin-requests-error"
              role="alert"
              className="mx-5 p-4 rounded-2xl bg-[#FFF3F3] border border-[#FCA5A5] text-xs text-[#991B1B]"
            >
              {adminRequestsError}
            </div>
          )}

          {adminRequestsLoading ? (
            <div className="p-8 text-center text-xs text-[#6B6058]">
              Loading storage requests across warehouses...
            </div>
          ) : adminRequests.length === 0 ? (
            <div
              data-testid="admin-requests-empty"
              className="p-8 text-center text-xs text-[#6B6058]"
            >
              No storage requests match the current filters.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#FFF3EC]/60 border-b border-[#EAE3DC] text-[#6B6058] uppercase text-[10px] font-black tracking-wider">
                    <th className="py-3 px-4">ID</th>
                    <th className="py-3 px-4">Warehouse</th>
                    <th className="py-3 px-4">Seller</th>
                    <th className="py-3 px-4">Items</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Discrepancy State</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EAE3DC]">
                  {adminRequests.map((req) => (
                    <tr
                      key={req.id}
                      data-testid={`admin-request-row-${req.id}`}
                      className="hover:bg-[#FFF3EC]/20"
                    >
                      <td className="py-3.5 px-4 font-mono font-bold text-[#1A2420]">
                        #{req.id}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-[#1A2420]">
                          {req.warehouse_name}
                        </div>
                        <div className="font-mono text-[11px] text-[#6B6058]">
                          {req.warehouse_code} • WH #{req.warehouse}
                        </div>
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
                            (Req: {it.requested_quantity}
                            {it.received_quantity != null
                              ? `, Recv: ${it.received_quantity}`
                              : ''}
                            )
                          </div>
                        ))}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          data-testid={`admin-request-status-${req.id}`}
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${getStatusBadgeClass(
                            req.status
                          )}`}
                        >
                          {STATUS_LABELS[req.status] || req.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-[11px]">
                        <div className="font-semibold text-[#1A2420]">
                          {DISCREPANCY_ACTION_LABELS[
                            req.seller_discrepancy_action
                          ] || req.seller_discrepancy_action}
                        </div>
                        {req.seller_response_reason && (
                          <div className="text-[#6B6058] truncate max-w-48">
                            "{req.seller_response_reason}"
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          type="button"
                          data-testid={`admin-inspect-request-btn-${req.id}`}
                          onClick={() => openAdminRequestDetail(req)}
                          className="px-3 py-1.5 rounded-xl border border-[#EAE3DC] bg-white hover:bg-[#FFF3EC] text-xs font-bold text-[#FA661C] cursor-pointer"
                        >
                          {req.status === 'discrepancy'
                            ? 'Inspect & Resolve'
                            : 'Inspect'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {(adminRequestsPrev || adminRequestsNext) && (
            <div className="px-6 py-3 border-t border-[#EAE3DC] flex items-center justify-between text-xs">
              <span className="text-[#6B6058]">
                Page {adminRequestsPage} • Total {adminRequestsCount}
              </span>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  disabled={!adminRequestsPrev}
                  onClick={() => setAdminRequestsPage((p) => Math.max(1, p - 1))}
                  className="px-3 py-1.5 rounded-lg border border-[#EAE3DC] disabled:opacity-40 font-bold cursor-pointer"
                >
                  Previous
                </button>
                <button
                  type="button"
                  disabled={!adminRequestsNext}
                  onClick={() => setAdminRequestsPage((p) => p + 1)}
                  className="px-3 py-1.5 rounded-lg border border-[#EAE3DC] disabled:opacity-40 font-bold cursor-pointer"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </section>
      )}

      {/* TAB 4 (Phase 2): ADMIN WAREHOUSE STOCK (READ-ONLY) */}
      {activeTab === 'stock' && !loadError && (
        <section
          data-testid="admin-stock-panel"
          className="rounded-3xl border border-[#EAE3DC] bg-white shadow-2xs overflow-hidden space-y-4"
        >
          <div className="p-5 border-b border-[#EAE3DC] flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="font-['Outfit'] font-extrabold text-base text-[#1A2420]">
                Platform Warehouse Stock Lots (Read-Only)
              </h2>
              <p className="text-xs text-[#6B6058]">
                All physical warehouse lots across all facilities. Warehouse stock is separate from storefront sellable stock.
              </p>
            </div>

            <div className="flex flex-wrap items-end gap-3">
              <div>
                <label
                  htmlFor="admin-stock-wh-filter"
                  className="block text-[10px] font-black uppercase text-[#6B6058] mb-1"
                >
                  Warehouse
                </label>
                <select
                  id="admin-stock-wh-filter"
                  data-testid="admin-stock-filter-warehouse"
                  value={adminStockWarehouseFilter}
                  onChange={(e) => setAdminStockWarehouseFilter(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-[#EAE3DC] text-xs bg-white"
                >
                  <option value="">All Warehouses</option>
                  {warehouses.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name} ({w.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="admin-stock-seller-filter"
                  className="block text-[10px] font-black uppercase text-[#6B6058] mb-1"
                >
                  Seller ID
                </label>
                <input
                  id="admin-stock-seller-filter"
                  data-testid="admin-stock-filter-seller"
                  type="text"
                  value={adminStockSellerFilter}
                  onChange={(e) => setAdminStockSellerFilter(e.target.value)}
                  placeholder="e.g. 8"
                  className="w-24 px-3 py-2 rounded-xl border border-[#EAE3DC] text-xs font-mono"
                />
              </div>
            </div>
          </div>

          {adminStockError && (
            <div
              data-testid="admin-stock-error"
              role="alert"
              className="mx-5 p-4 rounded-2xl bg-[#FFF3F3] border border-[#FCA5A5] text-xs text-[#991B1B]"
            >
              {adminStockError}
            </div>
          )}

          {adminStockLoading ? (
            <div className="p-8 text-center text-xs text-[#6B6058]">
              Loading warehouse stock lots...
            </div>
          ) : filteredAdminStock.length === 0 ? (
            <div
              data-testid="admin-stock-empty"
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
                    <th className="py-3 px-4">Warehouse</th>
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
                  {filteredAdminStock.map((lot) => (
                    <tr
                      key={lot.id}
                      data-testid={`admin-stock-row-${lot.id}`}
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
                          {lot.warehouse_name}
                        </div>
                        <div className="font-mono text-[11px] text-[#6B6058]">
                          {lot.warehouse_code} • WH #{lot.warehouse}
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
                      <td className="py-3.5 px-4 font-mono font-semibold text-[#1A2420]">
                        {lot.location || lot.storage_location || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {/* TAB 5 (Phase 2): ADMIN STOCK MOVEMENTS (READ-ONLY) */}
      {activeTab === 'movements' && !loadError && (
        <section
          data-testid="admin-movements-panel"
          className="rounded-3xl border border-[#EAE3DC] bg-white shadow-2xs overflow-hidden space-y-4"
        >
          <div className="p-5 border-b border-[#EAE3DC] flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="font-['Outfit'] font-extrabold text-base text-[#1A2420]">
                Platform Stock Movements Log (Read-Only)
              </h2>
              <p className="text-xs text-[#6B6058]">
                Append-only movement history across all warehouses.
              </p>
            </div>

            <div className="flex flex-wrap items-end gap-3">
              <div>
                <label
                  htmlFor="admin-mv-filter-wh"
                  className="block text-[10px] font-black uppercase text-[#6B6058] mb-1"
                >
                  Warehouse
                </label>
                <select
                  id="admin-mv-filter-wh"
                  data-testid="admin-mv-filter-warehouse"
                  value={mvFilterWarehouseId}
                  onChange={(e) => {
                    setMvFilterWarehouseId(e.target.value);
                    setAdminMovementsPage(1);
                  }}
                  className="px-3 py-2 rounded-xl border border-[#EAE3DC] text-xs bg-white"
                >
                  <option value="">All Warehouses</option>
                  {warehouses.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name} ({w.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="admin-mv-filter-seller"
                  className="block text-[10px] font-black uppercase text-[#6B6058] mb-1"
                >
                  Seller ID
                </label>
                <input
                  id="admin-mv-filter-seller"
                  data-testid="admin-mv-filter-seller"
                  type="text"
                  value={mvFilterSellerId}
                  onChange={(e) => {
                    setMvFilterSellerId(e.target.value);
                    setAdminMovementsPage(1);
                  }}
                  placeholder="e.g. 8"
                  className="w-24 px-3 py-2 rounded-xl border border-[#EAE3DC] text-xs font-mono"
                />
              </div>

              <div>
                <label
                  htmlFor="admin-mv-filter-variant"
                  className="block text-[10px] font-black uppercase text-[#6B6058] mb-1"
                >
                  Variant ID
                </label>
                <input
                  id="admin-mv-filter-variant"
                  data-testid="admin-mv-filter-variant"
                  type="text"
                  value={mvFilterVariantId}
                  onChange={(e) => {
                    setMvFilterVariantId(e.target.value);
                    setAdminMovementsPage(1);
                  }}
                  placeholder="e.g. 22"
                  className="w-24 px-3 py-2 rounded-xl border border-[#EAE3DC] text-xs font-mono"
                />
              </div>
            </div>
          </div>

          {adminMovementsError && (
            <div
              data-testid="admin-movements-error"
              role="alert"
              className="mx-5 p-4 rounded-2xl bg-[#FFF3F3] border border-[#FCA5A5] text-xs text-[#991B1B]"
            >
              {adminMovementsError}
            </div>
          )}

          {adminMovementsLoading ? (
            <div className="p-8 text-center text-xs text-[#6B6058]">
              Loading stock movements...
            </div>
          ) : adminMovements.length === 0 ? (
            <div
              data-testid="admin-movements-empty"
              className="p-8 text-center text-xs text-[#6B6058]"
            >
              No stock movements match the current filters.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#FFF3EC]/60 border-b border-[#EAE3DC] text-[#6B6058] uppercase text-[10px] font-black tracking-wider">
                    <th className="py-3 px-4">ID & Time</th>
                    <th className="py-3 px-4">Warehouse & Seller</th>
                    <th className="py-3 px-4">Movement Type</th>
                    <th className="py-3 px-4">SKU & Lot</th>
                    <th className="py-3 px-4 text-right">Delta</th>
                    <th className="py-3 px-4 text-right">Before → After</th>
                    <th className="py-3 px-4">Actor & Reason</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EAE3DC]">
                  {adminMovements.map((mv) => (
                    <tr
                      key={mv.id}
                      data-testid={`admin-movement-row-${mv.id}`}
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
                        <div className="font-bold text-[#1A2420]">
                          WH #{mv.warehouse}
                        </div>
                        <div className="font-mono text-[11px] text-[#6B6058]">
                          {mv.vendor_business_name ? `${mv.vendor_business_name} • ` : ''}Seller #{mv.vendor ?? mv.seller}
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

          {(adminMovementsPrev || adminMovementsNext) && (
            <div className="px-6 py-3 border-t border-[#EAE3DC] flex items-center justify-between text-xs">
              <span className="text-[#6B6058]">
                Page {adminMovementsPage} • Total {adminMovementsCount}
              </span>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  disabled={!adminMovementsPrev}
                  onClick={() => setAdminMovementsPage((p) => Math.max(1, p - 1))}
                  className="px-3 py-1.5 rounded-lg border border-[#EAE3DC] disabled:opacity-40 font-bold cursor-pointer"
                >
                  Previous
                </button>
                <button
                  type="button"
                  disabled={!adminMovementsNext}
                  onClick={() => setAdminMovementsPage((p) => p + 1)}
                  className="px-3 py-1.5 rounded-lg border border-[#EAE3DC] disabled:opacity-40 font-bold cursor-pointer"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </section>
      )}

      {/* TAB 6 (Phase 3a): ADMIN WAREHOUSE RATE CARDS & ESTIMATE CALCULATOR */}
      {activeTab === 'rate-cards' && !loadError && (
        <AdminRateCardsSection
          warehouses={warehouses}
          onOpenAuditLog={({ objectType, objectId }) => {
            setAuditFilterObjectType(objectType || 'RateCard');
            setAuditFilterObjectId(objectId || '');
            setAuditFilterAction('');
            setAuditPage(1);
            setActiveTab('audit');
          }}
          onAuditUpdated={() =>
            fetchAudit(
              auditPage,
              auditFilterAction,
              auditFilterObjectType,
              auditFilterObjectId
            )
          }
        />
      )}

      {/* TAB 7: AUDIT LOG */}
      {activeTab === 'audit' && !loadError && (
        <section
          data-testid="audit-panel"
          className="rounded-3xl border border-[#EAE3DC] bg-white shadow-2xs overflow-hidden space-y-4"
        >
          <div className="p-5 border-b border-[#EAE3DC] flex flex-wrap items-end gap-3">
            <div>
              <label
                htmlFor="audit-filter-action"
                className="block text-[10px] font-black uppercase text-[#6B6058] mb-1"
              >
                Action Filter
              </label>
              <select
                id="audit-filter-action"
                data-testid="audit-filter-action"
                value={auditFilterAction}
                onChange={(e) => {
                  setAuditFilterAction(e.target.value);
                  setAuditPage(1);
                }}
                className="px-3 py-2 rounded-xl border border-[#EAE3DC] text-xs bg-white"
              >
                <option value="">All Actions</option>
                <option value="warehouse_created">warehouse_created</option>
                <option value="warehouse_updated">warehouse_updated</option>
                <option value="warehouse_deactivated">warehouse_deactivated</option>
                <option value="manager_created">manager_created</option>
                <option value="assignment_created">assignment_created</option>
                <option value="assignment_ended">assignment_ended</option>
                <option value="invite_created">invite_created</option>
                <option value="invite_reissued">invite_reissued</option>
                <option value="invite_revoked">invite_revoked</option>
                <option value="manager_setup_completed">manager_setup_completed</option>
                <option value="manager_deactivated">manager_deactivated</option>
                <option value="storage_request_created">storage_request_created</option>
                <option value="storage_request_accepted">storage_request_accepted</option>
                <option value="storage_request_rejected">storage_request_rejected</option>
                <option value="storage_request_dispatched">storage_request_dispatched</option>
                <option value="storage_request_cancelled">storage_request_cancelled</option>
                <option value="storage_request_received">storage_request_received</option>
                <option value="storage_request_closed">storage_request_closed</option>
                <option value="storage_discrepancy_acknowledged">
                  storage_discrepancy_acknowledged
                </option>
                <option value="storage_discrepancy_disputed">
                  storage_discrepancy_disputed
                </option>
                <option value="storage_discrepancy_resolved">
                  storage_discrepancy_resolved
                </option>
                <option value="rate_card_created">rate_card_created</option>
                <option value="rate_card_edited">rate_card_edited</option>
                <option value="rate_card_submitted">rate_card_submitted</option>
                <option value="rate_card_discarded">rate_card_discarded</option>
                <option value="rate_card_approved">rate_card_approved</option>
                <option value="rate_card_rejected">rate_card_rejected</option>
                <option value="rate_card_rejectd">rate_card_rejectd</option>
                <option value="rate_card_superseded">rate_card_superseded</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="audit-filter-object-type"
                className="block text-[10px] font-black uppercase text-[#6B6058] mb-1"
              >
                Object Type
              </label>
              <select
                id="audit-filter-object-type"
                data-testid="audit-filter-object-type"
                value={auditFilterObjectType}
                onChange={(e) => {
                  setAuditFilterObjectType(e.target.value);
                  setAuditPage(1);
                }}
                className="px-3 py-2 rounded-xl border border-[#EAE3DC] text-xs bg-white"
              >
                <option value="">All Object Types</option>
                <option value="Warehouse">Warehouse</option>
                <option value="WarehouseManagerAssignment">
                  WarehouseManagerAssignment
                </option>
                <option value="WarehouseInvite">WarehouseInvite</option>
                <option value="User">User</option>
                <option value="StorageRequest">StorageRequest</option>
                <option value="RateCard">RateCard</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="audit-filter-object-id"
                className="block text-[10px] font-black uppercase text-[#6B6058] mb-1"
              >
                Object ID
              </label>
              <input
                id="audit-filter-object-id"
                data-testid="audit-filter-object-id"
                type="text"
                value={auditFilterObjectId}
                onChange={(e) => {
                  setAuditFilterObjectId(e.target.value);
                  setAuditPage(1);
                }}
                placeholder="e.g. 1"
                className="w-28 px-3 py-2 rounded-xl border border-[#EAE3DC] text-xs"
              />
            </div>
          </div>

          {loading ? (
            <div className="p-8 text-center text-xs text-[#6B6058]">
              Loading warehouse audit log...
            </div>
          ) : auditLogs.length === 0 ? (
            <div className="p-8 text-center text-xs text-[#6B6058]">
              No audit events match the current filters.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#FFF3EC]/60 border-b border-[#EAE3DC] text-[#6B6058] uppercase text-[10px] font-black tracking-wider">
                    <th className="py-3 px-4">ID</th>
                    <th className="py-3 px-4">Actor & Time</th>
                    <th className="py-3 px-4">Action</th>
                    <th className="py-3 px-4">Object</th>
                    <th className="py-3 px-4">Old → New Values</th>
                    <th className="py-3 px-4">Reason</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EAE3DC]">
                  {auditLogs.map((log) => (
                    <tr
                      key={log.id}
                      data-testid={`audit-row-${log.id}`}
                      className="hover:bg-[#FFF3EC]/20"
                    >
                      <td className="py-3 px-4 font-mono font-bold text-[#1A2420]">
                        #{log.id}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-[#1A2420]">
                          {log.actor_username || `Actor #${log.actor}`}
                        </div>
                        <div className="text-[11px] text-[#6B6058]">
                          {formatDateTime(log.occurred_at)}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-block px-2 py-0.5 rounded bg-[#FFF3EC] text-[#FA661C] font-mono font-bold text-[11px]">
                          {log.action}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] text-[#1A2420]">
                        {log.object_type} #{log.object_id}
                      </td>
                      <td className="py-3 px-4 font-mono text-[10px] text-[#6B6058] max-w-xs break-all">
                        <div>
                          <span className="font-bold text-[#1A2420]">Old:</span>{' '}
                          {JSON.stringify(log.old_values || {})}
                        </div>
                        <div>
                          <span className="font-bold text-[#1A2420]">New:</span>{' '}
                          {JSON.stringify(log.new_values || {})}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-[#1A2420] font-medium">
                        {log.reason}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {(auditPrev || auditNext) && (
            <div className="px-6 py-3 border-t border-[#EAE3DC] flex items-center justify-between text-xs">
              <span className="text-[#6B6058]">
                Page {auditPage} • Total {auditCount} events
              </span>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  data-testid="audit-prev-page-btn"
                  disabled={!auditPrev}
                  onClick={() => setAuditPage((p) => Math.max(1, p - 1))}
                  className="px-3 py-1.5 rounded-lg border border-[#EAE3DC] disabled:opacity-40 font-bold cursor-pointer inline-flex items-center space-x-1"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Previous</span>
                </button>
                <button
                  type="button"
                  data-testid="audit-next-page-btn"
                  disabled={!auditNext}
                  onClick={() => setAuditPage((p) => p + 1)}
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

      {/* TAB 7: WAREHOUSE SHIPMENTS & EVENT LOG */}
      {activeTab === 'shipments' && !loadError && (
        <AdminShipmentsSection warehouses={warehouses} />
      )}

      {/* TAB 8: STOCK RECONCILIATION & SUPERUSER STOCK CORRECTION */}
      {activeTab === 'reconciliation' && !loadError && (
        <AdminStockReconciliationSection />
      )}

      {/* TAB 9: SELLER HUB ASSIGNMENTS, NEEDS HUB & OVERDUE HANDOVERS */}
      {activeTab === 'hub-assignments' && !loadError && (
        <AdminHubOperationsSection warehouses={warehouses} />
      )}

      {/* TAB 10: WAREHOUSE RETURNS INBOX & RECEIVING (Phase E) */}
      {activeTab === 'returns' && !loadError && (
        <AdminReturnsSection warehouses={warehouses} />
      )}

      {/* MODAL 1: CREATE / EDIT / DEACTIVATE WAREHOUSE */}
      {warehouseModal && (
        <div
          data-testid="warehouse-form-modal"
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-[#1A1A1A]/60 backdrop-blur-2xs flex items-center justify-center p-4"
        >
          <div className="bg-white rounded-3xl border border-[#EAE3DC] shadow-2xl max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#EAE3DC] pb-3">
              <h3 className="font-['Outfit'] font-extrabold text-lg text-[#1A2420]">
                {warehouseModal.mode === 'create'
                  ? 'Create Warehouse'
                  : warehouseModal.mode === 'edit'
                  ? `Edit Warehouse #${warehouseModal.record?.id}`
                  : `Deactivate Warehouse "${warehouseModal.record?.name}"`}
              </h3>
              <button
                type="button"
                onClick={() => setWarehouseModal(null)}
                className="p-1 text-[#6B6058] hover:text-[#1A2420] cursor-pointer"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {warehouseGeneralError && (
              <div
                data-testid="warehouse-modal-general-error"
                role="alert"
                className="p-3.5 rounded-xl bg-[#FFF3F3] border border-[#FCA5A5] text-xs text-[#991B1B] flex items-start space-x-2"
              >
                <AlertCircle className="w-4 h-4 text-[#DC2626] shrink-0 mt-0.5" />
                <span>{warehouseGeneralError}</span>
              </div>
            )}

            <form onSubmit={handleWarehouseModalSubmit} className="space-y-3" noValidate>
              {warehouseModal.mode !== 'deactivate' && (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label
                        htmlFor="wh-name"
                        className="block text-xs font-bold text-[#1A2420] mb-1"
                      >
                        Warehouse Name <span className="text-[#DC2626]">*</span>
                      </label>
                      <input
                        id="wh-name"
                        data-testid="warehouse-name-input"
                        type="text"
                        value={warehouseForm.name}
                        onChange={(e) => {
                          setWarehouseForm((f) => ({ ...f, name: e.target.value }));
                          setWarehouseFieldErrors((fe) => ({ ...fe, name: '' }));
                        }}
                        className="w-full px-3 py-2 rounded-xl border border-[#EAE3DC] text-xs"
                      />
                      {warehouseFieldErrors.name && (
                        <p
                          data-testid="warehouse-error-name"
                          className="text-[11px] font-semibold text-[#DC2626] mt-1"
                        >
                          {warehouseFieldErrors.name}
                        </p>
                      )}
                    </div>

                    <div>
                      <label
                        htmlFor="wh-code"
                        className="block text-xs font-bold text-[#1A2420] mb-1"
                      >
                        Warehouse Code <span className="text-[#DC2626]">*</span>
                      </label>
                      <input
                        id="wh-code"
                        data-testid="warehouse-code-input"
                        type="text"
                        value={warehouseForm.code}
                        onChange={(e) => {
                          setWarehouseForm((f) => ({ ...f, code: e.target.value }));
                          setWarehouseFieldErrors((fe) => ({ ...fe, code: '' }));
                        }}
                        className="w-full px-3 py-2 rounded-xl border border-[#EAE3DC] text-xs font-mono"
                      />
                      {warehouseFieldErrors.code && (
                        <p
                          data-testid="warehouse-error-code"
                          className="text-[11px] font-semibold text-[#DC2626] mt-1"
                        >
                          {warehouseFieldErrors.code}
                        </p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="wh-address1"
                      className="block text-xs font-bold text-[#1A2420] mb-1"
                    >
                      Address Line 1 <span className="text-[#DC2626]">*</span>
                    </label>
                    <input
                      id="wh-address1"
                      data-testid="warehouse-address1-input"
                      type="text"
                      value={warehouseForm.address_line1}
                      onChange={(e) => {
                        setWarehouseForm((f) => ({
                          ...f,
                          address_line1: e.target.value,
                        }));
                        setWarehouseFieldErrors((fe) => ({
                          ...fe,
                          address_line1: '',
                        }));
                      }}
                      className="w-full px-3 py-2 rounded-xl border border-[#EAE3DC] text-xs"
                    />
                    {warehouseFieldErrors.address_line1 && (
                      <p
                        data-testid="warehouse-error-address_line1"
                        className="text-[11px] font-semibold text-[#DC2626] mt-1"
                      >
                        {warehouseFieldErrors.address_line1}
                      </p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="wh-address2"
                      className="block text-xs font-bold text-[#1A2420] mb-1"
                    >
                      Address Line 2
                    </label>
                    <input
                      id="wh-address2"
                      data-testid="warehouse-address2-input"
                      type="text"
                      value={warehouseForm.address_line2}
                      onChange={(e) =>
                        setWarehouseForm((f) => ({
                          ...f,
                          address_line2: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-2 rounded-xl border border-[#EAE3DC] text-xs"
                    />
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    <div>
                      <label
                        htmlFor="wh-city"
                        className="block text-xs font-bold text-[#1A2420] mb-1"
                      >
                        City <span className="text-[#DC2626]">*</span>
                      </label>
                      <input
                        id="wh-city"
                        data-testid="warehouse-city-input"
                        type="text"
                        value={warehouseForm.city}
                        onChange={(e) => {
                          setWarehouseForm((f) => ({ ...f, city: e.target.value }));
                          setWarehouseFieldErrors((fe) => ({ ...fe, city: '' }));
                        }}
                        className="w-full px-3 py-2 rounded-xl border border-[#EAE3DC] text-xs"
                      />
                      {warehouseFieldErrors.city && (
                        <p className="text-[11px] font-semibold text-[#DC2626] mt-1">
                          {warehouseFieldErrors.city}
                        </p>
                      )}
                    </div>

                    <div>
                      <label
                        htmlFor="wh-state"
                        className="block text-xs font-bold text-[#1A2420] mb-1"
                      >
                        State <span className="text-[#DC2626]">*</span>
                      </label>
                      <input
                        id="wh-state"
                        data-testid="warehouse-state-input"
                        type="text"
                        value={warehouseForm.state}
                        onChange={(e) => {
                          setWarehouseForm((f) => ({ ...f, state: e.target.value }));
                          setWarehouseFieldErrors((fe) => ({ ...fe, state: '' }));
                        }}
                        className="w-full px-3 py-2 rounded-xl border border-[#EAE3DC] text-xs"
                      />
                      {warehouseFieldErrors.state && (
                        <p className="text-[11px] font-semibold text-[#DC2626] mt-1">
                          {warehouseFieldErrors.state}
                        </p>
                      )}
                    </div>

                    <div>
                      <label
                        htmlFor="wh-postal"
                        className="block text-xs font-bold text-[#1A2420] mb-1"
                      >
                        Postal Code <span className="text-[#DC2626]">*</span>
                      </label>
                      <input
                        id="wh-postal"
                        data-testid="warehouse-postal-input"
                        type="text"
                        value={warehouseForm.postal_code}
                        onChange={(e) => {
                          setWarehouseForm((f) => ({
                            ...f,
                            postal_code: e.target.value,
                          }));
                          setWarehouseFieldErrors((fe) => ({
                            ...fe,
                            postal_code: '',
                          }));
                        }}
                        className="w-full px-3 py-2 rounded-xl border border-[#EAE3DC] text-xs"
                      />
                      {warehouseFieldErrors.postal_code && (
                        <p className="text-[11px] font-semibold text-[#DC2626] mt-1">
                          {warehouseFieldErrors.postal_code}
                        </p>
                      )}
                    </div>

                    <div>
                      <label
                        htmlFor="wh-country"
                        className="block text-xs font-bold text-[#1A2420] mb-1"
                      >
                        Country <span className="text-[#DC2626]">*</span>
                      </label>
                      <input
                        id="wh-country"
                        data-testid="warehouse-country-input"
                        type="text"
                        maxLength={2}
                        value={warehouseForm.country}
                        onChange={(e) => {
                          setWarehouseForm((f) => ({
                            ...f,
                            country: e.target.value.toUpperCase(),
                          }));
                          setWarehouseFieldErrors((fe) => ({
                            ...fe,
                            country: '',
                          }));
                        }}
                        className="w-full px-3 py-2 rounded-xl border border-[#EAE3DC] text-xs font-mono uppercase"
                      />
                      {warehouseFieldErrors.country && (
                        <p className="text-[11px] font-semibold text-[#DC2626] mt-1">
                          {warehouseFieldErrors.country}
                        </p>
                      )}
                    </div>
                  </div>
                </>
              )}

              <div>
                <label
                  htmlFor="wh-reason"
                  className="block text-xs font-bold text-[#1A2420] mb-1"
                >
                  Audit Reason <span className="text-[#DC2626]">*</span>
                </label>
                <textarea
                  id="wh-reason"
                  data-testid="warehouse-reason-input"
                  rows={2}
                  value={warehouseForm.reason}
                  onChange={(e) => {
                    setWarehouseForm((f) => ({ ...f, reason: e.target.value }));
                    setWarehouseFieldErrors((fe) => ({ ...fe, reason: '' }));
                  }}
                  placeholder="Enter mandatory audit reason..."
                  className="w-full px-3 py-2 rounded-xl border border-[#EAE3DC] text-xs"
                />
                {warehouseFieldErrors.reason && (
                  <p
                    data-testid="warehouse-error-reason"
                    className="text-[11px] font-semibold text-[#DC2626] mt-1"
                  >
                    {warehouseFieldErrors.reason}
                  </p>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setWarehouseModal(null)}
                  className="px-4 py-2 rounded-xl border border-[#EAE3DC] text-xs font-bold text-[#6B6058] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  data-testid="warehouse-submit-btn"
                  disabled={warehouseSubmitting}
                  className={`px-4 py-2 rounded-xl text-white text-xs font-bold cursor-pointer ${
                    warehouseModal.mode === 'deactivate'
                      ? 'bg-[#DC2626] hover:bg-[#B91C1C]'
                      : 'bg-[#FA661C] hover:bg-[#E0530B]'
                  }`}
                >
                  {warehouseSubmitting
                    ? 'Saving...'
                    : warehouseModal.mode === 'create'
                    ? 'Create Warehouse'
                    : warehouseModal.mode === 'edit'
                    ? 'Save Changes'
                    : 'Confirm Deactivate'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: INVITE A MANAGER & ONE-TIME SETUP LINK DISPLAY */}
      {inviteModalOpen && (
        <div
          data-testid="invite-manager-modal"
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-[#1A1A1A]/60 backdrop-blur-2xs flex items-center justify-center p-4"
        >
          <div className="bg-white rounded-3xl border border-[#EAE3DC] shadow-2xl max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#EAE3DC] pb-3">
              <h3 className="font-['Outfit'] font-extrabold text-lg text-[#1A2420]">
                {oneTimeSetupLink
                  ? 'One-Time Warehouse Manager Setup Link'
                  : 'Invite a Warehouse Manager'}
              </h3>
              <button
                type="button"
                data-testid="close-invite-modal-btn"
                onClick={closeInviteModal}
                className="p-1 text-[#6B6058] hover:text-[#1A2420] cursor-pointer"
                aria-label="Close invite dialog"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {oneTimeSetupLink ? (
              <div data-testid="one-time-setup-link-panel" className="space-y-4">
                <div
                  data-testid="one-time-setup-warning"
                  role="alert"
                  className="p-4 rounded-2xl bg-[#FFFBEB] border border-[#F59E0B] text-xs text-[#92400E] font-bold space-y-1"
                >
                  <p>
                    This link is shown only once. Send it to the manager now. It expires in 72 hours and works once.
                  </p>
                  {setupLinkMeta?.username && (
                    <p className="font-normal text-[11px] text-[#78350F]">
                      Manager: <strong>{setupLinkMeta.username}</strong>
                      {setupLinkMeta.expires_at
                        ? ` • Expires: ${formatDateTime(setupLinkMeta.expires_at)}`
                        : ''}
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="one-time-link-box"
                    className="block text-xs font-bold text-[#1A2420]"
                  >
                    One-Time Setup URL (Read-Only)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      id="one-time-link-box"
                      data-testid="one-time-setup-link-input"
                      type="text"
                      readOnly
                      value={oneTimeSetupLink}
                      className="flex-1 px-3 py-2.5 rounded-xl border border-[#EAE3DC] bg-slate-50 text-xs font-mono text-[#1A2420]"
                    />
                    <button
                      type="button"
                      data-testid="copy-setup-link-btn"
                      onClick={handleCopySetupLink}
                      className="px-3.5 py-2.5 rounded-xl bg-[#FA661C] hover:bg-[#E0530B] text-white text-xs font-bold inline-flex items-center space-x-1.5 cursor-pointer shrink-0"
                    >
                      {copiedSetupLink ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="button"
                    data-testid="done-invite-modal-btn"
                    onClick={closeInviteModal}
                    className="px-4 py-2 rounded-xl bg-[#1A2420] text-white text-xs font-bold cursor-pointer"
                  >
                    Done & Clear Link
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleInviteSubmit} className="space-y-3" noValidate>
                <p className="text-xs text-[#6B6058]">
                  Enter the manager's account details and assigned warehouse. Do not choose a password — the server will issue a one-time setup link for the manager to set their own password.
                </p>

                {inviteGeneralError && (
                  <div
                    data-testid="invite-general-error"
                    role="alert"
                    className="p-3.5 rounded-xl bg-[#FFF3F3] border border-[#FCA5A5] text-xs text-[#991B1B]"
                  >
                    {inviteGeneralError}
                  </div>
                )}

                <div>
                  <label
                    htmlFor="invite-username"
                    className="block text-xs font-bold text-[#1A2420] mb-1"
                  >
                    Username <span className="text-[#DC2626]">*</span>
                  </label>
                  <input
                    id="invite-username"
                    data-testid="invite-username-input"
                    type="text"
                    value={inviteForm.username}
                    onChange={(e) => {
                      setInviteForm((f) => ({ ...f, username: e.target.value }));
                      setInviteFieldErrors((fe) => ({ ...fe, username: '' }));
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-[#EAE3DC] text-xs"
                  />
                  {inviteFieldErrors.username && (
                    <p
                      data-testid="invite-error-username"
                      className="text-[11px] font-semibold text-[#DC2626] mt-1"
                    >
                      {inviteFieldErrors.username}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="invite-email"
                    className="block text-xs font-bold text-[#1A2420] mb-1"
                  >
                    Email Address <span className="text-[#DC2626]">*</span>
                  </label>
                  <input
                    id="invite-email"
                    data-testid="invite-email-input"
                    type="email"
                    value={inviteForm.email}
                    onChange={(e) => {
                      setInviteForm((f) => ({ ...f, email: e.target.value }));
                      setInviteFieldErrors((fe) => ({ ...fe, email: '' }));
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-[#EAE3DC] text-xs"
                  />
                  {inviteFieldErrors.email && (
                    <p
                      data-testid="invite-error-email"
                      className="text-[11px] font-semibold text-[#DC2626] mt-1"
                    >
                      {inviteFieldErrors.email}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="invite-fullname"
                    className="block text-xs font-bold text-[#1A2420] mb-1"
                  >
                    Full Name <span className="text-[#DC2626]">*</span>
                  </label>
                  <input
                    id="invite-fullname"
                    data-testid="invite-fullname-input"
                    type="text"
                    value={inviteForm.full_name}
                    onChange={(e) => {
                      setInviteForm((f) => ({ ...f, full_name: e.target.value }));
                      setInviteFieldErrors((fe) => ({ ...fe, full_name: '' }));
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-[#EAE3DC] text-xs"
                  />
                  {inviteFieldErrors.full_name && (
                    <p
                      data-testid="invite-error-full_name"
                      className="text-[11px] font-semibold text-[#DC2626] mt-1"
                    >
                      {inviteFieldErrors.full_name}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="invite-warehouse"
                    className="block text-xs font-bold text-[#1A2420] mb-1"
                  >
                    Assigned Warehouse <span className="text-[#DC2626]">*</span>
                  </label>
                  <select
                    id="invite-warehouse"
                    data-testid="invite-warehouse-select"
                    value={inviteForm.warehouse_id}
                    onChange={(e) => {
                      setInviteForm((f) => ({
                        ...f,
                        warehouse_id: e.target.value,
                      }));
                      setInviteFieldErrors((fe) => ({ ...fe, warehouse_id: '' }));
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-[#EAE3DC] text-xs bg-white"
                  >
                    <option value="">Select active warehouse...</option>
                    {activeWarehouses.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name} ({w.code})
                      </option>
                    ))}
                  </select>
                  {inviteFieldErrors.warehouse_id && (
                    <p
                      data-testid="invite-error-warehouse_id"
                      className="text-[11px] font-semibold text-[#DC2626] mt-1"
                    >
                      {inviteFieldErrors.warehouse_id}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="invite-reason"
                    className="block text-xs font-bold text-[#1A2420] mb-1"
                  >
                    Audit Reason <span className="text-[#DC2626]">*</span>
                  </label>
                  <textarea
                    id="invite-reason"
                    data-testid="invite-reason-input"
                    rows={2}
                    value={inviteForm.reason}
                    onChange={(e) => {
                      setInviteForm((f) => ({ ...f, reason: e.target.value }));
                      setInviteFieldErrors((fe) => ({ ...fe, reason: '' }));
                    }}
                    placeholder="Enter mandatory audit reason..."
                    className="w-full px-3 py-2 rounded-xl border border-[#EAE3DC] text-xs"
                  />
                  {inviteFieldErrors.reason && (
                    <p
                      data-testid="invite-error-reason"
                      className="text-[11px] font-semibold text-[#DC2626] mt-1"
                    >
                      {inviteFieldErrors.reason}
                    </p>
                  )}
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={closeInviteModal}
                    className="px-4 py-2 rounded-xl border border-[#EAE3DC] text-xs font-bold text-[#6B6058] cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    data-testid="invite-submit-btn"
                    disabled={inviteSubmitting}
                    className="px-4 py-2 rounded-xl bg-[#FA661C] hover:bg-[#E0530B] text-white text-xs font-bold cursor-pointer"
                  >
                    {inviteSubmitting
                      ? 'Creating Invite...'
                      : 'Invite Manager & Generate Link'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* MODAL 3: MANAGER ACTION CONFIRM DIALOG */}
      {managerActionModal && (
        <div
          data-testid="manager-action-modal"
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-[#1A1A1A]/60 backdrop-blur-2xs flex items-center justify-center p-4"
        >
          <div className="bg-white rounded-3xl border border-[#EAE3DC] shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#EAE3DC] pb-3">
              <h3 className="font-['Outfit'] font-extrabold text-lg text-[#1A2420]">
                {managerActionModal.type === 'reissue' &&
                  `Reissue Invite — ${managerActionModal.username}`}
                {managerActionModal.type === 'revoke' &&
                  `Revoke Invite — ${managerActionModal.username}`}
                {managerActionModal.type === 'assign' &&
                  `Assign / Change Warehouse — ${managerActionModal.username}`}
                {managerActionModal.type === 'end-assignment' &&
                  `End Assignment — ${managerActionModal.username}`}
                {managerActionModal.type === 'deactivate' &&
                  `Deactivate Manager — ${managerActionModal.username}`}
              </h3>
              <button
                type="button"
                onClick={closeManagerActionDialog}
                className="p-1 text-[#6B6058] hover:text-[#1A2420] cursor-pointer"
                aria-label="Close action dialog"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {managerActionGeneralError && (
              <div
                data-testid="manager-action-general-error"
                role="alert"
                className="p-3.5 rounded-xl bg-[#FFF3F3] border border-[#FCA5A5] text-xs text-[#991B1B]"
              >
                {managerActionGeneralError}
              </div>
            )}

            {managerActionFieldErrors.user_id && (
              <div
                data-testid="manager-action-error-user_id"
                role="alert"
                className="p-3.5 rounded-xl bg-[#FFF3F3] border border-[#FCA5A5] text-xs text-[#991B1B]"
              >
                {managerActionFieldErrors.user_id}
              </div>
            )}

            <form onSubmit={handleManagerActionSubmit} className="space-y-3" noValidate>
              {managerActionModal.type === 'assign' && (
                <div>
                  <label
                    htmlFor="action-warehouse-select"
                    className="block text-xs font-bold text-[#1A2420] mb-1"
                  >
                    Target Warehouse <span className="text-[#DC2626]">*</span>
                  </label>
                  <select
                    id="action-warehouse-select"
                    data-testid="manager-action-warehouse-select"
                    value={managerActionWarehouseId}
                    onChange={(e) => {
                      setManagerActionWarehouseId(e.target.value);
                      setManagerActionFieldErrors((fe) => ({
                        ...fe,
                        warehouse_id: '',
                      }));
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-[#EAE3DC] text-xs bg-white"
                  >
                    <option value="">Select warehouse...</option>
                    {warehouses.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name} ({w.code}){w.is_active ? '' : ' [Inactive]'}
                      </option>
                    ))}
                  </select>
                  {managerActionFieldErrors.warehouse_id && (
                    <p
                      data-testid="manager-action-error-warehouse_id"
                      className="text-[11px] font-semibold text-[#DC2626] mt-1"
                    >
                      {managerActionFieldErrors.warehouse_id}
                    </p>
                  )}
                </div>
              )}

              <div>
                <label
                  htmlFor="manager-action-reason"
                  className="block text-xs font-bold text-[#1A2420] mb-1"
                >
                  Audit Reason <span className="text-[#DC2626]">*</span>
                </label>
                <textarea
                  id="manager-action-reason"
                  data-testid="manager-action-reason-input"
                  rows={2}
                  value={managerActionReason}
                  onChange={(e) => {
                    setManagerActionReason(e.target.value);
                    setManagerActionFieldErrors((fe) => ({ ...fe, reason: '' }));
                  }}
                  placeholder="Enter mandatory audit reason..."
                  className="w-full px-3 py-2 rounded-xl border border-[#EAE3DC] text-xs"
                />
                {managerActionFieldErrors.reason && (
                  <p
                    data-testid="manager-action-error-reason"
                    className="text-[11px] font-semibold text-[#DC2626] mt-1"
                  >
                    {managerActionFieldErrors.reason}
                  </p>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={closeManagerActionDialog}
                  className="px-4 py-2 rounded-xl border border-[#EAE3DC] text-xs font-bold text-[#6B6058] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  data-testid="manager-action-submit-btn"
                  disabled={managerActionSubmitting}
                  className={`px-4 py-2 rounded-xl text-white text-xs font-bold cursor-pointer ${
                    managerActionModal.type === 'deactivate' ||
                    managerActionModal.type === 'revoke'
                      ? 'bg-[#DC2626] hover:bg-[#B91C1C]'
                      : 'bg-[#FA661C] hover:bg-[#E0530B]'
                  }`}
                >
                  {managerActionSubmitting ? 'Submitting...' : 'Confirm Action'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4 (Phase 2): ADMIN STORAGE REQUEST INSPECT & DISCREPANCY RESOLVE */}
      {selectedAdminRequest && (
        <div
          data-testid="admin-request-detail-modal"
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-[#1A1A1A]/60 backdrop-blur-2xs flex items-center justify-center p-4"
        >
          <div className="bg-white rounded-3xl border border-[#EAE3DC] shadow-2xl max-w-3xl w-full p-6 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#EAE3DC] pb-3">
              <div className="flex items-center space-x-3">
                <h3 className="font-['Outfit'] font-extrabold text-lg text-[#1A2420]">
                  Storage Request #{selectedAdminRequest.id}
                </h3>
                <span
                  data-testid="admin-modal-request-status"
                  className={`px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase ${getStatusBadgeClass(
                    selectedAdminRequest.status
                  )}`}
                >
                  {STATUS_LABELS[selectedAdminRequest.status] ||
                    selectedAdminRequest.status}
                </span>
              </div>
              <button
                type="button"
                data-testid="close-admin-request-modal-btn"
                onClick={() => setSelectedAdminRequest(null)}
                className="p-1 text-[#6B6058] hover:text-[#1A2420] cursor-pointer"
                aria-label="Close request modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3.5 rounded-2xl border border-[#EAE3DC] bg-[#FFF3EC]/20 space-y-1">
                <span className="text-[10px] font-black uppercase text-[#6B6058]">
                  Warehouse
                </span>
                <div className="font-bold text-[#1A2420]">
                  {selectedAdminRequest.warehouse_name}
                </div>
                <div className="font-mono text-[11px] text-[#6B6058]">
                  {selectedAdminRequest.warehouse_code} • WH #
                  {selectedAdminRequest.warehouse}
                </div>
              </div>

              <div className="p-3.5 rounded-2xl border border-[#EAE3DC] bg-[#FFF3EC]/20 space-y-1">
                <span className="text-[10px] font-black uppercase text-[#6B6058]">
                  Seller
                </span>
                <div className="font-bold text-[#1A2420]">
                  {selectedAdminRequest.seller_business_name}
                </div>
                <div className="font-mono text-[11px] text-[#6B6058]">
                  Seller #{selectedAdminRequest.vendor_id ?? selectedAdminRequest.seller}
                </div>
              </div>

              <div className="p-3.5 rounded-2xl border border-[#EAE3DC] bg-[#FFF3EC]/20 space-y-1">
                <span className="text-[10px] font-black uppercase text-[#6B6058]">
                  Discrepancy State
                </span>
                <div className="font-bold text-[#1A2420]">
                  {DISCREPANCY_ACTION_LABELS[
                    selectedAdminRequest.seller_discrepancy_action
                  ] || selectedAdminRequest.seller_discrepancy_action}
                </div>
                {selectedAdminRequest.seller_response_reason && (
                  <div className="text-[11px] text-[#6B6058]">
                    Seller Reason: {selectedAdminRequest.seller_response_reason}
                  </div>
                )}
              </div>
            </div>

            {/* Items Table */}
            <div className="overflow-x-auto rounded-2xl border border-[#EAE3DC]">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#FFF3EC]/60 border-b border-[#EAE3DC] text-[#6B6058] uppercase text-[10px] font-black tracking-wider">
                    <th className="py-2.5 px-3">Item Snapshot</th>
                    <th className="py-2.5 px-3 text-right">Requested</th>
                    <th className="py-2.5 px-3 text-right">Accepted</th>
                    <th className="py-2.5 px-3 text-right">Counted</th>
                    <th className="py-2.5 px-3 text-right">Good</th>
                    <th className="py-2.5 px-3 text-right">Damaged</th>
                    <th className="py-2.5 px-3">Discrepancy</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EAE3DC]">
                  {(selectedAdminRequest.items || []).map((it) => (
                    <tr key={it.id}>
                      <td className="py-2.5 px-3">
                        <div className="font-bold text-[#1A2420]">
                          {it.product_name_snapshot}
                        </div>
                        <div className="font-mono text-[11px] text-[#FA661C]">
                          {it.sku_snapshot} • Variant #{it.variant_id ?? it.variant}
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold">
                        {it.requested_quantity}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-[#059669]">
                        {it.accepted_quantity ?? '—'}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold">
                        {it.received_quantity ?? '—'}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-[#065F46]">
                        {it.good_quantity ?? '—'}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-[#DC2626]">
                        {it.damaged_quantity ?? '—'}
                      </td>
                      <td className="py-2.5 px-3 text-[11px] text-[#DC2626]">
                        {it.discrepancy_reason || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* ADMIN RESOLVE DISCREPANCY FORM */}
            {selectedAdminRequest.status === 'discrepancy' && (
              <form
                onSubmit={handleAdminResolveSubmit}
                data-testid="admin-resolve-discrepancy-form"
                className="p-4 rounded-2xl border-2 border-[#FA661C]/30 bg-[#FFF3EC]/20 space-y-3"
                noValidate
              >
                <h4 className="font-['Outfit'] font-extrabold text-sm text-[#1A2420]">
                  Admin Discrepancy Resolution Override
                </h4>
                <p className="text-xs text-[#6B6058]">
                  Set the final accepted quantity for each item and provide an audit reason. Any change from the initial good count records a compensating adjustment movement.
                </p>

                {adminResolveGeneralError && (
                  <div
                    data-testid="admin-resolve-general-error"
                    role="alert"
                    className="p-3 rounded-xl bg-[#FFF3F3] border border-[#FCA5A5] text-xs text-[#991B1B]"
                  >
                    {adminResolveGeneralError}
                  </div>
                )}

                <div className="space-y-2">
                  {(selectedAdminRequest.items || []).map((it, idx) => {
                    const iErr = adminResolveItemErrors[idx] || {};
                    return (
                      <div
                        key={it.id}
                        className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl border border-[#EAE3DC] bg-white"
                      >
                        <div className="text-xs">
                          <div className="font-bold text-[#1A2420]">
                            {it.product_name_snapshot} ({it.sku_snapshot})
                          </div>
                          <div className="text-[11px] text-[#6B6058]">
                            Requested: {it.requested_quantity} • Counted:{' '}
                            {it.received_quantity} • Good: {it.good_quantity} •
                            Damaged: {it.damaged_quantity}
                          </div>
                        </div>
                        <div className="w-36">
                          <label
                            htmlFor={`admin-resolve-qty-${it.id}`}
                            className="block text-[10px] font-black uppercase text-[#6B6058] mb-1"
                          >
                            Accepted Qty
                          </label>
                          <input
                            id={`admin-resolve-qty-${it.id}`}
                            data-testid={`admin-resolve-qty-${it.id}`}
                            type="number"
                            min="0"
                            value={adminResolveQuantities[it.id] ?? ''}
                            onChange={(e) =>
                              setAdminResolveQuantities((prev) => ({
                                ...prev,
                                [it.id]: e.target.value,
                              }))
                            }
                            className="w-full px-3 py-1.5 rounded-xl border border-[#EAE3DC] text-xs font-mono"
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

                <div>
                  <label
                    htmlFor="admin-resolve-reason"
                    className="block text-xs font-bold text-[#1A2420] mb-1"
                  >
                    Resolution Audit Reason <span className="text-[#DC2626]">*</span>
                  </label>
                  <textarea
                    id="admin-resolve-reason"
                    data-testid="admin-resolve-reason-input"
                    rows={2}
                    value={adminResolveReason}
                    onChange={(e) => {
                      setAdminResolveReason(e.target.value);
                      setAdminResolveFieldErrors((fe) => ({ ...fe, reason: '' }));
                    }}
                    placeholder="Enter mandatory discrepancy resolution reason..."
                    className="w-full px-3 py-2 rounded-xl border border-[#EAE3DC] text-xs bg-white"
                  />
                  {adminResolveFieldErrors.reason && (
                    <p
                      data-testid="admin-resolve-error-reason"
                      className="text-[11px] font-semibold text-[#DC2626] mt-1"
                    >
                      {adminResolveFieldErrors.reason}
                    </p>
                  )}
                </div>

                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedAdminRequest(null)}
                    className="px-4 py-2 rounded-xl border border-[#EAE3DC] bg-white text-xs font-bold text-[#6B6058] cursor-pointer"
                  >
                    Close
                  </button>
                  <button
                    type="submit"
                    data-testid="admin-resolve-submit-btn"
                    disabled={adminResolveSubmitting}
                    className="px-4 py-2 rounded-xl bg-[#FA661C] hover:bg-[#E0530B] text-white text-xs font-bold cursor-pointer"
                  >
                    {adminResolveSubmitting
                      ? 'Resolving...'
                      : 'Confirm Admin Resolution'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
