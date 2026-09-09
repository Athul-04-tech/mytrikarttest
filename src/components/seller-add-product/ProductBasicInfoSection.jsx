import React from 'react';
import { FileText, Sparkles, Tag, Building2, CheckCircle2 } from 'lucide-react';

export default function ProductBasicInfoSection({
  title,
  setTitle,
  brand,
  setBrand,
  subtitle,
  setSubtitle,
  description,
  setDescription,
  baseSku,
  setBaseSku
}) {
  return (
    <section className="bg-white rounded-3xl border border-[#EAE3DC] p-6 sm:p-8 shadow-xs relative animate-fadeIn">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-[#EAE3DC]">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-2xl bg-[#FFF3EC] border border-[#FA661C]/20 text-[#FA661C]">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-['Outfit'] text-lg sm:text-xl font-extrabold text-[#FA661C] tracking-tight">
              Product Identity & Brand Narrative
            </h2>
            <p className="text-xs text-[#6B6058]">
              Customer-facing listing title, brand identifier, and key selling propositions.
            </p>
          </div>
        </div>
      </div>

      <div className="mt-6 space-y-5">
        
        {/* Title + Brand Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          
          <div className="sm:col-span-2">
            <label htmlFor="prod-title" className="block text-xs font-bold text-[#FA661C] mb-1.5">
              Product Listing Title <span className="text-[#D7263D]">*</span>
            </label>
            <input
              id="prod-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Mytri Elite Spatial ANC Wireless Headphones (2026 Edition)"
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#EAE3DC] text-[#FA661C] text-xs font-bold focus:border-[#FA661C] focus:ring-1 focus:ring-[#FA661C] outline-none input-interactive"
              required
            />
            <p className="text-[10px] text-[#6B6058] mt-1">
              Include Brand + Model Name + Key Specifier. ({title.length}/120 characters)
            </p>
          </div>

          <div>
            <label htmlFor="prod-brand" className="block text-xs font-bold text-[#FA661C] mb-1.5">
              Brand / Manufacturer <span className="text-[#D7263D]">*</span>
            </label>
            <div className="relative">
              <Building2 className="w-4 h-4 text-[#6B6058] absolute left-3.5 top-3 pointer-events-none" />
              <input
                id="prod-brand"
                type="text"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                placeholder="e.g. Apex Electronics Direct"
                className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-white border border-[#EAE3DC] text-[#FA661C] text-xs font-bold focus:border-[#FA661C] focus:ring-1 focus:ring-[#FA661C] outline-none input-interactive"
                required
              />
            </div>
          </div>

        </div>

        {/* Subtitle & Base SKU */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          
          <div className="sm:col-span-2">
            <label htmlFor="prod-subtitle" className="block text-xs font-bold text-[#6B6058] mb-1.5">
              Short Product Subtitle / Tagline
            </label>
            <input
              id="prod-subtitle"
              type="text"
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              placeholder="e.g. 45dB Hybrid Active Noise Cancellation with High-Res Spatial Audio"
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#EAE3DC] text-[#FA661C] text-xs font-medium focus:border-[#FA661C] focus:ring-1 focus:ring-[#FA661C] outline-none input-interactive"
            />
          </div>

          <div>
            <label htmlFor="prod-base-sku" className="block text-xs font-bold text-[#6B6058] mb-1.5">
              Master Base SKU
            </label>
            <input
              id="prod-base-sku"
              type="text"
              value={baseSku}
              onChange={(e) => setBaseSku(e.target.value)}
              placeholder="e.g. SKU-AUD-9520"
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#FFFFFF] border border-[#EAE3DC] text-[#FA661C] text-xs font-mono font-bold uppercase focus:border-[#FA661C] outline-none input-interactive"
            />
          </div>

        </div>

        {/* Detailed Description */}
        <div>
          <label htmlFor="prod-description" className="block text-xs font-bold text-[#FA661C] mb-1.5">
            Comprehensive Product Description & Key Highlights <span className="text-[#D7263D]">*</span>
          </label>
          <textarea
            id="prod-description"
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="• Engineered with 40mm Beryllium dynamic drivers for acoustic precision&#10;• 60-hour ultra-extended battery playback with 10-minute fast charging&#10;• Premium breathable vegan leather memory foam earcups with gold accents"
            className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#EAE3DC] text-[#FA661C] text-xs font-medium focus:border-[#FA661C] focus:ring-1 focus:ring-[#FA661C] outline-none resize-none input-interactive"
            required
          />
        </div>

      </div>

    </section>
  );
}
