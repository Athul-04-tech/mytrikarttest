/**
 * Single Source of Truth for Seller Dashboard (Module 4)
 * Strict Arithmetic & Cross-Widget Consistency
 */

export const SELLER_PROFILE = {
  id: 'vnd-1',
  storeName: 'Apex Electronics Direct',
  legalName: 'Apex Tech Retail Private Limited',
  tier: 'Gold Verified Merchant',
  slaScore: 96,
  category: 'Electronics & Audio',
  rating: 4.8,
  reviewsCount: 3410,
  logo: '/products/spatial_headphones_1786529304124.png',
  bannerUrl: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=1200&q=80',
  slug: 'apex-electronics',
  bankAccount: 'HDFC Bank •••• 8492'
};

// 1. Sales Widget Data (Logically nested periods)
export const SALES_WIDGET_DATA = [
  { id: 'today', label: 'Today', amount: 18490, trend: '+14.2%', isPositive: true, sparkline: [12, 14, 11, 15, 18, 16, 18.5] },
  { id: 'yesterday', label: 'Yesterday', amount: 16200, trend: '+8.4%', isPositive: true, sparkline: [10, 12, 14, 13, 15, 16, 16.2] },
  { id: '7d', label: 'Last 7 Days', amount: 142800, trend: '+18.6%', isPositive: true, sparkline: [18, 22, 19, 24, 21, 26, 28] },
  { id: '30d', label: 'Last 30 Days', amount: 684200, trend: '+22.4%', isPositive: true, sparkline: [75, 88, 92, 105, 112, 130, 142] },
  { id: 'lifetime', label: 'Lifetime Sales', amount: 4890000, trend: 'All Time', isPositive: true, sparkline: [40, 60, 95, 140, 210, 340, 489] }
];

// 2. Earnings Widget Data (Strict Formula: Gross − Commission = Net; Pending + Paid = Net)
const grossEarnings = 684200.00;
const commissionDeducted = 68420.00; // Exact 10%
const netEarnings = grossEarnings - commissionDeducted; // 615780.00
const pendingSettlement = 84200.00;
const paidSettlement = netEarnings - pendingSettlement; // 531580.00

export const EARNINGS_WIDGET_DATA = {
  grossEarnings,
  commissionRate: 0.10, // 10%
  commissionDeducted,
  netEarnings,
  pendingSettlement,
  paidSettlement,
  nextPayoutDate: 'Friday, 15 Aug 2026',
  settlementBatchId: 'MK-ST-2026-8841'
};

// 3. Orders Widget Data
export const ORDERS_WIDGET_DATA = {
  counts: [
    { id: 'new', label: 'New Orders', count: 6, isHighlight: true },
    { id: 'processing', label: 'Processing', count: 12, isHighlight: false },
    { id: 'completed', label: 'Completed (30D)', count: 142, isHighlight: false },
    { id: 'cancelled', label: 'Cancelled', count: 3, isUrgent: false },
    { id: 'refunded', label: 'Refunded (RMA)', count: 1, isUrgent: false }
  ],
  recentOrders: [
    {
      id: 'ORD-94821',
      productName: 'Mytri Elite Spatial ANC Wireless Headphones',
      thumbnail: '/products/spatial_headphones_1786529304124.png',
      customerName: 'Aarav Sharma',
      location: 'Mumbai, MH',
      date: 'Today, 14:32',
      amount: 4999.00,
      status: 'Delivered',
      statusType: 'success'
    },
    {
      id: 'ORD-94822',
      productName: 'Ultra-Slim OLED 4K 32" Curved Gaming Monitor',
      thumbnail: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=200&q=80',
      customerName: 'Priya Patel',
      location: 'Bengaluru, KA',
      date: 'Today, 09:15',
      amount: 24499.00,
      status: 'Shipped',
      statusType: 'info'
    },
    {
      id: 'ORD-94828',
      productName: 'AeroKey RGB Wireless Mechanical Keyboard',
      thumbnail: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=200&q=80',
      customerName: 'Rohan Mehta',
      location: 'Pune, MH',
      date: 'Yesterday, 18:40',
      amount: 3499.00,
      status: 'Processing',
      statusType: 'warning'
    },
    {
      id: 'ORD-94829',
      productName: 'ProStream 4K Ultra-HD Webcam with Dual Mics',
      thumbnail: 'https://images.unsplash.com/photo-1585338107529-13afc5f02586?auto=format&fit=crop&w=200&q=80',
      customerName: 'Karan Singhania',
      location: 'Delhi, DL',
      date: 'Yesterday, 16:10',
      amount: 2899.00,
      status: 'New',
      statusType: 'highlight'
    },
    {
      id: 'ORD-94830',
      productName: 'HyperPrecision Ergonomic Wireless Gaming Mouse',
      thumbnail: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?auto=format&fit=crop&w=200&q=80',
      customerName: 'Meera Iyer',
      location: 'Chennai, TN',
      date: '10 Aug 2026',
      amount: 1899.00,
      status: 'Delivered',
      statusType: 'success'
    }
  ]
};

// 4. Products Widget Data (Low Stock / Out of Stock uses brick-red urgency)
export const PRODUCTS_WIDGET_DATA = {
  counts: [
    { id: 'published', label: 'Published', count: 48, isHighlight: false },
    { id: 'pending', label: 'Pending Approval', count: 2, isHighlight: true },
    { id: 'draft', label: 'Drafts', count: 4, isHighlight: false },
    { id: 'low-stock', label: 'Low Stock', count: 3, isUrgent: true },
    { id: 'out-of-stock', label: 'Out of Stock', count: 1, isUrgent: true }
  ],
  needsAttention: [
    {
      id: 'prod-attn-1',
      name: 'Mytri Elite Spatial ANC Wireless Headphones (Matte Emerald)',
      sku: 'SKU-AUD-9421',
      thumbnail: '/products/spatial_headphones_1786529304124.png',
      issue: 'Low Stock: Only 3 units remaining',
      type: 'low-stock',
      currentStock: 3,
      threshold: 20,
      actionText: 'Restock Inventory',
      price: '₹4,999'
    },
    {
      id: 'prod-attn-2',
      name: 'Ultra-Slim OLED 4K 32" Curved Gaming Monitor',
      sku: 'SKU-MON-8812',
      thumbnail: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=200&q=80',
      issue: 'Low Stock: Only 2 units remaining',
      type: 'low-stock',
      currentStock: 2,
      threshold: 15,
      actionText: 'Restock Inventory',
      price: '₹24,499'
    },
    {
      id: 'prod-attn-3',
      name: 'Titanium Magnetic Wireless Fast Charging Pad',
      sku: 'SKU-CHG-3310',
      thumbnail: 'https://images.unsplash.com/photo-1586953208448-b95a79798f07?auto=format&fit=crop&w=200&q=80',
      issue: 'Out of Stock: 0 units available',
      type: 'out-of-stock',
      currentStock: 0,
      threshold: 10,
      actionText: 'Restock Inventory',
      price: '₹1,999'
    },
    {
      id: 'prod-attn-4',
      name: 'Noise-Cancelling USB Condenser Podcast Mic (Gold Edition)',
      sku: 'SKU-MIC-7712',
      thumbnail: 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?auto=format&fit=crop&w=200&q=80',
      issue: 'Pending Compliance Review by Admin',
      type: 'pending-approval',
      currentStock: 50,
      threshold: 0,
      actionText: 'Edit Listing',
      price: '₹3,899'
    }
  ]
};

// 5. Customer Widget Data
export const CUSTOMER_WIDGET_DATA = [
  { id: 'new-cust', label: 'New Customers (30D)', count: 84, trend: '+18%', subtext: 'First-time buyers', iconName: 'UserPlus' },
  { id: 'repeat-cust', label: 'Repeat Customers', count: 58, trend: '41% Rate', subtext: 'Loyal brand shoppers', iconName: 'Users' },
  { id: 'unread-msg', label: 'Unread Messages', count: 4, hasBadge: true, badgeColor: 'gold', subtext: 'Awaiting reply', iconName: 'MessageSquare' },
  { id: 'questions', label: 'Product Q&A', count: 2, hasBadge: true, badgeColor: 'gold', subtext: 'Pre-purchase queries', iconName: 'HelpCircle' }
];

export const formatSellerINR = (val) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(val);
};
