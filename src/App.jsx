import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import ProfilePage from './pages/ProfilePage';
import SellerRegisterPage from './pages/SellerRegisterPage';
import AdminHomePage from './pages/AdminHomePage';
import SellerDashboardPage from './pages/SellerDashboardPage';
import SellerAddProductPage from './pages/SellerAddProductPage';
import WishlistPage from './pages/WishlistPage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import ScrollToTop from './components/routing/ScrollToTop';
import PageTransitionWrapper from './components/routing/PageTransitionWrapper';
import { ToastProvider, useToast } from './context/ToastContext';
import { CartWishlistProvider } from './context/CartWishlistContext';
import { Sparkles, LogOut, LogIn, Store, LayoutDashboard } from 'lucide-react';

function ReviewerTopBar({ isLoggedIn, setIsLoggedIn, currentUser }) {
  const toast = useToast();

  return (
    <aside 
      aria-label="Design Review Controls"
      className="bg-[#0A2A1F] text-[#FBF8F1] px-4 py-1.5 text-xs border-b border-[#D4AF37]/40 flex items-center justify-between z-50 sticky top-0"
    >
      <div className="flex items-center space-x-2">
        <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
        <span className="font-bold hidden sm:inline text-[#D4AF37]">UX Prototype:</span>
        <span className="font-semibold text-[11px] sm:text-xs">
          {isLoggedIn ? (
            <span className="text-[#A2E3C4] flex items-center space-x-1">
              <span>● Customer:</span>
              <strong className="text-white">{currentUser.name}</strong>
              <span className="text-[10px] bg-[#D4AF37] text-[#0F3D2E] font-bold px-1 rounded uppercase">PLUS</span>
            </span>
          ) : (
            <span className="text-[#F4EFE6]">○ Pre-Login Guest Mode</span>
          )}
        </span>
      </div>

      <div className="flex items-center space-x-1.5 sm:space-x-2">
        {/* Quick Jump to Seller Dashboard */}
        <Link
          to="/seller/dashboard"
          className="px-2.5 py-0.5 rounded-lg text-[11px] font-bold bg-[#D4AF37] hover:bg-[#E3BE46] text-[#0F3D2E] transition-all flex items-center space-x-1 shadow-2xs btn-interactive cursor-pointer"
        >
          <Store className="w-3 h-3 text-[#0F3D2E]" />
          <span>Seller Hub</span>
        </Link>

        {/* Quick Jump to Admin Dashboard */}
        <Link
          to="/admin"
          className="px-2.5 py-0.5 rounded-lg text-[11px] font-bold bg-[#155440] hover:bg-[#1A624B] text-[#FBF8F1] border border-[#D4AF37]/30 transition-all flex items-center space-x-1 shadow-2xs btn-interactive cursor-pointer"
        >
          <LayoutDashboard className="w-3 h-3 text-[#D4AF37]" />
          <span className="hidden sm:inline">Admin Ops</span>
        </Link>

        <button
          type="button"
          onClick={() => {
            const nextState = !isLoggedIn;
            setIsLoggedIn(nextState);
            if (nextState) {
              toast.success("Simulated Login", "Signed in as Aarav Sharma (Gold Plus).");
            } else {
              toast.info("Simulated Guest", "Browsing as guest visitor.");
            }
          }}
          className="px-2 py-0.5 rounded-lg text-[11px] font-bold bg-[#155440] hover:bg-[#1A624B] text-[#FBF8F1] border border-[#D4AF37]/30 transition-all flex items-center space-x-1 shadow-2xs btn-interactive cursor-pointer"
        >
          {isLoggedIn ? (
            <>
              <LogOut className="w-3 h-3" />
              <span className="hidden sm:inline">Guest</span>
            </>
          ) : (
            <>
              <LogIn className="w-3 h-3" />
              <span className="hidden sm:inline">User</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}

function MarketplaceRouter() {
  const toast = useToast();

  // Simulated Global Authentication State
  const [isLoggedIn, setIsLoggedIn] = useState(true);
  const [currentUser, setCurrentUser] = useState({
    name: 'Aarav Sharma',
    email: 'aarav.sharma@example.com',
    isPlus: true
  });

  const handleLoginSuccess = (userData) => {
    setIsLoggedIn(true);
    if (userData) {
      setCurrentUser(prev => ({ ...prev, ...userData }));
    }
    toast.success("Welcome back!", `Signed in as ${userData?.name || currentUser.name}`);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    toast.info("Logged Out", "You have securely signed out of your account.");
  };

  return (
    <>
      <ScrollToTop />
      
      {/* Reviewer Top Bar */}
      <ReviewerTopBar 
        isLoggedIn={isLoggedIn}
        setIsLoggedIn={setIsLoggedIn}
        currentUser={currentUser}
      />

      <Routes>
        {/* 1. Customer Homepage & Category Deep-links */}
        <Route 
          path="/" 
          element={
            <PageTransitionWrapper>
              <HomePage 
                isLoggedIn={isLoggedIn}
                currentUser={currentUser}
                onLogout={handleLogout}
              />
            </PageTransitionWrapper>
          } 
        />
        <Route 
          path="/category/:categorySlug" 
          element={
            <PageTransitionWrapper>
              <HomePage 
                isLoggedIn={isLoggedIn}
                currentUser={currentUser}
                onLogout={handleLogout}
              />
            </PageTransitionWrapper>
          } 
        />

        {/* 2. Customer Authentication Flows */}
        <Route 
          path="/login" 
          element={
            <PageTransitionWrapper>
              <LoginPage onLoginSuccess={handleLoginSuccess} />
            </PageTransitionWrapper>
          } 
        />
        <Route 
          path="/register" 
          element={
            <PageTransitionWrapper>
              <LoginPage onLoginSuccess={handleLoginSuccess} />
            </PageTransitionWrapper>
          } 
        />

        {/* 3. Customer Account Hub & Deep-linked Sections */}
        <Route 
          path="/profile" 
          element={
            <PageTransitionWrapper>
              <ProfilePage onLogout={handleLogout} />
            </PageTransitionWrapper>
          } 
        />
        <Route 
          path="/profile/:sectionId" 
          element={
            <PageTransitionWrapper>
              <ProfilePage onLogout={handleLogout} />
            </PageTransitionWrapper>
          } 
        />
        <Route path="/account" element={<Navigate to="/profile" replace />} />
        <Route path="/account/:sectionId" element={<Navigate to="/profile" replace />} />
        <Route path="/orders" element={<Navigate to="/profile/orders" replace />} />
        <Route path="/wallet" element={<Navigate to="/profile/wallet" replace />} />
        <Route path="/rewards" element={<Navigate to="/profile/rewards" replace />} />

        {/* 4. Commerce Flows */}
        <Route 
          path="/wishlist" 
          element={
            <PageTransitionWrapper>
              <WishlistPage />
            </PageTransitionWrapper>
          } 
        />
        <Route 
          path="/cart" 
          element={
            <PageTransitionWrapper>
              <CartPage />
            </PageTransitionWrapper>
          } 
        />
        <Route path="/bag" element={<Navigate to="/cart" replace />} />
        <Route 
          path="/checkout" 
          element={
            <PageTransitionWrapper>
              <CheckoutPage />
            </PageTransitionWrapper>
          } 
        />

        {/* 5. Seller Hub & Deep-linked Operations */}
        <Route 
          path="/seller/register" 
          element={
            <PageTransitionWrapper>
              <SellerRegisterPage />
            </PageTransitionWrapper>
          } 
        />
        <Route path="/seller-register" element={<Navigate to="/seller/register" replace />} />
        <Route path="/become-a-seller" element={<Navigate to="/seller/register" replace />} />
        <Route path="/seller/login" element={<Navigate to="/seller/dashboard" replace />} />
        <Route path="/seller" element={<Navigate to="/seller/dashboard" replace />} />
        <Route path="/seller-dashboard" element={<Navigate to="/seller/dashboard" replace />} />
        <Route 
          path="/seller/dashboard" 
          element={
            <PageTransitionWrapper>
              <SellerDashboardPage />
            </PageTransitionWrapper>
          } 
        />
        <Route 
          path="/seller/products" 
          element={
            <PageTransitionWrapper>
              <SellerDashboardPage />
            </PageTransitionWrapper>
          } 
        />
        <Route 
          path="/seller/products/new" 
          element={
            <PageTransitionWrapper>
              <SellerAddProductPage />
            </PageTransitionWrapper>
          } 
        />
        <Route path="/seller/add-product" element={<Navigate to="/seller/products/new" replace />} />
        <Route path="/seller/products/add" element={<Navigate to="/seller/products/new" replace />} />
        <Route 
          path="/seller/orders" 
          element={
            <PageTransitionWrapper>
              <SellerDashboardPage />
            </PageTransitionWrapper>
          } 
        />
        <Route 
          path="/seller/settlements" 
          element={
            <PageTransitionWrapper>
              <SellerDashboardPage />
            </PageTransitionWrapper>
          } 
        />
        <Route 
          path="/seller/settings" 
          element={
            <PageTransitionWrapper>
              <SellerDashboardPage />
            </PageTransitionWrapper>
          } 
        />
        <Route 
          path="/seller/profile" 
          element={
            <PageTransitionWrapper>
              <SellerDashboardPage />
            </PageTransitionWrapper>
          } 
        />

        {/* 6. Admin Operations Command Center */}
        <Route 
          path="/admin" 
          element={
            <PageTransitionWrapper>
              <AdminHomePage />
            </PageTransitionWrapper>
          } 
        />
        <Route 
          path="/admin/:moduleId" 
          element={
            <PageTransitionWrapper>
              <AdminHomePage />
            </PageTransitionWrapper>
          } 
        />
        <Route path="/admin/dashboard" element={<Navigate to="/admin" replace />} />
        <Route path="/admin/settlement-calculator" element={<Navigate to="/admin/settlement-calc" replace />} />

        {/* Fallback to Home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <CartWishlistProvider>
          <MarketplaceRouter />
        </CartWishlistProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}
