import React, { useState } from 'react';
import { 
  Mail, 
  Phone, 
  MessageCircle, 
  Globe, 
  ArrowRight, 
  ArrowLeft, 
  Share2, 
  Headphones,
  CheckCircle2
} from 'lucide-react';

export default function Step4ContactInfo({ formData, updateFormData, onNext, onBack }) {
  const [errors, setErrors] = useState({});

  const validate = () => {
    const errs = {};
    if (!formData.supportEmail || !formData.supportEmail.includes('@')) errs.supportEmail = "Customer support email is required";
    if (!formData.supportPhone || formData.supportPhone.length < 8) errs.supportPhone = "Customer support phone is required";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSocialChange = (network, val) => {
    updateFormData({
      socialLinks: {
        ...(formData.socialLinks || {}),
        [network]: val
      }
    });
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
        <h2 className="font-['Outfit'] text-2xl sm:text-3xl font-extrabold text-[#FA661C] tracking-tight">
          Customer Support & Public Channels
        </h2>
        <p className="text-xs sm:text-sm text-[#6B6058] mt-1">
          Stored in merchant profile for customer service communications, invoice receipts, and buyer inquiries
        </p>
      </div>

      {/* Primary Customer Support Channels */}
      <div className="bg-white border border-[#EAE3DC] rounded-2xl p-5 shadow-xs space-y-4">
        <h3 className="text-xs font-extrabold uppercase tracking-widest text-[#FA661C] flex items-center space-x-1.5">
          <Headphones className="w-4 h-4 text-[#FF811A]" />
          <span>Dedicated Customer Support Desk</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          
          {/* Customer Support Email */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#FA661C] mb-1">
              Customer Support Email <span className="text-[#D7263D]">*</span>
            </label>
            <div className="relative">
              <input
                type="email"
                required
                value={formData.supportEmail || ''}
                onChange={(e) => updateFormData({ supportEmail: e.target.value })}
                placeholder="care@yourbrand.com"
                className="w-full py-2.5 pl-3.5 pr-9 bg-white border border-[#EAE3DC] rounded-xl text-xs sm:text-sm text-[#FA661C] font-medium input-interactive"
              />
              <Mail className="w-4 h-4 text-[#6B6058] absolute right-3 top-1/2 -translate-y-1/2" />
            </div>
            {errors.supportEmail && <p className="text-[10px] text-[#D7263D] font-bold mt-1">{errors.supportEmail}</p>}
          </div>

          {/* Customer Support Phone */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#FA661C] mb-1">
              Support Helpline Phone <span className="text-[#D7263D]">*</span>
            </label>
            <div className="relative">
              <input
                type="tel"
                required
                value={formData.supportPhone || ''}
                onChange={(e) => updateFormData({ supportPhone: e.target.value })}
                placeholder="+91 8000 123 456"
                className="w-full py-2.5 pl-3.5 pr-9 bg-white border border-[#EAE3DC] rounded-xl text-xs sm:text-sm text-[#FA661C] font-medium input-interactive"
              />
              <Phone className="w-4 h-4 text-[#6B6058] absolute right-3 top-1/2 -translate-y-1/2" />
            </div>
            {errors.supportPhone && <p className="text-[10px] text-[#D7263D] font-bold mt-1">{errors.supportPhone}</p>}
          </div>

          {/* WhatsApp Support Number */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold uppercase tracking-wider text-[#FA661C]">
                WhatsApp Business Helpline
              </label>
              <span className="text-[10px] font-bold text-[#25D366] bg-[#E8F8F0] px-1.5 py-0.2 rounded">
                Recommended
              </span>
            </div>
            <div className="relative">
              <input
                type="tel"
                value={formData.whatsappNumber || ''}
                onChange={(e) => updateFormData({ whatsappNumber: e.target.value })}
                placeholder="+91 98765 43210"
                className="w-full py-2.5 pl-3.5 pr-9 bg-white border border-[#EAE3DC] rounded-xl text-xs sm:text-sm text-[#FA661C] font-medium input-interactive"
              />
              <MessageCircle className="w-4 h-4 text-[#25D366] absolute right-3 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          {/* Official Website */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold uppercase tracking-wider text-[#FA661C]">
                Official Brand Website
              </label>
              <span className="text-[10px] font-bold text-[#6B6058] bg-[#FFF3EC] px-1.5 py-0.2 rounded">
                Optional
              </span>
            </div>
            <div className="relative">
              <input
                type="url"
                value={formData.website || ''}
                onChange={(e) => updateFormData({ website: e.target.value })}
                placeholder="https://yourbrand.com"
                className="w-full py-2.5 pl-3.5 pr-9 bg-white border border-[#EAE3DC] rounded-xl text-xs sm:text-sm text-[#FA661C] font-medium font-mono input-interactive"
              />
              <Globe className="w-4 h-4 text-[#6B6058] absolute right-3 top-1/2 -translate-y-1/2" />
            </div>
          </div>

        </div>
      </div>

      {/* Social Profiles Grid Row (Compact Icon-Labeled Layout) */}
      <div className="bg-[#FFFFFF] border border-[#EAE3DC] rounded-2xl p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-1.5">
            <Share2 className="w-4 h-4 text-[#FF811A]" />
            <h3 className="text-xs font-extrabold uppercase tracking-widest text-[#FA661C]">
              Brand Social Links (Optional)
            </h3>
          </div>
          <span className="text-[11px] text-[#6B6058]">
            Stored in merchant profile for customer inquiries
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          
          {/* Instagram */}
          <div className="flex items-center bg-white border border-[#EAE3DC] rounded-xl overflow-hidden focus-within:border-[#FA661C]">
            <span className="px-3 py-2.5 bg-[#FFF8F2] text-[#E1306C] border-r border-[#EAE3DC] text-xs font-black select-none">
              IG
            </span>
            <input
              type="text"
              value={formData.socialLinks?.instagram || ''}
              onChange={(e) => handleSocialChange('instagram', e.target.value)}
              placeholder="@instagram_handle"
              className="w-full py-2 px-2.5 text-xs text-[#FA661C] font-medium bg-transparent focus:outline-none"
            />
          </div>

          {/* Facebook */}
          <div className="flex items-center bg-white border border-[#EAE3DC] rounded-xl overflow-hidden focus-within:border-[#FA661C]">
            <span className="px-3 py-2.5 bg-[#FFF8F2] text-[#1877F2] border-r border-[#EAE3DC] text-xs font-black select-none">
              FB
            </span>
            <input
              type="text"
              value={formData.socialLinks?.facebook || ''}
              onChange={(e) => handleSocialChange('facebook', e.target.value)}
              placeholder="facebook.com/page"
              className="w-full py-2 px-2.5 text-xs text-[#FA661C] font-medium bg-transparent focus:outline-none"
            />
          </div>

          {/* YouTube */}
          <div className="flex items-center bg-white border border-[#EAE3DC] rounded-xl overflow-hidden focus-within:border-[#FA661C]">
            <span className="px-3 py-2.5 bg-[#FFF8F2] text-[#FF0000] border-r border-[#EAE3DC] text-xs font-black select-none">
              YT
            </span>
            <input
              type="text"
              value={formData.socialLinks?.youtube || ''}
              onChange={(e) => handleSocialChange('youtube', e.target.value)}
              placeholder="youtube.com/@channel"
              className="w-full py-2 px-2.5 text-xs text-[#FA661C] font-medium bg-transparent focus:outline-none"
            />
          </div>

          {/* LinkedIn */}
          <div className="flex items-center bg-white border border-[#EAE3DC] rounded-xl overflow-hidden focus-within:border-[#FA661C]">
            <span className="px-3 py-2.5 bg-[#FFF8F2] text-[#0A66C2] border-r border-[#EAE3DC] text-xs font-black select-none">
              IN
            </span>
            <input
              type="text"
              value={formData.socialLinks?.linkedin || ''}
              onChange={(e) => handleSocialChange('linkedin', e.target.value)}
              placeholder="linkedin.com/company"
              className="w-full py-2 px-2.5 text-xs text-[#FA661C] font-medium bg-transparent focus:outline-none"
            />
          </div>

          {/* X (Twitter) */}
          <div className="flex items-center bg-white border border-[#EAE3DC] rounded-xl overflow-hidden focus-within:border-[#FA661C] sm:col-span-2 lg:col-span-2">
            <span className="px-3 py-2.5 bg-[#FFF8F2] text-[#000000] border-r border-[#EAE3DC] text-xs font-black select-none">
              𝕏
            </span>
            <input
              type="text"
              value={formData.socialLinks?.x || ''}
              onChange={(e) => handleSocialChange('x', e.target.value)}
              placeholder="@brand_x_handle"
              className="w-full py-2 px-2.5 text-xs text-[#FA661C] font-medium bg-transparent focus:outline-none"
            />
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
          <span>Back: Store Info</span>
        </button>

        <button
          type="submit"
          className="px-6 py-3 rounded-xl text-xs font-bold text-[#FFFFFF] bg-[#FA661C] hover:bg-[#E0530B] btn-interactive flex items-center space-x-2 shadow-md cursor-pointer"
        >
          <span>Continue to Payout Setup</span>
          <ArrowRight className="w-4 h-4 text-[#FF811A] icon-interactive" />
        </button>
      </div>

    </form>
  );
}
