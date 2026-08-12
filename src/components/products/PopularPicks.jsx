import React, { useState, useMemo } from 'react';
import ProductCard from './ProductCard';
import { POPULAR_PICKS, CATEGORIES } from '../../data/mockData';
import { Sparkles, ArrowRight, Layers, SlidersHorizontal, CheckCircle2, Tag, Star, Zap } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

export default function PopularPicks({ activeCategory = 'for-you', isLoading = false }) {
  const [activeFilter, setActiveFilter] = useState('all'); // 'all' | 'top-rated' | 'under-2999' | 'deals'
  const toast = useToast();

  // Find human readable category metadata
  const currentCategoryObj = CATEGORIES.find(c => c.id === activeCategory) || CATEGORIES[0];

  // Filter products strictly based on selected category
  const baseCategoryProducts = useMemo(() => {
    if (activeCategory === 'for-you') {
      // Return rich mix of popular picks across categories
      return POPULAR_PICKS.slice(0, 15);
    }
    return POPULAR_PICKS.filter(p => p.categorySlug === activeCategory);
  }, [activeCategory]);

  // Apply secondary sub-filters
  const displayProducts = useMemo(() => {
    let list = [...baseCategoryProducts];
    if (activeFilter === 'top-rated') {
      list = list.filter(p => p.rating >= 4.7);
    } else if (activeFilter === 'under-2999') {
      list = list.filter(p => {
        const rawNum = parseInt(p.price.replace(/[^\d]/g, ''), 10);
        return rawNum <= 2999;
      });
    } else if (activeFilter === 'deals') {
      list = list.filter(p => p.isUrgent || p.discount.includes('50%') || p.discount.includes('60%') || p.discount.includes('58%') || p.discount.includes('56%'));
    }
    return list;
  }, [baseCategoryProducts, activeFilter]);

  const handleFilterClick = (filterId, filterLabel) => {
    setActiveFilter(filterId);
    toast.info("Filter Applied", `Showing ${filterLabel} in ${currentCategoryObj.label}`);
  };

  return (
    <section 
      aria-labelledby="popular-picks-title"
      className="max-w-7xl mx-auto px-4 sm:px-8 py-4 transition-all duration-300"
    >
      {/* Category Header Banner */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-4 pb-3 border-b border-[#D8E0DC] gap-3">
        <div>
          <div className="flex items-center space-x-2 text-[#D4AF37] mb-1">
            <Sparkles className="w-3.5 h-3.5 fill-current" />
            <span className="text-[10px] font-black uppercase tracking-widest text-[#0F3D2E]">
              {activeCategory === 'for-you' ? 'CURATED MARKETPLACE FEED' : `${currentCategoryObj.label.toUpperCase()} STORE`}
            </span>
            <span className="text-[10px] bg-[#E8F2EE] text-[#0F3D2E] font-bold px-2 py-0.2 rounded-full border border-[#0F3D2E]/20">
              {displayProducts.length} Verified Products
            </span>
          </div>

          <h2 id="popular-picks-title" className="font-['Outfit'] text-xl sm:text-2xl font-extrabold text-[#0F3D2E] tracking-tight">
            {activeCategory === 'for-you' 
              ? 'Handpicked Popular Picks & Flash Deals' 
              : `Explore Top Rated Products in ${currentCategoryObj.label}`}
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
                    ? 'bg-[#0F3D2E] text-[#FBF8F1] shadow-2xs'
                    : 'bg-white text-[#5C6B63] hover:text-[#0F3D2E] border border-[#D8E0DC] hover:border-[#D4AF37]'
                }`}
              >
                <Icon className={`w-3 h-3 ${isSelected ? 'text-[#D4AF37]' : 'text-[#5C6B63]'}`} />
                <span className="text-[11px]">{flt.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* SKELETON LOADER STATE */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4 animate-pulse">
          {Array.from({ length: 10 }).map((_, idx) => (
            <div key={idx} className="bg-white rounded-2xl border border-[#D8E0DC] p-3 space-y-3">
              <div className="aspect-[4/3.2] w-full bg-[#E8F2EE] rounded-xl" />
              <div className="h-3 w-16 bg-[#E8F2EE] rounded" />
              <div className="h-4 w-full bg-[#E8F2EE] rounded" />
              <div className="h-4 w-2/3 bg-[#E8F2EE] rounded" />
              <div className="h-6 w-full bg-[#E8F2EE] rounded-lg mt-2" />
            </div>
          ))}
        </div>
      ) : displayProducts.length > 0 ? (
        /* DENSE PRODUCT GRID (5 columns on desktop) */
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4 animate-reveal">
          {displayProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        /* Empty Filter State */
        <div className="p-12 text-center bg-white rounded-2xl border border-[#D8E0DC] space-y-3">
          <Layers className="w-12 h-12 text-[#5C6B63] mx-auto" />
          <h3 className="font-['Outfit'] font-bold text-base text-[#0F3D2E]">
            No products match the selected filter
          </h3>
          <p className="text-xs text-[#5C6B63]">
            Try selecting "All Items" to view all available products in {currentCategoryObj.label}.
          </p>
          <button
            type="button"
            onClick={() => setActiveFilter('all')}
            className="px-4 py-2 bg-[#0F3D2E] text-[#FBF8F1] text-xs font-bold rounded-xl btn-interactive cursor-pointer"
          >
            Reset Filters
          </button>
        </div>
      )}
    </section>
  );
}
