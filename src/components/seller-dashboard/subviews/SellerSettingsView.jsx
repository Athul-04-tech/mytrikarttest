import React, { useState } from 'react';
import { Settings, Store, Bell, ShieldCheck, Save } from 'lucide-react';
import { SELLER_PROFILE } from '../../../data/sellerDashboardData';
import { useToast } from '../../../context/ToastContext';

export default function SellerSettingsView() {
  const [storeName, setStoreName] = useState(SELLER_PROFILE.storeName);
  const [dispatchTime, setDispatchTime] = useState('24');
  const [autoAcceptOrders, setAutoAcceptOrders] = useState(true);
  const [holidayMode, setHolidayMode] = useState(false);
  const toast = useToast();

  const handleSave = (e) => {
    e.preventDefault();
    toast.success("Settings Saved", "Store operations preferences updated successfully.");
  };

  return (
    <div className="space-y-6 text-xs animate-reveal">
      <div className="pb-3 border-b border-[#D8E0DC]">
        <h2 className="font-['Outfit'] text-xl sm:text-2xl font-extrabold text-[#0F3D2E]">
          Store Settings & Fulfillment Preferences
        </h2>
        <p className="text-xs text-[#5C6B63] mt-0.5">
          Configure order dispatch SLA, holiday mode pause, and notification webhooks.
        </p>
      </div>

      <form onSubmit={handleSave} className="bg-white rounded-3xl border border-[#D8E0DC] p-6 sm:p-8 shadow-xs space-y-5">
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="font-bold text-[#0F3D2E] block mb-1">Public Display Store Name</label>
            <input
              type="text"
              value={storeName}
              onChange={(e) => setStoreName(e.target.value)}
              className="w-full p-2.5 bg-[#FBF8F1] rounded-xl border border-[#D8E0DC] text-xs font-bold text-[#0F3D2E]"
            />
          </div>

          <div>
            <label className="font-bold text-[#0F3D2E] block mb-1">Standard Dispatch SLA Window</label>
            <select
              value={dispatchTime}
              onChange={(e) => setDispatchTime(e.target.value)}
              className="w-full p-2.5 bg-[#FBF8F1] rounded-xl border border-[#D8E0DC] text-xs font-bold"
            >
              <option value="12">12 Hours (Same-Day Express)</option>
              <option value="24">24 Hours (Next-Day Standard — 96% Compliance)</option>
              <option value="48">48 Hours (Custom Artisan Handcrafted)</option>
            </select>
          </div>
        </div>

        <div className="space-y-3 pt-3 border-t border-[#D8E0DC]/60">
          <label className="flex items-center justify-between p-3 bg-[#FBF8F1] rounded-xl border border-[#D8E0DC] cursor-pointer">
            <div>
              <span className="font-bold text-[#0F3D2E] block">Auto-Accept Incoming Orders</span>
              <span className="text-[10px] text-[#5C6B63]">Instantly move new buyer purchases to fulfillment queue</span>
            </div>
            <input
              type="checkbox"
              checked={autoAcceptOrders}
              onChange={(e) => setAutoAcceptOrders(e.target.checked)}
              className="w-4 h-4 text-[#0F3D2E] rounded border-[#D8E0DC] focus:ring-[#D4AF37] cursor-pointer"
            />
          </label>

          <label className="flex items-center justify-between p-3 bg-[#FBF8F1] rounded-xl border border-[#D8E0DC] cursor-pointer">
            <div>
              <span className="font-bold text-[#0F3D2E] block">Store Holiday / Maintenance Mode</span>
              <span className="text-[10px] text-[#5C6B63]">Pause listings temporarily without losing search ranking</span>
            </div>
            <input
              type="checkbox"
              checked={holidayMode}
              onChange={(e) => setHolidayMode(e.target.checked)}
              className="w-4 h-4 text-[#0F3D2E] rounded border-[#D8E0DC] focus:ring-[#D4AF37] cursor-pointer"
            />
          </label>
        </div>

        <div className="pt-2">
          <button
            type="submit"
            className="px-5 py-2.5 bg-[#0F3D2E] hover:bg-[#155440] text-[#FBF8F1] font-bold text-xs rounded-xl btn-interactive shadow-xs cursor-pointer flex items-center space-x-1.5"
          >
            <Save className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span>Save Store Preferences</span>
          </button>
        </div>

      </form>
    </div>
  );
}
