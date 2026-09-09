import React from 'react';
import { Sparkles, ArrowRight, TrendingUp } from 'lucide-react';

export default function SectionHeader({ title = "Popular Picks", subtitle = "Handpicked marketplace deals curated for you" }) {
  return (
    <div className="relative rounded-2xl overflow-hidden mb-6 bg-gradient-to-r from-[#FA661C] via-[#E0530B] to-[#FA661C] p-5 sm:p-6 shadow-md border border-[#FF811A]/30 text-[#FFFFFF] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      {/* Decorative Gold Accent Lines */}
      <div className="absolute top-0 right-0 w-48 h-full bg-gradient-to-l from-[#FF811A]/20 to-transparent pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-32 h-1 bg-[#FF811A]" />

      <div className="relative z-10">
        <div className="flex items-center space-x-2 text-[#FF811A] mb-1">
          <TrendingUp className="w-4 h-4" />
          <span className="text-[11px] font-bold uppercase tracking-widest">TOP MARKETPLACE TRENDS</span>
        </div>
        <h2 className="font-['Outfit'] text-xl sm:text-2xl md:text-3xl font-extrabold text-[#FFFFFF] tracking-tight">
          {title}
        </h2>
        <p className="text-xs sm:text-sm text-[#FFFFFF]/80 font-medium mt-0.5">
          {subtitle}
        </p>
      </div>

      <a
        href="#all-products"
        onClick={(e) => { e.preventDefault(); alert("Explore all popular picks"); }}
        className="relative z-10 inline-flex items-center space-x-1.5 bg-[#FF811A] hover:bg-[#E3BE46] text-[#FA661C] font-bold text-xs px-4 py-2 rounded-xl transition-all shadow-sm hover:scale-105 shrink-0"
      >
        <span>View All Picks</span>
        <ArrowRight className="w-3.5 h-3.5" />
      </a>
    </div>
  );
}
