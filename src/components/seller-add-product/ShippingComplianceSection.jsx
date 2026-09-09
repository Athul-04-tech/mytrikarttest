import React from 'react';
import { Truck, ShieldCheck, Globe2, Sparkles, Scale, Box } from 'lucide-react';

export default function ShippingComplianceSection({
  weightKg,
  setWeightKg,
  dimensions,
  setDimensions,
  hsnCode,
  setHsnCode,
  gstRate,
  setGstRate,
  countryOfOrigin,
  setCountryOfOrigin,
  inheritShippingPolicy,
  setInheritShippingPolicy,
  inheritReturnPolicy,
  setInheritReturnPolicy
}) {
  return (
    <section className="bg-white rounded-3xl border border-[#EAE3DC] p-6 sm:p-8 shadow-xs relative animate-fadeIn">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-[#EAE3DC]">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-2xl bg-[#FFF3EC] border border-[#FA661C]/20 text-[#FA661C]">
            <Truck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-['Outfit'] text-lg sm:text-xl font-extrabold text-[#FA661C] tracking-tight">
              5. Shipping, Logistics & Statutory Compliance
            </h2>
            <p className="text-xs text-[#6B6058]">
              Fulfillment package specifications, HSN tax classifications, and store return policies.
            </p>
          </div>
        </div>
      </div>

      <div className="mt-6 space-y-6">
        
        {/* Logistics Dimensions Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          
          <div>
            <label htmlFor="prod-weight" className="block text-xs font-bold text-[#6B6058] mb-1.5">
              Dead Weight (kg) <span className="text-[#D7263D]">*</span>
            </label>
            <div className="relative">
              <Scale className="w-4 h-4 text-[#6B6058] absolute left-3.5 top-3 pointer-events-none" />
              <input
                id="prod-weight"
                type="text"
                value={weightKg}
                onChange={(e) => setWeightKg(e.target.value)}
                placeholder="e.g. 0.45"
                className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-white border border-[#EAE3DC] text-[#FA661C] text-xs font-bold focus:border-[#FA661C] outline-none input-interactive"
                required
              />
            </div>
          </div>

          <div>
            <label htmlFor="prod-dimensions" className="block text-xs font-bold text-[#6B6058] mb-1.5">
              Package Dimensions (L x W x H) <span className="text-[#D7263D]">*</span>
            </label>
            <div className="relative">
              <Box className="w-4 h-4 text-[#6B6058] absolute left-3.5 top-3 pointer-events-none" />
              <input
                id="prod-dimensions"
                type="text"
                value={dimensions}
                onChange={(e) => setDimensions(e.target.value)}
                placeholder="e.g. 20 x 15 x 8 cm"
                className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-white border border-[#EAE3DC] text-[#FA661C] text-xs font-bold focus:border-[#FA661C] outline-none input-interactive"
                required
              />
            </div>
          </div>

          <div>
            <label htmlFor="prod-origin" className="block text-xs font-bold text-[#6B6058] mb-1.5">
              Country of Origin <span className="text-[#D7263D]">*</span>
            </label>
            <div className="relative">
              <Globe2 className="w-4 h-4 text-[#6B6058] absolute left-3.5 top-3 pointer-events-none" />
              <select
                id="prod-origin"
                value={countryOfOrigin}
                onChange={(e) => setCountryOfOrigin(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-white border border-[#EAE3DC] text-[#FA661C] text-xs font-bold focus:border-[#FA661C] outline-none input-interactive cursor-pointer"
              >
                <option value="India">India</option>
                <option value="United Arab Emirates">United Arab Emirates (UAE)</option>
                <option value="Ireland">Ireland (EU)</option>
                <option value="Germany">Germany</option>
                <option value="Japan">Japan</option>
                <option value="United States">United States</option>
              </select>
            </div>
          </div>

        </div>

        {/* HSN & GST Rate */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          
          <div>
            <label htmlFor="prod-hsn" className="block text-xs font-bold text-[#6B6058] mb-1.5">
              Statutory HSN / SAC Code (8-Digit) <span className="text-[#D7263D]">*</span>
            </label>
            <input
              id="prod-hsn"
              type="text"
              value={hsnCode}
              onChange={(e) => setBaseSku ? setHsnCode(e.target.value) : setHsnCode(e.target.value)}
              placeholder="e.g. 85183000"
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#EAE3DC] text-[#FA661C] text-xs font-mono font-bold uppercase focus:border-[#FA661C] outline-none input-interactive"
              required
            />
          </div>

          <div>
            <label htmlFor="prod-gst" className="block text-xs font-bold text-[#6B6058] mb-1.5">
              Statutory GST Slab (%) <span className="text-[#D7263D]">*</span>
            </label>
            <select
              id="prod-gst"
              value={gstRate}
              onChange={(e) => setGstRate(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#EAE3DC] text-[#FA661C] text-xs font-bold focus:border-[#FA661C] outline-none input-interactive cursor-pointer"
            >
              <option value="0">0% (Nil / Exempted)</option>
              <option value="5">5% (Apparel & Essentials)</option>
              <option value="12">12% (Home Linens & Processed Goods)</option>
              <option value="18">18% (Electronics, Computing & Audio)</option>
              <option value="28">28% (Luxury & High-Capacity)</option>
            </select>
          </div>

        </div>

        {/* Store Policy Inheritance Toggles */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          
          <div className="flex items-center justify-between p-4 rounded-2xl bg-[#FFFFFF] border border-[#EAE3DC]">
            <div>
              <span className="text-xs font-bold text-[#FA661C] block">Inherit Store Shipping Policy</span>
              <span className="text-[10px] text-[#6B6058]">Free Express Delivery on orders above ₹999</span>
            </div>
            <button
              type="button"
              onClick={() => setInheritShippingPolicy(!inheritShippingPolicy)}
              className={`w-11 h-6 rounded-full transition-colors relative focus:outline-none cursor-pointer ${
                inheritShippingPolicy ? 'bg-[#FA661C]' : 'bg-[#EAE3DC]'
              }`}
            >
              <div className={`w-4 h-4 rounded-full bg-[#FFFFFF] absolute top-1 toggle-thumb-spring ${
                inheritShippingPolicy ? 'right-1' : 'left-1'
              }`} />
            </button>
          </div>

          <div className="flex items-center justify-between p-4 rounded-2xl bg-[#FFFFFF] border border-[#EAE3DC]">
            <div>
              <span className="text-xs font-bold text-[#FA661C] block">Inherit 7-Day Return & SLA</span>
              <span className="text-[10px] text-[#6B6058]">Standard 1-Year Brand Manufacturer Warranty</span>
            </div>
            <button
              type="button"
              onClick={() => setInheritReturnPolicy(!inheritReturnPolicy)}
              className={`w-11 h-6 rounded-full transition-colors relative focus:outline-none cursor-pointer ${
                inheritReturnPolicy ? 'bg-[#FA661C]' : 'bg-[#EAE3DC]'
              }`}
            >
              <div className={`w-4 h-4 rounded-full bg-[#FFFFFF] absolute top-1 toggle-thumb-spring ${
                inheritReturnPolicy ? 'right-1' : 'left-1'
              }`} />
            </button>
          </div>

        </div>

      </div>

    </section>
  );
}
