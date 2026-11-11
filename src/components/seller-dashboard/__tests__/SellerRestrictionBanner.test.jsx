import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import SellerRestrictionBanner from '../SellerRestrictionBanner';
import SellerSettlementsView from '../subviews/SellerSettlementsView';
import { apiRequest } from '../../../utils/api';
import { ToastProvider } from '../../../context/ToastContext';

vi.mock('../../../utils/api', () => ({
  apiRequest: vi.fn(),
}));

describe('SellerRestrictionBanner & Seller Control History', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('1. renders nothing when neither selling nor withdrawals are restricted (may_sell=true, can_withdraw=true)', () => {
    const activeProfile = {
      id: 8,
      store_name: 'Acme Demo Store (8)',
      onboarding_status: 'store_published',
      operational_state: 'active',
      can_sell: true,
      can_withdraw: true,
      may_sell: true,
      control_reason: null,
    };

    const { container } = render(<SellerRestrictionBanner vendorProfile={activeProfile} />);
    expect(container.firstChild).toBeNull();
    expect(screen.queryByTestId('seller-restriction-banner')).not.toBeInTheDocument();
  });

  it('2. renders restriction banner when suspended (may_sell=false) with seller-visible control_reason and policy notes', () => {
    const suspendedProfile = {
      id: 8,
      store_name: 'Acme Demo Store (8)',
      onboarding_status: 'store_published',
      operational_state: 'suspended',
      can_sell: false,
      can_withdraw: true,
      may_sell: false,
      control_reason: 'LIVE PROOF, IGNORE',
    };

    render(<SellerRestrictionBanner vendorProfile={suspendedProfile} />);

    expect(screen.getByTestId('seller-restriction-banner')).toBeInTheDocument();
    expect(screen.getByTestId('banner-operational-state')).toHaveTextContent('State: suspended');
    expect(screen.getByTestId('banner-selling-switch')).toHaveTextContent('Selling: Blocked');
    expect(screen.getByTestId('banner-withdrawals-switch')).toHaveTextContent('Withdrawals: Allowed');
    expect(screen.getByTestId('seller-restriction-reason')).toHaveTextContent('LIVE PROOF, IGNORE');
    expect(screen.getByText(/vendor_cannot_sell/i)).toBeInTheDocument();
    expect(screen.getByText(/Settled earnings in your seller wallet remain your property/i)).toBeInTheDocument();
  });

  it('3. renders withdrawal restriction banner when can_withdraw=false and loads seller-safe control history without private notes', async () => {
    apiRequest.mockImplementation(async (url) => {
      if (url.startsWith('/api/vendors/me/control-history/')) {
        return {
          count: 1,
          next: null,
          previous: null,
          results: [
            {
              id: 42,
              occurred_at: '2026-11-10T12:00:00Z',
              action: 'block_withdrawals',
              old_values: { operational_state: 'active', can_sell: true, can_withdraw: true },
              new_values: { operational_state: 'active', can_sell: true, can_withdraw: false },
              reason: 'LIVE PROOF, IGNORE',
            },
          ],
        };
      }
      return {};
    });

    const blockedWithdrawProfile = {
      id: 8,
      store_name: 'Acme Demo Store (8)',
      onboarding_status: 'store_published',
      operational_state: 'active',
      can_sell: true,
      can_withdraw: false,
      may_sell: true,
      control_reason: 'LIVE PROOF, IGNORE',
    };

    render(<SellerRestrictionBanner vendorProfile={blockedWithdrawProfile} />);

    expect(screen.getByTestId('seller-restriction-banner')).toBeInTheDocument();
    expect(screen.getByTestId('banner-withdrawals-switch')).toHaveTextContent('Withdrawals: Blocked');
    expect(screen.getByText(/Requests already in flight continue unchanged/i)).toBeInTheDocument();

    // Open seller control history
    fireEvent.click(screen.getByTestId('toggle-seller-control-history'));

    expect(await screen.findByTestId('seller-history-row-42')).toHaveTextContent('LIVE PROOF, IGNORE');
    expect(screen.queryByText(/Private Note/i)).not.toBeInTheDocument();
  });

  it('4. displays the exact server withdrawals_blocked error when seller attempts a withdrawal while blocked', async () => {
    apiRequest.mockImplementation(async (url, options) => {
      if (url === '/api/vendors/me/') {
        return {
          id: 8,
          store_name: 'Acme Demo Store (8)',
          onboarding_status: 'store_published',
          operational_state: 'active',
          can_sell: true,
          can_withdraw: false,
          may_sell: true,
          control_reason: 'LIVE PROOF, IGNORE',
        };
      }
      if (url === '/api/settlements/wallet/') {
        return {
          wallet: { cached_balance: '500.00' },
          available_balance: '500.00',
          reserved_for_withdrawals: '0.00',
          total_paid_out: '0.00',
          earnings_breakdown: {},
          payout_details: { configured: true, is_verified: true, method: 'upi' },
          recent_ledger_entries: [],
        };
      }
      if (url === '/api/settlements/statements/') return [];
      if (url === '/api/settlements/withdrawals/' && (!options || !options.method)) return [];
      if (url === '/api/settlements/withdrawals/' && options?.method === 'POST') {
        const err = new Error('Bad Request');
        err.status = 400;
        err.data = {
          code: 'withdrawals_blocked',
          detail: 'New withdrawal requests are blocked for this seller.',
        };
        throw err;
      }
      return {};
    });

    render(
      <ToastProvider>
        <SellerSettlementsView />
      </ToastProvider>
    );

    const withdrawBtn = await screen.findByRole('button', { name: /Withdraw Funds/i });
    await waitFor(() => expect(withdrawBtn).not.toBeDisabled());
    fireEvent.click(withdrawBtn);

    const reqBtn = await screen.findByRole('button', { name: /Request Withdrawal/i });
    fireEvent.click(reqBtn);

    expect(await screen.findByTestId('withdrawal-error-alert')).toHaveTextContent(
      'New withdrawal requests are blocked for this seller. (withdrawals_blocked)'
    );
  });
});

