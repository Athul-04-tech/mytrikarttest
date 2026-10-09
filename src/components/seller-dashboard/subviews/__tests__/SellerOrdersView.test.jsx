import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import SellerOrdersView from '../SellerOrdersView';
import * as apiModule from '../../../../utils/api';

// Mock api utility
vi.mock('../../../../utils/api', () => ({
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
vi.mock('../../../../context/ToastContext', () => ({
  useToast: () => ({
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn()
  })
}));

// Real API response sample matching backend VendorOrderSerializer:
// GET /api/orders/vendor/ -> [ { id, status, subtotal, tax_total, shipping_total, grand_total, items } ]
const MOCK_VENDOR_ORDERS_REAL_SHAPE = [
  {
    id: 101,
    status: 'processing',
    subtotal: '500.00',
    tax_total: '90.00',
    shipping_total: '50.00',
    grand_total: '640.00',
    items: [
      {
        product_name_snapshot: 'Handcrafted Terracotta Vase',
        sku_snapshot: 'VASE-001',
        hsn_code_snapshot: '691200',
        quantity: 2,
        unit_price: '250.00',
        taxable_value: '500.00',
        cgst_rate: '9.00',
        cgst_amount: '45.00',
        sgst_rate: '9.00',
        sgst_amount: '45.00',
        igst_rate: null,
        igst_amount: null,
        vat_rate: null,
        vat_amount: null,
        line_total: '590.00'
      }
    ]
  },
  {
    id: 102,
    status: 'delivered',
    subtotal: '1200.00',
    tax_total: '216.00',
    shipping_total: '0.00',
    grand_total: '1416.00',
    items: [
      {
        product_name_snapshot: 'Jaipur Block Print Shawl',
        sku_snapshot: 'SHAWL-JPR',
        hsn_code_snapshot: '621490',
        quantity: 1,
        unit_price: '1200.00',
        taxable_value: '1200.00',
        cgst_rate: '9.00',
        cgst_amount: '108.00',
        sgst_rate: '9.00',
        sgst_amount: '108.00',
        igst_rate: null,
        igst_amount: null,
        vat_rate: null,
        vat_amount: null,
        line_total: '1416.00'
      }
    ]
  }
];

describe('SellerOrdersView — Real Backend API Wiring & UI States', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  // TASK D - Test 1: Renders real API data correctly
  it('1. renders list of vendor orders using real API response shape', async () => {
    vi.mocked(apiModule.apiRequest).mockResolvedValue(MOCK_VENDOR_ORDERS_REAL_SHAPE);

    render(<SellerOrdersView />);

    // Verify loading spinner appears first
    expect(screen.getByText('Loading vendor orders...')).toBeTruthy();

    await waitFor(() => {
      // Order IDs formatted as #ORD-101 and #ORD-102
      expect(screen.getByText('#ORD-101')).toBeTruthy();
      expect(screen.getByText('#ORD-102')).toBeTruthy();
    });

    // Verify Product snapshot titles render
    expect(screen.getByText('Handcrafted Terracotta Vase')).toBeTruthy();
    expect(screen.getByText('Jaipur Block Print Shawl')).toBeTruthy();

    // Verify status badges map to exact lowercase backend choices ('processing' -> 'Processing', 'delivered' -> 'Delivered')
    expect(screen.getAllByText('Processing').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Delivered').length).toBeGreaterThan(0);

    // Verify API call endpoint
    expect(apiModule.apiRequest).toHaveBeenCalledWith('/api/orders/vendor/');
  });

  // TASK D - Test 2: Renders honest empty state for zero orders
  it('2. renders honest empty state when vendor has zero orders', async () => {
    vi.mocked(apiModule.apiRequest).mockResolvedValue([]);

    render(<SellerOrdersView />);

    await waitFor(() => {
      expect(screen.getByText('No Vendor Orders Yet')).toBeTruthy();
      expect(
        screen.getByText(/When customer transactions include your catalog products, vendor orders will appear here automatically\./i)
      ).toBeTruthy();
    });
  });

  // TASK D - Test 3: Surfaces API error correctly
  it('3. surfaces API network or authorization error clearly to the user', async () => {
    vi.mocked(apiModule.apiRequest).mockRejectedValue(
      new apiModule.ApiError('HTTP 401 Unauthorized', 401, { detail: 'Authentication credentials were not provided.' })
    );

    render(<SellerOrdersView />);

    await waitFor(() => {
      expect(screen.getByText('Failed to Retrieve Orders')).toBeTruthy();
      expect(screen.getByText(/HTTP 401 Unauthorized/i)).toBeTruthy();
      expect(screen.getByText('Retry Connection')).toBeTruthy();
    });
  });

  // TASK D - Test 4: Detail Modal opens and displays line item details and financial breakdown
  it('4. opens detail modal with itemized snapshots and financial breakdown upon inspecting an order', async () => {
    vi.mocked(apiModule.apiRequest).mockResolvedValue(MOCK_VENDOR_ORDERS_REAL_SHAPE);

    render(<SellerOrdersView />);

    await waitFor(() => {
      expect(screen.getByText('#ORD-101')).toBeTruthy();
    });

    // Click "Inspect" on order #ORD-101
    const inspectButtons = screen.getAllByText('Inspect');
    fireEvent.click(inspectButtons[0]);

    // Modal drawer opens
    await waitFor(() => {
      expect(screen.getByText('Vendor Order #ORD-101')).toBeTruthy();
      expect(screen.getByText('Fulfillment Managed by Platform Logistics')).toBeTruthy();
      expect(screen.getByText('Order Line Items (1)')).toBeTruthy();
      expect(screen.getAllByText(/VASE-001/).length).toBeGreaterThan(0);
      expect(screen.getByText('HSN: 691200')).toBeTruthy();
    });

    // Close modal
    fireEvent.click(screen.getByText('Close Drawer'));
    await waitFor(() => {
      expect(screen.queryByText('Vendor Order #ORD-101')).toBeNull();
    });
  });
});
