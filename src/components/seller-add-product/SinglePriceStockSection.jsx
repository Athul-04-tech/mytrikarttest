import React from 'react';
import { DollarSign, Tag, Package, Sparkles, Percent, ShieldCheck } from 'lucide-react';

export default function SinglePriceStockSection({
  mrp,
  setMrp,
  sellingPrice,
  setSellingPrice,
  stockQuantity,
  setStockQuantity,
  gstRate
}) {
  const numMrp = parseFloat(mrp) || 0;
  const numPrice = parseFloat(sellingPrice) || 0;
  const discountPercent = numMrp > numPrice && numMrp > 0
    ? Math.round(((numMrp - numPrice) / numMrp) * 100)
    : 0;

  // Accurate Tax Arithmetic: Base Taxable = SellingPrice / (1 + GST/100)
  const gstMultiplier = 1 + (parseFloat(gstRate) || 18) / 100;
  const taxableValue = numPrice > 0 ? (numPrice / gstMultiplier).toFixed(2) : '0.00';
  const gstAmount = numPrice > 0 ? (numPrice - parseFloat(taxableValue)).toFixed(2) : '0.00';

  return (
    <section className="bg-white rounded-3xl border border-[#EAE3DC] p-6 sm:p-8 shadow-xs relative animate-fadeIn">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-[#EAE3DC]">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-2xl bg-[#FFF3EC] border border-[#FA661C]/20 text-[#FA661C]">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-['Outfit'] text-lg sm:text-xl font-extrabold text-[#FA661C] tracking-tight">
              3. Pricing & Inventory Configuration
            </h2>
            <p className="text-xs text-[#6B6058]">
              Configure base listing price, statutory GST breakdown, and fulfillment stock count.
            </p>
          </div>
        </div>

        {discountPercent > 0 && (
          <span className="text-[10px] font-black uppercase tracking-wider bg-[#FFF8F2] text-[#FA661C] border border-[#FF811A] px-3 py-1 rounded-full self-start sm:self-auto flex items-center space-x-1">
            <Percent className="w-3.5 h-3.5 text-[#FF811A]" />
            <span>{discountPercent}% Customer Discount</span>
          </span>
        )}
      </div>

      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* Maximum Retail Price (MRP) */}
        <div>
          <label htmlFor="prod-mrp" className="block text-xs font-bold text-[#6B6058] mb-1.5">
            Maximum Retail Price (MRP) <span className="text-[#D7263D]">*</span>
          </label>
          <div className="relative">
            <span className="absolute left-3.5 top-2.5 text-xs font-bold text-[#6B6058]">₹</span>
            <input
              id="prod-mrp"
              type="number"
              value={mrp}
              onChange={(e) => setMrp(e.target.value)}
              placeholder="e.g. 9999"
              className="w-full pl-7 pr-3.5 py-2.5 rounded-xl bg-white border border-[#EAE3DC] text-[#FA661C] text-xs font-bold focus:border-[#FA661C] focus:ring-1 focus:ring-[#FA661C] outline-none input-interactive"
              required
            />
          </div>
        </div>

        {/* Selling Price */}
        <div>
          <label htmlFor="prod-selling-price" className="block text-xs font-bold text-[#FA661C] mb-1.5">
            Final Selling Price (Incl. GST) <span className="text-[#D7263D]">*</span>
          </label>
          <div className="relative">
            <span className="absolute left-3.5 top-2.5 text-xs font-bold text-[#FA661C]">₹</span>
            <input
              id="prod-selling-price"
              type="number"
              value={sellingPrice}
              onChange={(e) => setSellingPrice(e.target.value)}
              placeholder="e.g. 4999"
              className="w-full pl-7 pr-3.5 py-2.5 rounded-xl bg-white border border-[#FA661C] text-[#FA661C] text-sm font-extrabold focus:border-[#FA661C] focus:ring-2 focus:ring-[#FA661C]/20 outline-none input-interactive"
              required
            />
          </div>
        </div>

        {/* Available Stock Quantity */}
        <div>
          <label htmlFor="prod-stock-qty" className="block text-xs font-bold text-[#6B6058] mb-1.5">
            Available Warehouse Stock (Units) <span className="text-[#D7263D]">*</span>
          </label>
          <div className="relative">
            <Package className="w-4 h-4 text-[#6B6058] absolute left-3.5 top-3 pointer-events-none" />
            <input
              id="prod-stock-qty"
              type="number"
              value={stockQuantity}
              onChange={(e) => setStockQuantity(e.target.value)}
              placeholder="e.g. 50"
              className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-white border border-[#EAE3DC] text-[#FA661C] text-xs font-bold focus:border-[#FA661C] focus:ring-1 focus:ring-[#FA661C] outline-none input-interactive"
              required
            />
          </div>
        </div>

      </div>

      {/* Tax Arithmetic Summary Card */}
      <div className="mt-5 p-4 rounded-2xl bg-[#FFFFFF] border border-[#EAE3DC] flex flex-wrap items-center justify-between gap-4 text-xs">
        <div className="flex items-center space-x-2 text-[#FA661C]">
          <ShieldCheck className="w-4 h-4 text-[#FF811A]" />
          <span className="font-bold">Calculated Statutory Tax Split ({gstRate}% GST):</span>
        </div>

        <div className="flex items-center space-x-6 text-[11px] font-mono">
          <div>
            <span className="text-[#6B6058]">Net Taxable Supply:</span>
            <strong className="text-[#FA661C] ml-1">₹{parseFloat(taxableValue).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong>
          </div>
          <div>
            <span className="text-[#6B6058]">GST Liability ({gstRate}%):</span>
            <strong className="text-[#FA661C] ml-1">₹{parseFloat(gstAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong>
          </div>
        </div>
      </div>

    </section>
  );
}
