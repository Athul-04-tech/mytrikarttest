import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import SellerProductDetailPage from '../SellerProductDetailPage';
import * as apiModule from '../../utils/api';

// Mock api utility
vi.mock('../../utils/api', () => ({
  apiRequest: vi.fn(),
  ApiError: class ApiError extends Error {
    constructor(message, status, data) {
      super(message);
      this.status = status;
      this.data = data;
    }
  }
}));

// Mock ToastContext
vi.mock('../../context/ToastContext', () => ({
  useToast: () => ({
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn()
  })
}));

describe('SellerProductDetailPage — Single Product Specification View', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  const renderComponent = (productId = '10') => {
    return render(
      <MemoryRouter initialEntries={[`/seller/products/${productId}`]}>
        <Routes>
          <Route path="/seller/products/:id" element={<SellerProductDetailPage />} />
        </Routes>
      </MemoryRouter>
    );
  };

  it('1. renders honest loading state when fetching product details', () => {
    vi.mocked(apiModule.apiRequest).mockImplementation(() => new Promise(() => {}));

    renderComponent('10');

    expect(screen.getByText('Loading product details...')).toBeTruthy();
  });

  it('2. renders honest error alert when backend fetch fails (e.g. 404 Not Found)', async () => {
    vi.mocked(apiModule.apiRequest).mockImplementation(() => 
      Promise.reject(new apiModule.ApiError('Product not found.', 404, { detail: 'Not found.' }))
    );

    renderComponent('999');

    await waitFor(() => {
      expect(screen.getByText('Unable to Load Product Specification')).toBeTruthy();
      expect(screen.getByText('Not found.')).toBeTruthy();
    });
  });

  it('3. renders full product specification, featured primary image, variant table, and category attributes', async () => {
    const mockProduct = {
      id: 10,
      name: 'Organic Silk Handloom Saree',
      slug: 'organic-silk-handloom-saree',
      description: 'Handwoven pure mulberry silk saree with zari border.',
      category: 4,
      category_name: 'Ethic Apparel',
      status: 'published',
      hsn_code: '500720',
      base_currency: 'INR',
      meta_title: 'Organic Silk Saree - MytriKart',
      meta_description: 'Buy handloom mulberry silk saree.',
      images: [
        { id: 501, image: '/media/products/saree_side.jpg', is_primary: false, display_order: 1 },
        { id: 502, image: '/media/products/saree_main.jpg', is_primary: true, display_order: 0 }
      ],
      attribute_values: [
        { id: 1, category_attribute: 2, attribute_name: 'Material', value_name: '100% Silk' },
        { id: 2, category_attribute: 3, attribute_name: 'Craft', value_name: 'Zari Weave' }
      ],
      variants: [
        { id: 21, sku_code: 'SILK-SAR-RED', price: '4999.00', currency: 'INR', stock_quantity: 15, is_active: true, attributes: { Color: 'Red' } },
        { id: 22, sku_code: 'SILK-SAR-BLU', price: '4999.00', currency: 'INR', stock_quantity: 2, is_active: true, attributes: { Color: 'Blue' } }
      ]
    };

    vi.mocked(apiModule.apiRequest).mockImplementation((endpoint) => {
      if (endpoint.includes('/api/products/vendor/products/10/')) {
        return Promise.resolve(mockProduct);
      }
      return Promise.reject(new Error('Unknown endpoint'));
    });

    renderComponent('10');

    await waitFor(() => {
      expect(screen.getByText('Organic Silk Handloom Saree')).toBeTruthy();
      expect(screen.getByText('Published')).toBeTruthy();
      expect(screen.getByText('Category: Ethic Apparel')).toBeTruthy();
      expect(screen.getByText('100% Silk')).toBeTruthy();
      expect(screen.getByText('Zari Weave')).toBeTruthy();
      expect(screen.getByText('SILK-SAR-RED')).toBeTruthy();
      expect(screen.getByText('SILK-SAR-BLU')).toBeTruthy();
      expect(screen.getByText('Primary Thumbnail')).toBeTruthy();
    });
  });
});
