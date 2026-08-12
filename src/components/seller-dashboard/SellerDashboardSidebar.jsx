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
import { SELLER_PROFILE } from '../../data/sellerDashboardData';

const SELLER_NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', route: '/seller/dashboard', icon: LayoutDashboard },
  { id: 'products', label: 'Products & Inventory', route: '/seller/products', icon: Package, badge: '48' },
  { id: 'orders', label: 'Orders & Fulfillment', route: '/seller/orders', icon: ShoppingBag, badge: '6 New', isHighlight: true },
  { id: 'settlements', label: 'Settlements & Payouts', route: '/seller/settlements', icon: Landmark },
  { id: 'settings', label: 'Store Settings', route: '/seller/settings', icon: Settings },
  { id: 'profile', label: 'Merchant Profile', route: '/seller/profile', icon: User }
];

export default function SellerDashboardSidebar({
  isMobileOpen,
  onCloseMobile
}) {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-[#0F3D2E]/70 backdrop-blur-xs z-40 lg:hidden"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      {/* Persistent Left Sidebar Shell */}
      <aside 
        aria-label="Seller Hub Navigation"
        className={`fixed lg:sticky top-0 left-0 h-screen w-64 shrink-0 bg-[#0F3D2E] text-[#FBF8F1] border-r border-[#D4AF37]/30 flex flex-col justify-between z-50 transition-transform duration-300 ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex flex-col h-full overflow-hidden">
          
          {/* Top Brand Header */}
          <div className="p-4 sm:p-5 border-b border-[#FBF8F1]/15 flex items-center justify-between">
            <Link to="/seller/dashboard" className="flex items-center space-x-2.5 truncate">
              <div className="w-9 h-9 rounded-xl bg-[#D4AF37] text-[#0F3D2E] font-['Outfit'] font-black text-sm flex items-center justify-center shadow-md border border-[#FBF8F1] shrink-0 avatar-interactive">
                AP
              </div>
              <div className="truncate">
                <div className="flex items-center space-x-1.5">
                  <span className="font-['Outfit'] font-extrabold text-sm text-[#FBF8F1] truncate">
                    {SELLER_PROFILE.storeName}
                  </span>
                </div>
                <span className="text-[9px] font-bold text-[#D4AF37] tracking-wider uppercase block">
                  SELLER HUB
                </span>
              </div>
            </Link>

            {/* Mobile Close Button */}
            <button
              type="button"
              onClick={onCloseMobile}
              className="lg:hidden p-1 text-[#FBF8F1]/80 hover:text-white"
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
                      ? 'bg-[#D4AF37] text-[#0F3D2E] shadow-sm'
                      : 'text-[#FBF8F1]/80 hover:bg-[#155440] hover:text-[#FBF8F1]'
                  }`}
                >
                  <div className="flex items-center space-x-2.5 truncate">
                    <Icon className="w-4 h-4 icon-interactive shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </div>

                  {item.badge && (
                    <span className={`text-[9px] font-extrabold px-1.5 py-0.2 rounded-full shrink-0 ${
                      item.isHighlight 
                        ? 'bg-[#0F3D2E] text-[#D4AF37]' 
                        : isCurrent
                        ? 'bg-[#0F3D2E] text-[#FBF8F1]'
                        : 'bg-[#155440] text-[#D4AF37]'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Bottom Storefront & Marketplace Link */}
          <div className="p-3 border-t border-[#FBF8F1]/15 bg-[#0A2A1F] space-y-1.5">
            <Link
              to="/"
              className="w-full py-2 px-3 rounded-xl bg-[#155440]/60 hover:bg-[#155440] text-[#D4AF37] text-[11px] font-bold btn-interactive flex items-center justify-center space-x-1.5 cursor-pointer"
            >
              <ExternalLink className="w-3 h-3" />
              <span>View Live Storefront</span>
            </Link>

            <Link
              to="/"
              className="w-full py-2 px-3 rounded-xl bg-[#155440] hover:bg-[#1A624B] text-[#FBF8F1] border border-[#D4AF37]/30 text-xs font-bold btn-interactive flex items-center justify-center space-x-1.5 cursor-pointer shadow-xs"
            >
              <LogOut className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>Exit to Marketplace Home</span>
            </Link>
          </div>

        </div>
      </aside>
    </>
  );
}
