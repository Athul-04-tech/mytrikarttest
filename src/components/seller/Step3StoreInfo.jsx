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

export default function Step3StoreInfo({ formData, updateFormData, onNext, onBack }) {
  const [slugChecking, setSlugChecking] = useState(false);
  const [slugAvailable, setSlugAvailable] = useState(true);
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
    
    // Simulate real-time availability check
    setSlugChecking(true);
    setTimeout(() => {
      setSlugChecking(false);
      // Dummy check: slugs like 'test', 'amazon', 'flipkart' are taken
      if (['test', 'amazon', 'flipkart', 'store', 'shop'].includes(raw)) {
        setSlugAvailable(false);
      } else {
        setSlugAvailable(true);
      }
    }, 400);
  };

  const toggleProductCategory = (cat) => {
    const current = formData.productCategories || [];
    if (current.includes(cat)) {
      updateFormData({ productCategories: current.filter(c => c !== cat) });
    } else {
      updateFormData({ productCategories: [...current, cat] });
    }
  };

  const handleDummyUpload = (field, defaultUrl) => {
    updateFormData({ [field]: defaultUrl });
  };

  const selectedCountryMeta = AVAILABLE_COUNTRIES.find(c => c.code === (formData.country || 'IN')) || AVAILABLE_COUNTRIES[0];

  const validate = () => {
    const errs = {};
    if (!formData.storeSlug) errs.storeSlug = "Store URL slug is required";
    if (!slugAvailable) errs.storeSlug = "This URL slug is already taken. Please choose another.";
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

  return (
    <form onSubmit={handleContinue} className="space-y-6 animate-reveal">
      
      {/* Step Header */}
      <div>
        <h2 className="font-['Outfit'] text-2xl sm:text-3xl font-extrabold text-[#0F3D2E] tracking-tight">
          Store Profile & Presence
        </h2>
        <p className="text-xs sm:text-sm text-[#5C6B63] mt-1">
          Customize your public storefront URL, brand imagery, catalogue categories, and fulfillment address
        </p>
      </div>

      {/* Store URL (Slug) with Real-Time Availability Check */}
      <div className="bg-[#FBF8F1] border border-[#D8E0DC] rounded-2xl p-4 sm:p-5">
        <label className="block text-xs font-bold uppercase tracking-wider text-[#0F3D2E] mb-1.5">
          Unique Storefront Web Address (Slug) <span className="text-[#C0392B]">*</span>
        </label>
        
        <div className="flex items-center">
          <span className="px-3.5 py-2.5 bg-[#E8F2EE] border border-r-0 border-[#D8E0DC] rounded-l-xl text-xs sm:text-sm text-[#0F3D2E] font-bold select-none font-mono">
            mytrikart.com/stores/
          </span>
          <div className="relative flex-1">
            <input
              type="text"
              required
              value={formData.storeSlug || ''}
              onChange={handleSlugChange}
              placeholder="your-brand-handle"
              className="w-full py-2.5 pl-3 pr-10 bg-white border border-[#D8E0DC] rounded-r-xl text-xs sm:text-sm text-[#0F3D2E] font-bold font-mono input-interactive"
            />
            
            {/* Real-time spinner or status badge */}
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center space-x-1">
              {slugChecking ? (
                <Loader2 className="w-4 h-4 animate-spin text-[#D4AF37]" />
              ) : formData.storeSlug ? (
                slugAvailable ? (
                  <div className="flex items-center space-x-1 text-[#0F3D2E] text-[10px] font-extrabold bg-[#E8F2EE] px-1.5 py-0.5 rounded border border-[#0F3D2E]/20">
                    <Check className="w-3 h-3 text-[#D4AF37]" />
                    <span className="hidden sm:inline">Available</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-1 text-[#C0392B] text-[10px] font-extrabold bg-[#FDEDEC] px-1.5 py-0.5 rounded border border-[#C0392B]/20">
                    <X className="w-3 h-3" />
                    <span className="hidden sm:inline">Taken</span>
                  </div>
                )
              ) : null}
            </div>
          </div>
        </div>

        {errors.storeSlug && <p className="text-[10px] text-[#C0392B] font-bold mt-1.5">{errors.storeSlug}</p>}
        <p className="text-[11px] text-[#5C6B63] mt-1.5">
          This URL is permanent and directly accessible by customers worldwide. Use letters, numbers, and hyphens only.
        </p>
      </div>

      {/* Store Description */}
      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-[#0F3D2E] mb-1">
          Store Bio / Brand Story <span className="text-[#C0392B]">*</span>
        </label>
        <textarea
          rows={3}
          required
          value={formData.storeDescription || ''}
          onChange={(e) => updateFormData({ storeDescription: e.target.value })}
          placeholder="Tell customers about your craftsmanship, quality guarantees, and founding history..."
          className="w-full py-2.5 px-3.5 bg-white border border-[#D8E0DC] rounded-xl text-xs sm:text-sm text-[#0F3D2E] font-medium input-interactive"
        />
        {errors.storeDescription && <p className="text-[10px] text-[#C0392B] font-bold mt-1">{errors.storeDescription}</p>}
      </div>

      {/* Brand Imagery Uploads (Logo & Banner) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        
        {/* Store Logo */}
        <div className="p-4 rounded-2xl border border-[#D8E0DC] bg-white flex flex-col justify-between">
          <div>
            <span className="text-xs font-bold text-[#0F3D2E] block">Store Logo (1:1 Square)</span>
            <p className="text-[11px] text-[#5C6B63] mt-0.5">500x500px PNG or SVG recommended</p>
            
            {/* Preview or Upload Tile */}
            <div className="mt-3 flex items-center space-x-3">
              {formData.storeLogo ? (
                <div className="relative">
                  <img
                    src={formData.storeLogo}
                    alt="Logo Preview"
                    className="w-16 h-16 rounded-xl object-cover border-2 border-[#D4AF37]"
                  />
                  <span className="absolute -top-1 -right-1 bg-[#0F3D2E] text-[#D4AF37] p-0.5 rounded-full">
                    <Check className="w-3 h-3" />
                  </span>
                </div>
              ) : (
                <div className="w-16 h-16 rounded-xl bg-[#FBF8F1] border border-dashed border-[#D8E0DC] flex items-center justify-center text-[#5C6B63]">
                  <Store className="w-6 h-6" />
                </div>
              )}

              <button
                type="button"
                onClick={() => handleDummyUpload('storeLogo', 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=300&q=80')}
                className="px-3 py-2 bg-[#FBF8F1] hover:bg-[#E8F2EE] border border-[#D8E0DC] rounded-xl text-xs font-bold text-[#0F3D2E] btn-interactive flex items-center space-x-1.5 cursor-pointer"
              >
                <UploadCloud className="w-3.5 h-3.5 text-[#D4AF37]" />
                <span>{formData.storeLogo ? 'Change Logo' : 'Upload Sample Logo'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Store Banner */}
        <div className="p-4 rounded-2xl border border-[#D8E0DC] bg-white flex flex-col justify-between">
          <div>
            <span className="text-xs font-bold text-[#0F3D2E] block">Store Banner (16:9 Landscape)</span>
            <p className="text-[11px] text-[#5C6B63] mt-0.5">1200x400px Hero storefront banner</p>
            
            {/* Preview or Upload Tile */}
            <div className="mt-3 flex items-center space-x-3">
              {formData.storeBanner ? (
                <div className="relative">
                  <img
                    src={formData.storeBanner}
                    alt="Banner Preview"
                    className="w-24 h-14 rounded-xl object-cover border-2 border-[#D4AF37]"
                  />
                  <span className="absolute -top-1 -right-1 bg-[#0F3D2E] text-[#D4AF37] p-0.5 rounded-full">
                    <Check className="w-3 h-3" />
                  </span>
                </div>
              ) : (
                <div className="w-24 h-14 rounded-xl bg-[#FBF8F1] border border-dashed border-[#D8E0DC] flex items-center justify-center text-[#5C6B63]">
                  <ImageIcon className="w-6 h-6" />
                </div>
              )}

              <button
                type="button"
                onClick={() => handleDummyUpload('storeBanner', 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=600&q=80')}
                className="px-3 py-2 bg-[#FBF8F1] hover:bg-[#E8F2EE] border border-[#D8E0DC] rounded-xl text-xs font-bold text-[#0F3D2E] btn-interactive flex items-center space-x-1.5 cursor-pointer"
              >
                <UploadCloud className="w-3.5 h-3.5 text-[#D4AF37]" />
                <span>{formData.storeBanner ? 'Change Banner' : 'Upload Sample Banner'}</span>
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* Category Selection */}
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-[#0F3D2E] mb-1">
            Primary Business Category <span className="text-[#C0392B]">*</span>
          </label>
          <select
            value={formData.businessCategory || ''}
            onChange={(e) => updateFormData({ businessCategory: e.target.value })}
            className="w-full py-2.5 px-3.5 bg-white border border-[#D8E0DC] rounded-xl text-xs sm:text-sm text-[#0F3D2E] font-medium input-interactive"
          >
            <option value="">Select primary category...</option>
            {CATEGORIES_LIST.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          {errors.businessCategory && <p className="text-[10px] text-[#C0392B] font-bold mt-1">{errors.businessCategory}</p>}
        </div>

        {/* Product Categories (Multi-select Chips) */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-[#0F3D2E] mb-2">
            Target Product Categories (Multi-Select) <span className="text-[#C0392B]">*</span>
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
                      ? 'bg-[#0F3D2E] text-[#FBF8F1] shadow-xs'
                      : 'bg-white text-[#5C6B63] hover:text-[#0F3D2E] border border-[#D8E0DC]'
                  }`}
                >
                  {isSelected && <Check className="w-3 h-3 text-[#D4AF37]" />}
                  <span>{cat}</span>
                </button>
              );
            })}
          </div>
          {errors.productCategories && <p className="text-[10px] text-[#C0392B] font-bold mt-1.5">{errors.productCategories}</p>}
        </div>
      </div>

      {/* Fulfillment & Physical Store Address */}
      <div className="pt-4 border-t border-[#D8E0DC]">
        <h3 className="text-xs font-extrabold uppercase tracking-widest text-[#0F3D2E] mb-3 flex items-center space-x-1.5">
          <MapPin className="w-4 h-4 text-[#D4AF37]" />
          <span>Fulfillment & Dispatch Hub Address</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          
          {/* Country Selection (Driver) */}
          <div className="sm:col-span-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-[#0F3D2E] mb-1">
              Operating Country / Jurisdiction <span className="text-[#C0392B]">*</span>
            </label>
            <select
              value={formData.country || 'IN'}
              onChange={(e) => updateFormData({ country: e.target.value })}
              className="w-full py-2.5 px-3.5 bg-white border border-[#D8E0DC] rounded-xl text-xs sm:text-sm text-[#0F3D2E] font-medium input-interactive"
            >
              {AVAILABLE_COUNTRIES.map((c) => (
                <option key={c.code} value={c.code}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Street Address */}
          <div className="sm:col-span-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-[#0F3D2E] mb-1">
              Warehouse / Facility Street Address <span className="text-[#C0392B]">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.storeAddress || ''}
              onChange={(e) => updateFormData({ storeAddress: e.target.value })}
              placeholder="e.g. Unit 402, Signature Tower, Industrial Estate"
              className="w-full py-2.5 px-3.5 bg-white border border-[#D8E0DC] rounded-xl text-xs sm:text-sm text-[#0F3D2E] font-medium input-interactive"
            />
            {errors.storeAddress && <p className="text-[10px] text-[#C0392B] font-bold mt-1">{errors.storeAddress}</p>}
          </div>

          {/* City */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#0F3D2E] mb-1">
              City / Town <span className="text-[#C0392B]">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.city || ''}
              onChange={(e) => updateFormData({ city: e.target.value })}
              placeholder="e.g. Mumbai"
              className="w-full py-2.5 px-3.5 bg-white border border-[#D8E0DC] rounded-xl text-xs sm:text-sm text-[#0F3D2E] font-medium input-interactive"
            />
            {errors.city && <p className="text-[10px] text-[#C0392B] font-bold mt-1">{errors.city}</p>}
          </div>

          {/* State / Province (Dynamic Label) */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#0F3D2E] mb-1">
              {selectedCountryMeta.stateLabel} <span className="text-[#C0392B]">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.state || ''}
              onChange={(e) => updateFormData({ state: e.target.value })}
              placeholder="e.g. Maharashtra"
              className="w-full py-2.5 px-3.5 bg-white border border-[#D8E0DC] rounded-xl text-xs sm:text-sm text-[#0F3D2E] font-medium input-interactive"
            />
            {errors.state && <p className="text-[10px] text-[#C0392B] font-bold mt-1">{errors.state}</p>}
          </div>

          {/* ZIP Code (Dynamic Label) */}
          <div className="sm:col-span-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-[#0F3D2E] mb-1">
              {selectedCountryMeta.zipLabel} <span className="text-[#C0392B]">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.zipCode || ''}
              onChange={(e) => updateFormData({ zipCode: e.target.value })}
              placeholder="e.g. 400001"
              className="w-full py-2.5 px-3.5 bg-white border border-[#D8E0DC] rounded-xl text-xs sm:text-sm text-[#0F3D2E] font-medium font-mono input-interactive"
            />
            {errors.zipCode && <p className="text-[10px] text-[#C0392B] font-bold mt-1">{errors.zipCode}</p>}
          </div>

        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between pt-6 border-t border-[#D8E0DC]">
        <button
          type="button"
          onClick={onBack}
          className="px-5 py-3 rounded-xl text-xs font-bold text-[#5C6B63] bg-[#FBF8F1] hover:bg-[#E8F2EE] border border-[#D8E0DC] btn-interactive flex items-center space-x-2 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 icon-interactive" />
          <span>Back: Business Info</span>
        </button>

        <button
          type="submit"
          className="px-6 py-3 rounded-xl text-xs font-bold text-[#FBF8F1] bg-[#0F3D2E] hover:bg-[#155440] btn-interactive flex items-center space-x-2 shadow-md cursor-pointer"
        >
          <span>Continue to Support & Socials</span>
          <ArrowRight className="w-4 h-4 text-[#D4AF37] icon-interactive" />
        </button>
      </div>

    </form>
  );
}
