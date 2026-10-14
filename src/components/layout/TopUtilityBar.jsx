import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, ChevronRight, Store, ShieldAlert } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function TopUtilityBar({ onOpenLocationModal, deliveryLocation }) {
  const auth = useAuth();
  const isSeller = auth?.isLoggedIn && (auth?.currentUser?.role === 'vendor' || auth?.currentUser?.role === 'seller');
  const isAdmin = auth?.isLoggedIn && (auth?.currentUser?.role === 'admin' || auth?.currentUser?.role === 'administrator');

  return (
    <div className="bg-[#FFFFFF] border-b border-[#EAE3DC]/60 text-xs text-[#6B6058] py-1.5 md:py-2 px-3 md:px-8 flex items-center justify-between gap-2 transition-colors overflow-hidden">
      {/* Left side: Platform Logo & Role Badges */}
      <div className="flex items-center min-w-0 space-x-2 sm:space-x-3 md:space-x-4">
        {/* Platform Brand Logo (Routes to Home) — hidden on mobile; main header already shows it */}
        <Link 
          to="/" 
          className="hidden sm:flex items-center group focus:outline-none focus:ring-2 focus:ring-[#FA661C] rounded-md px-1 py-0.5 btn-interactive shrink-0"
          aria-label="MytriKart Homepage"
        >
          <img 
            src="/mytrikart-logo.png" 
            alt="MytriKart Logo" 
            className="h-8 md:h-10 w-auto object-contain max-w-[200px] md:max-w-[240px]"
          />
        </Link>

        {isSeller && (
          <Link
            to="/seller/dashboard"
            className="inline-flex items-center space-x-1 sm:space-x-1.5 px-2.5 sm:px-3 py-0.5 sm:py-1 bg-[#FFF3EC] hover:bg-[#FA661C] text-[#FA661C] hover:text-[#FFFFFF] border border-[#FA661C] rounded-full text-[11px] sm:text-xs font-black transition-colors shadow-2xs group shrink-0"
            title="Return to Seller Dashboard"
          >
            <Store className="w-3.5 h-3.5 text-[#FA661C] group-hover:text-white transition-colors shrink-0" />
            <span className="hidden sm:inline">Back to Seller Dashboard →</span>
            <span className="sm:hidden whitespace-nowrap">Seller Hub →</span>
          </Link>
        )}

        {isAdmin && (
          <Link
            to="/admin"
            className="inline-flex items-center space-x-1 sm:space-x-1.5 px-2.5 sm:px-3 py-0.5 sm:py-1 bg-[#FFF3EC] hover:bg-[#FA661C] text-[#FA661C] hover:text-[#FFFFFF] border border-[#FA661C] rounded-full text-[11px] sm:text-xs font-black transition-colors shadow-2xs group shrink-0"
            title="Open Admin Operations Console"
          >
            <ShieldAlert className="w-3.5 h-3.5 text-[#FA661C] group-hover:text-white transition-colors shrink-0" />
            <span className="hidden sm:inline">Admin Operations Console →</span>
            <span className="sm:hidden whitespace-nowrap">Admin Ops →</span>
          </Link>
        )}
      </div>

      {/* Right side: Delivery Location Link */}
      <button
        onClick={onOpenLocationModal}
        className="ml-auto min-w-0 shrink flex items-center space-x-1.5 text-[#6B6058] hover:text-[#FA661C] font-medium transition-colors group focus:outline-none focus:ring-1 focus:ring-[#FA661C] rounded-md px-2 py-1 cursor-pointer"
        aria-label="Select delivery location"
      >
        <MapPin className="w-4 h-4 text-[#FF811A] group-hover:bounce transition-transform shrink-0" />
        <span className="hidden sm:inline text-xs truncate max-w-[200px] md:max-w-none">
          {deliveryLocation ? (
            <>Deliver to: <strong className="text-[#FA661C]">{deliveryLocation}</strong></>
          ) : (
            <>Location not set — <span className="underline decoration-[#FF811A] underline-offset-2">Select delivery location</span></>
          )}
        </span>
        <span className="sm:hidden text-xs underline decoration-[#FF811A] truncate max-w-[50vw]">
          {deliveryLocation || 'Set Location'}
        </span>
        <ChevronRight className="w-3 h-3 text-[#6B6058] group-hover:translate-x-0.5 transition-transform shrink-0" />
      </button>
    </div>
  );
}
