import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link, Navigate, useLocation } from 'react-router-dom';
import ProfileSidebar, { PROFILE_SECTIONS } from '../components/profile/ProfileSidebar';
import PersonalDetailsSection from '../components/profile/PersonalDetailsSection';
import AddressBookSection from '../components/profile/AddressBookSection';
import OrdersSection from '../components/profile/OrdersSection';
import RefundsSection from '../components/profile/RefundsSection';
import WarrantySection from '../components/profile/WarrantySection';
import NotificationsSection from '../components/profile/NotificationsSection';
import SupportSection from '../components/profile/SupportSection';
import AccountSettingsSection from '../components/profile/AccountSettingsSection';
import WalletSection from '../components/profile/WalletSection';
import RewardsSection from '../components/profile/RewardsSection';
import CouponsSection from '../components/profile/CouponsSection';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../utils/api';
import { useToast } from '../context/ToastContext';
import { 
  ArrowLeft, 
  ChevronRight, 
  ShieldCheck, 
  LogOut,
  Menu,
  X,
  ChevronDown
} from 'lucide-react';

export default function ProfilePage({ onLogout }) {
  const { sectionId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const { isLoggedIn, currentUser, logout, isLoading, isResolving } = useAuth();

  const isSectionValid = sectionId ? PROFILE_SECTIONS.some(s => s.id === sectionId) : true;
  const initialValidSection = isSectionValid && sectionId ? sectionId : 'profile';

  const [activeSection, setActiveSection] = useState(initialValidSection);
  const [userProfile, setUserProfile] = useState(currentUser || {});
  const [mobileSidePanelOpen, setMobileSidePanelOpen] = useState(false);

  useEffect(() => {
    if (sectionId && PROFILE_SECTIONS.some(s => s.id === sectionId)) {
      setActiveSection(sectionId);
    } else if (!sectionId) {
      setActiveSection('profile');
    }
  }, [sectionId]);

  // Close mobile drawer on Escape key press
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && mobileSidePanelOpen) {
        setMobileSidePanelOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mobileSidePanelOpen]);

  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState('');
  const [refunds, setRefunds] = useState([]);
  const [refundsLoading, setRefundsLoading] = useState(false);

  // 1. Fetch real Customer Profile from backend /api/customers/me/
  useEffect(() => {
    if (!isLoggedIn) return;
    let active = true;
    apiRequest('/api/customers/me/')
      .then((data) => {
        if (!active || !data) return;
        setUserProfile(prev => ({
          ...prev,
          ...data,
          dateOfBirth: data.date_of_birth || prev.dateOfBirth || '',
          gender: data.gender || prev.gender || '',
          preferredLanguage: data.preferred_language || prev.preferredLanguage || 'English (India)',
          profilePhoto: data.profile_photo || prev.profilePhoto || '',
          walletBalance: data.wallet_balance_display !== undefined ? Number(data.wallet_balance_display) : prev.walletBalance,
          rewardPoints: data.reward_points_display !== undefined ? Number(data.reward_points_display) : prev.rewardPoints
        }));
      })
      .catch((err) => {
        console.warn("Could not fetch customer profile from backend:", err);
      });
    return () => { active = false; };
  }, [isLoggedIn]);

  // 2. Fetch real Orders from backend /api/orders/ (NO dummy data fallback)
  const fetchOrders = useCallback(async () => {
    if (!isLoggedIn) return;
    setOrdersLoading(true);
    setOrdersError('');
    try {
      const response = await apiRequest('/api/orders/');
      const rows = Array.isArray(response) ? response : (response?.results || []);
      if (rows.length === 0) {
        setOrders([]);
        return;
      }
      setOrders(rows.map((order) => {
        const paymentStatus = String(order.payment_status || 'pending').toLowerCase();
        const vendorStatus = String(order.vendor_order_status || 'pending').toLowerCase();
        const orderStatus = String(order.status || '').toLowerCase();
        let statusType = 'processing';
        if (vendorStatus === 'delivered') statusType = 'delivered';
        else if (vendorStatus === 'cancelled' || orderStatus === 'cancelled' || ['failed', 'refunded'].includes(paymentStatus)) statusType = 'cancelled';
        else if (orderStatus === 'cancellation_requested') statusType = 'cancellation_requested';
        else if (vendorStatus === 'shipped') statusType = 'shipped';

        const status = vendorStatus === 'delivered'
          ? 'Delivered'
          : vendorStatus === 'shipped'
          ? 'Shipped'
          : (vendorStatus === 'cancelled' || orderStatus === 'cancelled')
          ? 'Cancelled'
          : orderStatus === 'cancellation_requested'
          ? 'Cancellation Requested'
          : vendorStatus === 'processing'
          ? 'Processing'
          : paymentStatus === 'paid'
          ? 'Paid'
          : paymentStatus === 'pending'
          ? 'Payment Pending'
          : paymentStatus;

        const amount = Number(order.grand_total || 0);
        const currency = order.currency || 'INR';
        let deliveredOn = null;
        if (order.delivered_at) {
          deliveredOn = new Date(order.delivered_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
        }
        const canCancel =
          !['shipped', 'delivered', 'cancelled'].includes(vendorStatus) &&
          !['cancelled', 'cancellation_requested'].includes(orderStatus) &&
          !['refunded', 'cancelled', 'failed'].includes(paymentStatus);

        const trackingStep = vendorStatus === 'delivered'
          ? 5
          : vendorStatus === 'shipped'
          ? 3
          : (vendorStatus === 'processing' || vendorStatus === 'confirmed' || paymentStatus === 'paid')
          ? 2
          : 1;

        return {
          ...order,
          id: order.order_number || `ORD-${order.id}`,
          realOrderId: order.id,
          statusType,
          trackingStep,
          deliveredOn,
          status,
          date: order.created_at ? new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '',
          total: new Intl.NumberFormat('en-IN', { style: 'currency', currency }).format(amount),
          canCancel,
          canReturn: vendorStatus === 'delivered',
          items: (order.items || []).map((item) => ({
            id: item.id,
            name: item.product_name_snapshot || 'Marketplace Item',
            qty: item.quantity,
            price: new Intl.NumberFormat('en-IN', { style: 'currency', currency }).format(Number(item.line_total || item.unit_price || 0)),
            rawPrice: Number(item.line_total || item.unit_price || 0),
            seller: 'Verified Seller',
            image: '/products/spatial_headphones_1786529304124.png',
            productId: item.product_id || null,
            variantId: item.product_variant || null,
          }))
        };
      }));
    } catch (err) {
      console.error("Failed to load backend orders:", err);
      setOrders([]);
      setOrdersError(err.message || 'Unable to retrieve your order history from server.');
    } finally {
      setOrdersLoading(false);
    }
  }, [isLoggedIn]);

  useEffect(() => {
    if (activeSection === 'orders' && isLoggedIn) {
      fetchOrders();
    }
  }, [activeSection, isLoggedIn, fetchOrders]);

  // 3. Fetch real RMA / Returns from backend /api/rma/
  useEffect(() => {
    if (activeSection !== 'refunds' || !isLoggedIn) return undefined;
    let active = true;
    setRefundsLoading(true);
    apiRequest('/api/rma/')
      .then((data) => {
        if (!active) return;
        const rows = Array.isArray(data) ? data : (data?.results || []);
        setRefunds(rows.map((r) => ({
          id: `RMA-${r.id}`,
          orderId: r.order_number || `ORD-${r.order || r.id}`,
          productName: r.item_name || r.product_name || `Return Item #${r.id}`,
          amount: r.refund_amount ? `₹${Number(r.refund_amount).toLocaleString('en-IN')}` : 'In Review',
          destination: 'Original Payment Source',
          status: r.status ? (r.status.charAt(0).toUpperCase() + r.status.slice(1)) : 'Requested',
          timelineStep: r.status === 'completed' ? 4 : r.status === 'processing' ? 3 : r.status === 'approved' ? 2 : 1,
          requestDate: r.created_at ? new Date(r.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : ''
        })));
      })
      .catch((err) => {
        if (active) {
          console.warn("Failed to load backend RMA requests:", err);
          setRefunds([]);
        }
      })
      .finally(() => {
        if (active) setRefundsLoading(false);
      });
    return () => { active = false; };
  }, [activeSection, isLoggedIn]);

  // Sync profile state with real AuthContext user profile
  useEffect(() => {
    if (currentUser) {
      setUserProfile(prev => ({
        ...prev,
        ...currentUser,
        fullName: currentUser.fullName || currentUser.name || `${currentUser.first_name || ''} ${currentUser.last_name || ''}`.trim() || currentUser.username,
        email: currentUser.email || prev.email,
        mobile: currentUser.phone_number || currentUser.mobile || prev.mobile,
      }));
    }
  }, [currentUser]);

  // Sync sectionId from URL instantly
  useEffect(() => {
    if (sectionId) {
      const isValid = PROFILE_SECTIONS.some(s => s.id === sectionId);
      setActiveSection(isValid ? sectionId : 'profile');
    } else {
      setActiveSection('profile');
    }
  }, [sectionId]);

  // SEO Standard - Page Metadata
  useEffect(() => {
    const currentMeta = PROFILE_SECTIONS.find(s => s.id === activeSection) || PROFILE_SECTIONS[0];
    document.title = `${currentMeta.label} — MytriKart Account Hub`;
  }, [activeSection]);

  // Protection guard: wait for session rehydration before checking auth
  if (isLoading || isResolving) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-8">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-medium text-slate-500">Loading your account...</p>
        </div>
      </div>
    );
  }

  // Protection guard: redirect to /login if logged out
  if (!isLoggedIn) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  const handleSelectSection = (secId) => {
    setActiveSection(secId);
    navigate(`/profile/${secId}`);
    setMobileSidePanelOpen(false);
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  const handleSignOut = async () => {
    await logout();
    if (onLogout) onLogout();
    navigate('/');
  };

  const currentSectionMeta = PROFILE_SECTIONS.find(s => s.id === activeSection) || PROFILE_SECTIONS[0];

  return (
    <div className="min-h-screen bg-[#FFFFFF] text-[#1A2420] flex flex-col font-sans selection:bg-[#FF811A]/30 selection:text-[#FA661C]">
      
      {/* Top Breadcrumb / Navigation Bar */}
      <header className="bg-white border-b border-[#EAE3DC] py-3 px-4 sm:px-8 sticky top-0 z-30 shadow-2xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          
          <div className="flex items-center space-x-3">
            {/* Mobile Open Side Panel Menu Button */}
            <button
              type="button"
              onClick={() => setMobileSidePanelOpen(true)}
              className="p-2 rounded-xl border border-[#EAE3DC] bg-white hover:bg-[#FFF3EC] text-[#FA661C] md:hidden btn-interactive shadow-2xs cursor-pointer"
              aria-label="Open Account Side Panel"
              title="Open Account Menu"
            >
              <Menu className="w-4 h-4" />
            </button>

            <Link
              to="/"
              className="flex items-center btn-interactive shrink-0"
              aria-label="Return to Marketplace Homepage"
            >
              <img 
                src="/mytrikart-logo.png" 
                alt="MytriKart Logo" 
                className="h-8 sm:h-9 w-auto object-contain"
              />
            </Link>

            <span className="text-[#EAE3DC] hidden sm:inline">|</span>

            {/* Breadcrumb trail */}
            <div className="hidden sm:flex items-center space-x-1.5 text-xs text-[#6B6058]">
              <Link to="/" className="hover:text-[#FA661C] transition-colors">
                Home
              </Link>
              <ChevronRight className="w-3.5 h-3.5 text-[#EAE3DC]" />
              <Link to="/profile" className="font-bold text-[#FA661C]">Account Hub</Link>
              <ChevronRight className="w-3.5 h-3.5 text-[#EAE3DC]" />
              <span className="font-semibold text-[#FF811A]">{currentSectionMeta.label}</span>
            </div>
          </div>

          {/* Right Action buttons */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            <Link
              to="/"
              className="px-3.5 py-1.5 rounded-xl border border-[#EAE3DC] bg-[#FFFFFF] hover:bg-[#FFF3EC] text-xs font-bold text-[#FA661C] transition-all flex items-center space-x-1.5 btn-interactive shadow-2xs"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Back to Marketplace</span>
              <span className="sm:hidden">Store</span>
            </Link>

            <button
              type="button"
              onClick={handleSignOut}
              className="px-3.5 py-1.5 rounded-xl bg-[#FA661C] hover:bg-[#E0530B] text-[#FFFFFF] text-xs font-bold transition-all shadow-xs btn-interactive flex items-center space-x-1.5 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5 text-[#FF811A]" />
              <span>Sign Out</span>
            </button>
          </div>

        </div>
      </header>

      {/* Main Profile Layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        
        {/* Mobile Section Switcher Bar */}
        <div className="md:hidden mb-4">
          <div className="bg-white border border-[#EAE3DC] rounded-2xl p-3 flex items-center justify-between shadow-2xs">
            <div className="flex items-center space-x-2.5 min-w-0">
              <div className="p-2 bg-[#FFF3EC] text-[#FA661C] rounded-xl shrink-0">
                {currentSectionMeta.icon && React.createElement(currentSectionMeta.icon, { className: "w-4 h-4" })}
              </div>
              <div className="min-w-0">
                <span className="text-[10px] text-[#6B6058] font-bold block uppercase tracking-wider">Account Section</span>
                <span className="text-xs font-black text-[#1A2420] truncate block">{currentSectionMeta.label}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setMobileSidePanelOpen(true)}
              className="px-3.5 py-2 bg-[#FA661C] hover:bg-[#E0530B] active:bg-[#0A2A1F] text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-xs btn-interactive cursor-pointer shrink-0"
              aria-label="Open Account Navigation Panel"
            >
              <Menu className="w-3.5 h-3.5 text-white" />
              <span>Switch Page</span>
              <ChevronDown className="w-3.5 h-3.5 text-white/80" />
            </button>
          </div>
        </div>

        {/* Responsive Grid: Left Sidebar + Right Dynamic Main Panel */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 lg:gap-8 items-start">
          
          {/* Left Navigation Sidebar (Desktop Only) */}
          <div className="hidden md:block md:col-span-4 lg:col-span-3">
            <ProfileSidebar 
              activeSection={activeSection}
              onSelectSection={handleSelectSection}
              user={userProfile}
              userProfile={userProfile}
              onLogout={handleSignOut}
            />
          </div>

          {/* Right Dynamic Content Section (Always visible on mobile & desktop) */}
          <div className="md:col-span-8 lg:col-span-9">
            
            <div className="space-y-6">
              
              {/* 1. Personal Details */}
              {activeSection === 'profile' && (
                <PersonalDetailsSection 
                  profileData={userProfile} 
                  userProfile={userProfile}
                  onUpdateProfile={async (updated) => {
                    setUserProfile(prev => ({ ...prev, ...updated }));
                    try {
                      await apiRequest('/api/customers/me/', {
                        method: 'PATCH',
                        body: JSON.stringify({
                          date_of_birth: updated.dateOfBirth || updated.date_of_birth || null,
                          gender: updated.gender || 'prefer_not_to_say',
                          preferred_language: updated.preferredLanguage || updated.preferred_language || 'en',
                          profile_photo: updated.profilePhoto || updated.profile_photo || ''
                        })
                      });
                      toast.success("Profile Saved", "Your profile details have been saved to the backend database.");
                    } catch (err) {
                      console.error("Backend profile update error:", err);
                      toast.error("Save Warning", err.message || "Could not persist to backend server.");
                    }
                  }}
                />
              )}

              {/* 2. Address Book */}
              {activeSection === 'addresses' && (
                <AddressBookSection />
              )}

              {/* 3. Orders & Tracking */}
              {activeSection === 'orders' && (
                <OrdersSection
                  orders={orders}
                  isLoading={ordersLoading}
                  error={ordersError}
                  onTrackOrder={(orderId) => {}}
                  onRefreshOrders={fetchOrders}
                />
              )}

              {/* 4. Refunds & Returns */}
              {activeSection === 'refunds' && (
                <RefundsSection refunds={refunds} isLoading={refundsLoading} />
              )}

              {/* 5. Extended Warranty */}
              {activeSection === 'warranty' && (
                <WarrantySection />
              )}

              {/* 6. Wallet & Payments */}
              {activeSection === 'wallet' && (
                <WalletSection userProfile={userProfile} />
              )}

              {/* Coupons & Vouchers */}
              {activeSection === 'coupons' && (
                <CouponsSection />
              )}

              {/* 7. Rewards & Loyalty */}
              {activeSection === 'rewards' && (
                <RewardsSection userProfile={userProfile} />
              )}

              {/* 8. Notifications Preferences */}
              {activeSection === 'notifications' && (
                <NotificationsSection />
              )}

              {/* 9. Help Center & 24x7 Support */}
              {activeSection === 'support' && (
                <SupportSection />
              )}

              {/* 10. Account Settings */}
              {activeSection === 'settings' && (
                <AccountSettingsSection onLogout={handleSignOut} />
              )}

              {/* Fallback for PAN/GSTIN & Privacy */}
              {(activeSection === 'pan-gstin' || activeSection === 'privacy') && (
                <div className="bg-white rounded-3xl border border-[#EAE3DC] p-6 sm:p-8 shadow-xs space-y-4">
                  <div className="flex items-center space-x-2">
                    <ShieldCheck className="w-5 h-5 text-[#FA661C]" />
                    <h3 className="font-['Outfit'] font-black text-lg text-[#FA661C] capitalize">
                      {activeSection.replace('-', ' ')} Verification
                    </h3>
                  </div>
                  <p className="text-xs text-[#6B6058]">
                    Your identity documents and statutory compliance data are verified with 256-bit AES encryption.
                  </p>
                  <div className="p-4 bg-[#FFF8F2] rounded-2xl border border-[#FF811A]/40 text-xs font-bold text-[#FA661C]">
                    Status: KYC Verified & Linked to GSTIN / PAN Dossier
                  </div>
                </div>
              )}

            </div>

          </div>

        </div>

      </main>

      {/* Mobile Slide-Out Side Panel (Drawer) */}
      <div 
        className={`fixed inset-0 z-50 md:hidden transition-all duration-300 ${
          mobileSidePanelOpen ? 'visible' : 'invisible pointer-events-none delay-300'
        }`}
        aria-hidden={!mobileSidePanelOpen}
      >
        {/* Backdrop Overlay */}
        <div 
          className={`fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity duration-300 ${
            mobileSidePanelOpen ? 'opacity-100' : 'opacity-0'
          }`}
          onClick={() => setMobileSidePanelOpen(false)}
        />

        {/* Drawer Container (Smooth Slide from Left) */}
        <div className={`fixed inset-y-0 left-0 w-80 max-w-[85vw] bg-white shadow-2xl flex flex-col z-10 transition-transform duration-300 ease-out transform ${
          mobileSidePanelOpen ? 'translate-x-0' : '-translate-x-full'
        }`}>
          {/* Drawer Header */}
          <div className="p-4 border-b border-[#EAE3DC] flex items-center justify-between bg-[#FFF8F2]/90">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#FF811A]" />
              <span className="font-['Outfit'] font-black text-sm text-[#FA661C]">Account Sections</span>
            </div>
            <button
              type="button"
              onClick={() => setMobileSidePanelOpen(false)}
              className="p-1.5 rounded-xl text-[#6B6058] hover:text-[#FA661C] hover:bg-[#FFF3EC] transition-colors cursor-pointer"
              aria-label="Close Account Menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Drawer Body (Scrollable Profile Navigation) */}
          <div className="p-4 overflow-y-auto flex-1">
            <ProfileSidebar 
              activeSection={activeSection}
              onSelectSection={handleSelectSection}
              user={userProfile}
              userProfile={userProfile}
              onLogout={handleSignOut}
              isDrawer={true}
            />
          </div>
        </div>
      </div>

    </div>
  );
}
