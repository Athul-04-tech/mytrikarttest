import React, { useState } from 'react';
import { 
  MapPin, 
  Plus, 
  Trash2, 
  Edit2, 
  Home, 
  Building2, 
  CheckCircle2, 
  X, 
  Navigation, 
  Info 
} from 'lucide-react';

export default function AddressBookSection() {
  const [addresses, setAddresses] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState(null);
  
  // New address form state
  const [newAddr, setNewAddr] = useState({
    type: 'Home',
    name: '',
    phone: '',
    addressLine1: '',
    landmark: '',
    city: '',
    state: '',
    pincode: '',
    country: 'India',
    isDefaultShipping: false,
    isDefaultBilling: false,
    instructions: ''
  });

  const [pincodeError, setPincodeError] = useState('');

  const handleOpenAdd = () => {
    setEditingAddressId(null);
    setNewAddr({
      type: 'Home',
      name: '',
      phone: '',
      addressLine1: '',
      landmark: '',
      city: '',
      state: '',
      pincode: '',
      country: 'India',
      isDefaultShipping: addresses.length === 0,
      isDefaultBilling: addresses.length === 0,
      instructions: ''
    });
    setPincodeError('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (addr) => {
    setEditingAddressId(addr.id);
    setNewAddr({ ...addr });
    setPincodeError('');
    setIsModalOpen(true);
  };

  const handleDelete = (id) => {
    if (confirm("Are you sure you want to remove this saved address?")) {
      setAddresses(addresses.filter(a => a.id !== id));
    }
  };

  const handleSaveAddress = (e) => {
    e.preventDefault();
    if (!newAddr.pincode || newAddr.pincode.length < 6) {
      setPincodeError('Please enter a valid 6-digit postal PIN code');
      return;
    }

    if (editingAddressId) {
      setAddresses(addresses.map(a => a.id === editingAddressId ? { ...newAddr, id: editingAddressId } : a));
    } else {
      const created = {
        ...newAddr,
        id: `addr-${Date.now()}`
      };
      setAddresses([created, ...addresses]);
    }
    setIsModalOpen(false);
  };

  return (
    <div className="bg-white rounded-3xl border border-[#EAE3DC] p-6 sm:p-8 lg:p-10 shadow-xs animate-reveal">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#EAE3DC]">
        <div>
          <h2 className="font-['Outfit'] text-2xl sm:text-3xl font-extrabold text-[#FA661C] tracking-tight">
            Address Book
          </h2>
          <p className="text-xs sm:text-sm text-[#6B6058] mt-1">
            Manage your saved delivery locations, billing destinations, and delivery instructions
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenAdd}
          className="px-4 py-2.5 rounded-xl text-xs font-bold text-[#FFFFFF] bg-[#FA661C] hover:bg-[#E0530B] transition-all flex items-center space-x-1.5 shadow-sm self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4 text-[#FF811A]" />
          <span>Add New Address</span>
        </button>
      </div>

      {/* Addresses Grid / Empty State */}
      {addresses.length === 0 ? (
        <div className="mt-8 text-center py-16 px-4 bg-[#FFFFFF]/40 border border-dashed border-[#EAE3DC] rounded-2xl">
          <div className="w-16 h-16 rounded-full bg-[#FFF3EC] text-[#FA661C] flex items-center justify-center mx-auto mb-4 shadow-2xs">
            <MapPin className="w-8 h-8 text-[#FA661C]" />
          </div>
          <h3 className="font-['Outfit'] text-lg font-bold text-[#FA661C]">No Saved Addresses</h3>
          <p className="text-xs text-[#6B6058] max-w-sm mx-auto mt-1 mb-6">
            You haven't saved any delivery or billing destinations yet. Add an address to speed up your checkout process.
          </p>
          <button
            type="button"
            onClick={handleOpenAdd}
            className="inline-flex items-center space-x-1.5 px-5 py-2.5 bg-[#FA661C] hover:bg-[#E0530B] text-[#FFFFFF] rounded-xl text-xs font-bold transition-all shadow-xs btn-interactive cursor-pointer"
          >
            <Plus className="w-4 h-4 text-[#FF811A]" />
            <span>Add New Address</span>
          </button>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-5">
          {addresses.map((addr) => (
          <div
            key={addr.id}
            className={`p-5 rounded-2xl border transition-all duration-200 flex flex-col justify-between relative ${
              addr.isDefaultShipping
                ? 'border-[#FF811A] bg-[#FFF8F2]/40 shadow-xs'
                : 'border-[#EAE3DC] bg-[#FFFFFF]/40 hover:border-[#6B6058]'
            }`}
          >
            <div>
              {/* Top Row: Type & Default Badges */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-1.5">
                  <span className="px-2.5 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider bg-[#FA661C] text-[#FFFFFF] flex items-center space-x-1">
                    {addr.type === 'Home' ? <Home className="w-3 h-3 text-[#FF811A]" /> : <Building2 className="w-3 h-3 text-[#FF811A]" />}
                    <span>{addr.type}</span>
                  </span>

                  {addr.isDefaultShipping && (
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#FF811A] text-[#FA661C] shadow-2xs">
                      Default Shipping
                    </span>
                  )}
                  {addr.isDefaultBilling && (
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#FFF3EC] text-[#FA661C] border border-[#FA661C]/20">
                      Default Billing
                    </span>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center space-x-1">
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(addr)}
                    className="p-1.5 text-[#6B6058] hover:text-[#FA661C] rounded-lg hover:bg-white transition-colors"
                    aria-label="Edit address"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(addr.id)}
                    className="p-1.5 text-[#6B6058] hover:text-[#D7263D] rounded-lg hover:bg-white transition-colors"
                    aria-label="Delete address"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Recipient & Full Address */}
              <h4 className="font-['Outfit'] font-bold text-sm text-[#FA661C]">
                {addr.name}
              </h4>
              <p className="text-xs text-[#6B6058] mt-1 leading-relaxed">
                {addr.addressLine1}
                {addr.landmark && <><br />Landmark: <span className="text-[#FA661C] font-medium">{addr.landmark}</span></>}
                <br />
                {addr.city}, {addr.state} - <strong className="text-[#FA661C]">{addr.pincode}</strong>, {addr.country}
              </p>
              <p className="text-xs text-[#FA661C] font-bold mt-2">
                Phone: <span className="text-[#6B6058] font-normal">{addr.phone}</span>
              </p>

              {/* Delivery Instructions note */}
              {addr.instructions && (
                <div className="mt-3 p-2 rounded-xl bg-white border border-[#EAE3DC]/80 text-[11px] text-[#6B6058] flex items-start space-x-1.5">
                  <Info className="w-3.5 h-3.5 text-[#FF811A] shrink-0 mt-0.5" />
                  <span>Instruction: {addr.instructions}</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      )}

      {/* Add / Edit Address Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#FA661C]/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-[#FFFFFF] border border-[#FF811A]/40 rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden animate-dropdown max-h-[90vh] flex flex-col">
            
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-[#FA661C] to-[#E0530B] p-4 sm:p-5 text-[#FFFFFF] flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <MapPin className="w-5 h-5 text-[#FF811A]" />
                <h3 className="font-['Outfit'] font-bold text-base text-[#FFFFFF]">
                  {editingAddressId ? 'Edit Address' : 'Add New Address'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-full text-[#FFFFFF]/80 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveAddress} className="p-6 overflow-y-auto space-y-4 text-xs">
              
              {/* Address Type Selector */}
              <div>
                <label className="block font-bold text-[#FA661C] uppercase tracking-wider text-[10px] mb-1.5">
                  Address Type
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {['Home', 'Office', 'Other'].map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setNewAddr({ ...newAddr, type })}
                      className={`py-2 rounded-xl font-bold border transition-all ${
                        newAddr.type === type
                          ? 'bg-[#FA661C] text-[#FFFFFF] border-[#FA661C] shadow-xs'
                          : 'bg-white text-[#6B6058] border-[#EAE3DC] hover:border-[#FA661C]'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              {/* Map Location Picker Placeholder */}
              <div className="p-3 bg-[#FFF3EC] rounded-2xl border border-[#FA661C]/20 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Navigation className="w-4 h-4 text-[#FF811A]" />
                  <div>
                    <h5 className="font-bold text-[#FA661C]">Interactive Map Pin Drop</h5>
                    <p className="text-[10px] text-[#6B6058]">Auto-fill address via GPS coordinates</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => alert("GPS Map Picker trigger placeholder")}
                  className="px-2.5 py-1 bg-[#FA661C] text-[#FFFFFF] font-bold rounded-lg text-[10px]"
                >
                  Locate Me
                </button>
              </div>

              {/* Name & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#6B6058] mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={newAddr.name}
                    onChange={(e) => setNewAddr({ ...newAddr, name: e.target.value })}
                    placeholder="Receiver Name"
                    className="w-full py-2 px-3 bg-white border border-[#EAE3DC] rounded-xl text-[#FA661C] font-medium focus:outline-none focus:ring-2 focus:ring-[#FA661C]/20"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#6B6058] mb-1">Phone Number</label>
                  <input
                    type="tel"
                    required
                    value={newAddr.phone}
                    onChange={(e) => setNewAddr({ ...newAddr, phone: e.target.value })}
                    placeholder="10-digit number"
                    className="w-full py-2 px-3 bg-white border border-[#EAE3DC] rounded-xl text-[#FA661C] font-medium focus:outline-none focus:ring-2 focus:ring-[#FA661C]/20"
                  />
                </div>
              </div>

              {/* Address Line 1 */}
              <div>
                <label className="block font-bold text-[#6B6058] mb-1">Flat / House No. / Building / Street</label>
                <input
                  type="text"
                  required
                  value={newAddr.addressLine1}
                  onChange={(e) => setNewAddr({ ...newAddr, addressLine1: e.target.value })}
                  placeholder="e.g. Flat 402, Emerald Heights, Linking Road"
                  className="w-full py-2 px-3 bg-white border border-[#EAE3DC] rounded-xl text-[#FA661C] font-medium focus:outline-none focus:ring-2 focus:ring-[#FA661C]/20"
                />
              </div>

              {/* Landmark & PIN Code */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#6B6058] mb-1">Landmark (Optional)</label>
                  <input
                    type="text"
                    value={newAddr.landmark}
                    onChange={(e) => setNewAddr({ ...newAddr, landmark: e.target.value })}
                    placeholder="Nearby landmark"
                    className="w-full py-2 px-3 bg-white border border-[#EAE3DC] rounded-xl text-[#FA661C] font-medium focus:outline-none focus:ring-2 focus:ring-[#FA661C]/20"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#6B6058] mb-1">Postal PIN Code</label>
                  <input
                    type="text"
                    maxLength={6}
                    required
                    value={newAddr.pincode}
                    onChange={(e) => setNewAddr({ ...newAddr, pincode: e.target.value.replace(/\D/g, '') })}
                    placeholder="6-digit PIN"
                    className={`w-full py-2 px-3 bg-white border rounded-xl text-[#FA661C] font-medium focus:outline-none focus:ring-2 ${
                      pincodeError ? 'border-[#D7263D] ring-[#D7263D]/20' : 'border-[#EAE3DC] ring-[#FA661C]/20'
                    }`}
                  />
                  {pincodeError && <p className="text-[10px] text-[#D7263D] font-bold mt-0.5">{pincodeError}</p>}
                </div>
              </div>

              {/* City & State */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#6B6058] mb-1">City</label>
                  <input
                    type="text"
                    required
                    value={newAddr.city}
                    onChange={(e) => setNewAddr({ ...newAddr, city: e.target.value })}
                    placeholder="City"
                    className="w-full py-2 px-3 bg-white border border-[#EAE3DC] rounded-xl text-[#FA661C] font-medium focus:outline-none focus:ring-2 focus:ring-[#FA661C]/20"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#6B6058] mb-1">State</label>
                  <input
                    type="text"
                    required
                    value={newAddr.state}
                    onChange={(e) => setNewAddr({ ...newAddr, state: e.target.value })}
                    placeholder="State"
                    className="w-full py-2 px-3 bg-white border border-[#EAE3DC] rounded-xl text-[#FA661C] font-medium focus:outline-none focus:ring-2 focus:ring-[#FA661C]/20"
                  />
                </div>
              </div>

              {/* Delivery Instructions */}
              <div>
                <label className="block font-bold text-[#6B6058] mb-1">Delivery Instructions (Optional)</label>
                <textarea
                  rows={2}
                  value={newAddr.instructions}
                  onChange={(e) => setNewAddr({ ...newAddr, instructions: e.target.value })}
                  placeholder="e.g. Leave with security, gate code #4910"
                  className="w-full py-2 px-3 bg-white border border-[#EAE3DC] rounded-xl text-[#FA661C] font-medium focus:outline-none focus:ring-2 focus:ring-[#FA661C]/20"
                />
              </div>

              {/* Default Toggles */}
              <div className="space-y-2 pt-2 border-t border-[#EAE3DC]">
                <label className="flex items-center space-x-2 font-medium text-[#FA661C] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newAddr.isDefaultShipping}
                    onChange={(e) => setNewAddr({ ...newAddr, isDefaultShipping: e.target.checked })}
                    className="rounded border-[#EAE3DC] text-[#FA661C] focus:ring-[#FA661C]"
                  />
                  <span>Make this my default shipping address</span>
                </label>
                <label className="flex items-center space-x-2 font-medium text-[#FA661C] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newAddr.isDefaultBilling}
                    onChange={(e) => setNewAddr({ ...newAddr, isDefaultBilling: e.target.checked })}
                    className="rounded border-[#EAE3DC] text-[#FA661C] focus:ring-[#FA661C]"
                  />
                  <span>Make this my default tax billing address</span>
                </label>
              </div>

              {/* Actions */}
              <div className="flex space-x-2 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2.5 bg-white border border-[#EAE3DC] text-[#6B6058] rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-[#FA661C] hover:bg-[#E0530B] text-[#FFFFFF] rounded-xl font-bold shadow-sm"
                >
                  Save Address
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
