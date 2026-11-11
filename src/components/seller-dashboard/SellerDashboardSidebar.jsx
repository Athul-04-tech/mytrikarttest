import React from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingBag, 
  Landmark, 
  Settings, 
  User, 
  LogOut, 
  ExternalLink,
  Megaphone,
  X 
} from 'lucide-react';
import AuthContext from '../../context/AuthContext';
import VendorProfileContext from '../../context/VendorProfileContext';
import { useToast } from '../../context/ToastContext';
import { resolveMediaUrl } from '../../config/env';

const SELLER_NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', route: '/seller/dashboard', icon: LayoutDashboard },
  { id: 'announcements', label: 'Announcements', route: '/seller/announcements', icon: Megaphone },
  { id: 'products', label: 'Products & Inventory', route: '/seller/products', icon: Package },
  { id: 'orders', label: 'Orders & Fulfillment', route: '/seller/orders', icon: ShoppingBag, isHighlight: true },
  { id: 'settlements', label: 'Settlements & Payouts', route: '/seller/settlements', icon: Landmark },
  { id: 'settings', label: 'Store Settings', route: '/seller/settings', icon: Settings },
  { id: 'profile', label: 'Merchant Profile', route: '/seller/profile', icon: User }
];

export default function SellerDashboardSidebar({
  isMobileOpen,
  onCloseMobile,
  productStatusCounts,
  orderStatusCounts,
  unreadAnnouncementsCount,
  vendorProfile: propProfile
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const auth = React.useContext(AuthContext);
  const profileContext = React.useContext(VendorProfileContext);
  const logout = auth?.logout;

  // Single shared source of truth from GET /api/vendors/me/
  const profile = propProfile || profileContext?.vendorProfile;
  const isLoading = !propProfile && (profileContext?.isLoading ?? false);
  const error = !propProfile && profileContext?.error;

  const rawStoreName = profile?.store_name?.trim();
  const displayStoreName = rawStoreName || (isLoading ? '' : 'Not set');
  const storeLogo = profile?.store_logo || null;

  const storeInitials = (() => {
    if (!rawStoreName) return 'NS';
    const parts = rawStoreName.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return rawStoreName.slice(0, 2).toUpperCase();
  })();

  // Compute live badge counts from real API data
  const totalProducts = productStatusCounts && typeof productStatusCounts === 'object'
    ? Object.values(productStatusCounts).reduce((acc, curr) => acc + (Number(curr) || 0), 0)
    : 0;

  const newOrdersCount = orderStatusCounts && typeof orderStatusCounts === 'object'
    ? Number(orderStatusCounts.new || orderStatusCounts.NEW || 0)
    : 0;

  const getBadgeForItem = (itemId) => {
    if (itemId === 'announcements') {
      if (typeof unreadAnnouncementsCount === 'number') {
        return String(unreadAnnouncementsCount);
      }
      return null;
    }
    if (itemId === 'products') {
      return totalProducts > 0 ? String(totalProducts) : null;
    }
    if (itemId === 'orders') {
      return newOrdersCount > 0 ? `${newOrdersCount} New` : null;
    }
    return null;
  };

  const handleSellerSignOut = async () => {
    if (logout) {
      try {
        await logout();
      } catch (err) {
        console.warn("Logout request completed with warning:", err);
      }
    }
    navigate('/');
    toast.info("Seller Sign Out", "You have signed out of Seller Hub.");
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-[#1A1A1A]/70 backdrop-blur-xs z-40 lg:hidden"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      {/* Persistent Left Sidebar Shell */}
      <aside 
        aria-label="Seller Hub Navigation"
        className={`fixed lg:sticky top-0 left-0 h-screen w-64 shrink-0 bg-[#1A1A1A] text-[#FFFFFF] border-r border-[#FF811A]/30 flex flex-col justify-between z-50 transition-transform duration-300 ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex flex-col h-full overflow-hidden">
          
          {/* Top Brand Header */}
          <div className="p-4 sm:p-5 border-b border-[#FFFFFF]/15 flex items-center justify-between">
            {isLoading ? (
              /* Loading Skeleton */
              <div className="flex items-center space-x-2.5 animate-pulse min-w-0 flex-1">
                <div className="w-9 h-9 rounded-xl bg-white/20 shrink-0" />
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="h-3.5 bg-white/20 rounded w-24" />
                  <div className="h-2 bg-[#FF811A]/40 rounded w-16" />
                </div>
              </div>
            ) : error ? (
              /* Honest Error Message */
              <div className="flex items-center space-x-2 text-xs text-[#D7263D] truncate" title={error}>
                <div className="w-9 h-9 rounded-xl bg-[#D7263D]/20 text-[#D7263D] font-black text-sm flex items-center justify-center shrink-0">
                  !
                </div>
                <div className="truncate">
                  <span className="font-bold block text-[11px] text-white">Profile Error</span>
                  <span className="text-[9px] text-[#FF811A] truncate block">{error}</span>
                </div>
              </div>
            ) : (
              <Link to="/seller/dashboard" className="flex items-center space-x-2.5 truncate">
                {storeLogo ? (
                  <img
                    src={resolveMediaUrl(storeLogo)}
                    alt={displayStoreName}
                    className="w-9 h-9 rounded-xl object-cover border border-[#FFFFFF] shrink-0"
                  />
                ) : (
                  <div className="w-9 h-9 rounded-xl bg-[#FF811A] text-[#FA661C] font-['Outfit'] font-black text-sm flex items-center justify-center shadow-md border border-[#FFFFFF] shrink-0 avatar-interactive">
                    {storeInitials}
                  </div>
                )}
                <div className="truncate">
                  <div className="flex items-center space-x-1.5">
                    <span className="font-['Outfit'] font-extrabold text-sm text-[#FFFFFF] truncate">
                      {displayStoreName}
                    </span>
                  </div>
                  <span className="text-[9px] font-bold text-[#FF811A] tracking-wider uppercase block">
                    SELLER HUB
                  </span>
                </div>
              </Link>
            )}

            {/* Mobile Close Button */}
            <button
              type="button"
              onClick={onCloseMobile}
              className="lg:hidden p-1 text-[#FFFFFF]/80 hover:text-[#000000]"
              aria-label="Close navigation"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Items */}
          <nav className="flex-1 overflow-y-auto p-3 space-y-1 text-xs">
            {SELLER_NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isCurrent = location.pathname === item.route || (item.id === 'dashboard' && location.pathname === '/seller');

              const badgeText = getBadgeForItem(item.id);

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    navigate(item.route);
                    if (onCloseMobile) onCloseMobile();
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-bold transition-all cursor-pointer btn-interactive ${
                    isCurrent
                      ? 'bg-[#FF811A] text-[#1A1A1A] shadow-sm'
                      : 'text-[#FFFFFF]/80 hover:bg-[#E0530B] hover:text-[#FFFFFF]'
                  }`}
                >
                  <div className="flex items-center space-x-2.5 truncate">
                    <Icon className="w-4 h-4 icon-interactive shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </div>

                  {badgeText && (
                    <span
                      data-testid={item.id === 'announcements' ? 'sidebar-announcements-unread-badge' : undefined}
                      className={`text-[9px] font-extrabold px-1.5 py-0.2 rounded-full shrink-0 ${
                        item.id === 'announcements' && Number(unreadAnnouncementsCount) > 0
                          ? 'bg-[#D7263D] text-white'
                          : item.isHighlight 
                          ? 'bg-[#1A1A1A] text-[#FF811A]' 
                          : isCurrent
                          ? 'bg-[#1A1A1A] text-[#FFFFFF]'
                          : 'bg-[#E0530B] text-[#FF811A]'
                      }`}
                    >
                      {badgeText}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Bottom Actions: Storefront, Home & Sign Out */}
          <div className="p-3 border-t border-[#FFFFFF]/15 bg-[#0A2A1F] space-y-1.5">
            <Link
              to="/"
              className="w-full py-1.5 px-3 rounded-xl bg-[#E0530B]/60 hover:bg-[#E0530B] text-[#FF811A] text-[11px] font-bold btn-interactive flex items-center justify-center space-x-1.5 cursor-pointer"
            >
              <ExternalLink className="w-3 h-3" />
              <span>Live Storefront</span>
            </Link>

            <button
              type="button"
              onClick={handleSellerSignOut}
              className="w-full py-2 px-3 rounded-xl bg-[#D7263D]/90 hover:bg-[#D7263D] text-[#FFFFFF] text-xs font-bold btn-interactive flex items-center justify-center space-x-1.5 cursor-pointer shadow-xs"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out of Seller Hub</span>
            </button>
          </div>

        </div>
      </aside>
    </>
  );
}
