import React, { useState, useEffect } from 'react';
import { 
  User, 
  Camera, 
  CheckCircle2, 
  Edit3, 
  Save, 
  X, 
  Building2, 
  ChevronDown, 
  Globe, 
  Coins, 
  BellRing,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';

export const GENDER_OPTIONS = [
  { value: '', label: 'Select gender' },
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' },
  { value: 'prefer_not_to_say', label: 'Prefer not to say' },
];

export const LANGUAGE_OPTIONS = [
  { code: '', label: 'Select language' },
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'Hindi (हिन्दी)' },
  { code: 'ml', label: 'Malayalam (മലയാളം)' },
  { code: 'ta', label: 'Tamil (தமிழ்)' },
  { code: 'te', label: 'Telugu (తెలుగు)' },
  { code: 'kn', label: 'Kannada (ಕನ್ನಡ)' },
  { code: 'ar', label: 'Arabic (العربية)' },
];

function formatDob(dateStr) {
  if (!dateStr) return 'Not set';
  const parts = String(dateStr).split('-');
  if (parts.length === 3) {
    const [year, month, day] = parts;
    const d = new Date(Number(year), Number(month) - 1, Number(day));
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    }
  }
  return dateStr;
}

function getGenderDisplay(value) {
  if (!value) return 'Not set';
  const match = GENDER_OPTIONS.find(opt => opt.value === value && opt.value !== '');
  return match ? match.label : value;
}

function getLanguageDisplay(code, serverDisplay) {
  if (serverDisplay) return serverDisplay;
  if (!code) return 'Not set';
  const match = LANGUAGE_OPTIONS.find(opt => opt.code === code && opt.code !== '');
  return match ? match.label : code;
}

export default function PersonalDetailsSection({ profileData, userProfile, onUpdateProfile }) {
  const initialData = profileData || userProfile || {};
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    ...initialData,
    date_of_birth: initialData.date_of_birth || '',
    gender: initialData.gender || '',
    preferred_language: initialData.preferred_language || '',
    preferred_language_display: initialData.preferred_language_display || '',
  });
  const [isBusinessOpen, setIsBusinessOpen] = useState(true);
  const [saveToast, setSaveToast] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [generalError, setGeneralError] = useState('');

  // Sync state when props change
  useEffect(() => {
    if (!isEditing) {
      const current = profileData || userProfile || {};
      setFormData({
        ...current,
        date_of_birth: current.date_of_birth || '',
        gender: current.gender || '',
        preferred_language: current.preferred_language || '',
        preferred_language_display: current.preferred_language_display || '',
      });
      setFieldErrors({});
      setGeneralError('');
    }
  }, [profileData, userProfile, isEditing]);

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFieldErrors({});
    setGeneralError('');

    try {
      if (onUpdateProfile) {
        const saved = await onUpdateProfile({
          date_of_birth: formData.date_of_birth || '',
          gender: formData.gender || '',
          preferred_language: formData.preferred_language || '',
        });
        if (saved) {
          setFormData(prev => ({
            ...prev,
            ...saved,
            date_of_birth: saved.date_of_birth || '',
            gender: saved.gender || '',
            preferred_language: saved.preferred_language || '',
            preferred_language_display: saved.preferred_language_display || '',
          }));
        }
      }
      setIsEditing(false);
      setSaveToast(true);
      setTimeout(() => setSaveToast(false), 3000);
    } catch (err) {
      const extractedFieldErrors = {};
      let genericMsg = '';

      if (err?.data && typeof err.data === 'object' && !Array.isArray(err.data)) {
        for (const [key, val] of Object.entries(err.data)) {
          const errorText = Array.isArray(val) ? val.join(' ') : String(val);
          if (['date_of_birth', 'gender', 'preferred_language'].includes(key)) {
            extractedFieldErrors[key] = errorText;
          } else if (key === 'detail' || key === 'message' || key === 'non_field_errors') {
            genericMsg = errorText;
          } else {
            genericMsg = genericMsg ? `${genericMsg} | ${errorText}` : errorText;
          }
        }
      }

      if (!genericMsg && Object.keys(extractedFieldErrors).length === 0) {
        genericMsg = err?.message || 'Could not save profile details. Please try again.';
      }

      setFieldErrors(extractedFieldErrors);
      setGeneralError(genericMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    const current = profileData || userProfile || {};
    setFormData({
      ...current,
      date_of_birth: current.date_of_birth || '',
      gender: current.gender || '',
      preferred_language: current.preferred_language || '',
      preferred_language_display: current.preferred_language_display || '',
    });
    setFieldErrors({});
    setGeneralError('');
    setIsEditing(false);
  };

  return (
    <div className="bg-white rounded-3xl border border-[#EAE3DC] p-6 sm:p-8 lg:p-10 shadow-xs animate-reveal">
      
      {/* Header with Edit Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#EAE3DC]">
        <div>
          <h2 className="font-['Outfit'] text-2xl sm:text-3xl font-extrabold text-[#FA661C] tracking-tight">
            Personal Details
          </h2>
          <p className="text-xs sm:text-sm text-[#6B6058] mt-1">
            Manage your personal profile, regional preferences, and verified tax credentials
          </p>
        </div>

        {/* Edit / Save Actions with Micro-Interactions */}
        <div className="flex items-center space-x-2">
          {isEditing ? (
            <>
              <button
                type="button"
                onClick={handleCancel}
                disabled={isSubmitting}
                className="px-3.5 py-2 rounded-xl text-xs font-bold text-[#6B6058] bg-[#FFFFFF] hover:bg-[#FFF3EC] border border-[#EAE3DC] btn-interactive flex items-center space-x-1.5 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
                <span>Cancel</span>
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={isSubmitting}
                className="px-4 py-2 rounded-xl text-xs font-bold text-[#FFFFFF] bg-[#FA661C] hover:bg-[#E0530B] disabled:opacity-50 btn-interactive flex items-center space-x-1.5 shadow-xs cursor-pointer"
              >
                <Save className="w-3.5 h-3.5 text-[#FF811A]" />
                <span>{isSubmitting ? 'Saving...' : 'Save Changes'}</span>
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="px-4 py-2 rounded-xl text-xs font-bold text-[#FA661C] bg-[#FFF8F2] hover:bg-[#FF811A]/25 border border-[#FF811A] btn-interactive flex items-center space-x-1.5 shadow-2xs cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5 text-[#FA661C]" />
              <span>Edit Details</span>
            </button>
          )}
        </div>
      </div>

      {/* General Error Banner */}
      {generalError && (
        <div className="mt-4 p-3 bg-red-50 text-red-700 text-xs font-semibold rounded-xl border border-red-200 flex items-center space-x-2 animate-dropdown" role="alert">
          <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
          <span>{generalError}</span>
        </div>
      )}

      {/* Save Toast */}
      {saveToast && (
        <div className="mt-4 p-3 bg-[#FFF3EC] text-[#FA661C] text-xs font-bold rounded-xl border border-[#FA661C]/20 flex items-center space-x-2 animate-dropdown">
          <CheckCircle2 className="w-4 h-4 text-[#FF811A]" />
          <span>Profile changes saved successfully!</span>
        </div>
      )}

      {/* Form / Read View */}
      <form onSubmit={handleSave} className="mt-8 space-y-8">
        
        {/* Photo Upload Row */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-6 p-4 rounded-2xl bg-[#FFFFFF] border border-[#EAE3DC]/80">
          <div className="relative group">
            {formData?.avatar ? (
              <img
                src={formData.avatar}
                alt={formData?.fullName || formData?.username || 'Profile'}
                className="w-20 h-20 rounded-full object-cover border-2 border-[#FF811A] shadow-sm avatar-interactive cursor-pointer"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-[#FF811A] text-[#FA661C] font-black text-xl flex items-center justify-center border-2 border-[#FF811A] shadow-sm">
                {(formData?.fullName || formData?.name || formData?.username || 'U').slice(0, 2).toUpperCase()}
              </div>
            )}
            {isEditing && (
              <button
                type="button"
                onClick={() => alert("Upload photo file picker placeholder")}
                className="absolute inset-0 bg-[#FA661C]/60 rounded-full flex flex-col items-center justify-center text-white text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-opacity btn-interactive cursor-pointer"
              >
                <Camera className="w-5 h-5 mb-0.5 text-[#FF811A]" />
                <span>Change</span>
              </button>
            )}
          </div>

          <div className="text-center sm:text-left">
            <h3 className="font-['Outfit'] font-bold text-base text-[#FA661C]">
              Profile Photo
            </h3>
            <p className="text-xs text-[#6B6058] max-w-sm mt-0.5">
              JPG, PNG or WebP under 5MB. Visible on verified customer reviews and community questions.
            </p>
            {isEditing && (
              <button
                type="button"
                onClick={() => alert("Upload photo placeholder")}
                className="mt-2.5 px-3 py-1 bg-white border border-[#EAE3DC] hover:border-[#FA661C] text-[#FA661C] rounded-lg text-xs font-bold btn-interactive cursor-pointer"
              >
                Upload New Image
              </button>
            )}
          </div>
        </div>

        {/* Personal Details Grid */}
        <div>
          <h3 className="text-xs font-extrabold uppercase tracking-widest text-[#FA661C] mb-4 flex items-center space-x-1.5">
            <User className="w-4 h-4 text-[#FF811A]" />
            <span>Basic Identity</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Full Name */}
            <div>
              <label className="block text-xs font-bold text-[#6B6058] mb-1.5">
                Full Name
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={formData?.fullName || ''}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="w-full py-2.5 px-3.5 text-xs sm:text-sm font-medium rounded-xl bg-white border border-[#EAE3DC] text-[#FA661C] input-interactive"
                />
              ) : (
                <div className="py-2.5 px-3.5 text-xs sm:text-sm font-bold text-[#FA661C] bg-[#FFFFFF] rounded-xl border border-[#EAE3DC]/60">
                  {formData?.fullName || formData?.name || formData?.username || 'Not set'}
                </div>
              )}
            </div>

            {/* Email Address */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-[#6B6058]">
                  Email Address
                </label>
                {formData?.is_email_verified && (
                  <span className="text-[10px] font-bold text-[#FA661C] bg-[#FFF3EC] px-1.5 py-0.2 rounded flex items-center space-x-1">
                    <CheckCircle2 className="w-3 h-3 text-[#FF811A]" />
                    <span>Verified</span>
                  </span>
                )}
              </div>
              {isEditing ? (
                <input
                  type="email"
                  value={formData?.email || ''}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full py-2.5 px-3.5 text-xs sm:text-sm font-medium rounded-xl bg-white border border-[#EAE3DC] text-[#FA661C] input-interactive"
                />
              ) : (
                <div className="py-2.5 px-3.5 text-xs sm:text-sm font-bold text-[#FA661C] bg-[#FFFFFF] rounded-xl border border-[#EAE3DC]/60">
                  {formData?.email || 'Not set'}
                </div>
              )}
            </div>

            {/* Mobile Number */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-[#6B6058]">
                  Mobile Number
                </label>
                {formData?.is_phone_verified && (
                  <span className="text-[10px] font-bold text-[#FA661C] bg-[#FFF3EC] px-1.5 py-0.2 rounded flex items-center space-x-1">
                    <CheckCircle2 className="w-3 h-3 text-[#FF811A]" />
                    <span>Verified</span>
                  </span>
                )}
              </div>
              {isEditing ? (
                <input
                  type="tel"
                  value={formData?.mobile || formData?.phone_number || ''}
                  onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                  className="w-full py-2.5 px-3.5 text-xs sm:text-sm font-medium rounded-xl bg-white border border-[#EAE3DC] text-[#FA661C] input-interactive"
                />
              ) : (
                <div className="py-2.5 px-3.5 text-xs sm:text-sm font-bold text-[#FA661C] bg-[#FFFFFF] rounded-xl border border-[#EAE3DC]/60">
                  {formData?.mobile || formData?.phone_number || 'Not set'}
                </div>
              )}
            </div>

            {/* Date of Birth */}
            <div>
              <label htmlFor="date_of_birth" className="block text-xs font-bold text-[#6B6058] mb-1.5">
                Date of Birth
              </label>
              {isEditing ? (
                <>
                  <input
                    type="date"
                    id="date_of_birth"
                    name="date_of_birth"
                    min="1900-01-01"
                    max={new Date().toISOString().split('T')[0]}
                    value={formData?.date_of_birth || ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      setFormData(prev => ({ ...prev, date_of_birth: val }));
                      if (fieldErrors.date_of_birth) {
                        setFieldErrors(prev => {
                          const u = { ...prev };
                          delete u.date_of_birth;
                          return u;
                        });
                      }
                      if (generalError) setGeneralError('');
                    }}
                    className={`w-full py-2.5 px-3.5 text-xs sm:text-sm font-medium rounded-xl bg-white border ${
                      fieldErrors.date_of_birth ? 'border-red-500 focus:border-red-500' : 'border-[#EAE3DC]'
                    } text-[#FA661C] input-interactive`}
                  />
                  {fieldErrors.date_of_birth && (
                    <p className="mt-1.5 text-xs text-red-600 font-medium" role="alert">
                      {fieldErrors.date_of_birth}
                    </p>
                  )}
                </>
              ) : (
                <div className="py-2.5 px-3.5 text-xs sm:text-sm font-bold text-[#FA661C] bg-[#FFFFFF] rounded-xl border border-[#EAE3DC]/60">
                  {formatDob(formData?.date_of_birth)}
                </div>
              )}
            </div>

            {/* Gender */}
            <div>
              <label htmlFor="gender" className="block text-xs font-bold text-[#6B6058] mb-1.5">
                Gender
              </label>
              {isEditing ? (
                <>
                  <select
                    id="gender"
                    name="gender"
                    value={formData?.gender || ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      setFormData(prev => ({ ...prev, gender: val }));
                      if (fieldErrors.gender) {
                        setFieldErrors(prev => {
                          const u = { ...prev };
                          delete u.gender;
                          return u;
                        });
                      }
                      if (generalError) setGeneralError('');
                    }}
                    className={`w-full py-2.5 px-3.5 text-xs sm:text-sm font-medium rounded-xl bg-white border ${
                      fieldErrors.gender ? 'border-red-500 focus:border-red-500' : 'border-[#EAE3DC]'
                    } text-[#FA661C] input-interactive`}
                  >
                    {GENDER_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  {fieldErrors.gender && (
                    <p className="mt-1.5 text-xs text-red-600 font-medium" role="alert">
                      {fieldErrors.gender}
                    </p>
                  )}
                </>
              ) : (
                <div className="py-2.5 px-3.5 text-xs sm:text-sm font-bold text-[#FA661C] bg-[#FFFFFF] rounded-xl border border-[#EAE3DC]/60">
                  {getGenderDisplay(formData?.gender)}
                </div>
              )}
            </div>

            {/* Preferred Language */}
            <div>
              <label htmlFor="preferred_language" className="block text-xs font-bold text-[#6B6058] mb-1.5">
                Preferred Language
              </label>
              {isEditing ? (
                <>
                  <select
                    id="preferred_language"
                    name="preferred_language"
                    value={formData?.preferred_language || ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      setFormData(prev => ({ ...prev, preferred_language: val }));
                      if (fieldErrors.preferred_language) {
                        setFieldErrors(prev => {
                          const u = { ...prev };
                          delete u.preferred_language;
                          return u;
                        });
                      }
                      if (generalError) setGeneralError('');
                    }}
                    className={`w-full py-2.5 px-3.5 text-xs sm:text-sm font-medium rounded-xl bg-white border ${
                      fieldErrors.preferred_language ? 'border-red-500 focus:border-red-500' : 'border-[#EAE3DC]'
                    } text-[#FA661C] input-interactive`}
                  >
                    {LANGUAGE_OPTIONS.map(opt => (
                      <option key={opt.code} value={opt.code}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  {fieldErrors.preferred_language && (
                    <p className="mt-1.5 text-xs text-red-600 font-medium" role="alert">
                      {fieldErrors.preferred_language}
                    </p>
                  )}
                </>
              ) : (
                <div className="py-2.5 px-3.5 text-xs sm:text-sm font-bold text-[#FA661C] bg-[#FFFFFF] rounded-xl border border-[#EAE3DC]/60">
                  {getLanguageDisplay(formData?.preferred_language, formData?.preferred_language_display)}
                </div>
              )}
            </div>

            {/* Preferred Currency */}
            <div>
              <label className="block text-xs font-bold text-[#6B6058] mb-1.5">
                Preferred Currency (India / UAE / Ireland)
              </label>
              {isEditing ? (
                <select
                  value={formData?.preferredCurrency || 'INR (₹) - Indian Rupee'}
                  onChange={(e) => setFormData({ ...formData, preferredCurrency: e.target.value })}
                  className="w-full py-2.5 px-3.5 text-xs sm:text-sm font-medium rounded-xl bg-white border border-[#EAE3DC] text-[#FA661C] input-interactive"
                >
                  <option value="INR (₹) - Indian Rupee">INR (₹) - Indian Rupee</option>
                  <option value="AED (د.إ) - UAE Dirham">AED (د.إ) - UAE Dirham</option>
                  <option value="EUR (€) - Euro (Ireland)">EUR (€) - Euro (Ireland)</option>
                  <option value="USD ($) - US Dollar">USD ($) - US Dollar</option>
                </select>
              ) : (
                <div className="py-2.5 px-3.5 text-xs sm:text-sm font-bold text-[#FA661C] bg-[#FFFFFF] rounded-xl border border-[#EAE3DC]/60">
                  {formData?.preferredCurrency || 'Not set'}
                </div>
              )}
            </div>

            {/* Newsletter Subscription Toggle */}
            <div className="flex items-center justify-between p-3 bg-[#FFFFFF] rounded-xl border border-[#EAE3DC]/80 sm:col-span-2">
              <div>
                <h4 className="text-xs font-bold text-[#FA661C]">Weekly Trend Newsletter</h4>
                <p className="text-[11px] text-[#6B6058]">Receive member discounts and flash sale alerts</p>
              </div>
              <button
                type="button"
                onClick={() => isEditing && setFormData({ ...formData, newsletterSubscribed: !formData?.newsletterSubscribed })}
                disabled={!isEditing}
                className={`w-11 h-6 rounded-full transition-colors relative focus:outline-none ${
                  formData?.newsletterSubscribed ? 'bg-[#FA661C]' : 'bg-[#EAE3DC]'
                } ${!isEditing ? 'opacity-80 cursor-default' : 'cursor-pointer'}`}
              >
                <div className={`w-4 h-4 rounded-full bg-[#FFFFFF] absolute top-1 toggle-thumb-spring ${
                  formData?.newsletterSubscribed ? 'right-1' : 'left-1'
                }`} />
              </button>
            </div>
          </div>
        </div>

        {/* Collapsible Business Details Section */}
        <div className="border border-[#EAE3DC] rounded-2xl overflow-hidden bg-[#FFFFFF]/40">
          <button
            type="button"
            onClick={() => setIsBusinessOpen(!isBusinessOpen)}
            className="w-full p-4 bg-[#FFF3EC]/60 hover:bg-[#FFF3EC] transition-colors flex items-center justify-between text-left cursor-pointer"
          >
            <div className="flex items-center space-x-2">
              <Building2 className="w-4 h-4 text-[#FF811A]" />
              <div>
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#FA661C]">
                  Business & GSTIN Credentials (Optional)
                </h4>
                <p className="text-[11px] text-[#6B6058]">Claim input tax credits on business invoices</p>
              </div>
            </div>
            <ChevronDown className={`w-4 h-4 text-[#6B6058] transition-transform ${
              isBusinessOpen ? 'rotate-180 text-[#FA661C]' : ''
            }`} />
          </button>

          {isBusinessOpen && (
            <div className="p-5 space-y-4 bg-white border-t border-[#EAE3DC] animate-dropdown">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#6B6058] mb-1">
                    Company Registered Name
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData?.businessDetails?.companyName || ''}
                      onChange={(e) => setFormData({
                        ...formData,
                        businessDetails: { ...(formData?.businessDetails || {}), companyName: e.target.value }
                      })}
                      className="w-full py-2.5 px-3.5 text-xs font-medium rounded-xl bg-white border border-[#EAE3DC] text-[#FA661C] input-interactive"
                    />
                  ) : (
                    <div className="py-2 px-3 text-xs font-bold text-[#FA661C] bg-[#FFFFFF] rounded-xl border border-[#EAE3DC]">
                      {formData?.businessDetails?.companyName || "Not configured"}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#6B6058] mb-1">
                    GSTIN Number (15-Digit)
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData?.businessDetails?.gstin || ''}
                      onChange={(e) => setFormData({
                        ...formData,
                        businessDetails: { ...(formData?.businessDetails || {}), gstin: e.target.value }
                      })}
                      className="w-full py-2.5 px-3.5 text-xs font-medium rounded-xl bg-white border border-[#EAE3DC] text-[#FA661C] input-interactive uppercase"
                    />
                  ) : (
                    <div className="py-2 px-3 text-xs font-bold text-[#FA661C] bg-[#FFFFFF] rounded-xl border border-[#EAE3DC] uppercase font-mono">
                      {formData?.businessDetails?.gstin || "Not configured"}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#6B6058] mb-1">
                    Business PAN (Optional)
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData?.businessDetails?.pan || ''}
                      onChange={(e) => setFormData({
                        ...formData,
                        businessDetails: { ...(formData?.businessDetails || {}), pan: e.target.value }
                      })}
                      className="w-full py-2.5 px-3.5 text-xs font-medium rounded-xl bg-white border border-[#EAE3DC] text-[#FA661C] input-interactive uppercase"
                    />
                  ) : (
                    <div className="py-2 px-3 text-xs font-bold text-[#FA661C] bg-[#FFFFFF] rounded-xl border border-[#EAE3DC] uppercase font-mono">
                      {formData?.businessDetails?.pan || "Not configured"}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

      </form>
    </div>
  );
}
