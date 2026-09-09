import React from 'react';
import { Package, AlertTriangle, RefreshCw, Edit3, ArrowRight } from 'lucide-react';
import { useCountUp } from '../../hooks/useCountUp';
import { useToast } from '../../context/ToastContext';

function AnimatedCount({ target }) {
  const count = useCountUp(target, 600);
  return <span>{count}</span>;
}

export default function SellerProductsWidget({ productStatusCounts, inventoryAttention, onNavigateToProducts }) {
  const toast = useToast();

  const lowStock = inventoryAttention?.low_stock_variants || [];
  const pendingReview = inventoryAttention?.pending_review_products || [];

  const needsAttentionList = [
    ...lowStock.map(item => ({
      id: `variant-${item.variant_id}`,
      name: item.product_name,
      sku: item.sku_code,
      type: item.stock_quantity === 0 ? 'out-of-stock' : 'low-stock',
      issue: item.sku_code ? `${item.sku_code}: ${item.stock_quantity} units remaining` : `Only ${item.stock_quantity} units remaining`
    })),
    ...pendingReview.map(item => ({
      id: `product-${item.id}`,
      name: item.name,
      type: 'pending-approval',
      issue: 'Pending Compliance Review by Admin'
    }))
  ];

  const totalProducts = productStatusCounts
    ? Object.values(productStatusCounts).reduce((sum, count) => sum + Number(count || 0), 0)
    : 0;

  // Map live API counts matching real backend Product.status model choices (published, pending_review, draft, rejected)
  const countsList = [
    { id: 'published', label: 'Published', count: Number(productStatusCounts?.published || 0), isHighlight: false },
    { id: 'pending', label: 'Pending Review', count: Number(productStatusCounts?.pending_review || 0), isHighlight: true },
    { id: 'draft', label: 'Drafts', count: Number(productStatusCounts?.draft || 0), isHighlight: false },
    { id: 'rejected', label: 'Rejected', count: Number(productStatusCounts?.rejected || 0), isUrgent: true }
  ];

  const handleAction = () => onNavigateToProducts();

  return (
    <section aria-labelledby="products-widget-heading" className="bg-white rounded-3xl border border-[#EAE3DC] p-5 sm:p-6 shadow-xs flex flex-col justify-between h-full">
      <div>
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#EAE3DC]">
          <div className="flex items-center space-x-2">
            <span className="p-1 rounded-lg bg-[#FFF8F2] text-[#FA661C]">
              <Package className="w-4 h-4 text-[#FF811A]" />
            </span>
            <h3 id="products-widget-heading" className="font-['Outfit'] font-extrabold text-base text-[#FA661C]">
              Inventory & Catalog Health
            </h3>
          </div>

          <button
            type="button"
            onClick={onNavigateToProducts}
            className="text-xs font-bold text-[#FA661C] hover:text-[#FF811A] link-interactive flex items-center space-x-0.5 cursor-pointer"
          >
            <span>Manage All ({productStatusCounts ? totalProducts : '—'})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* 4 Real Backend Status Count Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 my-3 text-xs">
          {countsList.map((st) => (
            <div
              key={st.id}
              className={`p-2.5 rounded-xl border flex flex-col justify-between ${
                st.isUrgent
                  ? 'bg-[#FDE8EA]/40 border-[#D7263D]/40 shadow-2xs'
                  : st.isHighlight
                  ? 'bg-[#FFF8F2] border-[#FF811A]/50'
                  : 'bg-[#FFFFFF] border-[#EAE3DC]'
              }`}
            >
              <span className="text-[10px] font-bold text-[#6B6058] truncate">
                {st.label}
              </span>
              <div className={`font-['Outfit'] font-black text-lg mt-0.5 ${
                st.isUrgent ? 'text-[#D7263D]' : 'text-[#FA661C]'
              }`}>
                {productStatusCounts ? <AnimatedCount target={st.count} /> : '—'}
              </div>
            </div>
          ))}
        </div>

        {/* Compact "Needs Attention" List */}
        <div className="mt-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-[#D7263D] uppercase tracking-wider flex items-center space-x-1">
              <AlertTriangle className="w-3 h-3 text-[#D7263D]" />
              <span>Needs Immediate Attention ({needsAttentionList.length} SKUs)</span>
            </span>
          </div>

          {needsAttentionList.length === 0 ? (
            <div className="p-4 bg-[#FFF8F2]/50 border border-[#EAE3DC] rounded-xl text-center text-xs text-[#6B6058]">
              No SKUs need attention
            </div>
          ) : (
            <div className="space-y-2 divide-y divide-[#EAE3DC]/40">
              {needsAttentionList.map((item, idx) => {
                const isUrgent = item.type === 'low-stock' || item.type === 'out-of-stock';

                return (
                  <div
                    key={item.id}
                    style={{ animationDelay: `${idx * 60}ms` }}
                    className="pt-2 first:pt-0 flex items-center justify-between gap-2.5 hover:bg-[#FFFFFF] p-1.5 rounded-xl transition-all animate-reveal"
                  >
                    <div className="flex items-center space-x-2.5 truncate">
                      <div className="truncate">
                        <h5 className="font-bold text-xs text-[#FA661C] truncate max-w-[210px]">
                          {item.name}
                        </h5>
                        <span className={`text-[10px] font-bold block ${
                          isUrgent ? 'text-[#D7263D]' : 'text-[#FF811A]'
                        }`}>
                          {item.issue}
                        </span>
                      </div>
                    </div>

                    <div className="shrink-0">
                      <button
                        type="button"
                        onClick={handleAction}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-bold btn-interactive flex items-center space-x-1 cursor-pointer shadow-2xs ${
                          isUrgent
                            ? 'bg-[#FA661C] text-[#FFFFFF] hover:bg-[#E0530B]'
                            : 'bg-[#FFF8F2] text-[#FA661C] border border-[#FF811A]/50'
                        }`}
                      >
                        {item.type === 'pending-approval' ? (
                          <>
                            <Edit3 className="w-2.5 h-2.5 text-[#FF811A]" />
                            <span>Edit</span>
                          </>
                        ) : (
                          <>
                            <RefreshCw className="w-2.5 h-2.5 text-[#FF811A]" />
                            <span>Restock</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>

      <div className="mt-3 pt-2.5 border-t border-[#EAE3DC]/60 text-right">
        <button
          type="button"
          onClick={() => toast.info("Bulk Stock Sync", "Opening Bulk CSV Inventory Transfer.")}
          className="text-[11px] font-bold text-[#FA661C] hover:text-[#FF811A] link-interactive cursor-pointer"
        >
          Bulk Inventory Restock File →
        </button>
      </div>
    </section>
  );
}
