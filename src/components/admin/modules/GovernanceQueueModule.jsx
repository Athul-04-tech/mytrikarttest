import React, { useState, useEffect } from 'react';
import { Tag, ShieldCheck, CheckCircle2, AlertCircle, RefreshCw, X, Check, Ban, Sparkles, Building2, ExternalLink, Power } from 'lucide-react';
import { apiRequest, openProtectedFile } from '../../../utils/api';
import { useToast } from '../../../context/ToastContext';

export function getCategoryFullPath(req, categories = []) {
  if (!req) return 'Category';
  if (!categories || categories.length === 0) {
    return req.category_name || 'Category';
  }
  const cat = categories.find(c => c.name === req.category_name);
  if (!cat) return req.category_name || 'Category';

  if (cat.parent) {
    const parentCat = categories.find(c => c.id === cat.parent);
    if (parentCat) {
      return `${parentCat.name} › ${cat.name}`;
    }
  }
  return cat.name;
}

export function AttributeRequestCards({
  requests = [],
  categories = [],
  loading = false,
  error = null,
  submittingAction = false,
  onApprove,
  onReject,
}) {
  if (error) {
    return (
      <div className="p-4 bg-[#FDE8EA] border border-[#D7263D]/30 rounded-2xl flex items-start space-x-3 text-xs text-[#D7263D]">
        <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
        <div className="flex-1">
          <div className="font-bold">Error Loading Attribute Requests</div>
          <p className="mt-0.5">{error}</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-[#EAE3DC] p-6 text-center animate-pulse text-xs text-[#6B6058]">
        Loading pending attribute value requests...
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className="bg-white rounded-3xl border border-dashed border-[#EAE3DC] p-10 text-center space-y-3">
        <div className="w-12 h-12 rounded-2xl bg-[#FFF3EC] text-[#FA661C] mx-auto flex items-center justify-center">
          <CheckCircle2 className="w-6 h-6 text-[#52B788]" />
        </div>
        <h3 className="font-['Outfit'] font-bold text-base text-[#FA661C]">
          Attribute Governance Queue Clear
        </h3>
        <p className="text-xs text-[#6B6058] max-w-md mx-auto">
          No pending attribute value requests from vendors. New vendor requests for custom dropdown options will appear here for admin review.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {requests.map((req) => {
        const fullCategoryPath = getCategoryFullPath(req, categories);

        return (
          <div
            key={req.id}
            className="bg-white rounded-2xl border border-[#EAE3DC] p-4 shadow-xs hover:shadow-md transition-all space-y-3 flex flex-col justify-between"
          >
            <div className="space-y-2">
              <div className="flex items-start justify-between gap-2">
                <span className="text-[10px] font-extrabold text-[#FA661C] uppercase tracking-wider bg-[#FFF3EC] px-2.5 py-1 rounded-lg border border-[#FA661C]/20 max-w-[80%] truncate">
                  {fullCategoryPath}
                </span>
                <span className="text-[10px] font-mono text-[#6B6058] bg-[#FFF8F2] px-2 py-0.5 rounded border border-[#EAE3DC] shrink-0">
                  Req #{req.id}
                </span>
              </div>

              <div className="pt-1">
                <span className="text-xs text-[#6B6058] block">Attribute:</span>
                <h4 className="font-extrabold text-sm text-[#1A2420]">
                  {req.category_attribute_name}
                </h4>
              </div>

              <div className="p-3 bg-[#FFF8F2] rounded-xl border border-[#EAE3DC]/80 space-y-1.5">
                <div className="text-xs flex items-center gap-1.5">
                  <span className="text-[#6B6058] font-medium">Requested Value:</span>
                  <span className="font-black text-[#FA661C] bg-white px-2 py-0.5 rounded-md border border-[#FA661C]/30 shadow-2xs">
                    "{req.requested_value}"
                  </span>
                </div>
                <div className="text-xs text-[#6B6058]">
                  <span className="font-semibold text-[#1A2420]">Vendor: </span>
                  <span className="font-bold text-[#FA661C]">{req.vendor_name || 'Vendor'}</span>
                </div>
                <div className="text-xs text-[#6B6058]">
                  <span className="font-semibold text-[#1A2420]">Reason: </span>
                  <span>{req.reason || 'No justification provided.'}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-[#EAE3DC]/50">
              <button
                type="button"
                disabled={submittingAction}
                onClick={() => onApprove(req)}
                className="px-3 py-1.5 rounded-xl bg-[#52B788] hover:bg-[#40916C] text-white font-bold text-xs transition-colors cursor-pointer shadow-xs inline-flex items-center space-x-1 disabled:opacity-50"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Approve</span>
              </button>
              <button
                type="button"
                disabled={submittingAction}
                onClick={() => onReject(req)}
                className="px-3 py-1.5 rounded-xl bg-[#D7263D] hover:bg-[#B01E30] text-white font-bold text-xs transition-colors cursor-pointer shadow-xs inline-flex items-center space-x-1 disabled:opacity-50"
              >
                <Ban className="w-3.5 h-3.5" />
                <span>Reject</span>
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function GovernanceQueueModule({ defaultTab = 'attributes' }) {
  const [activeTab, setActiveTab] = useState(defaultTab);
  
  // State for Categories
  const [categories, setCategories] = useState([]);

  // State for Attribute Value Requests
  const [attrRequests, setAttrRequests] = useState([]);
  const [loadingAttr, setLoadingAttr] = useState(true);
  const [attrError, setAttrError] = useState(null);

  // State for Brand Requests
  const [brandRequests, setBrandRequests] = useState([]);
  const [loadingBrands, setLoadingBrands] = useState(true);
  const [brandError, setBrandError] = useState(null);
  const [managedBrands, setManagedBrands] = useState([]);
  const [loadingManagedBrands, setLoadingManagedBrands] = useState(true);
  const [managedBrandError, setManagedBrandError] = useState(null);
  const [deactivatingBrandId, setDeactivatingBrandId] = useState(null);

  // Modal / Rejection state
  const [rejectingItem, setRejectingItem] = useState(null); // { type: 'attr' | 'brand', item: obj }
  const [rejectReason, setRejectReason] = useState('');
  const [submittingAction, setSubmittingAction] = useState(false);
  const [actionError, setActionError] = useState(null);

  const toast = useToast();

  useEffect(() => {
    setActiveTab(defaultTab);
  }, [defaultTab]);

  const fetchCategories = async () => {
    try {
      const data = await apiRequest('/api/products/admin/categories/').catch(() => []);
      setCategories(Array.isArray(data) ? data : (data.results || []));
    } catch (err) {
      console.error("Failed to fetch categories in GovernanceQueue:", err);
    }
  };

  const fetchAttrRequests = async () => {
    setLoadingAttr(true);
    setAttrError(null);
    try {
      const data = await apiRequest('/api/products/admin/attribute-value-requests/');
      setAttrRequests(Array.isArray(data) ? data : (data.results || []));
    } catch (err) {
      console.error("Failed to fetch attribute value requests:", err);
      setAttrError(err.data?.detail || err.message || "Failed to load attribute value requests.");
    } finally {
      setLoadingAttr(false);
    }
  };

  const fetchBrandRequests = async () => {
    setLoadingBrands(true);
    setBrandError(null);
    try {
      const data = await apiRequest('/api/products/admin/brand-requests/');
      setBrandRequests(Array.isArray(data) ? data : (data.results || []));
    } catch (err) {
      console.error("Failed to fetch brand requests:", err);
      setBrandError(err.data?.detail || err.message || "Failed to load brand requests.");
    } finally {
      setLoadingBrands(false);
    }
  };

  const fetchManagedBrands = async () => {
    setLoadingManagedBrands(true);
    setManagedBrandError(null);
    try {
      const data = await apiRequest('/api/products/admin/brands/');
      setManagedBrands(Array.isArray(data) ? data : (data.results || []));
    } catch (err) {
      setManagedBrandError(err.data?.detail || err.message || 'Failed to load official brands.');
    } finally {
      setLoadingManagedBrands(false);
    }
  };

  const handleDeactivateBrand = async (brand) => {
    const confirmed = window.confirm(`Deactivate ${brand.name}? Its products and SKUs will be taken off the marketplace without deleting their records.`);
    if (!confirmed) return;
    setDeactivatingBrandId(brand.id);
    try {
      const result = await apiRequest(`/api/products/admin/brands/${brand.id}/deactivate/`, { method: 'POST' });
      toast.success('Brand Deactivated', `${brand.name} and ${result.deactivated_products || 0} related product(s) are now offline.`);
      await fetchManagedBrands();
    } catch (err) {
      const message = err.data?.detail || err.message || 'Could not deactivate this brand.';
      toast.error('Brand Deactivation Failed', typeof message === 'string' ? message : JSON.stringify(message));
    } finally {
      setDeactivatingBrandId(null);
    }
  };

  useEffect(() => {
    fetchCategories();
    fetchAttrRequests();
    fetchBrandRequests();
    fetchManagedBrands();
  }, []);

  // 1. Approve Request
  const handleApprove = async (type, item) => {
    setSubmittingAction(true);
    setActionError(null);
    try {
      const endpoint = type === 'attr'
        ? `/api/products/admin/attribute-value-requests/${item.id}/review/`
        : `/api/products/admin/brand-requests/${item.id}/review/`;

      await apiRequest(endpoint, {
        method: 'POST',
        body: JSON.stringify({ action: 'approve' })
      });

      if (type === 'attr') {
        setAttrRequests(prev => prev.filter(r => r.id !== item.id));
        toast.success("Attribute Value Approved", `Value "${item.requested_value}" is now available in category dropdowns.`);
      } else {
        setBrandRequests(prev => prev.filter(r => r.id !== item.id));
        toast.success("Brand Approved", `Official Brand "${item.requested_name}" is now available platform-wide.`);
      }
    } catch (err) {
      console.error("Failed to approve governance request:", err);
      const msg = err.data?.detail || err.message || "Failed to approve request.";
      toast.error("Approval Error", typeof msg === 'string' ? msg : JSON.stringify(msg));
    } finally {
      setSubmittingAction(false);
    }
  };

  // 2. Reject Request with Reason
  const handleRejectSubmit = async (e) => {
    e.preventDefault();
    if (!rejectingItem || !rejectReason.trim()) return;

    const { type, item } = rejectingItem;
    setSubmittingAction(true);
    setActionError(null);

    try {
      const endpoint = type === 'attr'
        ? `/api/products/admin/attribute-value-requests/${item.id}/review/`
        : `/api/products/admin/brand-requests/${item.id}/review/`;

      await apiRequest(endpoint, {
        method: 'POST',
        body: JSON.stringify({ action: 'reject', reason: rejectReason.trim() })
      });

      if (type === 'attr') {
        setAttrRequests(prev => prev.filter(r => r.id !== item.id));
        toast.success("Request Rejected", `Attribute value request #${item.id} rejected.`);
      } else {
        setBrandRequests(prev => prev.filter(r => r.id !== item.id));
        toast.success("Request Rejected", `Brand request #${item.id} rejected.`);
      }

      setRejectingItem(null);
      setRejectReason('');
    } catch (err) {
      console.error("Failed to reject governance request:", err);
      let msg = "Failed to reject request.";
      if (err.data) {
        if (typeof err.data === 'string') msg = err.data;
        else if (err.data.detail) msg = typeof err.data.detail === 'string' ? err.data.detail : JSON.stringify(err.data.detail);
        else if (err.data.reason) msg = Array.isArray(err.data.reason) ? err.data.reason[0] : err.data.reason;
      } else if (err.message) {
        msg = err.message;
      }
      setActionError(msg);
    } finally {
      setSubmittingAction(false);
    }
  };

  const pendingAttrCount = attrRequests.length;
  const pendingBrandCount = brandRequests.length;

  return (
    <div className="space-y-6">
      
      {/* 1. Module Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#EAE3DC]">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-1 rounded-lg bg-[#FFF3EC] text-[#FA661C]">
              <ShieldCheck className="w-4 h-4" />
            </span>
            <h2 className="font-['Outfit'] font-black text-xl text-[#FA661C]">
              Catalog & Taxonomy Governance Queue
            </h2>
          </div>
          <p className="text-xs text-[#6B6058] mt-0.5">
            Review vendor proposals for custom attribute values and new platform-wide official brands.
          </p>
        </div>

        <div className="flex items-center space-x-3 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => { fetchAttrRequests(); fetchBrandRequests(); fetchManagedBrands(); }}
            disabled={loadingAttr || loadingBrands || loadingManagedBrands}
            className="p-2 rounded-xl bg-white hover:bg-[#FFF3EC] border border-[#EAE3DC] text-[#FA661C] btn-interactive cursor-pointer disabled:opacity-50"
            title="Refresh Governance Queue"
          >
            <RefreshCw className={`w-4 h-4 ${(loadingAttr || loadingBrands || loadingManagedBrands) ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* 2. Navigation Tabs */}
      <div className="flex border-b border-[#EAE3DC] space-x-4">
        <button
          type="button"
          onClick={() => setActiveTab('attributes')}
          className={`pb-3 text-xs font-bold transition-colors cursor-pointer relative flex items-center space-x-2 ${
            activeTab === 'attributes'
              ? 'text-[#FA661C] border-b-2 border-[#FA661C]'
              : 'text-[#6B6058] hover:text-[#FA661C]'
          }`}
        >
          <Tag className="w-4 h-4" />
          <span>Attribute Value Requests</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] ${
            pendingAttrCount > 0 ? 'bg-[#FFF3EC] text-[#FA661C] font-black' : 'bg-gray-100 text-gray-600'
          }`}>
            {pendingAttrCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('brands')}
          className={`pb-3 text-xs font-bold transition-colors cursor-pointer relative flex items-center space-x-2 ${
            activeTab === 'brands'
              ? 'text-[#FA661C] border-b-2 border-[#FA661C]'
              : 'text-[#6B6058] hover:text-[#FA661C]'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Brand Authorization Requests</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] ${
            pendingBrandCount > 0 ? 'bg-[#FFF3EC] text-[#FA661C] font-black' : 'bg-gray-100 text-gray-600'
          }`}>
            {pendingBrandCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('brand-management')}
          className={`pb-3 text-xs font-bold transition-colors cursor-pointer relative flex items-center space-x-2 ${
            activeTab === 'brand-management'
              ? 'text-[#FA661C] border-b-2 border-[#FA661C]'
              : 'text-[#6B6058] hover:text-[#FA661C]'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Approved Brands</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] bg-gray-100 text-gray-600">{managedBrands.length}</span>
        </button>
      </div>


      {activeTab === 'brand-management' && (
        <section className="space-y-4" aria-label="Approved brand management">
          <div>
            <h3 className="font-['Outfit'] font-black text-lg text-[#FA661C]">Approved Brands</h3>
            <p className="text-xs text-[#6B6058]">Review seller authorization evidence. Deactivating a brand takes its products and SKUs offline while preserving their records.</p>
          </div>
          {managedBrandError && (
            <div role="alert" className="p-4 bg-[#FDE8EA] border border-[#D7263D]/30 rounded-2xl text-xs text-[#D7263D]">{managedBrandError}</div>
          )}
          {loadingManagedBrands ? (
            <div className="bg-white rounded-2xl border border-[#EAE3DC] p-6 text-center text-xs text-[#6B6058]">Loading approved brands…</div>
          ) : !managedBrandError && managedBrands.length === 0 ? (
            <div className="bg-white rounded-3xl border border-dashed border-[#EAE3DC] p-10 text-center text-xs text-[#6B6058]">No approved brands are in the catalog yet.</div>
          ) : !managedBrandError && (
            <div className="bg-white rounded-2xl border border-[#EAE3DC] overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead><tr className="bg-[#FFF3EC] text-[#FA661C] border-b border-[#EAE3DC] font-extrabold uppercase text-[10px] tracking-wider">
                    <th className="p-3">Brand</th><th className="p-3">Status</th><th className="p-3">Products</th><th className="p-3">Authorization Documents</th><th className="p-3 text-center">Action</th>
                  </tr></thead>
                  <tbody className="divide-y divide-[#EAE3DC]/60">
                    {managedBrands.map((brand) => (
                      <tr key={brand.id} className="align-top hover:bg-[#FFF8F2]/50">
                        <td className="p-3 font-bold text-[#1A2420]">{brand.name}</td>
                        <td className="p-3"><span className={`px-2 py-1 rounded-full text-[10px] font-bold ${brand.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}>{brand.is_active ? 'Active' : 'Deactivated'}</span></td>
                        <td className="p-3">{brand.product_count || 0}</td>
                        <td className="p-3">
                          {brand.authorization_documents?.length ? (
                            <ul className="space-y-2">{brand.authorization_documents.map((doc) => (
                              <li key={`${brand.id}-${doc.product_id}`} className="flex flex-col gap-0.5">
                                <button type="button" onClick={() => openProtectedFile(doc.document_access_url).catch((err) => toast.error('Document Unavailable', err.message || 'Could not open the authorization document.'))} className="inline-flex items-center gap-1 font-bold text-[#FA661C] underline">
                                  <ExternalLink className="w-3 h-3" /> {doc.product_name} — View authorization
                                </button>
                                <span className="text-[10px] text-[#6B6058]">{doc.vendor_name}</span>
                              </li>
                            ))}</ul>
                          ) : <span className="text-[#6B6058]">No authorization documents recorded</span>}
                        </td>
                        <td className="p-3 text-center">
                          {brand.is_active ? (
                            <button type="button" onClick={() => handleDeactivateBrand(brand)} disabled={deactivatingBrandId === brand.id}
                              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#FDE8EA] text-[#D7263D] font-bold hover:bg-[#fbd7dc] disabled:opacity-50">
                              <Power className="w-3.5 h-3.5" /> {deactivatingBrandId === brand.id ? 'Deactivating…' : 'Deactivate'}
                            </button>
                          ) : <span className="text-[10px] text-[#6B6058]">Products offline</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>
      )}

      {/* TAB 1: ATTRIBUTE VALUE REQUESTS */}
      {activeTab === 'attributes' && (
        <AttributeRequestCards
          requests={attrRequests}
          categories={categories}
          loading={loadingAttr}
          error={attrError}
          submittingAction={submittingAction}
          onApprove={(req) => handleApprove('attr', req)}
          onReject={(req) => { setRejectingItem({ type: 'attr', item: req }); setRejectReason(''); setActionError(null); }}
        />
      )}

      {/* TAB 2: BRAND REQUESTS */}
      {activeTab === 'brands' && (
        <div className="space-y-4">
          {brandError && (
            <div className="p-4 bg-[#FDE8EA] border border-[#D7263D]/30 rounded-2xl flex items-start space-x-3 text-xs text-[#D7263D]">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <div className="flex-1">
                <div className="font-bold">Error Loading Brand Requests</div>
                <p className="mt-0.5">{brandError}</p>
              </div>
            </div>
          )}

          {loadingBrands && (
            <div className="bg-white rounded-2xl border border-[#EAE3DC] p-6 text-center animate-pulse text-xs text-[#6B6058]">
              Loading pending brand authorization requests from backend API...
            </div>
          )}

          {!loadingBrands && !brandError && brandRequests.length === 0 && (
            <div className="bg-white rounded-3xl border border-dashed border-[#EAE3DC] p-10 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-[#FFF3EC] text-[#FA661C] mx-auto flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-[#52B788]" />
              </div>
              <h3 className="font-['Outfit'] font-bold text-base text-[#FA661C]">
                Brand Governance Queue Clear
              </h3>
              <p className="text-xs text-[#6B6058] max-w-md mx-auto">
                No pending official brand requests. Requests submitted by sellers for adding official brands will appear here for admin review.
              </p>
            </div>
          )}

          {!loadingBrands && !brandError && brandRequests.length > 0 && (
            <div className="bg-white rounded-2xl border border-[#EAE3DC] overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-[#FFF3EC] text-[#FA661C] border-b border-[#EAE3DC] font-extrabold uppercase text-[10px] tracking-wider">
                      <th className="p-3">Merchant / Store</th>
                      <th className="p-3">Requested Official Brand Name</th>
                      <th className="p-3">Vendor Justification / Reason</th>
                      <th className="p-3 text-center">Submitted At</th>
                      <th className="p-3 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EAE3DC]/60 font-medium">
                    {brandRequests.map((req) => (
                      <tr key={req.id} className="hover:bg-[#FFF8F2]/50 transition-colors">
                        <td className="p-3">
                          <span className="font-bold text-[#FA661C] block">{req.vendor_name || 'Vendor'}</span>
                          <span className="text-[10px] text-[#6B6058]">Brand Req #{req.id}</span>
                        </td>
                        <td className="p-3">
                          <span className="font-extrabold text-[#FA661C] bg-[#FFF3EC] border border-[#FA661C]/30 px-2.5 py-1 rounded-lg inline-flex items-center space-x-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-[#FF811A]" />
                            <span>{req.requested_name}</span>
                          </span>
                        </td>
                        <td className="p-3 text-[#6B6058] max-w-xs">
                          {req.reason || 'No justification provided.'}
                        </td>
                        <td className="p-3 text-center text-[10px] text-[#6B6058]">
                          {req.created_at ? new Date(req.created_at).toLocaleString() : 'N/A'}
                        </td>
                        <td className="p-3 text-center">
                          <div className="flex items-center justify-center space-x-2">
                            <button
                              type="button"
                              disabled={submittingAction}
                              onClick={() => handleApprove('brand', req)}
                              className="px-3 py-1.5 rounded-xl bg-[#52B788] text-white font-bold text-[10px] hover:bg-[#40916C] transition-colors cursor-pointer shadow-xs inline-flex items-center space-x-1"
                            >
                              <Check className="w-3 h-3" />
                              <span>Approve Brand</span>
                            </button>
                            <button
                              type="button"
                              disabled={submittingAction}
                              onClick={() => { setRejectingItem({ type: 'brand', item: req }); setRejectReason(''); setActionError(null); }}
                              className="px-3 py-1.5 rounded-xl bg-[#D7263D] text-white font-bold text-[10px] hover:bg-[#B01E30] transition-colors cursor-pointer shadow-xs inline-flex items-center space-x-1"
                            >
                              <Ban className="w-3 h-3" />
                              <span>Reject</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 3. Rejection Reason Modal */}
      {rejectingItem && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-[#EAE3DC] w-full max-w-md shadow-2xl p-6 space-y-4 animate-reveal">
            
            <div className="flex items-start justify-between pb-3 border-b border-[#EAE3DC]">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#D7263D] bg-[#FDE8EA] px-2.5 py-0.5 rounded-full">
                  GOVERNANCE REJECTION
                </span>
                <h3 className="font-['Outfit'] text-lg font-black text-[#FA661C] mt-1">
                  Reject {rejectingItem.type === 'attr' ? 'Attribute Value Request' : 'Brand Request'}
                </h3>
              </div>

              <button
                type="button"
                onClick={() => setRejectingItem(null)}
                className="p-1 rounded-xl text-[#6B6058] hover:bg-gray-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {actionError && (
              <div className="p-3 bg-[#FDE8EA] border border-[#D7263D]/30 rounded-xl text-xs text-[#D7263D] font-semibold flex items-start space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <div className="flex-1">{actionError}</div>
              </div>
            )}

            <div className="text-xs text-[#6B6058] space-y-1">
              <div><strong className="text-[#FA661C]">Vendor:</strong> {rejectingItem.item.vendor_name || 'Vendor'}</div>
              <div>
                <strong className="text-[#FA661C]">Requested Item:</strong>{' '}
                {rejectingItem.type === 'attr'
                  ? `"${rejectingItem.item.requested_value}" for ${rejectingItem.item.category_attribute_name}`
                  : `Brand "${rejectingItem.item.requested_name}"`}
              </div>
            </div>

            <form onSubmit={handleRejectSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#FA661C] mb-1">
                  Rejection Reason <span className="text-[#D7263D]">* (Required)</span>
                </label>
                <textarea
                  rows={3}
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Specify why this governance request is being rejected (e.g. Invalid formatting, duplicate entry, trademark issue)..."
                  className="w-full p-3 rounded-xl border border-[#EAE3DC] text-xs text-[#FA661C] focus:outline-none focus:border-[#FA661C] bg-white"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRejectingItem(null)}
                  className="px-4 py-2 rounded-xl bg-gray-100 text-gray-700 font-bold text-xs hover:bg-gray-200 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingAction || !rejectReason.trim()}
                  className="px-4 py-2 rounded-xl bg-[#D7263D] text-white font-bold text-xs hover:bg-[#B01E30] transition-colors cursor-pointer disabled:opacity-50 shadow-md"
                >
                  {submittingAction ? "Submitting..." : "Confirm Rejection"}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}
