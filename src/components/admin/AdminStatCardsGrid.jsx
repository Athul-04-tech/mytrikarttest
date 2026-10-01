import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Store, 
  Users, 
  Package, 
  PackageCheck, 
  DollarSign, 
  ShoppingBag, 
  RotateCcw, 
  Landmark, 
  ShieldCheck 
} from 'lucide-react';

export default function AdminStatCardsGrid({ 
  overviewData, 
  ordersSummary, 
  rmaSummary, 
  settlementSummary, 
  loading, 
  error 
}) {
  if (loading) {
    return (
      <section aria-label="Business Overview Stats" className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-['Outfit'] font-black text-sm uppercase tracking-wider text-[#FA661C]">
            Real-Time Marketplace Vitals
          </h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
            <div key={i} className="p-4 rounded-2xl bg-white border border-[#EAE3DC] animate-pulse space-y-3">
              <div className="h-3 bg-[#EAE3DC]/60 rounded w-2/3" />
              <div className="h-6 bg-[#EAE3DC]/80 rounded w-1/2" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  // 1. Overview Telemetry
  const vendorsTotal = overviewData?.vendors?.total ?? 0;
  const vendorsPendingReview = (overviewData?.vendors?.by_onboarding_status?.under_review ?? 0) +
                               (overviewData?.vendors?.by_onboarding_status?.resubmit_required ?? 0);
  const activeCustomers = overviewData?.users?.by_role?.customer ?? 0;
  const skuTotal = overviewData?.products?.sku_total ?? 0;
  const pendingProductReviews = overviewData?.products?.pending_review ?? 0;

  // Revenue from overview (or settlements)
  const revenueCurrencies = overviewData?.revenue?.by_currency ? Object.keys(overviewData.revenue.by_currency) : [];
  let revenueDisplay = "No settled revenue yet";
  if (revenueCurrencies.length > 0) {
    revenueDisplay = revenueCurrencies
      .map(curr => `${curr} ${Number(overviewData.revenue.by_currency[curr]).toLocaleString()}`)
      .join(', ');
  }

  // 2. Orders in Ledger Telemetry
  const totalOrders = ordersSummary?.total_order_count ?? 0;
  const orderStatusCounts = ordersSummary?.vendor_order_count_by_status || {};
  const pendingOrders = orderStatusCounts.pending || 0;
  const processingOrders = orderStatusCounts.processing || 0;
  const ordersSubtext = totalOrders > 0 
    ? `${pendingOrders} pending • ${processingOrders} processing` 
    : 'No orders recorded';

  // 3. RMA Refund Requests Telemetry
  const totalRma = rmaSummary?.total ?? 0;
  const rmaStatusCounts = rmaSummary?.by_status || {};
  const requestedRma = rmaStatusCounts.requested || 0;
  const approvedRma = rmaStatusCounts.approved || 0;
  const rmaSubtext = totalRma > 0 
    ? `${requestedRma} requested • ${approvedRma} approved` 
    : 'No return requests';

  // 4. Disbursed Settlements Telemetry
  const settlementCurrencies = settlementSummary?.by_currency ? Object.keys(settlementSummary.by_currency) : [];
  let disbursedDisplay = "No disbursed settlements yet";
  if (settlementCurrencies.length > 0) {
    disbursedDisplay = settlementCurrencies
      .map(curr => `${curr} ${Number(settlementSummary.by_currency[curr].total_disbursed || 0).toLocaleString()}`)
      .join(', ');
  }
  const pendingHoldVendors = settlementSummary?.vendors_with_pending_settlement ?? 0;
  const settlementSubtext = pendingHoldVendors > 0 
    ? `${pendingHoldVendors} vendors with holds` 
    : 'Zero vendor settlement holds';

  const cards = [
    {
      id: 'vendors',
      label: 'Registered Vendors',
      value: `${vendorsTotal} Merchants`,
      subtext: vendorsPendingReview > 0 ? `${vendorsPendingReview} pending review` : 'All profiles up to date',
      badge: vendorsPendingReview > 0 ? `${vendorsPendingReview} Pending` : 'Verified',
      isUrgent: vendorsPendingReview > 0,
      icon: Store,
      link: '/admin/vendors'
    },
    {
      id: 'customers',
      label: 'Active Customers',
      value: `${activeCustomers.toLocaleString()} Buyers`,
      subtext: 'Registered buyer accounts',
      badge: 'Live',
      isPositive: true,
      icon: Users
    },
    {
      id: 'skus',
      label: 'Catalog SKUs',
      value: `${skuTotal.toLocaleString()} SKUs`,
      subtext: 'Active variant combinations',
      badge: 'Inventory',
      isPositive: true,
      icon: Package
    },
    {
      id: 'pending_products',
      label: 'Products Awaiting Review',
      value: `${pendingProductReviews} Pending`,
      subtext: pendingProductReviews > 0 ? 'Click to open Review Queue' : 'Queue is clear',
      badge: pendingProductReviews > 0 ? 'Action Needed' : 'Clear',
      isUrgent: pendingProductReviews > 0,
      icon: PackageCheck,
      link: '/admin/products'
    },
    {
      id: 'revenue',
      label: 'Net Platform Revenue',
      value: revenueDisplay,
      subtext: revenueCurrencies.length > 0 ? 'Settled platform commissions' : 'No settled revenue yet',
      badge: revenueCurrencies.length > 0 ? 'Settled' : 'Unsettled',
      isPositive: revenueCurrencies.length > 0,
      icon: DollarSign
    },
    {
      id: 'orders_ledger',
      label: 'Orders in Ledger',
      value: `${totalOrders} Orders`,
      subtext: ordersSubtext,
      badge: pendingOrders > 0 ? `${pendingOrders} Pending` : 'Tracked',
      isPositive: true,
      icon: ShoppingBag,
      link: '/admin/order-ops'
    },
    {
      id: 'rma_refunds',
      label: 'RMA Refund Requests',
      value: `${totalRma} Requests`,
      subtext: rmaSubtext,
      badge: requestedRma > 0 ? `${requestedRma} Open` : 'Clear',
      isUrgent: requestedRma > 0,
      icon: RotateCcw,
      link: '/admin/rma'
    },
    {
      id: 'settlements',
      label: 'Disbursed Settlements',
      value: disbursedDisplay,
      subtext: settlementSubtext,
      badge: settlementCurrencies.length > 0 ? 'Disbursed' : 'No Payouts',
      isPositive: settlementCurrencies.length > 0,
      icon: Landmark
    },
    {
      id: 'escrow_vault',
      label: 'Escrow Vault Balance',
      value: 'Not yet available',
      subtext: 'No ledger escrow model in backend',
      badge: 'Not yet available',
      isDeferred: true,
      icon: ShieldCheck
    }
  ];

  return (
    <section aria-label="Business Overview Stats" className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-['Outfit'] font-black text-sm uppercase tracking-wider text-[#FA661C]">
          Real-Time Marketplace Vitals
        </h2>
        <span className="text-[11px] text-[#6B6058] font-medium">
          Live Backend API Telemetry (`/api/reports/admin/overview/` & Admin Summaries)
        </span>
      </div>

      {/* STATS GRID */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {cards.map((stat) => {
          const Icon = stat.icon;

          const CardContent = (
            <div
              className={`p-3.5 rounded-2xl bg-white border transition-all duration-200 flex flex-col justify-between h-full ${
                stat.isUrgent
                  ? 'border-[#D7263D]/40 hover:border-[#D7263D] bg-[#FDE8EA]/20 shadow-2xs'
                  : stat.isDeferred
                  ? 'border-[#EAE3DC] bg-[#FFF8F2]/30 opacity-80'
                  : 'border-[#EAE3DC] hover:border-[#FF811A]/60 shadow-2xs'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-1 mb-2">
                  <span className="text-[11px] font-bold text-[#6B6058] truncate">
                    {stat.label}
                  </span>
                  <div className={`p-1 rounded-lg shrink-0 ${
                    stat.isUrgent
                      ? 'bg-[#FDE8EA] text-[#D7263D]'
                      : stat.isDeferred
                      ? 'bg-[#EAE3DC]/60 text-[#6B6058]'
                      : 'bg-[#FFF8F2] text-[#FA661C]'
                  }`}>
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                </div>

                <div className={`font-['Outfit'] font-black tracking-tight ${
                  stat.isDeferred
                    ? 'text-xs text-[#6B6058] italic py-1'
                    : stat.isUrgent
                    ? 'text-lg sm:text-xl text-[#D7263D]'
                    : 'text-lg sm:text-xl text-[#FA661C]'
                }`}>
                  {stat.value}
                </div>
              </div>

              <div className="mt-2 pt-2 border-t border-[#EAE3DC]/50 flex items-center justify-between text-[10px]">
                <span className={`font-bold px-1.5 py-0.2 rounded ${
                  stat.isUrgent
                    ? 'bg-[#FDE8EA] text-[#D7263D]'
                    : stat.isDeferred
                    ? 'bg-[#EAE3DC]/40 text-[#6B6058]'
                    : 'bg-[#FFF3EC] text-[#FA661C]'
                }`}>
                  {stat.badge}
                </span>
                <span className="text-[#6B6058]/80 truncate max-w-[110px]">
                  {stat.subtext}
                </span>
              </div>
            </div>
          );

          if (stat.link) {
            return (
              <Link key={stat.id} to={stat.link} className="block btn-interactive">
                {CardContent}
              </Link>
            );
          }

          return <div key={stat.id}>{CardContent}</div>;
        })}
      </div>
    </section>
  );
}
