import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import UserManagementModule from '../UserManagementModule';
import { apiRequest, ApiError } from '../../../../utils/api';
import { ToastProvider } from '../../../../context/ToastContext';
import AuthContext from '../../../../context/AuthContext';

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

const mockUsers = [
  {
    id: 101,
    username: 'john_customer',
    email: 'john@example.com',
    first_name: 'John',
    last_name: 'Doe',
    role: 'customer',
    is_staff: false,
    phone_number: '+919876543210',
    country: 'IN',
    is_phone_verified: true,
    is_email_verified: true,
    is_active: true,
    date_joined: '2026-09-01T12:00:00Z',
  },
  {
    id: 102,
    username: 'staff_admin',
    email: 'staff@mytrikart.com',
    first_name: 'Staff',
    last_name: 'User',
    role: 'admin',
    is_staff: true,
    phone_number: '+919000000000',
    country: 'IN',
    is_phone_verified: false,
    is_email_verified: true,
    is_active: true,
    date_joined: '2026-08-15T10:00:00Z',
  }
];

const paginatedResponse = {
  count: 2,
  next: null,
  previous: null,
  results: mockUsers
};

describe('UserManagementModule — Hardened Accounts API Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    apiRequest.mockImplementation(async (url) => {
      if (url.startsWith('/api/accounts/users/')) return paginatedResponse;
      return {};
    });
  });

  it('1. handles paginated {count, next, previous, results} structure and renders user list', async () => {
    render(
      <ToastProvider>
        <UserManagementModule defaultTab="customers" />
      </ToastProvider>
    );

    expect(await screen.findByText('John Doe')).toBeInTheDocument();
    expect(screen.queryByText('Staff User')).not.toBeInTheDocument();
    expect(screen.getByText((content, element) => element.textContent === 'Showing 1 to 2 of 2 Accounts')).toBeInTheDocument();

    expect(apiRequest).toHaveBeenCalledWith('/api/accounts/users/?page=1&page_size=25');
  });

  it('2. uses is_staff for staff tab filtering and executes PATCH /api/accounts/users/<id>/ on save', async () => {
    render(
      <ToastProvider>
        <UserManagementModule defaultTab="staff" />
      </ToastProvider>
    );

    expect(await screen.findByText('Staff User')).toBeInTheDocument();

    const editBtns = screen.getAllByTitle('Edit User');
    fireEvent.click(editBtns[0]);

    expect(screen.getByText(/Edit User: staff_admin/i)).toBeInTheDocument();

    const firstNameInput = screen.getByDisplayValue('Staff');
    fireEvent.change(firstNameInput, { target: { value: 'StaffModified' } });

    apiRequest.mockImplementationOnce(async (url, options) => {
      if (url === '/api/accounts/users/102/' && options.method === 'PATCH') {
        return { ...mockUsers[1], first_name: 'StaffModified' };
      }
      return {};
    });

    const saveBtn = screen.getByText('Save User');
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(apiRequest).toHaveBeenCalledWith('/api/accounts/users/102/', expect.objectContaining({
        method: 'PATCH',
        body: expect.stringContaining('"first_name":"StaffModified"')
      }));
    });
  });

  it('3. surfaces 409 Conflict deletion error verbatim and highlights soft-deactivation option', async () => {
    apiRequest.mockImplementation(async (url, options) => {
      if (options?.method === 'DELETE') {
        throw new ApiError("Conflict", 409, {
          detail: "This account is referenced by protected records and cannot be deleted. Deactivate it by setting is_active=false instead."
        });
      }
      if (url.startsWith('/api/accounts/users/')) return paginatedResponse;
      return {};
    });

    render(
      <ToastProvider>
        <UserManagementModule defaultTab="all" />
      </ToastProvider>
    );

    expect(await screen.findByText('John Doe')).toBeInTheDocument();

    const deleteBtns = screen.getAllByTitle('Delete User');
    fireEvent.click(deleteBtns[0]);

    const hardDeleteBtn = screen.getByText('Permanently DELETE User Account');
    fireEvent.click(hardDeleteBtn);

    await waitFor(() => {
      expect(screen.getByText('Deletion Refused by Backend API:')).toBeInTheDocument();
    });
    expect(screen.getAllByText(/This account is referenced by protected records/i).length).toBeGreaterThan(0);
  });

  it('4. gates role and password controls for non-superusers on admin rows', async () => {
    render(
      <ToastProvider>
        <AuthContext.Provider value={{ currentUser: { username: 'admin_test', role: 'admin', is_superuser: false } }}>
          <UserManagementModule defaultTab="all" />
        </AuthContext.Provider>
      </ToastProvider>
    );

    expect(await screen.findByText('Standard Admin Privileges')).toBeInTheDocument();

    // Open edit modal for admin user (mockUsers[1] is staff_admin)
    const editBtns = screen.getAllByTitle('Edit User');
    fireEvent.click(editBtns[1]);

    expect(screen.getByText(/Role and administrative privilege modifications are reserved for Superusers/i)).toBeInTheDocument();
    expect(screen.getByText('Staff access is derived from platform role and cannot be edited separately.')).toBeInTheDocument();
    expect(screen.getByText(/Password Reset Disabled/i)).toBeInTheDocument();
  });
});
