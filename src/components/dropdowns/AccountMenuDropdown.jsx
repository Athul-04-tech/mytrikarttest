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
import { useAuth } from '../../context/AuthContext';

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
  currentUser: propCurrentUser,
  onLogout: propOnLogout
}) {
  const auth = useAuth();
  const currentUser = (auth && auth.currentUser) ? auth.currentUser : propCurrentUser;
  const onLogout = auth ? auth.logout : propOnLogout;
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

  const isSeller = (currentUser?.role === 'vendor' || currentUser?.role === 'seller');

  return (
    <>
      {/* Mobile Backdrop Sheet Modal overlay */}
      <div 
        className="fixed inset-0 bg-[#FA661C]/40 backdrop-blur-xs z-40 md:hidden"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Main Container */}
      <div className="fixed inset-x-0 bottom-0 z-50 md:z-50 md:absolute md:top-full md:right-0 md:left-auto md:bottom-auto md:w-80 md:mt-2 animate-bottom-sheet md:animate-dropdown">
        
        {/* Card Surface */}
        <div className="bg-[#FFFFFF] border border-[#FF811A]/30 rounded-t-2xl md:rounded-2xl shadow-2xl overflow-hidden glass-panel">
          
          {/* Header Identity Badge */}
          <div className="p-4 bg-gradient-to-r from-[#FA661C] to-[#16523F] text-[#FFFFFF] flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-[#FF811A] text-[#FA661C] font-black text-sm flex items-center justify-center shadow-inner avatar-interactive">
                {(currentUser?.fullName || currentUser?.name || currentUser?.username || 'U').slice(0, 2).toUpperCase()}
              </div>
              <div>
                <div className="flex items-center space-x-1.5">
                  <h4 className="font-['Outfit'] font-bold text-sm text-[#FFFFFF] leading-tight">
                    {currentUser?.fullName || currentUser?.name || currentUser?.username || 'Account'}
                  </h4>
                </div>
                <p className="text-[10px] text-[#EAE3DC] leading-none mt-0.5 truncate max-w-[170px]">
                  {currentUser?.email || ''}
                </p>
              </div>
            </div>

            {/* Mobile close button */}
            <button 
              type="button" 
              onClick={onClose}
              className="p-1 rounded-full text-[#EAE3DC] hover:text-[#000000] md:hidden icon-interactive"
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Menu Items List */}
          <div className="p-2 max-h-[65vh] md:max-h-96 overflow-y-auto divide-y divide-[#EAE3DC]/30">
            <div className="py-1">
              
              {/* Back to Seller Dashboard Top Action (Seller Only) */}
              {isSeller && (
                <button
                  type="button"
                  onClick={() => { onClose(); navigate('/seller/dashboard'); }}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-black bg-[#FFF3EC] text-[#FA661C] hover:bg-[#FA661C] hover:text-[#FFFFFF] border border-[#FA661C] transition-all cursor-pointer mb-2 shadow-2xs group"
                >
                  <div className="flex items-center space-x-2.5">
                    <Store className="w-4 h-4 text-[#FA661C] group-hover:text-white transition-colors" />
                    <span>Back to Seller Dashboard</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#FA661C] group-hover:text-white transition-colors" />
                </button>
              )}

              {LOGIN_MENU_ITEMS
                .filter(item => isSeller ? item.label !== 'Become a Seller' : true)
                .map((item, idx) => {
                const IconComponent = ICON_MAP[item.iconName] || Sparkles;

                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={(e) => handleMenuItemClick(e, item)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-[#FA661C] transition-all cursor-pointer btn-interactive ${
                      item.isHighlight 
                        ? 'bg-[#FFF8F2] text-[#FA661C] hover:bg-[#FFF3EC] font-bold' 
                        : 'hover:bg-[#FFF3EC] hover:text-[#FA661C]'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5">
                      <IconComponent className={`w-4 h-4 icon-interactive ${
                        item.isPlus ? 'text-[#FF811A]' : item.isHighlight ? 'text-[#FA661C]' : 'text-[#6B6058]'
                      }`} />
                      <span>{item.label}</span>
                    </div>

                    {item.isPlus && (
                      <span className="text-[9px] font-extrabold text-[#FA661C] bg-[#FF811A] px-1.5 py-0.2 rounded-full shadow-2xs">
                        GOLD
                      </span>
                    )}

                    {!item.isPlus && (
                      <ChevronRight className="w-3.5 h-3.5 text-[#6B6058] opacity-40 group-hover:opacity-100" />
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
                className="w-full flex items-center space-x-2.5 px-3 py-2 rounded-xl text-xs font-bold text-[#D7263D] hover:bg-[#FDE8EA] transition-colors btn-interactive cursor-pointer"
              >
                <LogOut className="w-4 h-4 text-[#D7263D] icon-interactive" />
                <span>Log Out of MytriKart</span>
              </button>
            </div>

          </div>

        </div>

      </div>
    </>
  );
}
