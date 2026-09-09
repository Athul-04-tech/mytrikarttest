import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, ChevronRight } from 'lucide-react';

export default function TopUtilityBar({ onOpenLocationModal, deliveryLocation }) {
  return (
    <div className="bg-[#FFFFFF] border-b border-[#EAE3DC]/60 text-xs text-[#6B6058] py-2 px-4 md:px-8 flex items-center justify-between transition-colors">
      {/* Left side: Platform Logo */}
      <div className="flex items-center space-x-3 md:space-x-4">
        {/* Platform Brand Logo (Routes to Home) */}
        <Link 
          to="/" 
          className="flex items-center group focus:outline-none focus:ring-2 focus:ring-[#FA661C] rounded-md px-1 py-0.5 btn-interactive"
          aria-label="MytriKart Homepage"
        >
          <img 
            src="/mytrikart-logo.png" 
            alt="MytriKart Logo" 
            className="h-8 md:h-10 w-auto object-contain max-w-[200px] md:max-w-[240px]"
          />
        </Link>
      </div>

      {/* Right side: Delivery Location Link */}
      <button
        onClick={onOpenLocationModal}
        className="flex items-center space-x-1.5 text-[#6B6058] hover:text-[#FA661C] font-medium transition-colors group focus:outline-none focus:ring-1 focus:ring-[#FA661C] rounded-md px-2 py-1"
        aria-label="Select delivery location"
      >
        <MapPin className="w-4 h-4 text-[#FF811A] group-hover:bounce transition-transform" />
        <span className="hidden sm:inline text-xs truncate max-w-[200px] md:max-w-none">
          {deliveryLocation ? (
            <>Deliver to: <strong className="text-[#FA661C]">{deliveryLocation}</strong></>
          ) : (
            <>Location not set — <span className="underline decoration-[#FF811A] underline-offset-2">Select delivery location</span></>
          )}
        </span>
        <span className="sm:hidden text-xs underline decoration-[#FF811A]">
          {deliveryLocation || 'Set Location'}
        </span>
        <ChevronRight className="w-3 h-3 text-[#6B6058] group-hover:translate-x-0.5 transition-transform" />
      </button>
    </div>
  );
}
