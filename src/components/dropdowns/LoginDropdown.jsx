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
        className="fixed inset-0 bg-[#0F3D2E]/40 backdrop-blur-xs z-40 md:hidden"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Main Container: Floating dropdown on Desktop (md:absolute), Bottom Sheet on Mobile (fixed bottom-0) */}
      <div className="fixed inset-x-0 bottom-0 z-50 md:z-50 md:absolute md:top-full md:right-0 md:left-auto md:bottom-auto md:w-80 md:mt-2 animate-bottom-sheet md:animate-dropdown">
        
        {/* Card Surface */}
        <div className="bg-[#FBF8F1] border border-[#D4AF37]/30 rounded-t-2xl md:rounded-2xl shadow-2xl overflow-hidden glass-panel">
          
          {/* Mobile Handle & Close Bar */}
          <div className="md:hidden flex items-center justify-between px-4 py-2.5 border-b border-[#D8E0DC] bg-[#E8F2EE]/50">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-[#D4AF37]" />
              <span className="text-xs font-bold text-[#0F3D2E] uppercase tracking-wider">Account Options</span>
            </div>
            <button 
              onClick={onClose} 
              className="p-1 rounded-full text-[#5C6B63] hover:text-[#0F3D2E] hover:bg-[#D8E0DC]/50 transition-colors"
              aria-label="Close Login Menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Top Row: New customer? Sign Up */}
          <div className="p-4 bg-gradient-to-r from-[#FBF8F1] via-[#F4EFE6] to-[#FBF8F1] flex items-center justify-between border-b border-[#D8E0DC]">
            <span className="text-xs font-semibold text-[#5C6B63]">
              New customer?
            </span>
            <button 
              type="button"
              onClick={handleSignUpClick}
              className="text-xs font-bold text-[#D4AF37] hover:text-[#B59325] hover:underline flex items-center space-x-1 transition-colors px-2.5 py-1 bg-[#0F3D2E] rounded-md shadow-xs cursor-pointer"
            >
              <span>Sign Up</span>
              <ChevronRight className="w-3 h-3 text-[#D4AF37]" />
            </button>
          </div>

          {/* Menu Items List */}
          <div className="max-h-[65vh] md:max-h-96 overflow-y-auto py-1 divide-y divide-[#D8E0DC]/40">
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
                      ? 'bg-[#FCF7E8] hover:bg-[#D4AF37]/20 border-l-4 border-[#D4AF37]' 
                      : 'hover:bg-[#FCF7E8]/80 hover:pl-5'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    {/* Icon container */}
                    <div className={`p-1.5 rounded-lg transition-colors ${
                      isHighlight 
                        ? 'bg-[#0F3D2E] text-[#D4AF37] shadow-xs' 
                        : isPlus
                        ? 'bg-[#D4AF37]/20 text-[#D4AF37]'
                        : 'text-[#5C6B63] group-hover:text-[#0F3D2E] group-hover:bg-[#E8F2EE]'
                    }`}>
                      <IconComponent className="w-4 h-4" />
                    </div>

                    {/* Label */}
                    <span className={`font-medium ${
                      isHighlight 
                        ? 'font-bold text-[#0F3D2E] text-xs' 
                        : 'text-[#0F3D2E] group-hover:text-[#0F3D2E]'
                    }`}>
                      {item.label}
                    </span>
                  </div>

                  {/* Optional Plus Badge or Arrow */}
                  {isPlus && (
                    <span className="text-[10px] font-bold text-[#0F3D2E] bg-[#D4AF37] px-1.5 py-0.5 rounded shadow-2xs uppercase">
                      PLUS
                    </span>
                  )}

                  {isHighlight && (
                    <span className="text-[10px] font-bold text-[#0F3D2E] bg-[#D4AF37]/30 px-1.5 py-0.5 rounded uppercase">
                      SELLER HUB
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Bottom Card Footer */}
          <div className="p-3 bg-[#E8F2EE]/40 border-t border-[#D8E0DC] text-center">
            <p className="text-[11px] text-[#5C6B63] flex items-center justify-center space-x-1">
              <span>Experience fast & trusted shopping</span>
            </p>
          </div>

        </div>
      </div>
    </>
  );
}
