import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom';
import ProtectedRoute from '../ProtectedRoute';
import * as AuthContextModule from '../../../context/AuthContext';

// Mock useAuth hook
vi.mock('../../../context/AuthContext', async () => {
  const actual = await vi.importActual('../../../context/AuthContext');
  return {
    ...actual,
    useAuth: vi.fn(),
  };
});

// Helper component to display current location state for inspection in tests
function LocationDisplay() {
  const location = useLocation();
  return (
    <div>
      <span data-testid="location-path">{location.pathname}</span>
      <span data-testid="location-from">{location.state?.from?.pathname || ''}</span>
    </div>
  );
}

describe('ProtectedRoute Component Suite', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  // TASK C - CASE 1: Unauthenticated Visit -> Redirected to Login with Return Destination Preserved
  it('1a. redirects unauthenticated user visiting /seller/dashboard to /login preserving destination state', () => {
    vi.mocked(AuthContextModule.useAuth).mockReturnValue({
      isLoggedIn: false,
      currentUser: null,
      isLoading: false,
      isResolving: false,
    });

    render(
      <MemoryRouter initialEntries={['/seller/dashboard']}>
        <Routes>
          <Route 
            path="/seller/dashboard" 
            element={
              <ProtectedRoute allowedRoles={['vendor', 'seller', 'admin']}>
                <div>Protected Seller Content</div>
              </ProtectedRoute>
            } 
          />
          <Route path="/login" element={<LocationDisplay />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByTestId('location-path').textContent).toBe('/login');
    expect(screen.getByTestId('location-from').textContent).toBe('/seller/dashboard');
    expect(screen.queryByText('Protected Seller Content')).toBeNull();
  });

  it('1b. redirects unauthenticated user visiting /admin to /login preserving destination state', () => {
    vi.mocked(AuthContextModule.useAuth).mockReturnValue({
      isLoggedIn: false,
      currentUser: null,
      isLoading: false,
      isResolving: false,
    });

    render(
      <MemoryRouter initialEntries={['/admin']}>
        <Routes>
          <Route 
            path="/admin" 
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <div>Protected Admin Content</div>
              </ProtectedRoute>
            } 
          />
          <Route path="/login" element={<LocationDisplay />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByTestId('location-path').textContent).toBe('/login');
    expect(screen.getByTestId('location-from').textContent).toBe('/admin');
    expect(screen.queryByText('Protected Admin Content')).toBeNull();
  });

  // TASK C - CASE 2: Wrong-Role Authenticated Visit -> Explicit 403 Not Authorized Experience (Not Login Redirect)
  it('2a. renders explicit unauthorized screen for customer visiting /seller/dashboard (no login redirect)', () => {
    vi.mocked(AuthContextModule.useAuth).mockReturnValue({
      isLoggedIn: true,
      currentUser: { username: 'john_customer', role: 'customer' },
      isLoading: false,
      isResolving: false,
      logout: vi.fn(),
    });

    render(
      <MemoryRouter initialEntries={['/seller/dashboard']}>
        <Routes>
          <Route 
            path="/seller/dashboard" 
            element={
              <ProtectedRoute allowedRoles={['vendor', 'seller', 'admin']}>
                <div>Protected Seller Content</div>
              </ProtectedRoute>
            } 
          />
          <Route path="/login" element={<LocationDisplay />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText(/HTTP 403 — Access Restricted/i)).toBeDefined();
    expect(screen.getByText(/Permission Required/i)).toBeDefined();
    expect(screen.queryByText('Protected Seller Content')).toBeNull();
    expect(screen.queryByTestId('location-path')).toBeNull(); // Did NOT redirect to login
  });

  it('2b. renders explicit unauthorized screen for vendor visiting /admin (no login redirect)', () => {
    vi.mocked(AuthContextModule.useAuth).mockReturnValue({
      isLoggedIn: true,
      currentUser: { username: 'merchant_bob', role: 'vendor' },
      isLoading: false,
      isResolving: false,
      logout: vi.fn(),
    });

    render(
      <MemoryRouter initialEntries={['/admin']}>
        <Routes>
          <Route 
            path="/admin" 
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <div>Protected Admin Content</div>
              </ProtectedRoute>
            } 
          />
          <Route path="/login" element={<LocationDisplay />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText(/HTTP 403 — Access Restricted/i)).toBeDefined();
    expect(screen.getByText(/Permission Required/i)).toBeDefined();
    expect(screen.queryByText('Protected Admin Content')).toBeNull();
    expect(screen.queryByTestId('location-path')).toBeNull(); // Did NOT redirect to login
  });

  // TASK C - CASE 3: Correct-Role Visit -> Renders Normally
  it('3a. renders protected content normally for vendor visiting /seller/dashboard', () => {
    vi.mocked(AuthContextModule.useAuth).mockReturnValue({
      isLoggedIn: true,
      currentUser: { username: 'merchant_bob', role: 'vendor' },
      isLoading: false,
      isResolving: false,
    });

    render(
      <MemoryRouter initialEntries={['/seller/dashboard']}>
        <Routes>
          <Route 
            path="/seller/dashboard" 
            element={
              <ProtectedRoute allowedRoles={['vendor', 'seller', 'admin']}>
                <div>Protected Seller Content</div>
              </ProtectedRoute>
            } 
          />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Protected Seller Content')).toBeDefined();
  });

  it('3b. renders protected content normally for admin visiting /admin', () => {
    vi.mocked(AuthContextModule.useAuth).mockReturnValue({
      isLoggedIn: true,
      currentUser: { username: 'admin_alice', role: 'admin' },
      isLoading: false,
      isResolving: false,
    });

    render(
      <MemoryRouter initialEntries={['/admin']}>
        <Routes>
          <Route 
            path="/admin" 
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <div>Protected Admin Content</div>
              </ProtectedRoute>
            } 
          />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Protected Admin Content')).toBeDefined();
  });

  it('3c. renders protected seller content normally for admin visiting /seller/dashboard', () => {
    vi.mocked(AuthContextModule.useAuth).mockReturnValue({
      isLoggedIn: true,
      currentUser: { username: 'admin_alice', role: 'admin' },
      isLoading: false,
      isResolving: false,
    });

    render(
      <MemoryRouter initialEntries={['/seller/dashboard']}>
        <Routes>
          <Route 
            path="/seller/dashboard" 
            element={
              <ProtectedRoute allowedRoles={['vendor', 'seller', 'admin']}>
                <div>Protected Seller Content</div>
              </ProtectedRoute>
            } 
          />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Protected Seller Content')).toBeDefined();
  });

  // TASK C - CASE 4: Loading State / Resolving Case -> Prevents Content Flash
  it('4. displays loading state and NEVER renders protected content while auth state is resolving', () => {
    vi.mocked(AuthContextModule.useAuth).mockReturnValue({
      isLoggedIn: true, // Even if set to true, resolving state must block rendering!
      currentUser: { username: 'merchant_bob', role: 'vendor' },
      isLoading: false,
      isResolving: true, // Resolving session/tokens in flight
    });

    render(
      <MemoryRouter initialEntries={['/seller/dashboard']}>
        <Routes>
          <Route 
            path="/seller/dashboard" 
            element={
              <ProtectedRoute allowedRoles={['vendor', 'seller', 'admin']}>
                <div>Protected Secret Seller Data</div>
              </ProtectedRoute>
            } 
          />
        </Routes>
      </MemoryRouter>
    );

    // Assert loader is present
    expect(screen.getByTestId('protected-route-loader')).toBeDefined();
    expect(screen.getByText(/Verifying Authorization.../i)).toBeDefined();

    // CRITICAL: Assert protected content is NOT rendered (prevents UI flash bug)
    expect(screen.queryByText('Protected Secret Seller Data')).toBeNull();
  });
});
