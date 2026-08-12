import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import TopUtilityBar from './TopUtilityBar';
import SearchBar from './SearchBar';
import AccountMenuDropdown from '../dropdowns/AccountMenuDropdown';
import MoreDropdown from '../dropdowns/MoreDropdown';
import { User, ChevronDown, MoreVertical, ShoppingBag, Sparkles, LogIn, Heart } from 'lucide-react';
import { useCart } from '../../context/CartWishlistContext';

export default function Header({ 
  onOpenLocationModal, 
  deliveryLocation, 
  isLoggedIn = false,
  currentUser = { name: 'Aarav Sharma', email: 'aarav.sharma@example.com', isPlus: true },
  onLogout
}) {
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
      className={`sticky top-0 z-40 bg-[#FBF8F1] transition-shadow duration-300 border-b border-[#D8E0DC] ${
        isScrolled ? 'shadow-lg shadow-[#0F3D2E]/5 border-[#D4AF37]/30' : 'shadow-xs'
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
        <div className="w-full sm:w-auto flex items-center justify-between sm:hidden pb-1 border-b border-[#D8E0DC]/40">
          <Link to="/" className="font-['Outfit'] font-extrabold text-xl text-[#0F3D2E] btn-interactive">
            Mytri<span className="text-[#D4AF37]">Kart</span>
          </Link>

          <div className="flex items-center space-x-2">
            {/* Mobile Account / Login Button */}
            {isLoggedIn ? (
              <button
                type="button"
                onClick={() => setIsAccountDropdownOpen(prev => !prev)}
                className="p-1.5 rounded-xl text-xs font-bold flex items-center space-x-1.5 border border-[#D4AF37] bg-[#0F3D2E] text-[#FBF8F1] shadow-xs btn-interactive"
              >
                <div className="w-6 h-6 rounded-full bg-[#D4AF37] text-[#0F3D2E] font-black text-[10px] flex items-center justify-center avatar-interactive">
                  {currentUser?.name ? currentUser.name.slice(0, 2).toUpperCase() : 'AS'}
                </div>
                <span className="truncate max-w-[65px]">{currentUser?.name?.split(' ')[0] || 'User'}</span>
              </button>
            ) : (
              <Link
                to="/login"
                className="px-3 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-1 border border-[#0F3D2E] bg-[#0F3D2E] text-[#FBF8F1] shadow-xs btn-interactive cursor-pointer"
              >
                <LogIn className="w-3.5 h-3.5 text-[#D4AF37]" />
                <span>Login</span>
              </Link>
            )}

            {/* Mobile Wishlist Icon */}
            <Link
              to="/wishlist"
              className="p-2 bg-white border border-[#D8E0DC] text-[#0F3D2E] rounded-xl shadow-xs btn-interactive relative cursor-pointer"
              aria-label="Wishlist"
            >
              <Heart className="w-4 h-4 text-[#D4AF37]" />
              {wishlistCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-[#D4AF37] text-[#0F3D2E] text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center border border-white">
                  {wishlistCount}
                </span>
              )}
            </Link>

            {/* Mobile Cart Icon */}
            <Link
              to="/cart"
              className="relative p-2 bg-[#0F3D2E] text-[#FBF8F1] rounded-xl shadow-xs btn-interactive cursor-pointer"
              aria-label="Shopping Cart"
            >
              <ShoppingBag className="w-4 h-4 text-[#D4AF37] icon-interactive" />
              {cartCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-[#C0392B] text-white text-[10px] font-extrabold w-4 h-4 rounded-full flex items-center justify-center border border-white animate-badge-pop">
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
                    ? 'bg-[#0F3D2E] text-[#FBF8F1] border-[#0F3D2E] shadow-sm'
                    : 'bg-white hover:bg-[#FCF7E8] text-[#0F3D2E] border-[#D8E0DC] hover:border-[#D4AF37]'
                }`}
                aria-expanded={isAccountDropdownOpen}
                aria-label="User Account Menu"
              >
                <div className="w-6 h-6 rounded-full bg-[#D4AF37] text-[#0F3D2E] font-black text-[10px] flex items-center justify-center shadow-xs avatar-interactive">
                  {currentUser?.name ? currentUser.name.slice(0, 2).toUpperCase() : 'AS'}
                </div>
                <span className="text-xs font-bold text-[#0F3D2E]">{currentUser?.name || 'Aarav Sharma'}</span>
                <ChevronDown className={`w-3.5 h-3.5 text-[#5C6B63] transition-transform duration-150 ${
                  isAccountDropdownOpen ? 'rotate-180 text-[#D4AF37]' : ''
                }`} />
              </button>
            ) : (
              <Link
                to="/login"
                className="flex items-center space-x-1.5 px-4 py-2 bg-[#0F3D2E] hover:bg-[#155440] active:bg-[#0A2A1F] text-[#FBF8F1] rounded-xl text-xs font-bold btn-interactive shadow-xs hover:shadow-md border border-[#0F3D2E] focus:outline-none focus:ring-2 focus:ring-[#D4AF37] cursor-pointer"
                aria-label="Open Customer Login / Sign Up"
              >
                <User className="w-4 h-4 text-[#D4AF37] icon-interactive" />
                <span>Login</span>
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
            className="flex items-center space-x-1.5 px-3 py-2 bg-white hover:bg-[#FCF7E8] text-[#0F3D2E] border border-[#D8E0DC] hover:border-[#D4AF37] rounded-xl text-xs font-bold btn-interactive cursor-pointer relative"
          >
            <Heart className="w-4 h-4 text-[#D4AF37] icon-interactive" />
            <span>Wishlist</span>
            {wishlistCount > 0 && (
              <span className="bg-[#D4AF37] text-[#0F3D2E] text-[10px] font-black px-1.5 py-0.2 rounded-full ml-1">
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
                  ? 'bg-[#0F3D2E] text-[#FBF8F1] border-[#0F3D2E] shadow-sm'
                  : 'bg-white hover:bg-[#FCF7E8] text-[#0F3D2E] border-[#D8E0DC] hover:border-[#D4AF37]'
              }`}
              aria-expanded={isMoreDropdownOpen}
              aria-label="More options menu"
            >
              <MoreVertical className="w-4 h-4 text-[#5C6B63] icon-interactive" />
              <span>More</span>
              <ChevronDown className={`w-3.5 h-3.5 text-[#5C6B63] transition-transform duration-150 ${
                isMoreDropdownOpen ? 'rotate-180 text-[#D4AF37]' : ''
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
            className="flex items-center space-x-2 px-3.5 py-2 bg-[#0F3D2E] hover:bg-[#155440] text-[#FBF8F1] rounded-xl text-xs font-bold btn-interactive shadow-sm group focus:outline-none focus:ring-2 focus:ring-[#D4AF37] cursor-pointer"
            aria-label={`Cart with ${cartCount} items`}
          >
            <div className="relative">
              <ShoppingBag className="w-4 h-4 text-[#D4AF37] icon-interactive" />
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-[#C0392B] text-white text-[9px] font-extrabold w-4 h-4 rounded-full flex items-center justify-center border-2 border-[#0F3D2E] animate-badge-pop">
                  {cartCount}
                </span>
              )}
            </div>
            <span>Bag</span>
          </Link>

        </div>

      </div>
    </header>
  );
}
