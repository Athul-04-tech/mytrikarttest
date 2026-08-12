import React, { useState, useEffect } from 'react';
import OtpInputBoxes from './OtpInputBoxes';
import { ArrowLeft, Loader2, RefreshCw, CheckCircle2 } from 'lucide-react';

export default function OtpVerificationStep({
  identifier,
  otpValues,
  setOtpValues,
  onVerifyOtp,
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

  const handleResend = () => {
    setSecondsLeft(30);
    setCanResend(false);
    alert("New dummy OTP sent: 123456");
  };

  const maskedIdentifier = identifier
    ? identifier.includes('@')
      ? identifier.replace(/(.{2})(.*)(?=@)/, (_, a, b) => a + '••••')
      : identifier.replace(/(\d{2})(\d+)(\d{2})/, (_, a, b, c) => a + '••••••' + c)
    : '+91 98765•••••';

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
        className="inline-flex items-center space-x-1 text-xs font-bold text-[#5C6B63] hover:text-[#0F3D2E] mb-4 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Login</span>
      </button>

      {/* Heading */}
      <div className="mb-4">
        <h2 className="font-['Outfit'] text-2xl sm:text-3xl font-extrabold text-[#0F3D2E] tracking-tight">
          Verify OTP
        </h2>
        <div className="text-xs text-[#5C6B63] mt-1 flex flex-wrap items-center gap-1">
          <span>OTP sent to</span>
          <strong className="text-[#0F3D2E]">{maskedIdentifier}</strong>
          <button
            type="button"
            onClick={onChangeIdentifier}
            className="text-[#D4AF37] hover:underline font-bold ml-1"
          >
            Change
          </button>
        </div>
      </div>

      {/* OTP Form */}
      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-[#0F3D2E]">
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
            <div aria-live="polite" className="text-xs font-semibold text-[#C0392B] mt-1">
              {errorMessage || "Invalid OTP code entered. Please try again."}
            </div>
          )}
        </div>

        {/* Resend OTP Row */}
        <div className="flex items-center justify-between text-xs text-[#5C6B63] pt-1">
          <span>Didn't receive code?</span>
          {canResend ? (
            <button
              type="button"
              onClick={handleResend}
              className="text-xs font-bold text-[#D4AF37] hover:text-[#B59325] hover:underline flex items-center space-x-1"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Resend OTP</span>
            </button>
          ) : (
            <span className="font-medium text-[#C0392B]">
              Resend OTP in 00:{secondsLeft < 10 ? `0${secondsLeft}` : secondsLeft}
            </span>
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
              <span>Verifying OTP...</span>
            </>
          ) : (
            <>
              <span>Verify & Continue</span>
              <CheckCircle2 className="w-4 h-4 text-[#D4AF37]" />
            </>
          )}
        </button>

        {/* Demo Hint */}
        <p className="text-[11px] text-center text-[#5C6B63]/80">
          Tip: You can paste any 6-digit code or type <strong className="text-[#0F3D2E]">123456</strong>
        </p>
      </form>
    </div>
  );
}
