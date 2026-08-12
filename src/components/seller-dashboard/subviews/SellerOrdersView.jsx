import React, { useState } from 'react';
import { ShoppingBag, Search, Filter, Printer, Download, Truck, CheckCircle2, Clock } from 'lucide-react';
import { ORDERS_WIDGET_DATA, formatSellerINR } from '../../../data/sellerDashboardData';
import { useToast } from '../../../context/ToastContext';

export default function SellerOrdersView() {
  const [filter, setFilter] = useState('all');
  const toast = useToast();

  const orders = ORDERS_WIDGET_DATA.recentOrders;

  return (
    <div className="space-y-6 text-xs animate-reveal">
      
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-[#D8E0DC]">
        <div>
          <h2 className="font-['Outfit'] text-xl sm:text-2xl font-extrabold text-[#0F3D2E]">
            Orders & Shipment Fulfillment
          </h2>
          <p className="text-xs text-[#5C6B63] mt-0.5">
            Process buyer dispatches within 24h to maintain your 96% SLA compliance badge.
          </p>
        </div>

        <button
          type="button"
          onClick={() => toast.success("Batch Manifest Generated", "Download shipping labels & barcodes for 6 new orders (PDF).")}
          className="px-4 py-2 bg-[#0F3D2E] hover:bg-[#155440] text-[#FBF8F1] rounded-2xl font-black text-xs btn-interactive flex items-center space-x-1.5 shadow-xs cursor-pointer self-start sm:self-auto"
        >
          <Printer className="w-4 h-4 text-[#D4AF37]" />
          <span>Print All Shipping Labels</span>
        </button>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-3xl border border-[#D8E0DC] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#FBF8F1] border-b border-[#D8E0DC] text-[#0F3D2E] font-bold">
                <th className="p-3.5">Order ID & Timestamp</th>
                <th className="p-3.5">Customer & City</th>
                <th className="p-3.5">Product Title</th>
                <th className="p-3.5">Gross Amount</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#D8E0DC]/60">
              {orders.map((ord) => (
                <tr key={ord.id} className="hover:bg-[#FBF8F1]/60 transition-colors">
                  <td className="p-3.5">
                    <span className="font-mono font-bold text-[#0F3D2E] block">{ord.id}</span>
                    <span className="text-[10px] text-[#5C6B63]">{ord.date}</span>
                  </td>
                  <td className="p-3.5">
                    <span className="font-bold text-[#0F3D2E] block">{ord.customerName}</span>
                    <span className="text-[10px] text-[#5C6B63]">{ord.location}</span>
                  </td>
                  <td className="p-3.5">
                    <div className="flex items-center space-x-2.5">
                      <img src={ord.thumbnail} alt={ord.productName} className="w-8 h-8 rounded-lg object-cover border border-[#D8E0DC] shrink-0" />
                      <span className="font-medium text-[#0F3D2E] truncate max-w-[200px]">{ord.productName}</span>
                    </div>
                  </td>
                  <td className="p-3.5 font-mono font-black text-[#0F3D2E]">{formatSellerINR(ord.amount)}</td>
                  <td className="p-3.5">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                      ord.status === 'Delivered'
                        ? 'bg-[#E8F2EE] text-[#0F3D2E]'
                        : ord.status === 'Shipped'
                        ? 'bg-[#E8F2EE] text-[#0F3D2E]'
                        : ord.status === 'New'
                        ? 'bg-[#FCF7E8] text-[#0F3D2E] border border-[#D4AF37]/50'
                        : 'bg-[#FBF8F1] text-[#5C6B63]'
                    }`}>
                      {ord.status}
                    </span>
                  </td>
                  <td className="p-3.5 text-right">
                    <button
                      type="button"
                      onClick={() => toast.success("Invoice Generated", `Tax Invoice for ${ord.id} downloaded.`)}
                      className="px-2.5 py-1 bg-[#FBF8F1] hover:bg-[#E8F2EE] border border-[#D8E0DC] text-[#0F3D2E] rounded-lg font-bold text-[10px] cursor-pointer inline-flex items-center space-x-1"
                    >
                      <Download className="w-3 h-3 text-[#D4AF37]" />
                      <span>Invoice</span>
                    </button>
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
