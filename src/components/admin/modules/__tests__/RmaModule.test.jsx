import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import RmaModule from '../RmaModule';
import { apiRequest, ApiError } from '../../../../utils/api';
import { ToastProvider } from '../../../../context/ToastContext';

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

const mockPaginatedEnvelope = {
  count: 2,
  next: null,
  previous: null,
  results: [
    {
      id: 101,
      vendor_order: 501,
      requested_action: 'return',
      reason: 'damaged',
      reason_notes: 'Item screen cracked during transit',
      status: 'disputed',
      is_eligible: true,
      eligibility_checked_at: '2026-09-29T10:00:00Z',
      items: [{ id: 1, order_item: 801, quantity: 1 }],
      images: [],
      customer_refund: null,
      created_at: '2026-09-29T10:00:00Z',
      updated_at: '2026-09-29T10:00:00Z'
    },
    {
      id: 102,
      vendor_order: 502,
      requested_action: 'refund',
      reason: 'defective',
      reason_notes: 'Device does not turn on',
      status: 'inspection',
      is_eligible: true,
      eligibility_checked_at: '2026-09-29T10:30:00Z',
      items: [{ id: 2, order_item: 802, quantity: 1 }],
      images: [],
      customer_refund: null,
      created_at: '2026-09-29T10:30:00Z',
      updated_at: '2026-09-29T10:30:00Z'
    }
  ]
};

function renderRmaModule() {
  return render(
    <ToastProvider>
      <RmaModule />
    </ToastProvider>
  );
}

describe('RmaModule — Real Admin RMA Operations Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    apiRequest.mockImplementation((url) => {
      if (url.includes('/api/rma/admin/rma/')) {
        return Promise.resolve(mockPaginatedEnvelope);
      }
      return Promise.reject(new Error('Unknown URL: ' + url));
    });
  });

  it('renders real paginated list from backend envelope without hardcoded ORD-94826 mock', async () => {
    renderRmaModule();

    expect(await screen.findByText('Returns, Refunds & RMA Central')).toBeInTheDocument();
    expect(await screen.findByText('#101')).toBeInTheDocument();
    expect(screen.getByText('#102')).toBeInTheDocument();
    expect(screen.getByText('2 Total Requests')).toBeInTheDocument();

    // Verify hardcoded ORD-94826 is nowhere in the rendered text
    expect(screen.queryByText(/ORD-94826/i)).not.toBeInTheDocument();
  });

  it('executes dispute resolution POST /api/rma/admin/rma/<id>/resolve-dispute/ with correct body', async () => {
    apiRequest.mockImplementation((url, options) => {
      if (options?.method === 'POST' && url.includes('/resolve-dispute/')) {
        return Promise.resolve({
          id: 1,
          return_request: 101,
          admin_decision: 'favor_customer',
          resolution_notes: 'Valid customer claim verified',
          resolved_by: 1,
          resolved_at: '2026-09-29T11:00:00Z',
          return_status: 'approved'
        });
      }
      return Promise.resolve(mockPaginatedEnvelope);
    });

    renderRmaModule();

    const resolveBtn = await screen.findByRole('button', { name: /Resolve Dispute/i });
    fireEvent.click(resolveBtn);

    expect(await screen.findByText('Resolve Dispute — RMA #101')).toBeInTheDocument();

    const submitBtn = screen.getByRole('button', { name: /Submit Resolution/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(apiRequest).toHaveBeenCalledWith(
        '/api/rma/admin/rma/101/resolve-dispute/',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            decision: 'favor_customer',
            notes: ''
          })
        })
      );
    });
  });

  it('executes refund processing POST /api/rma/admin/rma/<id>/refund/ with correct body', async () => {
    apiRequest.mockImplementation((url, options) => {
      if (options?.method === 'POST' && url.includes('/refund/')) {
        return Promise.resolve({
          id: 102,
          vendor_order: 502,
          requested_action: 'refund',
          reason: 'defective',
          status: 'refund_processed',
          customer_refund: {
            id: 88,
            refund_amount: '100.00',
            currency: 'INR',
            status: 'succeeded',
            gateway_reference: 'mock-refund-502-100.00',
            created_at: '2026-09-29T11:00:00Z'
          }
        });
      }
      return Promise.resolve(mockPaginatedEnvelope);
    });

    renderRmaModule();

    const processRefundBtn = await screen.findByRole('button', { name: /Process Refund/i });
    fireEvent.click(processRefundBtn);

    expect(await screen.findByText('Execute Customer Refund — RMA #102')).toBeInTheDocument();

    const executeBtn = screen.getByRole('button', { name: /Execute Refund/i });
    fireEvent.click(executeBtn);

    await waitFor(() => {
      expect(apiRequest).toHaveBeenCalledWith(
        '/api/rma/admin/rma/102/refund/',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({})
        })
      );
    });
  });

  it('handles rejection of invalid repeat actions showing real backend error message', async () => {
    apiRequest.mockImplementation((url, options) => {
      if (options?.method === 'POST' && url.includes('/resolve-dispute/')) {
        const error = new Error('Dispute is already resolved.');
        error.data = { detail: 'Dispute is already resolved.' };
        return Promise.reject(error);
      }
      return Promise.resolve(mockPaginatedEnvelope);
    });

    renderRmaModule();

    const resolveBtn = await screen.findByRole('button', { name: /Resolve Dispute/i });
    fireEvent.click(resolveBtn);

    const submitBtn = screen.getByRole('button', { name: /Submit Resolution/i });
    fireEvent.click(submitBtn);

    expect(await screen.findByText('Backend Action Error')).toBeInTheDocument();
    expect(screen.getByText('Dispute is already resolved.')).toBeInTheDocument();
  });
});
