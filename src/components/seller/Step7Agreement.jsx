import React, { useState } from 'react';
import { 
  FileCheck2, 
  ExternalLink, 
  ShieldCheck, 
  ArrowRight, 
  ArrowLeft, 
  Sparkles,
  X,
  Loader2,
  AlertCircle
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

export default function Step7Agreement({ formData, updateFormData, onSubmitRegistration, onBack, isSubmitting = false, apiError = null }) {
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
    if (onSubmitRegistration) {
      onSubmitRegistration();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 animate-reveal">
      
      {/* Step Header */}
      <div>
        <h2 className="font-['Outfit'] text-2xl sm:text-3xl font-extrabold text-[#FA661C] tracking-tight">
          Legal Agreement & Declaration
        </h2>
        <p className="text-xs sm:text-sm text-[#6B6058] mt-1">
          Review standard marketplace governance charters, return policies, and statutory tax representations
        </p>
      </div>

      {apiError && (
        <div className="p-4 bg-[#FDE8EA] text-[#D7263D] border border-[#D7263D]/40 rounded-2xl text-xs font-bold animate-dropdown space-y-1">
          <div className="flex items-center space-x-2 text-sm font-extrabold">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>Seller Registration Submission Failed</span>
          </div>
          <p className="text-xs font-normal text-[#D7263D]/90 pl-7">
            {typeof apiError === 'string' ? apiError : JSON.stringify(apiError)}
          </p>
        </div>
      )}

      {/* Summary Recap Card */}
      <div className="p-4 rounded-2xl bg-[#FFF8F2] border border-[#FF811A]/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-[#FA661C]">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-xl bg-[#FA661C] text-[#FF811A]">
            <Store className="w-5 h-5" />
          </div>
          <div>
            <span className="font-bold block text-sm">
              Storefront: {formData.storeName || 'Your Store Name'}
            </span>
            <span className="text-[11px] text-[#6B6058] font-mono">
              mytrikart.com/stores/{formData.storeSlug || 'slug'} • {formData.businessType || 'company'}
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-1.5 text-[11px] font-bold text-[#FA661C] bg-white px-3 py-1.5 rounded-xl border border-[#EAE3DC]">
          <ShieldCheck className="w-4 h-4 text-[#FF811A]" />
          <span>7 of 7 Steps Ready for Review</span>
        </div>
      </div>

      {/* Agreement Documents List */}
      <div className="space-y-3">
        <label className="block text-xs font-bold uppercase tracking-wider text-[#FA661C]">
          Marketplace Charters & Legal Documents <span className="text-[#D7263D]">*</span>
        </label>

        <div className="divide-y divide-[#EAE3DC]/80 border border-[#EAE3DC] rounded-2xl overflow-hidden bg-white">
          {AGREEMENTS.map((doc) => (
            <div
              key={doc.id}
              className="p-4 sm:p-4.5 flex items-center justify-between gap-4 hover:bg-[#FFFFFF]/40 transition-colors"
            >
              <div className="flex items-start space-x-3">
                <div className="p-1.5 rounded-lg bg-[#FFF3EC] text-[#FA661C] mt-0.5 shrink-0">
                  <FileCheck2 className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-xs sm:text-sm text-[#FA661C]">
                    {doc.title}
                  </h4>
                  <p className="text-[11px] text-[#6B6058] mt-0.5">
                    {doc.desc}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setActiveModalDoc(doc)}
                className="text-xs font-bold text-[#FA661C] hover:text-[#FF811A] link-interactive flex items-center space-x-1 shrink-0 cursor-pointer"
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
          ? 'bg-[#FDE8EA] border-[#D7263D]'
          : 'bg-[#FFFFFF] border-[#FA661C]/40'
      }`}>
        <label className="flex items-start space-x-3 cursor-pointer">
          <input
            type="checkbox"
            checked={accepted}
            onChange={(e) => {
              setAccepted(e.target.checked);
              if (e.target.checked) setHasError(false);
            }}
            className="w-5 h-5 rounded-md text-[#FA661C] focus:ring-[#FF811A] mt-0.5 cursor-pointer"
          />
          <div>
            <span className="font-bold text-xs sm:text-sm text-[#FA661C] block">
              I have read, understood, and accept all marketplace terms, vendor covenants, data privacy standards, and statutory tax declarations.
            </span>
            <p className="text-[11px] text-[#6B6058] mt-1">
              By submitting, you affirm that all identity certificates and business credentials provided are legitimate and authorized.
            </p>
          </div>
        </label>

        {hasError && !accepted && (
          <p className="text-[11px] text-[#D7263D] font-bold mt-2 ml-8">
            You must accept the legal agreements to submit your seller registration.
          </p>
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between pt-6 border-t border-[#EAE3DC]">
        <button
          type="button"
          disabled={isSubmitting}
          onClick={onBack}
          className="px-5 py-3 rounded-xl text-xs font-bold text-[#6B6058] bg-[#FFFFFF] hover:bg-[#FFF3EC] border border-[#EAE3DC] btn-interactive flex items-center space-x-2 cursor-pointer disabled:opacity-50"
        >
          <ArrowLeft className="w-4 h-4 icon-interactive" />
          <span>Back: Verification</span>
        </button>

        <button
          type="submit"
          disabled={isSubmitting}
          className="px-8 py-3.5 rounded-xl text-sm font-extrabold text-[#FFFFFF] bg-[#FA661C] hover:bg-[#E0530B] active:bg-[#0A2A1F] btn-interactive flex items-center space-x-2 shadow-lg hover:shadow-xl cursor-pointer disabled:opacity-50"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-[#FF811A]" />
              <span>Submitting Registration & Documents...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 text-[#FF811A]" />
              <span>Submit Seller Registration</span>
              <ArrowRight className="w-4 h-4 text-[#FF811A] icon-interactive" />
            </>
          )}
        </button>
      </div>

      {/* Document View Modal */}
      {activeModalDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#FA661C]/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-[#FFFFFF] border border-[#FF811A]/50 rounded-3xl shadow-2xl max-w-lg w-full p-6 space-y-4 animate-dropdown">
            <div className="flex items-center justify-between pb-3 border-b border-[#EAE3DC]">
              <div className="flex items-center space-x-2">
                <FileCheck2 className="w-5 h-5 text-[#FA661C]" />
                <h3 className="font-['Outfit'] font-bold text-base text-[#FA661C]">
                  {activeModalDoc.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveModalDoc(null)}
                className="p-1 text-[#6B6058] hover:text-[#FA661C] icon-interactive cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-white p-4 rounded-xl border border-[#EAE3DC] text-xs text-[#FA661C] leading-relaxed max-h-60 overflow-y-auto">
              <p className="font-semibold mb-2">{activeModalDoc.desc}</p>
              <p className="text-[#6B6058]">{activeModalDoc.snippet}</p>
              <p className="text-[#6B6058] mt-3">
                Full clause documentation available on the MytriKart Compliance Portal upon store activation.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setActiveModalDoc(null)}
              className="w-full py-2.5 bg-[#FA661C] text-[#FFFFFF] font-bold text-xs rounded-xl btn-interactive cursor-pointer"
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

