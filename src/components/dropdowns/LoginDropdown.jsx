import React from 'react';
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
  X
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

export default function LoginDropdown({ isOpen, onClose, onOpenLoginModal }) {
  if (!isOpen) return null;

  const handleSignUpClick = (e) => {
    e.preventDefault();
    onClose();
    if (onOpenLoginModal) onOpenLoginModal('register');
  };

  const handleMenuItemClick = (e, item) => {
    e.preventDefault();
    onClose();
    if (item.label === 'Become a Seller') {
      alert("Redirecting to Seller Registration Hub...");
      return;
    }
    if (onOpenLoginModal) onOpenLoginModal('identifier');
  };

  return (
    <>
      {/* Mobile Backdrop Sheet Modal overlay */}
      <div 
        className="fixed inset-0 bg-[#FA661C]/40 backdrop-blur-xs z-40 md:hidden"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Main Container: Floating dropdown on Desktop (md:absolute), Bottom Sheet on Mobile (fixed bottom-0) */}
      <div className="fixed inset-x-0 bottom-0 z-50 md:z-50 md:absolute md:top-full md:right-0 md:left-auto md:bottom-auto md:w-80 md:mt-2 animate-bottom-sheet md:animate-dropdown">
        
        {/* Card Surface */}
        <div className="bg-[#FFFFFF] border border-[#FF811A]/30 rounded-t-2xl md:rounded-2xl shadow-2xl overflow-hidden glass-panel">
          
          {/* Mobile Handle & Close Bar */}
          <div className="md:hidden flex items-center justify-between px-4 py-2.5 border-b border-[#EAE3DC] bg-[#FFF3EC]/50">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-[#FF811A]" />
              <span className="text-xs font-bold text-[#FA661C] uppercase tracking-wider">Account Options</span>
            </div>
            <button 
              onClick={onClose} 
              className="p-1 rounded-full text-[#6B6058] hover:text-[#FA661C] hover:bg-[#EAE3DC]/50 transition-colors"
              aria-label="Close Login Menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Top Row: New customer? Sign Up */}
          <div className="p-4 bg-gradient-to-r from-[#FFFFFF] via-[#F9F6F0] to-[#FFFFFF] flex items-center justify-between border-b border-[#EAE3DC]">
            <span className="text-xs font-semibold text-[#6B6058]">
              New customer?
            </span>
            <button 
              type="button"
              onClick={handleSignUpClick}
              className="text-xs font-bold text-[#FF811A] hover:text-[#E66E08] hover:underline flex items-center space-x-1 transition-colors px-2.5 py-1 bg-[#FA661C] rounded-md shadow-xs cursor-pointer"
            >
              <span>Sign Up</span>
              <ChevronRight className="w-3 h-3 text-[#FF811A]" />
            </button>
          </div>

          {/* Menu Items List */}
          <div className="max-h-[65vh] md:max-h-96 overflow-y-auto py-1 divide-y divide-[#EAE3DC]/40">
            {LOGIN_MENU_ITEMS.map((item) => {
              const IconComponent = ICON_MAP[item.iconName] || UserCheck;
              const isHighlight = item.isHighlight;
              const isPlus = item.isPlus;

              return (
                <button
                  key={item.label}
                  type="button"
                  onClick={(e) => handleMenuItemClick(e, item)}
                  className={`w-full text-left flex items-center justify-between px-4 py-2.5 text-xs transition-all group ${
                    isHighlight 
                      ? 'bg-[#FFF8F2] hover:bg-[#FF811A]/20 border-l-4 border-[#FF811A]' 
                      : 'hover:bg-[#FFF8F2]/80 hover:pl-5'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    {/* Icon container */}
                    <div className={`p-1.5 rounded-lg transition-colors ${
                      isHighlight 
                        ? 'bg-[#FA661C] text-[#FF811A] shadow-xs' 
                        : isPlus
                        ? 'bg-[#FF811A]/20 text-[#FF811A]'
                        : 'text-[#6B6058] group-hover:text-[#FA661C] group-hover:bg-[#FFF3EC]'
                    }`}>
                      <IconComponent className="w-4 h-4" />
                    </div>

                    {/* Label */}
                    <span className={`font-medium ${
                      isHighlight 
                        ? 'font-bold text-[#FA661C] text-xs' 
                        : 'text-[#FA661C] group-hover:text-[#FA661C]'
                    }`}>
                      {item.label}
                    </span>
                  </div>

                  {/* Optional Plus Badge or Arrow */}
                  {isPlus && (
                    <span className="text-[10px] font-bold text-[#FA661C] bg-[#FF811A] px-1.5 py-0.5 rounded shadow-2xs uppercase">
                      PLUS
                    </span>
                  )}

                  {isHighlight && (
                    <span className="text-[10px] font-bold text-[#FA661C] bg-[#FF811A]/30 px-1.5 py-0.5 rounded uppercase">
                      SELLER HUB
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Bottom Card Footer */}
          <div className="p-3 bg-[#FFF3EC]/40 border-t border-[#EAE3DC] text-center">
            <p className="text-[11px] text-[#6B6058] flex items-center justify-center space-x-1">
              <span>Experience fast & trusted shopping</span>
            </p>
          </div>

        </div>
      </div>
    </>
  );
}
