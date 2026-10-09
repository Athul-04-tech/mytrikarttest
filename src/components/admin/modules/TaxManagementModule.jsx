import React, { useState, useEffect } from 'react';
import { Landmark, Calendar, RefreshCw, AlertCircle, FileText, CheckCircle2, ArrowRight } from 'lucide-react';
import { apiRequest } from '../../../utils/api';
import { useToast } from '../../../context/ToastContext';

export default function TaxManagementModule() {
  const toast = useToast();
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  
  const [taxData, setTaxData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchTaxSummary = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (dateFrom) params.append('date_from', dateFrom);
      if (dateTo) params.append('date_to', dateTo);

      const queryStr = params.toString() ? `?${params.toString()}` : '';
      const data = await apiRequest(`/api/reports/admin/tax-summary/${queryStr}`);
      setTaxData(data);
    } catch (err) {
      console.error('Failed to fetch admin tax summary:', err);
      setError(err.data?.detail || err.message || 'Failed to load tax summary.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTaxSummary();
  }, []);

  const handleFilterSubmit = (e) => {
    e.preventDefault();
    fetchTaxSummary();
    toast.success("Tax Report Filtered", "Applied date range filter to tax summary records.");
  };

  const handleClearFilter = () => {
    setDateFrom('');
    setDateTo('');
    setTimeout(() => {
      fetchTaxSummary();
    }, 0);
  };

  const byJurisdiction = taxData?.by_jurisdiction || [];
  const withholdingList = taxData?.withholding_by_country_currency || [];

  return (
    <div className="space-y-6">
      
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#EAE3DC]">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-1.5 rounded-xl bg-[#FFF3EC] text-[#FA661C]">
              <Landmark className="w-5 h-5" />
            </span>
            <h2 className="font-['Outfit'] font-black text-xl text-[#FA661C]">
              Tax Management & GSTIN Compliance
            </h2>
          </div>
          <p className="text-xs text-[#6B6058] mt-0.5">
            Wired to backend endpoint: <code className="bg-[#FFF3EC] px-1 py-0.5 rounded text-[#FA661C]">/api/reports/admin/tax-summary/</code>
          </p>
        </div>

        <div className="flex items-center space-x-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={fetchTaxSummary}
            disabled={loading}
            className="px-4 py-2 bg-[#FA661C] hover:bg-[#E0530B] text-white rounded-xl text-xs font-bold btn-interactive flex items-center space-x-1.5 cursor-pointer shadow-xs disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh Report</span>
          </button>
        </div>
      </div>

      {/* 2. Date Range Filter Toolbar */}
      <form onSubmit={handleFilterSubmit} className="bg-white rounded-2xl border border-[#EAE3DC] p-4 flex flex-col sm:flex-row sm:items-end justify-between gap-4 text-xs shadow-xs">
        <div className="flex flex-wrap items-center gap-4">
          <div>
            <label className="block text-[11px] font-bold text-[#6B6058] mb-1 flex items-center space-x-1">
              <Calendar className="w-3.5 h-3.5 text-[#FA661C]" />
              <span>Date From:</span>
            </label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-[#FFF3EC] border border-[#EAE3DC] text-[#FA661C] font-bold focus:outline-none focus:border-[#FA661C]"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-[#6B6058] mb-1 flex items-center space-x-1">
              <Calendar className="w-3.5 h-3.5 text-[#FA661C]" />
              <span>Date To:</span>
            </label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-[#FFF3EC] border border-[#EAE3DC] text-[#FA661C] font-bold focus:outline-none focus:border-[#FA661C]"
            />
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {(dateFrom || dateTo) && (
            <button
              type="button"
              onClick={handleClearFilter}
              className="px-3 py-1.5 bg-[#FFF3EC] text-[#6B6058] hover:text-[#FA661C] font-bold rounded-xl"
            >
              Clear
            </button>
          )}
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-1.5 bg-[#FA661C] hover:bg-[#E0530B] text-white font-bold rounded-xl transition-all shadow-xs"
          >
            Apply Filter
          </button>
        </div>
      </form>

      {loading ? (
        <div className="bg-white rounded-2xl border border-[#EAE3DC] p-12 text-center space-y-3">
          <RefreshCw className="w-6 h-6 text-[#FA661C] animate-spin mx-auto" />
          <p className="text-xs text-[#6B6058] font-medium">Fetching real tax report records...</p>
        </div>
      ) : error ? (
        <div className="bg-white rounded-2xl border border-[#EAE3DC] p-8 text-center space-y-2 text-red-600 bg-red-50">
          <AlertCircle className="w-6 h-6 mx-auto" />
          <p className="text-xs font-bold">{error}</p>
        </div>
      ) : (
        <>
          {/* 3. Withholding & Pass-through Summary Ribbon */}
          <div className="bg-white rounded-2xl border border-[#EAE3DC] p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-['Outfit'] font-black text-base text-[#FA661C]">
                Withholding Tax & TCS Ledger Summary
              </h3>
              <span className="text-[10px] font-bold text-[#6B6058] bg-[#FFF3EC] px-2.5 py-1 rounded-lg">
                Source: {taxData?.withholding_source || 'Signed Settlement Ledger Entries'}
              </span>
            </div>

            {withholdingList.length === 0 ? (
              <p className="text-xs text-[#6B6058]">No withholding records found for this period.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {withholdingList.map((w, idx) => {
                  const isTdsNegative = typeof w.tds === 'string' && w.tds.startsWith('-');
                  const isTcsNegative = typeof w.tcs === 'string' && w.tcs.startsWith('-');

                  return (
                    <div key={idx} className="p-3.5 bg-[#FFF8F2] rounded-xl border border-[#FF811A]/40 space-y-2 text-xs">
                      <div className="flex items-center justify-between border-b border-[#EAE3DC] pb-2">
                        <span className="font-bold text-[#FA661C]">{w.country} ({w.currency})</span>
                        <span className="text-[10px] font-mono text-[#6B6058]">Withholding Pool</span>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-[#6B6058]">TDS (Sec 194-O):</span>
                        <div className="text-right">
                          <span className="font-mono font-bold text-[#FA661C]">
                            {w.currency === 'INR' ? '₹' : ''}{w.tds}
                          </span>
                          {isTdsNegative && (
                            <span className="block text-[9px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.2 rounded mt-0.5">
                              Credit Note Reversal
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-[#6B6058]">TCS (Sec 52):</span>
                        <div className="text-right">
                          <span className="font-mono font-bold text-[#FA661C]">
                            {w.currency === 'INR' ? '₹' : ''}{w.tcs}
                          </span>
                          {isTcsNegative && (
                            <span className="block text-[9px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.2 rounded mt-0.5">
                              Credit Note Reversal
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* 4. Jurisdictional Tax Table */}
          <div className="bg-white rounded-2xl border border-[#EAE3DC] overflow-hidden shadow-xs space-y-0">
            <div className="p-4 border-b border-[#EAE3DC] bg-[#FFF3EC] flex items-center justify-between">
              <div>
                <h3 className="font-['Outfit'] font-black text-sm text-[#FA661C]">
                  Tax by Jurisdiction Breakdown
                </h3>
                <p className="text-[10px] text-[#6B6058]">
                  Source: {taxData?.tax_source || 'Immutable Order Item Tax Snapshots'}
                </p>
              </div>
              <span className="text-[10px] font-mono text-[#FA661C] bg-white px-2 py-0.5 rounded border border-[#EAE3DC]">
                {byJurisdiction.length} Jurisdiction Records
              </span>
            </div>

            {byJurisdiction.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#6B6058]">
                No jurisdiction tax entries found for the selected timeframe.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-[#FFFFFF] text-[#6B6058] border-b border-[#EAE3DC] font-extrabold uppercase text-[10px] tracking-wider">
                      <th className="p-3">Country</th>
                      <th className="p-3">State / Region</th>
                      <th className="p-3">Currency</th>
                      <th className="p-3 text-right">Taxable Value</th>
                      <th className="p-3 text-right">CGST</th>
                      <th className="p-3 text-right">SGST</th>
                      <th className="p-3 text-right">IGST</th>
                      <th className="p-3 text-right">VAT</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EAE3DC]/60 font-medium">
                    {byJurisdiction.map((row, idx) => (
                      <tr key={idx} className="hover:bg-[#FFF8F2]/50 transition-colors">
                        <td className="p-3 font-bold text-[#FA661C]">
                          {row.country}
                        </td>
                        <td className="p-3 font-bold text-[#6B6058]">
                          {row.state || 'N/A'}
                        </td>
                        <td className="p-3 font-mono text-[#6B6058]">
                          {row.currency}
                        </td>
                        <td className="p-3 text-right font-mono font-bold text-[#FA661C]">
                          {row.taxable_value}
                        </td>
                        <td className="p-3 text-right font-mono text-[#6B6058]">
                          {row.cgst}
                        </td>
                        <td className="p-3 text-right font-mono text-[#6B6058]">
                          {row.sgst}
                        </td>
                        <td className="p-3 text-right font-mono text-[#6B6058]">
                          {row.igst}
                        </td>
                        <td className="p-3 text-right font-mono text-[#6B6058]">
                          {row.vat}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

    </div>
  );
}
