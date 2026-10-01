import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useSearchParams, useNavigate, Link } from 'react-router-dom';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import DeliveryModal from '../components/modals/DeliveryModal';
import ProductCard from '../components/products/ProductCard';
import { apiRequest } from '../utils/api';
import { useToast } from '../context/ToastContext';
import { findCategoryNode, getDescendantCategoryKeys } from '../utils/categoryUtils';
import { 
  Filter, 
  Layers, 
  ChevronRight, 
  ChevronLeft, 
  Star, 
  Tag, 
  Zap, 
  SlidersHorizontal,
  ArrowUpDown,
  ShoppingBag,
  RotateCcw,
  Sparkles,
  X
} from 'lucide-react';

function normalizeProduct(p) {
  const primaryVar = p.variants?.[0] || {};
  const rawPrice = parseFloat(primaryVar.price || 0);
  const rawMrp = primaryVar.mrp ? parseFloat(primaryVar.mrp) : null;
  const stockQuantity = primaryVar.stock_quantity ?? 0;
  
  let discountNum = null;
  if (primaryVar.discount_percentage != null) {
    discountNum = parseFloat(primaryVar.discount_percentage);
  } else if (rawMrp && rawMrp > rawPrice) {
    discountNum = Math.round(((rawMrp - rawPrice) / rawMrp) * 100);
  }

  let discountFormatted = null;
  let originalPriceFormatted = null;
  if (rawMrp && rawMrp > rawPrice) {
    originalPriceFormatted = `₹${rawMrp.toLocaleString('en-IN')}`;
    if (discountNum && discountNum >= 1) {
      discountFormatted = `${Math.round(discountNum)}% Off`;
    }
  }

  const primaryImg = p.images?.find((img) => img.is_primary)?.image || p.images?.[0]?.image || '/products/spatial_headphones_1786529304124.png';

  return {
    id: p.id,
    variantId: primaryVar.id,
    name: p.name,
    slug: p.slug,
    category: p.category_name || 'General',
    categoryId: p.category,
    categorySlug: (p.category_name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
    price: `₹${rawPrice.toLocaleString('en-IN')}`,
    rawPrice,
    originalPrice: originalPriceFormatted,
    rawMrp,
    discount: discountFormatted,
    discountNum,
    rating: p.average_rating,
    reviews: p.review_count ?? 0,
    stockQuantity,
    isUrgent: stockQuantity > 0 && stockQuantity <= 5,
    urgencyBadge: stockQuantity > 0 && stockQuantity <= 5 ? `Only ${stockQuantity} left` : null,
    image: primaryImg
  };
}

export default function ProductListingPage({ isLoggedIn, currentUser, onLogout }) {
  const { categorySlug } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [products, setProducts] = useState([]);
  const [categoriesTree, setCategoriesTree] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [deliveryLocation, setDeliveryLocation] = useState(null);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);

  // Parse state from URL params & query string
  const searchQuery = (searchParams.get('search') || '').trim();
  const activeCategorySlug = categorySlug || searchParams.get('cat') || 'all';
  const activeSubcategorySlug = searchParams.get('sub') || 'all';
  const activeSubFilter = searchParams.get('filter') || 'all'; // 'all' | 'top-rated' | 'under-2999' | 'deals'
  const sortBy = searchParams.get('sort') || 'featured'; // 'featured' | 'price-asc' | 'price-desc' | 'rating-desc' | 'newest'
  const currentPage = parseInt(searchParams.get('page') || '1', 10);
  const pageSize = 12;

  // Fetch Published Products & Category Tree on Mount or when search query changes
  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);

    const productsEndpoint = searchQuery 
      ? `/api/products/published/?search=${encodeURIComponent(searchQuery)}`
      : '/api/products/published/';

    Promise.all([
      apiRequest(productsEndpoint),
      apiRequest('/api/products/categories/').catch(() => [])
    ])
      .then(([rawProducts, rawCats]) => {
        if (!isMounted) return;
        if (Array.isArray(rawCats)) setCategoriesTree(rawCats);
        if (Array.isArray(rawProducts)) setProducts(rawProducts.map(normalizeProduct));
      })
      .catch((err) => {
        if (isMounted) setError(err.message || 'Unable to load products.');
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [searchQuery]);

  // Update query params helper
  const updateQueryParams = useCallback((updates) => {
    const newParams = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([key, val]) => {
      if (val === null || val === undefined || val === '' || val === 'all' || val === 'featured' || (key === 'page' && val === 1)) {
        newParams.delete(key);
      } else {
        newParams.set(key, String(val));
      }
    });
    setSearchParams(newParams);
  }, [searchParams, setSearchParams]);

  // Top-level Category Node
  const topCategoryNode = useMemo(() => {
    if (!activeCategorySlug || activeCategorySlug === 'all' || activeCategorySlug === 'for-you') return null;
    return findCategoryNode(categoriesTree, activeCategorySlug);
  }, [categoriesTree, activeCategorySlug]);

  // Available Subcategories under selected top category
  const availableSubcategories = useMemo(() => {
    return topCategoryNode?.children || [];
  }, [topCategoryNode]);

  // Target Filter Node (Subcategory if selected, else Top Category)
  const targetFilterNode = useMemo(() => {
    if (activeSubcategorySlug !== 'all') {
      const subMatch = findCategoryNode(availableSubcategories, activeSubcategorySlug);
      if (subMatch) return subMatch;
    }
    return topCategoryNode;
  }, [availableSubcategories, activeSubcategorySlug, topCategoryNode]);

  // Filter products by Category + Subcategory Tree
  const categoryFilteredProducts = useMemo(() => {
    if (!targetFilterNode) return products;
    const keys = getDescendantCategoryKeys(targetFilterNode);
    return products.filter((p) => 
      keys.ids.has(String(p.categoryId)) ||
      keys.slugs.has(p.categorySlug) ||
      keys.names.has(p.category.toLowerCase())
    );
  }, [products, targetFilterNode]);

  // Apply Secondary Sub-Filters (Chips)
  const secondaryFilteredProducts = useMemo(() => {
    let list = [...categoryFilteredProducts];
    if (activeSubFilter === 'top-rated') {
      list = list.filter((p) => p.reviews > 0 && p.rating != null && p.rating >= 4.7);
    } else if (activeSubFilter === 'under-2999') {
      list = list.filter((p) => p.rawPrice <= 2999);
    } else if (activeSubFilter === 'deals') {
      list = list.filter((p) => p.discountNum != null && p.discountNum >= 50);
    }
    return list;
  }, [categoryFilteredProducts, activeSubFilter]);

  // Apply Sorting
  const sortedProducts = useMemo(() => {
    let list = [...secondaryFilteredProducts];
    if (sortBy === 'price-asc') {
      list.sort((a, b) => a.rawPrice - b.rawPrice);
    } else if (sortBy === 'price-desc') {
      list.sort((a, b) => b.rawPrice - a.rawPrice);
    } else if (sortBy === 'rating-desc') {
      list.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    } else if (sortBy === 'newest') {
      list.sort((a, b) => b.id - a.id);
    }
    return list;
  }, [secondaryFilteredProducts, sortBy]);

  // Client-Side Pagination Calculations
  const totalProducts = sortedProducts.length;
  const totalPages = Math.max(1, Math.ceil(totalProducts / pageSize));
  const validPage = Math.min(Math.max(1, currentPage), totalPages);

  const paginatedProducts = useMemo(() => {
    const startIdx = (validPage - 1) * pageSize;
    return sortedProducts.slice(startIdx, startIdx + pageSize);
  }, [sortedProducts, validPage, pageSize]);

  // Event Handlers
  const handleTopCategoryChange = (e) => {
    const slug = e.target.value;
    if (slug === 'all') {
      if (searchQuery) {
        updateQueryParams({ cat: null, sub: null, page: 1 });
      } else {
        navigate('/products');
      }
    } else {
      if (searchQuery) {
        updateQueryParams({ cat: slug, sub: null, page: 1 });
      } else {
        navigate(`/category/${slug}`);
      }
    }
  };

  const handleSubcategoryChange = (e) => {
    const subSlug = e.target.value;
    updateQueryParams({ sub: subSlug, page: 1 });
  };

  const handleSubFilterClick = (filterId, label) => {
    updateQueryParams({ filter: filterId, page: 1 });
    toast.info("Filter Applied", `Showing ${label}`);
  };

  const handleSortChange = (e) => {
    updateQueryParams({ sort: e.target.value, page: 1 });
  };

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > totalPages) return;
    updateQueryParams({ page: newPage });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleClearSearch = () => {
    updateQueryParams({ search: null, page: 1 });
  };

  const handleResetAllFilters = () => {
    navigate('/products');
    toast.info("Filters Reset", "Showing all marketplace products.");
  };

  // Human readable breadcrumb & heading label
  const displayTitle = useMemo(() => {
    if (searchQuery) {
      if (targetFilterNode) return `Search results for "${searchQuery}" in ${targetFilterNode.name}`;
      return `Search results for "${searchQuery}"`;
    }
    if (targetFilterNode) return targetFilterNode.name;
    if (activeCategorySlug === 'all') return 'All Marketplace Products';
    return activeCategorySlug.replace(/-/g, ' ').toUpperCase();
  }, [searchQuery, targetFilterNode, activeCategorySlug]);

  return (
    <div className="min-h-screen bg-[#FFFFFF] text-[#1A2420] flex flex-col font-sans selection:bg-[#FF811A]/30 selection:text-[#FA661C]">
      
      {/* SEO Title Landmark */}
      <h1 className="sr-only">
        {displayTitle} — MytriKart E-Commerce Product Catalog
      </h1>

      {/* Header Component */}
      <Header 
        onOpenLocationModal={() => setIsLocationModalOpen(true)}
        deliveryLocation={deliveryLocation}
        isLoggedIn={isLoggedIn}
        currentUser={currentUser}
        onLogout={onLogout}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-8 py-6 w-full space-y-6">
        
        {/* Breadcrumb Navigation Trail */}
        <nav aria-label="Breadcrumb" className="text-xs text-[#6B6058] flex items-center space-x-1.5 overflow-x-auto pb-1">
          <Link to="/" className="hover:text-[#FA661C] transition-colors font-medium">Home</Link>
          <ChevronRight className="w-3 h-3 text-[#6B6058]/60 shrink-0" />
          <Link to="/products" className="hover:text-[#FA661C] transition-colors font-medium">Products</Link>
          {topCategoryNode && (
            <>
              <ChevronRight className="w-3 h-3 text-[#6B6058]/60 shrink-0" />
              <Link to={`/category/${topCategoryNode.slug}`} className="hover:text-[#FA661C] transition-colors font-semibold text-[#1A2420]">
                {topCategoryNode.name}
              </Link>
            </>
          )}
          {targetFilterNode && targetFilterNode !== topCategoryNode && (
            <>
              <ChevronRight className="w-3 h-3 text-[#6B6058]/60 shrink-0" />
              <span className="font-bold text-[#FA661C]">{targetFilterNode.name}</span>
            </>
          )}
        </nav>

        {/* Page Title & Count Header Banner */}
        <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-[#EAE3DC] pb-4 gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 text-[#FA661C] mb-1">
              <Sparkles className="w-4 h-4 fill-current text-[#FF811A]" />
              <span className="text-xs font-black uppercase tracking-widest text-[#FA661C]">
                MytriKart Verified Store
              </span>
              <span className="text-xs bg-[#FFF3EC] text-[#FA661C] font-bold px-2.5 py-0.5 rounded-full border border-[#FA661C]/20">
                {totalProducts} {totalProducts === 1 ? 'Product' : 'Products'} Available
              </span>
              {searchQuery && (
                <span className="text-xs bg-[#FFF3EC] text-[#FA661C] font-bold px-2.5 py-0.5 rounded-full border border-[#FA661C]/20 flex items-center space-x-1">
                  <span>Search: "{searchQuery}"</span>
                  <button 
                    type="button" 
                    onClick={handleClearSearch}
                    className="ml-1 hover:text-[#D7263D] cursor-pointer"
                    aria-label="Clear search filter"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
            </div>
            <h2 className="font-['Outfit'] text-2xl sm:text-3xl font-extrabold text-[#FA661C] tracking-tight">
              {displayTitle}
            </h2>
          </div>

          {/* Quick Sub-Filter Chips */}
          <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 text-xs">
            {[
              { id: 'all', label: 'All Items', icon: Layers },
              { id: 'top-rated', label: 'Top Rated 4.7+ ★', icon: Star },
              { id: 'under-2999', label: 'Under ₹2,999', icon: Tag },
              { id: 'deals', label: 'Flash Deals 50%+ Off', icon: Zap }
            ].map((flt) => {
              const Icon = flt.icon;
              const isSelected = activeSubFilter === flt.id;

              return (
                <button
                  key={flt.id}
                  type="button"
                  onClick={() => handleSubFilterClick(flt.id, flt.label)}
                  className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer flex items-center space-x-1.5 shrink-0 btn-interactive ${
                    isSelected
                      ? 'bg-[#FA661C] text-[#FFFFFF] shadow-2xs'
                      : 'bg-white text-[#6B6058] hover:text-[#FA661C] border border-[#EAE3DC] hover:border-[#FF811A]'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-[#FF811A]' : 'text-[#6B6058]'}`} />
                  <span className="text-xs">{flt.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Dedicated Filter Control Bar (Category + Subcategory + Sort) */}
        <div className="bg-[#FFF8F2] border border-[#EAE3DC] p-3 sm:p-4 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-3 shadow-2xs">
          
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            {/* Top-Level Category Dropdown */}
            <div className="flex items-center space-x-2 shrink-0">
              <label htmlFor="top-category-select" className="text-xs font-extrabold text-[#FA661C] whitespace-nowrap flex items-center space-x-1">
                <Filter className="w-3.5 h-3.5 text-[#FF811A]" />
                <span>Category:</span>
              </label>
              <select
                id="top-category-select"
                value={topCategoryNode?.slug || activeCategorySlug}
                onChange={handleTopCategoryChange}
                className="bg-white text-[#1A2420] text-xs font-bold py-2 px-3 rounded-xl border border-[#EAE3DC] focus:outline-none focus:ring-2 focus:ring-[#FA661C] cursor-pointer shadow-2xs"
              >
                <option value="all">All Top-Level Categories</option>
                {categoriesTree.map((cat) => (
                  <option key={cat.id} value={cat.slug || String(cat.id)}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Subcategory Dropdown (Populates when parent category selected) */}
            {availableSubcategories.length > 0 && (
              <div className="flex items-center space-x-2 shrink-0">
                <label htmlFor="sub-category-select" className="text-xs font-extrabold text-[#FA661C] whitespace-nowrap flex items-center space-x-1">
                  <SlidersHorizontal className="w-3.5 h-3.5 text-[#FF811A]" />
                  <span>Subcategory:</span>
                </label>
                <select
                  id="sub-category-select"
                  value={activeSubcategorySlug}
                  onChange={handleSubcategoryChange}
                  className="bg-white text-[#1A2420] text-xs font-bold py-2 px-3 rounded-xl border border-[#EAE3DC] focus:outline-none focus:ring-2 focus:ring-[#FA661C] cursor-pointer shadow-2xs"
                >
                  <option value="all">All Subcategories in {topCategoryNode?.name}</option>
                  {availableSubcategories.map((sub) => (
                    <option key={sub.id} value={sub.slug || String(sub.id)}>
                      {sub.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Sort Control Dropdown */}
          <div className="flex items-center space-x-2 shrink-0 w-full md:w-auto justify-end">
            <label htmlFor="sort-select" className="text-xs font-extrabold text-[#FA661C] whitespace-nowrap flex items-center space-x-1">
              <ArrowUpDown className="w-3.5 h-3.5 text-[#FF811A]" />
              <span>Sort By:</span>
            </label>
            <select
              id="sort-select"
              value={sortBy}
              onChange={handleSortChange}
              className="bg-white text-[#1A2420] text-xs font-bold py-2 px-3 rounded-xl border border-[#EAE3DC] focus:outline-none focus:ring-2 focus:ring-[#FA661C] cursor-pointer shadow-2xs"
            >
              <option value="featured">Featured / Recommended</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="rating-desc">Customer Rating: High to Low</option>
              <option value="newest">Newest Arrivals</option>
            </select>
          </div>

        </div>

        {/* LOADING SKELETON STATE */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-4 animate-pulse">
            {Array.from({ length: 8 }).map((_, idx) => (
              <div key={idx} className="bg-white rounded-2xl border border-[#EAE3DC] p-3 space-y-3">
                <div className="aspect-[4/3.2] w-full bg-[#FFF3EC] rounded-xl" />
                <div className="h-3 w-16 bg-[#FFF3EC] rounded" />
                <div className="h-4 w-full bg-[#FFF3EC] rounded" />
                <div className="h-4 w-2/3 bg-[#FFF3EC] rounded" />
                <div className="h-6 w-full bg-[#FFF3EC] rounded-lg mt-2" />
              </div>
            ))}
          </div>
        ) : paginatedProducts.length > 0 ? (
          /* PRODUCT GRID */
          <div className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-4 sm:gap-6 animate-reveal">
              {paginatedProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>

            {/* CLIENT-SIDE PAGINATION CONTROLS */}
            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between border-t border-[#EAE3DC] pt-4 gap-3 text-xs">
                <span className="text-[#6B6058] font-medium">
                  Showing <strong className="text-[#FA661C]">{(validPage - 1) * pageSize + 1}</strong> to <strong className="text-[#FA661C]">{Math.min(validPage * pageSize, totalProducts)}</strong> of <strong className="text-[#FA661C]">{totalProducts}</strong> products
                </span>

                <div className="flex items-center space-x-1.5">
                  <button
                    type="button"
                    onClick={() => handlePageChange(validPage - 1)}
                    disabled={validPage === 1}
                    className="p-2 rounded-xl border border-[#EAE3DC] bg-white text-[#6B6058] hover:text-[#FA661C] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all btn-interactive"
                    aria-label="Previous Page"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  {Array.from({ length: totalPages }).map((_, idx) => {
                    const pNum = idx + 1;
                    const isCurrent = pNum === validPage;
                    return (
                      <button
                        key={pNum}
                        type="button"
                        onClick={() => handlePageChange(pNum)}
                        className={`w-8 h-8 rounded-xl font-extrabold text-xs transition-all cursor-pointer ${
                          isCurrent
                            ? 'bg-[#FA661C] text-white shadow-2xs'
                            : 'bg-white text-[#6B6058] hover:text-[#FA661C] border border-[#EAE3DC]'
                        }`}
                      >
                        {pNum}
                      </button>
                    );
                  })}

                  <button
                    type="button"
                    onClick={() => handlePageChange(validPage + 1)}
                    disabled={validPage === totalPages}
                    className="p-2 rounded-xl border border-[#EAE3DC] bg-white text-[#6B6058] hover:text-[#FA661C] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all btn-interactive"
                    aria-label="Next Page"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* HONEST EMPTY STATE */
          <div className="p-12 text-center bg-white rounded-3xl border border-[#EAE3DC] space-y-4 shadow-xs">
            <div className="w-16 h-16 rounded-full bg-[#FFF3EC] flex items-center justify-center mx-auto text-[#FA661C]">
              <ShoppingBag className="w-8 h-8" />
            </div>
            <div>
              <h3 className="font-['Outfit'] font-extrabold text-lg text-[#FA661C]">
                {searchQuery ? `No products found for "${searchQuery}"` : 'No products found in this category'}
              </h3>
              <p className="text-xs text-[#6B6058] mt-1 max-w-md mx-auto">
                {searchQuery 
                  ? `No active listings match your search query "${searchQuery}"${targetFilterNode ? ` within ${targetFilterNode.name}` : ''}. Try checking for spelling errors or clearing your search.`
                  : 'No active listings match your selected category/subcategory filters. Try selecting a different category or clearing sub-filters.'
                }
              </p>
            </div>
            <button
              type="button"
              onClick={handleResetAllFilters}
              className="inline-flex items-center space-x-2 px-5 py-2.5 bg-[#FA661C] hover:bg-[#E0530B] text-white font-extrabold text-xs rounded-xl shadow-xs btn-interactive cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Browse All Marketplace Products</span>
            </button>
          </div>
        )}

      </main>

      {/* Footer Component */}
      <Footer />

      {/* Delivery Location Modal */}
      <DeliveryModal
        isOpen={isLocationModalOpen}
        onClose={() => setIsLocationModalOpen(false)}
        onSelectLocation={(loc) => setDeliveryLocation(loc)}
        currentLocation={deliveryLocation}
      />

    </div>
  );
}

