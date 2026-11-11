import React, { useState, useEffect, useContext, useCallback, useMemo } from 'react';
import {
  Store,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  X,
  FileText,
  Check,
  Ban,
  AlertTriangle,
  Eye,
  Download,
  Lock,
  Unlock,
  History,
  Filter,
  Wallet,
  Info
} from 'lucide-react';
import { apiRequest, fetchProtectedFile } from '../../../utils/api';
import { useToast } from '../../../context/ToastContext';
import AuthContext from '../../../context/AuthContext';

const APPROVED_ONBOARDING_STATUSES = new Set([
  'approved',
  'verified',
  'wizard_in_progress',
  'store_published',
]);

const CONTROL_ACTION_META = {
  suspend: {
    label: 'Suspend Selling',
    endpointSuffix: 'suspend',
    badgeCls: 'bg-[#FDE8EA] text-[#D7263D] border-[#D7263D]/30',
    btnCls: 'border-[#D7263D] bg-[#FDE8EA] text-[#D7263D]',
  },
  reactivate: {
    label: 'Reactivate Selling',
    endpointSuffix: 'reactivate',
    badgeCls: 'bg-[#EAF5ED] text-[#40916C] border-[#52B788]/40',
    btnCls: 'border-[#52B788] bg-[#EAF5ED] text-[#40916C]',
  },
  block_withdrawals: {
    label: 'Block Withdrawals',
    endpointSuffix: 'withdrawals/block',
    badgeCls: 'bg-amber-100 text-amber-900 border-amber-300',
    btnCls: 'border-amber-600 bg-amber-50 text-amber-900',
  },
  release_withdrawals: {
    label: 'Release Withdrawals',
    endpointSuffix: 'withdrawals/release',
    badgeCls: 'bg-[#EAF5ED] text-[#40916C] border-[#52B788]/40',
    btnCls: 'border-[#52B788] bg-[#EAF5ED] text-[#40916C]',
  },
};

export function parseControlErrors(err) {
  const fieldErrors = {};
  let generalError = null;
  const data = err?.data;

  const toCleanText = (val) => {
    if (Array.isArray(val)) {
      return val.map((item) => (typeof item === 'string' ? item : String(item))).join(' ');
    }
    if (typeof val === 'string') return val;
    if (val && typeof val === 'object') {
      return Object.values(val).flat().map(String).join(' ');
    }
    return String(val ?? '');
  };

  if (!data) {
    generalError = err?.message || 'Control action failed.';
    return { fieldErrors, generalError };
  }

  if (typeof data === 'string') {
    generalError = data;
    return { fieldErrors, generalError };
  }

  if (Array.isArray(data)) {
    generalError = toCleanText(data);
    return { fieldErrors, generalError };
  }

  if (typeof data === 'object') {
    for (const [key, val] of Object.entries(data)) {
      const msg = toCleanText(val);
      if (!msg) continue;
      if (key === 'reason' || key === 'seller_visible' || key === 'private_note') {
        fieldErrors[key] = msg;
      } else if (key === 'detail' || key === 'non_field_errors' || key === '__all__') {
        generalError = generalError ? `${generalError} ${msg}` : msg;
      } else {
        generalError = generalError ? `${generalError} ${msg}` : msg;
      }
    }
  }

  if (!generalError && Object.keys(fieldErrors).length === 0) {
    generalError = err?.message || 'Control action failed.';
  }

  return { fieldErrors, generalError };
}

function formatControlSnapshot(values) {
  if (!values || typeof values !== 'object') return '—';
  const parts = [];
  if (values.operational_state) parts.push(`state: ${values.operational_state}`);
  if (typeof values.can_sell === 'boolean') parts.push(`can_sell: ${values.can_sell ? 'true' : 'false'}`);
  if (typeof values.can_withdraw === 'boolean') parts.push(`can_withdraw: ${values.can_withdraw ? 'true' : 'false'}`);
  return parts.join(', ') || '—';
}

export default function VendorHubModule() {
  const auth = useContext(AuthContext);
  const [meFallback, setMeFallback] = useState(null);

  useEffect(() => {
    if (!auth?.currentUser) {
      apiRequest('/api/accounts/me/')
        .then((u) => {
          if (u && typeof u.id !== 'undefined') setMeFallback(u);
        })
        .catch(() => {});
    }
  }, [auth?.currentUser]);

  const effectiveUser = auth?.currentUser || meFallback;
  const isSuperuser = Boolean(effectiveUser?.is_superuser);

  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stateFilter, setStateFilter] = useState('all');

  // Latest control-history event per vendor ID for the table's "Last Change" column
  const [latestControlByVendor, setLatestControlByVendor] = useState({});

  // Selected vendor for inspection/review & controls modal
  const [selectedVendor, setSelectedVendor] = useState(null);

  // Onboarding Decision Form State inside modal
  const [action, setAction] = useState('approve');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  // Per-document action loading state: { [docId]: boolean }
  const [docLoading, setDocLoading] = useState({});
  const [docRejectReason, setDocRejectReason] = useState({});
  const [rejectingDocId, setRejectingDocId] = useState(null);

  // Operational Controls Form State inside modal
  const [controlAction, setControlAction] = useState('suspend');
  const [controlReason, setControlReason] = useState('');
  const [controlSellerVisible, setControlSellerVisible] = useState(false);
  const [controlPrivateNote, setControlPrivateNote] = useState('');
  const [controlSubmitting, setControlSubmitting] = useState(false);
  const [controlFieldErrors, setControlFieldErrors] = useState({});
  const [controlGeneralError, setControlGeneralError] = useState(null);
  const [controlSuccessMsg, setControlSuccessMsg] = useState(null);

  // Paged Control History for selectedVendor
  const [controlHistory, setControlHistory] = useState({
    count: 0,
    next: null,
    previous: null,
    results: [],
  });
  const [historyPage, setHistoryPage] = useState(1);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState(null);

  const toast = useToast();

  const loadLatestControlEvents = useCallback(async (vendorList) => {
    if (!Array.isArray(vendorList) || vendorList.length === 0) return;
    const entries = await Promise.allSettled(
      vendorList.map(async (v) => {
        const data = await apiRequest(`/api/vendors/${v.id}/control-history/?page=1`);
        const results = Array.isArray(data) ? data : data?.results;
        return { vendorId: v.id, latest: Array.isArray(results) && results.length > 0 ? results[0] : null };
      })
    );
    const nextMap = {};
    entries.forEach((res) => {
      if (res.status === 'fulfilled' && res.value) {
        nextMap[res.value.vendorId] = res.value.latest;
      }
    });
    setLatestControlByVendor((prev) => ({ ...prev, ...nextMap }));
  }, []);

  const fetchVendors = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiRequest('/api/vendors/admin/');
      const list = Array.isArray(data) ? data : (data?.results || []);
      setVendors(list);
      setSelectedVendor((prev) => {
        if (!prev) return null;
        return list.find((item) => item.id === prev.id) || prev;
      });
      loadLatestControlEvents(list);
      return list;
    } catch (err) {
      console.error("Failed to fetch admin vendors list:", err);
      setError(err.data?.detail || err.message || "Failed to load merchant directory.");
      return [];
    } finally {
      setLoading(false);
    }
  }, [loadLatestControlEvents]);

  const fetchVendorControlHistory = useCallback(async (vendorId, page = 1) => {
    if (!vendorId) return;
    setHistoryLoading(true);
    setHistoryError(null);
    try {
      const data = await apiRequest(`/api/vendors/${vendorId}/control-history/?page=${page}`);
      const results = Array.isArray(data) ? data : (Array.isArray(data?.results) ? data.results : []);
      const count = Array.isArray(data) ? data.length : (data?.count ?? results.length);
      setControlHistory({
        count,
        next: data?.next ?? null,
        previous: data?.previous ?? null,
        results,
      });
      setHistoryPage(page);
      if (page === 1) {
        setLatestControlByVendor((prev) => ({
          ...prev,
          [vendorId]: results.length > 0 ? results[0] : null,
        }));
      }
    } catch (err) {
      setHistoryError(err?.data?.detail || err?.message || 'Failed to load vendor control history.');
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  const handleViewDocument = async (doc, tab) => {
    try {
      const file = await fetchProtectedFile(doc.download_url);
      const objectUrl = URL.createObjectURL(file);
      if (tab && !tab.closed) {
        tab.location.href = objectUrl;
      } else {
        const link = document.createElement('a');
        link.href = objectUrl;
        link.download = doc.file_name || `${doc.document_type}-document`;
        document.body.appendChild(link);
        link.click();
        link.remove();
      }
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
    } catch (err) {
      if (tab && !tab.closed) tab.close();
      toast.error('Document Unavailable', err?.message || 'Could not open this uploaded file. Ask the seller to upload it again.');
    }
  };

  useEffect(() => {
    fetchVendors();
  }, [fetchVendors]);

  const openReviewModal = (vendor) => {
    setSelectedVendor(vendor);
    setAction(vendor.onboarding_status === 'under_review' ? 'approve' : 'under_review');
    setReason(vendor.onboarding_review_reason || '');
    setFormError(null);
    setRejectingDocId(null);

    // Initialize vendor controls form state
    const isApproved = APPROVED_ONBOARDING_STATUSES.has(vendor.onboarding_status);
    if (!isApproved) {
      setControlAction('reactivate');
    } else if (vendor.operational_state === 'suspended') {
      setControlAction('reactivate');
    } else {
      setControlAction('suspend');
    }
    setControlReason('');
    setControlSellerVisible(false);
    setControlPrivateNote('');
    setControlFieldErrors({});
    setControlGeneralError(null);
    setControlSuccessMsg(null);

    fetchVendorControlHistory(vendor.id, 1);
  };

  const closeReviewModal = () => {
    setSelectedVendor(null);
    setFormError(null);
    setReason('');
    setRejectingDocId(null);
    setControlFieldErrors({});
    setControlGeneralError(null);
    setControlSuccessMsg(null);
  };

  const selectControlAction = (nextAction) => {
    setControlAction(nextAction);
    setControlFieldErrors({});
    setControlGeneralError(null);
    setControlSuccessMsg(null);
  };

  // Submit Operational Control Action (suspend, reactivate, block_withdrawals, release_withdrawals)
  const handleControlSubmit = async (e) => {
    e.preventDefault();
    if (!selectedVendor || !controlAction) return;

    const meta = CONTROL_ACTION_META[controlAction];
    if (!meta) return;

    setControlSubmitting(true);
    setControlFieldErrors({});
    setControlGeneralError(null);
    setControlSuccessMsg(null);

    try {
      const payload = {
        reason: controlReason,
        seller_visible: Boolean(controlSellerVisible),
        private_note: controlPrivateNote,
      };

      const res = await apiRequest(`/api/vendors/${selectedVendor.id}/${meta.endpointSuffix}/`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      const updatedVendor = res?.vendor || res;
      if (updatedVendor && updatedVendor.id) {
        setSelectedVendor(updatedVendor);
        setVendors((prev) => prev.map((v) => (v.id === updatedVendor.id ? updatedVendor : v)));
      }

      setControlReason('');
      setControlSellerVisible(false);
      setControlPrivateNote('');
      const confirmedMsg = `${meta.label} confirmed by server for ${
        selectedVendor.business_name || selectedVendor.store_name
      }.`;
      setControlSuccessMsg(confirmedMsg);
      toast.success('Vendor Control Updated', confirmedMsg);

      // Refetch vendor list and control history from server
      await Promise.all([
        fetchVendors(),
        fetchVendorControlHistory(selectedVendor.id, 1),
      ]);
    } catch (err) {
      const { fieldErrors, generalError } = parseControlErrors(err);
      setControlFieldErrors(fieldErrors);
      setControlGeneralError(generalError);
    } finally {
      setControlSubmitting(false);
    }
  };

  // 1. Submit Document Review (verify/reject individual document)
  const handleDocumentReview = async (docId, newStatus, rejectionReason = "") => {
    setDocLoading(prev => ({ ...prev, [docId]: true }));
    try {
      const payload = { status: newStatus };
      if (newStatus === 'rejected' && rejectionReason) {
        payload.rejection_reason = rejectionReason;
      }

      const updatedDoc = await apiRequest(`/api/vendors/documents/${docId}/review/`, {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      // Update document in selectedVendor and vendors list
      const updateDocs = (docList) => (docList || []).map(d => d.id === docId ? updatedDoc : d);

      setSelectedVendor(prev => prev ? { ...prev, documents: updateDocs(prev.documents) } : null);
      setVendors(prev => prev.map(v => v.id === selectedVendor.id ? { ...v, documents: updateDocs(v.documents) } : v));

      toast.success(
        newStatus === 'verified' ? "Document Verified" : "Document Rejected",
        `Document #${docId} status updated to ${newStatus}.`
      );
      setRejectingDocId(null);
    } catch (err) {
      console.error("Failed to review document:", err);
      const errMsg = err.data?.detail || err.message || "Failed to update document review status.";
      toast.error("Document Review Error", errMsg);
    } finally {
      setDocLoading(prev => ({ ...prev, [docId]: false }));
    }
  };

  // 2. Submit Vendor Onboarding Decision
  const handleOnboardingSubmit = async (e) => {
    e.preventDefault();
    if (!selectedVendor) return;

    if ((action === 'reject' || action === 'resubmit_required') && !reason.trim()) {
      setFormError("A reason is required when rejecting or requesting resubmission.");
      return;
    }

    setSubmitting(true);
    setFormError(null);

    try {
      const payload = { action, reason: reason.trim() };
      const updatedVendor = await apiRequest(`/api/vendors/${selectedVendor.id}/review/`, {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      // Update vendors list and close modal
      setVendors(prev => prev.map(v => v.id === updatedVendor.id ? updatedVendor : v));
      toast.success("Merchant Review Updated", `Merchant ${updatedVendor.business_name || updatedVendor.store_name} onboarding status is now ${updatedVendor.onboarding_status}.`);
      closeReviewModal();
    } catch (err) {
      console.error("Failed to submit vendor review decision:", err);
      let errMsg = "Failed to update onboarding decision.";
      if (err.data) {
        if (typeof err.data === 'string') errMsg = err.data;
        else if (err.data.detail) errMsg = typeof err.data.detail === 'string' ? err.data.detail : JSON.stringify(err.data.detail);
        else if (err.data.reason) errMsg = Array.isArray(err.data.reason) ? err.data.reason[0] : err.data.reason;
        else if (err.data.action) errMsg = Array.isArray(err.data.action) ? err.data.action[0] : err.data.action;
      } else if (err.message) {
        errMsg = err.message;
      }
      setFormError(errMsg);
    } finally {
      setSubmitting(false);
    }
  };

  const pendingApprovalsCount = vendors.filter(v => ['registered', 'under_review', 'resubmit_required'].includes(v.onboarding_status)).length;

  const filteredVendors = useMemo(() => {
    return vendors.filter((v) => {
      const opState = v.operational_state || 'active';
      const canSell = v.can_sell !== false;
      const canWithdraw = v.can_withdraw !== false;
      const maySell = v.may_sell !== undefined ? v.may_sell : (opState === 'active' && canSell);

      if (stateFilter === 'active') return opState === 'active';
      if (stateFilter === 'suspended') return opState === 'suspended';
      if (stateFilter === 'withdrawals_blocked') return !canWithdraw;
      if (stateFilter === 'selling_restricted') return !canSell || !maySell;
      return true;
    });
  }, [vendors, stateFilter]);

  const isSelectedApproved = selectedVendor
    ? APPROVED_ONBOARDING_STATUSES.has(selectedVendor.onboarding_status)
    : false;

  return (
    <div className="space-y-6">
      
      {/* 1. Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-4 border-b border-[#EAE3DC]">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="p-1 rounded-lg bg-[#FFF3EC] text-[#FA661C]">
              <Store className="w-4 h-4" />
            </span>
            <h2 className="font-['Outfit'] font-black text-xl text-[#FA661C]">
              Vendor &amp; Seller Governance Hub
            </h2>
            <span
              data-testid="admin-role-indicator"
              className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border ${
                isSuperuser
                  ? 'bg-[#EAF5ED] text-[#40916C] border-[#52B788]/40'
                  : 'bg-[#FFF8F2] text-[#FA661C] border-[#FF811A]/40'
              }`}
            >
              {isSuperuser
                ? `Superuser (${effectiveUser?.username || 'superuser'}) — Full Selling & Withdrawal Controls`
                : `Staff (${effectiveUser?.username || 'staff'}) — Selling Controls • Withdrawals Read-Only`}
            </span>
          </div>
          <p className="text-xs text-[#6B6058] mt-0.5">
            Merchant Governance: Operational State, Selling &amp; Withdrawal Switches, Control Audit History, KYC Verification &amp; Onboarding Decisions.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 self-start lg:self-auto">
          {/* Operational State Filter */}
          <div className="flex items-center space-x-1.5 bg-white border border-[#EAE3DC] rounded-xl px-2.5 py-1.5">
            <Filter className="w-3.5 h-3.5 text-[#FA661C]" />
            <select
              aria-label="Filter by operational state"
              data-testid="vendor-state-filter"
              value={stateFilter}
              onChange={(e) => setStateFilter(e.target.value)}
              className="text-xs font-bold text-[#1A2420] bg-transparent focus:outline-none cursor-pointer"
            >
              <option value="all">All States ({vendors.length})</option>
              <option value="active">Active Only</option>
              <option value="suspended">Suspended Only</option>
              <option value="withdrawals_blocked">Withdrawals Blocked</option>
              <option value="selling_restricted">Selling Restricted</option>
            </select>
          </div>

          <span className="text-xs font-bold text-[#FA661C] bg-[#FFF8F2] border border-[#FF811A]/50 px-3 py-1.5 rounded-xl flex items-center space-x-1.5">
            <AlertCircle className="w-4 h-4" />
            <span>{pendingApprovalsCount} Pending Governance Reviews</span>
          </span>

          <button
            type="button"
            data-testid="refresh-vendors-btn"
            onClick={fetchVendors}
            disabled={loading}
            className="p-2 rounded-xl bg-white hover:bg-[#FFF3EC] border border-[#EAE3DC] text-[#FA661C] btn-interactive cursor-pointer disabled:opacity-50"
            title="Refresh Merchant List"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* 2. Error Banner */}
      {error && (
        <div
          role="alert"
          data-testid="vendor-list-error"
          className="p-4 bg-[#FDE8EA] border border-[#D7263D]/30 rounded-2xl flex items-start space-x-3 text-xs text-[#D7263D]"
        >
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="font-bold">Error Loading Vendor Directory</div>
            <p className="mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {/* 3. Loading State */}
      {loading && (
        <div className="bg-white rounded-2xl border border-[#EAE3DC] p-6 text-center animate-pulse text-xs text-[#6B6058]">
          Loading merchant profiles and KYC documents...
        </div>
      )}

      {/* 4. Empty Directory State */}
      {!loading && !error && filteredVendors.length === 0 && (
        <div className="bg-white rounded-3xl border border-dashed border-[#EAE3DC] p-10 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-[#FFF3EC] text-[#FA661C] mx-auto flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6 text-[#52B788]" />
          </div>
          <h3 className="font-['Outfit'] font-bold text-base text-[#FA661C]">
            {vendors.length === 0 ? 'No Merchant Profiles Registered' : 'No Merchants Match Filter'}
          </h3>
          <p className="text-xs text-[#6B6058] max-w-md mx-auto">
            {vendors.length === 0
              ? 'No seller accounts have registered on the marketplace yet. Newly onboarded merchants will appear here for review.'
              : 'Try changing the operational state filter above to view all registered merchants.'}
          </p>
        </div>
      )}

      {/* 5. Real Vendor Table */}
      {!loading && !error && filteredVendors.length > 0 && (
        <div className="bg-white rounded-2xl border border-[#EAE3DC] overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#FFF3EC] text-[#FA661C] border-b border-[#EAE3DC] font-extrabold uppercase text-[10px] tracking-wider">
                  <th className="p-3">Merchant &amp; Store Name</th>
                  <th className="p-3">Jurisdiction &amp; Tax ID</th>
                  <th className="p-3 text-center">KYC Documents</th>
                  <th className="p-3 text-center">Onboarding Status</th>
                  <th className="p-3 text-center">Operational State &amp; Switches</th>
                  <th className="p-3">Last Control Change</th>
                  <th className="p-3 text-center">Governance Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EAE3DC]/60 font-medium">
                {filteredVendors.map((vendor) => {
                  const docs = vendor.documents || [];
                  const verifiedDocs = docs.filter(d => d.status === 'verified').length;
                  const totalDocs = docs.length;

                  const opState = vendor.operational_state || 'active';
                  const canSell = vendor.can_sell !== false;
                  const canWithdraw = vendor.can_withdraw !== false;
                  const maySell = vendor.may_sell !== undefined
                    ? vendor.may_sell
                    : (opState === 'active' && canSell && APPROVED_ONBOARDING_STATUSES.has(vendor.onboarding_status));
                  const latestEvent = latestControlByVendor[vendor.id];

                  let statusBadgeStyle = 'bg-[#FFF3EC] text-[#FA661C] border-[#FA661C]/30';
                  if (['registered', 'under_review'].includes(vendor.onboarding_status)) {
                    statusBadgeStyle = 'bg-[#FFF8F2] text-[#FA661C] border-[#FF811A]/40 animate-pulse';
                  } else if (['approved', 'verified', 'store_published'].includes(vendor.onboarding_status)) {
                    statusBadgeStyle = 'bg-[#EAF5ED] text-[#52B788] border-[#52B788]/40';
                  } else if (['rejected', 'resubmit_required'].includes(vendor.onboarding_status)) {
                    statusBadgeStyle = 'bg-[#FDE8EA] text-[#D7263D] border-[#D7263D]/40';
                  }

                  return (
                    <tr
                      key={vendor.id}
                      data-testid={`vendor-row-${vendor.id}`}
                      className="hover:bg-[#FFF8F2]/40 transition-colors"
                    >
                      <td className="p-3">
                        <div className="font-bold text-[#FA661C] text-xs flex items-center space-x-1.5">
                          <span>{vendor.business_name || vendor.store_name}</span>
                          <span className="text-[10px] font-mono text-[#6B6058]">#{vendor.id}</span>
                          {vendor.is_women_owned && (
                            <span className="text-[9px] font-black uppercase bg-[#FFF3EC] text-[#FA661C] border border-[#FA661C]/40 px-1.5 py-0.5 rounded-full">
                              Women Owned
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-[#6B6058] mt-0.5">
                          Store: <span className="font-medium text-[#FA661C]">{vendor.store_name}</span> ({vendor.store_slug})
                        </div>
                      </td>

                      <td className="p-3">
                        <span className="font-bold text-[#FA661C] block">{vendor.country} • <span className="capitalize">{vendor.business_type || 'company'}</span></span>
                        <span className="font-mono text-[10px] text-[#6B6058]">Tax ID: {vendor.tax_id || 'Not set'}</span>
                      </td>

                      <td className="p-3 text-center">
                        <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          totalDocs === 0
                            ? 'bg-gray-100 text-gray-600 border border-gray-300'
                            : verifiedDocs === totalDocs
                            ? 'bg-[#EAF5ED] text-[#52B788] border border-[#52B788]/40'
                            : 'bg-[#FFF8F2] text-[#FA661C] border border-[#FF811A]/40'
                        }`}>
                          {totalDocs === 0 ? 'No Documents Uploaded' : `${verifiedDocs} / ${totalDocs} Verified`}
                        </span>
                      </td>

                      <td className="p-3 text-center">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border ${statusBadgeStyle}`}>
                          {vendor.onboarding_status}
                        </span>
                      </td>

                      <td className="p-3 text-center">
                        <div className="flex flex-col items-center gap-1">
                          <span
                            data-testid={`vendor-state-${vendor.id}`}
                            className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase border ${
                              opState === 'suspended'
                                ? 'bg-[#FDE8EA] text-[#D7263D] border-[#D7263D]/40'
                                : 'bg-[#EAF5ED] text-[#40916C] border-[#52B788]/40'
                            }`}
                          >
                            State: {opState}
                          </span>
                          <div className="flex flex-wrap items-center justify-center gap-1">
                            <span
                              data-testid={`vendor-sell-switch-${vendor.id}`}
                              className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                                canSell && maySell
                                  ? 'bg-[#EAF5ED] text-[#40916C] border-[#52B788]/30'
                                  : 'bg-[#FDE8EA] text-[#D7263D] border-[#D7263D]/30'
                              }`}
                            >
                              Selling: {canSell ? (maySell ? 'On' : 'Pending KYC') : 'Off'}
                            </span>
                            <span
                              data-testid={`vendor-withdraw-switch-${vendor.id}`}
                              className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                                canWithdraw
                                  ? 'bg-[#EAF5ED] text-[#40916C] border-[#52B788]/30'
                                  : 'bg-amber-100 text-amber-900 border-amber-300'
                              }`}
                            >
                              Withdrawals: {canWithdraw ? 'On' : 'Blocked'}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="p-3" data-testid={`vendor-last-change-${vendor.id}`}>
                        {latestEvent ? (
                          <div className="text-[10px] space-y-0.5">
                            <span className="font-bold text-[#1A2420] block">
                              {CONTROL_ACTION_META[latestEvent.action]?.label || latestEvent.action}
                            </span>
                            <span className="text-[#6B6058] block font-mono">
                              Actor #{latestEvent.actor} • {latestEvent.occurred_at ? new Date(latestEvent.occurred_at).toLocaleString() : '—'}
                            </span>
                          </div>
                        ) : (
                          <span className="text-[10px] text-[#6B6058] italic">No control changes</span>
                        )}
                      </td>

                      <td className="p-3 text-center">
                        <button
                          type="button"
                          data-testid={`review-vendor-btn-${vendor.id}`}
                          onClick={() => openReviewModal(vendor)}
                          className="px-3 py-1.5 rounded-xl bg-[#FA661C] text-[#FF811A] font-bold text-[10px] btn-interactive cursor-pointer shadow-xs inline-flex items-center space-x-1"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Review Merchant</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 6. Real Merchant Review, Operational Controls & Control History Modal */}
      {selectedVendor && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-[#EAE3DC] w-full max-w-4xl max-h-[92vh] overflow-y-auto shadow-2xl p-6 sm:p-8 space-y-6 animate-reveal">
            
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-4 border-b border-[#EAE3DC]">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#FA661C] bg-[#FFF3EC] px-2.5 py-0.5 rounded-full border border-[#FA661C]/30">
                  MERCHANT ONBOARDING GOVERNANCE
                </span>
                <h3 className="font-['Outfit'] text-xl sm:text-2xl font-black text-[#FA661C] mt-1.5 flex items-center space-x-2">
                  <span>{selectedVendor.business_name || selectedVendor.store_name}</span>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full uppercase bg-[#FFF8F2] text-[#FA661C] border border-[#FF811A]/40">
                    ID #{selectedVendor.id}
                  </span>
                </h3>
                <p className="text-xs text-[#6B6058] mt-0.5">
                  Manage operational selling and withdrawal switches, inspect control history, and review KYC onboarding.
                </p>
              </div>
              
              <button
                type="button"
                data-testid="close-vendor-modal-btn"
                onClick={closeReviewModal}
                className="p-1.5 rounded-xl text-[#6B6058] hover:text-[#FA661C] hover:bg-[#FFF3EC] transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Merchant Details Summary Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-[#FFF8F2]/60 rounded-2xl border border-[#FF811A]/20 text-xs">
              <div>
                <span className="text-[#6B6058] block text-[10px] uppercase font-bold">Legal Business Name</span>
                <span className="font-bold text-[#FA661C] text-sm">{selectedVendor.business_name || 'N/A'}</span>
              </div>

              <div>
                <span className="text-[#6B6058] block text-[10px] uppercase font-bold">Store Name &amp; Slug</span>
                <span className="font-bold text-[#FA661C] text-sm">{selectedVendor.store_name} ({selectedVendor.store_slug})</span>
              </div>

              <div>
                <span className="text-[#6B6058] block text-[10px] uppercase font-bold">Country Jurisdiction &amp; Tax ID</span>
                <span className="font-bold text-[#FA661C]">{selectedVendor.country} • Tax ID: {selectedVendor.tax_id || 'Not set'}</span>
              </div>

              <div>
                <span className="text-[#6B6058] block text-[10px] uppercase font-bold">Registration Number &amp; Type</span>
                <span className="font-bold text-[#FA661C] capitalize">{selectedVendor.registration_number || 'N/A'} ({selectedVendor.business_type || 'company'})</span>
              </div>

              <div>
                <span className="text-[#6B6058] block text-[10px] uppercase font-bold">Support Contact</span>
                <span className="font-medium text-[#6B6058]">{selectedVendor.support_email || 'No email'} • {selectedVendor.support_phone || 'No phone'}</span>
              </div>

              <div>
                <span className="text-[#6B6058] block text-[10px] uppercase font-bold">Current Onboarding Status</span>
                <span className="font-bold uppercase text-[#FA661C]">{selectedVendor.onboarding_status}</span>
              </div>
            </div>

            {/* ========================================================================= */}
            {/* VENDOR OPERATIONAL CONTROLS PANEL (Suspend, Reactivate, Withdrawals)      */}
            {/* ========================================================================= */}
            <div
              data-testid="vendor-controls-panel"
              className="p-5 rounded-3xl border-2 border-[#FA661C]/30 bg-[#FFF8F2]/50 space-y-4 text-xs"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#EAE3DC]">
                <div>
                  <h4 className="font-['Outfit'] font-black text-base text-[#FA661C] flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-[#FF811A]" />
                    <span>Vendor Operational Controls &amp; Switches</span>
                  </h4>
                  <p className="text-[11px] text-[#6B6058] mt-0.5">
                    Every control change requires an audited reason and is permanently recorded in vendor control history.
                  </p>
                </div>

                {/* Live State Pills */}
                <div className="flex flex-wrap items-center gap-1.5">
                  <span
                    data-testid="modal-operational-state"
                    className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase border ${
                      selectedVendor.operational_state === 'suspended'
                        ? 'bg-[#FDE8EA] text-[#D7263D] border-[#D7263D]/40'
                        : 'bg-[#EAF5ED] text-[#40916C] border-[#52B788]/40'
                    }`}
                  >
                    State: {selectedVendor.operational_state || 'active'}
                  </span>
                  <span
                    data-testid="modal-selling-switch"
                    className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border ${
                      selectedVendor.can_sell !== false
                        ? 'bg-[#EAF5ED] text-[#40916C] border-[#52B788]/40'
                        : 'bg-[#FDE8EA] text-[#D7263D] border-[#D7263D]/40'
                    }`}
                  >
                    can_sell: {selectedVendor.can_sell !== false ? 'true' : 'false'} (may_sell: {selectedVendor.may_sell ? 'true' : 'false'})
                  </span>
                  <span
                    data-testid="modal-withdrawals-switch"
                    className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border ${
                      selectedVendor.can_withdraw !== false
                        ? 'bg-[#EAF5ED] text-[#40916C] border-[#52B788]/40'
                        : 'bg-amber-100 text-amber-900 border-amber-300'
                    }`}
                  >
                    can_withdraw: {selectedVendor.can_withdraw !== false ? 'true' : 'false'}
                  </span>
                </div>
              </div>

              {/* Honest Server Policy Notes */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="p-3 rounded-2xl bg-white border border-[#EAE3DC] flex items-start gap-2">
                  <Ban className="w-4 h-4 text-[#FA661C] shrink-0 mt-0.5" />
                  <div className="text-[11px] text-[#6B6058]">
                    <strong className="text-[#1A2420] block">Storefront Suspension</strong>
                    A suspended vendor’s products disappear from the storefront and cannot be bought (<code>vendor_cannot_sell</code>). Product fields are untouched, and reactivation restores them.
                  </div>
                </div>
                <div className="p-3 rounded-2xl bg-white border border-[#EAE3DC] flex items-start gap-2">
                  <Lock className="w-4 h-4 text-[#FA661C] shrink-0 mt-0.5" />
                  <div className="text-[11px] text-[#6B6058]">
                    <strong className="text-[#1A2420] block">Withdrawal Gate (Superuser)</strong>
                    Blocking withdrawals only refuses <strong>NEW</strong> requests (<code>withdrawals_blocked</code>). Requests already in flight continue unchanged.
                  </div>
                </div>
                <div className="p-3 rounded-2xl bg-white border border-[#EAE3DC] flex items-start gap-2">
                  <Wallet className="w-4 h-4 text-[#40916C] shrink-0 mt-0.5" />
                  <div className="text-[11px] text-[#6B6058]">
                    <strong className="text-[#1A2420] block">Settled Money Stays Seller’s</strong>
                    Settled wallet balances remain the seller’s property. Suspension or withdrawal restrictions never remove settled funds.
                  </div>
                </div>
              </div>

              {/* Two Switch Cards: 1) Selling Switch (Staff)  2) Withdrawals Switch (Superuser Only) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Card 1: Selling Controls (Staff & Superuser) */}
                <div className="p-4 rounded-2xl bg-white border border-[#EAE3DC] space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#1A2420] uppercase text-[11px] tracking-wide">
                      1. Selling Switch (Staff &amp; Superuser)
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      selectedVendor.can_sell !== false ? 'bg-[#EAF5ED] text-[#40916C]' : 'bg-[#FDE8EA] text-[#D7263D]'
                    }`}>
                      {selectedVendor.operational_state === 'suspended' ? 'Suspended' : 'Active'}
                    </span>
                  </div>

                  {!isSelectedApproved ? (
                    <div
                      data-testid="unapproved-suspend-notice"
                      className="p-3 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 space-y-2 text-[11px]"
                    >
                      <div className="font-bold flex items-center gap-1.5">
                        <AlertTriangle className="w-4 h-4 shrink-0 text-amber-700" />
                        <span>Unapproved Vendor ({selectedVendor.onboarding_status})</span>
                      </div>
                      <p>
                        <strong>Suspend is not for unapproved vendors.</strong> Use <strong>Reject</strong> in the Onboarding Decision form below for vendors who are not approved.
                      </p>
                      <div className="flex flex-wrap gap-2 pt-1">
                        <button
                          type="button"
                          data-testid="control-btn-reactivate"
                          onClick={() => selectControlAction('reactivate')}
                          className={`px-3 py-1.5 rounded-xl border font-bold text-[11px] cursor-pointer ${
                            controlAction === 'reactivate'
                              ? 'border-[#52B788] bg-[#EAF5ED] text-[#40916C] ring-2 ring-[#FA661C]'
                              : 'border-[#EAE3DC] bg-white text-[#6B6058]'
                          }`}
                        >
                          Reactivate Selling
                        </button>
                        <button
                          type="button"
                          data-testid="control-btn-suspend-unapproved"
                          onClick={() => selectControlAction('suspend')}
                          className={`px-3 py-1.5 rounded-xl border font-bold text-[11px] cursor-pointer ${
                            controlAction === 'suspend'
                              ? 'border-[#D7263D] bg-[#FDE8EA] text-[#D7263D] ring-2 ring-[#FA661C]'
                              : 'border-amber-300 bg-white text-amber-900'
                          }`}
                        >
                          Attempt Suspend (Server 400 Check)
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        data-testid="control-btn-suspend"
                        onClick={() => selectControlAction('suspend')}
                        className={`flex-1 py-2 px-3 rounded-xl border font-bold text-xs cursor-pointer transition-all ${
                          controlAction === 'suspend'
                            ? 'border-[#D7263D] bg-[#FDE8EA] text-[#D7263D] ring-2 ring-offset-1 ring-[#FA661C]'
                            : 'border-[#EAE3DC] bg-white text-[#6B6058] hover:bg-[#FFF8F2]'
                        }`}
                      >
                        Suspend Selling
                      </button>
                      <button
                        type="button"
                        data-testid="control-btn-reactivate"
                        onClick={() => selectControlAction('reactivate')}
                        className={`flex-1 py-2 px-3 rounded-xl border font-bold text-xs cursor-pointer transition-all ${
                          controlAction === 'reactivate'
                            ? 'border-[#52B788] bg-[#EAF5ED] text-[#40916C] ring-2 ring-offset-1 ring-[#FA661C]'
                            : 'border-[#EAE3DC] bg-white text-[#6B6058] hover:bg-[#FFF8F2]'
                        }`}
                      >
                        Reactivate Selling
                      </button>
                    </div>
                  )}
                </div>

                {/* Card 2: Withdrawals Switch (Superuser Only) */}
                <div className="p-4 rounded-2xl bg-white border border-[#EAE3DC] space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#1A2420] uppercase text-[11px] tracking-wide flex items-center gap-1">
                      <Lock className="w-3.5 h-3.5 text-[#FA661C]" />
                      <span>2. Withdrawals Switch (Superuser Only)</span>
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      selectedVendor.can_withdraw !== false ? 'bg-[#EAF5ED] text-[#40916C]' : 'bg-amber-100 text-amber-900'
                    }`}>
                      {selectedVendor.can_withdraw !== false ? 'Withdrawals Allowed' : 'Withdrawals Blocked'}
                    </span>
                  </div>

                  {!isSuperuser && (
                    <div
                      data-testid="staff-withdrawal-readonly-note"
                      className="p-2.5 rounded-xl bg-gray-100 border border-gray-300 text-gray-700 text-[11px] font-semibold flex items-center gap-2"
                    >
                      <Lock className="w-4 h-4 shrink-0 text-gray-600" />
                      <span>Read-only for normal staff — only a superuser may block or release withdrawals.</span>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      data-testid="control-btn-block_withdrawals"
                      disabled={!isSuperuser}
                      onClick={() => selectControlAction('block_withdrawals')}
                      className={`flex-1 py-2 px-3 rounded-xl border font-bold text-xs transition-all ${
                        !isSuperuser
                          ? 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed opacity-60'
                          : controlAction === 'block_withdrawals'
                          ? 'border-amber-600 bg-amber-50 text-amber-900 ring-2 ring-offset-1 ring-[#FA661C] cursor-pointer'
                          : 'border-[#EAE3DC] bg-white text-[#6B6058] hover:bg-[#FFF8F2] cursor-pointer'
                      }`}
                    >
                      Block Withdrawals
                    </button>
                    <button
                      type="button"
                      data-testid="control-btn-release_withdrawals"
                      disabled={!isSuperuser}
                      onClick={() => selectControlAction('release_withdrawals')}
                      className={`flex-1 py-2 px-3 rounded-xl border font-bold text-xs transition-all ${
                        !isSuperuser
                          ? 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed opacity-60'
                          : controlAction === 'release_withdrawals'
                          ? 'border-[#52B788] bg-[#EAF5ED] text-[#40916C] ring-2 ring-offset-1 ring-[#FA661C] cursor-pointer'
                          : 'border-[#EAE3DC] bg-white text-[#6B6058] hover:bg-[#FFF8F2] cursor-pointer'
                      }`}
                    >
                      Release Withdrawals
                    </button>
                  </div>
                </div>
              </div>

              {/* Control Action Execution Form */}
              <form
                noValidate
                onSubmit={handleControlSubmit}
                data-testid="vendor-control-form"
                className="p-4 rounded-2xl bg-white border border-[#EAE3DC] space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#FA661C] text-xs">
                    Selected Action: <span className="uppercase">{CONTROL_ACTION_META[controlAction]?.label || controlAction}</span>
                  </span>
                  <span className="text-[10px] font-mono text-[#6B6058]">
                    POST /api/vendors/{selectedVendor.id}/{CONTROL_ACTION_META[controlAction]?.endpointSuffix}/
                  </span>
                </div>

                {/* Honest Server Confirmation Banner */}
                {controlSuccessMsg && (
                  <div
                    role="status"
                    data-testid="control-success-banner"
                    className="p-3 rounded-xl bg-[#EAF5ED] border border-[#52B788]/40 text-[#40916C] font-semibold flex items-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>{controlSuccessMsg}</span>
                  </div>
                )}

                {/* General / Non-Field Server Error Banner (400 unapproved, 403 staff, 409 conflict) */}
                {controlGeneralError && (
                  <div
                    role="alert"
                    data-testid="control-general-error"
                    className="p-3 rounded-xl bg-[#FDE8EA] border border-[#D7263D]/40 text-[#D7263D] font-semibold flex items-start gap-2"
                  >
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{controlGeneralError}</span>
                  </div>
                )}

                {/* 1. Required Reason Field */}
                <div>
                  <label htmlFor="control-reason-input" className="block text-xs font-bold text-[#1A2420] mb-1">
                    Reason for Control Action <span className="text-[#D7263D]">* (Required)</span>
                  </label>
                  <textarea
                    id="control-reason-input"
                    data-testid="control-reason-input"
                    rows={2}
                    value={controlReason}
                    onChange={(e) => {
                      setControlReason(e.target.value);
                      if (controlFieldErrors.reason) {
                        setControlFieldErrors((prev) => ({ ...prev, reason: undefined }));
                      }
                      if (controlGeneralError) setControlGeneralError(null);
                    }}
                    placeholder="Enter audited reason for this control change..."
                    className={`w-full p-2.5 rounded-xl border text-xs bg-white focus:outline-none ${
                      controlFieldErrors.reason
                        ? 'border-[#D7263D] focus:border-[#D7263D]'
                        : 'border-[#EAE3DC] focus:border-[#FA661C]'
                    }`}
                  />
                  {controlFieldErrors.reason && (
                    <p
                      role="alert"
                      data-testid="control-error-reason"
                      className="mt-1 text-[11px] font-bold text-[#D7263D]"
                    >
                      {controlFieldErrors.reason}
                    </p>
                  )}
                </div>

                {/* 2. Seller-Visible Tick-Box */}
                <div>
                  <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      data-testid="control-seller-visible-checkbox"
                      checked={controlSellerVisible}
                      onChange={(e) => {
                        setControlSellerVisible(e.target.checked);
                        if (controlFieldErrors.seller_visible) {
                          setControlFieldErrors((prev) => ({ ...prev, seller_visible: undefined }));
                        }
                      }}
                      className="w-4 h-4 rounded accent-[#FA661C] cursor-pointer"
                    />
                    <span className="text-xs font-bold text-[#1A2420]">
                      Show reason to the seller (<code>seller_visible</code>)
                    </span>
                  </label>
                  {controlFieldErrors.seller_visible && (
                    <p
                      role="alert"
                      data-testid="control-error-seller_visible"
                      className="mt-1 text-[11px] font-bold text-[#D7263D]"
                    >
                      {controlFieldErrors.seller_visible}
                    </p>
                  )}
                </div>

                {/* 3. Private Staff Note */}
                <div>
                  <label htmlFor="control-private-note-input" className="block text-xs font-bold text-[#1A2420] mb-1">
                    Private Staff Note <span className="text-[10px] font-normal text-[#6B6058]">(Staff only — never shown to the seller)</span>
                  </label>
                  <textarea
                    id="control-private-note-input"
                    data-testid="control-private-note-input"
                    rows={2}
                    value={controlPrivateNote}
                    onChange={(e) => {
                      setControlPrivateNote(e.target.value);
                      if (controlFieldErrors.private_note) {
                        setControlFieldErrors((prev) => ({ ...prev, private_note: undefined }));
                      }
                    }}
                    placeholder="Optional internal audit note visible only to staff..."
                    className={`w-full p-2.5 rounded-xl border text-xs bg-white focus:outline-none ${
                      controlFieldErrors.private_note
                        ? 'border-[#D7263D] focus:border-[#D7263D]'
                        : 'border-[#EAE3DC] focus:border-[#FA661C]'
                    }`}
                  />
                  {controlFieldErrors.private_note && (
                    <p
                      role="alert"
                      data-testid="control-error-private_note"
                      className="mt-1 text-[11px] font-bold text-[#D7263D]"
                    >
                      {controlFieldErrors.private_note}
                    </p>
                  )}
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    type="submit"
                    data-testid="control-submit-btn"
                    disabled={controlSubmitting}
                    className="px-4 py-2 rounded-xl bg-[#FA661C] hover:bg-[#E0530B] text-white font-bold text-xs cursor-pointer disabled:opacity-50 shadow-sm"
                  >
                    {controlSubmitting
                      ? 'Applying Control Change...'
                      : `Apply ${CONTROL_ACTION_META[controlAction]?.label || 'Control Action'}`}
                  </button>
                </div>
              </form>

              {/* ========================================================================= */}
              {/* PAGED VENDOR CONTROL HISTORY TABLE (Staff View with Private Notes)        */}
              {/* ========================================================================= */}
              <div
                data-testid="vendor-control-history-panel"
                className="p-4 rounded-2xl bg-white border border-[#EAE3DC] space-y-3"
              >
                <div className="flex items-center justify-between">
                  <h5 className="font-['Outfit'] font-bold text-sm text-[#FA661C] flex items-center gap-1.5">
                    <History className="w-4 h-4 text-[#FF811A]" />
                    <span>Vendor Control History ({controlHistory.count})</span>
                  </h5>
                  <button
                    type="button"
                    onClick={() => fetchVendorControlHistory(selectedVendor.id, historyPage)}
                    disabled={historyLoading}
                    className="px-2.5 py-1 rounded-lg border border-[#EAE3DC] text-[#FA661C] hover:bg-[#FFF3EC] font-bold text-[10px] inline-flex items-center gap-1 cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3 h-3 ${historyLoading ? 'animate-spin' : ''}`} />
                    <span>Refresh History</span>
                  </button>
                </div>

                {historyError && (
                  <div role="alert" className="p-3 rounded-xl bg-[#FDE8EA] border border-[#D7263D]/30 text-[#D7263D] font-semibold">
                    {historyError}
                  </div>
                )}

                {historyLoading ? (
                  <div className="py-4 text-center text-[#6B6058] animate-pulse">
                    Loading control history...
                  </div>
                ) : controlHistory.results.length === 0 ? (
                  <div className="py-4 text-center text-[#6B6058] bg-[#FFF8F2]/40 rounded-xl border border-dashed border-[#EAE3DC]">
                    No operational control events recorded for this vendor yet.
                  </div>
                ) : (
                  <>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-[11px]">
                        <thead>
                          <tr className="border-b border-[#EAE3DC] text-[10px] uppercase tracking-wider text-[#FA661C] font-extrabold">
                            <th className="p-2">Action</th>
                            <th className="p-2">Actor &amp; Time</th>
                            <th className="p-2">Old → New Values</th>
                            <th className="p-2">Reason &amp; Visibility</th>
                            <th className="p-2">Private Note (Staff Only)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#EAE3DC]/60">
                          {controlHistory.results.map((ev) => {
                            const meta = CONTROL_ACTION_META[ev.action];
                            return (
                              <tr key={ev.id} data-testid={`admin-history-row-${ev.id}`}>
                                <td className="p-2 align-top">
                                  <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                    meta?.badgeCls || 'bg-gray-100 text-gray-800 border-gray-300'
                                  }`}>
                                    {meta?.label || ev.action}
                                  </span>
                                </td>
                                <td className="p-2 align-top font-mono text-[10px] text-[#6B6058] whitespace-nowrap">
                                  <div className="font-bold text-[#1A2420]">Actor #{ev.actor}</div>
                                  <div>{ev.occurred_at ? new Date(ev.occurred_at).toLocaleString() : '—'}</div>
                                </td>
                                <td className="p-2 align-top font-mono text-[10px] text-[#6B6058]">
                                  <div>Old: {formatControlSnapshot(ev.old_values)}</div>
                                  <div className="text-[#1A2420] font-semibold">New: {formatControlSnapshot(ev.new_values)}</div>
                                </td>
                                <td className="p-2 align-top">
                                  <div className="font-semibold text-[#1A2420]">{ev.reason}</div>
                                  <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase border ${
                                    ev.seller_visible
                                      ? 'bg-[#EAF5ED] text-[#40916C] border-[#52B788]/40'
                                      : 'bg-gray-100 text-gray-700 border-gray-300'
                                  }`}>
                                    {ev.seller_visible ? 'Seller Visible: Yes' : 'Seller Visible: No'}
                                  </span>
                                </td>
                                <td className="p-2 align-top text-[#6B6058]">
                                  {ev.private_note ? (
                                    <span className="font-medium text-[#1A2420] bg-[#FFF8F2] px-2 py-1 rounded-lg border border-[#EAE3DC] block">
                                      {ev.private_note}
                                    </span>
                                  ) : (
                                    <span className="italic text-gray-400">None</span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {(controlHistory.previous || controlHistory.next) && (
                      <div className="flex items-center justify-between pt-2 border-t border-[#EAE3DC]">
                        <span className="text-[11px] text-[#6B6058]">
                          Total events: {controlHistory.count} (Page {historyPage})
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            disabled={!controlHistory.previous || historyLoading}
                            onClick={() => fetchVendorControlHistory(selectedVendor.id, historyPage - 1)}
                            className="px-2.5 py-1 rounded-lg border border-[#EAE3DC] bg-white text-[#FA661C] font-bold disabled:opacity-40 cursor-pointer"
                          >
                            Previous
                          </button>
                          <button
                            type="button"
                            disabled={!controlHistory.next || historyLoading}
                            onClick={() => fetchVendorControlHistory(selectedVendor.id, historyPage + 1)}
                            className="px-2.5 py-1 rounded-lg border border-[#EAE3DC] bg-white text-[#FA661C] font-bold disabled:opacity-40 cursor-pointer"
                          >
                            Next
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Document Verification Section */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <h4 className="font-['Outfit'] font-bold text-sm text-[#FA661C] flex items-center space-x-1.5">
                  <FileText className="w-4 h-4 text-[#FF811A]" />
                  <span>Uploaded KYC &amp; Governance Documents</span>
                </h4>
                <span className="text-[11px] text-[#6B6058] font-bold">
                  {(selectedVendor.documents || []).filter(d => d.status === 'verified' && d.file_available).length} of {(selectedVendor.documents || []).length} Verified
                </span>
              </div>

              {(selectedVendor.documents || []).length === 0 ? (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-800 flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
                  <span>No documents uploaded by this merchant yet. Staff approval requires all mandatory documents to be uploaded and verified.</span>
                </div>
              ) : (
                <div className="space-y-2">
                  {selectedVendor.documents.map((doc) => {
                    const isDocLoading = docLoading[doc.id];
                    const isRejecting = rejectingDocId === doc.id;

                    return (
                      <div key={doc.id} className="p-3 bg-white rounded-xl border border-[#EAE3DC] space-y-2 text-xs">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <span className="font-bold uppercase text-[#FA661C] tracking-wide">
                              {doc.document_type}
                            </span>
                            <span className="text-[10px] text-[#6B6058]">
                              (Doc #{doc.id})
                            </span>
                            {doc.file_available && doc.download_url ? (
                              <button
                                type="button"
                                onClick={(event) => {
                                  const tab = window.open('about:blank', '_blank');
                                  if (tab) tab.opener = null;
                                  handleViewDocument(doc, tab);
                                }}
                                className="inline-flex items-center space-x-1 rounded-lg border border-[#EAE3DC] bg-white px-2 py-1 text-[10px] font-bold text-[#FA661C] hover:bg-[#FFF3EC]"
                                aria-label={`View ${doc.document_type} document`}
                              >
                                <Eye className="h-3 w-3" />
                                <span>View Document</span>
                                <Download className="h-3 w-3" />
                              </button>
                            ) : (
                              <span className="text-[10px] font-semibold text-[#D7263D]" title="The stored file path does not resolve to an uploaded file.">
                                File unavailable — ask seller to reupload
                              </span>
                            )}
                          </div>

                          <div className="flex items-center space-x-2">
                            {/* Document Status Pill */}
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              !doc.file_available
                                ? 'bg-[#FDE8EA] text-[#D7263D] border border-[#D7263D]/40'
                                : doc.status === 'verified'
                                ? 'bg-[#EAF5ED] text-[#52B788] border border-[#52B788]/40'
                                : doc.status === 'rejected'
                                ? 'bg-[#FDE8EA] text-[#D7263D] border border-[#D7263D]/40'
                                : 'bg-[#FFF8F2] text-[#FA661C] border border-[#FF811A]/40 animate-pulse'
                            }`}>
                              {!doc.file_available ? 'Missing File' : doc.status}
                            </span>

                            {/* Action Buttons for Document */}
                            {doc.status !== 'verified' && (
                              <button
                                type="button"
                                disabled={isDocLoading}
                                onClick={() => handleDocumentReview(doc.id, 'verified')}
                                className="px-2.5 py-1 rounded-lg bg-[#52B788] text-white font-bold text-[10px] hover:bg-[#40916C] transition-colors cursor-pointer disabled:opacity-50 inline-flex items-center space-x-1"
                              >
                                <Check className="w-3 h-3" />
                                <span>Verify</span>
                              </button>
                            )}

                            {doc.status !== 'rejected' && (
                              <button
                                type="button"
                                disabled={isDocLoading}
                                onClick={() => setRejectingDocId(isRejecting ? null : doc.id)}
                                className="px-2.5 py-1 rounded-lg bg-[#D7263D] text-white font-bold text-[10px] hover:bg-[#B01E30] transition-colors cursor-pointer disabled:opacity-50 inline-flex items-center space-x-1"
                              >
                                <Ban className="w-3 h-3" />
                                <span>Reject Doc</span>
                              </button>
                            )}
                          </div>
                        </div>

                        {doc.rejection_reason && (
                          <div className="text-[11px] text-[#D7263D] bg-[#FDE8EA] p-2 rounded-lg font-medium">
                            Rejection Reason: {doc.rejection_reason}
                          </div>
                        )}

                        {/* Inline Rejection Reason Input when rejecting document */}
                        {isRejecting && (
                          <div className="p-3 bg-[#FFF8F2] rounded-xl border border-[#FF811A]/30 space-y-2 animate-reveal">
                            <label className="block text-[10px] font-bold text-[#FA661C] uppercase">
                              Specify Document Rejection Reason
                            </label>
                            <input
                              type="text"
                              value={docRejectReason[doc.id] || ''}
                              onChange={(e) => setDocRejectReason(prev => ({ ...prev, [doc.id]: e.target.value }))}
                              placeholder="e.g. Image blurry or document expired..."
                              className="w-full px-3 py-1.5 rounded-lg border border-[#EAE3DC] bg-white text-xs text-[#FA661C] focus:outline-none focus:border-[#FA661C]"
                            />
                            <div className="flex justify-end space-x-2">
                              <button
                                type="button"
                                onClick={() => setRejectingDocId(null)}
                                className="px-2.5 py-1 rounded-lg bg-gray-100 text-gray-600 font-bold text-[10px]"
                              >
                                Cancel
                              </button>
                              <button
                                type="button"
                                disabled={isDocLoading || !(docRejectReason[doc.id] || '').trim()}
                                onClick={() => handleDocumentReview(doc.id, 'rejected', docRejectReason[doc.id])}
                                className="px-2.5 py-1 rounded-lg bg-[#D7263D] text-white font-bold text-[10px] disabled:opacity-50"
                              >
                                Confirm Rejection
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Completed onboarding decisions are read-only; document evidence remains inspectable above. */}
            {['approved', 'verified', 'store_published'].includes(selectedVendor.onboarding_status) ? (
              <div role="status" className="pt-4 border-t border-[#EAE3DC] text-sm font-semibold text-[#40916C]">
                This merchant’s onboarding is already approved. Review the uploaded documents above; no further onboarding decision is pending.
              </div>
            ) : (
            <form onSubmit={handleOnboardingSubmit} className="space-y-4 pt-4 border-t border-[#EAE3DC]">
              <h4 className="font-['Outfit'] font-bold text-sm text-[#FA661C] flex items-center space-x-1.5">
                <ShieldAlert className="w-4 h-4 text-[#FF811A]" />
                <span>Issue Staff Onboarding Decision</span>
              </h4>

              {/* Form Error Banner */}
              {formError && (
                <div className="p-3 bg-[#FDE8EA] border border-[#D7263D]/40 rounded-xl text-xs text-[#D7263D] flex items-start space-x-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div className="flex-1 font-semibold">{formError}</div>
                </div>
              )}

              {/* Action Selection Radio Group */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                {[
                  { id: 'approve', label: 'Approve Merchant', color: 'border-[#52B788] bg-[#EAF5ED] text-[#52B788]' },
                  { id: 'under_review', label: 'Under Review', color: 'border-[#FF811A] bg-[#FFF8F2] text-[#FA661C]' },
                  { id: 'resubmit_required', label: 'Request Resubmit', color: 'border-[#FF811A] bg-[#FFF8F2] text-[#FA661C]' },
                  { id: 'reject', label: 'Reject Merchant', color: 'border-[#D7263D] bg-[#FDE8EA] text-[#D7263D]' },
                ].map((item) => {
                  const isSelected = action === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setAction(item.id)}
                      className={`p-2.5 rounded-xl border text-center font-bold transition-all cursor-pointer ${
                        isSelected
                          ? `${item.color} shadow-xs ring-2 ring-offset-1 ring-[#FA661C]`
                          : 'border-[#EAE3DC] bg-white text-[#6B6058] hover:bg-[#FFF8F2]'
                      }`}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </div>

              {/* Decision Reason Textarea (Mandatory for reject & resubmit_required) */}
              <div>
                <label className="block text-xs font-bold text-[#FA661C] mb-1">
                  Decision Reason / Feedback {(action === 'reject' || action === 'resubmit_required') && <span className="text-[#D7263D]">* (Required)</span>}
                </label>
                <textarea
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder={
                    action === 'reject'
                      ? "State exact reasons for rejection (e.g. Fraudulent tax documents, failed verification)..."
                      : action === 'resubmit_required'
                      ? "Specify what documents or details the merchant must update before re-applying..."
                      : "Optional notes regarding staff approval or review status..."
                  }
                  className="w-full p-3 rounded-xl border border-[#EAE3DC] text-xs text-[#FA661C] focus:outline-none focus:border-[#FA661C] bg-white"
                />
              </div>

              {/* Form Buttons */}
              <div className="flex items-center justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={closeReviewModal}
                  className="px-4 py-2 rounded-xl bg-gray-100 text-gray-700 font-bold text-xs hover:bg-gray-200 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || ((action === 'reject' || action === 'resubmit_required') && !reason.trim())}
                  className="px-5 py-2 rounded-xl bg-[#FA661C] text-[#FF811A] font-bold text-xs btn-interactive cursor-pointer disabled:opacity-50 shadow-md"
                >
                  {submitting ? "Submitting Decision..." : "Submit Staff Decision"}
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
