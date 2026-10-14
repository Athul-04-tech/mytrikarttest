import React, { useEffect, useRef } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link, useNavigate, useLocation, useParams } from 'react-router-dom';
import HomePage from './pages/HomePage';
import ProductListingPage from './pages/ProductListingPage';
import ProductDetailPage from './pages/ProductDetailPage';
import LoginPage from './pages/LoginPage';
import ProfilePage from './pages/ProfilePage';
import CustomerAddressFormPage from './pages/CustomerAddressFormPage';
import SellerRegisterPage from './pages/SellerRegisterPage';
import AdminHomePage from './pages/AdminHomePage';
import SellerDashboardPage from './pages/SellerDashboardPage';
import SellerAddProductPage from './pages/SellerAddProductPage';
import SellerProductDetailPage from './pages/SellerProductDetailPage';
import WishlistPage from './pages/WishlistPage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import ScrollToTop from './components/routing/ScrollToTop';
import PageTransitionWrapper from './components/routing/PageTransitionWrapper';
import ProtectedRoute from './components/routing/ProtectedRoute';
import ErrorBoundary from './components/common/ErrorBoundary';
import { ToastProvider, useToast } from './context/ToastContext';
import { CartWishlistProvider } from './context/CartWishlistContext';
import { SellerProductsProvider } from './context/SellerProductsContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { getHomeRouteForRole, getAllowedRolesForRoute } from './utils/authRouting';

function AccountSectionRedirect() {
  const { sectionId } = useParams();
  return <Navigate to={sectionId ? `/profile/${sectionId}` : '/profile'} replace />;
}

function MarketplaceRouter() {
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const { isLoggedIn, currentUser, isResolving, logout } = useAuth();
  const hasRehydratedRedirected = useRef(false);

  useEffect(() => {
    if (!isResolving && isLoggedIn && currentUser && !hasRehydratedRedirected.current) {
      hasRehydratedRedirected.current = true;
      if (location.pathname === '/') {
        const homeRoute = getHomeRouteForRole(currentUser.role);
        if (homeRoute !== '/') {
          navigate(homeRoute, { replace: true });
        }
      }
    }
  }, [isResolving, isLoggedIn, currentUser, location.pathname, navigate]);

  const handleLoginSuccess = (userData) => {
    toast.success("Welcome back!", `Signed in as ${userData?.name || userData?.username || 'Customer'}`);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
    toast.info("Logged Out", "Signed out successfully. Returned to marketplace home in guest mode.");
  };

  return (
    <>
      <ScrollToTop />

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
          path="/products" 
          element={
            <PageTransitionWrapper>
              <ProductListingPage 
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
              <ProductListingPage 
                isLoggedIn={isLoggedIn}
                currentUser={currentUser}
                onLogout={handleLogout}
              />
            </PageTransitionWrapper>
          } 
        />
        <Route 
          path="/product/:id" 
          element={
            <PageTransitionWrapper>
              <ProductDetailPage 
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
        <Route 
          path="/account/addresses/new" 
          element={
            <PageTransitionWrapper>
              <CustomerAddressFormPage />
            </PageTransitionWrapper>
          } 
        />
        <Route 
          path="/account/addresses/:id/edit" 
          element={
            <PageTransitionWrapper>
              <CustomerAddressFormPage />
            </PageTransitionWrapper>
          } 
        />
        <Route 
          path="/profile/addresses/new" 
          element={
            <PageTransitionWrapper>
              <CustomerAddressFormPage />
            </PageTransitionWrapper>
          } 
        />
        <Route 
          path="/profile/addresses/:id/edit" 
          element={
            <PageTransitionWrapper>
              <CustomerAddressFormPage />
            </PageTransitionWrapper>
          } 
        />
        <Route path="/account" element={<Navigate to="/profile" replace />} />
        <Route path="/account/:sectionId" element={<AccountSectionRedirect />} />
        <Route path="/orders" element={<Navigate to="/profile/orders" replace />} />
        <Route path="/wallet" element={<Navigate to="/profile/wallet" replace />} />
        <Route path="/rewards" element={<Navigate to="/profile/rewards" replace />} />
        <Route path="/notifications" element={<Navigate to="/profile/notifications" replace />} />
        <Route path="/support" element={<Navigate to="/profile/support" replace />} />
        <Route path="/refunds" element={<Navigate to="/profile/refunds" replace />} />
        <Route path="/warranty" element={<Navigate to="/profile/warranty" replace />} />
        <Route path="/addresses" element={<Navigate to="/profile/addresses" replace />} />
        <Route path="/coupons" element={<Navigate to="/profile/coupons" replace />} />
        <Route path="/vouchers" element={<Navigate to="/profile/coupons" replace />} />

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
            <ProtectedRoute allowedRoles={getAllowedRolesForRoute('/seller/dashboard')}>
              <PageTransitionWrapper>
                <SellerDashboardPage />
              </PageTransitionWrapper>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/seller/products" 
          element={
            <ProtectedRoute allowedRoles={getAllowedRolesForRoute('/seller/dashboard')}>
              <PageTransitionWrapper>
                <SellerDashboardPage />
              </PageTransitionWrapper>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/seller/products/new" 
          element={
            <ProtectedRoute allowedRoles={getAllowedRolesForRoute('/seller/dashboard')}>
              <PageTransitionWrapper>
                <SellerAddProductPage />
              </PageTransitionWrapper>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/seller/products/:id/edit" 
          element={
            <ProtectedRoute allowedRoles={getAllowedRolesForRoute('/seller/dashboard')}>
              <PageTransitionWrapper>
                <SellerAddProductPage />
              </PageTransitionWrapper>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/seller/products/:id" 
          element={
            <ProtectedRoute allowedRoles={getAllowedRolesForRoute('/seller/dashboard')}>
              <PageTransitionWrapper>
                <SellerProductDetailPage />
              </PageTransitionWrapper>
            </ProtectedRoute>
          } 
        />
        <Route path="/seller/add-product" element={<Navigate to="/seller/products/new" replace />} />
        <Route path="/seller/products/add" element={<Navigate to="/seller/products/new" replace />} />
        <Route 
          path="/seller/orders" 
          element={
            <ProtectedRoute allowedRoles={getAllowedRolesForRoute('/seller/dashboard')}>
              <PageTransitionWrapper>
                <SellerDashboardPage />
              </PageTransitionWrapper>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/seller/orders/:orderId" 
          element={
            <ProtectedRoute allowedRoles={getAllowedRolesForRoute('/seller/dashboard')}>
              <PageTransitionWrapper>
                <SellerDashboardPage />
              </PageTransitionWrapper>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/seller/settlements" 
          element={
            <ProtectedRoute allowedRoles={getAllowedRolesForRoute('/seller/dashboard')}>
              <PageTransitionWrapper>
                <SellerDashboardPage />
              </PageTransitionWrapper>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/seller/settings" 
          element={
            <ProtectedRoute allowedRoles={getAllowedRolesForRoute('/seller/dashboard')}>
              <PageTransitionWrapper>
                <SellerDashboardPage />
              </PageTransitionWrapper>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/seller/profile" 
          element={
            <ProtectedRoute allowedRoles={getAllowedRolesForRoute('/seller/dashboard')}>
              <PageTransitionWrapper>
                <SellerDashboardPage />
              </PageTransitionWrapper>
            </ProtectedRoute>
          } 
        />

        {/* 6. Admin Operations Command Center */}
        <Route 
          path="/admin" 
          element={
            <ProtectedRoute allowedRoles={getAllowedRolesForRoute('/admin')}>
              <PageTransitionWrapper>
                <AdminHomePage />
              </PageTransitionWrapper>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin/:moduleId" 
          element={
            <ProtectedRoute allowedRoles={getAllowedRolesForRoute('/admin')}>
              <PageTransitionWrapper>
                <AdminHomePage />
              </PageTransitionWrapper>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin/:moduleId/:recordId" 
          element={
            <ProtectedRoute allowedRoles={getAllowedRolesForRoute('/admin')}>
              <PageTransitionWrapper>
                <AdminHomePage />
              </PageTransitionWrapper>
            </ProtectedRoute>
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
        <AuthProvider>
          <CartWishlistProvider>
            <SellerProductsProvider>
              <ErrorBoundary>
                <MarketplaceRouter />
              </ErrorBoundary>
            </SellerProductsProvider>
          </CartWishlistProvider>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}
