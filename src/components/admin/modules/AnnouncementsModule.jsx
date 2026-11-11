import React, { useState, useEffect, useCallback } from 'react';
import {
  Megaphone,
  Plus,
  Edit,
  Trash2,
  Archive,
  Send,
  RotateCcw,
  History,
  Search,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  ShieldAlert,
  Info,
  X,
  ChevronLeft,
  ChevronRight,
  Users,
  Store,
  Clock,
  Eye
} from 'lucide-react';
import { apiRequest } from '../../../utils/api';
import { useToast } from '../../../context/ToastContext';

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'draft', label: 'Draft' },
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'published', label: 'Published' },
  { value: 'expired', label: 'Expired' },
  { value: 'archived', label: 'Archived' },
];

const AUDIENCE_OPTIONS = [
  { value: '', label: 'All Audiences' },
  { value: 'all_approved', label: 'All approved vendors' },
  { value: 'selected_vendors', label: 'Selected vendors' },
];

const APPROVED_VENDOR_STATUSES = new Set([
  'approved',
  'verified',
  'wizard_in_progress',
  'store_published',
]);

export function toLocalDatetimeInput(isoStr) {
  if (!isoStr) return '';
  const d = new Date(isoStr);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function toServerIsoDatetime(localStr) {
  if (!localStr || !String(localStr).trim()) return null;
  const d = new Date(localStr);
  if (Number.isNaN(d.getTime())) return localStr;
  return d.toISOString();
}

export function formatLocalDateTime(isoStr) {
  if (!isoStr) return '—';
  const d = new Date(isoStr);
  if (Number.isNaN(d.getTime())) return String(isoStr);
  return d.toLocaleString();
}

function extractFieldMessage(val) {
  if (!val) return null;
  if (Array.isArray(val)) return val.map((item) => String(item)).join(' ');
  if (typeof val === 'string') return val;
  if (typeof val === 'object') return Object.values(val).flat().join(' ');
  return String(val);
}

function StatusBadge({ status }) {
  const styles = {
    draft: 'bg-[#FFF3E0] text-[#E65100] border-[#FFB74D]/40',
    scheduled: 'bg-[#E3F2FD] text-[#1565C0] border-[#64B5F6]/40',
    published: 'bg-[#E8F5E9] text-[#2E7D32] border-[#81C784]/40',
    expired: 'bg-[#FFEBEE] text-[#C62828] border-[#E57373]/40',
    archived: 'bg-gray-100 text-gray-700 border-gray-300',
  };
  return (
    <span
      data-testid={`status-badge-${status}`}
      className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider border ${
        styles[status] || 'bg-gray-100 text-gray-700 border-gray-300'
      }`}
    >
      {status || 'unknown'}
    </span>
  );
}

function formatAuditSnapshot(snapshot) {
  if (!snapshot || typeof snapshot !== 'object' || Object.keys(snapshot).length === 0) {
    return <span className="text-[11px] text-[#6B6058] italic">None</span>;
  }
  const fields = [
    ['Title', snapshot.title],
    ['Status', snapshot.status],
    ['Audience', snapshot.audience === 'selected_vendors' ? 'Selected vendors' : snapshot.audience === 'all_approved' ? 'All approved vendors' : snapshot.audience],
    ['Target Vendors', Array.isArray(snapshot.target_vendor_ids) ? (snapshot.target_vendor_ids.length > 0 ? snapshot.target_vendor_ids.map((id) => `#${id}`).join(', ') : 'None') : undefined],
    ['Publish From', snapshot.publish_from ? formatLocalDateTime(snapshot.publish_from) : undefined],
    ['Publish Until', snapshot.publish_until ? formatLocalDateTime(snapshot.publish_until) : 'No expiry'],
    ['Body', snapshot.body],
  ].filter(([, val]) => val !== undefined);

  return (
    <dl className="space-y-1 text-[11px]">
      {fields.map(([label, val]) => (
        <div key={label} className="flex flex-col sm:flex-row sm:gap-1.5">
          <dt className="font-bold text-[#6B6058] shrink-0">{label}:</dt>
          <dd className="text-[#1A2420] break-words whitespace-pre-line">{String(val ?? '—')}</dd>
        </div>
      ))}
    </dl>
  );
}

export default function AnnouncementsModule() {
  const toast = useToast();

  // List & Pagination State
  const [announcements, setAnnouncements] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [nextUrl, setNextUrl] = useState(null);
  const [prevUrl, setPrevUrl] = useState(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [errorStatus, setErrorStatus] = useState(null);
  const [actionBanner, setActionBanner] = useState(null);

  // Server Filters
  const [statusFilter, setStatusFilter] = useState('');
  const [audienceFilter, setAudienceFilter] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');

  // Vendors List for Target Picker
  const [vendors, setVendors] = useState([]);
  const [vendorsLoading, setVendorsLoading] = useState(false);
  const [vendorsError, setVendorsError] = useState(null);
  const [vendorSearch, setVendorSearch] = useState('');

  // Create / Edit Modal State
  const [modalMode, setModalMode] = useState(null); // 'create' | 'edit' | null
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    body: '',
    audience: 'all_approved',
    target_vendor_ids: [],
    publish_from: '',
    publish_until: '',
  });
  const [fieldErrors, setFieldErrors] = useState({});
  const [formBannerError, setFormBannerError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Delete Confirmation & 409 Conflict State
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteConflictMsg, setDeleteConflictMsg] = useState(null);
  const [deleteErrorMsg, setDeleteErrorMsg] = useState(null);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);

  // Audit History Drawer/Panel State
  const [auditTarget, setAuditTarget] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);
  const [auditCount, setAuditCount] = useState(0);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditError, setAuditError] = useState(null);

  const fetchAnnouncements = useCallback(async (targetPage = page, overrides = {}) => {
    setLoading(true);
    setError(null);
    setErrorStatus(null);

    const effStatus = overrides.status !== undefined ? overrides.status : statusFilter;
    const effAudience = overrides.audience !== undefined ? overrides.audience : audienceFilter;
    const effSearch = overrides.search !== undefined ? overrides.search : appliedSearch;

    const params = new URLSearchParams();
    if (targetPage > 1) params.set('page', String(targetPage));
    if (effStatus) params.set('status', effStatus);
    if (effAudience) params.set('audience', effAudience);
    if (effSearch) params.set('search', effSearch);

    const qs = params.toString();
    const url = `/api/announcements/admin/${qs ? `?${qs}` : ''}`;

    try {
      const data = await apiRequest(url);
      const rows = Array.isArray(data) ? data : (data?.results || []);
      setAnnouncements(rows);
      setTotalCount(typeof data?.count === 'number' ? data.count : rows.length);
      setNextUrl(data?.next || null);
      setPrevUrl(data?.previous || null);
    } catch (err) {
      setAnnouncements([]);
      setTotalCount(0);
      setNextUrl(null);
      setPrevUrl(null);
      setErrorStatus(err.status || null);
      const msg = err.data?.detail || err.message || 'Failed to load announcements from the server.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, audienceFilter, appliedSearch]);

  const fetchVendors = useCallback(async () => {
    setVendorsLoading(true);
    setVendorsError(null);
    try {
      const data = await apiRequest('/api/vendors/admin/');
      const list = Array.isArray(data) ? data : (data?.results || []);
      setVendors(list);
    } catch (err) {
      setVendors([]);
      setVendorsError(err.data?.detail || err.message || 'Unable to load vendors from server.');
    } finally {
      setVendorsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnnouncements(page);
  }, [page, statusFilter, audienceFilter, appliedSearch, fetchAnnouncements]);

  useEffect(() => {
    fetchVendors();
  }, [fetchVendors]);

  const fetchAuditHistory = useCallback(async (announcement) => {
    if (!announcement) return;
    setAuditTarget(announcement);
    setAuditLoading(true);
    setAuditError(null);
    try {
      const data = await apiRequest(`/api/announcements/admin/${announcement.id}/audit/`);
      const rows = Array.isArray(data) ? data : (data?.results || []);
      setAuditLogs(rows);
      setAuditCount(typeof data?.count === 'number' ? data.count : rows.length);
    } catch (err) {
      setAuditLogs([]);
      setAuditCount(0);
      setAuditError(err.data?.detail || err.message || 'Failed to load audit history.');
    } finally {
      setAuditLoading(false);
    }
  }, []);

  // Build vendor lookup map for displaying vendor names in audience column
  const vendorMap = React.useMemo(() => {
    const map = new Map();
    vendors.forEach((v) => {
      map.set(v.id, v);
    });
    return map;
  }, [vendors]);

  const openCreateModal = () => {
    setModalMode('create');
    setEditingItem(null);
    setFieldErrors({});
    setFormBannerError(null);
    setVendorSearch('');
    setFormData({
      title: '',
      body: '',
      audience: 'all_approved',
      target_vendor_ids: [],
      publish_from: toLocalDatetimeInput(new Date().toISOString()),
      publish_until: '',
    });
    if (vendors.length === 0 && !vendorsLoading) {
      fetchVendors();
    }
  };

  const openEditModal = async (item) => {
    setModalMode('edit');
    setEditingItem(item);
    setFieldErrors({});
    setFormBannerError(null);
    setVendorSearch('');
    setFormData({
      title: item.title || '',
      body: item.body || '',
      audience: item.audience || 'all_approved',
      target_vendor_ids: Array.isArray(item.target_vendor_ids) ? [...item.target_vendor_ids] : [],
      publish_from: toLocalDatetimeInput(item.publish_from),
      publish_until: toLocalDatetimeInput(item.publish_until),
    });
    if (vendors.length === 0 && !vendorsLoading) {
      fetchVendors();
    }
    try {
      const detail = await apiRequest(`/api/announcements/admin/${item.id}/`);
      if (detail && detail.id === item.id) {
        setEditingItem(detail);
        setFormData({
          title: detail.title || '',
          body: detail.body || '',
          audience: detail.audience || 'all_approved',
          target_vendor_ids: Array.isArray(detail.target_vendor_ids) ? [...detail.target_vendor_ids] : [],
          publish_from: toLocalDatetimeInput(detail.publish_from),
          publish_until: toLocalDatetimeInput(detail.publish_until),
        });
      }
    } catch {
      // Keep row data if detail fetch fails
    }
  };

  const closeFormModal = () => {
    setModalMode(null);
    setEditingItem(null);
    setFieldErrors({});
    setFormBannerError(null);
  };

  const handleFieldChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (fieldErrors[field]) {
      setFieldErrors((prev) => ({ ...prev, [field]: null }));
    }
    if (formBannerError) {
      setFormBannerError(null);
    }
  };

  const handleToggleTargetVendor = (vendorId) => {
    setFormData((prev) => {
      const exists = prev.target_vendor_ids.includes(vendorId);
      const nextIds = exists
        ? prev.target_vendor_ids.filter((id) => id !== vendorId)
        : [...prev.target_vendor_ids, vendorId];
      return { ...prev, target_vendor_ids: nextIds };
    });
    if (fieldErrors.target_vendor_ids) {
      setFieldErrors((prev) => ({ ...prev, target_vendor_ids: null }));
    }
    if (formBannerError) {
      setFormBannerError(null);
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setFieldErrors({});
    setFormBannerError(null);

    const payload = {
      title: formData.title,
      body: formData.body,
      audience: formData.audience,
      target_vendor_ids: formData.audience === 'selected_vendors' ? formData.target_vendor_ids : [],
      publish_until: formData.publish_until ? toServerIsoDatetime(formData.publish_until) : null,
    };

    if (formData.publish_from) {
      payload.publish_from = toServerIsoDatetime(formData.publish_from);
    }

    try {
      if (modalMode === 'create') {
        const created = await apiRequest('/api/announcements/admin/', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        toast.success('Draft Created', `Announcement "${created.title}" created as ${created.status}.`);
        setActionBanner({
          type: 'success',
          message: `Announcement "${created.title}" created (status: ${created.status}).`,
        });
        closeFormModal();
        await fetchAnnouncements(1);
        setPage(1);
      } else if (modalMode === 'edit' && editingItem) {
        const updated = await apiRequest(`/api/announcements/admin/${editingItem.id}/`, {
          method: 'PATCH',
          body: JSON.stringify(payload),
        });
        toast.success('Announcement Updated', `Changes to "${updated.title}" saved.`);
        setActionBanner({
          type: 'success',
          message: `Announcement "${updated.title}" updated.`,
        });
        closeFormModal();
        await fetchAnnouncements(page);
        if (auditTarget && auditTarget.id === updated.id) {
          await fetchAuditHistory(updated);
        }
      }
    } catch (err) {
      const data = err.data;
      if (data && typeof data === 'object' && !Array.isArray(data)) {
        const mapped = {};
        const knownFields = ['title', 'body', 'audience', 'target_vendor_ids', 'publish_from', 'publish_until'];
        let hasFieldError = false;
        knownFields.forEach((f) => {
          if (data[f]) {
            mapped[f] = extractFieldMessage(data[f]);
            hasFieldError = true;
          }
        });
        setFieldErrors(mapped);

        const bannerParts = [];
        if (data.detail) bannerParts.push(extractFieldMessage(data.detail));
        if (data.non_field_errors) bannerParts.push(extractFieldMessage(data.non_field_errors));
        if (data.status) bannerParts.push(extractFieldMessage(data.status));

        if (bannerParts.length > 0) {
          setFormBannerError(bannerParts.join(' '));
        } else if (!hasFieldError) {
          setFormBannerError(err.message || 'Validation failed.');
        }
      } else {
        setFormBannerError(err.message || 'Failed to save announcement.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Lifecycle Actions: publish, unpublish, archive
  const handleLifecycleAction = async (item, action) => {
    setActionBanner(null);
    try {
      const updated = await apiRequest(`/api/announcements/admin/${item.id}/${action}/`, {
        method: 'POST',
      });
      const labels = {
        publish: 'Published',
        unpublish: 'Unpublished',
        archive: 'Archived',
      };
      const successMsg = `Announcement "${updated.title}" is now ${updated.status}.`;
      toast.success(`Announcement ${labels[action] || 'Updated'}`, successMsg);
      setActionBanner({ type: 'success', message: successMsg });
      await fetchAnnouncements(page);
      if (auditTarget && auditTarget.id === item.id) {
        await fetchAuditHistory(updated);
      }
    } catch (err) {
      const data = err.data;
      let errMsg = err.message || `Failed to ${action} announcement.`;
      if (data && typeof data === 'object') {
        errMsg =
          extractFieldMessage(data.detail) ||
          extractFieldMessage(data.status) ||
          extractFieldMessage(data.publish_until) ||
          extractFieldMessage(data.non_field_errors) ||
          Object.values(data).map(extractFieldMessage).filter(Boolean).join(' ') ||
          errMsg;
      }
      toast.error('Action Refused', errMsg);
      setActionBanner({ type: 'error', message: errMsg });
    }
  };

  // Delete & 409 Archive Instead Flow
  const openDeleteDialog = (item) => {
    setDeleteTarget(item);
    setDeleteConflictMsg(null);
    setDeleteErrorMsg(null);
  };

  const closeDeleteDialog = () => {
    setDeleteTarget(null);
    setDeleteConflictMsg(null);
    setDeleteErrorMsg(null);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleteSubmitting(true);
    setDeleteConflictMsg(null);
    setDeleteErrorMsg(null);
    try {
      await apiRequest(`/api/announcements/admin/${deleteTarget.id}/`, {
        method: 'DELETE',
      });
      const deletedTitle = deleteTarget.title;
      const deletedId = deleteTarget.id;
      closeDeleteDialog();
      toast.success('Announcement Deleted', `"${deletedTitle}" was permanently deleted.`);
      setActionBanner({ type: 'success', message: `Announcement "${deletedTitle}" deleted.` });
      if (auditTarget && auditTarget.id === deletedId) {
        setAuditTarget(null);
      }
      await fetchAnnouncements(page);
    } catch (err) {
      const detail = err.data?.detail || err.message || 'Failed to delete announcement.';
      if (err.status === 409) {
        setDeleteConflictMsg(detail);
      } else {
        setDeleteErrorMsg(detail);
      }
    } finally {
      setDeleteSubmitting(false);
    }
  };

  const handleArchiveInstead = async () => {
    if (!deleteTarget) return;
    setDeleteSubmitting(true);
    setDeleteErrorMsg(null);
    try {
      const updated = await apiRequest(`/api/announcements/admin/${deleteTarget.id}/archive/`, {
        method: 'POST',
      });
      closeDeleteDialog();
      const msg = `Announcement "${updated.title}" archived instead of deleted.`;
      toast.success('Announcement Archived', msg);
      setActionBanner({ type: 'success', message: msg });
      await fetchAnnouncements(page);
      if (auditTarget && auditTarget.id === updated.id) {
        await fetchAuditHistory(updated);
      }
    } catch (err) {
      const detail =
        extractFieldMessage(err.data?.detail) ||
        extractFieldMessage(err.data?.status) ||
        err.message ||
        'Failed to archive announcement.';
      setDeleteErrorMsg(detail);
    } finally {
      setDeleteSubmitting(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    setAppliedSearch(searchInput.trim());
  };

  const handleClearFilters = () => {
    setStatusFilter('');
    setAudienceFilter('');
    setSearchInput('');
    setAppliedSearch('');
    setPage(1);
  };

  // Permission Denied State (401 / 403)
  if (error && (errorStatus === 401 || errorStatus === 403)) {
    return (
      <div
        data-testid="announcements-permission-error"
        className="p-8 bg-[#FDE8EA] border border-[#D7263D]/40 rounded-3xl text-center space-y-3"
      >
        <ShieldAlert className="w-10 h-10 text-[#D7263D] mx-auto" />
        <h2 className="font-['Outfit'] text-xl font-extrabold text-[#1A2420]">
          Access Denied ({errorStatus})
        </h2>
        <p className="text-sm text-[#D7263D] font-bold">{error}</p>
        <p className="text-xs text-[#6B6058]">
          Staff administrator privileges are required to view or manage vendor announcements.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-reveal" data-testid="admin-announcements-module">
      {/* Header Banner */}
      <div className="bg-white rounded-3xl border border-[#EAE3DC] p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#FF811A] bg-[#FFF3EC] px-2.5 py-0.5 rounded-full">
              PROMOTIONS &amp; CONTENT
            </span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#1565C0] bg-[#E3F2FD] px-2.5 py-0.5 rounded-full">
              In-App Delivery Only (No Email or SMS)
            </span>
          </div>
          <h1 className="font-['Outfit'] text-2xl sm:text-3xl font-extrabold text-[#FA661C] mt-1">
            Vendor Announcements
          </h1>
          <p className="text-xs sm:text-sm text-[#6B6058] mt-0.5">
            Create, schedule, publish, and archive plain-text notices for all approved vendors or chosen vendors. Delivery is in-app only — no email or SMS is sent.
          </p>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <button
            type="button"
            onClick={() => fetchAnnouncements(page)}
            data-testid="refresh-announcements-btn"
            className="p-2.5 bg-[#FFFFFF] border border-[#EAE3DC] rounded-xl hover:bg-[#FFF3EC] text-[#6B6058] transition-colors cursor-pointer"
            title="Refresh Announcements"
          >
            <RefreshCw className="w-4 h-4 text-[#FA661C]" />
          </button>
          <button
            type="button"
            onClick={openCreateModal}
            data-testid="create-announcement-btn"
            className="px-4 py-2.5 bg-[#FA661C] hover:bg-[#E0530B] text-white text-xs font-bold rounded-xl btn-interactive flex items-center space-x-1.5 cursor-pointer shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>New Announcement</span>
          </button>
        </div>
      </div>

      {/* Policy Notice Bar */}
      <div className="p-4 bg-[#FFF8F2] border border-[#FF811A]/40 rounded-2xl flex items-start space-x-3 text-xs text-[#1A2420]">
        <Info className="w-4 h-4 text-[#FA661C] shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <span className="font-bold text-[#FA661C] block">
            Plain-Text &amp; In-App Delivery Rules
          </span>
          <p className="text-[#6B6058]">
            Announcements are plain text only (HTML tags <code className="font-mono bg-white px-1 rounded">&lt;</code> and <code className="font-mono bg-white px-1 rounded">&gt;</code> are rejected by the server). Delivery is strictly in-app inside the Seller Hub feed — no email or SMS notifications are sent. Once a vendor has read an announcement, it cannot be deleted and must be archived instead.
          </p>
        </div>
      </div>

      {/* Action Status Feedback Banner */}
      {actionBanner && (
        <div
          data-testid="action-feedback-banner"
          className={`p-4 rounded-2xl border flex items-center justify-between gap-3 text-xs ${
            actionBanner.type === 'error'
              ? 'bg-[#FDE8EA] border-[#D7263D]/40 text-[#D7263D]'
              : 'bg-[#E8F5E9] border-[#2E7D32]/30 text-[#2E7D32]'
          }`}
        >
          <div className="flex items-center space-x-2.5">
            {actionBanner.type === 'error' ? (
              <AlertCircle className="w-4 h-4 shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            )}
            <span className="font-bold">{actionBanner.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setActionBanner(null)}
            className="p-1 hover:opacity-75 cursor-pointer"
            aria-label="Dismiss message"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Server Filters & Search Bar */}
      <div className="bg-white rounded-2xl border border-[#EAE3DC] p-4 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 flex-1 max-w-md">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#6B6058] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              name="search"
              aria-label="Search announcements by title"
              data-testid="filter-search-input"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search by title..."
              className="w-full pl-9 pr-3 py-2 bg-[#FDFBF7] border border-[#EAE3DC] rounded-xl text-xs outline-none focus:border-[#FA661C]"
            />
          </div>
          <button
            type="submit"
            data-testid="filter-search-submit"
            className="px-3.5 py-2 bg-[#FA661C] hover:bg-[#E0530B] text-white rounded-xl text-xs font-bold cursor-pointer"
          >
            Search
          </button>
        </form>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center space-x-1.5">
            <label htmlFor="filter-status" className="text-[11px] font-bold text-[#6B6058]">
              Status:
            </label>
            <select
              id="filter-status"
              data-testid="filter-status-select"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 bg-[#FDFBF7] border border-[#EAE3DC] rounded-xl text-xs font-bold text-[#1A2420] outline-none focus:border-[#FA661C] cursor-pointer"
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center space-x-1.5">
            <label htmlFor="filter-audience" className="text-[11px] font-bold text-[#6B6058]">
              Audience:
            </label>
            <select
              id="filter-audience"
              data-testid="filter-audience-select"
              value={audienceFilter}
              onChange={(e) => {
                setAudienceFilter(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 bg-[#FDFBF7] border border-[#EAE3DC] rounded-xl text-xs font-bold text-[#1A2420] outline-none focus:border-[#FA661C] cursor-pointer"
            >
              {AUDIENCE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {(statusFilter || audienceFilter || appliedSearch) && (
            <button
              type="button"
              onClick={handleClearFilters}
              data-testid="clear-filters-btn"
              className="px-3 py-2 bg-[#FFF3EC] text-[#FA661C] rounded-xl text-xs font-bold hover:bg-[#FA661C] hover:text-white transition-colors cursor-pointer"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Main List Content */}
      {loading ? (
        <div
          data-testid="announcements-loading"
          className="p-12 bg-white rounded-2xl border border-[#EAE3DC] text-center space-y-3"
        >
          <RefreshCw className="w-7 h-7 text-[#FA661C] animate-spin mx-auto" />
          <p className="text-xs font-bold text-[#6B6058]">Loading vendor announcements...</p>
        </div>
      ) : error ? (
        <div
          data-testid="announcements-error-state"
          className="p-8 bg-[#FDE8EA] border border-[#D7263D]/40 rounded-2xl text-center space-y-3"
        >
          <AlertCircle className="w-8 h-8 text-[#D7263D] mx-auto" />
          <h3 className="font-['Outfit'] text-base font-extrabold text-[#1A2420]">
            Failed to Load Announcements
          </h3>
          <p className="text-xs text-[#D7263D] font-bold">{error}</p>
          <button
            type="button"
            onClick={() => fetchAnnouncements(page)}
            className="px-4 py-2 bg-[#FA661C] text-white rounded-xl text-xs font-bold cursor-pointer"
          >
            Retry
          </button>
        </div>
      ) : announcements.length === 0 ? (
        <div
          data-testid="announcements-empty-state"
          className="p-10 bg-white rounded-2xl border border-[#EAE3DC] text-center space-y-2"
        >
          <Megaphone className="w-8 h-8 text-[#FA661C] mx-auto opacity-70" />
          <h3 className="font-['Outfit'] text-base font-bold text-[#1A2420]">
            No announcements found
          </h3>
          <p className="text-xs text-[#6B6058]">
            {statusFilter || audienceFilter || appliedSearch
              ? 'No announcements match the selected server filters.'
              : 'No vendor announcements have been created yet.'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-[#EAE3DC] shadow-xs overflow-hidden">
          <div className="px-5 py-3 border-b border-[#EAE3DC] bg-[#FDFBF7] flex items-center justify-between text-xs">
            <span className="font-bold text-[#6B6058]" data-testid="announcements-total-count">
              Showing {announcements.length} of {totalCount} announcement{totalCount === 1 ? '' : 's'}
            </span>
            <span className="text-[11px] text-[#6B6058]">Page {page}</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs" data-testid="announcements-table">
              <thead className="bg-[#FDFBF7] border-b border-[#EAE3DC] text-[#6B6058] font-bold">
                <tr>
                  <th className="p-3.5">Title &amp; Plain-Text Body</th>
                  <th className="p-3.5">Audience</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5">Publish Window (Local Time)</th>
                  <th className="p-3.5">Read Count</th>
                  <th className="p-3.5">Updated</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EAE3DC]">
                {announcements.map((row) => {
                  const isArchived = row.status === 'archived';
                  const canPublish = row.status === 'draft' || row.status === 'expired';
                  const canUnpublish = row.status === 'published' || row.status === 'scheduled';

                  return (
                    <tr
                      key={row.id}
                      data-testid={`announcement-row-${row.id}`}
                      className="hover:bg-[#FFF8F2]/60 transition-colors align-top"
                    >
                      <td className="p-3.5 max-w-xs">
                        <div className="flex items-center space-x-1.5">
                          <span className="font-mono text-[10px] text-[#6B6058]">#{row.id}</span>
                          <span className="font-bold text-[#1A2420] break-words">{row.title}</span>
                        </div>
                        <p className="text-[11px] text-[#6B6058] mt-1 line-clamp-2 whitespace-pre-line break-words">
                          {row.body}
                        </p>
                      </td>

                      <td className="p-3.5">
                        {row.audience === 'selected_vendors' ? (
                          <div className="space-y-1">
                            <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FFF3EC] text-[#FA661C] border border-[#FF811A]/30">
                              <Store className="w-3 h-3" />
                              <span>Selected vendors ({row.target_vendor_ids?.length || 0})</span>
                            </span>
                            {Array.isArray(row.target_vendor_ids) && row.target_vendor_ids.length > 0 && (
                              <div className="text-[10px] text-[#6B6058]">
                                {row.target_vendor_ids
                                  .map((id) => {
                                    const v = vendorMap.get(id);
                                    return v ? `${v.store_name} (#${id})` : `Vendor #${id}`;
                                  })
                                  .join(', ')}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#E8F5E9] text-[#2E7D32]">
                            <Users className="w-3 h-3" />
                            <span>All approved vendors</span>
                          </span>
                        )}
                      </td>

                      <td className="p-3.5">
                        <StatusBadge status={row.status} />
                      </td>

                      <td className="p-3.5 text-[11px] text-[#1A2420] whitespace-nowrap">
                        <div>
                          <span className="font-bold text-[#6B6058]">From: </span>
                          {formatLocalDateTime(row.publish_from)}
                        </div>
                        <div className="mt-0.5">
                          <span className="font-bold text-[#6B6058]">Until: </span>
                          {row.publish_until ? formatLocalDateTime(row.publish_until) : 'No expiry'}
                        </div>
                      </td>

                      <td className="p-3.5 font-mono font-bold text-[#1A2420]" data-testid={`read-count-${row.id}`}>
                        {row.read_count ?? 0}
                      </td>

                      <td className="p-3.5 text-[11px] text-[#6B6058] whitespace-nowrap">
                        {formatLocalDateTime(row.updated_at)}
                      </td>

                      <td className="p-3.5 text-right whitespace-nowrap">
                        <div className="inline-flex flex-wrap items-center justify-end gap-1.5">
                          {canPublish && (
                            <button
                              type="button"
                              onClick={() => handleLifecycleAction(row, 'publish')}
                              data-testid={`publish-announcement-${row.id}`}
                              className="px-2.5 py-1 bg-[#2E7D32] hover:bg-[#1B5E20] text-white rounded-lg text-[11px] font-bold inline-flex items-center space-x-1 cursor-pointer"
                              title="Publish Announcement"
                            >
                              <Send className="w-3 h-3" />
                              <span>Publish</span>
                            </button>
                          )}

                          {canUnpublish && (
                            <button
                              type="button"
                              onClick={() => handleLifecycleAction(row, 'unpublish')}
                              data-testid={`unpublish-announcement-${row.id}`}
                              className="px-2.5 py-1 bg-[#E65100] hover:bg-[#BF360C] text-white rounded-lg text-[11px] font-bold inline-flex items-center space-x-1 cursor-pointer"
                              title="Unpublish to Draft"
                            >
                              <RotateCcw className="w-3 h-3" />
                              <span>Unpublish</span>
                            </button>
                          )}

                          {!isArchived && (
                            <button
                              type="button"
                              onClick={() => handleLifecycleAction(row, 'archive')}
                              data-testid={`archive-announcement-${row.id}`}
                              className="px-2.5 py-1 bg-gray-700 hover:bg-gray-900 text-white rounded-lg text-[11px] font-bold inline-flex items-center space-x-1 cursor-pointer"
                              title="Archive Announcement"
                            >
                              <Archive className="w-3 h-3" />
                              <span>Archive</span>
                            </button>
                          )}

                          {!isArchived && (
                            <button
                              type="button"
                              onClick={() => openEditModal(row)}
                              data-testid={`edit-announcement-${row.id}`}
                              className="p-1.5 bg-[#FFF3EC] hover:bg-[#FA661C] hover:text-white text-[#FA661C] rounded-lg transition-colors cursor-pointer"
                              title="Edit Announcement"
                              aria-label={`Edit announcement ${row.id}`}
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => fetchAuditHistory(row)}
                            data-testid={`audit-announcement-${row.id}`}
                            className="px-2 py-1 bg-[#FDFBF7] border border-[#EAE3DC] hover:border-[#FA661C] text-[#1A2420] rounded-lg text-[11px] font-bold inline-flex items-center space-x-1 cursor-pointer"
                            title="View Audit History"
                          >
                            <History className="w-3 h-3 text-[#FA661C]" />
                            <span>Audit</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => openDeleteDialog(row)}
                            data-testid={`delete-announcement-${row.id}`}
                            className="p-1.5 bg-red-50 hover:bg-red-600 hover:text-white text-red-600 rounded-lg transition-colors cursor-pointer"
                            title="Delete Announcement"
                            aria-label={`Delete announcement ${row.id}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Server Pagination Footer */}
          {(prevUrl || nextUrl) && (
            <div className="px-5 py-3 border-t border-[#EAE3DC] bg-[#FDFBF7] flex items-center justify-between text-xs">
              <button
                type="button"
                disabled={!prevUrl}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                data-testid="pagination-prev-btn"
                className="px-3 py-1.5 rounded-xl border border-[#EAE3DC] bg-white font-bold text-[#1A2420] disabled:opacity-40 inline-flex items-center space-x-1 cursor-pointer disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Previous</span>
              </button>
              <span className="font-bold text-[#6B6058]">Page {page}</span>
              <button
                type="button"
                disabled={!nextUrl}
                onClick={() => setPage((p) => p + 1)}
                data-testid="pagination-next-btn"
                className="px-3 py-1.5 rounded-xl border border-[#EAE3DC] bg-white font-bold text-[#1A2420] disabled:opacity-40 inline-flex items-center space-x-1 cursor-pointer disabled:cursor-not-allowed"
              >
                <span>Next</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Audit History Panel */}
      {auditTarget && (
        <div
          data-testid="audit-history-panel"
          className="bg-white rounded-3xl border border-[#EAE3DC] p-6 shadow-xs space-y-4"
        >
          <div className="flex items-center justify-between pb-3 border-b border-[#EAE3DC]">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#FA661C] bg-[#FFF3EC] px-2 py-0.5 rounded-full">
                IMMUTABLE AUDIT TRAIL
              </span>
              <h2 className="font-['Outfit'] text-lg font-extrabold text-[#1A2420] mt-1">
                Audit History — Announcement #{auditTarget.id} ({auditTarget.title})
              </h2>
            </div>
            <button
              type="button"
              onClick={() => setAuditTarget(null)}
              data-testid="close-audit-panel-btn"
              className="p-2 rounded-xl border border-[#EAE3DC] hover:bg-[#FFF3EC] text-[#6B6058] cursor-pointer"
              aria-label="Close audit history"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {auditLoading ? (
            <div className="p-6 text-center text-xs text-[#6B6058]">
              <RefreshCw className="w-5 h-5 text-[#FA661C] animate-spin mx-auto mb-2" />
              Loading audit trail...
            </div>
          ) : auditError ? (
            <div className="p-4 bg-[#FDE8EA] border border-[#D7263D]/30 rounded-xl text-xs text-[#D7263D] font-bold">
              {auditError}
            </div>
          ) : auditLogs.length === 0 ? (
            <div className="p-6 text-center text-xs text-[#6B6058]">
              No audit events recorded for this announcement.
            </div>
          ) : (
            <div className="space-y-3">
              <div className="text-xs text-[#6B6058] font-bold">
                Total Audit Events: {auditCount}
              </div>
              <div className="overflow-x-auto rounded-2xl border border-[#EAE3DC]">
                <table className="w-full text-left text-xs" data-testid="audit-history-table">
                  <thead className="bg-[#FDFBF7] border-b border-[#EAE3DC] text-[#6B6058] font-bold">
                    <tr>
                      <th className="p-3">Action</th>
                      <th className="p-3">Actor</th>
                      <th className="p-3">Timestamp (Local)</th>
                      <th className="p-3">Old Values</th>
                      <th className="p-3">New Values</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EAE3DC] align-top">
                    {auditLogs.map((log) => (
                      <tr key={log.id} data-testid={`audit-row-${log.id}`}>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-[#FFF3EC] text-[#FA661C] border border-[#FF811A]/30">
                            {log.action}
                          </span>
                        </td>
                        <td className="p-3 font-mono font-bold text-[#1A2420]">
                          {log.actor_id ? `User #${log.actor_id}` : 'System'}
                        </td>
                        <td className="p-3 text-[#6B6058] whitespace-nowrap">
                          {formatLocalDateTime(log.occurred_at)}
                        </td>
                        <td className="p-3 max-w-xs">{formatAuditSnapshot(log.old_value)}</td>
                        <td className="p-3 max-w-xs">{formatAuditSnapshot(log.new_value)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Create / Edit Modal */}
      {modalMode && (
        <div
          data-testid="announcement-form-modal"
          className="fixed inset-0 bg-[#1A1A1A]/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto"
        >
          <div className="bg-white rounded-3xl border border-[#EAE3DC] shadow-2xl max-w-2xl w-full p-6 space-y-5 my-8 max-h-[92vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-3 border-b border-[#EAE3DC] pb-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#FF811A] bg-[#FFF3EC] px-2.5 py-0.5 rounded-full">
                  {modalMode === 'create' ? 'CREATE DRAFT ANNOUNCEMENT' : `EDIT ANNOUNCEMENT #${editingItem?.id}`}
                </span>
                <h2 className="font-['Outfit'] text-xl font-extrabold text-[#FA661C] mt-1">
                  {modalMode === 'create' ? 'New Vendor Announcement' : 'Edit Vendor Announcement'}
                </h2>
              </div>
              <button
                type="button"
                onClick={closeFormModal}
                className="p-1.5 rounded-xl border border-[#EAE3DC] text-[#6B6058] hover:text-[#1A2420] cursor-pointer"
                aria-label="Close modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Plain-text & In-App Notice inside Form */}
            <div className="p-3.5 bg-[#FFF8F2] border border-[#FF811A]/40 rounded-2xl text-xs space-y-1">
              <div className="font-bold text-[#FA661C]">
                Plain-Text Only &bull; In-App Seller Feed Delivery Only
              </div>
              <p className="text-[11px] text-[#6B6058]">
                HTML markup (<code className="font-mono">&lt;</code> or <code className="font-mono">&gt;</code>) is rejected by the server. Announcements are delivered in-app only (no email or SMS).
              </p>
            </div>

            {formBannerError && (
              <div
                data-testid="error-form-banner"
                role="alert"
                className="p-3.5 bg-[#FDE8EA] border border-[#D7263D]/40 rounded-2xl flex items-start space-x-2.5 text-xs text-[#D7263D]"
              >
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span className="font-bold">{formBannerError}</span>
              </div>
            )}

            <form onSubmit={handleFormSubmit} noValidate className="space-y-4 text-xs">
              {/* Title */}
              <div>
                <label htmlFor="announcement-title" className="block font-bold text-[#1A2420] mb-1">
                  Title <span className="text-[#D7263D]">*</span>
                </label>
                <input
                  id="announcement-title"
                  name="title"
                  type="text"
                  data-testid="input-title"
                  aria-invalid={Boolean(fieldErrors.title)}
                  aria-describedby={fieldErrors.title ? 'error-title' : undefined}
                  value={formData.title}
                  onChange={(e) => handleFieldChange('title', e.target.value)}
                  placeholder="Plain-text announcement title (max 160 characters)"
                  className={`w-full px-3.5 py-2.5 rounded-xl border bg-[#FDFBF7] outline-none ${
                    fieldErrors.title ? 'border-[#D7263D] bg-[#FDE8EA]/20' : 'border-[#EAE3DC] focus:border-[#FA661C]'
                  }`}
                />
                {fieldErrors.title && (
                  <p
                    id="error-title"
                    data-testid="error-title"
                    role="alert"
                    className="mt-1 text-[11px] font-bold text-[#D7263D]"
                  >
                    {fieldErrors.title}
                  </p>
                )}
              </div>

              {/* Body */}
              <div>
                <label htmlFor="announcement-body" className="block font-bold text-[#1A2420] mb-1">
                  Body (Plain Text Only) <span className="text-[#D7263D]">*</span>
                </label>
                <textarea
                  id="announcement-body"
                  name="body"
                  rows={4}
                  data-testid="input-body"
                  aria-invalid={Boolean(fieldErrors.body)}
                  aria-describedby={fieldErrors.body ? 'error-body' : undefined}
                  value={formData.body}
                  onChange={(e) => handleFieldChange('body', e.target.value)}
                  placeholder="Write plain-text notice for vendors (no HTML tags)..."
                  className={`w-full px-3.5 py-2.5 rounded-xl border bg-[#FDFBF7] outline-none ${
                    fieldErrors.body ? 'border-[#D7263D] bg-[#FDE8EA]/20' : 'border-[#EAE3DC] focus:border-[#FA661C]'
                  }`}
                />
                {fieldErrors.body && (
                  <p
                    id="error-body"
                    data-testid="error-body"
                    role="alert"
                    className="mt-1 text-[11px] font-bold text-[#D7263D]"
                  >
                    {fieldErrors.body}
                  </p>
                )}
              </div>

              {/* Audience Radio Group */}
              <fieldset className="space-y-2">
                <legend className="font-bold text-[#1A2420] mb-1">
                  Audience <span className="text-[#D7263D]">*</span>
                </legend>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <label
                    className={`flex items-center space-x-2.5 p-3 rounded-xl border cursor-pointer ${
                      formData.audience === 'all_approved'
                        ? 'border-[#FA661C] bg-[#FFF3EC]/60 font-bold text-[#FA661C]'
                        : 'border-[#EAE3DC] bg-[#FDFBF7] text-[#1A2420]'
                    }`}
                  >
                    <input
                      type="radio"
                      name="audience"
                      value="all_approved"
                      data-testid="audience-all-approved"
                      checked={formData.audience === 'all_approved'}
                      onChange={() => handleFieldChange('audience', 'all_approved')}
                    />
                    <span>All approved vendors</span>
                  </label>

                  <label
                    className={`flex items-center space-x-2.5 p-3 rounded-xl border cursor-pointer ${
                      formData.audience === 'selected_vendors'
                        ? 'border-[#FA661C] bg-[#FFF3EC]/60 font-bold text-[#FA661C]'
                        : 'border-[#EAE3DC] bg-[#FDFBF7] text-[#1A2420]'
                    }`}
                  >
                    <input
                      type="radio"
                      name="audience"
                      value="selected_vendors"
                      data-testid="audience-selected-vendors"
                      checked={formData.audience === 'selected_vendors'}
                      onChange={() => handleFieldChange('audience', 'selected_vendors')}
                    />
                    <span>Selected vendors</span>
                  </label>
                </div>
                {fieldErrors.audience && (
                  <p
                    id="error-audience"
                    data-testid="error-audience"
                    role="alert"
                    className="mt-1 text-[11px] font-bold text-[#D7263D]"
                  >
                    {fieldErrors.audience}
                  </p>
                )}
              </fieldset>

              {/* Target Vendor Picker when audience === 'selected_vendors' */}
              {formData.audience === 'selected_vendors' && (
                <div className="space-y-2 p-3.5 rounded-2xl border border-[#EAE3DC] bg-[#FDFBF7]" data-testid="vendor-picker-section">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <label htmlFor="vendor-picker-search" className="font-bold text-[#1A2420]">
                      Choose Target Vendors ({formData.target_vendor_ids.length} selected) <span className="text-[#D7263D]">*</span>
                    </label>
                    <input
                      id="vendor-picker-search"
                      type="text"
                      value={vendorSearch}
                      onChange={(e) => setVendorSearch(e.target.value)}
                      placeholder="Filter vendors by store name or ID..."
                      className="px-2.5 py-1.5 rounded-lg border border-[#EAE3DC] bg-white text-[11px] outline-none focus:border-[#FA661C]"
                    />
                  </div>

                  {vendorsLoading ? (
                    <p className="text-[11px] text-[#6B6058]">Loading vendors from server...</p>
                  ) : vendorsError ? (
                    <p className="text-[11px] text-[#D7263D] font-bold">{vendorsError}</p>
                  ) : vendors.length === 0 ? (
                    <p className="text-[11px] text-[#6B6058]">No vendor profiles returned by server.</p>
                  ) : (
                    <div className="max-h-44 overflow-y-auto divide-y divide-[#EAE3DC]/60 bg-white rounded-xl border border-[#EAE3DC] p-2">
                      {vendors
                        .filter((v) => {
                          if (!vendorSearch.trim()) return true;
                          const q = vendorSearch.toLowerCase();
                          return (
                            String(v.id).includes(q) ||
                            (v.store_name || '').toLowerCase().includes(q) ||
                            (v.business_name || '').toLowerCase().includes(q)
                          );
                        })
                        .map((v) => {
                          const isApproved = APPROVED_VENDOR_STATUSES.has(v.onboarding_status);
                          const checked = formData.target_vendor_ids.includes(v.id);
                          return (
                            <label
                              key={v.id}
                              data-testid={`vendor-option-${v.id}`}
                              className="flex items-center justify-between py-1.5 px-2 hover:bg-[#FFF8F2] rounded-lg cursor-pointer"
                            >
                              <div className="flex items-center space-x-2">
                                <input
                                  type="checkbox"
                                  data-testid={`vendor-checkbox-${v.id}`}
                                  checked={checked}
                                  onChange={() => handleToggleTargetVendor(v.id)}
                                />
                                <span className="font-bold text-[#1A2420]">
                                  {v.store_name || v.business_name || `Vendor #${v.id}`}
                                </span>
                                <span className="font-mono text-[10px] text-[#6B6058]">#{v.id}</span>
                              </div>
                              <span
                                className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full ${
                                  isApproved
                                    ? 'bg-[#E8F5E9] text-[#2E7D32]'
                                    : 'bg-gray-100 text-gray-600'
                                }`}
                              >
                                {v.onboarding_status}
                              </span>
                            </label>
                          );
                        })}
                    </div>
                  )}

                  {fieldErrors.target_vendor_ids && (
                    <p
                      id="error-target_vendor_ids"
                      data-testid="error-target_vendor_ids"
                      role="alert"
                      className="mt-1 text-[11px] font-bold text-[#D7263D]"
                    >
                      {fieldErrors.target_vendor_ids}
                    </p>
                  )}
                </div>
              )}

              {/* Publish Window */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="announcement-publish-from" className="block font-bold text-[#1A2420] mb-1">
                    Publish From (Local Time)
                  </label>
                  <input
                    id="announcement-publish-from"
                    name="publish_from"
                    type="datetime-local"
                    data-testid="input-publish_from"
                    aria-invalid={Boolean(fieldErrors.publish_from)}
                    aria-describedby={fieldErrors.publish_from ? 'error-publish_from' : undefined}
                    value={formData.publish_from}
                    onChange={(e) => handleFieldChange('publish_from', e.target.value)}
                    className={`w-full px-3.5 py-2.5 rounded-xl border bg-[#FDFBF7] outline-none ${
                      fieldErrors.publish_from
                        ? 'border-[#D7263D] bg-[#FDE8EA]/20'
                        : 'border-[#EAE3DC] focus:border-[#FA661C]'
                    }`}
                  />
                  {fieldErrors.publish_from && (
                    <p
                      id="error-publish_from"
                      data-testid="error-publish_from"
                      role="alert"
                      className="mt-1 text-[11px] font-bold text-[#D7263D]"
                    >
                      {fieldErrors.publish_from}
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="announcement-publish-until" className="block font-bold text-[#1A2420] mb-1">
                    Publish Until (Optional, Local Time)
                  </label>
                  <input
                    id="announcement-publish-until"
                    name="publish_until"
                    type="datetime-local"
                    data-testid="input-publish_until"
                    aria-invalid={Boolean(fieldErrors.publish_until)}
                    aria-describedby={fieldErrors.publish_until ? 'error-publish_until' : undefined}
                    value={formData.publish_until}
                    onChange={(e) => handleFieldChange('publish_until', e.target.value)}
                    className={`w-full px-3.5 py-2.5 rounded-xl border bg-[#FDFBF7] outline-none ${
                      fieldErrors.publish_until
                        ? 'border-[#D7263D] bg-[#FDE8EA]/20'
                        : 'border-[#EAE3DC] focus:border-[#FA661C]'
                    }`}
                  />
                  {fieldErrors.publish_until && (
                    <p
                      id="error-publish_until"
                      data-testid="error-publish_until"
                      role="alert"
                      className="mt-1 text-[11px] font-bold text-[#D7263D]"
                    >
                      {fieldErrors.publish_until}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2.5 pt-4 border-t border-[#EAE3DC]">
                <button
                  type="button"
                  onClick={closeFormModal}
                  className="px-4 py-2.5 rounded-xl border border-[#EAE3DC] bg-white text-[#6B6058] font-bold hover:bg-gray-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  data-testid="submit-announcement-btn"
                  className="px-5 py-2.5 rounded-xl bg-[#FA661C] hover:bg-[#E0530B] text-white font-bold shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  {submitting
                    ? 'Saving...'
                    : modalMode === 'create'
                    ? 'Create Draft'
                    : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation & 409 Conflict Dialog */}
      {deleteTarget && (
        <div
          data-testid="delete-confirm-modal"
          className="fixed inset-0 bg-[#1A1A1A]/60 backdrop-blur-xs z-50 flex items-center justify-center p-4"
        >
          <div className="bg-white rounded-3xl border border-[#EAE3DC] shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center space-x-2.5">
                <span className="p-2 rounded-xl bg-[#FDE8EA] text-[#D7263D]">
                  <Trash2 className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="font-['Outfit'] text-lg font-extrabold text-[#1A2420]">
                    Delete Announcement #{deleteTarget.id}?
                  </h3>
                  <p className="text-xs text-[#6B6058] truncate max-w-xs">
                    {deleteTarget.title}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={closeDeleteDialog}
                className="p-1 text-[#6B6058] hover:text-[#1A2420] cursor-pointer"
                aria-label="Close delete dialog"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {!deleteConflictMsg && (
              <p className="text-xs text-[#6B6058]">
                Are you sure you want to permanently delete this announcement? Note: announcements that have already been read by any vendor cannot be deleted.
              </p>
            )}

            {deleteConflictMsg && (
              <div
                data-testid="delete-conflict-message"
                role="alert"
                className="p-3.5 bg-[#FDE8EA] border border-[#D7263D]/40 rounded-2xl space-y-2 text-xs text-[#D7263D]"
              >
                <div className="flex items-start space-x-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span className="font-bold">{deleteConflictMsg}</span>
                </div>
              </div>
            )}

            {deleteErrorMsg && (
              <div
                data-testid="delete-error-message"
                role="alert"
                className="p-3 bg-[#FDE8EA] border border-[#D7263D]/40 rounded-xl text-xs font-bold text-[#D7263D]"
              >
                {deleteErrorMsg}
              </div>
            )}

            <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-[#EAE3DC]">
              <button
                type="button"
                onClick={closeDeleteDialog}
                className="px-4 py-2 rounded-xl border border-[#EAE3DC] bg-white text-xs font-bold text-[#6B6058] cursor-pointer"
              >
                Cancel
              </button>

              {deleteConflictMsg ? (
                <button
                  type="button"
                  disabled={deleteSubmitting || deleteTarget.status === 'archived'}
                  onClick={handleArchiveInstead}
                  data-testid="archive-instead-btn"
                  className="px-4 py-2 rounded-xl bg-[#FA661C] hover:bg-[#E0530B] text-white text-xs font-bold inline-flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Archive className="w-3.5 h-3.5" />
                  <span>{deleteSubmitting ? 'Archiving...' : 'Archive instead'}</span>
                </button>
              ) : (
                <button
                  type="button"
                  disabled={deleteSubmitting}
                  onClick={handleConfirmDelete}
                  data-testid="confirm-delete-btn"
                  className="px-4 py-2 rounded-xl bg-[#D7263D] hover:bg-[#B71C1C] text-white text-xs font-bold cursor-pointer disabled:opacity-50"
                >
                  {deleteSubmitting ? 'Deleting...' : 'Confirm Delete'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

