import React, { useState, useEffect } from 'react';
import { Calculator, RefreshCw, AlertCircle, CheckCircle2, Layers } from 'lucide-react';
import { useToast } from '../../../context/ToastContext';
import { apiRequest } from '../../../utils/api';

export default function SettlementCalcModule() {
  const [vendorOrders, setVendorOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterState, setFilterState] = useState('all'); // 'all' | 'pending' | 'calculated'

  // Selected calculation audit modal state
  const [calculatingId, setCalculatingId] = useState(null);
  const [activeLedgerResult, setActiveLedgerResult] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);

  const toast = useToast();

  const fetchVendorOrders = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    setError(null);
    try {
      const data = await apiRequest('/api/settlements/admin/vendor-orders/');
      setVendorOrders(data);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to fetch vendor orders');
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    fetchVendorOrders(true);
  }, []);

  const handleCalculateSettlement = async (vOrder) => {
    setCalculatingId(vOrder.id);
    try {
      const ledgerEntries = await apiRequest(`/api/settlements/vendor-orders/${vOrder.id}/calculate/`, {
        method: 'POST',
        body: JSON.stringify({})
      });

      toast.success('Settlement Calculated', `Successfully calculated ledger entries for Vendor Order #${vOrder.id}`);
      
      setSelectedOrder(vOrder);
      setActiveLedgerResult(ledgerEntries);
      fetchVendorOrders(false);
    } catch (err) {
      console.error('CALCULATION_ERROR:', err);
      const msg = err.data?.detail
        ? (Array.isArray(err.data.detail) ? err.data.detail[0] : err.data.detail)
        : (err.message || 'Calculation failed');
      toast.error('Calculation Error', msg);
    } finally {
      setCalculatingId(null);
    }
  };

  const filteredOrders = vendorOrders.filter(o => {
    if (filterState === 'pending') return o.settlement_state === 'pending';
    if (filterState === 'calculated') return o.settlement_state === 'calculated';
    return true;
  });

  const formatINR = (val) => {
    const num = parseFloat(val || 0);
    return `₹${num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const entryTypeLabels = {
    gross_sale: { label: 'Gross Sale', color: 'text-emerald-700 bg-emerald-50' },
    commission: { label: 'Commission Deduction', color: 'text-red-700 bg-red-50' },
    commission_tax: { label: 'Tax on Commission (GST)', color: 'text-red-700 bg-red-50' },
    platform_fee: { label: 'Platform Fee Deduction', color: 'text-red-700 bg-red-50' },
    platform_fee_tax: { label: 'Tax on Platform Fee (GST)', color: 'text-red-700 bg-red-50' },
    logistics: { label: 'Logistics Courier Deduction', color: 'text-red-700 bg-red-50' },
    logistics_tax: { label: 'Tax on Logistics', color: 'text-red-700 bg-red-50' },
    gateway: { label: 'Payment Gateway Charge', color: 'text-red-700 bg-red-50' },
    gateway_tax: { label: 'Tax on Gateway Fee', color: 'text-red-700 bg-red-50' },
    tds: { label: 'TDS Withholding (194-O)', color: 'text-amber-700 bg-amber-50' },
    tcs: { label: 'TCS Withholding (Sec 52)', color: 'text-amber-700 bg-amber-50' },
    net_settlement: { label: 'Net Vendor Settlement', color: 'text-brand font-black bg-brand/10' },
    wallet_credit: { label: 'Wallet Credit', color: 'text-emerald-700 bg-emerald-50' },
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#EAE3DC]">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-1.5 rounded-xl bg-[#FFF3EC] text-[#FA661C]">
              <Calculator className="w-5 h-5" />
            </span>
            <h2 className="font-['Outfit'] font-black text-xl text-[#2D231D]">
              Settlement Calculation & Ledger Engine
            </h2>
          </div>
          <p className="text-xs text-[#6B6058] mt-1">
            Real-time settlement calculation feeding live ledger entries (Gross Sale − Commission − Tax − TDS − TCS = Net Settlement).
          </p>
        </div>

        <button
          type="button"
          onClick={() => fetchVendorOrders(true)}
          className="px-3.5 py-2 bg-[#FFFFFF] border border-[#EAE3DC] text-[#2D231D] rounded-xl text-xs font-bold hover:border-[#FA661C] transition-colors flex items-center space-x-1.5 shadow-xs cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-[#6B6058] ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh List</span>
        </button>
      </div>

      {/* Filter Tabs & Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-1 bg-[#FFF8F2] p-1 rounded-2xl border border-[#EAE3DC]">
          {[
            { id: 'all', label: 'All Orders' },
            { id: 'pending', label: 'Pending Settlement' },
            { id: 'calculated', label: 'Calculated' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilterState(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                filterState === tab.id
                  ? 'bg-[#FA661C] text-[#FFFFFF] shadow-xs'
                  : 'text-[#6B6058] hover:text-[#2D231D]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="text-xs text-[#6B6058] font-medium">
          Showing <span className="font-bold text-[#2D231D]">{filteredOrders.length}</span> vendor orders
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center space-x-3 text-red-700 text-xs">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Vendor Orders Table */}
      <div className="bg-white rounded-2xl border border-[#EAE3DC] overflow-hidden shadow-xs">
        {loading ? (
          <div className="p-12 text-center text-xs text-[#6B6058] space-y-2">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-[#FA661C]" />
            <p>Loading vendor orders...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="p-12 text-center text-xs text-[#6B6058] space-y-1">
            <Layers className="w-8 h-8 text-[#A89F91] mx-auto mb-2" />
            <p className="font-bold text-[#2D231D]">No vendor orders found</p>
            <p className="text-[11px]">There are no vendor orders matching the selected filter state.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#FFF3EC] text-[#FA661C] border-b border-[#EAE3DC] font-extrabold uppercase text-[10px] tracking-wider">
                  <th className="p-3.5">Vendor Order ID</th>
                  <th className="p-3.5">Order ID</th>
                  <th className="p-3.5">Merchant / Vendor</th>
                  <th className="p-3.5">Order Status</th>
                  <th className="p-3.5 text-right">Grand Total</th>
                  <th className="p-3.5">Settlement State</th>
                  <th className="p-3.5 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EAE3DC]/60 font-medium">
                {filteredOrders.map((vOrder) => {
                  const isCalculated = vOrder.settlement_state === 'calculated';
                  const isCalculating = calculatingId === vOrder.id;

                  return (
                    <tr key={vOrder.id} className="hover:bg-[#FFF8F2]/40 transition-colors">
                      <td className="p-3.5 font-mono font-bold text-[#FA661C]">
                        VO-#{vOrder.id}
                      </td>
                      <td className="p-3.5 font-mono text-[#6B6058]">
                        #{vOrder.order_id}
                      </td>
                      <td className="p-3.5 font-bold text-[#2D231D]">
                        {vOrder.vendor_name || `Vendor #${vOrder.vendor}`}
                      </td>
                      <td className="p-3.5">
                        <span className="capitalize text-[11px] font-semibold text-[#6B6058] bg-gray-100 px-2 py-0.5 rounded border border-gray-200">
                          {vOrder.status}
                        </span>
                      </td>
                      <td className="p-3.5 text-right font-['Outfit'] font-black text-sm text-[#2D231D]">
                        {formatINR(vOrder.grand_total)}
                      </td>
                      <td className="p-3.5">
                        {isCalculated ? (
                          <span className="px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center space-x-1 w-fit">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Calculated</span>
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-300 w-fit">
                            Pending
                          </span>
                        )}
                      </td>
                      <td className="p-3.5 text-center">
                        <button
                          type="button"
                          data-testid={`calc-btn-${vOrder.id}`}
                          disabled={isCalculating}
                          onClick={() => handleCalculateSettlement(vOrder)}
                          className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-colors cursor-pointer flex items-center space-x-1 mx-auto shadow-2xs ${
                            isCalculated
                              ? 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300'
                              : 'bg-[#FA661C] text-white hover:bg-[#D75210]'
                          } ${isCalculating ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          {isCalculating ? (
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Calculator className="w-3.5 h-3.5" />
                          )}
                          <span>{isCalculated ? 'Re-calculate' : 'Calculate'}</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Ledger Results Breakdown Modal */}
      {activeLedgerResult && selectedOrder && (
        <div className="fixed inset-0 bg-[#2D231D]/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-[#EAE3DC] max-w-xl w-full p-6 shadow-2xl space-y-4 animate-dropdown text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-[#EAE3DC]">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#FA661C] bg-[#FFF3EC] px-2 py-0.5 rounded border border-[#FF811A]/30">
                  REAL-TIME LEDGER ENTRIES
                </span>
                <h3 className="font-['Outfit'] font-black text-lg text-[#2D231D] mt-1">
                  Settlement Breakdown: Vendor Order #{selectedOrder.id}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setActiveLedgerResult(null);
                  setSelectedOrder(null);
                }}
                className="text-[#6B6058] hover:text-[#2D231D] font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 font-mono text-xs max-h-[360px] overflow-y-auto pr-1">
              {activeLedgerResult.map((entry) => {
                const meta = entryTypeLabels[entry.entry_type] || { label: entry.entry_type, color: 'text-gray-700 bg-gray-50' };
                const isPositive = parseFloat(entry.amount) > 0;

                return (
                  <div
                    key={entry.id}
                    className={`flex items-center justify-between p-2.5 rounded-xl border border-[#EAE3DC]/60 ${meta.color}`}
                  >
                    <div>
                      <div className="font-bold">{meta.label}</div>
                      <div className="text-[10px] text-[#6B6058] font-sans">{entry.description} {entry.rate_applied ? `(Rate: ${entry.rate_applied})` : ''}</div>
                    </div>
                    <div className="font-['Outfit'] font-black text-sm text-right">
                      {isPositive ? '+' : ''}{formatINR(entry.amount)}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-[#EAE3DC]">
              <span className="text-[11px] text-[#6B6058]">
                Vendor: <strong className="text-[#2D231D]">{selectedOrder.vendor_name}</strong>
              </span>

              <button
                type="button"
                onClick={() => {
                  setActiveLedgerResult(null);
                  setSelectedOrder(null);
                }}
                className="px-4 py-2 bg-[#FA661C] text-white rounded-xl font-bold text-xs hover:bg-[#D75210] transition-colors cursor-pointer shadow-sm"
              >
                Done / Close Audit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
