import React, { useState, useEffect } from 'react';
import BrandPanel from './BrandPanel';
import IdentifierStep from './IdentifierStep';
import OtpVerificationStep from './OtpVerificationStep';
import PasswordStep from './PasswordStep';
import ForgotPasswordStep from './ForgotPasswordStep';
import RegisterStep from './RegisterStep';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ApiError } from '../../utils/api';
import { getHomeRouteForRole, resolvePostLoginRedirect } from '../../utils/authRouting';
import { X, CheckCircle2, ShieldCheck, Sparkles, UserPlus, LogIn } from 'lucide-react';

export default function CustomerLoginModal({ isOpen, onClose, initialStep = 'identifier', onLoginSuccess }) {
  const navigate = useNavigate();
  const { login, register, requestOtp, verifyOtp, isLoading: authLoading } = useAuth();
  const [currentStep, setCurrentStep] = useState(initialStep);
  const [activeTab, setActiveTab] = useState(initialStep === 'register' ? 'register' : 'login'); // 'login' | 'register'
  const [identifier, setIdentifier] = useState('');
  const [otpValues, setOtpValues] = useState(['', '', '', '', '', '']);
  const [errorMessage, setErrorMessage] = useState('');
  const [hasError, setHasError] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [successUser, setSuccessUser] = useState(null);

  // Sync initialStep and activeTab when modal opens
  useEffect(() => {
    if (isOpen) {
      const mode = initialStep === 'register' ? 'register' : 'identifier';
      setCurrentStep(mode);
      setActiveTab(initialStep === 'register' ? 'register' : 'login');
      setHasError(false);
      setErrorMessage('');
      setShowSuccessToast(false);
    }
  }, [isOpen, initialStep]);

  // Keyboard accessibility: Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Tab switcher (Login vs Sign Up)
  const handleTabSwitch = (tab) => {
    setActiveTab(tab);
    setHasError(false);
    setErrorMessage('');
    if (tab === 'login') {
      setCurrentStep('identifier');
    } else {
      setCurrentStep('register');
    }
  };

  // Real Request OTP
  const handleRequestOtp = async (customIdentifier) => {
    setHasError(false);
    setErrorMessage('');
    const targetIdentifier = (customIdentifier !== undefined ? customIdentifier : identifier).trim();
    if (!targetIdentifier) {
      setHasError(true);
      setErrorMessage('Please enter your email or mobile number.');
      setCurrentStep('identifier');
      return;
    }
    try {
      await requestOtp(targetIdentifier);
      setOtpValues(['', '', '', '', '', '']);
      setCurrentStep('otp');
    } catch (err) {
      setHasError(true);
      if (err instanceof ApiError && err.status === 429) {
        setErrorMessage('Too many OTP attempts. Please try again later.');
      } else {
        setErrorMessage(err.data?.detail || err.message || 'Failed to request OTP.');
      }
    }
  };

  // Real Verify OTP
  const handleVerifyOtp = async () => {
    setHasError(false);
    setErrorMessage('');
    const code = otpValues.join('').trim();
    if (code.length < 6) {
      setHasError(true);
      setErrorMessage('Please enter the complete 6-digit OTP code.');
      return;
    }
    try {
      const user = await verifyOtp({ identifier: identifier.trim(), otp_code: code });
      setSuccessUser(user);
      setShowSuccessToast(true);
      const targetRoute = resolvePostLoginRedirect(location.state?.from, user?.role);
      setTimeout(() => {
        onClose();
        if (targetRoute !== '/') {
          navigate(targetRoute);
        }
      }, 1000);
    } catch (err) {
      setHasError(true);
      if (err instanceof ApiError && err.status === 429) {
        setErrorMessage('Too many verification attempts. Please try again later.');
      } else {
        setErrorMessage(err.data?.detail || err.message || 'Invalid or expired OTP.');
      }
    }
  };

  // Real Password Login
  const handlePasswordLogin = async (password) => {
    setHasError(false);
    setErrorMessage('');
    try {
      const user = await login({ username: identifier.trim(), password });
      setSuccessUser(user);
      setShowSuccessToast(true);
      if (onLoginSuccess) onLoginSuccess(user);
      const targetRoute = resolvePostLoginRedirect(location.state?.from, user?.role);
      setTimeout(() => {
        onClose();
        if (targetRoute !== '/') {
          navigate(targetRoute);
        }
      }, 1000);
    } catch (err) {
      setHasError(true);
      setErrorMessage(err.data?.detail || err.message || 'Login failed.');
    }
  };

  // Real Register
  const handleRegister = async (formData) => {
    setHasError(false);
    setErrorMessage('');
    try {
      const user = await register({
        username: formData.username,
        email: formData.email,
        password: formData.password,
        phone_number: formData.mobile,
        name: formData.name,
      });
      setSuccessUser(user);
      setShowSuccessToast(true);
      if (onLoginSuccess) onLoginSuccess(user);
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err) {
      setHasError(true);
      setErrorMessage(err.data?.detail || err.message || 'Registration failed.');
    }
  };

  // Guest Checkout
  const handleGuestCheckout = () => {
    onClose();
  };

  const isMainChoiceVisible = currentStep === 'identifier' || currentStep === 'register';

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center sm:p-4 bg-[#FA661C]/65 backdrop-blur-xs animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-labelledby="customer-login-title"
    >
      {/* Modal Backdrop */}
      <div 
        className="fixed inset-0"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Split-Card Modal (780px on desktop/tablet, full screen on mobile) */}
      <div className="relative z-10 bg-[#FFFFFF] w-full h-full sm:h-auto sm:max-h-[92vh] sm:max-w-3xl sm:rounded-3xl shadow-2xl border sm:border-[#FF811A]/40 flex flex-col md:flex-row overflow-hidden animate-dropdown">
        
        {/* Left Split Brand Panel */}
        <BrandPanel activeStep={currentStep} />

        {/* Right Form Step Container */}
        <div className="flex-1 flex flex-col justify-between p-5 sm:p-7 lg:p-9 overflow-y-auto bg-[#FFFFFF]">
          
          {/* Top Bar: Close Button & Segmented Choice State (Login vs Sign Up) */}
          <div className="flex flex-col space-y-3 mb-3">
            <div className="flex items-center justify-between">
              <div className="md:hidden flex items-center space-x-1">
                <span className="font-['Outfit'] font-extrabold text-xl text-[#FA661C]">
                  Mytri<span className="text-[#FF811A]">Kart</span>
                </span>
              </div>
              
              <button
                onClick={onClose}
                className="ml-auto p-1.5 rounded-full text-[#6B6058] hover:text-[#FA661C] hover:bg-[#EAE3DC]/50 transition-colors focus:outline-none focus:ring-2 focus:ring-[#FA661C]"
                aria-label="Close login dialog"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* CHOICE STATE: Segmented Top Tabs for Login and Sign Up */}
            {isMainChoiceVisible && (
              <div className="grid grid-cols-2 p-1 bg-[#FFF3EC] rounded-xl border border-[#EAE3DC] text-xs font-bold transition-all">
                <button
                  type="button"
                  onClick={() => handleTabSwitch('login')}
                  className={`py-2 rounded-lg flex items-center justify-center space-x-1.5 transition-all duration-150 ${
                    activeTab === 'login' && currentStep !== 'register'
                      ? 'bg-[#FA661C] text-[#FFFFFF] shadow-xs'
                      : 'text-[#6B6058] hover:text-[#FA661C]'
                  }`}
                >
                  <LogIn className="w-3.5 h-3.5 text-[#FF811A]" />
                  <span>Login</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleTabSwitch('register')}
                  className={`py-2 rounded-lg flex items-center justify-center space-x-1.5 transition-all duration-150 ${
                    activeTab === 'register' || currentStep === 'register'
                      ? 'bg-[#FA661C] text-[#FFFFFF] shadow-xs'
                      : 'text-[#6B6058] hover:text-[#FA661C]'
                  }`}
                >
                  <UserPlus className="w-3.5 h-3.5 text-[#FF811A]" />
                  <span>Sign Up</span>
                </button>
              </div>
            )}
          </div>

          {/* Dynamic Form Step Content */}
          <div className="flex-1 flex flex-col justify-center py-2">
            {showSuccessToast ? (
              <div className="text-center py-8 space-y-3 animate-dropdown">
                <div className="w-16 h-16 rounded-full bg-[#FA661C] text-[#FF811A] flex items-center justify-center mx-auto shadow-md">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <h3 className="font-['Outfit'] text-2xl font-extrabold text-[#FA661C]">
                  Welcome, {successUser?.name || successUser?.username || 'User'}!
                </h3>
                <p className="text-xs text-[#6B6058]">
                  Your MytriKart session is verified.
                </p>
              </div>
            ) : (
              <>
                {currentStep === 'identifier' && (
                  <IdentifierStep
                    identifier={identifier}
                    setIdentifier={setIdentifier}
                    onRequestOtp={() => handleRequestOtp(identifier)}
                    onGoToPassword={() => setCurrentStep('password')}
                    onGoToRegister={() => {
                      setActiveTab('register');
                      setCurrentStep('register');
                    }}
                    onGuestCheckout={handleGuestCheckout}
                    isLoading={authLoading}
                    hasError={hasError}
                    errorMessage={errorMessage}
                  />
                )}

                {currentStep === 'register' && (
                  <RegisterStep
                    onRegister={handleRegister}
                    onGoToLogin={() => {
                      setActiveTab('login');
                      setCurrentStep('identifier');
                    }}
                    isLoading={authLoading}
                    hasError={hasError}
                    errorMessage={errorMessage}
                  />
                )}

                {currentStep === 'otp' && (
                  <OtpVerificationStep
                    identifier={identifier}
                    otpValues={otpValues}
                    setOtpValues={setOtpValues}
                    onVerifyOtp={handleVerifyOtp}
                    onResendOtp={() => handleRequestOtp(identifier)}
                    onChangeIdentifier={() => setCurrentStep('identifier')}
                    isLoading={authLoading}
                    hasError={hasError}
                    errorMessage={errorMessage}
                  />
                )}

                {currentStep === 'password' && (
                  <PasswordStep
                    identifier={identifier}
                    onLogin={handlePasswordLogin}
                    onGoToForgot={() => setCurrentStep('forgot-password')}
                    onSwitchToOtp={() => handleRequestOtp(identifier)}
                    onBackToIdentifier={() => setCurrentStep('identifier')}
                    isLoading={authLoading}
                    hasError={hasError}
                    errorMessage={errorMessage}
                  />
                )}

                {currentStep === 'forgot-password' && (
                  <ForgotPasswordStep
                    defaultIdentifier={identifier}
                    onSendReset={(id, onSuccess) => {
                      alert("Reset link sent");
                      onSuccess();
                    }}
                    onBackToLogin={() => setCurrentStep('identifier')}
                    isLoading={authLoading}
                    hasError={hasError}
                    errorMessage={errorMessage}
                  />
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
}
