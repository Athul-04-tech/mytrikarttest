import { describe, it, expect } from 'vitest';
import { getHomeRouteForRole } from '../authRouting';

describe('getHomeRouteForRole Utility Suite', () => {
  it('1. returns /seller/dashboard for vendor role', () => {
    expect(getHomeRouteForRole('vendor')).toBe('/seller/dashboard');
    expect(getHomeRouteForRole('VENDOR')).toBe('/seller/dashboard');
  });

  it('2. returns /seller/dashboard for seller role', () => {
    expect(getHomeRouteForRole('seller')).toBe('/seller/dashboard');
    expect(getHomeRouteForRole('Seller')).toBe('/seller/dashboard');
  });

  it('3. returns /admin for admin role', () => {
    expect(getHomeRouteForRole('admin')).toBe('/admin');
    expect(getHomeRouteForRole('ADMIN')).toBe('/admin');
  });

  it('4. returns / for customer role', () => {
    expect(getHomeRouteForRole('customer')).toBe('/');
    expect(getHomeRouteForRole('CUSTOMER')).toBe('/');
  });

  it('5. returns / for missing, null, or unknown roles', () => {
    expect(getHomeRouteForRole(null)).toBe('/');
    expect(getHomeRouteForRole(undefined)).toBe('/');
    expect(getHomeRouteForRole('')).toBe('/');
    expect(getHomeRouteForRole('unknown_role')).toBe('/');
  });
});
