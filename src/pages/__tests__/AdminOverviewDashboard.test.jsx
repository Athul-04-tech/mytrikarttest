import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import AdminHomePage from '../AdminHomePage';
import * as apiModule from '../../utils/api';
import { ToastProvider } from '../../context/ToastContext';

vi.mock('../../utils/api', async () => {
  const actual = await vi.importActual('../../utils/api');
  return {
    ...actual,
    apiRequest: vi.fn(),
  };
});

describe('Admin Overview Dashboard Real API Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockOverviewResponse = {
    vendors: {
      total: 9,
      by_onboarding_status: {
        registered: 6,
        under_review: 2,
        approved: 0,
        rejected: 0,
        resubmit_required: 1,
        verified: 0,
        wizard_in_progress: 0,
        store_published: 0
      }
    },
    users: {
      total: 22,
      by_role: {
        customer: 11,
        vendor: 9,
        admin: 2
      }
    },
    products: {
      total: 18,
      sku_total: 16,
      pending_review: 4
    },
    revenue: {
      by_currency: {}
    }
  };

  const renderDashboard = () => {
    return render(
      <BrowserRouter>
        <ToastProvider>
          <AdminHomePage />
        </ToastProvider>
      </BrowserRouter>
    );
  };

  it('1. Fetches real telemetry from GET /api/reports/admin/overview/ and wires cards', async () => {
    apiModule.apiRequest.mockImplementation(async (url) => {
      if (url === '/api/reports/admin/overview/') return mockOverviewResponse;
      return {};
    });

    renderDashboard();

    await waitFor(() => {
      expect(apiModule.apiRequest).toHaveBeenCalledWith('/api/reports/admin/overview/');
    });

    // Registered Vendors card (total 9, 3 pending)
    await waitFor(() => {
      expect(screen.getByText('9 Merchants')).toBeTruthy();
      expect(screen.getByText('3 pending review')).toBeTruthy();
    });

    // Active Customers card
    expect(screen.getByText('11 Buyers')).toBeTruthy();

    // Catalog SKUs card
    expect(screen.getByText('16 SKUs')).toBeTruthy();

    // Products Awaiting Review card (4 pending)
    expect(screen.getByText('4 Pending')).toBeTruthy();

    // Net Platform Revenue card (empty currency map -> honest empty state)
    expect(screen.getAllByText('No settled revenue yet').length).toBeGreaterThan(0);
  });

  it('2. Labels unbuilt stats as "Not yet available" and removes fabricated panels', async () => {
    apiModule.apiRequest.mockImplementation(async (url) => {
      if (url === '/api/reports/admin/overview/') return mockOverviewResponse;
      return {};
    });

    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText('9 Merchants')).toBeTruthy();
    });

    // Unbuilt stats must be labeled "Not yet available"
    const notAvailableLabels = screen.getAllByText('Not yet available');
    expect(notAvailableLabels.length).toBeGreaterThan(0);

    // Fabricated panels must be completely absent
    expect(screen.queryByText('Infrastructure & AI Core Health')).toBeNull();
    expect(screen.queryByText('Top Vendor Partnerships')).toBeNull();
    expect(screen.queryByText('Top Selling Products')).toBeNull();
  });
});
