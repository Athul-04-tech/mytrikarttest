import { useState, useEffect } from 'react';

const STORAGE_KEY = 'mytrikart_coupons_v1';
const EVENT_NAME = 'mytrikart_coupons_changed';

// No static mock coupons - only database or dynamically created coupons
const SEED_COUPONS = [];

const LEGACY_STATIC_CODES = new Set([
  'WELCOME100',
  'SAVE10',
  'FESTIVE20',
  'FREESHIP',
  'SUPER500',
  'PLUSGOLD',
  'EXPIRED50',
  'NEWUSER50',
  'MYTRI500-5566'
]);

/**
 * Get all stored coupons from localStorage
 */
export function getStoredCoupons() {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
      return [];
    }
    // Filter out any legacy static mock coupons
    const cleaned = parsed.filter(c => c && c.code && !LEGACY_STATIC_CODES.has(c.code));
    if (cleaned.length !== parsed.length) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cleaned));
    }
    return cleaned;
  } catch (err) {
    console.warn('Failed to parse coupons from localStorage:', err);
    return [];
  }
}

/**
 * Save coupons to localStorage and notify all listeners
 */
export function saveCoupons(coupons) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(coupons));
    window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: coupons }));
  } catch (err) {
    console.error('Failed to save coupons to localStorage:', err);
  }
}

/**
 * Add a new coupon
 */
export function createCoupon(newCoupon) {
  const current = getStoredCoupons();
  const cleanCode = newCoupon.code.trim().toUpperCase();
  
  if (current.some(c => c.code === cleanCode)) {
    throw new Error(`Coupon with code "${cleanCode}" already exists.`);
  }

  const created = {
    id: cleanCode,
    code: cleanCode,
    title: newCoupon.title.trim(),
    description: newCoupon.description?.trim() || '',
    discountType: newCoupon.discountType || 'percentage',
    discountAmount: Number(newCoupon.discountAmount) || 0,
    discountPercent: Number(newCoupon.discountPercent) || 0,
    minSpend: Number(newCoupon.minSpend) || 0,
    maxDiscount: Number(newCoupon.maxDiscount) || 500,
    expiresAt: newCoupon.expiresAt || new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
    category: newCoupon.category || 'all',
    tag: newCoupon.tag?.trim() || 'SPECIAL OFFER',
    isAvailable: newCoupon.isAvailable !== false,
    status: newCoupon.isAvailable !== false ? 'active' : 'inactive',
    terms: newCoupon.terms?.trim() || 'Standard marketplace terms apply.',
    usageLimit: Number(newCoupon.usageLimit) || 500,
    usedCount: 0,
    createdAt: new Date().toISOString().split('T')[0]
  };

  const updated = [created, ...current];
  saveCoupons(updated);
  return created;
}

/**
 * Edit an existing coupon
 */
export function updateCoupon(code, updates) {
  const current = getStoredCoupons();
  const cleanCode = code.trim().toUpperCase();
  const index = current.findIndex(c => c.code === cleanCode);

  if (index === -1) {
    throw new Error(`Coupon "${cleanCode}" not found.`);
  }

  const target = current[index];
  const updatedCoupon = {
    ...target,
    ...updates,
    code: updates.code ? updates.code.trim().toUpperCase() : target.code,
    discountAmount: updates.discountAmount !== undefined ? Number(updates.discountAmount) : target.discountAmount,
    discountPercent: updates.discountPercent !== undefined ? Number(updates.discountPercent) : target.discountPercent,
    minSpend: updates.minSpend !== undefined ? Number(updates.minSpend) : target.minSpend,
    maxDiscount: updates.maxDiscount !== undefined ? Number(updates.maxDiscount) : target.maxDiscount,
    usageLimit: updates.usageLimit !== undefined ? Number(updates.usageLimit) : target.usageLimit
  };

  // Sync isAvailable with status
  if (updates.status) {
    updatedCoupon.isAvailable = updates.status === 'active';
  } else if (updates.isAvailable !== undefined) {
    updatedCoupon.status = updates.isAvailable ? 'active' : 'inactive';
  }

  const nextList = [...current];
  nextList[index] = updatedCoupon;
  saveCoupons(nextList);
  return updatedCoupon;
}

/**
 * Delete a coupon
 */
export function deleteCoupon(code) {
  const current = getStoredCoupons();
  const cleanCode = code.trim().toUpperCase();
  const filtered = current.filter(c => c.code !== cleanCode);
  saveCoupons(filtered);
  return filtered;
}

/**
 * Quick toggle active/inactive status
 */
export function toggleCouponAvailability(code) {
  const current = getStoredCoupons();
  const cleanCode = code.trim().toUpperCase();
  const target = current.find(c => c.code === cleanCode);
  if (!target) return current;

  const nextAvailable = !target.isAvailable;
  return updateCoupon(cleanCode, {
    isAvailable: nextAvailable,
    status: nextAvailable ? 'active' : 'inactive'
  });
}

/**
 * Reset coupons back to initial default seed
 */
export function resetCouponsToSeed() {
  saveCoupons(SEED_COUPONS);
  return SEED_COUPONS;
}

/**
 * React Hook to access coupons reactively across components
 */
export function useCoupons() {
  const [coupons, setCoupons] = useState(() => getStoredCoupons());

  useEffect(() => {
    const handleUpdate = (e) => {
      setCoupons(e.detail || getStoredCoupons());
    };
    const handleStorage = (e) => {
      if (e.key === STORAGE_KEY) {
        setCoupons(getStoredCoupons());
      }
    };

    window.addEventListener(EVENT_NAME, handleUpdate);
    window.addEventListener('storage', handleStorage);
    return () => {
      window.removeEventListener(EVENT_NAME, handleUpdate);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  const availableCoupons = coupons.filter(c => c.isAvailable && c.status === 'active');
  const pastCoupons = coupons.filter(c => !c.isAvailable || c.status === 'expired' || c.status === 'used' || c.status === 'inactive');

  return {
    coupons,
    availableCoupons,
    pastCoupons,
    addCoupon: createCoupon,
    editCoupon: updateCoupon,
    removeCoupon: deleteCoupon,
    toggleStatus: toggleCouponAvailability,
    resetToSeed: resetCouponsToSeed,
    refresh: () => setCoupons(getStoredCoupons())
  };
}
