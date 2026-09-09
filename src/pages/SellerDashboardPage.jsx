import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AlertCircle, RefreshCw, Loader2 } from 'lucide-react';
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
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../utils/api';

export default function SellerDashboardPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Vendor Profile State
  const [vendorProfile, setVendorProfile] = useState(null);

  // Live Dashboard State
  const [dashboardData, setDashboardData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [apiError, setApiError] = useState(null);
  const [asOfDate, setAsOfDate] = useState('');
  const [selectedCurrency, setSelectedCurrency] = useState('INR');
  const [availableCurrencies, setAvailableCurrencies] = useState(['INR']);

  // Fetch Vendor Profile from GET /api/vendors/me/
  useEffect(() => {
    let isMounted = true;
    async function loadVendorProfile() {
      try {
        const profile = await apiRequest('/api/vendors/me/');
        if (isMounted) setVendorProfile(profile);
      } catch (err) {
        console.warn("Failed to load vendor profile:", err);
      }
    }
    loadVendorProfile();
    return () => { isMounted = false; };
  }, []);

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

  // Fetch live dashboard metrics from GET /api/reports/dashboard/
  useEffect(() => {
    let isMounted = true;
    async function loadDashboard() {
      if (activeSection !== 'dashboard') return;
      setIsLoading(true);
      setApiError(null);

      try {
        const query = asOfDate ? `?as_of=${encodeURIComponent(asOfDate)}` : '';
        const data = await apiRequest(`/api/reports/dashboard/${query}`);

        if (isMounted) {
          setDashboardData(data);

          // Extract currency list across sales, earnings, paid_settlement
          const currenciesFound = new Set();
          if (data.earnings_by_currency) {
            Object.keys(data.earnings_by_currency).forEach(c => currenciesFound.add(c));
          }
          if (data.paid_settlement?.amount_by_currency) {
            Object.keys(data.paid_settlement.amount_by_currency).forEach(c => currenciesFound.add(c));
          }
          if (data.sales_by_currency) {
            Object.values(data.sales_by_currency).forEach(periodObj => {
              if (typeof periodObj === 'object' && periodObj !== null) {
                Object.keys(periodObj).forEach(c => currenciesFound.add(c));
              }
            });
          }

          const currencyList = Array.from(currenciesFound);
          if (currencyList.length > 0) {
            setAvailableCurrencies(currencyList);
            if (!currencyList.includes(selectedCurrency)) {
              setSelectedCurrency(currencyList[0]);
            }
          }
        }
      } catch (err) {
        if (isMounted) {
          const detailMsg = err.data?.detail || err.data?.message || err.message;
          setApiError(detailMsg || "Failed to load dashboard metrics.");
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadDashboard();
    return () => { isMounted = false; };
  }, [activeSection, asOfDate]);

  const computedStoreName = vendorProfile?.store_name || (currentUser?.first_name ? `${currentUser.first_name}'s Store` : 'Merchant Store');

  return (
    <div className="min-h-screen bg-[#FFFFFF] flex text-[#1A2420] font-sans selection:bg-[#FF811A]/30 selection:text-[#FA661C]">
      
      {/* 1. PERSISTENT LEFT SIDEBAR */}
      <SellerDashboardSidebar
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
        productStatusCounts={dashboardData?.product_status_counts}
        orderStatusCounts={dashboardData?.order_status_counts}
        vendorProfile={vendorProfile}
      />

      {/* 2. MAIN SELLER CONTENT WORKSPACE */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Top Bar */}
        <SellerDashboardTopBar
          onToggleSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
          alerts={dashboardData?.alerts}
          vendorProfile={vendorProfile}
        />

        {/* Dynamic Workspace Body */}
        <main className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl w-full mx-auto animate-reveal">
          
          {/* Main Seller Dashboard Overview (Widget Groups 1 to 5) */}
          {activeSection === 'dashboard' && (
            <>
              {/* Top Welcome Header & Prominent Add Product CTA */}
              <SellerWelcomeHeader
                storeName={computedStoreName}
                asOfDate={asOfDate}
                onAsOfDateChange={setAsOfDate}
              />

              {/* API Error Alert (Graciously surface HTTP 403 or date format errors) */}
              {apiError && (
                <div className="p-4 bg-[#FDE8EA] border border-[#D7263D]/40 rounded-2xl flex items-start space-x-3 text-xs text-[#D7263D]">
                  <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <span className="font-bold block text-sm">Dashboard Reporting Error</span>
                    <p className="mt-0.5">{apiError}</p>
                    <button
                      type="button"
                      onClick={() => setAsOfDate('')}
                      className="mt-2 font-bold underline hover:text-[#902B20] inline-flex items-center space-x-1 cursor-pointer"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>Reset As-Of Date & Reload</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Loading Indicator Spinner Bar */}
              {isLoading && (
                <div className="p-3 bg-[#FFF3EC] text-[#FA661C] rounded-2xl flex items-center justify-center space-x-2 text-xs font-bold animate-pulse">
                  <Loader2 className="w-4 h-4 animate-spin text-[#FF811A]" />
                  <span>Syncing Live Dashboard Metrics from Server...</span>
                </div>
              )}

              {/* Widget Group 1: Sales Performance Widget */}
              <SellerSalesWidget
                salesByCurrency={dashboardData?.sales_by_currency}
                selectedCurrency={selectedCurrency}
                availableCurrencies={availableCurrencies}
                onSelectCurrency={setSelectedCurrency}
              />

              {/* Widget Group 2: Earnings & Settlements Widget */}
              <SellerEarningsWidget
                earningsByCurrency={dashboardData?.earnings_by_currency}
                paidSettlementData={dashboardData?.paid_settlement}
                pendingSettlementOrderCount={dashboardData?.pending_settlement_order_count}
                selectedCurrency={selectedCurrency}
                onNavigateToSettlements={() => navigate('/seller/settlements')}
              />

              {/* Middle Action Zone: Orders Widget + Products Widget */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                <SellerOrdersWidget
                  orderStatusCounts={dashboardData?.order_status_counts}
                  recentOrders={dashboardData?.recent_orders}
                  onNavigateToOrders={() => navigate('/seller/orders')}
                />

                <SellerProductsWidget
                  productStatusCounts={dashboardData?.product_status_counts}
                  inventoryAttention={dashboardData?.inventory_attention}
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

