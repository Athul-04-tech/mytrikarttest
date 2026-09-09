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
  X 
} from 'lucide-react';
import AuthContext from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

const SELLER_NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', route: '/seller/dashboard', icon: LayoutDashboard },
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
  vendorProfile
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const auth = React.useContext(AuthContext);
  const logout = auth?.logout;
  const currentUser = auth?.currentUser;

  // Compute live badge counts from real API data
  const totalProducts = productStatusCounts && typeof productStatusCounts === 'object'
    ? Object.values(productStatusCounts).reduce((acc, curr) => acc + (Number(curr) || 0), 0)
    : 0;

  const newOrdersCount = orderStatusCounts && typeof orderStatusCounts === 'object'
    ? Number(orderStatusCounts.new || orderStatusCounts.NEW || 0)
    : 0;

  const getBadgeForItem = (itemId) => {
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

  const displayStoreName = vendorProfile?.store_name || (currentUser?.first_name ? `${currentUser.first_name}'s Store` : 'Merchant Store');
  const storeInitials = displayStoreName.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase() || 'SH';

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
            <Link to="/seller/dashboard" className="flex items-center space-x-2.5 truncate">
              <div className="w-9 h-9 rounded-xl bg-[#FF811A] text-[#FA661C] font-['Outfit'] font-black text-sm flex items-center justify-center shadow-md border border-[#FFFFFF] shrink-0 avatar-interactive">
                {storeInitials}
              </div>
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
                      ? 'bg-[#FF811A] text-[#FA661C] shadow-sm'
                      : 'text-[#FFFFFF]/80 hover:bg-[#E0530B] hover:text-[#FFFFFF]'
                  }`}
                >
                  <div className="flex items-center space-x-2.5 truncate">
                    <Icon className="w-4 h-4 icon-interactive shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </div>

                  {badgeText && (
                    <span className={`text-[9px] font-extrabold px-1.5 py-0.2 rounded-full shrink-0 ${
                      item.isHighlight 
                        ? 'bg-[#1A1A1A] text-[#FF811A]' 
                        : isCurrent
                        ? 'bg-[#1A1A1A] text-[#FFFFFF]'
                        : 'bg-[#E0530B] text-[#FF811A]'
                    }`}>
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
