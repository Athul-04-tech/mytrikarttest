import React from 'react';
import { MapPin, Plane, ChevronRight } from 'lucide-react';

export default function TopUtilityBar({ onOpenLocationModal, deliveryLocation }) {
  return (
    <div className="bg-[#FBF8F1] border-b border-[#D8E0DC]/60 text-xs text-[#5C6B63] py-2 px-4 md:px-8 flex items-center justify-between transition-colors">
      {/* Left side: Platform Logo */}
      <div className="flex items-center space-x-3 md:space-x-4">
        {/* Platform Wordmark */}
        <a 
          href="#" 
          className="flex items-center space-x-1.5 group focus:outline-none focus:ring-2 focus:ring-[#0F3D2E] rounded-md px-1 py-0.5"
          aria-label="MytriKart Homepage"
        >
          <span className="font-['Outfit'] font-extrabold text-xl md:text-2xl text-[#0F3D2E] tracking-tight group-hover:opacity-90 transition-opacity">
            Mytri<span className="text-[#D4AF37]">Kart</span>
          </span>
          <span className="hidden sm:inline-block text-[10px] uppercase font-bold tracking-widest bg-[#0F3D2E]/10 text-[#0F3D2E] px-1.5 py-0.5 rounded border border-[#0F3D2E]/20">
            MARKETPLACE
          </span>
        </a>
      </div>

      {/* Right side: Delivery Location Link */}
      <button
        onClick={onOpenLocationModal}
        className="flex items-center space-x-1.5 text-[#5C6B63] hover:text-[#0F3D2E] font-medium transition-colors group focus:outline-none focus:ring-1 focus:ring-[#0F3D2E] rounded-md px-2 py-1"
        aria-label="Select delivery location"
      >
        <MapPin className="w-4 h-4 text-[#D4AF37] group-hover:bounce transition-transform" />
        <span className="hidden sm:inline text-xs truncate max-w-[200px] md:max-w-none">
          {deliveryLocation ? (
            <>Deliver to: <strong className="text-[#0F3D2E]">{deliveryLocation}</strong></>
          ) : (
            <>Location not set — <span className="underline decoration-[#D4AF37] underline-offset-2">Select delivery location</span></>
          )}
        </span>
        <span className="sm:hidden text-xs underline decoration-[#D4AF37]">
          {deliveryLocation || 'Set Location'}
        </span>
        <ChevronRight className="w-3 h-3 text-[#5C6B63] group-hover:translate-x-0.5 transition-transform" />
      </button>
    </div>
  );
}
