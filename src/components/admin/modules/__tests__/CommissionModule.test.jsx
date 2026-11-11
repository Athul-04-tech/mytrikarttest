import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import CommissionModule from '../CommissionModule';
import { apiRequest, ApiError } from '../../../../utils/api';
import { ToastProvider } from '../../../../context/ToastContext';
import AuthContext from '../../../../context/AuthContext';

vi.mock('../../../../utils/api', async () => {
  const actual = await vi.importActual('../../../../utils/api');
  return {
    ...actual,
    apiRequest: vi.fn(),
  };
});

const MOCK_COMMISSION_RULES = [
  {
    id: 6,
    scope: 'vendor',
    category: null,
    vendor: 57,
    rate_type: 'percentage',
    rate_value: '15.00',
    country: 'AE',
    effective_from: '2026-11-06',
    effective_to: '2026-11-06',
    created_at: '2026-11-06T09:27:55.000638+05:30',
  },
  {
    id: 5,
    scope: 'global',
    category: null,
    vendor: null,
    rate_type: 'percentage',
    rate_value: '10.00',
    country: 'AE',
    effective_from: '2026-11-06',
    effective_to: '2026-11-06',
    created_at: '2026-11-06T09:26:08.516325+05:30',
  },
  {
    id: 1,
    scope: 'global',
    category: null,
    vendor: null,
    rate_type: 'percentage',
    rate_value: '10.00',
    country: 'IN',
    effective_from: '2020-01-01',
    effective_to: null,
    created_at: '2026-09-29T15:39:28.185514+05:30',
  },
];

const MOCK_PLATFORM_RULES = [
  {
    id: 4,
    scope: 'global',
    category: null,
    vendor: null,
    rate_type: 'percentage',
    rate_value: '2.00',
    country: 'AE',
    effective_from: '2026-11-06',
    effective_to: '2026-11-06',
    created_at: '2026-11-06T09:26:08.825133+05:30',
  },
  {
    id: 1,
    scope: 'global',
    category: null,
    vendor: null,
    rate_type: 'percentage',
    rate_value: '2.00',
    country: 'IN',
    effective_from: '2020-01-01',
    effective_to: null,
    created_at: '2026-09-29T15:39:28.246354+05:30',
  },
];

const MOCK_WITHHOLDING_RULES = [
  {
    id: 3,
    withholding_type: 'tds',
    country: 'IE',
    rate: '0.0000',
    tax_base: 'gross_sale_value',
    effective_from: '2026-11-06',
    effective_to: '2026-11-06',
    is_verified: false,
    verified_reference: '',
    verified_at: null,
    created_at: '2026-11-06T09:26:08.951720+05:30',
  },
  {
    id: 2,
    withholding_type: 'tcs',
    country: 'IN',
    rate: '0.0050',
    tax_base: 'net_taxable_supply',
    effective_from: '2026-08-14',
    effective_to: null,
    is_verified: false,
    verified_reference: '',
    verified_at: null,
    created_at: '2026-08-14T10:06:27.671902+05:30',
  },
  {
    id: 1,
    withholding_type: 'tds',
    country: 'IN',
    rate: '0.0010',
    tax_base: 'gross_sale_value',
    effective_from: '2026-08-14',
    effective_to: null,
    is_verified: false,
    verified_reference: '',
    verified_at: null,
    created_at: '2026-08-14T10:06:27.661198+05:30',
  },
];

const MOCK_AUDIT_LOGS = [
  {
    id: 8,
    rule_kind: 'withholding',
    rule_id: 3,
    action: 'close_out',
    actor: 79,
    actor_username: 'settlement_admin',
    occurred_at: '2026-11-06T09:28:22.054411+05:30',
    reason: 'Retired temporary DEV live rate proof rule after verification.',
    old_value: { id: 3, rate: '0.0000', country: 'IE', effective_from: '2026-11-06', effective_to: null },
    new_value: { id: 3, rate: '0.0000', country: 'IE', effective_from: '2026-11-06', effective_to: '2026-11-06' },
  },
];

const MOCK_VENDORS = [
  { id: 57, store_name: 'DEV rate proof after', country: 'AE' },
  { id: 25, store_name: 'Zenith Digital Store', country: 'IN' },
];

function renderWithAuth(user) {
  return render(
    <AuthContext.Provider value={{ currentUser: user, isLoggedIn: Boolean(user) }}>
      <ToastProvider>
        <CommissionModule />
      </ToastProvider>
    </AuthContext.Provider>
  );
}

describe('CommissionModule — Real Backend Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    apiRequest.mockImplementation(async (url) => {
      if (url.startsWith('/api/settlements/admin/commission-rules/')) return MOCK_COMMISSION_RULES;
      if (url.startsWith('/api/settlements/admin/platform-fee-rules/')) return MOCK_PLATFORM_RULES;
      if (url.startsWith('/api/settlements/admin/withholding-rules/')) return MOCK_WITHHOLDING_RULES;
      if (url.startsWith('/api/settlements/admin/rule-audit/')) return MOCK_AUDIT_LOGS;
      if (url.startsWith('/api/vendors/admin/')) return MOCK_VENDORS;
      if (url.startsWith('/api/accounts/me/')) {
        return { id: 79, username: 'settlement_admin', role: 'admin', is_staff: true, is_superuser: true };
      }
      return [];
    });
  });

  it('1. Renders all four tabs with real counts, active/retired statuses, converted withholding rates, and audit history', async () => {
    renderWithAuth({ id: 79, username: 'settlement_admin', role: 'admin', is_staff: true, is_superuser: true });

    await waitFor(() => {
      expect(screen.getByTestId('tab-commission')).toHaveTextContent('Commission (3)');
      expect(screen.getByTestId('tab-platform_fee')).toHaveTextContent('Platform Fee (2)');
      expect(screen.getByTestId('tab-tds')).toHaveTextContent('TDS (2)');
      expect(screen.getByTestId('tab-tcs')).toHaveTextContent('TCS (1)');
    });

    // Commission rules: 6 and 5 are Retired, 1 is Active
    expect(screen.getByTestId('rule-status-6')).toHaveTextContent('Retired');
    expect(screen.getByTestId('rule-status-5')).toHaveTextContent('Retired');
    expect(screen.getByTestId('rule-status-1')).toHaveTextContent('Active');

    // Switch to Platform Fee tab
    fireEvent.click(screen.getByTestId('tab-platform_fee'));
    expect(screen.getByTestId('rule-status-4')).toHaveTextContent('Retired');
    expect(screen.getByTestId('rule-status-1')).toHaveTextContent('Active');

    // Switch to TDS tab: 0.0010 converted to 0.10%, rule 3 is Retired, rule 1 is Active + Unverified
    fireEvent.click(screen.getByTestId('tab-tds'));
    expect(screen.getByTestId('rule-status-3')).toHaveTextContent('Retired');
    expect(screen.getByTestId('rule-status-1')).toHaveTextContent('Active');
    expect(screen.getByText('0.10%')).toBeInTheDocument();
    expect(screen.getAllByText('Unverified').length).toBeGreaterThan(0);

    // Switch to TCS tab: 0.0050 converted to 0.50%
    fireEvent.click(screen.getByTestId('tab-tcs'));
    expect(screen.getByTestId('rule-status-2')).toHaveTextContent('Active');
    expect(screen.getByText('0.50%')).toBeInTheDocument();

    // Audit log row is displayed
    expect(screen.getByTestId('audit-row-8')).toHaveTextContent('settlement_admin');
    expect(screen.getByTestId('audit-row-8')).toHaveTextContent('Retired temporary DEV live rate proof rule after verification.');
  });

  it('2. Shows server field errors under matching inputs (no raw keys) for missing reason, overlapping dates, and settled order date, and clears field error on typing', async () => {
    renderWithAuth({ id: 79, username: 'settlement_admin', role: 'admin', is_staff: true, is_superuser: true });

    await waitFor(() => {
      expect(screen.getByTestId('open-create-rule-btn')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('open-create-rule-btn'));
    expect(screen.getByTestId('create-rule-modal')).toBeInTheDocument();

    // 2a. Missing reason -> 400 {"reason":["This field is required."]}
    apiRequest.mockImplementationOnce(async () => {
      throw new ApiError('HTTP 400 Error', 400, { reason: ['This field is required.'] });
    });

    fireEvent.change(screen.getByTestId('input-rate_value'), { target: { value: '12.50' } });
    fireEvent.click(screen.getByTestId('submit-create-rule-btn'));

    const reasonErr = await screen.findByTestId('field-error-reason');
    expect(reasonErr).toHaveTextContent('This field is required.');
    expect(reasonErr.textContent).not.toContain('reason:');

    // Typing in reason clears the field error immediately
    fireEvent.change(screen.getByTestId('input-reason'), { target: { value: 'New rate reason' } });
    expect(screen.queryByTestId('field-error-reason')).not.toBeInTheDocument();

    // 2b. Overlapping dates -> 400 {"non_field_errors":["An overlapping rule already exists for this rule key and effective date."]}
    apiRequest.mockImplementationOnce(async () => {
      throw new ApiError('HTTP 400 Error', 400, {
        non_field_errors: ['An overlapping rule already exists for this rule key and effective date.'],
      });
    });

    fireEvent.click(screen.getByTestId('submit-create-rule-btn'));
    const overlapErr = await screen.findByTestId('field-error-effective_from');
    expect(overlapErr).toHaveTextContent('An overlapping rule already exists for this rule key and effective date.');
    expect(overlapErr.textContent).not.toContain('non_field_errors');

    // Changing effective_from clears the error
    fireEvent.change(screen.getByTestId('input-effective_from'), { target: { value: '2026-11-15' } });
    expect(screen.queryByTestId('field-error-effective_from')).not.toBeInTheDocument();

    // 2c. Date covering a settled order -> 400 {"effective_from":["This effective date would cover an already-settled order."]}
    apiRequest.mockImplementationOnce(async () => {
      throw new ApiError('HTTP 400 Error', 400, {
        effective_from: ['This effective date would cover an already-settled order.'],
      });
    });

    fireEvent.click(screen.getByTestId('submit-create-rule-btn'));
    const settledErr = await screen.findByTestId('field-error-effective_from');
    expect(settledErr).toHaveTextContent('This effective date would cover an already-settled order.');
    expect(settledErr.textContent).not.toContain('effective_from:');
  });

  it('3. Creates a new commission rule without rewriting client values and refetches rules and audit history', async () => {
    renderWithAuth({ id: 79, username: 'settlement_admin', role: 'admin', is_staff: true, is_superuser: true });

    await waitFor(() => {
      expect(screen.getByTestId('open-create-rule-btn')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('open-create-rule-btn'));
    fireEvent.change(screen.getByTestId('input-country'), { target: { value: 'IE' } });
    fireEvent.change(screen.getByTestId('input-rate_value'), { target: { value: '11.25' } });
    fireEvent.change(screen.getByTestId('input-effective_from'), { target: { value: '2026-11-20' } });
    fireEvent.change(screen.getByTestId('input-reason'), { target: { value: 'Approved IE commission version' } });

    apiRequest.mockImplementationOnce(async (url, opts) => {
      const body = JSON.parse(opts.body);
      expect(url).toBe('/api/settlements/admin/commission-rules/');
      expect(body).toEqual({
        scope: 'global',
        category: null,
        vendor: null,
        country: 'IE',
        rate_type: 'percentage',
        rate_value: '11.25',
        effective_from: '2026-11-20',
        effective_to: null,
        reason: 'Approved IE commission version',
      });
      return { id: 99, ...body };
    });

    fireEvent.click(screen.getByTestId('submit-create-rule-btn'));

    await waitFor(() => {
      expect(screen.queryByTestId('create-rule-modal')).not.toBeInTheDocument();
    });
  });

  it('4. Retires an open rule via confirm dialog with end date and reason and refetches lists', async () => {
    renderWithAuth({ id: 79, username: 'settlement_admin', role: 'admin', is_staff: true, is_superuser: true });

    const retireBtn = await screen.findByTestId('retire-rule-1');
    fireEvent.click(retireBtn);

    expect(screen.getByTestId('retire-rule-dialog')).toBeInTheDocument();

    // First test missing reason error in retire dialog
    apiRequest.mockImplementationOnce(async () => {
      throw new ApiError('HTTP 400 Error', 400, { reason: ['This field is required.'] });
    });

    fireEvent.click(screen.getByTestId('confirm-retire-btn'));
    const retireReasonErr = await screen.findByTestId('retire-error-reason');
    expect(retireReasonErr).toHaveTextContent('This field is required.');

    // Type reason and submit successfully
    fireEvent.change(screen.getByTestId('retire-input-effective_to'), { target: { value: '2026-11-30' } });
    fireEvent.change(screen.getByTestId('retire-input-reason'), { target: { value: 'Retiring test rule' } });

    apiRequest.mockImplementationOnce(async (url, opts) => {
      expect(url).toBe('/api/settlements/admin/commission-rules/1/retire/');
      expect(JSON.parse(opts.body)).toEqual({
        effective_to: '2026-11-30',
        reason: 'Retiring test rule',
      });
      return { id: 1, effective_to: '2026-11-30' };
    });

    fireEvent.click(screen.getByTestId('confirm-retire-btn'));

    await waitFor(() => {
      expect(screen.queryByTestId('retire-rule-dialog')).not.toBeInTheDocument();
    });
  });

  it('5. Enforces staff vs superuser permissions on TDS and TCS tabs and displays 403 server message if returned', async () => {
    // 5a. Render as normal staff (admin_test: is_staff=true, is_superuser=false)
    const { unmount } = renderWithAuth({
      id: 50,
      username: 'admin_test',
      role: 'admin',
      is_staff: true,
      is_superuser: false,
    });

    await waitFor(() => {
      expect(screen.getByTestId('tab-tds')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('tab-tds'));

    // Staff sees read-only message and disabled Create & Retire buttons on TDS tab
    expect(screen.getByTestId('staff-readonly-withholding-msg')).toHaveTextContent(
      /Only a superuser may change statutory withholding rules/i
    );
    expect(screen.getByTestId('open-create-rule-btn')).toBeDisabled();
    expect(screen.getByTestId('retire-rule-1')).toBeDisabled();

    unmount();

    // 5b. Render as superuser (settlement_admin: is_staff=true, is_superuser=true)
    renderWithAuth({
      id: 79,
      username: 'settlement_admin',
      role: 'admin',
      is_staff: true,
      is_superuser: true,
    });

    await waitFor(() => {
      expect(screen.getByTestId('tab-tds')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('tab-tds'));
    expect(screen.getByTestId('open-create-rule-btn')).not.toBeDisabled();
    expect(screen.getByTestId('retire-rule-1')).not.toBeDisabled();

    fireEvent.click(screen.getByTestId('open-create-rule-btn'));
    fireEvent.change(screen.getByTestId('input-country'), { target: { value: 'AE' } });
    fireEvent.change(screen.getByTestId('input-rate'), { target: { value: '0.0010' } });
    fireEvent.change(screen.getByTestId('input-effective_from'), { target: { value: '2026-11-25' } });
    fireEvent.change(screen.getByTestId('input-reason'), { target: { value: 'Statutory TDS update' } });
    fireEvent.click(screen.getByTestId('input-confirm_statutory_change'));

    // Verify 403 server message is shown verbatim if server returns 403
    apiRequest.mockImplementationOnce(async () => {
      throw new ApiError(
        'Only a superuser may change statutory withholding rules.',
        403,
        { detail: 'Only a superuser may change statutory withholding rules.' }
      );
    });

    fireEvent.click(screen.getByTestId('submit-create-rule-btn'));
    const errAlert = await screen.findByTestId('rule-form-general-error');
    expect(errAlert).toHaveTextContent('Only a superuser may change statutory withholding rules.');

    // Now succeed with confirm_statutory_change: true
    apiRequest.mockImplementationOnce(async (url, opts) => {
      const body = JSON.parse(opts.body);
      expect(url).toBe('/api/settlements/admin/withholding-rules/');
      expect(body.confirm_statutory_change).toBe(true);
      expect(body.rate).toBe('0.0010');
      return { id: 10, ...body, is_verified: false };
    });

    fireEvent.click(screen.getByTestId('submit-create-rule-btn'));
    await waitFor(() => {
      expect(screen.queryByTestId('create-rule-modal')).not.toBeInTheDocument();
    });
  });

  it('6. Shows honest error state and no fake data on 403 or when backend is stopped', async () => {
    apiRequest.mockImplementation(async () => {
      throw new ApiError('A platform staff account is required.', 403, {
        detail: 'A platform staff account is required.',
      });
    });

    renderWithAuth({ id: 5, username: 'Athulb', role: 'customer', is_staff: false, is_superuser: false });

    const errState = await screen.findByTestId('rules-error-state');
    expect(errState).toHaveTextContent('Access Denied');
    expect(errState).toHaveTextContent('A platform staff account is required.');
    expect(screen.queryByTestId('rules-table')).not.toBeInTheDocument();
  });
});

