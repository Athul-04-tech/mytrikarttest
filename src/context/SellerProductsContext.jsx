import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiRequest } from '../utils/api';

const SellerProductsContext = createContext(null);

export function SellerProductsProvider({ children }) {
  const [pendingRequests, setPendingRequests] = useState([]);
  const [isLoadingRequests, setIsLoadingRequests] = useState(false);

  const refreshPendingRequests = async () => {
    setIsLoadingRequests(true);
    try {
      const data = await apiRequest('/api/products/vendor/attribute-value-requests/');
      setPendingRequests(Array.isArray(data) ? data : []);
    } catch (err) {
      console.warn('Failed to fetch vendor attribute value requests:', err);
      setPendingRequests([]);
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

  return (
    <SellerProductsContext.Provider
      value={{
        pendingRequests,
        isLoadingRequests,
        refreshPendingRequests,
        requestAttributeValue,
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
