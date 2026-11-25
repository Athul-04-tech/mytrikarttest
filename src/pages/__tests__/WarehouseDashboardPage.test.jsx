import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import WarehouseDashboardPage from '../WarehouseDashboardPage';
import { apiRequest } from '../../utils/api';
import * as AuthContextModule from '../../context/AuthContext';

vi.mock('../../utils/api', () => ({
  apiRequest: vi.fn(),
}));

vi.mock('../../context/AuthContext', async () => {
  const actual = await vi.importActual('../../context/AuthContext');
  return {
    ...actual,
    useAuth: vi.fn(),
  };
});

const mockMeResponse = {
  profile: {
    id: 199,
    username: 'mgr_mumbai',
    first_name: 'Rohan',
    last_name: 'Kulkarni',
  },
  warehouse: {
    id: 10,
    name: 'Mumbai Central Hub',
    code: 'mum-central-10',
    address_line1: 'Plot 42, MIDC',
    address_line2: 'Andheri East',
    city: 'Mumbai',
    state: 'Maharashtra',
    postal_code: '400093',
    country: 'IN',
  },
};

const mockInTransitRequest = {
  id: 201,
  warehouse: 10,
  warehouse_name: 'Mumbai Central Hub',
  warehouse_code: 'mum-central-10',
  seller: 8,
  seller_business_name: 'Mytri Artisans',
  status: 'in_transit',
  expected_arrival: '2026-11-20',
  courier: 'BlueDart',
  tracking_reference: 'BD-201',
  seller_discrepancy_action: 'none',
  items: [
    {
      id: 401,
      variant: 21,
      sku_snapshot: 'SPICE-STD',
      product_name_snapshot: 'Artisan Spice Box',
      attributes_snapshot: { pack: 'Standard' },
      requested_quantity: 4,
      accepted_quantity: 4,
      received_quantity: null,
      good_quantity: null,
      damaged_quantity: null,
    },
  ],
};

describe('WarehouseDashboardPage — Warehouse Manager Home & Phase 2 Receiving', () => {
  const mockLogout = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(AuthContextModule.useAuth).mockReturnValue({
      currentUser: {
        id: 199,
        username: 'mgr_mumbai',
        email: 'mgr_mumbai@example.com',
        role: 'warehouse_manager',
      },
      logout: mockLogout,
    });
  });

  it('1. renders assigned warehouse details and manager profile from GET /api/warehouse/me/ and calls real logout on Sign Out', async () => {
    apiRequest.mockResolvedValueOnce(mockMeResponse);

    render(
      <MemoryRouter initialEntries={['/warehouse/dashboard']}>
        <Routes>
          <Route path="/warehouse/*" element={<WarehouseDashboardPage />} />
          <Route path="/login" element={<div data-testid="login-dest">Login</div>} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByTestId('assigned-warehouse-name')).toHaveTextContent(
      'Mumbai Central Hub'
    );
    expect(screen.getByTestId('assigned-warehouse-code')).toHaveTextContent(
      'mum-central-10'
    );
    expect(screen.getByTestId('assigned-warehouse-address')).toHaveTextContent(
      'Plot 42, MIDC, Andheri East, Mumbai, Maharashtra, 400093, IN'
    );
    expect(screen.getByTestId('assigned-warehouse-status')).toHaveTextContent(
      'Active'
    );
    expect(screen.getByTestId('manager-profile-username')).toHaveTextContent(
      'mgr_mumbai'
    );
    expect(screen.getByTestId('manager-profile-fullname')).toHaveTextContent(
      'Rohan Kulkarni'
    );

    fireEvent.click(screen.getByTestId('warehouse-signout-btn'));
    await waitFor(() => {
      expect(mockLogout).toHaveBeenCalledTimes(1);
    });
  });

  it('2. shows clear message and no fake warehouse data when manager has no active assignment', async () => {
    apiRequest.mockImplementationOnce(async () => {
      const err = new Error('An active warehouse manager assignment is required.');
      err.status = 403;
      err.data = { detail: 'An active warehouse manager assignment is required.' };
      throw err;
    });

    render(
      <MemoryRouter initialEntries={['/warehouse/dashboard']}>
        <Routes>
          <Route path="/warehouse/*" element={<WarehouseDashboardPage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(
      await screen.findByTestId('warehouse-no-assignment-state')
    ).toHaveTextContent('An active warehouse manager assignment is required.');
    expect(screen.queryByTestId('assigned-warehouse-card')).toBeNull();
  });

  it('3. navigates to Requests queue, validates good + damaged === counted on Receive form, and handles 409 duplicate receive by refetching', async () => {
    apiRequest.mockImplementation(async (url) => {
      if (url === '/api/warehouse/me/') return mockMeResponse;
      if (url.startsWith('/api/warehouse/storage-requests/?') || url === '/api/warehouse/storage-requests/') {
        return { count: 1, results: [mockInTransitRequest] };
      }
      if (url === '/api/warehouse/storage-requests/201/') {
        return mockInTransitRequest;
      }
      return {};
    });

    render(
      <MemoryRouter initialEntries={['/warehouse/requests']}>
        <Routes>
          <Route path="/warehouse/*" element={<WarehouseDashboardPage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByTestId('manager-request-row-201')).toHaveTextContent(
      'Mytri Artisans'
    );

    fireEvent.click(screen.getByTestId('manager-inspect-request-btn-201'));
    expect(await screen.findByTestId('manager-receive-form')).toBeInTheDocument();

    // Enter mismatched good + damaged vs counted
    fireEvent.change(screen.getByTestId('receive-counted-401'), {
      target: { value: '4' },
    });
    fireEvent.change(screen.getByTestId('receive-good-401'), {
      target: { value: '2' },
    });
    fireEvent.change(screen.getByTestId('receive-damaged-401'), {
      target: { value: '1' },
    });

    fireEvent.click(screen.getByTestId('receive-submit-btn'));
    expect(
      await screen.findByTestId('receive-error-counted-401')
    ).toHaveTextContent('Good (2) + Damaged (1) must equal Counted (4).');

    // Fix counts and simulate 409 duplicate receive
    fireEvent.change(screen.getByTestId('receive-good-401'), {
      target: { value: '3' },
    });
    fireEvent.change(screen.getByTestId('receive-length-401'), {
      target: { value: '30.00' },
    });
    fireEvent.change(screen.getByTestId('receive-width-401'), {
      target: { value: '20.00' },
    });
    fireEvent.change(screen.getByTestId('receive-height-401'), {
      target: { value: '15.00' },
    });
    fireEvent.change(screen.getByTestId('receive-weight-401'), {
      target: { value: '1.250' },
    });
    fireEvent.change(screen.getByTestId('receive-location-401'), {
      target: { value: 'A1-B2' },
    });
    fireEvent.change(screen.getByTestId('receive-reason-input'), {
      target: { value: 'Received at Dock 2' },
    });

    apiRequest.mockImplementationOnce(async () => {
      const err = new Error('Conflict');
      err.status = 409;
      err.data = {
        detail: "Cannot transition storage request from 'received' to 'received'.",
      };
      throw err;
    });

    fireEvent.click(screen.getByTestId('receive-submit-btn'));
    expect(
      await screen.findByTestId('warehouse-manager-conflict-alert')
    ).toHaveTextContent(
      "Cannot transition storage request from 'received' to 'received'."
    );
  });
});
