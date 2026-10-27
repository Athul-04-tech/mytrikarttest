import React, { useState, useEffect } from 'react';
import { Settings, Store, Bell, ShieldCheck, Save, Info, Sparkles, AlertCircle, Loader2 } from 'lucide-react';
import { useToast } from '../../../context/ToastContext';
import { useVendorProfile } from '../../../context/VendorProfileContext';

export default function SellerSettingsView() {
  const { vendorProfile, isLoading, error, updateProfile } = useVendorProfile();
  const [storeName, setStoreName] = useState('');
  const [storeDescription, setStoreDescription] = useState('');
  const [isWomenOwned, setIsWomenOwned] = useState(false);
  const [dispatchTime, setDispatchTime] = useState('24');
  const [autoAcceptOrders, setAutoAcceptOrders] = useState(true);
  const [holidayMode, setHolidayMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const toast = useToast();

  useEffect(() => {
    if (vendorProfile) {
      setStoreName(vendorProfile.store_name || '');
      setStoreDescription(vendorProfile.store_description || vendorProfile.bio || '');
      setIsWomenOwned(Boolean(vendorProfile.is_women_owned));
      setFieldErrors({});
    }
  }, [vendorProfile]);

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setFieldErrors({});

    const res = await updateProfile({
      store_name: storeName.trim(),
      store_description: storeDescription.trim(),
      is_women_owned: isWomenOwned
    });

    if (res.success) {
      toast.success("Settings Saved", "Store preferences saved successfully.");
      setFieldErrors({});
    } else {
      if (res.fieldErrors && Object.keys(res.fieldErrors).length > 0) {
        const normalized = {};
        Object.entries(res.fieldErrors).forEach(([k, v]) => {
          normalized[k] = Array.isArray(v) ? v.join(' ') : String(v);
        });
        setFieldErrors(normalized);
      }
      toast.error("Save Failed", res.error || "Failed to update store settings.");
    }
    setIsSaving(false);
  };

  if (isLoading) {
    return (
      <div className="space-y-6 text-xs animate-pulse">
        <div className="h-6 w-48 bg-gray-200 rounded" />
        <div className="h-80 bg-gray-100 rounded-3xl" />
      </div>
    );
  }

  if (error && !vendorProfile) {
    return (
      <div className="p-6 bg-[#FDE8EA] border border-[#D7263D]/40 rounded-3xl space-y-2 text-xs text-[#D7263D]">
        <div className="flex items-center space-x-2 font-bold text-sm">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>Settings Unavailable</span>
        </div>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-xs animate-reveal">
      <div className="pb-3 border-b border-[#EAE3DC]">
        <h2 className="font-['Outfit'] text-xl sm:text-2xl font-extrabold text-[#FA661C]">
          Store Settings & Fulfillment Preferences
        </h2>
        <p className="text-xs text-[#6B6058] mt-0.5">
          Configure public store name, store description, and operational preferences.
        </p>
      </div>

      <form onSubmit={handleSave} className="bg-white rounded-3xl border border-[#EAE3DC] p-6 sm:p-8 shadow-xs space-y-5">
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="font-bold text-[#FA661C] block mb-1">Public Display Store Name *</label>
            <input
              type="text"
              required
              value={storeName}
              onChange={(e) => {
                setStoreName(e.target.value);
                if (fieldErrors.store_name) setFieldErrors(prev => ({ ...prev, store_name: undefined }));
              }}
              className={`w-full p-2.5 bg-[#FFFFFF] rounded-xl border text-xs font-bold ${
                fieldErrors.store_name ? 'border-[#D7263D] text-[#D7263D]' : 'border-[#EAE3DC] text-[#FA661C]'
              }`}
            />
            {fieldErrors.store_name && (
              <p className="text-[11px] text-[#D7263D] font-bold mt-1">{fieldErrors.store_name}</p>
            )}
          </div>

          <div>
            <label className="font-bold text-[#FA661C] block mb-1">Store Description (min 10 characters)</label>
            <input
              type="text"
              value={storeDescription}
              onChange={(e) => {
                setStoreDescription(e.target.value);
                if (fieldErrors.store_description) setFieldErrors(prev => ({ ...prev, store_description: undefined }));
              }}
              placeholder="Short bio or tagline for buyer storefront"
              className={`w-full p-2.5 bg-[#FFFFFF] rounded-xl border text-xs font-medium ${
                fieldErrors.store_description ? 'border-[#D7263D] text-[#D7263D]' : 'border-[#EAE3DC] text-[#1A2420]'
              }`}
            />
            {fieldErrors.store_description && (
              <p className="text-[11px] text-[#D7263D] font-bold mt-1">{fieldErrors.store_description}</p>
            )}
          </div>
        </div>

        {/* Women-Owned / Women-Led Business Preference Toggle */}
        <label className="flex items-center justify-between p-4 bg-[#FFF8F2] border border-[#FF811A]/40 rounded-2xl cursor-pointer hover:border-[#FA661C] transition-colors shadow-2xs">
          <div className="flex items-center space-x-3 pr-2">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
              isWomenOwned ? 'bg-[#FA661C] text-[#FF811A]' : 'bg-[#FFFFFF] text-[#FA661C] border border-[#EAE3DC]'
            }`}>
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-[#FA661C] block text-xs">This business is women-owned / women-led</span>
              <span className="text-[10px] text-[#6B6058]">Help us recognize and support women entrepreneurs on MytriKart</span>
            </div>
          </div>
          <input
            type="checkbox"
            checked={isWomenOwned}
            onChange={(e) => setIsWomenOwned(e.target.checked)}
            className="w-4.5 h-4.5 text-[#FA661C] rounded border-[#EAE3DC] focus:ring-[#FA661C] cursor-pointer shrink-0"
          />
        </label>

        {/* Feature Notice */}
        <div className="p-3 bg-[#FFF8F2] border border-[#FF811A]/40 rounded-2xl flex items-center space-x-2 text-xs text-[#FA661C]">
          <Info className="w-4 h-4 text-[#FF811A] shrink-0" />
          <span>Operational SLA, Auto-Accept, and Holiday Mode options are currently coming soon.</span>
        </div>

        <div className="space-y-3 pt-3 border-t border-[#EAE3DC]/60 opacity-60">
          <div>
            <label className="font-bold text-[#6B6058] block mb-1">Standard Dispatch SLA Window (Feature Unavailable)</label>
            <select
              disabled
              value={dispatchTime}
              onChange={(e) => setDispatchTime(e.target.value)}
              className="w-full p-2.5 bg-[#F9F7F5] rounded-xl border border-[#EAE3DC] text-xs font-bold cursor-not-allowed"
            >
              <option value="24">24 Hours (Default SLA)</option>
            </select>
          </div>

          <label className="flex items-center justify-between p-3 bg-[#F9F7F5] rounded-xl border border-[#EAE3DC] cursor-not-allowed">
            <div>
              <span className="font-bold text-[#6B6058] block">Auto-Accept Incoming Orders (Feature Unavailable)</span>
              <span className="text-[10px] text-[#6B6058]">Instantly move new buyer purchases to fulfillment queue</span>
            </div>
            <input
              disabled
              type="checkbox"
              checked={autoAcceptOrders}
              onChange={(e) => setAutoAcceptOrders(e.target.checked)}
              className="w-4 h-4 text-[#FA661C] rounded border-[#EAE3DC] cursor-not-allowed"
            />
          </label>

          <label className="flex items-center justify-between p-3 bg-[#F9F7F5] rounded-xl border border-[#EAE3DC] cursor-not-allowed">
            <div>
              <span className="font-bold text-[#6B6058] block">Store Holiday / Maintenance Mode (Feature Unavailable)</span>
              <span className="text-[10px] text-[#6B6058]">Temporarily pause storefront visibility for catalog products</span>
            </div>
            <input
              disabled
              type="checkbox"
              checked={holidayMode}
              onChange={(e) => setHolidayMode(e.target.checked)}
              className="w-4 h-4 text-[#FA661C] rounded border-[#EAE3DC] cursor-not-allowed"
            />
          </label>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="px-6 py-2.5 bg-[#FA661C] hover:bg-[#E0530B] active:bg-[#0A2A1F] text-white rounded-xl font-bold flex items-center space-x-2 shadow-xs cursor-pointer disabled:opacity-50"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>{isSaving ? "Saving..." : "Save Store Preferences"}</span>
          </button>
        </div>

      </form>
    </div>
  );
}
