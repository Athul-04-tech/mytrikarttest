import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import WarehouseSetupPage from '../WarehouseSetupPage';
import { apiRequest } from '../../utils/api';

vi.mock('../../utils/api', () => ({
  apiRequest: vi.fn(),
}));

describe('WarehouseSetupPage — Public One-Time Password Setup', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('1. removes token from address bar via window.history.replaceState immediately on mount', () => {
    const replaceStateSpy = vi.spyOn(window.history, 'replaceState');

    render(
      <MemoryRouter initialEntries={['/warehouse/setup?token=tok_live_12345']}>
        <Routes>
          <Route path="/warehouse/setup" element={<WarehouseSetupPage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(replaceStateSpy).toHaveBeenCalledWith(
      {},
      expect.any(String),
      '/warehouse/setup'
    );
    expect(screen.getByTestId('setup-new-password-input')).toBeInTheDocument();
  });

  it('2. shows calm generic invalid-link message when token is missing from URL', () => {
    render(
      <MemoryRouter initialEntries={['/warehouse/setup']}>
        <Routes>
          <Route path="/warehouse/setup" element={<WarehouseSetupPage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByTestId('setup-invalid-link-error')).toHaveTextContent(
      'This link is invalid or has expired. Ask your admin for a new one.'
    );
  });

  it('3. checks password confirmation match, surfaces server password errors under password field, and completes setup on valid password', async () => {
    render(
      <MemoryRouter initialEntries={['/warehouse/setup?token=valid_token_abc']}>
        <Routes>
          <Route path="/warehouse/setup" element={<WarehouseSetupPage />} />
          <Route path="/login" element={<div data-testid="login-page">Login Page</div>} />
        </Routes>
      </MemoryRouter>
    );

    // Mismatched confirm password caught client-side
    fireEvent.change(screen.getByTestId('setup-new-password-input'), {
      target: { value: 'pass1' },
    });
    fireEvent.change(screen.getByTestId('setup-confirm-password-input'), {
      target: { value: 'pass2' },
    });
    fireEvent.click(screen.getByTestId('setup-submit-btn'));

    expect(screen.getByTestId('setup-confirm-error')).toHaveTextContent(
      'Passwords do not match.'
    );
    expect(apiRequest).not.toHaveBeenCalled();

    // Weak password sent to server -> server returns password validation errors in detail array
    fireEvent.change(screen.getByTestId('setup-new-password-input'), {
      target: { value: 'short' },
    });
    fireEvent.change(screen.getByTestId('setup-confirm-password-input'), {
      target: { value: 'short' },
    });

    apiRequest.mockImplementationOnce(async () => {
      const err = new Error('Validation error');
      err.status = 400;
      err.data = {
        detail: [
          'This password is too short. It must contain at least 8 characters.',
        ],
      };
      throw err;
    });

    fireEvent.click(screen.getByTestId('setup-submit-btn'));

    expect(await screen.findByTestId('setup-password-error')).toHaveTextContent(
      'This password is too short. It must contain at least 8 characters.'
    );

    // Valid password succeeds
    fireEvent.change(screen.getByTestId('setup-new-password-input'), {
      target: { value: 'Str0ng!Warehouse#2026' },
    });
    fireEvent.change(screen.getByTestId('setup-confirm-password-input'), {
      target: { value: 'Str0ng!Warehouse#2026' },
    });

    apiRequest.mockImplementationOnce(async (url, opts) => {
      expect(url).toBe('/api/accounts/warehouse-setup/');
      expect(opts.method).toBe('POST');
      expect(JSON.parse(opts.body)).toEqual({
        token: 'valid_token_abc',
        password: 'Str0ng!Warehouse#2026',
      });
      return { detail: 'Account setup complete. You can now sign in.' };
    });

    fireEvent.click(screen.getByTestId('setup-submit-btn'));

    expect(await screen.findByTestId('setup-success-card')).toHaveTextContent(
      'Password Set Successfully'
    );

    fireEvent.click(screen.getByTestId('setup-go-to-login-btn'));
    expect(await screen.findByTestId('login-page')).toBeInTheDocument();
  });

  it('4. shows generic invalid-link message on 400 Invalid setup token and throttle message on 429', async () => {
    render(
      <MemoryRouter initialEntries={['/warehouse/setup?token=bad_token']}>
        <Routes>
          <Route path="/warehouse/setup" element={<WarehouseSetupPage />} />
        </Routes>
      </MemoryRouter>
    );

    fireEvent.change(screen.getByTestId('setup-new-password-input'), {
      target: { value: 'Str0ng!Warehouse#2026' },
    });
    fireEvent.change(screen.getByTestId('setup-confirm-password-input'), {
      target: { value: 'Str0ng!Warehouse#2026' },
    });

    // 400 Invalid setup token
    apiRequest.mockImplementationOnce(async () => {
      const err = new Error('Invalid setup token.');
      err.status = 400;
      err.data = { detail: 'Invalid setup token.' };
      throw err;
    });

    fireEvent.click(screen.getByTestId('setup-submit-btn'));

    expect(await screen.findByTestId('setup-invalid-link-error')).toHaveTextContent(
      'This link is invalid or has expired. Ask your admin for a new one.'
    );

    // 429 Throttled
    apiRequest.mockImplementationOnce(async () => {
      const err = new Error('Request was throttled.');
      err.status = 429;
      err.data = { detail: 'Request was throttled.' };
      throw err;
    });

    fireEvent.click(screen.getByTestId('setup-submit-btn'));

    expect(await screen.findByTestId('setup-throttle-error')).toHaveTextContent(
      'Too many attempts, please try again later.'
    );
  });
});

