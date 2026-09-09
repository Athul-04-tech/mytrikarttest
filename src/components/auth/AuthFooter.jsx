import React from 'react';
import { ShieldCheck } from 'lucide-react';

export default function AuthFooter() {
  return (
    <footer className="bg-[#0A2A1F] text-[#FFFFFF]/70 border-t border-[#FF811A]/30 py-4 px-4 sm:px-8 text-xs">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
        
        {/* Security Assurance */}
        <div className="flex items-center space-x-1.5 text-[#FF811A]">
          <ShieldCheck className="w-4 h-4" />
          <span className="font-semibold text-[11px] text-[#FFFFFF]/90">
            256-Bit SSL Encrypted & Protected
          </span>
        </div>

        {/* Minimal Legal Links */}
        <div className="flex items-center space-x-5 text-[11px]">
          <a href="#help" className="hover:text-[#FF811A] transition-colors">Help Center</a>
          <span>•</span>
          <a href="#privacy" className="hover:text-[#FF811A] transition-colors">Privacy Policy</a>
          <span>•</span>
          <a href="#terms" className="hover:text-[#FF811A] transition-colors">Terms of Service</a>
        </div>

        {/* Copyright */}
        <p className="text-[10px] text-[#FFFFFF]/50">
          © 2026 MytriKart Marketplace Inc.
        </p>

      </div>
    </footer>
  );
}
