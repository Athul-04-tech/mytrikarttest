export const USER_PROFILE = {
  fullName: "Aarav Sharma",
  email: "aarav.sharma@example.com",
  isEmailVerified: true,
  mobile: "+91 98765 43210",
  isMobileVerified: true,
  dob: "1994-08-15",
  gender: "Male",
  preferredLanguage: "English (UK)",
  preferredCurrency: "INR (₹) - Indian Rupee",
  newsletterSubscribed: true,
  avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80",
  memberSince: "March 2023",
  loyaltyLevel: "Gold Plus",
  loyaltyPoints: 2450,
  walletBalance: 4850.00,
  businessDetails: {
    isBusinessAccount: true,
    companyName: "Sharma Artisan Technologies Pvt Ltd",
    gstin: "27AAACS1429B1ZB",
    pan: "AAACS1429B"
  }
};

export const SAVED_ADDRESSES = [
  {
    id: "addr-1",
    type: "Home",
    name: "Aarav Sharma",
    phone: "+91 98765 43210",
    addressLine1: "Flat 402, Emerald Heights, Linking Road",
    landmark: "Near National Park Sanctuary",
    city: "Mumbai",
    state: "Maharashtra",
    pincode: "400050",
    country: "India",
    isDefaultShipping: true,
    isDefaultBilling: true,
    instructions: "Please leave package with building security if unattended."
  },
  {
    id: "addr-2",
    type: "Office",
    name: "Aarav Sharma (Studio)",
    phone: "+91 98765 43211",
    addressLine1: "Tower B, Level 6, Tech Grand Park, Whitefield",
    landmark: "Opposite Metro Station Gate 2",
    city: "Bengaluru",
    state: "Karnataka",
    pincode: "560066",
    country: "India",
    isDefaultShipping: false,
    isDefaultBilling: false,
    instructions: "Deliver strictly between 9 AM to 6 PM on weekdays."
  }
];

export const MOCK_ORDERS = [
  {
    id: "ORD-94821",
    date: "10 Aug 2026",
    total: "₹4,999.00",
    status: "Out for Delivery",
    statusType: "processing", // 'processing' | 'delivered' | 'cancelled' | 'return'
    itemCount: 1,
    items: [
      {
        name: "Mytri Elite Spatial ANC Wireless Headphones",
        seller: "SoundCraft Premier",
        image: "https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=200&q=80",
        price: "₹4,999",
        qty: 1
      }
    ],
    estimatedDelivery: "Today by 6:00 PM",
    canReturn: false,
    canCancel: true
  },
  {
    id: "ORD-89310",
    date: "28 Sep 2026",
    created_at: "2026-09-28T10:15:00Z",
    total: "₹3,299.00",
    status: "Delivered",
    statusType: "delivered",
    itemCount: 1,
    items: [
      {
        name: "Artisan Genuine Leather Chronograph Watch",
        seller: "Artisan Heritage Store",
        image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=200&q=80",
        price: "₹3,299",
        qty: 1,
        productId: 2
      }
    ],
    trackingStep: 5,
    deliveredOn: "01 Oct 2026",
    canReturn: true,
    canCancel: false
  },
  {
    id: "ORD-76112",
    date: "14 Jun 2026",
    created_at: "2026-06-14T12:30:00Z",
    total: "₹1,199.00",
    status: "Delivered",
    statusType: "delivered",
    itemCount: 1,
    items: [
      {
        name: "Botanical Restorative Facial Serum (50ml)",
        seller: "Pure Flora Naturals",
        image: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=200&q=80",
        price: "₹1,199",
        qty: 1,
        productId: 3
      }
    ],
    trackingStep: 5,
    deliveredOn: "17 Jun 2026",
    canReturn: false,
    canCancel: false
  },
  {
    id: "ORD-65201",
    date: "02 May 2026",
    created_at: "2026-05-02T09:00:00Z",
    total: "₹24,499.00",
    status: "Cancelled",
    statusType: "cancelled",
    itemCount: 1,
    items: [
      {
        name: "Ultra-Slim OLED 4K 32\" Curved Gaming Monitor",
        seller: "Apex Displays Global",
        image: "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=200&q=80",
        price: "₹24,499",
        qty: 1,
        productId: 4
      }
    ],
    trackingStep: 1,
    cancelledReason: "Customer requested cancellation before dispatch",
    canReturn: false,
    canCancel: false
  },
  {
    id: "ORD-58309",
    date: "18 Mar 2026",
    created_at: "2026-03-18T16:45:00Z",
    total: "₹2,499.00",
    status: "Returned",
    statusType: "returned",
    itemCount: 1,
    items: [
      {
        name: "Ergonomic Memory Foam Lumbar Support Cushion",
        seller: "PostureCraft Life",
        image: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=200&q=80",
        price: "₹2,499",
        qty: 1,
        productId: 5
      }
    ],
    trackingStep: 5,
    returnedOn: "24 Mar 2026",
    refundStatus: "Full Refund of ₹2,499 Credited to Wallet",
    canReturn: false,
    canCancel: false
  },
  {
    id: "ORD-44912",
    date: "12 Nov 2025",
    created_at: "2025-11-12T11:20:00Z",
    total: "₹7,899.00",
    status: "Delivered",
    statusType: "delivered",
    itemCount: 2,
    items: [
      {
        name: "Handcrafted Pure Brass Diwali Puja Thali Set",
        seller: "Artisan Heritage Store",
        image: "https://images.unsplash.com/photo-1606293926075-69a00dbfde81?auto=format&fit=crop&w=200&q=80",
        price: "₹4,899",
        qty: 1,
        productId: 6
      },
      {
        name: "Organic Himalayan Cedarwood Essential Oil (30ml)",
        seller: "Pure Flora Naturals",
        image: "https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?auto=format&fit=crop&w=200&q=80",
        price: "₹3,000",
        qty: 1,
        productId: 7
      }
    ],
    trackingStep: 5,
    deliveredOn: "16 Nov 2025",
    canReturn: false,
    canCancel: false
  },
  {
    id: "ORD-33104",
    date: "04 May 2024",
    created_at: "2024-05-04T15:10:00Z",
    total: "₹1,850.00",
    status: "Delivered",
    statusType: "delivered",
    itemCount: 1,
    items: [
      {
        name: "Vintage Ceramic Tea Infuser Mug with Bamboo Lid",
        seller: "Clay & Kiln Studio",
        image: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=200&q=80",
        price: "₹1,850",
        qty: 1,
        productId: 8
      }
    ],
    trackingStep: 5,
    deliveredOn: "09 May 2024",
    canReturn: false,
    canCancel: false
  }
];

export const AVAILABLE_COUPONS = [
  {
    code: 'WELCOME100',
    title: 'Flat ₹100 Off First Order',
    discountType: 'flat',
    discountAmount: 100,
    minSpend: 499,
    maxDiscount: 100,
    expiresAt: '2026-12-31',
    description: 'Welcome to MytriKart! Get flat ₹100 instant discount on your first order above ₹499.',
    terms: 'Valid on all product categories. One-time redemption per customer account. Cannot be combined with other promotional codes.',
    category: 'all',
    tag: 'FIRST ORDER',
    isAvailable: true
  },
  {
    code: 'SAVE10',
    title: '10% Instant Marketplace Discount',
    discountType: 'percentage',
    discountPercent: 10,
    minSpend: 999,
    maxDiscount: 500,
    expiresAt: '2026-11-30',
    description: 'Save 10% on orders above ₹999 across top verified brand collections.',
    terms: 'Maximum discount ₹500. Applicable on Electronics, Fashion, Artisanal Crafts, and Home Decor.',
    category: 'all',
    tag: 'POPULAR',
    isAvailable: true
  },
  {
    code: 'FESTIVE20',
    title: '20% Mega Festive Savings',
    discountType: 'percentage',
    discountPercent: 20,
    minSpend: 1999,
    maxDiscount: 1000,
    expiresAt: '2026-10-31',
    description: 'Enjoy 20% savings up to ₹1,000 on festive artisan specials and flagship electronics.',
    terms: 'Valid on minimum cart value of ₹1,999. Applicable once per verified customer.',
    category: 'festive',
    tag: 'FESTIVE SPECIAL',
    isAvailable: true
  },
  {
    code: 'FREESHIP',
    title: '100% Free Express Shipping',
    discountType: 'shipping',
    discountAmount: 40,
    minSpend: 399,
    maxDiscount: 40,
    expiresAt: '2026-12-31',
    description: 'Zero express shipping fee on any order above ₹399 delivered to your doorstep.',
    terms: 'Valid across all delivery pincodes in India. Instant automatic deduction at checkout.',
    category: 'shipping',
    tag: 'FREE DELIVERY',
    isAvailable: true
  },
  {
    code: 'SUPER500',
    title: 'Flat ₹500 Off Luxury & Audio',
    discountType: 'flat',
    discountAmount: 500,
    minSpend: 4999,
    maxDiscount: 500,
    expiresAt: '2026-11-15',
    description: 'Special ₹500 savings on flagship audio gear, laptops, and premium accessories.',
    terms: 'Minimum cart value ₹4,999. Valid on verified premier seller items.',
    category: 'electronics',
    tag: 'FLAGSHIP',
    isAvailable: true
  },
  {
    code: 'PLUSGOLD',
    title: 'Extra 15% VIP Member Voucher',
    discountType: 'percentage',
    discountPercent: 15,
    minSpend: 1499,
    maxDiscount: 750,
    expiresAt: '2026-12-15',
    description: 'Exclusive 15% discount voucher for MytriKart Plus and VIP loyalty patrons.',
    terms: 'Requires active Gold/Plus loyalty tier. Compatible with standard seller warranty.',
    category: 'vip',
    tag: 'VIP EXCLUSIVE',
    isAvailable: true
  },
  {
    code: 'EXPIRED50',
    title: '50% Monsoon Flash Voucher',
    discountType: 'percentage',
    discountPercent: 50,
    minSpend: 2999,
    maxDiscount: 1500,
    expiresAt: '2026-07-31',
    description: 'Seasonal 50% discount voucher for Monsoon Clearance Sale.',
    terms: 'Campaign concluded on 31 July 2026.',
    category: 'seasonal',
    tag: 'EXPIRED',
    isAvailable: false
  },
  {
    code: 'NEWUSER50',
    title: 'Flat ₹50 Early Sign Up Bonus',
    discountType: 'flat',
    discountAmount: 50,
    minSpend: 299,
    maxDiscount: 50,
    expiresAt: '2026-06-30',
    description: 'Early sign up reward voucher.',
    terms: 'Successfully redeemed on Order #ORD-76112.',
    category: 'redeemed',
    tag: 'ALREADY USED',
    isAvailable: false
  }
];

export const MOCK_REFUNDS = [
  {
    id: "REF-4029",
    orderId: "ORD-65201",
    productName: "Ultra-Slim OLED 4K 32\" Curved Gaming Monitor",
    amount: "₹24,499.00",
    destination: "Mytri Wallet (Instant Credit)",
    status: "Completed",
    timelineStep: 4, // 1: Requested, 2: Approved, 3: Processing, 4: Completed
    requestDate: "02 May 2026",
    completedDate: "03 May 2026"
  },
  {
    id: "REF-3118",
    orderId: "ORD-51920",
    productName: "Smart Fitness Watch Series 5 GPS",
    amount: "₹2,799.00",
    destination: "Original Payment (HDFC Credit Card **4821)",
    status: "Processing",
    timelineStep: 3,
    requestDate: "08 Aug 2026",
    estimatedCompletion: "14 Aug 2026"
  }
];

export const MOCK_WARRANTIES = [
  {
    id: "WAR-8819",
    productName: "Mytri Elite Spatial ANC Wireless Headphones",
    serialNumber: "SN-ANC-2026-994821",
    purchaseDate: "10 Aug 2026",
    warrantyExpiry: "10 Aug 2028 (2 Years Brand Warranty)",
    status: "Active",
    coverage: "Comprehensive Hardware & Battery",
    serviceCenter: {
      name: "MytriCare Authorized Central Hub",
      address: "Ground Floor, Prism Complex, Bandra West, Mumbai 400050",
      phone: "1800-419-8822",
      timings: "10:00 AM – 7:30 PM (Mon-Sat)"
    }
  },
  {
    id: "WAR-5520",
    productName: "15-Bar Artisan Italian Espresso Coffee Machine",
    serialNumber: "SN-ESP-2025-410294",
    purchaseDate: "15 Dec 2025",
    warrantyExpiry: "15 Dec 2027 (18 Months Remaining)",
    status: "Active",
    coverage: "Pump, Heating Element & Steam Wand",
    serviceCenter: {
      name: "Artisan Appliances Support Center",
      address: "Unit 12, Indiranagar 100ft Road, Bengaluru 560038",
      phone: "1800-220-4499",
      timings: "9:30 AM – 6:30 PM (All Days)"
    }
  }
];

export const MOCK_TRANSACTIONS = [
  {
    id: "TXN-7721",
    date: "03 May 2026",
    type: "Refund Credit",
    description: "Refund for cancelled order #ORD-65201",
    amount: "+₹24,499.00",
    isCredit: true,
    runningBalance: "₹24,850.00"
  },
  {
    id: "TXN-6610",
    date: "14 Jun 2026",
    type: "Spent",
    description: "Paid for Order #ORD-76112 (Botanical Serum)",
    amount: "-₹1,199.00",
    isCredit: false,
    runningBalance: "₹23,651.00"
  },
  {
    id: "TXN-5541",
    date: "28 Jul 2026",
    type: "Spent",
    description: "Paid for Order #ORD-89310 (Leather Chrono Watch)",
    amount: "-₹3,299.00",
    isCredit: false,
    runningBalance: "₹20,352.00"
  },
  {
    id: "TXN-4420",
    date: "10 Aug 2026",
    type: "Spent",
    description: "Paid for Order #ORD-94821 (ANC Headphones)",
    amount: "-₹4,999.00",
    isCredit: false,
    runningBalance: "₹4,850.00"
  },
  {
    id: "TXN-3301",
    date: "11 Aug 2026",
    type: "Cashback",
    description: "Mytri Plus Gold Cashback 5% Reward",
    amount: "+₹250.00",
    isCredit: true,
    runningBalance: "₹4,850.00"
  }
];

export const MOCK_REWARDS = {
  currentPoints: 2450,
  tier: "Gold Plus",
  pointsToNextTier: 550,
  nextTier: "Platinum VIP",
  tierProgressPercent: 82,
  referralCode: "MYTRI-GOLD-774",
  birthdayGiftUnlocked: true,
  redemptionCatalogue: [
    { id: "RC-1", title: "₹500 Mytri Marketplace Voucher", cost: "500 Coins", tag: "Most Popular" },
    { id: "RC-2", title: "₹1,000 Luxury Fashion Store Pass", cost: "950 Coins", tag: "Save 50 Coins" },
    { id: "RC-3", title: "Free Express Shipping on Next 10 Orders", cost: "300 Coins", tag: "Best Value" },
    { id: "RC-4", title: "6 Months Coffee Subscription Privilege", cost: "1,800 Coins", tag: "Exclusive" }
  ]
};

export const MOCK_NOTIFICATIONS = [
  {
    id: "notif-order",
    title: "Order & Purchase Updates",
    description: "Receipts, dispatch notices, and OTPs for secure delivery.",
    channels: { push: true, sms: true, email: true, whatsapp: true }
  },
  {
    id: "notif-shipping",
    title: "Shipping & Transit Milestones",
    description: "Real-time tracking notifications when your order reaches intermediate hubs.",
    channels: { push: true, sms: false, email: true, whatsapp: true }
  },
  {
    id: "notif-delivery",
    title: "Out for Delivery & Arrival Alerts",
    description: "Alerts when our courier is within 30 minutes of your doorstep.",
    channels: { push: true, sms: true, email: false, whatsapp: true }
  },
  {
    id: "notif-refunds",
    title: "Refund & Return Status Updates",
    description: "Immediate alerts upon refund approval and bank account dispatches.",
    channels: { push: true, sms: true, email: true, whatsapp: false }
  },
  {
    id: "notif-offers",
    title: "Promotional Deals & Flash Sales",
    description: "Curated weekly sales, Gold Plus member specials, and category discounts.",
    channels: { push: false, sms: false, email: true, whatsapp: false }
  },
  {
    id: "notif-wishlist",
    title: "Wishlist & Price Drop Alerts",
    description: "Notifies you instantly when an item in your wishlist drops in price.",
    channels: { push: true, sms: false, email: true, whatsapp: false }
  },
  {
    id: "notif-stock",
    title: "Back in Stock Notifications",
    description: "Instant notification when currently unavailable items return to stock.",
    channels: { push: true, sms: false, email: true, whatsapp: false }
  }
];

export const MOCK_TICKETS = [
  {
    id: "TCK-9921",
    date: "08 Aug 2026",
    subject: "Estimated delivery schedule for order #ORD-94821",
    category: "Delivery Query",
    status: "Resolved",
    lastReply: "Support Agent Priya confirmed package is on schedule for delivery."
  },
  {
    id: "TCK-8814",
    date: "15 Jul 2026",
    subject: "Invoice GST tax credit receipt download inquiry",
    category: "Billing & Invoicing",
    status: "Closed",
    lastReply: "B2B Tax invoice PDF regenerated and emailed successfully."
  }
];
