import React, { useState, useEffect } from 'react';
import OtpInputBoxes from './OtpInputBoxes';
import { ArrowLeft, Loader2, RefreshCw, CheckCircle2 } from 'lucide-react';

export default function OtpVerificationStep({
  identifier,
  otpValues,
  setOtpValues,
  onVerifyOtp,
  onResendOtp,
  onChangeIdentifier,
  isLoading,
  hasError,
  errorMessage
}) {
  const [secondsLeft, setSecondsLeft] = useState(30);
  const [canResend, setCanResend] = useState(false);

  useEffect(() => {
    if (secondsLeft <= 0) {
      setCanResend(true);
      return;
    }
    const timer = setInterval(() => {
      setSecondsLeft((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [secondsLeft]);

  const handleResend = async () => {
    if (onResendOtp) {
      await onResendOtp();
    }
    setSecondsLeft(30);
    setCanResend(false);
  };

  const maskedIdentifier = identifier
    ? identifier.includes('@')
      ? identifier.replace(/(.{2})(.*)(?=@)/, (_, a, b) => a + '••••')
      : identifier.replace(/(\d{2})(\d+)(\d{2})/, (_, a, b, c) => a + '••••••' + c)
    : 'Account Identifier';

  const isOtpComplete = otpValues.every((d) => d !== '');

  const handleSubmit = (e) => {
    e.preventDefault();
    onVerifyOtp();
  };

  return (
    <div className="w-full animate-dropdown">
      {/* Back Button */}
      <button
        type="button"
        onClick={onChangeIdentifier}
        className="inline-flex items-center space-x-1 text-xs font-bold text-[#6B6058] hover:text-[#FA661C] mb-4 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Login</span>
      </button>

      {/* Heading */}
      <div className="mb-4">
        <h2 className="font-['Outfit'] text-2xl sm:text-3xl font-extrabold text-[#FA661C] tracking-tight">
          Verify OTP
        </h2>
        <div className="text-xs text-[#6B6058] mt-1 flex flex-wrap items-center gap-1">
          <span>OTP sent for</span>
          <strong className="text-[#FA661C]">{maskedIdentifier}</strong>
          <button
            type="button"
            onClick={onChangeIdentifier}
            className="text-[#FF811A] hover:underline font-bold ml-1"
          >
            Change
          </button>
        </div>
      </div>

      {/* OTP Form */}
      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-[#FA661C]">
            Enter 6-Digit OTP
          </label>

          {/* 6 Digit Auto-Advancing Boxes */}
          <OtpInputBoxes
            length={6}
            value={otpValues}
            onChange={setOtpValues}
            hasError={hasError}
          />

          {/* Error Message */}
          {hasError && (
            <div aria-live="polite" className="text-xs font-semibold text-[#D7263D] mt-1">
              {errorMessage || "Invalid OTP code entered. Please try again."}
            </div>
          )}
        </div>

        {/* Resend OTP Row */}
        <div className="flex items-center justify-between text-xs text-[#6B6058] pt-1">
          <span>Didn't receive code?</span>
          {canResend ? (
            <button
              type="button"
              onClick={handleResend}
              disabled={isLoading}
              className="text-xs font-bold text-[#FF811A] hover:text-[#E66E08] hover:underline flex items-center space-x-1 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Resend OTP</span>
            </button>
          ) : (
            <span className="font-medium text-[#D7263D]">
              Resend OTP in 00:{secondsLeft < 10 ? `0${secondsLeft}` : secondsLeft}
            </span>
          )}
        </div>

        {/* Primary CTA */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-3.5 px-4 bg-[#FA661C] hover:bg-[#E0530B] active:bg-[#0A2A1F] text-[#000000] font-black text-sm rounded-xl transition-all duration-200 shadow-md flex items-center justify-center space-x-2 focus:outline-none focus:ring-2 focus:ring-[#FF811A] min-h-[48px] cursor-pointer"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-[#000000]" />
              <span className="text-[#000000]">Verifying OTP...</span>
            </>
          ) : (
            <>
              <span className="text-[#000000]">Verify & Continue</span>
              <CheckCircle2 className="w-4 h-4 text-[#000000]" />
            </>
          )}
        </button>
      </form>
    </div>
  );
}
