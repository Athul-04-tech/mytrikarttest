import React, { useState, useEffect } from 'react';
import { Percent, ShieldCheck, RefreshCw, Filter, Layers, DollarSign, Calendar, AlertCircle } from 'lucide-react';
import { apiRequest } from '../../../utils/api';
import { useToast } from '../../../context/ToastContext';

export default function CommissionModule() {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState('commission'); // 'commission' | 'platform'
  const [scopeFilter, setScopeFilter] = useState('all'); // 'all' | 'global' | 'category' | 'vendor'
  const [countryFilter, setCountryFilter] = useState('all'); // 'all' | 'IN' | 'AE' | 'IE'

  const [commissionRules, setCommissionRules] = useState([]);
  const [platformRules, setPlatformRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchRules = async () => {
    setLoading(true);
    setError(null);
    try {
      const [commData, platData] = await Promise.all([
        apiRequest('/api/settlements/admin/commission-rules/'),
        apiRequest('/api/settlements/admin/platform-fee-rules/'),
      ]);
      setCommissionRules(Array.isArray(commData) ? commData : []);
      setPlatformRules(Array.isArray(platData) ? platData : []);
    } catch (err) {
      console.error('Failed to fetch commission & platform fee rules:', err);
      setError(err.data?.detail || err.message || 'Failed to load commission rules.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRules();
  }, []);

  const currentRules = activeTab === 'commission' ? commissionRules : platformRules;

  const filteredRules = currentRules.filter(rule => {
    if (scopeFilter !== 'all' && rule.scope !== scopeFilter) return false;
    if (countryFilter !== 'all' && rule.country !== countryFilter) return false;
    return true;
  });

  const formatRate = (type, val) => {
    if (!val) return '—';
    if (type === 'percentage') return `${val}%`;
    return `₹${val}`;
  };

  return (
    <div className="space-y-6">
      
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#EAE3DC]">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-1.5 rounded-xl bg-[#FFF3EC] text-[#FA661C]">
              <Percent className="w-5 h-5" />
            </span>
            <h2 className="font-['Outfit'] font-black text-xl text-[#FA661C]">
              Commission & Platform Fee Matrix
            </h2>
          </div>
          <p className="text-xs text-[#6B6058] mt-0.5">
            Wired to live DRF rules engine: <code className="bg-[#FFF3EC] px-1 py-0.5 rounded text-[#FA661C]">/api/settlements/admin/commission-rules/</code>
          </p>
        </div>

        <div className="flex items-center space-x-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => {
              fetchRules();
              toast.success("Rules Refreshed", "Loaded latest commission and platform fee rule matrices.");
            }}
            disabled={loading}
            className="px-4 py-2 bg-[#FA661C] hover:bg-[#E0530B] text-white rounded-xl text-xs font-bold btn-interactive flex items-center space-x-1.5 cursor-pointer shadow-xs disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Sync Rules</span>
          </button>
        </div>
      </div>

      {/* 2. Top Rule Type Selector & Summary Badges */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Toggle Button Group */}
        <div className="md:col-span-1 bg-[#FFF3EC] p-1.5 rounded-2xl border border-[#EAE3DC] flex items-center space-x-1">
          <button
            type="button"
            onClick={() => setActiveTab('commission')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center space-x-1.5 ${
              activeTab === 'commission'
                ? 'bg-[#FA661C] text-white shadow-2xs'
                : 'text-[#6B6058] hover:text-[#FA661C]'
            }`}
          >
            <Percent className="w-3.5 h-3.5" />
            <span>Commission Rules ({commissionRules.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('platform')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center space-x-1.5 ${
              activeTab === 'platform'
                ? 'bg-[#FA661C] text-white shadow-2xs'
                : 'text-[#6B6058] hover:text-[#FA661C]'
            }`}
          >
            <DollarSign className="w-3.5 h-3.5" />
            <span>Platform Fees ({platformRules.length})</span>
          </button>
        </div>

        {/* Dynamic Metric Cards */}
        <div className="md:col-span-2 grid grid-cols-2 gap-3 text-xs">
          <div className="p-3 bg-white rounded-2xl border border-[#EAE3DC] flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-[#FFF8F2] text-[#FA661C]">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] text-[#6B6058] font-bold uppercase block">Active Rule Scope</span>
              <span className="font-['Outfit'] font-black text-sm text-[#FA661C]">
                {scopeFilter === 'all' ? 'All Scopes (Global, Category, Vendor)' : scopeFilter.toUpperCase()}
              </span>
            </div>
          </div>

          <div className="p-3 bg-white rounded-2xl border border-[#EAE3DC] flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-[#FFF8F2] text-[#FA661C]">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] text-[#6B6058] font-bold uppercase block">Enforced Jurisdiction</span>
              <span className="font-['Outfit'] font-black text-sm text-[#FA661C]">
                {countryFilter === 'all' ? 'Multi-Country Tiers (IN, AE, IE)' : `Country: ${countryFilter}`}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Filters Toolbar */}
      <div className="bg-white rounded-2xl border border-[#EAE3DC] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-bold text-[#6B6058] flex items-center space-x-1">
            <Filter className="w-3.5 h-3.5 text-[#FA661C]" />
            <span>Scope Filter:</span>
          </span>
          {['all', 'global', 'category', 'vendor'].map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setScopeFilter(s)}
              className={`px-2.5 py-1 rounded-lg font-bold capitalize transition-all cursor-pointer ${
                scopeFilter === s
                  ? 'bg-[#FA661C] text-white'
                  : 'bg-[#FFF3EC] text-[#6B6058] hover:text-[#FA661C]'
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        <div className="flex items-center space-x-2">
          <span className="font-bold text-[#6B6058]">Country:</span>
          <select
            value={countryFilter}
            onChange={(e) => setCountryFilter(e.target.value)}
            className="px-2.5 py-1 rounded-lg bg-[#FFF3EC] border border-[#EAE3DC] text-[#FA661C] font-bold focus:outline-none focus:border-[#FA661C]"
          >
            <option value="all">All Countries</option>
            <option value="IN">India (IN)</option>
            <option value="AE">UAE (AE)</option>
            <option value="IE">Ireland (IE)</option>
          </select>
        </div>
      </div>

      {/* 4. Table / List */}
      <div className="bg-white rounded-2xl border border-[#EAE3DC] overflow-hidden shadow-xs">
        {loading ? (
          <div className="p-12 text-center space-y-3">
            <RefreshCw className="w-6 h-6 text-[#FA661C] animate-spin mx-auto" />
            <p className="text-xs text-[#6B6058] font-medium">Fetching rules from backend...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center space-y-2 text-red-600 bg-red-50">
            <AlertCircle className="w-6 h-6 mx-auto" />
            <p className="text-xs font-bold">{error}</p>
          </div>
        ) : filteredRules.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <p className="text-sm font-bold text-[#FA661C]">No rules match the active filter criteria.</p>
            <p className="text-xs text-[#6B6058]">Try changing scope or country filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#FFF3EC] text-[#FA661C] border-b border-[#EAE3DC] font-extrabold uppercase text-[10px] tracking-wider">
                  <th className="p-3">Rule ID</th>
                  <th className="p-3">Scope</th>
                  <th className="p-3">Country</th>
                  <th className="p-3 text-right">Rate / Value</th>
                  <th className="p-3">Category ID</th>
                  <th className="p-3">Vendor ID</th>
                  <th className="p-3">Effective Date Range</th>
                  <th className="p-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EAE3DC]/60 font-medium">
                {filteredRules.map((rule) => (
                  <tr key={rule.id} className="hover:bg-[#FFF8F2]/50 transition-colors">
                    <td className="p-3 font-mono font-bold text-[#FA661C]">
                      #{rule.id}
                    </td>
                    <td className="p-3">
                      <span className="bg-[#FFF3EC] text-[#FA661C] border border-[#FF811A]/40 px-2 py-0.5 rounded-full font-bold uppercase text-[10px]">
                        {rule.scope}
                      </span>
                    </td>
                    <td className="p-3 font-bold text-[#6B6058]">
                      {rule.country || 'Global'}
                    </td>
                    <td className="p-3 text-right font-mono font-black text-sm text-[#FA661C]">
                      {formatRate(rule.rate_type, rule.rate_value)}
                      <span className="block text-[9px] text-[#6B6058] font-normal capitalize">{rule.rate_type}</span>
                    </td>
                    <td className="p-3 font-mono text-[#6B6058]">
                      {rule.category ? `#${rule.category}` : 'All Categories'}
                    </td>
                    <td className="p-3 font-mono text-[#6B6058]">
                      {rule.vendor ? `Vendor #${rule.vendor}` : 'All Vendors'}
                    </td>
                    <td className="p-3 text-[#6B6058] text-[11px]">
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-3 h-3 text-[#FA661C]" />
                        <span>{rule.effective_from} → {rule.effective_to || 'Open-ended'}</span>
                      </div>
                    </td>
                    <td className="p-3 text-center">
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                        Enforced
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
