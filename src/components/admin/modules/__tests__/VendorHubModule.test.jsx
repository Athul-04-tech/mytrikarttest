import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import VendorHubModule from '../VendorHubModule';
import { apiRequest } from '../../../../utils/api';
import { ToastProvider } from '../../../../context/ToastContext';
import AuthContext from '../../../../context/AuthContext';

vi.mock('../../../../utils/api', () => ({
  apiRequest: vi.fn(),
  fetchProtectedFile: vi.fn(),
}));

const mockVendors = [
  {
    id: 1,
    business_name: 'Acme Trade Pvt Ltd',
    store_name: 'Acme Demo Store',
    store_slug: 'acme-demo-store',
    country: 'IN',
    tax_id: '27ABCDE1234F1Z5',
    registration_number: 'REG-12345',
    business_type: 'company',
    is_women_owned: true,
    support_email: 'vendor@acme.com',
    support_phone: '+919876543210',
    onboarding_status: 'under_review',
    onboarding_review_reason: '',
    operational_state: 'active',
    can_sell: true,
    can_withdraw: true,
    may_sell: false,
    control_reason: null,
    documents: [
      { id: 101, document_type: 'aadhaar', status: 'verified', rejection_reason: '', uploaded_at: '2026-09-20' },
      { id: 102, document_type: 'pan', status: 'pending', rejection_reason: '', uploaded_at: '2026-09-20' },
    ],
  },
  {
    id: 2,
    business_name: 'Royal Goods Ltd',
    store_name: 'Royal',
    store_slug: 'royal-store',
    country: 'IN',
    tax_id: '29AADFV7589CAZX',
    registration_number: 'REG-99999',
    business_type: 'individual',
    is_women_owned: false,
    support_email: 'royal@example.com',
    support_phone: '+919000000000',
    onboarding_status: 'approved',
    onboarding_review_reason: '',
    operational_state: 'active',
    can_sell: true,
    can_withdraw: true,
    may_sell: true,
    control_reason: null,
    documents: [],
  },
];

function renderWithAuth(userObj) {
  return render(
    <AuthContext.Provider value={{ currentUser: userObj, isLoggedIn: Boolean(userObj) }}>
      <ToastProvider>
        <VendorHubModule />
      </ToastProvider>
    </AuthContext.Provider>
  );
}

describe('VendorHubModule — Real Backend API Wiring & Governance Flow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('1. fetches and renders real merchant list from GET /api/vendors/admin/ with operational state and switches', async () => {
    apiRequest.mockImplementation(async (url) => {
      if (url === '/api/vendors/admin/') return mockVendors;
      if (url === '/api/vendors/2/control-history/?page=1') {
        return {
          count: 1,
          next: null,
          previous: null,
          results: [
            {
              id: 10,
              vendor: 2,
              actor: 50,
              occurred_at: '2026-11-09T18:26:17.498389+05:30',
              action: 'reactivate',
              old_values: { operational_state: 'suspended', can_sell: false, can_withdraw: true },
              new_values: { operational_state: 'active', can_sell: true, can_withdraw: true },
              reason: 'LIVE PROOF, IGNORE',
              seller_visible: true,
              private_note: 'Internal check',
            },
          ],
        };
      }
      return { count: 0, results: [] };
    });

    render(
      <ToastProvider>
        <VendorHubModule />
      </ToastProvider>
    );

    expect(await screen.findByText('Acme Trade Pvt Ltd')).toBeInTheDocument();
    expect(screen.getByText('Royal Goods Ltd')).toBeInTheDocument();

    expect(apiRequest).toHaveBeenCalledWith('/api/vendors/admin/');
    expect(screen.getByText('under_review')).toBeInTheDocument();
    expect(screen.getByText('approved')).toBeInTheDocument();
    expect(screen.getByText('1 / 2 Verified')).toBeInTheDocument();

    expect(screen.getByTestId('vendor-state-2')).toHaveTextContent('State: active');
    expect(screen.getByTestId('vendor-sell-switch-2')).toHaveTextContent('Selling: On');
    expect(screen.getByTestId('vendor-withdraw-switch-2')).toHaveTextContent('Withdrawals: On');

    await waitFor(() => {
      expect(screen.getByTestId('vendor-last-change-2')).toHaveTextContent('Actor #50');
    });
  });

  it('2. opens review modal, exposes document verification and enforces reason field on reject', async () => {
    apiRequest.mockImplementation(async (url) => {
      if (url === '/api/vendors/admin/') return mockVendors;
      if (url === '/api/vendors/1/review/') {
        return {
          ...mockVendors[0],
          onboarding_status: 'rejected',
          onboarding_review_reason: 'Tax document details mismatch.',
        };
      }
      return { count: 0, results: [] };
    });

    render(
      <ToastProvider>
        <VendorHubModule />
      </ToastProvider>
    );

    expect(await screen.findByText('Acme Trade Pvt Ltd')).toBeInTheDocument();

    const reviewBtns = screen.getAllByText('Review Merchant');
    fireEvent.click(reviewBtns[0]);

    expect(screen.getByText('MERCHANT ONBOARDING GOVERNANCE')).toBeInTheDocument();
    expect(screen.getByText('Uploaded KYC & Governance Documents')).toBeInTheDocument();

    // Unapproved vendor should show guidance that Reject is for unapproved vendors
    expect(screen.getByTestId('unapproved-suspend-notice')).toHaveTextContent(
      /Suspend is not for unapproved vendors/i
    );

    // Select Reject Merchant action
    const rejectActionBtn = screen.getByText('Reject Merchant');
    fireEvent.click(rejectActionBtn);

    const submitBtn = screen.getByText('Submit Staff Decision');
    expect(submitBtn).toBeDisabled();

    const reasonInput = screen.getByPlaceholderText(/State exact reasons for rejection/i);
    fireEvent.change(reasonInput, { target: { value: 'Tax document details mismatch.' } });

    expect(submitBtn).not.toBeDisabled();
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(apiRequest).toHaveBeenCalledWith('/api/vendors/1/review/', {
        method: 'POST',
        body: JSON.stringify({
          action: 'reject',
          reason: 'Tax document details mismatch.',
        }),
      });
    });
  });

  it('3. verifies individual document via POST /api/vendors/documents/<doc_id>/review/', async () => {
    apiRequest.mockImplementation(async (url) => {
      if (url === '/api/vendors/admin/') return mockVendors;
      if (url === '/api/vendors/documents/102/review/') {
        return {
          id: 102,
          document_type: 'pan',
          status: 'verified',
          rejection_reason: '',
          uploaded_at: '2026-09-20',
        };
      }
      return { count: 0, results: [] };
    });

    render(
      <ToastProvider>
        <VendorHubModule />
      </ToastProvider>
    );

    expect(await screen.findByText('Acme Trade Pvt Ltd')).toBeInTheDocument();

    fireEvent.click(screen.getAllByText('Review Merchant')[0]);

    const verifyBtn = screen.getByText('Verify');
    fireEvent.click(verifyBtn);

    await waitFor(() => {
      expect(apiRequest).toHaveBeenCalledWith('/api/vendors/documents/102/review/', {
        method: 'POST',
        body: JSON.stringify({ status: 'verified' }),
      });
    });
  });

  it('4. displays server field error for blank reason (400), unapproved suspend (400), and repeat action (409) with no raw keys', async () => {
    let callMode = 'blank_reason';

    apiRequest.mockImplementation(async (url) => {
      if (url === '/api/vendors/admin/') return mockVendors;
      if (url === '/api/vendors/2/suspend/') {
        if (callMode === 'blank_reason') {
          const err = new Error('Bad Request');
          err.status = 400;
          err.data = { reason: ['This field may not be blank.'] };
          throw err;
        }
        if (callMode === 'repeat_409') {
          const err = new Error('Conflict');
          err.status = 409;
          err.data = { detail: 'Vendor is already suspended.' };
          throw err;
        }
      }
      if (url === '/api/vendors/1/suspend/') {
        const err = new Error('Bad Request');
        err.status = 400;
        err.data = { detail: 'Unapproved vendors cannot be suspended; reject the onboarding application instead.' };
        throw err;
      }
      return { count: 0, results: [] };
    });

    renderWithAuth({ id: 50, username: 'admin_test', is_staff: true, is_superuser: false });

    expect(await screen.findByText('Royal Goods Ltd')).toBeInTheDocument();

    // Open approved vendor (#2)
    fireEvent.click(screen.getByTestId('review-vendor-btn-2'));

    // 1) Submit with blank reason -> 400 under reason input
    fireEvent.click(screen.getByTestId('control-submit-btn'));
    expect(await screen.findByTestId('control-error-reason')).toHaveTextContent('This field may not be blank.');

    // Typing clears field error
    fireEvent.change(screen.getByTestId('control-reason-input'), {
      target: { value: 'LIVE PROOF, IGNORE' },
    });
    expect(screen.queryByTestId('control-error-reason')).not.toBeInTheDocument();

    // 2) Submit repeat action -> 409 conflict detail banner
    callMode = 'repeat_409';
    fireEvent.click(screen.getByTestId('control-submit-btn'));
    expect(await screen.findByTestId('control-general-error')).toHaveTextContent('Vendor is already suspended.');

    // 3) Close modal, open unapproved vendor (#1), verify server 400 unapproved error
    fireEvent.click(screen.getByTestId('close-vendor-modal-btn'));
    fireEvent.click(screen.getByTestId('review-vendor-btn-1'));
    fireEvent.click(screen.getByTestId('control-btn-suspend-unapproved'));
    fireEvent.change(screen.getByTestId('control-reason-input'), {
      target: { value: 'LIVE PROOF, IGNORE' },
    });
    fireEvent.click(screen.getByTestId('control-submit-btn'));

    expect(await screen.findByTestId('control-general-error')).toHaveTextContent(
      'Unapproved vendors cannot be suspended; reject the onboarding application instead.'
    );
  });

  it('5. disables withdrawal block/release for normal staff and enables them for superuser with control history refresh', async () => {
    apiRequest.mockImplementation(async (url) => {
      if (url === '/api/vendors/admin/') return mockVendors;
      if (url === '/api/vendors/2/withdrawals/block/') {
        return {
          vendor: { ...mockVendors[1], can_withdraw: false },
          event: {
            id: 77,
            vendor: 2,
            actor: 79,
            occurred_at: '2026-11-10T10:00:00Z',
            action: 'block_withdrawals',
            old_values: { operational_state: 'active', can_sell: true, can_withdraw: true },
            new_values: { operational_state: 'active', can_sell: true, can_withdraw: false },
            reason: 'LIVE PROOF, IGNORE',
            seller_visible: true,
            private_note: 'Superuser audit note',
          },
        };
      }
      if (url.startsWith('/api/vendors/2/control-history/')) {
        return {
          count: 1,
          next: null,
          previous: null,
          results: [
            {
              id: 77,
              vendor: 2,
              actor: 79,
              occurred_at: '2026-11-10T10:00:00Z',
              action: 'block_withdrawals',
              old_values: { operational_state: 'active', can_sell: true, can_withdraw: true },
              new_values: { operational_state: 'active', can_sell: true, can_withdraw: false },
              reason: 'LIVE PROOF, IGNORE',
              seller_visible: true,
              private_note: 'Superuser audit note',
            },
          ],
        };
      }
      return { count: 0, results: [] };
    });

    // Staff view first: withdrawal buttons disabled + read-only note
    const { unmount } = renderWithAuth({
      id: 50,
      username: 'admin_test',
      is_staff: true,
      is_superuser: false,
    });

    expect(await screen.findByText('Royal Goods Ltd')).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('review-vendor-btn-2'));

    expect(screen.getByTestId('staff-withdrawal-readonly-note')).toBeInTheDocument();
    expect(screen.getByTestId('control-btn-block_withdrawals')).toBeDisabled();
    expect(screen.getByTestId('control-btn-release_withdrawals')).toBeDisabled();

    unmount();

    // Superuser view: withdrawal buttons enabled + executes POST /withdrawals/block/
    renderWithAuth({
      id: 79,
      username: 'settlement_admin',
      is_staff: true,
      is_superuser: true,
    });

    expect(await screen.findByText('Royal Goods Ltd')).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('review-vendor-btn-2'));

    expect(screen.queryByTestId('staff-withdrawal-readonly-note')).not.toBeInTheDocument();
    const blockBtn = screen.getByTestId('control-btn-block_withdrawals');
    expect(blockBtn).not.toBeDisabled();

    fireEvent.click(blockBtn);
    fireEvent.change(screen.getByTestId('control-reason-input'), {
      target: { value: 'LIVE PROOF, IGNORE' },
    });
    fireEvent.click(screen.getByTestId('control-seller-visible-checkbox'));
    fireEvent.change(screen.getByTestId('control-private-note-input'), {
      target: { value: 'Superuser audit note' },
    });
    fireEvent.click(screen.getByTestId('control-submit-btn'));

    await waitFor(() => {
      expect(apiRequest).toHaveBeenCalledWith('/api/vendors/2/withdrawals/block/', {
        method: 'POST',
        body: JSON.stringify({
          reason: 'LIVE PROOF, IGNORE',
          seller_visible: true,
          private_note: 'Superuser audit note',
        }),
      });
    });

    expect(await screen.findByTestId('control-success-banner')).toBeInTheDocument();
    expect(screen.getByTestId('admin-history-row-77')).toHaveTextContent('Superuser audit note');
  });
});
