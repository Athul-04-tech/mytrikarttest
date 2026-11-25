import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import SellerWarehouseView from '../SellerWarehouseView';
import { apiRequest } from '../../../../utils/api';

vi.mock('../../../../utils/api', () => ({
  apiRequest: vi.fn(),
}));

const mockAvailableWarehouses = [
  {
    id: 10,
    name: 'Mumbai Central Hub',
    code: 'mum-central-10',
    city: 'Mumbai',
    state: 'Maharashtra',
    country: 'IN',
  },
];

const mockVendorProducts = {
  count: 1,
  results: [
    {
      id: 40,
      name: 'Artisan Spice Box',
      variants: [
        {
          id: 21,
          sku: 'SPICE-STD',
          attributes: { pack: 'Standard' },
          stock_quantity: 12,
          is_active: true,
        },
        {
          id: 22,
          sku: 'SPICE-DLX',
          attributes: { pack: 'Deluxe' },
          stock_quantity: 8,
          is_active: true,
        },
      ],
    },
  ],
};

const mockRequests = [
  {
    id: 101,
    warehouse: 10,
    warehouse_name: 'Mumbai Central Hub',
    warehouse_code: 'mum-central-10',
    seller: 8,
    seller_business_name: 'Mytri Artisans',
    status: 'requested',
    expected_arrival: '2026-11-20',
    courier_name: 'BlueDart',
    tracking_reference: 'BD-101',
    seller_notes: 'Handle with care',
    seller_discrepancy_action: 'none',
    created_at: '2026-11-12T10:00:00+05:30',
    items: [
      {
        id: 301,
        variant: 21,
        sku_snapshot: 'SPICE-STD',
        product_name_snapshot: 'Artisan Spice Box',
        attributes_snapshot: { pack: 'Standard' },
        requested_quantity: 5,
        accepted_quantity: null,
        received_quantity: null,
        good_quantity: null,
        damaged_quantity: null,
      },
    ],
  },
  {
    id: 102,
    warehouse: 10,
    warehouse_name: 'Mumbai Central Hub',
    warehouse_code: 'mum-central-10',
    seller: 8,
    seller_business_name: 'Mytri Artisans',
    status: 'discrepancy',
    expected_arrival: '2026-11-19',
    courier_name: 'Delhivery',
    tracking_reference: 'DLV-102',
    seller_discrepancy_action: 'pending',
    created_at: '2026-11-12T09:00:00+05:30',
    items: [
      {
        id: 302,
        variant: 22,
        sku_snapshot: 'SPICE-DLX',
        product_name_snapshot: 'Artisan Spice Box',
        attributes_snapshot: { pack: 'Deluxe' },
        requested_quantity: 3,
        accepted_quantity: 3,
        received_quantity: 2,
        good_quantity: 1,
        damaged_quantity: 1,
        measured_length_cm: '25.00',
        measured_width_cm: '18.00',
        measured_height_cm: '12.00',
        measured_weight_kg: '0.850',
        location: 'A1-B2',
        discrepancy_reason: '1 short and 1 crushed box',
      },
    ],
  },
];

const mockMyStock = [
  {
    id: 51,
    warehouse: 10,
    warehouse_name: 'Mumbai Central Hub',
    warehouse_code: 'mum-central-10',
    seller: 8,
    seller_business_name: 'Mytri Artisans',
    storage_request: 102,
    storage_request_item: 302,
    variant: 22,
    sku_snapshot: 'SPICE-DLX',
    product_name_snapshot: 'Artisan Spice Box',
    attributes_snapshot: { pack: 'Deluxe' },
    kind: 'good',
    status: 'available',
    received_quantity: 2,
    available_quantity: 1,
    quarantined_quantity: 0,
    released_quantity: 0,
    measured_length_cm: '25.00',
    measured_width_cm: '18.00',
    measured_height_cm: '12.00',
    measured_weight_kg: '0.850',
    location: 'A1-B2',
    received_at: '2026-11-12T11:00:00+05:30',
  },
];

describe('SellerWarehouseView — Seller Storage Requests & My Warehouse Stock', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    apiRequest.mockImplementation(async (url) => {
      if (url === '/api/warehouse/storage-requests/') return mockRequests;
      if (url === '/api/warehouse/available/') return mockAvailableWarehouses;
      if (url === '/api/warehouse/my-stock/') return mockMyStock;
      if (url === '/api/products/vendor/products/') return mockVendorProducts;
      if (url === '/api/warehouse/storage-requests/101/') return mockRequests[0];
      if (url === '/api/warehouse/storage-requests/102/') return mockRequests[1];
      if (url === '/api/warehouse/my-stock/51/') return mockMyStock[0];
      return {};
    });
  });

  it('1. lists seller storage requests, blocks duplicate variants in create form, and shows server field errors', async () => {
    render(
      <MemoryRouter>
        <SellerWarehouseView vendorProfile={{ id: 8, may_sell: true }} />
      </MemoryRouter>
    );

    expect(await screen.findByTestId('seller-request-row-101')).toBeInTheDocument();
    expect(screen.getByTestId('seller-request-row-102')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('open-create-storage-request-btn'));
    expect(await screen.findByTestId('create-storage-request-modal')).toBeInTheDocument();

    // Select variant 21 for row 0
    fireEvent.change(screen.getByTestId('sr-item-variant-select-0'), {
      target: { value: '21' },
    });

    // Add a second item row and try selecting the same variant 21
    fireEvent.click(screen.getByTestId('sr-add-item-btn'));
    fireEvent.change(screen.getByTestId('sr-item-variant-select-1'), {
      target: { value: '21' },
    });
    expect(screen.getByTestId('sr-duplicate-variant-warning')).toHaveTextContent(
      'Duplicate variants are not allowed in one storage request.'
    );

    // Select distinct variant 22 for row 1
    fireEvent.change(screen.getByTestId('sr-item-variant-select-1'), {
      target: { value: '22' },
    });
    expect(screen.queryByTestId('sr-duplicate-variant-warning')).toBeNull();

    // Server returns 400 field error when reason is missing
    apiRequest.mockImplementationOnce(async () => {
      const err = new Error('Validation failed');
      err.status = 400;
      err.data = { reason: ['A reason is required.'] };
      throw err;
    });

    fireEvent.click(screen.getByTestId('sr-submit-btn'));
    expect(await screen.findByTestId('sr-error-reason')).toHaveTextContent(
      'A reason is required.'
    );
  });

  it('2. shows state-dependent actions (Cancel on requested, Acknowledge/Dispute on discrepancy) and refetches on 409 conflict', async () => {
    render(
      <MemoryRouter>
        <SellerWarehouseView vendorProfile={{ id: 8, may_sell: true }} />
      </MemoryRouter>
    );
    expect(await screen.findByTestId('seller-request-row-101')).toBeInTheDocument();

    // Inspect request #101 (status: requested) -> only Cancel action shown
    fireEvent.click(screen.getByTestId('seller-view-request-btn-101'));
    expect(await screen.findByTestId('seller-cancel-request-btn')).toBeInTheDocument();
    expect(screen.queryByTestId('seller-dispatch-request-btn')).toBeNull();
    expect(screen.queryByTestId('seller-acknowledge-discrepancy-btn')).toBeNull();

    // Simulate 409 conflict when cancelling a request that manager just accepted
    fireEvent.click(screen.getByTestId('seller-cancel-request-btn'));
    fireEvent.change(screen.getByTestId('seller-action-reason-input'), {
      target: { value: 'Changed shipment plan' },
    });

    apiRequest.mockImplementationOnce(async () => {
      const err = new Error('Conflict');
      err.status = 409;
      err.data = {
        detail: "Cannot transition storage request from 'accepted' to 'cancelled'.",
      };
      throw err;
    });

    fireEvent.click(screen.getByTestId('seller-action-submit-btn'));

    expect(
      await screen.findByTestId('seller-action-form-error')
    ).toHaveTextContent(
      "Cannot transition storage request from 'accepted' to 'cancelled'."
    );

    // Inspect discrepancy request #102
    fireEvent.click(screen.getByTestId('seller-view-request-btn-102'));

    expect(
      await screen.findByTestId('seller-acknowledge-discrepancy-btn')
    ).toBeInTheDocument();
    expect(screen.getByTestId('seller-dispute-discrepancy-btn')).toBeInTheDocument();
  });

  it('3. disables New Storage Request button when vendor may_sell is false and renders My Warehouse Stock read-only', async () => {
    render(
      <MemoryRouter>
        <SellerWarehouseView
          vendorProfile={{
            id: 8,
            may_sell: false,
            control_reason: 'Account suspended pending review.',
          }}
        />
      </MemoryRouter>
    );

    expect(
      await screen.findByTestId('seller-warehouse-restriction-alert')
    ).toHaveTextContent('Account suspended pending review.');
    expect(screen.getByTestId('open-create-storage-request-btn')).toBeDisabled();

    // Switch to My Warehouse Stock tab
    fireEvent.click(screen.getByTestId('seller-wh-tab-stock'));
    expect(await screen.findByTestId('seller-stock-row-51')).toHaveTextContent(
      'SPICE-DLX'
    );
  });
});
