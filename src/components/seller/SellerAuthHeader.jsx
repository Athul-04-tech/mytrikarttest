import React from 'react';
import { ArrowLeft, Store, ShieldCheck, Sparkles } from 'lucide-react';

export default function SellerAuthHeader({ onBackToHome, onGoToSellerLogin }) {
  return (
    <header className="bg-[#1A1A1A] text-[#FFFFFF] border-b border-[#FF811A]/30 py-3.5 px-4 sm:px-8 sticky top-0 z-40 shadow-md">
      <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
        
        {/* Brand Wordmark with Seller Hub Badge */}
        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={onBackToHome}
            className="flex items-center focus:outline-none focus:ring-2 focus:ring-[#FF811A] rounded-lg p-0.5 group btn-interactive cursor-pointer"
            aria-label="Return to MytriKart Marketplace"
          >
            <img 
              src="/mytrikart-logo.png" 
              alt="MytriKart Logo" 
              className="h-8 md:h-10 w-auto object-contain bg-white rounded-lg px-2 py-0.5"
            />
          </button>

          <div className="hidden sm:flex items-center space-x-1.5 bg-[#FF811A] text-[#FA661C] px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-2xs">
            <Store className="w-3 h-3" />
            <span>SELLER HUB ONBOARDING</span>
          </div>
        </div>

        {/* Right Utility Actions */}
        <div className="flex items-center space-x-3 sm:space-x-4">
          
          <div className="hidden md:flex items-center space-x-1.5 text-xs text-[#FFFFFF]/80">
            <span>Already a seller?</span>
            <button
              type="button"
              onClick={onGoToSellerLogin || (() => alert("Opening Seller Login Portal..."))}
              className="text-[#FF811A] hover:text-[#FFF2B2] font-bold link-interactive cursor-pointer"
            >
              Sign In to Hub
            </button>
          </div>

          <span className="text-[#FF811A]/40 hidden md:inline">|</span>

          <button
            type="button"
            onClick={onBackToHome}
            className="flex items-center space-x-1.5 text-xs font-bold text-[#FFFFFF]/90 hover:text-[#000000] bg-[#E0530B] hover:bg-[#1A624B] border border-[#FF811A]/30 px-3 py-1.5 rounded-xl btn-interactive cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 text-[#FF811A] icon-interactive" />
            <span>Marketplace Home</span>
          </button>

        </div>

      </div>
    </header>
  );
}
