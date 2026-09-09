import React, { useState, useEffect } from 'react';
import { 
  Store, 
  Globe, 
  UploadCloud, 
  Image as ImageIcon, 
  Check, 
  X, 
  Loader2, 
  ArrowRight, 
  ArrowLeft, 
  MapPin, 
  Sparkles, 
  CheckCircle2 
} from 'lucide-react';

const CATEGORIES_LIST = [
  'Fashion & Apparel',
  'Electronics & Gadgets',
  'Home & Kitchen',
  'Beauty & Personal Care',
  'Handicrafts & Artisanal',
  'Organic Foods & Spices',
  'Sports & Fitness',
  'Automotive Accessories',
  'Jewelry & Luxury Goods'
];

const AVAILABLE_COUNTRIES = [
  { code: 'IN', name: 'India', stateLabel: 'State / Union Territory', zipLabel: 'PIN Code (6 digits)' },
  { code: 'AE', name: 'United Arab Emirates', stateLabel: 'Emirate (e.g. Dubai, Abu Dhabi)', zipLabel: 'Makani / Postal Code' },
  { code: 'IE', name: 'Ireland (EU)', stateLabel: 'County (e.g. Dublin, Cork)', zipLabel: 'Eircode (7 characters)' }
];

export default function Step3StoreInfo({ formData, updateFormData, onNext, onBack, backendErrors = {} }) {
  const [errors, setErrors] = useState({});

  // Auto-generate slug from storeName if empty
  useEffect(() => {
    if (!formData.storeSlug && formData.storeName) {
      const generated = formData.storeName.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
      updateFormData({ storeSlug: generated });
    }
  }, [formData.storeName]);

  const handleSlugChange = (e) => {
    const raw = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '');
    updateFormData({ storeSlug: raw });
  };

  const currentSlug = formData.storeSlug || '';
  const isSlugFormatValid = currentSlug.length >= 3 && /^[a-z0-9]+(-[a-z0-9]+)*$/.test(currentSlug);

  const backendSlugError = backendErrors.storeSlug || backendErrors.store_slug;

  const toggleProductCategory = (cat) => {
    const current = formData.productCategories || [];
    if (current.includes(cat)) {
      updateFormData({ productCategories: current.filter(c => c !== cat) });
    } else {
      updateFormData({ productCategories: [...current, cat] });
    }
  };

  const selectedCountryMeta = AVAILABLE_COUNTRIES.find(c => c.code === (formData.country || 'IN')) || AVAILABLE_COUNTRIES[0];

  const validate = () => {
    const errs = {};
    if (!formData.storeSlug) errs.storeSlug = "Store URL slug is required";
    if (!isSlugFormatValid) errs.storeSlug = "Slug must be at least 3 characters and contain only lowercase letters, numbers, and hyphens.";
    if (!formData.storeDescription || formData.storeDescription.length < 10) errs.storeDescription = "Description must be at least 10 characters";
    if (!formData.businessCategory) errs.businessCategory = "Primary business category is required";
    if (!formData.productCategories || formData.productCategories.length === 0) errs.productCategories = "Select at least 1 product category";
    if (!formData.storeAddress) errs.storeAddress = "Store address is required";
    if (!formData.city) errs.city = "City is required";
    if (!formData.state) errs.state = "State/Region is required";
    if (!formData.zipCode) errs.zipCode = "ZIP/Postal Code is required";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleContinue = (e) => {
    e.preventDefault();
    if (validate()) {
      onNext();
    }
  };

  const displaySlugError = errors.storeSlug || backendSlugError;

  return (
    <form onSubmit={handleContinue} className="space-y-6 animate-reveal">
      
      {/* Step Header */}
      <div>
        <h2 className="font-['Outfit'] text-2xl sm:text-3xl font-extrabold text-[#FA661C] tracking-tight">
          Store Profile & Presence
        </h2>
        <p className="text-xs sm:text-sm text-[#6B6058] mt-1">
          Customize your public storefront URL, brand imagery, catalogue categories, and fulfillment address
        </p>
      </div>

      {/* Store URL (Slug) */}
      <div className="bg-[#FFFFFF] border border-[#EAE3DC] rounded-2xl p-4 sm:p-5">
        <label className="block text-xs font-bold uppercase tracking-wider text-[#FA661C] mb-1.5">
          Unique Storefront Web Address (Slug) <span className="text-[#D7263D]">*</span>
        </label>
        
        <div className="flex items-center">
          <span className="px-3.5 py-2.5 bg-[#FFF3EC] border border-r-0 border-[#EAE3DC] rounded-l-xl text-xs sm:text-sm text-[#FA661C] font-bold select-none font-mono">
            mytrikart.com/stores/
          </span>
          <div className="relative flex-1">
            <input
              type="text"
              required
              value={currentSlug}
              onChange={handleSlugChange}
              placeholder="your-brand-handle"
              className={`w-full py-2.5 pl-3 pr-24 bg-white border rounded-r-xl text-xs sm:text-sm text-[#FA661C] font-bold font-mono input-interactive ${
                backendSlugError ? 'border-[#D7263D] focus:border-[#D7263D]' : 'border-[#EAE3DC]'
              }`}
            />
            
            {/* Format compliance / backend error status badge */}
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center space-x-1">
              {backendSlugError ? (
                <div className="flex items-center space-x-1 text-[#D7263D] text-[10px] font-extrabold bg-[#FDE8EA] px-1.5 py-0.5 rounded border border-[#D7263D]/20">
                  <X className="w-3 h-3" />
                  <span>Taken / Rejected</span>
                </div>
              ) : currentSlug ? (
                isSlugFormatValid ? (
                  <div className="flex items-center space-x-1 text-[#FA661C] text-[10px] font-extrabold bg-[#FFF3EC] px-1.5 py-0.5 rounded border border-[#FA661C]/20">
                    <Check className="w-3 h-3 text-[#FF811A]" />
                    <span>Format Valid</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-1 text-[#D7263D] text-[10px] font-extrabold bg-[#FDE8EA] px-1.5 py-0.5 rounded border border-[#D7263D]/20">
                    <X className="w-3 h-3" />
                    <span>Invalid Format</span>
                  </div>
                )
              ) : null}
            </div>
          </div>
        </div>

        {displaySlugError && <p className="text-[10px] text-[#D7263D] font-bold mt-1.5">{displaySlugError}</p>}
        <p className="text-[11px] text-[#6B6058] mt-1.5">
          This URL is permanent and directly accessible by customers worldwide. Use letters, numbers, and hyphens only. Availability is verified upon submission.
        </p>
      </div>

      {/* Store Description */}
      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-[#FA661C] mb-1">
          Store Bio / Brand Story <span className="text-[#D7263D]">*</span>
        </label>
        <textarea
          rows={3}
          required
          value={formData.storeDescription || ''}
          onChange={(e) => updateFormData({ storeDescription: e.target.value })}
          placeholder="Tell customers about your craftsmanship, quality guarantees, and founding history..."
          className="w-full py-2.5 px-3.5 bg-white border border-[#EAE3DC] rounded-xl text-xs sm:text-sm text-[#FA661C] font-medium input-interactive"
        />
        {errors.storeDescription && <p className="text-[10px] text-[#D7263D] font-bold mt-1">{errors.storeDescription}</p>}
      </div>

      {/* Brand Imagery Uploads (Logo & Banner) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        
        {/* Store Logo */}
        <div className="p-4 rounded-2xl border border-[#EAE3DC] bg-white flex flex-col justify-between space-y-3">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#FA661C] block">Store Logo (1:1 Square)</span>
              <span className="text-[9px] font-bold uppercase tracking-wider bg-[#FFF3EC] text-[#FA661C] border border-[#FF811A]/40 px-2 py-0.5 rounded-full">
                File Upload In Development
              </span>
            </div>
            <p className="text-[11px] text-[#6B6058] mt-0.5">
              Direct binary upload API coming soon. Enter hosted image URL string below:
            </p>
            
            <div className="mt-3 space-y-2">
              <input
                type="url"
                value={formData.storeLogo || ''}
                onChange={(e) => updateFormData({ storeLogo: e.target.value })}
                placeholder="https://example.com/logo.png"
                className="w-full py-2 px-3 bg-white border border-[#EAE3DC] rounded-xl text-xs text-[#FA661C] font-mono input-interactive"
              />

              {formData.storeLogo && (
                <div className="flex items-center space-x-2 pt-1">
                  <img
                    src={formData.storeLogo}
                    alt="Logo Preview"
                    className="w-10 h-10 rounded-lg object-cover border border-[#FF811A]"
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                  <span className="text-[10px] font-bold text-[#FA661C]">Logo URL Configured</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Store Banner */}
        <div className="p-4 rounded-2xl border border-[#EAE3DC] bg-white flex flex-col justify-between space-y-3">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#FA661C] block">Store Banner (16:9 Landscape)</span>
              <span className="text-[9px] font-bold uppercase tracking-wider bg-[#FFF3EC] text-[#FA661C] border border-[#FF811A]/40 px-2 py-0.5 rounded-full">
                File Upload In Development
              </span>
            </div>
            <p className="text-[11px] text-[#6B6058] mt-0.5">
              Direct binary upload API coming soon. Enter hosted image URL string below:
            </p>
            
            <div className="mt-3 space-y-2">
              <input
                type="url"
                value={formData.storeBanner || ''}
                onChange={(e) => updateFormData({ storeBanner: e.target.value })}
                placeholder="https://example.com/banner.jpg"
                className="w-full py-2 px-3 bg-white border border-[#EAE3DC] rounded-xl text-xs text-[#FA661C] font-mono input-interactive"
              />

              {formData.storeBanner && (
                <div className="flex items-center space-x-2 pt-1">
                  <img
                    src={formData.storeBanner}
                    alt="Banner Preview"
                    className="w-16 h-8 rounded-lg object-cover border border-[#FF811A]"
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                  <span className="text-[10px] font-bold text-[#FA661C]">Banner URL Configured</span>
                </div>
              )}
            </div>
          </div>
        </div>

      </div>

      {/* Category Selection */}
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-[#FA661C] mb-1">
            Primary Business Category <span className="text-[#D7263D]">*</span>
          </label>
          <select
            value={formData.businessCategory || ''}
            onChange={(e) => updateFormData({ businessCategory: e.target.value })}
            className="w-full py-2.5 px-3.5 bg-white border border-[#EAE3DC] rounded-xl text-xs sm:text-sm text-[#FA661C] font-medium input-interactive"
          >
            <option value="">Select primary category...</option>
            {CATEGORIES_LIST.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          {errors.businessCategory && <p className="text-[10px] text-[#D7263D] font-bold mt-1">{errors.businessCategory}</p>}
        </div>

        {/* Product Categories (Multi-select Chips) */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-[#FA661C] mb-2">
            Target Product Categories (Multi-Select) <span className="text-[#D7263D]">*</span>
          </label>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES_LIST.map((cat) => {
              const isSelected = (formData.productCategories || []).includes(cat);
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => toggleProductCategory(cat)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all btn-interactive flex items-center space-x-1.5 cursor-pointer ${
                    isSelected
                      ? 'bg-[#FA661C] text-[#FFFFFF] shadow-xs'
                      : 'bg-white text-[#6B6058] hover:text-[#FA661C] border border-[#EAE3DC]'
                  }`}
                >
                  {isSelected && <Check className="w-3 h-3 text-[#FF811A]" />}
                  <span>{cat}</span>
                </button>
              );
            })}
          </div>
          {errors.productCategories && <p className="text-[10px] text-[#D7263D] font-bold mt-1.5">{errors.productCategories}</p>}
        </div>
      </div>

      {/* Fulfillment & Physical Store Address */}
      <div className="pt-4 border-t border-[#EAE3DC]">
        <h3 className="text-xs font-extrabold uppercase tracking-widest text-[#FA661C] mb-3 flex items-center space-x-1.5">
          <MapPin className="w-4 h-4 text-[#FF811A]" />
          <span>Fulfillment & Dispatch Hub Address</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          
          {/* Country Selection (Driver) */}
          <div className="sm:col-span-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-[#FA661C] mb-1">
              Operating Country / Jurisdiction <span className="text-[#D7263D]">*</span>
            </label>
            <select
              value={formData.country || 'IN'}
              onChange={(e) => updateFormData({ country: e.target.value })}
              className="w-full py-2.5 px-3.5 bg-white border border-[#EAE3DC] rounded-xl text-xs sm:text-sm text-[#FA661C] font-medium input-interactive"
            >
              {AVAILABLE_COUNTRIES.map((c) => (
                <option key={c.code} value={c.code}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Street Address */}
          <div className="sm:col-span-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-[#FA661C] mb-1">
              Warehouse / Facility Street Address <span className="text-[#D7263D]">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.storeAddress || ''}
              onChange={(e) => updateFormData({ storeAddress: e.target.value })}
              placeholder="e.g. Unit 402, Signature Tower, Industrial Estate"
              className="w-full py-2.5 px-3.5 bg-white border border-[#EAE3DC] rounded-xl text-xs sm:text-sm text-[#FA661C] font-medium input-interactive"
            />
            {errors.storeAddress && <p className="text-[10px] text-[#D7263D] font-bold mt-1">{errors.storeAddress}</p>}
          </div>

          {/* City */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#FA661C] mb-1">
              City / Town <span className="text-[#D7263D]">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.city || ''}
              onChange={(e) => updateFormData({ city: e.target.value })}
              placeholder="e.g. Mumbai"
              className="w-full py-2.5 px-3.5 bg-white border border-[#EAE3DC] rounded-xl text-xs sm:text-sm text-[#FA661C] font-medium input-interactive"
            />
            {errors.city && <p className="text-[10px] text-[#D7263D] font-bold mt-1">{errors.city}</p>}
          </div>

          {/* State / Province (Dynamic Label) */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#FA661C] mb-1">
              {selectedCountryMeta.stateLabel} <span className="text-[#D7263D]">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.state || ''}
              onChange={(e) => updateFormData({ state: e.target.value })}
              placeholder="e.g. Maharashtra"
              className="w-full py-2.5 px-3.5 bg-white border border-[#EAE3DC] rounded-xl text-xs sm:text-sm text-[#FA661C] font-medium input-interactive"
            />
            {errors.state && <p className="text-[10px] text-[#D7263D] font-bold mt-1">{errors.state}</p>}
          </div>

          {/* ZIP Code (Dynamic Label) */}
          <div className="sm:col-span-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-[#FA661C] mb-1">
              {selectedCountryMeta.zipLabel} <span className="text-[#D7263D]">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.zipCode || ''}
              onChange={(e) => updateFormData({ zipCode: e.target.value })}
              placeholder="e.g. 400001"
              className="w-full py-2.5 px-3.5 bg-white border border-[#EAE3DC] rounded-xl text-xs sm:text-sm text-[#FA661C] font-medium font-mono input-interactive"
            />
            {errors.zipCode && <p className="text-[10px] text-[#D7263D] font-bold mt-1">{errors.zipCode}</p>}
          </div>

        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between pt-6 border-t border-[#EAE3DC]">
        <button
          type="button"
          onClick={onBack}
          className="px-5 py-3 rounded-xl text-xs font-bold text-[#6B6058] bg-[#FFFFFF] hover:bg-[#FFF3EC] border border-[#EAE3DC] btn-interactive flex items-center space-x-2 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 icon-interactive" />
          <span>Back: Business Info</span>
        </button>

        <button
          type="submit"
          className="px-6 py-3 rounded-xl text-xs font-bold text-[#FFFFFF] bg-[#FA661C] hover:bg-[#E0530B] btn-interactive flex items-center space-x-2 shadow-md cursor-pointer"
        >
          <span>Continue to Support & Socials</span>
          <ArrowRight className="w-4 h-4 text-[#FF811A] icon-interactive" />
        </button>
      </div>

    </form>
  );
}
