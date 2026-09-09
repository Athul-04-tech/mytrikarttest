import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import TopUtilityBar from './TopUtilityBar';
import SearchBar from './SearchBar';
import AccountMenuDropdown from '../dropdowns/AccountMenuDropdown';
import MoreDropdown from '../dropdowns/MoreDropdown';
import { User, ChevronDown, MoreVertical, ShoppingBag, Sparkles, LogIn, Heart } from 'lucide-react';
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
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
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
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-3 flex flex-col sm:flex-row items-center gap-3 sm:gap-6">
        
        {/* Mobile Top Row: Logo + Utility Icons (Shown only on small screens) */}
        <div className="w-full sm:w-auto flex items-center justify-between sm:hidden pb-1 border-b border-[#EAE3DC]/40">
          <Link to="/" className="flex items-center btn-interactive" aria-label="MytriKart Homepage">
            <img 
              src="/mytrikart-logo.png" 
              alt="MytriKart Logo" 
              className="h-8 w-auto object-contain max-w-[180px]"
            />
          </Link>

          <div className="flex items-center space-x-2">
            {/* Mobile Account / Login Button */}
            {isLoggedIn ? (
              <button
                type="button"
                onClick={() => setIsAccountDropdownOpen(prev => !prev)}
                className="p-1.5 rounded-xl text-xs font-bold flex items-center space-x-1.5 border border-[#FF811A] bg-[#1A1A1A] text-[#FFFFFF] shadow-xs btn-interactive"
              >
                <div className="w-6 h-6 rounded-full bg-[#FF811A] text-[#FA661C] font-black text-[10px] flex items-center justify-center avatar-interactive">
                  {currentUser?.name ? currentUser.name.slice(0, 2).toUpperCase() : 'AS'}
                </div>
                <span className="truncate max-w-[65px]">{currentUser?.name?.split(' ')[0] || 'User'}</span>
              </button>
            ) : (
              <Link
                to="/login"
                className="group px-3 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-1 border border-[#FA661C] bg-[#1A1A1A] hover:bg-[#FA661C] text-[#FFFFFF] shadow-xs btn-interactive cursor-pointer transition-colors duration-150"
              >
                <LogIn className="w-3.5 h-3.5 text-[#FF811A] group-hover:text-[#000000] transition-colors duration-150" />
                <span className="text-[#FFFFFF] group-hover:text-[#000000] transition-colors duration-150">Login</span>
              </Link>
            )}

            {/* Mobile Wishlist Icon */}
            <Link
              to="/wishlist"
              className="p-2 bg-white border border-[#EAE3DC] text-[#FA661C] rounded-xl shadow-xs btn-interactive relative cursor-pointer"
              aria-label="Wishlist"
            >
              <Heart className="w-4 h-4 text-[#FF811A]" />
              {wishlistCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-[#FF811A] text-[#FA661C] text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center border border-white">
                  {wishlistCount}
                </span>
              )}
            </Link>

            {/* Mobile Cart Icon */}
            <Link
              to="/cart"
              className="relative p-2 bg-[#1A1A1A] text-[#FFFFFF] rounded-xl shadow-xs btn-interactive cursor-pointer"
              aria-label="Shopping Cart"
            >
              <ShoppingBag className="w-4 h-4 text-[#FF811A] icon-interactive" />
              {cartCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-[#D7263D] text-white text-[10px] font-extrabold w-4 h-4 rounded-full flex items-center justify-center border border-white animate-badge-pop">
                  {cartCount}
                </span>
              )}
            </Link>
          </div>
        </div>

        {/* Search Bar Container */}
        <SearchBar />

        {/* Right Desktop Utility Icons */}
        <div className="hidden sm:flex items-center space-x-3 md:space-x-4 relative">
          
          {/* LOGIN BUTTON (Pre-Login) vs USER AVATAR CHIP (Post-Login) */}
          <div className="relative">
            {isLoggedIn ? (
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

            {/* Post-Login Dropdown Menu */}
            {isLoggedIn && (
              <AccountMenuDropdown 
                isOpen={isAccountDropdownOpen} 
                onClose={() => setIsAccountDropdownOpen(false)} 
                currentUser={currentUser}
                onLogout={onLogout}
              />
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

          {/* MORE MENU TRIGGER + DROPDOWN */}
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
