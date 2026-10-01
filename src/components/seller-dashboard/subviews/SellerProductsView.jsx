import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Trash2, AlertCircle, Loader2, Search, Filter } from 'lucide-react';
import { apiRequest } from '../../../utils/api';
import { useToast } from '../../../context/ToastContext';
import { getDescendantCategoryIds } from '../../../utils/categoryUtils';

export default function SellerProductsView({ onNavigateToAddProduct }) {
  const toast = useToast();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  // Categories Tree State
  const [categoriesTree, setCategoriesTree] = useState([]);
  const [selectedTopCategory, setSelectedTopCategory] = useState('all');
  const [selectedSubCategory, setSelectedSubCategory] = useState('all');

  // Delete Modal State
  const [productToDelete, setProductToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(null);

  // Fetch Products & Category Tree on Mount
  useEffect(() => {
    let active = true;

    async function loadCatalogData() {
      setLoading(true);
      setError(null);
      try {
        const [productsData, categoriesData] = await Promise.all([
          apiRequest('/api/products/vendor/products/'),
          apiRequest('/api/products/categories/').catch(err => {
            console.warn('Category tree fetch failed:', err);
            return [];
          })
        ]);

        if (active) {
          if (Array.isArray(productsData)) setProducts(productsData);
          if (Array.isArray(categoriesData)) setCategoriesTree(categoriesData);
        }
      } catch (err) {
        if (active) setError(err.message || 'Unable to load catalog list.');
      } finally {
        if (active) setLoading(false);
      }
    }

    loadCatalogData();
    return () => { active = false; };
  }, []);

  // Compute available subcategories based on selected top category
  const activeTopNode = useMemo(() => {
    if (selectedTopCategory === 'all') return null;
    return categoriesTree.find(c => String(c.id) === String(selectedTopCategory)) || null;
  }, [categoriesTree, selectedTopCategory]);

  const availableSubcategories = useMemo(() => {
    return activeTopNode?.children || [];
  }, [activeTopNode]);

  // Compute allowed category IDs based on top/sub category selection
  const allowedCategoryIds = useMemo(() => {
    if (selectedSubCategory !== 'all' && activeTopNode?.children) {
      // Find subcategory node in active top node
      const findSubNode = (children, targetId) => {
        for (const child of children) {
          if (String(child.id) === String(targetId)) return child;
          if (child.children?.length > 0) {
            const match = findSubNode(child.children, targetId);
            if (match) return match;
          }
        }
        return null;
      };
      const subNode = findSubNode(activeTopNode.children, selectedSubCategory);
      if (subNode) return getDescendantCategoryIds(subNode);
    }

    if (selectedTopCategory !== 'all' && activeTopNode) {
      return getDescendantCategoryIds(activeTopNode);
    }

    return null;
  }, [selectedTopCategory, selectedSubCategory, activeTopNode]);

  // Handle Top Category Change
  const handleTopCategoryChange = (e) => {
    const val = e.target.value;
    setSelectedTopCategory(val);
    setSelectedSubCategory('all');
  };

  // Delete Action Handler
  const handleDeleteProduct = async () => {
    if (!productToDelete) return;
    setIsDeleting(true);
    setDeleteError(null);

    try {
      await apiRequest(`/api/products/vendor/products/${productToDelete.id}/`, {
        method: 'DELETE'
      });
      toast.success("Product Deleted", `Product #${productToDelete.id} successfully removed from catalog.`);
      setProducts(prev => prev.filter(p => p.id !== productToDelete.id));
      setProductToDelete(null);
    } catch (err) {
      const msg = err?.data?.detail || err?.data?.message || err?.message || 'Failed to delete product.';
      setDeleteError(msg);
      toast.error("Deletion Failed", msg);
    } finally {
      setIsDeleting(false);
    }
  };

  // Filter Products
  const visible = useMemo(() => {
    return products.filter(product => {
      const variants = product.variants || [];
      const matchesSearch = `${product.name} ${product.category_name || ''} ${variants.map(v => v.sku_code).join(' ')}`.toLowerCase().includes(search.toLowerCase());
      
      const matchesStatus = filter === 'all' || (filter === 'low-stock'
        ? variants.some(v => v.is_active && v.stock_quantity <= 3)
        : product.status === filter);

      const matchesCategory = !allowedCategoryIds || allowedCategoryIds.includes(product.category);

      return matchesSearch && matchesStatus && matchesCategory;
    });
  }, [products, search, filter, allowedCategoryIds]);

  return (
    <section className="space-y-5 text-sm animate-reveal">
      
      {/* Header CTA */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-3xl border border-[#EAE3DC] shadow-2xs">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-[#FA661C] tracking-tight font-['Outfit']">
            Products &amp; Catalog Inventory
          </h2>
          {!loading && !error && (
            <p className="text-xs text-[#6B6058] mt-0.5 font-medium">
              Showing {visible.length} of {products.length} catalog listings
            </p>
          )}
        </div>
        <button 
          onClick={onNavigateToAddProduct} 
          className="bg-[#FA661C] hover:bg-[#E0530B] text-white rounded-xl px-4 py-2.5 font-extrabold text-xs cursor-pointer transition-all shadow-xs flex items-center space-x-2"
        >
          <span>+ Add New Product Listing</span>
        </button>
      </div>

      {/* Filters Bar: Search + Status + Cascading Category & Subcategory */}
      <div className="bg-white p-4 rounded-2xl border border-[#EAE3DC] shadow-2xs grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-center">
        
        {/* Search Input */}
        <div className="lg:col-span-4 relative">
          <Search className="w-4 h-4 text-[#6B6058] absolute left-3 top-2.5" />
          <input 
            aria-label="Search catalog" 
            placeholder="Search product name, category, or SKU..." 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
            className="w-full border border-[#EAE3DC] rounded-xl pl-9 pr-3 py-2 text-xs font-medium focus:outline-none focus:border-[#FA661C] bg-[#FFF8F2]/30" 
          />
        </div>

        {/* Status Filter */}
        <div className="lg:col-span-2">
          <select 
            aria-label="Catalog status" 
            value={filter} 
            onChange={e => setFilter(e.target.value)} 
            className="w-full border border-[#EAE3DC] rounded-xl p-2 text-xs font-extrabold text-[#6B6058] bg-[#FFF8F2]/30 focus:outline-none focus:border-[#FA661C]"
          >
            <option value="all">All Statuses</option>
            <option value="published">Published</option>
            <option value="pending_review">Pending Review</option>
            <option value="draft">Draft</option>
            <option value="rejected">Rejected</option>
            <option value="low-stock">Low Stock (≤ 3 units)</option>
          </select>
        </div>

        {/* Top-Level Category Filter */}
        <div className="lg:col-span-3">
          <select
            aria-label="Top level category filter"
            value={selectedTopCategory}
            onChange={handleTopCategoryChange}
            className="w-full border border-[#EAE3DC] rounded-xl p-2 text-xs font-extrabold text-[#6B6058] bg-[#FFF8F2]/30 focus:outline-none focus:border-[#FA661C]"
          >
            <option value="all">All Top-Level Categories</option>
            {categoriesTree.map(cat => (
              <option key={cat.id} value={cat.id}>
                {cat.name} ({cat.children?.length || 0} subcats)
              </option>
            ))}
          </select>
        </div>

        {/* Subcategory Filter (Cascading) */}
        <div className="lg:col-span-3">
          <select
            aria-label="Subcategory filter"
            value={selectedSubCategory}
            onChange={e => setSelectedSubCategory(e.target.value)}
            disabled={selectedTopCategory === 'all' || availableSubcategories.length === 0}
            className="w-full border border-[#EAE3DC] rounded-xl p-2 text-xs font-extrabold text-[#6B6058] bg-[#FFF8F2]/30 focus:outline-none focus:border-[#FA661C] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <option value="all">
              {selectedTopCategory === 'all' 
                ? 'Select Top Category First' 
                : availableSubcategories.length === 0 
                  ? 'No Subcategories' 
                  : 'All Subcategories'}
            </option>
            {availableSubcategories.map(sub => (
              <option key={sub.id} value={sub.id}>
                {sub.name}
              </option>
            ))}
          </select>
        </div>

      </div>

      {/* Main Table Content */}
      {loading ? (
        <div className="bg-white p-12 rounded-3xl border border-[#EAE3DC] text-center space-y-3">
          <Loader2 className="w-8 h-8 text-[#FA661C] animate-spin mx-auto" />
          <p className="text-xs font-extrabold text-[#FA661C]">Loading catalog inventory...</p>
        </div>
      ) : error ? (
        <div role="alert" className="p-6 bg-white border-2 border-[#D7263D] rounded-3xl text-center space-y-2 text-[#D7263D]">
          <AlertCircle className="w-8 h-8 mx-auto" />
          <p className="text-sm font-bold">{error}</p>
        </div>
      ) : (
        <>
          {visible.length === 0 ? (
            <div className="bg-white p-12 rounded-3xl border border-[#EAE3DC] text-center space-y-2">
              <Filter className="w-8 h-8 text-[#6B6058]/40 mx-auto" />
              <p className="text-xs font-extrabold text-[#FA661C]">
                {products.length ? 'No products match the selected filters.' : 'No products in catalog yet.'}
              </p>
              <p className="text-[11px] text-[#6B6058]">
                {products.length ? 'Try clearing category or status filters to broaden search.' : 'Click Add New Product Listing to get started.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto bg-white border border-[#EAE3DC] rounded-3xl shadow-2xs">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#FFF8F2] text-[#FA661C] border-b border-[#EAE3DC] text-xs">
                    {['Product Name & ID', 'Category', 'Status', 'SKU / Options', 'Price', 'Stock', 'Actions'].map(label => (
                      <th className="p-3.5 font-bold uppercase tracking-wider text-[11px]" key={label}>{label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EAE3DC]">
                  {visible.map(product => (
                    <tr key={product.id} data-product-id={product.id} className="hover:bg-[#FFF8F2]/40 transition-colors text-xs">
                      
                      {/* Product Name */}
                      <td className="p-3.5">
                        <Link to={`/seller/products/${product.id}`} className="font-bold text-[#FA661C] hover:underline block">
                          {product.name}
                        </Link>
                        <p className="text-[11px] text-[#6B6058] font-mono mt-0.5">Product #{product.id}</p>
                      </td>

                      {/* Category */}
                      <td className="p-3.5 font-semibold text-[#1A2420]">
                        <span className="bg-[#FFF3EC] text-[#FA661C] px-2.5 py-1 rounded-lg text-[11px] font-bold border border-[#FF811A]/20">
                          {product.category_name || `Category #${product.category}`}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="p-3.5 font-bold uppercase text-[10px]">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                          product.status === 'published' ? 'bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/30' :
                          product.status === 'pending_review' ? 'bg-[#F59E0B]/10 text-[#F59E0B] border border-[#F59E0B]/30' :
                          product.status === 'rejected' ? 'bg-[#D7263D]/10 text-[#D7263D] border border-[#D7263D]/30' :
                          'bg-gray-100 text-gray-700 border border-gray-300'
                        }`}>
                          {product.status ? product.status.replaceAll('_', ' ') : 'Draft'}
                        </span>
                      </td>

                      {/* SKU / Options */}
                      <td className="p-3.5">
                        {product.variants && product.variants.length > 0 ? (
                          product.variants.map(v => (
                            <div key={v.id} className="font-mono text-[11px]">
                              {v.sku_code || `SKU-#${v.id}`}
                              {!v.is_active && <span className="text-[#D7263D] font-bold ml-1">(inactive)</span>}
                            </div>
                          ))
                        ) : (
                          <span className="text-[#6B6058]">No SKUs configured</span>
                        )}
                      </td>

                      {/* Price */}
                      <td className="p-3.5 font-extrabold text-[#FA661C]">
                        {product.variants && product.variants.length > 0 ? (
                          product.variants.map(v => (
                            <div key={v.id}>
                              {new Intl.NumberFormat('en-IN', {
                                style: 'currency', 
                                currency: v.currency || product.base_currency || 'INR'
                              }).format(Number(v.price || 0))}
                            </div>
                          ))
                        ) : (
                          <span className="text-[#6B6058]">—</span>
                        )}
                      </td>

                      {/* Stock */}
                      <td className="p-3.5 font-bold">
                        {product.variants && product.variants.length > 0 ? (
                          product.variants.map(v => (
                            <div key={v.id} className={v.stock_quantity <= 3 ? 'text-[#D7263D] font-extrabold' : ''}>
                              {v.stock_quantity} units
                            </div>
                          ))
                        ) : (
                          <span className="text-[#6B6058]">—</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="p-3.5">
                        <div className="flex items-center space-x-2">
                          <Link
                            to={`/seller/products/${product.id}`}
                            className="px-3 py-1.5 bg-[#FFF3EC] hover:bg-[#FF811A]/20 text-[#FA661C] border border-[#FF811A]/40 rounded-xl text-xs font-extrabold transition-all"
                          >
                            View
                          </Link>
                          <Link
                            to={`/seller/products/${product.id}/edit`}
                            className="px-3 py-1.5 bg-[#FFF8F2] hover:bg-[#FFF3EC] text-[#FA661C] border border-[#EAE3DC] rounded-xl text-xs font-extrabold transition-all"
                          >
                            Edit
                          </Link>
                          <button
                            type="button"
                            onClick={() => { setDeleteError(null); setProductToDelete(product); }}
                            className="px-2.5 py-1.5 bg-[#FDE8EA] hover:bg-[#D7263D]/20 text-[#D7263D] border border-[#D7263D]/40 rounded-xl text-xs font-extrabold transition-all cursor-pointer"
                            title="Delete product"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>

                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* Delete Confirmation Modal */}
      {productToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white max-w-md w-full rounded-3xl p-6 border border-[#EAE3DC] shadow-xl space-y-4">
            <div className="flex items-center space-x-3 text-[#D7263D]">
              <div className="p-3 bg-[#FDE8EA] rounded-2xl">
                <AlertCircle className="w-6 h-6 text-[#D7263D]" />
              </div>
              <div>
                <h3 className="font-['Outfit'] font-black text-lg text-[#1A2420]">Confirm Deletion</h3>
                <p className="text-xs text-[#6B6058]">Product #{productToDelete.id} — {productToDelete.name}</p>
              </div>
            </div>

            <p className="text-xs text-[#6B6058] leading-relaxed">
              Are you sure you want to delete this product listing from your catalog?
            </p>

            {deleteError && (
              <div className="p-3 bg-[#FDE8EA] border border-[#D7263D]/40 rounded-xl text-xs text-[#D7263D] font-medium">
                {deleteError}
              </div>
            )}

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setProductToDelete(null)}
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

    </section>
  );
}
