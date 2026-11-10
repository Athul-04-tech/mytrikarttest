import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import CouponManagementModule from '../CouponManagementModule';
import { apiRequest } from '../../../../utils/api';

vi.mock('../../../../utils/api', () => ({ apiRequest: vi.fn() }));

const coupon = {
  id: 23,
  code: 'SAVE10',
  discount_type: 'percentage',
  discount_value: '10.00',
  max_discount_cap: '100.00',
  min_cart_value: '500.00',
  valid_from: '2026-10-01T09:00:00+05:30',
  valid_until: '2026-11-30T23:59:00+05:30',
  usage_limit_total: 50,
  usage_limit_per_customer: 1,
  is_active: true,
  funded_by: 'platform',
  description: 'Festival savings',
  redemption_count: 4,
  redemption_record_count: 4,
  is_expired: false,
  is_used_up: false,
  is_currently_active: true,
};
const list = (results = [coupon]) => ({
  counts: { total: 1, active: 1, expired: 0, used_up: 0, inactive: 0, total_redemptions: 4, unreversed_redemptions: 4 },
  count: results.length,
  next: null,
  previous: null,
  results,
});

describe('CouponManagementModule', () => {
  beforeEach(() => vi.resetAllMocks());

  it('loads server counts, rows and server filters', async () => {
    apiRequest.mockResolvedValue(list());
    render(<CouponManagementModule />);
    expect(await screen.findByText('SAVE10')).toBeInTheDocument();
    expect(screen.getByText('Festival savings')).toBeInTheDocument();
    expect(screen.getByText('4 / 50')).toBeInTheDocument();
    expect(screen.getAllByText('Redemptions')[0].parentElement).toHaveTextContent('4');
    fireEvent.change(screen.getByLabelText('Status'), { target: { value: 'expired' } });
    await waitFor(() => expect(apiRequest).toHaveBeenLastCalledWith(expect.stringContaining('status=expired')));
  });

  it('shows a clear permission error without rendering local coupon data', async () => {
    apiRequest.mockRejectedValue({ status: 403, data: { detail: 'Forbidden.' }, message: 'Forbidden.' });
    render(<CouponManagementModule />);
    expect(await screen.findByRole('alert')).toHaveTextContent('You do not have permission to manage coupons.');
    expect(screen.queryByText('SAVE10')).not.toBeInTheDocument();
  });

  it('shows create field errors under the input and does not show success', async () => {
    apiRequest.mockResolvedValueOnce(list()).mockRejectedValueOnce({
      status: 400,
      data: { discount_value: ['Percentage discounts must be between 0 and 100.'] },
      message: 'HTTP 400 Error',
    });
    render(<CouponManagementModule />);
    fireEvent.click(await screen.findByRole('button', { name: /create coupon/i }));
    fireEvent.change(screen.getByLabelText('Coupon code'), { target: { value: 'BAD101' } });
    fireEvent.change(screen.getByLabelText('Discount value'), { target: { value: '101' } });
    fireEvent.change(screen.getByLabelText('Valid from'), { target: { value: '2026-11-01T10:00' } });
    fireEvent.change(screen.getByLabelText('Valid until'), { target: { value: '2026-12-01T10:00' } });
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Create coupon' }));
    expect(await screen.findByText('Percentage discounts must be between 0 and 100.')).toBeInTheDocument();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(apiRequest).toHaveBeenLastCalledWith('/api/orders/admin/coupons/', expect.objectContaining({ method: 'POST' }));
  });

  it('edits with writable fields only and excludes server-owned response fields', async () => {
    apiRequest.mockResolvedValue(list());
    render(<CouponManagementModule />);
    fireEvent.click(await screen.findByRole('button', { name: 'Edit SAVE10' }));
    fireEvent.change(screen.getByRole('textbox', { name: 'Description' }), { target: { value: 'Updated offer' } });
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Save changes' }));
    await screen.findByText('Coupon updated.');
    const [url, options] = apiRequest.mock.calls.find(([, request]) => request?.method === 'PATCH');
    expect(url).toBe('/api/orders/admin/coupons/23/');
    const payload = JSON.parse(options.body);
    expect(payload).toMatchObject({ code: 'SAVE10', discount_type: 'percentage', description: 'Updated offer' });
    expect(payload).not.toHaveProperty('id');
    expect(payload).not.toHaveProperty('created_at');
    expect(payload).not.toHaveProperty('redemption_count');
  });

  it('toggles only through PATCH and refreshes from the server', async () => {
    apiRequest.mockResolvedValue(list());
    render(<CouponManagementModule />);
    const toggle = await screen.findByRole('switch', { name: 'Deactivate SAVE10' });
    fireEvent.click(toggle);
    await waitFor(() => expect(apiRequest).toHaveBeenCalledWith('/api/orders/admin/coupons/23/', {
      method: 'PATCH', body: JSON.stringify({ is_active: false }),
    }));
    await waitFor(() => expect(apiRequest).toHaveBeenCalledTimes(3));
  });

  it('keeps the toggle unchanged and shows the error when PATCH fails', async () => {
    apiRequest.mockImplementation((url, options = {}) => {
      if (options.method === 'PATCH') return Promise.reject({ status: 500, message: 'Server unavailable.' });
      return Promise.resolve(list());
    });
    render(<CouponManagementModule />);
    const toggle = await screen.findByRole('switch', { name: 'Deactivate SAVE10' });
    fireEvent.click(toggle);
    expect(await screen.findByRole('alert')).toHaveTextContent('Server unavailable.');
    expect(screen.getByRole('switch', { name: 'Deactivate SAVE10' })).toHaveAttribute('aria-checked', 'true');
  });

  it('shows delete 409 and offers server-backed deactivate instead', async () => {
    apiRequest.mockImplementation((url, options = {}) => {
      if (options.method === 'DELETE') return Promise.reject({
        status: 409,
        data: { detail: 'Coupon has redemption history and cannot be deleted. Deactivate it instead.' },
        message: 'Coupon has redemption history and cannot be deleted. Deactivate it instead.',
      });
      if (options.method === 'PATCH') return Promise.resolve(coupon);
      return Promise.resolve(list());
    });
    render(<CouponManagementModule />);
    fireEvent.click(await screen.findByRole('button', { name: 'Delete SAVE10' }));
    fireEvent.click(screen.getByRole('button', { name: 'Delete coupon' }));
    expect(await screen.findByText('Coupon has redemption history and cannot be deleted. Deactivate it instead.')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Deactivate instead' }));
    await waitFor(() => expect(apiRequest).toHaveBeenCalledWith('/api/orders/admin/coupons/23/', {
      method: 'PATCH', body: JSON.stringify({ is_active: false }),
    }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });
});
