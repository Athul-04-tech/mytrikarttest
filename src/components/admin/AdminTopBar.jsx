import React, { useState } from 'react';
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
  ChevronDown
} from 'lucide-react';
import { useToast } from '../../context/ToastContext';

export default function AdminTopBar({ 
  onToggleSidebar, 
  activeSectionLabel = 'Dashboard',
  onBackToMarketplace 
}) {
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const toast = useToast();

  const handleSimulateQuickAction = (msg) => {
    toast.success("Admin Action Executed", msg);
  };

  return (
    <header className="bg-white border-b border-[#D8E0DC] sticky top-0 z-30 shadow-xs px-4 sm:px-8 py-3">
      <div className="flex items-center justify-between gap-4">
        
        {/* Left: Mobile Sidebar Trigger + Breadcrumb */}
        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={onToggleSidebar}
            className="lg:hidden p-2 rounded-xl text-[#0F3D2E] bg-[#FBF8F1] hover:bg-[#E8F2EE] border border-[#D8E0DC] icon-interactive cursor-pointer"
            aria-label="Toggle admin sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[11px] text-[#5C6B63] font-bold uppercase tracking-wider hidden sm:inline">
                Admin Console
              </span>
              <span className="text-[#D8E0DC] hidden sm:inline">/</span>
              <h1 className="font-['Outfit'] text-base sm:text-lg font-extrabold text-[#0F3D2E] leading-tight">
                {activeSectionLabel}
              </h1>
            </div>
          </div>
        </div>

        {/* Right: Environment Tag, Search, Notification Bell, Admin Avatar */}
        <div className="flex items-center space-x-2.5 sm:space-x-3.5">
          
          {/* Environment Status Tag */}
          <div className="hidden md:flex items-center space-x-1.5 bg-[#E8F2EE] text-[#0F3D2E] border border-[#0F3D2E]/20 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider">
            <span className="w-2 h-2 rounded-full bg-[#155440] animate-pulse" />
            <span>Production Ops (v2.4)</span>
          </div>

          {/* Notification Bell with Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsNotifOpen(!isNotifOpen)}
              className="p-2 rounded-xl text-[#5C6B63] hover:text-[#0F3D2E] bg-[#FBF8F1] hover:bg-[#E8F2EE] border border-[#D8E0DC] btn-interactive relative cursor-pointer"
              aria-label="Open ops notifications"
            >
              <Bell className="w-4 h-4 icon-interactive" />
              <span className="absolute -top-1 -right-1 bg-[#C0392B] text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center border-2 border-white animate-badge-pop">
                3
              </span>
            </button>

            {/* Notification Popover Dropdown */}
            {isNotifOpen && (
              <div className="absolute right-0 mt-2 w-80 bg-white border border-[#D4AF37]/50 rounded-2xl shadow-xl z-50 p-4 animate-dropdown text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-[#D8E0DC]">
                  <span className="font-bold text-[#0F3D2E] uppercase tracking-wider text-[10px]">
                    Ops Action Stream (3 Urgent)
                  </span>
                  <button
                    type="button"
                    onClick={() => handleSimulateQuickAction("All notifications marked as reviewed.")}
                    className="text-[10px] text-[#D4AF37] hover:underline font-bold"
                  >
                    Clear All
                  </button>
                </div>

                <div className="py-2 space-y-2 divide-y divide-[#D8E0DC]/40">
                  <div className="pt-2 flex items-start space-x-2.5">
                    <span className="p-1 rounded-lg bg-[#FDEDEC] text-[#C0392B] shrink-0 mt-0.5">
                      <Store className="w-3.5 h-3.5" />
                    </span>
                    <div>
                      <h5 className="font-bold text-[#0F3D2E]">Vendor KYC: Silk Haven</h5>
                      <p className="text-[10px] text-[#5C6B63]">GST & Bank Certificate awaiting approval</p>
                    </div>
                  </div>

                  <div className="pt-2 flex items-start space-x-2.5">
                    <span className="p-1 rounded-lg bg-[#FDEDEC] text-[#C0392B] shrink-0 mt-0.5">
                      <RotateCcw className="w-3.5 h-3.5" />
                    </span>
                    <div>
                      <h5 className="font-bold text-[#0F3D2E]">Refund Dispute #RFD-201</h5>
                      <p className="text-[10px] text-[#5C6B63]">Inspection cleared • ₹8,499 pending release</p>
                    </div>
                  </div>

                  <div className="pt-2 flex items-start space-x-2.5">
                    <span className="p-1 rounded-lg bg-[#FCF7E8] text-[#D4AF37] shrink-0 mt-0.5">
                      <ShoppingBag className="w-3.5 h-3.5" />
                    </span>
                    <div>
                      <h5 className="font-bold text-[#0F3D2E]">Bulk Payout Cycle Scheduled</h5>
                      <p className="text-[10px] text-[#5C6B63]">42 vendor settlements queuing for Friday</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Super Admin User Profile Chip */}
          <div className="flex items-center space-x-2.5 pl-2 border-l border-[#D8E0DC]">
            <div className="w-8 h-8 rounded-full bg-[#0F3D2E] text-[#D4AF37] font-black text-xs flex items-center justify-center shadow-xs border border-[#D4AF37] avatar-interactive">
              PS
            </div>
            <div className="hidden sm:block text-left">
              <h4 className="font-extrabold text-xs text-[#0F3D2E] leading-tight">
                Priya Sen
              </h4>
              <span className="text-[10px] text-[#D4AF37] font-bold block leading-none">
                Super Admin
              </span>
            </div>
          </div>

        </div>

      </div>
    </header>
  );
}
