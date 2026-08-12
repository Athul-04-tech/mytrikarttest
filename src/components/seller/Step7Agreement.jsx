import React, { useState } from 'react';
import { 
  FileCheck2, 
  ExternalLink, 
  ShieldCheck, 
  ArrowRight, 
  ArrowLeft, 
  CheckCircle2, 
  Check, 
  Lock, 
  Sparkles,
  X
} from 'lucide-react';

const AGREEMENTS = [
  {
    id: 'terms',
    title: 'Marketplace Terms & Conditions',
    desc: 'Seller conduct, catalog compliance, intellectual property protection, and customer service SLAs.',
    snippet: 'By operating a storefront on MytriKart, you agree to fulfill authentic products within specified dispatch windows, honor statutory warranty commitments, and maintain a minimum customer satisfaction rating of 90%.'
  },
  {
    id: 'privacy',
    title: 'Data Protection & Privacy Policy',
    desc: 'GDPR / Digital Personal Data Protection Act compliance governing buyer address confidentiality.',
    snippet: 'Seller agrees not to harvest, export, or utilize customer contact numbers, physical addresses, or transaction histories for external marketing or unsolicited off-platform solicitations.'
  },
  {
    id: 'vendor',
    title: 'Master Vendor & Settlement Agreement',
    desc: 'Commission schedule, payout cycles, standard return windows, and marketplace handling fees.',
    snippet: 'MytriKart applies standard 0% onboarding fee with transparent category-based commissions deducted automatically upon order completion and return window clearance.'
  },
  {
    id: 'tax',
    title: 'Statutory Tax & GSTIN Declaration',
    desc: 'Affidavit affirming accurate GST/VAT liability remittance on all fulfilled commercial consignments.',
    snippet: 'Seller certifies that all tax registration numbers, GSTIN credentials, and TIN identifications submitted are genuine, current, and will be reconciled on all generated invoices.'
  }
];

export default function Step7Agreement({ formData, updateFormData, onSubmitRegistration, onBack }) {
  const [accepted, setAccepted] = useState(formData.acceptedTerms || false);
  const [activeModalDoc, setActiveModalDoc] = useState(null);
  const [hasError, setHasError] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!accepted) {
      setHasError(true);
      return;
    }
    updateFormData({ acceptedTerms: true });
    onSubmitRegistration();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 animate-reveal">
      
      {/* Step Header */}
      <div>
        <h2 className="font-['Outfit'] text-2xl sm:text-3xl font-extrabold text-[#0F3D2E] tracking-tight">
          Legal Agreement & Declaration
        </h2>
        <p className="text-xs sm:text-sm text-[#5C6B63] mt-1">
          Review standard marketplace governance charters, return policies, and statutory tax representations
        </p>
      </div>

      {/* Summary Recap Card */}
      <div className="p-4 rounded-2xl bg-[#FCF7E8] border border-[#D4AF37]/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-[#0F3D2E]">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-xl bg-[#0F3D2E] text-[#D4AF37]">
            <Store className="w-5 h-5" />
          </div>
          <div>
            <span className="font-bold block text-sm">
              Storefront: {formData.storeName || 'Your Brand'}
            </span>
            <span className="text-[11px] text-[#5C6B63] font-mono">
              mytrikart.com/stores/{formData.storeSlug || 'slug'} • {formData.businessType || 'Proprietorship'}
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-1.5 text-[11px] font-bold text-[#0F3D2E] bg-white px-3 py-1.5 rounded-xl border border-[#D8E0DC]">
          <ShieldCheck className="w-4 h-4 text-[#D4AF37]" />
          <span>7 of 7 Steps Ready for Review</span>
        </div>
      </div>

      {/* Agreement Documents List */}
      <div className="space-y-3">
        <label className="block text-xs font-bold uppercase tracking-wider text-[#0F3D2E]">
          Marketplace Charters & Legal Documents <span className="text-[#C0392B]">*</span>
        </label>

        <div className="divide-y divide-[#D8E0DC]/80 border border-[#D8E0DC] rounded-2xl overflow-hidden bg-white">
          {AGREEMENTS.map((doc) => (
            <div
              key={doc.id}
              className="p-4 sm:p-4.5 flex items-center justify-between gap-4 hover:bg-[#FBF8F1]/40 transition-colors"
            >
              <div className="flex items-start space-x-3">
                <div className="p-1.5 rounded-lg bg-[#E8F2EE] text-[#0F3D2E] mt-0.5 shrink-0">
                  <FileCheck2 className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-xs sm:text-sm text-[#0F3D2E]">
                    {doc.title}
                  </h4>
                  <p className="text-[11px] text-[#5C6B63] mt-0.5">
                    {doc.desc}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setActiveModalDoc(doc)}
                className="text-xs font-bold text-[#0F3D2E] hover:text-[#D4AF37] link-interactive flex items-center space-x-1 shrink-0 cursor-pointer"
              >
                <span>Read Details</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Acceptance Checkbox Container */}
      <div className={`p-4 sm:p-5 rounded-2xl border-2 transition-all ${
        hasError && !accepted
          ? 'bg-[#FDEDEC] border-[#C0392B]'
          : 'bg-[#FBF8F1] border-[#0F3D2E]/40'
      }`}>
        <label className="flex items-start space-x-3 cursor-pointer">
          <input
            type="checkbox"
            checked={accepted}
            onChange={(e) => {
              setAccepted(e.target.checked);
              if (e.target.checked) setHasError(false);
            }}
            className="w-5 h-5 rounded-md text-[#0F3D2E] focus:ring-[#D4AF37] mt-0.5 cursor-pointer"
          />
          <div>
            <span className="font-bold text-xs sm:text-sm text-[#0F3D2E] block">
              I have read, understood, and accept all marketplace terms, vendor covenants, data privacy standards, and statutory tax declarations.
            </span>
            <p className="text-[11px] text-[#5C6B63] mt-1">
              By submitting, you affirm that all identity certificates and business credentials provided are legitimate and authorized.
            </p>
          </div>
        </label>

        {hasError && !accepted && (
          <p className="text-[11px] text-[#C0392B] font-bold mt-2 ml-8">
            You must accept the legal agreements to submit your seller registration.
          </p>
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between pt-6 border-t border-[#D8E0DC]">
        <button
          type="button"
          onClick={onBack}
          className="px-5 py-3 rounded-xl text-xs font-bold text-[#5C6B63] bg-[#FBF8F1] hover:bg-[#E8F2EE] border border-[#D8E0DC] btn-interactive flex items-center space-x-2 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 icon-interactive" />
          <span>Back: Verification</span>
        </button>

        <button
          type="submit"
          className="px-8 py-3.5 rounded-xl text-sm font-extrabold text-[#FBF8F1] bg-[#0F3D2E] hover:bg-[#155440] active:bg-[#0A2A1F] btn-interactive flex items-center space-x-2 shadow-lg hover:shadow-xl cursor-pointer"
        >
          <Sparkles className="w-4 h-4 text-[#D4AF37]" />
          <span>Submit Seller Registration</span>
          <ArrowRight className="w-4 h-4 text-[#D4AF37] icon-interactive" />
        </button>
      </div>

      {/* Document View Modal */}
      {activeModalDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0F3D2E]/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-[#FBF8F1] border border-[#D4AF37]/50 rounded-3xl shadow-2xl max-w-lg w-full p-6 space-y-4 animate-dropdown">
            <div className="flex items-center justify-between pb-3 border-b border-[#D8E0DC]">
              <div className="flex items-center space-x-2">
                <FileCheck2 className="w-5 h-5 text-[#0F3D2E]" />
                <h3 className="font-['Outfit'] font-bold text-base text-[#0F3D2E]">
                  {activeModalDoc.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveModalDoc(null)}
                className="p-1 text-[#5C6B63] hover:text-[#0F3D2E] icon-interactive cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-white p-4 rounded-xl border border-[#D8E0DC] text-xs text-[#0F3D2E] leading-relaxed max-h-60 overflow-y-auto">
              <p className="font-semibold mb-2">{activeModalDoc.desc}</p>
              <p className="text-[#5C6B63]">{activeModalDoc.snippet}</p>
              <p className="text-[#5C6B63] mt-3">
                Full clause documentation available on the MytriKart Compliance Portal upon store activation.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setActiveModalDoc(null)}
              className="w-full py-2.5 bg-[#0F3D2E] text-[#FBF8F1] font-bold text-xs rounded-xl btn-interactive cursor-pointer"
            >
              Close Document
            </button>
          </div>
        </div>
      )}

    </form>
  );
}

// Quick inline Store icon helper for the recap header
function Store(props) {
  return (
    <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h18l-2 9H5L3 3z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 12a3 3 0 003 3 3 3 0 003-3 3 3 0 003 3 3 3 0 003-3 3 3 0 003 3 3 3 0 003-3" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 21h16a1 1 0 001-1v-5H3v5a1 1 0 001 1z" />
    </svg>
  );
}
