import React, { useState } from 'react';
import { Building2, User, Users, FileText, ArrowRight, ArrowLeft, Calendar, ShieldCheck, Briefcase } from 'lucide-react';

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

export default function Step2BusinessInfo({ formData, updateFormData, onNext, onBack }) {
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

  return (
    <form onSubmit={handleContinue} className="space-y-6 animate-reveal">
      
      {/* Step Header */}
      <div>
        <h2 className="font-['Outfit'] text-2xl sm:text-3xl font-extrabold text-[#0F3D2E] tracking-tight">
          Business Information
        </h2>
        <p className="text-xs sm:text-sm text-[#5C6B63] mt-1">
          Provide your formal legal entity classification, commercial registration, and tax credentials
        </p>
      </div>

      {/* Business Type Visual Selection Cards */}
      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-[#0F3D2E] mb-2">
          Business Entity Type <span className="text-[#C0392B]">*</span>
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
                    ? 'bg-[#FCF7E8] border-[#D4AF37] ring-2 ring-[#D4AF37]/30 shadow-sm'
                    : 'bg-white border-[#D8E0DC] hover:border-[#5C6B63]/60'
                }`}
              >
                <div>
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 transition-colors ${
                    isSelected ? 'bg-[#0F3D2E] text-[#D4AF37]' : 'bg-[#FBF8F1] text-[#5C6B63]'
                  }`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <h4 className="font-bold text-xs sm:text-sm text-[#0F3D2E]">
                    {type.title}
                  </h4>
                  <p className="text-[11px] text-[#5C6B63] mt-1 leading-snug">
                    {type.desc}
                  </p>
                </div>

                <div className="mt-3 pt-2 border-t border-[#D8E0DC]/60 flex items-center justify-between text-[10px] font-extrabold">
                  <span className={isSelected ? 'text-[#0F3D2E]' : 'text-[#5C6B63]'}>
                    {isSelected ? '✓ Selected' : 'Click to select'}
                  </span>
                  <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                    isSelected ? 'border-[#0F3D2E] bg-[#0F3D2E]' : 'border-[#D8E0DC]'
                  }`}>
                    {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]" />}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        {errors.businessType && <p className="text-[10px] text-[#C0392B] font-bold mt-1.5">{errors.businessType}</p>}
      </div>

      {/* Main Business Inputs Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        
        {/* Store Name (Brand Facing) */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-[#0F3D2E] mb-1">
            Store Name (Customer Facing) <span className="text-[#C0392B]">*</span>
          </label>
          <input
            type="text"
            required
            value={formData.storeName || ''}
            onChange={(e) => updateFormData({ storeName: e.target.value })}
            placeholder="e.g. Royal Silk & Spices"
            className="w-full py-2.5 px-3.5 bg-white border border-[#D8E0DC] rounded-xl text-xs sm:text-sm text-[#0F3D2E] font-medium input-interactive"
          />
          {errors.storeName && <p className="text-[10px] text-[#C0392B] font-bold mt-1">{errors.storeName}</p>}
        </div>

        {/* Legal Business Name */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-[#0F3D2E] mb-1">
            Legal Business Name <span className="text-[#C0392B]">*</span>
          </label>
          <input
            type="text"
            required
            value={formData.businessName || ''}
            onChange={(e) => updateFormData({ businessName: e.target.value })}
            placeholder="e.g. Royal Heritage Enterprises Pvt Ltd"
            className="w-full py-2.5 px-3.5 bg-white border border-[#D8E0DC] rounded-xl text-xs sm:text-sm text-[#0F3D2E] font-medium input-interactive"
          />
          {errors.businessName && <p className="text-[10px] text-[#C0392B] font-bold mt-1">{errors.businessName}</p>}
        </div>

        {/* GST/VAT Number */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-[#0F3D2E] mb-1">
            GSTIN / VAT Number <span className="text-[#C0392B]">*</span>
          </label>
          <div className="relative">
            <input
              type="text"
              required
              value={formData.gstVatNumber || ''}
              onChange={(e) => updateFormData({ gstVatNumber: e.target.value.toUpperCase() })}
              placeholder="e.g. 27AAAAA0000A1Z5"
              className="w-full py-2.5 pl-3.5 pr-9 bg-white border border-[#D8E0DC] rounded-xl text-xs sm:text-sm text-[#0F3D2E] font-medium font-mono uppercase input-interactive"
            />
            <FileText className="w-4 h-4 text-[#5C6B63] absolute right-3 top-1/2 -translate-y-1/2" />
          </div>
          {errors.gstVatNumber && <p className="text-[10px] text-[#C0392B] font-bold mt-1">{errors.gstVatNumber}</p>}
        </div>

        {/* PAN/TIN (Optional) */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-bold uppercase tracking-wider text-[#0F3D2E]">
              PAN / Tax Identification Number
            </label>
            <span className="text-[10px] font-bold text-[#5C6B63] bg-[#E8F2EE] px-1.5 py-0.2 rounded">
              Optional
            </span>
          </div>
          <input
            type="text"
            value={formData.panTin || ''}
            onChange={(e) => updateFormData({ panTin: e.target.value.toUpperCase() })}
            placeholder="e.g. ABCDE1234F"
            className="w-full py-2.5 px-3.5 bg-white border border-[#D8E0DC] rounded-xl text-xs sm:text-sm text-[#0F3D2E] font-medium font-mono uppercase input-interactive"
          />
        </div>

        {/* Business Registration Number */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-[#0F3D2E] mb-1">
            Business Registration Number <span className="text-[#C0392B]">*</span>
          </label>
          <input
            type="text"
            required
            value={formData.businessRegNumber || ''}
            onChange={(e) => updateFormData({ businessRegNumber: e.target.value })}
            placeholder="CIN / Udyam / Trade License No."
            className="w-full py-2.5 px-3.5 bg-white border border-[#D8E0DC] rounded-xl text-xs sm:text-sm text-[#0F3D2E] font-medium font-mono input-interactive"
          />
          {errors.businessRegNumber && <p className="text-[10px] text-[#C0392B] font-bold mt-1">{errors.businessRegNumber}</p>}
        </div>

        {/* Years in Business */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-[#0F3D2E] mb-1">
            Years in Business <span className="text-[#C0392B]">*</span>
          </label>
          <select
            value={formData.yearsInBusiness || '1-3 years'}
            onChange={(e) => updateFormData({ yearsInBusiness: e.target.value })}
            className="w-full py-2.5 px-3.5 bg-white border border-[#D8E0DC] rounded-xl text-xs sm:text-sm text-[#0F3D2E] font-medium input-interactive"
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
      <div className="flex items-center justify-between pt-6 border-t border-[#D8E0DC]">
        <button
          type="button"
          onClick={onBack}
          className="px-5 py-3 rounded-xl text-xs font-bold text-[#5C6B63] bg-[#FBF8F1] hover:bg-[#E8F2EE] border border-[#D8E0DC] btn-interactive flex items-center space-x-2 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 icon-interactive" />
          <span>Back: Personal Info</span>
        </button>

        <button
          type="submit"
          className="px-6 py-3 rounded-xl text-xs font-bold text-[#FBF8F1] bg-[#0F3D2E] hover:bg-[#155440] btn-interactive flex items-center space-x-2 shadow-md cursor-pointer"
        >
          <span>Continue to Store Profile</span>
          <ArrowRight className="w-4 h-4 text-[#D4AF37] icon-interactive" />
        </button>
      </div>

    </form>
  );
}
