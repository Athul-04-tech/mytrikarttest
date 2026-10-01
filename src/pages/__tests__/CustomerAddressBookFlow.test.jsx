import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import AddressBookSection from '../../components/profile/AddressBookSection';
import CustomerAddressFormPage from '../CustomerAddressFormPage';
import * as apiModule from '../../utils/api';

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

const mockToast = {
  success: vi.fn(),
  error: vi.fn(),
  info: vi.fn()
};

vi.mock('../../context/ToastContext', () => ({
  useToast: () => mockToast
}));

describe('Customer Address Book & Dedicated Address Form Page Flow', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  const sampleAddress = {
    id: 15,
    label: 'Home',
    full_name: 'Anjali Gupta',
    phone_number: '9876543210',
    address_line1: 'Flat 302, Green Park Apartments',
    address_line2: 'Near Central Mall',
    city: 'Mumbai',
    state: 'Maharashtra',
    postal_code: '400001',
    country: 'IN',
    address_type: 'both',
    is_default: true
  };

  it('1. AddressBookSection fetches real saved addresses from GET /api/customers/addresses/', async () => {
    vi.mocked(apiModule.apiRequest).mockResolvedValue([sampleAddress]);

    render(
      <MemoryRouter>
        <AddressBookSection />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Anjali Gupta')).toBeTruthy();
      expect(screen.getByText(/Flat 302, Green Park Apartments/)).toBeTruthy();
      expect(screen.getByText('Default Address')).toBeTruthy();
    });

    expect(apiModule.apiRequest).toHaveBeenCalledWith('/api/customers/addresses/');
  });

  it('2. CustomerAddressFormPage renders Add Mode and submits POST /api/customers/addresses/ with real schema', async () => {
    vi.mocked(apiModule.apiRequest).mockResolvedValue({ id: 20, ...sampleAddress });

    render(
      <MemoryRouter initialEntries={['/account/addresses/new']}>
        <Routes>
          <Route path="/account/addresses/new" element={<CustomerAddressFormPage />} />
          <Route path="/profile/addresses" element={<div>Address Book List</div>} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Add New Saved Address')).toBeTruthy();
    });

    // Fill Form
    fireEvent.change(screen.getByLabelText(/Receiver Full Name/i), { target: { value: 'Rohan Sharma' } });
    fireEvent.change(screen.getByLabelText(/Contact Number/i), { target: { value: '9123456789' } });
    fireEvent.change(screen.getByLabelText(/Flat, House No/i), { target: { value: '12, Ocean View' } });
    fireEvent.change(screen.getByLabelText(/City/i), { target: { value: 'Pune' } });
    fireEvent.change(screen.getByLabelText(/State/i), { target: { value: 'Maharashtra' } });
    fireEvent.change(screen.getByLabelText(/PIN \/ Postal Code/i), { target: { value: '411001' } });

    // Verify single is_default checkbox exists (NOT two fake default checkboxes)
    const defaultCheckbox = screen.getByLabelText(/Make this my default address/i);
    expect(defaultCheckbox).toBeTruthy();
    fireEvent.click(defaultCheckbox);

    // Submit
    const saveBtn = screen.getByRole('button', { name: /Save New Address/i });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(apiModule.apiRequest).toHaveBeenCalledWith(
        '/api/customers/addresses/',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            label: 'Home',
            full_name: 'Rohan Sharma',
            phone_number: '9123456789',
            address_line1: '12, Ocean View',
            address_line2: '',
            city: 'Pune',
            state: 'Maharashtra',
            postal_code: '411001',
            country: 'IN',
            address_type: 'both',
            is_default: true
          })
        })
      );
      expect(screen.getByText('Address Book List')).toBeTruthy();
    });
  });

  it('3. CustomerAddressFormPage renders Edit Mode, fetches details via GET, and submits PATCH /api/customers/addresses/:id/', async () => {
    vi.mocked(apiModule.apiRequest).mockImplementation((endpoint, options) => {
      if (endpoint === '/api/customers/addresses/15/' && !options?.method) {
        return Promise.resolve(sampleAddress);
      }
      if (endpoint === '/api/customers/addresses/15/' && options?.method === 'PATCH') {
        return Promise.resolve({ ...sampleAddress, full_name: 'Anjali Sharma' });
      }
      return Promise.resolve([]);
    });

    render(
      <MemoryRouter initialEntries={['/account/addresses/15/edit']}>
        <Routes>
          <Route path="/account/addresses/:id/edit" element={<CustomerAddressFormPage />} />
          <Route path="/profile/addresses" element={<div>Address Book List</div>} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByDisplayValue('Anjali Gupta')).toBeTruthy();
      expect(screen.getByDisplayValue('400001')).toBeTruthy();
    });

    // Edit Name
    fireEvent.change(screen.getByLabelText(/Receiver Full Name/i), { target: { value: 'Anjali Sharma' } });

    // Submit
    const saveBtn = screen.getByRole('button', { name: /Save Address Changes/i });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(apiModule.apiRequest).toHaveBeenCalledWith(
        '/api/customers/addresses/15/',
        expect.objectContaining({
          method: 'PATCH',
          body: expect.stringContaining('"full_name":"Anjali Sharma"')
        })
      );
    });
  });

  it('4. AddressBookSection supports setting default via POST /api/customers/addresses/:id/default/', async () => {
    const nonDefaultAddress = { ...sampleAddress, id: 99, is_default: false };
    vi.mocked(apiModule.apiRequest).mockImplementation((endpoint, options) => {
      if (options?.method === 'POST' && endpoint.includes('/default/')) {
        return Promise.resolve({ id: 99, is_default: true });
      }
      return Promise.resolve([nonDefaultAddress]);
    });

    render(
      <MemoryRouter>
        <AddressBookSection />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Set as Default')).toBeTruthy();
    });

    fireEvent.click(screen.getByText('Set as Default'));

    await waitFor(() => {
      expect(apiModule.apiRequest).toHaveBeenCalledWith(
        '/api/customers/addresses/99/default/',
        { method: 'POST' }
      );
    });
  });

  it('5. AddressBookSection supports deleting address via DELETE /api/customers/addresses/:id/', async () => {
    vi.mocked(apiModule.apiRequest).mockImplementation((endpoint, options) => {
      if (options?.method === 'DELETE') {
        return Promise.resolve({});
      }
      return Promise.resolve([sampleAddress]);
    });

    vi.spyOn(window, 'confirm').mockReturnValue(true);

    render(
      <MemoryRouter>
        <AddressBookSection />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByLabelText('Delete address')).toBeTruthy();
    });

    fireEvent.click(screen.getByLabelText('Delete address'));

    await waitFor(() => {
      expect(apiModule.apiRequest).toHaveBeenCalledWith(
        '/api/customers/addresses/15/',
        { method: 'DELETE' }
      );
    });
  });
});
