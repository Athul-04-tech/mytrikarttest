import React from 'react';
import { ArrowLeft, Store, ShieldCheck, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function SellerAuthHeader({ onBackToHome, onGoToSellerLogin }) {
  const navigate = useNavigate();
  return (
    <header className="bg-white text-[#1A2420] border-b border-[#EAE3DC] py-3.5 px-4 sm:px-8 sticky top-0 z-40 shadow-xs">
      <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
        
        {/* Brand Wordmark with Seller Hub Badge */}
        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={onBackToHome}
            className="flex items-center focus:outline-none focus:ring-2 focus:ring-[#FA661C] rounded-lg p-0.5 group btn-interactive cursor-pointer"
            aria-label="Return to MytriKart Marketplace"
          >
            <img 
              src="/mytrikart-logo.png" 
              alt="MytriKart Logo" 
              className="h-8 md:h-9 w-auto object-contain" 
            />
          </button>

          <div className="hidden sm:flex items-center space-x-1.5 bg-[#FFF3EC] text-[#FA661C] border border-[#FA661C]/20 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-2xs">
            <Store className="w-3 h-3 text-[#FA661C]" />
            <span>SELLER HUB ONBOARDING</span>
          </div>
        </div>

        {/* Right Utility Actions */}
        <div className="flex items-center space-x-3 sm:space-x-4">
          
          <div className="hidden md:flex items-center space-x-1.5 text-xs text-[#6B6058]">
            <span>Already a seller?</span>
            <button
              type="button"
              onClick={onGoToSellerLogin || (() => navigate('/login'))}
              className="text-[#FA661C] hover:text-[#E0530B] font-bold link-interactive cursor-pointer"
            >
              Sign In to Hub
            </button>
          </div>

          <span className="text-[#EAE3DC] hidden md:inline">|</span>

          <button
            type="button"
            onClick={onBackToHome}
            className="flex items-center space-x-1.5 text-xs font-bold text-white bg-[#FA661C] hover:bg-[#E0530B] px-3.5 py-1.5 sm:py-2 rounded-xl shadow-xs btn-interactive cursor-pointer transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-white icon-interactive" />
            <span>Marketplace Home</span>
          </button>

        </div>

      </div>
    </header>
  );
}
