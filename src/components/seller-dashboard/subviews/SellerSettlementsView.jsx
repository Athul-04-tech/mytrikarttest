import React, { useState, useEffect, useCallback } from 'react';
import {
  Landmark, Download, CheckCircle2, Clock, AlertCircle, RefreshCw, Wallet, ArrowDownToLine,
  TrendingUp, Minus, X, Loader2, ShieldAlert, Hourglass, BadgeCheck, Info
} from 'lucide-react';
import { useToast } from '../../../context/ToastContext';
import { apiRequest } from '../../../utils/api';

const inr = (v) => `₹${Number(v || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const ENTRY_LABELS = {
  gross_sale: 'Gross sale', commission: 'Commission', commission_tax: 'GST on commission',
  platform_fee: 'Platform fee', platform_fee_tax: 'GST on platform fee', logistics_charge: 'Logistics charge',
  logistics_tax: 'GST on logistics', gateway_charge: 'Payment gateway charge', gateway_tax: 'GST on gateway',
  tds: 'TDS withheld', tcs: 'TCS withheld', net_settlement: 'Net settlement', wallet_credit: 'Credited to wallet',
  wallet_debit: 'Withdrawn from wallet', refund_adjustment: 'Refund adjustment', penalty: 'Penalty',
  incentive: 'Incentive', bonus: 'Bonus', chargeback: 'Chargeback', hold: 'Hold', hold_release: 'Hold released',
};

const WITHDRAWAL_STATUS = {
  pending: { label: 'Requested', cls: 'bg-amber-50 text-amber-700 border-amber-200', icon: Hourglass },
  under_review: { label: 'Under review', cls: 'bg-amber-50 text-amber-700 border-amber-200', icon: Hourglass },
  approved: { label: 'Approved', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: BadgeCheck },
  processing: { label: 'Transferring', cls: 'bg-blue-50 text-blue-700 border-blue-200', icon: RefreshCw },
  paid: { label: 'Paid to bank', cls: 'bg-green-50 text-green-700 border-green-200', icon: CheckCircle2 },
  rejected: { label: 'Rejected', cls: 'bg-red-50 text-red-700 border-red-200', icon: AlertCircle },
  failed_reversed: { label: 'Failed — refunded', cls: 'bg-gray-50 text-gray-700 border-gray-200', icon: AlertCircle },
};

export default function SellerSettlementsView() {
  const toast = useToast();
  const [wallet, setWallet] = useState(null);
  const [statements, setStatements] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [withdrawError, setWithdrawError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const todayStr = new Date().toISOString().split('T')[0];
  const thirtyDaysAgoStr = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const [dateFrom, setDateFrom] = useState(thirtyDaysAgoStr);
  const [dateTo, setDateTo] = useState(todayStr);

  const loadSettlementData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [walletRes, statementsRes, withdrawalsRes] = await Promise.allSettled([
        apiRequest('/api/settlements/wallet/'),
        apiRequest('/api/settlements/statements/'),
        apiRequest('/api/settlements/withdrawals/')
      ]);
      if (walletRes.status === 'fulfilled') setWallet(walletRes.value);
      if (statementsRes.status === 'fulfilled') {
        const val = statementsRes.value;
        setStatements(Array.isArray(val) ? val : val?.results || []);
      }
      if (withdrawalsRes.status === 'fulfilled') {
        const val = withdrawalsRes.value;
        setWithdrawals(Array.isArray(val) ? val : val?.results || []);
      }
    } catch (err) {
      console.warn("Settlement fetch error:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { loadSettlementData(); }, [loadSettlementData]);

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
  const available = Number(wallet?.available_balance ?? balance);
  const reserved = Number(wallet?.reserved_for_withdrawals || 0);
  const paidOut = Number(wallet?.total_paid_out || 0);
  const bd = wallet?.earnings_breakdown || {};
  const payout = wallet?.payout_details;
  const canWithdraw = available > 0 && payout?.is_verified;

  const deductionRows = [
    ['Commission (incl. GST)', bd.commission],
    ['Platform fee (incl. GST)', bd.platform_fee],
    ['Logistics / shipping', bd.logistics],
    ['Payment gateway', bd.gateway],
    ['TDS / TCS withheld', bd.tds_tcs],
    ['Refunds & adjustments', bd.adjustments],
  ].filter(([, v]) => Number(v || 0) !== 0);

  const openWithdraw = () => { setAmount(available > 0 ? available.toFixed(2) : ''); setWithdrawError(null); setWithdrawOpen(true); };

  const submitWithdrawal = async (e) => {
    e.preventDefault();
    const amt = Number(amount);
    if (!amt || amt <= 0) return setWithdrawError('Enter an amount greater than zero.');
    if (amt > available) return setWithdrawError(`You can withdraw at most ${inr(available)}.`);
    setSubmitting(true); setWithdrawError(null);
    try {
      await apiRequest('/api/settlements/withdrawals/', { method: 'POST', body: JSON.stringify({ amount: amt.toFixed(2) }) });
      toast.success('Withdrawal Requested', `${inr(amt)} has been sent for admin approval.`);
      setWithdrawOpen(false);
      loadSettlementData();
    } catch (err) {
      const d = err?.data?.detail ?? err?.data?.amount;
      setWithdrawError((Array.isArray(d) ? d.join(' ') : d) || err.message || 'Withdrawal request failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 text-xs animate-reveal">

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-[#EAE3DC]">
        <div>
          <h2 className="font-['Outfit'] text-xl sm:text-2xl font-extrabold text-[#FA661C]">
            Settlements &amp; Bank Remittances
          </h2>
          <p className="text-xs text-[#6B6058] mt-0.5">
            Your earnings after commission, fees and taxes — withdraw them to your registered bank account.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          <div className="flex items-center space-x-1 bg-white border border-[#EAE3DC] px-2 py-1 rounded-xl">
            <span className="text-[10px] font-bold text-[#6B6058]">From:</span>
            <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)}
              className="text-xs font-mono font-bold text-[#FA661C] bg-transparent outline-none cursor-pointer" />
          </div>
          <div className="flex items-center space-x-1 bg-white border border-[#EAE3DC] px-2 py-1 rounded-xl">
            <span className="text-[10px] font-bold text-[#6B6058]">To:</span>
            <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)}
              className="text-xs font-mono font-bold text-[#FA661C] bg-transparent outline-none cursor-pointer" />
          </div>
          <button type="button" disabled={isExporting} onClick={handleExportLedger}
            className="px-4 py-2 bg-white border border-[#EAE3DC] hover:bg-[#FFF3EC] text-[#FA661C] rounded-2xl font-black text-xs btn-interactive flex items-center space-x-1.5 cursor-pointer disabled:opacity-50">
            <Download className={`w-4 h-4 text-[#FF811A] ${isExporting ? 'animate-bounce' : ''}`} />
            <span>{isExporting ? 'Generating Report...' : 'Export B2C Sales Ledger'}</span>
          </button>
        </div>
      </div>

      {/* Payout details warning */}
      {payout && !payout.is_verified && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 text-amber-900 flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-sm">{payout.configured ? 'Bank / payout details pending verification' : 'Add your bank / payout details'}</p>
            <p className="mt-0.5">Withdrawals are enabled once your payout details are verified by MytriKart. Update them under Merchant Profile.</p>
          </div>
        </div>
      )}

      {/* Payout Summary Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Withdrawable Balance */}
        <div className="relative overflow-hidden p-5 bg-gradient-to-br from-[#FA661C] to-[#C2410C] text-white rounded-3xl shadow-lg shadow-[#FA661C]/20">
          <div className="absolute -right-6 -top-6 w-32 h-32 rounded-full bg-white/10" />
          <span className="text-[10px] font-black uppercase bg-white/20 px-2 py-0.5 rounded-full">
            Available to withdraw
          </span>
          <div className="font-['Outfit'] font-black text-3xl mt-3">{isLoading ? '…' : inr(available)}</div>
          {reserved > 0 && (
            <div className="mt-2 space-y-0.5 text-[11px] text-white/85">
              <div className="flex justify-between"><span>Wallet balance</span><span className="font-mono">{inr(balance)}</span></div>
              <div className="flex justify-between"><span>Reserved (pending requests)</span><span className="font-mono">− {inr(reserved)}</span></div>
            </div>
          )}
          <button type="button" id="seller-withdraw-funds" onClick={openWithdraw} disabled={!canWithdraw}
            title={!payout?.is_verified ? 'Verified payout details required' : available <= 0 ? 'No withdrawable balance yet' : ''}
            className="relative mt-4 w-full py-2.5 bg-white text-[#FA661C] rounded-2xl font-black text-xs btn-interactive inline-flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed">
            <ArrowDownToLine className="w-4 h-4" /> Withdraw Funds
          </button>
        </div>

        {/* Earnings breakdown */}
        <div className="lg:col-span-2 p-5 bg-white rounded-3xl border border-[#EAE3DC] shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-['Outfit'] font-bold text-sm text-[#1A2420] flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-[#FA661C]" /> How your earnings are calculated
            </h3>
            <span className="text-[10px] text-[#6B6058]">{wallet?.settled_order_count ?? 0} settled orders</span>
          </div>
          <dl className="space-y-1.5 font-mono">
            <div className="flex justify-between text-sm"><dt className="font-sans font-bold text-[#1A2420]">Gross sales (settled)</dt><dd className="font-bold">{inr(bd.gross_sales)}</dd></div>
            {deductionRows.map(([label, v]) => (
              <div key={label} className="flex justify-between text-[#6B6058]">
                <dt className="font-sans flex items-center gap-1"><Minus className="w-3 h-3 text-red-400" />{label}</dt>
                <dd className={Number(v) < 0 ? 'text-red-600' : 'text-emerald-700'}>{Number(v) < 0 ? '− ' : '+ '}{inr(Math.abs(Number(v)))}</dd>
              </div>
            ))}
            <div className="flex justify-between border-t border-dashed border-[#EAE3DC] pt-1.5 text-sm"><dt className="font-sans font-bold text-[#FA661C]">Net earnings credited</dt><dd className="font-black text-[#FA661C]">{inr(bd.net_settled)}</dd></div>
            <div className="flex justify-between text-[#6B6058]"><dt className="font-sans">Already paid to bank</dt><dd>− {inr(paidOut)}</dd></div>
          </dl>
          {(wallet?.awaiting_settlement_order_count ?? 0) > 0 && (
            <p className="mt-3 text-[11px] text-[#6B6058] flex items-start gap-1.5 bg-[#FFF8F2] border border-[#EAE3DC] rounded-xl p-2.5">
              <Clock className="w-3.5 h-3.5 text-[#FF811A] shrink-0 mt-0.5" />
              {wallet.awaiting_settlement_order_count} delivered order(s) are awaiting settlement. Earnings are credited after the return window closes and MytriKart runs the settlement.
            </p>
          )}
        </div>
      </div>

      {/* Withdrawals */}
      <div className="bg-white rounded-3xl border border-[#EAE3DC] p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-['Outfit'] font-bold text-base text-[#FA661C] flex items-center gap-1.5"><Landmark className="w-4 h-4" /> Withdrawal Requests</h3>
          <span className="text-[10px] text-[#6B6058]">{statements.length} settlement statement(s) issued</span>
        </div>
        {withdrawals.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead><tr className="text-[10px] uppercase tracking-wider text-[#FA661C] border-b border-[#EAE3DC]">
                <th className="p-2.5">Request</th><th className="p-2.5">Amount</th><th className="p-2.5">Method</th><th className="p-2.5">Requested</th><th className="p-2.5">Status</th>
              </tr></thead>
              <tbody className="divide-y divide-[#EAE3DC]/60">
                {withdrawals.map((w) => {
                  const s = WITHDRAWAL_STATUS[w.status] || { label: w.status, cls: 'bg-gray-50 text-gray-700 border-gray-200', icon: Info };
                  const Icon = s.icon;
                  return (
                    <tr key={w.id}>
                      <td className="p-2.5 font-mono font-bold text-[#FA661C]">#{w.id}</td>
                      <td className="p-2.5 font-mono font-bold">{inr(w.amount)}</td>
                      <td className="p-2.5 capitalize text-[#6B6058]">{(w.payout_method_snapshot || 'bank transfer').replace(/_/g, ' ')}</td>
                      <td className="p-2.5 text-[#6B6058]">{w.requested_at ? new Date(w.requested_at).toLocaleDateString('en-IN') : '—'}</td>
                      <td className="p-2.5">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-bold ${s.cls}`}><Icon className="w-3 h-3" />{s.label}</span>
                        {w.rejection_reason && <span className="block text-[10px] text-red-600 mt-0.5">{w.rejection_reason}</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-4 bg-[#FFF8F2] rounded-2xl border border-[#EAE3DC] text-center text-xs text-[#6B6058]">
            No withdrawal requests yet.
          </div>
        )}
      </div>

      {/* Recent Ledger Entries */}
      <div className="bg-white rounded-3xl border border-[#EAE3DC] p-5 sm:p-6 shadow-xs space-y-4">
        <h3 className="font-['Outfit'] font-bold text-base text-[#FA661C] flex items-center gap-1.5">
          <Wallet className="w-4 h-4" /> Settlement Ledger Transactions
        </h3>
        {wallet?.recent_ledger_entries?.length > 0 ? (
          <div className="space-y-2.5 divide-y divide-[#EAE3DC]/50 text-xs">
            {wallet.recent_ledger_entries.map((entry, idx) => {
              const amt = Number(entry.amount || 0);
              return (
                <div key={entry.id || idx} className="flex items-center justify-between pt-2">
                  <div>
                    <span className="font-bold text-[#1A2420] block">{ENTRY_LABELS[entry.entry_type] || entry.entry_type || 'Ledger Credit'}</span>
                    <span className="text-[10px] text-[#6B6058]">
                      {entry.vendor_order ? `Order #ORD-${entry.vendor_order} • ` : ''}{entry.created_at ? new Date(entry.created_at).toLocaleString() : ''}
                    </span>
                  </div>
                  <span className={`font-mono font-bold ${amt < 0 ? 'text-red-600' : 'text-emerald-700'}`}>
                    {amt < 0 ? '− ' : ''}₹{Math.abs(amt).toFixed(2)}
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-4 bg-[#FFF8F2] rounded-2xl border border-[#EAE3DC] text-center text-xs text-[#6B6058]">
            No recent settlement ledger entries recorded yet.
          </div>
        )}
      </div>

      {/* Withdraw modal */}
      {withdrawOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs" onClick={() => !submitting && setWithdrawOpen(false)}>
          <form onSubmit={submitWithdrawal} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="withdraw-title"
            className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-6 space-y-4 animate-dropdown">
            <div className="flex items-center justify-between">
              <h3 id="withdraw-title" className="font-['Outfit'] font-extrabold text-lg text-[#FA661C] flex items-center gap-1.5"><ArrowDownToLine className="w-5 h-5" /> Withdraw Funds</h3>
              <button type="button" onClick={() => setWithdrawOpen(false)} className="p-1 rounded-lg text-[#6B6058] hover:bg-[#FFF3EC] cursor-pointer"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-3 rounded-2xl bg-[#FFF8F2] border border-[#EAE3DC] flex justify-between">
              <span className="text-[#6B6058]">Available</span><span className="font-mono font-black text-[#FA661C]">{inr(available)}</span>
            </div>
            <label className="block">
              <span className="font-bold text-[#6B6058] block mb-1.5">Amount</span>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-[#FA661C]">₹</span>
                <input type="number" step="0.01" min="0.01" max={available} required value={amount} onChange={(e) => setAmount(e.target.value)}
                  className="w-full pl-7 pr-16 py-2.5 rounded-xl border border-[#EAE3DC] bg-white font-mono font-bold text-sm focus:outline-none focus:border-[#FA661C]" />
                <button type="button" onClick={() => setAmount(available.toFixed(2))} className="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-1 rounded-lg bg-[#FFF3EC] text-[#FA661C] font-bold text-[10px] cursor-pointer">MAX</button>
              </div>
            </label>
            <p className="text-[11px] text-[#6B6058]">Paid to your verified {(payout?.method || 'bank account').replace(/_/g, ' ')} after admin approval. The amount is reserved while the request is pending.</p>
            {withdrawError && <div role="alert" className="flex gap-2 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700"><AlertCircle className="w-4 h-4 shrink-0" />{withdrawError}</div>}
            <button type="submit" disabled={submitting} className="w-full py-2.5 rounded-xl bg-[#FA661C] hover:bg-[#E0530B] text-white font-black inline-flex items-center justify-center gap-1.5 disabled:opacity-60 cursor-pointer">
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />} Request Withdrawal
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
