import React, { useState } from 'react';
import { ArrowLeft, Mail, Loader2, Send } from 'lucide-react';

export default function ForgotPasswordStep({
  defaultIdentifier,
  onSendReset,
  onBackToLogin,
  isLoading,
  hasError,
  errorMessage
}) {
  const [resetIdentifier, setResetIdentifier] = useState(defaultIdentifier || '');
  const [isSent, setIsSent] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!resetIdentifier) return;
    onSendReset(resetIdentifier, () => setIsSent(true));
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
        <span>Back to Login</span>
      </button>

      {/* Heading */}
      <div className="mb-5">
        <h2 className="font-['Outfit'] text-2xl sm:text-3xl font-extrabold text-[#0F3D2E] tracking-tight">
          Reset Password
        </h2>
        <p className="text-xs sm:text-sm text-[#5C6B63] mt-1">
          Enter your registered email address or mobile number to receive a secure password reset link or OTP.
        </p>
      </div>

      {isSent ? (
        <div className="bg-[#E8F2EE] border border-[#0F3D2E]/20 p-5 rounded-2xl text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-[#0F3D2E] text-[#D4AF37] flex items-center justify-center mx-auto shadow-sm">
            <Send className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-sm text-[#0F3D2E]">Reset Link Dispatched!</h3>
          <p className="text-xs text-[#5C6B63]">
            We've sent password reset instructions to <strong className="text-[#0F3D2E]">{resetIdentifier}</strong>.
          </p>
          <button
            type="button"
            onClick={onBackToLogin}
            className="w-full py-2.5 bg-[#0F3D2E] text-[#FBF8F1] font-bold text-xs rounded-xl hover:bg-[#155440] transition-colors"
          >
            Return to Login
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <div>
            <label 
              htmlFor="reset-identifier" 
              className="block text-xs font-bold uppercase tracking-wider text-[#0F3D2E] mb-1.5"
            >
              Email or Mobile Number
            </label>
            <input
              id="reset-identifier"
              type="text"
              value={resetIdentifier}
              onChange={(e) => setResetIdentifier(e.target.value)}
              placeholder="e.g. name@example.com or 9876543210"
              aria-invalid={hasError ? "true" : "false"}
              aria-describedby={hasError ? "reset-error" : undefined}
              className={`w-full py-3 px-4 text-sm font-medium rounded-xl transition-all duration-200 bg-white border ${
                hasError
                  ? 'border-[#C0392B] ring-2 ring-[#C0392B]/20 text-[#0F3D2E]'
                  : 'border-[#D8E0DC] text-[#0F3D2E] focus:border-[#0F3D2E] focus:ring-2 focus:ring-[#0F3D2E]/20'
              } focus:outline-none shadow-xs`}
            />

            {hasError && (
              <div id="reset-error" aria-live="polite" className="text-xs font-semibold text-[#C0392B] mt-1.5">
                {errorMessage || "No account found matching this identifier. Please verify and retry."}
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 px-4 bg-[#0F3D2E] hover:bg-[#155440] active:bg-[#0A2A1F] text-[#FBF8F1] font-bold text-sm rounded-xl transition-all duration-200 shadow-md flex items-center justify-center space-x-2 focus:outline-none focus:ring-2 focus:ring-[#D4AF37] min-h-[48px]"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-[#D4AF37]" />
                <span>Sending Reset Link...</span>
              </>
            ) : (
              <>
                <span>Send Reset Link / OTP</span>
                <Send className="w-4 h-4 text-[#D4AF37]" />
              </>
            )}
          </button>
        </form>
      )}
    </div>
  );
}
