import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import AdminSidebar from '../components/admin/AdminSidebar';
import AdminTopBar from '../components/admin/AdminTopBar';
import AdminStatCardsGrid from '../components/admin/AdminStatCardsGrid';
import AdminSalesChartPanel from '../components/admin/AdminSalesChartPanel';
import AdminActivityFeed from '../components/admin/AdminActivityFeed';
import AdminTopListsPanel from '../components/admin/AdminTopListsPanel';
import AdminUrgentAlertsPanel from '../components/admin/AdminUrgentAlertsPanel';
import AdminSystemHealthPanel from '../components/admin/AdminSystemHealthPanel';

// Operational Detail Modules with Arithmetically Consistent Math
import SettlementCalcModule from '../components/admin/modules/SettlementCalcModule';
import TaxManagementModule from '../components/admin/modules/TaxManagementModule';
import CommissionModule from '../components/admin/modules/CommissionModule';
import WalletModule from '../components/admin/modules/WalletModule';
import OrderOpsModule from '../components/admin/modules/OrderOpsModule';
import VendorHubModule from '../components/admin/modules/VendorHubModule';
import RmaModule from '../components/admin/modules/RmaModule';
import ReportsModule from '../components/admin/modules/ReportsModule';

import { ADMIN_NAV_GROUPS } from '../data/adminMockData';
import { Boxes, Sparkles, ShieldCheck, ArrowLeft } from 'lucide-react';

export default function AdminHomePage() {
  const { moduleId } = useParams();
  const navigate = useNavigate();

  const [activeSection, setActiveSection] = useState(moduleId || 'dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

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

  // Render specific financial/operational module based on selection
  const renderActiveModuleContent = () => {
    switch (activeSection) {
      case 'settlement-calc':
      case 'settlement-dash':
        return <SettlementCalcModule />;
      case 'tax':
        return <TaxManagementModule />;
      case 'commission':
        return <CommissionModule />;
      case 'wallets':
      case 'withdrawals':
      case 'payments':
        return <WalletModule />;
      case 'order-ops':
      case 'logistics':
        return <OrderOpsModule />;
      case 'vendors':
      case 'staff':
        return <VendorHubModule />;
      case 'rma':
        return <RmaModule />;
      case 'reports':
        return <ReportsModule />;
      default:
        return (
          /* Generic Specification Workspace Card */
          <div className="bg-white rounded-3xl border border-[#EAE3DC] p-6 sm:p-10 shadow-xs space-y-6 animate-reveal">
            <div className="flex items-center justify-between pb-4 border-b border-[#EAE3DC]">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#FF811A] bg-[#FA661C] px-2.5 py-0.5 rounded-full">
                  SPECIFICATION MODULE
                </span>
                <h2 className="font-['Outfit'] text-2xl sm:text-3xl font-extrabold text-[#FA661C] mt-2">
                  {activeSectionLabel}
                </h2>
                <p className="text-xs sm:text-sm text-[#6B6058] mt-1">
                  Governance rules, automated bulk tools, and compliance logs for this module.
                </p>
              </div>

              <Link
                to="/admin"
                className="px-4 py-2 bg-[#FFFFFF] hover:bg-[#FFF3EC] border border-[#EAE3DC] rounded-xl text-xs font-bold text-[#FA661C] btn-interactive flex items-center space-x-1.5 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4 text-[#FF811A]" />
                <span>Back to Overview</span>
              </Link>
            </div>

            <div className="p-8 bg-[#FFFFFF] border border-dashed border-[#EAE3DC] rounded-2xl text-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-[#FFF3EC] text-[#FA661C] mx-auto flex items-center justify-center">
                <Boxes className="w-7 h-7" />
              </div>
              <h3 className="font-['Outfit'] font-bold text-lg text-[#FA661C]">
                {activeSectionLabel} Console View
              </h3>
              <p className="text-xs text-[#6B6058] max-w-md mx-auto">
                Ready for administrative bulk uploads, webhook synchronization, and audit logging.
              </p>
            </div>
          </div>
        );
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
              {/* Stat Cards Grid (Derived dynamically from Master Financial Engine) */}
              <AdminStatCardsGrid />

              {/* Middle Grid: Financial Performance Trend Panel + Live Activity Feed */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                <div className="lg:col-span-8 space-y-6">
                  <AdminSalesChartPanel />
                </div>
                <div className="lg:col-span-4 space-y-6">
                  <AdminActivityFeed />
                </div>
              </div>

              {/* Bottom Operational Grid: Urgent Compliance Alerts + Top Ranking Tables + System Health */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-4">
                  <AdminUrgentAlertsPanel />
                </div>
                <div className="lg:col-span-5">
                  <AdminTopListsPanel />
                </div>
                <div className="lg:col-span-3">
                  <AdminSystemHealthPanel />
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
