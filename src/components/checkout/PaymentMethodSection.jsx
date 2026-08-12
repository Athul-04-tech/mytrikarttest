import React, { useState } from 'react';
import { 
  CreditCard, 
  Smartphone, 
  Landmark, 
  Banknote, 
  Wallet, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  HelpCircle,
  Clock 
} from 'lucide-react';
import { useToast } from '../../context/ToastContext';

export default function PaymentMethodSection({
  selectedMethod,
  onSelectMethod,
  selectedAddress,
  payableAmount
}) {
  const [upiId, setUpiId] = useState('');
  const [isUpiVerified, setIsUpiVerified] = useState(false);
  const [cardNumber, setCardNumber] = useState('4532 •••• •••• 8492');
  const [cardExpiry, setCardExpiry] = useState('08/29');
  const [cardCvv, setCardCvv] = useState('');
  const [selectedEmiMonths, setSelectedEmiMonths] = useState(3);
  const [selectedBank, setSelectedBank] = useState('HDFC');

  const toast = useToast();

  const isCodEligible = selectedAddress?.isCodEligible ?? true;
  const isEmiAvailable = payableAmount >= 3000;

  const handleVerifyUpi = (e) => {
    e.preventDefault();
    if (!upiId || !upiId.includes('@')) {
      toast.error("Invalid UPI", "Please enter a valid UPI ID (e.g. yourname@okhdfcbank).");
      return;
    }
    setIsUpiVerified(true);
    toast.success("UPI Verified", `Linked to ${upiId.toUpperCase()} (Aarav Sharma)`);
  };

  return (
    <div className="bg-white rounded-3xl border border-[#D8E0DC] p-5 sm:p-6 shadow-xs space-y-4 text-xs">
      
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[#D8E0DC]">
        <div className="flex items-center space-x-2">
          <span className="w-6 h-6 rounded-full bg-[#0F3D2E] text-[#D4AF37] font-black text-xs flex items-center justify-center">
            2
          </span>
          <h2 className="font-['Outfit'] font-extrabold text-base text-[#0F3D2E]">
            Select Payment Method
          </h2>
        </div>

        <span className="text-[10px] text-[#0F3D2E] font-bold flex items-center space-x-1">
          <ShieldCheck className="w-3.5 h-3.5 text-[#0F3D2E]" />
          <span>256-Bit SSL Encrypted</span>
        </span>
      </div>

      {/* Payment Method Cards */}
      <div className="space-y-3">
        
        {/* 1. UPI */}
        <div 
          onClick={() => onSelectMethod('upi')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            selectedMethod === 'upi'
              ? 'bg-[#FCF7E8] border-[#D4AF37] shadow-xs'
              : 'bg-[#FBF8F1] border-[#D8E0DC] hover:border-[#D4AF37]/50'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Smartphone className="w-4 h-4 text-[#0F3D2E]" />
              <div>
                <span className="font-bold text-[#0F3D2E]">UPI Instant Pay (GPay, PhonePe, Paytm, BHIM)</span>
                <p className="text-[10px] text-[#5C6B63]">0% Transaction Fee • Fastest Checkout</p>
              </div>
            </div>
            {selectedMethod === 'upi' && <CheckCircle2 className="w-4 h-4 text-[#0F3D2E] fill-[#D4AF37]" />}
          </div>

          {selectedMethod === 'upi' && (
            <div className="mt-3 pt-3 border-t border-[#D4AF37]/40 space-y-2 animate-reveal" onClick={(e) => e.stopPropagation()}>
              <label className="text-[10px] font-bold text-[#0F3D2E] block">Enter Virtual Payment Address (VPA)</label>
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={upiId}
                  onChange={(e) => {
                    setUpiId(e.target.value);
                    setIsUpiVerified(false);
                  }}
                  placeholder="e.g. mobileNumber@upi or name@okhdfcbank"
                  className="flex-1 p-2 bg-white rounded-xl border border-[#D8E0DC] text-xs font-mono"
                />
                <button
                  type="button"
                  onClick={handleVerifyUpi}
                  className="px-4 py-2 bg-[#0F3D2E] text-[#FBF8F1] font-bold text-xs rounded-xl btn-interactive cursor-pointer"
                >
                  {isUpiVerified ? 'Verified ✓' : 'Verify'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 2. Credit Card (with Live EMI calculation) */}
        <div 
          onClick={() => onSelectMethod('card')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            selectedMethod === 'card'
              ? 'bg-[#FCF7E8] border-[#D4AF37] shadow-xs'
              : 'bg-[#FBF8F1] border-[#D8E0DC] hover:border-[#D4AF37]/50'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <CreditCard className="w-4 h-4 text-[#0F3D2E]" />
              <div>
                <span className="font-bold text-[#0F3D2E]">Credit / Debit Card (Visa, Mastercard, RuPay)</span>
                <p className="text-[10px] text-[#5C6B63]">Instant Reward Points & No-Cost EMI Eligible</p>
              </div>
            </div>
            {selectedMethod === 'card' && <CheckCircle2 className="w-4 h-4 text-[#0F3D2E] fill-[#D4AF37]" />}
          </div>

          {selectedMethod === 'card' && (
            <div className="mt-3 pt-3 border-t border-[#D4AF37]/40 space-y-3 animate-reveal" onClick={(e) => e.stopPropagation()}>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="text-[10px] font-bold text-[#5C6B63] block mb-1">Card Number</label>
                  <input
                    type="text"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    className="w-full p-2 bg-white rounded-xl border border-[#D8E0DC] text-xs font-mono"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-bold text-[#5C6B63] block mb-1">MM/YY</label>
                    <input
                      type="text"
                      value={cardExpiry}
                      onChange={(e) => setCardExpiry(e.target.value)}
                      className="w-full p-2 bg-white rounded-xl border border-[#D8E0DC] text-xs font-mono text-center"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-[#5C6B63] block mb-1">CVV</label>
                    <input
                      type="password"
                      maxLength={3}
                      value={cardCvv}
                      onChange={(e) => setCardCvv(e.target.value)}
                      placeholder="•••"
                      className="w-full p-2 bg-white rounded-xl border border-[#D8E0DC] text-xs font-mono text-center"
                    />
                  </div>
                </div>
              </div>

              {/* SPEC REQUIREMENT: EMI Options (if Total >= ₹3,000) */}
              {isEmiAvailable && (
                <div className="p-3 bg-white rounded-xl border border-[#D4AF37]/40 space-y-2">
                  <span className="font-bold text-[#0F3D2E] text-[11px] flex items-center space-x-1">
                    <Clock className="w-3.5 h-3.5 text-[#D4AF37]" />
                    <span>Select Easy Monthly Installment (EMI) Plan:</span>
                  </span>

                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { months: 3, rate: 0, label: 'No-Cost EMI' },
                      { months: 6, rate: 0, label: 'No-Cost EMI' },
                      { months: 12, rate: 0.12, label: 'Standard 12%' }
                    ].map((emi) => {
                      const totalWithInterest = payableAmount * (1 + (emi.rate ? emi.rate : 0));
                      const monthlyInstallment = Math.round(totalWithInterest / emi.months);
                      const isChosen = selectedEmiMonths === emi.months;

                      return (
                        <button
                          key={emi.months}
                          type="button"
                          onClick={() => setSelectedEmiMonths(emi.months)}
                          className={`p-2 rounded-lg border text-center transition-all cursor-pointer ${
                            isChosen
                              ? 'bg-[#FCF7E8] border-[#D4AF37] ring-1 ring-[#D4AF37]'
                              : 'bg-[#FBF8F1] border-[#D8E0DC]'
                          }`}
                        >
                          <span className="font-bold text-[#0F3D2E] block">{emi.months} Months</span>
                          <span className="font-black text-xs text-[#0F3D2E] block">₹{monthlyInstallment.toLocaleString('en-IN')}/mo</span>
                          <span className="text-[9px] text-[#0F3D2E] font-bold mt-0.5 block">{emi.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 3. Net Banking */}
        <div 
          onClick={() => onSelectMethod('netbanking')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            selectedMethod === 'netbanking'
              ? 'bg-[#FCF7E8] border-[#D4AF37] shadow-xs'
              : 'bg-[#FBF8F1] border-[#D8E0DC] hover:border-[#D4AF37]/50'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Landmark className="w-4 h-4 text-[#0F3D2E]" />
              <div>
                <span className="font-bold text-[#0F3D2E]">Net Banking (All Major Indian Banks)</span>
                <p className="text-[10px] text-[#5C6B63]">Direct instant bank transfer</p>
              </div>
            </div>
            {selectedMethod === 'netbanking' && <CheckCircle2 className="w-4 h-4 text-[#0F3D2E] fill-[#D4AF37]" />}
          </div>

          {selectedMethod === 'netbanking' && (
            <div className="mt-3 pt-3 border-t border-[#D4AF37]/40 space-y-2 animate-reveal" onClick={(e) => e.stopPropagation()}>
              <label className="text-[10px] font-bold text-[#5C6B63] block">Select Your Bank</label>
              <select
                value={selectedBank}
                onChange={(e) => setSelectedBank(e.target.value)}
                className="w-full p-2 bg-white rounded-xl border border-[#D8E0DC] text-xs font-bold text-[#0F3D2E]"
              >
                <option value="HDFC">HDFC Bank</option>
                <option value="ICICI">ICICI Bank</option>
                <option value="SBI">State Bank of India (SBI)</option>
                <option value="AXIS">Axis Bank</option>
                <option value="KOTAK">Kotak Mahindra Bank</option>
              </select>
            </div>
          )}
        </div>

        {/* 4. Cash on Delivery (COD with Strict PIN Eligibility Check) */}
        <div 
          onClick={() => {
            if (isCodEligible) onSelectMethod('cod');
          }}
          className={`p-4 rounded-2xl border transition-all ${
            !isCodEligible 
              ? 'opacity-60 bg-[#FBF8F1] border-[#D8E0DC] cursor-not-allowed'
              : selectedMethod === 'cod'
              ? 'bg-[#FCF7E8] border-[#D4AF37] shadow-xs cursor-pointer'
              : 'bg-[#FBF8F1] border-[#D8E0DC] hover:border-[#D4AF37]/50 cursor-pointer'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Banknote className="w-4 h-4 text-[#0F3D2E]" />
              <div>
                <span className="font-bold text-[#0F3D2E]">Cash on Delivery (COD)</span>
                <p className="text-[10px] text-[#5C6B63]">
                  {isCodEligible
                    ? 'Pay in cash or scan QR upon physical package delivery'
                    : 'Unavailable for the selected PIN code'}
                </p>
              </div>
            </div>
            {isCodEligible && selectedMethod === 'cod' && (
              <CheckCircle2 className="w-4 h-4 text-[#0F3D2E] fill-[#D4AF37]" />
            )}
          </div>

          {/* COD Error Message if PIN is non-eligible */}
          {!isCodEligible && (
            <div className="mt-2 text-[10px] text-[#C0392B] font-bold flex items-center space-x-1">
              <AlertTriangle className="w-3.5 h-3.5 text-[#C0392B] shrink-0" />
              <span>COD is restricted for PIN {selectedAddress?.pincode}. Please select UPI, Card, or Net Banking.</span>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
