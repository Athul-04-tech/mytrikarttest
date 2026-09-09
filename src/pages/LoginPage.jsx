import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import AuthHeader from '../components/auth/AuthHeader';
import AuthFooter from '../components/auth/AuthFooter';
import FullPageBrandPanel from '../components/auth/FullPageBrandPanel';
import IdentifierStep from '../components/auth/IdentifierStep';
import OtpVerificationStep from '../components/auth/OtpVerificationStep';
import PasswordStep from '../components/auth/PasswordStep';
import ForgotPasswordStep from '../components/auth/ForgotPasswordStep';
import RegisterStep from '../components/auth/RegisterStep';
import { useAuth } from '../context/AuthContext';
import { ApiError } from '../utils/api';
import { getHomeRouteForRole, resolvePostLoginRedirect } from '../utils/authRouting';
import { 
  LogIn, 
  UserPlus, 
  Store, 
  Sparkles, 
  CheckCircle2, 
  ShieldCheck 
} from 'lucide-react';

export default function LoginPage({ onLoginSuccess }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, register, requestOtp, verifyOtp, isLoading: authLoading } = useAuth();

  const isRegisterRoute = location.pathname === '/register';
  const [activeTab, setActiveTab] = useState(isRegisterRoute ? 'register' : 'login');
  const [currentStep, setCurrentStep] = useState(isRegisterRoute ? 'register' : 'identifier');
  const [identifier, setIdentifier] = useState('');
  const [otpValues, setOtpValues] = useState(['', '', '', '', '', '']);
  const [errorMessage, setErrorMessage] = useState('');
  const [fieldErrors, setFieldErrors] = useState(null);
  const [hasError, setHasError] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [successText, setSuccessText] = useState('Authentication Verified');

  // Dynamic SEO Metadata
  useEffect(() => {
    document.title = isRegisterRoute 
      ? "Create an Account — MytriKart" 
      : "Login or Sign Up — MytriKart Marketplace";
  }, [isRegisterRoute]);

  // Sync route changes
  useEffect(() => {
    if (location.pathname === '/register') {
      setActiveTab('register');
      setCurrentStep('register');
    } else {
      setActiveTab('login');
      setCurrentStep('identifier');
    }
    setHasError(false);
    setErrorMessage('');
    setFieldErrors(null);
    setShowSuccessToast(false);
  }, [location.pathname]);

  // Tab Switcher (Login vs Sign Up)
  const handleTabSwitch = (tab) => {
    setActiveTab(tab);
    setHasError(false);
    setErrorMessage('');
    setFieldErrors(null);
    if (tab === 'login') {
      navigate('/login');
    } else {
      navigate('/register');
    }
  };

  // Real OTP Request Handler
  const handleRequestOtp = async (customIdentifier) => {
    setHasError(false);
    setErrorMessage('');
    setFieldErrors(null);

    const loginIdentifier = (customIdentifier !== undefined ? customIdentifier : identifier).trim();
    if (!loginIdentifier) {
      setHasError(true);
      setErrorMessage('Please enter your email address or mobile number.');
      setCurrentStep('identifier');
      return;
    }

    try {
      await requestOtp(loginIdentifier);
      setOtpValues(['', '', '', '', '', '']);
      setCurrentStep('otp');
    } catch (err) {
      setHasError(true);
      if (err instanceof ApiError) {
        if (err.status === 429) {
          setErrorMessage('Too many OTP attempts for this account. Please wait a while before trying again.');
        } else if (err.data?.detail) {
          setErrorMessage(err.data.detail);
        } else if (err.data?.identifier) {
          const val = err.data.identifier;
          setErrorMessage(Array.isArray(val) ? val[0] : String(val));
        } else {
          setErrorMessage(err.message || 'Failed to request OTP. Please try again.');
        }
      } else {
        setErrorMessage(err.message || 'Failed to request OTP. Please try again.');
      }
    }
  };

  // Real OTP Verification Handler
  const handleVerifyOtp = async () => {
    setHasError(false);
    setErrorMessage('');
    setFieldErrors(null);

    const code = otpValues.join('').trim();
    if (code.length < 6) {
      setHasError(true);
      setErrorMessage('Please enter the complete 6-digit OTP code.');
      return;
    }

    const loginIdentifier = identifier.trim();
    if (!loginIdentifier) {
      setHasError(true);
      setErrorMessage('Identifier missing. Please re-enter your email or mobile number.');
      setCurrentStep('identifier');
      return;
    }

    try {
      const user = await verifyOtp({ identifier: loginIdentifier, otp_code: code });
      setShowSuccessToast(true);
      setSuccessText(`Welcome back, ${user.name || user.username || 'User'}!`);

      const targetDestination = resolvePostLoginRedirect(location.state?.from, user?.role);
      setTimeout(() => {
        navigate(targetDestination);
      }, 800);
    } catch (err) {
      setHasError(true);
      if (err instanceof ApiError) {
        if (err.status === 429) {
          setErrorMessage('Too many verification attempts. Please wait before trying again.');
        } else if (err.data?.detail) {
          setErrorMessage(err.data.detail);
        } else if (typeof err.data === 'object' && err.data !== null) {
          const firstKey = Object.keys(err.data)[0];
          const val = err.data[firstKey];
          setErrorMessage(Array.isArray(val) ? val[0] : String(val));
        } else {
          setErrorMessage(err.message || 'Verification failed.');
        }
      } else {
        setErrorMessage(err.message || 'Invalid or expired OTP code.');
      }
    }
  };

  // Real Password Login Handler
  const handlePasswordLogin = async (password) => {
    setHasError(false);
    setErrorMessage('');
    setFieldErrors(null);

    const loginIdentifier = identifier.trim();
    if (!loginIdentifier) {
      setHasError(true);
      setErrorMessage('Please enter your username or email address.');
      setCurrentStep('identifier');
      return;
    }

    try {
      const user = await login({ username: loginIdentifier, password });
      setShowSuccessToast(true);
      setSuccessText(`Welcome back, ${user.name || user.username || 'User'}!`);

      if (onLoginSuccess) onLoginSuccess(user);

      const targetDestination = resolvePostLoginRedirect(location.state?.from, user?.role);
      setTimeout(() => {
        navigate(targetDestination);
      }, 800);
    } catch (err) {
      setHasError(true);
      if (err instanceof ApiError && err.data) {
        if (err.data.detail) {
          setErrorMessage(err.data.detail);
        } else if (typeof err.data === 'object') {
          const firstKey = Object.keys(err.data)[0];
          const val = err.data[firstKey];
          setErrorMessage(Array.isArray(val) ? val[0] : String(val));
        } else {
          setErrorMessage(err.message);
        }
      } else {
        setErrorMessage(err.message || 'Login failed. Please check your credentials.');
      }
    }
  };

  // Real Registration Handler
  const handleRegisterSubmit = async (formData) => {
    setHasError(false);
    setErrorMessage('');
    setFieldErrors(null);

    try {
      const user = await register({
        username: formData.username,
        email: formData.email,
        password: formData.password,
        phone_number: formData.mobile,
        name: formData.name,
      });

      setShowSuccessToast(true);
      setSuccessText(`Account created! Welcome to MytriKart, ${user.name || user.username}!`);

      if (onLoginSuccess) onLoginSuccess(user);

      setTimeout(() => {
        navigate('/');
      }, 800);
    } catch (err) {
      setHasError(true);
      if (err instanceof ApiError && err.data) {
        setFieldErrors(err.data);
        if (err.data.detail) {
          setErrorMessage(err.data.detail);
        } else if (err.data.username) {
          setErrorMessage(err.data.username[0] || 'A user with that username already exists.');
        } else if (typeof err.data === 'object') {
          const firstKey = Object.keys(err.data)[0];
          const val = err.data[firstKey];
          setErrorMessage(Array.isArray(val) ? `${firstKey}: ${val[0]}` : String(val));
        } else {
          setErrorMessage(err.message);
        }
      } else {
        setErrorMessage(err.message || 'Registration failed. Please check your details.');
      }
    }
  };

  const handleGuestCheckout = () => {
    navigate('/');
  };

  const handleSellerClick = () => {
    navigate('/seller/register');
  };

  const isMainChoiceVisible = currentStep === 'identifier' || currentStep === 'register';

  return (
    <div className="min-h-screen bg-[#FFFFFF] flex flex-col font-sans selection:bg-[#FF811A]/30 selection:text-[#FA661C]">
      
      {/* 1. Minimal Dedicated Auth Header */}
      <AuthHeader onBackToHome={() => navigate('/')} />

      {/* 2. Main Full-Page Split-Screen Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex items-center justify-center">
        
        {/* Full-Page Card Split Container */}
        <div className="w-full bg-[#FFFFFF] rounded-3xl shadow-xl border border-[#FF811A]/40 flex flex-col md:flex-row overflow-hidden min-h-[640px] animate-reveal">
          
          {/* Left Split Panel: Deep Emerald Branded Panel with Seller CTA */}
          <FullPageBrandPanel onSellerClick={handleSellerClick} />

          {/* Right Form Panel: Cream Canvas */}
          <div className="flex-1 flex flex-col justify-between p-6 sm:p-8 lg:p-12 bg-[#FFFFFF] overflow-y-auto">
            
            {/* Mobile-Only Compact Brand Banner */}
            <div className="md:hidden mb-5 p-4 rounded-2xl bg-gradient-to-r from-[#FA661C] to-[#E0530B] text-[#FFFFFF] border border-[#FF811A]/30">
              <div className="flex items-center space-x-1.5 mb-1 text-[#FF811A]">
                <Sparkles className="w-3.5 h-3.5" />
                <span className="text-[10px] font-bold uppercase tracking-wider">MytriKart Marketplace</span>
              </div>
              <h2 className="font-['Outfit'] font-bold text-sm text-[#FFFFFF]">
                Shop from thousands of trusted sellers
              </h2>
              <button
                type="button"
                onClick={handleSellerClick}
                className="mt-2.5 w-full py-1.5 px-3 rounded-lg text-xs font-bold text-[#FF811A] bg-[#0A2A1F] border border-[#FF811A]/40 hover:bg-[#FF811A] hover:text-[#FA661C] transition-all flex items-center justify-center space-x-1 cursor-pointer"
              >
                <Store className="w-3.5 h-3.5" />
                <span>Are you a business? Become a Seller →</span>
              </button>
            </div>

            {/* CHOICE STATE: Segmented Top Tabs for Login & Sign Up */}
            {isMainChoiceVisible && (
              <div className="grid grid-cols-2 p-1.5 bg-[#FFF3EC] rounded-2xl border border-[#EAE3DC] text-xs font-bold transition-all mb-6">
                <button
                  type="button"
                  onClick={() => handleTabSwitch('login')}
                  className={`py-2.5 rounded-xl flex items-center justify-center space-x-2 transition-all duration-150 cursor-pointer ${
                    activeTab === 'login' && currentStep !== 'register'
                      ? 'bg-[#FA661C] text-[#FFFFFF] shadow-xs'
                      : 'text-[#6B6058] hover:text-[#FA661C]'
                  }`}
                >
                  <LogIn className="w-4 h-4 text-[#FF811A]" />
                  <span>Existing User Login</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleTabSwitch('register')}
                  className={`py-2.5 rounded-xl flex items-center justify-center space-x-2 transition-all duration-150 cursor-pointer ${
                    activeTab === 'register' || currentStep === 'register'
                      ? 'bg-[#FA661C] text-[#FFFFFF] shadow-xs'
                      : 'text-[#6B6058] hover:text-[#FA661C]'
                  }`}
                >
                  <UserPlus className="w-4 h-4 text-[#FF811A]" />
                  <span>New User Sign Up</span>
                </button>
              </div>
            )}

            {/* Success Notification Bar on Login */}
            {showSuccessToast && (
              <div className="mb-4 p-4 rounded-2xl bg-[#FFF3EC] border border-[#FA661C] text-[#FA661C] flex items-center space-x-3 shadow-md animate-reveal">
                <div className="w-8 h-8 rounded-full bg-[#FA661C] text-[#FF811A] flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-['Outfit'] font-bold text-sm text-[#FA661C]">Authentication Verified</h4>
                  <p className="text-xs text-[#6B6058]">{successText}</p>
                </div>
              </div>
            )}

            {/* Form Flow Wizard Area */}
            <div className="flex-1 flex flex-col justify-center">
              
              {/* Step 1: Identifier Entry */}
              {currentStep === 'identifier' && (
                <IdentifierStep 
                  identifier={identifier}
                  setIdentifier={setIdentifier}
                  onRequestOtp={() => handleRequestOtp(identifier)}
                  onGoToPassword={() => {
                    setHasError(false);
                    setErrorMessage('');
                    setCurrentStep('password');
                  }}
                  onGoToRegister={() => handleTabSwitch('register')}
                  onGuestCheckout={handleGuestCheckout}
                  isLoading={authLoading}
                  hasError={hasError}
                  errorMessage={errorMessage}
                />
              )}

              {/* Step 2a: OTP Verification */}
              {currentStep === 'otp' && (
                <OtpVerificationStep 
                  identifier={identifier}
                  otpValues={otpValues}
                  setOtpValues={setOtpValues}
                  onVerifyOtp={handleVerifyOtp}
                  onResendOtp={() => handleRequestOtp(identifier)}
                  onChangeIdentifier={() => {
                    setHasError(false);
                    setErrorMessage('');
                    setCurrentStep('identifier');
                  }}
                  isLoading={authLoading}
                  hasError={hasError}
                  errorMessage={errorMessage}
                />
              )}

              {/* Step 2b: Password Login */}
              {currentStep === 'password' && (
                <PasswordStep 
                  identifier={identifier}
                  onLogin={handlePasswordLogin}
                  onGoToForgot={() => setCurrentStep('forgot-password')}
                  onSwitchToOtp={() => handleRequestOtp(identifier)}
                  onBackToIdentifier={() => {
                    setHasError(false);
                    setErrorMessage('');
                    setCurrentStep('identifier');
                  }}
                  isLoading={authLoading}
                  hasError={hasError}
                  errorMessage={errorMessage}
                />
              )}

              {/* Step 3: Forgot Password */}
              {currentStep === 'forgot-password' && (
                <ForgotPasswordStep 
                  identifier={identifier}
                  onSendResetLink={() => {
                    alert("Reset link dispatched to " + identifier);
                    setCurrentStep('password');
                  }}
                  onBackToPassword={() => setCurrentStep('password')}
                  isLoading={authLoading}
                />
              )}

              {/* Registration Flow (Prop mismatch fixed: onRegister) */}
              {currentStep === 'register' && (
                <RegisterStep 
                  onRegister={handleRegisterSubmit}
                  onGoToLogin={() => handleTabSwitch('login')}
                  isLoading={authLoading}
                  hasError={hasError}
                  errorMessage={errorMessage}
                  fieldErrors={fieldErrors}
                />
              )}

            </div>

            {/* Bottom Security Footer */}
            <div className="pt-6 mt-6 border-t border-[#EAE3DC] flex flex-col sm:flex-row items-center justify-between text-[11px] text-[#6B6058] gap-2">
              <div className="flex items-center space-x-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-[#FA661C]" />
                <span>256-Bit SSL Encrypted Verification</span>
              </div>
              <div className="flex items-center space-x-3">
                <a href="#privacy" className="hover:underline hover:text-[#FA661C]">Privacy Policy</a>
                <span>•</span>
                <a href="#terms" className="hover:underline hover:text-[#FA661C]">Terms of Service</a>
              </div>
            </div>

          </div>

        </div>

      </main>

      {/* 3. Global Auth Footer */}
      <AuthFooter />

    </div>
  );
}
