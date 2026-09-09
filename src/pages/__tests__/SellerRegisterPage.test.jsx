import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import SellerRegisterPage from '../SellerRegisterPage';
import * as apiModule from '../../utils/api';
import * as AuthContextModule from '../../context/AuthContext';

// Mock api utilities
vi.mock('../../utils/api', () => ({
  apiRequest: vi.fn(),
  ApiError: class ApiError extends Error {
    constructor(message, status, data) {
      super(message);
      this.status = status;
      this.data = data;
    }
  }
}));

// Mock AuthContext
vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    login: vi.fn().mockResolvedValue({ access: 'fake-token' }),
    currentUser: null,
    isLoggedIn: false
  })
}));

describe('SellerRegisterPage — Phone Number Wiring & Error Handling', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  // TASK C - Test 1: Payload includes top-level phone_number: formData.mobile
  it('1. submits phone_number as a top-level field in POST /api/vendors/register/ payload', async () => {
    let capturedPayload = null;
    vi.mocked(apiModule.apiRequest).mockImplementation((endpoint, options) => {
      if (endpoint === '/api/vendors/register/') {
        capturedPayload = JSON.parse(options.body);
        return Promise.resolve({ id: 1, store_name: 'Test Store' });
      }
      return Promise.resolve({});
    });

    render(
      <MemoryRouter initialEntries={['/seller/register']}>
        <SellerRegisterPage />
      </MemoryRouter>
    );

    // Step 1: Personal Info mobile
    fireEvent.change(screen.getByPlaceholderText('10-digit mobile number'), { target: { value: '9876543210' } });
    fireEvent.change(screen.getByPlaceholderText('aarav@business.com'), { target: { value: 'aarav@business.com' } });
    fireEvent.change(screen.getByPlaceholderText('e.g. aarav_sharma_crafts'), { target: { value: 'aarav_merchant' } });

    // Jump to Step 7 using reviewer step switcher
    fireEvent.click(screen.getByText('7. Agreement'));

    // Accept terms
    const checkbox = screen.getByRole('checkbox');
    fireEvent.click(checkbox);

    // Submit form
    fireEvent.click(screen.getByText('Submit Seller Registration'));

    await waitFor(() => {
      expect(capturedPayload).not.toBeNull();
    });

    // TASK A Verification: top-level phone_number exists and matches formData.mobile
    expect(capturedPayload.phone_number).toBe('9876543210');
    // TASK C Verification: profile.support_phone fallback is preserved
    expect(capturedPayload.profile.support_phone).toBe('9876543210');
  });

  // TASK C - Test 2: phone_number API validation error is mapped to Step 1 Mobile field
  it('2. maps phone_number API validation error to Step 1 Mobile field and navigates user back to Step 1', async () => {
    vi.mocked(apiModule.apiRequest).mockImplementation((endpoint) => {
      if (endpoint === '/api/vendors/register/') {
        const error = new apiModule.ApiError('HTTP 400 Error', 400, {
          phone_number: ['Vendor profile with this phone number already exists.']
        });
        return Promise.reject(error);
      }
      return Promise.resolve({});
    });

    render(
      <MemoryRouter initialEntries={['/seller/register']}>
        <SellerRegisterPage />
      </MemoryRouter>
    );

    // Jump to Step 7, accept terms and submit
    fireEvent.click(screen.getByText('7. Agreement'));
    const checkbox = screen.getByRole('checkbox');
    fireEvent.click(checkbox);
    fireEvent.click(screen.getByText('Submit Seller Registration'));

    await waitFor(() => {
      // User is auto-navigated back to Step 1
      expect(screen.getByRole('heading', { level: 2, name: 'Personal Information' })).toBeTruthy();
      // Mobile input displays the phone_number error message from server
      expect(screen.getByText('Vendor profile with this phone number already exists.')).toBeTruthy();
    });
  });

  // TASK C - Test 3: support_phone custom value preservation
  it('3. uses custom support_phone if provided, preserving fallback behavior', async () => {
    let capturedPayload = null;
    vi.mocked(apiModule.apiRequest).mockImplementation((endpoint, options) => {
      if (endpoint === '/api/vendors/register/') {
        capturedPayload = JSON.parse(options.body);
        return Promise.resolve({ id: 2 });
      }
      return Promise.resolve({});
    });

    render(
      <MemoryRouter initialEntries={['/seller/register']}>
        <SellerRegisterPage />
      </MemoryRouter>
    );

    // Step 1: Personal Info mobile
    fireEvent.change(screen.getByPlaceholderText('10-digit mobile number'), { target: { value: '9876543210' } });

    // Step 4: Contact Info - Provide custom support phone
    fireEvent.click(screen.getByText('4. Contact'));
    fireEvent.change(screen.getByPlaceholderText('+91 8000 123 456'), { target: { value: '18001234567' } });

    // Submit via Step 7
    fireEvent.click(screen.getByText('7. Agreement'));
    const checkbox = screen.getByRole('checkbox');
    fireEvent.click(checkbox);
    fireEvent.click(screen.getByText('Submit Seller Registration'));

    await waitFor(() => {
      expect(capturedPayload).not.toBeNull();
    });

    // Top-level phone_number is personal mobile
    expect(capturedPayload.phone_number).toBe('9876543210');
    // Profile support_phone is custom support phone
    expect(capturedPayload.profile.support_phone).toBe('18001234567');
  });
});
