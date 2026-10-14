import React, { useState, useEffect, useMemo } from 'react';
import { Percent, ShieldCheck, RefreshCw, Filter, Layers, DollarSign, Calendar, AlertCircle, Plus, Pencil, Trash2, X, Loader2, Lock } from 'lucide-react';
import { apiRequest } from '../../../utils/api';
import { useToast } from '../../../context/ToastContext';

const todayISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
const EMPTY_FORM = { scope: 'global', category: '', vendor: '', country: 'IN', rate_type: 'percentage', rate_value: '', effective_from: '', effective_to: '' };
const CURRENCY = { IN: '₹', AE: 'AED ', IE: '€' };

function apiErrorText(err) {
  const d = err?.data;
  if (!d) return err?.message || 'Request failed.';
  if (typeof d === 'string') return d;
  if (Array.isArray(d)) return d.join(' ');
  if (d.detail) return Array.isArray(d.detail) ? d.detail.join(' ') : d.detail;
  return Object.entries(d).map(([k, v]) => `${k === 'non_field_errors' ? '' : `${k}: `}${Array.isArray(v) ? v.join(', ') : v}`).join(' | ');
}

function flattenCategories(list, depth = 0, out = []) {
  (list || []).forEach((c) => {
    out.push({ id: c.id, name: `${'— '.repeat(depth)}${c.name}` });
    if (Array.isArray(c.children) && c.children.length) flattenCategories(c.children, depth + 1, out);
  });
  return out;
}

export default function CommissionModule() {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState('commission'); // 'commission' | 'platform'
  const [scopeFilter, setScopeFilter] = useState('all'); // 'all' | 'global' | 'category' | 'vendor'
  const [countryFilter, setCountryFilter] = useState('all'); // 'all' | 'IN' | 'AE' | 'IE'

  const [commissionRules, setCommissionRules] = useState([]);
  const [platformRules, setPlatformRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchRules = async () => {
    setLoading(true);
    setError(null);
    try {
      const [commData, platData] = await Promise.all([
        apiRequest('/api/settlements/admin/commission-rules/'),
        apiRequest('/api/settlements/admin/platform-fee-rules/'),
      ]);
      setCommissionRules(Array.isArray(commData) ? commData : []);
      setPlatformRules(Array.isArray(platData) ? platData : []);
    } catch (err) {
      console.error('Failed to fetch commission & platform fee rules:', err);
      setError(err.data?.detail || err.message || 'Failed to load commission rules.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRules();
  }, []);

  // Lookups for category/vendor names
  const [categories, setCategories] = useState([]);
  const [vendors, setVendors] = useState([]);
  useEffect(() => {
    apiRequest('/api/products/admin/categories/')
      .catch(() => apiRequest('/api/products/categories/', { skipAuth: true }))
      .then((d) => setCategories(flattenCategories(Array.isArray(d) ? d : d?.results || [])))
      .catch(() => setCategories([]));
    apiRequest('/api/vendors/admin/')
      .then((d) => setVendors(Array.isArray(d) ? d : d?.results || []))
      .catch(() => setVendors([]));
  }, []);
  const categoryName = useMemo(() => Object.fromEntries(categories.map((c) => [c.id, c.name.replace(/^(— )+/, '')])), [categories]);
  const vendorName = useMemo(() => Object.fromEntries(vendors.map((v) => [v.id, v.store_name || v.business_name || `Vendor #${v.id}`])), [vendors]);

  // Create / edit modal
  const [formOpen, setFormOpen] = useState(false);
  const [editingRule, setEditingRule] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const ruleEndpoint = activeTab === 'commission' ? '/api/settlements/admin/commission-rules/' : '/api/settlements/admin/platform-fee-rules/';
  const ruleLabel = activeTab === 'commission' ? 'Commission Rule' : 'Platform Fee Rule';
  const isLocked = (rule) => rule.effective_from <= todayISO();
  const ruleStatus = (rule) => {
    const t = todayISO();
    if (rule.effective_to && rule.effective_to < t) return { label: 'Expired', cls: 'text-[#6B6058] bg-[#F4F1EE] border-[#EAE3DC]' };
    if (rule.effective_from > t) return { label: 'Scheduled', cls: 'text-[#1E64D4] bg-[#EBF3FF] border-[#1E64D4]/30' };
    return { label: 'Active', cls: 'text-emerald-700 bg-emerald-50 border-emerald-200' };
  };

  const openCreate = () => {
    setEditingRule(null);
    setForm({ ...EMPTY_FORM, effective_from: todayISO(), country: countryFilter !== 'all' ? countryFilter : 'IN' });
    setFormError(null);
    setFormOpen(true);
  };
  const openEdit = (rule) => {
    setEditingRule(rule);
    setForm({
      scope: rule.scope, category: rule.category ?? '', vendor: rule.vendor ?? '', country: rule.country,
      rate_type: rule.rate_type, rate_value: rule.rate_value, effective_from: rule.effective_from, effective_to: rule.effective_to || '',
    });
    setFormError(null);
    setFormOpen(true);
  };
  const setField = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const submitForm = async (e) => {
    e.preventDefault();
    setFormError(null);
    const rate = Number(form.rate_value);
    if (form.rate_value === '' || Number.isNaN(rate) || rate < 0) return setFormError('Enter a valid non-negative rate.');
    if (form.rate_type === 'percentage' && rate > 100) return setFormError('Percentage must be between 0 and 100.');
    if (form.scope === 'category' && !form.category) return setFormError('Select a category for category-scoped rules.');
    if (form.scope === 'vendor' && !form.vendor) return setFormError('Select a vendor for vendor-scoped rules.');
    if (!form.effective_from) return setFormError('Effective-from date is required.');
    if (form.effective_to && form.effective_to < form.effective_from) return setFormError('Effective-to cannot be before effective-from.');

    const payload = {
      scope: form.scope,
      category: form.scope === 'category' ? Number(form.category) : null,
      vendor: form.scope === 'vendor' ? Number(form.vendor) : null,
      country: form.country,
      rate_type: form.rate_type,
      rate_value: rate.toFixed(2),
      effective_from: form.effective_from,
      effective_to: form.effective_to || null,
    };
    setSaving(true);
    try {
      if (editingRule) {
        await apiRequest(`${ruleEndpoint}${editingRule.id}/`, { method: 'PATCH', body: JSON.stringify(payload) });
        toast.success(`${ruleLabel} Updated`, `Rule #${editingRule.id} saved.`);
      } else {
        const created = await apiRequest(ruleEndpoint, { method: 'POST', body: JSON.stringify(payload) });
        toast.success(`${ruleLabel} Created`, `Rule #${created?.id ?? ''} saved.`);
      }
      setFormOpen(false);
      fetchRules();
    } catch (err) {
      setFormError(apiErrorText(err));
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await apiRequest(`${ruleEndpoint}${deleteTarget.id}/`, { method: 'DELETE' });
      toast.success('Rule Deleted', `Rule #${deleteTarget.id} removed.`);
      setDeleteTarget(null);
      fetchRules();
    } catch (err) {
      toast.error('Delete Rejected', apiErrorText(err));
    } finally {
      setDeleting(false);
    }
  };

  const currentRules = activeTab === 'commission' ? commissionRules : platformRules;

  const filteredRules = currentRules.filter(rule => {
    if (scopeFilter !== 'all' && rule.scope !== scopeFilter) return false;
    if (countryFilter !== 'all' && rule.country !== countryFilter) return false;
    return true;
  });

  const formatRate = (type, val, country) => {
    if (val === null || val === undefined || val === '') return '—';
    if (type === 'percentage') return `${val}%`;
    return `${CURRENCY[country] || ''}${val}`;
  };

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
              Commission & Platform Fee Matrix
            </h2>
          </div>
          <p className="text-xs text-[#6B6058] mt-0.5">
            Configure platform commission rates, fee tiers, and category deductions
          </p>
        </div>

        <div className="flex items-center space-x-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => {
              fetchRules();
              toast.success("Rules Refreshed", "Loaded latest commission and platform fee rule matrices.");
            }}
            disabled={loading}
            className="px-4 py-2 bg-[#FA661C] hover:bg-[#E0530B] text-white rounded-xl text-xs font-bold btn-interactive flex items-center space-x-1.5 cursor-pointer shadow-xs disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Sync Rules</span>
          </button>
          <button
            type="button"
            id="commission-add-rule"
            onClick={openCreate}
            className="px-4 py-2 bg-gradient-to-r from-[#FA661C] to-[#FF811A] hover:shadow-lg hover:shadow-[#FA661C]/30 text-white rounded-xl text-xs font-black btn-interactive flex items-center space-x-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add {activeTab === 'commission' ? 'Commission' : 'Platform Fee'} Rule</span>
          </button>
        </div>
      </div>

      {/* 2. Top Rule Type Selector & Summary Badges */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Toggle Button Group */}
        <div className="md:col-span-1 bg-[#FFF3EC] p-1.5 rounded-2xl border border-[#EAE3DC] flex items-center space-x-1">
          <button
            type="button"
            onClick={() => setActiveTab('commission')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center space-x-1.5 ${
              activeTab === 'commission'
                ? 'bg-[#FA661C] text-white shadow-2xs'
                : 'text-[#6B6058] hover:text-[#FA661C]'
            }`}
          >
            <Percent className="w-3.5 h-3.5" />
            <span>Commission Rules ({commissionRules.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('platform')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center space-x-1.5 ${
              activeTab === 'platform'
                ? 'bg-[#FA661C] text-white shadow-2xs'
                : 'text-[#6B6058] hover:text-[#FA661C]'
            }`}
          >
            <DollarSign className="w-3.5 h-3.5" />
            <span>Platform Fees ({platformRules.length})</span>
          </button>
        </div>

        {/* Dynamic Metric Cards */}
        <div className="md:col-span-2 grid grid-cols-2 gap-3 text-xs">
          <div className="p-3 bg-white rounded-2xl border border-[#EAE3DC] flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-[#FFF8F2] text-[#FA661C]">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] text-[#6B6058] font-bold uppercase block">Active Rule Scope</span>
              <span className="font-['Outfit'] font-black text-sm text-[#FA661C]">
                {scopeFilter === 'all' ? 'All Scopes (Global, Category, Vendor)' : scopeFilter.toUpperCase()}
              </span>
            </div>
          </div>

          <div className="p-3 bg-white rounded-2xl border border-[#EAE3DC] flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-[#FFF8F2] text-[#FA661C]">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] text-[#6B6058] font-bold uppercase block">Enforced Jurisdiction</span>
              <span className="font-['Outfit'] font-black text-sm text-[#FA661C]">
                {countryFilter === 'all' ? 'Multi-Country Tiers (IN, AE, IE)' : `Country: ${countryFilter}`}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Filters Toolbar */}
      <div className="bg-white rounded-2xl border border-[#EAE3DC] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-bold text-[#6B6058] flex items-center space-x-1">
            <Filter className="w-3.5 h-3.5 text-[#FA661C]" />
            <span>Scope Filter:</span>
          </span>
          {['all', 'global', 'category', 'vendor'].map((s) => (
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
          ))}
        </div>

        <div className="flex items-center space-x-2">
          <span className="font-bold text-[#6B6058]">Country:</span>
          <select
            value={countryFilter}
            onChange={(e) => setCountryFilter(e.target.value)}
            className="px-2.5 py-1 rounded-lg bg-[#FFF3EC] border border-[#EAE3DC] text-[#FA661C] font-bold focus:outline-none focus:border-[#FA661C]"
          >
            <option value="all">All Countries</option>
            <option value="IN">India (IN)</option>
            <option value="AE">UAE (AE)</option>
            <option value="IE">Ireland (IE)</option>
          </select>
        </div>
      </div>

      {/* 4. Table / List */}
      <div className="bg-white rounded-2xl border border-[#EAE3DC] overflow-hidden shadow-xs">
        {loading ? (
          <div className="p-12 text-center space-y-3">
            <RefreshCw className="w-6 h-6 text-[#FA661C] animate-spin mx-auto" />
            <p className="text-xs text-[#6B6058] font-medium">Loading rules...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center space-y-2 text-red-600 bg-red-50">
            <AlertCircle className="w-6 h-6 mx-auto" />
            <p className="text-xs font-bold">{error}</p>
          </div>
        ) : filteredRules.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <p className="text-sm font-bold text-[#FA661C]">No rules match the active filter criteria.</p>
            <p className="text-xs text-[#6B6058]">Try changing scope or country filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#FFF3EC] text-[#FA661C] border-b border-[#EAE3DC] font-extrabold uppercase text-[10px] tracking-wider">
                  <th className="p-3">Rule ID</th>
                  <th className="p-3">Scope</th>
                  <th className="p-3">Country</th>
                  <th className="p-3 text-right">Rate / Value</th>
                  <th className="p-3">Category</th>
                  <th className="p-3">Vendor</th>
                  <th className="p-3">Effective Date Range</th>
                  <th className="p-3 text-center">Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EAE3DC]/60 font-medium">
                {filteredRules.map((rule) => (
                  <tr key={rule.id} className="hover:bg-[#FFF8F2]/50 transition-colors">
                    <td className="p-3 font-mono font-bold text-[#FA661C]">
                      #{rule.id}
                    </td>
                    <td className="p-3">
                      <span className="bg-[#FFF3EC] text-[#FA661C] border border-[#FF811A]/40 px-2 py-0.5 rounded-full font-bold uppercase text-[10px]">
                        {rule.scope}
                      </span>
                    </td>
                    <td className="p-3 font-bold text-[#6B6058]">
                      {rule.country || 'Global'}
                    </td>
                    <td className="p-3 text-right font-mono font-black text-sm text-[#FA661C]">
                      {formatRate(rule.rate_type, rule.rate_value, rule.country)}
                      <span className="block text-[9px] text-[#6B6058] font-normal capitalize">{rule.rate_type}</span>
                    </td>
                    <td className="p-3 text-[#6B6058]">
                      {rule.category ? <span className="font-semibold text-[#1A2420]">{categoryName[rule.category] || `#${rule.category}`}</span> : 'All Categories'}
                    </td>
                    <td className="p-3 text-[#6B6058]">
                      {rule.vendor ? <span className="font-semibold text-[#1A2420]">{vendorName[rule.vendor] || `Vendor #${rule.vendor}`}</span> : 'All Vendors'}
                    </td>
                    <td className="p-3 text-[#6B6058] text-[11px]">
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-3 h-3 text-[#FA661C]" />
                        <span>{rule.effective_from} → {rule.effective_to || 'Open-ended'}</span>
                      </div>
                    </td>
                    <td className="p-3 text-center">
                      {(() => { const s = ruleStatus(rule); return (
                        <span className={`text-[10px] font-bold border px-2 py-0.5 rounded-full ${s.cls}`}>{s.label}</span>
                      ); })()}
                    </td>
                    <td className="p-3">
                      {isLocked(rule) ? (
                        <span className="flex justify-end items-center gap-1 text-[10px] text-[#6B6058]" title="Rules already in effect are immutable. Add a new rule with a future start date to supersede it.">
                          <Lock className="w-3 h-3" />Locked
                        </span>
                      ) : (
                        <div className="flex justify-end gap-1.5">
                          <button type="button" onClick={() => openEdit(rule)} title="Edit rule"
                            className="p-1.5 rounded-lg bg-[#FFF3EC] hover:bg-[#FA661C] text-[#FA661C] hover:text-white border border-[#FF811A]/40 transition-colors cursor-pointer">
                            <Pencil className="w-3 h-3" />
                          </button>
                          <button type="button" onClick={() => setDeleteTarget(rule)} title="Delete rule"
                            className="p-1.5 rounded-lg bg-red-50 hover:bg-red-600 text-red-600 hover:text-white border border-red-200 transition-colors cursor-pointer">
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <p className="text-[11px] text-[#6B6058] flex items-start gap-1.5">
        <ShieldCheck className="w-3.5 h-3.5 text-[#FA661C] shrink-0 mt-0.5" />
        Resolution order at settlement: <strong>Vendor</strong> → <strong>Category</strong> → <strong>Global</strong>. Keep at least one Global rule per country. Rules in effect are locked — to change a rate, add a new rule starting on a future date; an open-ended older rule is closed automatically.
      </p>

      {/* Create / Edit Modal */}
      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fadeIn" onClick={() => !saving && setFormOpen(false)}>
          <form onSubmit={submitForm} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="rule-form-title"
            className="bg-white rounded-3xl shadow-2xl w-full max-w-lg p-6 space-y-4 text-xs animate-dropdown max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#EAE3DC]">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-[#FFF3EC] text-[#FA661C]">{activeTab === 'commission' ? <Percent className="w-4 h-4" /> : <DollarSign className="w-4 h-4" />}</span>
                <h3 id="rule-form-title" className="font-['Outfit'] font-extrabold text-lg text-[#FA661C]">{editingRule ? `Edit ${ruleLabel} #${editingRule.id}` : `New ${ruleLabel}`}</h3>
              </div>
              <button type="button" onClick={() => setFormOpen(false)} disabled={saving} className="p-1 rounded-lg text-[#6B6058] hover:text-[#FA661C] hover:bg-[#FFF3EC] cursor-pointer"><X className="w-5 h-5" /></button>
            </div>

            <div>
              <span className="font-bold text-[#6B6058] block mb-1.5">Scope</span>
              <div className="grid grid-cols-3 gap-2">
                {['global', 'category', 'vendor'].map((s) => (
                  <button key={s} type="button" onClick={() => setField('scope', s)}
                    className={`py-2 rounded-xl font-bold capitalize border transition-all cursor-pointer ${form.scope === s ? 'bg-[#FA661C] text-white border-[#FA661C] shadow-sm' : 'bg-white text-[#6B6058] border-[#EAE3DC] hover:border-[#FA661C] hover:text-[#FA661C]'}`}>
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {form.scope === 'category' && (
              <label className="block">
                <span className="font-bold text-[#6B6058] block mb-1.5">Category</span>
                <select value={form.category} onChange={(e) => setField('category', e.target.value)} required
                  className="w-full px-3 py-2 rounded-xl border border-[#EAE3DC] bg-[#FFF8F2] focus:outline-none focus:border-[#FA661C]">
                  <option value="">Select category…</option>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </label>
            )}

            {form.scope === 'vendor' && (
              <label className="block">
                <span className="font-bold text-[#6B6058] block mb-1.5">Vendor</span>
                <select value={form.vendor} onChange={(e) => {
                    const v = vendors.find((x) => String(x.id) === e.target.value);
                    setForm((f) => ({ ...f, vendor: e.target.value, country: v?.country || f.country }));
                  }} required
                  className="w-full px-3 py-2 rounded-xl border border-[#EAE3DC] bg-[#FFF8F2] focus:outline-none focus:border-[#FA661C]">
                  <option value="">Select vendor…</option>
                  {vendors.map((v) => <option key={v.id} value={v.id}>{vendorName[v.id]}{v.country ? ` (${v.country})` : ''}</option>)}
                </select>
              </label>
            )}

            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="font-bold text-[#6B6058] block mb-1.5">Country</span>
                <select value={form.country} onChange={(e) => setField('country', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#EAE3DC] bg-[#FFF8F2] focus:outline-none focus:border-[#FA661C]">
                  <option value="IN">India (IN)</option>
                  <option value="AE">UAE (AE)</option>
                  <option value="IE">Ireland (IE)</option>
                </select>
              </label>
              <label className="block">
                <span className="font-bold text-[#6B6058] block mb-1.5">Rate Type</span>
                <select value={form.rate_type} onChange={(e) => setField('rate_type', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#EAE3DC] bg-[#FFF8F2] focus:outline-none focus:border-[#FA661C]">
                  <option value="percentage">Percentage (%)</option>
                  <option value="flat">Flat amount</option>
                </select>
              </label>
            </div>

            <label className="block">
              <span className="font-bold text-[#6B6058] block mb-1.5">Rate Value</span>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-[#FA661C]">{form.rate_type === 'percentage' ? '%' : (CURRENCY[form.country] || '').trim()}</span>
                <input type="number" step="0.01" min="0" max={form.rate_type === 'percentage' ? 100 : undefined} required
                  value={form.rate_value} onChange={(e) => setField('rate_value', e.target.value)}
                  placeholder={form.rate_type === 'percentage' ? 'e.g. 12.50' : 'e.g. 25.00'}
                  className="w-full pl-10 pr-3 py-2 rounded-xl border border-[#EAE3DC] bg-[#FFF8F2] font-mono font-bold text-sm focus:outline-none focus:border-[#FA661C]" />
              </div>
            </label>

            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="font-bold text-[#6B6058] block mb-1.5">Effective From</span>
                <input type="date" min={todayISO()} required value={form.effective_from} onChange={(e) => setField('effective_from', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#EAE3DC] bg-[#FFF8F2] focus:outline-none focus:border-[#FA661C]" />
              </label>
              <label className="block">
                <span className="font-bold text-[#6B6058] block mb-1.5">Effective To <span className="font-normal">(optional)</span></span>
                <input type="date" min={form.effective_from || todayISO()} value={form.effective_to} onChange={(e) => setField('effective_to', e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#EAE3DC] bg-[#FFF8F2] focus:outline-none focus:border-[#FA661C]" />
              </label>
            </div>

            {formError && (
              <div role="alert" className="flex gap-2 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700">
                <AlertCircle className="w-4 h-4 shrink-0" /><span>{formError}</span>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2 border-t border-[#EAE3DC]">
              <button type="button" onClick={() => setFormOpen(false)} disabled={saving} className="px-4 py-2 rounded-xl border border-[#EAE3DC] font-bold text-[#6B6058] hover:bg-[#FFF3EC] cursor-pointer">Cancel</button>
              <button type="submit" disabled={saving} className="px-5 py-2 rounded-xl bg-[#FA661C] hover:bg-[#E0530B] text-white font-black inline-flex items-center gap-1.5 disabled:opacity-60 cursor-pointer">
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}{editingRule ? 'Save Changes' : 'Create Rule'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => !deleting && setDeleteTarget(null)}>
          <section role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()} className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4 text-sm">
            <h3 className="font-bold text-lg text-[#1A2420]">Delete rule #{deleteTarget.id}?</h3>
            <p className="text-[#6B6058] text-xs">This scheduled {deleteTarget.scope} rule ({formatRate(deleteTarget.rate_type, deleteTarget.rate_value, deleteTarget.country)}, {deleteTarget.country}) will be removed. Only future rules can be deleted.</p>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setDeleteTarget(null)} disabled={deleting} className="px-4 py-2 rounded-lg border text-xs font-bold">Cancel</button>
              <button type="button" onClick={confirmDelete} disabled={deleting} className="px-4 py-2 rounded-lg bg-red-600 text-white text-xs font-bold inline-flex items-center gap-1.5 disabled:opacity-60">
                {deleting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}Delete
              </button>
            </div>
          </section>
        </div>
      )}

    </div>
  );
}
