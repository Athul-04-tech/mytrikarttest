import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  CreditCard, 
  Smartphone, 
  ArrowRight, 
  ArrowLeft, 
  ShieldCheck, 
  CheckCircle2
} from 'lucide-react';

const ALL_PAYMENT_METHODS = [
  { id: 'bank', label: 'Bank Transfer (NEFT / RTGS / SWIFT)', icon: Building2, desc: 'Payouts per-event once order is delivered and return window closes', countries: ['IN'] },
  { id: 'upi', label: 'UPI AutoPay (India)', icon: Smartphone, desc: 'Direct UPI VPA payouts per-event gated on delivery & closed return window', countries: ['IN'] },
  { id: 'stripe_connect', label: 'Stripe Connect', icon: CreditCard, desc: 'Stripe merchant payouts per-event gated on delivery & closed return window (UAE & Ireland)', countries: ['AE', 'IE'] }
];

export default function Step5PaymentDetails({ formData, updateFormData, onNext, onBack }) {
  const selectedCountry = formData.country || 'IN';

  // Available methods based on selected country
  const availableMethods = ALL_PAYMENT_METHODS.filter(m => m.countries.includes(selectedCountry));

  const initialMethod = availableMethods.some(m => m.id === formData.payoutMethod)
    ? formData.payoutMethod
    : (availableMethods[0]?.id || 'bank');

  const [activeTab, setActiveTab] = useState(initialMethod);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    // If country changes and activeTab is not valid for new country, switch to default
    if (!availableMethods.some(m => m.id === activeTab)) {
      const nextMethod = availableMethods[0]?.id || 'stripe_connect';
      setActiveTab(nextMethod);
      updateFormData({ payoutMethod: nextMethod });
    }
  }, [selectedCountry]);

  const validate = () => {
    const errs = {};
    if (activeTab === 'bank') {
      if (!formData.accountHolder) errs.accountHolder = "Account holder name is required";
      if (!formData.accountNumber) errs.accountNumber = "Account number is required";
      if (!formData.ifscSwift) errs.ifscSwift = "IFSC or SWIFT code is required";
    } else if (activeTab === 'upi') {
      if (!formData.upiId || !formData.upiId.includes('@')) errs.upiId = "Valid UPI ID (e.g. name@okhdfcbank) is required";
    } else if (activeTab === 'stripe_connect') {
      const val = formData.stripeConnectAccountId || formData.stripeEmail;
      if (!val) errs.stripeConnectAccountId = "Stripe Connect Account ID or registered email is required";
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
        <h2 className="font-['Outfit'] text-2xl sm:text-3xl font-extrabold text-[#FA661C] tracking-tight">
          Settlement & Payout Details
        </h2>
        <p className="text-xs sm:text-sm text-[#6B6058] mt-1">
          Configure how your marketplace earnings, subsidies, and customer refunds are deposited
        </p>
      </div>

      {/* Security Assurance Banner */}
      <div className="p-3.5 rounded-2xl bg-[#FFF3EC] border border-[#FA661C]/20 flex items-center space-x-3 text-xs text-[#FA661C]">
        <ShieldCheck className="w-5 h-5 text-[#FF811A] shrink-0" />
        <span className="font-medium">
          Settlement is per-event, gated on confirmed order delivery and a closed return window.
        </span>
      </div>

      {/* Payout Method Tabbed Selector */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-xs font-bold uppercase tracking-wider text-[#FA661C]">
            Select Primary Settlement Channel <span className="text-[#D7263D]">*</span>
          </label>
          <span className="text-[11px] font-bold text-[#6B6058] bg-[#FFF3EC] px-2 py-0.5 rounded">
            Jurisdiction: {selectedCountry}
          </span>
        </div>
        
        <div className={`grid grid-cols-1 ${availableMethods.length > 1 ? 'sm:grid-cols-2' : 'sm:grid-cols-1'} gap-2.5`}>
          {availableMethods.map((method) => {
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
                    ? 'bg-[#FFF8F2] border-[#FF811A] ring-2 ring-[#FF811A]/30 shadow-xs'
                    : 'bg-white border-[#EAE3DC] hover:border-[#6B6058]/60'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className={`p-1.5 rounded-xl ${isActive ? 'bg-[#FA661C] text-[#FF811A]' : 'bg-[#FFFFFF] text-[#6B6058]'}`}>
                    <Icon className="w-4 h-4 icon-interactive" />
                  </div>
                  {isActive && <CheckCircle2 className="w-4 h-4 text-[#FA661C]" />}
                </div>

                <div>
                  <h4 className="font-bold text-xs text-[#FA661C] leading-snug">
                    {method.label.split('(')[0]}
                  </h4>
                  <p className="text-[10px] text-[#6B6058] mt-0.5 leading-tight">
                    {method.desc}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Dynamic Tab Form Content */}
      <div className="bg-white border border-[#EAE3DC] rounded-2xl p-5 shadow-xs">
        
        {/* TAB 1: BANK TRANSFER */}
        {activeTab === 'bank' && (
          <div className="space-y-4 animate-dropdown">
            <h4 className="text-xs font-extrabold uppercase tracking-widest text-[#FA661C]">
              Commercial Bank Account Details
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#FA661C] mb-1">
                  Bank Name (UI Reference)
                </label>
                <input
                  type="text"
                  value={formData.bankName || ''}
                  onChange={(e) => updateFormData({ bankName: e.target.value })}
                  placeholder="e.g. HDFC Bank Ltd"
                  className="w-full py-2.5 px-3.5 bg-white border border-[#EAE3DC] rounded-xl text-xs sm:text-sm text-[#FA661C] font-medium input-interactive"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#FA661C] mb-1">
                  Account Holder Name <span className="text-[#D7263D]">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.accountHolder || ''}
                  onChange={(e) => updateFormData({ accountHolder: e.target.value })}
                  placeholder="Must match trade license / personal name"
                  className="w-full py-2.5 px-3.5 bg-white border border-[#EAE3DC] rounded-xl text-xs sm:text-sm text-[#FA661C] font-medium input-interactive"
                />
                {errors.accountHolder && <p className="text-[10px] text-[#D7263D] font-bold mt-1">{errors.accountHolder}</p>}
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#FA661C] mb-1">
                  Account Number / IBAN <span className="text-[#D7263D]">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.accountNumber || ''}
                  onChange={(e) => updateFormData({ accountNumber: e.target.value })}
                  placeholder="e.g. 50100234567890"
                  className="w-full py-2.5 px-3.5 bg-white border border-[#EAE3DC] rounded-xl text-xs sm:text-sm text-[#FA661C] font-medium font-mono input-interactive"
                />
                {errors.accountNumber && <p className="text-[10px] text-[#D7263D] font-bold mt-1">{errors.accountNumber}</p>}
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#FA661C] mb-1">
                  IFSC / SWIFT Code <span className="text-[#D7263D]">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.ifscSwift || ''}
                  onChange={(e) => updateFormData({ ifscSwift: e.target.value.toUpperCase() })}
                  placeholder="e.g. HDFC0001234"
                  className="w-full py-2.5 px-3.5 bg-white border border-[#EAE3DC] rounded-xl text-xs sm:text-sm text-[#FA661C] font-medium font-mono uppercase input-interactive"
                />
                {errors.ifscSwift && <p className="text-[10px] text-[#D7263D] font-bold mt-1">{errors.ifscSwift}</p>}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: UPI */}
        {activeTab === 'upi' && (
          <div className="space-y-4 animate-dropdown">
            <h4 className="text-xs font-extrabold uppercase tracking-widest text-[#FA661C]">
              Unified Payments Interface (UPI) VPA
            </h4>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#FA661C] mb-1">
                Virtual Payment Address (UPI ID) <span className="text-[#D7263D]">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.upiId || ''}
                onChange={(e) => updateFormData({ upiId: e.target.value.toLowerCase() })}
                placeholder="e.g. yourstore@okhdfcbank or merchant@upi"
                className="w-full py-2.5 px-3.5 bg-white border border-[#EAE3DC] rounded-xl text-xs sm:text-sm text-[#FA661C] font-medium font-mono input-interactive"
              />
              {errors.upiId && <p className="text-[10px] text-[#D7263D] font-bold mt-1">{errors.upiId}</p>}
              <p className="text-[11px] text-[#6B6058] mt-1.5">
                Payouts are credited to your UPI VPA per delivered order after the return window closes.
              </p>
            </div>
          </div>
        )}

        {/* TAB 3: STRIPE CONNECT */}
        {activeTab === 'stripe_connect' && (
          <div className="space-y-4 animate-dropdown">
            <h4 className="text-xs font-extrabold uppercase tracking-widest text-[#FA661C]">
              Stripe Connect Merchant Account
            </h4>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#FA661C] mb-1">
                Stripe Connect Account ID / Email <span className="text-[#D7263D]">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.stripeConnectAccountId || formData.stripeEmail || ''}
                onChange={(e) => {
                  updateFormData({ 
                    stripeConnectAccountId: e.target.value,
                    stripeEmail: e.target.value
                  });
                }}
                placeholder="acct_1N... or stripe-merchant@brand.com"
                className="w-full py-2.5 px-3.5 bg-white border border-[#EAE3DC] rounded-xl text-xs sm:text-sm text-[#FA661C] font-medium font-mono input-interactive"
              />
              {errors.stripeConnectAccountId && <p className="text-[10px] text-[#D7263D] font-bold mt-1">{errors.stripeConnectAccountId}</p>}
              <p className="text-[11px] text-[#6B6058] mt-1.5">
                Mandatory for merchants operating out of UAE (AE) and Ireland (IE).
              </p>
            </div>
          </div>
        )}

      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between pt-6 border-t border-[#EAE3DC]">
        <button
          type="button"
          onClick={onBack}
          className="px-5 py-3 rounded-xl text-xs font-bold text-[#6B6058] bg-[#FFFFFF] hover:bg-[#FFF3EC] border border-[#EAE3DC] btn-interactive flex items-center space-x-2 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 icon-interactive" />
          <span>Back: Contact Info</span>
        </button>

        <button
          type="submit"
          className="px-6 py-3 rounded-xl text-xs font-bold text-[#FFFFFF] bg-[#FA661C] hover:bg-[#E0530B] btn-interactive flex items-center space-x-2 shadow-md cursor-pointer"
        >
          <span>Continue to Document Verification</span>
          <ArrowRight className="w-4 h-4 text-[#FF811A] icon-interactive" />
        </button>
      </div>

    </form>
  );
}

