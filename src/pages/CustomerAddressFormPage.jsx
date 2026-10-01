import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { 
  MapPin, 
  ArrowLeft, 
  Navigation, 
  Save, 
  Home, 
  Building2, 
  Sparkles, 
  ShieldCheck, 
  Loader2, 
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import { apiRequest } from '../utils/api';
import { useToast } from '../context/ToastContext';

export default function CustomerAddressFormPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const toast = useToast();
  const isEditMode = Boolean(id);

  // Form State matching Django CustomerAddress model
  const [formData, setFormData] = useState({
    label: 'Home',
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

  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [generalError, setGeneralError] = useState(null);

  // SEO Standard - Document Title
  useEffect(() => {
    document.title = isEditMode 
      ? `Edit Address #${id} — MytriKart Account` 
      : 'Add New Address — MytriKart Account';
  }, [isEditMode, id]);

  // Load existing address data in Edit Mode
  useEffect(() => {
    if (!isEditMode) return;

    let isMounted = true;
    async function fetchAddressDetail() {
      setIsLoadingDetail(true);
      try {
        const data = await apiRequest(`/api/customers/addresses/${id}/`);
        if (!isMounted) return;
        setFormData({
          label: data.label || 'Home',
          full_name: data.full_name || '',
          phone_number: data.phone_number || '',
          address_line1: data.address_line1 || '',
          address_line2: data.address_line2 || '',
          city: data.city || '',
          state: data.state || '',
          postal_code: data.postal_code || '',
          country: data.country || 'IN',
          address_type: data.address_type || 'both',
          is_default: Boolean(data.is_default)
        });
      } catch (err) {
        console.error('Failed to load address detail:', err);
        setGeneralError('Could not load address details from server.');
        toast.error('Error Loading Address', 'Unable to fetch existing address.');
      } finally {
        if (isMounted) setIsLoadingDetail(false);
      }
    }
    fetchAddressDetail();
    return () => { isMounted = false; };
  }, [id, isEditMode]);

  // Handle Locate Me (Browser Geolocation + OpenStreetMap Reverse Geocoding)
  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation Unavailable', 'Your browser does not support GPS location.');
      return;
    }

    setIsLocating(true);
    setGeneralError(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
          );
          const data = await res.json();
          const address = data.address || {};

          setFormData(prev => ({
            ...prev,
            address_line1: [address.house_number, address.road, address.suburb, address.neighbourhood]
              .filter(Boolean).join(', ') || prev.address_line1,
            city: address.city || address.town || address.village || address.county || prev.city,
            state: address.state || prev.state,
            postal_code: address.postcode ? String(address.postcode).replace(/\D/g, '') : prev.postal_code,
            country: (address.country_code ? String(address.country_code).toUpperCase() : prev.country)
          }));

          toast.success('Location Auto-Detected', `Found address: ${address.city || address.town || 'Your area'}.`);
        } catch (geoErr) {
          console.warn('Reverse geocoding failed:', geoErr);
          toast.error('Geocoding Error', 'GPS location captured, but address lookup failed. Please type manually.');
        } finally {
          setIsLocating(false);
        }
      },
      (error) => {
        console.warn('Geolocation permission denied or failed:', error);
        setIsLocating(false);
        toast.error('Location Error', 'Unable to fetch GPS position. Please check browser location permissions.');
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  // Client Validation
  const validateForm = () => {
    const errors = {};
    if (!formData.full_name.trim()) errors.full_name = 'Full name is required';
    if (!formData.phone_number.trim()) {
      errors.phone_number = 'Phone number is required';
    } else if (!/^[0-9+\-\s()]{7,15}$/.test(formData.phone_number.trim())) {
      errors.phone_number = 'Please enter a valid phone number (7-15 digits)';
    }
    if (!formData.address_line1.trim()) errors.address_line1 = 'Street address is required';
    if (!formData.city.trim()) errors.city = 'City is required';
    if (!formData.state.trim()) errors.state = 'State is required';
    if (!formData.postal_code.trim()) {
      errors.postal_code = 'Postal PIN code is required';
    } else if (!/^[a-zA-Z0-9\s\-]{3,10}$/.test(formData.postal_code.trim())) {
      errors.postal_code = 'Please enter a valid postal PIN code';
    }
    if (!formData.country.trim()) errors.country = 'Country ISO code is required';

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle Form Submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setGeneralError(null);
    setFieldErrors({});

    if (!validateForm()) {
      toast.error('Validation Error', 'Please correct the highlighted fields before submitting.');
      return;
    }

    setIsSubmitting(true);
    const payload = {
      label: formData.label.trim(),
      full_name: formData.full_name.trim(),
      phone_number: formData.phone_number.trim(),
      address_line1: formData.address_line1.trim(),
      address_line2: formData.address_line2.trim(),
      city: formData.city.trim(),
      state: formData.state.trim(),
      postal_code: formData.postal_code.trim(),
      country: formData.country.trim().toUpperCase(),
      address_type: formData.address_type,
      is_default: formData.is_default
    };

    try {
      if (isEditMode) {
        await apiRequest(`/api/customers/addresses/${id}/`, {
          method: 'PATCH',
          body: JSON.stringify(payload)
        });
        toast.success('Address Updated', 'Address changes saved successfully.');
      } else {
        await apiRequest('/api/customers/addresses/', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
        toast.success('Address Added', 'New delivery destination saved to your Address Book.');
      }
      setIsSubmitting(false);
      navigate('/profile/addresses');
    } catch (err) {
      setIsSubmitting(false);
      console.error('Failed to save address:', err);
      let errMsg = err.message || 'Failed to save address';
      if (err.data && typeof err.data === 'object') {
        const apiErrors = {};
        Object.entries(err.data).forEach(([key, val]) => {
          apiErrors[key] = Array.isArray(val) ? val.join(', ') : String(val);
        });
        setFieldErrors(apiErrors);
        errMsg = Object.values(apiErrors).join(' | ');
      }
      setGeneralError(errMsg);
      toast.error('Save Failed', errMsg);
    }
  };

  return (
    <div className="min-h-screen bg-[#FFFFFF] flex flex-col text-[#1A2420] font-sans selection:bg-[#FF811A]/30 selection:text-[#FA661C]">
      
      {/* Top Navigation Bar */}
      <header className="bg-white border-b border-[#EAE3DC] py-3 px-4 sm:px-8 sticky top-0 z-30 shadow-2xs">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={() => navigate('/profile/addresses')}
              className="p-2 rounded-xl bg-[#FFFFFF] hover:bg-[#FFF3EC] border border-[#EAE3DC] text-[#FA661C] transition-colors cursor-pointer"
              aria-label="Back to Address Book"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>

            <div>
              <div className="flex items-center space-x-1.5 text-[10px] text-[#6B6058] mb-0.5">
                <Link to="/profile" className="hover:underline">Account Hub</Link>
                <span>/</span>
                <Link to="/profile/addresses" className="hover:underline">Address Book</Link>
                <span>/</span>
                <span className="font-bold text-[#FA661C]">
                  {isEditMode ? 'Edit Address' : 'New Address'}
                </span>
              </div>
              <h1 className="font-['Outfit'] font-extrabold text-lg sm:text-xl text-[#FA661C]">
                {isEditMode ? `Edit Address Specification #${id}` : 'Add New Saved Address'}
              </h1>
            </div>
          </div>

          <div className="flex items-center space-x-2 text-[10px] font-bold text-[#FA661C] bg-[#FFF8F2] border border-[#FF811A]/40 px-3 py-1 rounded-full">
            <ShieldCheck className="w-3.5 h-3.5 text-[#FF811A]" />
            <span>Secure Encryption</span>
          </div>
        </div>
      </header>

      {/* Main Page Layout */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        
        {/* Loading Indicator for Edit Mode */}
        {isLoadingDetail ? (
          <div className="p-12 text-center bg-white rounded-3xl border border-[#EAE3DC] shadow-xs flex flex-col items-center justify-center space-y-3">
            <Loader2 className="w-8 h-8 animate-spin text-[#FA661C]" />
            <p className="text-xs font-bold text-[#FA661C]">Loading saved address details from server...</p>
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-[#EAE3DC] p-6 sm:p-8 lg:p-10 shadow-xs space-y-6">
            
            {/* Form Section Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-[#EAE3DC] gap-4">
              <div>
                <h2 className="font-['Outfit'] text-xl sm:text-2xl font-extrabold text-[#FA661C] flex items-center space-x-2">
                  <MapPin className="w-5 h-5 text-[#FF811A]" />
                  <span>{isEditMode ? 'Update Delivery Location' : 'Delivery & Billing Destination'}</span>
                </h2>
                <p className="text-xs text-[#6B6058] mt-1">
                  Specify exact receiver details, street coordinates, and default preferences
                </p>
              </div>

              {/* Locate Me Button */}
              <button
                type="button"
                onClick={handleLocateMe}
                disabled={isLocating}
                className="px-4 py-2.5 rounded-xl bg-[#FFF3EC] hover:bg-[#FFE6D5] border border-[#FF811A]/40 text-[#FA661C] text-xs font-bold flex items-center space-x-2 transition-all cursor-pointer self-start sm:self-auto disabled:opacity-50"
              >
                {isLocating ? (
                  <Loader2 className="w-4 h-4 animate-spin text-[#FA661C]" />
                ) : (
                  <Navigation className="w-4 h-4 text-[#FF811A]" />
                )}
                <span>{isLocating ? 'Detecting Location...' : 'Locate Me (GPS Auto-Fill)'}</span>
              </button>
            </div>

            {/* General Error Banner */}
            {generalError && (
              <div className="p-4 rounded-2xl bg-[#FDE8EA] border border-[#D7263D]/40 text-[#D7263D] text-xs font-medium flex items-start space-x-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{generalError}</span>
              </div>
            )}

            {/* Main Address Form */}
            <form onSubmit={handleSubmit} className="space-y-6 text-xs">
              
              {/* Address Label Selector */}
              <div>
                <label className="block font-bold text-[#FA661C] uppercase tracking-wider text-[10px] mb-2">
                  Address Label / Destination Type
                </label>
                <div className="grid grid-cols-3 gap-3 max-w-md">
                  {['Home', 'Office', 'Other'].map((labelChoice) => (
                    <button
                      key={labelChoice}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, label: labelChoice }))}
                      className={`py-2.5 rounded-xl font-bold border transition-all flex items-center justify-center space-x-1.5 cursor-pointer ${
                        formData.label === labelChoice
                          ? 'bg-[#FA661C] text-[#FFFFFF] border-[#FA661C] shadow-xs'
                          : 'bg-white text-[#6B6058] border-[#EAE3DC] hover:border-[#FA661C]'
                      }`}
                    >
                      {labelChoice === 'Home' ? <Home className="w-3.5 h-3.5 text-[#FF811A]" /> : labelChoice === 'Office' ? <Building2 className="w-3.5 h-3.5 text-[#FF811A]" /> : <MapPin className="w-3.5 h-3.5 text-[#FF811A]" />}
                      <span>{labelChoice}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Full Name & Phone Number */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="full_name_input" className="block font-bold text-[#6B6058] mb-1.5">
                    Receiver Full Name <span className="text-[#D7263D]">*</span>
                  </label>
                  <input
                    id="full_name_input"
                    type="text"
                    required
                    value={formData.full_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                    placeholder="e.g. Rahul Sharma"
                    className={`w-full py-2.5 px-3.5 bg-white border rounded-xl text-[#FA661C] font-medium outline-none transition-all ${
                      fieldErrors.full_name ? 'border-[#D7263D] ring-1 ring-[#D7263D]' : 'border-[#EAE3DC] focus:border-[#FA661C]'
                    }`}
                  />
                  {fieldErrors.full_name && <p className="text-[10px] text-[#D7263D] font-bold mt-1">{fieldErrors.full_name}</p>}
                </div>

                <div>
                  <label htmlFor="phone_number_input" className="block font-bold text-[#6B6058] mb-1.5">
                    10-Digit Mobile / Contact Number <span className="text-[#D7263D]">*</span>
                  </label>
                  <input
                    id="phone_number_input"
                    type="tel"
                    required
                    value={formData.phone_number}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone_number: e.target.value }))}
                    placeholder="e.g. 9876543210"
                    className={`w-full py-2.5 px-3.5 bg-white border rounded-xl text-[#FA661C] font-medium outline-none transition-all ${
                      fieldErrors.phone_number ? 'border-[#D7263D] ring-1 ring-[#D7263D]' : 'border-[#EAE3DC] focus:border-[#FA661C]'
                    }`}
                  />
                  {fieldErrors.phone_number && <p className="text-[10px] text-[#D7263D] font-bold mt-1">{fieldErrors.phone_number}</p>}
                </div>
              </div>

              {/* Street Address Line 1 */}
              <div>
                <label htmlFor="address_line1_input" className="block font-bold text-[#6B6058] mb-1.5">
                  Flat, House No., Building, Company, Apartment, Street <span className="text-[#D7263D]">*</span>
                </label>
                <input
                  id="address_line1_input"
                  type="text"
                  required
                  value={formData.address_line1}
                  onChange={(e) => setFormData(prev => ({ ...prev, address_line1: e.target.value }))}
                  placeholder="e.g. Flat 402, Emerald Heights, Linking Road"
                  className={`w-full py-2.5 px-3.5 bg-white border rounded-xl text-[#FA661C] font-medium outline-none transition-all ${
                    fieldErrors.address_line1 ? 'border-[#D7263D] ring-1 ring-[#D7263D]' : 'border-[#EAE3DC] focus:border-[#FA661C]'
                  }`}
                />
                {fieldErrors.address_line1 && <p className="text-[10px] text-[#D7263D] font-bold mt-1">{fieldErrors.address_line1}</p>}
              </div>

              {/* Address Line 2 / Landmark */}
              <div>
                <label htmlFor="address_line2_input" className="block font-bold text-[#6B6058] mb-1.5">
                  Landmark, Area, Sector (Optional)
                </label>
                <input
                  id="address_line2_input"
                  type="text"
                  value={formData.address_line2}
                  onChange={(e) => setFormData(prev => ({ ...prev, address_line2: e.target.value }))}
                  placeholder="e.g. Opposite City Hospital, Bandra West"
                  className="w-full py-2.5 px-3.5 bg-white border border-[#EAE3DC] rounded-xl text-[#FA661C] font-medium focus:border-[#FA661C] outline-none"
                />
              </div>

              {/* City, State, PIN Code, Country */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label htmlFor="city_input" className="block font-bold text-[#6B6058] mb-1.5">
                    City <span className="text-[#D7263D]">*</span>
                  </label>
                  <input
                    id="city_input"
                    type="text"
                    required
                    value={formData.city}
                    onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                    placeholder="e.g. Mumbai"
                    className={`w-full py-2.5 px-3.5 bg-white border rounded-xl text-[#FA661C] font-medium outline-none ${
                      fieldErrors.city ? 'border-[#D7263D] ring-1 ring-[#D7263D]' : 'border-[#EAE3DC] focus:border-[#FA661C]'
                    }`}
                  />
                  {fieldErrors.city && <p className="text-[10px] text-[#D7263D] font-bold mt-1">{fieldErrors.city}</p>}
                </div>

                <div>
                  <label htmlFor="state_input" className="block font-bold text-[#6B6058] mb-1.5">
                    State <span className="text-[#D7263D]">*</span>
                  </label>
                  <input
                    id="state_input"
                    type="text"
                    required
                    value={formData.state}
                    onChange={(e) => setFormData(prev => ({ ...prev, state: e.target.value }))}
                    placeholder="e.g. Maharashtra"
                    className={`w-full py-2.5 px-3.5 bg-white border rounded-xl text-[#FA661C] font-medium outline-none ${
                      fieldErrors.state ? 'border-[#D7263D] ring-1 ring-[#D7263D]' : 'border-[#EAE3DC] focus:border-[#FA661C]'
                    }`}
                  />
                  {fieldErrors.state && <p className="text-[10px] text-[#D7263D] font-bold mt-1">{fieldErrors.state}</p>}
                </div>

                <div>
                  <label htmlFor="postal_code_input" className="block font-bold text-[#6B6058] mb-1.5">
                    PIN / Postal Code <span className="text-[#D7263D]">*</span>
                  </label>
                  <input
                    id="postal_code_input"
                    type="text"
                    maxLength={10}
                    required
                    value={formData.postal_code}
                    onChange={(e) => setFormData(prev => ({ ...prev, postal_code: e.target.value }))}
                    placeholder="e.g. 400050"
                    className={`w-full py-2.5 px-3.5 bg-white border rounded-xl text-[#FA661C] font-medium outline-none ${
                      fieldErrors.postal_code ? 'border-[#D7263D] ring-1 ring-[#D7263D]' : 'border-[#EAE3DC] focus:border-[#FA661C]'
                    }`}
                  />
                  {fieldErrors.postal_code && <p className="text-[10px] text-[#D7263D] font-bold mt-1">{fieldErrors.postal_code}</p>}
                </div>

                <div>
                  <label htmlFor="country_input" className="block font-bold text-[#6B6058] mb-1.5">
                    Country Code <span className="text-[#D7263D]">*</span>
                  </label>
                  <select
                    id="country_input"
                    value={formData.country}
                    onChange={(e) => setFormData(prev => ({ ...prev, country: e.target.value }))}
                    className="w-full py-2.5 px-3 bg-white border border-[#EAE3DC] rounded-xl text-[#FA661C] font-medium focus:border-[#FA661C] outline-none"
                  >
                    <option value="IN">India (IN)</option>
                    <option value="US">United States (US)</option>
                    <option value="GB">United Kingdom (GB)</option>
                    <option value="CA">Canada (CA)</option>
                    <option value="AU">Australia (AU)</option>
                    <option value="AE">United Arab Emirates (AE)</option>
                  </select>
                </div>
              </div>

              {/* Address Usage Type (Choices: shipping, billing, both) */}
              <div>
                <label className="block font-bold text-[#FA661C] uppercase tracking-wider text-[10px] mb-2">
                  Address Usage Scope
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-lg">
                  {[
                    { value: 'both', title: 'Both Shipping & Billing' },
                    { value: 'shipping', title: 'Shipping Only' },
                    { value: 'billing', title: 'Billing Only' }
                  ].map((typeChoice) => (
                    <label
                      key={typeChoice.value}
                      className={`p-3 rounded-xl border font-bold flex items-center space-x-2 cursor-pointer transition-all ${
                        formData.address_type === typeChoice.value
                          ? 'border-[#FA661C] bg-[#FFF8F2] text-[#FA661C]'
                          : 'border-[#EAE3DC] bg-white text-[#6B6058] hover:border-[#FA661C]'
                      }`}
                    >
                      <input
                        type="radio"
                        name="address_type"
                        value={typeChoice.value}
                        checked={formData.address_type === typeChoice.value}
                        onChange={() => setFormData(prev => ({ ...prev, address_type: typeChoice.value }))}
                        className="text-[#FA661C] focus:ring-[#FA661C]"
                      />
                      <span className="text-xs">{typeChoice.title}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Single Default Address Checkbox (Matching Real Django CustomerAddress Model Schema) */}
              <div className="pt-4 border-t border-[#EAE3DC]">
                <label className="flex items-center space-x-2.5 font-bold text-[#FA661C] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_default}
                    onChange={(e) => setFormData(prev => ({ ...prev, is_default: e.target.checked }))}
                    className="w-4 h-4 rounded border-[#EAE3DC] text-[#FA661C] focus:ring-[#FA661C]"
                  />
                  <span>Make this my default address</span>
                </label>
                <p className="text-[10px] text-[#6B6058] mt-1 ml-6">
                  Default address will automatically be selected for all new catalog checkouts.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-end space-y-3 sm:space-y-0 sm:space-x-3 pt-6 border-t border-[#EAE3DC]">
                <button
                  type="button"
                  onClick={() => navigate('/profile/addresses')}
                  className="w-full sm:w-auto px-6 py-2.5 bg-white border border-[#EAE3DC] text-[#6B6058] hover:bg-[#FFF3EC] rounded-xl font-bold transition-all cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full sm:w-auto px-8 py-2.5 bg-[#FA661C] hover:bg-[#E0530B] text-[#FFFFFF] rounded-xl font-bold transition-all flex items-center justify-center space-x-2 shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                  ) : (
                    <Save className="w-4 h-4 text-white" />
                  )}
                  <span>{isSubmitting ? 'Saving Address...' : (isEditMode ? 'Save Address Changes' : 'Save New Address')}</span>
                </button>
              </div>

            </form>
          </div>
        )}

      </main>

    </div>
  );
}
