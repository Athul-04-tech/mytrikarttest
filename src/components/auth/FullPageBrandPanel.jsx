import React from 'react';
import { 
  Package, 
  Sparkles, 
  ShieldCheck, 
  HeartHandshake, 
  Store, 
  ArrowRight,
  TrendingUp,
  CheckCircle2 
} from 'lucide-react';

export default function FullPageBrandPanel({ onSellerClick }) {
  return (
    <aside 
      aria-label="Platform Value Proposition"
      className="hidden md:flex flex-col justify-between w-full md:w-[45%] lg:w-[42%] bg-gradient-to-br from-[#FA661C] via-[#E0530B] to-[#0A2A1F] p-8 lg:p-12 text-[#FFFFFF] relative overflow-hidden border-r border-[#FF811A]/30"
    >
      {/* Decorative Gold Radial Glows */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-[#FF811A]/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-[#FF811A]/10 rounded-full blur-2xl pointer-events-none" />

      {/* Top Value Headline */}
      <div className="relative z-10">
        <div className="inline-flex items-center space-x-1.5 bg-[#FF811A]/20 text-[#FF811A] border border-[#FF811A]/40 px-3 py-1 rounded-full text-xs font-bold mb-4">
          <Sparkles className="w-3.5 h-3.5" />
          <span>PREMIER MARKETPLACE PLATFORM</span>
        </div>

        <h2 className="font-['Outfit'] text-2xl lg:text-3xl font-extrabold text-[#FFFFFF] leading-snug tracking-tight">
          Shop from thousands of trusted sellers with Gold standard guarantees
        </h2>
        
        <p className="text-xs lg:text-sm text-[#FFFFFF]/80 mt-3 leading-relaxed max-w-md">
          Access verified artisan brands, guaranteed fast doorstep deliveries, and exclusive member discounts on every single order.
        </p>

        {/* 2. SECONDARY CTA: BECOME A SELLER GHOST BUTTON */}
        <div className="mt-6 pt-6 border-t border-[#FFFFFF]/15">
          <div className="bg-[#0A2A1F]/70 border border-[#FF811A]/30 rounded-2xl p-4 backdrop-blur-xs">
            <div className="flex items-center space-x-2 text-[#FF811A] text-xs font-bold mb-1">
              <Store className="w-4 h-4" />
              <span>SELL ON MYTRIKART</span>
            </div>
            <p className="text-[11px] text-[#FFFFFF]/75 mb-3 leading-tight">
              Reach 5M+ active shoppers with zero onboarding fees and priority seller logistics.
            </p>
            <button
              type="button"
              onClick={onSellerClick || (() => alert("Redirecting to Seller Onboarding Portal..."))}
              className="w-full py-2.5 px-3 rounded-xl text-xs font-bold text-[#FF811A] border border-[#FF811A] hover:bg-[#FF811A] hover:text-[#FA661C] transition-all duration-150 flex items-center justify-center space-x-1.5 group cursor-pointer shadow-xs"
            >
              <span>Are you a business? Become a Seller</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </div>

      {/* Middle Value Props List */}
      <div className="relative z-10 my-6 space-y-3.5">
        <div className="flex items-start space-x-3">
          <div className="p-1.5 rounded-lg bg-[#FF811A]/20 text-[#FF811A] shrink-0 mt-0.5">
            <Package className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-[#FFFFFF]">Real-time Live Order Tracking</h4>
            <p className="text-[11px] text-[#FFFFFF]/70">Track doorstep delivery at every milestone</p>
          </div>
        </div>

        <div className="flex items-start space-x-3">
          <div className="p-1.5 rounded-lg bg-[#FF811A]/20 text-[#FF811A] shrink-0 mt-0.5">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-[#FFFFFF]">Gold Plus Member Privileges</h4>
            <p className="text-[11px] text-[#FFFFFF]/70">Free priority shipping & early sale access</p>
          </div>
        </div>

        <div className="flex items-start space-x-3">
          <div className="p-1.5 rounded-lg bg-[#FF811A]/20 text-[#FF811A] shrink-0 mt-0.5">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-[#FFFFFF]">100% Genuine Marketplace Guarantee</h4>
            <p className="text-[11px] text-[#FFFFFF]/70">Verified authentic seller inventory only</p>
          </div>
        </div>
      </div>

      {/* Bottom Social Proof Badge */}
      <div className="relative z-10 pt-4 border-t border-[#FFFFFF]/15 text-[11px] text-[#FFFFFF]/60 flex items-center justify-between">
        <div className="flex items-center space-x-1.5">
          <HeartHandshake className="w-4 h-4 text-[#FF811A]" />
          <span>5M+ Verified Shoppers</span>
        </div>
        <div className="flex items-center space-x-1 text-[#FF811A]">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span className="font-semibold">ISO 27001 Secure</span>
        </div>
      </div>
    </aside>
  );
}
