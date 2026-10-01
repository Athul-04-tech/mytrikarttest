import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiRequest } from '../utils/api';

const SellerProductsContext = createContext(null);

export function SellerProductsProvider({ children }) {
  const [pendingRequests, setPendingRequests] = useState([]);
  const [pendingBrandRequests, setPendingBrandRequests] = useState([]);
  const [isLoadingRequests, setIsLoadingRequests] = useState(false);

  const refreshPendingRequests = async () => {
    setIsLoadingRequests(true);
    try {
      const [attrData, brandData] = await Promise.all([
        apiRequest('/api/products/vendor/attribute-value-requests/').catch(() => []),
        apiRequest('/api/products/vendor/brand-requests/').catch(() => [])
      ]);
      setPendingRequests(Array.isArray(attrData) ? attrData : []);
      setPendingBrandRequests(Array.isArray(brandData) ? brandData : []);
    } catch (err) {
      console.warn('Failed to fetch vendor requests:', err);
    } finally {
      setIsLoadingRequests(false);
    }
  };

  useEffect(() => {
    refreshPendingRequests();
  }, []);

  const requestAttributeValue = async ({ attributeId, value, reason }) => {
    const payload = {
      category_attribute: attributeId,
      requested_value: value,
      reason: reason || 'Vendor catalog requirement for new collection.'
    };

    const newReq = await apiRequest('/api/products/vendor/attribute-value-requests/', {
      method: 'POST',
      body: JSON.stringify(payload)
    });

    setPendingRequests(prev => [newReq, ...prev]);
    return newReq;
  };

  const requestBrand = async ({ name, reason }) => {
    const payload = {
      requested_name: name,
      reason: reason || 'Vendor catalog requirement for official distribution.'
    };

    const newReq = await apiRequest('/api/products/vendor/brand-requests/', {
      method: 'POST',
      body: JSON.stringify(payload)
    });

    setPendingBrandRequests(prev => [newReq, ...prev]);
    return newReq;
  };

  return (
    <SellerProductsContext.Provider
      value={{
        pendingRequests,
        pendingBrandRequests,
        isLoadingRequests,
        refreshPendingRequests,
        requestAttributeValue,
        requestBrand,
      }}
    >
      {children}
    </SellerProductsContext.Provider>
  );
}

export function useSellerProducts() {
  const ctx = useContext(SellerProductsContext);
  if (!ctx) {
    throw new Error('useSellerProducts must be used within a SellerProductsProvider');
  }
  return ctx;
}

