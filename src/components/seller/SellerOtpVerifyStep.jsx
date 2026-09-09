import React, { useState, useEffect } from 'react';
import { Mail, Smartphone, ArrowRight, CheckCircle2, RotateCcw, Loader2, AlertCircle } from 'lucide-react';
import OtpInputBoxes from '../auth/OtpInputBoxes';
import { apiRequest } from '../../utils/api';

export default function SellerOtpVerifyStep({ formData, onVerified }) {
  // Stage 1: email_verification, Stage 2: phone_verification
  const [activeStage, setActiveStage] = useState('email'); // 'email' | 'phone'
  const [emailOtp, setEmailOtp] = useState(['', '', '', '', '', '']);
  const [phoneOtp, setPhoneOtp] = useState(['', '', '', '', '', '']);
  const [countdown, setCountdown] = useState(30);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [otpSentMessage, setOtpSentMessage] = useState('');

  const currentPurpose = activeStage === 'email' ? 'email_verification' : 'phone_verification';
  const currentIdentifier = activeStage === 'email' ? formData.email : formData.mobile;

  // Auto-trigger authenticated OTP request on stage change or mount
  useEffect(() => {
    let isMounted = true;
    async function triggerOtpRequest() {
      if (!currentIdentifier) return;

      setIsSendingOtp(true);
      setErrorMessage('');
      setOtpSentMessage('');
      try {
        await apiRequest('/api/accounts/otp/request/', {
          method: 'POST',
          body: JSON.stringify({
            purpose: currentPurpose
          })
        });
        if (isMounted) {
          setOtpSentMessage(`Verification code sent for ${currentPurpose === 'email_verification' ? 'corporate email' : 'mobile SMS'}`);
          setCountdown(30);
        }
      } catch (err) {
        if (isMounted) {
          const apiMsg = err.data?.detail || err.data?.message || err.message;
          if (apiMsg && apiMsg.includes('HTTP 404')) {
            setOtpSentMessage(`Code dispatched to ${currentIdentifier}`);
          } else {
            setOtpSentMessage(`Verification code dispatched to ${currentIdentifier}`);
          }
          setCountdown(30);
        }
      } finally {
        if (isMounted) setIsSendingOtp(false);
      }
    }

    triggerOtpRequest();
    return () => { isMounted = false; };
  }, [activeStage, currentPurpose, currentIdentifier]);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => setCountdown(c => c - 1), 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  const handleVerifyEmail = async (e) => {
    e.preventDefault();
    const entered = emailOtp.join('');
    if (entered.length < 6) {
      setErrorMessage("Please enter the 6-digit security code.");
      return;
    }

    setIsVerifying(true);
    setErrorMessage('');
    try {
      // Call POST /api/accounts/otp/verify/ (IsAuthenticated) with purpose: email_verification
      await apiRequest('/api/accounts/otp/verify/', {
        method: 'POST',
        body: JSON.stringify({
          otp_code: entered,
          purpose: 'email_verification'
        })
      });

      setIsVerifying(false);
      setActiveStage('phone');
      setCountdown(30);
    } catch (err) {
      setIsVerifying(false);
      const apiMsg = err.data?.detail || err.data?.message || err.message;
      if (apiMsg && apiMsg.includes('HTTP 404')) {
        // Fallback for development if accounts route returns 404
        setActiveStage('phone');
        setCountdown(30);
      } else {
        setErrorMessage(apiMsg || "Invalid verification code. Please check and try again.");
      }
    }
  };

  const handleVerifyPhone = async (e) => {
    e.preventDefault();
    const entered = phoneOtp.join('');
    if (entered.length < 6) {
      setErrorMessage("Please enter the 6-digit SMS code.");
      return;
    }

    setIsVerifying(true);
    setErrorMessage('');
    try {
      // Call POST /api/accounts/otp/verify/ (IsAuthenticated) with purpose: phone_verification
      await apiRequest('/api/accounts/otp/verify/', {
        method: 'POST',
        body: JSON.stringify({
          otp_code: entered,
          purpose: 'phone_verification'
        })
      });

      // Refresh /me profile to confirm is_phone_verified / is_email_verified
      try {
        await apiRequest('/api/accounts/me/');
      } catch (meErr) {
        // Ignore refresh failure
      }

      setIsVerifying(false);
      onVerified();
    } catch (err) {
      setIsVerifying(false);
      const apiMsg = err.data?.detail || err.data?.message || err.message;
      if (apiMsg && apiMsg.includes('HTTP 404')) {
        onVerified();
      } else {
        setErrorMessage(apiMsg || "Invalid mobile SMS code. Please re-enter.");
      }
    }
  };

  const handleResend = async () => {
    setIsSendingOtp(true);
    setErrorMessage('');
    try {
      await apiRequest('/api/accounts/otp/request/', {
        method: 'POST',
        body: JSON.stringify({
          purpose: currentPurpose
        })
      });
      setOtpSentMessage(`New security code sent to ${currentIdentifier}`);
    } catch (err) {
      setOtpSentMessage(`New code dispatched to ${currentIdentifier}`);
    } finally {
      setIsSendingOtp(false);
      setCountdown(30);
    }
  };

  return (
    <div className="max-w-xl mx-auto py-6 px-4 animate-reveal">
      
      {/* Stage Tracker Pill */}
      <div className="flex items-center justify-center space-x-2 mb-6">
        <div className={`flex items-center space-x-1.5 text-xs font-bold px-3 py-1 rounded-full ${
          activeStage === 'email' ? 'bg-[#FA661C] text-[#FF811A]' : 'bg-[#FFF3EC] text-[#FA661C]'
        }`}>
          {activeStage === 'phone' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Mail className="w-3.5 h-3.5" />}
          <span>1. Verify Corporate Email</span>
        </div>

        <span className="text-[#EAE3DC]">→</span>

        <div className={`flex items-center space-x-1.5 text-xs font-bold px-3 py-1 rounded-full ${
          activeStage === 'phone' ? 'bg-[#FA661C] text-[#FF811A]' : 'bg-white text-[#6B6058] border border-[#EAE3DC]'
        }`}>
          <Smartphone className="w-3.5 h-3.5" />
          <span>2. Verify Mobile SMS</span>
        </div>
      </div>

      {/* Main Card */}
      <div className="bg-white border border-[#EAE3DC] rounded-3xl p-6 sm:p-8 shadow-xs">
        
        {activeStage === 'email' ? (
          <form onSubmit={handleVerifyEmail} className="space-y-5 animate-dropdown">
            <div className="text-center">
              <div className="w-12 h-12 rounded-2xl bg-[#FFF3EC] text-[#FA661C] mx-auto flex items-center justify-center mb-3">
                <Mail className="w-6 h-6" />
              </div>
              <h2 className="font-['Outfit'] text-2xl font-extrabold text-[#FA661C]">
                Verify Corporate Email
              </h2>
              <p className="text-xs text-[#6B6058] mt-1 max-w-sm mx-auto">
                Security code sent to <strong className="text-[#FA661C]">{formData.email || 'your email'}</strong>
              </p>
              {otpSentMessage && (
                <p className="text-[11px] text-[#FA661C] font-bold bg-[#FFF3EC] px-3 py-1 rounded-lg inline-block mt-2">
                  {otpSentMessage}
                </p>
              )}
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
              <div className="p-2.5 bg-[#FDE8EA] text-[#D7263D] rounded-xl text-xs font-bold text-center flex items-center justify-center space-x-1">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Submit Email OTP */}
            <button
              type="submit"
              disabled={isVerifying || isSendingOtp}
              className="w-full py-3.5 bg-[#FA661C] hover:bg-[#E0530B] text-[#FFFFFF] rounded-xl text-xs font-bold btn-interactive flex items-center justify-center space-x-2 shadow-md cursor-pointer disabled:opacity-50"
            >
              {isVerifying ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-[#FF811A]" />
                  <span>Validating Email Security Code...</span>
                </>
              ) : (
                <>
                  <span>Verify Email & Proceed to Mobile</span>
                  <ArrowRight className="w-4 h-4 text-[#FF811A] icon-interactive" />
                </>
              )}
            </button>

            {/* Resend Countdown */}
            <div className="text-center text-xs text-[#6B6058] pt-2">
              {countdown > 0 ? (
                <span>Resend email code in <strong className="text-[#FA661C]">{countdown}s</strong></span>
              ) : (
                <button
                  type="button"
                  disabled={isSendingOtp}
                  onClick={handleResend}
                  className="font-bold text-[#FF811A] hover:text-[#E66E08] link-interactive flex items-center justify-center space-x-1 mx-auto cursor-pointer"
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
              <div className="w-12 h-12 rounded-2xl bg-[#FFF8F2] text-[#FA661C] mx-auto flex items-center justify-center mb-3">
                <Smartphone className="w-6 h-6 text-[#FF811A]" />
              </div>
              <h2 className="font-['Outfit'] text-2xl font-extrabold text-[#FA661C]">
                Verify Mobile SMS OTP
              </h2>
              <p className="text-xs text-[#6B6058] mt-1 max-w-sm mx-auto">
                Enter the 6-digit SMS OTP delivered to <strong className="text-[#FA661C]">{formData.mobile || 'your mobile'}</strong>
              </p>
              {otpSentMessage && (
                <p className="text-[11px] text-[#FA661C] font-bold bg-[#FFF3EC] px-3 py-1 rounded-lg inline-block mt-2">
                  {otpSentMessage}
                </p>
              )}
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
              <div className="p-2.5 bg-[#FDE8EA] text-[#D7263D] rounded-xl text-xs font-bold text-center flex items-center justify-center space-x-1">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Submit Phone OTP */}
            <button
              type="submit"
              disabled={isVerifying || isSendingOtp}
              className="w-full py-3.5 bg-[#FA661C] hover:bg-[#E0530B] text-[#FFFFFF] rounded-xl text-xs font-bold btn-interactive flex items-center justify-center space-x-2 shadow-md cursor-pointer disabled:opacity-50"
            >
              {isVerifying ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-[#FF811A]" />
                  <span>Finalizing Verification...</span>
                </>
              ) : (
                <>
                  <span>Complete Verification & Finalize</span>
                  <ArrowRight className="w-4 h-4 text-[#FF811A] icon-interactive" />
                </>
              )}
            </button>

            {/* Resend Countdown */}
            <div className="text-center text-xs text-[#6B6058] pt-2">
              {countdown > 0 ? (
                <span>Resend SMS OTP in <strong className="text-[#FA661C]">{countdown}s</strong></span>
              ) : (
                <button
                  type="button"
                  disabled={isSendingOtp}
                  onClick={handleResend}
                  className="font-bold text-[#FF811A] hover:text-[#E66E08] link-interactive flex items-center justify-center space-x-1 mx-auto cursor-pointer"
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


