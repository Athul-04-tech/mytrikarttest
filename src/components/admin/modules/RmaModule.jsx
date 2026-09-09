import React, { useState } from 'react';
import { MASTER_ORDERS, formatINR } from '../../../data/adminFinanceEngine';
import { RotateCcw, ShieldCheck, CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react';
import { useToast } from '../../../context/ToastContext';

export default function RmaModule() {
  const [rmaOrders, setRmaOrders] = useState(
    MASTER_ORDERS.filter(o => o.orderStatus.includes('RMA') || o.orderStatus.includes('Return'))
  );
  const toast = useToast();

  const handleApproveRefund = (order) => {
    setRmaOrders(prev => prev.filter(o => o.id !== order.id));
    toast.success("RMA Refund Processed", `Credit of ${formatINR(order.grossAmount)} transferred to ${order.customerName}'s Plus Wallet.`);
  };

  return (
    <div className="space-y-6">
      
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#EAE3DC]">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-1 rounded-lg bg-[#FDE8EA] text-[#D7263D]">
              <RotateCcw className="w-4 h-4" />
            </span>
            <h2 className="font-['Outfit'] font-black text-xl text-[#FA661C]">
              Returns, Refunds & RMA Central
            </h2>
          </div>
          <p className="text-xs text-[#6B6058] mt-0.5">
            Post-Order Reverse Logistics: Pickup Verification, Quality Inspection & Customer Wallet Refunds.
          </p>
        </div>

        <span className="text-xs font-bold text-[#D7263D] bg-[#FDE8EA] border border-[#D7263D]/30 px-3 py-1.5 rounded-xl self-start sm:self-auto">
          {rmaOrders.length} Pending Inspection
        </span>
      </div>

      {/* 2. RMA Table */}
      {rmaOrders.length > 0 ? (
        <div className="bg-white rounded-2xl border border-[#EAE3DC] overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#FFF3EC] text-[#FA661C] border-b border-[#EAE3DC] font-extrabold uppercase text-[10px] tracking-wider">
                  <th className="p-3">RMA ID & Date</th>
                  <th className="p-3">Customer</th>
                  <th className="p-3">Returned Product</th>
                  <th className="p-3 text-right">Refund Amount</th>
                  <th className="p-3 text-center">Inspection Status</th>
                  <th className="p-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EAE3DC]/60 font-medium">
                {rmaOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-[#FFFFFF] transition-colors">
                    <td className="p-3 font-mono font-bold text-[#FA661C]">
                      {order.id}
                      <span className="text-[10px] text-[#6B6058] block font-sans">{order.date}</span>
                    </td>
                    <td className="p-3">
                      <span className="font-bold text-[#FA661C] block">{order.customerName}</span>
                      <span className="text-[10px] text-[#6B6058]">{order.customerState}</span>
                    </td>
                    <td className="p-3">
                      <span className="font-bold text-[#FA661C] block">{order.productName}</span>
                      <span className="text-[10px] text-[#6B6058]">Reason: Size replacement request</span>
                    </td>
                    <td className="p-3 text-right font-black font-mono text-[#D7263D]">
                      {formatINR(order.grossAmount)}
                    </td>
                    <td className="p-3 text-center">
                      <span className="bg-[#FDE8EA] text-[#D7263D] border border-[#D7263D]/30 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase">
                        Warehouse QC Passed
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <button
                        type="button"
                        onClick={() => handleApproveRefund(order)}
                        className="px-3 py-1.5 rounded-xl bg-[#FA661C] text-[#FF811A] font-bold text-[10px] btn-interactive cursor-pointer shadow-xs"
                      >
                        Approve Wallet Refund
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="p-12 text-center bg-white rounded-2xl border border-[#EAE3DC] space-y-2">
          <CheckCircle2 className="w-12 h-12 text-[#FA661C] mx-auto" />
          <h3 className="font-['Outfit'] font-bold text-base text-[#FA661C]">
            All RMA Inquiries Cleared
          </h3>
          <p className="text-xs text-[#6B6058]">
            Zero pending customer refunds or inspection holds in queue.
          </p>
        </div>
      )}

    </div>
  );
}
