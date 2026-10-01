import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import OrderOpsModule from '../OrderOpsModule';
import { apiRequest } from '../../../../utils/api';
import { ToastProvider } from '../../../../context/ToastContext';

vi.mock('../../../../utils/api', () => ({ apiRequest: vi.fn() }));

const rows = [
  { id: 11, order_id: 101, vendor: 4, vendor_name: 'Store', customer_name: 'Buyer', status: 'pending', grand_total: '10.00', currency: 'INR' },
  { id: 12, order_id: 102, vendor: 4, vendor_name: 'Store', customer_name: 'Buyer', status: 'shipped', grand_total: '20.00', currency: 'INR' },
  { id: 13, order_id: 103, vendor: 4, vendor_name: 'Store', customer_name: 'Buyer', status: 'delivered', grand_total: '30.00', currency: 'INR' },
];

function renderModule() {
  return render(<ToastProvider><OrderOpsModule /></ToastProvider>);
}

describe('OrderOpsModule real transition actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    apiRequest.mockImplementation((url, options) => {
      if (options?.method === 'POST') {
        return Promise.resolve({ ...rows[0], status: 'processing' });
      }
      return Promise.resolve({ count: rows.length, next: null, previous: null, results: rows });
    });
  });

  it('offers only legal transitions and changes a row only after a real 200 response', async () => {
    renderModule();
    expect(await screen.findByText('pending', { selector: 'span' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Mark processing' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Mark shipped' })).not.toBeInTheDocument();
    expect(screen.getByText('No further transitions')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Mark processing' }));
    expect(apiRequest).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole('button', { name: 'Confirm processing' }));
    await waitFor(() => expect(apiRequest).toHaveBeenCalledWith(
      '/api/orders/admin/vendor-orders/11/transition/',
      { method: 'POST', body: JSON.stringify({ status: 'processing' }) },
    ));
    expect(await screen.findByText('processing', { selector: 'span' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Mark processing' })).not.toBeInTheDocument();
  });

  it('shows the paid-order RMA response and whole-parent warning on cancel', async () => {
    apiRequest.mockImplementation((url, options) => {
      if (options?.method === 'POST') {
        return Promise.reject({ data: { detail: 'Paid orders cannot be cancelled here. Use the RMA refund flow to request a refund.' } });
      }
      return Promise.resolve({ count: rows.length, next: null, previous: null, results: rows });
    });
    renderModule();
    await screen.findByText('pending', { selector: 'span' });
    fireEvent.click(screen.getByRole('button', { name: 'Cancel…' }));
    expect(screen.getByText((content, element) => element.tagName === 'P' && /cancels the entire parent order/i.test(element.textContent))).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Confirm cancelled' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(/Use the RMA refund flow/);
    expect(screen.getByText('pending', { selector: 'span' })).toBeInTheDocument();
  });
});
