import React, { useState } from 'react';
import { MapPin, Plus, CheckCircle2, Home, Building2, Edit2, ShieldCheck } from 'lucide-react';

export const SAVED_ADDRESSES = [
  {
    id: 'addr-1',
    name: 'Aarav Sharma',
    type: 'Home',
    phone: '+91 98765 43210',
    addressLine: 'Flat 402, Royal Palms Residency, A-Wing',
    landmark: 'Near Oberoi Mall',
    city: 'Mumbai',
    state: 'Maharashtra',
    pincode: '400063',
    isDefault: true,
    isCodEligible: true
  },
  {
    id: 'addr-2',
    name: 'Aarav Sharma',
    type: 'Work',
    phone: '+91 98765 43210',
    addressLine: '9th Floor, EuroLink Tech Tower, Mindspace',
    landmark: 'Building No. 4',
    city: 'Bengaluru',
    state: 'Karnataka',
    pincode: '560001',
    isDefault: false,
    isCodEligible: true
  },
  {
    id: 'addr-3',
    name: 'Aarav Sharma (Remote Warehouse)',
    type: 'Other',
    phone: '+91 98765 43210',
    addressLine: 'Plot 12, Rural Industrial Belt',
    landmark: 'Highway Junction',
    city: 'Agartala',
    state: 'Tripura',
    pincode: '799001',
    isDefault: false,
    isCodEligible: false // Trigger for non-COD PIN demonstration
  }
];

export default function ShippingAddressSection({
  selectedAddressId,
  onSelectAddress,
  sameAsShipping,
  onToggleSameAsShipping,
  isGuest
}) {
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [addresses, setAddresses] = useState(SAVED_ADDRESSES);

  // Billing address state when uncoupled
  const [billingName, setBillingName] = useState('Aarav Sharma');
  const [billingAddress, setBillingAddress] = useState('Flat 402, Royal Palms, Mumbai 400063');

  return (
    <div className="bg-white rounded-3xl border border-[#EAE3DC] p-5 sm:p-6 shadow-xs space-y-4 text-xs">
      
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[#EAE3DC]">
        <div className="flex items-center space-x-2">
          <span className="w-6 h-6 rounded-full bg-[#FA661C] text-[#FF811A] font-black text-xs flex items-center justify-center">
            1
          </span>
          <h2 className="font-['Outfit'] font-extrabold text-base text-[#FA661C]">
            Shipping & Delivery Address
          </h2>
        </div>

        <span className="text-[10px] text-[#6B6058]">
          Step 1 of 3 • Real-Time PIN Code Check
        </span>
      </div>

      {/* Address Selection Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {addresses.map((addr) => {
          const isSelected = selectedAddressId === addr.id;

          return (
            <div
              key={addr.id}
              onClick={() => onSelectAddress(addr)}
              className={`p-4 rounded-2xl border transition-all cursor-pointer card-interactive relative flex flex-col justify-between ${
                isSelected
                  ? 'bg-[#FFF8F2] border-[#FF811A] shadow-xs ring-1 ring-[#FF811A]'
                  : 'bg-[#FFFFFF] border-[#EAE3DC] hover:border-[#FF811A]/50'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-1.5">
                    <span className="font-bold text-[#FA661C]">{addr.name}</span>
                    <span className="text-[9px] font-black uppercase bg-[#FFF3EC] text-[#FA661C] px-1.5 py-0.2 rounded">
                      {addr.type}
                    </span>
                  </div>

                  {isSelected && (
                    <CheckCircle2 className="w-4 h-4 text-[#FA661C] fill-[#FF811A]" />
                  )}
                </div>

                <p className="text-[11px] text-[#6B6058] leading-relaxed">
                  {addr.addressLine}, {addr.landmark}<br />
                  {addr.city}, {addr.state} — <strong className="text-[#FA661C] font-mono">{addr.pincode}</strong>
                </p>
                <span className="text-[10px] text-[#6B6058] mt-1 block">Phone: {addr.phone}</span>
              </div>

              {/* COD Eligibility Pill on Card */}
              <div className="mt-3 pt-2 border-t border-[#EAE3DC]/60 flex items-center justify-between text-[10px]">
                {addr.isCodEligible ? (
                  <span className="text-[#FA661C] font-bold flex items-center space-x-1">
                    <ShieldCheck className="w-3 h-3 text-[#FA661C]" />
                    <span>COD Available</span>
                  </span>
                ) : (
                  <span className="text-[#D7263D] font-bold">
                    Online Payment Only (Non-COD PIN)
                  </span>
                )}
                {addr.isDefault && <span className="text-[#FF811A] font-bold">Default</span>}
              </div>
            </div>
          );
        })}
      </div>

      {/* Same as Shipping Billing Address Checkbox */}
      <div className="pt-3 border-t border-[#EAE3DC]/60 space-y-3">
        <label className="flex items-center space-x-2.5 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={sameAsShipping}
            onChange={(e) => onToggleSameAsShipping(e.target.checked)}
            className="w-4 h-4 text-[#FA661C] rounded border-[#EAE3DC] focus:ring-[#FF811A] cursor-pointer"
          />
          <span className="font-bold text-[#FA661C]">
            Billing address is the same as shipping address (Recommended)
          </span>
        </label>

        {/* Uncoupled Billing Address Form */}
        {!sameAsShipping && (
          <div className="p-4 bg-[#FFFFFF] rounded-2xl border border-[#EAE3DC] space-y-3 animate-reveal">
            <h4 className="font-bold text-[#FA661C] text-xs">Separate Billing Address (For Tax Invoice)</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold text-[#6B6058] block mb-1">Billing Entity / Name</label>
                <input
                  type="text"
                  value={billingName}
                  onChange={(e) => setBillingName(e.target.value)}
                  className="w-full p-2 bg-white rounded-xl border border-[#EAE3DC] text-xs"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-[#6B6058] block mb-1">Billing Street Address</label>
                <input
                  type="text"
                  value={billingAddress}
                  onChange={(e) => setBillingAddress(e.target.value)}
                  className="w-full p-2 bg-white rounded-xl border border-[#EAE3DC] text-xs"
                />
              </div>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
