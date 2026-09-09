import React from 'react';
import { ArrowLeft, ShieldCheck } from 'lucide-react';

export default function AuthHeader({ onBackToHome }) {
  return (
    <header className="bg-[#FFFFFF] border-b border-[#EAE3DC]/80 py-3 px-4 sm:px-8 flex items-center justify-between sticky top-0 z-30 shadow-2xs">
      <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
        
        {/* Brand Logo (Links to Homepage) */}
        <button
          type="button"
          onClick={onBackToHome}
          className="flex items-center group focus:outline-none focus:ring-2 focus:ring-[#FA661C] rounded-md px-1 py-0.5"
          aria-label="Return to MytriKart Homepage"
        >
          <img 
            src="/mytrikart-logo.png" 
            alt="MytriKart Logo" 
            className="h-8 md:h-10 w-auto object-contain max-w-[200px]"
          />
        </button>

        {/* Back to Home Quick Action */}
        <button
          type="button"
          onClick={onBackToHome}
          className="flex items-center space-x-1.5 text-xs font-bold text-[#6B6058] hover:text-[#FA661C] transition-colors group px-3 py-1.5 rounded-xl hover:bg-[#FFF3EC]"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform text-[#FF811A]" />
          <span>Back to Marketplace</span>
        </button>

      </div>
    </header>
  );
}
