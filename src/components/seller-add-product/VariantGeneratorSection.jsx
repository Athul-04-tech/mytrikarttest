import React, { useState } from 'react';
import { 
  GitBranch, 
  Sparkles, 
  DollarSign, 
  Package, 
  RefreshCw, 
  Trash2, 
  CheckCircle2, 
  Info,
  Layers,
  ArrowRight 
} from 'lucide-react';
import { useToast } from '../../context/ToastContext';

export default function VariantGeneratorSection({
  variants,
  onUpdateVariant,
  onBulkApplyPrice,
  onBulkApplyStock
}) {
  const [bulkPriceInput, setBulkPriceInput] = useState('');
  const [bulkStockInput, setBulkStockInput] = useState('');
  const toast = useToast();

  const handleApplyBulkPrice = (e) => {
    e.preventDefault();
    const val = parseFloat(bulkPriceInput);
    if (!val || val <= 0) {
      toast.error("Invalid Price", "Enter a valid positive selling price.");
      return;
    }
    onBulkApplyPrice(val);
    toast.success("Bulk Price Applied", `Updated selling price to ₹${val.toLocaleString('en-IN')} across all ${variants.length} variations.`);
    setBulkPriceInput('');
  };

  const handleApplyBulkStock = (e) => {
    e.preventDefault();
    const val = parseInt(bulkStockInput, 10);
    if (isNaN(val) || val < 0) {
      toast.error("Invalid Stock", "Enter a valid stock quantity.");
      return;
    }
    onBulkApplyStock(val);
    toast.success("Bulk Stock Applied", `Updated inventory stock to ${val} units across all ${variants.length} variations.`);
    setBulkStockInput('');
  };

  return (
    <section className="bg-white rounded-3xl border border-[#EAE3DC] p-6 sm:p-8 shadow-xs relative animate-fadeIn">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-[#EAE3DC]">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-2xl bg-[#FFF8F2] border border-[#FF811A]/40 text-[#FA661C]">
            <GitBranch className="w-5 h-5 text-[#FF811A]" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="font-['Outfit'] text-lg sm:text-xl font-extrabold text-[#FA661C] tracking-tight">
                3. Variant Matrix & SKU Inventory
              </h2>
              <span className="text-[10px] font-black uppercase bg-[#FA661C] text-[#FF811A] px-2.5 py-0.5 rounded-full">
                {variants.length} Combinations Generated
              </span>
            </div>
            <p className="text-xs text-[#6B6058]">
              Real-time Cartesian product calculated from selected variation attributes. Configure individual prices & stock.
            </p>
          </div>
        </div>
      </div>

      {/* Bulk Action Toolbar */}
      <div className="mt-5 p-4 rounded-2xl bg-[#FFFFFF] border border-[#EAE3DC] flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs">
        <div className="flex items-center space-x-2 text-[#FA661C]">
          <Sparkles className="w-4 h-4 text-[#FF811A] shrink-0" />
          <span className="font-bold">Quick Bulk Applicators:</span>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Bulk Price */}
          <form onSubmit={handleApplyBulkPrice} className="flex items-center space-x-1.5">
            <div className="relative">
              <span className="absolute left-2.5 top-2 text-xs font-bold text-[#6B6058]">₹</span>
              <input
                type="number"
                value={bulkPriceInput}
                onChange={(e) => setBulkPriceInput(e.target.value)}
                placeholder="Bulk Price"
                className="w-28 pl-6 pr-2 py-1.5 rounded-xl bg-white border border-[#EAE3DC] text-xs font-bold text-[#FA661C] outline-none"
              />
            </div>
            <button
              type="submit"
              className="px-3 py-1.5 bg-[#FA661C] hover:bg-[#E0530B] text-[#FFFFFF] rounded-xl text-xs font-bold btn-interactive cursor-pointer"
            >
              Apply All
            </button>
          </form>

          {/* Bulk Stock */}
          <form onSubmit={handleApplyBulkStock} className="flex items-center space-x-1.5">
            <input
              type="number"
              value={bulkStockInput}
              onChange={(e) => setBulkStockInput(e.target.value)}
              placeholder="Bulk Stock Qty"
              className="w-28 px-3 py-1.5 rounded-xl bg-white border border-[#EAE3DC] text-xs font-bold text-[#FA661C] outline-none"
            />
            <button
              type="submit"
              className="px-3 py-1.5 bg-[#FA661C] hover:bg-[#E0530B] text-[#FFFFFF] rounded-xl text-xs font-bold btn-interactive cursor-pointer"
            >
              Apply All
            </button>
          </form>
        </div>
      </div>

      {/* Desktop Variant Table */}
      <div className="hidden md:block mt-6 border border-[#EAE3DC] rounded-2xl overflow-hidden shadow-2xs">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-[#FFFFFF] border-b border-[#EAE3DC] text-[#FA661C] font-bold">
              <th className="p-3.5">Variant Combination</th>
              <th className="p-3.5">System SKU Code</th>
              <th className="p-3.5">MRP (₹)</th>
              <th className="p-3.5">Selling Price (₹)</th>
              <th className="p-3.5">Inventory Stock</th>
              <th className="p-3.5 text-center">Active Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#EAE3DC]/60">
            {variants.map((v) => (
              <tr 
                key={v.id}
                className={`transition-colors ${
                  v.isActive ? 'hover:bg-[#FFFFFF]/50' : 'bg-[#FFFFFF]/40 opacity-60'
                }`}
              >
                <td className="p-3.5 font-bold text-[#FA661C]">
                  <div className="flex items-center space-x-2">
                    <span className="w-2 h-2 rounded-full bg-[#FF811A]" />
                    <span>{v.combinationLabel}</span>
                  </div>
                </td>

                <td className="p-3.5">
                  <input
                    type="text"
                    value={v.sku}
                    onChange={(e) => onUpdateVariant(v.id, { sku: e.target.value })}
                    className="w-full px-2.5 py-1 rounded-lg bg-[#FFFFFF] border border-[#EAE3DC] font-mono text-[11px] text-[#FA661C] font-bold uppercase"
                  />
                </td>

                <td className="p-3.5">
                  <div className="relative">
                    <span className="absolute left-2 top-1.5 text-[11px] text-[#6B6058]">₹</span>
                    <input
                      type="number"
                      value={v.mrp || ''}
                      onChange={(e) => onUpdateVariant(v.id, { mrp: parseFloat(e.target.value) || 0 })}
                      className="w-24 pl-5 pr-2 py-1 rounded-lg bg-white border border-[#EAE3DC] text-xs font-bold text-[#6B6058]"
                    />
                  </div>
                </td>

                <td className="p-3.5">
                  <div className="relative">
                    <span className="absolute left-2 top-1.5 text-[11px] text-[#FA661C] font-bold">₹</span>
                    <input
                      type="number"
                      value={v.price || ''}
                      onChange={(e) => onUpdateVariant(v.id, { price: parseFloat(e.target.value) || 0 })}
                      className="w-28 pl-5 pr-2 py-1 rounded-lg bg-white border border-[#EAE3DC] text-xs font-extrabold text-[#FA661C] focus:border-[#FA661C]"
                    />
                  </div>
                </td>

                <td className="p-3.5">
                  <input
                    type="number"
                    value={v.stock}
                    onChange={(e) => onUpdateVariant(v.id, { stock: parseInt(e.target.value, 10) || 0 })}
                    className="w-20 px-2.5 py-1 rounded-lg bg-white border border-[#EAE3DC] text-xs font-bold text-[#FA661C]"
                  />
                </td>

                <td className="p-3.5 text-center">
                  <button
                    type="button"
                    onClick={() => onUpdateVariant(v.id, { isActive: !v.isActive })}
                    className={`w-9 h-5 rounded-full transition-colors relative inline-block cursor-pointer ${
                      v.isActive ? 'bg-[#FA661C]' : 'bg-[#EAE3DC]'
                    }`}
                  >
                    <div className={`w-3.5 h-3.5 rounded-full bg-white absolute top-0.8 toggle-thumb-spring ${
                      v.isActive ? 'right-1' : 'left-1'
                    }`} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Stacked Card List */}
      <div className="md:hidden mt-6 space-y-3">
        {variants.map((v) => (
          <div 
            key={v.id}
            className={`p-4 rounded-2xl border transition-all text-xs ${
              v.isActive ? 'bg-white border-[#EAE3DC]' : 'bg-[#FFFFFF] border-[#EAE3DC]/60 opacity-60'
            }`}
          >
            <div className="flex items-center justify-between pb-2 border-b border-[#EAE3DC]">
              <span className="font-extrabold text-[#FA661C]">
                {v.combinationLabel}
              </span>
              <button
                type="button"
                onClick={() => onUpdateVariant(v.id, { isActive: !v.isActive })}
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  v.isActive ? 'bg-[#FFF3EC] text-[#FA661C]' : 'bg-[#EAE3DC] text-[#6B6058]'
                }`}
              >
                {v.isActive ? 'Active' : 'Disabled'}
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-3">
              <div>
                <label className="text-[10px] font-bold text-[#6B6058] block mb-1">Selling Price</label>
                <div className="relative">
                  <span className="absolute left-2 top-1.5 text-xs text-[#FA661C] font-bold">₹</span>
                  <input
                    type="number"
                    value={v.price}
                    onChange={(e) => onUpdateVariant(v.id, { price: parseFloat(e.target.value) || 0 })}
                    className="w-full pl-5 pr-2 py-1.5 rounded-xl border border-[#EAE3DC] font-bold text-[#FA661C]"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-[#6B6058] block mb-1">Stock Qty</label>
                <input
                  type="number"
                  value={v.stock}
                  onChange={(e) => onUpdateVariant(v.id, { stock: parseInt(e.target.value, 10) || 0 })}
                  className="w-full px-3 py-1.5 rounded-xl border border-[#EAE3DC] font-bold text-[#FA661C]"
                />
              </div>

              <div className="col-span-2">
                <label className="text-[10px] font-bold text-[#6B6058] block mb-1">SKU</label>
                <input
                  type="text"
                  value={v.sku}
                  onChange={(e) => onUpdateVariant(v.id, { sku: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-xl border border-[#EAE3DC] font-mono text-[11px] text-[#FA661C]"
                />
              </div>
            </div>
          </div>
        ))}
      </div>

    </section>
  );
}
