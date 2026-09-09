import React from 'react';
import { 
  User, 
  MapPin, 
  Package, 
  RotateCcw, 
  ShieldCheck, 
  Bell, 
  Headphones, 
  Settings, 
  LogOut, 
  ChevronRight, 
  Sparkles, 
  CheckCircle2 
} from 'lucide-react';

export const PROFILE_SECTIONS = [
  { id: 'profile', label: 'Personal Details', icon: User },
  { id: 'addresses', label: 'Address Book', icon: MapPin },
  { id: 'orders', label: 'My Orders', icon: Package },
  { id: 'refunds', label: 'Refunds & Returns', icon: RotateCcw },
  { id: 'warranty', label: 'Warranty & Claims', icon: ShieldCheck },
  { id: 'notifications', label: 'Notifications & Channels', icon: Bell },
  { id: 'support', label: 'Help & Support Desk', icon: Headphones },
  { id: 'settings', label: 'Security & Account', icon: Settings }
];

export default function ProfileSidebar({ 
  activeSection, 
  onSelectSection, 
  user,
  userProfile,
  onLogout 
}) {
  const currentUser = user || userProfile || {};
  const displayName = currentUser?.fullName || currentUser?.name || currentUser?.username || 'Account';
  const displayEmail = currentUser?.email || '';
  const displayRole = currentUser?.role ? (currentUser.role.charAt(0).toUpperCase() + currentUser.role.slice(1)) : 'Customer';
  const initials = displayName.slice(0, 2).toUpperCase();

  return (
    <aside 
      aria-label="Account Navigation"
      className="w-full lg:w-72 shrink-0 bg-white border border-[#EAE3DC] rounded-3xl p-4 sm:p-5 shadow-xs flex flex-col justify-between"
    >
      <div>
        {/* Profile Summary Card Header */}
        <div className="bg-gradient-to-br from-[#FA661C] via-[#16523F] to-[#FA661C] text-[#FFFFFF] p-4 rounded-2xl border border-[#FF811A]/30 mb-5 relative overflow-hidden shadow-sm">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#FF811A]/15 rounded-full blur-xl pointer-events-none" />
          
          <div className="flex items-center space-x-3 relative z-10">
            {/* Initials Avatar */}
            <div className="relative shrink-0">
              <div className="w-12 h-12 rounded-full bg-[#FF811A] text-[#FA661C] font-black text-sm flex items-center justify-center border-2 border-white shadow-xs">
                {initials}
              </div>
              <div className="absolute -bottom-1 -right-1 bg-[#FA661C] p-0.5 rounded-full border border-[#FF811A]">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#FF811A]" />
              </div>
            </div>

            {/* Name and Role */}
            <div className="overflow-hidden">
              <div className="flex items-center space-x-1.5">
                <h3 className="font-['Outfit'] font-bold text-base text-[#FFFFFF] truncate">
                  {displayName}
                </h3>
              </div>
              {displayEmail && (
                <p className="text-[11px] text-[#FFFFFF]/75 truncate max-w-[160px]">
                  {displayEmail}
                </p>
              )}
              
              {/* Role Badge */}
              <div className="inline-flex items-center space-x-1 bg-[#E0530B] text-[#A2E3C4] border border-[#A2E3C4]/30 px-2 py-0.5 rounded-full text-[10px] font-bold capitalize mt-1">
                <span>{displayRole}</span>
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
                    ? 'bg-[#FA661C] text-[#FFFFFF] shadow-xs'
                    : 'text-[#6B6058] hover:text-[#FA661C] hover:bg-[#FFFFFF]'
                }`}
              >
                <div className="flex items-center space-x-3 truncate">
                  <div className={`p-1.5 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-[#E0530B] text-[#FF811A]'
                      : 'text-[#6B6058] group-hover:text-[#FA661C] group-hover:bg-[#FFF3EC]'
                  }`}>
                    <IconComponent className="w-4 h-4 icon-interactive" />
                  </div>
                  <span className="truncate">{sec.label}</span>
                </div>

                {sec.badge && (
                  <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full shrink-0 ${
                    sec.isGold
                      ? 'bg-[#FF811A] text-[#FA661C]'
                      : sec.isUrgent
                      ? 'bg-[#D7263D] text-white'
                      : isActive
                      ? 'bg-[#E0530B] text-[#FFFFFF]'
                      : 'bg-[#FFF3EC] text-[#FA661C]'
                  }`}>
                    {sec.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Logout Action */}
      <div className="pt-4 mt-4 border-t border-[#EAE3DC]">
        <button
          type="button"
          onClick={onLogout}
          className="w-full flex items-center space-x-2.5 px-3.5 py-2 rounded-xl text-xs font-bold text-[#D7263D] hover:bg-[#FDE8EA] transition-colors btn-interactive cursor-pointer"
        >
          <LogOut className="w-4 h-4 text-[#D7263D] icon-interactive" />
          <span>Log Out of Account</span>
        </button>
      </div>

    </aside>
  );
}
