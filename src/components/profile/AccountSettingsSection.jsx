import React, { useState } from 'react';
import { 
  ShieldCheck, 
  KeyRound, 
  Download, 
  UserX, 
  Trash2, 
  AlertTriangle, 
  CheckCircle2, 
  X,
  Smartphone,
  QrCode,
  Copy,
  Check,
  Info,
  Lock,
  RefreshCw,
  FileText,
  Clock,
  ShieldAlert
} from 'lucide-react';
import { useToast } from '../../context/ToastContext';

export default function AccountSettingsSection({ onLogout }) {
  const toast = useToast();

  // 2FA state: Mandatory for all accounts
  const [twoFactorMethod, setTwoFactorMethod] = useState('authenticator'); // 'authenticator' | 'sms'
  const [is2FaModalOpen, setIs2FaModalOpen] = useState(false);
  const [testOtp, setTestOtp] = useState('');
  const [otpVerified, setOtpVerified] = useState(true);
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedCodes, setCopiedCodes] = useState(false);
  const [showRecoveryCodes, setShowRecoveryCodes] = useState(false);

  // Lifecycle confirmation modals: 'deactivate' | 'delete' | 'gdpr' | null
  const [confirmModal, setConfirmModal] = useState(null);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [deletionConfirmText, setDeletionConfirmText] = useState('');
  const [deactivationSuccess, setDeactivationSuccess] = useState(false);
  const [deletionSuccess, setDeletionSuccess] = useState(false);

  const SECRET_KEY = "MYTRI-2FA-9842-8810-ENFORCE";
  const RECOVERY_CODES = [
    "A942-88B1",
    "C104-99D2",
    "E381-44F3",
    "G720-11H4",
    "J883-22K5",
    "L914-77M6",
    "N402-55P7",
    "Q619-33R8"
  ];

  const handleCopyKey = () => {
    navigator.clipboard.writeText(SECRET_KEY);
    setCopiedKey(true);
    toast.success("Secret Key Copied", "Paste this key into Google Authenticator or Authy.");
    setTimeout(() => setCopiedKey(false), 2500);
  };

  const handleCopyRecoveryCodes = () => {
    navigator.clipboard.writeText(RECOVERY_CODES.join('\n'));
    setCopiedCodes(true);
    toast.success("Recovery Codes Copied", "Store these codes safely in an encrypted password manager.");
    setTimeout(() => setCopiedCodes(false), 2500);
  };

  const handleDownloadRecoveryCodes = () => {
    const text = `MYTRIKART MANDATORY 2FA BACKUP RECOVERY CODES\nGenerated: ${new Date().toLocaleDateString()}\n\nEach code can be used exactly once if you lose access to your authenticator device:\n\n${RECOVERY_CODES.join('\n')}\n\nKeep this file confidential.`;
    const element = document.createElement("a");
    const file = new Blob([text], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = "mytrikart-2fa-recovery-codes.txt";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    toast.success("Recovery Codes Downloaded", "mytrikart-2fa-recovery-codes.txt saved to your downloads.");
  };

  const handleVerify2FaCode = (e) => {
    e.preventDefault();
    if (testOtp.length < 6) {
      toast.error("Invalid Code", "Please enter a valid 6-digit code.");
      return;
    }
    setOtpVerified(true);
    setIs2FaModalOpen(false);
    toast.success("2FA Verified & Active", "Your authenticator setup has been confirmed.");
  };

  const handleDeactivate = (e) => {
    e.preventDefault();
    if (!termsAccepted) {
      toast.error("Terms Required", "Please accept the deactivation terms and conditions.");
      return;
    }
    if (!confirmPassword) {
      toast.error("Password Required", "Please enter your account password to confirm.");
      return;
    }
    setDeactivationSuccess(true);
    setConfirmModal(null);
    toast.info("Account Deactivated", "Your account is paused. You can log back in at any time to reactivate.");
    setTimeout(() => {
      if (onLogout) onLogout();
    }, 2500);
  };

  const handleDelete = (e) => {
    e.preventDefault();
    if (!termsAccepted) {
      toast.error("Terms Required", "Please accept the permanent deletion terms & conditions.");
      return;
    }
    if (deletionConfirmText !== "DELETE MY ACCOUNT") {
      toast.error("Confirmation Mismatch", 'Please type "DELETE MY ACCOUNT" exactly to proceed.');
      return;
    }
    setDeletionSuccess(true);
    setConfirmModal(null);
    toast.info("Account Deletion Initiated", "30-day grace period started. All data will be purged under GDPR.");
    setTimeout(() => {
      if (onLogout) onLogout();
    }, 2500);
  };

  const handleGdprExport = () => {
    toast.success("GDPR Export Ready", "A portable encrypted ZIP archive of your full account history was dispatched to your email.");
  };

  return (
    <div className="bg-white rounded-3xl border border-[#EAE3DC] p-6 sm:p-8 lg:p-10 shadow-xs animate-reveal space-y-8">
      
      {/* 1. Header */}
      <div className="pb-6 border-b border-[#EAE3DC]">
        <div className="flex items-center space-x-2 text-xs font-black uppercase tracking-wider text-[#FF811A] mb-1">
          <ShieldCheck className="w-4 h-4 text-[#FA661C]" />
          <span>Security, Policy & Account Lifecycle</span>
        </div>
        <h2 className="font-['Outfit'] text-2xl sm:text-3xl font-extrabold text-[#FA661C] tracking-tight">
          Account Security &amp; Settings
        </h2>
        <p className="text-xs sm:text-sm text-[#6B6058] mt-1">
          Mandatory 2-factor authentication, session audit, and transparent account activation/deletion controls
        </p>
      </div>

      {/* Success Notification if deactivated/deleted */}
      {deactivationSuccess && (
        <div className="p-4 bg-[#FFF8F2] border-2 border-[#FF811A] rounded-2xl text-xs font-bold text-[#FA661C] flex items-center space-x-2 animate-dropdown">
          <CheckCircle2 className="w-5 h-5 text-[#FF811A] shrink-0" />
          <span>Account successfully deactivated. Signing you out... Log in anytime to restore.</span>
        </div>
      )}

      {deletionSuccess && (
        <div className="p-4 bg-[#FDE8EA] border-2 border-[#D7263D] rounded-2xl text-xs font-bold text-[#D7263D] flex items-center space-x-2 animate-dropdown">
          <AlertTriangle className="w-5 h-5 text-[#D7263D] shrink-0" />
          <span>Deletion scheduled with 30-day grace period. Signing you out...</span>
        </div>
      )}

      {/* 2. MANDATORY TWO-FACTOR AUTHENTICATION SECTION */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-['Outfit'] font-black text-lg text-[#FA661C] flex items-center space-x-2">
              <KeyRound className="w-5 h-5 text-[#FF811A]" />
              <span>Two-Factor Authentication (2FA)</span>
            </h3>
            <p className="text-xs text-[#6B6058] mt-0.5">
              Two-factor authentication is <strong>mandatory for all customer accounts</strong> to protect transactions, saved cards, and deliveries.
            </p>
          </div>

          <span className="px-3 py-1 bg-[#FFF3EC] text-[#FA661C] border border-[#FA661C]/30 rounded-full text-[11px] font-black uppercase tracking-wider flex items-center space-x-1.5 shadow-2xs shrink-0">
            <ShieldCheck className="w-3.5 h-3.5 text-[#FA661C]" />
            <span>MANDATORY &amp; ACTIVE</span>
          </span>
        </div>

        {/* Security Policy Banner */}
        <div className="p-4 rounded-2xl bg-[#FFF8F2] border border-[#FF811A]/40 flex items-start space-x-3 text-xs">
          <Info className="w-4 h-4 text-[#FF811A] shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold text-[#FA661C]">
              MytriKart Mandatory Account Protection Policy (SEC-2026)
            </p>
            <p className="text-[#6B6058] leading-relaxed">
              Every sign-in on an unrecognized browser or mobile device requires a secondary one-time verification token. This safeguard cannot be turned off to protect your wallet balance and stored addresses.
            </p>
          </div>
        </div>

        {/* 2FA Configuration Card */}
        <div className="p-5 rounded-2xl border border-[#EAE3DC] bg-white space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Primary Method: Authenticator App */}
            <div className={`p-4 rounded-2xl border transition-all ${
              twoFactorMethod === 'authenticator'
                ? 'border-[#FA661C] bg-[#FFF8F2]/60 ring-1 ring-[#FA661C]/20 shadow-xs'
                : 'border-[#EAE3DC] hover:border-[#FA661C]'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <QrCode className="w-4 h-4 text-[#FA661C]" />
                  <h4 className="font-bold text-xs text-[#FA661C]">Authenticator App (TOTP)</h4>
                </div>
                <span className="text-[10px] font-extrabold uppercase text-[#FA661C] bg-white px-2 py-0.5 rounded-full border border-[#FA661C]/30">
                  Recommended
                </span>
              </div>
              <p className="text-[11px] text-[#6B6058] mb-3">
                Use Google Authenticator, Microsoft Authenticator, or Authy to generate dynamic 30-second security codes.
              </p>
              <button
                type="button"
                onClick={() => { setTwoFactorMethod('authenticator'); setIs2FaModalOpen(true); }}
                className="w-full py-2 bg-[#FA661C] hover:bg-[#E0530B] text-white rounded-xl text-xs font-bold btn-interactive shadow-2xs cursor-pointer flex items-center justify-center space-x-1.5"
              >
                <QrCode className="w-3.5 h-3.5 text-[#FF811A]" />
                <span>Configure Authenticator App</span>
              </button>
            </div>

            {/* Secondary Backup: SMS Verification */}
            <div className={`p-4 rounded-2xl border transition-all ${
              twoFactorMethod === 'sms'
                ? 'border-[#FA661C] bg-[#FFF8F2]/60 ring-1 ring-[#FA661C]/20 shadow-xs'
                : 'border-[#EAE3DC] hover:border-[#FA661C]'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <Smartphone className="w-4 h-4 text-[#FA661C]" />
                  <h4 className="font-bold text-xs text-[#FA661C]">SMS Phone OTP Backup</h4>
                </div>
                <span className="text-[10px] font-bold text-[#6B6058]">
                  Verified
                </span>
              </div>
              <p className="text-[11px] text-[#6B6058] mb-3">
                Fallback one-time passcode sent directly to your registered mobile phone (+91 98765 *****).
              </p>
              <button
                type="button"
                onClick={() => { setTwoFactorMethod('sms'); toast.success("SMS Backup Verified", "A test code was dispatched to your mobile number."); }}
                className="w-full py-2 bg-white hover:bg-[#FFF3EC] text-[#FA661C] border border-[#EAE3DC] hover:border-[#FA661C] rounded-xl text-xs font-bold btn-interactive shadow-2xs cursor-pointer flex items-center justify-center space-x-1.5"
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Test SMS Delivery</span>
              </button>
            </div>

          </div>

          {/* Backup Recovery Codes Drawer */}
          <div className="pt-4 border-t border-[#EAE3DC] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h5 className="font-bold text-xs text-[#FA661C]">Emergency Backup Recovery Codes</h5>
              <p className="text-[11px] text-[#6B6058]">
                Generate 8 single-use codes to access your account if your authenticator device is lost or offline.
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => setShowRecoveryCodes(!showRecoveryCodes)}
                className="px-3.5 py-1.5 rounded-xl border border-[#EAE3DC] bg-white hover:bg-[#FFF3EC] text-xs font-bold text-[#FA661C] btn-interactive cursor-pointer"
              >
                {showRecoveryCodes ? 'Hide Codes' : 'View 8 Recovery Codes'}
              </button>
              {showRecoveryCodes && (
                <button
                  type="button"
                  onClick={handleDownloadRecoveryCodes}
                  className="px-3.5 py-1.5 rounded-xl bg-[#FA661C] text-white text-xs font-bold btn-interactive shadow-2xs cursor-pointer flex items-center space-x-1"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download .txt</span>
                </button>
              )}
            </div>
          </div>

          {/* Collapsible Recovery Codes Box */}
          {showRecoveryCodes && (
            <div className="p-4 bg-[#F9F6F0] rounded-2xl border border-[#EAE3DC] space-y-3 animate-dropdown">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-[#6B6058]">
                  One-time Emergency Access Tokens:
                </span>
                <button
                  type="button"
                  onClick={handleCopyRecoveryCodes}
                  className="text-xs font-bold text-[#FA661C] flex items-center space-x-1 cursor-pointer"
                >
                  {copiedCodes ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedCodes ? 'Copied All' : 'Copy All Codes'}</span>
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {RECOVERY_CODES.map((code, idx) => (
                  <div key={idx} className="p-2 bg-white rounded-xl border border-[#EAE3DC] text-center font-mono font-bold text-xs text-[#FA661C] shadow-2xs">
                    {code}
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>

      {/* 3. GDPR DATA EXPORT ARCHIVE */}
      <div className="p-5 rounded-2xl bg-white border border-[#EAE3DC] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start space-x-3.5">
          <div className="p-2.5 rounded-xl bg-[#FFF3EC] text-[#FA661C] shrink-0 mt-0.5">
            <Download className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-sm text-[#FA661C]">
              GDPR Data Export &amp; Privacy Archive
            </h4>
            <p className="text-xs text-[#6B6058] mt-0.5">
              Request a portable JSON/CSV archive of all your saved addresses, orders, invoices, and profile records.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleGdprExport}
          className="px-4 py-2 bg-white hover:bg-[#FFF3EC] text-[#FA661C] border border-[#EAE3DC] hover:border-[#FA661C] rounded-xl text-xs font-bold transition-all shrink-0 shadow-2xs cursor-pointer"
        >
          Request Data Copy
        </button>
      </div>

      {/* 4. ACCOUNT LIFECYCLE: ACTIVATION & DELETION CONTROLS */}
      <div className="p-6 rounded-3xl bg-[#FFF8F2]/60 border border-[#FF811A]/40 space-y-6">
        
        <div className="flex items-center space-x-2 text-[#FA661C]">
          <AlertTriangle className="w-5 h-5 text-[#FF811A]" />
          <div>
            <h4 className="font-['Outfit'] font-black text-base uppercase tracking-wider">
              Account Activation, Pause &amp; Deletion
            </h4>
            <p className="text-xs text-[#6B6058] mt-0.5">
              Clear procedures, terms, and safeguards for pausing or terminating your MytriKart account
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          
          {/* Card A: Account Deactivation & Instant Reactivation */}
          <div className="p-5 bg-white rounded-2xl border border-[#EAE3DC] flex flex-col justify-between space-y-4 shadow-xs">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-['Outfit'] font-bold text-sm text-[#FA661C]">
                  Deactivate Account
                </span>
                <span className="text-[10px] font-black uppercase bg-[#FFF3EC] text-[#FA661C] px-2 py-0.5 rounded-full border border-[#FA661C]/20">
                  Temporary Pause
                </span>
              </div>

              <div className="text-xs text-[#6B6058] space-y-2">
                <p>
                  <strong>What happens when you deactivate:</strong> Your public profile, reviews, and promotional alerts are paused. Your order history, saved addresses, wallet balance, and invoices remain intact.
                </p>
                <div className="p-3 bg-[#FFF8F2] rounded-xl border border-[#FF811A]/30 text-[11px] text-[#FA661C] space-y-1">
                  <p className="font-extrabold flex items-center space-x-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#FF811A]" />
                    <span>How Account Reactivation Works:</span>
                  </p>
                  <p className="text-[#6B6058]">
                    To reactivate anytime, simply log back into MytriKart with your registered email and password. An instant 2FA OTP will confirm your identity and immediately restore full access.
                  </p>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setConfirmModal('deactivate');
                setTermsAccepted(false);
                setConfirmPassword('');
              }}
              className="w-full py-2.5 px-4 bg-[#FFFFFF] hover:bg-[#FDE8EA] text-[#D7263D] border border-[#EAE3DC] hover:border-[#D7263D] rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              Pause / Deactivate Account...
            </button>
          </div>

          {/* Card B: Permanent Account Deletion (GDPR Right-to-be-Forgotten) */}
          <div className="p-5 bg-white rounded-2xl border border-[#D7263D]/30 flex flex-col justify-between space-y-4 shadow-xs">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-['Outfit'] font-bold text-sm text-[#D7263D]">
                  Permanently Delete Account
                </span>
                <span className="text-[10px] font-black uppercase bg-[#FDE8EA] text-[#D7263D] px-2 py-0.5 rounded-full border border-[#D7263D]/20">
                  Irreversible
                </span>
              </div>

              <div className="text-xs text-[#6B6058] space-y-2">
                <p>
                  <strong>Terms &amp; Conditions of Permanent Deletion:</strong>
                </p>
                <ul className="list-disc pl-4 space-y-1 text-[11px] text-[#6B6058]">
                  <li><strong>30-Day Grace Period:</strong> You can cancel deletion within 30 days simply by signing back in.</li>
                  <li><strong>Data Purging:</strong> All personal credentials, saved addresses, and payment methods are permanently scrubbed.</li>
                  <li><strong>Wallet &amp; Points:</strong> Any unspent wallet balance or loyalty rewards are permanently forfeited.</li>
                  <li><strong>Statutory Audits:</strong> Historical tax invoices are retained anonymously as required by fiscal regulations.</li>
                </ul>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setConfirmModal('delete');
                setTermsAccepted(false);
                setDeletionConfirmText('');
              }}
              className="w-full py-2.5 px-4 bg-[#D7263D] hover:bg-[#D94435] text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-xs"
            >
              Permanently Delete Account Forever...
            </button>
          </div>

        </div>

      </div>

      {/* --- MODAL 1: 2FA AUTHENTICATOR SETUP MODAL --- */}
      {is2FaModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#FA661C]/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white border-2 border-[#FA661C]/30 rounded-3xl shadow-2xl max-w-md w-full p-6 text-left space-y-4 animate-dropdown">
            <div className="flex items-center justify-between pb-3 border-b border-[#EAE3DC]">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-xl bg-[#FA661C] text-[#FF811A] flex items-center justify-center">
                  <QrCode className="w-4 h-4" />
                </div>
                <h3 className="font-['Outfit'] font-black text-base text-[#FA661C]">
                  Configure Authenticator App (2FA)
                </h3>
              </div>
              <button 
                type="button" 
                onClick={() => setIs2FaModalOpen(false)}
                className="p-1 rounded-full text-[#6B6058] hover:text-[#FA661C]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <p className="text-[#6B6058]">
                1. Open Google Authenticator, Microsoft Authenticator, or Authy on your phone.
              </p>

              {/* Simulated QR Code Canvas */}
              <div className="p-4 bg-[#F9F6F0] rounded-2xl border border-[#EAE3DC] flex flex-col items-center justify-center space-y-2">
                <div className="w-36 h-36 bg-white p-2 border-2 border-dashed border-[#FA661C] rounded-xl flex items-center justify-center">
                  <div className="grid grid-cols-6 gap-1 w-full h-full p-1 bg-[#FA661C]/10 rounded">
                    {Array.from({ length: 36 }).map((_, i) => (
                      <div key={i} className={`rounded-xs ${i % 2 === 0 ? 'bg-[#FA661C]' : 'bg-[#FF811A]'}`} />
                    ))}
                  </div>
                </div>
                <span className="text-[10px] text-[#6B6058] font-bold">Scan with Authenticator Camera</span>
              </div>

              {/* Manual Setup Key */}
              <div>
                <span className="text-[11px] font-bold text-[#6B6058]">Or enter key manually:</span>
                <div className="mt-1 p-2.5 bg-[#FFF8F2] rounded-xl border border-[#FF811A]/40 flex items-center justify-between font-mono font-bold text-xs text-[#FA661C]">
                  <span>{SECRET_KEY}</span>
                  <button
                    type="button"
                    onClick={handleCopyKey}
                    className="text-xs font-bold text-[#FA661C] flex items-center space-x-1"
                  >
                    {copiedKey ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedKey ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>

              {/* 6-Digit Test Code Input */}
              <form onSubmit={handleVerify2FaCode} className="space-y-3 pt-2">
                <label className="block font-bold text-[#6B6058]">
                  2. Enter the 6-digit code shown in your app to activate:
                </label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={testOtp}
                    onChange={(e) => setTestOtp(e.target.value.replace(/\D/g, ''))}
                    placeholder="e.g. 849201"
                    className="flex-1 py-2 px-3 bg-white border border-[#EAE3DC] rounded-xl text-center text-lg font-mono font-black tracking-widest text-[#FA661C] focus:ring-2 focus:ring-[#FF811A] outline-none"
                  />
                  <button
                    type="submit"
                    className="px-5 py-2 bg-[#FA661C] hover:bg-[#E0530B] text-white rounded-xl font-bold btn-interactive shadow-xs"
                  >
                    Activate
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL 2: DEACTIVATION TERMS & CONFIRMATION --- */}
      {confirmModal === 'deactivate' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#FA661C]/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white border-2 border-[#FF811A]/40 rounded-3xl shadow-2xl max-w-md w-full p-6 text-left space-y-4 animate-dropdown">
            <div className="flex items-center justify-between pb-2 border-b border-[#EAE3DC]">
              <div className="flex items-center space-x-2">
                <div className="w-9 h-9 rounded-xl bg-[#FFF3EC] text-[#FA661C] flex items-center justify-center">
                  <UserX className="w-5 h-5" />
                </div>
                <h3 className="font-['Outfit'] font-black text-lg text-[#FA661C]">
                  Pause / Deactivate Account
                </h3>
              </div>
              <button 
                type="button" 
                onClick={() => setConfirmModal(null)}
                className="p-1 rounded-full text-[#6B6058] hover:text-[#FA661C]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-[#6B6058]">
              <p>
                Deactivating puts your customer profile into dormant state. You can reactivate at any time by simply logging in.
              </p>

              <div className="p-3 bg-[#FFF8F2] rounded-xl border border-[#FF811A]/30 space-y-1.5 text-[11px]">
                <p className="font-bold text-[#FA661C]">Applicable Terms &amp; Conditions:</p>
                <ul className="list-disc pl-4 space-y-1 text-[#6B6058]">
                  <li>Any active consignments will still be delivered to your address.</li>
                  <li>Your stored wallet balance and purchase invoices will remain safely preserved.</li>
                  <li>Promotional SMS and email marketing newsletters will cease immediately.</li>
                </ul>
              </div>

              <label className="flex items-start space-x-2 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  className="mt-0.5 rounded text-[#FA661C] focus:ring-[#FF811A]"
                />
                <span className="font-semibold text-[#FA661C]">
                  I understand these terms and wish to temporarily deactivate my MytriKart account.
                </span>
              </label>

              <div className="space-y-1 pt-1">
                <label className="block font-bold text-[#6B6058]">Enter Password to Confirm:</label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Your current password"
                  className="w-full py-2 px-3 border border-[#EAE3DC] rounded-xl text-xs outline-none focus:ring-1 focus:ring-[#FF811A]"
                />
              </div>
            </div>

            <div className="flex space-x-2 pt-2 border-t border-[#EAE3DC]">
              <button
                type="button"
                onClick={() => setConfirmModal(null)}
                className="flex-1 py-2.5 bg-white border border-[#EAE3DC] text-[#6B6058] rounded-xl font-bold text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeactivate}
                className="flex-1 py-2.5 bg-[#FA661C] hover:bg-[#E0530B] text-white rounded-xl font-bold text-xs shadow-xs cursor-pointer"
              >
                Confirm Deactivation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL 3: PERMANENT DELETION TERMS & CONFIRMATION --- */}
      {confirmModal === 'delete' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#FA661C]/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white border-2 border-[#D7263D]/50 rounded-3xl shadow-2xl max-w-md w-full p-6 text-left space-y-4 animate-dropdown">
            <div className="flex items-center justify-between pb-2 border-b border-[#EAE3DC]">
              <div className="flex items-center space-x-2">
                <div className="w-9 h-9 rounded-xl bg-[#FDE8EA] text-[#D7263D] flex items-center justify-center">
                  <Trash2 className="w-5 h-5" />
                </div>
                <h3 className="font-['Outfit'] font-black text-lg text-[#D7263D]">
                  Permanently Delete Account
                </h3>
              </div>
              <button 
                type="button" 
                onClick={() => setConfirmModal(null)}
                className="p-1 rounded-full text-[#6B6058] hover:text-[#D7263D]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-[#6B6058]">
              <div className="p-3 bg-[#FDE8EA] rounded-xl border border-[#D7263D]/30 text-[11px] text-[#D7263D] space-y-1">
                <p className="font-extrabold">Warning: Permanent Right-to-be-Forgotten Action</p>
                <p>
                  This action schedules permanent destruction of your account under statutory privacy regulations.
                </p>
              </div>

              <div className="space-y-1 text-[11px]">
                <p className="font-bold text-[#FA661C]">Strict Terms &amp; Conditions:</p>
                <ul className="list-disc pl-4 space-y-1 text-[#6B6058]">
                  <li>A <strong>30-day grace period</strong> begins today. Sign in anytime before 30 days to cancel this request.</li>
                  <li>After 30 days, your saved addresses, payment tokens, and login credentials will be permanently erased.</li>
                  <li>Any unused Mytri Wallet balances and loyalty points will be irrevocably forfeited.</li>
                  <li>Completed transaction invoices will be retained in anonymized format for statutory tax audit purposes.</li>
                </ul>
              </div>

              <label className="flex items-start space-x-2 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  className="mt-0.5 rounded text-[#D7263D] focus:ring-[#D7263D]"
                />
                <span className="font-semibold text-[#D7263D]">
                  I agree to the terms and understand that my account and benefits will be permanently destroyed.
                </span>
              </label>

              <div className="space-y-1 pt-1">
                <label className="block font-bold text-[#6B6058]">
                  Type <span className="font-mono text-[#D7263D]">DELETE MY ACCOUNT</span> to confirm:
                </label>
                <input
                  type="text"
                  required
                  value={deletionConfirmText}
                  onChange={(e) => setDeletionConfirmText(e.target.value)}
                  placeholder="DELETE MY ACCOUNT"
                  className="w-full py-2 px-3 border border-[#EAE3DC] rounded-xl text-xs font-mono font-bold tracking-wider outline-none focus:ring-1 focus:ring-[#D7263D]"
                />
              </div>
            </div>

            <div className="flex space-x-2 pt-2 border-t border-[#EAE3DC]">
              <button
                type="button"
                onClick={() => setConfirmModal(null)}
                className="flex-1 py-2.5 bg-white border border-[#EAE3DC] text-[#6B6058] rounded-xl font-bold text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="flex-1 py-2.5 bg-[#D7263D] hover:bg-[#D94435] text-white rounded-xl font-bold text-xs shadow-xs cursor-pointer"
              >
                Permanently Delete
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
