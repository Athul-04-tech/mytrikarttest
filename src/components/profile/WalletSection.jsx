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
  X 
} from 'lucide-react';
import { MOCK_TRANSACTIONS } from '../../data/profileMockData';

export default function WalletSection({ balance = 4850.00, onAddMoney }) {
  const [currentBalance, setCurrentBalance] = useState(balance);
  const [transactions, setTransactions] = useState(MOCK_TRANSACTIONS);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addAmount, setAddAmount] = useState('1000');
  const [successToast, setSuccessToast] = useState(false);

  const handleAddMoneySubmit = (e) => {
    e.preventDefault();
    const num = parseFloat(addAmount);
    if (!num || num <= 0) return;

    const newBal = currentBalance + num;
    setCurrentBalance(newBal);

    const newTxn = {
      id: `TXN-${Math.floor(1000 + Math.random() * 9000)}`,
      date: "Today",
      type: "Add Money",
      description: "Added funds via UPI AutoPay",
      amount: `+₹${num.toLocaleString('en-IN')}.00`,
      isCredit: true,
      runningBalance: `₹${newBal.toLocaleString('en-IN')}.00`
    };

    setTransactions([newTxn, ...transactions]);
    setIsAddModalOpen(false);
    setSuccessToast(true);
    setTimeout(() => setSuccessToast(false), 3000);
  };

  return (
    <div className="bg-white rounded-3xl border border-[#EAE3DC] p-6 sm:p-8 lg:p-10 shadow-xs animate-reveal">
      
      {/* Header */}
      <div className="pb-6 border-b border-[#EAE3DC]">
        <h2 className="font-['Outfit'] text-2xl sm:text-3xl font-extrabold text-[#FA661C] tracking-tight">
          Mytri Wallet
        </h2>
        <p className="text-xs sm:text-sm text-[#6B6058] mt-1">
          Instant 1-click checkout balance, cashback rewards, and refund credits
        </p>
      </div>

      {/* Success Toast */}
      {successToast && (
        <div className="mt-4 p-3 bg-[#FFF3EC] text-[#FA661C] text-xs font-bold rounded-xl border border-[#FA661C]/20 flex items-center space-x-2 animate-dropdown">
          <CheckCircle2 className="w-4 h-4 text-[#FF811A]" />
          <span>Funds added to Mytri Wallet successfully!</span>
        </div>
      )}

      {/* Hero Wallet Card */}
      <div className="mt-8 bg-gradient-to-br from-[#FA661C] via-[#16523F] to-[#0A2A1F] text-[#FFFFFF] rounded-3xl p-6 sm:p-8 border border-[#FF811A]/40 shadow-xl relative overflow-hidden flex flex-col justify-between min-h-[200px] card-interactive">
        {/* Glow Decor */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#FF811A]/15 rounded-full blur-3xl pointer-events-none" />

        {/* Card Header */}
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center space-x-2 text-[#FF811A]">
            <Wallet className="w-5 h-5 icon-interactive" />
            <span className="text-xs font-black uppercase tracking-widest">MYTRI VAULT PASS</span>
          </div>
          <span className="text-[10px] font-bold bg-[#FF811A] text-[#FA661C] px-2 py-0.5 rounded-full uppercase tracking-wider shadow-2xs">
            Active Card
          </span>
        </div>

        {/* Hero Balance Typography */}
        <div className="relative z-10 my-4">
          <p className="text-xs text-[#FFFFFF]/75 font-medium uppercase tracking-wider">
            Total Available Balance
          </p>
          <div className="font-['Outfit'] font-black text-3xl sm:text-5xl text-[#FF811A] tracking-tight mt-1">
            ₹{currentBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
        </div>

        {/* Card Footer Actions */}
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-[#FFFFFF]/15">
          <div className="text-[11px] text-[#FFFFFF]/70">
            Usable across 100% of marketplace sellers with 0 transaction fees
          </div>

          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="px-5 py-2.5 bg-[#FF811A] hover:bg-[#E3BE46] text-[#FA661C] font-black text-xs rounded-xl btn-interactive shadow-md flex items-center space-x-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4 icon-interactive" />
            <span>Add Funds</span>
          </button>
        </div>
      </div>

      {/* Transactions Ledger Stream */}
      <div className="mt-10">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-['Outfit'] font-extrabold text-lg text-[#FA661C]">
            Recent Transactions
          </h3>
          <button
            type="button"
            onClick={() => alert("Downloading PDF Wallet Statement...")}
            className="text-xs font-bold text-[#FA661C] hover:text-[#FF811A] link-interactive flex items-center space-x-1 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 icon-interactive" />
            <span>Download Statement</span>
          </button>
        </div>

        <div className="border border-[#EAE3DC] rounded-2xl overflow-hidden divide-y divide-[#EAE3DC]/60 bg-[#FFFFFF]/30">
          {transactions.map((tx) => (
            <div
              key={tx.id}
              className="p-4 sm:p-4.5 flex items-center justify-between gap-3 hover:bg-[#FFF8F2]/40 transition-colors cursor-pointer group"
            >
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-xl shrink-0 transition-transform group-hover:scale-110 ${
                  tx.isCredit
                    ? 'bg-[#FFF3EC] text-[#FA661C]'
                    : 'bg-[#FDE8EA] text-[#D7263D]'
                }`}>
                  {tx.isCredit ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                </div>
                <div>
                  <h5 className="font-bold text-xs sm:text-sm text-[#FA661C] group-hover:text-[#E0530B] transition-colors">
                    {tx.description}
                  </h5>
                  <p className="text-[11px] text-[#6B6058]">
                    {tx.date} • <span className="font-mono text-[#FA661C]">{tx.id}</span>
                  </p>
                </div>
              </div>

              <div className="text-right shrink-0">
                <span className={`text-xs sm:text-sm font-extrabold ${
                  tx.isCredit ? 'text-[#FA661C]' : 'text-[#D7263D]'
                }`}>
                  {tx.amount}
                </span>
                <p className="text-[10px] text-[#6B6058]">
                  Bal: {tx.runningBalance}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add Money Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#FA661C]/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-[#FFFFFF] border border-[#FF811A]/40 rounded-3xl shadow-2xl max-w-sm w-full p-6 space-y-4 animate-dropdown">
            <div className="flex items-center justify-between pb-2 border-b border-[#EAE3DC]">
              <h3 className="font-['Outfit'] font-bold text-base text-[#FA661C] flex items-center space-x-1.5">
                <Plus className="w-4 h-4 text-[#FF811A]" />
                <span>Add Money to Wallet</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 text-[#6B6058] hover:text-[#FA661C] icon-interactive cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddMoneySubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-[#6B6058] mb-1">Enter Amount (₹)</label>
                <input
                  type="number"
                  required
                  min="100"
                  max="50000"
                  value={addAmount}
                  onChange={(e) => setAddAmount(e.target.value)}
                  className="w-full py-2.5 px-3 bg-white border border-[#EAE3DC] rounded-xl text-lg font-black text-[#FA661C] input-interactive"
                />
              </div>

              {/* Quick Amount Pills */}
              <div className="grid grid-cols-3 gap-2">
                {['500', '1000', '2000'].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setAddAmount(amt)}
                    className="py-1.5 rounded-lg bg-white border border-[#EAE3DC] hover:border-[#FA661C] font-bold text-[#FA661C] btn-interactive cursor-pointer"
                  >
                    +₹{amt}
                  </button>
                ))}
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-[#FA661C] hover:bg-[#E0530B] text-[#FFFFFF] rounded-xl font-bold btn-interactive shadow-sm cursor-pointer"
              >
                Proceed to Add ₹{addAmount || '0'}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
