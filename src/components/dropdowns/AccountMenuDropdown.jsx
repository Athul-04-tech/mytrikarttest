import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  UserCheck, 
  Crown, 
  Package, 
  Heart, 
  Store, 
  Gift, 
  CreditCard, 
  Bell, 
  Headphones, 
  Megaphone, 
  Smartphone, 
  ChevronRight, 
  Sparkles, 
  X, 
  LogOut 
} from 'lucide-react';
import { LOGIN_MENU_ITEMS } from '../../data/mockData';

const ICON_MAP = {
  UserCheck,
  Crown,
  Package,
  Heart,
  Store,
  Gift,
  CreditCard,
  Bell,
  Headphones,
  Megaphone,
  Smartphone
};

const LABEL_TO_ROUTE_MAP = {
  'My Profile': '/profile',
  'MytriKart Plus Zone': '/profile/rewards',
  'Orders': '/profile/orders',
  'Wishlist': '/wishlist',
  'Become a Seller': '/seller/register',
  'Rewards': '/profile/rewards',
  'Gift Cards': '/profile/wallet',
  'Notification Preferences': '/profile/notifications',
  '24x7 Customer Care': '/profile/support'
};

export default function AccountMenuDropdown({ 
  isOpen, 
  onClose, 
  currentUser = { name: 'Aarav Sharma', email: 'aarav.sharma@example.com', isPlus: true },
  onLogout
}) {
  const navigate = useNavigate();
  if (!isOpen) return null;

  const handleMenuItemClick = (e, item) => {
    e.preventDefault();
    onClose();

    if (item.label === 'Advertise') {
      alert("Opening MytriKart Ads Console...");
      return;
    }

    if (item.label === 'Download App') {
      alert("Opening App Store / Google Play link...");
      return;
    }

    const targetRoute = LABEL_TO_ROUTE_MAP[item.label] || '/profile';
    navigate(targetRoute);
  };

  const handleLogoutClick = (e) => {
    e.preventDefault();
    onClose();
    if (onLogout) onLogout();
  };

  return (
    <>
      {/* Mobile Backdrop Sheet Modal overlay */}
      <div 
        className="fixed inset-0 bg-[#0F3D2E]/40 backdrop-blur-xs z-40 md:hidden"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Main Container */}
      <div className="fixed inset-x-0 bottom-0 z-50 md:z-50 md:absolute md:top-full md:right-0 md:left-auto md:bottom-auto md:w-80 md:mt-2 animate-bottom-sheet md:animate-dropdown">
        
        {/* Card Surface */}
        <div className="bg-[#FBF8F1] border border-[#D4AF37]/30 rounded-t-2xl md:rounded-2xl shadow-2xl overflow-hidden glass-panel">
          
          {/* Header Identity Badge */}
          <div className="p-4 bg-gradient-to-r from-[#0F3D2E] to-[#16523F] text-[#FBF8F1] flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-[#D4AF37] text-[#0F3D2E] font-black text-sm flex items-center justify-center shadow-inner avatar-interactive">
                {currentUser?.name ? currentUser.name.slice(0, 2).toUpperCase() : 'AS'}
              </div>
              <div>
                <div className="flex items-center space-x-1.5">
                  <h4 className="font-['Outfit'] font-bold text-sm text-[#FBF8F1] leading-tight">
                    {currentUser?.name || 'Aarav Sharma'}
                  </h4>
                  {currentUser?.isPlus && (
                    <span className="text-[9px] font-black bg-[#D4AF37] text-[#0F3D2E] px-1 rounded uppercase tracking-wider">
                      PLUS
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-[#D8E0DC] leading-none mt-0.5 truncate max-w-[170px]">
                  {currentUser?.email || 'aarav.sharma@example.com'}
                </p>
              </div>
            </div>

            {/* Mobile close button */}
            <button 
              type="button" 
              onClick={onClose}
              className="p-1 rounded-full text-[#D8E0DC] hover:text-white md:hidden icon-interactive"
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Menu Items List */}
          <div className="p-2 max-h-[65vh] md:max-h-96 overflow-y-auto divide-y divide-[#D8E0DC]/30">
            <div className="py-1">
              {LOGIN_MENU_ITEMS.map((item, idx) => {
                const IconComponent = ICON_MAP[item.iconName] || Sparkles;

                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={(e) => handleMenuItemClick(e, item)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-[#0F3D2E] transition-all cursor-pointer btn-interactive ${
                      item.isHighlight 
                        ? 'bg-[#FCF7E8] text-[#0F3D2E] hover:bg-[#E8F2EE] font-bold' 
                        : 'hover:bg-[#E8F2EE] hover:text-[#0F3D2E]'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5">
                      <IconComponent className={`w-4 h-4 icon-interactive ${
                        item.isPlus ? 'text-[#D4AF37]' : item.isHighlight ? 'text-[#0F3D2E]' : 'text-[#5C6B63]'
                      }`} />
                      <span>{item.label}</span>
                    </div>

                    {item.isPlus && (
                      <span className="text-[9px] font-extrabold text-[#0F3D2E] bg-[#D4AF37] px-1.5 py-0.2 rounded-full shadow-2xs">
                        GOLD
                      </span>
                    )}

                    {!item.isPlus && (
                      <ChevronRight className="w-3.5 h-3.5 text-[#5C6B63] opacity-40 group-hover:opacity-100" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Logout Row */}
            <div className="pt-2 pb-1 px-1">
              <button
                type="button"
                onClick={handleLogoutClick}
                className="w-full flex items-center space-x-2.5 px-3 py-2 rounded-xl text-xs font-bold text-[#C0392B] hover:bg-[#FDEDEC] transition-colors btn-interactive cursor-pointer"
              >
                <LogOut className="w-4 h-4 text-[#C0392B] icon-interactive" />
                <span>Log Out of MytriKart</span>
              </button>
            </div>

          </div>

        </div>

      </div>
    </>
  );
}
