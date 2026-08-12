import React from 'react';
import { Check, Sparkles, ShieldCheck } from 'lucide-react';

export const SELLER_STEPS = [
  { step: 1, label: 'Personal', title: 'Personal Information' },
  { step: 2, label: 'Business', title: 'Business Details' },
  { step: 3, label: 'Store', title: 'Store Profile & Slug' },
  { step: 4, label: 'Contact', title: 'Support & Socials' },
  { step: 5, label: 'Payment', title: 'Bank & Payout Setup' },
  { step: 6, label: 'Verification', title: 'Identity Documents' },
  { step: 7, label: 'Agreement', title: 'Legal Declarations' }
];

export default function SellerProgressStepper({ currentStep, onJumpToStep }) {
  const currentStepMeta = SELLER_STEPS.find(s => s.step === currentStep) || SELLER_STEPS[0];
  const progressPercent = ((currentStep - 1) / (SELLER_STEPS.length - 1)) * 100;

  return (
    <div className="bg-white border-b border-[#D8E0DC] py-4 px-4 sm:px-8 shadow-xs sticky top-[57px] z-30">
      <div className="max-w-7xl mx-auto">
        
        {/* Top Info Row: Current Step Title + Auto-Save Indicator */}
        <div className="flex items-center justify-between text-xs mb-3">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-[#0F3D2E] text-xs sm:text-sm">
              Step {currentStep} of {SELLER_STEPS.length}:
            </span>
            <span className="font-extrabold text-[#D4AF37] text-xs sm:text-sm">
              {currentStepMeta.title}
            </span>
          </div>

          <div className="flex items-center space-x-2 text-[11px] text-[#5C6B63]">
            <span className="inline-block w-2 h-2 rounded-full bg-[#155440] animate-pulse" />
            <span className="hidden sm:inline font-medium">Draft auto-saved to Cloud Vault</span>
            <span className="sm:hidden font-medium">Auto-saved</span>
          </div>
        </div>

        {/* MOBILE VIEW (<640px): Compact Progress Bar */}
        <div className="sm:hidden w-full h-2 bg-[#E8F2EE] rounded-full overflow-hidden p-0.5 border border-[#D8E0DC]/60">
          <div 
            className="h-full bg-gradient-to-r from-[#0F3D2E] to-[#D4AF37] rounded-full transition-all duration-300 shadow-2xs"
            style={{ width: `${Math.max(progressPercent, 14)}%` }}
          />
        </div>

        {/* DESKTOP / TABLET VIEW (641px+): Full Numbered Stepper */}
        <div className="hidden sm:block relative my-2 px-2 lg:px-6">
          {/* Background Track Line */}
          <div className="absolute top-1/2 left-8 right-8 h-1 bg-[#E8F2EE] -translate-y-1/2 z-0 rounded-full" />
          
          {/* Active Fill Line */}
          <div 
            className="absolute top-1/2 left-8 h-1 bg-gradient-to-r from-[#0F3D2E] via-[#16523F] to-[#D4AF37] -translate-y-1/2 z-0 transition-all duration-300 rounded-full shadow-2xs"
            style={{ width: `${(progressPercent / 100) * 88}%` }}
          />

          {/* Stepper Nodes */}
          <div className="relative z-10 flex items-center justify-between">
            {SELLER_STEPS.map((s) => {
              const isCompleted = s.step < currentStep;
              const isCurrent = s.step === currentStep;
              const isUpcoming = s.step > currentStep;
              const isClickable = s.step <= currentStep;

              return (
                <button
                  key={s.step}
                  type="button"
                  onClick={() => isClickable && onJumpToStep(s.step)}
                  disabled={!isClickable}
                  className={`flex flex-col items-center group focus:outline-none transition-all ${
                    isClickable ? 'cursor-pointer' : 'cursor-default'
                  }`}
                  aria-current={isCurrent ? 'step' : undefined}
                >
                  {/* Step Circle Badge */}
                  <div className={`w-8 h-8 lg:w-9 lg:h-9 rounded-full flex items-center justify-center text-xs font-black transition-all duration-200 ${
                    isCompleted
                      ? 'bg-[#0F3D2E] text-[#D4AF37] shadow-sm hover:scale-110 ring-2 ring-[#D4AF37]'
                      : isCurrent
                      ? 'bg-[#D4AF37] text-[#0F3D2E] ring-4 ring-[#FCF7E8] shadow-md scale-110'
                      : 'bg-white text-[#5C6B63] border-2 border-[#D8E0DC]'
                  }`}>
                    {isCompleted ? (
                      <Check className="w-4 h-4 stroke-[3]" />
                    ) : (
                      <span>{s.step}</span>
                    )}
                  </div>

                  {/* Label */}
                  <span className={`text-[11px] font-bold mt-1.5 whitespace-nowrap transition-colors ${
                    isCurrent
                      ? 'text-[#0F3D2E]'
                      : isCompleted
                      ? 'text-[#0F3D2E]/80 group-hover:text-[#0F3D2E]'
                      : 'text-[#5C6B63]/60'
                  }`}>
                    {s.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}
