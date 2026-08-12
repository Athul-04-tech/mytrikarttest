import React, { useState } from 'react';
import { UserCheck, Sparkles, ArrowRight, X, ShieldCheck } from 'lucide-react';

export default function ProfileCompletionBanner({ onCompleteProfile }) {
  const [isDismissed, setIsDismissed] = useState(false);

  if (isDismissed) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 pt-3 animate-reveal">
      <div className="bg-[#FCF7E8] border border-[#D4AF37]/50 border-l-4 border-l-[#D4AF37] rounded-2xl p-4 sm:p-4.5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative transition-all duration-300">
        
        <div className="flex items-start sm:items-center space-x-3.5">
          <div className="p-2 rounded-xl bg-[#0F3D2E] text-[#D4AF37] shrink-0">
            <UserCheck className="w-5 h-5 icon-interactive" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h4 className="font-['Outfit'] font-extrabold text-sm sm:text-base text-[#0F3D2E]">
                Complete your profile to unlock the full experience
              </h4>
              <span className="text-[10px] font-extrabold uppercase bg-[#0F3D2E] text-[#D4AF37] px-2 py-0.5 rounded-full shadow-2xs">
                60% Complete
              </span>
            </div>
            <p className="text-xs text-[#5C6B63] mt-0.5">
              Add your secondary delivery address and business tax credentials for instant 1-click checkout and VAT invoicing.
            </p>
          </div>
        </div>

        {/* Progress Bar & CTA Row */}
        <div className="flex items-center space-x-3 shrink-0 self-end sm:self-auto">
          {/* Progress Bar */}
          <div className="hidden md:block w-24 h-2 bg-[#E8F2EE] rounded-full overflow-hidden border border-[#D8E0DC]">
            <div className="h-full bg-gradient-to-r from-[#D4AF37] to-[#0F3D2E] w-[60%] rounded-full" />
          </div>

          <button
            type="button"
            onClick={onCompleteProfile}
            className="px-4 py-2 bg-[#0F3D2E] hover:bg-[#155440] text-[#FBF8F1] text-xs font-bold rounded-xl btn-interactive flex items-center space-x-1.5 shadow-xs cursor-pointer"
          >
            <span>Complete Now</span>
            <ArrowRight className="w-3.5 h-3.5 text-[#D4AF37] icon-interactive" />
          </button>

          {/* Dismiss Button */}
          <button
            type="button"
            onClick={() => setIsDismissed(true)}
            className="p-1 text-[#5C6B63] hover:text-[#0F3D2E] icon-interactive cursor-pointer"
            aria-label="Dismiss profile completion prompt"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
}
