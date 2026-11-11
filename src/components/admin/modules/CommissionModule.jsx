import React, { useState, useEffect, useMemo, useContext, useCallback } from 'react';
import {
  Percent,
  ShieldCheck,
  ShieldAlert,
  RefreshCw,
  Filter,
  Layers,
  DollarSign,
  Calendar,
  AlertCircle,
  Plus,
  X,
  Loader2,
  Lock,
  History,
  Archive,
  CheckCircle2,
  AlertTriangle,
  Info,
} from 'lucide-react';
import { apiRequest } from '../../../utils/api';
import { useToast } from '../../../context/ToastContext';
import AuthContext from '../../../context/AuthContext';

const todayISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const CURRENCY = { IN: '₹', AE: 'AED ', IE: '€' };

const TAX_BASE_LABELS = {
  gross_sale_value: 'Gross sale value (gross_sale_value)',
  net_taxable_supply: 'Net taxable supply (net_taxable_supply)',
};

const EMPTY_FEE_FORM = {
  scope: 'global',
  vendor: '',
  country: 'IN',
  rate_type: 'percentage',
  rate_value: '',
  effective_from: '',
  effective_to: '',
  reason: '',
};

const EMPTY_WITHHOLDING_FORM = {
  withholding_type: 'tds',
  country: 'IN',
  rate: '',
  tax_base: 'gross_sale_value',
  effective_from: '',
  effective_to: '',
  reason: '',
  confirm_statutory_change: false,
};

export function parseServerErrors(err) {
  const fieldErrors = {};
  let generalError = null;
  const d = err?.data;

  const toText = (val) => {
    if (Array.isArray(val)) return val.map((v) => (typeof v === 'string' ? v : JSON.stringify(v))).join(' ');
    if (typeof val === 'string') return val;
    if (val && typeof val === 'object') return Object.values(val).flat().join(' ');
    return String(val ?? '');
  };

  if (!d) {
    generalError = err?.message || 'Request failed.';
    return { fieldErrors, generalError };
  }
  if (typeof d === 'string') {
    if (/overlap|effective date/i.test(d)) {
      fieldErrors.effective_from = d;
    } else {
      generalError = d;
    }
    return { fieldErrors, generalError };
  }
  if (Array.isArray(d)) {
    const msg = toText(d);
    if (/overlap|effective date/i.test(msg)) {
      fieldErrors.effective_from = msg;
    } else {
      generalError = msg;
    }
    return { fieldErrors, generalError };
  }
  if (typeof d === 'object') {
    for (const [key, val] of Object.entries(d)) {
      const msg = toText(val);
      if (!msg) continue;
      if (key === 'detail' || key === 'message') {
        generalError = msg;
      } else if (key === 'non_field_errors' || key === '__all__') {
        if (/overlap|effective date/i.test(msg) && !fieldErrors.effective_from) {
          fieldErrors.effective_from = msg;
        } else {
          generalError = generalError ? `${generalError} ${msg}` : msg;
        }
      } else {
        fieldErrors[key] = msg;
      }
    }
  }
  if (!generalError && Object.keys(fieldErrors).length === 0) {
    generalError = err?.message || 'Request failed.';
  }
  return { fieldErrors, generalError };
}

function formatSnapshotSummary(snap) {
  if (!snap || typeof snap !== 'object' || Object.keys(snap).length === 0) {
    return '— (none)';
  }
  const parts = [];
  if (snap.scope) parts.push(`scope: ${snap.scope}`);
  if (snap.withholding_type) parts.push(`type: ${snap.withholding_type.toUpperCase()}`);
  if (snap.vendor) parts.push(`vendor: #${snap.vendor}`);
  if (snap.country) parts.push(`country: ${snap.country}`);
  if (snap.rate_value !== undefined && snap.rate_value !== null) {
    parts.push(`rate: ${snap.rate_type === 'flat' ? `${CURRENCY[snap.country] || ''}${snap.rate_value}` : `${snap.rate_value}%`}`);
  }
  if (snap.rate !== undefined && snap.rate !== null) {
    const pct = (Number(snap.rate) * 100).toFixed(2);
    parts.push(`rate: ${pct}% (${snap.rate})`);
  }
  if (snap.tax_base) parts.push(`base: ${snap.tax_base}`);
  if (snap.effective_from) parts.push(`from: ${snap.effective_from}`);
  parts.push(`to: ${snap.effective_to || 'open'}`);
  if (snap.is_verified !== undefined) parts.push(snap.is_verified ? 'verified' : 'unverified');
  return parts.join(' · ');
}

export default function CommissionModule() {
  const toast = useToast();
  const auth = useContext(AuthContext);

  // Fallback /me profile if rendered outside AuthProvider or before context resolves
  const [meProfile, setMeProfile] = useState(null);
  useEffect(() => {
    if (!auth?.currentUser) {
      apiRequest('/api/accounts/me/')
        .then((u) => setMeProfile(u))
        .catch(() => {});
    }
  }, [auth?.currentUser]);

  const effectiveUser = auth?.currentUser || meProfile;
  const isSuperuser = Boolean(effectiveUser?.is_superuser);
  const isStaff = Boolean(effectiveUser?.is_staff);

  // Active tab: 'commission' | 'platform_fee' | 'tds' | 'tcs'
  const [activeTab, setActiveTab] = useState('commission');
  const isWithholdingTab = activeTab === 'tds' || activeTab === 'tcs';

  // Server-backed list filters
  const [scopeFilter, setScopeFilter] = useState('all'); // 'all' | 'global' | 'vendor'
  const [countryFilter, setCountryFilter] = useState('all'); // 'all' | 'IN' | 'AE' | 'IE'
  const [activeOnFilter, setActiveOnFilter] = useState(''); // '' or YYYY-MM-DD

  // Rule lists state
  const [commissionRules, setCommissionRules] = useState([]);
  const [platformRules, setPlatformRules] = useState([]);
  const [withholdingRules, setWithholdingRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [errorStatus, setErrorStatus] = useState(null);

  // Audit history state
  const [auditLogs, setAuditLogs] = useState([]);
  const [auditLoading, setAuditLoading] = useState(true);
  const [auditError, setAuditError] = useState(null);
  const [auditKindFilter, setAuditKindFilter] = useState(''); // '' | 'commission' | 'platform_fee' | 'withholding'
  const [auditRuleIdFilter, setAuditRuleIdFilter] = useState('');

  // Vendors lookup for vendor-scoped rules
  const [vendors, setVendors] = useState([]);
  useEffect(() => {
    apiRequest('/api/vendors/admin/')
      .then((d) => setVendors(Array.isArray(d) ? d : d?.results || []))
      .catch(() => setVendors([]));
  }, []);

  const vendorName = useMemo(
    () =>
      Object.fromEntries(
        vendors.map((v) => [v.id, v.store_name || v.business_name || `Vendor #${v.id}`])
      ),
    [vendors]
  );

  const fetchRules = useCallback(async () => {
    setLoading(true);
    setError(null);
    setErrorStatus(null);
    try {
      const feeParams = new URLSearchParams();
      if (scopeFilter !== 'all') feeParams.set('scope', scopeFilter);
      if (countryFilter !== 'all') feeParams.set('country', countryFilter);
      if (activeOnFilter) feeParams.set('active_on', activeOnFilter);
      const feeQuery = feeParams.toString() ? `?${feeParams.toString()}` : '';

      const whParams = new URLSearchParams();
      if (countryFilter !== 'all') whParams.set('country', countryFilter);
      if (activeOnFilter) whParams.set('active_on', activeOnFilter);
      const whQuery = whParams.toString() ? `?${whParams.toString()}` : '';

      const [commData, platData, whData] = await Promise.all([
        apiRequest(`/api/settlements/admin/commission-rules/${feeQuery}`),
        apiRequest(`/api/settlements/admin/platform-fee-rules/${feeQuery}`),
        apiRequest(`/api/settlements/admin/withholding-rules/${whQuery}`),
      ]);
      setCommissionRules(Array.isArray(commData) ? commData : []);
      setPlatformRules(Array.isArray(platData) ? platData : []);
      setWithholdingRules(Array.isArray(whData) ? whData : []);
    } catch (err) {
      setCommissionRules([]);
      setPlatformRules([]);
      setWithholdingRules([]);
      setErrorStatus(err?.status || null);
      const { generalError, fieldErrors } = parseServerErrors(err);
      const firstFieldErr = Object.values(fieldErrors)[0];
      setError(generalError || firstFieldErr || err?.message || 'Failed to load settlement rules.');
    } finally {
      setLoading(false);
    }
  }, [scopeFilter, countryFilter, activeOnFilter]);

  const fetchAuditLogs = useCallback(async (overrideKind, overrideRuleId) => {
    setAuditLoading(true);
    setAuditError(null);
    try {
      const kindVal = overrideKind !== undefined ? overrideKind : auditKindFilter;
      const idVal = overrideRuleId !== undefined ? overrideRuleId : auditRuleIdFilter;
      const params = new URLSearchParams();
      if (kindVal) params.set('rule_kind', kindVal);
      if (String(idVal).trim()) params.set('rule_id', String(idVal).trim());
      const qs = params.toString() ? `?${params.toString()}` : '';
      const data = await apiRequest(`/api/settlements/admin/rule-audit/${qs}`);
      setAuditLogs(Array.isArray(data) ? data : []);
    } catch (err) {
      setAuditLogs([]);
      const { generalError, fieldErrors } = parseServerErrors(err);
      setAuditError(generalError || Object.values(fieldErrors)[0] || err?.message || 'Failed to load rule audit history.');
    } finally {
      setAuditLoading(false);
    }
  }, [auditKindFilter, auditRuleIdFilter]);

  useEffect(() => {
    fetchRules();
  }, [fetchRules]);

  useEffect(() => {
    fetchAuditLogs();
  }, [fetchAuditLogs]);

  // Derived lists for the 4 tabs
  const tdsRules = useMemo(
    () => withholdingRules.filter((r) => r.withholding_type === 'tds'),
    [withholdingRules]
  );
  const tcsRules = useMemo(
    () => withholdingRules.filter((r) => r.withholding_type === 'tcs'),
    [withholdingRules]
  );

  const currentRules = useMemo(() => {
    if (activeTab === 'commission') return commissionRules;
    if (activeTab === 'platform_fee') return platformRules;
    if (activeTab === 'tds') return tdsRules;
    if (activeTab === 'tcs') return tcsRules;
    return [];
  }, [activeTab, commissionRules, platformRules, tdsRules, tcsRules]);

  const ruleStatus = (rule) => {
    const t = todayISO();
    if (rule.effective_to) {
      return {
        key: 'retired',
        label: 'Retired',
        cls: 'text-[#6B6058] bg-[#F4F1EE] border-[#EAE3DC]',
      };
    }
    if (rule.effective_from > t) {
      return {
        key: 'scheduled',
        label: 'Scheduled',
        cls: 'text-[#1E64D4] bg-[#EBF3FF] border-[#1E64D4]/30',
      };
    }
    return {
      key: 'active',
      label: 'Active',
      cls: 'text-emerald-700 bg-emerald-50 border-emerald-200',
    };
  };

  // Create New Version modal state
  const [formOpen, setFormOpen] = useState(false);
  const [feeForm, setFeeForm] = useState(EMPTY_FEE_FORM);
  const [whForm, setWhForm] = useState(EMPTY_WITHHOLDING_FORM);
  const [fieldErrors, setFieldErrors] = useState({});
  const [generalFormError, setGeneralFormError] = useState(null);
  const [saving, setSaving] = useState(false);

  // Retire confirm dialog state
  const [retireTarget, setRetireTarget] = useState(null); // { rule, tab }
  const [retireForm, setRetireForm] = useState({
    effective_to: '',
    reason: '',
    confirm_statutory_change: false,
  });
  const [retireFieldErrors, setRetireFieldErrors] = useState({});
  const [retireGeneralError, setRetireGeneralError] = useState(null);
  const [retiring, setRetiring] = useState(false);

  const tabMeta = {
    commission: {
      label: 'Commission',
      singular: 'Commission Rule',
      endpoint: '/api/settlements/admin/commission-rules/',
      auditKind: 'commission',
    },
    platform_fee: {
      label: 'Platform Fee',
      singular: 'Platform Fee Rule',
      endpoint: '/api/settlements/admin/platform-fee-rules/',
      auditKind: 'platform_fee',
    },
    tds: {
      label: 'TDS',
      singular: 'TDS Withholding Rule',
      endpoint: '/api/settlements/admin/withholding-rules/',
      auditKind: 'withholding',
    },
    tcs: {
      label: 'TCS',
      singular: 'TCS Withholding Rule',
      endpoint: '/api/settlements/admin/withholding-rules/',
      auditKind: 'withholding',
    },
  }[activeTab];

  const openCreateModal = () => {
    setFieldErrors({});
    setGeneralFormError(null);
    const defaultCountry = countryFilter !== 'all' ? countryFilter : 'IN';
    if (isWithholdingTab) {
      setWhForm({
        ...EMPTY_WITHHOLDING_FORM,
        withholding_type: activeTab, // 'tds' or 'tcs'
        country: defaultCountry,
        tax_base: activeTab === 'tcs' ? 'net_taxable_supply' : 'gross_sale_value',
        effective_from: todayISO(),
      });
    } else {
      setFeeForm({
        ...EMPTY_FEE_FORM,
        scope: scopeFilter !== 'all' ? scopeFilter : 'global',
        country: defaultCountry,
        effective_from: todayISO(),
      });
    }
    setFormOpen(true);
  };

  const updateFeeField = (key, value) => {
    setFeeForm((prev) => ({ ...prev, [key]: value }));
    setFieldErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const updateWhField = (key, value) => {
    setWhForm((prev) => ({ ...prev, [key]: value }));
    setFieldErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const submitCreateForm = async (e) => {
    e.preventDefault();
    setFieldErrors({});
    setGeneralFormError(null);
    setSaving(true);

    try {
      let payload;
      if (isWithholdingTab) {
        payload = {
          withholding_type: whForm.withholding_type,
          country: whForm.country,
          rate: whForm.rate,
          tax_base: whForm.tax_base,
          effective_from: whForm.effective_from,
          effective_to: whForm.effective_to === '' ? null : whForm.effective_to,
          confirm_statutory_change: Boolean(whForm.confirm_statutory_change),
        };
        if (whForm.reason !== '') {
          payload.reason = whForm.reason;
        }
      } else {
        payload = {
          scope: feeForm.scope,
          category: null,
          vendor: feeForm.scope === 'vendor' && feeForm.vendor !== '' ? Number(feeForm.vendor) : null,
          country: feeForm.country,
          rate_type: feeForm.rate_type,
          rate_value: feeForm.rate_value,
          effective_from: feeForm.effective_from,
          effective_to: feeForm.effective_to === '' ? null : feeForm.effective_to,
        };
        if (feeForm.reason !== '') {
          payload.reason = feeForm.reason;
        }
      }

      const created = await apiRequest(tabMeta.endpoint, {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      toast.success(
        `${tabMeta.singular} Created`,
        `Rule #${created?.id ?? ''} saved and audit log recorded.`
      );
      setFormOpen(false);
      await Promise.all([fetchRules(), fetchAuditLogs()]);
    } catch (err) {
      const { fieldErrors: fErrs, generalError: gErr } = parseServerErrors(err);
      setFieldErrors(fErrs);
      setGeneralFormError(gErr);
    } finally {
      setSaving(false);
    }
  };

  const openRetireDialog = (rule) => {
    const t = todayISO();
    const defaultEnd = rule.effective_from && rule.effective_from > t ? rule.effective_from : t;
    setRetireTarget({ rule, tab: activeTab });
    setRetireForm({
      effective_to: defaultEnd,
      reason: '',
      confirm_statutory_change: false,
    });
    setRetireFieldErrors({});
    setRetireGeneralError(null);
  };

  const updateRetireField = (key, value) => {
    setRetireForm((prev) => ({ ...prev, [key]: value }));
    setRetireFieldErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const submitRetire = async (e) => {
    e.preventDefault();
    if (!retireTarget) return;
    setRetireFieldErrors({});
    setRetireGeneralError(null);
    setRetiring(true);

    const { rule, tab } = retireTarget;
    const isWh = tab === 'tds' || tab === 'tcs';
    const baseEndpoint =
      tab === 'commission'
        ? '/api/settlements/admin/commission-rules/'
        : tab === 'platform_fee'
        ? '/api/settlements/admin/platform-fee-rules/'
        : '/api/settlements/admin/withholding-rules/';

    try {
      const payload = {
        effective_to: retireForm.effective_to,
      };
      if (retireForm.reason !== '') {
        payload.reason = retireForm.reason;
      }
      if (isWh) {
        payload.confirm_statutory_change = Boolean(retireForm.confirm_statutory_change);
      }

      await apiRequest(`${baseEndpoint}${rule.id}/retire/`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      toast.success(
        'Rule Retired',
        `Rule #${rule.id} retired as of ${retireForm.effective_to}.`
      );
      setRetireTarget(null);
      await Promise.all([fetchRules(), fetchAuditLogs()]);
    } catch (err) {
      const { fieldErrors: fErrs, generalError: gErr } = parseServerErrors(err);
      setRetireFieldErrors(fErrs);
      setRetireGeneralError(gErr);
    } finally {
      setRetiring(false);
    }
  };

  const handleFilterAuditByRule = (rule) => {
    const kind = tabMeta.auditKind;
    setAuditKindFilter(kind);
    setAuditRuleIdFilter(String(rule.id));
    fetchAuditLogs(kind, String(rule.id));
  };

  const handleClearAuditFilters = () => {
    setAuditKindFilter('');
    setAuditRuleIdFilter('');
    fetchAuditLogs('', '');
  };

  const formatFeeRate = (type, val, country) => {
    if (val === null || val === undefined || val === '') return '—';
    if (type === 'percentage') return `${val}%`;
    return `${CURRENCY[country] || ''}${val}`;
  };

  const formatWithholdingRate = (fractionStr) => {
    if (fractionStr === null || fractionStr === undefined || fractionStr === '') return '—';
    const num = Number(fractionStr);
    if (Number.isNaN(num)) return String(fractionStr);
    return `${(num * 100).toFixed(2)}%`;
  };

  const addBtnDisabled = isWithholdingTab && !isSuperuser;

  return (
    <div className="space-y-6">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#EAE3DC]">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-1.5 rounded-xl bg-[#FFF3EC] text-[#FA661C]">
              <Percent className="w-5 h-5" />
            </span>
            <h2 className="font-['Outfit'] font-black text-xl text-[#FA661C]">
              Commission, Platform Fee &amp; Withholding Tax Rules
            </h2>
          </div>
          <p className="text-xs text-[#6B6058] mt-0.5">
            Versioned settlement deduction rules and append-only audit trail (`/api/settlements/admin/`)
          </p>
        </div>

        <div className="flex items-center space-x-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => {
              fetchRules();
              fetchAuditLogs();
            }}
            disabled={loading}
            className="px-4 py-2 bg-white border border-[#EAE3DC] hover:border-[#FA661C] text-[#FA661C] rounded-xl text-xs font-bold btn-interactive flex items-center space-x-1.5 cursor-pointer shadow-xs disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Sync Rules</span>
          </button>

          <button
            type="button"
            id="commission-add-rule"
            data-testid="open-create-rule-btn"
            onClick={openCreateModal}
            disabled={addBtnDisabled}
            title={
              addBtnDisabled
                ? 'Only a superuser may change statutory withholding rules.'
                : `Create a new ${tabMeta.singular} version`
            }
            className="px-4 py-2 bg-gradient-to-r from-[#FA661C] to-[#FF811A] hover:shadow-lg hover:shadow-[#FA661C]/30 text-white rounded-xl text-xs font-black btn-interactive flex items-center space-x-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="w-4 h-4" />
            <span>New {tabMeta.singular} Version</span>
          </button>
        </div>
      </div>

      {/* 2. Versioned Rule Policy Notice */}
      <div className="p-3.5 rounded-2xl bg-[#FFF8F2] border border-[#EAE3DC] flex items-start gap-2.5 text-xs text-[#6B6058]">
        <Info className="w-4 h-4 text-[#FA661C] shrink-0 mt-0.5" />
        <div>
          <strong className="text-[#1A2420]">Versioned Rate Policy:</strong> Existing rules are never edited or deleted in place. To change a rate, create a new version starting on an effective date (which automatically closes out the prior open-ended rule), or retire an open rule with an end date and reason.
        </div>
      </div>

      {/* 3. Four Rule Tabs */}
      <div className="bg-[#FFF3EC] p-1.5 rounded-2xl border border-[#EAE3DC] grid grid-cols-2 sm:grid-cols-4 gap-1.5">
        <button
          type="button"
          data-testid="tab-commission"
          onClick={() => setActiveTab('commission')}
          className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center space-x-1.5 ${
            activeTab === 'commission'
              ? 'bg-[#FA661C] text-white shadow-2xs'
              : 'text-[#6B6058] hover:text-[#FA661C]'
          }`}
        >
          <Percent className="w-3.5 h-3.5" />
          <span>Commission ({commissionRules.length})</span>
        </button>

        <button
          type="button"
          data-testid="tab-platform_fee"
          onClick={() => setActiveTab('platform_fee')}
          className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center space-x-1.5 ${
            activeTab === 'platform_fee'
              ? 'bg-[#FA661C] text-white shadow-2xs'
              : 'text-[#6B6058] hover:text-[#FA661C]'
          }`}
        >
          <DollarSign className="w-3.5 h-3.5" />
          <span>Platform Fee ({platformRules.length})</span>
        </button>

        <button
          type="button"
          data-testid="tab-tds"
          onClick={() => setActiveTab('tds')}
          className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center space-x-1.5 ${
            activeTab === 'tds'
              ? 'bg-[#FA661C] text-white shadow-2xs'
              : 'text-[#6B6058] hover:text-[#FA661C]'
          }`}
        >
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>TDS ({tdsRules.length})</span>
          <span className="text-[9px] uppercase px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-900 font-black">
            High Risk
          </span>
        </button>

        <button
          type="button"
          data-testid="tab-tcs"
          onClick={() => setActiveTab('tcs')}
          className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center space-x-1.5 ${
            activeTab === 'tcs'
              ? 'bg-[#FA661C] text-white shadow-2xs'
              : 'text-[#6B6058] hover:text-[#FA661C]'
          }`}
        >
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>TCS ({tcsRules.length})</span>
          <span className="text-[9px] uppercase px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-900 font-black">
            High Risk
          </span>
        </button>
      </div>

      {/* 4. High-Risk Statutory Withholding Banner on TDS / TCS tabs */}
      {isWithholdingTab && (
        <div
          data-testid="withholding-risk-banner"
          className="p-4 rounded-2xl bg-amber-50 border border-amber-300 text-amber-950 space-y-1.5 text-xs"
        >
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2 font-black text-sm text-amber-900">
              <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
              <span>
                High-Risk Statutory Withholding ({activeTab.toUpperCase()})
              </span>
            </div>
            <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-amber-200/80 text-amber-900">
              {isSuperuser ? 'Superuser Access Enabled' : 'Staff Read-Only View'}
            </span>
          </div>
          <p className="text-amber-900/90">
            Statutory {activeTab.toUpperCase()} rules directly control tax withholding on vendor settlements. New withholding rules start <strong>unverified</strong> and require explicit statutory change confirmation (<code>confirm_statutory_change: true</code>).
          </p>
          {!isSuperuser && (
            <p
              data-testid="staff-readonly-withholding-msg"
              className="font-bold text-red-700 bg-white/80 border border-red-200 rounded-xl px-3 py-2 flex items-center gap-1.5"
            >
              <Lock className="w-3.5 h-3.5 shrink-0" />
              <span>
                Only a superuser may change statutory withholding rules. Your staff account ({effectiveUser?.username || 'staff'}) has read-only access to TDS and TCS rules.
              </span>
            </p>
          )}
        </div>
      )}

      {/* 5. Filters Toolbar */}
      <div className="bg-white rounded-2xl border border-[#EAE3DC] p-4 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-bold text-[#6B6058] flex items-center space-x-1">
            <Filter className="w-3.5 h-3.5 text-[#FA661C]" />
            <span>Scope:</span>
          </span>
          {isWithholdingTab ? (
            <span className="px-2.5 py-1 rounded-lg bg-[#F4F1EE] text-[#6B6058] font-bold">
              Statutory (Country-wide)
            </span>
          ) : (
            ['all', 'global', 'vendor'].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setScopeFilter(s)}
                className={`px-2.5 py-1 rounded-lg font-bold capitalize transition-all cursor-pointer ${
                  scopeFilter === s
                    ? 'bg-[#FA661C] text-white'
                    : 'bg-[#FFF3EC] text-[#6B6058] hover:text-[#FA661C]'
                }`}
              >
                {s}
              </button>
            ))
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center space-x-1.5">
            <span className="font-bold text-[#6B6058]">Country:</span>
            <select
              aria-label="Filter by Country"
              value={countryFilter}
              onChange={(e) => setCountryFilter(e.target.value)}
              className="px-2.5 py-1 rounded-lg bg-[#FFF3EC] border border-[#EAE3DC] text-[#FA661C] font-bold focus:outline-none focus:border-[#FA661C]"
            >
              <option value="all">All Countries</option>
              <option value="IN">India (IN)</option>
              <option value="AE">UAE (AE)</option>
              <option value="IE">Ireland (IE)</option>
            </select>
          </label>

          <label className="flex items-center space-x-1.5">
            <span className="font-bold text-[#6B6058]">Active On:</span>
            <input
              type="date"
              aria-label="Filter Active On Date"
              value={activeOnFilter}
              onChange={(e) => setActiveOnFilter(e.target.value)}
              className="px-2.5 py-1 rounded-lg bg-[#FFF3EC] border border-[#EAE3DC] text-[#FA661C] font-bold focus:outline-none focus:border-[#FA661C]"
            />
            {activeOnFilter && (
              <button
                type="button"
                onClick={() => setActiveOnFilter('')}
                className="text-[11px] font-bold text-[#6B6058] hover:text-[#FA661C] underline cursor-pointer"
              >
                Clear
              </button>
            )}
          </label>
        </div>
      </div>

      {/* 6. Rules Table */}
      <div className="bg-white rounded-2xl border border-[#EAE3DC] overflow-hidden shadow-xs">
        {loading ? (
          <div className="p-12 text-center space-y-3">
            <RefreshCw className="w-6 h-6 text-[#FA661C] animate-spin mx-auto" />
            <p className="text-xs text-[#6B6058] font-medium">Loading settlement rules from server...</p>
          </div>
        ) : error ? (
          <div
            role="alert"
            data-testid="rules-error-state"
            className="p-8 text-center space-y-3 text-red-700 bg-red-50"
          >
            <AlertCircle className="w-7 h-7 mx-auto text-red-600" />
            <div className="space-y-1">
              <p className="text-sm font-extrabold">
                {errorStatus === 401 || errorStatus === 403
                  ? 'Access Denied'
                  : 'Unable to Load Rules'}
              </p>
              <p className="text-xs font-bold">{error}</p>
            </div>
            <button
              type="button"
              onClick={fetchRules}
              className="px-4 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold cursor-pointer"
            >
              Retry
            </button>
          </div>
        ) : currentRules.length === 0 ? (
          <div data-testid="rules-empty-state" className="p-12 text-center space-y-2">
            <p className="text-sm font-bold text-[#FA661C]">
              No {tabMeta.label} rules match the current filters.
            </p>
            <p className="text-xs text-[#6B6058]">
              Try clearing the scope, country, or active-on date filter, or create a new rule version.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse" data-testid="rules-table">
              <thead>
                <tr className="bg-[#FFF3EC] text-[#FA661C] border-b border-[#EAE3DC] font-extrabold uppercase text-[10px] tracking-wider">
                  <th className="p-3">Rule ID</th>
                  <th className="p-3">Scope</th>
                  <th className="p-3">Vendor</th>
                  <th className="p-3">Country</th>
                  <th className="p-3 text-right">Rate</th>
                  <th className="p-3">Tax Base</th>
                  <th className="p-3">Effective Dates</th>
                  <th className="p-3 text-center">Status</th>
                  {isWithholdingTab && <th className="p-3">Verified &amp; Reference</th>}
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EAE3DC]/60 font-medium">
                {currentRules.map((rule) => {
                  const statusObj = ruleStatus(rule);
                  const isRetired = statusObj.key === 'retired';
                  const retireDisabled = isWithholdingTab && !isSuperuser;

                  return (
                    <tr
                      key={rule.id}
                      data-testid={`rule-row-${rule.id}`}
                      className="hover:bg-[#FFF8F2]/50 transition-colors"
                    >
                      <td className="p-3 font-mono font-bold text-[#FA661C]">
                        #{rule.id}
                      </td>
                      <td className="p-3">
                        <span className="bg-[#FFF3EC] text-[#FA661C] border border-[#FF811A]/40 px-2 py-0.5 rounded-full font-bold uppercase text-[10px]">
                          {isWithholdingTab ? `statutory (${rule.withholding_type})` : rule.scope}
                        </span>
                      </td>
                      <td className="p-3 text-[#6B6058]">
                        {!isWithholdingTab && rule.vendor ? (
                          <span className="font-semibold text-[#1A2420]">
                            {vendorName[rule.vendor] || `Vendor #${rule.vendor}`} (#{rule.vendor})
                          </span>
                        ) : (
                          'All Vendors'
                        )}
                      </td>
                      <td className="p-3 font-bold text-[#1A2420]">
                        {rule.country}
                      </td>
                      <td className="p-3 text-right font-mono font-black text-sm text-[#FA661C]">
                        {isWithholdingTab ? (
                          <div>
                            <span>{formatWithholdingRate(rule.rate)}</span>
                            <span className="block text-[10px] text-[#6B6058] font-normal">
                              fraction: {rule.rate}
                            </span>
                          </div>
                        ) : (
                          <div>
                            <span>{formatFeeRate(rule.rate_type, rule.rate_value, rule.country)}</span>
                            <span className="block text-[9px] text-[#6B6058] font-normal capitalize">
                              {rule.rate_type}
                            </span>
                          </div>
                        )}
                      </td>
                      <td className="p-3 text-[#6B6058]">
                        {isWithholdingTab
                          ? TAX_BASE_LABELS[rule.tax_base] || rule.tax_base
                          : 'Order subtotal (subtotal)'}
                      </td>
                      <td className="p-3 text-[#6B6058] text-[11px]">
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-3 h-3 text-[#FA661C]" />
                          <span>
                            {rule.effective_from} → {rule.effective_to || 'Open-ended'}
                          </span>
                        </div>
                      </td>
                      <td className="p-3 text-center">
                        <span
                          data-testid={`rule-status-${rule.id}`}
                          className={`text-[10px] font-bold border px-2 py-0.5 rounded-full ${statusObj.cls}`}
                        >
                          {statusObj.label}
                        </span>
                      </td>
                      {isWithholdingTab && (
                        <td className="p-3 text-xs">
                          {rule.is_verified ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                              <CheckCircle2 className="w-3 h-3" /> Verified
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                              <AlertTriangle className="w-3 h-3" /> Unverified
                            </span>
                          )}
                          <span className="block text-[10px] text-[#6B6058] mt-0.5">
                            {rule.verified_reference || 'No reference'}
                          </span>
                        </td>
                      )}
                      <td className="p-3 text-right">
                        <div className="flex justify-end items-center gap-1.5">
                          <button
                            type="button"
                            data-testid={`filter-audit-rule-${rule.id}`}
                            onClick={() => handleFilterAuditByRule(rule)}
                            title={`Filter audit history for rule #${rule.id}`}
                            className="px-2 py-1 rounded-lg bg-[#FFF3EC] hover:bg-[#FA661C] text-[#FA661C] hover:text-white border border-[#FF811A]/30 text-[10px] font-bold transition-colors cursor-pointer"
                          >
                            Audit
                          </button>
                          {isRetired ? (
                            <span className="inline-flex items-center gap-1 text-[10px] text-[#6B6058] px-2 py-1">
                              <Lock className="w-3 h-3" /> Retired
                            </span>
                          ) : (
                            <button
                              type="button"
                              data-testid={`retire-rule-${rule.id}`}
                              onClick={() => openRetireDialog(rule)}
                              disabled={retireDisabled}
                              title={
                                retireDisabled
                                  ? 'Only a superuser may retire statutory withholding rules.'
                                  : `Retire rule #${rule.id}`
                              }
                              className="px-2.5 py-1 rounded-lg bg-red-50 hover:bg-red-600 text-red-700 hover:text-white border border-red-200 text-[10px] font-bold transition-colors cursor-pointer inline-flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <Archive className="w-3 h-3" />
                              <span>Retire</span>
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

      {/* 7. Audit History Panel */}
      <div
        id="rule-audit-panel"
        data-testid="rule-audit-panel"
        className="bg-white rounded-2xl border border-[#EAE3DC] overflow-hidden shadow-xs space-y-0"
      >
        <div className="p-4 border-b border-[#EAE3DC] bg-[#FFF3EC] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-[#FA661C]" />
            <div>
              <h3 className="font-['Outfit'] font-black text-sm text-[#FA661C]">
                Rule Change Audit History ({auditLogs.length})
              </h3>
              <p className="text-[10px] text-[#6B6058]">
                Append-only log from <code>/api/settlements/admin/rule-audit/</code> (newest first)
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <label className="flex items-center gap-1">
              <span className="font-bold text-[#6B6058]">Rule Kind:</span>
              <select
                aria-label="Audit Rule Kind Filter"
                data-testid="audit-kind-filter"
                value={auditKindFilter}
                onChange={(e) => setAuditKindFilter(e.target.value)}
                className="px-2.5 py-1 rounded-lg bg-white border border-[#EAE3DC] text-[#FA661C] font-bold focus:outline-none focus:border-[#FA661C]"
              >
                <option value="">All Kinds</option>
                <option value="commission">Commission</option>
                <option value="platform_fee">Platform Fee</option>
                <option value="withholding">Withholding</option>
              </select>
            </label>

            <label className="flex items-center gap-1">
              <span className="font-bold text-[#6B6058]">Rule ID:</span>
              <input
                type="number"
                min="1"
                placeholder="All"
                aria-label="Audit Rule ID Filter"
                data-testid="audit-rule-id-filter"
                value={auditRuleIdFilter}
                onChange={(e) => setAuditRuleIdFilter(e.target.value)}
                className="w-20 px-2.5 py-1 rounded-lg bg-white border border-[#EAE3DC] text-[#1A2420] font-mono font-bold focus:outline-none focus:border-[#FA661C]"
              />
            </label>

            {(auditKindFilter || auditRuleIdFilter) && (
              <button
                type="button"
                data-testid="clear-audit-filter-btn"
                onClick={handleClearAuditFilters}
                className="px-2.5 py-1 rounded-lg bg-white border border-[#EAE3DC] text-[#6B6058] hover:text-[#FA661C] font-bold cursor-pointer"
              >
                Clear Filter
              </button>
            )}
          </div>
        </div>

        {auditLoading ? (
          <div className="p-8 text-center text-xs text-[#6B6058]">
            Loading rule audit log...
          </div>
        ) : auditError ? (
          <div role="alert" className="p-6 text-center text-xs font-bold text-red-700 bg-red-50">
            {auditError}
          </div>
        ) : auditLogs.length === 0 ? (
          <div className="p-8 text-center text-xs text-[#6B6058]">
            No audit events found for the selected filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse" data-testid="audit-table">
              <thead>
                <tr className="bg-white text-[#6B6058] border-b border-[#EAE3DC] font-extrabold uppercase text-[10px] tracking-wider">
                  <th className="p-3">Audit ID</th>
                  <th className="p-3">Rule</th>
                  <th className="p-3">Action</th>
                  <th className="p-3">Actor</th>
                  <th className="p-3">Timestamp</th>
                  <th className="p-3">Reason</th>
                  <th className="p-3">Old Value → New Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EAE3DC]/60">
                {auditLogs.map((entry) => (
                  <tr
                    key={entry.id}
                    data-testid={`audit-row-${entry.id}`}
                    className="hover:bg-[#FFF8F2]/40 transition-colors align-top"
                  >
                    <td className="p-3 font-mono font-bold text-[#FA661C]">
                      #{entry.id}
                    </td>
                    <td className="p-3 font-mono font-bold text-[#1A2420]">
                      <span className="uppercase text-[10px] px-1.5 py-0.5 rounded bg-[#FFF3EC] text-[#FA661C] mr-1">
                        {entry.rule_kind}
                      </span>
                      #{entry.rule_id}
                    </td>
                    <td className="p-3">
                      <span
                        className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${
                          entry.action === 'create'
                            ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                            : 'text-amber-800 bg-amber-50 border-amber-200'
                        }`}
                      >
                        {entry.action}
                      </span>
                    </td>
                    <td className="p-3 font-bold text-[#1A2420]">
                      {entry.actor_username || `User #${entry.actor}`}
                    </td>
                    <td className="p-3 font-mono text-[11px] text-[#6B6058] whitespace-nowrap">
                      {entry.occurred_at ? new Date(entry.occurred_at).toLocaleString() : '—'}
                    </td>
                    <td className="p-3 text-[#1A2420] max-w-xs">
                      {entry.reason}
                    </td>
                    <td className="p-3 font-mono text-[11px] text-[#6B6058] space-y-1">
                      <div>
                        <strong className="text-[#1A2420]">Old:</strong>{' '}
                        {formatSnapshotSummary(entry.old_value)}
                      </div>
                      <div>
                        <strong className="text-[#FA661C]">New:</strong>{' '}
                        {formatSnapshotSummary(entry.new_value)}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 8. Create New Rule Version Modal */}
      {formOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fadeIn"
          onClick={() => !saving && setFormOpen(false)}
        >
          <form
            noValidate
            onSubmit={submitCreateForm}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="rule-form-title"
            data-testid="create-rule-modal"
            className="bg-white rounded-3xl shadow-2xl w-full max-w-lg p-6 space-y-4 text-xs animate-dropdown max-h-[92vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#EAE3DC]">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-[#FFF3EC] text-[#FA661C]">
                  {isWithholdingTab ? (
                    <ShieldAlert className="w-4 h-4" />
                  ) : activeTab === 'commission' ? (
                    <Percent className="w-4 h-4" />
                  ) : (
                    <DollarSign className="w-4 h-4" />
                  )}
                </span>
                <div>
                  <h3 id="rule-form-title" className="font-['Outfit'] font-extrabold text-lg text-[#FA661C]">
                    New {tabMeta.singular} Version
                  </h3>
                  <p className="text-[11px] text-[#6B6058]">
                    An existing rate is never edited; creating a new version replaces an open rule from the start date.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setFormOpen(false)}
                disabled={saving}
                aria-label="Close modal"
                className="p-1 rounded-lg text-[#6B6058] hover:text-[#FA661C] hover:bg-[#FFF3EC] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {!isWithholdingTab ? (
              <>
                {/* Fee Rule Fields (Commission / Platform Fee) */}
                <div>
                  <span className="font-bold text-[#6B6058] block mb-1.5">Scope</span>
                  <div className="grid grid-cols-2 gap-2">
                    {['global', 'vendor'].map((s) => (
                      <button
                        key={s}
                        type="button"
                        data-testid={`scope-btn-${s}`}
                        onClick={() => updateFeeField('scope', s)}
                        className={`py-2 rounded-xl font-bold capitalize border transition-all cursor-pointer ${
                          feeForm.scope === s
                            ? 'bg-[#FA661C] text-white border-[#FA661C] shadow-sm'
                            : 'bg-white text-[#6B6058] border-[#EAE3DC] hover:border-[#FA661C] hover:text-[#FA661C]'
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                  {fieldErrors.scope && (
                    <p
                      id="field-error-scope"
                      data-testid="field-error-scope"
                      role="alert"
                      className="text-red-600 font-bold text-[11px] mt-1"
                    >
                      {fieldErrors.scope}
                    </p>
                  )}
                </div>

                {feeForm.scope === 'vendor' && (
                  <label className="block">
                    <span className="font-bold text-[#6B6058] block mb-1.5">Vendor</span>
                    <select
                      aria-label="Vendor"
                      data-testid="input-vendor"
                      value={feeForm.vendor}
                      onChange={(e) => updateFeeField('vendor', e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-[#EAE3DC] bg-[#FFF8F2] focus:outline-none focus:border-[#FA661C]"
                    >
                      <option value="">Select vendor…</option>
                      {vendors.map((v) => (
                        <option key={v.id} value={v.id}>
                          {vendorName[v.id]} (#{v.id}){v.country ? ` — ${v.country}` : ''}
                        </option>
                      ))}
                    </select>
                    {fieldErrors.vendor && (
                      <p
                        id="field-error-vendor"
                        data-testid="field-error-vendor"
                        role="alert"
                        className="text-red-600 font-bold text-[11px] mt-1"
                      >
                        {fieldErrors.vendor}
                      </p>
                    )}
                  </label>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <label className="block">
                    <span className="font-bold text-[#6B6058] block mb-1.5">Country</span>
                    <select
                      aria-label="Country"
                      data-testid="input-country"
                      value={feeForm.country}
                      onChange={(e) => updateFeeField('country', e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-[#EAE3DC] bg-[#FFF8F2] focus:outline-none focus:border-[#FA661C]"
                    >
                      <option value="IN">India (IN)</option>
                      <option value="AE">UAE (AE)</option>
                      <option value="IE">Ireland (IE)</option>
                    </select>
                    {fieldErrors.country && (
                      <p
                        id="field-error-country"
                        data-testid="field-error-country"
                        role="alert"
                        className="text-red-600 font-bold text-[11px] mt-1"
                      >
                        {fieldErrors.country}
                      </p>
                    )}
                  </label>

                  <label className="block">
                    <span className="font-bold text-[#6B6058] block mb-1.5">Rate Type</span>
                    <select
                      aria-label="Rate Type"
                      data-testid="input-rate_type"
                      value={feeForm.rate_type}
                      onChange={(e) => updateFeeField('rate_type', e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-[#EAE3DC] bg-[#FFF8F2] focus:outline-none focus:border-[#FA661C]"
                    >
                      <option value="percentage">Percentage (%)</option>
                      <option value="flat">Flat amount</option>
                    </select>
                    {fieldErrors.rate_type && (
                      <p
                        id="field-error-rate_type"
                        data-testid="field-error-rate_type"
                        role="alert"
                        className="text-red-600 font-bold text-[11px] mt-1"
                      >
                        {fieldErrors.rate_type}
                      </p>
                    )}
                  </label>
                </div>

                <label className="block">
                  <span className="font-bold text-[#6B6058] block mb-1.5">Rate Value</span>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-[#FA661C]">
                      {feeForm.rate_type === 'percentage' ? '%' : (CURRENCY[feeForm.country] || '').trim()}
                    </span>
                    <input
                      type="text"
                      inputMode="decimal"
                      aria-label="Rate Value"
                      data-testid="input-rate_value"
                      value={feeForm.rate_value}
                      onChange={(e) => updateFeeField('rate_value', e.target.value)}
                      placeholder={feeForm.rate_type === 'percentage' ? 'e.g. 12.00' : 'e.g. 25.00'}
                      className="w-full pl-10 pr-3 py-2 rounded-xl border border-[#EAE3DC] bg-[#FFF8F2] font-mono font-bold text-sm focus:outline-none focus:border-[#FA661C]"
                    />
                  </div>
                  {fieldErrors.rate_value && (
                    <p
                      id="field-error-rate_value"
                      data-testid="field-error-rate_value"
                      role="alert"
                      className="text-red-600 font-bold text-[11px] mt-1"
                    >
                      {fieldErrors.rate_value}
                    </p>
                  )}
                </label>

                <div className="grid grid-cols-2 gap-3">
                  <label className="block">
                    <span className="font-bold text-[#6B6058] block mb-1.5">Effective From</span>
                    <input
                      type="date"
                      aria-label="Effective From"
                      data-testid="input-effective_from"
                      value={feeForm.effective_from}
                      onChange={(e) => updateFeeField('effective_from', e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-[#EAE3DC] bg-[#FFF8F2] focus:outline-none focus:border-[#FA661C]"
                    />
                    {fieldErrors.effective_from && (
                      <p
                        id="field-error-effective_from"
                        data-testid="field-error-effective_from"
                        role="alert"
                        className="text-red-600 font-bold text-[11px] mt-1"
                      >
                        {fieldErrors.effective_from}
                      </p>
                    )}
                  </label>

                  <label className="block">
                    <span className="font-bold text-[#6B6058] block mb-1.5">
                      Effective To <span className="font-normal">(optional)</span>
                    </span>
                    <input
                      type="date"
                      aria-label="Effective To"
                      data-testid="input-effective_to"
                      value={feeForm.effective_to}
                      onChange={(e) => updateFeeField('effective_to', e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-[#EAE3DC] bg-[#FFF8F2] focus:outline-none focus:border-[#FA661C]"
                    />
                    {fieldErrors.effective_to && (
                      <p
                        id="field-error-effective_to"
                        data-testid="field-error-effective_to"
                        role="alert"
                        className="text-red-600 font-bold text-[11px] mt-1"
                      >
                        {fieldErrors.effective_to}
                      </p>
                    )}
                  </label>
                </div>

                <label className="block">
                  <span className="font-bold text-[#6B6058] block mb-1.5">
                    Reason for Change <span className="text-red-600">*</span>
                  </span>
                  <textarea
                    rows={2}
                    aria-label="Reason"
                    data-testid="input-reason"
                    value={feeForm.reason}
                    onChange={(e) => updateFeeField('reason', e.target.value)}
                    placeholder="Explain why this new rate version is being created..."
                    className="w-full px-3 py-2 rounded-xl border border-[#EAE3DC] bg-[#FFF8F2] focus:outline-none focus:border-[#FA661C]"
                  />
                  {fieldErrors.reason && (
                    <p
                      id="field-error-reason"
                      data-testid="field-error-reason"
                      role="alert"
                      className="text-red-600 font-bold text-[11px] mt-1"
                    >
                      {fieldErrors.reason}
                    </p>
                  )}
                </label>
              </>
            ) : (
              <>
                {/* Withholding Rule Fields (TDS / TCS) */}
                <div className="grid grid-cols-2 gap-3">
                  <label className="block">
                    <span className="font-bold text-[#6B6058] block mb-1.5">Withholding Type</span>
                    <select
                      aria-label="Withholding Type"
                      data-testid="input-withholding_type"
                      value={whForm.withholding_type}
                      onChange={(e) => updateWhField('withholding_type', e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-[#EAE3DC] bg-[#FFF8F2] font-bold uppercase focus:outline-none focus:border-[#FA661C]"
                    >
                      <option value="tds">TDS</option>
                      <option value="tcs">TCS</option>
                    </select>
                    {fieldErrors.withholding_type && (
                      <p
                        id="field-error-withholding_type"
                        data-testid="field-error-withholding_type"
                        role="alert"
                        className="text-red-600 font-bold text-[11px] mt-1"
                      >
                        {fieldErrors.withholding_type}
                      </p>
                    )}
                  </label>

                  <label className="block">
                    <span className="font-bold text-[#6B6058] block mb-1.5">Country</span>
                    <select
                      aria-label="Country"
                      data-testid="input-country"
                      value={whForm.country}
                      onChange={(e) => updateWhField('country', e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-[#EAE3DC] bg-[#FFF8F2] focus:outline-none focus:border-[#FA661C]"
                    >
                      <option value="IN">India (IN)</option>
                      <option value="AE">UAE (AE)</option>
                      <option value="IE">Ireland (IE)</option>
                    </select>
                    {fieldErrors.country && (
                      <p
                        id="field-error-country"
                        data-testid="field-error-country"
                        role="alert"
                        className="text-red-600 font-bold text-[11px] mt-1"
                      >
                        {fieldErrors.country}
                      </p>
                    )}
                  </label>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <label className="block">
                    <span className="font-bold text-[#6B6058] block mb-1.5">
                      Fractional Rate (0 to 1, 4 decimals)
                    </span>
                    <input
                      type="text"
                      inputMode="decimal"
                      aria-label="Rate"
                      data-testid="input-rate"
                      value={whForm.rate}
                      onChange={(e) => updateWhField('rate', e.target.value)}
                      placeholder="e.g. 0.0010 (for 0.10%)"
                      className="w-full px-3 py-2 rounded-xl border border-[#EAE3DC] bg-[#FFF8F2] font-mono font-bold text-sm focus:outline-none focus:border-[#FA661C]"
                    />
                    <span className="block text-[10px] text-[#6B6058] mt-1">
                      0.0010 = 0.10% · 0.0050 = 0.50%
                    </span>
                    {fieldErrors.rate && (
                      <p
                        id="field-error-rate"
                        data-testid="field-error-rate"
                        role="alert"
                        className="text-red-600 font-bold text-[11px] mt-1"
                      >
                        {fieldErrors.rate}
                      </p>
                    )}
                  </label>

                  <label className="block">
                    <span className="font-bold text-[#6B6058] block mb-1.5">Tax Base</span>
                    <select
                      aria-label="Tax Base"
                      data-testid="input-tax_base"
                      value={whForm.tax_base}
                      onChange={(e) => updateWhField('tax_base', e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-[#EAE3DC] bg-[#FFF8F2] focus:outline-none focus:border-[#FA661C]"
                    >
                      <option value="gross_sale_value">Gross sale value</option>
                      <option value="net_taxable_supply">Net taxable supply</option>
                    </select>
                    {fieldErrors.tax_base && (
                      <p
                        id="field-error-tax_base"
                        data-testid="field-error-tax_base"
                        role="alert"
                        className="text-red-600 font-bold text-[11px] mt-1"
                      >
                        {fieldErrors.tax_base}
                      </p>
                    )}
                  </label>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <label className="block">
                    <span className="font-bold text-[#6B6058] block mb-1.5">Effective From</span>
                    <input
                      type="date"
                      aria-label="Effective From"
                      data-testid="input-effective_from"
                      value={whForm.effective_from}
                      onChange={(e) => updateWhField('effective_from', e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-[#EAE3DC] bg-[#FFF8F2] focus:outline-none focus:border-[#FA661C]"
                    />
                    {fieldErrors.effective_from && (
                      <p
                        id="field-error-effective_from"
                        data-testid="field-error-effective_from"
                        role="alert"
                        className="text-red-600 font-bold text-[11px] mt-1"
                      >
                        {fieldErrors.effective_from}
                      </p>
                    )}
                  </label>

                  <label className="block">
                    <span className="font-bold text-[#6B6058] block mb-1.5">
                      Effective To <span className="font-normal">(optional)</span>
                    </span>
                    <input
                      type="date"
                      aria-label="Effective To"
                      data-testid="input-effective_to"
                      value={whForm.effective_to}
                      onChange={(e) => updateWhField('effective_to', e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-[#EAE3DC] bg-[#FFF8F2] focus:outline-none focus:border-[#FA661C]"
                    />
                    {fieldErrors.effective_to && (
                      <p
                        id="field-error-effective_to"
                        data-testid="field-error-effective_to"
                        role="alert"
                        className="text-red-600 font-bold text-[11px] mt-1"
                      >
                        {fieldErrors.effective_to}
                      </p>
                    )}
                  </label>
                </div>

                <label className="block">
                  <span className="font-bold text-[#6B6058] block mb-1.5">
                    Reason for Statutory Change <span className="text-red-600">*</span>
                  </span>
                  <textarea
                    rows={2}
                    aria-label="Reason"
                    data-testid="input-reason"
                    value={whForm.reason}
                    onChange={(e) => updateWhField('reason', e.target.value)}
                    placeholder="Cite statutory notification or reason for this withholding rate version..."
                    className="w-full px-3 py-2 rounded-xl border border-[#EAE3DC] bg-[#FFF8F2] focus:outline-none focus:border-[#FA661C]"
                  />
                  {fieldErrors.reason && (
                    <p
                      id="field-error-reason"
                      data-testid="field-error-reason"
                      role="alert"
                      className="text-red-600 font-bold text-[11px] mt-1"
                    >
                      {fieldErrors.reason}
                    </p>
                  )}
                </label>

                <div className="p-3 rounded-2xl bg-amber-50 border border-amber-300 space-y-1">
                  <label className="flex items-start gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      data-testid="input-confirm_statutory_change"
                      checked={whForm.confirm_statutory_change}
                      onChange={(e) => updateWhField('confirm_statutory_change', e.target.checked)}
                      className="mt-0.5 accent-[#FA661C]"
                    />
                    <span className="font-bold text-amber-950 text-xs">
                      I confirm this statutory withholding rate change (<code>confirm_statutory_change: true</code>). I understand new withholding rules start unverified.
                    </span>
                  </label>
                  {fieldErrors.confirm_statutory_change && (
                    <p
                      id="field-error-confirm_statutory_change"
                      data-testid="field-error-confirm_statutory_change"
                      role="alert"
                      className="text-red-600 font-bold text-[11px] mt-1"
                    >
                      {fieldErrors.confirm_statutory_change}
                    </p>
                  )}
                </div>
              </>
            )}

            {generalFormError && (
              <div
                id="rule-form-general-error"
                data-testid="rule-form-general-error"
                role="alert"
                className="flex gap-2 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 font-bold"
              >
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{generalFormError}</span>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2 border-t border-[#EAE3DC]">
              <button
                type="button"
                onClick={() => setFormOpen(false)}
                disabled={saving}
                className="px-4 py-2 rounded-xl border border-[#EAE3DC] font-bold text-[#6B6058] hover:bg-[#FFF3EC] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                data-testid="submit-create-rule-btn"
                disabled={saving}
                className="px-5 py-2 rounded-xl bg-[#FA661C] hover:bg-[#E0530B] text-white font-black inline-flex items-center gap-1.5 disabled:opacity-60 cursor-pointer"
              >
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>Create Rule Version</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 9. Retire Rule Confirm Dialog */}
      {retireTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs"
          onClick={() => !retiring && setRetireTarget(null)}
        >
          <form
            noValidate
            onSubmit={submitRetire}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="retire-dialog-title"
            data-testid="retire-rule-dialog"
            className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6 space-y-4 text-xs"
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#EAE3DC]">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-red-50 text-red-600">
                  <Archive className="w-4 h-4" />
                </span>
                <div>
                  <h3 id="retire-dialog-title" className="font-['Outfit'] font-extrabold text-base text-[#1A2420]">
                    Retire Rule #{retireTarget.rule.id}
                  </h3>
                  <p className="text-[11px] text-[#6B6058]">
                    Sets the inclusive end date and records an audit log entry.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setRetireTarget(null)}
                disabled={retiring}
                aria-label="Close retire dialog"
                className="p-1 rounded-lg text-[#6B6058] hover:bg-[#FFF3EC] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 rounded-xl bg-[#FFF8F2] border border-[#EAE3DC] text-[#6B6058] space-y-1">
              <div>
                <strong className="text-[#1A2420]">Country:</strong> {retireTarget.rule.country} ·{' '}
                <strong className="text-[#1A2420]">Effective From:</strong> {retireTarget.rule.effective_from}
              </div>
              <div>
                <strong className="text-[#1A2420]">Rate:</strong>{' '}
                {retireTarget.tab === 'tds' || retireTarget.tab === 'tcs'
                  ? `${formatWithholdingRate(retireTarget.rule.rate)} (${retireTarget.rule.rate})`
                  : formatFeeRate(
                      retireTarget.rule.rate_type,
                      retireTarget.rule.rate_value,
                      retireTarget.rule.country
                    )}
              </div>
            </div>

            <label className="block">
              <span className="font-bold text-[#6B6058] block mb-1.5">
                Effective To (End Date, inclusive) <span className="text-red-600">*</span>
              </span>
              <input
                type="date"
                aria-label="Retire Effective To"
                data-testid="retire-input-effective_to"
                value={retireForm.effective_to}
                onChange={(e) => updateRetireField('effective_to', e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[#EAE3DC] bg-[#FFF8F2] focus:outline-none focus:border-[#FA661C]"
              />
              {retireFieldErrors.effective_to && (
                <p
                  id="retire-error-effective_to"
                  data-testid="retire-error-effective_to"
                  role="alert"
                  className="text-red-600 font-bold text-[11px] mt-1"
                >
                  {retireFieldErrors.effective_to}
                </p>
              )}
            </label>

            <label className="block">
              <span className="font-bold text-[#6B6058] block mb-1.5">
                Reason for Retirement <span className="text-red-600">*</span>
              </span>
              <textarea
                rows={2}
                aria-label="Retire Reason"
                data-testid="retire-input-reason"
                value={retireForm.reason}
                onChange={(e) => updateRetireField('reason', e.target.value)}
                placeholder="Provide a reason for retiring this rule..."
                className="w-full px-3 py-2 rounded-xl border border-[#EAE3DC] bg-[#FFF8F2] focus:outline-none focus:border-[#FA661C]"
              />
              {retireFieldErrors.reason && (
                <p
                  id="retire-error-reason"
                  data-testid="retire-error-reason"
                  role="alert"
                  className="text-red-600 font-bold text-[11px] mt-1"
                >
                  {retireFieldErrors.reason}
                </p>
              )}
            </label>

            {(retireTarget.tab === 'tds' || retireTarget.tab === 'tcs') && (
              <div className="p-3 rounded-2xl bg-amber-50 border border-amber-300 space-y-1">
                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    data-testid="retire-input-confirm_statutory_change"
                    checked={retireForm.confirm_statutory_change}
                    onChange={(e) => updateRetireField('confirm_statutory_change', e.target.checked)}
                    className="mt-0.5 accent-[#FA661C]"
                  />
                  <span className="font-bold text-amber-950 text-xs">
                    I confirm retiring this statutory withholding rule (<code>confirm_statutory_change: true</code>).
                  </span>
                </label>
                {retireFieldErrors.confirm_statutory_change && (
                  <p
                    id="retire-error-confirm_statutory_change"
                    data-testid="retire-error-confirm_statutory_change"
                    role="alert"
                    className="text-red-600 font-bold text-[11px] mt-1"
                  >
                    {retireFieldErrors.confirm_statutory_change}
                  </p>
                )}
              </div>
            )}

            {retireGeneralError && (
              <div
                data-testid="retire-general-error"
                role="alert"
                className="flex gap-2 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 font-bold"
              >
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{retireGeneralError}</span>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2 border-t border-[#EAE3DC]">
              <button
                type="button"
                onClick={() => setRetireTarget(null)}
                disabled={retiring}
                className="px-4 py-2 rounded-xl border border-[#EAE3DC] font-bold text-[#6B6058] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                data-testid="confirm-retire-btn"
                disabled={retiring}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-black inline-flex items-center gap-1.5 disabled:opacity-60 cursor-pointer"
              >
                {retiring && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Confirm Retire</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
