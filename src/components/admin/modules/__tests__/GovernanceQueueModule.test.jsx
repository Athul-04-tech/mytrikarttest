import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import GovernanceQueueModule from '../GovernanceQueueModule';
import { apiRequest } from '../../../../utils/api';
import { ToastProvider } from '../../../../context/ToastContext';

vi.mock('../../../../utils/api', () => ({
  apiRequest: vi.fn(),
}));

const mockAttrRequests = [
  {
    id: 1,
    vendor_name: 'Acme Demo Store',
    category_name: 'Electronics',
    category_attribute_name: 'Color',
    requested_value: 'Titanium Silver',
    reason: 'New metallic finish introduced by manufacturer',
    created_at: '2026-09-24T10:00:00Z',
  }
];

const mockBrandRequests = [
  {
    id: 1,
    vendor_name: 'Royal Store',
    requested_name: 'Zebronics Official',
    reason: 'Authorized regional distributor',
    created_at: '2026-09-24T11:00:00Z',
  }
];

describe('GovernanceQueueModule — Real Backend API Wiring & Governance Flow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('1. fetches and renders attribute-value governance requests', async () => {
    apiRequest.mockImplementation(async (url) => {
      if (url === '/api/products/admin/attribute-value-requests/') return mockAttrRequests;
      if (url === '/api/products/admin/brand-requests/') return mockBrandRequests;
      return {};
    });

    render(
      <ToastProvider>
        <GovernanceQueueModule defaultTab="attributes" />
      </ToastProvider>
    );

    expect(await screen.findByText('"Titanium Silver"')).toBeInTheDocument();
    expect(screen.getByText('Acme Demo Store')).toBeInTheDocument();
    expect(screen.getByText('Electronics › Color')).toBeInTheDocument();
  });

  it('2. approves an attribute-value request via POST endpoint and removes it from queue', async () => {
    apiRequest.mockImplementation(async (url, options) => {
      if (url === '/api/products/admin/attribute-value-requests/') return mockAttrRequests;
      if (url === '/api/products/admin/brand-requests/') return mockBrandRequests;
      if (url === '/api/products/admin/attribute-value-requests/1/review/') return { status: 'approved' };
      return {};
    });

    render(
      <ToastProvider>
        <GovernanceQueueModule defaultTab="attributes" />
      </ToastProvider>
    );

    expect(await screen.findByText('"Titanium Silver"')).toBeInTheDocument();

    const approveBtn = screen.getByText('Approve');
    fireEvent.click(approveBtn);

    await waitFor(() => {
      expect(apiRequest).toHaveBeenCalledWith('/api/products/admin/attribute-value-requests/1/review/', {
        method: 'POST',
        body: JSON.stringify({ action: 'approve' }),
      });
    });

    // Item should disappear and empty state should show
    expect(await screen.findByText('Attribute Governance Queue Clear')).toBeInTheDocument();
  });

  it('3. rejects a brand request with mandatory reason and removes it from queue', async () => {
    apiRequest.mockImplementation(async (url, options) => {
      if (url === '/api/products/admin/attribute-value-requests/') return [];
      if (url === '/api/products/admin/brand-requests/') return mockBrandRequests;
      if (url === '/api/products/admin/brand-requests/1/review/') return { status: 'rejected' };
      return {};
    });

    render(
      <ToastProvider>
        <GovernanceQueueModule defaultTab="brands" />
      </ToastProvider>
    );

    expect(await screen.findByText('Zebronics Official')).toBeInTheDocument();

    const rejectBtn = screen.getByText('Reject');
    fireEvent.click(rejectBtn);

    expect(screen.getByText('Reject Brand Request')).toBeInTheDocument();

    const confirmBtn = screen.getByText('Confirm Rejection');
    expect(confirmBtn).toBeDisabled();

    // Type rejection reason
    const reasonInput = screen.getByPlaceholderText(/Specify why this governance request is being rejected/i);
    fireEvent.change(reasonInput, { target: { value: 'Trademark authorization not verified.' } });

    expect(confirmBtn).not.toBeDisabled();
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(apiRequest).toHaveBeenCalledWith('/api/products/admin/brand-requests/1/review/', {
        method: 'POST',
        body: JSON.stringify({
          action: 'reject',
          reason: 'Trademark authorization not verified.',
        }),
      });
    });

    expect(await screen.findByText('Brand Governance Queue Clear')).toBeInTheDocument();
  });
});
