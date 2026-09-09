import React, { useState } from 'react';
import { X, Sparkles, Send, ShieldAlert, CheckCircle2, HelpCircle } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { useSellerProducts } from '../../context/SellerProductsContext';

export default function RequestValueModal({
  isOpen,
  onClose,
  attribute,
  category
}) {
  const [requestedValue, setRequestedValue] = useState('');
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const toast = useToast();
  const { requestAttributeValue } = useSellerProducts();

  if (!isOpen || !attribute) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!requestedValue.trim()) {
      toast.error("Value Required", "Please enter the attribute value you wish to request.");
      return;
    }

    const attributeId = attribute.id || attribute.pk || attribute.category_attribute;
    if (!attributeId) {
      toast.error("Attribute Required", "Valid category attribute ID is missing.");
      return;
    }

    try {
      setIsSubmitting(true);
      await requestAttributeValue({
        attributeId,
        value: requestedValue.trim(),
        reason: reason.trim() || 'Vendor catalog requirement for upcoming SKU line.'
      });

      toast.success(
        "Request Sent for Admin Review", 
        `"${requestedValue.trim()}" has been queued in the Platform Governance Desk.`
      );

      setRequestedValue('');
      setReason('');
      onClose();
    } catch (err) {
      const errMsg = err?.data?.detail || err?.data?.message || err?.message || 'Failed to submit attribute value request.';
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
        aria-labelledby="request-value-title"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-[#FA661C] to-[#16523F] text-[#FFFFFF] p-5 flex items-center justify-between border-b border-[#FF811A]/30">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-[#FF811A]/20 border border-[#FF811A]/40 text-[#FF811A]">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 id="request-value-title" className="font-['Outfit'] font-extrabold text-base text-[#FFFFFF]">
                Request New Attribute Option
              </h3>
              <p className="text-[11px] text-[#EAE3DC]">
                Governance Workflow • {attribute.name || attribute.attribute_name}
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
            <strong>Standardization Rule:</strong> To prevent data fragmentation across buyers, new attribute values require Admin Catalog verification before becoming live in filters.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          <div>
            <label className="block text-xs font-bold text-[#FA661C] mb-1">
              Target Category & Attribute
            </label>
            <div className="p-2.5 rounded-xl bg-[#FFFFFF] border border-[#EAE3DC] text-[#6B6058] font-medium text-[11px]">
              {category?.displayName || category?.name || 'Active Category'} → <strong className="text-[#FA661C]">{attribute.name || attribute.attribute_name}</strong>
            </div>
          </div>

          <div>
            <label htmlFor="requested-value-input" className="block text-xs font-bold text-[#FA661C] mb-1">
              Requested Option Value <span className="text-[#D7263D]">*</span>
            </label>
            <input
              id="requested-value-input"
              type="text"
              value={requestedValue}
              onChange={(e) => setRequestedValue(e.target.value)}
              placeholder={`e.g. ${attribute.values?.[0] ? `Rose Gold / ${attribute.values[0]} Special Edition` : 'New Custom Spec'}`}
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#EAE3DC] text-[#FA661C] text-xs font-medium focus:border-[#FA661C] focus:ring-1 focus:ring-[#FA661C] outline-none input-interactive"
              autoFocus
              required
            />
          </div>

          <div>
            <label htmlFor="reason-input" className="block text-xs font-bold text-[#FA661C] mb-1">
              Business Justification / Manufacturer Proof (Optional)
            </label>
            <textarea
              id="reason-input"
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Why is this value required? (e.g. Official brand spec sheet, new seasonal colourway)"
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
