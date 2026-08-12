import React, { useState, useEffect } from 'react';
import { Mail, Smartphone, ArrowRight, ShieldCheck, CheckCircle2, RotateCcw, Loader2 } from 'lucide-react';
import OtpInputBoxes from '../auth/OtpInputBoxes';

export default function SellerOtpVerifyStep({ formData, onVerified }) {
  // Step A: Email OTP, Step B: Phone OTP
  const [activeStage, setActiveStage] = useState('email'); // 'email' | 'phone'
  const [emailOtp, setEmailOtp] = useState(['5', '8', '2', '', '', '']);
  const [phoneOtp, setPhoneOtp] = useState(['4', '1', '9', '', '', '']);
  const [countdown, setCountdown] = useState(30);
  const [isVerifying, setIsVerifying] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => setCountdown(c => c - 1), 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  const handleVerifyEmail = (e) => {
    e.preventDefault();
    const entered = emailOtp.join('');
    if (entered.length < 6) {
      setErrorMessage("Please enter the 6-digit code sent to your email.");
      return;
    }

    setIsVerifying(true);
    setErrorMessage('');
    setTimeout(() => {
      setIsVerifying(false);
      // Advance to Phone OTP stage
      setActiveStage('phone');
      setCountdown(30);
    }, 600);
  };

  const handleVerifyPhone = (e) => {
    e.preventDefault();
    const entered = phoneOtp.join('');
    if (entered.length < 6) {
      setErrorMessage("Please enter the 6-digit code sent to your mobile.");
      return;
    }

    setIsVerifying(true);
    setErrorMessage('');
    setTimeout(() => {
      setIsVerifying(false);
      onVerified();
    }, 600);
  };

  const handleResend = () => {
    setCountdown(30);
    setErrorMessage('');
  };

  return (
    <div className="max-w-xl mx-auto py-6 px-4 animate-reveal">
      
      {/* Stage Tracker Pill */}
      <div className="flex items-center justify-center space-x-2 mb-6">
        <div className={`flex items-center space-x-1.5 text-xs font-bold px-3 py-1 rounded-full ${
          activeStage === 'email' ? 'bg-[#0F3D2E] text-[#D4AF37]' : 'bg-[#E8F2EE] text-[#0F3D2E]'
        }`}>
          {activeStage === 'phone' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Mail className="w-3.5 h-3.5" />}
          <span>1. Verify Corporate Email</span>
        </div>

        <span className="text-[#D8E0DC]">→</span>

        <div className={`flex items-center space-x-1.5 text-xs font-bold px-3 py-1 rounded-full ${
          activeStage === 'phone' ? 'bg-[#0F3D2E] text-[#D4AF37]' : 'bg-white text-[#5C6B63] border border-[#D8E0DC]'
        }`}>
          <Smartphone className="w-3.5 h-3.5" />
          <span>2. Verify Mobile SMS</span>
        </div>
      </div>

      {/* Main Card */}
      <div className="bg-white border border-[#D8E0DC] rounded-3xl p-6 sm:p-8 shadow-xs">
        
        {activeStage === 'email' ? (
          <form onSubmit={handleVerifyEmail} className="space-y-5 animate-dropdown">
            <div className="text-center">
              <div className="w-12 h-12 rounded-2xl bg-[#E8F2EE] text-[#0F3D2E] mx-auto flex items-center justify-center mb-3">
                <Mail className="w-6 h-6" />
              </div>
              <h2 className="font-['Outfit'] text-2xl font-extrabold text-[#0F3D2E]">
                Verify Corporate Email
              </h2>
              <p className="text-xs text-[#5C6B63] mt-1 max-w-sm mx-auto">
                We sent a 6-digit verification security code to <strong className="text-[#0F3D2E]">{formData.email || 'your-email@brand.com'}</strong>
              </p>
            </div>

            {/* 6 Digit OTP Boxes */}
            <div className="my-4">
              <OtpInputBoxes
                length={6}
                value={emailOtp}
                onChange={setEmailOtp}
                hasError={!!errorMessage}
              />
            </div>

            {errorMessage && (
              <p className="text-xs text-[#C0392B] font-bold text-center">{errorMessage}</p>
            )}

            {/* Submit Email OTP */}
            <button
              type="submit"
              disabled={isVerifying}
              className="w-full py-3.5 bg-[#0F3D2E] hover:bg-[#155440] text-[#FBF8F1] rounded-xl text-xs font-bold btn-interactive flex items-center justify-center space-x-2 shadow-md cursor-pointer"
            >
              {isVerifying ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-[#D4AF37]" />
                  <span>Validating Email Security Code...</span>
                </>
              ) : (
                <>
                  <span>Verify Email & Proceed to Mobile</span>
                  <ArrowRight className="w-4 h-4 text-[#D4AF37] icon-interactive" />
                </>
              )}
            </button>

            {/* Resend Countdown */}
            <div className="text-center text-xs text-[#5C6B63] pt-2">
              {countdown > 0 ? (
                <span>Resend email code in <strong className="text-[#0F3D2E]">{countdown}s</strong></span>
              ) : (
                <button
                  type="button"
                  onClick={handleResend}
                  className="font-bold text-[#D4AF37] hover:text-[#B59325] link-interactive flex items-center justify-center space-x-1 mx-auto"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Resend Code to Email</span>
                </button>
              )}
            </div>
          </form>
        ) : (
          <form onSubmit={handleVerifyPhone} className="space-y-5 animate-dropdown">
            <div className="text-center">
              <div className="w-12 h-12 rounded-2xl bg-[#FCF7E8] text-[#0F3D2E] mx-auto flex items-center justify-center mb-3">
                <Smartphone className="w-6 h-6 text-[#D4AF37]" />
              </div>
              <h2 className="font-['Outfit'] text-2xl font-extrabold text-[#0F3D2E]">
                Verify Mobile SMS OTP
              </h2>
              <p className="text-xs text-[#5C6B63] mt-1 max-w-sm mx-auto">
                Enter the 6-digit SMS OTP delivered to <strong className="text-[#0F3D2E]">{formData.mobile || '+91 98765 43210'}</strong>
              </p>
            </div>

            {/* 6 Digit OTP Boxes */}
            <div className="my-4">
              <OtpInputBoxes
                length={6}
                value={phoneOtp}
                onChange={setPhoneOtp}
                hasError={!!errorMessage}
              />
            </div>

            {errorMessage && (
              <p className="text-xs text-[#C0392B] font-bold text-center">{errorMessage}</p>
            )}

            {/* Submit Phone OTP */}
            <button
              type="submit"
              disabled={isVerifying}
              className="w-full py-3.5 bg-[#0F3D2E] hover:bg-[#155440] text-[#FBF8F1] rounded-xl text-xs font-bold btn-interactive flex items-center justify-center space-x-2 shadow-md cursor-pointer"
            >
              {isVerifying ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-[#D4AF37]" />
                  <span>Submitting to Admin Review Queue...</span>
                </>
              ) : (
                <>
                  <span>Complete Verification & Finalize</span>
                  <ArrowRight className="w-4 h-4 text-[#D4AF37] icon-interactive" />
                </>
              )}
            </button>

            {/* Resend Countdown */}
            <div className="text-center text-xs text-[#5C6B63] pt-2">
              {countdown > 0 ? (
                <span>Resend SMS OTP in <strong className="text-[#0F3D2E]">{countdown}s</strong></span>
              ) : (
                <button
                  type="button"
                  onClick={handleResend}
                  className="font-bold text-[#D4AF37] hover:text-[#B59325] link-interactive flex items-center justify-center space-x-1 mx-auto"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Resend SMS OTP</span>
                </button>
              )}
            </div>
          </form>
        )}

      </div>

    </div>
  );
}
