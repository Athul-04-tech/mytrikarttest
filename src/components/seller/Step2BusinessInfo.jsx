import React, { useState } from 'react';
import { Building2, User, Users, FileText, ArrowRight, ArrowLeft, Calendar, ShieldCheck, Briefcase, Sparkles } from 'lucide-react';

const BUSINESS_TYPES = [
  {
    id: 'individual',
    title: 'Individual / Proprietorship',
    desc: 'Solo artisan, freelancer, or single-owner enterprise',
    icon: User
  },
  {
    id: 'company',
    title: 'Registered Company (Pvt Ltd / Ltd)',
    desc: 'Incorporated corporate entity or LLP with directors',
    icon: Building2
  },
  {
    id: 'partnership',
    title: 'Partnership Firm',
    desc: 'Joint partnership registered with deed agreement',
    icon: Users
  }
];

export default function Step2BusinessInfo({ formData, updateFormData, onNext, onBack, backendErrors = {} }) {
  const [errors, setErrors] = useState({});

  const validate = () => {
    const errs = {};
    if (!formData.storeName) errs.storeName = "Store name is required";
    if (!formData.businessName) errs.businessName = "Business name is required";
    if (!formData.businessType) errs.businessType = "Please select a business type";
    if (!formData.gstVatNumber) errs.gstVatNumber = "GST / VAT number is required";
    if (!formData.businessRegNumber) errs.businessRegNumber = "Registration number is required";
    if (!formData.yearsInBusiness) errs.yearsInBusiness = "Please select or enter years in business";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleContinue = (e) => {
    e.preventDefault();
    if (validate()) {
      onNext();
    }
  };

  const displayGstError = errors.gstVatNumber || backendErrors.gstVatNumber || backendErrors.tax_id || backendErrors.gst_vat_number;
  const displayStoreNameError = errors.storeName || backendErrors.storeName || backendErrors.store_name;
  const displayBusinessNameError = errors.businessName || backendErrors.businessName || backendErrors.business_name;
  const displayRegError = errors.businessRegNumber || backendErrors.businessRegNumber || backendErrors.registration_number;

  return (
    <form onSubmit={handleContinue} className="space-y-6 animate-reveal">
      
      {/* Step Header */}
      <div>
        <h2 className="font-['Outfit'] text-2xl sm:text-3xl font-extrabold text-[#FA661C] tracking-tight">
          Business Information
        </h2>
        <p className="text-xs sm:text-sm text-[#6B6058] mt-1">
          Provide your formal legal entity classification, commercial registration, and tax credentials
        </p>
      </div>

      {/* Business Type Visual Selection Cards */}
      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-[#FA661C] mb-2">
          Business Entity Type <span className="text-[#D7263D]">*</span>
        </label>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {BUSINESS_TYPES.map((type) => {
            const Icon = type.icon;
            const isSelected = formData.businessType === type.id;

            return (
              <div
                key={type.id}
                onClick={() => updateFormData({ businessType: type.id })}
                className={`p-4 rounded-2xl border-2 transition-all cursor-pointer card-interactive flex flex-col justify-between ${
                  isSelected
                    ? 'bg-[#FFF8F2] border-[#FF811A] ring-2 ring-[#FF811A]/30 shadow-sm'
                    : 'bg-white border-[#EAE3DC] hover:border-[#6B6058]/60'
                }`}
              >
                <div>
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 transition-colors ${
                    isSelected ? 'bg-[#FA661C] text-[#FF811A]' : 'bg-[#FFFFFF] text-[#6B6058]'
                  }`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <h4 className="font-bold text-xs sm:text-sm text-[#FA661C]">
                    {type.title}
                  </h4>
                  <p className="text-[11px] text-[#6B6058] mt-1 leading-snug">
                    {type.desc}
                  </p>
                </div>

                <div className="mt-3 pt-2 border-t border-[#EAE3DC]/60 flex items-center justify-between text-[10px] font-extrabold">
                  <span className={isSelected ? 'text-[#FA661C]' : 'text-[#6B6058]'}>
                    {isSelected ? '✓ Selected' : 'Click to select'}
                  </span>
                  <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                    isSelected ? 'border-[#FA661C] bg-[#FA661C]' : 'border-[#EAE3DC]'
                  }`}>
                    {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-[#FF811A]" />}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        {errors.businessType && <p className="text-[10px] text-[#D7263D] font-bold mt-1.5">{errors.businessType}</p>}
      </div>

      {/* Women-Owned / Women-Led Business Optional Toggle Card */}
      <div 
        onClick={() => updateFormData({ isWomenOwned: !formData.isWomenOwned })}
        className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between shadow-2xs ${
          formData.isWomenOwned 
            ? 'bg-[#FFF8F2] border-[#FF811A] ring-2 ring-[#FF811A]/20' 
            : 'bg-white border-[#EAE3DC] hover:border-[#6B6058]/50'
        }`}
      >
        <div className="flex items-center space-x-3 pr-2">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
            formData.isWomenOwned ? 'bg-[#FA661C] text-[#FF811A]' : 'bg-[#FFF8F2] text-[#FA661C]'
          }`}>
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-xs sm:text-sm text-[#FA661C] flex items-center space-x-2">
              <span>This business is women-owned / women-led</span>
              <span className="text-[10px] font-extrabold text-[#FA661C] bg-[#FFF3EC] px-2 py-0.5 rounded-full border border-[#FA661C]/20">
                Optional
              </span>
            </h4>
            <p className="text-[11px] text-[#6B6058] mt-0.5 leading-snug">
              Help us recognize and support women entrepreneurs on MytriKart
            </p>
          </div>
        </div>

        <input
          type="checkbox"
          checked={Boolean(formData.isWomenOwned)}
          onChange={(e) => updateFormData({ isWomenOwned: e.target.checked })}
          onClick={(e) => e.stopPropagation()}
          className="w-4.5 h-4.5 text-[#FA661C] rounded border-[#EAE3DC] focus:ring-[#FA661C] cursor-pointer shrink-0"
        />
      </div>

      {/* Main Business Inputs Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        
        {/* Store Name (Brand Facing) */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-[#FA661C] mb-1">
            Store Name (Customer Facing) <span className="text-[#D7263D]">*</span>
          </label>
          <input
            type="text"
            required
            value={formData.storeName || ''}
            onChange={(e) => updateFormData({ storeName: e.target.value })}
            placeholder="e.g. Royal Silk & Spices"
            className={`w-full py-2.5 px-3.5 bg-white border rounded-xl text-xs sm:text-sm text-[#FA661C] font-medium input-interactive ${
              displayStoreNameError ? 'border-[#D7263D] focus:border-[#D7263D]' : 'border-[#EAE3DC]'
            }`}
          />
          {displayStoreNameError && <p className="text-[10px] text-[#D7263D] font-bold mt-1">{displayStoreNameError}</p>}
        </div>

        {/* Legal Business Name */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-[#FA661C] mb-1">
            Legal Business Name <span className="text-[#D7263D]">*</span>
          </label>
          <input
            type="text"
            required
            value={formData.businessName || ''}
            onChange={(e) => updateFormData({ businessName: e.target.value })}
            placeholder="e.g. Royal Heritage Enterprises Pvt Ltd"
            className={`w-full py-2.5 px-3.5 bg-white border rounded-xl text-xs sm:text-sm text-[#FA661C] font-medium input-interactive ${
              displayBusinessNameError ? 'border-[#D7263D] focus:border-[#D7263D]' : 'border-[#EAE3DC]'
            }`}
          />
          {displayBusinessNameError && <p className="text-[10px] text-[#D7263D] font-bold mt-1">{displayBusinessNameError}</p>}
        </div>

        {/* GST/VAT Number */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-[#FA661C] mb-1">
            GSTIN / VAT Number <span className="text-[#D7263D]">*</span>
          </label>
          <div className="relative">
            <input
              type="text"
              required
              value={formData.gstVatNumber || ''}
              onChange={(e) => updateFormData({ gstVatNumber: e.target.value.toUpperCase() })}
              placeholder="e.g. 27AAAAA0000A1Z5"
              className={`w-full py-2.5 pl-3.5 pr-9 bg-white border rounded-xl text-xs sm:text-sm text-[#FA661C] font-medium font-mono uppercase input-interactive ${
                displayGstError ? 'border-[#D7263D] focus:border-[#D7263D]' : 'border-[#EAE3DC]'
              }`}
            />
            <FileText className="w-4 h-4 text-[#6B6058] absolute right-3 top-1/2 -translate-y-1/2" />
          </div>
          {displayGstError && <p className="text-[10px] text-[#D7263D] font-bold mt-1">{displayGstError}</p>}
        </div>

        {/* PAN/TIN (Optional) */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-bold uppercase tracking-wider text-[#FA661C]">
              PAN / Tax Identification Number
            </label>
            <span className="text-[10px] font-bold text-[#6B6058] bg-[#FFF3EC] px-1.5 py-0.2 rounded">
              Optional
            </span>
          </div>
          <input
            type="text"
            value={formData.panTin || ''}
            onChange={(e) => updateFormData({ panTin: e.target.value.toUpperCase() })}
            placeholder="e.g. ABCDE1234F"
            className="w-full py-2.5 px-3.5 bg-white border border-[#EAE3DC] rounded-xl text-xs sm:text-sm text-[#FA661C] font-medium font-mono uppercase input-interactive"
          />
        </div>

        {/* Business Registration Number */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-[#FA661C] mb-1">
            Business Registration Number <span className="text-[#D7263D]">*</span>
          </label>
          <input
            type="text"
            required
            value={formData.businessRegNumber || ''}
            onChange={(e) => updateFormData({ businessRegNumber: e.target.value })}
            placeholder="CIN / Udyam / Trade License No."
            className={`w-full py-2.5 px-3.5 bg-white border rounded-xl text-xs sm:text-sm text-[#FA661C] font-medium font-mono input-interactive ${
              displayRegError ? 'border-[#D7263D] focus:border-[#D7263D]' : 'border-[#EAE3DC]'
            }`}
          />
          {displayRegError && <p className="text-[10px] text-[#D7263D] font-bold mt-1">{displayRegError}</p>}
        </div>

        {/* Years in Business */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-[#FA661C] mb-1">
            Years in Business <span className="text-[#D7263D]">*</span>
          </label>
          <select
            value={formData.yearsInBusiness || '1-3 years'}
            onChange={(e) => updateFormData({ yearsInBusiness: e.target.value })}
            className="w-full py-2.5 px-3.5 bg-white border border-[#EAE3DC] rounded-xl text-xs sm:text-sm text-[#FA661C] font-medium input-interactive"
          >
            <option value="Less than 1 year">Less than 1 year (New Enterprise)</option>
            <option value="1-3 years">1 – 3 years</option>
            <option value="3-5 years">3 – 5 years</option>
            <option value="5-10 years">5 – 10 years</option>
            <option value="10+ years">10+ years (Established Brand)</option>
          </select>
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
          <span>Back: Personal Info</span>
        </button>

        <button
          type="submit"
          className="px-6 py-3 rounded-xl text-xs font-bold text-[#FFFFFF] bg-[#FA661C] hover:bg-[#E0530B] btn-interactive flex items-center space-x-2 shadow-md cursor-pointer"
        >
          <span>Continue to Store Profile</span>
          <ArrowRight className="w-4 h-4 text-[#FF811A] icon-interactive" />
        </button>
      </div>

    </form>
  );
}

