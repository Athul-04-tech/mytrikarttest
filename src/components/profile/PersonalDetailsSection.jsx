import React, { useState } from 'react';
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
  ShieldCheck 
} from 'lucide-react';

export default function PersonalDetailsSection({ profileData, onUpdateProfile }) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState(profileData);
  const [isBusinessOpen, setIsBusinessOpen] = useState(true);
  const [saveToast, setSaveToast] = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    setIsEditing(false);
    if (onUpdateProfile) onUpdateProfile(formData);
    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 3000);
  };

  const handleCancel = () => {
    setFormData(profileData);
    setIsEditing(false);
  };

  return (
    <div className="bg-white rounded-3xl border border-[#D8E0DC] p-6 sm:p-8 lg:p-10 shadow-xs animate-reveal">
      
      {/* Header with Edit Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#D8E0DC]">
        <div>
          <h2 className="font-['Outfit'] text-2xl sm:text-3xl font-extrabold text-[#0F3D2E] tracking-tight">
            Personal Details
          </h2>
          <p className="text-xs sm:text-sm text-[#5C6B63] mt-1">
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
                className="px-3.5 py-2 rounded-xl text-xs font-bold text-[#5C6B63] bg-[#FBF8F1] hover:bg-[#E8F2EE] border border-[#D8E0DC] btn-interactive flex items-center space-x-1.5 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
                <span>Cancel</span>
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="px-4 py-2 rounded-xl text-xs font-bold text-[#FBF8F1] bg-[#0F3D2E] hover:bg-[#155440] btn-interactive flex items-center space-x-1.5 shadow-xs cursor-pointer"
              >
                <Save className="w-3.5 h-3.5 text-[#D4AF37]" />
                <span>Save Changes</span>
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="px-4 py-2 rounded-xl text-xs font-bold text-[#0F3D2E] bg-[#FCF7E8] hover:bg-[#D4AF37]/25 border border-[#D4AF37] btn-interactive flex items-center space-x-1.5 shadow-2xs cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5 text-[#0F3D2E]" />
              <span>Edit Details</span>
            </button>
          )}
        </div>
      </div>

      {/* Save Toast */}
      {saveToast && (
        <div className="mt-4 p-3 bg-[#E8F2EE] text-[#0F3D2E] text-xs font-bold rounded-xl border border-[#0F3D2E]/20 flex items-center space-x-2 animate-dropdown">
          <CheckCircle2 className="w-4 h-4 text-[#D4AF37]" />
          <span>Profile changes saved successfully!</span>
        </div>
      )}

      {/* Form / Read View */}
      <form onSubmit={handleSave} className="mt-8 space-y-8">
        
        {/* Photo Upload Row */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-6 p-4 rounded-2xl bg-[#FBF8F1] border border-[#D8E0DC]/80">
          <div className="relative group">
            <img
              src={formData.avatar}
              alt={formData.fullName}
              className="w-20 h-20 rounded-full object-cover border-2 border-[#D4AF37] shadow-sm avatar-interactive cursor-pointer"
            />
            {isEditing && (
              <button
                type="button"
                onClick={() => alert("Upload photo file picker placeholder")}
                className="absolute inset-0 bg-[#0F3D2E]/60 rounded-full flex flex-col items-center justify-center text-white text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-opacity btn-interactive cursor-pointer"
              >
                <Camera className="w-5 h-5 mb-0.5 text-[#D4AF37]" />
                <span>Change</span>
              </button>
            )}
          </div>

          <div className="text-center sm:text-left">
            <h3 className="font-['Outfit'] font-bold text-base text-[#0F3D2E]">
              Profile Photo
            </h3>
            <p className="text-xs text-[#5C6B63] max-w-sm mt-0.5">
              JPG, PNG or WebP under 5MB. Visible on verified customer reviews and community questions.
            </p>
            {isEditing && (
              <button
                type="button"
                onClick={() => alert("Upload photo placeholder")}
                className="mt-2.5 px-3 py-1 bg-white border border-[#D8E0DC] hover:border-[#0F3D2E] text-[#0F3D2E] rounded-lg text-xs font-bold btn-interactive cursor-pointer"
              >
                Upload New Image
              </button>
            )}
          </div>
        </div>

        {/* Personal Details Grid */}
        <div>
          <h3 className="text-xs font-extrabold uppercase tracking-widest text-[#0F3D2E] mb-4 flex items-center space-x-1.5">
            <User className="w-4 h-4 text-[#D4AF37]" />
            <span>Basic Identity</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Full Name */}
            <div>
              <label className="block text-xs font-bold text-[#5C6B63] mb-1.5">
                Full Name
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="w-full py-2.5 px-3.5 text-xs sm:text-sm font-medium rounded-xl bg-white border border-[#D8E0DC] text-[#0F3D2E] input-interactive"
                />
              ) : (
                <div className="py-2.5 px-3.5 text-xs sm:text-sm font-bold text-[#0F3D2E] bg-[#FBF8F1] rounded-xl border border-[#D8E0DC]/60">
                  {formData.fullName}
                </div>
              )}
            </div>

            {/* Email Address */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-[#5C6B63]">
                  Email Address
                </label>
                {formData.isEmailVerified && (
                  <span className="text-[10px] font-bold text-[#0F3D2E] bg-[#E8F2EE] px-1.5 py-0.2 rounded flex items-center space-x-1">
                    <CheckCircle2 className="w-3 h-3 text-[#D4AF37]" />
                    <span>Verified</span>
                  </span>
                )}
              </div>
              {isEditing ? (
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full py-2.5 px-3.5 text-xs sm:text-sm font-medium rounded-xl bg-white border border-[#D8E0DC] text-[#0F3D2E] input-interactive"
                />
              ) : (
                <div className="py-2.5 px-3.5 text-xs sm:text-sm font-bold text-[#0F3D2E] bg-[#FBF8F1] rounded-xl border border-[#D8E0DC]/60">
                  {formData.email}
                </div>
              )}
            </div>

            {/* Mobile Number */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-[#5C6B63]">
                  Mobile Number
                </label>
                {formData.isMobileVerified && (
                  <span className="text-[10px] font-bold text-[#0F3D2E] bg-[#E8F2EE] px-1.5 py-0.2 rounded flex items-center space-x-1">
                    <CheckCircle2 className="w-3 h-3 text-[#D4AF37]" />
                    <span>Verified</span>
                  </span>
                )}
              </div>
              {isEditing ? (
                <input
                  type="tel"
                  value={formData.mobile}
                  onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                  className="w-full py-2.5 px-3.5 text-xs sm:text-sm font-medium rounded-xl bg-white border border-[#D8E0DC] text-[#0F3D2E] input-interactive"
                />
              ) : (
                <div className="py-2.5 px-3.5 text-xs sm:text-sm font-bold text-[#0F3D2E] bg-[#FBF8F1] rounded-xl border border-[#D8E0DC]/60">
                  {formData.mobile}
                </div>
              )}
            </div>

            {/* Date of Birth */}
            <div>
              <label className="block text-xs font-bold text-[#5C6B63] mb-1.5">
                Date of Birth
              </label>
              {isEditing ? (
                <input
                  type="date"
                  value={formData.dob}
                  onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                  className="w-full py-2.5 px-3.5 text-xs sm:text-sm font-medium rounded-xl bg-white border border-[#D8E0DC] text-[#0F3D2E] input-interactive"
                />
              ) : (
                <div className="py-2.5 px-3.5 text-xs sm:text-sm font-bold text-[#0F3D2E] bg-[#FBF8F1] rounded-xl border border-[#D8E0DC]/60">
                  {formData.dob}
                </div>
              )}
            </div>

            {/* Gender */}
            <div>
              <label className="block text-xs font-bold text-[#5C6B63] mb-1.5">
                Gender
              </label>
              {isEditing ? (
                <select
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                  className="w-full py-2.5 px-3.5 text-xs sm:text-sm font-medium rounded-xl bg-white border border-[#D8E0DC] text-[#0F3D2E] input-interactive"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Non-binary">Non-binary</option>
                  <option value="Prefer not to say">Prefer not to say</option>
                </select>
              ) : (
                <div className="py-2.5 px-3.5 text-xs sm:text-sm font-bold text-[#0F3D2E] bg-[#FBF8F1] rounded-xl border border-[#D8E0DC]/60">
                  {formData.gender}
                </div>
              )}
            </div>

            {/* Preferred Language */}
            <div>
              <label className="block text-xs font-bold text-[#5C6B63] mb-1.5">
                Preferred Language
              </label>
              {isEditing ? (
                <select
                  value={formData.preferredLanguage}
                  onChange={(e) => setFormData({ ...formData, preferredLanguage: e.target.value })}
                  className="w-full py-2.5 px-3.5 text-xs sm:text-sm font-medium rounded-xl bg-white border border-[#D8E0DC] text-[#0F3D2E] input-interactive"
                >
                  <option value="English (UK)">English (UK)</option>
                  <option value="Hindi (हिन्दी)">Hindi (हिन्दी)</option>
                  <option value="Arabic (العربية)">Arabic (العربية)</option>
                  <option value="Irish (Gaeilge)">Irish (Gaeilge)</option>
                </select>
              ) : (
                <div className="py-2.5 px-3.5 text-xs sm:text-sm font-bold text-[#0F3D2E] bg-[#FBF8F1] rounded-xl border border-[#D8E0DC]/60">
                  {formData.preferredLanguage}
                </div>
              )}
            </div>

            {/* Preferred Currency */}
            <div>
              <label className="block text-xs font-bold text-[#5C6B63] mb-1.5">
                Preferred Currency (India / UAE / Ireland)
              </label>
              {isEditing ? (
                <select
                  value={formData.preferredCurrency}
                  onChange={(e) => setFormData({ ...formData, preferredCurrency: e.target.value })}
                  className="w-full py-2.5 px-3.5 text-xs sm:text-sm font-medium rounded-xl bg-white border border-[#D8E0DC] text-[#0F3D2E] input-interactive"
                >
                  <option value="INR (₹) - Indian Rupee">INR (₹) - Indian Rupee</option>
                  <option value="AED (د.إ) - UAE Dirham">AED (د.إ) - UAE Dirham</option>
                  <option value="EUR (€) - Euro (Ireland)">EUR (€) - Euro (Ireland)</option>
                  <option value="USD ($) - US Dollar">USD ($) - US Dollar</option>
                </select>
              ) : (
                <div className="py-2.5 px-3.5 text-xs sm:text-sm font-bold text-[#0F3D2E] bg-[#FBF8F1] rounded-xl border border-[#D8E0DC]/60">
                  {formData.preferredCurrency}
                </div>
              )}
            </div>

            {/* Newsletter Subscription Toggle */}
            <div className="flex items-center justify-between p-3 bg-[#FBF8F1] rounded-xl border border-[#D8E0DC]/80 sm:col-span-2">
              <div>
                <h4 className="text-xs font-bold text-[#0F3D2E]">Weekly Trend Newsletter</h4>
                <p className="text-[11px] text-[#5C6B63]">Receive member discounts and flash sale alerts</p>
              </div>
              <button
                type="button"
                onClick={() => isEditing && setFormData({ ...formData, newsletterSubscribed: !formData.newsletterSubscribed })}
                disabled={!isEditing}
                className={`w-11 h-6 rounded-full transition-colors relative focus:outline-none ${
                  formData.newsletterSubscribed ? 'bg-[#0F3D2E]' : 'bg-[#D8E0DC]'
                } ${!isEditing ? 'opacity-80 cursor-default' : 'cursor-pointer'}`}
              >
                <div className={`w-4 h-4 rounded-full bg-[#FBF8F1] absolute top-1 toggle-thumb-spring ${
                  formData.newsletterSubscribed ? 'right-1' : 'left-1'
                }`} />
              </button>
            </div>
          </div>
        </div>

        {/* Collapsible Business Details Section */}
        <div className="border border-[#D8E0DC] rounded-2xl overflow-hidden bg-[#FBF8F1]/40">
          <button
            type="button"
            onClick={() => setIsBusinessOpen(!isBusinessOpen)}
            className="w-full p-4 bg-[#E8F2EE]/60 hover:bg-[#E8F2EE] transition-colors flex items-center justify-between text-left cursor-pointer"
          >
            <div className="flex items-center space-x-2">
              <Building2 className="w-4 h-4 text-[#D4AF37]" />
              <div>
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#0F3D2E]">
                  Business & GSTIN Credentials (Optional)
                </h4>
                <p className="text-[11px] text-[#5C6B63]">Claim input tax credits on business invoices</p>
              </div>
            </div>
            <ChevronDown className={`w-4 h-4 text-[#5C6B63] transition-transform ${
              isBusinessOpen ? 'rotate-180 text-[#0F3D2E]' : ''
            }`} />
          </button>

          {isBusinessOpen && (
            <div className="p-5 space-y-4 bg-white border-t border-[#D8E0DC] animate-dropdown">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#5C6B63] mb-1">
                    Company Registered Name
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.businessDetails.companyName}
                      onChange={(e) => setFormData({
                        ...formData,
                        businessDetails: { ...formData.businessDetails, companyName: e.target.value }
                      })}
                      className="w-full py-2.5 px-3.5 text-xs font-medium rounded-xl bg-white border border-[#D8E0DC] text-[#0F3D2E] input-interactive"
                    />
                  ) : (
                    <div className="py-2 px-3 text-xs font-bold text-[#0F3D2E] bg-[#FBF8F1] rounded-xl border border-[#D8E0DC]">
                      {formData.businessDetails.companyName || "Not configured"}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#5C6B63] mb-1">
                    GSTIN Number (15-Digit)
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.businessDetails.gstin}
                      onChange={(e) => setFormData({
                        ...formData,
                        businessDetails: { ...formData.businessDetails, gstin: e.target.value }
                      })}
                      className="w-full py-2.5 px-3.5 text-xs font-medium rounded-xl bg-white border border-[#D8E0DC] text-[#0F3D2E] input-interactive uppercase"
                    />
                  ) : (
                    <div className="py-2 px-3 text-xs font-bold text-[#0F3D2E] bg-[#FBF8F1] rounded-xl border border-[#D8E0DC] uppercase font-mono">
                      {formData.businessDetails.gstin || "Not configured"}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#5C6B63] mb-1">
                    Business PAN (Optional)
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.businessDetails.pan}
                      onChange={(e) => setFormData({
                        ...formData,
                        businessDetails: { ...formData.businessDetails, pan: e.target.value }
                      })}
                      className="w-full py-2.5 px-3.5 text-xs font-medium rounded-xl bg-white border border-[#D8E0DC] text-[#0F3D2E] input-interactive uppercase"
                    />
                  ) : (
                    <div className="py-2 px-3 text-xs font-bold text-[#0F3D2E] bg-[#FBF8F1] rounded-xl border border-[#D8E0DC] uppercase font-mono">
                      {formData.businessDetails.pan || "Not configured"}
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
