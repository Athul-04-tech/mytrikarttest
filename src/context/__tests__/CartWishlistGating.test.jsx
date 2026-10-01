import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from '../AuthContext';
import { CartWishlistProvider, useCart } from '../CartWishlistContext';
import { ToastProvider, useToast } from '../ToastContext';
import * as api from '../../utils/api';

// Test harness component to exercise cart & wishlist actions
function CartGatingHarness() {
  const { cart, wishlist, addToCart, moveToCartFromWishlist, addToWishlist } = useCart();
  const { isLoggedIn, setCurrentUser } = useAuth();
  const location = useLocation();

  const sampleProduct = {
    id: 'test-item-1',
    variantId: 101,
    name: 'Sample High-End Headphones',
    price: 4999,
    originalPrice: 7999,
    category: 'Electronics',
    image: '/test.png'
  };

  return (
    <div>
      <div data-testid="auth-status">{isLoggedIn ? 'LOGGED_IN' : 'GUEST'}</div>
      <div data-testid="location-path">{location.pathname}</div>
      <div data-testid="cart-count">{cart.length}</div>
      <div data-testid="wishlist-count">{wishlist.length}</div>

      <button onClick={() => addToCart(sampleProduct, 1)}>
        Add Test Product To Cart
      </button>

      <button onClick={() => moveToCartFromWishlist(wishlist[0] || sampleProduct)}>
        Move Wishlist Item To Cart
      </button>

      <button onClick={() => addToWishlist({ ...sampleProduct, id: 'new-fav-100' })}>
        Add Test Product To Wishlist
      </button>
    </div>
  );
}

function LocationDisplay() {
  const location = useLocation();
  return (
    <div>
      <div data-testid="login-location-path">{location.pathname}</div>
      <div data-testid="login-location-state-from">{location.state?.from || 'NO_FROM_STATE'}</div>
    </div>
  );
}

describe('Cart & Wishlist Guest Login Gating & Return Location Behavior', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it('1. blocks guest add-to-cart, displays login toast warning, and redirects to /login preserving current path state', async () => {
    vi.spyOn(api, 'getTokens').mockReturnValue({ access: null, refresh: null });

    render(
      <MemoryRouter initialEntries={['/category/electronics']}>
        <ToastProvider>
          <AuthProvider>
            <CartWishlistProvider>
              <Routes>
                <Route path="/category/electronics" element={<CartGatingHarness />} />
                <Route path="/login" element={<LocationDisplay />} />
              </Routes>
            </CartWishlistProvider>
          </AuthProvider>
        </ToastProvider>
      </MemoryRouter>
    );

    expect(screen.getByTestId('auth-status').textContent).toBe('GUEST');
    const initialCartCount = parseInt(screen.getByTestId('cart-count').textContent, 10);

    // Attempt to add to cart as guest
    const addBtn = screen.getByText('Add Test Product To Cart');
    fireEvent.click(addBtn);

    // Verify redirection to /login with state.from preserved
    await waitFor(() => {
      expect(screen.getByTestId('login-location-path').textContent).toBe('/login');
    });
    expect(screen.getByTestId('login-location-state-from').textContent).toBe('/category/electronics');
  });

  it('2. blocks guest wishlist-to-cart move, preserves wishlist state, and redirects to /login', async () => {
    vi.spyOn(api, 'getTokens').mockReturnValue({ access: null, refresh: null });

    render(
      <MemoryRouter initialEntries={['/wishlist']}>
        <ToastProvider>
          <AuthProvider>
            <CartWishlistProvider>
              <Routes>
                <Route path="/wishlist" element={<CartGatingHarness />} />
                <Route path="/login" element={<LocationDisplay />} />
              </Routes>
            </CartWishlistProvider>
          </AuthProvider>
        </ToastProvider>
      </MemoryRouter>
    );

    expect(screen.getByTestId('auth-status').textContent).toBe('GUEST');
    const initialWishlistCount = parseInt(screen.getByTestId('wishlist-count').textContent, 10);

    // Attempt to move wishlist item to cart as guest
    const moveBtn = screen.getByText('Move Wishlist Item To Cart');
    fireEvent.click(moveBtn);

    // Verify redirection to /login with state.from = /wishlist
    await waitFor(() => {
      expect(screen.getByTestId('login-location-path').textContent).toBe('/login');
    });
    expect(screen.getByTestId('login-location-state-from').textContent).toBe('/wishlist');
  });

  it('3. blocks guest add-to-wishlist, displays login toast warning, and redirects to /login preserving state', async () => {
    vi.spyOn(api, 'getTokens').mockReturnValue({ access: null, refresh: null });

    render(
      <MemoryRouter initialEntries={['/']}>
        <ToastProvider>
          <AuthProvider>
            <CartWishlistProvider>
              <Routes>
                <Route path="/" element={<CartGatingHarness />} />
                <Route path="/login" element={<LocationDisplay />} />
              </Routes>
            </CartWishlistProvider>
          </AuthProvider>
        </ToastProvider>
      </MemoryRouter>
    );

    expect(screen.getByTestId('auth-status').textContent).toBe('GUEST');

    // Attempt to add to wishlist as guest
    const wishBtn = screen.getByText('Add Test Product To Wishlist');
    fireEvent.click(wishBtn);

    // Verify redirection to /login with state.from = /
    await waitFor(() => {
      expect(screen.getByTestId('login-location-path').textContent).toBe('/login');
    });
    expect(screen.getByTestId('login-location-state-from').textContent).toBe('/');
  });

  it('4. allows authenticated logged-in users to add items to cart seamlessly without redirection', async () => {
    let items = [
      {
        id: 1,
        product_variant: 100,
        quantity: 1,
        added_at: '2026-09-15T10:00:00Z',
        product_details: {
          product_id: 1,
          product_name: 'Sample High-End Headphones',
          primary_image_url: '/test.png',
          unit_price: '4999.00',
          currency: 'INR',
          vendor_display_name: 'Test Merchant',
          stock_quantity: 10,
          is_active: true,
          attributes: {},
          sku_code: 'SKU-TEST'
        }
      }
    ];

    vi.spyOn(api, 'getTokens').mockReturnValue({ access: 'valid-access-token', refresh: 'valid-refresh' });
    vi.spyOn(api, 'apiRequest').mockImplementation(async (url, options) => {
      if (url.includes('/api/accounts/me/')) {
        return {
          id: 42,
          username: 'testuser',
          first_name: 'Test',
          last_name: 'Customer',
          email: 'test@mytrikart.com',
          role: 'customer'
        };
      }
      if (url.includes('/api/orders/cart/')) {
        if (options?.method === 'POST') {
          items = [
            ...items,
            {
              id: 2,
              product_variant: 101,
              quantity: 1,
              added_at: '2026-09-15T10:01:00Z',
              product_details: {
                product_id: 2,
                product_name: 'Another Item',
                primary_image_url: '/test2.png',
                unit_price: '1999.00',
                currency: 'INR',
                vendor_display_name: 'Test Merchant',
                stock_quantity: 5,
                is_active: true,
                attributes: {},
                sku_code: 'SKU-TEST2'
              }
            }
          ];
          return { id: 2, message: 'Added' };
        }
        return items;
      }
      return {};
    });

    render(
      <MemoryRouter initialEntries={['/category/electronics']}>
        <ToastProvider>
          <AuthProvider>
            <CartWishlistProvider>
              <Routes>
                <Route path="/category/electronics" element={<CartGatingHarness />} />
                <Route path="/login" element={<LocationDisplay />} />
              </Routes>
            </CartWishlistProvider>
          </AuthProvider>
        </ToastProvider>
      </MemoryRouter>
    );

    // Wait for session rehydration & initial cart fetch
    await waitFor(() => {
      expect(screen.getByTestId('auth-status').textContent).toBe('LOGGED_IN');
      expect(screen.getByTestId('cart-count').textContent).toBe('1');
    });

    const initialCartCount = parseInt(screen.getByTestId('cart-count').textContent, 10);

    // Add to cart as authenticated user
    const addBtn = screen.getByText('Add Test Product To Cart');
    fireEvent.click(addBtn);

    // Should increment cart count and remain on /category/electronics
    await waitFor(() => {
      expect(screen.getByTestId('cart-count').textContent).toBe(String(initialCartCount + 1));
    });
    expect(screen.getByTestId('location-path').textContent).toBe('/category/electronics');
  });
});
