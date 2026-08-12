import React from 'react';
import OtpInputBoxes from './OtpInputBoxes';
import { ShieldAlert, ArrowLeft, Loader2, CheckCircle2, Smartphone } from 'lucide-react';

export default function TwoFactorStep({
  twoFactorValues,
  setTwoFactorValues,
  onVerify2FA,
  onBackToLogin,
  isLoading,
  hasError,
  errorMessage
}) {
  const handleSubmit = (e) => {
    e.preventDefault();
    onVerify2FA();
  };

  return (
    <div className="w-full animate-dropdown">
      {/* Back Button */}
      <button
        type="button"
        onClick={onBackToLogin}
        className="inline-flex items-center space-x-1 text-xs font-bold text-[#5C6B63] hover:text-[#0F3D2E] mb-4 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Cancel & Back</span>
      </button>

      {/* Heading */}
      <div className="mb-4">
        <div className="inline-flex items-center space-x-1.5 bg-[#FCF7E8] text-[#0F3D2E] border border-[#D4AF37]/40 px-2.5 py-1 rounded-full text-xs font-bold mb-2">
          <ShieldAlert className="w-3.5 h-3.5 text-[#D4AF37]" />
          <span>Two-Factor Authentication Enabled</span>
        </div>
        <h2 className="font-['Outfit'] text-2xl sm:text-3xl font-extrabold text-[#0F3D2E] tracking-tight">
          2-Step Verification
        </h2>
        <p className="text-xs text-[#5C6B63] mt-1 leading-relaxed">
          For enhanced security, enter the 6-digit code from your authenticator app (e.g. Google Authenticator) or security SMS.
        </p>
      </div>

      {/* 2FA Form */}
      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-[#0F3D2E]">
            Enter 6-Digit Authenticator Code
          </label>

          <OtpInputBoxes
            length={6}
            value={twoFactorValues}
            onChange={setTwoFactorValues}
            hasError={hasError}
          />

          {hasError && (
            <div aria-live="polite" className="text-xs font-semibold text-[#C0392B] mt-1">
              {errorMessage || "Invalid security verification code. Please check your authenticator."}
            </div>
          )}
        </div>

        {/* Primary CTA */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-3.5 px-4 bg-[#0F3D2E] hover:bg-[#155440] active:bg-[#0A2A1F] text-[#FBF8F1] font-bold text-sm rounded-xl transition-all duration-200 shadow-md flex items-center justify-center space-x-2 focus:outline-none focus:ring-2 focus:ring-[#D4AF37] min-h-[48px]"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-[#D4AF37]" />
              <span>Verifying Code...</span>
            </>
          ) : (
            <>
              <span>Verify & Complete Login</span>
              <CheckCircle2 className="w-4 h-4 text-[#D4AF37]" />
            </>
          )}
        </button>

        <div className="text-center pt-1">
          <button
            type="button"
            onClick={() => alert("Fallback: SMS OTP triggered to registered phone")}
            className="text-xs font-semibold text-[#5C6B63] hover:text-[#0F3D2E] hover:underline transition-colors flex items-center justify-center space-x-1.5 mx-auto"
          >
            <Smartphone className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span>Try another verification method (SMS)</span>
          </button>
        </div>
      </form>
    </div>
  );
}
