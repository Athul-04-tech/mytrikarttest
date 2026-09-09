import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Package, 
  Tag, 
  Layers, 
  ImageIcon, 
  Star, 
  AlertCircle, 
  Loader2, 
  FileText, 
  Globe, 
  CheckCircle2, 
  XCircle,
  Clock,
  Edit3,
  Trash2
} from 'lucide-react';
import { apiRequest } from '../utils/api';
import { useToast } from '../context/ToastContext';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

export default function SellerProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  // Delete modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    async function fetchProductDetail() {
      if (!id) return;
      setLoading(true);
      setError(null);

      try {
        const data = await apiRequest(`/api/products/vendor/products/${id}/detail/`);
        if (isMounted) {
          setProduct(data);
          // Set initial selected image to primary image index if available
          if (data?.images && data.images.length > 0) {
            const primaryIdx = data.images.findIndex(img => img.is_primary);
            setSelectedImageIndex(primaryIdx >= 0 ? primaryIdx : 0);
          }
        }
      } catch (err) {
        if (isMounted) {
          const msg = err?.data?.detail || err?.data?.message || err?.message || 'Unable to fetch product details.';
          setError(msg);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchProductDetail();
    return () => { isMounted = false; };
  }, [id]);

  const getImageUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    return `${BASE_URL}${url.startsWith('/') ? '' : '/'}${url}`;
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'published':
        return (
          <span className="px-3 py-1 bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/30 rounded-full text-xs font-extrabold uppercase tracking-wider flex items-center space-x-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Published</span>
          </span>
        );
      case 'pending_review':
        return (
          <span className="px-3 py-1 bg-[#F59E0B]/10 text-[#F59E0B] border border-[#F59E0B]/30 rounded-full text-xs font-extrabold uppercase tracking-wider flex items-center space-x-1.5">
            <Clock className="w-3.5 h-3.5" />
            <span>Pending Review</span>
          </span>
        );
      case 'rejected':
        return (
          <span className="px-3 py-1 bg-[#D7263D]/10 text-[#D7263D] border border-[#D7263D]/30 rounded-full text-xs font-extrabold uppercase tracking-wider flex items-center space-x-1.5">
            <XCircle className="w-3.5 h-3.5" />
            <span>Rejected</span>
          </span>
        );
      default:
        return (
          <span className="px-3 py-1 bg-gray-100 text-gray-700 border border-gray-300 rounded-full text-xs font-extrabold uppercase tracking-wider flex items-center space-x-1.5">
            <FileText className="w-3.5 h-3.5" />
            <span>Draft</span>
          </span>
        );
    }
  };

  const handleDeleteProduct = async () => {
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await apiRequest(`/api/products/vendor/products/${id}/`, {
        method: 'DELETE'
      });
      toast.success("Product Deleted", `Product #${id} has been permanently deleted.`);
      setShowDeleteModal(false);
      navigate('/seller/products');
    } catch (err) {
      const msg = err?.data?.detail || err?.data?.message || err?.message || 'Failed to delete product.';
      setDeleteError(msg);
      toast.error("Deletion Failed", msg);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F9F6F0] text-[#1A2420] p-4 sm:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto space-y-6 animate-reveal">
        
        {/* Navigation & Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-[#EAE3DC] shadow-2xs">
          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={() => navigate('/seller/products')}
              className="p-2 rounded-2xl bg-[#FFF3EC] hover:bg-[#FF811A]/20 text-[#FA661C] transition-all cursor-pointer"
              title="Back to Catalog"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-mono font-bold text-[#6B6058]">Product #{id}</span>
                {product && getStatusBadge(product.status)}
              </div>
              <h1 className="font-['Outfit'] text-xl sm:text-2xl font-black text-[#FA661C] tracking-tight mt-0.5">
                {product ? product.name : `Product Specification #${id}`}
              </h1>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Link
              to={`/seller/products/${id}/edit`}
              className="px-4 py-2 bg-[#FFF3EC] hover:bg-[#FF811A]/20 text-[#FA661C] border border-[#FF811A]/40 rounded-xl text-xs font-extrabold flex items-center space-x-1.5 transition-all cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit Media &amp; Product</span>
            </Link>
            <button
              type="button"
              onClick={() => { setDeleteError(null); setShowDeleteModal(true); }}
              className="px-4 py-2 bg-[#FDE8EA] hover:bg-[#D7263D]/20 text-[#D7263D] border border-[#D7263D]/40 rounded-xl text-xs font-extrabold flex items-center space-x-1.5 transition-all cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Product</span>
            </button>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="bg-white p-12 rounded-3xl border border-[#EAE3DC] text-center space-y-3">
            <Loader2 className="w-8 h-8 text-[#FA661C] animate-spin mx-auto" />
            <h2 className="font-['Outfit'] font-extrabold text-base text-[#FA661C]">
              Fetching product details from server...
            </h2>
            <p className="text-xs text-[#6B6058]">
              Retrieving full media gallery, variant rows, and category specifications.
            </p>
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <div className="bg-white p-8 rounded-3xl border-2 border-[#D7263D] space-y-4 text-center">
            <div className="p-3 bg-[#FDE8EA] text-[#D7263D] rounded-full w-fit mx-auto">
              <AlertCircle className="w-8 h-8" />
            </div>
            <div className="max-w-md mx-auto space-y-1">
              <h2 className="font-['Outfit'] font-black text-lg text-[#D7263D]">
                Unable to Load Product Specification
              </h2>
              <p className="text-xs font-medium text-[#6B6058]">{error}</p>
            </div>
            <button
              type="button"
              onClick={() => navigate('/seller/products')}
              className="px-5 py-2.5 bg-[#FA661C] hover:bg-[#E0530B] text-white rounded-xl text-xs font-extrabold inline-flex items-center space-x-2 shadow-xs cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Return to Catalog List</span>
            </button>
          </div>
        )}

        {/* Product Content Details */}
        {!loading && !error && product && (
          <div className="space-y-6">
            
            {/* Top Grid: Gallery + Product Overview */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Left Column: Image Gallery (5 cols) */}
              <div className="lg:col-span-5 bg-white p-5 rounded-3xl border border-[#EAE3DC] shadow-2xs space-y-4 flex flex-col justify-between">
                <div>
                  <h3 className="font-['Outfit'] font-bold text-xs uppercase tracking-wider text-[#FA661C] mb-3 flex items-center space-x-1.5">
                    <ImageIcon className="w-4 h-4 text-[#FA661C]" />
                    <span>Product Gallery ({product.images?.length || 0})</span>
                  </h3>

                  {product.images && product.images.length > 0 ? (
                    <div className="space-y-3">
                      {/* Primary Featured Image Window */}
                      <div className="relative aspect-square rounded-2xl bg-[#FFF3EC]/40 border border-[#EAE3DC] overflow-hidden group">
                        <img
                          src={getImageUrl(product.images[selectedImageIndex]?.image)}
                          alt={product.name}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />

                        {product.images[selectedImageIndex]?.is_primary && (
                          <span className="absolute top-3 left-3 bg-[#FA661C] text-white text-[10px] font-black uppercase px-2.5 py-1 rounded-full shadow-xs flex items-center space-x-1">
                            <Star className="w-3 h-3 fill-current" />
                            <span>Primary Thumbnail</span>
                          </span>
                        )}
                      </div>

                      {/* Thumbnail Bar */}
                      <div className="flex items-center space-x-2 overflow-x-auto pb-1">
                        {product.images.map((img, idx) => (
                          <button
                            key={img.id}
                            type="button"
                            onClick={() => setSelectedImageIndex(idx)}
                            className={`w-14 h-14 rounded-xl border-2 overflow-hidden shrink-0 transition-all cursor-pointer ${
                              selectedImageIndex === idx
                                ? 'border-[#FA661C] ring-2 ring-[#FA661C]/20 scale-105'
                                : 'border-[#EAE3DC] opacity-70 hover:opacity-100'
                            }`}
                          >
                            <img
                              src={getImageUrl(img.image)}
                              alt={`Thumbnail ${idx + 1}`}
                              className="w-full h-full object-cover"
                            />
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="p-8 bg-[#FFF8F2]/60 border border-[#EAE3DC] rounded-2xl text-center space-y-2">
                      <ImageIcon className="w-8 h-8 text-[#6B6058]/40 mx-auto" />
                      <h4 className="font-['Outfit'] font-bold text-xs text-[#FA661C]">
                        No Media Assets Uploaded
                      </h4>
                      <p className="text-[11px] text-[#6B6058]">
                        This product listing does not have any attached studio images yet.
                      </p>
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-[#EAE3DC] text-[11px] text-[#6B6058] flex justify-between items-center">
                  <span>Base Currency: <strong>{product.base_currency || 'INR'}</strong></span>
                  <span>HSN Code: <strong>{product.hsn_code || '—'}</strong></span>
                </div>
              </div>

              {/* Right Column: Key Details & Specifications (7 cols) */}
              <div className="lg:col-span-7 space-y-6">
                
                {/* Core Specs Card */}
                <div className="bg-white p-6 rounded-3xl border border-[#EAE3DC] shadow-2xs space-y-4">
                  <div className="flex items-center justify-between border-b border-[#EAE3DC] pb-3">
                    <span className="text-xs font-bold text-[#6B6058] uppercase tracking-wider flex items-center space-x-1">
                      <Tag className="w-3.5 h-3.5 text-[#FA661C]" />
                      <span>Category: {product.category_name || `Category #${product.category || 'N/A'}`}</span>
                    </span>
                    <span className="text-xs font-mono font-bold text-[#6B6058]">
                      Slug: /{product.slug}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-xs font-bold text-[#6B6058] uppercase tracking-wider">Product Description</h3>
                    <p className="text-xs text-[#1A2420] mt-1.5 leading-relaxed bg-[#FFF8F2]/40 p-3.5 rounded-2xl border border-[#EAE3DC]">
                      {product.description || 'No detailed description provided for this catalog product.'}
                    </p>
                  </div>

                  {/* SEO Meta Information */}
                  {(product.meta_title || product.meta_description) && (
                    <div className="pt-3 border-t border-[#EAE3DC] space-y-2">
                      <span className="text-xs font-bold text-[#6B6058] uppercase tracking-wider flex items-center space-x-1">
                        <Globe className="w-3.5 h-3.5 text-[#FA661C]" />
                        <span>Search Engine Meta Specs</span>
                      </span>
                      {product.meta_title && (
                        <div className="text-xs">
                          <strong className="text-[#6B6058]">Meta Title:</strong> {product.meta_title}
                        </div>
                      )}
                      {product.meta_description && (
                        <div className="text-xs">
                          <strong className="text-[#6B6058]">Meta Description:</strong> {product.meta_description}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Category Attributes Grid */}
                <div className="bg-white p-6 rounded-3xl border border-[#EAE3DC] shadow-2xs space-y-3">
                  <h3 className="font-['Outfit'] font-bold text-xs uppercase tracking-wider text-[#FA661C] flex items-center space-x-1.5">
                    <Layers className="w-4 h-4 text-[#FA661C]" />
                    <span>Category Attributes ({product.attribute_values?.length || 0})</span>
                  </h3>

                  {product.attribute_values && product.attribute_values.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {product.attribute_values.map((attr) => (
                        <div
                          key={attr.id}
                          className="p-3 rounded-2xl bg-[#FFF8F2]/40 border border-[#EAE3DC] text-xs flex justify-between items-center"
                        >
                          <span className="font-bold text-[#6B6058]">
                            {attr.attribute_name || `Attr #${attr.category_attribute}`}
                          </span>
                          <span className="font-black text-[#FA661C] bg-white px-2.5 py-1 rounded-xl border border-[#EAE3DC]">
                            {attr.value_name || attr.raw_value || attr.value || '—'}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-[#6B6058] bg-[#FFF8F2]/30 p-3.5 rounded-2xl border border-[#EAE3DC]">
                      No category attributes assigned to this product listing.
                    </p>
                  )}
                </div>

              </div>

            </div>

            {/* Bottom Section: Variant Specifications Grid / Table */}
            <div className="bg-white p-6 rounded-3xl border border-[#EAE3DC] shadow-2xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#EAE3DC]">
                <h3 className="font-['Outfit'] font-extrabold text-base text-[#FA661C] flex items-center space-x-2">
                  <Package className="w-5 h-5 text-[#FA661C]" />
                  <span>Configured Variant SKUs ({product.variants?.length || 0})</span>
                </h3>
              </div>

              {product.variants && product.variants.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-[#FFF8F2] text-[#FA661C] border-b border-[#EAE3DC]">
                        <th className="p-3 rounded-l-xl">SKU Code</th>
                        <th className="p-3">Attribute Combination</th>
                        <th className="p-3">Unit Price</th>
                        <th className="p-3">Available Stock</th>
                        <th className="p-3 rounded-r-xl">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#EAE3DC]">
                      {product.variants.map((v) => {
                        const attrMap = typeof v.attributes === 'object' && v.attributes !== null
                          ? Object.entries(v.attributes).map(([k, val]) => `${k}: ${val}`).join(' | ')
                          : 'Base Variant';

                        return (
                          <tr key={v.id} className="hover:bg-[#FFF8F2]/30 transition-colors">
                            <td className="p-3 font-mono font-bold text-[#FA661C]">
                              {v.sku_code || `SKU-#${v.id}`}
                            </td>
                            <td className="p-3 font-semibold text-[#1A2420]">
                              {attrMap || 'Base SKU'}
                            </td>
                            <td className="p-3 font-extrabold text-[#FA661C]">
                              {new Intl.NumberFormat('en-IN', {
                                style: 'currency',
                                currency: v.currency || product.base_currency || 'INR'
                              }).format(Number(v.price || 0))}
                            </td>
                            <td className="p-3 font-bold text-[#1A2420]">
                              <span className={v.stock_quantity <= 3 ? 'text-[#D7263D] font-extrabold' : ''}>
                                {v.stock_quantity} units
                              </span>
                            </td>
                            <td className="p-3">
                              {v.is_active ? (
                                <span className="px-2 py-0.5 bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/30 rounded-md font-bold text-[10px]">
                                  Active
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 bg-gray-100 text-gray-500 border border-gray-300 rounded-md font-bold text-[10px]">
                                  Inactive
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-6 bg-[#FFF8F2]/40 border border-[#EAE3DC] rounded-2xl text-center text-xs text-[#6B6058]">
                  No SKU variants configured for this product listing yet.
                </div>
              )}
            </div>

          </div>
        )}

      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white max-w-md w-full rounded-3xl p-6 border border-[#EAE3DC] shadow-xl space-y-4">
            <div className="flex items-center space-x-3 text-[#D7263D]">
              <div className="p-3 bg-[#FDE8EA] rounded-2xl">
                <AlertCircle className="w-6 h-6 text-[#D7263D]" />
              </div>
              <div>
                <h3 className="font-['Outfit'] font-black text-lg text-[#1A2420]">Confirm Deletion</h3>
                <p className="text-xs text-[#6B6058]">Product #{id} — {product?.name}</p>
              </div>
            </div>

            <p className="text-xs text-[#6B6058] leading-relaxed">
              Are you sure you want to delete this product listing? This will permanently remove the product specification, associated variants, and media assets.
            </p>

            {deleteError && (
              <div className="p-3 bg-[#FDE8EA] border border-[#D7263D]/40 rounded-xl text-xs text-[#D7263D] font-medium">
                {deleteError}
              </div>
            )}

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                disabled={isDeleting}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteProduct}
                disabled={isDeleting}
                className="px-4 py-2 bg-[#D7263D] hover:bg-[#B51E31] text-white rounded-xl text-xs font-extrabold flex items-center space-x-1.5 transition-all cursor-pointer disabled:opacity-50 shadow-xs"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Product</span>
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
