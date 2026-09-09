import React from 'react';
import { ShieldCheck, Truck, Sparkles, HeartHandshake, Package } from 'lucide-react';

export default function BrandPanel({ activeStep }) {
  return (
    <div className="hidden md:flex flex-col justify-between w-72 lg:w-80 bg-gradient-to-br from-[#FA661C] via-[#E0530B] to-[#0A2A1F] p-8 text-[#FFFFFF] relative overflow-hidden border-r border-[#FF811A]/30">
      {/* Decorative Gold Glow Overlays */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-[#FF811A]/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-36 h-36 bg-[#FF811A]/10 rounded-full blur-2xl pointer-events-none" />

      {/* Brand Header */}
      <div className="relative z-10">
        <div className="flex items-center space-x-1.5 mb-6">
          <span className="font-['Outfit'] font-extrabold text-2xl text-[#FFFFFF] tracking-tight">
            Mytri<span className="text-[#FF811A]">Kart</span>
          </span>
          <span className="text-[9px] uppercase font-bold tracking-widest bg-[#FF811A] text-[#FA661C] px-1.5 py-0.5 rounded shadow-2xs">
            PLUS
          </span>
        </div>

        <h3 className="font-['Outfit'] text-xl font-bold text-[#FFFFFF] leading-snug">
          {activeStep === 'register' ? 'Join the Marketplace' : 'Welcome Back'}
        </h3>
        <p className="text-xs text-[#FFFFFF]/80 mt-1.5 leading-relaxed">
          {activeStep === 'register'
            ? 'Create an account to unlock exclusive discounts, express deliveries, and early sale access.'
            : 'Login to track your active orders, manage your wishlist, and claim member-only rewards.'}
        </p>
      </div>

      {/* Value Proposition List */}
      <div className="relative z-10 my-6 space-y-4">
        <div className="flex items-start space-x-3">
          <div className="p-1.5 rounded-lg bg-[#FF811A]/20 text-[#FF811A] shrink-0 mt-0.5">
            <Package className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-[#FFFFFF]">Real-time Tracking</h4>
            <p className="text-[11px] text-[#FFFFFF]/70">Track doorstep delivery every step</p>
          </div>
        </div>

        <div className="flex items-start space-x-3">
          <div className="p-1.5 rounded-lg bg-[#FF811A]/20 text-[#FF811A] shrink-0 mt-0.5">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-[#FFFFFF]">Gold Plus Perks</h4>
            <p className="text-[11px] text-[#FFFFFF]/70">Earn loyalty coins on every purchase</p>
          </div>
        </div>

        <div className="flex items-start space-x-3">
          <div className="p-1.5 rounded-lg bg-[#FF811A]/20 text-[#FF811A] shrink-0 mt-0.5">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-[#FFFFFF]">100% Secure Checkout</h4>
            <p className="text-[11px] text-[#FFFFFF]/70">Bank-grade end-to-end encryption</p>
          </div>
        </div>
      </div>

      {/* Bottom Confidence Note */}
      <div className="relative z-10 pt-4 border-t border-[#FFFFFF]/15 text-[11px] text-[#FFFFFF]/60 flex items-center space-x-1.5">
        <HeartHandshake className="w-4 h-4 text-[#FF811A]" />
        <span>Trusted by 5M+ verified shoppers</span>
      </div>
    </div>
  );
}
