import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import TopUtilityBar from './TopUtilityBar';
import SearchBar from './SearchBar';
import AccountMenuDropdown from '../dropdowns/AccountMenuDropdown';
import MoreDropdown from '../dropdowns/MoreDropdown';
import { User, ChevronDown, MoreVertical, ShoppingBag, Sparkles, LogIn, Heart, Store, ShieldAlert } from 'lucide-react';
import { useCart } from '../../context/CartWishlistContext';
import { useAuth } from '../../context/AuthContext';

export default function Header({ 
  onOpenLocationModal, 
  deliveryLocation, 
  isLoggedIn: propIsLoggedIn,
  currentUser: propCurrentUser,
  onLogout: propOnLogout
}) {
  const auth = useAuth();
  const isLoggedIn = auth ? auth.isLoggedIn : propIsLoggedIn;
  const currentUser = (auth && auth.currentUser) ? auth.currentUser : propCurrentUser;
  const isSeller = isLoggedIn && (currentUser?.role === 'vendor' || currentUser?.role === 'seller');
  const isAdmin = isLoggedIn && (currentUser?.role === 'admin' || currentUser?.role === 'administrator');
  const onLogout = auth ? auth.logout : propOnLogout;
  const [isAccountDropdownOpen, setIsAccountDropdownOpen] = useState(false);
  const [isMoreDropdownOpen, setIsMoreDropdownOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  const { cartCount, wishlistCount } = useCart();
  const headerRef = useRef(null);
  const navigate = useNavigate();

  // Handle sticky shadow on scroll
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 15) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Publish live header height so sticky elements below it (e.g. CategoryNav) never overlap
  useEffect(() => {
    const el = headerRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const update = () => {
      document.documentElement.style.setProperty('--header-h', `${el.offsetHeight}px`);
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Handle click outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (headerRef.current && !headerRef.current.contains(event.target)) {
        setIsAccountDropdownOpen(false);
        setIsMoreDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLoginButtonClick = () => {
    if (isLoggedIn) {
      setIsAccountDropdownOpen(prev => !prev);
      setIsMoreDropdownOpen(false);
    } else {
      navigate('/login');
    }
  };

  const toggleMore = () => {
    setIsMoreDropdownOpen(prev => !prev);
    setIsAccountDropdownOpen(false);
  };

  return (
    <header 
      ref={headerRef}
      className={`sticky top-0 z-40 bg-[#FFFFFF] transition-shadow duration-300 border-b border-[#EAE3DC] ${
        isScrolled ? 'shadow-lg shadow-[#FA661C]/5 border-[#FF811A]/30' : 'shadow-xs'
      }`}
    >
      {/* 1. Top Utility Bar */}
      <TopUtilityBar 
        onOpenLocationModal={onOpenLocationModal} 
        deliveryLocation={deliveryLocation} 
      />

      {/* 2. Main Search + Account Navigation Row */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-8 py-2.5 sm:py-3 flex flex-col sm:flex-row items-center gap-2.5 sm:gap-6">
        
        {/* Mobile Top Row: Logo + Utility Icons (Shown only on small screens) */}
        <div className="w-full sm:w-auto flex items-center justify-between sm:hidden pb-1 border-b border-[#EAE3DC]/40 gap-1.5 relative">
          <Link to="/" className="flex items-center btn-interactive shrink-0" aria-label="MytriKart Homepage">
            <img 
              src="/mytrikart-logo.png" 
              alt="MytriKart Logo" 
              className="h-7 w-auto object-contain max-w-[125px] min-[380px]:max-w-[155px]"
            />
          </Link>

          <div className="flex items-center space-x-1 sm:space-x-1.5 shrink-0">
            {/* Mobile Admin Console Button (Visible ONLY for Logged-In Admins) */}
            {isAdmin && (
              <Link
                to="/admin"
                className="px-2 py-1.5 rounded-xl text-xs font-extrabold flex items-center space-x-1 border border-[#FA661C] bg-[#FFF3EC] text-[#FA661C] shadow-2xs btn-interactive cursor-pointer shrink-0"
                aria-label="Open Admin Console"
                title="Admin Console"
              >
                <ShieldAlert className="w-3.5 h-3.5 text-[#FA661C]" />
                <span className="hidden min-[400px]:inline">Admin</span>
              </Link>
            )}

            {/* Mobile Seller Dashboard Button (Visible ONLY for Logged-In Sellers) */}
            {isSeller && (
              <Link
                to="/seller/dashboard"
                className="px-2 py-1.5 rounded-xl text-xs font-extrabold flex items-center space-x-1 border border-[#FA661C] bg-[#FFF3EC] text-[#FA661C] shadow-2xs btn-interactive cursor-pointer shrink-0"
                aria-label="Back to Seller Dashboard"
                title="Seller Dashboard"
              >
                <Store className="w-3.5 h-3.5 text-[#FA661C]" />
                <span className="hidden min-[400px]:inline">Hub</span>
              </Link>
            )}

            {/* Mobile Account / Login Button */}
            {isLoggedIn ? (
              <button
                type="button"
                onClick={() => setIsAccountDropdownOpen(prev => !prev)}
                className="p-1.5 rounded-xl text-xs font-bold flex items-center space-x-1 border border-[#FF811A] bg-[#1A1A1A] text-[#FFFFFF] shadow-xs btn-interactive cursor-pointer shrink-0"
                aria-label="User Account Menu"
              >
                <div className="w-6 h-6 rounded-full bg-[#FF811A] text-[#FA661C] font-black text-[10px] flex items-center justify-center avatar-interactive shrink-0">
                  {currentUser?.name ? currentUser.name.slice(0, 2).toUpperCase() : 'AS'}
                </div>
                <span className="truncate max-w-[45px] min-[380px]:max-w-[65px]">{currentUser?.name?.split(' ')[0] || 'User'}</span>
              </button>
            ) : (
              <Link
                to="/login"
                className="group px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-1 border border-[#FA661C] bg-[#1A1A1A] hover:bg-[#FA661C] text-[#FFFFFF] shadow-xs btn-interactive cursor-pointer transition-colors duration-150 shrink-0"
              >
                <LogIn className="w-3.5 h-3.5 text-[#FF811A] group-hover:text-[#000000] transition-colors duration-150" />
                <span className="text-[#FFFFFF] group-hover:text-[#000000] transition-colors duration-150">Login</span>
              </Link>
            )}

            {/* Mobile Wishlist Icon */}
            <Link
              to="/wishlist"
              className="relative p-2 bg-white border border-[#EAE3DC] text-[#FA661C] rounded-xl shadow-xs btn-interactive cursor-pointer shrink-0"
              aria-label="Wishlist"
            >
              <Heart className="w-4 h-4 text-[#FF811A]" />
              {wishlistCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-[#FF811A] text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center border border-white">
                  {wishlistCount}
                </span>
              )}
            </Link>

            {/* Mobile Cart Icon */}
            <Link
              to="/cart"
              className="relative p-2 bg-[#1A1A1A] text-[#FFFFFF] rounded-xl shadow-xs btn-interactive cursor-pointer shrink-0"
              aria-label="Shopping Cart"
            >
              <ShoppingBag className="w-4 h-4 text-[#FF811A] icon-interactive" />
              {cartCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-[#D7263D] text-white text-[10px] font-extrabold w-4 h-4 rounded-full flex items-center justify-center border border-white animate-badge-pop">
                  {cartCount}
                </span>
              )}
            </Link>

            {/* Mobile More Options Button */}
            <button
              type="button"
              onClick={toggleMore}
              className={`p-2 rounded-xl text-xs font-bold btn-interactive border focus:outline-none cursor-pointer shrink-0 ${
                isMoreDropdownOpen
                  ? 'bg-[#1A1A1A] text-[#FFFFFF] border-[#FA661C] shadow-sm'
                  : 'bg-white hover:bg-[#FFF8F2] text-[#6B6058] border-[#EAE3DC]'
              }`}
              aria-expanded={isMoreDropdownOpen}
              aria-label="More options"
            >
              <MoreVertical className="w-4 h-4 icon-interactive" />
            </button>
          </div>

          {/* Mobile Floating Dropdown Boxes */}
          {isLoggedIn && (
            <AccountMenuDropdown 
              isOpen={isAccountDropdownOpen} 
              onClose={() => setIsAccountDropdownOpen(false)} 
              currentUser={currentUser}
              onLogout={onLogout}
            />
          )}
          <MoreDropdown 
            isOpen={isMoreDropdownOpen} 
            onClose={() => setIsMoreDropdownOpen(false)} 
          />
        </div>

        {/* Search Bar Container */}
        <SearchBar />

        {/* Right Desktop Utility Icons */}
        <div className="hidden sm:flex items-center space-x-3 md:space-x-4 relative">
          
          {/* DESKTOP ADMIN CONSOLE BUTTON (Visible ONLY for Logged-In Admins) */}
          {isAdmin && (
            <Link
              to="/admin"
              className="flex items-center space-x-1.5 px-3.5 py-2 bg-[#FFF3EC] hover:bg-[#FA661C] text-[#FA661C] hover:text-[#FFFFFF] border border-[#FA661C] rounded-xl text-xs font-black shadow-xs btn-interactive cursor-pointer transition-colors duration-150 group"
              title="Open Admin Operations Console"
            >
              <ShieldAlert className="w-4 h-4 text-[#FA661C] group-hover:text-white shrink-0 transition-colors" />
              <span>Admin Console</span>
            </Link>
          )}

          {/* DESKTOP SELLER DASHBOARD BUTTON (Visible ONLY for Logged-In Sellers) */}
          {isSeller && (
            <Link
              to="/seller/dashboard"
              className="flex items-center space-x-1.5 px-3.5 py-2 bg-[#FFF3EC] hover:bg-[#FA661C] text-[#FA661C] hover:text-[#FFFFFF] border border-[#FA661C] rounded-xl text-xs font-black shadow-xs btn-interactive cursor-pointer transition-colors duration-150 group"
              title="Return to Seller Dashboard"
            >
              <Store className="w-4 h-4 text-[#FA661C] group-hover:text-white shrink-0 transition-colors" />
              <span>Seller Dashboard</span>
            </Link>
          )}
          
          {/* LOGIN BUTTON (Pre-Login) vs USER AVATAR CHIP (Post-Login) */}
          <div className="relative">
            {isLoggedIn ? (
              <>
                <button
                type="button"
                onClick={handleLoginButtonClick}
                className={`flex items-center space-x-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-150 border focus:outline-none btn-interactive cursor-pointer ${
                  isAccountDropdownOpen
                    ? 'bg-[#1A1A1A] text-[#FFFFFF] border-[#FA661C] shadow-sm'
                    : 'bg-white hover:bg-[#FFF8F2] text-[#FA661C] border-[#EAE3DC] hover:border-[#FF811A]'
                }`}
                aria-expanded={isAccountDropdownOpen}
                aria-label="User Account Menu"
              >
                <div className="w-6 h-6 rounded-full bg-[#FF811A] text-[#FA661C] font-black text-[10px] flex items-center justify-center shadow-xs avatar-interactive">
                  {currentUser?.name ? currentUser.name.slice(0, 2).toUpperCase() : 'AS'}
                </div>
                <span className="text-xs font-bold text-[#FA661C]">{currentUser?.name || 'Aarav Sharma'}</span>
                <ChevronDown className={`w-3.5 h-3.5 text-[#6B6058] transition-transform duration-150 ${
                  isAccountDropdownOpen ? 'rotate-180 text-[#FF811A]' : ''
                }`} />
              </button>

              {/* Desktop Account Menu Dropdown */}
              <AccountMenuDropdown 
                isOpen={isAccountDropdownOpen} 
                onClose={() => setIsAccountDropdownOpen(false)} 
                currentUser={currentUser}
                onLogout={onLogout}
              />
            </>
            ) : (
              <Link
                to="/login"
                className="group flex items-center space-x-1.5 px-4 py-2 bg-[#1A1A1A] hover:bg-[#FA661C] active:bg-[#E0530B] text-[#FFFFFF] rounded-xl text-xs font-bold btn-interactive shadow-xs hover:shadow-md border border-[#FA661C] focus:outline-none focus:ring-2 focus:ring-[#FF811A] cursor-pointer transition-colors duration-150"
                aria-label="Open Customer Login / Sign Up"
              >
                <User className="w-4 h-4 text-[#FF811A] group-hover:text-[#000000] transition-colors duration-150" />
                <span className="text-[#FFFFFF] group-hover:text-[#000000] transition-colors duration-150">Login</span>
              </Link>
            )}

          </div>

          {/* WISHLIST BUTTON */}
          <Link
            to="/wishlist"
            className="flex items-center space-x-1.5 px-3 py-2 bg-white hover:bg-[#FFF8F2] text-[#FA661C] border border-[#EAE3DC] hover:border-[#FF811A] rounded-xl text-xs font-bold btn-interactive cursor-pointer relative"
          >
            <Heart className="w-4 h-4 text-[#FF811A] icon-interactive" />
            <span>Wishlist</span>
            {wishlistCount > 0 && (
              <span className="bg-[#FF811A] text-[#FA661C] text-[10px] font-black px-1.5 py-0.2 rounded-full ml-1">
                {wishlistCount}
              </span>
            )}
          </Link>

          {/* MORE MENU TRIGGER */}
          <div className="relative">
            <button
              type="button"
              onClick={toggleMore}
              className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-bold btn-interactive border focus:outline-none cursor-pointer ${
                isMoreDropdownOpen
                  ? 'bg-[#1A1A1A] text-[#FFFFFF] border-[#FA661C] shadow-sm'
                  : 'bg-white hover:bg-[#FFF8F2] text-[#FA661C] border-[#EAE3DC] hover:border-[#FF811A]'
              }`}
              aria-expanded={isMoreDropdownOpen}
              aria-label="More options menu"
            >
              <MoreVertical className="w-4 h-4 text-[#6B6058] icon-interactive" />
              <span>More</span>
              <ChevronDown className={`w-3.5 h-3.5 text-[#6B6058] transition-transform duration-150 ${
                isMoreDropdownOpen ? 'rotate-180 text-[#FF811A]' : ''
              }`} />
            </button>

            {/* Desktop More Dropdown */}
            <MoreDropdown 
              isOpen={isMoreDropdownOpen} 
              onClose={() => setIsMoreDropdownOpen(false)} 
            />
          </div>

          {/* CART ICON WITH BRICK-RED BADGE */}
          <Link
            to="/cart"
            className="flex items-center space-x-2 px-3.5 py-2 bg-[#1A1A1A] hover:bg-[#FA661C] active:bg-[#E0530B] text-[#FFFFFF] rounded-xl text-xs font-bold btn-interactive shadow-sm group focus:outline-none focus:ring-2 focus:ring-[#FF811A] cursor-pointer transition-colors duration-150"
            aria-label={`Cart with ${cartCount} items`}
          >
            <div className="relative">
              <ShoppingBag className="w-4 h-4 text-[#FF811A] group-hover:text-[#000000] transition-colors duration-150" />
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-[#D7263D] text-white text-[9px] font-extrabold w-4 h-4 rounded-full flex items-center justify-center border-2 border-[#FA661C] animate-badge-pop">
                  {cartCount}
                </span>
              )}
            </div>
            <span className="text-[#FFFFFF] group-hover:text-[#000000] transition-colors duration-150">Bag</span>
          </Link>

        </div>



      </div>
    </header>
  );
}
