import React from 'react';
import { Package, AlertTriangle, RefreshCw, Edit3, ArrowRight, CheckCircle2 } from 'lucide-react';
import { PRODUCTS_WIDGET_DATA } from '../../data/sellerDashboardData';
import { useCountUp } from '../../hooks/useCountUp';
import { useToast } from '../../context/ToastContext';

function AnimatedCount({ target }) {
  const count = useCountUp(target, 600);
  return <span>{count}</span>;
}

export default function SellerProductsWidget({ onNavigateToProducts }) {
  const toast = useToast();
  const data = PRODUCTS_WIDGET_DATA;

  const handleAction = (item) => {
    if (item.type === 'pending-approval') {
      toast.info("Listing Editor", `Opening compliance review editor for ${item.sku}`);
    } else {
      toast.success("Stock Replenished", `Added +25 units to ${item.name}`);
    }
  };

  return (
    <section aria-labelledby="products-widget-heading" className="bg-white rounded-3xl border border-[#D8E0DC] p-5 sm:p-6 shadow-xs flex flex-col justify-between h-full">
      <div>
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#D8E0DC]">
          <div className="flex items-center space-x-2">
            <span className="p-1 rounded-lg bg-[#FCF7E8] text-[#0F3D2E]">
              <Package className="w-4 h-4 text-[#D4AF37]" />
            </span>
            <h3 id="products-widget-heading" className="font-['Outfit'] font-extrabold text-base text-[#0F3D2E]">
              Inventory & Catalog Health
            </h3>
          </div>

          <button
            type="button"
            onClick={onNavigateToProducts}
            className="text-xs font-bold text-[#0F3D2E] hover:text-[#D4AF37] link-interactive flex items-center space-x-0.5 cursor-pointer"
          >
            <span>Manage All (48)</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* 5 Status Count Cards (Low Stock / Out of Stock use Brick-Red) */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 my-3 text-xs">
          {data.counts.map((st) => (
            <div
              key={st.id}
              className={`p-2.5 rounded-xl border flex flex-col justify-between ${
                st.isUrgent
                  ? 'bg-[#FDEDEC]/40 border-[#C0392B]/40 shadow-2xs'
                  : st.isHighlight
                  ? 'bg-[#FCF7E8] border-[#D4AF37]/50'
                  : 'bg-[#FBF8F1] border-[#D8E0DC]'
              }`}
            >
              <span className="text-[10px] font-bold text-[#5C6B63] truncate">
                {st.label}
              </span>
              <div className={`font-['Outfit'] font-black text-lg mt-0.5 ${
                st.isUrgent ? 'text-[#C0392B]' : 'text-[#0F3D2E]'
              }`}>
                <AnimatedCount target={st.count} />
              </div>
            </div>
          ))}
        </div>

        {/* Compact "Needs Attention" List (Staggered Entrance Animation) */}
        <div className="mt-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-[#C0392B] uppercase tracking-wider flex items-center space-x-1">
              <AlertTriangle className="w-3 h-3 text-[#C0392B]" />
              <span>Needs Immediate Attention (4 SKUs)</span>
            </span>
          </div>

          <div className="space-y-2 divide-y divide-[#D8E0DC]/40">
            {data.needsAttention.map((item, idx) => {
              const isUrgent = item.type === 'low-stock' || item.type === 'out-of-stock';

              return (
                <div
                  key={item.id}
                  style={{ animationDelay: `${idx * 60}ms` }}
                  className="pt-2 first:pt-0 flex items-center justify-between gap-2.5 hover:bg-[#FBF8F1] p-1.5 rounded-xl transition-all animate-reveal"
                >
                  <div className="flex items-center space-x-2.5 truncate">
                    <img
                      src={item.thumbnail}
                      alt={item.name}
                      className="w-9 h-9 rounded-lg object-cover border border-[#D8E0DC] shrink-0"
                    />
                    <div className="truncate">
                      <h5 className="font-bold text-xs text-[#0F3D2E] truncate max-w-[210px]">
                        {item.name}
                      </h5>
                      <span className={`text-[10px] font-bold block ${
                        isUrgent ? 'text-[#C0392B]' : 'text-[#D4AF37]'
                      }`}>
                        {item.issue}
                      </span>
                    </div>
                  </div>

                  <div className="shrink-0">
                    <button
                      type="button"
                      onClick={() => handleAction(item)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold btn-interactive flex items-center space-x-1 cursor-pointer shadow-2xs ${
                        isUrgent
                          ? 'bg-[#0F3D2E] text-[#FBF8F1] hover:bg-[#155440]'
                          : 'bg-[#FCF7E8] text-[#0F3D2E] border border-[#D4AF37]/50'
                      }`}
                    >
                      {item.type === 'pending-approval' ? (
                        <>
                          <Edit3 className="w-2.5 h-2.5 text-[#D4AF37]" />
                          <span>Edit</span>
                        </>
                      ) : (
                        <>
                          <RefreshCw className="w-2.5 h-2.5 text-[#D4AF37]" />
                          <span>Restock</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      <div className="mt-3 pt-2.5 border-t border-[#D8E0DC]/60 text-right">
        <button
          type="button"
          onClick={() => toast.info("Bulk Stock Sync", "Opening Bulk CSV Inventory Transfer.")}
          className="text-[11px] font-bold text-[#0F3D2E] hover:text-[#D4AF37] link-interactive cursor-pointer"
        >
          Bulk Inventory Restock File →
        </button>
      </div>
    </section>
  );
}
