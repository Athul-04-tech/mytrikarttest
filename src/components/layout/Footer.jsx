import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
  const navigate = useNavigate();
  return (
    <footer className="bg-[#1A1A1A] text-[#FFFFFF] border-t-4 border-[#FF811A] mt-12">
      
      {/* 1. Value Proposition Guarantees Band */}
      <div className="border-b border-[#FFFFFF]/10 py-8 px-4 sm:px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-[#FF811A]/20 text-[#FF811A]">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-xs sm:text-sm text-[#FFFFFF]">100% Genuine Products</h4>
              <p className="text-[11px] text-[#FFFFFF]/70">Verified marketplace sellers</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-[#FF811A]/20 text-[#FF811A]">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-xs sm:text-sm text-[#FFFFFF]">Express Delivery</h4>
              <p className="text-[11px] text-[#FFFFFF]/70">Fast tracking to your door</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-[#FF811A]/20 text-[#FF811A]">
              <RotateCcw className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-xs sm:text-sm text-[#FFFFFF]">Easy Returns Policy</h4>
              <p className="text-[11px] text-[#FFFFFF]/70">Hassle-free 7-day returns</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-[#FF811A]/20 text-[#FF811A]">
              <Headphones className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-xs sm:text-sm text-[#FFFFFF]">24x7 Customer Support</h4>
              <p className="text-[11px] text-[#FFFFFF]/70">Instant live assistance</p>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Main Footer Links Columns */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-12 grid grid-cols-2 md:grid-cols-5 gap-8 text-xs">
        
        {/* Brand Column */}
        <div className="col-span-2 space-y-4">
          <Link to="/" className="inline-block bg-white rounded-lg p-1.5 max-w-[220px]">
            <img 
              src="/mytrikart-logo.png" 
              alt="MytriKart Logo" 
              className="h-9 w-auto object-contain" 
            />
          </Link>
          <p className="text-[#FFFFFF]/80 max-w-sm leading-relaxed">
            The next-generation multi-vendor marketplace connecting premier brands, artisan creators, and millions of shoppers with gold-standard convenience.
          </p>

          {/* Become a Seller Banner CTA */}
          <div className="bg-[#E0530B] p-4 rounded-2xl border border-[#FF811A]/30 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Store className="w-6 h-6 text-[#FF811A]" />
              <div>
                <h5 className="font-bold text-sm text-[#FFFFFF]">Sell on MytriKart</h5>
                <p className="text-[10px] text-[#FFFFFF]/70">Reach millions of buyers today</p>
              </div>
            </div>
            <Link
              to="/seller/register"
              className="px-3 py-1.5 bg-[#FF811A] hover:bg-[#E3BE46] text-[#FA661C] font-bold text-xs rounded-xl transition-all shadow-xs flex items-center space-x-1"
            >
              <span>Join Now</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* Column 1: About */}
        <div className="space-y-3">
          <h4 className="font-bold text-sm text-[#FF811A] uppercase tracking-wider">About Us</h4>
          <ul className="space-y-2 text-[#FFFFFF]/80">
            <li><Link to="/" className="hover:text-[#FF811A] transition-colors">Company Info</Link></li>
            <li><Link to="/" className="hover:text-[#FF811A] transition-colors">Careers</Link></li>
            <li><Link to="/" className="hover:text-[#FF811A] transition-colors">Press &amp; Media</Link></li>
            <li><Link to="/" className="hover:text-[#FF811A] transition-colors">Sustainability</Link></li>
          </ul>
        </div>

        {/* Column 2: Help & Support */}
        <div className="space-y-3">
          <h4 className="font-bold text-sm text-[#FF811A] uppercase tracking-wider">Help &amp; Support</h4>
          <ul className="space-y-2 text-[#FFFFFF]/80">
            <li><Link to="/profile/wallet" className="hover:text-[#FF811A] transition-colors">Payments &amp; EMI</Link></li>
            <li><Link to="/profile/support" className="hover:text-[#FF811A] transition-colors">Shipping &amp; Delivery</Link></li>
            <li><Link to="/profile/refunds" className="hover:text-[#FF811A] transition-colors">Cancellation &amp; Returns</Link></li>
            <li><Link to="/profile/support" className="hover:text-[#FF811A] transition-colors">FAQs</Link></li>
          </ul>
        </div>

        {/* Column 3: Policy */}
        <div className="space-y-3">
          <h4 className="font-bold text-sm text-[#FF811A] uppercase tracking-wider">Consumer Policy</h4>
          <ul className="space-y-2 text-[#FFFFFF]/80">
            <li><Link to="/profile/settings" className="hover:text-[#FF811A] transition-colors">Privacy Policy</Link></li>
            <li><Link to="/profile/settings" className="hover:text-[#FF811A] transition-colors">Terms of Use</Link></li>
            <li><Link to="/profile/settings" className="hover:text-[#FF811A] transition-colors">Security</Link></li>
            <li><Link to="/" className="hover:text-[#FF811A] transition-colors">Sitemap</Link></li>
          </ul>
        </div>

      </div>

      {/* 3. Bottom Bar Copyright */}
      <div className="border-t border-[#FFFFFF]/10 bg-[#0A2A1F] py-4 px-4 text-center text-[11px] text-[#FFFFFF]/60">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>© 2026 MytriKart Marketplace Inc. All rights reserved. Visual Concept Prototype.</p>
          <div className="flex space-x-4">
            <span className="text-[#FF811A]">Emerald & Gold Theme Concept</span>
            <span>•</span>
            <span>Design-Only Preview</span>
          </div>
        </div>
      </div>

    </footer>
  );
}
