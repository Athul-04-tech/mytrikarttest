import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import WithdrawalManagementModule from '../WithdrawalManagementModule';
import { apiRequest } from '../../../../utils/api';
import { ToastProvider } from '../../../../context/ToastContext';

vi.mock('../../../../utils/api', () => ({
  apiRequest: vi.fn(),
}));

describe('WithdrawalManagementModule', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders withdrawals list from API and filters by status', async () => {
    const mockWithdrawals = [
      {
        id: 10,
        vendor: 25,
        vendor_name: 'Zenith Digital',
        amount: '3000.00',
        currency: 'INR',
        status: 'pending',
        payout_method_snapshot: 'bank_transfer',
        rejection_reason: '',
        requested_at: '2026-09-29T10:00:00Z',
        reviewed_at: null,
      },
    ];

    apiRequest.mockResolvedValue(mockWithdrawals);

    render(
      <ToastProvider>
        <WithdrawalManagementModule />
      </ToastProvider>
    );

    expect(screen.getByText(/Vendor Withdrawal Management/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Zenith Digital')).toBeInTheDocument();
      expect(screen.getByText('#10')).toBeInTheDocument();
    });

    expect(apiRequest).toHaveBeenCalledWith('/api/settlements/admin/withdrawals/');
  });

  it('handles approve action correctly', async () => {
    const mockWithdrawals = [
      {
        id: 10,
        vendor: 25,
        vendor_name: 'Zenith Digital',
        amount: '3000.00',
        currency: 'INR',
        status: 'pending',
        payout_method_snapshot: 'bank_transfer',
        rejection_reason: '',
        requested_at: '2026-09-29T10:00:00Z',
        reviewed_at: null,
      },
    ];

    apiRequest.mockImplementation(async (url) => {
      if (url === '/api/settlements/admin/withdrawals/') return mockWithdrawals;
      if (url === '/api/settlements/withdrawals/10/review/') {
        return { ...mockWithdrawals[0], status: 'approved' };
      }
      return mockWithdrawals;
    });

    render(
      <ToastProvider>
        <WithdrawalManagementModule />
      </ToastProvider>
    );

    await waitFor(() => {
      expect(screen.getAllByText('Approve')[0]).toBeInTheDocument();
    });

    fireEvent.click(screen.getAllByText('Approve')[0]);

    expect(screen.getByText('Approve Withdrawal Request')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Confirm Approval'));

    await waitFor(() => {
      expect(apiRequest).toHaveBeenCalledWith('/api/settlements/withdrawals/10/review/', {
        method: 'POST',
        body: JSON.stringify({ action: 'approve' }),
      });
    });
  });

  it('requires reason when rejecting a withdrawal', async () => {
    const mockWithdrawals = [
      {
        id: 11,
        vendor: 25,
        vendor_name: 'Zenith Digital',
        amount: '2000.00',
        currency: 'INR',
        status: 'pending',
        payout_method_snapshot: 'bank_transfer',
        rejection_reason: '',
        requested_at: '2026-09-29T10:00:00Z',
        reviewed_at: null,
      },
    ];

    apiRequest.mockResolvedValue(mockWithdrawals);

    render(
      <ToastProvider>
        <WithdrawalManagementModule />
      </ToastProvider>
    );

    await waitFor(() => {
      expect(screen.getAllByText('Reject')[0]).toBeInTheDocument();
    });

    fireEvent.click(screen.getAllByText('Reject')[0]);

    expect(screen.getByText('Reject Withdrawal Request')).toBeInTheDocument();

    // Try submitting without entering reason
    fireEvent.click(screen.getByText('Confirm Rejection'));

    expect(screen.getByText(/Please specify a rejection reason/i)).toBeInTheDocument();
  });
});
