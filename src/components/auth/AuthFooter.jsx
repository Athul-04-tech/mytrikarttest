import React from 'react';
import { ShieldCheck } from 'lucide-react';

export default function AuthFooter() {
  return (
    <footer className="bg-[#0A2A1F] text-[#FBF8F1]/70 border-t border-[#D4AF37]/30 py-4 px-4 sm:px-8 text-xs">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
        
        {/* Security Assurance */}
        <div className="flex items-center space-x-1.5 text-[#D4AF37]">
          <ShieldCheck className="w-4 h-4" />
          <span className="font-semibold text-[11px] text-[#FBF8F1]/90">
            256-Bit SSL Encrypted & Protected
          </span>
        </div>

        {/* Minimal Legal Links */}
        <div className="flex items-center space-x-5 text-[11px]">
          <a href="#help" className="hover:text-[#D4AF37] transition-colors">Help Center</a>
          <span>•</span>
          <a href="#privacy" className="hover:text-[#D4AF37] transition-colors">Privacy Policy</a>
          <span>•</span>
          <a href="#terms" className="hover:text-[#D4AF37] transition-colors">Terms of Service</a>
        </div>

        {/* Copyright */}
        <p className="text-[10px] text-[#FBF8F1]/50">
          © 2026 MytriKart Marketplace Inc.
        </p>

      </div>
    </footer>
  );
}
