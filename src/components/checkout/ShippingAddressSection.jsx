import React, { useState, useEffect } from 'react';
import { MapPin, Plus, CheckCircle2, ShieldCheck } from 'lucide-react';
import { apiRequest } from '../../utils/api';

export const DEFAULT_FALLBACK_ADDRESS = {
  id: 'default-addr',
  full_name: 'Aarav Sharma',
  phone_number: '+91 98765 43210',
  address_line1: 'Flat 402, Royal Palms Residency, A-Wing',
  address_line2: 'Near Oberoi Mall',
  city: 'Mumbai',
  state: 'Maharashtra',
  postal_code: '400063',
  country: 'IN',
  address_type: 'both',
  is_default: true
};

export default function ShippingAddressSection({
  selectedAddressId,
  onSelectAddress,
  sameAsShipping,
  onToggleSameAsShipping,
  isGuest
}) {
  const [addresses, setAddresses] = useState([DEFAULT_FALLBACK_ADDRESS]);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newAddr, setNewAddr] = useState({
    full_name: '',
    phone_number: '',
    address_line1: '',
    address_line2: '',
    city: '',
    state: '',
    postal_code: '',
    country: 'IN',
    address_type: 'both',
    is_default: false
  });

  // Load addresses from GET /api/customers/addresses/
  useEffect(() => {
    if (!isGuest) {
      apiRequest('/api/customers/addresses/')
        .then((data) => {
          if (Array.isArray(data) && data.length > 0) {
            setAddresses(data);
            const def = data.find((a) => a.is_default) || data[0];
            onSelectAddress(def);
          }
        })
        .catch(() => {
          // Keep fallback address
        });
    }
  }, [isGuest]);

  const handleCreateAddress = async (e) => {
    e.preventDefault();
    if (!newAddr.full_name || !newAddr.phone_number || !newAddr.address_line1 || !newAddr.city || !newAddr.state || !newAddr.postal_code) {
      return;
    }

    try {
      const created = await apiRequest('/api/customers/addresses/', {
        method: 'POST',
        body: JSON.stringify(newAddr)
      });
      setAddresses((prev) => [created, ...prev]);
      onSelectAddress(created);
      setIsAddingNew(false);
      setNewAddr({
        full_name: '',
        phone_number: '',
        address_line1: '',
        address_line2: '',
        city: '',
        state: '',
        postal_code: '',
        country: 'IN',
        address_type: 'both',
        is_default: false
      });
    } catch (err) {
      // Local addition fallback
      const created = { ...newAddr, id: `local-${Date.now()}` };
      setAddresses((prev) => [created, ...prev]);
      onSelectAddress(created);
      setIsAddingNew(false);
    }
  };

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

        <button
          type="button"
          onClick={() => setIsAddingNew(!isAddingNew)}
          className="text-[#FA661C] font-bold hover:underline flex items-center space-x-1 cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>{isAddingNew ? 'Cancel' : 'Add New Address'}</span>
        </button>
      </div>

      {/* Add New Address Form */}
      {isAddingNew && (
        <form onSubmit={handleCreateAddress} className="p-4 bg-[#FFF8F2] rounded-2xl border border-[#FF811A]/40 space-y-3 animate-reveal">
          <h4 className="font-bold text-[#FA661C] text-xs">New Delivery Address</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold text-[#6B6058] block mb-1">Full Name *</label>
              <input
                type="text"
                required
                value={newAddr.full_name}
                onChange={(e) => setNewAddr({ ...newAddr, full_name: e.target.value })}
                placeholder="Aarav Sharma"
                className="w-full p-2 bg-white rounded-xl border border-[#EAE3DC] text-xs"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-[#6B6058] block mb-1">Phone Number *</label>
              <input
                type="text"
                required
                value={newAddr.phone_number}
                onChange={(e) => setNewAddr({ ...newAddr, phone_number: e.target.value })}
                placeholder="+91 98765 43210"
                className="w-full p-2 bg-white rounded-xl border border-[#EAE3DC] text-xs"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="text-[10px] font-bold text-[#6B6058] block mb-1">Address Line 1 *</label>
              <input
                type="text"
                required
                value={newAddr.address_line1}
                onChange={(e) => setNewAddr({ ...newAddr, address_line1: e.target.value })}
                placeholder="Flat 402, Royal Palms Residency, A-Wing"
                className="w-full p-2 bg-white rounded-xl border border-[#EAE3DC] text-xs"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="text-[10px] font-bold text-[#6B6058] block mb-1">Address Line 2 / Landmark</label>
              <input
                type="text"
                value={newAddr.address_line2}
                onChange={(e) => setNewAddr({ ...newAddr, address_line2: e.target.value })}
                placeholder="Near Oberoi Mall"
                className="w-full p-2 bg-white rounded-xl border border-[#EAE3DC] text-xs"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-[#6B6058] block mb-1">City *</label>
              <input
                type="text"
                required
                value={newAddr.city}
                onChange={(e) => setNewAddr({ ...newAddr, city: e.target.value })}
                placeholder="Mumbai"
                className="w-full p-2 bg-white rounded-xl border border-[#EAE3DC] text-xs"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-[#6B6058] block mb-1">State *</label>
              <input
                type="text"
                required
                value={newAddr.state}
                onChange={(e) => setNewAddr({ ...newAddr, state: e.target.value })}
                placeholder="Maharashtra"
                className="w-full p-2 bg-white rounded-xl border border-[#EAE3DC] text-xs"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-[#6B6058] block mb-1">Postal Code *</label>
              <input
                type="text"
                required
                value={newAddr.postal_code}
                onChange={(e) => setNewAddr({ ...newAddr, postal_code: e.target.value })}
                placeholder="400063"
                className="w-full p-2 bg-white rounded-xl border border-[#EAE3DC] text-xs"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-[#6B6058] block mb-1">Country *</label>
              <input
                type="text"
                required
                value={newAddr.country}
                onChange={(e) => setNewAddr({ ...newAddr, country: e.target.value.toUpperCase() })}
                placeholder="IN"
                maxLength={2}
                className="w-full p-2 bg-white rounded-xl border border-[#EAE3DC] text-xs uppercase"
              />
            </div>
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-[#FA661C] text-white rounded-xl font-bold text-xs btn-interactive cursor-pointer"
          >
            Save Address
          </button>
        </form>
      )}

      {/* Address Selection Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {addresses.map((addr) => {
          const isSelected = String(selectedAddressId) === String(addr.id) || (selectedAddressId?.full_name === addr.full_name && selectedAddressId?.address_line1 === addr.address_line1);

          return (
            <div
              key={addr.id || `${addr.full_name}-${addr.postal_code}`}
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
                    <span className="font-bold text-[#FA661C]">{addr.full_name || addr.name}</span>
                    <span className="text-[9px] font-black uppercase bg-[#FFF3EC] text-[#FA661C] px-1.5 py-0.2 rounded">
                      {addr.address_type || 'Shipping'}
                    </span>
                  </div>

                  {isSelected && (
                    <CheckCircle2 className="w-4 h-4 text-[#FA661C] fill-[#FF811A]" />
                  )}
                </div>

                <p className="text-[11px] text-[#6B6058] leading-relaxed">
                  {addr.address_line1 || addr.addressLine}{addr.address_line2 ? `, ${addr.address_line2}` : ''}<br />
                  {addr.city}, {addr.state} — <strong className="text-[#FA661C] font-mono">{addr.postal_code || addr.pincode}</strong> ({addr.country || 'IN'})
                </p>
                <span className="text-[10px] text-[#6B6058] mt-1 block">Phone: {addr.phone_number || addr.phone}</span>
              </div>

              <div className="mt-3 pt-2 border-t border-[#EAE3DC]/60 flex items-center justify-between text-[10px]">
                <span className="text-[#FA661C] font-bold flex items-center space-x-1">
                  <ShieldCheck className="w-3 h-3 text-[#FA661C]" />
                  <span>Standard Delivery</span>
                </span>
                {addr.is_default && <span className="text-[#FF811A] font-bold">Default</span>}
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
}

