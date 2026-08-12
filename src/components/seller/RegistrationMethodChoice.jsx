import React from 'react';
import { Mail, Smartphone, ArrowRight, Sparkles, CheckCircle2, ShieldCheck, TrendingUp, Store } from 'lucide-react';

export default function RegistrationMethodChoice({ onSelectMethod, onGoToSellerLogin }) {
  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 animate-reveal">
      
      {/* Top Banner / Hero Intro */}
      <div className="text-center max-w-2xl mx-auto mb-10">
        <div className="inline-flex items-center space-x-1.5 bg-[#FCF7E8] text-[#0F3D2E] border border-[#D4AF37] px-3.5 py-1 rounded-full text-xs font-bold mb-3 shadow-2xs">
          <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
          <span>JOIN 50,000+ VERIFIED MERCHANTS & ARTISANS</span>
        </div>
        
        <h1 className="font-['Outfit'] text-3xl sm:text-4xl font-extrabold text-[#0F3D2E] tracking-tight">
          Start Selling on MytriKart
        </h1>
        <p className="text-xs sm:text-sm text-[#5C6B63] mt-2 leading-relaxed">
          Choose your preferred registration method to initiate your marketplace store setup with 0% onboarding fee.
        </p>
      </div>

      {/* Registration Choice Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-10">
        
        {/* Option 1: Email Registration */}
        <div 
          onClick={() => onSelectMethod('email')}
          className="p-6 rounded-3xl bg-white border-2 border-[#D8E0DC] hover:border-[#0F3D2E] shadow-xs card-interactive flex flex-col justify-between cursor-pointer group"
        >
          <div>
            <div className="w-12 h-12 rounded-2xl bg-[#E8F2EE] text-[#0F3D2E] flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Mail className="w-6 h-6" />
            </div>

            <h3 className="font-['Outfit'] text-xl font-bold text-[#0F3D2E] group-hover:text-[#155440] transition-colors">
              Register with Corporate Email
            </h3>
            <p className="text-xs text-[#5C6B63] mt-1.5 leading-relaxed">
              Recommended for registered companies and enterprises. Receive tax invoices and compliance digests directly.
            </p>
          </div>

          <button
            type="button"
            className="mt-6 w-full py-3 bg-[#0F3D2E] hover:bg-[#155440] text-[#FBF8F1] rounded-xl text-xs font-bold btn-interactive flex items-center justify-center space-x-1.5 shadow-sm cursor-pointer"
          >
            <span>Continue with Email</span>
            <ArrowRight className="w-4 h-4 text-[#D4AF37] icon-interactive" />
          </button>
        </div>

        {/* Option 2: Mobile Number Registration */}
        <div 
          onClick={() => onSelectMethod('mobile')}
          className="p-6 rounded-3xl bg-white border-2 border-[#D8E0DC] hover:border-[#D4AF37] shadow-xs card-interactive flex flex-col justify-between cursor-pointer group"
        >
          <div>
            <div className="w-12 h-12 rounded-2xl bg-[#FCF7E8] text-[#0F3D2E] flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Smartphone className="w-6 h-6 text-[#D4AF37]" />
            </div>

            <h3 className="font-['Outfit'] text-xl font-bold text-[#0F3D2E] group-hover:text-[#155440] transition-colors">
              Register with Mobile & OTP
            </h3>
            <p className="text-xs text-[#5C6B63] mt-1.5 leading-relaxed">
              Instant mobile onboarding for sole proprietors and independent artisans. Verify in under 30 seconds via SMS OTP.
            </p>
          </div>

          <button
            type="button"
            className="mt-6 w-full py-3 bg-[#FCF7E8] hover:bg-[#D4AF37]/30 text-[#0F3D2E] border border-[#D4AF37] rounded-xl text-xs font-bold btn-interactive flex items-center justify-center space-x-1.5 shadow-2xs cursor-pointer"
          >
            <span>Continue with Mobile</span>
            <ArrowRight className="w-4 h-4 text-[#0F3D2E] icon-interactive" />
          </button>
        </div>

      </div>

      {/* Social Login Options */}
      <div className="bg-white border border-[#D8E0DC] rounded-3xl p-6 shadow-xs text-center max-w-xl mx-auto">
        <span className="text-xs font-bold text-[#5C6B63] uppercase tracking-wider block mb-4">
          Or Quick Onboard via Verified Business Profile
        </span>

        <div className="grid grid-cols-2 gap-3">
          {/* Google */}
          <button
            type="button"
            onClick={() => onSelectMethod('social-google')}
            className="py-3 px-4 bg-[#FBF8F1] hover:bg-[#FCF7E8] text-[#0F3D2E] border border-[#D8E0DC] hover:border-[#D4AF37] rounded-xl text-xs font-bold btn-interactive flex items-center justify-center space-x-2 cursor-pointer shadow-2xs"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
            </svg>
            <span>Google Workspace</span>
          </button>

          {/* Facebook */}
          <button
            type="button"
            onClick={() => onSelectMethod('social-facebook')}
            className="py-3 px-4 bg-[#FBF8F1] hover:bg-[#FCF7E8] text-[#0F3D2E] border border-[#D8E0DC] hover:border-[#D4AF37] rounded-xl text-xs font-bold btn-interactive flex items-center justify-center space-x-2 cursor-pointer shadow-2xs"
          >
            <svg className="w-4 h-4 fill-[#1877F2]" viewBox="0 0 24 24">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
            </svg>
            <span>Meta for Business</span>
          </button>
        </div>
      </div>

    </div>
  );
}
