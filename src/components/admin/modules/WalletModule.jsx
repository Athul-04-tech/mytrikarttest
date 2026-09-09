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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#EAE3DC]">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-1 rounded-lg bg-[#FFF3EC] text-[#FA661C]">
              <Wallet className="w-4 h-4" />
            </span>
            <h2 className="font-['Outfit'] font-black text-xl text-[#FA661C]">
              Wallet Central & Vault Escrow
            </h2>
          </div>
          <p className="text-xs text-[#6B6058] mt-0.5">
            Strict Ledger Arithmetic: Displayed balance strictly equals Σ Credits − Σ Debits across every entry.
          </p>
        </div>

        {/* Tab Switcher: Vendor Escrow vs Customer Wallet */}
        <div className="flex items-center space-x-1.5 bg-[#FFF3EC] p-1 rounded-xl border border-[#EAE3DC] text-xs font-bold self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveTab('vendor')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center space-x-1.5 ${
              activeTab === 'vendor' ? 'bg-[#FA661C] text-[#FFFFFF] shadow-2xs' : 'text-[#6B6058] hover:text-[#FA661C]'
            }`}
          >
            <Store className="w-3.5 h-3.5" />
            <span>Vendor Escrow Vault</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('customer')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center space-x-1.5 ${
              activeTab === 'customer' ? 'bg-[#FA661C] text-[#FFFFFF] shadow-2xs' : 'text-[#6B6058] hover:text-[#FA661C]'
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
          <span className="font-bold text-[#6B6058] shrink-0">Select Merchant:</span>
          {MASTER_VENDORS.slice(0, 2).map((v) => (
            <button
              key={v.id}
              type="button"
              onClick={() => setSelectedVendorId(v.id)}
              className={`px-3 py-1.5 rounded-xl font-bold border transition-all cursor-pointer ${
                selectedVendorId === v.id
                  ? 'bg-[#FA661C] text-[#FFFFFF] border-[#FA661C] shadow-2xs'
                  : 'bg-white text-[#6B6058] border-[#EAE3DC] hover:border-[#FF811A]'
              }`}
            >
              {v.name}
            </button>
          ))}
        </div>
      )}

      {/* 3. Wallet Balance Ribbon */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
        <div className="p-4 bg-[#FFF8F2] rounded-2xl border border-[#FF811A]/60">
          <span className="text-[10px] font-bold text-[#FA661C] uppercase tracking-wider">
            Current Verified Balance
          </span>
          <div className="font-['Outfit'] font-black text-2xl text-[#FA661C] mt-1">
            {formatINR(activeWallet.currentBalance)}
          </div>
          <div className="flex items-center space-x-1 text-[10px] text-[#FA661C] font-bold mt-1">
            <CheckCircle2 className="w-3 h-3 text-[#FA661C]" />
            <span>Formula: {formatINR(activeWallet.totalCredits)} − {formatINR(activeWallet.totalDebits)}</span>
          </div>
        </div>

        <div className="p-4 bg-[#FFFFFF] rounded-2xl border border-[#EAE3DC]">
          <span className="text-[10px] font-bold text-[#6B6058] uppercase tracking-wider">
            Total Credits (Inflow)
          </span>
          <div className="font-['Outfit'] font-black text-xl text-[#FA661C] mt-1">
            +{formatINR(activeWallet.totalCredits)}
          </div>
          <span className="text-[10px] text-[#6B6058] mt-1 block">
            Settlement payouts, cashbacks & deposits
          </span>
        </div>

        <div className="p-4 bg-[#FFFFFF] rounded-2xl border border-[#EAE3DC]">
          <span className="text-[10px] font-bold text-[#6B6058] uppercase tracking-wider">
            Total Debits (Outflow)
          </span>
          <div className="font-['Outfit'] font-black text-xl text-[#D7263D] mt-1">
            −{formatINR(activeWallet.totalDebits)}
          </div>
          <span className="text-[10px] text-[#6B6058] mt-1 block">
            Disbursements, ad credits & checkouts
          </span>
        </div>
      </div>

      {/* 4. Complete Verified Ledger Table */}
      <div className="bg-white rounded-2xl border border-[#EAE3DC] overflow-hidden shadow-xs">
        <div className="p-4 border-b border-[#EAE3DC] bg-[#FFF3EC] flex items-center justify-between">
          <h3 className="font-['Outfit'] font-black text-sm text-[#FA661C]">
            Immutable Ledger Transaction History
          </h3>
          <span className="text-[10px] font-mono text-[#FA661C] bg-white px-2 py-0.5 rounded border border-[#EAE3DC]">
            {activeWallet.ledger.length} entries in audit log
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#FFFFFF] text-[#6B6058] border-b border-[#EAE3DC] font-extrabold uppercase text-[10px] tracking-wider">
                <th className="p-3">Transaction ID</th>
                <th className="p-3">Date</th>
                <th className="p-3">Description</th>
                <th className="p-3 text-right">Credit (+)</th>
                <th className="p-3 text-right">Debit (−)</th>
                <th className="p-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EAE3DC]/60 font-medium">
              {activeWallet.ledger.map((item) => (
                <tr key={item.id} className="hover:bg-[#FFFFFF] transition-colors">
                  <td className="p-3 font-mono font-bold text-[#FA661C]">
                    {item.id}
                  </td>
                  <td className="p-3 text-[#6B6058]">
                    {item.date}
                  </td>
                  <td className="p-3 font-bold text-[#FA661C]">
                    {item.desc}
                  </td>
                  <td className="p-3 text-right font-mono font-bold text-[#FA661C]">
                    {item.credit > 0 ? `+${formatINR(item.credit)}` : '—'}
                  </td>
                  <td className="p-3 text-right font-mono font-bold text-[#D7263D]">
                    {item.debit > 0 ? `−${formatINR(item.debit)}` : '—'}
                  </td>
                  <td className="p-3 text-center">
                    <span className="text-[9px] font-extrabold uppercase bg-[#FFF3EC] text-[#FA661C] px-2 py-0.5 rounded-full">
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
