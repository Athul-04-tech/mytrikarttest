import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ProductReviewModule from '../ProductReviewModule';
import * as apiModule from '../../../../utils/api';
import { ToastProvider } from '../../../../context/ToastContext';

vi.mock('../../../../utils/api', async () => {
  const actual = await vi.importActual('../../../../utils/api');
  return {
    ...actual,
    apiRequest: vi.fn(),
  };
});

describe('ProductReviewModule Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderComponent = () => {
    return render(
      <ToastProvider>
        <ProductReviewModule />
      </ToastProvider>
    );
  };

  const mockPendingProducts = [
    {
      id: 101,
      name: 'Wireless Ergonomic Keyboard',
      slug: 'wireless-keyboard',
      description: 'High precision ergonomic mechanical keyboard.',
      status: 'pending_review',
      category_name: 'Electronics',
      official_brand_name: 'Logitech',
      vendor_business_name: 'Apex Electronics Direct',
      base_currency: 'INR',
      hsn_code: '84716060',
      variants: [
        { id: 1, sku_code: 'KB-BLK-101', price: '4999.00', stock_quantity: 25, attributes: { Color: 'Black' } }
      ],
      attribute_values: [
        { id: 10, attribute_name: 'Connectivity', selected_value: 'Bluetooth 5.2' }
      ],
      images: [
        { id: 5, image: 'http://127.0.0.1:8000/media/keyboard.jpg', is_primary: true }
      ]
    }
  ];

  it('1. Renders empty queue state when API returns empty array', async () => {
    apiModule.apiRequest.mockImplementation(async (url) => {
      if (url === '/api/products/admin/products/') return [];
      return {};
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Product Review Queue is Clear')).toBeTruthy();
    });
    expect(apiModule.apiRequest).toHaveBeenCalledWith('/api/products/admin/products/');
  });

  it('2. Renders pending product items from real API endpoint', async () => {
    apiModule.apiRequest.mockImplementation(async (url) => {
      if (url === '/api/products/admin/products/') return mockPendingProducts;
      return {};
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Wireless Ergonomic Keyboard')).toBeTruthy();
    });
    expect(screen.getByText('Apex Electronics Direct')).toBeTruthy();
    expect(screen.getByText('Electronics')).toBeTruthy();
    expect(screen.getByText('Brand: Logitech')).toBeTruthy();
  });

  it('3. Approves product when Approve button is clicked and removes it from queue', async () => {
    let currentList = [...mockPendingProducts];
    apiModule.apiRequest.mockImplementation(async (url, options) => {
      if (url === '/api/products/admin/products/') return currentList;
      if (url.includes('/review/')) {
        currentList = [];
        return { id: 101, status: 'published' };
      }
      return {};
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Wireless Ergonomic Keyboard')).toBeTruthy();
    });

    const approveBtn = screen.getByText('Approve Product');
    fireEvent.click(approveBtn);

    await waitFor(() => {
      expect(apiModule.apiRequest).toHaveBeenCalledWith(
        '/api/products/admin/products/101/review/',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ action: 'approve' })
        })
      );
    });

    // Product should be removed from view
    await waitFor(() => {
      expect(screen.queryByText('Wireless Ergonomic Keyboard')).toBeNull();
      expect(screen.getByText('Product Review Queue is Clear')).toBeTruthy();
    });
  });

  it('4. Rejects product with mandatory reason and removes it from queue upon API response', async () => {
    let currentList = [...mockPendingProducts];
    apiModule.apiRequest.mockImplementation(async (url, options) => {
      if (url === '/api/products/admin/products/') return currentList;
      if (url.includes('/review/')) {
        currentList = [];
        return { id: 101, status: 'rejected', rejection_reason: 'Invalid HSN code' };
      }
      return {};
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Wireless Ergonomic Keyboard')).toBeTruthy();
    });

    // Open reject modal
    const rejectBtn = screen.getByText('Reject');
    fireEvent.click(rejectBtn);

    expect(screen.getByText('Reject Product Listing')).toBeTruthy();

    // Try submitting without reason (should show validation error)
    const confirmRejectBtn = screen.getByText('Confirm Rejection');
    fireEvent.click(confirmRejectBtn);

    expect(screen.getByText('A valid rejection reason is required by the backend.')).toBeTruthy();

    // Type valid reason and submit
    const textarea = screen.getByPlaceholderText(/Missing required brand authorization document/i);
    fireEvent.change(textarea, { target: { value: 'Invalid HSN code provided for keyboard category.' } });

    fireEvent.click(confirmRejectBtn);

    await waitFor(() => {
      expect(apiModule.apiRequest).toHaveBeenCalledWith(
        '/api/products/admin/products/101/review/',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            action: 'reject',
            reason: 'Invalid HSN code provided for keyboard category.'
          })
        })
      );
    });

    // Modal closes and item removed
    await waitFor(() => {
      expect(screen.queryByText('Wireless Ergonomic Keyboard')).toBeNull();
      expect(screen.getByText('Product Review Queue is Clear')).toBeTruthy();
    });
  });
});
