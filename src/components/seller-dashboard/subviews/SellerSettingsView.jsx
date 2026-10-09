import React, { useState, useEffect } from 'react';
import { Settings, Store, Bell, ShieldCheck, Save, Info, Sparkles } from 'lucide-react';
import { useToast } from '../../../context/ToastContext';
import { apiRequest } from '../../../utils/api';

export default function SellerSettingsView() {
  const [storeName, setStoreName] = useState('');
  const [storeDescription, setStoreDescription] = useState('');
  const [isWomenOwned, setIsWomenOwned] = useState(false);
  const [dispatchTime, setDispatchTime] = useState('24');
  const [autoAcceptOrders, setAutoAcceptOrders] = useState(true);
  const [holidayMode, setHolidayMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const toast = useToast();

  useEffect(() => {
    let isMounted = true;
    async function loadSettings() {
      try {
        const profile = await apiRequest('/api/vendors/me/');
        if (isMounted) {
          setStoreName(profile.store_name || '');
          setStoreDescription(profile.store_description || '');
          setIsWomenOwned(Boolean(profile.is_women_owned));
        }
      } catch (err) {
        console.warn("Failed to load vendor settings:", err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    loadSettings();
    return () => { isMounted = false; };
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await apiRequest('/api/vendors/me/', {
        method: 'PATCH',
        body: JSON.stringify({
          store_name: storeName,
          store_description: storeDescription,
          is_women_owned: isWomenOwned
        })
      });
      toast.success("Settings Saved", "Store preferences saved successfully.");
    } catch (err) {
      toast.error("Save Failed", err.message || "Failed to update store settings.");
    } finally {
      setIsSaving(false);
    }
  };

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
              onChange={(e) => setStoreName(e.target.value)}
              className="w-full p-2.5 bg-[#FFFFFF] rounded-xl border border-[#EAE3DC] text-xs font-bold text-[#FA661C]"
            />
          </div>

          <div>
            <label className="font-bold text-[#FA661C] block mb-1">Store Description</label>
            <input
              type="text"
              value={storeDescription}
              onChange={(e) => setStoreDescription(e.target.value)}
              placeholder="Short bio or tagline for buyer storefront"
              className="w-full p-2.5 bg-[#FFFFFF] rounded-xl border border-[#EAE3DC] text-xs font-medium text-[#1A2420]"
            />
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
              <span className="text-[10px] text-[#6B6058]">Pause listings temporarily without losing search ranking</span>
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

        <div className="pt-2">
          <button
            type="submit"
            disabled={isSaving}
            className="px-5 py-2.5 bg-[#FA661C] hover:bg-[#E0530B] text-[#FFFFFF] font-bold text-xs rounded-xl btn-interactive shadow-xs cursor-pointer flex items-center space-x-1.5 disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5 text-[#FF811A]" />
            <span>{isSaving ? 'Saving Changes...' : 'Save Store Preferences'}</span>
          </button>
        </div>

      </form>
    </div>
  );
}
