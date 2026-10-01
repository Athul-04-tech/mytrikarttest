import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import ProductCard from './ProductCard';
import { Sparkles, Layers, Tag, Star, Zap } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { apiRequest } from '../../utils/api';
import { findCategoryNode, getDescendantCategoryKeys } from '../../utils/categoryUtils';

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

export default function PopularPicks({ activeCategory = 'for-you' }) {
  const [activeFilter, setActiveFilter] = useState('all'); // 'all' | 'top-rated' | 'under-2999' | 'deals'
  const [products, setProducts] = useState([]);
  const [categoriesTree, setCategoriesTree] = useState([]);
  const [categoriesMap, setCategoriesMap] = useState({});
  const [fetching, setFetching] = useState(true);
  const toast = useToast();

  // Fetch real published products and category map on mount
  useEffect(() => {
    let isMounted = true;
    setFetching(true);

    Promise.all([
      apiRequest('/api/products/published/'),
      apiRequest('/api/products/categories/').catch(() => [])
    ])
      .then(([rawProducts, rawCats]) => {
        if (!isMounted) return;

        if (Array.isArray(rawCats)) {
          setCategoriesTree(rawCats);
          const catMap = {};
          const mapTree = (cats) => {
            cats.forEach((c) => {
              catMap[c.id] = c.name;
              catMap[c.slug] = c.name;
              if (c.children?.length) mapTree(c.children);
            });
          };
          mapTree(rawCats);
          setCategoriesMap(catMap);
        }

        if (Array.isArray(rawProducts)) {
          setProducts(rawProducts.map(normalizeProduct));
        }
      })
      .catch((err) => {
        // Log error silently
      })
      .finally(() => {
        if (isMounted) setFetching(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Category name title
  const currentCategoryLabel = useMemo(() => {
    if (activeCategory === 'for-you') return 'Curated Marketplace';
    return categoriesMap[activeCategory] || activeCategory.replace(/-/g, ' ').toUpperCase();
  }, [activeCategory, categoriesMap]);

  // Filter products based on selected category including descendant subcategories
  const baseCategoryProducts = useMemo(() => {
    if (activeCategory === 'for-you') {
      return products;
    }

    const targetNode = findCategoryNode(categoriesTree, activeCategory);
    if (targetNode) {
      const keys = getDescendantCategoryKeys(targetNode);
      return products.filter((p) => 
        keys.ids.has(String(p.categoryId)) ||
        keys.slugs.has(p.categorySlug) ||
        keys.names.has(p.category.toLowerCase())
      );
    }

    // Fallback to exact match if category node isn't found in tree
    return products.filter((p) => 
      String(p.categoryId) === String(activeCategory) ||
      p.categorySlug === activeCategory ||
      p.category.toLowerCase().replace(/[^a-z0-9]+/g, '-') === activeCategory
    );
  }, [products, activeCategory, categoriesTree]);

  // Apply secondary sub-filters
  const displayProducts = useMemo(() => {
    let list = [...baseCategoryProducts];
    if (activeFilter === 'top-rated') {
      list = list.filter((p) => p.reviews > 0 && p.rating != null && p.rating >= 4.7);
    } else if (activeFilter === 'under-2999') {
      list = list.filter((p) => p.rawPrice <= 2999);
    } else if (activeFilter === 'deals') {
      list = list.filter((p) => p.discountNum != null && p.discountNum >= 50);
    }
    return list;
  }, [baseCategoryProducts, activeFilter]);

  const handleFilterClick = (filterId, filterLabel) => {
    setActiveFilter(filterId);
    toast.info("Filter Applied", `Showing ${filterLabel} in ${currentCategoryLabel}`);
  };

  return (
    <section 
      aria-labelledby="popular-picks-title"
      className="max-w-7xl mx-auto px-4 sm:px-8 py-4 transition-all duration-300"
    >
      {/* Category Header Banner */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-4 pb-3 border-b border-[#EAE3DC] gap-3">
        <div>
          <div className="flex items-center space-x-2 text-[#FF811A] mb-1">
            <Sparkles className="w-3.5 h-3.5 fill-current" />
            <span className="text-[10px] font-black uppercase tracking-widest text-[#FA661C]">
              {activeCategory === 'for-you' ? 'CURATED MARKETPLACE FEED' : `${currentCategoryLabel.toUpperCase()} STORE`}
            </span>
            <span className="text-[10px] bg-[#FFF3EC] text-[#FA661C] font-bold px-2 py-0.2 rounded-full border border-[#FA661C]/20">
              {displayProducts.length} Verified Products
            </span>
          </div>

          <h2 id="popular-picks-title" className="font-['Outfit'] text-xl sm:text-2xl font-extrabold text-[#FA661C] tracking-tight">
            {activeCategory === 'for-you' 
              ? 'Handpicked Popular Picks & Flash Deals' 
              : `Explore Top Rated Products in ${currentCategoryLabel}`}
          </h2>
        </div>

        {/* Interactive In-Category Sub-Filter Chips */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 text-xs">
          {[
            { id: 'all', label: 'All Items', icon: Layers },
            { id: 'top-rated', label: 'Top Rated 4.7+ ★', icon: Star },
            { id: 'under-2999', label: 'Under ₹2,999', icon: Tag },
            { id: 'deals', label: 'Flash Deals 50%+ Off', icon: Zap }
          ].map((flt) => {
            const Icon = flt.icon;
            const isSelected = activeFilter === flt.id;

            return (
              <button
                key={flt.id}
                type="button"
                onClick={() => handleFilterClick(flt.id, flt.label)}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer flex items-center space-x-1.5 shrink-0 btn-interactive ${
                  isSelected
                    ? 'bg-[#FA661C] text-[#FFFFFF] shadow-2xs'
                    : 'bg-white text-[#6B6058] hover:text-[#FA661C] border border-[#EAE3DC] hover:border-[#FF811A]'
                }`}
              >
                <Icon className={`w-3 h-3 ${isSelected ? 'text-[#FF811A]' : 'text-[#6B6058]'}`} />
                <span className="text-[11px]">{flt.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* SKELETON LOADER STATE */}
      {fetching ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4 animate-pulse">
          {Array.from({ length: 10 }).map((_, idx) => (
            <div key={idx} className="bg-white rounded-2xl border border-[#EAE3DC] p-3 space-y-3">
              <div className="aspect-[4/3.2] w-full bg-[#FFF3EC] rounded-xl" />
              <div className="h-3 w-16 bg-[#FFF3EC] rounded" />
              <div className="h-4 w-full bg-[#FFF3EC] rounded" />
              <div className="h-4 w-2/3 bg-[#FFF3EC] rounded" />
              <div className="h-6 w-full bg-[#FFF3EC] rounded-lg mt-2" />
            </div>
          ))}
        </div>
      ) : displayProducts.length > 0 ? (
        <>
          {/* DENSE PRODUCT GRID (5 columns on desktop, max 15 items on homepage) */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4 animate-reveal">
            {displayProducts.slice(0, 15).map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>

          {/* VIEW ALL PRODUCTS LINK */}
          <div className="mt-8 text-center">
            <Link
              to={activeCategory === 'for-you' ? '/products' : `/category/${activeCategory}`}
              className="inline-flex items-center space-x-2 px-6 py-3 bg-[#FA661C] hover:bg-[#E05510] text-[#FFFFFF] font-bold text-sm rounded-xl shadow-sm hover:shadow-md transition-all cursor-pointer btn-interactive"
            >
              <span>{activeCategory === 'for-you' ? 'View All Products' : `Explore All Products in ${currentCategoryLabel}`}</span>
              <span aria-hidden="true">&rarr;</span>
            </Link>
          </div>
        </>
      ) : (
        /* Empty Filter State */
        <div className="p-12 text-center bg-white rounded-2xl border border-[#EAE3DC] space-y-3">
          <Layers className="w-12 h-12 text-[#6B6058] mx-auto" />
          <h3 className="font-['Outfit'] font-bold text-base text-[#FA661C]">
            No products match the selected filter
          </h3>
          <p className="text-xs text-[#6B6058]">
            Try selecting "All Items" to view all available products in {currentCategoryLabel}.
          </p>
          <button
            type="button"
            onClick={() => setActiveFilter('all')}
            className="px-4 py-2 bg-[#FA661C] text-[#FFFFFF] text-xs font-bold rounded-xl btn-interactive cursor-pointer"
          >
            Reset Filters
          </button>
        </div>
      )}
    </section>
  );
}
