import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { 
  Layers, 
  Smartphone, 
  Shirt, 
  Laptop, 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle, 
  Info,
  ChevronRight,
  Loader2
} from 'lucide-react';

const ICON_MAP = {
  Smartphone,
  Shirt,
  Laptop,
  Sparkles
};

export default function CategoryPickerSection({
  selectedCategory,
  onSelectCategory,
  hasFilledAttributes,
  categoriesTree = [],
  isLoadingCategories = false
}) {
  const [confirmPendingCategory, setConfirmPendingCategory] = useState(null);
  const [selectedParentId, setSelectedParentId] = useState(null);

  const handleCategoryClick = (cat) => {
    if (cat.id === selectedCategory?.id) return;

    if (hasFilledAttributes) {
      setConfirmPendingCategory(cat);
    } else {
      onSelectCategory(cat);
    }
  };

  const confirmChange = () => {
    if (confirmPendingCategory) {
      onSelectCategory(confirmPendingCategory);
      setConfirmPendingCategory(null);
    }
  };

  // Helper to determine if using API categories tree vs mock
  const hasApiCategories = Array.isArray(categoriesTree) && categoriesTree.length > 0;

  return (
    <section className="bg-white rounded-3xl border border-[#EAE3DC] p-6 sm:p-8 shadow-xs relative">
      
      {/* Category Change Confirmation Modal */}
      {confirmPendingCategory && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0A2A1F]/70 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white border border-[#FF811A]/50 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 animate-scaleUp text-xs">
            <div className="flex items-center space-x-3 text-[#D7263D]">
              <div className="p-2.5 rounded-2xl bg-[#FDE8EA] border border-[#D7263D]/30">
                <AlertTriangle className="w-5 h-5 text-[#D7263D]" />
              </div>
              <div>
                <h4 className="font-['Outfit'] font-black text-base text-[#FA661C]">
                  Switch Product Category?
                </h4>
                <p className="text-[11px] text-[#6B6058]">
                  Admin Schema Reset Warning
                </p>
              </div>
            </div>

            <p className="text-xs text-[#6B6058] leading-relaxed">
              Switching from <strong className="text-[#FA661C]">{selectedCategory?.displayName || selectedCategory?.name}</strong> to <strong className="text-[#FA661C]">{confirmPendingCategory.displayName || confirmPendingCategory.name}</strong> will clear current attribute selections to load the standardized attributes defined for the new category.
            </p>

            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-[#EAE3DC]">
              <button
                type="button"
                onClick={() => setConfirmPendingCategory(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-[#6B6058] bg-[#FFFFFF] hover:bg-[#FFF3EC] border border-[#EAE3DC] btn-interactive cursor-pointer"
              >
                Keep Current
              </button>
              <button
                type="button"
                onClick={confirmChange}
                className="px-4 py-2 rounded-xl text-xs font-bold text-[#FFFFFF] bg-[#D7263D] hover:bg-[#A93226] btn-interactive shadow-xs cursor-pointer"
              >
                Confirm & Switch Category
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-5 border-b border-[#EAE3DC]">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-2xl bg-[#FFF3EC] border border-[#FA661C]/20 text-[#FA661C]">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-['Outfit'] text-lg sm:text-xl font-extrabold text-[#FA661C] tracking-tight">
              1. Category & Standard Classification
            </h2>
            <p className="text-xs text-[#6B6058]">
              Admin-governed category taxonomy determines dynamic attributes, variations, HSN, and GST rates.
            </p>
          </div>
        </div>

        {selectedCategory && (
          <span className="text-[10px] font-black uppercase tracking-wider bg-[#FFF3EC] text-[#FA661C] border border-[#FA661C]/20 px-3 py-1 rounded-full self-start sm:self-auto flex items-center space-x-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#FF811A]" />
            <span>Category Active: {selectedCategory.name || selectedCategory.subCategory}</span>
          </span>
        )}
      </div>

      {/* Interactive Category Selection */}
      <div className="mt-6">
        <label className="block text-xs font-bold text-[#6B6058] mb-3">
          Select Standardized Product Category <span className="text-[#D7263D]">*</span>
        </label>

        {isLoadingCategories ? (
          <div className="flex items-center space-x-2 text-xs font-bold text-[#FA661C] py-8 justify-center">
            <Loader2 className="w-5 h-5 animate-spin text-[#FA661C]" />
            <span>Fetching real category tree from backend API...</span>
          </div>
        ) : hasApiCategories ? (
          /* Real Backend API Category Tree Renderer */
          <div className="space-y-4">
            {/* Main Category Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {categoriesTree.map((mainCat) => {
                const hasChildren = mainCat.children && mainCat.children.length > 0;
                const isMainSelected = selectedCategory?.id === mainCat.id || selectedParentId === mainCat.id || (selectedCategory?.parent === mainCat.id);

                return (
                  <button
                    key={mainCat.id}
                    type="button"
                    onClick={() => {
                      if (hasChildren) {
                        setSelectedParentId(mainCat.id);
                        // Also auto select first child if needed or let user pick subcategory
                        handleCategoryClick(mainCat.children[0]);
                      } else {
                        setSelectedParentId(null);
                        handleCategoryClick(mainCat);
                      }
                    }}
                    className={`p-4 rounded-2xl border text-left transition-all relative overflow-hidden cursor-pointer btn-interactive ${
                      isMainSelected
                        ? 'bg-[#FA661C] text-[#FFFFFF] border-[#FF811A] shadow-md ring-2 ring-[#FF811A]/40'
                        : 'bg-[#FFFFFF] text-[#FA661C] border-[#EAE3DC] hover:border-[#FA661C]/50 hover:bg-[#FFF3EC]/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="font-['Outfit'] font-bold text-sm leading-snug">
                        {mainCat.name}
                      </h3>
                      {isMainSelected && (
                        <CheckCircle2 className="w-4 h-4 text-[#FF811A] fill-[#FA661C]" />
                      )}
                    </div>
                    {hasChildren && (
                      <p className={`text-[10px] mt-2 flex items-center space-x-1 ${isMainSelected ? 'text-[#FFF8F2]' : 'text-[#6B6058]'}`}>
                        <span>{mainCat.children.length} Subcategories</span>
                        <ChevronRight className="w-3 h-3" />
                      </p>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Subcategories (if selected parent has children) */}
            {categoriesTree.find(c => c.id === selectedParentId || c.children?.some(ch => ch.id === selectedCategory?.id))?.children?.length > 0 && (
              <div className="pt-4 border-t border-[#EAE3DC]">
                <span className="text-[11px] font-extrabold text-[#FA661C] uppercase tracking-wider block mb-2.5">
                  Select Subcategory
                </span>
                <div className="flex flex-wrap gap-2.5">
                  {categoriesTree
                    .find(c => c.id === selectedParentId || c.children?.some(ch => ch.id === selectedCategory?.id))
                    .children.map((subCat) => {
                      const isSubSelected = selectedCategory?.id === subCat.id;

                      return (
                        <button
                          key={subCat.id}
                          type="button"
                          onClick={() => handleCategoryClick(subCat)}
                          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 cursor-pointer btn-interactive ${
                            isSubSelected
                              ? 'bg-[#FA661C] text-white border border-[#FF811A] shadow-xs'
                              : 'bg-white text-[#FA661C] border border-[#EAE3DC] hover:border-[#FA661C] hover:bg-[#FFF3EC]'
                          }`}
                        >
                          {isSubSelected && <CheckCircle2 className="w-3.5 h-3.5 text-[#FF811A]" />}
                          <span>{subCat.name}</span>
                        </button>
                      );
                    })}
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Database Categories Empty State */
          <div className="p-8 rounded-3xl border border-dashed border-[#EAE3DC] bg-[#FFF8F2]/50 text-center space-y-2">
            <div className="w-10 h-10 rounded-2xl bg-[#FFF3EC] border border-[#FA661C]/20 text-[#FA661C] mx-auto flex items-center justify-center">
              <Layers className="w-5 h-5" />
            </div>
            <h4 className="font-['Outfit'] font-bold text-sm text-[#FA661C]">
              No Product Categories Available in Database
            </h4>
            <p className="text-xs text-[#6B6058] max-w-md mx-auto">
              There are no active catalog categories in the database. An administrator must create catalog categories via the Admin Command Center before products can be classified.
            </p>
          </div>
        )}
      </div>

      {/* Selected Category Banner */}
      {selectedCategory && (
        <div className="mt-5 p-3.5 rounded-2xl bg-[#FFFFFF] border border-[#EAE3DC] flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center space-x-2 text-[#FA661C]">
            <Info className="w-4 h-4 text-[#FF811A] shrink-0" />
            <span className="text-[11px]">
              Selected Category: <strong>{selectedCategory.name || selectedCategory.subCategory}</strong> (ID: {selectedCategory.id})
            </span>
          </div>
        </div>
      )}

    </section>
  );
}

