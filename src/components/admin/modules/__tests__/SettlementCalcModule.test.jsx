import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import SettlementCalcModule from '../SettlementCalcModule';
import { apiRequest } from '../../../../utils/api';
import { ToastProvider } from '../../../../context/ToastContext';

vi.mock('../../../../utils/api', () => ({
  apiRequest: vi.fn(),
}));

describe('SettlementCalcModule', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders vendor orders list from API', async () => {
    const mockVendorOrders = [
      {
        id: 27,
        order_id: 29,
        vendor: 25,
        vendor_name: 'Zenith Digital',
        status: 'delivered',
        grand_total: '10000.00',
        currency: 'INR',
        settlement_state: 'pending',
        created_at: '2026-09-29T10:00:00Z',
      },
    ];

    apiRequest.mockImplementation(async (url) => mockVendorOrders);

    render(
      <ToastProvider>
        <SettlementCalcModule />
      </ToastProvider>
    );

    expect(screen.getByText(/Settlement Calculation & Ledger Engine/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('VO-#27')).toBeInTheDocument();
      expect(screen.getByText('Zenith Digital')).toBeInTheDocument();
    });

    expect(apiRequest).toHaveBeenCalledWith('/api/settlements/admin/vendor-orders/');
  });

  it('triggers calculate endpoint and displays returned ledger entries modal', async () => {
    const mockVendorOrders = [
      {
        id: 27,
        order_id: 29,
        vendor: 25,
        vendor_name: 'Zenith Digital',
        status: 'delivered',
        grand_total: '10000.00',
        currency: 'INR',
        settlement_state: 'pending',
        created_at: '2026-09-29T10:00:00Z',
      },
    ];

    const mockLedgerEntries = [
      {
        id: 8,
        vendor_order: 27,
        entry_type: 'gross_sale',
        amount: '10000.00',
        currency: 'INR',
        description: 'Gross sale',
      },
      {
        id: 9,
        vendor_order: 27,
        entry_type: 'commission',
        amount: '-1000.00',
        currency: 'INR',
        description: 'Commission deduction',
      },
      {
        id: 15,
        vendor_order: 27,
        entry_type: 'net_settlement',
        amount: '8524.00',
        currency: 'INR',
        description: 'Net settlement',
      },
    ];

    apiRequest.mockImplementation(async (url) => {
      if (url.includes('/calculate/')) {
        return mockLedgerEntries;
      }
      return mockVendorOrders;
    });

    render(
      <ToastProvider>
        <SettlementCalcModule />
      </ToastProvider>
    );

    const calcBtn = await screen.findByTestId('calc-btn-27');
    expect(calcBtn).toBeInTheDocument();

    fireEvent.click(calcBtn);

    const modalHeader = await screen.findByText('REAL-TIME LEDGER ENTRIES');
    expect(modalHeader).toBeInTheDocument();
    expect(screen.getByText('Commission Deduction')).toBeInTheDocument();
    expect(screen.getByText('Net Vendor Settlement')).toBeInTheDocument();
  });
});
