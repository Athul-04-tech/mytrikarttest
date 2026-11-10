import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Plus, Search, Tag, Pencil, Trash2, Copy, Loader2, RefreshCw } from 'lucide-react';
import { apiRequest } from '../../../utils/api';

const ENDPOINT = '/api/orders/admin/coupons/';
const EMPTY_FORM = {
  code: '', discount_type: 'percentage', discount_value: '', max_discount_cap: '',
  min_cart_value: '', valid_from: '', valid_until: '', usage_limit_total: '',
  usage_limit_per_customer: '', is_active: true, funded_by: 'platform', description: '',
};
const FIELD_LABELS = {
  code: 'Code', discount_type: 'Discount type', discount_value: 'Discount value',
  max_discount_cap: 'Maximum discount cap', min_cart_value: 'Minimum cart value',
  valid_from: 'Valid from', valid_until: 'Valid until', usage_limit_total: 'Total usage limit',
  usage_limit_per_customer: 'Per customer usage limit', is_active: 'Active', funded_by: 'Funded by',
  description: 'Description', non_field_errors: 'Coupon', detail: 'Coupon',
};

function localInputDate(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function displayDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

function errorText(error) {
  const data = error?.data;
  if (error?.status === 401) return 'Your session has expired. Sign in again to manage coupons.';
  if (error?.status === 403) return 'You do not have permission to manage coupons.';
  if (error?.status === 0) return 'Could not reach the server. Check the connection and try again.';
  if (data?.detail) return data.detail;
  if (data?.message) return data.message;
  return error?.message || 'The request could not be completed.';
}

function fieldErrors(data) {
  if (!data || typeof data !== 'object') return {};
  return Object.fromEntries(Object.entries(data).filter(([key]) => FIELD_LABELS[key]).map(([key, value]) => [
    key, Array.isArray(value) ? value.join(' ') : String(value),
  ]));
}

function toPayload(form) {
  const payload = { ...form };
  ['max_discount_cap', 'min_cart_value', 'usage_limit_total', 'usage_limit_per_customer'].forEach((key) => {
    if (payload[key] === '') payload[key] = null;
  });
  // datetime-local values are interpreted in the administrator's local timezone.
  ['valid_from', 'valid_until'].forEach((key) => {
    if (payload[key]) payload[key] = new Date(payload[key]).toISOString();
  });
  return payload;
}

function formFromCoupon(coupon) {
  return {
    code: coupon.code ?? '',
    discount_type: coupon.discount_type ?? 'percentage',
    discount_value: coupon.discount_value ?? '',
    max_discount_cap: coupon.max_discount_cap ?? '',
    min_cart_value: coupon.min_cart_value ?? '',
    valid_from: localInputDate(coupon.valid_from),
    valid_until: localInputDate(coupon.valid_until),
    usage_limit_total: coupon.usage_limit_total ?? '',
    usage_limit_per_customer: coupon.usage_limit_per_customer ?? '',
    is_active: coupon.is_active !== false,
    funded_by: coupon.funded_by ?? 'platform',
    description: coupon.description ?? '',
  };
}

export default function CouponManagementModule() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageUrl, setPageUrl] = useState('');
  const [editor, setEditor] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState({});
  const [formMessage, setFormMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [deleteCoupon, setDeleteCoupon] = useState(null);
  const [deleteConflict, setDeleteConflict] = useState('');
  const requestSequence = useRef(0);

  const load = useCallback(async (url = '') => {
    const sequence = ++requestSequence.current;
    setLoading(true);
    setError('');
    try {
      let endpoint = url;
      if (!endpoint) {
        const params = new URLSearchParams();
        if (statusFilter) params.set('status', statusFilter);
        if (typeFilter) params.set('discount_type', typeFilter);
        if (search.trim()) params.set('search', search.trim());
        params.set('page', String(page));
        endpoint = `${ENDPOINT}?${params.toString()}`;
      }
      const result = await apiRequest(endpoint);
      if (sequence === requestSequence.current) {
        setData(result);
        setPageUrl(endpoint);
      }
    } catch (err) {
      if (sequence === requestSequence.current) {
        setData(null);
        setError(errorText(err));
      }
    } finally {
      if (sequence === requestSequence.current) setLoading(false);
    }
  }, [page, search, statusFilter, typeFilter]);

  useEffect(() => { load(); }, [load]);

  const refresh = async () => {
    setNotice('');
    await load(pageUrl);
  };

  const openCreate = (copy = null) => {
    setForm(copy ? { ...formFromCoupon(copy), code: '', funded_by: 'platform' } : { ...EMPTY_FORM });
    setFormErrors({});
    setFormMessage('');
    setEditor({ mode: 'create' });
  };

  const openEdit = (coupon) => {
    setForm(formFromCoupon(coupon));
    setFormErrors({});
    setFormMessage('');
    setEditor({ mode: 'edit', coupon });
  };

  const closeEditor = () => { setEditor(null); setFormErrors({}); setFormMessage(''); };
  const updateField = (name, value) => {
    setForm((current) => ({ ...current, [name]: value }));
    setFormErrors((current) => ({ ...current, [name]: undefined }));
  };

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setFormErrors({});
    setFormMessage('');
    try {
      const creating = editor.mode === 'create';
      await apiRequest(creating ? ENDPOINT : `${ENDPOINT}${editor.coupon.id}/`, {
        method: creating ? 'POST' : 'PATCH',
        body: JSON.stringify(toPayload(form)),
      });
      closeEditor();
      setNotice(creating ? 'Coupon created.' : 'Coupon updated.');
      await load();
    } catch (err) {
      setFormErrors(fieldErrors(err?.data));
      setFormMessage(errorText(err));
    } finally {
      setSaving(false);
    }
  };

  const toggle = async (coupon, active = !coupon.is_active) => {
    setBusyId(coupon.id);
    setNotice('');
    setError('');
    try {
      await apiRequest(`${ENDPOINT}${coupon.id}/`, {
        method: 'PATCH', body: JSON.stringify({ is_active: active }),
      });
      setNotice(`Coupon ${coupon.code} ${active ? 'activated' : 'deactivated'}.`);
      await load(pageUrl);
      return true;
    } catch (err) {
      setError(errorText(err));
      return false;
    } finally {
      setBusyId(null);
    }
  };

  const confirmDelete = async () => {
    if (!deleteCoupon) return;
    setBusyId(deleteCoupon.id);
    setDeleteConflict('');
    setError('');
    try {
      await apiRequest(`${ENDPOINT}${deleteCoupon.id}/`, { method: 'DELETE' });
      setDeleteCoupon(null);
      setNotice(`Coupon ${deleteCoupon.code} deleted.`);
      await load(pageUrl);
    } catch (err) {
      if (err?.status === 409) setDeleteConflict(errorText(err));
      else setError(errorText(err));
    } finally {
      setBusyId(null);
    }
  };

  const changeFilter = (setter, value) => { setter(value); setPage(1); setPageUrl(''); };
  const counts = data?.counts;
  const rows = data?.results || [];

  return <section className="space-y-5" aria-label="Coupons and vouchers management">
    <header className="flex flex-wrap items-center justify-between gap-3 border-b border-[#EAE3DC] pb-4">
      <div><div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-[#FA661C]"><Tag className="h-4 w-4" />Growth &amp; Marketing</div>
        <h1 className="mt-1 text-2xl font-extrabold text-[#FA661C]">Coupons &amp; Vouchers Management</h1>
        <p className="mt-1 text-sm text-[#6B6058]">Manage platform-funded customer discount codes.</p>
      </div>
      <button type="button" onClick={() => openCreate()} className="inline-flex items-center gap-2 rounded-xl bg-[#FA661C] px-4 py-2.5 text-sm font-bold text-white"><Plus className="h-4 w-4" />Create coupon</button>
    </header>

    {notice && <div role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{notice}</div>}
    {error && <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</div>}

    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
      {[['Total', 'total'], ['Active', 'active'], ['Expired', 'expired'], ['Used up', 'used_up'], ['Inactive', 'inactive'], ['Redemptions', 'total_redemptions']].map(([label, key]) =>
        <article key={key} className="rounded-xl border border-[#EAE3DC] bg-white p-4"><div className="text-xs font-semibold text-[#6B6058]">{label}</div><div className="mt-1 text-2xl font-black text-[#1A2420]">{counts?.[key] ?? (loading ? '…' : '—')}</div></article>)}
    </div>

    <div className="flex flex-wrap gap-2 rounded-xl border border-[#EAE3DC] bg-white p-3">
      <label className="flex min-w-52 flex-1 items-center gap-2 rounded-lg border border-[#EAE3DC] px-3"><Search className="h-4 w-4 text-[#6B6058]" /><span className="sr-only">Search coupons</span><input value={search} onChange={(e) => changeFilter(setSearch, e.target.value)} placeholder="Search code or description" className="w-full py-2 text-sm outline-none" /></label>
      <label className="sr-only" htmlFor="coupon-status">Status</label><select id="coupon-status" value={statusFilter} onChange={(e) => changeFilter(setStatusFilter, e.target.value)} className="rounded-lg border border-[#EAE3DC] px-3 py-2 text-sm"><option value="">All statuses</option><option value="active">Active</option><option value="expired">Expired</option><option value="used_up">Used up</option><option value="inactive">Inactive</option></select>
      <label className="sr-only" htmlFor="coupon-type">Discount type</label><select id="coupon-type" value={typeFilter} onChange={(e) => changeFilter(setTypeFilter, e.target.value)} className="rounded-lg border border-[#EAE3DC] px-3 py-2 text-sm"><option value="">All types</option><option value="percentage">Percentage</option><option value="flat">Flat</option></select>
      <button type="button" onClick={refresh} className="rounded-lg border border-[#EAE3DC] p-2" aria-label="Refresh coupons"><RefreshCw className="h-4 w-4" /></button>
    </div>

    <div className="overflow-x-auto rounded-xl border border-[#EAE3DC] bg-white">
      {loading ? <div className="flex items-center justify-center gap-2 p-12 text-sm text-[#6B6058]"><Loader2 className="h-5 w-5 animate-spin" />Loading coupons from server…</div>
        : error && !data ? <div className="p-10 text-center text-sm text-[#6B6058]">Coupon data is unavailable. No local data is shown.</div>
          : rows.length === 0 ? <div className="p-10 text-center text-sm text-[#6B6058]">{data?.count ? 'No coupons match these filters.' : 'No coupons have been created.'}</div>
            : <table className="min-w-[1050px] w-full text-left text-sm"><thead className="bg-[#FFF8F2] text-xs uppercase text-[#6B6058]"><tr>{['Code / description', 'Discount', 'Min. cart', 'Validity (local time)', 'Redemptions', 'Status', 'Funded by', 'Actions'].map((h) => <th key={h} className="px-4 py-3">{h}</th>)}</tr></thead>
              <tbody className="divide-y divide-[#F0EAE4]">{rows.map((coupon) => <tr key={coupon.id}>
                <td className="px-4 py-3"><div className="font-mono font-bold">{coupon.code}</div><div className="max-w-52 truncate text-xs text-[#6B6058]">{coupon.description || '—'}</div></td>
                <td className="px-4 py-3">{coupon.discount_type === 'percentage' ? `${coupon.discount_value}%${coupon.max_discount_cap != null ? ` (cap ₹${coupon.max_discount_cap})` : ''}` : `₹${coupon.discount_value} off`}</td>
                <td className="px-4 py-3">{coupon.min_cart_value == null ? '—' : `₹${coupon.min_cart_value}`}</td>
                <td className="px-4 py-3 text-xs">{displayDate(coupon.valid_from)}<br />to {displayDate(coupon.valid_until)}</td>
                <td className="px-4 py-3">{coupon.redemption_count} / {coupon.usage_limit_total ?? '∞'}<div className="text-xs text-[#6B6058]">{coupon.redemption_record_count} records</div></td>
                <td className="px-4 py-3"><span className={`rounded-full px-2 py-1 text-xs font-semibold ${coupon.is_currently_active ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-700'}`}>{coupon.is_currently_active ? 'Active' : coupon.is_expired ? 'Expired' : coupon.is_used_up ? 'Used up' : coupon.is_active ? 'Scheduled' : 'Inactive'}</span></td>
                <td className="px-4 py-3 capitalize">{coupon.funded_by}</td>
                <td className="px-4 py-3"><div className="flex items-center gap-2">
                  <button type="button" disabled={busyId === coupon.id} role="switch" aria-checked={coupon.is_active} aria-label={`${coupon.is_active ? 'Deactivate' : 'Activate'} ${coupon.code}`} onClick={() => toggle(coupon)} className={`rounded px-2 py-1 text-xs font-bold ${coupon.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-700'}`}>{coupon.is_active ? 'On' : 'Off'}</button>
                  <button type="button" aria-label={`Edit ${coupon.code}`} onClick={() => openEdit(coupon)} className="rounded p-1.5 hover:bg-gray-100"><Pencil className="h-4 w-4" /></button>
                  <button type="button" aria-label={`Duplicate ${coupon.code}`} onClick={() => openCreate(coupon)} className="rounded p-1.5 hover:bg-gray-100"><Copy className="h-4 w-4" /></button>
                  <button type="button" aria-label={`Delete ${coupon.code}`} onClick={() => { setDeleteCoupon(coupon); setDeleteConflict(''); }} className="rounded p-1.5 text-red-700 hover:bg-red-50"><Trash2 className="h-4 w-4" /></button>
                </div></td>
              </tr>)}</tbody></table>}
    </div>
    {data && <div className="flex items-center justify-between text-sm text-[#6B6058]"><span>{data.count} coupon{data.count === 1 ? '' : 's'} matching filters</span><div className="flex gap-2"><button type="button" disabled={!data.previous || loading} onClick={() => setPage(Math.max(1, page - 1))} className="rounded border px-3 py-1.5 disabled:opacity-40">Previous</button><span className="px-2 py-1.5">Page {page}</span><button type="button" disabled={!data.next || loading} onClick={() => setPage(page + 1)} className="rounded border px-3 py-1.5 disabled:opacity-40">Next</button></div></div>}

    {editor && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="presentation"><div role="dialog" aria-modal="true" aria-labelledby="coupon-form-title" className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
      <div className="flex items-center justify-between"><h2 id="coupon-form-title" className="text-xl font-bold">{editor.mode === 'create' ? 'Create coupon' : `Edit ${editor.coupon.code}`}</h2><button type="button" onClick={closeEditor} aria-label="Close form" className="text-2xl">×</button></div>
      {formMessage && <p role="alert" className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-800">{formMessage}</p>}
      <form onSubmit={submit} className="mt-4 grid gap-4 sm:grid-cols-2">
        {[
          ['code', 'Coupon code', 'text'], ['discount_value', 'Discount value', 'number'],
          ['max_discount_cap', 'Maximum discount cap (optional)', 'number'], ['min_cart_value', 'Minimum cart value (optional)', 'number'],
          ['valid_from', 'Valid from', 'datetime-local'], ['valid_until', 'Valid until', 'datetime-local'],
          ['usage_limit_total', 'Total usage limit (optional)', 'number'], ['usage_limit_per_customer', 'Per customer limit (optional)', 'number'],
        ].map(([name, label, type]) => <label key={name} className="grid gap-1 text-sm font-semibold">{label}
          <input aria-label={label} type={type} maxLength={name === 'code' ? 64 : undefined} step={type === 'number' ? (name.startsWith('usage_limit_') ? '1' : '0.01') : undefined} min={type === 'number' ? '0' : undefined} value={form[name] ?? ''} onChange={(e) => updateField(name, e.target.value)} className="rounded-lg border border-[#D9D1C9] px-3 py-2 font-normal" />
          {formErrors[name] && <span className="font-normal text-red-700" role="alert">{formErrors[name]}</span>}</label>)}
        <label className="grid gap-1 text-sm font-semibold">Discount type<select value={form.discount_type} onChange={(e) => updateField('discount_type', e.target.value)} className="rounded-lg border border-[#D9D1C9] px-3 py-2 font-normal"><option value="percentage">Percentage</option><option value="flat">Flat amount</option></select>{formErrors.discount_type && <span role="alert" className="font-normal text-red-700">{formErrors.discount_type}</span>}</label>
        <label className="grid gap-1 text-sm font-semibold">Funded by<input value={form.funded_by === 'vendor' ? 'Vendor (unchanged)' : 'Platform'} disabled className="rounded-lg border border-[#D9D1C9] bg-gray-50 px-3 py-2 font-normal" /><span className="text-xs font-normal text-[#6B6058]">Vendor-funded coupons are not managed here.</span>{formErrors.funded_by && <span role="alert" className="font-normal text-red-700">{formErrors.funded_by}</span>}</label>
        <label className="grid gap-1 text-sm font-semibold sm:col-span-2">Description<textarea maxLength={255} value={form.description} onChange={(e) => updateField('description', e.target.value)} className="rounded-lg border border-[#D9D1C9] px-3 py-2 font-normal" />{formErrors.description && <span role="alert" className="font-normal text-red-700">{formErrors.description}</span>}</label>
        <label className="flex items-center gap-2 text-sm font-semibold sm:col-span-2"><input type="checkbox" checked={form.is_active} onChange={(e) => updateField('is_active', e.target.checked)} />Active</label>{formErrors.is_active && <span role="alert" className="text-sm text-red-700 sm:col-span-2">{formErrors.is_active}</span>}
        {formErrors.non_field_errors && <p className="text-sm text-red-700 sm:col-span-2" role="alert">{formErrors.non_field_errors}</p>}
        <div className="flex justify-end gap-2 sm:col-span-2"><button type="button" onClick={closeEditor} className="rounded-lg border px-4 py-2">Cancel</button><button type="submit" disabled={saving} className="rounded-lg bg-[#FA661C] px-4 py-2 font-bold text-white disabled:opacity-50">{saving ? 'Saving…' : editor.mode === 'create' ? 'Create coupon' : 'Save changes'}</button></div>
      </form>
    </div></div>}

    {deleteCoupon && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"><div role="dialog" aria-modal="true" aria-labelledby="delete-title" className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"><h2 id="delete-title" className="text-lg font-bold">Delete {deleteCoupon.code}?</h2><p className="mt-2 text-sm text-[#6B6058]">Confirm permanent deletion. Coupons with redemption history cannot be deleted.</p>
      {deleteConflict && <div role="alert" className="mt-3 rounded bg-amber-50 p-3 text-sm text-amber-900">{deleteConflict}<button type="button" onClick={() => toggle(deleteCoupon, false).then((ok) => { if (ok) { setDeleteCoupon(null); setDeleteConflict(''); } })} className="mt-2 block font-bold underline">Deactivate instead</button></div>}
      <div className="mt-5 flex justify-end gap-2"><button type="button" onClick={() => { setDeleteCoupon(null); setDeleteConflict(''); }} className="rounded-lg border px-4 py-2">Cancel</button><button type="button" disabled={busyId === deleteCoupon.id} onClick={confirmDelete} className="rounded-lg bg-red-700 px-4 py-2 font-bold text-white">{busyId === deleteCoupon.id ? 'Deleting…' : 'Delete coupon'}</button></div>
    </div></div>}
  </section>;
}
