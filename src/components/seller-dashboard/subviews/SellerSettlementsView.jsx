import React, { useState, useEffect } from 'react';
import { Landmark, FileText, Download, CheckCircle2, Clock, AlertCircle, RefreshCw } from 'lucide-react';
import { useToast } from '../../../context/ToastContext';
import { apiRequest } from '../../../utils/api';

export default function SellerSettlementsView() {
  const toast = useToast();
  const [wallet, setWallet] = useState(null);
  const [statements, setStatements] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  const todayStr = new Date().toISOString().split('T')[0];
  const thirtyDaysAgoStr = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const [dateFrom, setDateFrom] = useState(thirtyDaysAgoStr);
  const [dateTo, setDateTo] = useState(todayStr);

  useEffect(() => {
    let isMounted = true;
    async function loadSettlementData() {
      setIsLoading(true);
      try {
        const [walletRes, statementsRes, withdrawalsRes] = await Promise.allSettled([
          apiRequest('/api/settlements/wallet/'),
          apiRequest('/api/settlements/statements/'),
          apiRequest('/api/settlements/withdrawals/')
        ]);

        if (isMounted) {
          if (walletRes.status === 'fulfilled') setWallet(walletRes.value);
          if (statementsRes.status === 'fulfilled') {
            const val = statementsRes.value;
            setStatements(Array.isArray(val) ? val : val?.results || []);
          }
          if (withdrawalsRes.status === 'fulfilled') {
            const val = withdrawalsRes.value;
            setWithdrawals(Array.isArray(val) ? val : val?.results || []);
          }
        }
      } catch (err) {
        console.warn("Settlement fetch error:", err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadSettlementData();
    return () => { isMounted = false; };
  }, []);

  const handleExportLedger = async () => {
    setIsExporting(true);
    try {
      const data = await apiRequest(`/api/reports/b2c-sales-export/?date_from=${dateFrom}&date_to=${dateTo}`);
      if (data && data.filing_ready === false) {
        const reason = data.filing_readiness_reason || "Report exported as DRAFT. Not yet finalized for statutory tax filing.";
        toast.warning("Draft Report — Filing Not Ready", reason);
      } else {
        toast.success("Ledger Exported", "B2C Sales Export report downloaded successfully.");
      }
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `b2c-sales-export-${dateFrom}-to-${dateTo}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      toast.error("Export Failed", err.message || "Could not generate sales export report.");
    } finally {
      setIsExporting(false);
    }
  };

  const balance = Number(wallet?.wallet?.cached_balance || 0);
  const formattedBalance = `₹${balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

  return (
    <div className="space-y-6 text-xs animate-reveal">
      
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-[#EAE3DC]">
        <div>
          <h2 className="font-['Outfit'] text-xl sm:text-2xl font-extrabold text-[#FA661C]">
            Settlements & Bank Remittances
          </h2>
          <p className="text-xs text-[#6B6058] mt-0.5">
            Automated weekly disbursements direct to your registered bank account.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          <div className="flex items-center space-x-1 bg-white border border-[#EAE3DC] px-2 py-1 rounded-xl">
            <span className="text-[10px] font-bold text-[#6B6058]">From:</span>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="text-xs font-mono font-bold text-[#FA661C] bg-transparent outline-none cursor-pointer"
            />
          </div>
          <div className="flex items-center space-x-1 bg-white border border-[#EAE3DC] px-2 py-1 rounded-xl">
            <span className="text-[10px] font-bold text-[#6B6058]">To:</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="text-xs font-mono font-bold text-[#FA661C] bg-transparent outline-none cursor-pointer"
            />
          </div>

          <button
            type="button"
            disabled={isExporting}
            onClick={handleExportLedger}
            className="px-4 py-2 bg-[#FA661C] hover:bg-[#E0530B] text-[#FFFFFF] rounded-2xl font-black text-xs btn-interactive flex items-center space-x-1.5 shadow-xs cursor-pointer disabled:opacity-50"
          >
            <Download className={`w-4 h-4 text-[#FF811A] ${isExporting ? 'animate-bounce' : ''}`} />
            <span>{isExporting ? 'Generating Report...' : 'Export B2C Sales Ledger'}</span>
          </button>
        </div>
      </div>

      {/* Payout Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Total Net Balance */}
        <div className="p-5 bg-gradient-to-br from-[#FA661C] to-[#16523F] text-[#FFFFFF] rounded-3xl border border-[#FF811A]/50 shadow-md">
          <span className="text-[10px] font-black uppercase bg-[#FF811A] text-[#FA661C] px-2 py-0.5 rounded-full">
            CURRENT WALLET BALANCE
          </span>
          <div className="font-['Outfit'] font-black text-2xl sm:text-3xl mt-3">
            {formattedBalance}
          </div>
          <span className="text-[10px] text-[#FF811A] mt-1 block">
            Status: {wallet?.wallet?.balance_status || 'Active'}
          </span>
        </div>

        {/* Statements Count */}
        <div className="p-5 bg-white rounded-3xl border border-[#EAE3DC] shadow-xs flex flex-col justify-between">
          <div>
            <span className="text-[10px] font-bold text-[#6B6058] uppercase">Settlement Statements</span>
            <div className="font-['Outfit'] font-black text-2xl text-[#FA661C] mt-2">
              {statements.length} Issued
            </div>
          </div>
          <div className="mt-3 text-[10px] text-[#FA661C] font-bold flex items-center space-x-1">
            <Clock className="w-3.5 h-3.5 text-[#FF811A]" />
            <span>Next Payout Cycle: Not yet available</span>
          </div>
        </div>

        {/* Withdrawals Count */}
        <div className="p-5 bg-white rounded-3xl border border-[#EAE3DC] shadow-xs flex flex-col justify-between">
          <div>
            <span className="text-[10px] font-bold text-[#6B6058] uppercase">Completed Withdrawals</span>
            <div className="font-['Outfit'] font-black text-2xl text-[#FA661C] mt-2">
              {withdrawals.length} Remitted
            </div>
          </div>
          <div className="mt-3 text-[10px] text-[#FA661C] font-bold flex items-center space-x-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#FA661C]" />
            <span>Direct Bank Remittance</span>
          </div>
        </div>

      </div>

      {/* Recent Ledger Entries */}
      <div className="bg-white rounded-3xl border border-[#EAE3DC] p-5 sm:p-6 shadow-xs space-y-4">
        <h3 className="font-['Outfit'] font-bold text-base text-[#FA661C]">
          Settlement Ledger Transactions
        </h3>

        {wallet?.recent_ledger_entries?.length > 0 ? (
          <div className="space-y-2.5 divide-y divide-[#EAE3DC]/50 text-xs">
            {wallet.recent_ledger_entries.map((entry, idx) => (
              <div key={entry.id || idx} className="flex items-center justify-between pt-2">
                <div>
                  <span className="font-bold text-[#FA661C] block">{entry.entry_type || 'Ledger Credit'}</span>
                  <span className="text-[10px] text-[#6B6058]">{entry.created_at ? new Date(entry.created_at).toLocaleString() : ''}</span>
                </div>
                <span className="font-mono font-bold text-[#FA661C]">
                  ₹{Number(entry.amount || 0).toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-4 bg-[#FFF8F2] rounded-2xl border border-[#EAE3DC] text-center text-xs text-[#6B6058]">
            No recent settlement ledger entries recorded yet.
          </div>
        )}
      </div>

    </div>
  );
}
