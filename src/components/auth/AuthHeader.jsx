import React from 'react';
import { ArrowLeft, ShieldCheck } from 'lucide-react';

export default function AuthHeader({ onBackToHome }) {
  return (
    <header className="bg-[#FBF8F1] border-b border-[#D8E0DC]/80 py-3 px-4 sm:px-8 flex items-center justify-between sticky top-0 z-30 shadow-2xs">
      <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
        
        {/* Brand Logo (Links to Homepage) */}
        <button
          type="button"
          onClick={onBackToHome}
          className="flex items-center space-x-1.5 group focus:outline-none focus:ring-2 focus:ring-[#0F3D2E] rounded-md px-1 py-0.5"
          aria-label="Return to MytriKart Homepage"
        >
          <span className="font-['Outfit'] font-extrabold text-2xl text-[#0F3D2E] tracking-tight group-hover:opacity-90 transition-opacity">
            Mytri<span className="text-[#D4AF37]">Kart</span>
          </span>
          <span className="hidden sm:inline-block text-[9px] uppercase font-bold tracking-widest bg-[#0F3D2E]/10 text-[#0F3D2E] px-1.5 py-0.5 rounded border border-[#0F3D2E]/20">
            MARKETPLACE
          </span>
        </button>

        {/* Back to Home Quick Action */}
        <button
          type="button"
          onClick={onBackToHome}
          className="flex items-center space-x-1.5 text-xs font-bold text-[#5C6B63] hover:text-[#0F3D2E] transition-colors group px-3 py-1.5 rounded-xl hover:bg-[#E8F2EE]"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform text-[#D4AF37]" />
          <span>Back to Marketplace</span>
        </button>

      </div>
    </header>
  );
}
