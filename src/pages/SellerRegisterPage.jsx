import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SellerAuthHeader from '../components/seller/SellerAuthHeader';
import SellerProgressStepper, { SELLER_STEPS } from '../components/seller/SellerProgressStepper';
import RegistrationMethodChoice from '../components/seller/RegistrationMethodChoice';
import Step1PersonalInfo from '../components/seller/Step1PersonalInfo';
import Step2BusinessInfo from '../components/seller/Step2BusinessInfo';
import Step3StoreInfo from '../components/seller/Step3StoreInfo';
import Step4ContactInfo from '../components/seller/Step4ContactInfo';
import Step5PaymentDetails from '../components/seller/Step5PaymentDetails';
import Step6IdentityVerify from '../components/seller/Step6IdentityVerify';
import Step7Agreement from '../components/seller/Step7Agreement';
import SellerOtpVerifyStep from '../components/seller/SellerOtpVerifyStep';
import SellerSuccessStep from '../components/seller/SellerSuccessStep';
import { Store, ShieldCheck, Sparkles, HelpCircle, Layers } from 'lucide-react';

const INITIAL_SELLER_STATE = {
  // Method
  registrationMethod: 'email',
  // Step 1: Personal
  firstName: 'Aarav',
  lastName: 'Sharma',
  email: 'aarav.sharma@artisanheritagetrade.com',
  mobile: '9876543210',
  username: 'aarav_artisan_crafts',
  password: 'Password@123',
  confirmPassword: 'Password@123',
  // Step 2: Business
  storeName: 'Royal Artisan Heritage & Spices',
  businessName: 'Royal Heritage Enterprises LLP',
  businessType: 'company',
  gstVatNumber: '27AAAAA0000A1Z5',
  panTin: 'ABCDE1234F',
  businessRegNumber: 'CIN-U74999MH2021PTC123456',
  yearsInBusiness: '3-5 years',
  // Step 3: Store Info
  storeSlug: 'royal-artisan-heritage',
  storeDescription: 'Handcrafted luxury heritage silks, pure brass decor, and GI-tagged indigenous spices sourced directly from master cooperatives across Western India.',
  storeLogo: 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=300&q=80',
  storeBanner: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=800&q=80',
  businessCategory: 'Handicrafts & Artisanal',
  productCategories: ['Handicrafts & Artisanal', 'Fashion & Apparel', 'Home & Kitchen'],
  country: 'IN',
  storeAddress: 'Suite 402, Heritage Crafts Plaza, Kalaghoda Arts District',
  city: 'Mumbai',
  state: 'Maharashtra',
  zipCode: '400001',
  // Step 4: Contact
  supportEmail: 'care@artisanheritagetrade.com',
  supportPhone: '+91 22 2490 8899',
  whatsappNumber: '+91 98765 43210',
  website: 'https://artisanheritagetrade.com',
  socialLinks: {
    instagram: '@royalartisancrafts',
    facebook: 'facebook.com/royalartisancrafts',
    youtube: 'youtube.com/@royalcrafts',
    linkedin: 'linkedin.com/company/royal-heritage-enterprises',
    x: '@royalcrafts_in'
  },
  // Step 5: Payment
  payoutMethod: 'bank',
  bankName: 'HDFC Bank Ltd',
  accountHolder: 'Royal Heritage Enterprises LLP',
  accountNumber: '50200045678912',
  ifscSwift: 'HDFC0000060',
  upiId: 'royalcrafts@okhdfcbank',
  paypalEmail: 'payouts@artisanheritagetrade.com',
  stripeEmail: 'finance@artisanheritagetrade.com',
  // Step 6: Verification
  uploadedDocuments: {
    aadhaar: { fileName: 'aadhaar_front_back_scan.pdf', fileSize: '1.2 MB' },
    gstCert: { fileName: 'gst_registration_reg06.pdf', fileSize: '840 KB' },
    businessLicense: { fileName: 'incorporation_certificate.pdf', fileSize: '2.1 MB' },
    selfieId: { fileName: 'selfie_with_national_id.jpg', fileSize: '3.4 MB' },
    addressProof: { fileName: 'commercial_electricity_bill_oct.pdf', fileSize: '980 KB' }
  },
  // Step 7: Agreement
  acceptedTerms: true
};

export default function SellerRegisterPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState(INITIAL_SELLER_STATE);
  const navigate = useNavigate();

  // SEO Standard: Title & Meta Description for Seller Acquisition
  useEffect(() => {
    document.title = "Become a Seller — Register Your Store on MytriKart";
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute("content", "Join 50,000+ verified artisan brands and high-volume merchants on MytriKart Marketplace. 0% onboarding fee, 24x7 seller support, and pan-regional logistics.");
    }
  }, []);

  const updateFormData = (patch) => {
    setFormData(prev => ({ ...prev, ...patch }));
  };

  const handleSelectMethod = (method) => {
    updateFormData({ registrationMethod: method });
    setCurrentStep(1);
  };

  const handleNextStep = () => {
    setCurrentStep(prev => Math.min(prev + 1, 9));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePrevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAgreementComplete = () => {
    setCurrentStep(8); // Move to OTP
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOtpVerified = () => {
    setCurrentStep(9); // Move to Success
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#FBF8F1] text-[#1A2420] flex flex-col font-sans selection:bg-[#D4AF37]/30 selection:text-[#0F3D2E]">
      
      {/* 1. Dedicated Seller Onboarding Header */}
      <SellerAuthHeader 
        onBackHome={() => navigate('/')} 
        onGoToLogin={() => navigate('/seller/dashboard')}
      />

      {/* 2. Step Progress Bar */}
      {currentStep >= 1 && currentStep <= 7 && (
        <SellerProgressStepper currentStep={currentStep} onStepClick={(step) => setCurrentStep(step)} />
      )}

      {/* 3. Main Form Container */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col justify-start">
        
        {/* Step 0: Registration Method Choice */}
        {currentStep === 0 && (
          <RegistrationMethodChoice onSelectMethod={handleSelectMethod} />
        )}

        {/* Step 1: Personal Information */}
        {currentStep === 1 && (
          <Step1PersonalInfo 
            formData={formData} 
            onChange={updateFormData} 
            onNext={handleNextStep}
            onBackToMethod={() => setCurrentStep(0)}
          />
        )}

        {/* Step 2: Business Information */}
        {currentStep === 2 && (
          <Step2BusinessInfo 
            formData={formData} 
            onChange={updateFormData} 
            onNext={handleNextStep}
            onPrev={handlePrevStep}
          />
        )}

        {/* Step 3: Store Information */}
        {currentStep === 3 && (
          <Step3StoreInfo 
            formData={formData} 
            onChange={updateFormData} 
            onNext={handleNextStep}
            onPrev={handlePrevStep}
          />
        )}

        {/* Step 4: Contact & Social Links */}
        {currentStep === 4 && (
          <Step4ContactInfo 
            formData={formData} 
            onChange={updateFormData} 
            onNext={handleNextStep}
            onPrev={handlePrevStep}
          />
        )}

        {/* Step 5: Payment & Bank Details */}
        {currentStep === 5 && (
          <Step5PaymentDetails 
            formData={formData} 
            onChange={updateFormData} 
            onNext={handleNextStep}
            onPrev={handlePrevStep}
          />
        )}

        {/* Step 6: Identity Verification Documents */}
        {currentStep === 6 && (
          <Step6IdentityVerify 
            formData={formData} 
            onChange={updateFormData} 
            onNext={handleNextStep}
            onPrev={handlePrevStep}
          />
        )}

        {/* Step 7: Terms, Conditions & Vendor Agreement */}
        {currentStep === 7 && (
          <Step7Agreement 
            formData={formData} 
            onChange={updateFormData} 
            onSubmit={handleAgreementComplete}
            onPrev={handlePrevStep}
          />
        )}

        {/* Step 8: OTP Verification */}
        {currentStep === 8 && (
          <SellerOtpVerifyStep 
            mobile={formData.mobile}
            email={formData.email}
            onVerified={handleOtpVerified}
            onBack={() => setCurrentStep(7)}
          />
        )}

        {/* Step 9: Submission Success & Account Activation */}
        {currentStep === 9 && (
          <SellerSuccessStep 
            storeName={formData.storeName}
            storeSlug={formData.storeSlug}
            email={formData.email}
            onGoToDashboard={() => navigate('/seller/dashboard')}
          />
        )}

      </main>

      {/* 4. Prototype Step Switcher */}
      <aside 
        aria-label="Prototype Step Switcher"
        className="bg-[#0F3D2E] text-[#FBF8F1] border-t border-[#D4AF37]/40 py-2.5 px-4 shadow-xl z-30"
      >
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center space-x-2">
            <span className="font-extrabold text-[#D4AF37] uppercase tracking-wider text-[10px] flex items-center space-x-1">
              <Layers className="w-3.5 h-3.5" />
              <span>Reviewer Step Switcher:</span>
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto no-scrollbar">
            <button
              type="button"
              onClick={() => setCurrentStep(0)}
              className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all cursor-pointer ${
                currentStep === 0 ? 'bg-[#D4AF37] text-[#0F3D2E]' : 'bg-[#155440] text-[#FBF8F1] hover:bg-[#1A624B]'
              }`}
            >
              0. Method
            </button>
            {SELLER_STEPS.map((s) => (
              <button
                key={s.step}
                type="button"
                onClick={() => setCurrentStep(s.step)}
                className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all cursor-pointer ${
                  currentStep === s.step ? 'bg-[#D4AF37] text-[#0F3D2E]' : 'bg-[#155440] text-[#FBF8F1] hover:bg-[#1A624B]'
                }`}
              >
                {s.step}. {s.label}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setCurrentStep(8)}
              className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all cursor-pointer ${
                currentStep === 8 ? 'bg-[#D4AF37] text-[#0F3D2E]' : 'bg-[#155440] text-[#FBF8F1] hover:bg-[#1A624B]'
              }`}
            >
              8. OTP Verify
            </button>
            <button
              type="button"
              onClick={() => setCurrentStep(9)}
              className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all cursor-pointer ${
                currentStep === 9 ? 'bg-[#D4AF37] text-[#0F3D2E]' : 'bg-[#155440] text-[#FBF8F1] hover:bg-[#1A624B]'
              }`}
            >
              9. Done
            </button>
          </div>
        </div>
      </aside>

    </div>
  );
}
