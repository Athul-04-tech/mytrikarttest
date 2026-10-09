import React, { useState, useEffect } from 'react';
import { Wallet, Search, RefreshCw, AlertCircle, Store, CheckCircle2, DollarSign, ShieldCheck } from 'lucide-react';
import { apiRequest } from '../../../utils/api';
import { useToast } from '../../../context/ToastContext';

export default function WalletModule() {
  const toast = useToast();
  const [wallets, setWallets] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchWallets = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiRequest('/api/settlements/admin/wallets/');
      setWallets(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch admin vendor wallets:', err);
      setError(err.data?.detail || err.message || 'Failed to load vendor wallets.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWallets();
  }, []);

  const filteredWallets = wallets.filter(w => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      w.store_name?.toLowerCase().includes(q) ||
      String(w.vendor_id).includes(q) ||
      w.country?.toLowerCase().includes(q)
    );
  });

  // Calculate currency occurrence counts
  const currencyCounts = {};
  let totalBalancesCount = 0;
  let negativeBalancesCount = 0;

  wallets.forEach(w => {
    (w.balances || []).forEach(b => {
      totalBalancesCount += 1;
      currencyCounts[b.currency] = (currencyCounts[b.currency] || 0) + 1;
      if (b.balance_status === 'negative') {
        negativeBalancesCount += 1;
      }
    });
  });

  return (
    <div className="space-y-6">
      
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#EAE3DC]">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-1.5 rounded-xl bg-[#FFF3EC] text-[#FA661C]">
              <Wallet className="w-5 h-5" />
            </span>
            <h2 className="font-['Outfit'] font-black text-xl text-[#FA661C]">
              Wallet Central & Multi-Currency Ledger
            </h2>
          </div>
          <p className="text-xs text-[#6B6058] mt-0.5">
            Wired to backend endpoint: <code className="bg-[#FFF3EC] px-1 py-0.5 rounded text-[#FA661C]">/api/settlements/admin/wallets/</code>
          </p>
        </div>

        <div className="flex items-center space-x-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => {
              fetchWallets();
              toast.success("Wallets Refreshed", "Loaded latest vendor per-currency balances.");
            }}
            disabled={loading}
            className="px-4 py-2 bg-[#FA661C] hover:bg-[#E0530B] text-white rounded-xl text-xs font-bold btn-interactive flex items-center space-x-1.5 cursor-pointer shadow-xs disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Sync Wallets</span>
          </button>
        </div>
      </div>

      {/* 2. Overview Ribbon */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
        <div className="p-4 bg-[#FFF8F2] rounded-2xl border border-[#FF811A]/60 flex items-center space-x-3">
          <div className="p-3 bg-[#FA661C] text-white rounded-xl">
            <Store className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-[#FA661C] uppercase tracking-wider block">
              Total Vendor Wallets
            </span>
            <div className="font-['Outfit'] font-black text-2xl text-[#FA661C]">
              {wallets.length} Merchants
            </div>
            <span className="text-[10px] text-[#6B6058]">
              {totalBalancesCount} Active Currency Balances
            </span>
          </div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-[#EAE3DC] flex items-center space-x-3">
          <div className="p-3 bg-[#FFF3EC] text-[#FA661C] rounded-xl">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-[#6B6058] uppercase tracking-wider block">
              Currencies Tracked
            </span>
            <div className="font-['Outfit'] font-black text-xl text-[#FA661C] mt-0.5">
              {Object.keys(currencyCounts).length ? Object.keys(currencyCounts).join(', ') : 'INR'}
            </div>
            <span className="text-[10px] text-[#6B6058]">
              Per-Currency Balances Kept Separate
            </span>
          </div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-[#EAE3DC] flex items-center space-x-3">
          <div className={`p-3 rounded-xl ${negativeBalancesCount > 0 ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-600'}`}>
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-[#6B6058] uppercase tracking-wider block">
              Vault Status
            </span>
            <div className="font-['Outfit'] font-black text-xl text-[#FA661C] mt-0.5">
              {negativeBalancesCount > 0 ? `${negativeBalancesCount} Negative Balance` : 'Zero Risk Float'}
            </div>
            <span className="text-[10px] text-[#6B6058]">
              Explicit per-currency ledger separation
            </span>
          </div>
        </div>
      </div>

      {/* 3. Search Bar Toolbar */}
      <div className="bg-white rounded-2xl border border-[#EAE3DC] p-3 flex items-center space-x-3 text-xs shadow-xs">
        <Search className="w-4 h-4 text-[#FA661C] shrink-0" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by vendor store name, vendor ID, or country..."
          className="w-full bg-transparent text-[#1A2420] font-medium focus:outline-none placeholder:text-[#6B6058]/60"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            className="text-xs text-[#6B6058] font-bold hover:text-[#FA661C]"
          >
            Clear
          </button>
        )}
      </div>

      {/* 4. Vendor Wallet Table with Explicit Per-Currency Balances */}
      <div className="bg-white rounded-2xl border border-[#EAE3DC] overflow-hidden shadow-xs">
        <div className="p-4 border-b border-[#EAE3DC] bg-[#FFF3EC] flex items-center justify-between">
          <h3 className="font-['Outfit'] font-black text-sm text-[#FA661C]">
            Vendor Escrow Balances Ledger
          </h3>
          <span className="text-[10px] font-mono text-[#FA661C] bg-white px-2 py-0.5 rounded border border-[#EAE3DC]">
            {filteredWallets.length} Vendor Wallets Listed
          </span>
        </div>

        {loading ? (
          <div className="p-12 text-center space-y-3">
            <RefreshCw className="w-6 h-6 text-[#FA661C] animate-spin mx-auto" />
            <p className="text-xs text-[#6B6058] font-medium">Loading vendor wallet balances...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center space-y-2 text-red-600 bg-red-50">
            <AlertCircle className="w-6 h-6 mx-auto" />
            <p className="text-xs font-bold">{error}</p>
          </div>
        ) : filteredWallets.length === 0 ? (
          <div className="p-12 text-center text-xs text-[#6B6058]">
            No vendor wallets match your search query.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#FFFFFF] text-[#6B6058] border-b border-[#EAE3DC] font-extrabold uppercase text-[10px] tracking-wider">
                  <th className="p-3">Vendor ID</th>
                  <th className="p-3">Store Name</th>
                  <th className="p-3">Country</th>
                  <th className="p-3">Per-Currency Balances (Explicit)</th>
                  <th className="p-3 text-center">Balance Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EAE3DC]/60 font-medium">
                {filteredWallets.map((w) => {
                  const hasBalances = Array.isArray(w.balances) && w.balances.length > 0;

                  return (
                    <tr key={w.vendor_id} className="hover:bg-[#FFF8F2]/50 transition-colors">
                      <td className="p-3 font-mono font-bold text-[#FA661C]">
                        #{w.vendor_id}
                      </td>
                      <td className="p-3 font-bold text-[#1A2420]">
                        {w.store_name}
                      </td>
                      <td className="p-3 font-bold text-[#6B6058]">
                        {w.country || 'IN'}
                      </td>
                      <td className="p-3">
                        {hasBalances ? (
                          <div className="flex flex-wrap items-center gap-2">
                            {w.balances.map((b, idx) => (
                              <div
                                key={idx}
                                className={`px-2.5 py-1 rounded-lg border flex items-center space-x-1.5 font-mono text-xs font-bold ${
                                  b.balance_status === 'negative'
                                    ? 'bg-rose-50 text-rose-700 border-rose-200'
                                    : 'bg-[#FFF3EC] text-[#FA661C] border-[#FF811A]/30'
                                }`}
                              >
                                <span className="text-[10px] text-[#6B6058] font-sans uppercase">{b.currency}:</span>
                                <span>{b.currency === 'INR' ? '₹' : ''}{b.balance}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-[11px] text-[#6B6058] italic bg-[#F4F0EB] px-2 py-0.5 rounded font-mono">
                            No recorded balances (0.00)
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-center">
                        {hasBalances && w.balances.some(b => b.balance_status === 'negative') ? (
                          <span className="text-[10px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full">
                            Negative Balance
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                            Normal
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
