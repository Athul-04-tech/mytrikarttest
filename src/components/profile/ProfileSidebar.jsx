import React from 'react';
import { 
  User, 
  MapPin, 
  Package, 
  RotateCcw, 
  ShieldCheck, 
  Wallet, 
  Crown, 
  Bell, 
  Headphones, 
  Settings, 
  LogOut,
  ChevronRight,
  Sparkles,
  CheckCircle2
} from 'lucide-react';

export const PROFILE_SECTIONS = [
  { id: 'profile', label: 'Personal Details', icon: User, badge: 'Verified' },
  { id: 'addresses', label: 'Address Book', icon: MapPin, badge: '2 Saved' },
  { id: 'orders', label: 'My Orders', icon: Package, badge: '1 Active', isUrgent: true },
  { id: 'refunds', label: 'Refunds & Returns', icon: RotateCcw },
  { id: 'warranty', label: 'Warranty & Claims', icon: ShieldCheck, badge: '2 Active' },
  { id: 'wallet', label: 'Mytri Wallet', icon: Wallet, badge: '₹4,850', isGold: true },
  { id: 'rewards', label: 'Rewards & Plus Tier', icon: Crown, badge: 'Gold VIP', isGold: true },
  { id: 'notifications', label: 'Notifications & Channels', icon: Bell },
  { id: 'support', label: 'Help & Support Desk', icon: Headphones },
  { id: 'settings', label: 'Security & Account', icon: Settings }
];

export default function ProfileSidebar({ 
  activeSection, 
  onSelectSection, 
  user,
  onLogout 
}) {
  return (
    <aside 
      aria-label="Account Navigation"
      className="w-full lg:w-72 shrink-0 bg-white border border-[#D8E0DC] rounded-3xl p-4 sm:p-5 shadow-xs flex flex-col justify-between"
    >
      <div>
        {/* Profile Summary Card Header */}
        <div className="bg-gradient-to-br from-[#0F3D2E] via-[#16523F] to-[#0F3D2E] text-[#FBF8F1] p-4 rounded-2xl border border-[#D4AF37]/30 mb-5 relative overflow-hidden shadow-sm">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#D4AF37]/15 rounded-full blur-xl pointer-events-none" />
          
          <div className="flex items-center space-x-3 relative z-10">
            {/* Avatar with Micro-interaction Lift */}
            <div className="relative">
              <img 
                src={user?.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80"}
                alt={user?.fullName || "User Avatar"} 
                className="w-13 h-13 rounded-full object-cover border-2 border-[#D4AF37] shadow-sm avatar-interactive cursor-pointer"
              />
              <div className="absolute -bottom-1 -right-1 bg-[#0F3D2E] p-0.5 rounded-full border border-[#D4AF37]">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#D4AF37]" />
              </div>
            </div>

            {/* Name and Plus Tier */}
            <div className="overflow-hidden">
              <div className="flex items-center space-x-1.5">
                <h3 className="font-['Outfit'] font-bold text-base text-[#FBF8F1] truncate">
                  {user?.fullName || "Aarav Sharma"}
                </h3>
              </div>
              <p className="text-[11px] text-[#FBF8F1]/75 truncate max-w-[160px]">
                {user?.email || "aarav.sharma@example.com"}
              </p>
              
              {/* Loyalty Level Pill */}
              <div className="inline-flex items-center space-x-1 bg-[#D4AF37] text-[#0F3D2E] px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider mt-1 shadow-2xs">
                <Crown className="w-2.5 h-2.5 fill-current" />
                <span>{user?.loyaltyLevel || "Gold Plus"}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Section Navigation Items */}
        <nav className="space-y-1">
          {PROFILE_SECTIONS.map((sec) => {
            const IconComponent = sec.icon;
            const isActive = activeSection === sec.id;

            return (
              <button
                key={sec.id}
                type="button"
                onClick={() => onSelectSection(sec.id)}
                aria-current={isActive ? "page" : undefined}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold btn-interactive group cursor-pointer ${
                  isActive
                    ? 'bg-[#0F3D2E] text-[#FBF8F1] shadow-xs'
                    : 'text-[#5C6B63] hover:text-[#0F3D2E] hover:bg-[#FBF8F1]'
                }`}
              >
                <div className="flex items-center space-x-3 truncate">
                  <div className={`p-1.5 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-[#D4AF37]/20 text-[#D4AF37]'
                      : 'bg-[#FBF8F1] text-[#5C6B63] group-hover:text-[#0F3D2E] group-hover:bg-[#E8F2EE]'
                  }`}>
                    <IconComponent className="w-4 h-4 icon-interactive" />
                  </div>
                  <span className="truncate">{sec.label}</span>
                </div>

                <div className="flex items-center space-x-1.5 shrink-0 ml-2">
                  {sec.badge && (
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${
                      isActive
                        ? 'bg-[#D4AF37] text-[#0F3D2E]'
                        : sec.isUrgent
                        ? 'bg-[#FDEDEC] text-[#C0392B] border border-[#C0392B]/30'
                        : sec.isGold
                        ? 'bg-[#FCF7E8] text-[#0F3D2E] border border-[#D4AF37]/40'
                        : 'bg-[#E8F2EE] text-[#0F3D2E]'
                    }`}>
                      {sec.badge}
                    </span>
                  )}
                  <ChevronRight className={`w-3.5 h-3.5 transition-transform ${
                    isActive ? 'text-[#D4AF37] translate-x-0.5' : 'text-[#D8E0DC] group-hover:text-[#5C6B63]'
                  }`} />
                </div>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Logout Action at bottom */}
      <div className="pt-4 mt-6 border-t border-[#D8E0DC]">
        <button
          type="button"
          onClick={onLogout}
          className="w-full py-2.5 px-3 bg-[#FBF8F1] hover:bg-[#FDEDEC] text-[#C0392B] border border-[#D8E0DC] hover:border-[#C0392B] rounded-xl text-xs font-bold btn-interactive flex items-center justify-center space-x-2 shadow-2xs cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out of Account</span>
        </button>
      </div>
    </aside>
  );
}
