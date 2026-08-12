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
    label: 'Catalog & Inventory',
    iconName: 'Boxes',
    items: [
      { id: 'products', label: 'Product Management', count: 1420, desc: 'Approval, List, Bulk Import/Export, Variations, SEO, Audit Logs' },
      { id: 'categories', label: 'Category Management', count: 24, desc: 'Nested Categories, Mega Menu, Category Banner, Commission per Category' },
      { id: 'brands', label: 'Brand Management', count: 180, desc: 'Authorized Brands, Trademark Verification & Brand Storefronts' },
      { id: 'inventory', label: 'Inventory & Warehouses', count: 48, alertCount: 3, desc: 'Stock Transfer, Low Stock Alerts, Batch & Expiry Tracking' }
    ]
  },
  {
    id: 'people',
    label: 'People & Merchants',
    iconName: 'Users2',
    items: [
      { id: 'customers', label: 'Customer Management', count: 48290, desc: 'Profiles, Wallets, Reward Points, Order & Login History' },
      { id: 'vendors', label: 'Vendor & Seller Hub', count: MASTER_VENDORS.length, alertCount: 2, desc: 'Registration Approval, KYC/GST/Bank Verification, Commission, Audits' },
      { id: 'staff', label: 'Staff & Role Permissions', count: 28, desc: 'Admin Users, Role Matrix, Activity Logs & Department Config' }
    ]
  },
  {
    id: 'orders',
    label: 'Orders & Fulfillment',
    iconName: 'Truck',
    items: [
      { id: 'order-ops', label: 'Order Management', count: MASTER_ORDERS.length, alertCount: 1, desc: 'All 10 Statuses, Split & Manual Orders, Invoices, Shipping Labels' },
      { id: 'rma', label: 'Returns, Refunds & RMA', count: 1, alertCount: 1, desc: 'Return/Exchange Approval, Pickup Inspection, Gateway/Wallet Refund' },
      { id: 'logistics', label: 'Logistics & 3PL Partners', count: 6, desc: 'Shipping Partners, Rate Cards, Pickup Requests, SLA Compliance' }
    ]
  },
  {
    id: 'finance',
    label: 'Finance & Settlement',
    iconName: 'Landmark',
    items: [
      { id: 'settlement-dash', label: 'Settlement Dashboard', desc: 'Auto/Manual Settlement, Schedule, Holds, Reversals, History' },
      { id: 'settlement-calc', label: 'Settlement Calculation', desc: 'Gross Sales, Commission, Logistics, Platform Fee, TDS, TCS, Net Payout' },
      { id: 'tax', label: 'Tax & GSTIN Management', desc: 'GST/CGST/SGST/IGST, HSN/SAC, Reverse Charge, TDS/TCS Tax Invoices' },
      { id: 'commission', label: 'Commission Matrix', desc: 'Global, Category, Vendor, Brand & Product Tiered Commission Rates' },
      { id: 'wallets', label: 'Wallet Central', desc: 'Customer Wallet Balances, Cashbacks, Vendor Settlement Ledgers' },
      { id: 'payments', label: 'Payment Gateway Logs', desc: 'Gateways, Transaction Logs, Failed Payments, COD Reconciliation' },
      { id: 'withdrawals', label: 'Vendor Withdrawals', count: 2, desc: 'Withdrawal Requests, Bank Transfer Batches & Manual Approvals' }
    ]
  },
  {
    id: 'growth',
    label: 'Growth & Marketing',
    iconName: 'TrendingUp',
    items: [
      { id: 'coupons', label: 'Coupons & Promotions', count: 14, desc: 'Coupons, Cashbacks, Gift Cards, Loyalty Plus, Flash Sales, Bundles' },
      { id: 'marketing', label: 'Campaigns & Affiliates', desc: 'Email/SMS/WhatsApp/Push Broadcasts, Banners, Affiliate Program, SEO' },
      { id: 'reviews', label: 'Review & Rating Moderation', count: 320, alertCount: 3, desc: 'Product/Vendor Reviews, Spam & Fake Review Detection' }
    ]
  },
  {
    id: 'support',
    label: 'Support Desk',
    iconName: 'Headphones',
    items: [
      { id: 'tickets', label: 'Customer & Vendor Helpdesk', count: 3, alertCount: 1, desc: 'Ticket System, Live Chat, Dispute Escalation Matrix & Knowledge Base' }
    ]
  },
  {
    id: 'insights',
    label: 'Insights & Reports',
    iconName: 'BarChart3',
    items: [
      { id: 'reports', label: 'Analytics & Financial BI', desc: 'Sales, Profitability, Customer Retention, Vendor SLA & Export Center' }
    ]
  },
  {
    id: 'platform',
    label: 'Platform & Security',
    iconName: 'ShieldAlert',
    items: [
      { id: 'cms', label: 'CMS & Homepage Builder', desc: 'Pages, Visual Layout Blocks, Menus, Blogs, Header Utility Banners' },
      { id: 'notifications', label: 'Notification Center', desc: 'Templates for Email, SMS, WhatsApp, Push & In-App Alerts' },
      { id: 'ai', label: 'AI & Intelligence Engine', desc: 'Smart Search, Recommendation Models, Fraud Shield, Sales Forecast' },
      { id: 'audit', label: 'Security & Audit Logs', desc: 'Login History, IP Allowlist, Device Fingerprints, 2FA, Vault Backups' },
      { id: 'system', label: 'System Settings', desc: 'Currencies, Multi-Language, Payment APIS, Maintenance Mode Toggle' },
      { id: 'integrations', label: 'API & Integrations', desc: 'Webhooks, REST Endpoints, ERP & CRM Connectors' },
      { id: 'mobile-app', label: 'Mobile App Config', desc: 'Splash Screens, Deep Links, Push Credentials (iOS & Android)' },
      { id: 'compliance', label: 'Compliance & Legal Center', desc: 'KYC Vault, GSTIN Audit, GDPR Consent, Right-to-be-Forgotten' },
      { id: 'multi-store', label: 'Multi-Store & Global Hub', desc: 'Multi-Country Jurisdictions (India / UAE / Ireland), White-Label' }
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
    subtext: 'ORD-94826 (Sports Runners)', 
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

export const ADMIN_ACTIVITY_FEED = [
  { id: 'act-1', type: 'order', title: 'New Order #ORD-94821 Settled', desc: 'Customer Aarav Sharma • ₹4,999.00 (ANC Headphones) • MH Intrastate (CGST 9% + SGST 9%)', time: '2 mins ago', iconName: 'ShoppingBag' },
  { id: 'act-2', type: 'vendor', title: 'Vendor KYC Submitted: Pure Botanical Organics', desc: 'GSTIN 33EEEEE4444E5Z9 (Tamil Nadu) queued for compliance check', time: '8 mins ago', iconName: 'Store' },
  { id: 'act-3', type: 'refund', title: 'RMA Refund Request #ORD-94826', desc: 'Customer Zoya Khan requested return for AeroPulse Runners (₹4,299.00)', time: '18 mins ago', iconName: 'RotateCcw' },
  { id: 'act-4', type: 'stock', title: 'Low Stock Alert Triggered', desc: 'SKU-AUD-9421 fell below 5 units threshold', time: '35 mins ago', iconName: 'AlertTriangle', isUrgent: true },
  { id: 'act-5', type: 'settlement', title: 'Settlement Calculation Batch Verified', desc: `₹${finSummary.totalNetSettlements.toLocaleString('en-IN')} net remitted to merchants after TDS/TCS`, time: '1 hr ago', iconName: 'CheckCircle2' },
  { id: 'act-6', type: 'security', title: 'Admin 2FA Security Login Verified', desc: 'Super Admin session initiated from Mumbai (IP: 103.21.244.2)', time: '2 hrs ago', iconName: 'ShieldCheck' }
];

export const ADMIN_TOP_PRODUCTS = [
  { id: 'tp-1', name: 'Mytri Elite Spatial ANC Headphones', category: 'Electronics', units: 1420, revenue: '₹70.9 Lakh', rating: 4.8, image: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=200&q=80' },
  { id: 'tp-2', name: 'Ultra-Slim OLED 4K Gaming Monitor', category: 'Electronics', units: 480, revenue: '₹1.17 Cr', rating: 4.9, image: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=200&q=80' },
  { id: 'tp-3', name: 'Artisan Italian Espresso Machine', category: 'Appliances', units: 620, revenue: '₹80.5 Lakh', rating: 4.8, image: 'https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?auto=format&fit=crop&w=200&q=80' },
  { id: 'tp-4', name: 'Pro Fitness Smartwatch Series 5', category: 'Mobiles', units: 1840, revenue: '₹51.5 Lakh', rating: 4.7, image: 'https://images.unsplash.com/photo-1579586337278-3befd40fd17a?auto=format&fit=crop&w=200&q=80' }
];

export const ADMIN_TOP_VENDORS = MASTER_VENDORS.slice(0, 4);

export const ADMIN_LOW_STOCK_ALERTS = [
  { id: 'ls-1', name: 'Mytri Elite Spatial ANC Headphones', sku: 'SKU-AUD-9421', remaining: 3, threshold: 20, vendor: 'Apex Electronics Direct', isUrgent: true },
  { id: 'ls-2', name: 'Ergonomic Lumbar Executive Chair', sku: 'SKU-HOM-1024', remaining: 2, threshold: 15, vendor: 'Nordic Living', isUrgent: true },
  { id: 'ls-3', name: 'AeroPulse Lightweight Carbon Runners', sku: 'SKU-SPT-5021', remaining: 4, threshold: 25, vendor: 'Aero Athletics', isUrgent: true }
];

export const ADMIN_RECENT_REVIEWS = [
  { id: 'rv-1', product: 'Mytri Elite Spatial ANC Headphones', customer: 'Rohan Mehta', rating: 5, comment: 'Exceptional noise cancellation and battery life. Gold plus delivery arrived in 18 hours!', time: '14 mins ago' },
  { id: 'rv-2', product: 'Artisan Italian Espresso Machine', customer: 'Elena Vance', rating: 5, comment: 'Crema is rich and temperature stability is remarkable. Beautiful brass finish.', time: '1 hr ago' },
  { id: 'rv-3', product: 'Scandinavian Velvet Lounge Armchair', customer: 'Karan Singhania', rating: 4, comment: 'Sturdy oak legs and plush fabric. Looks straight out of an architectural digest shoot.', time: '3 hrs ago' }
];

export const ADMIN_SUPPORT_TICKETS = [
  { id: 'TCK-8012', subject: 'Tax Invoice GSTIN correction request', customer: 'Aarav Sharma (B2B)', priority: 'Normal', status: 'In Progress', time: '24m' },
  { id: 'TCK-8011', subject: 'Courier delayed pickup in Mumbai Hub', customer: 'Royal Heritage (Vendor)', priority: 'High', status: 'Assigned', time: '1h', isUrgent: true },
  { id: 'TCK-8009', subject: 'Inquiry on International GCC Delivery', customer: 'Zayed Al-Nahyan (UAE)', priority: 'Normal', status: 'Pending', time: '2h' }
];

export const ADMIN_SYSTEM_HEALTH = [
  { name: 'Core API Gateway', latency: '24ms', status: 'operational', uptime: '99.99%' },
  { name: 'PostgreSQL DB Primary Cluster', latency: '4ms', status: 'operational', uptime: '100%' },
  { name: 'Redis Cache & Session Pool', latency: '1ms', status: 'operational', uptime: '100%' },
  { name: 'Edge CDN CloudFront', latency: '12ms', status: 'operational', uptime: '99.98%' },
  { name: 'AI Recommendation & Fraud Engine', latency: '48ms', status: 'operational', uptime: '99.95%' }
];
