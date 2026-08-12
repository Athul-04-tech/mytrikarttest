import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Menu, 
  Bell, 
  Plus, 
  Store, 
  ExternalLink, 
  Sparkles, 
  ShieldCheck, 
  ChevronDown, 
  Package 
} from 'lucide-react';
import { SELLER_PROFILE } from '../../data/sellerDashboardData';
import { useToast } from '../../context/ToastContext';

export default function SellerDashboardTopBar({
  onToggleSidebar
}) {
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const toast = useToast();
  const navigate = useNavigate();

  return (
    <header className="bg-white border-b border-[#D8E0DC] sticky top-0 z-30 shadow-xs px-4 sm:px-8 py-3">
      <div className="flex items-center justify-between gap-4">
        
        {/* Left: Hamburger + Store Details */}
        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={onToggleSidebar}
            className="lg:hidden p-2 rounded-xl text-[#0F3D2E] bg-[#FBF8F1] hover:bg-[#E8F2EE] border border-[#D8E0DC] icon-interactive cursor-pointer"
            aria-label="Toggle navigation"
          >
            <Menu className="w-5 h-5" />
          </button>

          <Link to="/seller/dashboard" className="flex items-center space-x-2.5">
            <img
              src={SELLER_PROFILE.logo}
              alt="Store Logo"
              className="w-8 h-8 rounded-xl object-cover border border-[#D8E0DC] shrink-0"
            />
            <div>
              <div className="flex items-center space-x-1.5">
                <h1 className="font-['Outfit'] font-extrabold text-sm sm:text-base text-[#0F3D2E] leading-tight truncate max-w-[160px] sm:max-w-none">
                  {SELLER_PROFILE.storeName}
                </h1>
                <span className="text-[9px] font-black uppercase bg-[#FCF7E8] text-[#0F3D2E] border border-[#D4AF37]/50 px-1.5 py-0.2 rounded-full hidden sm:inline-block">
                  {SELLER_PROFILE.tier}
                </span>
              </div>
              <span className="text-[10px] text-[#5C6B63]">
                GSTIN: 27AAAAA0000A1Z5 • SLA Compliance: <strong className="text-[#0F3D2E]">{SELLER_PROFILE.slaScore}%</strong>
              </span>
            </div>
          </Link>
        </div>

        {/* Right: Quick Add Product CTA + Notifications + Merchant Avatar */}
        <div className="flex items-center space-x-2.5 sm:space-x-3.5">
          
          {/* Prominent Quick "Add Product" CTA */}
          <Link
            to="/seller/products/new"
            className="px-3.5 py-2 bg-[#0F3D2E] hover:bg-[#155440] text-[#FBF8F1] rounded-xl text-xs font-bold btn-interactive flex items-center space-x-1.5 shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4 text-[#D4AF37] icon-interactive" />
            <span className="hidden sm:inline">Add Product</span>
            <span className="sm:hidden">Add</span>
          </Link>

          {/* Notifications Bell */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsNotifOpen(!isNotifOpen)}
              className="p-2 rounded-xl text-[#5C6B63] hover:text-[#0F3D2E] bg-[#FBF8F1] hover:bg-[#E8F2EE] border border-[#D8E0DC] btn-interactive relative cursor-pointer"
              aria-label="Open notifications"
            >
              <Bell className="w-4 h-4 icon-interactive" />
              <span className="absolute -top-1 -right-1 bg-[#C0392B] text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center border-2 border-white animate-badge-pop">
                3
              </span>
            </button>

            {/* Notification Dropdown */}
            {isNotifOpen && (
              <div className="absolute right-0 mt-2 w-80 bg-white border border-[#D4AF37]/50 rounded-2xl shadow-xl z-50 p-4 animate-dropdown text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-[#D8E0DC]">
                  <span className="font-bold text-[#0F3D2E] uppercase tracking-wider text-[10px]">
                    Store Alerts (3 Urgent)
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      toast.info("Notifications Read", "All store notifications cleared.");
                      setIsNotifOpen(false);
                    }}
                    className="text-[10px] text-[#D4AF37] hover:underline font-bold"
                  >
                    Clear All
                  </button>
                </div>

                <div className="py-2 space-y-2 divide-y divide-[#D8E0DC]/40">
                  <div className="pt-2">
                    <h5 className="font-bold text-[#0F3D2E]">Low Stock Warning</h5>
                    <p className="text-[10px] text-[#5C6B63]">Mytri Elite Spatial ANC Headphones has 3 units remaining.</p>
                  </div>
                  <div className="pt-2">
                    <h5 className="font-bold text-[#0F3D2E]">6 New Customer Orders</h5>
                    <p className="text-[10px] text-[#5C6B63]">Orders waiting in fulfillment dispatch queue.</p>
                  </div>
                  <div className="pt-2">
                    <h5 className="font-bold text-[#0F3D2E]">Weekly Payout Ready</h5>
                    <p className="text-[10px] text-[#5C6B63]">₹84,200 pending settlement cycle for Friday.</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Merchant Profile Avatar */}
          <div className="w-8 h-8 rounded-full bg-[#0F3D2E] text-[#D4AF37] font-black text-xs flex items-center justify-center shadow-xs border border-[#D4AF37] avatar-interactive">
            AP
          </div>

        </div>

      </div>
    </header>
  );
}
