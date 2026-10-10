import React, { useState, useEffect } from 'react';
import { 
  Package, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  RefreshCw, 
  ExternalLink, 
  Store, 
  Tag, 
  FileText, 
  Layers, 
  ChevronDown, 
  ChevronUp, 
  ShieldCheck, 
  Clock,
  DollarSign,
  Search
} from 'lucide-react';
import { apiRequest, openProtectedFile } from '../../../utils/api';
import { useToast } from '../../../context/ToastContext';

export default function ProductReviewModule() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Rejection modal state
  const [rejectModalProduct, setRejectModalProduct] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectError, setRejectError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Expanded detail drawer / card state
  const [expandedProductId, setExpandedProductId] = useState(null);
  const [activeTab, setActiveTab] = useState('pending');
  const [approvedProducts, setApprovedProducts] = useState([]);
  const [approvedLoading, setApprovedLoading] = useState(false);
  const [approvedError, setApprovedError] = useState(null);
  const [approvedSearch, setApprovedSearch] = useState('');

  const toast = useToast();

  const fetchPendingProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiRequest('/api/products/admin/products/');
      setProducts(Array.isArray(data) ? data : (data.results || []));
    } catch (err) {
      console.error("Failed to fetch pending products:", err);
      setError(err.data?.detail || err.message || "Failed to load pending products queue.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingProducts();
  }, []);

  useEffect(() => {
    if (activeTab !== 'approved') return undefined;
    const timer = window.setTimeout(async () => {
      setApprovedLoading(true);
      setApprovedError(null);
      try {
        const query = approvedSearch.trim() ? `?search=${encodeURIComponent(approvedSearch.trim())}` : '';
        const data = await apiRequest(`/api/products/admin/products/approved/${query}`);
        setApprovedProducts(Array.isArray(data) ? data : (data.results || []));
      } catch (err) {
        setApprovedError(err.data?.detail || err.message || 'Could not load approved products.');
      } finally {
        setApprovedLoading(false);
      }
    }, approvedSearch ? 250 : 0);
    return () => window.clearTimeout(timer);
  }, [activeTab, approvedSearch]);

  const handleApprove = async (product) => {
    setIsSubmitting(true);
    try {
      await apiRequest(`/api/products/admin/products/${product.id}/review/`, {
        method: 'POST',
        body: JSON.stringify({ action: 'approve' })
      });

      toast.success(
        "Product Approved", 
        `"${product.name}" has been approved and published to the marketplace.`
      );

      // Remove approved product from pending queue
      setProducts(prev => prev.filter(p => p.id !== product.id));
    } catch (err) {
      console.error("Approval failed:", err);
      const msg = err.data?.detail || err.message || "Failed to approve product.";
      toast.error("Approval Failed", msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenRejectModal = (product) => {
    setRejectModalProduct(product);
    setRejectReason('');
    setRejectError('');
  };

  const handleConfirmReject = async () => {
    if (!rejectReason.trim()) {
      setRejectError('Please enter a rejection reason.');
      return;
    }

    setIsSubmitting(true);
    setRejectError('');
    try {
      await apiRequest(`/api/products/admin/products/${rejectModalProduct.id}/review/`, {
        method: 'POST',
        body: JSON.stringify({
          action: 'reject',
          reason: rejectReason.trim()
        })
      });

      toast.success(
        "Product Rejected", 
        `"${rejectModalProduct.name}" was rejected. Feedback sent to seller.`
      );

      // Remove rejected product from pending queue
      setProducts(prev => prev.filter(p => p.id !== rejectModalProduct.id));
      setRejectModalProduct(null);
      setRejectReason('');
    } catch (err) {
      console.error("Rejection failed:", err);
      const msg = err.data?.detail || err.message || "Failed to reject product.";
      setRejectError(typeof msg === 'string' ? msg : JSON.stringify(msg));
      toast.error("Rejection Failed", "Unable to complete rejection. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleExpand = (id) => {
    setExpandedProductId(prev => prev === id ? null : id);
  };

  return (
    <div className="space-y-6">
      
      {/* 1. Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#EAE3DC]">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-1.5 rounded-xl bg-[#FFF3EC] text-[#FA661C]">
              <Package className="w-5 h-5" />
            </span>
            <h2 className="font-['Outfit'] font-black text-xl text-[#FA661C]">
              Product Review & Compliance Queue
            </h2>
          </div>
          <p className="text-xs text-[#6B6058] mt-0.5">
            Review vendor listing submissions, brand authorizations, attributes, and SKU variations before publishing live.
          </p>
        </div>

        <div className="flex items-center space-x-3 self-start sm:self-auto">
          <span className="text-xs font-bold text-[#FA661C] bg-[#FFF3EC] border border-[#FF811A]/30 px-3 py-1.5 rounded-xl flex items-center space-x-1.5">
            <Clock className="w-4 h-4 text-[#FF811A]" />
            <span>{products.length} Pending Review</span>
          </span>

          <button
            type="button"
            onClick={fetchPendingProducts}
            disabled={loading}
            className="p-2 rounded-xl bg-white hover:bg-[#FFF3EC] border border-[#EAE3DC] text-[#FA661C] btn-interactive cursor-pointer disabled:opacity-50"
            title="Refresh Queue"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="flex gap-2 border-b border-[#EAE3DC]">
        <button type="button" onClick={() => setActiveTab('pending')} className={`px-4 py-2.5 text-sm font-bold border-b-2 ${activeTab === 'pending' ? 'border-[#FA661C] text-[#FA661C]' : 'border-transparent text-[#6B6058] hover:text-[#1A2420]'}`}>
          Pending Review <span className="ml-1 rounded-full bg-[#FFF3EC] px-2 py-0.5 text-xs">{products.length}</span>
        </button>
        <button type="button" onClick={() => setActiveTab('approved')} className={`px-4 py-2.5 text-sm font-bold border-b-2 ${activeTab === 'approved' ? 'border-[#FA661C] text-[#FA661C]' : 'border-transparent text-[#6B6058] hover:text-[#1A2420]'}`}>
          Approved Products
        </button>
      </div>

      {activeTab === 'approved' && (
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-['Outfit'] font-black text-lg text-[#1A2420]">Approved Products</h3>
              <p className="text-xs text-[#6B6058]">Search published listings by product, seller, brand, SKU, or category.</p>
            </div>
            <span className="text-xs font-bold text-[#1A2420] bg-[#F0F8F4] border border-emerald-200 px-3 py-1.5 rounded-xl">{approvedProducts.length} listing{approvedProducts.length !== 1 ? 's' : ''}</span>
          </div>
          <label className="flex items-center gap-2 rounded-xl border border-[#EAE3DC] bg-white px-3 py-2.5 focus-within:border-[#FA661C]">
            <Search className="h-4 w-4 shrink-0 text-[#8A7D73]" />
            <input value={approvedSearch} onChange={(event) => setApprovedSearch(event.target.value)} placeholder="Search product, seller, brand, SKU, or category..." className="w-full bg-transparent text-sm outline-none placeholder:text-[#A89B91]" />
          </label>
          {approvedError && <div role="alert" className="rounded-xl border border-[#D7263D]/30 bg-[#FDE8EA] p-3 text-sm text-[#D7263D]">{approvedError}</div>}
          {approvedLoading ? (
            <div className="rounded-2xl border border-[#EAE3DC] bg-white p-8 text-center text-sm text-[#6B6058]">Loading approved products?</div>
          ) : approvedProducts.length ? (
            <div className="overflow-x-auto rounded-2xl border border-[#EAE3DC] bg-white">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead className="bg-[#FFF8F2] text-[11px] uppercase tracking-wide text-[#6B6058]"><tr><th className="p-3">Product</th><th className="p-3">Seller</th><th className="p-3">Category</th><th className="p-3">Brand</th><th className="p-3">SKU</th><th className="p-3">Status</th></tr></thead>
                <tbody className="divide-y divide-[#EAE3DC]">{approvedProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-[#FFF8F2]/60">
                    <td className="p-3"><div className="font-bold text-[#1A2420]">{product.name}</div><div className="text-xs text-[#8A7D73]">Product #{product.id}</div></td>
                    <td className="p-3">{product.vendor_business_name || '?'}</td>
                    <td className="p-3">{product.category_name || '?'}</td>
                    <td className="p-3">{product.official_brand_name || '?'}</td>
                    <td className="p-3 font-mono text-xs">{product.variants?.map((variant) => variant.sku_code).filter(Boolean).join(', ') || '?'}</td>
                    <td className="p-3"><span className={`rounded-full px-2 py-1 text-[10px] font-bold ${product.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}>{product.is_active ? 'Live' : 'Deactivated'}</span></td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-[#EAE3DC] bg-white p-8 text-center text-sm text-[#6B6058]">{approvedSearch ? 'No approved products match your search.' : 'No approved products yet.'}</div>
          )}
        </section>
      )}

      {/* 2. Error Banner if API fetch failed */}
      {activeTab === 'pending' && error && (
        <div className="p-4 bg-[#FDE8EA] border border-[#D7263D]/30 rounded-2xl flex items-start space-x-3 text-xs text-[#D7263D]">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="font-bold">Error Loading Product Queue</div>
            <p className="mt-0.5">{error}</p>
          </div>
          <button
            type="button"
            onClick={fetchPendingProducts}
            className="px-3 py-1 bg-[#D7263D] text-white rounded-lg text-xs font-bold hover:bg-[#b01c30] transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {/* 3. Loading State Skeleton */}
      {activeTab === 'pending' && loading && (
        <div className="space-y-4">
          {[1, 2].map(n => (
            <div key={n} className="bg-white rounded-2xl border border-[#EAE3DC] p-6 animate-pulse space-y-4">
              <div className="h-6 bg-[#EAE3DC]/60 rounded-md w-1/3" />
              <div className="h-4 bg-[#EAE3DC]/40 rounded-md w-1/2" />
              <div className="h-20 bg-[#FFF8F2] rounded-xl" />
            </div>
          ))}
        </div>
      )}

      {/* 4. Empty Queue State */}
      {activeTab === 'pending' && !loading && !error && products.length === 0 && (
        <div className="bg-white rounded-3xl border border-dashed border-[#EAE3DC] p-10 text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-[#FFF3EC] text-[#FA661C] mx-auto flex items-center justify-center">
            <CheckCircle2 className="w-8 h-8 text-[#52B788]" />
          </div>
          <h3 className="font-['Outfit'] font-bold text-lg text-[#FA661C]">
            Product Review Queue is Clear
          </h3>
          <p className="text-xs text-[#6B6058] max-w-md mx-auto">
            All vendor-submitted product listings have been reviewed and processed. New vendor submissions will appear here automatically.
          </p>
        </div>
      )}

      {/* 5. Real Pending Products List */}
      {activeTab === 'pending' && !loading && !error && products.length > 0 && (
        <div className="space-y-4">
          {products.map((product) => {
            const isExpanded = expandedProductId === product.id;
            const primaryImage = product.images?.find(i => i.is_primary)?.image || product.images?.[0]?.image;
            const variantCount = product.variants?.length || 0;
            const attributeCount = product.attribute_values?.length || 0;
            const firstVariantPrice = product.variants?.[0]?.price;

            return (
              <div 
                key={product.id}
                className="bg-white rounded-2xl border border-[#EAE3DC] shadow-xs overflow-hidden transition-all hover:border-[#FF811A]/40"
              >
                {/* Main Summary Header Row */}
                <div className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  
                  {/* Left: Thumbnail & Core Metadata */}
                  <div className="flex items-start space-x-4 min-w-0">
                    {/* Thumbnail Image */}
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-[#FFF8F2] border border-[#EAE3DC] overflow-hidden shrink-0 flex items-center justify-center">
                      {primaryImage ? (
                        <img 
                          src={primaryImage} 
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Package className="w-8 h-8 text-[#FF811A]/50" />
                      )}
                    </div>

                    {/* Meta Stack */}
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                        <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-[#FDE8EA] text-[#D7263D] border border-[#D7263D]/30">
                          {product.status || 'pending_review'}
                        </span>
                        
                        {product.category_name && (
                          <span className="text-[10px] font-bold text-[#6B6058] bg-[#FFF8F2] border border-[#EAE3DC] px-2 py-0.5 rounded-md flex items-center space-x-1">
                            <Tag className="w-3 h-3 text-[#FF811A]" />
                            <span>{product.category_name}</span>
                          </span>
                        )}

                        {product.official_brand_name && (
                          <span className="text-[10px] font-bold text-[#FA661C] bg-[#FFF3EC] px-2 py-0.5 rounded-md flex items-center space-x-1">
                            <ShieldCheck className="w-3 h-3 text-[#FF811A]" />
                            <span>Brand: {product.official_brand_name}</span>
                          </span>
                        )}
                      </div>

                      <h3 className="font-['Outfit'] font-bold text-base text-[#FA661C] truncate">
                        {product.name}
                      </h3>

                      <div className="flex items-center space-x-4 text-xs text-[#6B6058] flex-wrap">
                        {product.vendor_business_name && (
                          <span className="flex items-center space-x-1 font-medium text-[#1A2420]">
                            <Store className="w-3.5 h-3.5 text-[#FA661C]" />
                            <span>{product.vendor_business_name}</span>
                          </span>
                        )}

                        {firstVariantPrice && (
                          <span className="font-bold text-[#FA661C]">
                            {product.base_currency || 'INR'} {Number(firstVariantPrice).toLocaleString()}
                          </span>
                        )}

                        <span className="text-[11px] text-[#6B6058]">
                          {variantCount} SKU Variant{variantCount !== 1 ? 's' : ''} • {attributeCount} Attributes
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Action Buttons */}
                  <div className="flex items-center space-x-2 self-end md:self-center shrink-0">
                    <button
                      type="button"
                      onClick={() => toggleExpand(product.id)}
                      className="px-3 py-1.5 rounded-xl border border-[#EAE3DC] bg-[#FFFFFF] hover:bg-[#FFF3EC] text-xs font-bold text-[#6B6058] flex items-center space-x-1 btn-interactive cursor-pointer"
                    >
                      <span>{isExpanded ? 'Hide Details' : 'Review Details'}</span>
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOpenRejectModal(product)}
                      disabled={isSubmitting}
                      className="px-3.5 py-1.5 rounded-xl bg-[#FDE8EA] hover:bg-[#f8d0d4] border border-[#D7263D]/30 text-[#D7263D] text-xs font-bold flex items-center space-x-1.5 btn-interactive cursor-pointer disabled:opacity-50"
                    >
                      <XCircle className="w-4 h-4" />
                      <span>Reject</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleApprove(product)}
                      disabled={isSubmitting}
                      className="px-4 py-1.5 rounded-xl bg-[#FA661C] hover:bg-[#E0530B] text-white text-xs font-bold flex items-center space-x-1.5 btn-interactive cursor-pointer shadow-xs disabled:opacity-50"
                    >
                      <CheckCircle2 className="w-4 h-4 text-[#FF811A]" />
                      <span>Approve Product</span>
                    </button>
                  </div>

                </div>

                {/* Expanded Listing Compliance Audit View */}
                {isExpanded && (
                  <div className="border-t border-[#EAE3DC] bg-[#FFF8F2]/60 p-5 space-y-5 animate-reveal text-xs">
                    
                    {/* Description */}
                    <div>
                      <h4 className="font-bold text-[#FA661C] uppercase text-[10px] tracking-wider mb-1">
                        Product Description & Listing Content
                      </h4>
                      <p className="text-[#6B6058] bg-white p-3 rounded-xl border border-[#EAE3DC] leading-relaxed">
                        {product.description || 'No detailed description provided.'}
                      </p>
                    </div>

                    {/* Grid: Variants + Attributes + Brand Authorization */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      
                      {/* SKUs / Variants Table */}
                      <div className="bg-white p-3.5 rounded-xl border border-[#EAE3DC] space-y-2">
                        <h4 className="font-bold text-[#FA661C] uppercase text-[10px] tracking-wider flex items-center space-x-1">
                          <Layers className="w-3.5 h-3.5 text-[#FF811A]" />
                          <span>SKU Variants ({product.variants?.length || 0})</span>
                        </h4>

                        {product.variants?.length > 0 ? (
                          <div className="overflow-x-auto">
                            <table className="w-full text-left text-[11px]">
                              <thead>
                                <tr className="border-b border-[#EAE3DC] text-[#6B6058] font-bold">
                                  <th className="pb-1">SKU Code</th>
                                  <th className="pb-1">Attributes</th>
                                  <th className="pb-1 text-right">Price</th>
                                  <th className="pb-1 text-right">Stock</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-[#EAE3DC]/60 font-medium">
                                {product.variants.map((v) => (
                                  <tr key={v.id || v.sku_code}>
                                    <td className="py-1.5 font-mono text-[#FA661C] font-bold">{v.sku_code}</td>
                                    <td className="py-1.5 text-[#6B6058]">
                                      {typeof v.attributes === 'object' 
                                        ? Object.entries(v.attributes).map(([k, val]) => `${k}: ${val}`).join(', ')
                                        : JSON.stringify(v.attributes)}
                                    </td>
                                    <td className="py-1.5 text-right font-bold">₹{v.price}</td>
                                    <td className="py-1.5 text-right text-[#6B6058]">{v.stock_quantity} units</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <p className="text-[#6B6058] text-[11px] italic">No SKU variants configured yet.</p>
                        )}
                      </div>

                      {/* Category Attributes & Compliance Info */}
                      <div className="bg-white p-3.5 rounded-xl border border-[#EAE3DC] space-y-2">
                        <h4 className="font-bold text-[#FA661C] uppercase text-[10px] tracking-wider flex items-center space-x-1">
                          <FileText className="w-3.5 h-3.5 text-[#FF811A]" />
                          <span>Dynamic Attributes & Tax HSN</span>
                        </h4>

                        <div className="space-y-1.5 text-[11px]">
                          <div className="flex justify-between py-1 border-b border-[#EAE3DC]/60">
                            <span className="text-[#6B6058]">HSN Code:</span>
                            <span className="font-mono font-bold text-[#FA661C]">{product.hsn_code || 'N/A'}</span>
                          </div>
                          
                          <div className="flex justify-between py-1 border-b border-[#EAE3DC]/60">
                            <span className="text-[#6B6058]">Base Currency:</span>
                            <span className="font-bold text-[#FA661C]">{product.base_currency}</span>
                          </div>

                          {product.attribute_values?.map(attr => (
                            <div key={attr.id} className="flex justify-between py-1 border-b border-[#EAE3DC]/40">
                              <span className="text-[#6B6058]">{attr.attribute_name}:</span>
                              <span className="font-bold text-[#1A2420]">
                                {attr.selected_value || attr.value_name || attr.raw_value || 'N/A'}
                              </span>
                            </div>
                          ))}
                        </div>

                        {/* Brand Authorization Document if attached */}
                        {(product.official_brand_name || product.attribute_values?.some((attr) => attr.attribute_name?.toLowerCase() === 'brand' && (attr.selected_value || attr.raw_value))) && (
                          <div className="pt-2 border-t border-[#EAE3DC]">
                            {product.brand_authorization?.document ? (
                              <button
                                type="button"
                                onClick={() => openProtectedFile(product.brand_authorization_access_url).catch((err) => toast.error('Document Unavailable', err.message || 'Could not open the authorization document.'))}
                                className="text-xs text-[#FF811A] font-bold underline flex items-center space-x-1 hover:text-[#FA661C]"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                                <span>Review Brand Authorization Document</span>
                              </button>
                            ) : (
                              <p className="text-xs font-bold text-[#D7263D]">No brand authorization document is attached. Approval is blocked until the seller provides one.</p>
                            )}
                          </div>
                        )}
                      </div>

                    </div>

                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* 6. Rejection Modal with Mandatory Reason */}
      {rejectModalProduct && (
        <div className="fixed inset-0 bg-[#1A1A1A]/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-[#EAE3DC] p-6 max-w-md w-full shadow-2xl space-y-4 animate-scale-up">
            
            <div className="flex items-center space-x-3 pb-3 border-b border-[#EAE3DC]">
              <span className="p-2 rounded-xl bg-[#FDE8EA] text-[#D7263D]">
                <XCircle className="w-6 h-6" />
              </span>
              <div>
                <h3 className="font-['Outfit'] font-extrabold text-lg text-[#FA661C]">
                  Reject Product Listing
                </h3>
                <p className="text-xs text-[#6B6058]">
                  Provide a mandatory audit reason for the seller.
                </p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#FA661C] mb-1">
                Target Product
              </label>
              <div className="p-2.5 bg-[#FFF8F2] rounded-xl border border-[#EAE3DC] font-bold text-xs text-[#1A2420]">
                {rejectModalProduct.name} (ID: #{rejectModalProduct.id})
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#FA661C] mb-1">
                Rejection Reason <span className="text-[#D7263D]">*</span>
              </label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="e.g. Missing required brand authorization document; dynamic attribute values do not match HSN tax tier..."
                rows={4}
                className="w-full text-xs p-3 rounded-xl border border-[#EAE3DC] focus:border-[#FA661C] outline-none text-[#1A2420]"
              />
              {rejectError && (
                <p className="text-[11px] font-bold text-[#D7263D] mt-1 flex items-center space-x-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>{rejectError}</span>
                </p>
              )}
            </div>

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setRejectModalProduct(null)}
                disabled={isSubmitting}
                className="px-4 py-2 rounded-xl border border-[#EAE3DC] text-xs font-bold text-[#6B6058] hover:bg-[#FFF3EC] btn-interactive cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleConfirmReject}
                disabled={isSubmitting}
                className="px-4 py-2 rounded-xl bg-[#D7263D] hover:bg-[#b01c30] text-white text-xs font-bold btn-interactive cursor-pointer disabled:opacity-50 flex items-center space-x-1.5"
              >
                {isSubmitting ? (
                  <span>Processing...</span>
                ) : (
                  <>
                    <XCircle className="w-4 h-4" />
                    <span>Confirm Rejection</span>
                  </>
                )}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
