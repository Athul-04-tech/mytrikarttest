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
      <div className="bg-gradient-to-br from-[#FA661C] via-[#16523F] to-[#0A2A1F] text-[#FFFFFF] rounded-3xl p-6 sm:p-8 border border-[#FF811A]/50 shadow-xl text-center space-y-3 relative overflow-hidden">
        <div className="w-16 h-16 rounded-full bg-[#FF811A] text-[#FA661C] flex items-center justify-center mx-auto shadow-md">
          <CheckCircle2 className="w-9 h-9" />
        </div>

        <div>
          <span className="text-[10px] font-black uppercase tracking-widest bg-[#FF811A] text-[#FA661C] px-2.5 py-0.5 rounded-full">
            PAYMENT CONFIRMED
          </span>
          <h1 className="font-['Outfit'] text-2xl sm:text-3xl font-extrabold text-[#FFFFFF] mt-2">
            Thank You for Your Order!
          </h1>
          <p className="text-xs text-[#FFFFFF]/80 mt-1 max-w-md mx-auto">
            Your package is being prepared by our verified merchants. We have sent an SMS & Email receipt.
          </p>
        </div>

        <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
          <div className="px-3 py-1.5 rounded-xl bg-[#0A2A1F]/80 border border-[#FF811A]/40 font-mono text-xs font-bold text-[#FF811A]">
            Order ID: {order.orderId}
          </div>
          <button
            type="button"
            onClick={handleDownloadInvoice}
            className="px-3.5 py-1.5 rounded-xl bg-[#FFFFFF] hover:bg-white text-[#FA661C] font-bold text-xs btn-interactive flex items-center space-x-1.5 cursor-pointer shadow-xs"
          >
            <Download className="w-3.5 h-3.5 text-[#FA661C]" />
            <span>Download GST Tax Invoice</span>
          </button>
        </div>
      </div>

      {/* Delivery & Address Recap Card */}
      <div className="bg-white rounded-3xl border border-[#EAE3DC] p-5 sm:p-6 shadow-xs grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div className="space-y-1.5">
          <div className="flex items-center space-x-1.5 text-[#FA661C] font-bold">
            <Truck className="w-4 h-4 text-[#FF811A]" />
            <span>Delivery Tracking Information</span>
          </div>
          <p className="text-[11px] text-[#6B6058]">
            Estimated Delivery: <strong className="text-[#FA661C]">Tomorrow by 2:00 PM</strong><br />
            Carrier: BlueDart Express Air (Tracking #BD-884192)
          </p>
        </div>

        <div className="space-y-1.5 sm:border-l sm:border-[#EAE3DC] sm:pl-5">
          <div className="flex items-center space-x-1.5 text-[#FA661C] font-bold">
            <MapPin className="w-4 h-4 text-[#FF811A]" />
            <span>Delivering To</span>
          </div>
          <p className="text-[11px] text-[#6B6058]">
            <strong className="text-[#FA661C]">{order.shippingAddress?.name || 'Aarav Sharma'}</strong><br />
            {order.shippingAddress?.addressLine || 'Flat 402, Royal Palms Residency'}, {order.shippingAddress?.city || 'Mumbai'} — {order.shippingAddress?.pincode || '400063'}
          </p>
        </div>
      </div>

      {/* Items Summary Table */}
      <div className="bg-white rounded-3xl border border-[#EAE3DC] p-5 sm:p-6 shadow-xs space-y-4">
        <h3 className="font-['Outfit'] font-bold text-base text-[#FA661C]">
          Ordered Items Summary ({order.items?.length || 0})
        </h3>

        <div className="space-y-3 divide-y divide-[#EAE3DC]/40">
          {order.items?.map((item) => (
            <div key={item.id} className="pt-3 first:pt-0 flex items-center justify-between gap-3">
              <div className="flex items-center space-x-3 truncate">
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-12 h-12 rounded-xl object-cover border border-[#EAE3DC] shrink-0"
                />
                <div className="truncate">
                  <h4 className="font-bold text-xs text-[#FA661C] truncate max-w-[280px]">
                    {item.name}
                  </h4>
                  <span className="text-[10px] text-[#6B6058]">
                    Qty: {item.quantity} • {item.variant || 'Standard'}
                  </span>
                </div>
              </div>

              <div className="text-right shrink-0">
                <span className="font-['Outfit'] font-black text-xs text-[#FA661C]">
                  ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Final Total Paid */}
        <div className="pt-3 border-t border-[#EAE3DC] flex items-center justify-between text-sm font-bold text-[#FA661C]">
          <span>Total Amount Paid ({order.paymentMethod?.toUpperCase() || 'UPI'})</span>
          <span className="font-['Outfit'] font-black text-lg text-[#FA661C]">
            ₹{order.calculations?.amountPayable?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </span>
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="text-center pt-2">
        <button
          type="button"
          onClick={onBackToHome}
          className="px-6 py-3 bg-[#FA661C] hover:bg-[#E0530B] text-[#FFFFFF] font-bold text-xs rounded-2xl btn-interactive shadow-md cursor-pointer"
        >
          Return to Marketplace Home
        </button>
      </div>

    </div>
  );
}
