import React from 'react';
import { 
  ShieldCheck, 
  Truck, 
  RotateCcw, 
  Headphones, 
  Store,
  Sparkles,
  ArrowRight
} from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-[#0F3D2E] text-[#FBF8F1] border-t-4 border-[#D4AF37] mt-12">
      
      {/* 1. Value Proposition Guarantees Band */}
      <div className="border-b border-[#FBF8F1]/10 py-8 px-4 sm:px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-[#D4AF37]/20 text-[#D4AF37]">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-xs sm:text-sm text-[#FBF8F1]">100% Genuine Products</h4>
              <p className="text-[11px] text-[#FBF8F1]/70">Verified marketplace sellers</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-[#D4AF37]/20 text-[#D4AF37]">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-xs sm:text-sm text-[#FBF8F1]">Express Delivery</h4>
              <p className="text-[11px] text-[#FBF8F1]/70">Fast tracking to your door</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-[#D4AF37]/20 text-[#D4AF37]">
              <RotateCcw className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-xs sm:text-sm text-[#FBF8F1]">Easy Returns Policy</h4>
              <p className="text-[11px] text-[#FBF8F1]/70">Hassle-free 7-day returns</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-[#D4AF37]/20 text-[#D4AF37]">
              <Headphones className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-xs sm:text-sm text-[#FBF8F1]">24x7 Customer Support</h4>
              <p className="text-[11px] text-[#FBF8F1]/70">Instant live assistance</p>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Main Footer Links Columns */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-12 grid grid-cols-2 md:grid-cols-5 gap-8 text-xs">
        
        {/* Brand Column */}
        <div className="col-span-2 space-y-4">
          <a href="#" className="inline-block">
            <span className="font-['Outfit'] font-extrabold text-2xl text-[#FBF8F1] tracking-tight">
              Mytri<span className="text-[#D4AF37]">Kart</span>
            </span>
          </a>
          <p className="text-[#FBF8F1]/80 max-w-sm leading-relaxed">
            The next-generation multi-vendor marketplace connecting premier brands, artisan creators, and millions of shoppers with gold-standard convenience.
          </p>

          {/* Become a Seller Banner CTA */}
          <div className="bg-[#155440] p-4 rounded-2xl border border-[#D4AF37]/30 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Store className="w-6 h-6 text-[#D4AF37]" />
              <div>
                <h5 className="font-bold text-sm text-[#FBF8F1]">Sell on MytriKart</h5>
                <p className="text-[10px] text-[#FBF8F1]/70">Reach millions of buyers today</p>
              </div>
            </div>
            <a
              href="#seller-register"
              onClick={(e) => { e.preventDefault(); alert("Redirecting to Seller Registration Hub..."); }}
              className="px-3 py-1.5 bg-[#D4AF37] hover:bg-[#E3BE46] text-[#0F3D2E] font-bold text-xs rounded-xl transition-all shadow-xs flex items-center space-x-1"
            >
              <span>Join Now</span>
              <ArrowRight className="w-3 h-3" />
            </a>
          </div>
        </div>

        {/* Column 1: About */}
        <div className="space-y-3">
          <h4 className="font-bold text-sm text-[#D4AF37] uppercase tracking-wider">About Us</h4>
          <ul className="space-y-2 text-[#FBF8F1]/80">
            <li><a href="#about" className="hover:text-[#D4AF37] transition-colors">Company Info</a></li>
            <li><a href="#careers" className="hover:text-[#D4AF37] transition-colors">Careers</a></li>
            <li><a href="#press" className="hover:text-[#D4AF37] transition-colors">Press & Media</a></li>
            <li><a href="#sustainability" className="hover:text-[#D4AF37] transition-colors">Sustainability</a></li>
          </ul>
        </div>

        {/* Column 2: Help & Support */}
        <div className="space-y-3">
          <h4 className="font-bold text-sm text-[#D4AF37] uppercase tracking-wider">Help & Support</h4>
          <ul className="space-y-2 text-[#FBF8F1]/80">
            <li><a href="#payments" className="hover:text-[#D4AF37] transition-colors">Payments & EMI</a></li>
            <li><a href="#shipping" className="hover:text-[#D4AF37] transition-colors">Shipping & Delivery</a></li>
            <li><a href="#returns" className="hover:text-[#D4AF37] transition-colors">Cancellation & Returns</a></li>
            <li><a href="#faq" className="hover:text-[#D4AF37] transition-colors">FAQs</a></li>
          </ul>
        </div>

        {/* Column 3: Policy */}
        <div className="space-y-3">
          <h4 className="font-bold text-sm text-[#D4AF37] uppercase tracking-wider">Consumer Policy</h4>
          <ul className="space-y-2 text-[#FBF8F1]/80">
            <li><a href="#privacy" className="hover:text-[#D4AF37] transition-colors">Privacy Policy</a></li>
            <li><a href="#terms" className="hover:text-[#D4AF37] transition-colors">Terms of Use</a></li>
            <li><a href="#security" className="hover:text-[#D4AF37] transition-colors">Security</a></li>
            <li><a href="#sitemap" className="hover:text-[#D4AF37] transition-colors">Sitemap</a></li>
          </ul>
        </div>

      </div>

      {/* 3. Bottom Bar Copyright */}
      <div className="border-t border-[#FBF8F1]/10 bg-[#0A2A1F] py-4 px-4 text-center text-[11px] text-[#FBF8F1]/60">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>© 2026 MytriKart Marketplace Inc. All rights reserved. Visual Concept Prototype.</p>
          <div className="flex space-x-4">
            <span className="text-[#D4AF37]">Emerald & Gold Theme Concept</span>
            <span>•</span>
            <span>Design-Only Preview</span>
          </div>
        </div>
      </div>

    </footer>
  );
}
