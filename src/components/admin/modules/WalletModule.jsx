import React, { useState } from 'react';
import { 
  getVendorWalletSummary, 
  getCustomerWalletSummary, 
  MASTER_VENDORS,
  formatINR 
} from '../../../data/adminFinanceEngine';
import { Wallet, ArrowDownLeft, ArrowUpRight, ShieldCheck, CheckCircle2, User, Store } from 'lucide-react';
import { useToast } from '../../../context/ToastContext';

export default function WalletModule() {
  const [activeTab, setActiveTab] = useState('vendor'); // 'vendor' | 'customer'
  const [selectedVendorId, setSelectedVendorId] = useState('vnd-1');
  const toast = useToast();

  const vendorWallet = getVendorWalletSummary(selectedVendorId);
  const customerWallet = getCustomerWalletSummary();

  const activeWallet = activeTab === 'vendor' ? vendorWallet : customerWallet;

  return (
    <div className="space-y-6">
      
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#D8E0DC]">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-1 rounded-lg bg-[#E8F2EE] text-[#0F3D2E]">
              <Wallet className="w-4 h-4" />
            </span>
            <h2 className="font-['Outfit'] font-black text-xl text-[#0F3D2E]">
              Wallet Central & Vault Escrow
            </h2>
          </div>
          <p className="text-xs text-[#5C6B63] mt-0.5">
            Strict Ledger Arithmetic: Displayed balance strictly equals Σ Credits − Σ Debits across every entry.
          </p>
        </div>

        {/* Tab Switcher: Vendor Escrow vs Customer Wallet */}
        <div className="flex items-center space-x-1.5 bg-[#E8F2EE] p-1 rounded-xl border border-[#D8E0DC] text-xs font-bold self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveTab('vendor')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center space-x-1.5 ${
              activeTab === 'vendor' ? 'bg-[#0F3D2E] text-[#FBF8F1] shadow-2xs' : 'text-[#5C6B63] hover:text-[#0F3D2E]'
            }`}
          >
            <Store className="w-3.5 h-3.5" />
            <span>Vendor Escrow Vault</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('customer')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center space-x-1.5 ${
              activeTab === 'customer' ? 'bg-[#0F3D2E] text-[#FBF8F1] shadow-2xs' : 'text-[#5C6B63] hover:text-[#0F3D2E]'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Customer Plus Wallet</span>
          </button>
        </div>
      </div>

      {/* 2. Vendor Selector if Vendor Tab is Active */}
      {activeTab === 'vendor' && (
        <div className="flex items-center space-x-2 overflow-x-auto pb-1 text-xs">
          <span className="font-bold text-[#5C6B63] shrink-0">Select Merchant:</span>
          {MASTER_VENDORS.slice(0, 2).map((v) => (
            <button
              key={v.id}
              type="button"
              onClick={() => setSelectedVendorId(v.id)}
              className={`px-3 py-1.5 rounded-xl font-bold border transition-all cursor-pointer ${
                selectedVendorId === v.id
                  ? 'bg-[#0F3D2E] text-[#FBF8F1] border-[#0F3D2E] shadow-2xs'
                  : 'bg-white text-[#5C6B63] border-[#D8E0DC] hover:border-[#D4AF37]'
              }`}
            >
              {v.name}
            </button>
          ))}
        </div>
      )}

      {/* 3. Wallet Balance Ribbon */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
        <div className="p-4 bg-[#FCF7E8] rounded-2xl border border-[#D4AF37]/60">
          <span className="text-[10px] font-bold text-[#0F3D2E] uppercase tracking-wider">
            Current Verified Balance
          </span>
          <div className="font-['Outfit'] font-black text-2xl text-[#0F3D2E] mt-1">
            {formatINR(activeWallet.currentBalance)}
          </div>
          <div className="flex items-center space-x-1 text-[10px] text-[#0F3D2E] font-bold mt-1">
            <CheckCircle2 className="w-3 h-3 text-[#0F3D2E]" />
            <span>Formula: {formatINR(activeWallet.totalCredits)} − {formatINR(activeWallet.totalDebits)}</span>
          </div>
        </div>

        <div className="p-4 bg-[#FBF8F1] rounded-2xl border border-[#D8E0DC]">
          <span className="text-[10px] font-bold text-[#5C6B63] uppercase tracking-wider">
            Total Credits (Inflow)
          </span>
          <div className="font-['Outfit'] font-black text-xl text-[#0F3D2E] mt-1">
            +{formatINR(activeWallet.totalCredits)}
          </div>
          <span className="text-[10px] text-[#5C6B63] mt-1 block">
            Settlement payouts, cashbacks & deposits
          </span>
        </div>

        <div className="p-4 bg-[#FBF8F1] rounded-2xl border border-[#D8E0DC]">
          <span className="text-[10px] font-bold text-[#5C6B63] uppercase tracking-wider">
            Total Debits (Outflow)
          </span>
          <div className="font-['Outfit'] font-black text-xl text-[#C0392B] mt-1">
            −{formatINR(activeWallet.totalDebits)}
          </div>
          <span className="text-[10px] text-[#5C6B63] mt-1 block">
            Disbursements, ad credits & checkouts
          </span>
        </div>
      </div>

      {/* 4. Complete Verified Ledger Table */}
      <div className="bg-white rounded-2xl border border-[#D8E0DC] overflow-hidden shadow-xs">
        <div className="p-4 border-b border-[#D8E0DC] bg-[#E8F2EE] flex items-center justify-between">
          <h3 className="font-['Outfit'] font-black text-sm text-[#0F3D2E]">
            Immutable Ledger Transaction History
          </h3>
          <span className="text-[10px] font-mono text-[#0F3D2E] bg-white px-2 py-0.5 rounded border border-[#D8E0DC]">
            {activeWallet.ledger.length} entries in audit log
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#FBF8F1] text-[#5C6B63] border-b border-[#D8E0DC] font-extrabold uppercase text-[10px] tracking-wider">
                <th className="p-3">Transaction ID</th>
                <th className="p-3">Date</th>
                <th className="p-3">Description</th>
                <th className="p-3 text-right">Credit (+)</th>
                <th className="p-3 text-right">Debit (−)</th>
                <th className="p-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#D8E0DC]/60 font-medium">
              {activeWallet.ledger.map((item) => (
                <tr key={item.id} className="hover:bg-[#FBF8F1] transition-colors">
                  <td className="p-3 font-mono font-bold text-[#0F3D2E]">
                    {item.id}
                  </td>
                  <td className="p-3 text-[#5C6B63]">
                    {item.date}
                  </td>
                  <td className="p-3 font-bold text-[#0F3D2E]">
                    {item.desc}
                  </td>
                  <td className="p-3 text-right font-mono font-bold text-[#0F3D2E]">
                    {item.credit > 0 ? `+${formatINR(item.credit)}` : '—'}
                  </td>
                  <td className="p-3 text-right font-mono font-bold text-[#C0392B]">
                    {item.debit > 0 ? `−${formatINR(item.debit)}` : '—'}
                  </td>
                  <td className="p-3 text-center">
                    <span className="text-[9px] font-extrabold uppercase bg-[#E8F2EE] text-[#0F3D2E] px-2 py-0.5 rounded-full">
                      Cleared
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
