import { 
  MASTER_ORDERS, 
  MASTER_VENDORS, 
  getMasterFinancialSummaries, 
  formatINR 
} from './adminFinanceEngine';

export const ADMIN_NAV_GROUPS = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    iconName: 'LayoutDashboard',
    isSingle: true
  },
  {
    id: 'catalog',
    label: 'Catalog',
    iconName: 'Boxes',
    items: [
      { id: 'products', label: 'Product Management', desc: 'Review, approve, or reject vendor product submissions.' },
      { id: 'catalog-schema', label: 'Category & Schema Management', desc: 'Category hierarchy, dynamic specification attributes, and allowed dropdown values.' },
      { id: 'brands', label: 'Brand Management', desc: 'Review and verify vendor brand requests.' }
    ]
  },
  {
    id: 'people',
    label: 'People & Merchants',
    iconName: 'Users2',
    items: [
      { id: 'customers', label: 'Customer Management', desc: 'View registered customer profiles, account details, and status.' },
      { id: 'vendors', label: 'Vendor & Seller Hub', desc: 'Vendor onboarding review, GSTIN verification, and store approval.' },
      { id: 'staff', label: 'Staff & Role Permissions', desc: 'View admin staff accounts, permissions, and active status.' }
    ]
  },
  {
    id: 'orders',
    label: 'Orders & Fulfillment',
    iconName: 'Truck',
    items: [
      { id: 'order-ops', label: 'Order Management', desc: 'Order tracking and status updates across marketplace orders.' },
      { id: 'rma', label: 'Returns, Refunds & RMA', desc: 'Review RMA return requests, inspection decisions, and refund approvals.' }
    ]
  },
  {
    id: 'finance',
    label: 'Finance & Settlement',
    iconName: 'Landmark',
    items: [
      { id: 'settlement-dash', label: 'Settlement Dashboard', desc: 'Settlement summary metrics, vendor ledger, and payout calculation.' },
      { id: 'settlement-calc', label: 'Settlement Calculation', desc: 'Calculated gross sales, commission, logistics, and net payout batches.' },
      { id: 'withdrawals', label: 'Vendor Withdrawals', desc: 'Review vendor withdrawal requests, bank payout details, and approval decisions.' },
      { id: 'tax', label: 'Tax & GSTIN Management', desc: 'GST rate rules and withholding tax compliance.' },
      { id: 'commission', label: 'Commission Matrix', desc: 'Category and tier-based commission rate matrix.' },
      { id: 'wallets', label: 'Wallet Central', desc: 'Vendor settlement wallets and ledger balances.' },
      { id: 'payments', label: 'Payment Gateway Logs', desc: 'Payment gateway transaction logs.' }
    ]
  },
  {
    id: 'insights',
    label: 'Insights & Reports',
    iconName: 'BarChart3',
    items: [
      { id: 'reports', label: 'Analytics & Financial BI', desc: 'Sales analytics and report summaries.' }
    ]
  },
  {
    id: 'platform',
    label: 'Content',
    iconName: 'ShieldAlert',
    items: [
      { id: 'cms', label: 'CMS & Homepage Builder', desc: 'Manage static pages, layout blocks, and promotional banner assets.' }
    ]
  }
];

// Dynamically compute exact financial metrics
const finSummary = getMasterFinancialSummaries();

export const ADMIN_STATS_CARDS = [
  { 
    id: 'sales', 
    label: 'Sample Batch Gross GMV', 
    value: formatINR(finSummary.totalGrossSales), 
    trend: '+18.4%', 
    isPositive: true, 
    subtext: `${finSummary.ordersCount} verified orders`, 
    iconName: 'TrendingUp' 
  },
  { 
    id: 'revenue', 
    label: 'Net Platform Revenue', 
    value: formatINR(finSummary.netPlatformRevenue), 
    trend: '+14.2%', 
    isPositive: true, 
    subtext: 'Commissions + Platform Fees', 
    iconName: 'DollarSign' 
  },
  { 
    id: 'orders', 
    label: 'Orders in Ledger', 
    value: `${finSummary.ordersCount} Orders`, 
    trend: '100% Tracked', 
    isPositive: true, 
    subtext: 'Calculated in Engine', 
    iconName: 'ShoppingBag' 
  },
  { 
    id: 'vendors', 
    label: 'Registered Vendors', 
    value: `${finSummary.vendorsCount} Merchants`, 
    trend: '4 Active • 2 Pending', 
    isPositive: true, 
    subtext: 'Across 4 States', 
    iconName: 'Store' 
  },
  { 
    id: 'customers', 
    label: 'Active Customers', 
    value: '48,290', 
    trend: '+14.1%', 
    isPositive: true, 
    subtext: '6,420 Plus VIPs', 
    iconName: 'Users' 
  },
  { 
    id: 'products', 
    label: 'Catalog SKUs', 
    value: '14,890', 
    trend: '+210', 
    isPositive: true, 
    subtext: '89.4% in stock', 
    iconName: 'Package' 
  },
  { 
    id: 'approvals', 
    label: 'Pending Vendor KYC', 
    value: `${finSummary.pendingKYCCount} Pending`, 
    trend: 'Requires Review', 
    isPositive: false, 
    isUrgent: true, 
    subtext: 'Pure Botanical & Aero', 
    iconName: 'UserCheck' 
  },
  { 
    id: 'refunds', 
    label: 'RMA Refund Requests', 
    value: `${finSummary.pendingRefundsCount} Pending`, 
    trend: 'Inspection Ready', 
    isPositive: false, 
    isUrgent: true, 
    subtext: 'Managed via RMA Central', 
    iconName: 'RotateCcw' 
  },
  { 
    id: 'settlement', 
    label: 'Disbursed Settlements', 
    value: formatINR(finSummary.totalNetSettlements), 
    trend: 'Calculated Net', 
    isPositive: true, 
    subtext: 'Exact Formula Verified', 
    iconName: 'Landmark' 
  },
  { 
    id: 'wallet', 
    label: 'Escrow Vault Balance', 
    value: '₹62.8 Lakh', 
    trend: '100% backed', 
    isPositive: true, 
    subtext: 'Zero float risk', 
    iconName: 'ShieldCheck' 
  }
];
