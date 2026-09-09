import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { MapPin, X, Navigation, CheckCircle2 } from 'lucide-react';

const CITIES = [
  'Mumbai 400001', 
  'Bengaluru 560001', 
  'Delhi NCR 110001', 
  'Hyderabad 500001', 
  'Chennai 600001', 
  'Kolkata 700001'
];

export default function DeliveryModal({ isOpen, onClose, onSelectLocation, currentLocation }) {
  const [pincode, setPincode] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmitPincode = (e) => {
    e.preventDefault();
    if (!pincode || pincode.trim().length < 6) {
      setError('Please enter a valid 6-digit PIN code');
      return;
    }
    setError('');
    onSelectLocation(`Pincode ${pincode.trim()}`);
    onClose();
  };

  const handleCitySelect = (city) => {
    onSelectLocation(city);
    onClose();
  };

  const modalContent = (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#FA661C]/50 backdrop-blur-xs animate-fadeIn">
      <div className="bg-[#FFFFFF] border border-[#FF811A]/40 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-dropdown">
        
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-[#FA661C] to-[#E0530B] p-4 text-[#FFFFFF] flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <MapPin className="w-5 h-5 text-[#FF811A]" />
            <h3 className="font-['Outfit'] font-bold text-base text-[#FFFFFF]">
              Select Delivery Location
            </h3>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-full text-[#FFFFFF]/80 hover:text-[#000000] hover:bg-white/10 transition-colors"
            aria-label="Close delivery modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6">
          <p className="text-xs text-[#6B6058] mb-4">
            Select your location to check product availability, estimated delivery times, and local marketplace offers.
          </p>

          {/* Detect Location CTA Button */}
          <button
            type="button"
            onClick={() => {
              onSelectLocation("Current Location (GPS)");
              onClose();
            }}
            className="w-full mb-5 py-2.5 px-4 bg-[#FFF3EC] hover:bg-[#FA661C] text-[#FA661C] hover:text-[#FFFFFF] border border-[#FA661C]/20 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-2 group"
          >
            <Navigation className="w-4 h-4 text-[#FF811A] group-hover:animate-spin" />
            <span>Use Current GPS Location</span>
          </button>

          <div className="relative flex items-center justify-center mb-5">
            <div className="border-t border-[#EAE3DC] w-full" />
            <span className="bg-[#FFFFFF] px-3 text-[10px] uppercase font-bold text-[#6B6058] absolute">
              OR ENTER PINCODE
            </span>
          </div>

          {/* Pincode Form */}
          <form onSubmit={handleSubmitPincode} className="mb-5">
            <div className="flex space-x-2">
              <input 
                type="text"
                maxLength={6}
                value={pincode}
                onChange={(e) => setPincode(e.target.value.replace(/\D/g, ''))}
                placeholder="Enter 6-digit Pincode"
                className="flex-1 px-3 py-2 text-xs bg-white border border-[#EAE3DC] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FA661C] text-[#FA661C] font-medium"
              />
              <button 
                type="submit"
                className="px-4 py-2 bg-[#FA661C] hover:bg-[#E0530B] text-[#FFFFFF] text-xs font-bold rounded-xl transition-colors shadow-xs"
              >
                Apply
              </button>
            </div>
            {error && <p className="text-[11px] text-[#D7263D] mt-1 font-semibold">{error}</p>}
          </form>

          {/* Popular Cities */}
          <div>
            <p className="text-[11px] font-bold text-[#FA661C] uppercase tracking-wider mb-2">
              Popular Cities
            </p>
            <div className="grid grid-cols-2 gap-2">
              {CITIES.map((city) => {
                const isSelected = currentLocation === city;
                return (
                  <button
                    key={city}
                    type="button"
                    onClick={() => handleCitySelect(city)}
                    className={`px-3 py-2 rounded-xl text-xs font-medium text-left border transition-all flex items-center justify-between ${
                      isSelected
                        ? 'bg-[#FFF8F2] border-[#FF811A] text-[#FA661C] font-bold'
                        : 'bg-white border-[#EAE3DC] text-[#6B6058] hover:border-[#FA661C] hover:text-[#FA661C]'
                    }`}
                  >
                    <span>{city}</span>
                    {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-[#FF811A]" />}
                  </button>
                );
              })}
            </div>
          </div>

        </div>

      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : modalContent;
}
