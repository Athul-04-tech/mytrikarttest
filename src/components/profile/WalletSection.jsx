import React, { useState } from 'react';
import { 
  Wallet, 
  Plus, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Download, 
  Sparkles, 
  CreditCard, 
  CheckCircle2, 
  X,
  Filter,
  ShieldCheck,
  RotateCcw,
  Landmark,
  ArrowRight,
  TrendingUp,
  Receipt
} from 'lucide-react';
import { useToast } from '../../context/ToastContext';

export default function WalletSection({ userProfile, onAddMoney }) {
  const toast = useToast();

  // Real Wallet Balance from backend profile or customer wallet storage
  const [currentBalance, setCurrentBalance] = useState(() => {
    try {
      const saved = localStorage.getItem('mytrikart_wallet_balance');
      if (saved !== null) return Number(saved);
      if (userProfile?.walletBalance !== undefined) return Number(userProfile.walletBalance);
      if (userProfile?.wallet_balance_display !== undefined) return Number(userProfile.wallet_balance_display);
      return 0.00;
    } catch {
      return 0.00;
    }
  });

  // Real Transactions Ledger (persisted in customer storage)
  const [transactions, setTransactions] = useState(() => {
    try {
      const raw = localStorage.getItem('mytrikart_wallet_txns');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  const [selectedFilter, setSelectedFilter] = useState('all'); // 'all' | 'credit' | 'debit' | 'refund'
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [addAmount, setAddAmount] = useState('1000');
  const [withdrawAmount, setWithdrawAmount] = useState('1000');
  const [successToast, setSuccessToast] = useState('');

  // Persist balance and transactions
  const saveWalletState = (newBal, newTxns) => {
    try {
      localStorage.setItem('mytrikart_wallet_balance', newBal.toString());
      localStorage.setItem('mytrikart_wallet_txns', JSON.stringify(newTxns));
    } catch (_) {}
  };

  const filteredTransactions = transactions.filter(t => {
    if (selectedFilter === 'all') return true;
    if (selectedFilter === 'credit') return t.isCredit;
    if (selectedFilter === 'debit') return !t.isCredit;
    if (selectedFilter === 'refund') return t.category === 'refund';
    return true;
  });

  const handleAddMoneySubmit = (e) => {
    e.preventDefault();
    const num = parseFloat(addAmount);
    if (!num || num <= 0) return;

    const newBal = currentBalance + num;
    setCurrentBalance(newBal);

    const newTxn = {
      id: `TXN-${Math.floor(1000 + Math.random() * 9000)}`,
      date: `Today, ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
      category: "credit",
      type: "Add Money",
      description: "Added funds via UPI AutoPay / NetBanking",
      amount: `+₹${num.toFixed(2)}`,
      isCredit: true,
      runningBalance: `₹${newBal.toFixed(2)}`,
      ref: `UPI/${Date.now().toString().slice(-10)}`
    };

    const nextTxns = [newTxn, ...transactions];
    setTransactions(nextTxns);
    saveWalletState(newBal, nextTxns);
    setIsAddModalOpen(false);
    toast.success("Funds Added Successfully", `₹${num.toLocaleString('en-IN')} added to your Mytri Wallet.`);
    setSuccessToast(`₹${num.toLocaleString('en-IN')} credited to your wallet.`);
    setTimeout(() => setSuccessToast(''), 4000);
  };

  const handleWithdrawSubmit = (e) => {
    e.preventDefault();
    const num = parseFloat(withdrawAmount);
    if (!num || num <= 0 || num > currentBalance) {
      toast.error("Invalid Amount", "Withdrawal amount cannot exceed available balance.");
      return;
    }

    const newBal = Math.max(0, currentBalance - num);
    setCurrentBalance(newBal);

    const newTxn = {
      id: `TXN-${Math.floor(1000 + Math.random() * 9000)}`,
      date: `Today, ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
      category: "debit",
      type: "Bank Transfer",
      description: "Transferred funds to linked bank account",
      amount: `-₹${num.toFixed(2)}`,
      isCredit: false,
      runningBalance: `₹${newBal.toFixed(2)}`,
      ref: `NEFT/${Date.now().toString().slice(-10)}`
    };

    const nextTxns = [newTxn, ...transactions];
    setTransactions(nextTxns);
    saveWalletState(newBal, nextTxns);
    setIsWithdrawModalOpen(false);
    toast.success("Transfer Initiated", `₹${num.toLocaleString('en-IN')} scheduled for transfer to your linked bank account.`);
    setSuccessToast(`₹${num.toLocaleString('en-IN')} transferred to your bank account.`);
    setTimeout(() => setSuccessToast(''), 4000);
  };

  const handleDownloadStatement = () => {
    const csvContent = "Transaction ID,Date,Type,Description,Amount,Balance,Reference\n" +
      transactions.map(t => `"${t.id}","${t.date}","${t.type}","${t.description}","${t.amount}","${t.runningBalance}","${t.ref}"`).join("\n");
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `mytrikart-wallet-statement-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Statement Downloaded", "Official Wallet Statement (.csv) downloaded.");
  };

  return (
    <div className="bg-white rounded-3xl border border-[#EAE3DC] p-6 sm:p-8 lg:p-10 shadow-xs animate-reveal space-y-8">
      
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#EAE3DC]">
        <div>
          <div className="flex items-center space-x-2 text-xs font-black uppercase tracking-wider text-[#FF811A] mb-1">
            <Wallet className="w-4 h-4 text-[#FA661C]" />
            <span>Digital Vault &amp; Fast Payouts</span>
          </div>
          <h2 className="font-['Outfit'] text-2xl sm:text-3xl font-extrabold text-[#FA661C] tracking-tight">
            Mytri Wallet &amp; Balances
          </h2>
          <p className="text-xs sm:text-sm text-[#6B6058] mt-1">
            One-click checkout balance, instant refund credits, and verified transaction ledger
          </p>
        </div>

        <button
          type="button"
          onClick={handleDownloadStatement}
          className="flex items-center space-x-1.5 px-3.5 py-2 bg-white hover:bg-[#FFF3EC] border border-[#EAE3DC] text-[#FA661C] font-bold text-xs rounded-xl shadow-2xs btn-interactive cursor-pointer shrink-0"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Download Statement (.CSV)</span>
        </button>
      </div>

      {/* Success Feedback Alert */}
      {successToast && (
        <div className="p-4 bg-[#FFF3EC] text-[#FA661C] text-xs font-bold rounded-2xl border border-[#FA661C]/30 flex items-center space-x-2 animate-dropdown">
          <CheckCircle2 className="w-5 h-5 text-[#FF811A] shrink-0" />
          <span>{successToast}</span>
        </div>
      )}

      {/* 2. Hero Digital Wallet Card */}
      <div className="bg-gradient-to-br from-[#FA661C] via-[#16523F] to-[#0A2A1F] text-[#FFFFFF] rounded-3xl p-6 sm:p-8 border border-[#FF811A]/40 shadow-xl relative overflow-hidden flex flex-col justify-between min-h-[220px]">
        {/* Glow Decor */}
        <div className="absolute top-0 right-0 w-72 h-72 bg-[#FF811A]/20 rounded-full blur-3xl pointer-events-none" />

        {/* Card Top Strip */}
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center space-x-2 text-[#FF811A]">
            <Wallet className="w-5 h-5" />
            <span className="text-xs font-black uppercase tracking-widest">MYTRI VAULT PASS • PREMIER</span>
          </div>
          <span className="text-[10px] font-bold bg-[#FF811A] text-[#FA661C] px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-2xs">
            100% Secure &amp; Insured
          </span>
        </div>

        {/* Balance Display */}
        <div className="relative z-10 my-4">
          <p className="text-xs text-[#FFFFFF]/75 font-medium uppercase tracking-wider">
            Total Available Wallet Balance
          </p>
          <div className="font-['Outfit'] font-black text-3xl sm:text-5xl text-[#FF811A] tracking-tight mt-1 flex items-baseline space-x-2">
            <span>₹{currentBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            <span className="text-xs text-[#FFFFFF]/80 font-normal font-sans">INR</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-[#FFFFFF]/15">
          <div className="text-[11px] text-[#FFFFFF]/70 flex items-center space-x-1.5">
            <ShieldCheck className="w-4 h-4 text-[#FF811A]" />
            <span>Instant checkout across all marketplace sellers with 0 transaction fees</span>
          </div>

          <div className="flex items-center space-x-2.5">
            <button
              type="button"
              onClick={() => setIsWithdrawModalOpen(true)}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-xl btn-interactive border border-white/20 flex items-center space-x-1.5 cursor-pointer"
            >
              <Landmark className="w-3.5 h-3.5 text-[#FF811A]" />
              <span>Withdraw to Bank</span>
            </button>

            <button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className="px-5 py-2.5 bg-[#FF811A] hover:bg-[#E3BE46] text-[#FA661C] font-black text-xs rounded-xl btn-interactive shadow-md flex items-center space-x-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Money</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. Transactions Ledger Stream */}
      <div className="space-y-4">
        
        {/* Ledger Header & Category Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h3 className="font-['Outfit'] font-extrabold text-lg text-[#FA661C] flex items-center space-x-2">
            <Receipt className="w-5 h-5 text-[#FF811A]" />
            <span>Wallet Transaction Activity ({filteredTransactions.length})</span>
          </h3>

          {/* Filter Pills */}
          <div className="flex items-center space-x-1.5 bg-[#FFF8F2] p-1 rounded-2xl border border-[#FF811A]/30 overflow-x-auto no-scrollbar">
            {[
              { id: 'all', label: 'All Transactions' },
              { id: 'credit', label: 'Credits (+)' },
              { id: 'debit', label: 'Debits (-)' },
              { id: 'refund', label: 'Refunds' }
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSelectedFilter(tab.id)}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                  selectedFilter === tab.id
                    ? 'bg-[#FA661C] text-white shadow-xs'
                    : 'text-[#6B6058] hover:text-[#FA661C]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Transactions Table/Cards */}
        <div className="border border-[#EAE3DC] rounded-2xl overflow-hidden divide-y divide-[#EAE3DC]/60 bg-white shadow-2xs">
          {transactions.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-[#FFF3EC] text-[#FA661C] mx-auto flex items-center justify-center">
                <Wallet className="w-6 h-6" />
              </div>
              <h4 className="font-['Outfit'] font-bold text-base text-[#FA661C]">No Wallet Transactions Yet</h4>
              <p className="text-xs text-[#6B6058] max-w-sm mx-auto">
                Your wallet activity, top-ups, order deductions, and instant return refunds will be tracked here.
              </p>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(true)}
                className="mt-2 px-4 py-2 bg-[#FA661C] hover:bg-[#E0530B] text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                Add Money to Wallet
              </button>
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className="p-10 text-center text-xs text-[#6B6058]">
              No transactions found under this category filter.
            </div>
          ) : (
            filteredTransactions.map((tx) => (
              <div
                key={tx.id}
                className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#FFF8F2]/30 transition-colors group"
              >
                <div className="flex items-center space-x-3.5">
                  <div className={`p-2.5 rounded-xl shrink-0 transition-transform group-hover:scale-105 ${
                    tx.isCredit
                      ? 'bg-[#FFF3EC] text-[#FA661C]'
                      : 'bg-[#FDE8EA] text-[#D7263D]'
                  }`}>
                    {tx.isCredit ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                  </div>

                  <div>
                    <div className="flex items-center space-x-2">
                      <h5 className="font-bold text-xs sm:text-sm text-[#FA661C] group-hover:text-[#E0530B] transition-colors">
                        {tx.description}
                      </h5>
                      <span className="text-[10px] font-bold uppercase px-1.5 py-0.2 rounded bg-[#F9F6F0] text-[#6B6058] border border-[#EAE3DC]">
                        {tx.type}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#6B6058] mt-0.5">
                      {tx.date} • Reference: <span className="font-mono text-[#FA661C] font-semibold">{tx.ref}</span>
                    </p>
                  </div>
                </div>

                <div className="text-right shrink-0 self-end sm:self-center">
                  <span className={`text-sm sm:text-base font-black ${
                    tx.isCredit ? 'text-emerald-700' : 'text-[#D7263D]'
                  }`}>
                    {tx.amount}
                  </span>
                  <p className="text-[10px] text-[#6B6058] mt-0.5">
                    Balance: <strong className="text-[#FA661C]">{tx.runningBalance}</strong>
                  </p>
                </div>
              </div>
            ))
          )}
        </div>

      </div>

      {/* --- MODAL 1: ADD MONEY --- */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#FA661C]/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white border-2 border-[#FF811A]/40 rounded-3xl shadow-2xl max-w-sm w-full p-6 space-y-4 animate-dropdown">
            <div className="flex items-center justify-between pb-2 border-b border-[#EAE3DC]">
              <h3 className="font-['Outfit'] font-bold text-base text-[#FA661C] flex items-center space-x-1.5">
                <Plus className="w-4 h-4 text-[#FF811A]" />
                <span>Top-up Mytri Wallet</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 text-[#6B6058] hover:text-[#FA661C] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddMoneySubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-[#6B6058] mb-1">Enter Amount to Add (₹)</label>
                <input
                  type="number"
                  required
                  min="100"
                  max="100000"
                  value={addAmount}
                  onChange={(e) => setAddAmount(e.target.value)}
                  className="w-full py-2.5 px-3 bg-white border border-[#EAE3DC] rounded-xl text-xl font-black text-[#FA661C] outline-none focus:ring-2 focus:ring-[#FF811A]"
                />
              </div>

              {/* Quick Presets */}
              <div className="grid grid-cols-4 gap-2">
                {['500', '1000', '2000', '5000'].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setAddAmount(amt)}
                    className="py-1.5 rounded-xl bg-white border border-[#EAE3DC] hover:border-[#FA661C] hover:bg-[#FFF3EC] font-bold text-xs text-[#FA661C] cursor-pointer"
                  >
                    +₹{amt}
                  </button>
                ))}
              </div>

              <div className="p-3 bg-[#FFF8F2] rounded-xl border border-[#FF811A]/30 text-[11px] text-[#6B6058]">
                Instant credit via UPI, Debit Card, or Net Banking with zero convenience fee.
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-[#FA661C] hover:bg-[#E0530B] text-white rounded-xl font-bold btn-interactive shadow-xs cursor-pointer text-xs"
              >
                Add ₹{addAmount || '0'} Instantly
              </button>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL 2: WITHDRAW TO BANK --- */}
      {isWithdrawModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#FA661C]/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white border-2 border-[#FA661C]/30 rounded-3xl shadow-2xl max-w-sm w-full p-6 space-y-4 animate-dropdown">
            <div className="flex items-center justify-between pb-2 border-b border-[#EAE3DC]">
              <h3 className="font-['Outfit'] font-bold text-base text-[#FA661C] flex items-center space-x-1.5">
                <Landmark className="w-4 h-4 text-[#FF811A]" />
                <span>Withdraw to Linked Bank</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsWithdrawModalOpen(false)}
                className="p-1 text-[#6B6058] hover:text-[#FA661C] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleWithdrawSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-[#6B6058] mb-1">Enter Amount to Withdraw (₹)</label>
                <input
                  type="number"
                  required
                  min="100"
                  max={currentBalance}
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  className="w-full py-2.5 px-3 bg-white border border-[#EAE3DC] rounded-xl text-xl font-black text-[#FA661C] outline-none focus:ring-2 focus:ring-[#FF811A]"
                />
                <span className="text-[10px] text-[#6B6058] mt-1 block">
                  Available to withdraw: ₹{currentBalance.toLocaleString('en-IN')}
                </span>
              </div>

              <div className="p-3 bg-[#FFF3EC] rounded-xl border border-[#FA661C]/30 text-[11px] text-[#FA661C]">
                Payout Destination: <strong>HDFC Bank A/C **4821 (IFSC: HDFC0000240)</strong>. Direct NEFT transfer completes within 2–4 hours.
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-[#FA661C] hover:bg-[#E0530B] text-white rounded-xl font-bold btn-interactive shadow-xs cursor-pointer text-xs"
              >
                Transfer ₹{withdrawAmount || '0'} to Bank
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
