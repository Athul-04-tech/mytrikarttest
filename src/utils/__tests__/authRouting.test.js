import { describe, it, expect } from 'vitest';
import {
  getHomeRouteForRole,
  isRouteAllowedForRole,
  resolvePostLoginRedirect,
  getAllowedRolesForRoute,
} from '../authRouting';

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

  it('6. returns /warehouse/dashboard for warehouse_manager role and enforces warehouse RBAC', () => {
    expect(getHomeRouteForRole('warehouse_manager')).toBe('/warehouse/dashboard');
    expect(getHomeRouteForRole('WAREHOUSE_MANAGER')).toBe('/warehouse/dashboard');

    // Public setup route is allowed for everyone
    expect(getAllowedRolesForRoute('/warehouse/setup')).toBeNull();
    expect(isRouteAllowedForRole('/warehouse/setup', 'customer')).toBe(true);
    expect(isRouteAllowedForRole('/warehouse/setup', 'warehouse_manager')).toBe(true);

    // /warehouse/* only allows warehouse_manager
    expect(getAllowedRolesForRoute('/warehouse/dashboard')).toEqual(['warehouse_manager']);
    expect(isRouteAllowedForRole('/warehouse/dashboard', 'warehouse_manager')).toBe(true);
    expect(isRouteAllowedForRole('/warehouse/dashboard', 'admin')).toBe(false);
    expect(isRouteAllowedForRole('/warehouse/dashboard', 'vendor')).toBe(false);
    expect(isRouteAllowedForRole('/warehouse/dashboard', 'customer')).toBe(false);

    // warehouse_manager is refused from /admin, /seller, and customer-only pages
    expect(isRouteAllowedForRole('/admin', 'warehouse_manager')).toBe(false);
    expect(isRouteAllowedForRole('/seller/dashboard', 'warehouse_manager')).toBe(false);
    expect(isRouteAllowedForRole('/profile', 'warehouse_manager')).toBe(false);
    expect(isRouteAllowedForRole('/checkout', 'warehouse_manager')).toBe(false);

    // Post-login redirect sends warehouse_manager to /warehouse/dashboard
    expect(resolvePostLoginRedirect(null, 'warehouse_manager')).toBe('/warehouse/dashboard');
    expect(resolvePostLoginRedirect('/profile', 'warehouse_manager')).toBe('/warehouse/dashboard');
    expect(resolvePostLoginRedirect('/admin', 'warehouse_manager')).toBe('/warehouse/dashboard');
    expect(resolvePostLoginRedirect('/warehouse/dashboard', 'warehouse_manager')).toBe('/warehouse/dashboard');
  });
});
