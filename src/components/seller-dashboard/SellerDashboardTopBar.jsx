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
import { useToast } from '../../context/ToastContext';

export default function SellerDashboardTopBar({
  onToggleSidebar,
  alerts,
  vendorProfile
}) {
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const toast = useToast();
  const navigate = useNavigate();
  const auth = React.useContext(AuthContext);
  const logout = auth?.logout;
  const currentUser = auth?.currentUser;

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

  const displayStoreName = vendorProfile?.store_name || (currentUser?.first_name ? `${currentUser.first_name}'s Store` : 'Merchant Store');
  const storeInitials = displayStoreName.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase() || 'SH';
  const taxIdText = vendorProfile?.tax_id ? `GSTIN: ${vendorProfile.tax_id}` : 'GSTIN: Not yet available';

  return (
    <header className="bg-white border-b border-[#EAE3DC] sticky top-0 z-30 shadow-xs px-4 sm:px-8 py-3">
      <div className="flex items-center justify-between gap-4">
        
        {/* Left: Hamburger + Store Details */}
        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={onToggleSidebar}
            className="lg:hidden p-2 rounded-xl text-[#FA661C] bg-[#FFFFFF] hover:bg-[#FFF3EC] border border-[#EAE3DC] icon-interactive cursor-pointer"
            aria-label="Toggle navigation"
          >
            <Menu className="w-5 h-5" />
          </button>

          <Link to="/seller/dashboard" className="flex items-center space-x-2.5">
            {vendorProfile?.store_logo ? (
              <img
                src={vendorProfile.store_logo}
                alt="Store Logo"
                className="w-8 h-8 rounded-xl object-cover border border-[#EAE3DC] shrink-0"
              />
            ) : (
              <div className="w-8 h-8 rounded-xl bg-[#FA661C] text-[#FF811A] font-bold text-xs flex items-center justify-center border border-[#EAE3DC] shrink-0">
                {storeInitials}
              </div>
            )}
            <div>
              <div className="flex items-center space-x-1.5">
                <h1 className="font-['Outfit'] font-extrabold text-sm sm:text-base text-[#FA661C] leading-tight truncate max-w-[160px] sm:max-w-none">
                  {displayStoreName}
                </h1>
                <span className="text-[9px] font-black uppercase bg-[#FFF8F2] text-[#FA661C] border border-[#FF811A]/50 px-1.5 py-0.2 rounded-full hidden sm:inline-block">
                  Merchant tier: Not yet available
                </span>
              </div>
              <span className="text-[10px] text-[#6B6058]">
                {taxIdText} • SLA Compliance: <strong className="text-[#FA661C]">Not yet available</strong>
              </span>
            </div>
          </Link>
        </div>

        {/* Right: Notifications + Merchant Avatar + Sign Out */}
        <div className="flex items-center space-x-2 sm:space-x-3">

          {/* Notifications Bell */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsNotifOpen(!isNotifOpen)}
              className="p-2 rounded-xl text-[#6B6058] hover:text-[#FA661C] bg-[#FFFFFF] hover:bg-[#FFF3EC] border border-[#EAE3DC] btn-interactive relative cursor-pointer"
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
              <div className="absolute right-0 mt-2 w-80 bg-white border border-[#FF811A]/50 rounded-2xl shadow-xl z-50 p-4 animate-dropdown text-xs">
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
                    className="text-[10px] text-[#FF811A] hover:underline font-bold"
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

                  <div className="pt-2">
                    <h5 className="font-bold text-[#FA661C]">Weekly Payout Ready</h5>
                    <p className="text-[10px] text-[#6B6058]">₹84,200 pending settlement cycle for Friday.</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Merchant Profile Avatar */}
          <div className="w-8 h-8 rounded-full bg-[#FA661C] text-[#FF811A] font-black text-xs flex items-center justify-center shadow-xs border border-[#FF811A] avatar-interactive shrink-0">
            AP
          </div>

          {/* Dedicated Seller Sign Out Button */}
          <button
            type="button"
            onClick={handleSellerSignOut}
            className="px-3 py-1.5 rounded-xl border border-[#EAE3DC] bg-[#FFFFFF] hover:bg-[#FDE8EA] text-xs font-bold text-[#D7263D] hover:border-[#D7263D]/50 transition-all flex items-center space-x-1.5 btn-interactive shadow-2xs cursor-pointer"
            aria-label="Sign Out of Seller Hub"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Sign Out</span>
          </button>

        </div>

      </div>
    </header>
  );
}
