import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Store, 
  Bell, 
  Headphones, 
  Megaphone,
  X,
  ChevronRight
} from 'lucide-react';
import { MORE_MENU_ITEMS } from '../../data/mockData';

const ICON_MAP = {
  Store,
  Bell,
  Headphones,
  Megaphone
};

export default function MoreDropdown({ isOpen, onClose }) {
  const navigate = useNavigate();
  if (!isOpen) return null;

  const handleItemClick = (e, item) => {
    e.preventDefault();
    onClose();

    if (item.label === 'Become a Seller') {
      navigate('/seller/register');
      return;
    }

    if (item.label === 'Notification Settings') {
      navigate('/profile/notifications');
      return;
    }

    if (item.label === '24x7 Customer Care') {
      navigate('/profile/support');
      return;
    }

    if (item.label === 'Advertise on MytriKart') {
      alert("Opening MytriKart Ads Console...");
      return;
    }
  };

  return (
    <>
      {/* Mobile Backdrop Sheet Overlay */}
      <div 
        className="fixed inset-0 bg-[#0F3D2E]/40 backdrop-blur-xs z-40 md:hidden"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Main Container */}
      <div className="fixed inset-x-0 bottom-0 z-50 md:z-50 md:absolute md:top-full md:right-0 md:left-auto md:bottom-auto md:w-64 md:mt-2 animate-bottom-sheet md:animate-dropdown">
        <div className="bg-[#FBF8F1] border border-[#D4AF37]/30 rounded-t-2xl md:rounded-2xl shadow-2xl overflow-hidden glass-panel">
          
          {/* Mobile Bar */}
          <div className="md:hidden flex items-center justify-between px-4 py-2.5 border-b border-[#D8E0DC] bg-[#E8F2EE]/50">
            <span className="text-xs font-bold text-[#0F3D2E] uppercase tracking-wider">More Options</span>
            <button 
              onClick={onClose} 
              className="p-1 text-[#5C6B63] hover:text-[#0F3D2E] icon-interactive cursor-pointer"
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="py-2 divide-y divide-[#D8E0DC]/40">
            {MORE_MENU_ITEMS.map((item) => {
              const IconComponent = ICON_MAP[item.iconName] || Store;
              const isHighlight = item.isHighlight;

              return (
                <button
                  key={item.label}
                  type="button"
                  onClick={(e) => handleItemClick(e, item)}
                  className={`w-full flex items-center justify-between px-4 py-3 text-xs transition-all group btn-interactive cursor-pointer ${
                    isHighlight 
                      ? 'bg-[#FCF7E8] hover:bg-[#D4AF37]/20 border-l-4 border-[#D4AF37]' 
                      : 'hover:bg-[#FCF7E8]/80 hover:pl-5'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`p-1.5 rounded-lg transition-colors ${
                      isHighlight 
                        ? 'bg-[#0F3D2E] text-[#D4AF37]' 
                        : 'text-[#5C6B63] group-hover:text-[#0F3D2E] group-hover:bg-[#E8F2EE]'
                    }`}>
                      <IconComponent className="w-4 h-4 icon-interactive" />
                    </div>

                    <span className={`font-medium ${
                      isHighlight ? 'font-bold text-[#0F3D2E]' : 'text-[#0F3D2E]'
                    }`}>
                      {item.label}
                    </span>
                  </div>

                  <ChevronRight className="w-3.5 h-3.5 text-[#5C6B63] group-hover:text-[#0F3D2E] group-hover:translate-x-0.5 transition-transform" />
                </button>
              );
            })}
          </div>

        </div>
      </div>
    </>
  );
}
