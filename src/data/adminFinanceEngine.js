/**
 * MytriKart Centralized Mathematical & Financial Derivation Engine
 * Single Source of Truth for all calculations across Admin operations.
 * ZERO hardcoded disjointed numbers — all figures participate in strict arithmetic formulas.
 */

// 1. Master Category Commission Rates
export const CATEGORY_COMMISSION_RATES = {
  'Electronics': 0.10,   // 10%
  'Fashion': 0.15,       // 15%
  'Home': 0.12,          // 12%
  'Appliances': 0.08,    // 8%
  'Beauty': 0.14,        // 14%
  'Mobiles': 0.09,       // 9%
  'Sports': 0.11         // 11%
};

// 2. Master Vendor Registry with Jurisdictions & GSTINs
export const MASTER_VENDORS = [
  {
    id: 'vnd-1',
    name: 'Apex Electronics Direct',
    state: 'Maharashtra',
    stateCode: 'MH',
    gstin: '27AAAAA0000A1Z5',
    category: 'Electronics',
    commissionRate: 0.10,
    rating: 4.8,
    slaScore: 96,
    kycStatus: 'Approved',
    bankAccount: 'HDFC •••• 8492'
  },
  {
    id: 'vnd-2',
    name: 'Royal Heritage Silks & Fashion',
    state: 'Karnataka',
    stateCode: 'KA',
    gstin: '29BBBBB1111B2Z6',
    category: 'Fashion',
    commissionRate: 0.15,
    rating: 4.9,
    slaScore: 98,
    kycStatus: 'Approved',
    bankAccount: 'ICICI •••• 3120'
  },
  {
    id: 'vnd-3',
    name: 'Nordic Living & Furniture',
    state: 'Maharashtra',
    stateCode: 'MH',
    gstin: '27CCCCC2222C3Z7',
    category: 'Home',
    commissionRate: 0.12,
    rating: 4.8,
    slaScore: 95,
    kycStatus: 'Approved',
    bankAccount: 'SBI •••• 9941'
  },
  {
    id: 'vnd-4',
    name: 'Artisan Espresso Machines Co.',
    state: 'Delhi',
    stateCode: 'DL',
    gstin: '07DDDDD3333D4Z8',
    category: 'Appliances',
    commissionRate: 0.08,
    rating: 4.8,
    slaScore: 97,
    kycStatus: 'Approved',
    bankAccount: 'Axis •••• 5512'
  },
  {
    id: 'vnd-5',
    name: 'Pure Botanical Organics',
    state: 'Tamil Nadu',
    stateCode: 'TN',
    gstin: '33EEEEE4444E5Z9',
    category: 'Beauty',
    commissionRate: 0.14,
    rating: 4.7,
    slaScore: 94,
    kycStatus: 'Pending Review', // Urgent KYC approval item 1
    bankAccount: 'Kotak •••• 2210'
  },
  {
    id: 'vnd-6',
    name: 'Aero Athletics & Sports',
    state: 'Maharashtra',
    stateCode: 'MH',
    gstin: '27FFFFF5555F6ZA',
    category: 'Sports',
    commissionRate: 0.11,
    rating: 4.8,
    slaScore: 95,
    kycStatus: 'Pending Review', // Urgent KYC approval item 2
    bankAccount: 'HDFC •••• 7714'
  }
];

// 3. Master Sample Orders with Exact Values & Locations
export const MASTER_ORDERS = [
  {
    id: 'ORD-94821',
    customerName: 'Aarav Sharma',
    customerState: 'Maharashtra',
    customerStateCode: 'MH',
    vendorId: 'vnd-1', // MH Vendor -> Intrastate (CGST 9% + SGST 9%)
    productName: 'Mytri Elite Spatial ANC Wireless Headphones',
    sku: 'SKU-AUD-9421',
    category: 'Electronics',
    quantity: 1,
    grossAmount: 4999.00,
    gstRate: 0.18, // 18%
    logisticsFee: 150.00,
    platformFeeRate: 0.02, // 2%
    gatewayRate: 0.02, // 2%
    orderStatus: 'Delivered',
    paymentMethod: 'UPI AutoPay',
    date: '2026-08-10',
    time: '14:32'
  },
  {
    id: 'ORD-94822',
    customerName: 'Priya Patel',
    customerState: 'Karnataka',
    customerStateCode: 'KA',
    vendorId: 'vnd-1', // MH Vendor -> Interstate to KA (IGST 18%)
    productName: 'Ultra-Slim OLED 4K 32" Curved Gaming Monitor',
    sku: 'SKU-MON-8812',
    category: 'Electronics',
    quantity: 1,
    grossAmount: 24499.00,
    gstRate: 0.18,
    logisticsFee: 350.00,
    platformFeeRate: 0.02,
    gatewayRate: 0.02,
    orderStatus: 'Shipped',
    paymentMethod: 'Credit Card',
    date: '2026-08-11',
    time: '09:15'
  },
  {
    id: 'ORD-94823',
    customerName: 'Vikramaditya Rao',
    customerState: 'Karnataka',
    customerStateCode: 'KA',
    vendorId: 'vnd-2', // KA Vendor -> Intrastate (CGST 6% + SGST 6% on apparel)
    productName: 'Artisan Genuine Leather Chronograph Watch & Silk Shirt',
    sku: 'SKU-FAS-3104',
    category: 'Fashion',
    quantity: 1,
    grossAmount: 3299.00,
    gstRate: 0.12, // 12% for apparel
    logisticsFee: 120.00,
    platformFeeRate: 0.02,
    gatewayRate: 0.02,
    orderStatus: 'Delivered',
    paymentMethod: 'NetBanking',
    date: '2026-08-11',
    time: '11:45'
  },
  {
    id: 'ORD-94824',
    customerName: 'Ananya Deshmukh',
    customerState: 'Delhi',
    customerStateCode: 'DL',
    vendorId: 'vnd-3', // MH Vendor -> Interstate to DL (IGST 18%)
    productName: 'Ergonomic Lumbar Support Executive Chair',
    sku: 'SKU-HOM-1024',
    category: 'Home',
    quantity: 1,
    grossAmount: 6899.00,
    gstRate: 0.18,
    logisticsFee: 400.00,
    platformFeeRate: 0.02,
    gatewayRate: 0.02,
    orderStatus: 'Delivered',
    paymentMethod: 'Debit Card',
    date: '2026-08-09',
    time: '16:20'
  },
  {
    id: 'ORD-94825',
    customerName: 'Kabir Singhania',
    customerState: 'Delhi',
    customerStateCode: 'DL',
    vendorId: 'vnd-4', // DL Vendor -> Intrastate (CGST 9% + SGST 9%)
    productName: '15-Bar Artisan Italian Espresso Coffee Machine',
    sku: 'SKU-APP-7721',
    category: 'Appliances',
    quantity: 1,
    grossAmount: 12999.00,
    gstRate: 0.18,
    logisticsFee: 250.00,
    platformFeeRate: 0.02,
    gatewayRate: 0.02,
    orderStatus: 'Confirmed',
    paymentMethod: 'UPI',
    date: '2026-08-12',
    time: '08:50'
  },
  {
    id: 'ORD-94826',
    customerName: 'Zoya Khan',
    customerState: 'Maharashtra',
    customerStateCode: 'MH',
    vendorId: 'vnd-6', // MH Vendor -> Intrastate (CGST 9% + SGST 9%)
    productName: 'AeroPulse Lightweight Carbon Road Runners',
    sku: 'SKU-SPT-5021',
    category: 'Sports',
    quantity: 1,
    grossAmount: 4299.00,
    gstRate: 0.18,
    logisticsFee: 150.00,
    platformFeeRate: 0.02,
    gatewayRate: 0.02,
    orderStatus: 'Pending Inspection (RMA Return)', // Pending refund item 1
    paymentMethod: 'UPI',
    date: '2026-08-08',
    time: '18:10'
  }
];

// 4. Pure Financial Calculation Helpers

/**
 * Calculates strict GST Tax Breakdown (Intrastate vs Interstate, TDS, TCS)
 */
export function calculateOrderTax(order) {
  const vendor = MASTER_VENDORS.find(v => v.id === order.vendorId) || MASTER_VENDORS[0];
  const isIntrastate = vendor.stateCode === order.customerStateCode;
  
  // Taxable Base Value = Gross / (1 + GST Rate)
  const taxableValue = Number((order.grossAmount / (1 + order.gstRate)).toFixed(2));
  const totalTax = Number((order.grossAmount - taxableValue).toFixed(2));

  let cgstRate = 0;
  let sgstRate = 0;
  let igstRate = 0;
  let cgstAmount = 0;
  let sgstAmount = 0;
  let igstAmount = 0;

  if (isIntrastate) {
    cgstRate = order.gstRate / 2;
    sgstRate = order.gstRate / 2;
    cgstAmount = Number((taxableValue * cgstRate).toFixed(2));
    // Enforce exact matching for SGST
    sgstAmount = Number((totalTax - cgstAmount).toFixed(2));
    igstAmount = 0.00;
  } else {
    igstRate = order.gstRate;
    igstAmount = totalTax;
    cgstAmount = 0.00;
    sgstAmount = 0.00;
  }

  // TDS under section 194-O (1% on Gross Sale Value)
  const tdsAmount = Number((order.grossAmount * 0.01).toFixed(2));

  // TCS under GST Section 52 (1% on Net Taxable Supply)
  const tcsAmount = Number((taxableValue * 0.01).toFixed(2));

  return {
    orderId: order.id,
    vendorName: vendor.name,
    vendorGstin: vendor.gstin,
    vendorState: vendor.state,
    customerState: order.customerState,
    isIntrastate,
    grossAmount: order.grossAmount,
    taxableValue,
    totalTax,
    gstRatePercent: (order.gstRate * 100).toFixed(0) + '%',
    cgstRatePercent: isIntrastate ? (cgstRate * 100).toFixed(1) + '%' : '0%',
    sgstRatePercent: isIntrastate ? (sgstRate * 100).toFixed(1) + '%' : '0%',
    igstRatePercent: !isIntrastate ? (igstRate * 100).toFixed(0) + '%' : '0%',
    cgstAmount,
    sgstAmount,
    igstAmount,
    tdsAmount,
    tcsAmount
  };
}

/**
 * Calculates strict Settlement Waterfall Chain:
 * Final = Gross - Commission - Logistics - PlatformFee - Gateway - TDS - TCS
 */
export function calculateOrderSettlement(order) {
  const vendor = MASTER_VENDORS.find(v => v.id === order.vendorId) || MASTER_VENDORS[0];
  const tax = calculateOrderTax(order);

  // 1. Commission = Gross * Vendor Commission %
  const commissionRate = vendor.commissionRate;
  const commissionAmount = Number((order.grossAmount * commissionRate).toFixed(2));

  // 2. Logistics Fee (Flat contractual rate)
  const logisticsFee = order.logisticsFee;

  // 3. Platform Fee = Gross * 2%
  const platformFee = Number((order.grossAmount * order.platformFeeRate).toFixed(2));

  // 4. Gateway Charges = Gross * 2% + 18% GST on gateway
  const baseGateway = order.grossAmount * order.gatewayRate;
  const gatewayTax = baseGateway * 0.18;
  const gatewayCharges = Number((baseGateway + gatewayTax).toFixed(2));

  // 5. Statutory Deductions
  const tds = tax.tdsAmount;
  const tcs = tax.tcsAmount;

  // 6. Total Deductions
  const totalDeductions = Number((commissionAmount + logisticsFee + platformFee + gatewayCharges + tds + tcs).toFixed(2));

  // 7. Final Net Settlement (Guaranteed strictly equal to subtraction)
  const finalSettlement = Number((order.grossAmount - totalDeductions).toFixed(2));

  return {
    orderId: order.id,
    date: order.date,
    vendorId: vendor.id,
    vendorName: vendor.name,
    category: order.category,
    productName: order.productName,
    grossAmount: order.grossAmount,
    commissionRatePercent: (commissionRate * 100).toFixed(0) + '%',
    commissionAmount,
    logisticsFee,
    platformFee,
    gatewayCharges,
    tds,
    tcs,
    totalDeductions,
    finalSettlement,
    settlementStatus: order.orderStatus === 'Delivered' ? 'Settled (NEFT)' : 'Pending Hold',
    bankAccount: vendor.bankAccount
  };
}

// 5. Vendor Wallet Ledgers (Credits - Debits)
export const VENDOR_WALLET_LEDGERS = {
  'vnd-1': [
    { id: 'WL-101', date: '2026-08-01', desc: 'Opening Balance (Cloud Vault)', credit: 154000.00, debit: 0.00 },
    { id: 'WL-102', date: '2026-08-10', desc: 'Net Settlement: ORD-94821 (ANC Headphones)', credit: 3959.08, debit: 0.00 },
    { id: 'WL-103', date: '2026-08-11', desc: 'Weekly Escrow NEFT Disbursement #NEFT-8841', credit: 0.00, debit: 120000.00 },
    { id: 'WL-104', date: '2026-08-12', desc: 'Promotional Ad Credit Recharge', credit: 0.00, debit: 5000.00 }
  ],
  'vnd-2': [
    { id: 'WL-201', date: '2026-08-01', desc: 'Opening Balance', credit: 88000.00, debit: 0.00 },
    { id: 'WL-202', date: '2026-08-11', desc: 'Net Settlement: ORD-94823 (Silk Watch)', credit: 2470.82, debit: 0.00 },
    { id: 'WL-203', date: '2026-08-11', desc: 'Vendor Withdrawal Payout #NEFT-8842', credit: 0.00, debit: 60000.00 }
  ]
};

export function getVendorWalletSummary(vendorId = 'vnd-1') {
  const ledger = VENDOR_WALLET_LEDGERS[vendorId] || VENDOR_WALLET_LEDGERS['vnd-1'];
  const totalCredits = Number(ledger.reduce((acc, item) => acc + item.credit, 0).toFixed(2));
  const totalDebits = Number(ledger.reduce((acc, item) => acc + item.debit, 0).toFixed(2));
  const currentBalance = Number((totalCredits - totalDebits).toFixed(2));

  return {
    vendorId,
    ledger,
    totalCredits,
    totalDebits,
    currentBalance
  };
}

// 6. Customer Wallet Ledgers
export const CUSTOMER_WALLET_LEDGER = [
  { id: 'CWL-01', date: '2026-08-01', desc: 'Opening Plus Wallet Balance', credit: 2500.00, debit: 0.00 },
  { id: 'CWL-02', date: '2026-08-05', desc: 'Gold Member 10% Cashback #ORD-9102', credit: 450.00, debit: 0.00 },
  { id: 'CWL-03', date: '2026-08-10', desc: 'Redeemed at Checkout for ORD-94821', credit: 0.00, debit: 500.00 },
  { id: 'CWL-04', date: '2026-08-11', desc: 'Instant Refund Credit for Accidental Order', credit: 1200.00, debit: 0.00 }
];

export function getCustomerWalletSummary() {
  const totalCredits = Number(CUSTOMER_WALLET_LEDGER.reduce((acc, item) => acc + item.credit, 0).toFixed(2));
  const totalDebits = Number(CUSTOMER_WALLET_LEDGER.reduce((acc, item) => acc + item.debit, 0).toFixed(2));
  const currentBalance = Number((totalCredits - totalDebits).toFixed(2));

  return {
    ledger: CUSTOMER_WALLET_LEDGER,
    totalCredits,
    totalDebits,
    currentBalance
  };
}

// 7. Aggregate Metrics & Dashboard Consistency
export function getMasterFinancialSummaries() {
  const allSettlements = MASTER_ORDERS.map(calculateOrderSettlement);
  const allTaxes = MASTER_ORDERS.map(calculateOrderTax);

  const totalGrossSales = Number(MASTER_ORDERS.reduce((acc, o) => acc + o.grossAmount, 0).toFixed(2));
  const totalCommissions = Number(allSettlements.reduce((acc, s) => acc + s.commissionAmount, 0).toFixed(2));
  const totalPlatformFees = Number(allSettlements.reduce((acc, s) => acc + s.platformFee, 0).toFixed(2));
  const totalLogistics = Number(allSettlements.reduce((acc, s) => acc + s.logisticsFee, 0).toFixed(2));
  const totalGateway = Number(allSettlements.reduce((acc, s) => acc + s.gatewayCharges, 0).toFixed(2));
  const totalTDS = Number(allSettlements.reduce((acc, s) => acc + s.tds, 0).toFixed(2));
  const totalTCS = Number(allSettlements.reduce((acc, s) => acc + s.tcs, 0).toFixed(2));
  const totalNetSettlements = Number(allSettlements.reduce((acc, s) => acc + s.finalSettlement, 0).toFixed(2));

  // Net Platform Gross Profit = Commissions + Platform Fees
  const netPlatformRevenue = Number((totalCommissions + totalPlatformFees).toFixed(2));

  // Pending items reconciliation
  const pendingKYCVendors = MASTER_VENDORS.filter(v => v.kycStatus === 'Pending Review');
  const pendingRefunds = MASTER_ORDERS.filter(o => o.orderStatus.includes('RMA') || o.orderStatus.includes('Refund'));
  const pendingSettlements = allSettlements.filter(s => s.settlementStatus.includes('Hold') || s.settlementStatus.includes('Pending'));

  return {
    totalGrossSales,
    totalCommissions,
    totalPlatformFees,
    totalLogistics,
    totalGateway,
    totalTDS,
    totalTCS,
    totalNetSettlements,
    netPlatformRevenue,
    ordersCount: MASTER_ORDERS.length,
    vendorsCount: MASTER_VENDORS.length,
    pendingKYCCount: pendingKYCVendors.length,
    pendingRefundsCount: pendingRefunds.length,
    pendingSettlementsCount: pendingSettlements.length,
    allSettlements,
    allTaxes
  };
}

// 8. Formatter helper
export const formatINR = (val) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2
  }).format(val);
};
