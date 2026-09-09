import React, { useState } from 'react';
import { 
  MASTER_ORDERS, 
  MASTER_VENDORS, 
  calculateOrderTax, 
  calculateOrderSettlement,
  formatINR 
} from '../../../data/adminFinanceEngine';
import { Truck, Package, Download, Eye, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';
import { useToast } from '../../../context/ToastContext';

export default function OrderOpsModule() {
  const [selectedOrder, setSelectedOrder] = useState(null);
  const toast = useToast();

  const handlePrintInvoice = (order) => {
    toast.success("Tax Invoice Generated", `Downloading B2C GST Invoice for ${order.id}`);
  };

  return (
    <div className="space-y-6">
      
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#EAE3DC]">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-1 rounded-lg bg-[#FFF3EC] text-[#FA661C]">
              <Truck className="w-4 h-4" />
            </span>
            <h2 className="font-['Outfit'] font-black text-xl text-[#FA661C]">
              Order Management & Fulfillment Central
            </h2>
          </div>
          <p className="text-xs text-[#6B6058] mt-0.5">
            Full Lifecycle Tracking: Pending, Confirmed, Packed, Shipped, Delivered, RMA Return & Invoice Generation.
          </p>
        </div>

        <span className="text-xs font-bold text-[#FA661C] bg-[#FFF8F2] border border-[#FF811A]/50 px-3 py-1.5 rounded-xl self-start sm:self-auto">
          {MASTER_ORDERS.length} Active Orders in Ledger
        </span>
      </div>

      {/* 2. Order Table */}
      <div className="bg-white rounded-2xl border border-[#EAE3DC] overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#FFF3EC] text-[#FA661C] border-b border-[#EAE3DC] font-extrabold uppercase text-[10px] tracking-wider">
                <th className="p-3">Order ID & Date</th>
                <th className="p-3">Customer & Route</th>
                <th className="p-3">Item & Category</th>
                <th className="p-3 text-right">Gross Total</th>
                <th className="p-3 text-center">Status</th>
                <th className="p-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EAE3DC]/60 font-medium">
              {MASTER_ORDERS.map((order) => {
                const vendor = MASTER_VENDORS.find(v => v.id === order.vendorId);
                const isPendingRMA = order.orderStatus.includes('RMA') || order.orderStatus.includes('Return');

                return (
                  <tr key={order.id} className="hover:bg-[#FFFFFF] transition-colors">
                    <td className="p-3">
                      <span className="font-mono font-bold text-[#FA661C] block">{order.id}</span>
                      <span className="text-[10px] text-[#6B6058]">{order.date} • {order.time}</span>
                    </td>
                    <td className="p-3">
                      <span className="font-bold text-[#FA661C] block">{order.customerName}</span>
                      <span className="text-[10px] text-[#6B6058]">{order.customerState} ({order.customerStateCode})</span>
                    </td>
                    <td className="p-3">
                      <span className="font-bold text-[#FA661C] block truncate max-w-[220px]">{order.productName}</span>
                      <span className="text-[10px] text-[#6B6058]">Merchant: {vendor?.name} • SKU: {order.sku}</span>
                    </td>
                    <td className="p-3 text-right font-mono font-black text-[#FA661C]">
                      {formatINR(order.grossAmount)}
                      <span className="text-[9px] text-[#6B6058] block">Paid via {order.paymentMethod}</span>
                    </td>
                    <td className="p-3 text-center">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                        isPendingRMA
                          ? 'bg-[#FDE8EA] text-[#D7263D] border border-[#D7263D]/30 animate-pulse'
                          : order.orderStatus === 'Delivered'
                          ? 'bg-[#FFF3EC] text-[#FA661C]'
                          : 'bg-[#FFF8F2] text-[#FA661C] border border-[#FF811A]/40'
                      }`}>
                        {order.orderStatus}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center space-x-1.5">
                        <button
                          type="button"
                          onClick={() => handlePrintInvoice(order)}
                          className="p-1.5 rounded-lg bg-[#FFFFFF] hover:bg-[#FFF3EC] border border-[#EAE3DC] text-[#FA661C] icon-interactive cursor-pointer"
                          title="Download GST Invoice"
                        >
                          <Download className="w-3.5 h-3.5 text-[#FF811A]" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
