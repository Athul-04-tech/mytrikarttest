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
import { useAuth } from '../context/AuthContext';
import { apiRequest, ApiError } from '../utils/api';
import { ShieldAlert, RefreshCw, Layers } from 'lucide-react';

const INITIAL_SELLER_STATE = {
  // Method
  registrationMethod: 'email',
  // Step 1: Personal
  firstName: '',
  lastName: '',
  email: '',
  mobile: '',
  username: '',
  password: '',
  confirmPassword: '',
  // Step 2: Business
  storeName: '',
  businessName: '',
  businessType: 'company',
  isWomenOwned: false,
  gstVatNumber: '',
  panTin: '',
  businessRegNumber: '',
  yearsInBusiness: '1-3 years',
  // Step 3: Store Info
  storeSlug: '',
  storeDescription: '',
  storeLogo: '',
  storeBanner: '',
  businessCategory: '',
  productCategories: [],
  country: 'IN',
  storeAddress: '',
  city: '',
  state: '',
  zipCode: '',
  // Step 4: Contact
  supportEmail: '',
  supportPhone: '',
  whatsappNumber: '',
  website: '',
  socialLinks: {
    instagram: '',
    facebook: '',
    youtube: '',
    linkedin: '',
    x: ''
  },
  // Step 5: Payment
  payoutMethod: 'bank',
  bankName: '',
  accountHolder: '',
  accountNumber: '',
  ifscSwift: '',
  upiId: '',
  stripeConnectAccountId: '',
  stripeEmail: '',
  // Step 6: Verification
  uploadedDocuments: {},
  // Step 7: Agreement
  acceptedTerms: false
};

const FIELD_TO_STEP_AND_KEY = {
  // Step 1: Personal
  username: { step: 1, key: 'username', label: 'Username' },
  email: { step: 1, key: 'email', label: 'Email' },
  password: { step: 1, key: 'password', label: 'Password' },
  first_name: { step: 1, key: 'firstName', label: 'First Name' },
  last_name: { step: 1, key: 'lastName', label: 'Last Name' },
  mobile: { step: 1, key: 'mobile', label: 'Mobile Number' },
  phone_number: { step: 1, key: 'mobile', label: 'Mobile Number' },

  // Step 2: Business Info
  business_name: { step: 2, key: 'businessName', label: 'Business Name' },
  store_name: { step: 2, key: 'storeName', label: 'Store Name' },
  tax_id: { step: 2, key: 'gstVatNumber', label: 'GSTIN / Tax ID' },
  gst_vat_number: { step: 2, key: 'gstVatNumber', label: 'GSTIN / Tax ID' },
  registration_number: { step: 2, key: 'businessRegNumber', label: 'Registration Number' },
  business_type: { step: 2, key: 'businessType', label: 'Business Type' },
  years_in_business: { step: 2, key: 'yearsInBusiness', label: 'Years in Business' },

  // Step 3: Store Info
  store_slug: { step: 3, key: 'storeSlug', label: 'Store Slug' },
  store_description: { step: 3, key: 'storeDescription', label: 'Store Description' },
  address_line1: { step: 3, key: 'storeAddress', label: 'Store Address' },
  city: { step: 3, key: 'city', label: 'City' },
  state: { step: 3, key: 'state', label: 'State' },
  postal_code: { step: 3, key: 'zipCode', label: 'ZIP / Postal Code' },
  country: { step: 3, key: 'country', label: 'Country' },

  // Step 4: Contact
  support_email: { step: 4, key: 'supportEmail', label: 'Support Email' },
  support_phone: { step: 4, key: 'supportPhone', label: 'Support Phone' },
  whatsapp_number: { step: 4, key: 'whatsappNumber', label: 'WhatsApp Number' },

  // Step 5: Payment
  payout_method: { step: 5, key: 'payoutMethod', label: 'Payout Method' },
  bank_account_number: { step: 5, key: 'accountNumber', label: 'Bank Account Number' },
  bank_ifsc: { step: 5, key: 'ifscSwift', label: 'IFSC Code' },
  bank_account_holder: { step: 5, key: 'accountHolder', label: 'Account Holder' },
  upi_id: { step: 5, key: 'upiId', label: 'UPI ID' },
  stripe_connect_account_id: { step: 5, key: 'stripeConnectAccountId', label: 'Stripe Account ID' }
};

function parseBackendRegistrationErrors(data) {
  const fieldErrors = {};
  const stepErrors = {};
  const stepList = [];
  const summaryParts = [];

  function traverse(obj) {
    if (!obj || typeof obj !== 'object') return;
    for (const [key, val] of Object.entries(obj)) {
      if (Array.isArray(val)) {
        const msg = val.map(m => (typeof m === 'object' ? JSON.stringify(m) : m)).join(' ');
        const mapping = FIELD_TO_STEP_AND_KEY[key];
        if (mapping) {
          fieldErrors[mapping.key] = msg;
          fieldErrors[key] = msg; // Also save under raw key for component lookup
          if (!stepErrors[mapping.step]) stepErrors[mapping.step] = [];
          stepErrors[mapping.step].push(`${mapping.label}: ${msg}`);
          if (!stepList.includes(mapping.step)) stepList.push(mapping.step);
        } else {
          fieldErrors[key] = msg;
          summaryParts.push(`${key.replace(/_/g, ' ')}: ${msg}`);
        }
      } else if (typeof val === 'object') {
        traverse(val);
      }
    }
  }

  traverse(data);
  stepList.sort((a, b) => a - b);

  for (const stepNum of stepList) {
    const stepLabel = SELLER_STEPS.find(s => s.step === stepNum)?.label || `Step ${stepNum}`;
    const msgs = stepErrors[stepNum].join('; ');
    summaryParts.push(`${stepLabel} (${msgs})`);
  }

  const summaryMessage = summaryParts.length > 0
    ? summaryParts.join(' | ')
    : (data.detail || data.message || "Vendor registration failed. Please check field inputs.");

  return {
    fieldErrors,
    stepErrors,
    firstErrorStep: stepList[0] || null,
    summaryMessage
  };
}

export default function SellerRegisterPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState(INITIAL_SELLER_STATE);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState(null);
  const [backendErrors, setBackendErrors] = useState({});
  const [loginFailedFallback, setLoginFailedFallback] = useState(false);
  
  const { login } = useAuth();
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
    if (apiError) setApiError(null);

    // Clear backend error for modified fields
    if (backendErrors && Object.keys(backendErrors).length > 0) {
      const updatedBackendErrors = { ...backendErrors };
      let hasChanges = false;
      for (const key of Object.keys(patch)) {
        if (updatedBackendErrors[key]) {
          delete updatedBackendErrors[key];
          hasChanges = true;
        }
        if (key === 'mobile' && (updatedBackendErrors.mobile || updatedBackendErrors.phone_number)) {
          delete updatedBackendErrors.mobile;
          delete updatedBackendErrors.phone_number;
          hasChanges = true;
        }
        if (key === 'gstVatNumber' && (updatedBackendErrors.tax_id || updatedBackendErrors.gst_vat_number)) {
          delete updatedBackendErrors.tax_id;
          delete updatedBackendErrors.gst_vat_number;
          hasChanges = true;
        }
        if (key === 'storeSlug' && (updatedBackendErrors.store_slug || updatedBackendErrors.storeSlug)) {
          delete updatedBackendErrors.store_slug;
          delete updatedBackendErrors.storeSlug;
          hasChanges = true;
        }
      }
      if (hasChanges) {
        setBackendErrors(updatedBackendErrors);
      }
    }
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

  // Login Fallback handler for Failure Mode 4a
  const handleRetryLoginAfterRegistration = async () => {
    setIsSubmitting(true);
    setApiError(null);
    try {
      await login({
        username: formData.username,
        password: formData.password
      });
      setLoginFailedFallback(false);
      setIsSubmitting(false);
      // Resume to wizard advance & OTP step
      await advanceWizardAndProceed();
    } catch (err) {
      setIsSubmitting(false);
      setApiError("Authentication retry failed. Please double check your password or try logging in on the merchant dashboard.");
    }
  };

  const advanceWizardAndProceed = async () => {
    try {
      await apiRequest('/api/vendors/wizard/advance/', {
        method: 'POST',
        body: JSON.stringify({ step: 7 })
      });
    } catch (err) {
      // Non-blocking if wizard/advance is missing or network glitch
    }
    setCurrentStep(8); // Move to OTP
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Full registration submit pipeline
  const handleSubmitRegistration = async () => {
    setIsSubmitting(true);
    setApiError(null);
    setBackendErrors({});
    setLoginFailedFallback(false);

    // 1. Build payment_details payload without bank_name
    let paymentDetailsPayload = {};
    if (formData.payoutMethod === 'bank') {
      paymentDetailsPayload = {
        payout_method: 'bank',
        bank_account_number: formData.accountNumber || '',
        bank_ifsc: formData.ifscSwift || '',
        bank_account_holder: formData.accountHolder || ''
      };
    } else if (formData.payoutMethod === 'upi') {
      paymentDetailsPayload = {
        payout_method: 'upi',
        upi_id: formData.upiId || ''
      };
    } else if (formData.payoutMethod === 'stripe_connect') {
      paymentDetailsPayload = {
        payout_method: 'stripe_connect',
        stripe_connect_account_id: formData.stripeConnectAccountId || formData.stripeEmail || ''
      };
    }

    // Parse yearsInBusiness into integer
    let parsedYears = 1;
    if (typeof formData.yearsInBusiness === 'string') {
      const match = formData.yearsInBusiness.match(/\d+/);
      if (match) parsedYears = parseInt(match[0], 10);
    }

    // 2. Build full POST /api/vendors/register/ payload
    const payload = {
      username: formData.username,
      email: formData.email,
      password: formData.password,
      phone_number: formData.mobile,
      profile: {
        business_name: formData.businessName,
        store_name: formData.storeName,
        business_type: formData.businessType || 'company',
        is_women_owned: Boolean(formData.isWomenOwned),
        tax_id: formData.gstVatNumber,
        registration_number: formData.businessRegNumber || '',
        years_in_business: parsedYears,
        store_slug: formData.storeSlug,
        store_description: formData.storeDescription || '',
        store_logo: formData.storeLogo || '',
        store_banner: formData.storeBanner || '',
        country: formData.country || 'IN',
        support_email: formData.supportEmail || formData.email,
        support_phone: formData.supportPhone || formData.mobile,
        whatsapp_number: formData.whatsappNumber || '',
        social_links: formData.socialLinks || {}
      },
      address: {
        address_line1: formData.storeAddress,
        address_line2: '',
        city: formData.city,
        state: formData.state,
        postal_code: formData.zipCode,
        country: formData.country || 'IN'
      },
      payment_details: paymentDetailsPayload,
      agreements: [
        { agreement_type: 'terms', agreement_version: '1.0' },
        { agreement_type: 'privacy', agreement_version: '1.0' },
        { agreement_type: 'vendor_agreement', agreement_version: '1.0' },
        { agreement_type: 'tax_declaration', agreement_version: '1.0' }
      ]
    };

    try {
      // A. Call POST /api/vendors/register/ (AllowAny)
      await apiRequest('/api/vendors/register/', {
        method: 'POST',
        body: JSON.stringify(payload),
        skipAuth: true
      });
    } catch (regErr) {
      setIsSubmitting(false);
      const data = regErr.data || {};
      const { fieldErrors, firstErrorStep, summaryMessage } = parseBackendRegistrationErrors(data);

      setBackendErrors(fieldErrors);
      setApiError(summaryMessage);

      // Auto switch to FIRST step containing an error (1..7)
      if (firstErrorStep) {
        setCurrentStep(firstErrorStep);
      } else {
        setCurrentStep(7);
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // B. Call login() to obtain JWT access token
    try {
      await login({
        username: formData.username,
        password: formData.password
      });
    } catch (loginErr) {
      // Failure Mode 4a: Registration succeeded (201), but immediate login failed!
      setIsSubmitting(false);
      setLoginFailedFallback(true);
      setApiError("Your vendor profile was created successfully! However, automated login failed due to a network glitch. Please click 'Authenticate & Continue' to log in with your credentials.");
      return;
    }

    // C. Upload Documents via POST /api/vendors/documents/ (IsVendorOwner, multipart/form-data)
    const docs = formData.uploadedDocuments || {};
    let uploadHasErrors = false;
    const updatedDocStatuses = { ...docs };

    for (const [docId, docMeta] of Object.entries(docs)) {
      if (docMeta && docMeta.fileObj) {
        const bodyFormData = new FormData();
        bodyFormData.append('document_type', docId);
        bodyFormData.append('file', docMeta.fileObj);

        try {
          await apiRequest('/api/vendors/documents/', {
            method: 'POST',
            body: bodyFormData,
            headers: {} // Let browser set multipart boundary automatically
          });
          updatedDocStatuses[docId] = {
            ...docMeta,
            status: 'done',
            errorMessage: null
          };
        } catch (docErr) {
          uploadHasErrors = true;
          updatedDocStatuses[docId] = {
            ...docMeta,
            status: 'failed',
            errorMessage: docErr.message || 'Upload failed'
          };
        }
      }
    }

    updateFormData({ uploadedDocuments: updatedDocStatuses });

    if (uploadHasErrors) {
      setIsSubmitting(false);
      setApiError("One or more identity documents failed to upload. Please review and retry the failed files.");
      setCurrentStep(6); // Return to Document Verification Step
      return;
    }

    // D. Call POST /api/vendors/wizard/advance/ with step: 7
    try {
      await apiRequest('/api/vendors/wizard/advance/', {
        method: 'POST',
        body: JSON.stringify({ step: 7 })
      });
    } catch (advErr) {
      // Non-blocking if advance fails, continue to OTP
    }

    // E. Transition to Step 8 (OTP)
    setIsSubmitting(false);
    setCurrentStep(8);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOtpVerified = () => {
    setCurrentStep(9); // Move to Success
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#FFFFFF] text-[#1A2420] flex flex-col font-sans selection:bg-[#FF811A]/30 selection:text-[#FA661C]">
      
      {/* 1. Dedicated Seller Onboarding Header */}
      <SellerAuthHeader 
        onBackToHome={() => navigate('/')} 
        onGoToSellerLogin={() => navigate('/login')}
      />

      {/* 2. Step Progress Bar */}
      {currentStep >= 1 && currentStep <= 7 && (
        <SellerProgressStepper currentStep={currentStep} onStepClick={(step) => setCurrentStep(step)} />
      )}

      {/* Login Failure Fallback Banner for Failure Mode 4a */}
      {loginFailedFallback && (
        <div className="max-w-4xl mx-auto w-full px-4 pt-4">
          <div className="p-4 bg-[#FFF8F2] border-2 border-[#FF811A] rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#FA661C] animate-dropdown shadow-md">
            <div className="flex items-center space-x-3">
              <ShieldAlert className="w-6 h-6 text-[#FF811A] shrink-0" />
              <div>
                <span className="font-extrabold text-sm block">Account Created — Action Required</span>
                <p className="text-[#6B6058] mt-0.5">
                  Your profile for <strong>{formData.username}</strong> was created on the server. Please complete authentication to finalize document uploads.
                </p>
              </div>
            </div>
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleRetryLoginAfterRegistration}
              className="px-4 py-2 bg-[#FA661C] hover:bg-[#E0530B] text-[#FFFFFF] font-bold text-xs rounded-xl btn-interactive flex items-center space-x-1.5 shrink-0 cursor-pointer shadow-sm"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-[#FF811A] ${isSubmitting ? 'animate-spin' : ''}`} />
              <span>Authenticate & Continue</span>
            </button>
          </div>
        </div>
      )}

      {/* 3. Main Form Container */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col justify-start">
        
        {/* Backend Validation Error Banner */}
        {apiError && (
          <div className="mb-6 p-4.5 rounded-2xl bg-[#FDE8EA] border-2 border-[#D7263D] text-[#D7263D] shadow-sm flex items-start space-x-3.5 text-xs animate-reveal">
            <ShieldAlert className="w-5 h-5 text-[#D7263D] shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-['Outfit'] font-extrabold text-sm text-[#D7263D]">
                Registration Error (Server Response)
              </h3>
              <p className="mt-1 font-semibold leading-relaxed text-[#D7263D]">
                {apiError}
              </p>
              {Object.keys(backendErrors).length > 0 && (
                <p className="text-[11px] text-[#6B6058] mt-1.5 font-medium">
                  Navigated to the first step containing rejected inputs. Please update the highlighted fields and resubmit.
                </p>
              )}
            </div>
          </div>
        )}

        {/* Step 0: Registration Method Choice */}
        {currentStep === 0 && (
          <RegistrationMethodChoice onSelectMethod={handleSelectMethod} />
        )}

        {/* Step 1: Personal Information */}
        {currentStep === 1 && (
          <Step1PersonalInfo 
            formData={formData} 
            updateFormData={updateFormData} 
            onNext={handleNextStep}
            onBack={() => setCurrentStep(0)}
            backendErrors={backendErrors}
          />
        )}

        {/* Step 2: Business Information */}
        {currentStep === 2 && (
          <Step2BusinessInfo 
            formData={formData} 
            updateFormData={updateFormData} 
            onNext={handleNextStep}
            onPrev={handlePrevStep}
            backendErrors={backendErrors}
          />
        )}

        {/* Step 3: Store Information */}
        {currentStep === 3 && (
          <Step3StoreInfo 
            formData={formData} 
            updateFormData={updateFormData} 
            onNext={handleNextStep}
            onPrev={handlePrevStep}
            backendErrors={backendErrors}
          />
        )}

        {/* Step 4: Contact & Social Links */}
        {currentStep === 4 && (
          <Step4ContactInfo 
            formData={formData} 
            updateFormData={updateFormData} 
            onNext={handleNextStep}
            onPrev={handlePrevStep}
            backendErrors={backendErrors}
          />
        )}

        {/* Step 5: Payment & Bank Details */}
        {currentStep === 5 && (
          <Step5PaymentDetails 
            formData={formData} 
            updateFormData={updateFormData} 
            onNext={handleNextStep}
            onPrev={handlePrevStep}
            backendErrors={backendErrors}
          />
        )}

        {/* Step 6: Identity Verification Documents */}
        {currentStep === 6 && (
          <Step6IdentityVerify 
            formData={formData} 
            updateFormData={updateFormData} 
            onNext={handleNextStep}
            onPrev={handlePrevStep}
            backendErrors={backendErrors}
          />
        )}

        {/* Step 7: Terms, Conditions & Vendor Agreement */}
        {currentStep === 7 && (
          <Step7Agreement 
            formData={formData} 
            updateFormData={updateFormData} 
            onSubmitRegistration={handleSubmitRegistration}
            onBack={handlePrevStep}
            isSubmitting={isSubmitting}
            apiError={apiError}
          />
        )}

        {/* Step 8: OTP Verification */}
        {currentStep === 8 && (
          <SellerOtpVerifyStep 
            formData={formData}
            onVerified={handleOtpVerified}
          />
        )}

        {/* Step 9: Submission Success & Account Activation */}
        {currentStep === 9 && (
          <SellerSuccessStep 
            formData={formData}
            onBackToHome={() => navigate('/')}
            onOpenDashboardPreview={() => navigate('/seller/dashboard')}
          />
        )}

      </main>

      {/* 4. Prototype Step Switcher (Dev Mode Only) */}
      {import.meta.env.DEV && (
        <aside 
          aria-label="Prototype Step Switcher"
          className="bg-[#FA661C] text-[#FFFFFF] border-t border-[#FF811A]/40 py-2.5 px-4 shadow-xl z-30"
        >
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center space-x-2">
              <span className="font-extrabold text-[#FF811A] uppercase tracking-wider text-[10px] flex items-center space-x-1">
                <Layers className="w-3.5 h-3.5" />
                <span>Reviewer Step Switcher:</span>
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto no-scrollbar">
              <button
                type="button"
                onClick={() => setCurrentStep(0)}
                className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all cursor-pointer ${
                  currentStep === 0 ? 'bg-[#FF811A] text-[#FA661C]' : 'bg-[#E0530B] text-[#FFFFFF] hover:bg-[#1A624B]'
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
                    currentStep === s.step ? 'bg-[#FF811A] text-[#FA661C]' : 'bg-[#E0530B] text-[#FFFFFF] hover:bg-[#1A624B]'
                  }`}
                >
                  {s.step}. {s.label}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setCurrentStep(8)}
                className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all cursor-pointer ${
                  currentStep === 8 ? 'bg-[#FF811A] text-[#FA661C]' : 'bg-[#E0530B] text-[#FFFFFF] hover:bg-[#1A624B]'
                }`}
              >
                8. OTP Verify
              </button>
              <button
                type="button"
                onClick={() => setCurrentStep(9)}
                className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all cursor-pointer ${
                  currentStep === 9 ? 'bg-[#FF811A] text-[#FA661C]' : 'bg-[#E0530B] text-[#FFFFFF] hover:bg-[#1A624B]'
                }`}
              >
                9. Done
              </button>
            </div>
          </div>
        </aside>
      )}

    </div>
  );
}

