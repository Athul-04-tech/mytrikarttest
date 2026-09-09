import React from 'react';
import { Search, Globe, Sparkles } from 'lucide-react';

export default function SeoMetadataSection({
  metaTitle,
  setMetaTitle,
  metaDescription,
  setMetaDescription,
  title,
  brand,
  sellingPrice
}) {
  const previewTitle = metaTitle || `${title || 'New Product Listing'} | Best Price at MytriKart`;
  const previewDesc = metaDescription || `Buy ${title || 'this product'} online by ${brand || 'Apex Electronics'}. Explore verified reviews, fast delivery, and lowest price at ₹${sellingPrice || '4,999'}.`;
  const slug = (title || 'new-product').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

  return (
    <section className="bg-white rounded-3xl border border-[#EAE3DC] p-6 sm:p-8 shadow-xs relative animate-fadeIn">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-[#EAE3DC]">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-2xl bg-[#FFF3EC] border border-[#FA661C]/20 text-[#FA661C]">
            <Search className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-['Outfit'] text-lg sm:text-xl font-extrabold text-[#FA661C] tracking-tight">
              6. Organic Search Engine Optimization (SEO)
            </h2>
            <p className="text-xs text-[#6B6058]">
              Targeted search metadata for indexing on Google, Bing, and internal MytriKart search.
            </p>
          </div>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Form Inputs (Left 7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="meta-title" className="text-xs font-bold text-[#FA661C]">
                Meta Title
              </label>
              <span className={`text-[10px] font-bold ${metaTitle.length > 60 ? 'text-[#D7263D]' : 'text-[#6B6058]'}`}>
                {metaTitle.length}/60 chars
              </span>
            </div>
            <input
              id="meta-title"
              type="text"
              value={metaTitle}
              onChange={(e) => setMetaTitle(e.target.value)}
              placeholder="e.g. Mytri Elite Spatial ANC Headphones | Apex Audio Store"
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#EAE3DC] text-[#FA661C] text-xs font-bold focus:border-[#FA661C] outline-none input-interactive"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="meta-desc" className="text-xs font-bold text-[#FA661C]">
                Meta Description
              </label>
              <span className={`text-[10px] font-bold ${metaDescription.length > 160 ? 'text-[#D7263D]' : 'text-[#6B6058]'}`}>
                {metaDescription.length}/160 chars
              </span>
            </div>
            <textarea
              id="meta-desc"
              rows={3}
              value={metaDescription}
              onChange={(e) => setMetaDescription(e.target.value)}
              placeholder="e.g. Experience pristine acoustic depth with 45dB hybrid noise cancellation and 60-hour battery life. Order now with free next-day express delivery."
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#EAE3DC] text-[#FA661C] text-xs font-medium focus:border-[#FA661C] outline-none resize-none input-interactive"
            />
          </div>
        </div>

        {/* Live Google Search Result Preview Card (Right 5 Cols) */}
        <div className="lg:col-span-5">
          <label className="block text-xs font-bold text-[#6B6058] mb-2">
            Live Google SERP Card Preview
          </label>
          <div className="p-4 rounded-2xl bg-[#FFFFFF] border border-[#EAE3DC] space-y-1.5">
            <div className="flex items-center space-x-1.5 text-[11px] text-[#202124]">
              <span className="w-4 h-4 rounded-full bg-[#FA661C] text-[#FF811A] text-[8px] font-black flex items-center justify-center">M</span>
              <span className="font-medium text-[#202124]">https://mytrikart.com/products/{slug}</span>
            </div>
            <h4 className="text-sm font-semibold text-[#1a0dab] hover:underline cursor-pointer leading-snug line-clamp-1">
              {previewTitle}
            </h4>
            <p className="text-xs text-[#4d5156] leading-relaxed line-clamp-3">
              {previewDesc}
            </p>
          </div>
        </div>

      </div>

    </section>
  );
}
