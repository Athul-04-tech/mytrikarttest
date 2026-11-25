import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import {
  ShieldCheck,
  KeyRound,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  Clock,
  Lock,
  Eye,
  EyeOff,
  Warehouse,
} from 'lucide-react';
import { apiRequest } from '../utils/api';

const GENERIC_INVALID_LINK_MSG =
  'This link is invalid or has expired. Ask your admin for a new one.';
const THROTTLE_ERROR_MSG =
  'Too many attempts, please try again later.';

export default function WarehouseSetupPage() {
  const navigate = useNavigate();
  const location = useLocation();

  // Read token ONCE into a ref in memory; never persist to storage or logs
  const tokenRef = useRef(null);
  const [initialTokenMissing] = useState(() => {
    const searchStr =
      location?.search ||
      (typeof window !== 'undefined' ? window.location.search : '');
    const params = new URLSearchParams(searchStr);
    const raw = params.get('token');
    if (raw && raw.trim()) {
      tokenRef.current = raw;
      return false;
    }
    return true;
  });

  // Immediately strip ?token=... from the browser address bar so it never stays in history or leaks via Referer
  useEffect(() => {
    document.title = 'Warehouse Manager Account Setup — MytriKart';
    if (
      typeof window !== 'undefined' &&
      window.history &&
      typeof window.history.replaceState === 'function'
    ) {
      window.history.replaceState({}, document.title, '/warehouse/setup');
    }
  }, []);

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [setupComplete, setSetupComplete] = useState(false);

  // Error states
  const [invalidLinkError, setInvalidLinkError] = useState(
    initialTokenMissing ? GENERIC_INVALID_LINK_MSG : ''
  );
  const [throttleError, setThrottleError] = useState('');
  const [passwordErrors, setPasswordErrors] = useState([]);
  const [confirmError, setConfirmError] = useState('');
  const [networkError, setNetworkError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setThrottleError('');
    setPasswordErrors([]);
    setConfirmError('');
    setNetworkError('');

    if (!tokenRef.current) {
      setInvalidLinkError(GENERIC_INVALID_LINK_MSG);
      return;
    }

    // Client-side check: password match check ONLY (no client-side password complexity rules)
    if (newPassword !== confirmPassword) {
      setConfirmError('Passwords do not match.');
      return;
    }

    setSubmitting(true);
    try {
      await apiRequest('/api/accounts/warehouse-setup/', {
        method: 'POST',
        body: JSON.stringify({
          token: tokenRef.current,
          password: newPassword,
        }),
        skipAuth: true,
      });

      // Clear one-time token from memory immediately on success
      tokenRef.current = null;
      setNewPassword('');
      setConfirmPassword('');
      setSetupComplete(true);
    } catch (err) {
      const status = err?.status;
      const data = err?.data;

      if (status === 429) {
        setThrottleError(THROTTLE_ERROR_MSG);
      } else if (status === 400) {
        // Check if server returned password validation messages
        const pwdMsgs = [];
        if (data?.password) {
          const items = Array.isArray(data.password) ? data.password : [data.password];
          items.forEach((m) => pwdMsgs.push(String(m)));
        } else if (data?.detail && typeof data.detail === 'object' && !Array.isArray(data.detail) && data.detail.password) {
          const items = Array.isArray(data.detail.password)
            ? data.detail.password
            : [data.detail.password];
          items.forEach((m) => pwdMsgs.push(String(m)));
        } else if (Array.isArray(data?.detail)) {
          const isTokenMsg = data.detail.some((m) =>
            /invalid setup token/i.test(String(m))
          );
          if (!isTokenMsg) {
            data.detail.forEach((m) => pwdMsgs.push(String(m)));
          }
        } else if (
          typeof data?.detail === 'string' &&
          !/invalid setup token/i.test(data.detail) &&
          /password/i.test(data.detail)
        ) {
          pwdMsgs.push(data.detail);
        }

        if (pwdMsgs.length > 0) {
          setPasswordErrors(pwdMsgs);
        } else {
          // Generic 400 for wrong, expired, used, or revoked setup token
          setInvalidLinkError(GENERIC_INVALID_LINK_MSG);
        }
      } else {
        setNetworkError(
          data?.detail || err?.message || 'Unable to complete setup. Please try again.'
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FFFFFF] flex flex-col justify-between font-sans text-[#1A2420] selection:bg-[#FF811A]/30 selection:text-[#FA661C]">
      {/* Minimal Header */}
      <header className="border-b border-[#EAE3DC] bg-white px-4 sm:px-8 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link to="/login" className="flex items-center space-x-2.5">
            <img
              src="/mytrikart-logo.png"
              alt="MytriKart Logo"
              className="h-8 w-auto object-contain"
            />
            <span className="text-[10px] font-black uppercase tracking-wider bg-[#FFF3EC] text-[#FA661C] border border-[#FA661C]/30 px-2 py-0.5 rounded-md">
              Warehouse Access
            </span>
          </Link>
          <Link
            to="/login"
            className="text-xs font-bold text-[#6B6058] hover:text-[#FA661C] transition-colors"
          >
            Go to Sign In →
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6">
        <div className="max-w-md w-full bg-white rounded-3xl border border-[#EAE3DC] shadow-xl p-6 sm:p-8 space-y-6 animate-reveal">
          {/* Header Badge */}
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-2xl bg-[#FFF3EC] border border-[#FA661C]/20 text-[#FA661C] flex items-center justify-center shrink-0">
              <Warehouse className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-[#FA661C]">
                One-Time Account Activation
              </span>
              <h1 className="font-['Outfit'] text-xl sm:text-2xl font-extrabold text-[#1A2420]">
                Set Your Warehouse Password
              </h1>
            </div>
          </div>

          {/* STATE 1: Setup Complete */}
          {setupComplete ? (
            <div
              data-testid="setup-success-card"
              className="p-5 rounded-2xl bg-[#ECFDF5] border border-[#10B981]/40 space-y-4 text-center"
            >
              <div className="w-12 h-12 rounded-full bg-[#10B981] text-white mx-auto flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div className="space-y-1.5">
                <h2 className="font-['Outfit'] font-extrabold text-lg text-[#065F46]">
                  Password Set Successfully
                </h2>
                <p className="text-xs text-[#047857]">
                  Your warehouse manager account is now active. You can sign in on the login page using your username and new password.
                </p>
              </div>
              <button
                type="button"
                data-testid="setup-go-to-login-btn"
                onClick={() => navigate('/login')}
                className="w-full py-3 px-4 rounded-xl bg-[#FA661C] hover:bg-[#E0530B] text-white font-bold text-xs flex items-center justify-center space-x-2 transition-colors cursor-pointer shadow-xs"
              >
                <span>Continue to Sign In</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ) : invalidLinkError && initialTokenMissing ? (
            /* STATE 2: Missing Token in URL */
            <div
              data-testid="setup-invalid-link-error"
              role="alert"
              className="p-5 rounded-2xl bg-[#FFF3F3] border border-[#FCA5A5] space-y-3"
            >
              <div className="flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-[#DC2626] shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h2 className="font-bold text-sm text-[#991B1B]">
                    Setup Link Unavailable
                  </h2>
                  <p className="text-xs text-[#7F1D1D]">{invalidLinkError}</p>
                </div>
              </div>
              <div className="pt-2">
                <Link
                  to="/login"
                  className="inline-flex items-center space-x-1.5 text-xs font-bold text-[#FA661C] hover:underline"
                >
                  <span>Return to Login Page</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ) : (
            /* STATE 3: Password Setup Form */
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <p className="text-xs text-[#6B6058]">
                Choose a password to activate your warehouse manager account. Once completed, this setup link cannot be used again.
              </p>

              {/* Generic Invalid / Expired / Revoked / Used Token Message */}
              {invalidLinkError && (
                <div
                  data-testid="setup-invalid-link-error"
                  role="alert"
                  className="p-4 rounded-2xl bg-[#FFF3F3] border border-[#FCA5A5] flex items-start space-x-2.5 text-xs text-[#991B1B]"
                >
                  <AlertCircle className="w-4 h-4 text-[#DC2626] shrink-0 mt-0.5" />
                  <span>{invalidLinkError}</span>
                </div>
              )}

              {/* 429 Throttle Message */}
              {throttleError && (
                <div
                  data-testid="setup-throttle-error"
                  role="alert"
                  className="p-4 rounded-2xl bg-[#FFFBEB] border border-[#F59E0B]/50 flex items-start space-x-2.5 text-xs text-[#92400E]"
                >
                  <Clock className="w-4 h-4 text-[#D97706] shrink-0 mt-0.5" />
                  <span>{throttleError}</span>
                </div>
              )}

              {/* Network / Unexpected Server Error */}
              {networkError && (
                <div
                  data-testid="setup-network-error"
                  role="alert"
                  className="p-4 rounded-2xl bg-[#FFF3F3] border border-[#FCA5A5] flex items-start space-x-2.5 text-xs text-[#991B1B]"
                >
                  <AlertCircle className="w-4 h-4 text-[#DC2626] shrink-0 mt-0.5" />
                  <span>{networkError}</span>
                </div>
              )}

              {/* New Password Field */}
              <div className="space-y-1.5">
                <label
                  htmlFor="warehouse-new-password"
                  className="block text-xs font-bold text-[#1A2420]"
                >
                  New Password <span className="text-[#DC2626]">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#6B6058] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="warehouse-new-password"
                    data-testid="setup-new-password-input"
                    type={showNewPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value);
                      if (passwordErrors.length > 0) setPasswordErrors([]);
                      if (confirmError) setConfirmError('');
                    }}
                    placeholder="Enter new password"
                    className={`w-full pl-10 pr-10 py-2.5 rounded-xl border text-xs outline-none transition-colors ${
                      passwordErrors.length > 0
                        ? 'border-[#DC2626] bg-[#FFF3F3]/40'
                        : 'border-[#EAE3DC] focus:border-[#FA661C]'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B6058] hover:text-[#FA661C] cursor-pointer"
                    aria-label={showNewPassword ? 'Hide new password' : 'Show new password'}
                  >
                    {showNewPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>

                {/* Server Password Validation Errors */}
                {passwordErrors.length > 0 && (
                  <div
                    data-testid="setup-password-error"
                    role="alert"
                    className="space-y-1 pt-1"
                  >
                    {passwordErrors.map((msg, idx) => (
                      <p
                        key={idx}
                        className="text-[11px] font-semibold text-[#DC2626] flex items-start space-x-1.5"
                      >
                        <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                        <span>{msg}</span>
                      </p>
                    ))}
                  </div>
                )}
              </div>

              {/* Confirm Password Field */}
              <div className="space-y-1.5">
                <label
                  htmlFor="warehouse-confirm-password"
                  className="block text-xs font-bold text-[#1A2420]"
                >
                  Confirm Password <span className="text-[#DC2626]">*</span>
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-[#6B6058] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="warehouse-confirm-password"
                    data-testid="setup-confirm-password-input"
                    type={showConfirmPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      if (confirmError) setConfirmError('');
                    }}
                    placeholder="Re-enter new password"
                    className={`w-full pl-10 pr-10 py-2.5 rounded-xl border text-xs outline-none transition-colors ${
                      confirmError
                        ? 'border-[#DC2626] bg-[#FFF3F3]/40'
                        : 'border-[#EAE3DC] focus:border-[#FA661C]'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B6058] hover:text-[#FA661C] cursor-pointer"
                    aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>

                {confirmError && (
                  <p
                    data-testid="setup-confirm-error"
                    role="alert"
                    className="text-[11px] font-semibold text-[#DC2626] flex items-center space-x-1.5 pt-0.5"
                  >
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{confirmError}</span>
                  </p>
                )}
              </div>

              <button
                type="submit"
                data-testid="setup-submit-btn"
                disabled={submitting}
                className="w-full py-3 px-4 rounded-xl bg-[#FA661C] hover:bg-[#E0530B] disabled:opacity-60 text-white font-bold text-xs flex items-center justify-center space-x-2 transition-colors cursor-pointer shadow-xs"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>{submitting ? 'Activating Account...' : 'Set Password & Activate Account'}</span>
              </button>
            </form>
          )}
        </div>
      </main>

      {/* Minimal Footer */}
      <footer className="border-t border-[#EAE3DC] py-4 px-4 text-center text-[11px] text-[#6B6058]">
        MytriKart Warehouse Operations • One-Time Security Token Verification
      </footer>
    </div>
  );
}

