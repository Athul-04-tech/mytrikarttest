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
      navigate('/seller/register');
      return;
    }
  };

  return (
    <>
      {/* Backdrop overlay - transparent click-outside listener for mobile and desktop */}
      <div 
        className="fixed inset-0 z-40 bg-transparent"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Main Container: Floating dropdown box on both mobile & desktop */}
      <div className="absolute top-full mt-1.5 sm:mt-2 right-0 z-50 w-64 animate-dropdown">
        <div className="bg-[#FFFFFF] border border-[#FF811A]/30 rounded-2xl shadow-2xl overflow-hidden glass-panel">
          
          {/* Mobile Bar */}
          <div className="sm:hidden flex items-center justify-between px-3.5 py-2 border-b border-[#EAE3DC] bg-[#FFF3EC]/50">
            <span className="text-xs font-bold text-[#FA661C] uppercase tracking-wider">More Options</span>
            <button 
              onClick={onClose} 
              className="p-1 text-[#6B6058] hover:text-[#FA661C] icon-interactive cursor-pointer"
              aria-label="Close menu"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="py-2 divide-y divide-[#EAE3DC]/40">
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
                      ? 'bg-[#FFF8F2] hover:bg-[#FF811A]/20 border-l-4 border-[#FF811A]' 
                      : 'hover:bg-[#FFF8F2]/80 hover:pl-5'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`p-1.5 rounded-lg transition-colors ${
                      isHighlight 
                        ? 'bg-[#FA661C] text-[#FF811A]' 
                        : 'text-[#6B6058] group-hover:text-[#FA661C] group-hover:bg-[#FFF3EC]'
                    }`}>
                      <IconComponent className="w-4 h-4 icon-interactive" />
                    </div>

                    <span className={`font-medium ${
                      isHighlight ? 'font-bold text-[#FA661C]' : 'text-[#FA661C]'
                    }`}>
                      {item.label}
                    </span>
                  </div>

                  <ChevronRight className="w-3.5 h-3.5 text-[#6B6058] group-hover:text-[#FA661C] group-hover:translate-x-0.5 transition-transform" />
                </button>
              );
            })}
          </div>

        </div>
      </div>
    </>
  );
}
