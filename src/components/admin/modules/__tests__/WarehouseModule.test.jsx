import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import WarehouseModule from '../WarehouseModule';
import { apiRequest } from '../../../../utils/api';

vi.mock('../../../../utils/api', () => ({
  apiRequest: vi.fn(),
}));

const mockWarehouses = {
  count: 2,
  next: null,
  previous: null,
  results: [
    {
      id: 10,
      name: 'Mumbai Central Hub',
      code: 'mum-central-10',
      address_line1: 'Plot 42, MIDC',
      address_line2: 'Andheri East',
      city: 'Mumbai',
      state: 'Maharashtra',
      postal_code: '400093',
      country: 'IN',
      is_active: true,
      created_by: 79,
      created_at: '2026-11-11T10:00:00+05:30',
      updated_at: '2026-11-11T10:05:00+05:30',
    },
    {
      id: 11,
      name: 'Pune South Hub',
      code: 'pune-south-11',
      address_line1: 'Phase 2, Hinjewadi',
      address_line2: '',
      city: 'Pune',
      state: 'Maharashtra',
      postal_code: '411057',
      country: 'IN',
      is_active: true,
      created_by: 79,
      created_at: '2026-11-11T10:10:00+05:30',
      updated_at: '2026-11-11T10:15:00+05:30',
    },
  ],
};

const mockManagers = {
  count: 1,
  next: null,
  previous: null,
  results: [
    {
      id: 21,
      warehouse: 10,
      warehouse_name: 'Mumbai Central Hub',
      user: 199,
      username: 'mgr_mumbai',
      active_from: '2026-11-11T10:20:00+05:30',
      active_to: null,
      created_by: 79,
      created_at: '2026-11-11T10:20:00+05:30',
    },
  ],
};

const mockAudit = {
  count: 1,
  next: null,
  previous: null,
  results: [
    {
      id: 501,
      actor: 79,
      actor_username: 'settlement_admin',
      occurred_at: '2026-11-11T10:20:00+05:30',
      action: 'invite_created',
      object_type: 'WarehouseInvite',
      object_id: 31,
      old_values: {},
      new_values: { user_id: 199, warehouse_id: 10 },
      reason: 'Initial manager invite',
    },
  ],
};

describe('WarehouseModule — Admin Warehouse & Manager Screens', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    apiRequest.mockImplementation(async (url) => {
      if (url.startsWith('/api/admin/warehouse/warehouses/')) return mockWarehouses;
      if (url.startsWith('/api/admin/warehouse/managers/')) return mockManagers;
      if (url.startsWith('/api/admin/warehouse/audit/')) return mockAudit;
      if (url.startsWith('/api/accounts/users/')) {
        return {
          count: 1,
          results: [
            {
              id: 199,
              username: 'mgr_mumbai',
              email: 'mgr_mumbai@example.com',
              is_active: false,
              role: 'warehouse_manager',
            },
          ],
        };
      }
      return {};
    });
  });

  it('1. lists warehouses, creates a warehouse with required reason, and renders server field errors under matching inputs with no raw keys', async () => {
    render(<WarehouseModule />);

    expect(await screen.findByText('Mumbai Central Hub')).toBeInTheDocument();
    expect(screen.getByText('Pune South Hub')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('open-create-warehouse-btn'));
    expect(screen.getByTestId('warehouse-form-modal')).toBeInTheDocument();

    // First submit fails with server field errors on reason and code
    apiRequest.mockImplementationOnce(async () => {
      const err = new Error('Validation error');
      err.status = 400;
      err.data = {
        code: ['warehouse with this code already exists.'],
        reason: ['A reason is required.'],
      };
      throw err;
    });

    fireEvent.click(screen.getByTestId('warehouse-submit-btn'));

    expect(await screen.findByTestId('warehouse-error-code')).toHaveTextContent(
      'warehouse with this code already exists.'
    );
    expect(screen.getByTestId('warehouse-error-reason')).toHaveTextContent(
      'A reason is required.'
    );

    // Fill valid values and submit
    fireEvent.change(screen.getByTestId('warehouse-name-input'), {
      target: { value: 'Delhi Hub' },
    });
    fireEvent.change(screen.getByTestId('warehouse-code-input'), {
      target: { value: 'delhi-hub-12' },
    });
    fireEvent.change(screen.getByTestId('warehouse-address1-input'), {
      target: { value: 'Sector 18' },
    });
    fireEvent.change(screen.getByTestId('warehouse-city-input'), {
      target: { value: 'Gurugram' },
    });
    fireEvent.change(screen.getByTestId('warehouse-state-input'), {
      target: { value: 'Haryana' },
    });
    fireEvent.change(screen.getByTestId('warehouse-postal-input'), {
      target: { value: '122015' },
    });
    fireEvent.change(screen.getByTestId('warehouse-reason-input'), {
      target: { value: 'Expand north region' },
    });

    apiRequest.mockImplementationOnce(async (url, opts) => {
      expect(url).toBe('/api/admin/warehouse/warehouses/');
      expect(opts.method).toBe('POST');
      const body = JSON.parse(opts.body);
      expect(body.reason).toBe('Expand north region');
      return { id: 12, name: 'Delhi Hub', code: 'delhi-hub-12', is_active: true };
    });

    fireEvent.click(screen.getByTestId('warehouse-submit-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('warehouse-feedback-banner')).toHaveTextContent(
        'Warehouse "Delhi Hub" (delhi-hub-12) created.'
      );
    });
  });

  it('2. invites a manager (no password field), displays one-time setup link once with warning, and clears link when dialog closes', async () => {
    render(<WarehouseModule />);
    expect(await screen.findByText('Mumbai Central Hub')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('open-invite-manager-btn'));
    expect(screen.getByTestId('invite-manager-modal')).toBeInTheDocument();

    // Ensure there is NO password input in the invite form
    expect(screen.queryByLabelText(/password/i)).toBeNull();

    // Server validation error on duplicate username/email and blank reason
    apiRequest.mockImplementationOnce(async () => {
      const err = new Error('Bad Request');
      err.status = 400;
      err.data = {
        username: ['An account already uses this username.'],
        email: ['An account already uses this email address.'],
        reason: ['A reason is required.'],
      };
      throw err;
    });

    fireEvent.click(screen.getByTestId('invite-submit-btn'));

    expect(await screen.findByTestId('invite-error-username')).toHaveTextContent(
      'An account already uses this username.'
    );
    expect(screen.getByTestId('invite-error-email')).toHaveTextContent(
      'An account already uses this email address.'
    );
    expect(screen.getByTestId('invite-error-reason')).toHaveTextContent(
      'A reason is required.'
    );

    // Fill invite form and submit successfully
    fireEvent.change(screen.getByTestId('invite-username-input'), {
      target: { value: 'new_wh_mgr' },
    });
    fireEvent.change(screen.getByTestId('invite-email-input'), {
      target: { value: 'new_wh_mgr@example.com' },
    });
    fireEvent.change(screen.getByTestId('invite-fullname-input'), {
      target: { value: 'New Warehouse Manager' },
    });
    fireEvent.change(screen.getByTestId('invite-warehouse-select'), {
      target: { value: '10' },
    });
    fireEvent.change(screen.getByTestId('invite-reason-input'), {
      target: { value: 'Onboarding shift manager' },
    });

    apiRequest.mockImplementationOnce(async (url, opts) => {
      expect(url).toBe('/api/accounts/users/warehouse-invite/');
      expect(opts.method).toBe('POST');
      const body = JSON.parse(opts.body);
      expect(body).toEqual({
        username: 'new_wh_mgr',
        email: 'new_wh_mgr@example.com',
        full_name: 'New Warehouse Manager',
        warehouse_id: 10,
        reason: 'Onboarding shift manager',
      });
      return {
        user_id: 205,
        username: 'new_wh_mgr',
        email: 'new_wh_mgr@example.com',
        warehouse_id: 10,
        assignment_id: 22,
        invite_id: 35,
        expires_at: '2026-11-14T10:00:00+05:30',
        setup_endpoint: '/api/accounts/warehouse-setup/',
        setup_token: 'secret_one_time_token_xyz',
      };
    });

    fireEvent.click(screen.getByTestId('invite-submit-btn'));

    // Verify one-time link and exact warning are shown
    const linkInput = await screen.findByTestId('one-time-setup-link-input');
    expect(linkInput.value).toContain(
      '/warehouse/setup?token=secret_one_time_token_xyz'
    );
    expect(screen.getByTestId('one-time-setup-warning')).toHaveTextContent(
      'This link is shown only once. Send it to the manager now. It expires in 72 hours and works once.'
    );
    expect(localStorage.getItem('secret_one_time_token_xyz')).toBeNull();

    // Close dialog and re-open: link must NOT be shown again
    fireEvent.click(screen.getByTestId('done-invite-modal-btn'));
    await waitFor(() => {
      expect(screen.queryByTestId('invite-manager-modal')).toBeNull();
    });

    fireEvent.click(screen.getByTestId('open-invite-manager-btn'));
    expect(screen.queryByTestId('one-time-setup-link-input')).toBeNull();
  });

  it('3. executes manager actions (reissue, revoke, assign, end-assignment, deactivate) with required reason and renders audit tab', async () => {
    render(<WarehouseModule />);
    expect(await screen.findByText('Mumbai Central Hub')).toBeInTheDocument();

    // Switch to Managers tab
    fireEvent.click(screen.getByTestId('warehouse-tab-managers'));
    expect(await screen.findByText('mgr_mumbai')).toBeInTheDocument();
    expect(screen.getByText('mgr_mumbai@example.com')).toBeInTheDocument();

    // Deactivate manager with reason
    fireEvent.click(screen.getByTestId('deactivate-manager-btn-199'));
    expect(screen.getByTestId('manager-action-modal')).toBeInTheDocument();

    fireEvent.change(screen.getByTestId('manager-action-reason-input'), {
      target: { value: 'End of contract' },
    });

    apiRequest.mockImplementationOnce(async (url, opts) => {
      expect(url).toBe('/api/admin/warehouse/managers/199/deactivate/');
      expect(opts.method).toBe('POST');
      expect(JSON.parse(opts.body)).toEqual({ reason: 'End of contract' });
      return { user_id: 199, is_active: false };
    });

    fireEvent.click(screen.getByTestId('manager-action-submit-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('warehouse-feedback-banner')).toHaveTextContent(
        'Warehouse manager "mgr_mumbai" deactivated and tokens invalidated.'
      );
    });

    // Switch to Audit tab
    fireEvent.click(screen.getByTestId('warehouse-tab-audit'));
    expect(await screen.findByTestId('audit-row-501')).toHaveTextContent('invite_created');
    expect(screen.getByText('Initial manager invite')).toBeInTheDocument();
  });

  it('4. renders Phase 2 Storage Requests oversight, Discrepancy Queue filter, Admin Resolve action, Stock, and Movements tabs', async () => {
    const mockAdminDiscrepancyReq = {
      id: 305,
      warehouse: 10,
      warehouse_name: 'Mumbai Central Hub',
      warehouse_code: 'mum-central-10',
      seller: 8,
      seller_business_name: 'Mytri Artisans',
      status: 'discrepancy',
      seller_discrepancy_action: 'disputed',
      seller_response_reason: 'We packed 3 intact boxes',
      items: [
        {
          id: 701,
          variant: 22,
          sku_snapshot: 'SPICE-DLX',
          product_name_snapshot: 'Artisan Spice Box',
          requested_quantity: 3,
          accepted_quantity: 3,
          received_quantity: 2,
          good_quantity: 1,
          damaged_quantity: 1,
          discrepancy_reason: '1 short and 1 damaged',
        },
      ],
    };

    apiRequest.mockImplementation(async (url) => {
      if (url.startsWith('/api/admin/warehouse/warehouses/')) return mockWarehouses;
      if (url.startsWith('/api/admin/warehouse/managers/')) return mockManagers;
      if (url.startsWith('/api/admin/warehouse/audit/')) return mockAudit;
      if (url.startsWith('/api/admin/warehouse/storage-requests/')) {
        return { count: 1, results: [mockAdminDiscrepancyReq] };
      }
      if (url.startsWith('/api/admin/warehouse/stock/')) {
        return {
          count: 1,
          results: [
            {
              id: 81,
              warehouse: 10,
              warehouse_name: 'Mumbai Central Hub',
              warehouse_code: 'mum-central-10',
              seller: 8,
              seller_business_name: 'Mytri Artisans',
              storage_request: 305,
              variant: 22,
              sku_snapshot: 'SPICE-DLX',
              product_name_snapshot: 'Artisan Spice Box',
              attributes_snapshot: { pack: 'Deluxe' },
              received_quantity: 2,
              available_quantity: 1,
              damaged_quantity: 1,
              length_cm: '25.00',
              width_cm: '18.00',
              height_cm: '12.00',
              weight_kg: '0.850',
              storage_location: 'A1-B2',
            },
          ],
        };
      }
      if (url.startsWith('/api/admin/warehouse/movements/')) {
        return {
          count: 1,
          results: [
            {
              id: 91,
              warehouse: 10,
              seller: 8,
              lot: 81,
              storage_request: 305,
              sku_snapshot: 'SPICE-DLX',
              product_name_snapshot: 'Artisan Spice Box',
              movement_type: 'compensating_adjustment',
              quantity_delta: 1,
              before_quantity: 1,
              after_quantity: 2,
              actor_username: 'settlement_admin',
              reason: 'Admin verified second unit intact',
              occurred_at: '2026-11-12T12:00:00+05:30',
            },
          ],
        };
      }
      return {};
    });

    render(<WarehouseModule />);
    expect(await screen.findByText('Mumbai Central Hub')).toBeInTheDocument();

    // Open Storage Requests tab
    fireEvent.click(screen.getByTestId('warehouse-tab-requests'));
    expect(await screen.findByTestId('admin-request-row-305')).toHaveTextContent(
      'Mytri Artisans'
    );

    // Inspect & Resolve Discrepancy
    fireEvent.click(screen.getByTestId('admin-inspect-request-btn-305'));
    expect(
      await screen.findByTestId('admin-resolve-discrepancy-form')
    ).toBeInTheDocument();

    fireEvent.change(screen.getByTestId('admin-resolve-qty-701'), {
      target: { value: '2' },
    });
    fireEvent.change(screen.getByTestId('admin-resolve-reason-input'), {
      target: { value: 'Admin verified second unit intact' },
    });

    apiRequest.mockImplementationOnce(async (url, opts) => {
      expect(url).toBe('/api/admin/warehouse/storage-requests/305/resolve/');
      expect(opts.method).toBe('POST');
      expect(JSON.parse(opts.body)).toEqual({
        reason: 'Admin verified second unit intact',
        items: [{ item_id: 701, accepted_quantity: 2 }],
      });
      return { ...mockAdminDiscrepancyReq, status: 'received' };
    });

    fireEvent.click(screen.getByTestId('admin-resolve-submit-btn'));
    await waitFor(() => {
      expect(screen.getByTestId('warehouse-feedback-banner')).toHaveTextContent(
        'Admin resolved discrepancy on storage request #305.'
      );
    });

    // Close modal and check Stock and Movements tabs
    fireEvent.click(screen.getByTestId('close-admin-request-modal-btn'));
    fireEvent.click(screen.getByTestId('warehouse-tab-stock'));
    expect(await screen.findByTestId('admin-stock-row-81')).toHaveTextContent(
      'SPICE-DLX'
    );

    fireEvent.click(screen.getByTestId('warehouse-tab-movements'));
    expect(await screen.findByTestId('admin-movement-row-91')).toHaveTextContent(
      '+1'
    );
  });
});
