import React from 'react';
import { CheckCircle2, Package, Truck, Calendar, MapPin, ArrowRight, Download, Store } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

export default function OrderSuccessConfirmation({ order, onBackToHome }) {
  const toast = useToast();

  const handleDownloadInvoice = () => {
    toast.success("GST Invoice Downloaded", `Tax Invoice for ${order.orderId} (PDF) saved.`);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 py-6 animate-reveal text-xs">
      
      {/* Top Success Banner */}
      <div className="bg-gradient-to-br from-[#0F3D2E] via-[#16523F] to-[#0A2A1F] text-[#FBF8F1] rounded-3xl p-6 sm:p-8 border border-[#D4AF37]/50 shadow-xl text-center space-y-3 relative overflow-hidden">
        <div className="w-16 h-16 rounded-full bg-[#D4AF37] text-[#0F3D2E] flex items-center justify-center mx-auto shadow-md">
          <CheckCircle2 className="w-9 h-9" />
        </div>

        <div>
          <span className="text-[10px] font-black uppercase tracking-widest bg-[#D4AF37] text-[#0F3D2E] px-2.5 py-0.5 rounded-full">
            PAYMENT CONFIRMED
          </span>
          <h1 className="font-['Outfit'] text-2xl sm:text-3xl font-extrabold text-[#FBF8F1] mt-2">
            Thank You for Your Order!
          </h1>
          <p className="text-xs text-[#FBF8F1]/80 mt-1 max-w-md mx-auto">
            Your package is being prepared by our verified merchants. We have sent an SMS & Email receipt.
          </p>
        </div>

        <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
          <div className="px-3 py-1.5 rounded-xl bg-[#0A2A1F]/80 border border-[#D4AF37]/40 font-mono text-xs font-bold text-[#D4AF37]">
            Order ID: {order.orderId}
          </div>
          <button
            type="button"
            onClick={handleDownloadInvoice}
            className="px-3.5 py-1.5 rounded-xl bg-[#FBF8F1] hover:bg-white text-[#0F3D2E] font-bold text-xs btn-interactive flex items-center space-x-1.5 cursor-pointer shadow-xs"
          >
            <Download className="w-3.5 h-3.5 text-[#0F3D2E]" />
            <span>Download GST Tax Invoice</span>
          </button>
        </div>
      </div>

      {/* Delivery & Address Recap Card */}
      <div className="bg-white rounded-3xl border border-[#D8E0DC] p-5 sm:p-6 shadow-xs grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div className="space-y-1.5">
          <div className="flex items-center space-x-1.5 text-[#0F3D2E] font-bold">
            <Truck className="w-4 h-4 text-[#D4AF37]" />
            <span>Delivery Tracking Information</span>
          </div>
          <p className="text-[11px] text-[#5C6B63]">
            Estimated Delivery: <strong className="text-[#0F3D2E]">Tomorrow by 2:00 PM</strong><br />
            Carrier: BlueDart Express Air (Tracking #BD-884192)
          </p>
        </div>

        <div className="space-y-1.5 sm:border-l sm:border-[#D8E0DC] sm:pl-5">
          <div className="flex items-center space-x-1.5 text-[#0F3D2E] font-bold">
            <MapPin className="w-4 h-4 text-[#D4AF37]" />
            <span>Delivering To</span>
          </div>
          <p className="text-[11px] text-[#5C6B63]">
            <strong className="text-[#0F3D2E]">{order.shippingAddress?.name || 'Aarav Sharma'}</strong><br />
            {order.shippingAddress?.addressLine || 'Flat 402, Royal Palms Residency'}, {order.shippingAddress?.city || 'Mumbai'} — {order.shippingAddress?.pincode || '400063'}
          </p>
        </div>
      </div>

      {/* Items Summary Table */}
      <div className="bg-white rounded-3xl border border-[#D8E0DC] p-5 sm:p-6 shadow-xs space-y-4">
        <h3 className="font-['Outfit'] font-bold text-base text-[#0F3D2E]">
          Ordered Items Summary ({order.items?.length || 0})
        </h3>

        <div className="space-y-3 divide-y divide-[#D8E0DC]/40">
          {order.items?.map((item) => (
            <div key={item.id} className="pt-3 first:pt-0 flex items-center justify-between gap-3">
              <div className="flex items-center space-x-3 truncate">
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-12 h-12 rounded-xl object-cover border border-[#D8E0DC] shrink-0"
                />
                <div className="truncate">
                  <h4 className="font-bold text-xs text-[#0F3D2E] truncate max-w-[280px]">
                    {item.name}
                  </h4>
                  <span className="text-[10px] text-[#5C6B63]">
                    Qty: {item.quantity} • {item.variant || 'Standard'}
                  </span>
                </div>
              </div>

              <div className="text-right shrink-0">
                <span className="font-['Outfit'] font-black text-xs text-[#0F3D2E]">
                  ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Final Total Paid */}
        <div className="pt-3 border-t border-[#D8E0DC] flex items-center justify-between text-sm font-bold text-[#0F3D2E]">
          <span>Total Amount Paid ({order.paymentMethod?.toUpperCase() || 'UPI'})</span>
          <span className="font-['Outfit'] font-black text-lg text-[#0F3D2E]">
            ₹{order.calculations?.amountPayable?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </span>
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="text-center pt-2">
        <button
          type="button"
          onClick={onBackToHome}
          className="px-6 py-3 bg-[#0F3D2E] hover:bg-[#155440] text-[#FBF8F1] font-bold text-xs rounded-2xl btn-interactive shadow-md cursor-pointer"
        >
          Return to Marketplace Home
        </button>
      </div>

    </div>
  );
}
