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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#D8E0DC]">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-1 rounded-lg bg-[#E8F2EE] text-[#0F3D2E]">
              <Truck className="w-4 h-4" />
            </span>
            <h2 className="font-['Outfit'] font-black text-xl text-[#0F3D2E]">
              Order Management & Fulfillment Central
            </h2>
          </div>
          <p className="text-xs text-[#5C6B63] mt-0.5">
            Full Lifecycle Tracking: Pending, Confirmed, Packed, Shipped, Delivered, RMA Return & Invoice Generation.
          </p>
        </div>

        <span className="text-xs font-bold text-[#0F3D2E] bg-[#FCF7E8] border border-[#D4AF37]/50 px-3 py-1.5 rounded-xl self-start sm:self-auto">
          {MASTER_ORDERS.length} Active Orders in Ledger
        </span>
      </div>

      {/* 2. Order Table */}
      <div className="bg-white rounded-2xl border border-[#D8E0DC] overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#E8F2EE] text-[#0F3D2E] border-b border-[#D8E0DC] font-extrabold uppercase text-[10px] tracking-wider">
                <th className="p-3">Order ID & Date</th>
                <th className="p-3">Customer & Route</th>
                <th className="p-3">Item & Category</th>
                <th className="p-3 text-right">Gross Total</th>
                <th className="p-3 text-center">Status</th>
                <th className="p-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#D8E0DC]/60 font-medium">
              {MASTER_ORDERS.map((order) => {
                const vendor = MASTER_VENDORS.find(v => v.id === order.vendorId);
                const isPendingRMA = order.orderStatus.includes('RMA') || order.orderStatus.includes('Return');

                return (
                  <tr key={order.id} className="hover:bg-[#FBF8F1] transition-colors">
                    <td className="p-3">
                      <span className="font-mono font-bold text-[#0F3D2E] block">{order.id}</span>
                      <span className="text-[10px] text-[#5C6B63]">{order.date} • {order.time}</span>
                    </td>
                    <td className="p-3">
                      <span className="font-bold text-[#0F3D2E] block">{order.customerName}</span>
                      <span className="text-[10px] text-[#5C6B63]">{order.customerState} ({order.customerStateCode})</span>
                    </td>
                    <td className="p-3">
                      <span className="font-bold text-[#0F3D2E] block truncate max-w-[220px]">{order.productName}</span>
                      <span className="text-[10px] text-[#5C6B63]">Merchant: {vendor?.name} • SKU: {order.sku}</span>
                    </td>
                    <td className="p-3 text-right font-mono font-black text-[#0F3D2E]">
                      {formatINR(order.grossAmount)}
                      <span className="text-[9px] text-[#5C6B63] block">Paid via {order.paymentMethod}</span>
                    </td>
                    <td className="p-3 text-center">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                        isPendingRMA
                          ? 'bg-[#FDEDEC] text-[#C0392B] border border-[#C0392B]/30 animate-pulse'
                          : order.orderStatus === 'Delivered'
                          ? 'bg-[#E8F2EE] text-[#0F3D2E]'
                          : 'bg-[#FCF7E8] text-[#0F3D2E] border border-[#D4AF37]/40'
                      }`}>
                        {order.orderStatus}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center space-x-1.5">
                        <button
                          type="button"
                          onClick={() => handlePrintInvoice(order)}
                          className="p-1.5 rounded-lg bg-[#FBF8F1] hover:bg-[#E8F2EE] border border-[#D8E0DC] text-[#0F3D2E] icon-interactive cursor-pointer"
                          title="Download GST Invoice"
                        >
                          <Download className="w-3.5 h-3.5 text-[#D4AF37]" />
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
