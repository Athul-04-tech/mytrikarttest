/**
 * Currency Formatting Utilities for Seller Dashboard (Module 4)
 */

export const formatCurrencyValue = (val, currencyCode = 'INR') => {
  const num = typeof val === 'string' ? parseFloat(val) : (Number(val) || 0);
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currencyCode || 'INR',
    maximumFractionDigits: num % 1 === 0 ? 0 : 2
  }).format(num);
};

export const formatSellerINR = (val) => {
  return formatCurrencyValue(val, 'INR');
};
