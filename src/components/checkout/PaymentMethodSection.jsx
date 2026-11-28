import React, { useState } from 'react';
import {
  CreditCard,
  Smartphone,
  Landmark,
  Banknote,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import { useToast } from '../../context/ToastContext';

export default function PaymentMethodSection({
  selectedMethod,
  onSelectMethod,
  selectedAddress,
}) {
  const [upiId, setUpiId] = useState('');
  const [isUpiVerified, setIsUpiVerified] = useState(false);
  const [cardNumber, setCardNumber] = useState('4532 •••• •••• 8492');
  const [cardExpiry, setCardExpiry] = useState('08/29');
  const [cardCvv, setCardCvv] = useState('');
  const [selectedBank, setSelectedBank] = useState('HDFC');

  const toast = useToast();

  const isCodEligible = selectedAddress?.isCodEligible ?? true;

  const handleVerifyUpi = (e) => {
    e.preventDefault();
    if (!upiId || !upiId.includes('@')) {
      toast.error(
        'Invalid UPI',
        'Please enter a valid UPI ID (e.g. yourname@okhdfcbank).'
      );
      return;
    }
    setIsUpiVerified(true);
    toast.success(
      'UPI Verified',
      `Linked to ${upiId.toUpperCase()} (Verified Account)`
    );
  };

  return (
    <div className="bg-white rounded-3xl border border-[#EAE3DC] p-5 sm:p-6 shadow-xs space-y-4 text-xs">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[#EAE3DC]">
        <div className="flex items-center space-x-2">
          <span className="w-6 h-6 rounded-full bg-[#FA661C] text-[#FF811A] font-black text-xs flex items-center justify-center">
            2
          </span>
          <h2 className="font-['Outfit'] font-extrabold text-base text-[#FA661C]">
            Select Payment Method
          </h2>
        </div>

        <span className="text-[10px] text-[#FA661C] font-bold flex items-center space-x-1">
          <ShieldCheck className="w-3.5 h-3.5 text-[#FA661C]" />
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
              ? 'bg-[#FFF8F2] border-[#FF811A] shadow-xs'
              : 'bg-[#FFFFFF] border-[#EAE3DC] hover:border-[#FF811A]/50'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Smartphone className="w-4 h-4 text-[#FA661C]" />
              <div>
                <span className="font-bold text-[#FA661C]">
                  UPI Instant Pay (GPay, PhonePe, Paytm, BHIM)
                </span>
                <p className="text-[10px] text-[#6B6058]">
                  Fastest Checkout
                </p>
              </div>
            </div>
            {selectedMethod === 'upi' && (
              <CheckCircle2 className="w-4 h-4 text-[#FA661C] fill-[#FF811A]" />
            )}
          </div>

          {selectedMethod === 'upi' && (
            <div
              className="mt-3 pt-3 border-t border-[#FF811A]/40 space-y-2 animate-reveal"
              onClick={(e) => e.stopPropagation()}
            >
              <label className="text-[10px] font-bold text-[#FA661C] block">
                Enter Virtual Payment Address (VPA)
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={upiId}
                  onChange={(e) => {
                    setUpiId(e.target.value);
                    setIsUpiVerified(false);
                  }}
                  placeholder="e.g. mobileNumber@upi or name@okhdfcbank"
                  className="flex-1 p-2 bg-white rounded-xl border border-[#EAE3DC] text-xs font-mono"
                />
                <button
                  type="button"
                  onClick={handleVerifyUpi}
                  className="px-4 py-2 bg-[#FA661C] text-[#FFFFFF] font-bold text-xs rounded-xl btn-interactive cursor-pointer"
                >
                  {isUpiVerified ? 'Verified ✓' : 'Verify'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 2. Credit Card */}
        <div
          onClick={() => onSelectMethod('card')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            selectedMethod === 'card'
              ? 'bg-[#FFF8F2] border-[#FF811A] shadow-xs'
              : 'bg-[#FFFFFF] border-[#EAE3DC] hover:border-[#FF811A]/50'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <CreditCard className="w-4 h-4 text-[#FA661C]" />
              <div>
                <span className="font-bold text-[#FA661C]">
                  Credit / Debit Card (Visa, Mastercard, RuPay)
                </span>
                <p className="text-[10px] text-[#6B6058]">
                  Standard card payment
                </p>
              </div>
            </div>
            {selectedMethod === 'card' && (
              <CheckCircle2 className="w-4 h-4 text-[#FA661C] fill-[#FF811A]" />
            )}
          </div>

          {selectedMethod === 'card' && (
            <div
              className="mt-3 pt-3 border-t border-[#FF811A]/40 space-y-3 animate-reveal"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="text-[10px] font-bold text-[#6B6058] block mb-1">
                    Card Number
                  </label>
                  <input
                    type="text"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    className="w-full p-2 bg-white rounded-xl border border-[#EAE3DC] text-xs font-mono"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-bold text-[#6B6058] block mb-1">
                      MM/YY
                    </label>
                    <input
                      type="text"
                      value={cardExpiry}
                      onChange={(e) => setCardExpiry(e.target.value)}
                      className="w-full p-2 bg-white rounded-xl border border-[#EAE3DC] text-xs font-mono text-center"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-[#6B6058] block mb-1">
                      CVV
                    </label>
                    <input
                      type="password"
                      maxLength={3}
                      value={cardCvv}
                      onChange={(e) => setCardCvv(e.target.value)}
                      placeholder="•••"
                      className="w-full p-2 bg-white rounded-xl border border-[#EAE3DC] text-xs font-mono text-center"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 3. Net Banking */}
        <div
          onClick={() => onSelectMethod('netbanking')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            selectedMethod === 'netbanking'
              ? 'bg-[#FFF8F2] border-[#FF811A] shadow-xs'
              : 'bg-[#FFFFFF] border-[#EAE3DC] hover:border-[#FF811A]/50'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Landmark className="w-4 h-4 text-[#FA661C]" />
              <div>
                <span className="font-bold text-[#FA661C]">
                  Net Banking (All Major Indian Banks)
                </span>
                <p className="text-[10px] text-[#6B6058]">
                  Direct instant bank transfer
                </p>
              </div>
            </div>
            {selectedMethod === 'netbanking' && (
              <CheckCircle2 className="w-4 h-4 text-[#FA661C] fill-[#FF811A]" />
            )}
          </div>

          {selectedMethod === 'netbanking' && (
            <div
              className="mt-3 pt-3 border-t border-[#FF811A]/40 space-y-2 animate-reveal"
              onClick={(e) => e.stopPropagation()}
            >
              <label className="text-[10px] font-bold text-[#6B6058] block">
                Select Your Bank
              </label>
              <select
                value={selectedBank}
                onChange={(e) => setSelectedBank(e.target.value)}
                className="w-full p-2 bg-white rounded-xl border border-[#EAE3DC] text-xs font-bold text-[#FA661C]"
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

        {/* 4. Cash on Delivery */}
        <div
          onClick={() => {
            if (isCodEligible) onSelectMethod('cod');
          }}
          className={`p-4 rounded-2xl border transition-all ${
            !isCodEligible
              ? 'opacity-60 bg-[#FFFFFF] border-[#EAE3DC] cursor-not-allowed'
              : selectedMethod === 'cod'
              ? 'bg-[#FFF8F2] border-[#FF811A] shadow-xs cursor-pointer'
              : 'bg-[#FFFFFF] border-[#EAE3DC] hover:border-[#FF811A]/50 cursor-pointer'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Banknote className="w-4 h-4 text-[#FA661C]" />
              <div>
                <span className="font-bold text-[#FA661C]">
                  Cash on Delivery (COD)
                </span>
                <p className="text-[10px] text-[#6B6058]">
                  {isCodEligible
                    ? 'Pay in cash or scan QR upon physical package delivery'
                    : 'Unavailable for the selected PIN code'}
                </p>
              </div>
            </div>
            {isCodEligible && selectedMethod === 'cod' && (
              <CheckCircle2 className="w-4 h-4 text-[#FA661C] fill-[#FF811A]" />
            )}
          </div>

          {!isCodEligible && (
            <div className="mt-2 text-[10px] text-[#D7263D] font-bold flex items-center space-x-1">
              <AlertTriangle className="w-3.5 h-3.5 text-[#D7263D] shrink-0" />
              <span>
                COD is restricted for PIN {selectedAddress?.pincode}. Please
                select UPI, Card, or Net Banking.
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
