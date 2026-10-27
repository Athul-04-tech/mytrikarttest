import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { apiRequest } from '../utils/api';
import { useAuth } from './AuthContext';

const VendorProfileContext = createContext(null);

export function VendorProfileProvider({ children }) {
  const { isLoggedIn, currentUser } = useAuth();
  const [vendorProfile, setVendorProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const fetchProfile = useCallback(async () => {
    // Only vendors can access /api/vendors/me/
    if (!isLoggedIn || currentUser?.role !== 'vendor') {
      setVendorProfile(null);
      setIsLoading(false);
      setError(null);
      return null;
    }

    setIsLoading(true);
    setError(null);
    try {
      const data = await apiRequest('/api/vendors/me/');
      setVendorProfile(data);
      setError(null);
      return data;
    } catch (err) {
      const msg = err.data?.detail || err.data?.message || err.message || 'Failed to load vendor profile.';
      setError(msg);
      setVendorProfile(null);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [isLoggedIn, currentUser?.role]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const updateProfile = useCallback(async (patchPayload) => {
    setIsUpdating(true);
    try {
      const updated = await apiRequest('/api/vendors/me/', {
        method: 'PATCH',
        body: JSON.stringify(patchPayload)
      });
      // The API returns the updated serializer representation
      // Update local state directly and ensure consistent state
      setVendorProfile((prev) => ({ ...(prev || {}), ...updated }));
      return { success: true, data: updated };
    } catch (err) {
      const errorMessage = err.data?.detail || err.message || 'Failed to update vendor profile.';
      return {
        success: false,
        error: errorMessage,
        fieldErrors: typeof err.data === 'object' && err.data !== null ? err.data : {}
      };
    } finally {
      setIsUpdating(false);
    }
  }, []);

  const uploadStoreImage = useCallback(async (kind, file) => {
    setIsUpdating(true);
    try {
      const endpoint = kind === 'logo' ? '/api/vendors/me/store-logo/' : '/api/vendors/me/store-banner/';
      const formData = new FormData();
      formData.append('image', file);
      const updated = await apiRequest(endpoint, {
        method: 'POST',
        body: formData
      });
      setVendorProfile((prev) => ({ ...(prev || {}), ...updated }));
      return { success: true, data: updated };
    } catch (err) {
      const errorMessage = err.data?.image
        ? (Array.isArray(err.data.image) ? err.data.image.join(' ') : String(err.data.image))
        : (err.data?.detail || err.message || `Failed to upload store ${kind}.`);
      return {
        success: false,
        error: errorMessage,
        fieldErrors: typeof err.data === 'object' && err.data !== null ? err.data : {}
      };
    } finally {
      setIsUpdating(false);
    }
  }, []);

  const removeStoreImage = useCallback(async (kind) => {
    setIsUpdating(true);
    try {
      const endpoint = kind === 'logo' ? '/api/vendors/me/store-logo/' : '/api/vendors/me/store-banner/';
      const updated = await apiRequest(endpoint, {
        method: 'DELETE'
      });
      setVendorProfile((prev) => ({ ...(prev || {}), ...updated }));
      return { success: true, data: updated };
    } catch (err) {
      const errorMessage = err.data?.detail || err.message || `Failed to remove store ${kind}.`;
      return {
        success: false,
        error: errorMessage
      };
    } finally {
      setIsUpdating(false);
    }
  }, []);

  // Derived display helpers
  const rawStoreName = vendorProfile?.store_name?.trim();
  const rawLegalName = vendorProfile?.business_name?.trim();
  const storeName = rawStoreName || (isLoading ? null : 'Not set');
  const legalName = rawLegalName || (isLoading ? null : 'Not set');
  const storeLogo = vendorProfile?.store_logo || null;
  const storeBanner = vendorProfile?.store_banner || null;
  const taxId = vendorProfile?.tax_id || (isLoading ? null : 'Not set');

  const storeInitials = (() => {
    if (!rawStoreName) return 'NS';
    const parts = rawStoreName.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return rawStoreName.slice(0, 2).toUpperCase();
  })();

  const value = {
    vendorProfile,
    isLoading,
    error,
    isUpdating,
    fetchProfile,
    updateProfile,
    uploadStoreImage,
    removeStoreImage,
    storeName,
    legalName,
    storeLogo,
    storeBanner,
    taxId,
    storeInitials
  };

  return (
    <VendorProfileContext.Provider value={value}>
      {children}
    </VendorProfileContext.Provider>
  );
}

export function useVendorProfile() {
  const context = useContext(VendorProfileContext);
  const [standaloneProfile, setStandaloneProfile] = useState(null);
  const [standaloneLoading, setStandaloneLoading] = useState(!context);
  const [standaloneError, setStandaloneError] = useState(null);

  useEffect(() => {
    if (context) return;
    let isMounted = true;
    async function load() {
      try {
        const data = await apiRequest('/api/vendors/me/');
        if (isMounted) setStandaloneProfile(data);
      } catch (err) {
        if (isMounted) setStandaloneError(err.data?.detail || err.message || 'Failed to load profile');
      } finally {
        if (isMounted) setStandaloneLoading(false);
      }
    }
    load();
    return () => { isMounted = false; };
  }, [context]);

  if (context) {
    return context;
  }

  // Standalone fallback when component is mounted without VendorProfileProvider (e.g. in isolated unit tests)
  const updateProfile = async (patchPayload) => {
    try {
      const data = await apiRequest('/api/vendors/me/', {
        method: 'PATCH',
        body: JSON.stringify(patchPayload)
      });
      setStandaloneProfile((prev) => ({ ...(prev || {}), ...data }));
      return { success: true, data };
    } catch (err) {
      return {
        success: false,
        error: err.data?.detail || err.message || 'Failed to update profile',
        fieldErrors: typeof err.data === 'object' && err.data !== null ? err.data : {}
      };
    }
  };

  const uploadStoreImage = async (kind, file) => {
    try {
      const endpoint = kind === 'logo' ? '/api/vendors/me/store-logo/' : '/api/vendors/me/store-banner/';
      const formData = new FormData();
      formData.append('image', file);
      const data = await apiRequest(endpoint, {
        method: 'POST',
        body: formData
      });
      setStandaloneProfile((prev) => ({ ...(prev || {}), ...data }));
      return { success: true, data };
    } catch (err) {
      const errorMessage = err.data?.image
        ? (Array.isArray(err.data.image) ? err.data.image.join(' ') : String(err.data.image))
        : (err.data?.detail || err.message || `Failed to upload store ${kind}.`);
      return {
        success: false,
        error: errorMessage,
        fieldErrors: typeof err.data === 'object' && err.data !== null ? err.data : {}
      };
    }
  };

  const removeStoreImage = async (kind) => {
    try {
      const endpoint = kind === 'logo' ? '/api/vendors/me/store-logo/' : '/api/vendors/me/store-banner/';
      const data = await apiRequest(endpoint, {
        method: 'DELETE'
      });
      setStandaloneProfile((prev) => ({ ...(prev || {}), ...data }));
      return { success: true, data };
    } catch (err) {
      return {
        success: false,
        error: err.data?.detail || err.message || `Failed to remove store ${kind}.`
      };
    }
  };

  const rawStore = standaloneProfile?.store_name?.trim();
  return {
    vendorProfile: standaloneProfile,
    isLoading: standaloneLoading,
    error: standaloneError,
    isUpdating: false,
    fetchProfile: async () => {},
    updateProfile,
    uploadStoreImage,
    removeStoreImage,
    storeName: rawStore || (standaloneLoading ? null : 'Not set'),
    legalName: standaloneProfile?.business_name?.trim() || (standaloneLoading ? null : 'Not set'),
    storeLogo: standaloneProfile?.store_logo || null,
    storeBanner: standaloneProfile?.store_banner || null,
    taxId: standaloneProfile?.tax_id || (standaloneLoading ? null : 'Not set'),
    storeInitials: rawStore ? rawStore.slice(0, 2).toUpperCase() : 'NS'
  };
}

export default VendorProfileContext;
