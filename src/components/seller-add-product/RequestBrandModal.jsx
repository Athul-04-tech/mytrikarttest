import React, { useState } from 'react';
import { X, Sparkles, Send, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { useSellerProducts } from '../../context/SellerProductsContext';

export default function RequestBrandModal({
  isOpen,
  onClose
}) {
  const [requestedName, setRequestedName] = useState('');
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const toast = useToast();
  const { requestBrand } = useSellerProducts();

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!requestedName.trim()) {
      toast.error("Brand Name Required", "Please enter the official brand name you wish to request.");
      return;
    }

    try {
      setIsSubmitting(true);
      if (requestBrand) {
        await requestBrand({
          name: requestedName.trim(),
          reason: reason.trim() || 'Vendor catalog requirement for official distribution.'
        });
      }

      toast.success(
        "Brand Request Sent for Admin Review", 
        `"${requestedName.trim()}" has been submitted to the Central Catalog Desk.`
      );

      setRequestedName('');
      setReason('');
      onClose();
    } catch (err) {
      const errMsg = err?.data?.detail || err?.data?.message || err?.message || 'Failed to submit brand request.';
      toast.error("Submission Failed", typeof errMsg === 'object' ? JSON.stringify(errMsg) : String(errMsg));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0A2A1F]/70 backdrop-blur-xs animate-fadeIn">
      <div 
        className="bg-white border border-[#FF811A]/50 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-scaleUp text-xs"
        role="dialog"
        aria-modal="true"
        aria-labelledby="request-brand-title"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-[#FA661C] to-[#16523F] text-[#FFFFFF] p-5 flex items-center justify-between border-b border-[#FF811A]/30">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-[#FF811A]/20 border border-[#FF811A]/40 text-[#FF811A]">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 id="request-brand-title" className="font-['Outfit'] font-extrabold text-base text-[#FFFFFF]">
                Request New Official Brand
              </h3>
              <p className="text-[11px] text-[#EAE3DC]">
                Governance Workflow • Official Brand Recognition
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-[#FFFFFF]/80 hover:text-[#000000] hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Governance Notice Banner */}
        <div className="p-4 bg-[#FFF8F2] border-b border-[#FF811A]/30 flex items-start space-x-2.5 text-[#FA661C]">
          <ShieldAlert className="w-4 h-4 text-[#FF811A] shrink-0 mt-0.5" />
          <p className="text-[11px] leading-relaxed">
            <strong>Standardization Rule:</strong> Official brands require Central Catalog Desk approval before appearing in the official brand selector.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          <div>
            <label htmlFor="requested-brand-name-input" className="block text-xs font-bold text-[#FA661C] mb-1">
              Requested Official Brand Name <span className="text-[#D7263D]">*</span>
            </label>
            <input
              id="requested-brand-name-input"
              type="text"
              value={requestedName}
              onChange={(e) => setRequestedName(e.target.value)}
              placeholder="e.g. Nike, Samsung, Acme Athletics"
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#EAE3DC] text-[#FA661C] text-xs font-medium focus:border-[#FA661C] focus:ring-1 focus:ring-[#FA661C] outline-none input-interactive"
              autoFocus
              required
            />
          </div>

          <div>
            <label htmlFor="brand-reason-input" className="block text-xs font-bold text-[#FA661C] mb-1">
              Authorization Proof / Reason (Optional)
            </label>
            <textarea
              id="brand-reason-input"
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Why should this brand be added to the official catalog? (e.g. Authorized distributor, official trademark holder)"
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#EAE3DC] text-[#FA661C] text-xs font-medium focus:border-[#FA661C] focus:ring-1 focus:ring-[#FA661C] outline-none resize-none input-interactive"
            />
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-[#EAE3DC] flex items-center justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-[#6B6058] bg-[#FFFFFF] hover:bg-[#FFF3EC] border border-[#EAE3DC] btn-interactive cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl text-xs font-bold text-[#FFFFFF] bg-[#FA661C] hover:bg-[#E0530B] btn-interactive flex items-center space-x-1.5 shadow-sm cursor-pointer disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5 text-[#FF811A]" />
              <span>{isSubmitting ? 'Submitting...' : 'Submit to Admin Desk'}</span>
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
