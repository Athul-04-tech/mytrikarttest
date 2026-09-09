import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from '../../context/AuthContext';
import { CartWishlistProvider } from '../../context/CartWishlistContext';
import { ToastProvider } from '../../context/ToastContext';
import LoginPage from '../LoginPage';
import HomePage from '../HomePage';
import { isRouteAllowedForRole, resolvePostLoginRedirect, getHomeRouteForRole } from '../../utils/authRouting';
import * as api from '../../utils/api';

function LocationDisplay() {
  const location = useLocation();
  return (
    <div>
      <div data-testid="current-path">{location.pathname}</div>
      <div data-testid="current-state-from">{location.state?.from || 'NONE'}</div>
    </div>
  );
}

describe('Post-Login Redirect Role Safety & Cross-Role Link Gating', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  describe('1. Unit Tests for authRouting.js Role Safety', () => {
    it('rejects /seller/dashboard for customer role and falls back to /', () => {
      expect(isRouteAllowedForRole('/seller/dashboard', 'customer')).toBe(false);
      expect(resolvePostLoginRedirect('/seller/dashboard', 'customer')).toBe('/');
    });

    it('rejects /admin for customer role and falls back to /', () => {
      expect(isRouteAllowedForRole('/admin', 'customer')).toBe(false);
      expect(resolvePostLoginRedirect('/admin', 'customer')).toBe('/');
    });

    it('allows /seller/dashboard for vendor and seller roles', () => {
      expect(isRouteAllowedForRole('/seller/dashboard', 'vendor')).toBe(true);
      expect(resolvePostLoginRedirect('/seller/dashboard', 'vendor')).toBe('/seller/dashboard');

      expect(isRouteAllowedForRole('/seller/dashboard', 'seller')).toBe(true);
      expect(resolvePostLoginRedirect('/seller/dashboard', 'seller')).toBe('/seller/dashboard');
    });

    it('allows /admin for admin role', () => {
      expect(isRouteAllowedForRole('/admin', 'admin')).toBe(true);
      expect(resolvePostLoginRedirect('/admin', 'admin')).toBe('/admin');
    });

    it('allows public /seller/register for customer role', () => {
      expect(isRouteAllowedForRole('/seller/register', 'customer')).toBe(true);
      expect(resolvePostLoginRedirect('/seller/register', 'customer')).toBe('/seller/register');
    });

    it('allows customer-safe paths like /category/electronics or /cart for customer role', () => {
      expect(isRouteAllowedForRole('/category/electronics', 'customer')).toBe(true);
      expect(resolvePostLoginRedirect('/category/electronics', 'customer')).toBe('/category/electronics');
    });
  });

  describe('2. LoginPage Integration: Cross-Role Redirect Bouncing', () => {
    it('redirects customer logging in with state.from = /seller/dashboard safely to /', async () => {
      vi.spyOn(api, 'getTokens').mockReturnValue({ access: null, refresh: null });
      vi.spyOn(api, 'apiRequest').mockImplementation(async (url) => {
        if (url.includes('/api/accounts/login/')) {
          return { access: 'cust-token', refresh: 'cust-refresh', user: { username: 'athulb', role: 'customer' } };
        }
        if (url.includes('/api/accounts/me/')) {
          return { id: 10, username: 'athulb', role: 'customer', first_name: 'Athul', last_name: 'B' };
        }
        return {};
      });

      render(
        <MemoryRouter initialEntries={[{ pathname: '/login', state: { from: '/seller/dashboard' } }]}>
          <ToastProvider>
            <AuthProvider>
              <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/" element={<LocationDisplay />} />
                <Route path="/seller/dashboard" element={<LocationDisplay />} />
              </Routes>
            </AuthProvider>
          </ToastProvider>
        </MemoryRouter>
      );

      const identifierInput = screen.getByLabelText(/Email or Mobile Number/i);
      fireEvent.change(identifierInput, { target: { value: 'athulb@example.com' } });

      const passStepBtn = screen.getByText(/login with password instead/i);
      fireEvent.click(passStepBtn);

      const passwordInput = await screen.findByPlaceholderText(/enter your account password/i);
      fireEvent.change(passwordInput, { target: { value: 'CustomerPass123!' } });

      const submitBtn = screen.getByRole('button', { name: /^Login$/i });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(screen.getByTestId('current-path').textContent).toBe('/');
      }, { timeout: 3000 });
    });

    it('returns vendor logging in with state.from = /seller/products/new directly to /seller/products/new', async () => {
      vi.spyOn(api, 'getTokens').mockReturnValue({ access: null, refresh: null });
      vi.spyOn(api, 'apiRequest').mockImplementation(async (url) => {
        if (url.includes('/api/accounts/login/')) {
          return { access: 'vendor-token', refresh: 'vendor-refresh', user: { username: 'vendor1', role: 'vendor' } };
        }
        if (url.includes('/api/accounts/me/')) {
          return { id: 20, username: 'vendor1', role: 'vendor', first_name: 'Vendor', last_name: 'One' };
        }
        return {};
      });

      render(
        <MemoryRouter initialEntries={[{ pathname: '/login', state: { from: '/seller/products/new' } }]}>
          <ToastProvider>
            <AuthProvider>
              <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/" element={<LocationDisplay />} />
                <Route path="/seller/products/new" element={<LocationDisplay />} />
              </Routes>
            </AuthProvider>
          </ToastProvider>
        </MemoryRouter>
      );

      const identifierInput = screen.getByLabelText(/Email or Mobile Number/i);
      fireEvent.change(identifierInput, { target: { value: 'vendor1@example.com' } });

      const passStepBtn = screen.getByText(/login with password instead/i);
      fireEvent.click(passStepBtn);

      const passwordInput = await screen.findByPlaceholderText(/enter your account password/i);
      fireEvent.change(passwordInput, { target: { value: 'VendorPass123!' } });

      const submitBtn = screen.getByRole('button', { name: /^Login$/i });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(screen.getByTestId('current-path').textContent).toBe('/seller/products/new');
      }, { timeout: 3000 });
    });
  });

  describe('3. HomePage Promo Card Role Gating', () => {
    it('hides Open Seller Hub Dashboard button for customer or guest users', () => {
      vi.spyOn(api, 'getTokens').mockReturnValue({ access: null, refresh: null });

      render(
        <MemoryRouter>
          <ToastProvider>
            <AuthProvider>
              <CartWishlistProvider>
                <HomePage isLoggedIn={false} currentUser={null} />
              </CartWishlistProvider>
            </AuthProvider>
          </ToastProvider>
        </MemoryRouter>
      );

      expect(screen.queryByText(/Open Seller Hub Dashboard/i)).toBeNull();
      expect(screen.getByText(/Start Selling Today/i)).toBeDefined();
    });

    it('renders Open Seller Hub Dashboard button for vendor user', () => {
      vi.spyOn(api, 'getTokens').mockReturnValue({ access: null, refresh: null });

      render(
        <MemoryRouter>
          <ToastProvider>
            <AuthProvider>
              <CartWishlistProvider>
                <HomePage isLoggedIn={true} currentUser={{ role: 'vendor', name: 'Vendor User' }} />
              </CartWishlistProvider>
            </AuthProvider>
          </ToastProvider>
        </MemoryRouter>
      );

      expect(screen.getByText(/Open Seller Hub Dashboard/i)).toBeDefined();
      expect(screen.getByText(/Start Selling Today/i)).toBeDefined();
    });
  });
});
