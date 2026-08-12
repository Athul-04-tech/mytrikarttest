import React from 'react';
import { ArrowLeft, Store, ShieldCheck, Sparkles } from 'lucide-react';

export default function SellerAuthHeader({ onBackToHome, onGoToSellerLogin }) {
  return (
    <header className="bg-[#0F3D2E] text-[#FBF8F1] border-b border-[#D4AF37]/30 py-3.5 px-4 sm:px-8 sticky top-0 z-40 shadow-md">
      <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
        
        {/* Brand Wordmark with Seller Hub Badge */}
        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={onBackToHome}
            className="flex items-center space-x-2 focus:outline-none focus:ring-2 focus:ring-[#D4AF37] rounded-lg p-0.5 group btn-interactive cursor-pointer"
            aria-label="Return to MytriKart Marketplace"
          >
            <span className="font-['Outfit'] font-black text-2xl tracking-tight text-[#FBF8F1]">
              Mytri<span className="text-[#D4AF37]">Kart</span>
            </span>
          </button>

          <div className="hidden sm:flex items-center space-x-1.5 bg-[#D4AF37] text-[#0F3D2E] px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-2xs">
            <Store className="w-3 h-3" />
            <span>SELLER HUB ONBOARDING</span>
          </div>
        </div>

        {/* Right Utility Actions */}
        <div className="flex items-center space-x-3 sm:space-x-4">
          
          <div className="hidden md:flex items-center space-x-1.5 text-xs text-[#FBF8F1]/80">
            <span>Already a seller?</span>
            <button
              type="button"
              onClick={onGoToSellerLogin || (() => alert("Opening Seller Login Portal..."))}
              className="text-[#D4AF37] hover:text-[#FFF2B2] font-bold link-interactive cursor-pointer"
            >
              Sign In to Hub
            </button>
          </div>

          <span className="text-[#D4AF37]/40 hidden md:inline">|</span>

          <button
            type="button"
            onClick={onBackToHome}
            className="flex items-center space-x-1.5 text-xs font-bold text-[#FBF8F1]/90 hover:text-white bg-[#155440] hover:bg-[#1A624B] border border-[#D4AF37]/30 px-3 py-1.5 rounded-xl btn-interactive cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 text-[#D4AF37] icon-interactive" />
            <span>Marketplace Home</span>
          </button>

        </div>

      </div>
    </header>
  );
}
