import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import VendorHubModule from '../VendorHubModule';
import { apiRequest } from '../../../../utils/api';
import { ToastProvider } from '../../../../context/ToastContext';

vi.mock('../../../../utils/api', () => ({
  apiRequest: vi.fn(),
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
    documents: [],
  }
];

describe('VendorHubModule — Real Backend API Wiring & Governance Flow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('1. fetches and renders real merchant list from GET /api/vendors/admin/', async () => {
    apiRequest.mockImplementation(async (url) => {
      if (url === '/api/vendors/admin/') return mockVendors;
      return {};
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
  });

  it('2. opens review modal, exposes document verification and enforces reason field on reject', async () => {
    apiRequest.mockImplementation(async (url, options) => {
      if (url === '/api/vendors/admin/') return mockVendors;
      if (url === '/api/vendors/1/review/') {
        return {
          ...mockVendors[0],
          onboarding_status: 'rejected',
          onboarding_review_reason: 'Tax document details mismatch.',
        };
      }
      return {};
    });

    render(
      <ToastProvider>
        <VendorHubModule />
      </ToastProvider>
    );

    expect(await screen.findByText('Acme Trade Pvt Ltd')).toBeInTheDocument();

    // Click Review Merchant button for Acme Trade Pvt Ltd
    const reviewBtns = screen.getAllByText('Review Merchant');
    fireEvent.click(reviewBtns[0]);

    expect(screen.getByText('MERCHANT ONBOARDING GOVERNANCE')).toBeInTheDocument();
    expect(screen.getByText('Uploaded KYC & Governance Documents')).toBeInTheDocument();

    // Select Reject Merchant action
    const rejectActionBtn = screen.getByText('Reject Merchant');
    fireEvent.click(rejectActionBtn);

    // Submit button should be disabled because reason is empty
    const submitBtn = screen.getByText('Submit Staff Decision');
    expect(submitBtn).toBeDisabled();

    // Fill in rejection reason
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
    apiRequest.mockImplementation(async (url, options) => {
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
      return {};
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
});
