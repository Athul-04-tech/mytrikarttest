import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, Loader2, UserPlus } from 'lucide-react';

export default function RegisterStep({
  onRegister,
  onGoToLogin,
  isLoading,
  hasError,
  errorMessage,
  fieldErrors,
}) {
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [subscribeNewsletter, setSubscribeNewsletter] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(true);
  const [localError, setLocalError] = useState('');
  const [activeFieldErrors, setActiveFieldErrors] = useState({});

  // Sync incoming fieldErrors prop into local activeFieldErrors state
  useEffect(() => {
    if (fieldErrors && typeof fieldErrors === 'object') {
      const getMsg = (val) => {
        if (!val) return null;
        if (Array.isArray(val)) return typeof val[0] === 'string' ? val[0] : JSON.stringify(val[0]);
        return typeof val === 'string' ? val : String(val);
      };

      const mapped = {};
      if (fieldErrors.username) mapped.username = getMsg(fieldErrors.username);
      if (fieldErrors.email) mapped.email = getMsg(fieldErrors.email);
      if (fieldErrors.password) mapped.password = getMsg(fieldErrors.password);
      if (fieldErrors.name || fieldErrors.first_name || fieldErrors.full_name) {
        mapped.fullName = getMsg(fieldErrors.name || fieldErrors.first_name || fieldErrors.full_name);
      }

      // Phone number mapping: check phone_number, mobile, phone, or phone-related non_field_errors
      const phoneVal = fieldErrors.phone_number || fieldErrors.mobile || fieldErrors.phone;
      if (phoneVal) {
        mapped.mobile = getMsg(phoneVal);
      } else if (fieldErrors.non_field_errors) {
        const nfMsg = getMsg(fieldErrors.non_field_errors);
        if (nfMsg && /phone|mobile|number/i.test(nfMsg)) {
          mapped.mobile = nfMsg;
        }
      }

      setActiveFieldErrors(mapped);
    } else {
      setActiveFieldErrors({});
    }
  }, [fieldErrors]);

  const clearFieldError = (fieldName) => {
    setActiveFieldErrors((prev) => {
      if (!prev[fieldName]) return prev;
      const updated = { ...prev };
      delete updated[fieldName];
      return updated;
    });
    if (localError) setLocalError('');
  };

  const usernameError = activeFieldErrors.username || null;
  const fullNameError = activeFieldErrors.fullName || null;
  const emailError = activeFieldErrors.email || null;
  const mobileError = activeFieldErrors.mobile || null;
  const passwordError = activeFieldErrors.password || null;
  const confirmPasswordError = activeFieldErrors.confirmPassword || null;

  const handleSubmit = (e) => {
    e.preventDefault();
    setLocalError('');

    const newFieldErrors = {};

    if (!username.trim()) {
      newFieldErrors.username = 'Username is required.';
    }
    if (!email.trim()) {
      newFieldErrors.email = 'Email address is required.';
    }
    if (!password) {
      newFieldErrors.password = 'Password is required.';
    } else if (password !== confirmPassword) {
      newFieldErrors.confirmPassword = 'Passwords do not match.';
    }

    if (Object.keys(newFieldErrors).length > 0) {
      setActiveFieldErrors((prev) => ({ ...prev, ...newFieldErrors }));
      return;
    }

    if (!agreeTerms) {
      setLocalError('You must agree to the Terms of Service and Privacy Policy.');
      return;
    }

    onRegister({
      username: username.trim(),
      name: fullName.trim(),
      email: email.trim(),
      mobile: mobile.trim(),
      password,
      confirmPassword,
      subscribeNewsletter,
    });
  };

  return (
    <div className="w-full animate-dropdown">
      {/* Heading */}
      <div className="mb-4">
        <h2 className="font-['Outfit'] text-2xl sm:text-3xl font-extrabold text-[#FA661C] tracking-tight">
          Create Account
        </h2>
        <p className="text-xs text-[#6B6058] mt-1">
          Join MytriKart Marketplace to unlock exclusive discounts, express deliveries, and Gold rewards.
        </p>
      </div>

      {/* Registration Form */}
      <form onSubmit={handleSubmit} noValidate className="space-y-3">
        
        {/* Username & Full Name Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {/* Username (Required) */}
          <div>
            <label 
              htmlFor="reg-username" 
              className="block text-[11px] font-bold uppercase tracking-wider text-[#FA661C] mb-1"
            >
              Username <span className="text-[#D7263D]">*</span>
            </label>
            <input
              id="reg-username"
              type="text"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                clearFieldError('username');
              }}
              placeholder="e.g. aarav_sharma"
              aria-invalid={usernameError ? 'true' : 'false'}
              aria-describedby={usernameError ? 'username-error' : undefined}
              className={`w-full py-2.5 px-3.5 text-xs sm:text-sm font-medium rounded-xl transition-all duration-150 bg-white border text-[#FA661C] focus:outline-none shadow-xs ${
                usernameError
                  ? 'border-[#D7263D] ring-2 ring-[#D7263D]/20'
                  : 'border-[#EAE3DC] focus:border-[#FA661C] focus:ring-2 focus:ring-[#FA661C]/20'
              }`}
            />
            {usernameError && (
              <p id="username-error" className="text-[11px] font-semibold text-[#D7263D] mt-1">
                {usernameError}
              </p>
            )}
          </div>

          {/* Full Name */}
          <div>
            <label 
              htmlFor="reg-fullname" 
              className="block text-[11px] font-bold uppercase tracking-wider text-[#FA661C] mb-1"
            >
              Full Name
            </label>
            <input
              id="reg-fullname"
              type="text"
              value={fullName}
              onChange={(e) => {
                setFullName(e.target.value);
                clearFieldError('fullName');
              }}
              placeholder="e.g. Aarav Sharma"
              aria-invalid={fullNameError ? 'true' : 'false'}
              aria-describedby={fullNameError ? 'fullname-error' : undefined}
              className={`w-full py-2.5 px-3.5 text-xs sm:text-sm font-medium rounded-xl transition-all duration-150 bg-white border text-[#FA661C] focus:outline-none shadow-xs ${
                fullNameError
                  ? 'border-[#D7263D] ring-2 ring-[#D7263D]/20'
                  : 'border-[#EAE3DC] focus:border-[#FA661C] focus:ring-2 focus:ring-[#FA661C]/20'
              }`}
            />
            {fullNameError && (
              <p id="fullname-error" className="text-[11px] font-semibold text-[#D7263D] mt-1">
                {fullNameError}
              </p>
            )}
          </div>
        </div>

        {/* Email Address & Mobile Number Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {/* Email */}
          <div>
            <label 
              htmlFor="reg-email" 
              className="block text-[11px] font-bold uppercase tracking-wider text-[#FA661C] mb-1"
            >
              Email Address <span className="text-[#D7263D]">*</span>
            </label>
            <input
              id="reg-email"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                clearFieldError('email');
              }}
              placeholder="name@example.com"
              aria-invalid={emailError ? 'true' : 'false'}
              aria-describedby={emailError ? 'email-error' : undefined}
              className={`w-full py-2.5 px-3.5 text-xs sm:text-sm font-medium rounded-xl transition-all duration-150 bg-white border text-[#FA661C] focus:outline-none shadow-xs ${
                emailError
                  ? 'border-[#D7263D] ring-2 ring-[#D7263D]/20'
                  : 'border-[#EAE3DC] focus:border-[#FA661C] focus:ring-2 focus:ring-[#FA661C]/20'
              }`}
            />
            {emailError && (
              <p id="email-error" className="text-[11px] font-semibold text-[#D7263D] mt-1">
                {emailError}
              </p>
            )}
          </div>

          {/* Mobile Number (Optional per backend RegisterSerializer: required=False, allow_blank=True) */}
          <div>
            <label 
              htmlFor="reg-mobile" 
              className="block text-[11px] font-bold uppercase tracking-wider text-[#FA661C] mb-1"
            >
              Mobile Number <span className="text-[10px] font-normal lowercase tracking-normal text-[#6B6058]">(optional)</span>
            </label>
            <input
              id="reg-mobile"
              type="tel"
              maxLength={20}
              value={mobile}
              onChange={(e) => {
                setMobile(e.target.value);
                clearFieldError('mobile');
              }}
              placeholder="e.g. 9876543210"
              aria-invalid={mobileError ? 'true' : 'false'}
              aria-describedby={mobileError ? 'mobile-error' : undefined}
              className={`w-full py-2.5 px-3.5 text-xs sm:text-sm font-medium rounded-xl transition-all duration-150 bg-white border text-[#FA661C] focus:outline-none shadow-xs ${
                mobileError
                  ? 'border-[#D7263D] ring-2 ring-[#D7263D]/20'
                  : 'border-[#EAE3DC] focus:border-[#FA661C] focus:ring-2 focus:ring-[#FA661C]/20'
              }`}
            />
            {mobileError && (
              <p id="mobile-error" className="text-[11px] font-semibold text-[#D7263D] mt-1">
                {mobileError}
              </p>
            )}
          </div>
        </div>

        {/* Password & Confirm Password Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {/* Password */}
          <div>
            <label 
              htmlFor="reg-password" 
              className="block text-[11px] font-bold uppercase tracking-wider text-[#FA661C] mb-1"
            >
              Password <span className="text-[#D7263D]">*</span>
            </label>
            <div className="relative">
              <input
                id="reg-password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  clearFieldError('password');
                  if (confirmPasswordError === 'Passwords do not match.') {
                    clearFieldError('confirmPassword');
                  }
                }}
                placeholder="Min. 8 chars"
                aria-invalid={passwordError ? 'true' : 'false'}
                aria-describedby={passwordError ? 'password-error' : undefined}
                className={`w-full py-2.5 pl-3.5 pr-9 text-xs sm:text-sm font-medium rounded-xl transition-all duration-150 bg-white border text-[#FA661C] focus:outline-none shadow-xs ${
                  passwordError
                    ? 'border-[#D7263D] ring-2 ring-[#D7263D]/20'
                    : 'border-[#EAE3DC] focus:border-[#FA661C] focus:ring-2 focus:ring-[#FA661C]/20'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#6B6058] hover:text-[#FA661C] p-1 cursor-pointer"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
            {passwordError && (
              <p id="password-error" className="text-[11px] font-semibold text-[#D7263D] mt-1">
                {passwordError}
              </p>
            )}
          </div>

          {/* Confirm Password */}
          <div>
            <label 
              htmlFor="reg-confirm-password" 
              className="block text-[11px] font-bold uppercase tracking-wider text-[#FA661C] mb-1"
            >
              Confirm Password <span className="text-[#D7263D]">*</span>
            </label>
            <div className="relative">
              <input
                id="reg-confirm-password"
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  clearFieldError('confirmPassword');
                }}
                placeholder="Re-enter password"
                aria-invalid={confirmPasswordError ? 'true' : 'false'}
                aria-describedby={confirmPasswordError ? 'confirm-password-error' : undefined}
                className={`w-full py-2.5 pl-3.5 pr-9 text-xs sm:text-sm font-medium rounded-xl transition-all duration-150 bg-white border text-[#FA661C] focus:outline-none shadow-xs ${
                  confirmPasswordError
                    ? 'border-[#D7263D] ring-2 ring-[#D7263D]/20'
                    : 'border-[#EAE3DC] focus:border-[#FA661C] focus:ring-2 focus:ring-[#FA661C]/20'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#6B6058] hover:text-[#FA661C] p-1 cursor-pointer"
                aria-label={showConfirmPassword ? "Hide password" : "Show password"}
              >
                {showConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
            {confirmPasswordError && (
              <p id="confirm-password-error" className="text-[11px] font-semibold text-[#D7263D] mt-1">
                {confirmPasswordError}
              </p>
            )}
          </div>
        </div>

        {/* Newsletter Subscription Checkbox */}
        <label className="flex items-start space-x-2 text-[11px] sm:text-xs text-[#6B6058] cursor-pointer pt-1">
          <input
            type="checkbox"
            checked={subscribeNewsletter}
            onChange={(e) => setSubscribeNewsletter(e.target.checked)}
            className="rounded border-[#EAE3DC] text-[#FA661C] focus:ring-[#FA661C] mt-0.5"
          />
          <span>
            Subscribe to MytriKart weekly deal alerts, price drop notifications & trend news.
          </span>
        </label>

        {/* Terms Agreement Checkbox */}
        <label className="flex items-start space-x-2 text-[11px] sm:text-xs text-[#6B6058] cursor-pointer">
          <input
            type="checkbox"
            checked={agreeTerms}
            onChange={(e) => {
              setAgreeTerms(e.target.checked);
              if (localError) setLocalError('');
            }}
            className="rounded border-[#EAE3DC] text-[#FA661C] focus:ring-[#FA661C] mt-0.5"
          />
          <span>
            I agree to the <a href="#terms" className="text-[#FA661C] font-bold underline">Terms of Service</a> and <a href="#privacy" className="text-[#FA661C] font-bold underline">Privacy Policy</a>.
          </span>
        </label>

        {/* Error Validation Banner (Only for general errors: non_field_errors, detail, or form-level errors) */}
        {(localError || (hasError && errorMessage)) && (
          <div id="register-general-error" aria-live="polite" className="text-xs font-semibold text-[#D7263D] bg-[#FDE8EA] p-2.5 rounded-lg border border-[#D7263D]/30">
            {localError || errorMessage}
          </div>
        )}

        {/* Primary CTA Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-3 px-4 bg-[#FA661C] hover:bg-[#E0530B] active:bg-[#0A2A1F] text-[#000000] font-black text-sm rounded-xl transition-all duration-150 shadow-md flex items-center justify-center space-x-2 focus:outline-none focus:ring-2 focus:ring-[#FF811A] min-h-[46px] cursor-pointer"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-[#000000]" />
              <span className="text-[#000000]">Creating Account...</span>
            </>
          ) : (
            <>
              <span className="text-[#000000]">Create Account</span>
              <UserPlus className="w-4 h-4 text-[#000000]" />
            </>
          )}
        </button>
      </form>

      {/* Social Registration Divider */}
      <div className="relative flex items-center justify-center my-4">
        <div className="border-t border-[#EAE3DC] w-full" />
        <span className="bg-[#FFFFFF] px-3 text-[10px] uppercase font-bold text-[#6B6058] absolute">
          OR SIGN UP WITH
        </span>
      </div>

      {/* Social Buttons */}
      <div className="grid grid-cols-1 gap-2">
        <button
          type="button"
          onClick={() => alert("Google Social Signup placeholder")}
          className="py-2 px-3 bg-white hover:bg-[#FFF8F2] text-[#FA661C] border border-[#EAE3DC] hover:border-[#FF811A] rounded-xl text-xs font-bold transition-all duration-150 flex items-center justify-center space-x-2 shadow-xs group cursor-pointer"
        >
          <svg className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
          </svg>
          <span>Google</span>
        </button>
      </div>

      {/* Switch to Login */}
      <div className="mt-3 pt-2.5 border-t border-[#EAE3DC] text-center text-xs text-[#6B6058]">
        <span>Already have an account? </span>
        <button
          type="button"
          onClick={onGoToLogin}
          className="font-bold text-[#FF811A] hover:text-[#E66E08] hover:underline ml-1 cursor-pointer"
        >
          Login
        </button>
      </div>
    </div>
  );
}
