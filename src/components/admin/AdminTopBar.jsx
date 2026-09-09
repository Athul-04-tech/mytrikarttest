import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Menu, 
  Bell, 
  Search, 
  ShieldCheck, 
  ExternalLink, 
  Sparkles, 
  UserCheck, 
  CheckCircle2, 
  RotateCcw,
  ShoppingBag,
  Store,
  ChevronDown,
  LogOut
} from 'lucide-react';
import { useToast } from '../../context/ToastContext';

export default function AdminTopBar({ 
  onToggleSidebar, 
  activeSectionLabel = 'Dashboard',
  onBackToMarketplace 
}) {
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const toast = useToast();
  const navigate = useNavigate();

  const handleSimulateQuickAction = (msg) => {
    toast.success("Admin Action Executed", msg);
  };

  const handleAdminSignOut = () => {
    navigate('/');
    toast.info("Admin Sign Out", "You have securely signed out of Admin Operations Console.");
  };

  return (
    <header className="bg-white border-b border-[#EAE3DC] sticky top-0 z-30 shadow-xs px-4 sm:px-8 py-3">
      <div className="flex items-center justify-between gap-4">
        
        {/* Left: Mobile Sidebar Trigger + Breadcrumb */}
        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={onToggleSidebar}
            className="lg:hidden p-2 rounded-xl text-[#FA661C] bg-[#FFFFFF] hover:bg-[#FFF3EC] border border-[#EAE3DC] icon-interactive cursor-pointer"
            aria-label="Toggle admin sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[11px] text-[#6B6058] font-bold uppercase tracking-wider hidden sm:inline">
                Admin Console
              </span>
              <span className="text-[#EAE3DC] hidden sm:inline">/</span>
              <h1 className="font-['Outfit'] text-base sm:text-lg font-extrabold text-[#FA661C] leading-tight">
                {activeSectionLabel}
              </h1>
            </div>
          </div>
        </div>

        {/* Right: Environment Tag, Notifications, Admin Avatar & Sign Out */}
        <div className="flex items-center space-x-2.5 sm:space-x-3.5">
          
          {/* Environment Status Tag */}
          <div className="hidden md:flex items-center space-x-1.5 bg-[#FFF3EC] text-[#FA661C] border border-[#FA661C]/20 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider">
            <span className="w-2 h-2 rounded-full bg-[#E0530B] animate-pulse" />
            <span>Production Ops (v2.4)</span>
          </div>

          {/* Notification Bell with Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsNotifOpen(!isNotifOpen)}
              className="p-2 rounded-xl text-[#6B6058] hover:text-[#FA661C] bg-[#FFFFFF] hover:bg-[#FFF3EC] border border-[#EAE3DC] btn-interactive relative cursor-pointer"
              aria-label="Open ops notifications"
            >
              <Bell className="w-4 h-4 icon-interactive" />
              <span className="absolute -top-1 -right-1 bg-[#D7263D] text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center border-2 border-white animate-badge-pop">
                3
              </span>
            </button>

            {/* Notification Popover Dropdown */}
            {isNotifOpen && (
              <div className="absolute right-0 mt-2 w-80 bg-white border border-[#FF811A]/50 rounded-2xl shadow-xl z-50 p-4 animate-dropdown text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-[#EAE3DC]">
                  <span className="font-bold text-[#FA661C] uppercase tracking-wider text-[10px]">
                    Ops Action Stream (3 Urgent)
                  </span>
                  <button
                    type="button"
                    onClick={() => handleSimulateQuickAction("All notifications marked as reviewed.")}
                    className="text-[10px] text-[#FF811A] hover:underline font-bold"
                  >
                    Clear All
                  </button>
                </div>

                <div className="py-2 space-y-2 divide-y divide-[#EAE3DC]/40">
                  <div className="pt-2 flex items-start space-x-2.5">
                    <span className="p-1 rounded-lg bg-[#FDE8EA] text-[#D7263D] shrink-0 mt-0.5">
                      <Store className="w-3.5 h-3.5" />
                    </span>
                    <div>
                      <h5 className="font-bold text-[#FA661C]">Vendor KYC: Silk Haven</h5>
                      <p className="text-[10px] text-[#6B6058]">GST & Bank Certificate awaiting approval</p>
                    </div>
                  </div>

                  <div className="pt-2 flex items-start space-x-2.5">
                    <span className="p-1 rounded-lg bg-[#FDE8EA] text-[#D7263D] shrink-0 mt-0.5">
                      <RotateCcw className="w-3.5 h-3.5" />
                    </span>
                    <div>
                      <h5 className="font-bold text-[#FA661C]">Refund Dispute #RFD-201</h5>
                      <p className="text-[10px] text-[#6B6058]">Inspection cleared • ₹8,499 pending release</p>
                    </div>
                  </div>

                  <div className="pt-2 flex items-start space-x-2.5">
                    <span className="p-1 rounded-lg bg-[#FFF8F2] text-[#FF811A] shrink-0 mt-0.5">
                      <ShoppingBag className="w-3.5 h-3.5" />
                    </span>
                    <div>
                      <h5 className="font-bold text-[#FA661C]">Bulk Payout Cycle Scheduled</h5>
                      <p className="text-[10px] text-[#6B6058]">42 vendor settlements queuing for Friday</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Super Admin User Profile Chip */}
          <div className="flex items-center space-x-2.5 pl-2 border-l border-[#EAE3DC]">
            <div className="w-8 h-8 rounded-full bg-[#1A1A1A] text-[#FF811A] font-black text-xs flex items-center justify-center shadow-xs border border-[#FF811A] avatar-interactive">
              PS
            </div>
            <div className="hidden sm:block text-left">
              <h4 className="font-extrabold text-xs text-[#FA661C] leading-tight">
                Priya Sen
              </h4>
              <span className="text-[10px] text-[#FF811A] font-bold block leading-none">
                Super Admin
              </span>
            </div>
          </div>

          {/* Dedicated Admin Sign Out Button */}
          <button
            type="button"
            onClick={handleAdminSignOut}
            className="px-3 py-1.5 rounded-xl border border-[#EAE3DC] bg-[#FFFFFF] hover:bg-[#FDE8EA] text-xs font-bold text-[#D7263D] hover:border-[#D7263D]/50 transition-all flex items-center space-x-1.5 btn-interactive shadow-2xs cursor-pointer"
            aria-label="Sign Out of Admin Console"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Sign Out</span>
          </button>

        </div>

      </div>
    </header>
  );
}
