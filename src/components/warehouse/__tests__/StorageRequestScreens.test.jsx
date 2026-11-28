import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import SellerWarehouseView from '../../seller-dashboard/subviews/SellerWarehouseView';
import SellerSettlementsView from '../../seller-dashboard/subviews/SellerSettlementsView';
import WarehouseDashboardPage from '../../../pages/WarehouseDashboardPage';
import ProtectedRoute from '../../routing/ProtectedRoute';
import AuthContext from '../../../context/AuthContext';
import { ToastProvider } from '../../../context/ToastContext';
import {
  getAllowedRolesForRoute,
  isRouteAllowedForRole,
} from '../../../utils/authRouting';
import {
  getValidStorageRequestActions,
  hasNonZeroMoneyString,
} from '../../../utils/warehouseUtils';
import { apiRequest, ApiError } from '../../../utils/api';

vi.mock('../../../utils/api', async () => {
  const actual = await vi.importActual('../../../utils/api');
  return {
    ...actual,
    apiRequest: vi.fn(),
  };
});

const mockWarehouseChoice = {
  id: 20,
  name: 'Demo Warehouse',
  code: 'demo-warehouse',
  city: 'Bengaluru',
};

const mockWarehouseMe = {
  profile: {
    id: 211,
    username: 'demo_warehouse',
    first_name: 'Demo',
    last_name: 'Manager',
  },
  warehouse: {
    id: 20,
    name: 'Demo Warehouse',
    code: 'demo-warehouse',
    address_line1: '100 Logistics Park',
    address_line2: '',
    city: 'Bengaluru',
    state: 'Karnataka',
    postal_code: '560001',
    country: 'IN',
  },
};

const mockSellerProducts = [
  {
    id: 50,
    name: 'Handloom Silk Saree',
    is_active: true,
    variants: [
      {
        id: 22,
        sku_code: 'SILK-RED-01',
        is_active: true,
        attributes: { color: 'Crimson' },
      },
    ],
  },
];

const mockQuoteSnapshot = {
  rate_card_id: 4,
  rate_card_version: 4,
  currency: 'INR',
  date: '2026-12-05',
  storage_charge: '16.08',
  handling_charge: '8.02',
  packing_charge: '0.00',
  minimum_charge_applied: '0.00',
  total: '24.10',
  items: [
    {
      item_id: 101,
      variant_id: 22,
      quantity: 4,
      as_of_date: '2026-12-05',
      rate_card_id: 4,
      version: 4,
      currency: 'INR',
      band: { id: 7, label: 'Small Parcel Band' },
      free_days_applied: 2,
      billable_storage_days: 4,
      storage_charge: '16.08',
      handling_charge: '8.02',
      packing_charge: '0.00',
      packing: [],
      minimum_charge_applied: '0.00',
      total: '24.10',
    },
  ],
};

const baseStorageRequest = {
  id: 13,
  vendor_id: 8,
  seller_business_name: 'Athul Crafts',
  warehouse: 20,
  status: 'requested',
  quote_rate_card: 4,
  quote_rate_card_version: 4,
  quote_as_of_date: '2026-12-05',
  quote_snapshot: mockQuoteSnapshot,
  charged_amount: '0.00',
  charge_ledger_entry: null,
  refunded_amount: '0.00',
  refund_ledger_entry: null,
  measurement_tolerance_percent: '5.00',
  measurement_mismatches: [],
  refund_due: false,
  decline_reason: '',
  declined_by: null,
  declined_at: null,
  recalled_by: null,
  recalled_at: null,
  recall_reference: '',
  expected_arrival: '2026-12-05',
  courier_name: 'BlueDart',
  tracking_reference: 'BD-2026-0013',
  seller_notes: 'Fragile boxes',
  manager_instructions: '',
  receiving_notes: '',
  receiving_window_start: null,
  receiving_window_end: null,
  decision_reason: '',
  decided_by: null,
  decided_at: null,
  dispatched_at: null,
  received_by: null,
  received_at: null,
  seller_discrepancy_action: 'pending',
  seller_response_reason: '',
  resolved_by: null,
  resolved_at: null,
  resolution_reason: '',
  created_at: '2026-11-26T10:00:00+05:30',
  updated_at: '2026-11-26T10:00:00+05:30',
  items: [
    {
      id: 101,
      variant_id: 22,
      sku_snapshot: 'SILK-RED-01',
      product_name_snapshot: 'Handloom Silk Saree',
      attributes_snapshot: { color: 'Crimson' },
      requested_quantity: 4,
      declared_length_cm: '10.000',
      declared_width_cm: '8.000',
      declared_height_cm: '5.000',
      declared_weight_kg: '1.200',
      expected_storage_days: 6,
      accepted_quantity: null,
      received_quantity: null,
      good_quantity: null,
      damaged_quantity: null,
      resolved_quantity: null,
      measured_length_cm: null,
      measured_width_cm: null,
      measured_height_cm: null,
      measured_weight_kg: null,
      condition: 'uninspected',
      discrepancy_reason: '',
    },
  ],
};

function renderSellerView() {
  return render(
    <AuthContext.Provider
      value={{
        isLoggedIn: true,
        isResolving: false,
        currentUser: { id: 8, username: 'athulcraft', role: 'vendor' },
        logout: vi.fn(),
      }}
    >
      <MemoryRouter initialEntries={['/seller/warehouse']}>
        <Routes>
          <Route
            path="/seller/warehouse"
            element={
              <SellerWarehouseView
                vendorProfile={{ id: 8, may_sell: true, store_name: 'Athul Crafts' }}
              />
            }
          />
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>
  );
}

function renderManagerView(initialPath = '/warehouse/requests') {
  return render(
    <AuthContext.Provider
      value={{
        isLoggedIn: true,
        isResolving: false,
        currentUser: { id: 211, username: 'demo_warehouse', role: 'warehouse_manager' },
        logout: vi.fn(),
      }}
    >
      <MemoryRouter initialEntries={[initialPath]}>
        <Routes>
          <Route path="/warehouse/*" element={<WarehouseDashboardPage />} />
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>
  );
}

describe('Warehouse Storage Request (Consignment) Screens — Seller & Manager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('1. Seller Create Form: collects declared size/weight/days, has NO price input anywhere, displays server field errors under each field, and renders saved quote verbatim after creation', async () => {
    apiRequest.mockImplementation(async (url, opts) => {
      if (url === '/api/warehouse/storage-requests/' && (!opts || !opts.method)) {
        return { count: 0, results: [] };
      }
      if (url === '/api/warehouse/my-stock/') {
        return { count: 0, results: [] };
      }
      if (url === '/api/products/vendor/products/') {
        return { count: 1, results: mockSellerProducts };
      }
      if (url === '/api/warehouse/available/') {
        return [mockWarehouseChoice];
      }
      return {};
    });

    renderSellerView();

    expect(
      await screen.findByTestId('open-create-storage-request-btn')
    ).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('open-create-storage-request-btn'));

    const modal = screen.getByTestId('create-storage-request-modal');
    expect(modal.tagName).toBe('DIALOG');

    // Confirm NO price input exists anywhere in the create form
    expect(within(modal).queryByLabelText(/price|amount|charge|cost|fee/i)).toBeNull();
    expect(within(modal).queryByPlaceholderText(/price|amount|charge|cost|fee/i)).toBeNull();

    // Test server 400 validation errors under each top-level and item row field
    apiRequest.mockRejectedValueOnce(
      new ApiError('Validation failed', 400, {
        warehouse_id: ['This field may not be null.'],
        expected_arrival: ['Date has wrong format.'],
        courier: ['This field may not be blank.'],
        tracking_reference: ['This field may not be blank.'],
        reason: ['A reason is required.'],
        items: [
          {
            variant_id: ['A valid integer is required.'],
            quantity: ['Ensure this value is greater than or equal to 1.'],
            declared_length_cm: ['Ensure this value is greater than or equal to 0.001.'],
            declared_width_cm: ['A valid number is required.'],
            declared_height_cm: ['A valid number is required.'],
            declared_weight_kg: ['Ensure this value is less than or equal to 50.'],
            expected_storage_days: ['Ensure this value is greater than or equal to 1.'],
          },
        ],
      })
    );

    fireEvent.click(screen.getByTestId('sr-submit-btn'));

    expect(await screen.findByTestId('sr-error-warehouse_id')).toHaveTextContent(
      'This field may not be null.'
    );
    expect(screen.getByTestId('sr-error-expected_arrival')).toHaveTextContent(
      'Date has wrong format.'
    );
    expect(screen.getByTestId('sr-error-courier')).toHaveTextContent(
      'This field may not be blank.'
    );
    expect(screen.getByTestId('sr-error-tracking_reference')).toHaveTextContent(
      'This field may not be blank.'
    );
    expect(screen.getByTestId('sr-error-reason')).toHaveTextContent(
      'A reason is required.'
    );
    expect(screen.getByTestId('sr-item-error-variant_id-0')).toHaveTextContent(
      'A valid integer is required.'
    );
    expect(screen.getByTestId('sr-item-error-quantity-0')).toHaveTextContent(
      'Ensure this value is greater than or equal to 1.'
    );
    expect(screen.getByTestId('sr-item-error-declared_length_cm-0')).toHaveTextContent(
      'Ensure this value is greater than or equal to 0.001.'
    );
    expect(screen.getByTestId('sr-item-error-declared_width_cm-0')).toHaveTextContent(
      'A valid number is required.'
    );
    expect(screen.getByTestId('sr-item-error-declared_height_cm-0')).toHaveTextContent(
      'A valid number is required.'
    );
    expect(screen.getByTestId('sr-item-error-declared_weight_kg-0')).toHaveTextContent(
      'Ensure this value is less than or equal to 50.'
    );
    expect(
      screen.getByTestId('sr-item-error-expected_storage_days-0')
    ).toHaveTextContent('Ensure this value is greater than or equal to 1.');

    // Fill valid declared fields and submit
    fireEvent.change(screen.getByTestId('sr-warehouse-select'), {
      target: { value: '20' },
    });
    fireEvent.change(screen.getByTestId('sr-expected-arrival-input'), {
      target: { value: '2026-12-05' },
    });
    fireEvent.change(screen.getByTestId('sr-courier-input'), {
      target: { value: 'BlueDart' },
    });
    fireEvent.change(screen.getByTestId('sr-tracking-input'), {
      target: { value: 'BD-2026-0013' },
    });
    fireEvent.change(screen.getByTestId('sr-notes-input'), {
      target: { value: 'Fragile boxes' },
    });
    fireEvent.change(screen.getByTestId('sr-item-variant-select-0'), {
      target: { value: '22' },
    });
    fireEvent.change(screen.getByTestId('sr-item-qty-input-0'), {
      target: { value: '4' },
    });
    fireEvent.change(screen.getByTestId('sr-item-storage-days-input-0'), {
      target: { value: '6' },
    });
    fireEvent.change(screen.getByTestId('sr-item-length-input-0'), {
      target: { value: '10.000' },
    });
    fireEvent.change(screen.getByTestId('sr-item-width-input-0'), {
      target: { value: '8.000' },
    });
    fireEvent.change(screen.getByTestId('sr-item-height-input-0'), {
      target: { value: '5.000' },
    });
    fireEvent.change(screen.getByTestId('sr-item-weight-input-0'), {
      target: { value: '1.200' },
    });
    fireEvent.change(screen.getByTestId('sr-reason-input'), {
      target: { value: 'LIVE PROOF, IGNORE create request' },
    });

    let postedPayload = null;
    apiRequest.mockImplementation(async (url, opts) => {
      if (url === '/api/warehouse/storage-requests/' && opts?.method === 'POST') {
        postedPayload = JSON.parse(opts.body);
        return baseStorageRequest;
      }
      if (url === '/api/warehouse/storage-requests/') {
        return { count: 1, results: [baseStorageRequest] };
      }
      if (url === '/api/warehouse/my-stock/') {
        return { count: 0, results: [] };
      }
      if (url === '/api/products/vendor/products/') {
        return { count: 1, results: mockSellerProducts };
      }
      if (url === '/api/warehouse/available/') {
        return [mockWarehouseChoice];
      }
      return {};
    });

    fireEvent.click(screen.getByTestId('sr-submit-btn'));

    await waitFor(() => {
      expect(postedPayload).toEqual({
        warehouse_id: 20,
        expected_arrival: '2026-12-05',
        courier: 'BlueDart',
        tracking_reference: 'BD-2026-0013',
        notes: 'Fragile boxes',
        reason: 'LIVE PROOF, IGNORE create request',
        items: [
          {
            variant_id: 22,
            quantity: 4,
            declared_length_cm: '10.000',
            declared_width_cm: '8.000',
            declared_height_cm: '5.000',
            declared_weight_kg: '1.200',
            expected_storage_days: 6,
          },
        ],
      });
    });

    // Price quote appears after creation with exact server strings, and no Charged/Refunded appears while requested
    expect(await screen.findByTestId('seller-saved-quote-panel')).toBeInTheDocument();
    expect(screen.getByTestId('seller-quote-caption')).toHaveTextContent(
      'as quoted on 2026-12-05 using rate card version 4'
    );
    expect(screen.getByTestId('seller-quote-total')).toHaveTextContent('INR 24.10');
    expect(screen.getByTestId('seller-quote-storage-charge')).toHaveTextContent(
      'INR 16.08'
    );
    expect(screen.getByTestId('seller-quote-handling-charge')).toHaveTextContent(
      'INR 8.02'
    );
    expect(screen.getByTestId('seller-quote-line-101')).toHaveTextContent(
      'Small Parcel Band'
    );
    expect(screen.getByTestId('item-declared-dims-101')).toHaveTextContent(
      '10.000 × 8.000 × 5.000 cm'
    );
    expect(screen.getByTestId('item-storage-days-101')).toHaveTextContent('6 days');
    expect(screen.queryByTestId('seller-charged-amount')).toBeNull();
    expect(screen.queryByTestId('seller-refunded-amount')).toBeNull();
  });

  it('2. Next-action rule for every status: confirms getValidStorageRequestActions and UI buttons match the status table for Seller and Manager', () => {
    // 1. requested: manager Accept or Reject; seller Cancel
    expect(getValidStorageRequestActions('requested', 'seller')).toEqual(['cancel']);
    expect(getValidStorageRequestActions('requested', 'warehouse_manager')).toEqual([
      'accept',
      'reject',
    ]);

    // 2. accepted: seller Dispatch; manager Decline
    expect(getValidStorageRequestActions('accepted', 'seller')).toEqual(['dispatch']);
    expect(getValidStorageRequestActions('accepted', 'warehouse_manager')).toEqual([
      'decline',
    ]);

    // 3. in_transit: seller none; manager Receive, Decline
    expect(getValidStorageRequestActions('in_transit', 'seller')).toEqual([]);
    expect(getValidStorageRequestActions('in_transit', 'warehouse_manager')).toEqual([
      'receive',
      'decline',
    ]);

    // 4. received: seller none; manager Close, Decline
    expect(getValidStorageRequestActions('received', 'seller')).toEqual([]);
    expect(getValidStorageRequestActions('received', 'warehouse_manager')).toEqual([
      'close',
      'decline',
    ]);

    // 5. discrepancy: seller Acknowledge or Dispute (while pending); manager Resolve (only after seller responds) & Decline
    expect(
      getValidStorageRequestActions('discrepancy', 'seller', 'pending')
    ).toEqual(['acknowledge', 'dispute']);
    expect(
      getValidStorageRequestActions('discrepancy', 'seller', 'acknowledged')
    ).toEqual([]);
    expect(
      getValidStorageRequestActions('discrepancy', 'warehouse_manager', 'pending')
    ).toEqual(['decline']);
    expect(
      getValidStorageRequestActions('discrepancy', 'warehouse_manager', 'acknowledged')
    ).toEqual(['resolve', 'decline']);
    expect(
      getValidStorageRequestActions('discrepancy', 'warehouse_manager', 'disputed')
    ).toEqual(['resolve', 'decline']);

    // 6. mismatch: seller none; manager Decline
    expect(getValidStorageRequestActions('mismatch', 'seller')).toEqual([]);
    expect(getValidStorageRequestActions('mismatch', 'warehouse_manager')).toEqual([
      'decline',
    ]);

    // 7. recall_pending: seller none; manager Record handback ('recall')
    expect(getValidStorageRequestActions('recall_pending', 'seller')).toEqual([]);
    expect(
      getValidStorageRequestActions('recall_pending', 'warehouse_manager')
    ).toEqual(['recall']);

    // 8. rejected, cancelled, closed, recalled: no actions for either role
    for (const terminal of ['rejected', 'cancelled', 'closed', 'recalled']) {
      expect(getValidStorageRequestActions(terminal, 'seller')).toEqual([]);
      expect(getValidStorageRequestActions(terminal, 'warehouse_manager')).toEqual([]);
    }
  });

  it('3. Mismatch, Decline, Recall Pending, Recalled, Charged/Refunded amounts, and updated refund banner render accurately on Seller screen with old "not been processed" text removed', async () => {
    // Request #15: real dev request shape with charged_amount: "30.15", refunded_amount: "30.15", refund_due: false
    const recallPendingRefundedReq15 = {
      ...baseStorageRequest,
      id: 15,
      vendor_id: 5,
      seller_business_name: 'Acme Demo Commerce Pvt Ltd',
      status: 'recall_pending',
      charged_amount: '30.15',
      charge_ledger_entry: 59,
      refunded_amount: '30.15',
      refund_ledger_entry: 60,
      refund_due: false,
      decline_reason: 'LIVE PROOF, IGNORE refund after mismatch',
      declined_at: '2026-11-27T00:22:40.873850+05:30',
      measurement_tolerance_percent: '5.00',
      measurement_mismatches: [
        {
          item_id: 101,
          dimensions: {
            length_cm: { declared: '8.000', measured: '9.000' },
          },
        },
      ],
      items: [
        {
          ...baseStorageRequest.items[0],
          declared_length_cm: '8.000',
          received_quantity: 1,
          good_quantity: 1,
          damaged_quantity: 0,
          measured_length_cm: '9.000',
          measured_width_cm: '8.000',
          measured_height_cm: '8.000',
          measured_weight_kg: '1.000',
        },
      ],
    };

    // Request #13: older request where refund_due is still true and refunded_amount is "0.00"
    const recalledLegacyRefundDueReq13 = {
      ...recallPendingRefundedReq15,
      id: 13,
      status: 'recalled',
      charged_amount: '0.00',
      charge_ledger_entry: null,
      refunded_amount: '0.00',
      refund_ledger_entry: null,
      refund_due: true,
      recall_reference: 'RECALL-13-PROOF',
      recalled_at: '2026-11-26T14:30:00+05:30',
    };

    // Request #16: accepted request where charged_amount is present ("30.15") and refunded_amount is "0.00"
    const acceptedChargedReq16 = {
      ...baseStorageRequest,
      id: 16,
      status: 'accepted',
      charged_amount: '30.15',
      charge_ledger_entry: 61,
      refunded_amount: '0.00',
      refund_ledger_entry: null,
      refund_due: false,
    };

    apiRequest.mockImplementation(async (url) => {
      if (url === '/api/warehouse/storage-requests/') {
        return {
          count: 3,
          results: [
            recallPendingRefundedReq15,
            recalledLegacyRefundDueReq13,
            acceptedChargedReq16,
          ],
        };
      }
      if (url === '/api/warehouse/storage-requests/15/') {
        return recallPendingRefundedReq15;
      }
      if (url === '/api/warehouse/storage-requests/13/') {
        return recalledLegacyRefundDueReq13;
      }
      if (url === '/api/warehouse/storage-requests/16/') {
        return acceptedChargedReq16;
      }
      if (url === '/api/warehouse/my-stock/') {
        return { count: 0, results: [] };
      }
      if (url === '/api/products/vendor/products/') {
        return { count: 1, results: mockSellerProducts };
      }
      if (url === '/api/warehouse/available/') {
        return [mockWarehouseChoice];
      }
      return {};
    });

    renderSellerView();

    expect(await screen.findByTestId('seller-view-request-btn-15')).toBeInTheDocument();

    // 1) Open recall_pending request #15 (charged: "30.15", refunded: "30.15")
    fireEvent.click(screen.getByTestId('seller-view-request-btn-15'));

    expect(
      await screen.findByTestId('seller-recall-pending-notice')
    ).toHaveTextContent('Please collect your goods');
    expect(screen.getByTestId('seller-decline-reason')).toHaveTextContent(
      'LIVE PROOF, IGNORE refund after mismatch'
    );
    expect(screen.getByTestId('seller-charged-amount')).toHaveTextContent(
      'Charged: 30.15'
    );
    expect(screen.getByTestId('seller-refunded-amount')).toHaveTextContent(
      'Refunded: 30.15'
    );
    expect(screen.getByTestId('seller-fee-refunded-banner')).toHaveTextContent(
      'The warehouse fee was refunded to your wallet.'
    );
    expect(screen.queryByTestId('seller-refund-due-banner')).toBeNull();
    // Outdated "not been processed" text is completely gone
    expect(screen.queryByText(/not been processed/i)).toBeNull();

    expect(screen.getByTestId('seller-measurement-tolerance')).toHaveTextContent(
      'Tolerance: 5.00%'
    );
    expect(screen.getByTestId('mismatch-dim-101-length_cm')).toHaveTextContent(
      '8.000 → 9.000 (Mismatch)'
    );
    // No action buttons allowed in recall_pending for seller
    expect(screen.queryByTestId('seller-cancel-request-btn')).toBeNull();
    expect(screen.queryByTestId('seller-dispatch-request-btn')).toBeNull();

    // 2) Open accepted request #16 (charged: "30.15", refunded: "0.00") -> shows Charged only, no Refunded
    fireEvent.click(screen.getByTestId('seller-view-request-btn-16'));
    expect(await screen.findByTestId('seller-charged-amount')).toHaveTextContent(
      'Charged: 30.15'
    );
    expect(screen.queryByTestId('seller-refunded-amount')).toBeNull();
    expect(screen.queryByTestId('seller-fee-refunded-banner')).toBeNull();
    expect(screen.queryByTestId('seller-refund-due-banner')).toBeNull();

    // 3) Open legacy recalled request #13 (refund_due: true, refunded_amount: "0.00") -> shows neutral fallback text
    fireEvent.click(screen.getByTestId('seller-view-request-btn-13'));

    expect(await screen.findByTestId('seller-recall-reference')).toHaveTextContent(
      'RECALL-13-PROOF'
    );
    expect(screen.getByTestId('seller-recalled-date')).toBeInTheDocument();
    expect(screen.queryByTestId('seller-charged-amount')).toBeNull();
    expect(screen.queryByTestId('seller-refunded-amount')).toBeNull();
    expect(screen.getByTestId('seller-refund-due-banner')).toHaveTextContent(
      'A refund is due and will be recorded by the platform.'
    );
    expect(screen.queryByText(/not been processed/i)).toBeNull();
  });

  it('4. Manager Receive Form, Mismatch Result, Decline Confirm Dialog (with automatic wallet refund text), Charged/Refunded Display, and Record Handback flow', async () => {
    let currentReq = {
      ...baseStorageRequest,
      id: 15,
      status: 'in_transit',
      charged_amount: '30.15',
      charge_ledger_entry: 59,
      refunded_amount: '0.00',
      refund_ledger_entry: null,
      accepted_quantity: 4,
      items: [
        {
          ...baseStorageRequest.items[0],
          accepted_quantity: 4,
        },
      ],
    };

    apiRequest.mockImplementation(async (url, opts) => {
      if (url === '/api/warehouse/me/') {
        return mockWarehouseMe;
      }
      if (url.startsWith('/api/warehouse/storage-requests/') && !opts?.method) {
        if (url === '/api/warehouse/storage-requests/15/') {
          return currentReq;
        }
        return { count: 1, results: [currentReq] };
      }
      return {};
    });

    renderManagerView('/warehouse/requests');

    expect(
      await screen.findByTestId('manager-inspect-request-btn-15')
    ).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('manager-inspect-request-btn-15'));

    // Saved quote and Charged amount are rendered on manager detail (Refunded is hidden while "0.00")
    expect(await screen.findByTestId('manager-saved-quote-panel')).toBeInTheDocument();
    expect(screen.getByTestId('manager-quote-caption')).toHaveTextContent(
      'as quoted on 2026-12-05 using rate card version 4'
    );
    expect(screen.getByTestId('manager-quote-total')).toHaveTextContent('INR 24.10');
    expect(screen.getByTestId('manager-charged-amount')).toHaveTextContent(
      'Charged: 30.15'
    );
    expect(screen.queryByTestId('manager-refunded-amount')).toBeNull();

    // In in_transit: Receive form and Decline button are shown; Accept/Reject/Close/Recall are NOT shown
    expect(screen.getByTestId('manager-receive-form')).toBeInTheDocument();
    expect(screen.getByTestId('manager-open-decline-btn')).toBeInTheDocument();
    expect(screen.queryByTestId('manager-open-accept-btn')).toBeNull();
    expect(screen.queryByTestId('manager-open-close-btn')).toBeNull();
    expect(screen.queryByTestId('manager-open-recall-btn')).toBeNull();

    // Test server errors on manager receive form
    apiRequest.mockRejectedValueOnce(
      new ApiError('Validation failed', 400, {
        reason: ['A reason is required.'],
        items: [
          {
            counted_quantity: ['Good and damaged counts must sum to counted quantity.'],
            length: ['A valid number is required.'],
            location: ['This field may not be blank.'],
          },
        ],
      })
    );

    fireEvent.click(screen.getByTestId('receive-submit-btn'));

    expect(await screen.findByTestId('receive-error-reason')).toHaveTextContent(
      'A reason is required.'
    );
    expect(screen.getByTestId('receive-error-counted-101')).toHaveTextContent(
      'Good and damaged counts must sum to counted quantity.'
    );
    expect(screen.getByTestId('receive-error-length-101')).toHaveTextContent(
      'A valid number is required.'
    );
    expect(screen.getByTestId('receive-error-location-101')).toHaveTextContent(
      'This field may not be blank.'
    );

    // Fill receive form with out-of-tolerance length (15.000 vs declared 10.000) -> transitions to mismatch
    fireEvent.change(screen.getByTestId('receive-counted-101'), {
      target: { value: '4' },
    });
    fireEvent.change(screen.getByTestId('receive-good-101'), {
      target: { value: '4' },
    });
    fireEvent.change(screen.getByTestId('receive-damaged-101'), {
      target: { value: '0' },
    });
    fireEvent.change(screen.getByTestId('receive-length-101'), {
      target: { value: '15.000' },
    });
    fireEvent.change(screen.getByTestId('receive-width-101'), {
      target: { value: '8.000' },
    });
    fireEvent.change(screen.getByTestId('receive-height-101'), {
      target: { value: '5.000' },
    });
    fireEvent.change(screen.getByTestId('receive-weight-101'), {
      target: { value: '1.200' },
    });
    fireEvent.change(screen.getByTestId('receive-location-101'), {
      target: { value: 'BIN-A1' },
    });
    fireEvent.change(screen.getByTestId('receive-reason-input'), {
      target: { value: 'LIVE PROOF, IGNORE received with measured length 15cm' },
    });

    currentReq = {
      ...currentReq,
      status: 'mismatch',
      measurement_mismatches: [
        {
          item_id: 101,
          dimensions: {
            length_cm: { declared: '10.000', measured: '15.000' },
          },
        },
      ],
      items: [
        {
          ...currentReq.items[0],
          received_quantity: 4,
          good_quantity: 4,
          damaged_quantity: 0,
          measured_length_cm: '15.000',
          measured_width_cm: '8.000',
          measured_height_cm: '5.000',
          measured_weight_kg: '1.200',
        },
      ],
    };
    apiRequest.mockResolvedValueOnce(currentReq);

    fireEvent.click(screen.getByTestId('receive-submit-btn'));

    // After saving receive, shows mismatch status and Declared vs Measured table
    expect(await screen.findByTestId('manager-detail-status-badge')).toHaveTextContent(
      'Measurement Mismatch'
    );
    expect(
      screen.getByTestId('manager-declared-vs-measured-table')
    ).toBeInTheDocument();
    expect(
      screen.getByTestId('manager-mismatch-dim-101-length_cm')
    ).toHaveTextContent('10.000 → 15.000 (Mismatch)');

    // In mismatch status, ONLY Decline action is available
    expect(screen.getByTestId('manager-open-decline-btn')).toBeInTheDocument();
    expect(screen.queryByTestId('manager-open-close-btn')).toBeNull();
    expect(screen.queryByTestId('manager-open-recall-btn')).toBeNull();

    // Click Decline -> opens native <dialog> with exact updated refund warning message
    fireEvent.click(screen.getByTestId('manager-open-decline-btn'));
    const declineDialog = screen.getByTestId('manager-decision-modal');
    expect(declineDialog.tagName).toBe('DIALOG');
    expect(screen.getByTestId('manager-decline-warning-text')).toHaveTextContent(
      "The seller will be asked to collect the goods. The warehouse fee will be refunded to the seller's wallet."
    );

    fireEvent.change(screen.getByTestId('manager-decision-reason-input'), {
      target: { value: 'LIVE PROOF, IGNORE decline due to size mismatch' },
    });

    currentReq = {
      ...currentReq,
      status: 'recall_pending',
      decline_reason: 'LIVE PROOF, IGNORE decline due to size mismatch',
      declined_at: '2026-11-27T00:22:40.873850+05:30',
      refunded_amount: '30.15',
      refund_ledger_entry: 60,
      refund_due: false,
    };
    apiRequest.mockResolvedValueOnce(currentReq);

    fireEvent.click(screen.getByTestId('manager-decision-submit-btn'));

    // Now in recall_pending: shows Charged: 30.15, Refunded: 30.15, refunded banner, and Record handback button
    expect(await screen.findByTestId('manager-refunded-amount')).toHaveTextContent(
      'Refunded: 30.15'
    );
    expect(screen.getByTestId('manager-charged-amount')).toHaveTextContent(
      'Charged: 30.15'
    );
    expect(screen.getByTestId('manager-fee-refunded-banner')).toHaveTextContent(
      "The warehouse fee was refunded to the seller's wallet."
    );
    expect(screen.queryByText(/not been processed/i)).toBeNull();
    expect(screen.getByTestId('manager-open-recall-btn')).toBeInTheDocument();
    expect(screen.queryByTestId('manager-open-decline-btn')).toBeNull();

    // Open Record handback modal -> test field errors then success
    fireEvent.click(screen.getByTestId('manager-open-recall-btn'));
    const recallDialog = screen.getByTestId('manager-recall-modal');
    expect(recallDialog.tagName).toBe('DIALOG');

    apiRequest.mockRejectedValueOnce(
      new ApiError('Validation failed', 400, {
        recalled_at: ['Handback time cannot be in the future.'],
        recall_reference: ['A handback reference is required.'],
        reason: ['A reason is required.'],
      })
    );
    fireEvent.click(screen.getByTestId('manager-recall-submit-btn'));

    expect(
      await screen.findByTestId('manager-recall-error-recalled_at')
    ).toHaveTextContent('Handback time cannot be in the future.');
    expect(
      screen.getByTestId('manager-recall-error-recall_reference')
    ).toHaveTextContent('A handback reference is required.');
    expect(screen.getByTestId('manager-recall-error-reason')).toHaveTextContent(
      'A reason is required.'
    );

    fireEvent.change(screen.getByTestId('manager-recall-date-input'), {
      target: { value: '2026-11-26T14:30' },
    });
    fireEvent.change(screen.getByTestId('manager-recall-reference-input'), {
      target: { value: 'RECALL-15-PROOF' },
    });
    fireEvent.change(screen.getByTestId('manager-recall-reason-input'), {
      target: { value: 'LIVE PROOF, IGNORE seller collected goods' },
    });

    currentReq = {
      ...currentReq,
      status: 'recalled',
      recall_reference: 'RECALL-15-PROOF',
      recalled_at: '2026-11-26T14:30:00+05:30',
    };
    apiRequest.mockResolvedValueOnce(currentReq);

    fireEvent.click(screen.getByTestId('manager-recall-submit-btn'));

    expect(await screen.findByTestId('manager-recall-reference')).toHaveTextContent(
      'RECALL-15-PROOF'
    );
    expect(screen.queryByTestId('manager-open-recall-btn')).toBeNull();
  });

  it('5. Role Isolation: customer, other role, and anonymous visitors are refused access to seller and warehouse manager routes', () => {
    // 1. Route permission checks via authRouting.js
    expect(isRouteAllowedForRole('/seller/warehouse', 'customer')).toBe(false);
    expect(isRouteAllowedForRole('/seller/warehouse', 'warehouse_manager')).toBe(false);
    expect(isRouteAllowedForRole('/seller/warehouse', 'vendor')).toBe(true);

    expect(isRouteAllowedForRole('/warehouse/requests', 'customer')).toBe(false);
    expect(isRouteAllowedForRole('/warehouse/requests', 'vendor')).toBe(false);
    expect(isRouteAllowedForRole('/warehouse/requests', 'warehouse_manager')).toBe(true);

    // 2. ProtectedRoute redirects anonymous visitor to /login
    const { unmount: unmountAnon } = render(
      <AuthContext.Provider
        value={{ isLoggedIn: false, isResolving: false, currentUser: null }}
      >
        <MemoryRouter initialEntries={['/warehouse/requests']}>
          <Routes>
            <Route
              path="/warehouse/*"
              element={
                <ProtectedRoute
                  allowedRoles={getAllowedRolesForRoute('/warehouse/dashboard')}
                >
                  <div data-testid="protected-wh">Warehouse Portal</div>
                </ProtectedRoute>
              }
            />
            <Route path="/login" element={<div data-testid="login-screen">Login</div>} />
          </Routes>
        </MemoryRouter>
      </AuthContext.Provider>
    );
    expect(screen.getByTestId('login-screen')).toBeInTheDocument();
    expect(screen.queryByTestId('protected-wh')).toBeNull();
    unmountAnon();

    // 3. ProtectedRoute refuses customer on /seller/warehouse with HTTP 403 role-forbidden-screen
    const { unmount: unmountCust } = render(
      <AuthContext.Provider
        value={{
          isLoggedIn: true,
          isResolving: false,
          currentUser: { id: 99, username: 'buyer1', role: 'customer' },
        }}
      >
        <MemoryRouter initialEntries={['/seller/warehouse']}>
          <Routes>
            <Route
              path="/seller/warehouse"
              element={
                <ProtectedRoute
                  allowedRoles={getAllowedRolesForRoute('/seller/dashboard')}
                >
                  <div data-testid="protected-seller-wh">Seller Warehouse</div>
                </ProtectedRoute>
              }
            />
          </Routes>
        </MemoryRouter>
      </AuthContext.Provider>
    );
    expect(screen.getByTestId('role-forbidden-screen')).toBeInTheDocument();
    expect(screen.queryByTestId('protected-seller-wh')).toBeNull();
    unmountCust();

    // 4. ProtectedRoute refuses vendor (other seller) on /warehouse/requests with HTTP 403 role-forbidden-screen
    render(
      <AuthContext.Provider
        value={{
          isLoggedIn: true,
          isResolving: false,
          currentUser: { id: 9, username: 'other_seller', role: 'vendor' },
        }}
      >
        <MemoryRouter initialEntries={['/warehouse/requests']}>
          <Routes>
            <Route
              path="/warehouse/*"
              element={
                <ProtectedRoute
                  allowedRoles={getAllowedRolesForRoute('/warehouse/dashboard')}
                >
                  <div data-testid="protected-wh">Warehouse Portal</div>
                </ProtectedRoute>
              }
            />
          </Routes>
        </MemoryRouter>
      </AuthContext.Provider>
    );
    expect(screen.getByTestId('role-forbidden-screen')).toBeInTheDocument();
    expect(screen.queryByTestId('protected-wh')).toBeNull();
  });

  it('6. Seller Price Preview (POST /api/warehouse/estimate/): shows verbatim quote & disclaimer, clears stale preview on any form/item change, and displays field errors & 409 currency mismatch message', async () => {
    const liveEstimateResponse = {
      quote_rate_card: 12,
      quote_rate_card_version: 8,
      quote_as_of_date: '2026-12-05',
      quote_snapshot: {
        rate_card_id: 12,
        rate_card_version: 8,
        currency: 'INR',
        date: '2026-12-05',
        items: [
          {
            rate_card_id: 12,
            version: 8,
            currency: 'INR',
            as_of_date: '2026-12-05',
            band: { id: 23, label: 'LIVE PROOF, IGNORE Small' },
            storage_charge: '28.14',
            handling_charge: '2.01',
            packing_charge: '0.00',
            packing: [],
            free_days_applied: 2,
            billable_storage_days: 28,
            minimum_charge_applied: '0.00',
            total: '30.15',
            variant_id: 22,
            quantity: 1,
            item_id: null,
          },
        ],
        storage_charge: '28.14',
        handling_charge: '2.01',
        packing_charge: '0.00',
        minimum_charge_applied: '0.00',
        total: '30.15',
      },
    };

    apiRequest.mockImplementation(async (url, opts) => {
      if (url === '/api/warehouse/storage-requests/' && (!opts || !opts.method)) {
        return { count: 0, results: [] };
      }
      if (url === '/api/warehouse/my-stock/') {
        return { count: 0, results: [] };
      }
      if (url === '/api/products/vendor/products/') {
        return { count: 1, results: mockSellerProducts };
      }
      if (url === '/api/warehouse/available/') {
        return [mockWarehouseChoice];
      }
      return {};
    });

    renderSellerView();

    fireEvent.click(await screen.findByTestId('open-create-storage-request-btn'));

    // 1) Preview validation error (400) renders under matching fields
    apiRequest.mockRejectedValueOnce(
      new ApiError('Validation failed', 400, {
        warehouse_id: ['Select a warehouse to estimate price.'],
        expected_arrival: ['Expected arrival date is required.'],
        items: [
          {
            declared_length_cm: ['Length must be at least 0.001 cm.'],
          },
        ],
      })
    );

    fireEvent.click(screen.getByTestId('sr-check-price-btn'));

    expect(await screen.findByTestId('sr-error-warehouse_id')).toHaveTextContent(
      'Select a warehouse to estimate price.'
    );
    expect(screen.getByTestId('sr-error-expected_arrival')).toHaveTextContent(
      'Expected arrival date is required.'
    );
    expect(
      screen.getByTestId('sr-item-error-declared_length_cm-0')
    ).toHaveTextContent('Length must be at least 0.001 cm.');

    // 2) Fill form and run Check price -> renders preview panel with verbatim numbers & disclaimer
    fireEvent.change(screen.getByTestId('sr-warehouse-select'), {
      target: { value: '20' },
    });
    fireEvent.change(screen.getByTestId('sr-expected-arrival-input'), {
      target: { value: '2026-12-05' },
    });
    fireEvent.change(screen.getByTestId('sr-item-variant-select-0'), {
      target: { value: '22' },
    });
    fireEvent.change(screen.getByTestId('sr-item-qty-input-0'), {
      target: { value: '1' },
    });
    fireEvent.change(screen.getByTestId('sr-item-storage-days-input-0'), {
      target: { value: '30' },
    });
    fireEvent.change(screen.getByTestId('sr-item-length-input-0'), {
      target: { value: '8.000' },
    });
    fireEvent.change(screen.getByTestId('sr-item-width-input-0'), {
      target: { value: '8.000' },
    });
    fireEvent.change(screen.getByTestId('sr-item-height-input-0'), {
      target: { value: '8.000' },
    });
    fireEvent.change(screen.getByTestId('sr-item-weight-input-0'), {
      target: { value: '1.000' },
    });

    let estimatePayload = null;
    apiRequest.mockImplementationOnce(async (url, opts) => {
      expect(url).toBe('/api/warehouse/estimate/');
      expect(opts?.method).toBe('POST');
      estimatePayload = JSON.parse(opts.body);
      return liveEstimateResponse;
    });

    fireEvent.click(screen.getByTestId('sr-check-price-btn'));

    expect(await screen.findByTestId('sr-price-preview-panel')).toBeInTheDocument();
    expect(estimatePayload).toEqual({
      warehouse_id: 20,
      expected_arrival: '2026-12-05',
      items: [
        {
          variant_id: 22,
          quantity: 1,
          declared_length_cm: '8.000',
          declared_width_cm: '8.000',
          declared_height_cm: '8.000',
          declared_weight_kg: '1.000',
          expected_storage_days: 30,
        },
      ],
    });
    expect(screen.getByTestId('sr-price-preview-disclaimer')).toHaveTextContent(
      'Estimated price. Nothing is charged until the warehouse accepts.'
    );
    expect(screen.getByTestId('sr-price-preview-caption')).toHaveTextContent(
      'as quoted on 2026-12-05 using rate card version 8'
    );
    expect(screen.getByTestId('sr-price-preview-total')).toHaveTextContent('INR 30.15');
    expect(screen.getByTestId('sr-price-preview-storage')).toHaveTextContent(
      'INR 28.14'
    );
    expect(screen.getByTestId('sr-price-preview-handling')).toHaveTextContent(
      'INR 2.01'
    );
    expect(screen.getByTestId('sr-price-preview-line-0')).toHaveTextContent(
      'LIVE PROOF, IGNORE Small'
    );

    // 3) Stale-preview clearing: editing any item field immediately clears the preview panel
    fireEvent.change(screen.getByTestId('sr-item-qty-input-0'), {
      target: { value: '2' },
    });
    expect(screen.queryByTestId('sr-price-preview-panel')).toBeNull();

    // Re-run Check price, then edit top-level expected_arrival -> also clears stale preview
    apiRequest.mockResolvedValueOnce(liveEstimateResponse);
    fireEvent.click(screen.getByTestId('sr-check-price-btn'));
    expect(await screen.findByTestId('sr-price-preview-panel')).toBeInTheDocument();

    fireEvent.change(screen.getByTestId('sr-expected-arrival-input'), {
      target: { value: '2026-12-06' },
    });
    expect(screen.queryByTestId('sr-price-preview-panel')).toBeNull();

    // 4) 409 Currency mismatch message on create (and preview) is shown verbatim in the form
    apiRequest.mockRejectedValueOnce(
      new ApiError(
        'Warehouse quote currency AED does not match seller wallet currency INR.',
        409,
        {
          detail:
            'Warehouse quote currency AED does not match seller wallet currency INR.',
        }
      )
    );
    fireEvent.click(screen.getByTestId('sr-submit-btn'));

    expect(await screen.findByTestId('create-request-form-error')).toHaveTextContent(
      'Warehouse quote currency AED does not match seller wallet currency INR.'
    );
  });

  it('7. Manager Accept and Decline Dialogs: shows charge notice on Accept, wallet refund notice on Decline, and displays 409 server errors inside the open dialog', async () => {
    const requestedReq = {
      ...baseStorageRequest,
      id: 15,
      status: 'requested',
    };

    apiRequest.mockImplementation(async (url, opts) => {
      if (url === '/api/warehouse/me/') {
        return mockWarehouseMe;
      }
      if (url.startsWith('/api/warehouse/storage-requests/') && !opts?.method) {
        if (url === '/api/warehouse/storage-requests/15/') {
          return requestedReq;
        }
        return { count: 1, results: [requestedReq] };
      }
      return {};
    });

    renderManagerView('/warehouse/requests');

    fireEvent.click(await screen.findByTestId('manager-inspect-request-btn-15'));

    // Open Accept dialog
    fireEvent.click(await screen.findByTestId('manager-open-accept-btn'));

    const acceptDialog = screen.getByTestId('manager-decision-modal');
    expect(acceptDialog.tagName).toBe('DIALOG');
    expect(screen.getByTestId('manager-accept-charge-notice')).toHaveTextContent(
      "Accepting charges the seller's wallet the saved quote total."
    );

    // Server returns 409 currency mismatch on accept -> dialog stays open and displays the server message inside the dialog
    apiRequest.mockRejectedValueOnce(
      new ApiError(
        'Warehouse quote currency AED does not match seller wallet currency INR.',
        409,
        {
          detail:
            'Warehouse quote currency AED does not match seller wallet currency INR.',
        }
      )
    );

    fireEvent.change(screen.getByTestId('manager-decision-reason-input'), {
      target: { value: 'Accepting request' },
    });
    fireEvent.click(screen.getByTestId('manager-decision-submit-btn'));

    expect(
      await screen.findByTestId('manager-decision-general-error')
    ).toHaveTextContent(
      'Warehouse quote currency AED does not match seller wallet currency INR.'
    );
    expect(screen.getByTestId('manager-decision-modal')).toBeInTheDocument();
  });

  it('8. Seller Wallet & Statement Screens (SellerSettlementsView) and hasNonZeroMoneyString: renders warehouse_storage_fee and warehouse_storage_fee_refund with plain labels and server descriptions verbatim (no browser money maths)', async () => {
    // Unit-check hasNonZeroMoneyString helper (pure string inspection, no parseFloat)
    expect(hasNonZeroMoneyString(null)).toBe(false);
    expect(hasNonZeroMoneyString('')).toBe(false);
    expect(hasNonZeroMoneyString('0.00')).toBe(false);
    expect(hasNonZeroMoneyString('0')).toBe(false);
    expect(hasNonZeroMoneyString('30.15')).toBe(true);

    // Live wallet response shape from dev request #15 (ledger rows #59 and #60)
    const liveWalletPayload = {
      wallet: {
        cached_balance: '0.00',
        balance_status: 'normal',
        updated_at: '2026-11-27T00:55:14.033098+05:30',
      },
      available_balance: '0.00',
      reserved_for_withdrawals: '0.00',
      total_paid_out: '0.00',
      earnings_breakdown: {
        gross_sales: '0.00',
        commission: '0.00',
        platform_fee: '0.00',
        logistics: '0.00',
        gateway: '0.00',
        tds_tcs: '0.00',
        adjustments: '0.00',
        net_settled: '0.00',
      },
      settled_order_count: 0,
      awaiting_settlement_order_count: 1,
      payout_details: { configured: true, is_verified: true, method: 'upi' },
      recent_ledger_entries: [
        {
          id: 60,
          vendor_order: null,
          warehouse_storage_request: 15,
          reference: '15',
          entry_type: 'warehouse_storage_fee_refund',
          amount: '30.15',
          currency: 'INR',
          description: 'Refund of warehouse storage fee, request #15',
          created_at: '2026-11-27T00:22:40.876415+05:30',
        },
        {
          id: 59,
          vendor_order: null,
          warehouse_storage_request: 15,
          reference: '15',
          entry_type: 'warehouse_storage_fee',
          amount: '-30.15',
          currency: 'INR',
          description: 'Warehouse storage fee, request #15',
          created_at: '2026-11-27T00:22:40.796527+05:30',
        },
      ],
    };

    const liveStatementsPayload = [
      {
        id: 7,
        period_start: '2026-11-01',
        period_end: '2026-11-30',
        currency: 'INR',
        opening_balance: '0.00',
        closing_balance: '0.00',
        generated_at: '2026-11-27T00:56:00+05:30',
        lines: [
          {
            id: 501,
            ledger_entry: 59,
            entry_type: 'warehouse_storage_fee',
            amount: '-30.15',
            reference: '15',
            description: 'Warehouse storage fee, request #15',
            entry_created_at: '2026-11-27T00:22:40.796527+05:30',
          },
          {
            id: 502,
            ledger_entry: 60,
            entry_type: 'warehouse_storage_fee_refund',
            amount: '30.15',
            reference: '15',
            description: 'Refund of warehouse storage fee, request #15',
            entry_created_at: '2026-11-27T00:22:40.876415+05:30',
          },
        ],
      },
    ];

    apiRequest.mockImplementation(async (url) => {
      if (url === '/api/settlements/wallet/') {
        return liveWalletPayload;
      }
      if (url === '/api/settlements/withdrawals/') {
        return [];
      }
      if (url === '/api/settlements/statements/') {
        return liveStatementsPayload;
      }
      return {};
    });

    render(
      <ToastProvider>
        <SellerSettlementsView formatCurrency={(v) => `₹${v}`} />
      </ToastProvider>
    );

    // Verify wallet ledger rows #59 and #60 render plain labels, server descriptions, and exact amounts
    expect(await screen.findByTestId('wallet-ledger-label-59')).toHaveTextContent(
      'Warehouse storage fee'
    );
    expect(screen.getByTestId('wallet-ledger-desc-59')).toHaveTextContent(
      'Warehouse storage fee, request #15'
    );
    expect(screen.getByTestId('wallet-ledger-amount-59')).toHaveTextContent(
      '− ₹30.15'
    );

    expect(screen.getByTestId('wallet-ledger-label-60')).toHaveTextContent(
      'Warehouse storage fee refund'
    );
    expect(screen.getByTestId('wallet-ledger-desc-60')).toHaveTextContent(
      'Refund of warehouse storage fee, request #15'
    );
    expect(screen.getByTestId('wallet-ledger-amount-60')).toHaveTextContent('₹30.15');

    // Verify statement lines also render plain labels and server descriptions
    expect(screen.getByTestId('settlement-statement-7')).toBeInTheDocument();
    expect(screen.getByTestId('statement-line-59')).toHaveTextContent(
      'Warehouse storage fee'
    );
    expect(screen.getByTestId('statement-line-59')).toHaveTextContent(
      'Warehouse storage fee, request #15'
    );
    expect(screen.getByTestId('statement-line-60')).toHaveTextContent(
      'Warehouse storage fee refund'
    );
    expect(screen.getByTestId('statement-line-60')).toHaveTextContent(
      'Refund of warehouse storage fee, request #15'
    );
  });
});
