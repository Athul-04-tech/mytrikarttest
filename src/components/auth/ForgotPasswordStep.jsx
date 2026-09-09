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
        className="inline-flex items-center space-x-1 text-xs font-bold text-[#6B6058] hover:text-[#FA661C] mb-4 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Login</span>
      </button>

      {/* Heading */}
      <div className="mb-5">
        <h2 className="font-['Outfit'] text-2xl sm:text-3xl font-extrabold text-[#FA661C] tracking-tight">
          Reset Password
        </h2>
        <p className="text-xs sm:text-sm text-[#6B6058] mt-1">
          Enter your registered email address or mobile number to receive a secure password reset link or OTP.
        </p>
      </div>

      {isSent ? (
        <div className="bg-[#FFF3EC] border border-[#FA661C]/20 p-5 rounded-2xl text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-[#FA661C] text-[#FF811A] flex items-center justify-center mx-auto shadow-sm">
            <Send className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-sm text-[#FA661C]">Reset Link Dispatched!</h3>
          <p className="text-xs text-[#6B6058]">
            We've sent password reset instructions to <strong className="text-[#FA661C]">{resetIdentifier}</strong>.
          </p>
          <button
            type="button"
            onClick={onBackToLogin}
            className="w-full py-2.5 bg-[#FA661C] text-[#FFFFFF] font-bold text-xs rounded-xl hover:bg-[#E0530B] transition-colors"
          >
            Return to Login
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <div>
            <label 
              htmlFor="reset-identifier" 
              className="block text-xs font-bold uppercase tracking-wider text-[#FA661C] mb-1.5"
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
                  ? 'border-[#D7263D] ring-2 ring-[#D7263D]/20 text-[#FA661C]'
                  : 'border-[#EAE3DC] text-[#FA661C] focus:border-[#FA661C] focus:ring-2 focus:ring-[#FA661C]/20'
              } focus:outline-none shadow-xs`}
            />

            {hasError && (
              <div id="reset-error" aria-live="polite" className="text-xs font-semibold text-[#D7263D] mt-1.5">
                {errorMessage || "No account found matching this identifier. Please verify and retry."}
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 px-4 bg-[#FA661C] hover:bg-[#E0530B] active:bg-[#0A2A1F] text-[#FFFFFF] font-bold text-sm rounded-xl transition-all duration-200 shadow-md flex items-center justify-center space-x-2 focus:outline-none focus:ring-2 focus:ring-[#FF811A] min-h-[48px]"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-[#FF811A]" />
                <span>Sending Reset Link...</span>
              </>
            ) : (
              <>
                <span>Send Reset Link / OTP</span>
                <Send className="w-4 h-4 text-[#FF811A]" />
              </>
            )}
          </button>
        </form>
      )}
    </div>
  );
}
