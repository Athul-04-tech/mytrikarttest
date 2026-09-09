import React from 'react';
import { Save, Send, Sparkles, ShieldCheck, ArrowLeft, AlertCircle, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function StickyActionBar({
  onSaveDraft,
  onSubmitListing,
  isSubmitting,
  isSavingDraft,
  validationErrors = [],
  sellerTrustLevel = 'gold'
}) {
  return (
    <div className="sticky bottom-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#EAE3DC] shadow-lg py-3.5 px-4 sm:px-8">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        
        {/* Left: Trust SLA Badge + Validation Hint */}
        <div className="flex items-center space-x-3 text-xs">
          <div className="flex items-center space-x-2 bg-[#FFF8F2] text-[#FA661C] border border-[#FF811A] px-3 py-1.5 rounded-full font-bold">
            <ShieldCheck className="w-4 h-4 text-[#FF811A] shrink-0" />
            <span className="text-[11px]">
              Gold Merchant Tier: <strong>Auto-Published with 2h Audit SLA</strong>
            </span>
          </div>

          {validationErrors.length > 0 && (
            <div className="hidden lg:flex items-center space-x-1 text-[#D7263D] font-bold text-[11px]">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{validationErrors.length} required field(s) pending</span>
            </div>
          )}
        </div>

        {/* Right: Actions */}
        <div className="flex items-center space-x-2.5 sm:space-x-3 self-end sm:self-auto">
          
          <Link
            to="/seller/products"
            className="px-4 py-2 rounded-xl text-xs font-bold text-[#6B6058] bg-[#FFFFFF] hover:bg-[#FFF3EC] border border-[#EAE3DC] btn-interactive cursor-pointer"
          >
            Cancel
          </Link>

          <button
            type="button"
            onClick={onSaveDraft}
            disabled={isSavingDraft || isSubmitting}
            className="px-4 py-2 rounded-xl text-xs font-bold text-[#FA661C] bg-white hover:bg-[#FFF3EC] border border-[#FA661C] btn-interactive flex items-center space-x-1.5 shadow-2xs cursor-pointer disabled:opacity-50"
          >
            {isSavingDraft ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-[#FA661C]" />
            ) : (
              <Save className="w-3.5 h-3.5 text-[#FA661C]" />
            )}
            <span>{isSavingDraft ? 'Saving Draft...' : 'Save Draft'}</span>
          </button>

          <button
            type="button"
            onClick={onSubmitListing}
            disabled={isSubmitting}
            className="px-6 py-2.5 rounded-xl text-xs font-extrabold text-[#FFFFFF] bg-[#FA661C] hover:bg-[#E0530B] active:bg-[#0A2A1F] btn-interactive flex items-center space-x-2 shadow-md hover:shadow-lg border border-[#FA661C] cursor-pointer disabled:opacity-50"
          >
            <Send className="w-4 h-4 text-[#FF811A] icon-interactive" />
            <span>{isSubmitting ? 'Publishing...' : 'Publish Listing to Catalog'}</span>
          </button>

        </div>

      </div>
    </div>
  );
}
