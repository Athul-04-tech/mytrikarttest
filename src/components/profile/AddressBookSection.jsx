import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  MapPin, 
  Plus, 
  Trash2, 
  Edit2, 
  Home, 
  Building2, 
  CheckCircle2, 
  Loader2,
  AlertCircle,
  Star,
  Info 
} from 'lucide-react';
import { apiRequest } from '../../utils/api';
import { useToast } from '../../context/ToastContext';

export default function AddressBookSection() {
  const navigate = useNavigate();
  const toast = useToast();

  const [addresses, setAddresses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  // Fetch real addresses from GET /api/customers/addresses/
  const fetchAddresses = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await apiRequest('/api/customers/addresses/');
      setAddresses(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch addresses:', err);
      setError(err.message || 'Unable to load saved addresses from server');
      toast.error('Error', 'Could not load your address book');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAddresses();
  }, []);

  // Handle setting default address via POST /api/customers/addresses/:id/default/
  const handleSetDefault = async (id) => {
    setActionLoadingId(id);
    try {
      await apiRequest(`/api/customers/addresses/${id}/default/`, { method: 'POST' });
      toast.success('Default Address Updated', 'Selected address is now your default destination.');
      await fetchAddresses();
    } catch (err) {
      console.error('Failed to set default address:', err);
      toast.error('Failed', err.message || 'Could not update default address.');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Handle deleting address via DELETE /api/customers/addresses/:id/
  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to remove this saved address?')) return;

    setActionLoadingId(id);
    try {
      await apiRequest(`/api/customers/addresses/${id}/`, { method: 'DELETE' });
      toast.success('Address Removed', 'Address deleted from your Address Book.');
      await fetchAddresses();
    } catch (err) {
      console.error('Failed to delete address:', err);
      toast.error('Delete Failed', err.message || 'Could not delete address.');
    } finally {
      setActionLoadingId(null);
    }
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
            Manage your saved delivery locations, billing destinations, and default address preferences
          </p>
        </div>

        <button
          type="button"
          onClick={() => navigate('/account/addresses/new')}
          className="px-4 py-2.5 rounded-xl text-xs font-bold text-[#FFFFFF] bg-[#FA661C] hover:bg-[#E0530B] transition-all flex items-center space-x-1.5 shadow-sm self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4 text-white" />
          <span>Add New Address</span>
        </button>
      </div>

      {/* Loading State */}
      {isLoading ? (
        <div className="py-16 text-center flex flex-col items-center justify-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-[#FA661C]" />
          <p className="text-xs font-bold text-[#FA661C]">Fetching saved addresses from server...</p>
        </div>
      ) : error ? (
        <div className="mt-8 p-6 rounded-2xl bg-[#FDE8EA] border border-[#D7263D]/40 text-[#D7263D] text-xs font-bold flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 shrink-0 text-[#D7263D]" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={fetchAddresses}
            className="px-3.5 py-1.5 bg-white border border-[#D7263D] text-[#D7263D] rounded-xl text-xs"
          >
            Retry
          </button>
        </div>
      ) : addresses.length === 0 ? (
        /* Empty State */
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
            onClick={() => navigate('/account/addresses/new')}
            className="inline-flex items-center space-x-1.5 px-5 py-2.5 bg-[#FA661C] hover:bg-[#E0530B] text-[#FFFFFF] rounded-xl text-xs font-bold transition-all shadow-xs btn-interactive cursor-pointer"
          >
            <Plus className="w-4 h-4 text-white" />
            <span>Add New Address</span>
          </button>
        </div>
      ) : (
        /* Address Cards Grid */
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-5">
          {addresses.map((addr) => (
            <div
              key={addr.id}
              className={`p-5 rounded-2xl border transition-all duration-200 flex flex-col justify-between relative ${
                addr.is_default
                  ? 'border-[#FF811A] bg-[#FFF8F2]/40 shadow-xs'
                  : 'border-[#EAE3DC] bg-[#FFFFFF]/40 hover:border-[#6B6058]'
              }`}
            >
              <div>
                {/* Top Row: Label & Default Badge */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <span className="px-2.5 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider bg-[#FA661C] text-[#FFFFFF] flex items-center space-x-1">
                      {addr.label?.toLowerCase() === 'home' ? (
                        <Home className="w-3 h-3 text-white" />
                      ) : (
                        <Building2 className="w-3 h-3 text-white" />
                      )}
                      <span>{addr.label || 'Home'}</span>
                    </span>

                    {addr.is_default && (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#FF811A] text-[#FA661C] shadow-2xs flex items-center space-x-1">
                        <CheckCircle2 className="w-3 h-3 text-[#FA661C]" />
                        <span>Default Address</span>
                      </span>
                    )}

                    <span className="px-2 py-0.5 rounded-md text-[9px] font-bold bg-[#FFF3EC] text-[#FA661C] border border-[#FA661C]/20 uppercase">
                      {addr.address_type === 'both' ? 'Shipping & Billing' : `${addr.address_type} Only`}
                    </span>
                  </div>

                  {/* Edit & Delete Action Buttons */}
                  <div className="flex items-center space-x-1">
                    <button
                      type="button"
                      onClick={() => navigate(`/account/addresses/${addr.id}/edit`)}
                      className="p-1.5 text-[#6B6058] hover:text-[#FA661C] rounded-lg hover:bg-white transition-colors cursor-pointer"
                      aria-label="Edit address"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(addr.id)}
                      disabled={actionLoadingId === addr.id}
                      className="p-1.5 text-[#6B6058] hover:text-[#D7263D] rounded-lg hover:bg-white transition-colors cursor-pointer disabled:opacity-50"
                      aria-label="Delete address"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Recipient & Full Address */}
                <h4 className="font-['Outfit'] font-bold text-sm text-[#FA661C]">
                  {addr.full_name}
                </h4>
                <p className="text-xs text-[#6B6058] mt-1 leading-relaxed">
                  {addr.address_line1}
                  {addr.address_line2 && <><br />{addr.address_line2}</>}
                  <br />
                  {addr.city}, {addr.state} - <strong className="text-[#FA661C]">{addr.postal_code}</strong>, {addr.country}
                </p>
                <p className="text-xs text-[#FA661C] font-bold mt-2">
                  Phone: <span className="text-[#6B6058] font-normal">{addr.phone_number}</span>
                </p>
              </div>

              {/* Set as Default Action Button */}
              {!addr.is_default && (
                <div className="mt-4 pt-3 border-t border-[#EAE3DC] flex items-center justify-end">
                  <button
                    type="button"
                    onClick={() => handleSetDefault(addr.id)}
                    disabled={actionLoadingId === addr.id}
                    className="text-[11px] font-bold text-[#FA661C] hover:text-[#E0530B] flex items-center space-x-1 bg-white px-3 py-1 rounded-lg border border-[#EAE3DC] hover:border-[#FA661C] transition-all cursor-pointer disabled:opacity-50"
                  >
                    {actionLoadingId === addr.id ? (
                      <Loader2 className="w-3 h-3 animate-spin text-[#FA661C]" />
                    ) : (
                      <Star className="w-3 h-3 text-[#FF811A]" />
                    )}
                    <span>Set as Default</span>
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

    </div>
  );
}
