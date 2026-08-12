import React, { useState } from 'react';
import { 
  ShieldCheck, 
  KeyRound, 
  Download, 
  UserX, 
  Trash2, 
  AlertTriangle, 
  CheckCircle2, 
  X 
} from 'lucide-react';

export default function AccountSettingsSection({ onLogout }) {
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(true);
  const [confirmModal, setConfirmModal] = useState(null); // 'deactivate' | 'delete' | 'gdpr' | null
  const [toastMsg, setToastMsg] = useState('');

  const handleToggle2FA = () => {
    setTwoFactorEnabled(!twoFactorEnabled);
    setToastMsg(twoFactorEnabled ? "Two-Factor Authentication Disabled" : "Two-Factor Authentication Enabled via Authenticator");
    setTimeout(() => setToastMsg(''), 3000);
  };

  const handleDeactivate = () => {
    alert("Account Deactivated. You can reactivate anytime by logging back in.");
    setConfirmModal(null);
    if (onLogout) onLogout();
  };

  const handleDelete = () => {
    alert("Account deletion request submitted under GDPR & Privacy laws. All personal data will be purged.");
    setConfirmModal(null);
    if (onLogout) onLogout();
  };

  const handleGdprExport = () => {
    alert("GDPR Data Archive generated! A download link containing your full purchase and account history has been emailed.");
    setConfirmModal(null);
  };

  return (
    <div className="bg-white rounded-3xl border border-[#D8E0DC] p-6 sm:p-8 lg:p-10 shadow-xs animate-reveal">
      
      {/* Header */}
      <div className="pb-6 border-b border-[#D8E0DC]">
        <h2 className="font-['Outfit'] text-2xl sm:text-3xl font-extrabold text-[#0F3D2E] tracking-tight">
          Security & Account Settings
        </h2>
        <p className="text-xs sm:text-sm text-[#5C6B63] mt-1">
          Manage 2-Factor Authentication, GDPR data export requests, and account lifecycle
        </p>
      </div>

      {toastMsg && (
        <div className="mt-4 p-3 bg-[#E8F2EE] text-[#0F3D2E] text-xs font-bold rounded-xl border border-[#0F3D2E]/20 flex items-center space-x-2 animate-dropdown">
          <CheckCircle2 className="w-4 h-4 text-[#D4AF37]" />
          <span>{toastMsg}</span>
        </div>
      )}

      <div className="mt-8 space-y-6">
        
        {/* Two-Factor Authentication Box */}
        <div className="p-5 rounded-2xl bg-[#FBF8F1] border border-[#D8E0DC] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start space-x-3.5">
            <div className="p-2.5 rounded-xl bg-[#0F3D2E] text-[#D4AF37] shrink-0 mt-0.5">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h4 className="font-bold text-sm text-[#0F3D2E]">
                  Two-Factor Authentication (2FA)
                </h4>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                  twoFactorEnabled ? 'bg-[#E8F2EE] text-[#0F3D2E]' : 'bg-[#FDEDEC] text-[#C0392B]'
                }`}>
                  {twoFactorEnabled ? 'Enabled' : 'Disabled'}
                </span>
              </div>
              <p className="text-xs text-[#5C6B63] mt-0.5">
                Requires a 6-digit authenticator code (or SMS OTP) upon logging into new devices.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleToggle2FA}
            className={`w-12 h-6 rounded-full transition-colors relative focus:outline-none shrink-0 ${
              twoFactorEnabled ? 'bg-[#0F3D2E]' : 'bg-[#D8E0DC]'
            }`}
          >
            <div className={`w-4 h-4 rounded-full bg-[#FBF8F1] absolute top-1 transition-transform ${
              twoFactorEnabled ? 'right-1' : 'left-1'
            }`} />
          </button>
        </div>

        {/* GDPR Privacy & Personal Data Archive */}
        <div className="p-5 rounded-2xl bg-[#FBF8F1] border border-[#D8E0DC] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start space-x-3.5">
            <div className="p-2.5 rounded-xl bg-[#E8F2EE] text-[#0F3D2E] shrink-0 mt-0.5">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-[#0F3D2E]">
                GDPR Data Export & Privacy Archive
              </h4>
              <p className="text-xs text-[#5C6B63] mt-0.5">
                Request a portable JSON/CSV archive of all your saved addresses, orders, invoices, and profile records.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleGdprExport}
            className="px-4 py-2 bg-white hover:bg-[#E8F2EE] text-[#0F3D2E] border border-[#D8E0DC] hover:border-[#0F3D2E] rounded-xl text-xs font-bold transition-all shrink-0 shadow-2xs cursor-pointer"
          >
            Request Data Copy
          </button>
        </div>

        {/* Danger Zone: Deactivation & Deletion */}
        <div className="p-5 rounded-2xl bg-[#FDEDEC]/40 border border-[#C0392B]/30 space-y-4">
          <div className="flex items-center space-x-2 text-[#C0392B]">
            <AlertTriangle className="w-4 h-4" />
            <h4 className="font-['Outfit'] font-bold text-sm uppercase tracking-wider">
              Account Lifecycle & Actions
            </h4>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Deactivate */}
            <div className="p-4 bg-white rounded-xl border border-[#D8E0DC] flex flex-col justify-between space-y-3">
              <div>
                <h5 className="font-bold text-xs sm:text-sm text-[#0F3D2E]">
                  Deactivate Account
                </h5>
                <p className="text-[11px] text-[#5C6B63] mt-0.5">
                  Temporarily hide your profile, active listings, and wishlist. You can log back in at any time to resume.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setConfirmModal('deactivate')}
                className="py-2 px-3 bg-[#FBF8F1] hover:bg-[#FDEDEC] text-[#C0392B] border border-[#D8E0DC] hover:border-[#C0392B] rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Deactivate Account...
              </button>
            </div>

            {/* Permanent Delete */}
            <div className="p-4 bg-white rounded-xl border border-[#D8E0DC] flex flex-col justify-between space-y-3">
              <div>
                <h5 className="font-bold text-xs sm:text-sm text-[#C0392B]">
                  Permanently Delete Account
                </h5>
                <p className="text-[11px] text-[#5C6B63] mt-0.5">
                  Irreversibly delete your customer records, Mytri wallet coins, active claims, and review logs under GDPR right-to-be-forgotten.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setConfirmModal('delete')}
                className="py-2 px-3 bg-[#C0392B] hover:bg-[#D94435] text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-xs"
              >
                Delete Account Forever...
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* Confirmation Dialog Modal */}
      {confirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0F3D2E]/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-[#FBF8F1] border-2 border-[#C0392B]/40 rounded-3xl shadow-2xl max-w-md w-full p-6 text-center space-y-4 animate-dropdown">
            <div className="w-12 h-12 rounded-full bg-[#FDEDEC] text-[#C0392B] flex items-center justify-center mx-auto shadow-sm">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <h3 className="font-['Outfit'] text-xl font-black text-[#0F3D2E]">
              {confirmModal === 'deactivate' ? 'Deactivate MytriKart Account?' : 'Permanently Delete Account?'}
            </h3>

            <p className="text-xs text-[#5C6B63]">
              {confirmModal === 'deactivate'
                ? 'Your active sessions will be terminated and notifications paused. Log in anytime to reactivate.'
                : 'This action is PERMANENT and cannot be undone. All wallet balance and loyalty perks will be forfeited.'}
            </p>

            <div className="flex space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setConfirmModal(null)}
                className="flex-1 py-2.5 bg-white border border-[#D8E0DC] text-[#5C6B63] rounded-xl font-bold text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmModal === 'deactivate' ? handleDeactivate : handleDelete}
                className="flex-1 py-2.5 bg-[#C0392B] hover:bg-[#D94435] text-white rounded-xl font-bold text-xs shadow-xs"
              >
                Confirm Action
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
