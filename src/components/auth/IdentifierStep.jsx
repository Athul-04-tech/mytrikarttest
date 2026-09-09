import React, { useState } from 'react';
import { Mail, Phone, Lock, Loader2, Sparkles, ArrowRight } from 'lucide-react';

export default function IdentifierStep({
  identifier,
  setIdentifier,
  onRequestOtp,
  onGoToPassword,
  onGoToRegister,
  onGuestCheckout,
  isLoading,
  hasError,
  errorMessage
}) {
  const handleSubmit = (e) => {
    e.preventDefault();
    onRequestOtp();
  };

  return (
    <div className="w-full animate-dropdown">
      {/* Heading */}
      <div className="mb-5">
        <h2 className="font-['Outfit'] text-2xl sm:text-3xl font-extrabold text-[#FA661C] tracking-tight">
          Login
        </h2>
        <p className="text-xs sm:text-sm text-[#6B6058] mt-1">
          Enter your Email or Mobile Number to access your account
        </p>
      </div>

      {/* Main Identifier Form */}
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <div>
          <label 
            htmlFor="user-identifier" 
            className="block text-xs font-bold uppercase tracking-wider text-[#FA661C] mb-1.5"
          >
            Email or Mobile Number
          </label>
          <div className="relative">
            <input
              id="user-identifier"
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="e.g. name@example.com or 9876543210"
              aria-invalid={hasError ? "true" : "false"}
              aria-describedby={hasError ? "identifier-error" : undefined}
              className={`w-full py-3 px-4 text-sm font-medium rounded-xl transition-all duration-200 bg-white border input-interactive ${
                hasError
                  ? 'border-[#D7263D] ring-2 ring-[#D7263D]/20 text-[#FA661C]'
                  : 'border-[#EAE3DC] text-[#FA661C]'
              } shadow-xs`}
            />
          </div>

          {/* Validation Error Message (Brick-Red) */}
          {hasError && (
            <div id="identifier-error" aria-live="polite" className="text-xs font-semibold text-[#D7263D] mt-1.5 flex items-center space-x-1">
              <span>{errorMessage || "Please enter a valid email or 10-digit mobile number."}</span>
            </div>
          )}
        </div>

        {/* Primary CTA Button: Request OTP */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-3.5 px-4 bg-[#FA661C] hover:bg-[#E0530B] active:bg-[#0A2A1F] text-[#000000] font-black text-sm rounded-xl btn-interactive shadow-md flex items-center justify-center space-x-2 focus:outline-none focus:ring-2 focus:ring-[#FF811A] min-h-[48px] cursor-pointer"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-[#000000]" />
              <span className="text-[#000000]">Sending OTP...</span>
            </>
          ) : (
            <>
              <span className="text-[#000000]">Request OTP</span>
              <ArrowRight className="w-4 h-4 text-[#000000] icon-interactive" />
            </>
          )}
        </button>

        {/* Password Login Alternate Path */}
        <button
          type="button"
          onClick={onGoToPassword}
          className="w-full py-2.5 px-4 bg-[#FFFFFF] hover:bg-[#FFF3EC] text-[#000000] border border-[#EAE3DC] hover:border-[#FA661C] font-bold text-xs rounded-xl btn-interactive flex items-center justify-center space-x-1.5 cursor-pointer"
        >
          <Lock className="w-3.5 h-3.5 text-[#000000] icon-interactive" />
          <span className="text-[#000000]">Login with Password instead</span>
        </button>
      </form>

      {/* Divider */}
      <div className="relative flex items-center justify-center my-5">
        <div className="border-t border-[#EAE3DC] w-full" />
        <span className="bg-[#FFFFFF] px-3 text-[11px] uppercase font-bold text-[#6B6058] absolute">
          OR
        </span>
      </div>

      {/* Social Login Buttons (Google & Facebook) */}
      <div className="grid grid-cols-2 gap-2.5">
        {/* Google Button */}
        <button
          type="button"
          onClick={() => alert("Google Social OAuth placeholder")}
          className="py-2.5 px-3 bg-white hover:bg-[#FFF8F2] text-[#FA661C] border border-[#EAE3DC] hover:border-[#FF811A] rounded-xl text-xs font-bold btn-interactive flex items-center justify-center space-x-2 shadow-xs group cursor-pointer"
        >
          <svg className="w-4 h-4 group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
          </svg>
          <span>Google</span>
        </button>

        {/* Facebook Button */}
        <button
          type="button"
          onClick={() => alert("Facebook Social OAuth placeholder")}
          className="py-2.5 px-3 bg-white hover:bg-[#FFF8F2] text-[#FA661C] border border-[#EAE3DC] hover:border-[#FF811A] rounded-xl text-xs font-bold btn-interactive flex items-center justify-center space-x-2 shadow-xs group cursor-pointer"
        >
          <svg className="w-4 h-4 fill-[#1877F2] group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
          </svg>
          <span>Facebook</span>
        </button>
      </div>

      {/* Guest Checkout Option */}
      <div className="mt-4 text-center">
        <button
          type="button"
          onClick={onGuestCheckout}
          className="text-xs font-semibold text-[#6B6058] hover:text-[#FA661C] link-interactive cursor-pointer"
        >
          Continue as Guest →
        </button>
      </div>

      {/* Registration Bottom Row */}
      <div className="mt-6 pt-4 border-t border-[#EAE3DC] text-center text-xs text-[#6B6058]">
        <span>New to MytriKart? </span>
        <button
          type="button"
          onClick={onGoToRegister}
          className="font-bold text-[#FF811A] hover:text-[#E66E08] link-interactive ml-1 cursor-pointer"
        >
          Create Account
        </button>
      </div>
    </div>
  );
}
