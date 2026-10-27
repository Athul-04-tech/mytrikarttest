import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Menu, 
  Bell, 
  Plus, 
  Store, 
  ExternalLink, 
  Sparkles, 
  ShieldCheck, 
  ChevronDown, 
  Package,
  LogOut 
} from 'lucide-react';
import AuthContext from '../../context/AuthContext';
import VendorProfileContext from '../../context/VendorProfileContext';
import { useToast } from '../../context/ToastContext';

export default function SellerDashboardTopBar({
  onToggleSidebar,
  alerts,
  vendorProfile: propProfile
}) {
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const toast = useToast();
  const navigate = useNavigate();
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

  const taxIdText = profile?.tax_id ? `GSTIN: ${profile.tax_id}` : (isLoading ? 'GSTIN: ...' : 'GSTIN: Not set');
  const trustLevelText = profile?.trust_level ? `Tier: ${profile.trust_level.toUpperCase()}` : (isLoading ? 'Tier: ...' : 'Tier: Not set');

  const lowStockVariants = Array.isArray(alerts?.low_stock_variants) ? alerts.low_stock_variants : [];
  const newOrdersCount = Number(alerts?.new_orders_count || 0);

  const hasLowStock = lowStockVariants.length > 0;
  const hasNewOrders = newOrdersCount > 0;
  const realAlertsCount = (hasLowStock ? 1 : 0) + (hasNewOrders ? 1 : 0);

  const handleSellerSignOut = async () => {
    if (logout) {
      try {
        await logout();
      } catch (err) {
        console.warn("Logout request completed with warning:", err);
      }
    }
    navigate('/');
    toast.info("Seller Sign Out", "You have securely signed out of Seller Hub and returned to Marketplace Home.");
  };

  return (
    <header className="bg-white border-b border-[#EAE3DC] sticky top-0 z-30 shadow-xs px-4 sm:px-8 py-3">
      <div className="flex items-center justify-between gap-2 sm:gap-4">
        
        {/* Left: Hamburger + Brand Logo + Store Details */}
        <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
          <button
            type="button"
            onClick={onToggleSidebar}
            className="lg:hidden p-2 rounded-xl text-[#FA661C] bg-[#FFFFFF] hover:bg-[#FFF3EC] border border-[#EAE3DC] icon-interactive cursor-pointer shrink-0 min-w-[36px] min-h-[36px] flex items-center justify-center"
            aria-label="Toggle navigation"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Platform Brand Logo */}
          <Link
            to="/"
            className="flex items-center btn-interactive shrink-0"
            aria-label="Return to Marketplace"
            title="MytriKart Marketplace"
          >
            <img 
              src="/mytrikart-logo.png" 
              alt="MytriKart Logo" 
              className="h-7 sm:h-8 w-auto object-contain shrink-0" 
            />
          </Link>

          {/* Mobile Badge */}
          <span className="md:hidden text-[9px] font-black tracking-wide uppercase px-2 py-0.5 rounded-full bg-[#FFF8F2] text-[#FA661C] border border-[#FF811A]/40 shrink-0">
            Seller Hub
          </span>

          {/* Desktop Separator */}
          <span className="text-[#EAE3DC] hidden md:inline shrink-0">|</span>

          {/* Desktop Store Details */}
          {isLoading ? (
            /* Skeleton Loading State */
            <div className="hidden md:flex items-center space-x-2.5 min-w-0 animate-pulse">
              <div className="w-8 h-8 rounded-xl bg-gray-200 shrink-0" />
              <div className="space-y-1">
                <div className="h-3.5 bg-gray-200 rounded w-28" />
                <div className="h-2.5 bg-gray-100 rounded w-36" />
              </div>
            </div>
          ) : error ? (
            /* Honest Error State */
            <div className="hidden md:flex items-center space-x-2 text-xs text-[#D7263D]">
              <span className="font-bold">Profile Unavailable</span>
            </div>
          ) : (
            <Link to="/seller/dashboard" className="hidden md:flex items-center space-x-2.5 min-w-0">
              {storeLogo ? (
                <img
                  src={storeLogo}
                  alt={displayStoreName}
                  className="w-8 h-8 rounded-xl object-cover border border-[#EAE3DC] shrink-0"
                />
              ) : (
                <div className="w-8 h-8 rounded-xl bg-[#FA661C] text-[#FF811A] font-bold text-xs flex items-center justify-center border border-[#EAE3DC] shrink-0">
                  {storeInitials}
                </div>
              )}
              <div className="min-w-0">
                <div className="flex items-center space-x-1.5">
                  <h1 className="font-['Outfit'] font-extrabold text-sm sm:text-base text-[#FA661C] leading-tight truncate max-w-[180px] lg:max-w-none">
                    {displayStoreName}
                  </h1>
                  <span className="text-[9px] font-black uppercase bg-[#FFF8F2] text-[#FA661C] border border-[#FF811A]/50 px-1.5 py-0.2 rounded-full hidden sm:inline-block">
                    {trustLevelText}
                  </span>
                </div>
                <span className="text-[10px] text-[#6B6058] truncate block">
                  {taxIdText}
                </span>
              </div>
            </Link>
          )}
        </div>

        {/* Right: Notifications + Merchant Avatar + Sign Out */}
        <div className="flex items-center space-x-2 sm:space-x-3 shrink-0">

          {/* Notifications Bell */}
          <div className="relative shrink-0">
            <button
              type="button"
              onClick={() => setIsNotifOpen(!isNotifOpen)}
              className="p-2 rounded-xl text-[#6B6058] hover:text-[#FA661C] bg-[#FFFFFF] hover:bg-[#FFF3EC] border border-[#EAE3DC] btn-interactive relative cursor-pointer shrink-0 min-w-[36px] min-h-[36px] flex items-center justify-center"
              aria-label="Open notifications"
            >
              <Bell className="w-4 h-4 icon-interactive" />
              {realAlertsCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-[#D7263D] text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center border-2 border-white animate-badge-pop">
                  {realAlertsCount}
                </span>
              )}
            </button>

            {/* Notification Dropdown */}
            {isNotifOpen && (
              <div className="absolute right-0 mt-2 w-72 sm:w-80 max-w-[calc(100vw-2rem)] bg-white border border-[#FF811A]/50 rounded-2xl shadow-xl z-50 p-4 animate-dropdown text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-[#EAE3DC]">
                  <span className="font-bold text-[#FA661C] uppercase tracking-wider text-[10px]">
                    Store Alerts{realAlertsCount > 0 ? ` (${realAlertsCount} Urgent)` : ''}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      toast.info("Notifications Read", "All store notifications cleared.");
                      setIsNotifOpen(false);
                    }}
                    className="text-[10px] text-[#FF811A] hover:underline font-bold cursor-pointer"
                  >
                    Clear All
                  </button>
                </div>

                <div className="py-2 space-y-2 divide-y divide-[#EAE3DC]/40">
                  {hasLowStock && (
                    <div className="pt-2">
                      <h5 className="font-bold text-[#FA661C]">Low Stock Warning</h5>
                      {lowStockVariants.slice(0, 3).map((item, idx) => {
                        const skuLabel = item.sku_code ? ` (${item.sku_code})` : '';
                        return (
                          <p key={item.variant_id || item.product_id || idx} className="text-[10px] text-[#6B6058]">
                            {item.product_name || 'Product'}{skuLabel} has {item.stock_quantity ?? 0} units remaining.
                          </p>
                        );
                      })}
                      {lowStockVariants.length > 3 && (
                        <p className="text-[10px] text-[#FF811A] font-bold mt-0.5">
                          +{lowStockVariants.length - 3} more low stock variants
                        </p>
                      )}
                    </div>
                  )}

                  {hasNewOrders && (
                    <div className="pt-2">
                      <h5 className="font-bold text-[#FA661C]">
                        {newOrdersCount} New Customer {newOrdersCount === 1 ? 'Order' : 'Orders'}
                      </h5>
                      <p className="text-[10px] text-[#6B6058]">Orders waiting in fulfillment dispatch queue.</p>
                    </div>
                  )}

                  {!hasLowStock && !hasNewOrders && (
                    <div className="pt-2">
                      <p className="text-[10px] text-[#6B6058] italic">No active store alerts</p>
                    </div>
                  )}

                  {/* Standard payout schedule notification */}
                  <div className="pt-2">
                    <h5 className="font-bold text-[#FA661C]">Weekly Payout Ready</h5>
                    <p className="text-[10px] text-[#6B6058]">Settlement cycle processing for active statement.</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Merchant Profile Avatar */}
          <div
            className="w-8 h-8 rounded-full bg-[#FA661C] text-[#FF811A] font-black text-xs flex items-center justify-center shadow-xs border border-[#FF811A] avatar-interactive shrink-0"
            title={displayStoreName}
          >
            {storeInitials}
          </div>

          {/* Dedicated Seller Sign Out Button */}
          <button
            type="button"
            onClick={handleSellerSignOut}
            className="p-2 sm:px-3 sm:py-1.5 rounded-xl border border-[#EAE3DC] bg-[#FFFFFF] hover:bg-[#FDE8EA] text-xs font-bold text-[#D7263D] hover:border-[#D7263D]/50 transition-all flex items-center justify-center space-x-1.5 btn-interactive shadow-2xs cursor-pointer shrink-0 min-w-[36px] min-h-[36px]"
            aria-label="Sign Out of Seller Hub"
            title="Sign Out of Seller Hub"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Sign Out</span>
          </button>

        </div>

      </div>
    </header>
  );
}
