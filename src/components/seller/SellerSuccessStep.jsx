import React from 'react';
import { 
  CheckCircle2, 
  Clock, 
  Store, 
  ArrowRight, 
  FileText, 
  Sparkles, 
  ShieldCheck, 
  ExternalLink,
  HelpCircle
} from 'lucide-react';

const WORKFLOW_JOURNEY = [
  { step: 1, label: 'Registration Submitted', status: 'completed', desc: 'All 7 modules recorded' },
  { step: 2, label: 'Email & Phone Verified', status: 'completed', desc: 'Dual 2FA validated' },
  { step: 3, label: 'Compliance & Admin Review', status: 'active', desc: 'Under review (24-48 hrs)' },
  { step: 4, label: 'Store Approved & Live', status: 'upcoming', desc: 'Product upload unlocks' }
];

export default function SellerSuccessStep({ formData, onBackToHome, onOpenDashboardPreview }) {
  const applicationId = "MK-VND-89421";

  return (
    <div className="max-w-3xl mx-auto py-10 px-4 sm:px-6 animate-reveal">
      
      {/* Central Success Badge */}
      <div className="text-center">
        <div className="relative inline-block">
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-br from-[#0F3D2E] to-[#16523F] text-[#D4AF37] mx-auto flex items-center justify-center shadow-xl border-4 border-[#FCF7E8]">
            <CheckCircle2 className="w-10 h-10 sm:w-12 sm:h-12" />
          </div>
          <div className="absolute -bottom-1 -right-1 bg-[#D4AF37] p-1.5 rounded-full text-[#0F3D2E] shadow-xs">
            <Sparkles className="w-4 h-4" />
          </div>
        </div>

        <h1 className="font-['Outfit'] text-3xl sm:text-4xl font-black text-[#0F3D2E] tracking-tight mt-6">
          Registration Submitted!
        </h1>
        <p className="text-xs sm:text-sm text-[#5C6B63] mt-2 max-w-md mx-auto leading-relaxed">
          Your vendor application for <strong className="text-[#0F3D2E]">{formData.storeName || 'Your Store'}</strong> has been assigned tracking reference <strong className="text-[#0F3D2E] font-mono">{applicationId}</strong>.
        </p>
      </div>

      {/* Visual Stepper: Larger Journey */}
      <div className="my-8 p-6 sm:p-8 bg-white border border-[#D8E0DC] rounded-3xl shadow-sm">
        <h3 className="text-xs font-extrabold uppercase tracking-widest text-[#0F3D2E] mb-6 flex items-center justify-between">
          <span>Onboarding Progress Tracker</span>
          <span className="text-[#D4AF37] font-bold">Stage 3 of 4</span>
        </h3>

        <div className="relative">
          {/* Progress Bar background line */}
          <div className="hidden sm:block absolute top-5 left-10 right-10 h-1 bg-[#E8F2EE] -translate-y-1/2 z-0" />
          <div className="hidden sm:block absolute top-5 left-10 w-[60%] h-1 bg-gradient-to-r from-[#0F3D2E] to-[#D4AF37] -translate-y-1/2 z-0" />

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-6 relative z-10">
            {WORKFLOW_JOURNEY.map((item) => {
              const isCompleted = item.status === 'completed';
              const isActive = item.status === 'active';

              return (
                <div key={item.step} className="flex sm:flex-col items-center sm:text-center space-x-3 sm:space-x-0">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-black shrink-0 transition-all ${
                    isCompleted
                      ? 'bg-[#0F3D2E] text-[#D4AF37] ring-4 ring-[#FCF7E8] shadow-xs'
                      : isActive
                      ? 'bg-[#D4AF37] text-[#0F3D2E] ring-4 ring-[#FCF7E8] shadow-md animate-pulse scale-110'
                      : 'bg-[#FBF8F1] text-[#5C6B63] border-2 border-[#D8E0DC]'
                  }`}>
                    {isCompleted ? (
                      <CheckCircle2 className="w-5 h-5" />
                    ) : isActive ? (
                      <Clock className="w-5 h-5" />
                    ) : (
                      <span>{item.step}</span>
                    )}
                  </div>

                  <div className="sm:mt-3">
                    <h4 className={`text-xs font-extrabold ${isActive ? 'text-[#0F3D2E]' : isCompleted ? 'text-[#0F3D2E]/80' : 'text-[#5C6B63]'}`}>
                      {item.label}
                    </h4>
                    <p className="text-[10px] text-[#5C6B63] mt-0.5">
                      {item.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Outcome Explanation Card */}
      <div className="bg-[#FBF8F1] border border-[#D8E0DC] rounded-3xl p-6 mb-8 text-xs text-[#5C6B63] space-y-3 leading-relaxed">
        <h4 className="font-['Outfit'] font-bold text-sm text-[#0F3D2E] flex items-center space-x-2">
          <ShieldCheck className="w-4 h-4 text-[#D4AF37]" />
          <span>What Happens Next?</span>
        </h4>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <div className="p-3.5 rounded-2xl bg-white border border-[#D8E0DC]">
            <span className="font-extrabold text-[#0F3D2E] block text-xs">✓ When Approved:</span>
            <p className="text-[11px] mt-1 text-[#5C6B63]">
              You will receive an official activation email with your Seller Hub credentials. You can immediately list products, configure courier pickups, and start selling.
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-white border border-[#D8E0DC]">
            <span className="font-extrabold text-[#C0392B] block text-xs">ℹ If Re-submission Needed:</span>
            <p className="text-[11px] mt-1 text-[#5C6B63]">
              If a document scan is blurred or tax details require clarification, our compliance team will send a secure 1-click re-upload link with specific feedback.
            </p>
          </div>
        </div>
      </div>

      {/* Action Buttons Tray */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
        <button
          type="button"
          onClick={onOpenDashboardPreview || (() => alert("Opening Seller Dashboard Demo Preview..."))}
          className="w-full sm:w-auto px-6 py-3.5 bg-[#0F3D2E] hover:bg-[#155440] text-[#FBF8F1] rounded-xl text-xs font-bold btn-interactive flex items-center justify-center space-x-2 shadow-md cursor-pointer"
        >
          <Store className="w-4 h-4 text-[#D4AF37]" />
          <span>Explore Seller Hub Preview</span>
          <ArrowRight className="w-4 h-4 text-[#D4AF37] icon-interactive" />
        </button>

        <button
          type="button"
          onClick={onBackToHome}
          className="w-full sm:w-auto px-6 py-3.5 bg-white hover:bg-[#FCF7E8] text-[#0F3D2E] border border-[#D8E0DC] hover:border-[#D4AF37] rounded-xl text-xs font-bold btn-interactive flex items-center justify-center space-x-2 cursor-pointer shadow-2xs"
        >
          <span>Return to Marketplace Homepage</span>
        </button>
      </div>

    </div>
  );
}
