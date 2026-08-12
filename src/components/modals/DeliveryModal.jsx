import React, { useState } from 'react';
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0F3D2E]/50 backdrop-blur-xs animate-fadeIn">
      <div className="bg-[#FBF8F1] border border-[#D4AF37]/40 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-dropdown">
        
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-[#0F3D2E] to-[#155440] p-4 text-[#FBF8F1] flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <MapPin className="w-5 h-5 text-[#D4AF37]" />
            <h3 className="font-['Outfit'] font-bold text-base text-[#FBF8F1]">
              Select Delivery Location
            </h3>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-full text-[#FBF8F1]/80 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Close delivery modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6">
          <p className="text-xs text-[#5C6B63] mb-4">
            Select your location to check product availability, estimated delivery times, and local marketplace offers.
          </p>

          {/* Detect Location CTA Button */}
          <button
            type="button"
            onClick={() => {
              onSelectLocation("Current Location (GPS)");
              onClose();
            }}
            className="w-full mb-5 py-2.5 px-4 bg-[#E8F2EE] hover:bg-[#0F3D2E] text-[#0F3D2E] hover:text-[#FBF8F1] border border-[#0F3D2E]/20 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-2 group"
          >
            <Navigation className="w-4 h-4 text-[#D4AF37] group-hover:animate-spin" />
            <span>Use Current GPS Location</span>
          </button>

          <div className="relative flex items-center justify-center mb-5">
            <div className="border-t border-[#D8E0DC] w-full" />
            <span className="bg-[#FBF8F1] px-3 text-[10px] uppercase font-bold text-[#5C6B63] absolute">
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
                className="flex-1 px-3 py-2 text-xs bg-white border border-[#D8E0DC] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0F3D2E] text-[#0F3D2E] font-medium"
              />
              <button 
                type="submit"
                className="px-4 py-2 bg-[#0F3D2E] hover:bg-[#155440] text-[#FBF8F1] text-xs font-bold rounded-xl transition-colors shadow-xs"
              >
                Apply
              </button>
            </div>
            {error && <p className="text-[11px] text-[#C0392B] mt-1 font-semibold">{error}</p>}
          </form>

          {/* Popular Cities */}
          <div>
            <p className="text-[11px] font-bold text-[#0F3D2E] uppercase tracking-wider mb-2">
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
                        ? 'bg-[#FCF7E8] border-[#D4AF37] text-[#0F3D2E] font-bold'
                        : 'bg-white border-[#D8E0DC] text-[#5C6B63] hover:border-[#0F3D2E] hover:text-[#0F3D2E]'
                    }`}
                  >
                    <span>{city}</span>
                    {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-[#D4AF37]" />}
                  </button>
                );
              })}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
