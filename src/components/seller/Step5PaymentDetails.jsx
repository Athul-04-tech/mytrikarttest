import React, { useState } from 'react';
import { 
  Building2, 
  CreditCard, 
  Smartphone, 
  Globe, 
  ArrowRight, 
  ArrowLeft, 
  ShieldCheck, 
  CheckCircle2, 
  Lock 
} from 'lucide-react';

const PAYMENT_METHODS = [
  { id: 'bank', label: 'Bank Transfer (NEFT / RTGS / SWIFT)', icon: Building2, desc: 'Direct direct-deposit payouts twice weekly' },
  { id: 'upi', label: 'UPI AutoPay (India)', icon: Smartphone, desc: 'Instant 24x7 automated settlements to VPA' },
  { id: 'paypal', label: 'PayPal Commerce', icon: Globe, desc: 'Global multi-currency automated seller payouts' },
  { id: 'stripe', label: 'Stripe Connect', icon: CreditCard, desc: 'Direct merchant processing & payout portal' }
];

export default function Step5PaymentDetails({ formData, updateFormData, onNext, onBack }) {
  const [activeTab, setActiveTab] = useState(formData.payoutMethod || 'bank');
  const [errors, setErrors] = useState({});

  const validate = () => {
    const errs = {};
    if (activeTab === 'bank') {
      if (!formData.bankName) errs.bankName = "Bank name is required";
      if (!formData.accountHolder) errs.accountHolder = "Account holder name is required";
      if (!formData.accountNumber) errs.accountNumber = "Account number is required";
      if (!formData.ifscSwift) errs.ifscSwift = "IFSC or SWIFT code is required";
    } else if (activeTab === 'upi') {
      if (!formData.upiId || !formData.upiId.includes('@')) errs.upiId = "Valid UPI ID (e.g. name@okhdfcbank) is required";
    } else if (activeTab === 'paypal') {
      if (!formData.paypalEmail || !formData.paypalEmail.includes('@')) errs.paypalEmail = "Valid PayPal email is required";
    } else if (activeTab === 'stripe') {
      if (!formData.stripeEmail || !formData.stripeEmail.includes('@')) errs.stripeEmail = "Valid Stripe account email is required";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleContinue = (e) => {
    e.preventDefault();
    updateFormData({ payoutMethod: activeTab });
    if (validate()) {
      onNext();
    }
  };

  return (
    <form onSubmit={handleContinue} className="space-y-6 animate-reveal">
      
      {/* Step Header */}
      <div>
        <h2 className="font-['Outfit'] text-2xl sm:text-3xl font-extrabold text-[#0F3D2E] tracking-tight">
          Settlement & Payout Details
        </h2>
        <p className="text-xs sm:text-sm text-[#5C6B63] mt-1">
          Configure how your marketplace earnings, subsidies, and customer refunds are deposited
        </p>
      </div>

      {/* Security Assurance Banner */}
      <div className="p-3.5 rounded-2xl bg-[#E8F2EE] border border-[#0F3D2E]/20 flex items-center space-x-3 text-xs text-[#0F3D2E]">
        <ShieldCheck className="w-5 h-5 text-[#D4AF37] shrink-0" />
        <span className="font-medium">
          Bank and payout credentials are encrypted with 256-bit AES protocol and verified via penny-drop authorization.
        </span>
      </div>

      {/* Payout Method Tabbed Selector */}
      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-[#0F3D2E] mb-2">
          Select Primary Settlement Channel <span className="text-[#C0392B]">*</span>
        </label>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {PAYMENT_METHODS.map((method) => {
            const Icon = method.icon;
            const isActive = activeTab === method.id;

            return (
              <button
                key={method.id}
                type="button"
                onClick={() => {
                  setActiveTab(method.id);
                  updateFormData({ payoutMethod: method.id });
                }}
                className={`p-3.5 rounded-2xl border-2 text-left transition-all btn-interactive flex flex-col justify-between cursor-pointer ${
                  isActive
                    ? 'bg-[#FCF7E8] border-[#D4AF37] ring-2 ring-[#D4AF37]/30 shadow-xs'
                    : 'bg-white border-[#D8E0DC] hover:border-[#5C6B63]/60'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className={`p-1.5 rounded-xl ${isActive ? 'bg-[#0F3D2E] text-[#D4AF37]' : 'bg-[#FBF8F1] text-[#5C6B63]'}`}>
                    <Icon className="w-4 h-4 icon-interactive" />
                  </div>
                  {isActive && <CheckCircle2 className="w-4 h-4 text-[#0F3D2E]" />}
                </div>

                <div>
                  <h4 className="font-bold text-xs text-[#0F3D2E] leading-snug">
                    {method.label.split('(')[0]}
                  </h4>
                  <p className="text-[10px] text-[#5C6B63] mt-0.5 leading-tight">
                    {method.desc}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Dynamic Tab Form Content */}
      <div className="bg-white border border-[#D8E0DC] rounded-2xl p-5 shadow-xs">
        
        {/* TAB 1: BANK TRANSFER */}
        {activeTab === 'bank' && (
          <div className="space-y-4 animate-dropdown">
            <h4 className="text-xs font-extrabold uppercase tracking-widest text-[#0F3D2E]">
              Commercial Bank Account Details
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#0F3D2E] mb-1">
                  Bank Name <span className="text-[#C0392B]">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.bankName || ''}
                  onChange={(e) => updateFormData({ bankName: e.target.value })}
                  placeholder="e.g. HDFC Bank / Emirates NBD / Bank of Ireland"
                  className="w-full py-2.5 px-3.5 bg-white border border-[#D8E0DC] rounded-xl text-xs sm:text-sm text-[#0F3D2E] font-medium input-interactive"
                />
                {errors.bankName && <p className="text-[10px] text-[#C0392B] font-bold mt-1">{errors.bankName}</p>}
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#0F3D2E] mb-1">
                  Account Holder Name <span className="text-[#C0392B]">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.accountHolder || ''}
                  onChange={(e) => updateFormData({ accountHolder: e.target.value })}
                  placeholder="Must match trade license / personal name"
                  className="w-full py-2.5 px-3.5 bg-white border border-[#D8E0DC] rounded-xl text-xs sm:text-sm text-[#0F3D2E] font-medium input-interactive"
                />
                {errors.accountHolder && <p className="text-[10px] text-[#C0392B] font-bold mt-1">{errors.accountHolder}</p>}
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#0F3D2E] mb-1">
                  Account Number / IBAN <span className="text-[#C0392B]">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.accountNumber || ''}
                  onChange={(e) => updateFormData({ accountNumber: e.target.value })}
                  placeholder="e.g. 50100234567890"
                  className="w-full py-2.5 px-3.5 bg-white border border-[#D8E0DC] rounded-xl text-xs sm:text-sm text-[#0F3D2E] font-medium font-mono input-interactive"
                />
                {errors.accountNumber && <p className="text-[10px] text-[#C0392B] font-bold mt-1">{errors.accountNumber}</p>}
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#0F3D2E] mb-1">
                  IFSC / SWIFT / BIC Code <span className="text-[#C0392B]">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.ifscSwift || ''}
                  onChange={(e) => updateFormData({ ifscSwift: e.target.value.toUpperCase() })}
                  placeholder="e.g. HDFC0001234 or BOFIIE2D"
                  className="w-full py-2.5 px-3.5 bg-white border border-[#D8E0DC] rounded-xl text-xs sm:text-sm text-[#0F3D2E] font-medium font-mono uppercase input-interactive"
                />
                {errors.ifscSwift && <p className="text-[10px] text-[#C0392B] font-bold mt-1">{errors.ifscSwift}</p>}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: UPI */}
        {activeTab === 'upi' && (
          <div className="space-y-4 animate-dropdown">
            <h4 className="text-xs font-extrabold uppercase tracking-widest text-[#0F3D2E]">
              Unified Payments Interface (UPI) VPA
            </h4>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#0F3D2E] mb-1">
                Virtual Payment Address (UPI ID) <span className="text-[#C0392B]">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.upiId || ''}
                onChange={(e) => updateFormData({ upiId: e.target.value.toLowerCase() })}
                placeholder="e.g. yourstore@okhdfcbank or merchant@upi"
                className="w-full py-2.5 px-3.5 bg-white border border-[#D8E0DC] rounded-xl text-xs sm:text-sm text-[#0F3D2E] font-medium font-mono input-interactive"
              />
              {errors.upiId && <p className="text-[10px] text-[#C0392B] font-bold mt-1">{errors.upiId}</p>}
              <p className="text-[11px] text-[#5C6B63] mt-1.5">
                Eligible for daily automated settlements up to ₹5,00,000 per cycle.
              </p>
            </div>
          </div>
        )}

        {/* TAB 3: PAYPAL */}
        {activeTab === 'paypal' && (
          <div className="space-y-4 animate-dropdown">
            <h4 className="text-xs font-extrabold uppercase tracking-widest text-[#0F3D2E]">
              PayPal Merchant Account
            </h4>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#0F3D2E] mb-1">
                PayPal Registered Email Address <span className="text-[#C0392B]">*</span>
              </label>
              <input
                type="email"
                required
                value={formData.paypalEmail || ''}
                onChange={(e) => updateFormData({ paypalEmail: e.target.value })}
                placeholder="merchant@paypal-account.com"
                className="w-full py-2.5 px-3.5 bg-white border border-[#D8E0DC] rounded-xl text-xs sm:text-sm text-[#0F3D2E] font-medium input-interactive"
              />
              {errors.paypalEmail && <p className="text-[10px] text-[#C0392B] font-bold mt-1">{errors.paypalEmail}</p>}
            </div>
          </div>
        )}

        {/* TAB 4: STRIPE */}
        {activeTab === 'stripe' && (
          <div className="space-y-4 animate-dropdown">
            <h4 className="text-xs font-extrabold uppercase tracking-widest text-[#0F3D2E]">
              Stripe Connect Merchant ID
            </h4>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#0F3D2E] mb-1">
                Stripe Express / Custom Account Email <span className="text-[#C0392B]">*</span>
              </label>
              <input
                type="email"
                required
                value={formData.stripeEmail || ''}
                onChange={(e) => updateFormData({ stripeEmail: e.target.value })}
                placeholder="stripe-payouts@brand.com"
                className="w-full py-2.5 px-3.5 bg-white border border-[#D8E0DC] rounded-xl text-xs sm:text-sm text-[#0F3D2E] font-medium input-interactive"
              />
              {errors.stripeEmail && <p className="text-[10px] text-[#C0392B] font-bold mt-1">{errors.stripeEmail}</p>}
            </div>
          </div>
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
          <span>Back: Contact Info</span>
        </button>

        <button
          type="submit"
          className="px-6 py-3 rounded-xl text-xs font-bold text-[#FBF8F1] bg-[#0F3D2E] hover:bg-[#155440] btn-interactive flex items-center space-x-2 shadow-md cursor-pointer"
        >
          <span>Continue to Document Verification</span>
          <ArrowRight className="w-4 h-4 text-[#D4AF37] icon-interactive" />
        </button>
      </div>

    </form>
  );
}
