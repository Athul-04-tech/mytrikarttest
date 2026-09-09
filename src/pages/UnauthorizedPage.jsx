import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert, Home, User, LogOut } from 'lucide-react';

export default function UnauthorizedPage({ allowedRoles = [] }) {
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();

  const userRole = (currentUser?.role || 'customer').toUpperCase();
  const requiredRolesText = allowedRoles
    .map(r => r.toUpperCase())
    .join(' or ');

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-[#FFFFFF] flex items-center justify-center p-4 font-sans selection:bg-[#FF811A]/30 selection:text-[#FA661C]">
      <div className="max-w-lg w-full bg-white rounded-3xl border border-[#EAE3DC] p-6 sm:p-10 shadow-xl text-center space-y-6 animate-reveal">
        
        {/* Header Icon */}
        <div className="w-16 h-16 rounded-2xl bg-[#FFF3F3] border border-[#FCA5A5]/40 text-[#DC2626] mx-auto flex items-center justify-center shadow-xs">
          <ShieldAlert className="w-8 h-8 text-[#DC2626]" />
        </div>

        {/* Title & Badge */}
        <div className="space-y-2">
          <span className="inline-block px-3 py-1 rounded-full bg-[#FFF3F3] text-[#DC2626] text-xs font-bold uppercase tracking-wider border border-[#FCA5A5]/30">
            HTTP 403 — Access Restricted
          </span>
          <h1 className="font-['Outfit'] text-2xl sm:text-3xl font-extrabold text-[#FA661C]">
            Permission Required
          </h1>
        </div>

        {/* Informative Explanation */}
        <div className="p-4 rounded-2xl bg-[#FFFFFF] border border-[#EAE3DC] text-left text-xs sm:text-sm text-[#6B6058] space-y-2">
          <p>
            You are currently signed in as <strong className="text-[#FA661C] font-semibold">{currentUser?.name || currentUser?.username || 'User'}</strong> with role <span className="inline-block px-2 py-0.5 rounded bg-[#FFF3EC] text-[#FA661C] font-bold text-[11px]">{userRole}</span>.
          </p>
          <p>
            This operational area requires <strong className="text-[#FA661C]">{requiredRolesText}</strong> privileges. Your current account does not have authorization to access this specific module.
          </p>
        </div>

        {/* Navigation Actions */}
        <div className="space-y-3 pt-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Link
              to="/"
              className="py-2.5 px-4 rounded-xl text-xs font-bold text-[#FA661C] bg-[#FFFFFF] hover:bg-[#FFF3EC] border border-[#EAE3DC] transition-all flex items-center justify-center space-x-2 btn-interactive"
            >
              <Home className="w-4 h-4 text-[#FF811A]" />
              <span>Marketplace Home</span>
            </Link>

            <Link
              to="/profile"
              className="py-2.5 px-4 rounded-xl text-xs font-bold text-[#FFFFFF] bg-[#FA661C] hover:bg-[#E0530B] transition-all flex items-center justify-center space-x-2 btn-interactive shadow-xs"
            >
              <User className="w-4 h-4 text-[#FF811A]" />
              <span>My Customer Account</span>
            </Link>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-[#7A8B82] hover:text-[#DC2626] hover:bg-[#FFF3F3] border border-transparent hover:border-[#FCA5A5]/30 transition-all flex items-center justify-center space-x-2 cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out & Switch Account</span>
          </button>
        </div>

      </div>
    </div>
  );
}
