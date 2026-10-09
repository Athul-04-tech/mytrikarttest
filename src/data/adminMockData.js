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
      { id: 'products', label: 'Product Management', desc: 'Review, approve, or reject vendor product submissions in moderation queue.' },
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
      { id: 'settlement-calc', label: 'Settlement Management', desc: 'Calculated gross sales, commission, logistics fees, vendor payout batches, and settlement summaries.' },
      { id: 'withdrawals', label: 'Vendor Withdrawals', desc: 'Review vendor withdrawal requests, bank payout details, and approval decisions.' },
      { id: 'tax', label: 'Tax & GSTIN Management', desc: 'GST rate rules, TCS/TDS withholding compliance, and jurisdiction summary reports.' },
      { id: 'commission', label: 'Commission Matrix', desc: 'Category and tier-based commission rate matrix configuration.' },
      { id: 'wallets', label: 'Wallet Central', desc: 'Vendor settlement wallets, payout status, and ledger balances.' }
    ]
  },
  {
    id: 'insights',
    label: 'Insights & Reports',
    iconName: 'BarChart3',
    items: [
      { id: 'reports', label: 'Analytics & Financial BI', desc: 'Real-time sales analytics, revenue metrics, and financial report summaries.' }
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

