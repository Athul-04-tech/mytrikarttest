import React, { useState } from 'react';
import { Eye, EyeOff, Lock, ArrowLeft, Loader2, KeyRound } from 'lucide-react';

export default function PasswordStep({
  identifier,
  onLogin,
  onGoToForgot,
  onSwitchToOtp,
  onBackToIdentifier,
  isLoading,
  hasError,
  errorMessage
}) {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    onLogin(password);
  };

  return (
    <div className="w-full animate-dropdown">
      {/* Back Button */}
      <button
        type="button"
        onClick={onBackToIdentifier}
        className="inline-flex items-center space-x-1 text-xs font-bold text-[#5C6B63] hover:text-[#0F3D2E] mb-4 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Change Email / Mobile</span>
      </button>

      {/* Heading */}
      <div className="mb-5">
        <h2 className="font-['Outfit'] text-2xl sm:text-3xl font-extrabold text-[#0F3D2E] tracking-tight">
          Enter Password
        </h2>
        <p className="text-xs text-[#5C6B63] mt-1">
          Logging into account: <strong className="text-[#0F3D2E]">{identifier || 'user@example.com'}</strong>
        </p>
      </div>

      {/* Password Form */}
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label 
              htmlFor="user-password" 
              className="text-xs font-bold uppercase tracking-wider text-[#0F3D2E]"
            >
              Password
            </label>
            <button
              type="button"
              onClick={onGoToForgot}
              className="text-xs font-bold text-[#D4AF37] hover:text-[#B59325] hover:underline"
            >
              Forgot Password?
            </button>
          </div>

          <div className="relative">
            <input
              id="user-password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your account password"
              aria-invalid={hasError ? "true" : "false"}
              aria-describedby={hasError ? "password-error" : undefined}
              className={`w-full py-3 pl-4 pr-11 text-sm font-medium rounded-xl transition-all duration-200 bg-white border ${
                hasError
                  ? 'border-[#C0392B] ring-2 ring-[#C0392B]/20 text-[#0F3D2E]'
                  : 'border-[#D8E0DC] text-[#0F3D2E] focus:border-[#0F3D2E] focus:ring-2 focus:ring-[#0F3D2E]/20'
              } focus:outline-none shadow-xs`}
            />

            {/* Show / Hide Toggle Button */}
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#5C6B63] hover:text-[#0F3D2E] p-1"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {/* Validation Error Message */}
          {hasError && (
            <div id="password-error" aria-live="polite" className="text-xs font-semibold text-[#C0392B] mt-1.5">
              {errorMessage || "Incorrect password entered. Please try again or use OTP."}
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
              <span>Verifying Password...</span>
            </>
          ) : (
            <>
              <span>Login</span>
              <Lock className="w-4 h-4 text-[#D4AF37]" />
            </>
          )}
        </button>

        {/* Switch to OTP Login button */}
        <button
          type="button"
          onClick={onSwitchToOtp}
          className="w-full py-2.5 px-4 bg-[#FBF8F1] hover:bg-[#E8F2EE] text-[#0F3D2E] border border-[#D8E0DC] hover:border-[#0F3D2E] font-bold text-xs rounded-xl transition-colors flex items-center justify-center space-x-1.5"
        >
          <KeyRound className="w-3.5 h-3.5 text-[#D4AF37]" />
          <span>Login with OTP instead</span>
        </button>
      </form>
    </div>
  );
}
