import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import SellerDashboardSidebar from '../components/seller-dashboard/SellerDashboardSidebar';
import SellerDashboardTopBar from '../components/seller-dashboard/SellerDashboardTopBar';
import SellerWelcomeHeader from '../components/seller-dashboard/SellerWelcomeHeader';
import SellerSalesWidget from '../components/seller-dashboard/SellerSalesWidget';
import SellerEarningsWidget from '../components/seller-dashboard/SellerEarningsWidget';
import SellerOrdersWidget from '../components/seller-dashboard/SellerOrdersWidget';
import SellerProductsWidget from '../components/seller-dashboard/SellerProductsWidget';
import SellerCustomerWidget from '../components/seller-dashboard/SellerCustomerWidget';
import SellerProductsView from '../components/seller-dashboard/subviews/SellerProductsView';
import SellerOrdersView from '../components/seller-dashboard/subviews/SellerOrdersView';
import SellerSettlementsView from '../components/seller-dashboard/subviews/SellerSettlementsView';
import SellerSettingsView from '../components/seller-dashboard/subviews/SellerSettingsView';
import SellerProfileView from '../components/seller-dashboard/subviews/SellerProfileView';

export default function SellerDashboardPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Derive active section from route
  const getActiveSection = () => {
    const path = location.pathname;
    if (path.includes('/seller/products')) return 'products';
    if (path.includes('/seller/orders')) return 'orders';
    if (path.includes('/seller/settlements')) return 'settlements';
    if (path.includes('/seller/settings')) return 'settings';
    if (path.includes('/seller/profile')) return 'profile';
    return 'dashboard';
  };

  const activeSection = getActiveSection();

  // SEO Standard
  useEffect(() => {
    const titles = {
      dashboard: 'Seller Dashboard — MytriKart Hub',
      products: 'Products & Inventory Catalog — MytriKart Hub',
      orders: 'Orders Fulfillment — MytriKart Hub',
      settlements: 'Settlements & Payouts — MytriKart Hub',
      settings: 'Store Settings — MytriKart Hub',
      profile: 'Merchant Profile — MytriKart Hub'
    };
    document.title = titles[activeSection] || 'Seller Hub — MytriKart';
  }, [activeSection]);

  return (
    <div className="min-h-screen bg-[#FBF8F1] flex text-[#1A2420] font-sans selection:bg-[#D4AF37]/30 selection:text-[#0F3D2E]">
      
      {/* 1. PERSISTENT LEFT SIDEBAR */}
      <SellerDashboardSidebar
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* 2. MAIN SELLER CONTENT WORKSPACE */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Top Bar */}
        <SellerDashboardTopBar
          onToggleSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
        />

        {/* Dynamic Workspace Body */}
        <main className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl w-full mx-auto animate-reveal">
          
          {/* Main Seller Dashboard Overview (Widget Groups 1 to 5) */}
          {activeSection === 'dashboard' && (
            <>
              {/* Top Welcome Header & Prominent Add Product CTA */}
              <SellerWelcomeHeader />

              {/* Widget Group 1: Sales Performance Widget */}
              <SellerSalesWidget />

              {/* Widget Group 2: Earnings & Settlements Widget */}
              <SellerEarningsWidget 
                onNavigateToSettlements={() => navigate('/seller/settlements')}
              />

              {/* Middle Action Zone: Orders Widget + Products Widget */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                <SellerOrdersWidget 
                  onNavigateToOrders={() => navigate('/seller/orders')}
                />

                <SellerProductsWidget 
                  onNavigateToProducts={() => navigate('/seller/products')}
                />
              </div>

              {/* Widget Group 5: Customer Care & Buyer Engagement Widget */}
              <SellerCustomerWidget />
            </>
          )}

          {/* Sub-view: Products Catalog */}
          {activeSection === 'products' && (
            <SellerProductsView onNavigateToAddProduct={() => navigate('/seller/products/new')} />
          )}

          {/* Sub-view: Orders Fulfillment */}
          {activeSection === 'orders' && (
            <SellerOrdersView />
          )}

          {/* Sub-view: Settlements & Payouts */}
          {activeSection === 'settlements' && (
            <SellerSettlementsView />
          )}

          {/* Sub-view: Store Settings */}
          {activeSection === 'settings' && (
            <SellerSettingsView />
          )}

          {/* Sub-view: Merchant Profile */}
          {activeSection === 'profile' && (
            <SellerProfileView />
          )}

        </main>

      </div>

    </div>
  );
}
