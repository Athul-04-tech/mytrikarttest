import React, { useState, useEffect, useRef } from 'react';
import { 
  ShieldCheck, 
  Landmark, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  Edit3, 
  Save, 
  X, 
  Store, 
  Globe, 
  Phone, 
  Mail, 
  MessageCircle, 
  MapPin, 
  Sparkles, 
  RefreshCw,
  Loader2,
  ExternalLink,
  Upload,
  Trash2,
  Image as ImageIcon
} from 'lucide-react';
import { useVendorProfile } from '../../../context/VendorProfileContext';
import { useToast } from '../../../context/ToastContext';
import { resolveMediaUrl } from '../../../config/env';

export default function SellerProfileView() {
  const { 
    vendorProfile, 
    isLoading, 
    error, 
    isUpdating, 
    updateProfile, 
    uploadStoreImage, 
    removeStoreImage, 
    fetchProfile 
  } = useVendorProfile();
  const toast = useToast();

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [fieldErrors, setFieldErrors] = useState({});
  const [generalError, setGeneralError] = useState(null);

  // Logo & Banner upload state
  const [logoUploading, setLogoUploading] = useState(false);
  const [bannerUploading, setBannerUploading] = useState(false);
  const [logoError, setLogoError] = useState(null);
  const [bannerError, setBannerError] = useState(null);

  const logoInputRef = useRef(null);
  const bannerInputRef = useRef(null);

  // Sync form data whenever vendorProfile changes or edit mode opens
  useEffect(() => {
    if (vendorProfile) {
      setFormData({
        store_name: vendorProfile.store_name || '',
        business_name: vendorProfile.business_name || '',
        store_slug: vendorProfile.store_slug || '',
        business_type: vendorProfile.business_type || 'individual',
        tax_id: vendorProfile.tax_id || '',
        registration_number: vendorProfile.registration_number || '',
        is_women_owned: Boolean(vendorProfile.is_women_owned),
        store_description: vendorProfile.store_description || vendorProfile.bio || '',
        support_email: vendorProfile.support_email || '',
        support_phone: vendorProfile.support_phone || '',
        whatsapp_number: vendorProfile.whatsapp_number || '',
        social_links: typeof vendorProfile.social_links === 'object' && vendorProfile.social_links !== null
          ? { ...vendorProfile.social_links }
          : {}
      });
      setFieldErrors({});
      setGeneralError(null);
    }
  }, [vendorProfile, isEditing]);

  const handleStartEdit = () => {
    setFieldErrors({});
    setGeneralError(null);
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setFieldErrors({});
    setGeneralError(null);
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error for this field upon modification
    if (fieldErrors[field]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const handleSocialLinkChange = (network, url) => {
    setFormData((prev) => {
      const nextLinks = { ...(prev.social_links || {}) };
      if (url.trim()) {
        nextLinks[network] = url.trim();
      } else {
        delete nextLinks[network];
      }
      return { ...prev, social_links: nextLinks };
    });
    if (fieldErrors.social_links || fieldErrors[`social_links.${network}`]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next.social_links;
        delete next[`social_links.${network}`];
        return next;
      });
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setGeneralError(null);
    setFieldErrors({});

    // Refuse store_logo / store_banner in PATCH payload as per backend contract
    const patchPayload = {
      store_name: formData.store_name?.trim() || '',
      business_name: formData.business_name?.trim() || '',
      store_slug: formData.store_slug?.trim() || '',
      business_type: formData.business_type || 'individual',
      tax_id: formData.tax_id?.trim() || '',
      registration_number: formData.registration_number?.trim() || '',
      is_women_owned: Boolean(formData.is_women_owned),
      store_description: formData.store_description?.trim() || '',
      support_email: formData.support_email?.trim() || '',
      support_phone: formData.support_phone?.trim() || '',
      whatsapp_number: formData.whatsapp_number?.trim() || '',
      social_links: formData.social_links || {}
    };

    const res = await updateProfile(patchPayload);

    if (res.success) {
      toast.success("Profile Updated", "Merchant credentials saved successfully.");
      setIsEditing(false);
    } else {
      if (res.fieldErrors && Object.keys(res.fieldErrors).length > 0) {
        const normalized = {};
        Object.entries(res.fieldErrors).forEach(([k, v]) => {
          normalized[k] = Array.isArray(v) ? v.join(' ') : String(v);
        });
        setFieldErrors(normalized);
      }
      setGeneralError(res.error || "Please fix the validation errors below.");
      toast.error("Update Failed", res.error || "Please check the highlighted fields.");
    }
  };

  // Image Upload Handlers
  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoUploading(true);
    setLogoError(null);
    try {
      const res = await uploadStoreImage('logo', file);
      if (res.success) {
        toast.success("Logo Updated", "Store logo uploaded and saved successfully.");
      } else {
        const errText = res.error || "Failed to upload logo.";
        setLogoError(errText);
        toast.error("Logo Upload Failed", errText);
      }
    } finally {
      setLogoUploading(false);
      if (logoInputRef.current) logoInputRef.current.value = '';
    }
  };

  const handleBannerUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBannerUploading(true);
    setBannerError(null);
    try {
      const res = await uploadStoreImage('banner', file);
      if (res.success) {
        toast.success("Banner Updated", "Store banner uploaded and saved successfully.");
      } else {
        const errText = res.error || "Failed to upload banner.";
        setBannerError(errText);
        toast.error("Banner Upload Failed", errText);
      }
    } finally {
      setBannerUploading(false);
      if (bannerInputRef.current) bannerInputRef.current.value = '';
    }
  };

  const handleRemoveLogo = async () => {
    setLogoUploading(true);
    setLogoError(null);
    try {
      const res = await removeStoreImage('logo');
      if (res.success) {
        toast.success("Logo Removed", "Store logo has been removed.");
      } else {
        setLogoError(res.error);
        toast.error("Remove Failed", res.error);
      }
    } finally {
      setLogoUploading(false);
    }
  };

  const handleRemoveBanner = async () => {
    setBannerUploading(true);
    setBannerError(null);
    try {
      const res = await removeStoreImage('banner');
      if (res.success) {
        toast.success("Banner Removed", "Store banner has been removed.");
      } else {
        setBannerError(res.error);
        toast.error("Remove Failed", res.error);
      }
    } finally {
      setBannerUploading(false);
    }
  };

  // Helper for displaying a value or "Not set"
  const valOrNotSet = (val) => {
    if (val === null || val === undefined || String(val).trim() === '') {
      return <span className="text-[#6B6058] italic font-normal">Not set</span>;
    }
    return val;
  };

  if (isLoading) {
    return (
      <div className="space-y-6 text-xs animate-pulse">
        <div className="h-6 w-48 bg-gray-200 rounded" />
        <div className="h-44 bg-gray-100 rounded-3xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="h-64 bg-gray-100 rounded-3xl" />
          <div className="h-64 bg-gray-100 rounded-3xl" />
        </div>
      </div>
    );
  }

  if (error && !vendorProfile) {
    return (
      <div className="p-6 bg-[#FDE8EA] border border-[#D7263D]/40 rounded-3xl space-y-3 text-xs text-[#D7263D]">
        <div className="flex items-center space-x-2 font-bold text-sm">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>Unable to Load Merchant Profile</span>
        </div>
        <p>{error}</p>
        <button
          type="button"
          onClick={fetchProfile}
          className="mt-2 px-4 py-2 bg-[#D7263D] text-white font-bold rounded-xl flex items-center space-x-1.5 cursor-pointer hover:bg-[#902B20]"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Retry Loading Profile</span>
        </button>
      </div>
    );
  }

  const p = vendorProfile || {};
  const payout = p.payout_summary || {};
  const addresses = Array.isArray(p.addresses) ? p.addresses : [];
  const documents = Array.isArray(p.documents) ? p.documents : [];
  const social = typeof p.social_links === 'object' && p.social_links !== null ? p.social_links : {};

  return (
    <div className="space-y-6 text-xs animate-reveal">
      
      {/* Top Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#EAE3DC]">
        <div>
          <h2 className="font-['Outfit'] text-xl sm:text-2xl font-extrabold text-[#FA661C]">
            Merchant Profile & KYC Dossier
          </h2>
          <p className="text-xs text-[#6B6058] mt-0.5">
            Verified corporate credentials, GSTIN registration certificate, and designated settlement bank.
          </p>
        </div>

        {!isEditing ? (
          <button
            type="button"
            onClick={handleStartEdit}
            className="px-4 py-2 bg-[#FA661C] hover:bg-[#E0530B] text-white rounded-xl font-bold flex items-center space-x-1.5 cursor-pointer btn-interactive shadow-xs self-start sm:self-auto shrink-0"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Edit Profile</span>
          </button>
        ) : (
          <div className="flex items-center space-x-2 self-start sm:self-auto shrink-0">
            <button
              type="button"
              onClick={handleCancelEdit}
              disabled={isUpdating}
              className="px-3.5 py-2 bg-white hover:bg-gray-100 text-[#6B6058] border border-[#EAE3DC] rounded-xl font-bold flex items-center space-x-1 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              <span>Cancel</span>
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isUpdating}
              className="px-4 py-2 bg-[#FA661C] hover:bg-[#E0530B] text-white rounded-xl font-bold flex items-center space-x-1.5 cursor-pointer shadow-xs disabled:opacity-50"
            >
              {isUpdating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              <span>Save Changes</span>
            </button>
          </div>
        )}
      </div>

      {generalError && (
        <div className="p-4 bg-[#FDE8EA] border border-[#D7263D]/40 rounded-2xl flex items-start space-x-2 text-xs text-[#D7263D]">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{generalError}</span>
        </div>
      )}

      {/* EDIT MODE FORM */}
      {isEditing ? (
        <form onSubmit={handleSave} className="space-y-6">
          
          {/* Card 1: Branding & Visual Assets */}
          <div className="bg-white rounded-3xl border border-[#EAE3DC] p-6 shadow-xs space-y-4">
            <div className="flex items-center space-x-2 text-[#FA661C] font-bold text-sm">
              <Store className="w-4 h-4 text-[#FF811A]" />
              <span>Storefront Branding & Media</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-bold text-[#FA661C] block mb-1">Display Store Name *</label>
                <input
                  type="text"
                  required
                  value={formData.store_name}
                  onChange={(e) => handleInputChange('store_name', e.target.value)}
                  className={`w-full p-2.5 bg-white rounded-xl border text-xs font-bold ${
                    fieldErrors.store_name ? 'border-[#D7263D] text-[#D7263D]' : 'border-[#EAE3DC] text-[#FA661C]'
                  }`}
                />
                {fieldErrors.store_name && (
                  <p className="text-[11px] text-[#D7263D] font-bold mt-1">{fieldErrors.store_name}</p>
                )}
              </div>

              <div>
                <label className="font-bold text-[#FA661C] block mb-1">Store URL Slug *</label>
                <input
                  type="text"
                  required
                  value={formData.store_slug}
                  onChange={(e) => handleInputChange('store_slug', e.target.value)}
                  className={`w-full p-2.5 bg-white rounded-xl border text-xs font-mono font-bold ${
                    fieldErrors.store_slug ? 'border-[#D7263D] text-[#D7263D]' : 'border-[#EAE3DC] text-[#FA661C]'
                  }`}
                />
                {fieldErrors.store_slug && (
                  <p className="text-[11px] text-[#D7263D] font-bold mt-1">{fieldErrors.store_slug}</p>
                )}
              </div>

              <div className="sm:col-span-2">
                <label className="font-bold text-[#FA661C] block mb-1">Store Description / Bio (min 10 characters)</label>
                <textarea
                  rows={3}
                  placeholder="Tell buyers about your craftsmanship, catalog quality, and store ethos..."
                  value={formData.store_description}
                  onChange={(e) => handleInputChange('store_description', e.target.value)}
                  className={`w-full p-2.5 bg-white rounded-xl border text-xs ${
                    fieldErrors.store_description ? 'border-[#D7263D] text-[#D7263D]' : 'border-[#EAE3DC] text-[#1A2420]'
                  }`}
                />
                {fieldErrors.store_description && (
                  <p className="text-[11px] text-[#D7263D] font-bold mt-1">{fieldErrors.store_description}</p>
                )}
              </div>
            </div>
          </div>

          {/* Card 2: Entity & Regulatory Information */}
          <div className="bg-white rounded-3xl border border-[#EAE3DC] p-6 shadow-xs space-y-4">
            <div className="flex items-center space-x-2 text-[#FA661C] font-bold text-sm">
              <ShieldCheck className="w-4 h-4 text-[#FF811A]" />
              <span>Corporate Entity & Regulatory Credentials</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-bold text-[#FA661C] block mb-1">Legal Entity Business Name *</label>
                <input
                  type="text"
                  required
                  value={formData.business_name}
                  onChange={(e) => handleInputChange('business_name', e.target.value)}
                  className={`w-full p-2.5 bg-white rounded-xl border text-xs font-bold ${
                    fieldErrors.business_name ? 'border-[#D7263D] text-[#D7263D]' : 'border-[#EAE3DC] text-[#FA661C]'
                  }`}
                />
                {fieldErrors.business_name && (
                  <p className="text-[11px] text-[#D7263D] font-bold mt-1">{fieldErrors.business_name}</p>
                )}
              </div>

              <div>
                <label className="font-bold text-[#FA661C] block mb-1">Business Entity Type</label>
                <select
                  value={formData.business_type}
                  onChange={(e) => handleInputChange('business_type', e.target.value)}
                  className="w-full p-2.5 bg-white rounded-xl border border-[#EAE3DC] text-xs font-bold text-[#FA661C]"
                >
                  <option value="individual">Individual / Proprietorship</option>
                  <option value="company">Private Limited / Company</option>
                  <option value="partnership">Partnership / LLP</option>
                </select>
                {fieldErrors.business_type && (
                  <p className="text-[11px] text-[#D7263D] font-bold mt-1">{fieldErrors.business_type}</p>
                )}
              </div>

              <div>
                <label className="font-bold text-[#FA661C] block mb-1">GSTIN / Tax ID</label>
                <input
                  type="text"
                  placeholder="e.g. 27ABCDE1234F1Z5"
                  value={formData.tax_id}
                  onChange={(e) => handleInputChange('tax_id', e.target.value.toUpperCase())}
                  className={`w-full p-2.5 bg-white rounded-xl border text-xs font-mono font-bold ${
                    fieldErrors.tax_id ? 'border-[#D7263D] text-[#D7263D]' : 'border-[#EAE3DC] text-[#FA661C]'
                  }`}
                />
                {fieldErrors.tax_id && (
                  <p className="text-[11px] text-[#D7263D] font-bold mt-1">{fieldErrors.tax_id}</p>
                )}
              </div>

              <div>
                <label className="font-bold text-[#FA661C] block mb-1">Registration / CIN Number</label>
                <input
                  type="text"
                  placeholder="e.g. U74999MH2022PTC123456"
                  value={formData.registration_number}
                  onChange={(e) => handleInputChange('registration_number', e.target.value)}
                  className={`w-full p-2.5 bg-white rounded-xl border text-xs font-mono font-bold ${
                    fieldErrors.registration_number ? 'border-[#D7263D] text-[#D7263D]' : 'border-[#EAE3DC] text-[#FA661C]'
                  }`}
                />
                {fieldErrors.registration_number && (
                  <p className="text-[11px] text-[#D7263D] font-bold mt-1">{fieldErrors.registration_number}</p>
                )}
              </div>

              <div className="sm:col-span-2">
                <label className="flex items-center space-x-3 p-3 bg-[#FFF8F2] border border-[#FF811A]/40 rounded-xl cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_women_owned}
                    onChange={(e) => handleInputChange('is_women_owned', e.target.checked)}
                    className="w-4 h-4 text-[#FA661C] rounded border-[#EAE3DC] cursor-pointer"
                  />
                  <span className="font-bold text-[#FA661C] text-xs">
                    This business is women-owned / women-led
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* Card 3: Customer Support & Contact Details */}
          <div className="bg-white rounded-3xl border border-[#EAE3DC] p-6 shadow-xs space-y-4">
            <div className="flex items-center space-x-2 text-[#FA661C] font-bold text-sm">
              <Mail className="w-4 h-4 text-[#FF811A]" />
              <span>Customer Support & Social Channels</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="font-bold text-[#FA661C] block mb-1">Support Email</label>
                <input
                  type="email"
                  placeholder="support@merchant.com"
                  value={formData.support_email}
                  onChange={(e) => handleInputChange('support_email', e.target.value)}
                  className={`w-full p-2.5 bg-white rounded-xl border text-xs ${
                    fieldErrors.support_email ? 'border-[#D7263D] text-[#D7263D]' : 'border-[#EAE3DC] text-[#1A2420]'
                  }`}
                />
                {fieldErrors.support_email && (
                  <p className="text-[11px] text-[#D7263D] font-bold mt-1">{fieldErrors.support_email}</p>
                )}
              </div>

              <div>
                <label className="font-bold text-[#FA661C] block mb-1">Support Phone</label>
                <input
                  type="text"
                  placeholder="+91 98765 43210"
                  value={formData.support_phone}
                  onChange={(e) => handleInputChange('support_phone', e.target.value)}
                  className={`w-full p-2.5 bg-white rounded-xl border text-xs ${
                    fieldErrors.support_phone ? 'border-[#D7263D] text-[#D7263D]' : 'border-[#EAE3DC] text-[#1A2420]'
                  }`}
                />
                {fieldErrors.support_phone && (
                  <p className="text-[11px] text-[#D7263D] font-bold mt-1">{fieldErrors.support_phone}</p>
                )}
              </div>

              <div>
                <label className="font-bold text-[#FA661C] block mb-1">WhatsApp Business</label>
                <input
                  type="text"
                  placeholder="+91 98765 43210"
                  value={formData.whatsapp_number}
                  onChange={(e) => handleInputChange('whatsapp_number', e.target.value)}
                  className={`w-full p-2.5 bg-white rounded-xl border text-xs ${
                    fieldErrors.whatsapp_number ? 'border-[#D7263D] text-[#D7263D]' : 'border-[#EAE3DC] text-[#1A2420]'
                  }`}
                />
                {fieldErrors.whatsapp_number && (
                  <p className="text-[11px] text-[#D7263D] font-bold mt-1">{fieldErrors.whatsapp_number}</p>
                )}
              </div>

              <div>
                <label className="font-bold text-[#FA661C] block mb-1">Website URL</label>
                <input
                  type="url"
                  placeholder="https://merchant.com"
                  value={formData.social_links?.website || ''}
                  onChange={(e) => handleSocialLinkChange('website', e.target.value)}
                  className="w-full p-2.5 bg-white rounded-xl border border-[#EAE3DC] text-xs text-[#1A2420]"
                />
              </div>

              <div>
                <label className="font-bold text-[#FA661C] block mb-1">Instagram URL</label>
                <input
                  type="url"
                  placeholder="https://instagram.com/handle"
                  value={formData.social_links?.instagram || ''}
                  onChange={(e) => handleSocialLinkChange('instagram', e.target.value)}
                  className="w-full p-2.5 bg-white rounded-xl border border-[#EAE3DC] text-xs text-[#1A2420]"
                />
              </div>

              <div>
                <label className="font-bold text-[#FA661C] block mb-1">Twitter / X URL</label>
                <input
                  type="url"
                  placeholder="https://x.com/handle"
                  value={formData.social_links?.twitter || ''}
                  onChange={(e) => handleSocialLinkChange('twitter', e.target.value)}
                  className="w-full p-2.5 bg-white rounded-xl border border-[#EAE3DC] text-xs text-[#1A2420]"
                />
              </div>
            </div>

            {fieldErrors.social_links && (
              <p className="text-[11px] text-[#D7263D] font-bold mt-1">{fieldErrors.social_links}</p>
            )}
          </div>

          <div className="flex justify-end space-x-2 pt-2">
            <button
              type="button"
              onClick={handleCancelEdit}
              disabled={isUpdating}
              className="px-4 py-2 bg-white hover:bg-gray-100 text-[#6B6058] border border-[#EAE3DC] rounded-xl font-bold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isUpdating}
              className="px-5 py-2 bg-[#FA661C] hover:bg-[#E0530B] text-white rounded-xl font-bold flex items-center space-x-1.5 cursor-pointer shadow-xs disabled:opacity-50"
            >
              {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>Save Changes</span>
            </button>
          </div>
        </form>
      ) : (
        /* VIEW MODE: Show every field the API returns */
        <div className="space-y-6">

          {/* Banner & Visual Assets Hero with Real Upload Controls */}
          <div className="bg-white rounded-3xl border border-[#EAE3DC] overflow-hidden shadow-xs">
            {/* Store Banner Display */}
            {p.store_banner ? (
              <div className="h-36 sm:h-52 w-full bg-gray-100 relative group">
                <img
                  src={resolveMediaUrl(p.store_banner)}
                  alt="Store Banner"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-end p-4 space-x-2">
                  <button
                    type="button"
                    onClick={() => bannerInputRef.current?.click()}
                    disabled={bannerUploading}
                    className="px-3 py-1.5 bg-white text-[#FA661C] hover:bg-[#FFF3EC] font-bold rounded-xl text-xs flex items-center space-x-1.5 shadow-md cursor-pointer disabled:opacity-50"
                  >
                    {bannerUploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                    <span>{bannerUploading ? "Uploading..." : "Change Banner"}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleRemoveBanner}
                    disabled={bannerUploading}
                    className="px-3 py-1.5 bg-[#D7263D] hover:bg-[#B31D2E] text-white font-bold rounded-xl text-xs flex items-center space-x-1.5 shadow-md cursor-pointer disabled:opacity-50"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Remove</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="h-28 sm:h-36 w-full bg-[#FFF8F2] border-b border-[#EAE3DC] flex flex-col items-center justify-center text-[#6B6058] space-y-2 p-4">
                <div className="flex items-center space-x-2 text-xs">
                  <ImageIcon className="w-4 h-4 text-[#FF811A]" />
                  <span className="font-bold uppercase tracking-wider text-[#6B6058]">Store Banner: Not set</span>
                </div>
                <button
                  type="button"
                  onClick={() => bannerInputRef.current?.click()}
                  disabled={bannerUploading}
                  className="px-3.5 py-1.5 bg-white hover:bg-[#FFF3EC] border border-[#FF811A]/40 text-[#FA661C] font-bold rounded-xl text-xs flex items-center space-x-1.5 shadow-2xs cursor-pointer disabled:opacity-50"
                >
                  {bannerUploading ? <Loader2 className="w-3.5 h-3.5 animate-spin text-[#FA661C]" /> : <Upload className="w-3.5 h-3.5 text-[#FA661C]" />}
                  <span>{bannerUploading ? "Uploading Banner..." : "Upload Banner (Max 5 MiB)"}</span>
                </button>
              </div>
            )}

            {/* Hidden file input for Banner */}
            <input
              ref={bannerInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleBannerUpload}
              className="hidden"
            />
            {bannerError && (
              <div className="px-6 py-2 bg-[#FDE8EA] border-b border-[#D7263D]/40 text-[#D7263D] font-bold text-xs flex items-center justify-between">
                <span>Banner Error: {bannerError}</span>
                <button type="button" onClick={() => setBannerError(null)} className="text-[#D7263D] hover:underline cursor-pointer">Dismiss</button>
              </div>
            )}

            {/* Logo and Store Info Bar */}
            <div className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 -mt-10 sm:-mt-12 relative z-10">
              <div className="flex items-center space-x-4">
                {/* Logo with Upload / Remove overlay */}
                <div className="relative group w-20 h-20 rounded-2xl shrink-0">
                  {p.store_logo ? (
                    <img
                      src={resolveMediaUrl(p.store_logo)}
                      alt={p.store_name || 'Store Logo'}
                      className="w-20 h-20 rounded-2xl object-cover bg-white border-2 border-white shadow-md"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-2xl bg-[#FA661C] text-[#FF811A] font-black text-xl flex items-center justify-center border-2 border-white shadow-md">
                      {p.store_name ? p.store_name.slice(0, 2).toUpperCase() : 'NS'}
                    </div>
                  )}

                  {/* Logo Hover Controls */}
                  <div className="absolute inset-0 bg-black/60 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center space-y-1 p-1">
                    <button
                      type="button"
                      onClick={() => logoInputRef.current?.click()}
                      disabled={logoUploading}
                      title="Upload New Logo"
                      className="p-1.5 bg-white text-[#FA661C] rounded-lg shadow-sm hover:bg-[#FFF3EC] cursor-pointer disabled:opacity-50"
                    >
                      {logoUploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                    </button>
                    {p.store_logo && (
                      <button
                        type="button"
                        onClick={handleRemoveLogo}
                        disabled={logoUploading}
                        title="Remove Logo"
                        className="p-1.5 bg-[#D7263D] text-white rounded-lg shadow-sm hover:bg-[#B31D2E] cursor-pointer disabled:opacity-50"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Hidden file input for Logo */}
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleLogoUpload}
                  className="hidden"
                />

                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="font-['Outfit'] font-black text-lg sm:text-xl text-[#FA661C]">
                      Storefront Visual Assets
                    </h3>
                    <button
                      type="button"
                      onClick={() => logoInputRef.current?.click()}
                      disabled={logoUploading}
                      className="text-[11px] text-[#FA661C] hover:underline font-bold cursor-pointer"
                    >
                      {logoUploading ? "Uploading..." : "(Change Logo)"}
                    </button>
                  </div>
                  <p className="text-xs text-[#6B6058] font-medium">
                    Store Logo (Max 2 MiB, JPEG/PNG/WebP) & Header Banner (Max 5 MiB)
                  </p>
                  <p className="text-[11px] font-mono text-[#FA661C]">
                    Slug: {valOrNotSet(p.store_slug)}
                  </p>
                </div>
              </div>

              {p.is_women_owned && (
                <div className="flex items-center space-x-1.5 px-3 py-1 rounded-full bg-[#FFF3EC] text-[#FA661C] border border-[#FF811A]/40 self-start sm:self-auto">
                  <Sparkles className="w-3.5 h-3.5 text-[#FF811A]" />
                  <span className="font-extrabold text-[11px]">Women-Led Enterprise</span>
                </div>
              )}
            </div>

            {logoError && (
              <div className="px-6 py-2 bg-[#FDE8EA] border-t border-[#D7263D]/40 text-[#D7263D] font-bold text-xs flex items-center justify-between">
                <span>Logo Error: {logoError}</span>
                <button type="button" onClick={() => setLogoError(null)} className="text-[#D7263D] hover:underline cursor-pointer">Dismiss</button>
              </div>
            )}

            {p.store_description && (
              <div className="px-6 pb-6 pt-2 border-t border-[#EAE3DC]/50 text-xs text-[#6B6058]">
                <span className="font-bold text-[#FA661C] block mb-0.5">Store Bio / Description:</span>
                <p className="leading-relaxed">{p.store_description}</p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            
            {/* Card 1: Corporate Entity Information */}
            <div className="bg-white rounded-3xl border border-[#EAE3DC] p-6 shadow-xs space-y-3">
              <div className="flex items-center space-x-2 text-[#FA661C] font-bold text-sm">
                <ShieldCheck className="w-4 h-4 text-[#FF811A]" />
                <span>Corporate Entity Credentials</span>
              </div>

              <div className="space-y-2 text-xs divide-y divide-[#EAE3DC]/50">
                <div className="pt-2 flex justify-between">
                  <span className="text-[#6B6058]">Legal Business Name:</span>
                  <span className="font-bold text-[#FA661C]">{valOrNotSet(p.business_name)}</span>
                </div>
                <div className="pt-2 flex justify-between">
                  <span className="text-[#6B6058]">Display Store Name:</span>
                  <span className="font-bold text-[#FA661C]">{valOrNotSet(p.store_name)}</span>
                </div>
                <div className="pt-2 flex justify-between">
                  <span className="text-[#6B6058]">Business Entity Type:</span>
                  <span className="font-bold text-[#FA661C] capitalize">{valOrNotSet(p.business_type)}</span>
                </div>
                <div className="pt-2 flex justify-between">
                  <span className="text-[#6B6058]">GSTIN / Tax ID:</span>
                  <span className="font-mono font-bold text-[#FA661C]">{valOrNotSet(p.tax_id)}</span>
                </div>
                <div className="pt-2 flex justify-between">
                  <span className="text-[#6B6058]">Company Registration Number:</span>
                  <span className="font-mono font-bold text-[#FA661C]">{valOrNotSet(p.registration_number)}</span>
                </div>
                <div className="pt-2 flex justify-between">
                  <span className="text-[#6B6058]">Country of Domicile:</span>
                  <span className="font-bold text-[#FA661C] uppercase">{valOrNotSet(p.country)}</span>
                </div>
                <div className="pt-2 flex justify-between">
                  <span className="text-[#6B6058]">Women-Owned Status:</span>
                  <span className="font-bold text-[#FA661C]">{p.is_women_owned ? 'Yes' : 'No'}</span>
                </div>
              </div>
            </div>

            {/* Card 2: KYC Verification & Platform Status (Read-Only) */}
            <div className="bg-white rounded-3xl border border-[#EAE3DC] p-6 shadow-xs space-y-3">
              <div className="flex items-center space-x-2 text-[#FA661C] font-bold text-sm">
                <CheckCircle2 className="w-4 h-4 text-[#FF811A]" />
                <span>KYC Verification & Platform Status (Read-Only)</span>
              </div>

              <div className="space-y-2 text-xs divide-y divide-[#EAE3DC]/50">
                <div className="pt-2 flex justify-between">
                  <span className="text-[#6B6058]">Vendor Account ID:</span>
                  <span className="font-mono font-bold text-[#FA661C]">#{p.id || 'Not set'}</span>
                </div>
                <div className="pt-2 flex justify-between items-center">
                  <span className="text-[#6B6058]">Onboarding Status:</span>
                  <span className="font-bold uppercase px-2 py-0.5 rounded-full text-[10px] bg-[#FFF3EC] text-[#FA661C] border border-[#FF811A]/40">
                    {valOrNotSet(p.onboarding_status ? String(p.onboarding_status).toUpperCase() : null)}
                  </span>
                </div>
                <div className="pt-2 flex justify-between items-center">
                  <span className="text-[#6B6058]">Trust Level:</span>
                  <span className="font-bold uppercase px-2 py-0.5 rounded-full text-[10px] bg-[#FFF8F2] text-[#FA661C] border border-[#FF811A]/50">
                    {valOrNotSet(p.trust_level ? String(p.trust_level).toUpperCase() : null)}
                  </span>
                </div>
                <div className="pt-2 flex justify-between">
                  <span className="text-[#6B6058]">Review Decision Reason:</span>
                  <span className="font-medium text-[#1A2420] text-right max-w-[200px]">
                    {valOrNotSet(p.onboarding_review_reason)}
                  </span>
                </div>
                <div className="pt-2 flex justify-between">
                  <span className="text-[#6B6058]">Reviewed By:</span>
                  <span className="font-medium text-[#1A2420]">{valOrNotSet(p.onboarding_reviewed_by)}</span>
                </div>
                <div className="pt-2 flex justify-between">
                  <span className="text-[#6B6058]">Review Timestamp:</span>
                  <span className="font-mono text-[#1A2420]">
                    {p.onboarding_reviewed_at ? new Date(p.onboarding_reviewed_at).toLocaleString() : 'Not set'}
                  </span>
                </div>
              </div>
            </div>

            {/* Card 3: Contact & Support Channels */}
            <div className="bg-white rounded-3xl border border-[#EAE3DC] p-6 shadow-xs space-y-3">
              <div className="flex items-center space-x-2 text-[#FA661C] font-bold text-sm">
                <Phone className="w-4 h-4 text-[#FF811A]" />
                <span>Support & Contact Channels</span>
              </div>

              <div className="space-y-2 text-xs divide-y divide-[#EAE3DC]/50">
                <div className="pt-2 flex justify-between">
                  <span className="text-[#6B6058]">Account Owner Email:</span>
                  <span className="font-bold text-[#FA661C]">{valOrNotSet(p.contact_email)}</span>
                </div>
                <div className="pt-2 flex justify-between">
                  <span className="text-[#6B6058]">Account Owner Phone:</span>
                  <span className="font-bold text-[#FA661C]">{valOrNotSet(p.contact_phone)}</span>
                </div>
                <div className="pt-2 flex justify-between">
                  <span className="text-[#6B6058]">Customer Support Email:</span>
                  <span className="font-bold text-[#FA661C]">{valOrNotSet(p.support_email)}</span>
                </div>
                <div className="pt-2 flex justify-between">
                  <span className="text-[#6B6058]">Customer Support Phone:</span>
                  <span className="font-bold text-[#FA661C]">{valOrNotSet(p.support_phone)}</span>
                </div>
                <div className="pt-2 flex justify-between">
                  <span className="text-[#6B6058]">WhatsApp Business:</span>
                  <span className="font-bold text-[#FA661C]">{valOrNotSet(p.whatsapp_number)}</span>
                </div>
                <div className="pt-2 flex justify-between items-start">
                  <span className="text-[#6B6058]">Social Channels:</span>
                  <div className="text-right space-y-0.5">
                    {Object.keys(social).length === 0 ? (
                      <span className="text-[#6B6058] italic font-normal">Not set</span>
                    ) : (
                      Object.entries(social).map(([net, url]) => (
                        <a
                          key={net}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#FA661C] hover:underline font-bold capitalize flex items-center justify-end space-x-1"
                        >
                          <span>{net}</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Card 4: Designated Remittance Bank (Real payout_summary from API) */}
            <div className="bg-white rounded-3xl border border-[#EAE3DC] p-6 shadow-xs space-y-3">
              <div className="flex items-center space-x-2 text-[#FA661C] font-bold text-sm">
                <Landmark className="w-4 h-4 text-[#FF811A]" />
                <span>Designated Remittance & Payout Account</span>
              </div>

              <div className="space-y-2 text-xs divide-y divide-[#EAE3DC]/50">
                <div className="pt-2 flex justify-between">
                  <span className="text-[#6B6058]">Payout Method:</span>
                  <span className="font-bold text-[#FA661C] capitalize">{valOrNotSet(payout.payout_method)}</span>
                </div>
                <div className="pt-2 flex justify-between">
                  <span className="text-[#6B6058]">UPI ID:</span>
                  <span className="font-mono font-bold text-[#FA661C]">{valOrNotSet(payout.upi_id)}</span>
                </div>
                <div className="pt-2 flex justify-between">
                  <span className="text-[#6B6058]">Masked Bank Account:</span>
                  <span className="font-mono font-bold text-[#FA661C]">{valOrNotSet(payout.bank_account_number)}</span>
                </div>
                <div className="pt-2 flex justify-between">
                  <span className="text-[#6B6058]">Bank IFSC Code:</span>
                  <span className="font-mono font-bold text-[#FA661C]">{valOrNotSet(payout.bank_ifsc)}</span>
                </div>
                <div className="pt-2 flex justify-between">
                  <span className="text-[#6B6058]">Account Holder Name:</span>
                  <span className="font-bold text-[#FA661C]">{valOrNotSet(payout.bank_account_holder)}</span>
                </div>
                <div className="pt-2 flex justify-between">
                  <span className="text-[#6B6058]">Stripe Connect ID:</span>
                  <span className="font-mono font-bold text-[#FA661C]">{valOrNotSet(payout.stripe_connect_account_id)}</span>
                </div>
                <div className="pt-2 flex justify-between items-center">
                  <span className="text-[#6B6058]">Payout Account Verified:</span>
                  <span className={`font-bold px-2 py-0.5 rounded-full text-[10px] ${
                    payout.is_verified ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                  }`}>
                    {payout.is_verified ? 'Verified' : 'Pending Verification'}
                  </span>
                </div>
              </div>
            </div>

            {/* Card 5: Registered Vendor Addresses */}
            <div className="bg-white rounded-3xl border border-[#EAE3DC] p-6 shadow-xs space-y-3">
              <div className="flex items-center space-x-2 text-[#FA661C] font-bold text-sm">
                <MapPin className="w-4 h-4 text-[#FF811A]" />
                <span>Registered Business Addresses</span>
              </div>

              {addresses.length === 0 ? (
                <p className="text-[#6B6058] italic py-2">Not set</p>
              ) : (
                <div className="space-y-2.5 divide-y divide-[#EAE3DC]/50">
                  {addresses.map((addr, idx) => (
                    <div key={idx} className="pt-2 first:pt-0 space-y-0.5 text-xs">
                      <p className="font-bold text-[#FA661C]">{addr.address_line1}</p>
                      {addr.address_line2 && <p className="text-[#6B6058]">{addr.address_line2}</p>}
                      <p className="text-[#6B6058]">
                        {addr.city}, {addr.state} — {addr.postal_code}, {addr.country}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Card 6: Uploaded KYC Documents */}
            <div className="bg-white rounded-3xl border border-[#EAE3DC] p-6 shadow-xs space-y-3">
              <div className="flex items-center space-x-2 text-[#FA661C] font-bold text-sm">
                <FileText className="w-4 h-4 text-[#FF811A]" />
                <span>Uploaded KYC Compliance Documents</span>
              </div>

              {documents.length === 0 ? (
                <p className="text-[#6B6058] italic py-2">Not set</p>
              ) : (
                <div className="space-y-2 divide-y divide-[#EAE3DC]/50">
                  {documents.map((doc) => (
                    <div key={doc.id} className="pt-2 first:pt-0 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-bold text-[#FA661C] block capitalize">
                          {doc.document_type ? doc.document_type.replace(/_/g, ' ') : 'Document'}
                        </span>
                        <span className="text-[10px] text-[#6B6058] block font-mono">
                          {doc.file_name || 'Uploaded File'}
                        </span>
                        {doc.rejection_reason && (
                          <span className="text-[10px] text-[#D7263D] block font-bold">
                            Reason: {doc.rejection_reason}
                          </span>
                        )}
                      </div>
                      <span className={`px-2 py-0.5 rounded-full font-bold uppercase text-[9px] ${
                        doc.status === 'verified'
                          ? 'bg-emerald-50 text-emerald-700'
                          : doc.status === 'rejected'
                          ? 'bg-red-50 text-red-700'
                          : 'bg-amber-50 text-amber-700'
                      }`}>
                        {doc.status || 'Pending'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

        </div>
      )}
    </div>
  );
}
