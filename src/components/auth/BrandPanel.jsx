import React from 'react';
import { ShieldCheck, Truck, Sparkles, HeartHandshake, Package } from 'lucide-react';

export default function BrandPanel({ activeStep }) {
  return (
    <div className="hidden md:flex flex-col justify-between w-72 lg:w-80 bg-gradient-to-br from-[#0F3D2E] via-[#155440] to-[#0A2A1F] p-8 text-[#FBF8F1] relative overflow-hidden border-r border-[#D4AF37]/30">
      {/* Decorative Gold Glow Overlays */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-[#D4AF37]/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-36 h-36 bg-[#D4AF37]/10 rounded-full blur-2xl pointer-events-none" />

      {/* Brand Header */}
      <div className="relative z-10">
        <div className="flex items-center space-x-1.5 mb-6">
          <span className="font-['Outfit'] font-extrabold text-2xl text-[#FBF8F1] tracking-tight">
            Mytri<span className="text-[#D4AF37]">Kart</span>
          </span>
          <span className="text-[9px] uppercase font-bold tracking-widest bg-[#D4AF37] text-[#0F3D2E] px-1.5 py-0.5 rounded shadow-2xs">
            PLUS
          </span>
        </div>

        <h3 className="font-['Outfit'] text-xl font-bold text-[#FBF8F1] leading-snug">
          {activeStep === 'register' ? 'Join the Marketplace' : 'Welcome Back'}
        </h3>
        <p className="text-xs text-[#FBF8F1]/80 mt-1.5 leading-relaxed">
          {activeStep === 'register'
            ? 'Create an account to unlock exclusive discounts, express deliveries, and early sale access.'
            : 'Login to track your active orders, manage your wishlist, and claim member-only rewards.'}
        </p>
      </div>

      {/* Value Proposition List */}
      <div className="relative z-10 my-6 space-y-4">
        <div className="flex items-start space-x-3">
          <div className="p-1.5 rounded-lg bg-[#D4AF37]/20 text-[#D4AF37] shrink-0 mt-0.5">
            <Package className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-[#FBF8F1]">Real-time Tracking</h4>
            <p className="text-[11px] text-[#FBF8F1]/70">Track doorstep delivery every step</p>
          </div>
        </div>

        <div className="flex items-start space-x-3">
          <div className="p-1.5 rounded-lg bg-[#D4AF37]/20 text-[#D4AF37] shrink-0 mt-0.5">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-[#FBF8F1]">Gold Plus Perks</h4>
            <p className="text-[11px] text-[#FBF8F1]/70">Earn loyalty coins on every purchase</p>
          </div>
        </div>

        <div className="flex items-start space-x-3">
          <div className="p-1.5 rounded-lg bg-[#D4AF37]/20 text-[#D4AF37] shrink-0 mt-0.5">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-[#FBF8F1]">100% Secure Checkout</h4>
            <p className="text-[11px] text-[#FBF8F1]/70">Bank-grade end-to-end encryption</p>
          </div>
        </div>
      </div>

      {/* Bottom Confidence Note */}
      <div className="relative z-10 pt-4 border-t border-[#FBF8F1]/15 text-[11px] text-[#FBF8F1]/60 flex items-center space-x-1.5">
        <HeartHandshake className="w-4 h-4 text-[#D4AF37]" />
        <span>Trusted by 5M+ verified shoppers</span>
      </div>
    </div>
  );
}
