import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import AdminSidebar from '../components/admin/AdminSidebar';
import AdminTopBar from '../components/admin/AdminTopBar';
import AdminStatCardsGrid from '../components/admin/AdminStatCardsGrid';
import AdminUrgentAlertsPanel from '../components/admin/AdminUrgentAlertsPanel';

// Operational Detail Modules with Arithmetically Consistent Math
import SettlementCalcModule from '../components/admin/modules/SettlementCalcModule';
import WithdrawalManagementModule from '../components/admin/modules/WithdrawalManagementModule';
import TaxManagementModule from '../components/admin/modules/TaxManagementModule';
import CommissionModule from '../components/admin/modules/CommissionModule';
import WalletModule from '../components/admin/modules/WalletModule';
import OrderOpsModule from '../components/admin/modules/OrderOpsModule';
import VendorHubModule from '../components/admin/modules/VendorHubModule';
import RmaModule from '../components/admin/modules/RmaModule';
import ReportsModule from '../components/admin/modules/ReportsModule';
import ProductReviewModule from '../components/admin/modules/ProductReviewModule';
import GovernanceQueueModule from '../components/admin/modules/GovernanceQueueModule';
import CmsModule from '../components/admin/modules/CmsModule';
import UserManagementModule from '../components/admin/modules/UserManagementModule';
import CatalogSchemaModule from '../components/admin/modules/CatalogSchemaModule';

import { ADMIN_NAV_GROUPS } from '../data/adminMockData';
import { apiRequest } from '../utils/api';
import { Boxes, ArrowLeft } from 'lucide-react';

export default function AdminHomePage() {
  const { moduleId } = useParams();
  const navigate = useNavigate();

  const [activeSection, setActiveSection] = useState(moduleId || 'dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Real API Overview State
  const [overviewData, setOverviewData] = useState(null);
  const [ordersSummary, setOrdersSummary] = useState(null);
  const [rmaSummary, setRmaSummary] = useState(null);
  const [settlementSummary, setSettlementSummary] = useState(null);
  const [overviewLoading, setOverviewLoading] = useState(true);
  const [overviewError, setOverviewError] = useState(null);

  const fetchOverview = async () => {
    setOverviewLoading(true);
    setOverviewError(null);
    try {
      const [ovData, ordData, rmaData, stlData] = await Promise.all([
        apiRequest('/api/reports/admin/overview/').catch(() => null),
        apiRequest('/api/orders/admin/summary/').catch(() => null),
        apiRequest('/api/rma/admin/summary/').catch(() => null),
        apiRequest('/api/settlements/admin/summary/').catch(() => null),
      ]);
      setOverviewData(ovData);
      setOrdersSummary(ordData);
      setRmaSummary(rmaData);
      setSettlementSummary(stlData);
    } catch (err) {
      console.error("Failed to fetch admin overview metrics:", err);
      setOverviewError(err.data?.detail || err.message || "Failed to load admin overview metrics.");
    } finally {
      setOverviewLoading(false);
    }
  };

  // Fetch overview whenever on root dashboard
  useEffect(() => {
    if (activeSection === 'dashboard') {
      fetchOverview();
    }
  }, [activeSection]);

  // Sync with moduleId param
  useEffect(() => {
    if (moduleId) {
      setActiveSection(moduleId);
    } else {
      setActiveSection('dashboard');
    }
  }, [moduleId]);

  // Dynamic SEO Metadata for Admin Console
  useEffect(() => {
    document.title = "Operations Command Center — MytriKart Admin";
  }, []);

  // Find human-readable label for active section
  let activeSectionLabel = "Marketplace Overview";
  if (activeSection !== 'dashboard') {
    for (const grp of ADMIN_NAV_GROUPS) {
      if (grp.items) {
        const found = grp.items.find(i => i.id === activeSection);
        if (found) {
          activeSectionLabel = `${grp.label} › ${found.label}`;
          break;
        }
      }
    }
  }

  const formatSectionTitle = (id) => {
    if (!id) return "Module";
    return id
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const renderNotAvailableCard = (id) => {
    const title = formatSectionTitle(id);
    return (
      <div className="bg-white rounded-3xl border border-[#EAE3DC] p-8 sm:p-12 text-center space-y-4 animate-reveal">
        <div className="w-14 h-14 rounded-2xl bg-[#FFF3EC] text-[#FA661C] mx-auto flex items-center justify-center">
          <Boxes className="w-7 h-7" />
        </div>
        <div>
          <span className="inline-block px-3 py-1 rounded-full text-xs font-extrabold bg-[#FFF3EC] text-[#FA661C] border border-[#FA661C]/20 mb-2">
            Not yet available
          </span>
          <h2 className="font-['Outfit'] font-extrabold text-2xl text-[#FA661C]">
            {title} Not Available
          </h2>
        </div>
        <p className="text-xs sm:text-sm text-[#6B6058] max-w-md mx-auto">
          {title} administrative features are currently unavailable and coming soon.
        </p>
        <div className="pt-2">
          <Link
            to="/admin"
            className="inline-flex items-center space-x-2 px-5 py-2.5 bg-[#FA661C] hover:bg-[#E0530B] text-white font-bold text-xs rounded-xl transition-colors shadow-xs"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Overview</span>
          </Link>
        </div>
      </div>
    );
  };

  // Render specific financial/operational module based on selection
  const renderActiveModuleContent = () => {
    switch (activeSection) {
      case 'products':
        return <ProductReviewModule />;
      case 'catalog-schema':
        return <CatalogSchemaModule />;
      case 'categories':
        return <GovernanceQueueModule defaultTab="attributes" />;
      case 'brands':
        return <GovernanceQueueModule defaultTab="brands" />;
      case 'order-ops':
        return <OrderOpsModule />;
      case 'rma':
        return <RmaModule />;
      case 'settlement-calc':
      case 'settlement-dash':
        return <SettlementCalcModule />;
      case 'tax':
        return <TaxManagementModule />;
      case 'commission':
        return <CommissionModule />;
      case 'wallets':
        return <WalletModule />;
      case 'withdrawals':
        return <WithdrawalManagementModule />;
      case 'vendors':
        return <VendorHubModule />;
      case 'cms':
        return <CmsModule />;
      case 'customers':
        return <UserManagementModule defaultTab="customers" />;
      case 'staff':
        return <UserManagementModule defaultTab="staff" />;
      case 'users':
        return <UserManagementModule defaultTab="all" />;
      case 'reports':
        return <ReportsModule />;

      case 'payments':
      case 'logistics':
      case 'inventory':
      case 'coupons':
      case 'marketing':
      case 'reviews':
      case 'tickets':
      case 'notifications':
      case 'ai':
      case 'audit':
      case 'system':
      case 'integrations':
      case 'mobile-app':
      case 'compliance':
      case 'multi-store':
        return renderNotAvailableCard(activeSection);

      default:
        return renderNotAvailableCard(activeSection);
    }
  };

  return (
    <div className="min-h-screen bg-[#FFFFFF] flex text-[#1A2420] font-sans selection:bg-[#FF811A]/30 selection:text-[#FA661C]">
      
      {/* 1. LEFT SIDEBAR */}
      <AdminSidebar
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* 2. MAIN OPERATIONS WORKSPACE */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Top Control Bar */}
        <AdminTopBar 
          activeSectionLabel={activeSectionLabel}
          onToggleMobileSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
        />

        {/* Dynamic Workspace Body */}
        <main className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl w-full mx-auto animate-reveal">
          
          {/* If on Root Overview Dashboard */}
          {activeSection === 'dashboard' ? (
            <>
              {/* Stat Cards Grid (Wired dynamically to real backend endpoints) */}
              <AdminStatCardsGrid 
                overviewData={overviewData}
                ordersSummary={ordersSummary}
                rmaSummary={rmaSummary}
                settlementSummary={settlementSummary}
                loading={overviewLoading}
                error={overviewError}
              />

              {/* Bottom Operational Grid: Urgent Compliance Alerts */}
              <div className="grid grid-cols-1 gap-6">
                <div>
                  <AdminUrgentAlertsPanel overviewData={overviewData} />
                </div>
              </div>
            </>
          ) : (
            /* Render Specific Deep-Linked Detail Module */
            renderActiveModuleContent()
          )}

        </main>

      </div>

    </div>
  );
}
