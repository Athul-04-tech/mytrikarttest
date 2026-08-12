import React from 'react';
import { RotateCcw, CheckCircle2, Clock, Wallet, CreditCard, ArrowRight } from 'lucide-react';
import { MOCK_REFUNDS } from '../../data/profileMockData';

const REFUND_STEPS = ["Requested", "Approved", "Processing", "Completed"];

export default function RefundsSection() {
  return (
    <div className="bg-white rounded-3xl border border-[#D8E0DC] p-6 sm:p-8 lg:p-10 shadow-xs animate-reveal">
      
      {/* Header */}
      <div className="pb-6 border-b border-[#D8E0DC]">
        <h2 className="font-['Outfit'] text-2xl sm:text-3xl font-extrabold text-[#0F3D2E] tracking-tight">
          Refunds & Returns
        </h2>
        <p className="text-xs sm:text-sm text-[#5C6B63] mt-1">
          Monitor your active reimbursement requests, payment timelines, and credit statements
        </p>
      </div>

      {/* Refunds List */}
      <div className="mt-8 space-y-6">
        {MOCK_REFUNDS.map((ref) => (
          <div
            key={ref.id}
            className="border border-[#D8E0DC] rounded-2xl overflow-hidden bg-[#FBF8F1]/40 p-5 sm:p-6"
          >
            {/* Top Bar: Refund ID & Amount */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-[#D8E0DC]">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-extrabold text-[#0F3D2E]">
                    Refund ID: {ref.id}
                  </span>
                  <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded uppercase tracking-wider ${
                    ref.status === 'Completed'
                      ? 'bg-[#E8F2EE] text-[#0F3D2E] border border-[#0F3D2E]/20'
                      : 'bg-[#FCF7E8] text-[#0F3D2E] border border-[#D4AF37]'
                  }`}>
                    {ref.status}
                  </span>
                </div>
                <p className="text-xs text-[#5C6B63] mt-0.5">
                  Linked Order: <strong className="text-[#0F3D2E]">#{ref.orderId}</strong> — {ref.productName}
                </p>
              </div>

              <div className="text-left sm:text-right">
                <span className="text-base sm:text-lg font-black text-[#0F3D2E]">
                  {ref.amount}
                </span>
                <p className="text-[11px] text-[#5C6B63]">
                  To: <strong className="text-[#0F3D2E]">{ref.destination}</strong>
                </p>
              </div>
            </div>

            {/* Stepped Timeline Tracker */}
            <div className="py-6 px-2 sm:px-6">
              <div className="relative">
                {/* Track Line */}
                <div className="absolute top-1/2 left-3 right-3 h-1 bg-[#D8E0DC] -translate-y-1/2 z-0" />
                <div 
                  className="absolute top-1/2 left-3 h-1 bg-[#0F3D2E] -translate-y-1/2 z-0 transition-all duration-500"
                  style={{ width: `${((ref.timelineStep - 1) / (REFUND_STEPS.length - 1)) * 95}%` }}
                />

                {/* Nodes */}
                <div className="relative z-10 flex items-center justify-between">
                  {REFUND_STEPS.map((step, idx) => {
                    const stepNum = idx + 1;
                    const isDone = stepNum <= ref.timelineStep;

                    return (
                      <div key={idx} className="flex flex-col items-center">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                          isDone
                            ? 'bg-[#0F3D2E] text-[#D4AF37] ring-4 ring-[#FCF7E8]'
                            : 'bg-[#D8E0DC] text-[#5C6B63]'
                        }`}>
                          {isDone ? <CheckCircle2 className="w-4 h-4" /> : stepNum}
                        </div>
                        <span className={`text-[10px] sm:text-[11px] font-bold mt-2 text-center ${
                          isDone ? 'text-[#0F3D2E]' : 'text-[#5C6B63]/60'
                        }`}>
                          {step}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Bottom Meta */}
            <div className="bg-white p-3 rounded-xl border border-[#D8E0DC] text-xs text-[#5C6B63] flex flex-wrap items-center justify-between gap-2">
              <span>Initiated on: <strong className="text-[#0F3D2E]">{ref.requestDate}</strong></span>
              <span>
                {ref.status === 'Completed' ? (
                  <>Credited on: <strong className="text-[#0F3D2E]">{ref.completedDate}</strong></>
                ) : (
                  <>Expected by: <strong className="text-[#0F3D2E]">{ref.estimatedCompletion}</strong></>
                )}
              </span>
            </div>

          </div>
        ))}
      </div>

    </div>
  );
}
