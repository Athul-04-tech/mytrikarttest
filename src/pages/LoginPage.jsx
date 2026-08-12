import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import AuthHeader from '../components/auth/AuthHeader';
import AuthFooter from '../components/auth/AuthFooter';
import FullPageBrandPanel from '../components/auth/FullPageBrandPanel';
import IdentifierStep from '../components/auth/IdentifierStep';
import OtpVerificationStep from '../components/auth/OtpVerificationStep';
import PasswordStep from '../components/auth/PasswordStep';
import ForgotPasswordStep from '../components/auth/ForgotPasswordStep';
import TwoFactorStep from '../components/auth/TwoFactorStep';
import RegisterStep from '../components/auth/RegisterStep';
import { 
  LogIn, 
  UserPlus, 
  Store, 
  ArrowRight, 
  Sparkles, 
  CheckCircle2, 
  ShieldCheck 
} from 'lucide-react';

export default function LoginPage({ onLoginSuccess }) {
  const navigate = useNavigate();
  const location = useLocation();

  const isRegisterRoute = location.pathname === '/register';
  const [activeTab, setActiveTab] = useState(isRegisterRoute ? 'register' : 'login');
  const [currentStep, setCurrentStep] = useState(isRegisterRoute ? 'register' : 'identifier');
  const [identifier, setIdentifier] = useState('');
  const [registeredUser, setRegisteredUser] = useState(null);
  const [otpValues, setOtpValues] = useState(['', '', '', '', '', '']);
  const [twoFactorValues, setTwoFactorValues] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [demoError, setDemoError] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  // Dynamic SEO Metadata for Dedicated Page
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
    setDemoError(false);
    setShowSuccessToast(false);
  }, [location.pathname]);

  // Tab Switcher (Login vs Sign Up)
  const handleTabSwitch = (tab) => {
    setActiveTab(tab);
    setDemoError(false);
    if (tab === 'login') {
      navigate('/login');
    } else {
      navigate('/register');
    }
  };

  // Step 1 -> Request OTP
  const handleRequestOtp = () => {
    if (demoError) return;
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setOtpValues(['1', '2', '3', '4', '5', '6']);
      setCurrentStep('otp');
    }, 450);
  };

  // Step 2 -> Verify OTP -> 2FA
  const handleVerifyOtp = () => {
    if (demoError) return;
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setCurrentStep('2fa');
    }, 450);
  };

  // Step 2b -> Password Login -> 2FA
  const handlePasswordLogin = (password) => {
    if (demoError) return;
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setCurrentStep('2fa');
    }, 450);
  };

  // Step 4 -> 2FA Verification -> Complete Login
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
      setTimeout(() => {
        if (onLoginSuccess) onLoginSuccess(userData);
        navigate('/');
      }, 1000);
    }, 500);
  };

  // Registration submit -> advances to OTP verification
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

  const handleGuestCheckout = () => {
    navigate('/');
  };

  const handleSellerClick = () => {
    navigate('/seller/register');
  };

  const isMainChoiceVisible = currentStep === 'identifier' || currentStep === 'register';

  return (
    <div className="min-h-screen bg-[#FBF8F1] flex flex-col font-sans selection:bg-[#D4AF37]/30 selection:text-[#0F3D2E]">
      
      {/* 1. Minimal Dedicated Auth Header */}
      <AuthHeader onBackToHome={() => navigate('/')} />

      {/* 2. Main Full-Page Split-Screen Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex items-center justify-center">
        
        {/* Full-Page Card Split Container */}
        <div className="w-full bg-[#FBF8F1] rounded-3xl shadow-xl border border-[#D4AF37]/40 flex flex-col md:flex-row overflow-hidden min-h-[640px] animate-reveal">
          
          {/* Left Split Panel: Deep Emerald Branded Panel with Seller CTA */}
          <FullPageBrandPanel onSellerClick={handleSellerClick} />

          {/* Right Form Panel: Cream Canvas */}
          <div className="flex-1 flex flex-col justify-between p-6 sm:p-8 lg:p-12 bg-[#FBF8F1] overflow-y-auto">
            
            {/* Mobile-Only Compact Brand Banner */}
            <div className="md:hidden mb-5 p-4 rounded-2xl bg-gradient-to-r from-[#0F3D2E] to-[#155440] text-[#FBF8F1] border border-[#D4AF37]/30">
              <div className="flex items-center space-x-1.5 mb-1 text-[#D4AF37]">
                <Sparkles className="w-3.5 h-3.5" />
                <span className="text-[10px] font-bold uppercase tracking-wider">MytriKart Marketplace</span>
              </div>
              <h2 className="font-['Outfit'] font-bold text-sm text-[#FBF8F1]">
                Shop from thousands of trusted sellers
              </h2>
              <button
                type="button"
                onClick={handleSellerClick}
                className="mt-2.5 w-full py-1.5 px-3 rounded-lg text-xs font-bold text-[#D4AF37] bg-[#0A2A1F] border border-[#D4AF37]/40 hover:bg-[#D4AF37] hover:text-[#0F3D2E] transition-all flex items-center justify-center space-x-1"
              >
                <Store className="w-3.5 h-3.5" />
                <span>Are you a business? Become a Seller →</span>
              </button>
            </div>

            {/* CHOICE STATE: Segmented Top Tabs for Login & Sign Up */}
            {isMainChoiceVisible && (
              <div className="grid grid-cols-2 p-1.5 bg-[#E8F2EE] rounded-2xl border border-[#D8E0DC] text-xs font-bold transition-all mb-6">
                <button
                  type="button"
                  onClick={() => handleTabSwitch('login')}
                  className={`py-2.5 rounded-xl flex items-center justify-center space-x-2 transition-all duration-150 cursor-pointer ${
                    activeTab === 'login' && currentStep !== 'register'
                      ? 'bg-[#0F3D2E] text-[#FBF8F1] shadow-xs'
                      : 'text-[#5C6B63] hover:text-[#0F3D2E]'
                  }`}
                >
                  <LogIn className="w-4 h-4 text-[#D4AF37] icon-interactive" />
                  <span>Existing User Login</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleTabSwitch('register')}
                  className={`py-2.5 rounded-xl flex items-center justify-center space-x-2 transition-all duration-150 cursor-pointer ${
                    activeTab === 'register' || currentStep === 'register'
                      ? 'bg-[#0F3D2E] text-[#FBF8F1] shadow-xs'
                      : 'text-[#5C6B63] hover:text-[#0F3D2E]'
                  }`}
                >
                  <UserPlus className="w-4 h-4 text-[#D4AF37] icon-interactive" />
                  <span>New User Sign Up</span>
                </button>
              </div>
            )}

            {/* Success Notification Bar on Login */}
            {showSuccessToast && (
              <div className="mb-4 p-4 rounded-2xl bg-[#E8F2EE] border border-[#0F3D2E] text-[#0F3D2E] flex items-center space-x-3 shadow-md animate-reveal">
                <div className="w-8 h-8 rounded-full bg-[#0F3D2E] text-[#D4AF37] flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-['Outfit'] font-bold text-sm text-[#0F3D2E]">Authentication Verified</h4>
                  <p className="text-xs text-[#5C6B63]">Welcome back, {registeredUser?.name || 'Aarav Sharma'}. Redirecting to homepage...</p>
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
                  onRequestOtp={handleRequestOtp}
                  onPasswordLogin={() => setCurrentStep('password')}
                  isLoading={isLoading}
                  demoError={demoError}
                  setDemoError={setDemoError}
                  onGuestCheckout={handleGuestCheckout}
                />
              )}

              {/* Step 2: OTP Verification */}
              {currentStep === 'otp' && (
                <OtpVerificationStep 
                  identifier={identifier}
                  otpValues={otpValues}
                  setOtpValues={setOtpValues}
                  onVerifyOtp={handleVerifyOtp}
                  onBack={() => setCurrentStep(activeTab === 'register' ? 'register' : 'identifier')}
                  onResendOtp={handleRequestOtp}
                  onSwitchToPassword={() => setCurrentStep('password')}
                  isLoading={isLoading}
                  demoError={demoError}
                  setDemoError={setDemoError}
                />
              )}

              {/* Step 2b: Password Login */}
              {currentStep === 'password' && (
                <PasswordStep 
                  identifier={identifier}
                  onPasswordSubmit={handlePasswordLogin}
                  onForgotPassword={() => setCurrentStep('forgot-password')}
                  onBackToOtp={() => setCurrentStep('identifier')}
                  isLoading={isLoading}
                  demoError={demoError}
                  setDemoError={setDemoError}
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
                  isLoading={isLoading}
                />
              )}

              {/* Step 4: 2FA Verification */}
              {currentStep === '2fa' && (
                <TwoFactorStep 
                  identifier={identifier}
                  twoFactorValues={twoFactorValues}
                  setTwoFactorValues={setTwoFactorValues}
                  onVerify2FA={handleVerify2FA}
                  onBackToAuth={() => setCurrentStep('identifier')}
                  isLoading={isLoading}
                  demoError={demoError}
                  setDemoError={setDemoError}
                />
              )}

              {/* Registration Flow */}
              {currentStep === 'register' && (
                <RegisterStep 
                  onRegisterSubmit={handleRegister}
                  onSwitchToLogin={() => handleTabSwitch('login')}
                  isLoading={isLoading}
                  demoError={demoError}
                  setDemoError={setDemoError}
                />
              )}

            </div>

            {/* Bottom Security Footer */}
            <div className="pt-6 mt-6 border-t border-[#D8E0DC] flex flex-col sm:flex-row items-center justify-between text-[11px] text-[#5C6B63] gap-2">
              <div className="flex items-center space-x-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-[#0F3D2E]" />
                <span>256-Bit SSL Encrypted Verification</span>
              </div>
              <div className="flex items-center space-x-3">
                <a href="#privacy" className="hover:underline hover:text-[#0F3D2E]">Privacy Policy</a>
                <span>•</span>
                <a href="#terms" className="hover:underline hover:text-[#0F3D2E]">Terms of Service</a>
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
