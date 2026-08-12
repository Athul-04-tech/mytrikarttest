import React, { useState } from 'react';
import { Package, Plus, Search, Filter, RefreshCw, Trash2, Edit3, CheckCircle2, AlertTriangle, ExternalLink } from 'lucide-react';
import { POPULAR_PICKS } from '../../../data/mockData';
import { useToast } from '../../../context/ToastContext';

export default function SellerProductsView({ onNavigateToAddProduct }) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const toast = useToast();

  const sellerCatalog = POPULAR_PICKS.filter(p => p.categorySlug === 'electronics' || p.categorySlug === 'mobiles');

  return (
    <div className="space-y-6 text-xs animate-reveal">
      
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-[#D8E0DC]">
        <div>
          <h2 className="font-['Outfit'] text-xl sm:text-2xl font-extrabold text-[#0F3D2E]">
            Products & Catalog Inventory
          </h2>
          <p className="text-xs text-[#5C6B63] mt-0.5">
            Manage your 48 published SKUs, adjust inventory counts, and review compliance status.
          </p>
        </div>

        <button
          type="button"
          onClick={onNavigateToAddProduct}
          className="px-4 py-2.5 bg-[#0F3D2E] hover:bg-[#155440] text-[#FBF8F1] rounded-2xl font-black text-xs btn-interactive flex items-center space-x-1.5 shadow-xs cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 text-[#D4AF37]" />
          <span>Add New Product Listing</span>
        </button>
      </div>

      {/* Filter & Search Strip */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-[#D8E0DC]">
        <div className="flex items-center space-x-2 bg-[#FBF8F1] px-3 py-1.5 rounded-xl border border-[#D8E0DC] flex-1 max-w-sm">
          <Search className="w-3.5 h-3.5 text-[#5C6B63]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search SKU, title, or brand..."
            className="bg-transparent text-xs text-[#0F3D2E] outline-none w-full"
          />
        </div>

        <div className="flex items-center space-x-2 overflow-x-auto">
          {['all', 'published', 'low-stock', 'pending'].map((flt) => (
            <button
              key={flt}
              type="button"
              onClick={() => setFilter(flt)}
              className={`px-3 py-1.5 rounded-xl font-bold capitalize transition-all cursor-pointer ${
                filter === flt
                  ? 'bg-[#0F3D2E] text-[#FBF8F1]'
                  : 'bg-[#FBF8F1] text-[#5C6B63] hover:text-[#0F3D2E]'
              }`}
            >
              {flt.replace('-', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Catalog Table */}
      <div className="bg-white rounded-3xl border border-[#D8E0DC] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#FBF8F1] border-b border-[#D8E0DC] text-[#0F3D2E] font-bold">
                <th className="p-3.5">Product Title & SKU</th>
                <th className="p-3.5">Category</th>
                <th className="p-3.5">Listing Price</th>
                <th className="p-3.5">Stock Status</th>
                <th className="p-3.5">Rating</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#D8E0DC]/60">
              {sellerCatalog.map((prod) => (
                <tr key={prod.id} className="hover:bg-[#FBF8F1]/60 transition-colors">
                  <td className="p-3.5">
                    <div className="flex items-center space-x-3">
                      <img src={prod.image} alt={prod.name} className="w-10 h-10 rounded-xl object-cover border border-[#D8E0DC] shrink-0" />
                      <div>
                        <span className="font-bold text-[#0F3D2E] block truncate max-w-[260px]">{prod.name}</span>
                        <span className="text-[10px] font-mono text-[#5C6B63]">{prod.id.toUpperCase()}</span>
                      </div>
                    </div>
                  </td>
                  <td className="p-3.5 font-medium text-[#5C6B63]">{prod.category}</td>
                  <td className="p-3.5 font-bold font-mono text-[#0F3D2E]">{prod.price}</td>
                  <td className="p-3.5">
                    {prod.isUrgent ? (
                      <span className="text-[10px] font-bold text-[#C0392B] bg-[#FDEDEC] px-2 py-0.5 rounded-full">
                        Low Stock (3 Units)
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-[#0F3D2E] bg-[#E8F2EE] px-2 py-0.5 rounded-full">
                        In Stock (45 Units)
                      </span>
                    )}
                  </td>
                  <td className="p-3.5 font-medium text-[#0F3D2E]">★ {prod.rating} ({prod.reviews})</td>
                  <td className="p-3.5 text-right">
                    <div className="flex items-center justify-end space-x-1.5">
                      <button
                        type="button"
                        onClick={() => toast.info("Editor", `Editing listing for ${prod.name}`)}
                        className="p-1.5 rounded-lg text-[#0F3D2E] hover:bg-[#E8F2EE] icon-interactive cursor-pointer"
                        title="Edit Listing"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => toast.success("Stock Added", `Added +20 units to ${prod.name}`)}
                        className="p-1.5 rounded-lg text-[#0F3D2E] hover:bg-[#E8F2EE] icon-interactive cursor-pointer"
                        title="Quick Restock"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
