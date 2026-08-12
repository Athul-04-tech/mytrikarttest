import React, { useState, useEffect } from 'react';
import BrandPanel from './BrandPanel';
import IdentifierStep from './IdentifierStep';
import OtpVerificationStep from './OtpVerificationStep';
import PasswordStep from './PasswordStep';
import ForgotPasswordStep from './ForgotPasswordStep';
import TwoFactorStep from './TwoFactorStep';
import RegisterStep from './RegisterStep';
import { X, CheckCircle2, ShieldCheck, Sparkles, UserPlus, LogIn } from 'lucide-react';

export default function CustomerLoginModal({ isOpen, onClose, initialStep = 'identifier', onLoginSuccess }) {
  const [currentStep, setCurrentStep] = useState(initialStep);
  const [activeTab, setActiveTab] = useState(initialStep === 'register' ? 'register' : 'login'); // 'login' | 'register'
  const [identifier, setIdentifier] = useState('');
  const [registeredUser, setRegisteredUser] = useState(null);
  const [otpValues, setOtpValues] = useState(['', '', '', '', '', '']);
  const [twoFactorValues, setTwoFactorValues] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [demoError, setDemoError] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  // Sync initialStep and activeTab when modal opens
  useEffect(() => {
    if (isOpen) {
      const mode = initialStep === 'register' ? 'register' : 'identifier';
      setCurrentStep(mode);
      setActiveTab(initialStep === 'register' ? 'register' : 'login');
      setDemoError(false);
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
    setDemoError(false);
    if (tab === 'login') {
      setCurrentStep('identifier');
    } else {
      setCurrentStep('register');
    }
  };

  // Simulate Request OTP
  const handleRequestOtp = () => {
    if (demoError) return;
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setOtpValues(['1', '2', '3', '4', '5', '6']);
      setCurrentStep('otp');
    }, 450);
  };

  // Simulate Verify OTP -> goes to 2FA or Success
  const handleVerifyOtp = () => {
    if (demoError) return;
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setCurrentStep('2fa');
    }, 450);
  };

  // Simulate Password Login -> goes to 2FA or Success
  const handlePasswordLogin = (password) => {
    if (demoError) return;
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setCurrentStep('2fa');
    }, 450);
  };

  // Simulate 2FA Verification -> Complete Login
  const handleVerify2FA = () => {
    if (demoError) return;
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setShowSuccessToast(true);
      const userData = {
        name: registeredUser?.name || 'Aarav Sharma',
        email: identifier || registeredUser?.email || 'aarav.sharma@example.com',
        isPlus: true
      };
      if (onLoginSuccess) onLoginSuccess(userData);
      setTimeout(() => {
        onClose();
      }, 1200);
    }, 500);
  };

  // Simulate Register -> Moves to OTP Verification
  const handleRegister = (formData) => {
    if (demoError) return;
    setIsLoading(true);
    setRegisteredUser(formData);
    setTimeout(() => {
      setIsLoading(false);
      setIdentifier(formData.email || formData.mobile);
      setOtpValues(['1', '2', '3', '4', '5', '6']);
      setCurrentStep('otp');
    }, 500);
  };

  // Simulate Guest Checkout
  const handleGuestCheckout = () => {
    alert("Guest Checkout initialized — Continuing without account.");
    onClose();
  };

  const isMainChoiceVisible = currentStep === 'identifier' || currentStep === 'register';

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center sm:p-4 bg-[#0F3D2E]/65 backdrop-blur-xs animate-fadeIn"
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
      <div className="relative z-10 bg-[#FBF8F1] w-full h-full sm:h-auto sm:max-h-[92vh] sm:max-w-3xl sm:rounded-3xl shadow-2xl border sm:border-[#D4AF37]/40 flex flex-col md:flex-row overflow-hidden animate-dropdown">
        
        {/* Left Split Brand Panel */}
        <BrandPanel activeStep={currentStep} />

        {/* Right Form Step Container */}
        <div className="flex-1 flex flex-col justify-between p-5 sm:p-7 lg:p-9 overflow-y-auto bg-[#FBF8F1]">
          
          {/* Top Bar: Close Button & Segmented Choice State (Login vs Sign Up) */}
          <div className="flex flex-col space-y-3 mb-3">
            <div className="flex items-center justify-between">
              <div className="md:hidden flex items-center space-x-1">
                <span className="font-['Outfit'] font-extrabold text-xl text-[#0F3D2E]">
                  Mytri<span className="text-[#D4AF37]">Kart</span>
                </span>
              </div>
              
              <button
                onClick={onClose}
                className="ml-auto p-1.5 rounded-full text-[#5C6B63] hover:text-[#0F3D2E] hover:bg-[#D8E0DC]/50 transition-colors focus:outline-none focus:ring-2 focus:ring-[#0F3D2E]"
                aria-label="Close login dialog"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* CHOICE STATE: Segmented Top Tabs for Login and Sign Up */}
            {isMainChoiceVisible && (
              <div className="grid grid-cols-2 p-1 bg-[#E8F2EE] rounded-xl border border-[#D8E0DC] text-xs font-bold transition-all">
                <button
                  type="button"
                  onClick={() => handleTabSwitch('login')}
                  className={`py-2 rounded-lg flex items-center justify-center space-x-1.5 transition-all duration-150 ${
                    activeTab === 'login' && currentStep !== 'register'
                      ? 'bg-[#0F3D2E] text-[#FBF8F1] shadow-xs'
                      : 'text-[#5C6B63] hover:text-[#0F3D2E]'
                  }`}
                >
                  <LogIn className="w-3.5 h-3.5 text-[#D4AF37]" />
                  <span>Login</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleTabSwitch('register')}
                  className={`py-2 rounded-lg flex items-center justify-center space-x-1.5 transition-all duration-150 ${
                    activeTab === 'register' || currentStep === 'register'
                      ? 'bg-[#0F3D2E] text-[#FBF8F1] shadow-xs'
                      : 'text-[#5C6B63] hover:text-[#0F3D2E]'
                  }`}
                >
                  <UserPlus className="w-3.5 h-3.5 text-[#D4AF37]" />
                  <span>Sign Up</span>
                </button>
              </div>
            )}
          </div>

          {/* Dynamic Form Step Content */}
          <div className="flex-1 flex flex-col justify-center py-2">
            {showSuccessToast ? (
              <div className="text-center py-8 space-y-3 animate-dropdown">
                <div className="w-16 h-16 rounded-full bg-[#0F3D2E] text-[#D4AF37] flex items-center justify-center mx-auto shadow-md">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <h3 className="font-['Outfit'] text-2xl font-extrabold text-[#0F3D2E]">
                  Welcome, {registeredUser?.name || 'Aarav'}!
                </h3>
                <p className="text-xs text-[#5C6B63]">
                  Your MytriKart session is verified. Unlocking Gold Plus perks...
                </p>
              </div>
            ) : (
              <>
                {currentStep === 'identifier' && (
                  <IdentifierStep
                    identifier={identifier}
                    setIdentifier={setIdentifier}
                    onRequestOtp={handleRequestOtp}
                    onGoToPassword={() => setCurrentStep('password')}
                    onGoToRegister={() => {
                      setActiveTab('register');
                      setCurrentStep('register');
                    }}
                    onGuestCheckout={handleGuestCheckout}
                    isLoading={isLoading}
                    hasError={demoError}
                    errorMessage="Please enter a valid email address or 10-digit mobile number."
                  />
                )}

                {currentStep === 'register' && (
                  <RegisterStep
                    onRegister={handleRegister}
                    onGoToLogin={() => {
                      setActiveTab('login');
                      setCurrentStep('identifier');
                    }}
                    isLoading={isLoading}
                    hasError={demoError}
                    errorMessage="Please complete all required fields and verify password match."
                  />
                )}

                {currentStep === 'otp' && (
                  <OtpVerificationStep
                    identifier={identifier}
                    otpValues={otpValues}
                    setOtpValues={setOtpValues}
                    onVerifyOtp={handleVerifyOtp}
                    onChangeIdentifier={() => setCurrentStep('identifier')}
                    isLoading={isLoading}
                    hasError={demoError}
                    errorMessage="Invalid OTP. The code you entered does not match."
                  />
                )}

                {currentStep === 'password' && (
                  <PasswordStep
                    identifier={identifier}
                    onLogin={handlePasswordLogin}
                    onGoToForgot={() => setCurrentStep('forgot-password')}
                    onSwitchToOtp={() => setCurrentStep('otp')}
                    onBackToIdentifier={() => setCurrentStep('identifier')}
                    isLoading={isLoading}
                    hasError={demoError}
                    errorMessage="Incorrect password. Please try again or use OTP login."
                  />
                )}

                {currentStep === 'forgot-password' && (
                  <ForgotPasswordStep
                    defaultIdentifier={identifier}
                    onSendReset={(id, onSuccess) => {
                      setIsLoading(true);
                      setTimeout(() => {
                        setIsLoading(false);
                        onSuccess();
                      }, 500);
                    }}
                    onBackToLogin={() => setCurrentStep('identifier')}
                    isLoading={isLoading}
                    hasError={demoError}
                    errorMessage="No registered account found with this email or mobile."
                  />
                )}

                {currentStep === '2fa' && (
                  <TwoFactorStep
                    twoFactorValues={twoFactorValues}
                    setTwoFactorValues={setTwoFactorValues}
                    onVerify2FA={handleVerify2FA}
                    onBackToLogin={() => setCurrentStep('identifier')}
                    isLoading={isLoading}
                    hasError={demoError}
                    errorMessage="Invalid authenticator code. Please check your app."
                  />
                )}
              </>
            )}
          </div>

          {/* Interactive Prototype Review Toolbar */}
          <div className="mt-4 pt-3 border-t border-[#D8E0DC] text-[10px] text-[#5C6B63]">
            <div className="flex items-center justify-between mb-1.5 font-bold uppercase tracking-wider text-[#0F3D2E]">
              <span className="flex items-center space-x-1">
                <Sparkles className="w-3 h-3 text-[#D4AF37]" />
                <span>Prototype Step Switcher:</span>
              </span>
              <button
                type="button"
                onClick={() => setDemoError(!demoError)}
                className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-colors ${
                  demoError
                    ? 'bg-[#C0392B] text-white border-[#C0392B]'
                    : 'bg-white text-[#5C6B63] border-[#D8E0DC] hover:border-[#C0392B] hover:text-[#C0392B]'
                }`}
              >
                {demoError ? 'Error: ON' : 'Toggle Error'}
              </button>
            </div>

            <div className="flex flex-wrap gap-1">
              {[
                { id: 'identifier', label: '1. Login' },
                { id: 'register', label: '2. Sign Up' },
                { id: 'otp', label: '3. OTP' },
                { id: 'password', label: '4. Password' },
                { id: 'forgot-password', label: '5. Forgot Pass' },
                { id: '2fa', label: '6. 2FA' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setCurrentStep(tab.id);
                    setActiveTab(tab.id === 'register' ? 'register' : 'login');
                    setShowSuccessToast(false);
                  }}
                  className={`px-2 py-1 rounded font-medium transition-all ${
                    currentStep === tab.id
                      ? 'bg-[#0F3D2E] text-[#D4AF37] font-bold shadow-2xs'
                      : 'bg-white hover:bg-[#E8F2EE] text-[#5C6B63] border border-[#D8E0DC]/70'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
