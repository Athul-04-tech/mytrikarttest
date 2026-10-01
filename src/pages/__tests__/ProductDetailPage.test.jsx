import React from 'react';
import '@testing-library/jest-dom';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import ProductDetailPage from '../ProductDetailPage';
import { CartWishlistProvider } from '../../context/CartWishlistContext';
import { ToastProvider } from '../../context/ToastContext';
import { AuthProvider } from '../../context/AuthContext';
import * as apiModule from '../../utils/api';

vi.mock('../../utils/api', async () => {
  const actual = await vi.importActual('../../utils/api');
  return {
    ...actual,
    apiRequest: vi.fn(),
  };
});

const mockProductDetail = {
  id: 12,
  name: 'HP Victus Gaming Laptop',
  slug: 'hp-victus',
  description: 'High-performance gaming laptop with aerospace-grade cooling.',
  category: 5,
  category_name: 'Laptops',
  base_currency: 'INR',
  average_rating: 4.8,
  review_count: 15,
  images: [
    { id: 1, image: '/hp1.png', is_primary: true },
    { id: 2, image: '/hp2.png', is_primary: false }
  ],
  variants: [
    {
      id: 101,
      attributes: { RAM: '16GB', Storage: '512GB' },
      sku_code: 'SKU-HP-16GB',
      price: '84999.00',
      mrp: '99999.00',
      discount_percentage: '15.00',
      stock_quantity: 10,
      is_active: true
    },
    {
      id: 102,
      attributes: { RAM: '32GB', Storage: '1TB' },
      sku_code: 'SKU-HP-32GB',
      price: '104999.00',
      mrp: '119999.00',
      discount_percentage: '12.50',
      stock_quantity: 3,
      is_active: true
    }
  ],
  attribute_values: [
    { id: 1, attribute_name: 'Brand', raw_value: 'HP' },
    { id: 2, attribute_name: 'Processor', raw_value: 'Intel Core i7' }
  ]
};

describe('Customer ProductDetailPage Wiring & UI States', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(apiModule.apiRequest).mockImplementation(async (endpoint) => {
      if (endpoint === '/api/products/published/12/') {
        return mockProductDetail;
      }
      if (endpoint === '/api/products/published/9999/') {
        throw new apiModule.ApiError('No Product matches the given query.', 404, { detail: 'Not found' });
      }
      if (endpoint === '/api/customers/wishlist/') return [];
      if (endpoint === '/api/customers/cart/count/' || endpoint === '/api/customers/wishlist/count/') return { count: 0 };
      if (endpoint === '/api/accounts/me/') return { id: 1, role: 'customer', email: 'test@example.com' };
      return [];
    });
  });

  const renderComponent = (productId = '12') => {
    return render(
      <MemoryRouter initialEntries={[`/product/${productId}`]}>
        <ToastProvider>
          <AuthProvider>
            <CartWishlistProvider>
              <Routes>
                <Route path="/product/:id" element={<ProductDetailPage />} />
                <Route path="/products" element={<div>Products Listing Page</div>} />
              </Routes>
            </CartWishlistProvider>
          </AuthProvider>
        </ToastProvider>
      </MemoryRouter>
    );
  };

  it('1. fetches and renders real product details from /api/products/published/:id/', async () => {
    renderComponent('12');

    await waitFor(() => {
      expect(screen.getAllByText('HP Victus Gaming Laptop')[0]).toBeInTheDocument();
    });

    expect(screen.getByText('₹84,999')).toBeInTheDocument();
    expect(screen.getByText('High-performance gaming laptop with aerospace-grade cooling.')).toBeInTheDocument();
    expect(screen.getByText('Brand:')).toBeInTheDocument();
    expect(screen.getByText('Intel Core i7')).toBeInTheDocument();
  });

  it('2. updates variant selection and price when clicking variant chips', async () => {
    renderComponent('12');

    await waitFor(() => {
      expect(screen.getAllByText('HP Victus Gaming Laptop')[0]).toBeInTheDocument();
    });

    // Select second variant (32GB / 1TB)
    const variantChip = screen.getByText(/RAM: 32GB/i);
    fireEvent.click(variantChip);

    await waitFor(() => {
      expect(screen.getByText('₹1,04,999')).toBeInTheDocument();
    });
  });

  it('3. renders honest 404 state when product is not found or unpublished', async () => {
    renderComponent('9999');

    await waitFor(() => {
      expect(screen.getByText('Product Not Found')).toBeInTheDocument();
    });

    expect(screen.getByText(/No Product matches the given query/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Browse All Marketplace Products/i })).toBeInTheDocument();
  });
});
