import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import SellerAddProductPage from '../SellerAddProductPage';
import { SellerProductsProvider } from '../../context/SellerProductsContext';
import * as apiModule from '../../utils/api';

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

const mockToast = {
  success: vi.fn(),
  error: vi.fn(),
  info: vi.fn()
};

vi.mock('../../context/ToastContext', () => ({
  useToast: () => mockToast
}));

describe('SellerAddProductPage — Official Brand Authorization & Governance Flow', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  const renderComponent = () => {
    return render(
      <MemoryRouter initialEntries={['/seller/products/new']}>
        <SellerProductsProvider>
          <Routes>
            <Route path="/seller/products/new" element={<SellerAddProductPage />} />
          </Routes>
        </SellerProductsProvider>
      </MemoryRouter>
    );
  };

  it('1. fixes hardcoded default: free-text brand starts blank, NOT "Apex Electronics Direct"', async () => {
    vi.mocked(apiModule.apiRequest).mockImplementation((endpoint) => {
      if (endpoint.includes('/api/products/brands/')) return Promise.resolve([]);
      if (endpoint.includes('/api/products/vendor/')) return Promise.resolve([]);
      return Promise.resolve([]);
    });

    renderComponent();

    await waitFor(() => {
      const brandInput = screen.getByPlaceholderText('Enter brand name (e.g. Generic, Custom Brand)');
      expect(brandInput.value).toBe('');
      expect(brandInput.value).not.toBe('Apex Electronics Direct');
    });
  });

  it('2. fetches official brands from GET /api/products/brands/ and conditionally shows authorization upload box when selected', async () => {
    const mockBrands = [
      { id: 10, name: 'Nike' },
      { id: 20, name: 'Samsung' }
    ];

    vi.mocked(apiModule.apiRequest).mockImplementation((endpoint) => {
      if (endpoint.includes('/api/products/brands/')) return Promise.resolve(mockBrands);
      return Promise.resolve([]);
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Nike')).toBeTruthy();
      expect(screen.getByText('Samsung')).toBeTruthy();
    });

    // Upload box should be collapsed initially (no official brand selected)
    expect(screen.queryByText('Official Brand Authorization Document')).toBeNull();

    // Select Nike
    const brandSelect = screen.getByLabelText(/Official Brand Selection/i);
    fireEvent.change(brandSelect, { target: { value: '10' } });

    await waitFor(() => {
      expect(screen.getByText('Official Brand Authorization Document')).toBeTruthy();
      expect(screen.getByText(/An official authorization document/i)).toBeTruthy();
      expect(screen.getByText('Upload Authorization Document')).toBeTruthy();
    });
  });

  it('3. allows requesting a brand not on the list via governance modal submitting to POST /api/products/vendor/brand-requests/', async () => {
    vi.mocked(apiModule.apiRequest).mockImplementation((endpoint, options) => {
      if (endpoint.includes('/api/products/brands/')) return Promise.resolve([]);
      if (endpoint.includes('/api/products/vendor/brand-requests/') && options?.method === 'POST') {
        return Promise.resolve({ id: 99, requested_name: 'Acme Brand', status: 'pending' });
      }
      return Promise.resolve([]);
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Request Brand/i })).toBeTruthy();
    });

    // Click "Request Brand" button in Section 2
    const requestBrandBtn = screen.getByRole('button', { name: /Request Brand/i });
    fireEvent.click(requestBrandBtn);

    await waitFor(() => {
      expect(screen.getByText('Request New Official Brand')).toBeTruthy();
    });

    // Fill request form
    const nameInput = screen.getByLabelText(/Requested Official Brand Name/i);
    fireEvent.change(nameInput, { target: { value: 'Acme Brand' } });

    const submitBtn = screen.getByText('Submit to Admin Desk');
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(apiModule.apiRequest).toHaveBeenCalledWith(
        '/api/products/vendor/brand-requests/',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            requested_name: 'Acme Brand',
            reason: 'Vendor catalog requirement for official distribution.'
          })
        })
      );
    });
  });

  it('4. surfaces brand_authorization field errors specifically on submit failure', async () => {
    vi.mocked(apiModule.apiRequest).mockImplementation((endpoint, options) => {
      if (endpoint.includes('/api/products/brands/')) return Promise.resolve([{ id: 10, name: 'Nike' }]);
      if (endpoint.includes('/api/products/categories/')) return Promise.resolve([{ id: 99, name: 'General', attributes: [] }]);
      if (endpoint.includes('/attributes/')) return Promise.resolve([]);
      if (endpoint.includes('/submit/') && options?.method === 'POST') {
        return Promise.reject(
          new apiModule.ApiError('Bad Request', 400, {
            brand_authorization: ['An authorization document is required for an official brand.']
          })
        );
      }
      if (endpoint.includes('/api/products/vendor/products/') && options?.method === 'POST') {
        return Promise.resolve({ id: 50, name: 'Test Product' });
      }
      return Promise.resolve([]);
    });

    const { container } = renderComponent();

    await waitFor(() => {
      expect(screen.getByLabelText(/Official Brand Selection/i)).toBeTruthy();
    });

    // Select Nike official brand
    const brandSelect = screen.getByLabelText(/Official Brand Selection/i);
    fireEvent.change(brandSelect, { target: { value: '10' } });

    // Upload a doc so client-side brand auth validation passes
    const file = new File(['dummy doc content'], 'auth.pdf', { type: 'application/pdf' });
    const fileInput = container.querySelector('input[type="file"]');
    if (fileInput) {
      fireEvent.change(fileInput, { target: { files: [file] } });
    }

    // Click submit listing button
    const submitListingBtn = screen.getByText('Publish Listing to Catalog');
    fireEvent.click(submitListingBtn);

    await waitFor(() => {
      expect(mockToast.error).toHaveBeenCalledWith(
        "Submission Validation Error",
        "Brand Authorization Error: An authorization document is required for an official brand."
      );
      expect(screen.getByText(/Brand Authorization Error: An authorization document is required/i)).toBeTruthy();
    });
  });
});
