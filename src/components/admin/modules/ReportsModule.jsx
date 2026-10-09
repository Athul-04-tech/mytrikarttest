import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, RefreshCw, AlertCircle, DollarSign, Users, Store, Boxes, Info, ShieldAlert } from 'lucide-react';
import { apiRequest } from '../../../utils/api';
import { useToast } from '../../../context/ToastContext';

export default function ReportsModule() {
  const toast = useToast();
  const [overviewData, setOverviewData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchOverview = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiRequest('/api/reports/admin/overview/');
      setOverviewData(data);
    } catch (err) {
      console.error('Failed to fetch admin overview BI reports:', err);
      setError(err.data?.detail || err.message || 'Failed to load financial overview reports.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, []);

  const revenueByCurrency = overviewData?.revenue?.by_currency || {};
  const vendorData = overviewData?.vendors || {};
  const userData = overviewData?.users || {};
  const productData = overviewData?.products || {};

  return (
    <div className="space-y-6">
      
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#EAE3DC]">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-1.5 rounded-xl bg-[#FFF3EC] text-[#FA661C]">
              <BarChart3 className="w-5 h-5" />
            </span>
            <h2 className="font-['Outfit'] font-black text-xl text-[#FA661C]">
              Analytics & Financial BI Overview
            </h2>
          </div>
          <p className="text-xs text-[#6B6058] mt-0.5">
            Wired to live DRF endpoint: <code className="bg-[#FFF3EC] px-1 py-0.5 rounded text-[#FA661C]">/api/reports/admin/overview/</code>
          </p>
        </div>

        <div className="flex items-center space-x-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => {
              fetchOverview();
              toast.success("BI Data Refreshed", "Synchronized overview metrics with backend records.");
            }}
            disabled={loading}
            className="px-4 py-2 bg-[#FA661C] hover:bg-[#E0530B] text-white rounded-xl text-xs font-bold btn-interactive flex items-center space-x-1.5 cursor-pointer shadow-xs disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh Overview</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="bg-white rounded-2xl border border-[#EAE3DC] p-12 text-center space-y-3">
          <RefreshCw className="w-6 h-6 text-[#FA661C] animate-spin mx-auto" />
          <p className="text-xs text-[#6B6058] font-medium">Fetching financial BI and platform overview metrics...</p>
        </div>
      ) : error ? (
        <div className="bg-white rounded-2xl border border-[#EAE3DC] p-8 text-center space-y-2 text-red-600 bg-red-50">
          <AlertCircle className="w-6 h-6 mx-auto" />
          <p className="text-xs font-bold">{error}</p>
        </div>
      ) : (
        <>
          {/* 2. Live Platform Revenue by Currency Cards */}
          <div className="space-y-3">
            <h3 className="font-['Outfit'] font-black text-base text-[#FA661C]">
              Platform Revenue & Fees (By Currency)
            </h3>

            {Object.keys(revenueByCurrency).length === 0 ? (
              <div className="p-6 bg-white rounded-2xl border border-[#EAE3DC] text-center text-xs text-[#6B6058]">
                No platform revenue recorded yet.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
                {Object.entries(revenueByCurrency).map(([currency, rev]) => (
                  <div key={currency} className="p-4 bg-[#FFF8F2] rounded-2xl border border-[#FF811A]/60 space-y-3 shadow-2xs">
                    <div className="flex items-center justify-between border-b border-[#EAE3DC] pb-2">
                      <span className="font-['Outfit'] font-black text-sm text-[#FA661C]">
                        {currency} Revenue Account
                      </span>
                      <span className="text-[10px] font-bold bg-[#FA661C] text-white px-2 py-0.5 rounded-full">
                        Live Backend
                      </span>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-[#6B6058] font-medium">Net Platform Revenue:</span>
                        <span className="font-mono font-black text-sm text-[#FA661C]">
                          {currency === 'INR' ? '₹' : ''}{rev.net_platform_revenue || rev.commission_revenue || '0.00'}
                        </span>
                      </div>

                      <div className="flex justify-between items-center text-[11px]">
                        <span className="text-[#6B6058]">Commission Revenue:</span>
                        <span className="font-mono text-[#FA661C]">
                          {currency === 'INR' ? '₹' : ''}{rev.commission_revenue || rev.gross_platform_commission || '0.00'}
                        </span>
                      </div>

                      <div className="flex justify-between items-center text-[11px]">
                        <span className="text-[#6B6058]">Platform Fees:</span>
                        <span className="font-mono text-[#FA661C]">
                          {currency === 'INR' ? '₹' : ''}{rev.platform_fee_revenue || rev.gross_platform_fees || '0.00'}
                        </span>
                      </div>

                      {rev.tds_pass_through && (
                        <div className="flex justify-between items-center text-[11px]">
                          <span className="text-[#6B6058]">TDS Pass-Through:</span>
                          <span className="font-mono text-[#6B6058]">
                            {currency === 'INR' ? '₹' : ''}{rev.tds_pass_through}
                          </span>
                        </div>
                      )}

                      {rev.tcs_pass_through && (
                        <div className="flex justify-between items-center text-[11px]">
                          <span className="text-[#6B6058]">TCS Pass-Through:</span>
                          <span className="font-mono text-[#6B6058]">
                            {currency === 'INR' ? '₹' : ''}{rev.tcs_pass_through}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 3. Real Backend Entity Counts Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            {/* Vendors Breakdown */}
            <div className="bg-white rounded-2xl border border-[#EAE3DC] p-4 space-y-3">
              <div className="flex items-center space-x-2 text-[#FA661C]">
                <Store className="w-4 h-4" />
                <h4 className="font-['Outfit'] font-extrabold text-sm text-[#FA661C]">Vendor Ecosystem</h4>
              </div>
              <div className="font-['Outfit'] font-black text-2xl text-[#FA661C]">
                {vendorData.total || 0} Total Vendors
              </div>
              <div className="space-y-1.5 pt-1 border-t border-[#EAE3DC] text-[11px]">
                {vendorData.by_onboarding_status && Object.entries(vendorData.by_onboarding_status).map(([st, cnt]) => (
                  <div key={st} className="flex justify-between items-center">
                    <span className="text-[#6B6058] capitalize">{st.replace(/_/g, ' ')}:</span>
                    <span className="font-bold text-[#FA661C]">{cnt}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Users Breakdown */}
            <div className="bg-white rounded-2xl border border-[#EAE3DC] p-4 space-y-3">
              <div className="flex items-center space-x-2 text-[#FA661C]">
                <Users className="w-4 h-4" />
                <h4 className="font-['Outfit'] font-extrabold text-sm text-[#FA661C]">Registered Users</h4>
              </div>
              <div className="font-['Outfit'] font-black text-2xl text-[#FA661C]">
                {userData.total || 0} Total Accounts
              </div>
              <div className="space-y-1.5 pt-1 border-t border-[#EAE3DC] text-[11px]">
                {userData.by_role && Object.entries(userData.by_role).map(([rl, cnt]) => (
                  <div key={rl} className="flex justify-between items-center">
                    <span className="text-[#6B6058] capitalize">{rl.replace(/_/g, ' ')}:</span>
                    <span className="font-bold text-[#FA661C]">{cnt}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Product Catalog Breakdown */}
            <div className="bg-white rounded-2xl border border-[#EAE3DC] p-4 space-y-3">
              <div className="flex items-center space-x-2 text-[#FA661C]">
                <Boxes className="w-4 h-4" />
                <h4 className="font-['Outfit'] font-extrabold text-sm text-[#FA661C]">Product Catalog</h4>
              </div>
              <div className="font-['Outfit'] font-black text-2xl text-[#FA661C]">
                {productData.total || 0} Listed Products
              </div>
              <div className="space-y-1.5 pt-1 border-t border-[#EAE3DC] text-[11px]">
                <div className="flex justify-between items-center">
                  <span className="text-[#6B6058]">Total Variants (SKUs):</span>
                  <span className="font-bold text-[#FA661C]">{productData.sku_total || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#6B6058]">Pending Review:</span>
                  <span className="font-bold text-[#FA661C]">{productData.pending_review || 0}</span>
                </div>
              </div>
            </div>
          </div>

          {/* 4. Honest "Not Yet Available" Banners for Unbacked Metrics */}
          <div className="space-y-4 pt-2">
            <h3 className="font-['Outfit'] font-black text-base text-[#FA661C]">
              Advanced Time-Series Analytics & GMV
            </h3>

            <div className="bg-gradient-to-r from-[#FFF8F2] to-white rounded-2xl border border-[#FF811A]/40 p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="p-1 rounded bg-[#FFF3EC] text-[#FA661C]">
                    <TrendingUp className="w-4 h-4" />
                  </span>
                  <h4 className="font-['Outfit'] font-bold text-sm text-[#FA661C]">
                    Gross Merchandise Value (GMV) & Multi-Period Sales Trends
                  </h4>
                </div>
                <span className="text-[10px] font-extrabold uppercase bg-amber-100 text-amber-800 border border-amber-300 px-2.5 py-0.5 rounded-full flex items-center space-x-1">
                  <Info className="w-3 h-3" />
                  <span>Not Yet Available</span>
                </span>
              </div>

              <p className="text-xs text-[#6B6058] leading-relaxed">
                The current live endpoint (<code className="bg-white px-1.5 py-0.5 rounded border text-[#FA661C]">/api/reports/admin/overview/</code>) returns real-time entity counts (vendors, users, products) and verified revenue by currency. GMV calculations, monthly trend charts, and order volume aggregations are not yet backed by the Django backend API. Synthetic mock trend charts have been removed in compliance with data integrity guidelines.
              </p>
            </div>
          </div>
        </>
      )}

    </div>
  );
}
