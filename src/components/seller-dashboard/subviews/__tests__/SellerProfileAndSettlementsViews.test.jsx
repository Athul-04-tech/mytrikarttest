import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import SellerProfileView from '../SellerProfileView';
import SellerSettlementsView from '../SellerSettlementsView';
import SellerSettingsView from '../SellerSettingsView';
import SellerSalesWidget from '../../SellerSalesWidget';
import { ToastProvider } from '../../../../context/ToastContext';
import * as api from '../../../../utils/api';

vi.mock('../../../../utils/api', () => ({
  apiRequest: vi.fn()
}));

function renderWithProviders(ui) {
  return render(
    <BrowserRouter>
      <ToastProvider>
        {ui}
      </ToastProvider>
    </BrowserRouter>
  );
}

describe('Seller Profile, Settlements, Settings & Sales Real API Suite', () => {

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('1. SellerProfileView displays real vendor profile fields and "Not yet available" for PAN/Bank', async () => {
    api.apiRequest.mockResolvedValueOnce({
      id: 12,
      business_name: 'Acme Heritage Private Limited',
      store_name: 'Acme Craft Store',
      tax_id: '27ABCDE1234F1Z5',
      onboarding_status: 'verified'
    });

    renderWithProviders(<SellerProfileView />);

    await waitFor(() => {
      expect(screen.getByText('Acme Heritage Private Limited')).toBeTruthy();
      expect(screen.getByText('Acme Craft Store')).toBeTruthy();
      expect(screen.getByText('27ABCDE1234F1Z5')).toBeTruthy();
      expect(screen.getByText('VERIFIED')).toBeTruthy();
    });

    // Check PAN and Bank fields display "Not yet available"
    const unbackedFields = screen.getAllByText('Not yet available');
    expect(unbackedFields.length).toBeGreaterThanOrEqual(6);
  });

  it('2. SellerSettlementsView fetches real wallet balance and exports ledger report', async () => {
    api.apiRequest.mockImplementation((url) => {
      if (url.includes('/api/settlements/wallet/')) {
        return Promise.resolve({
          wallet: { cached_balance: 145000.50, balance_status: 'Active' },
          recent_ledger_entries: [
            { id: 1, entry_type: 'Order Payout Settlement', amount: 12500, created_at: '2026-09-01T10:00:00Z' }
          ]
        });
      }
      if (url.includes('/api/settlements/statements/')) {
        return Promise.resolve([]);
      }
      if (url.includes('/api/settlements/withdrawals/')) {
        return Promise.resolve([]);
      }
      if (url.includes('/api/reports/b2c-sales-export/')) {
        return Promise.resolve({ filing_ready: true, rows: [] });
      }
      return Promise.resolve({});
    });

    renderWithProviders(<SellerSettlementsView />);

    await waitFor(() => {
      expect(screen.getByText('₹1,45,000.50')).toBeTruthy();
      expect(screen.getByText('Order Payout Settlement')).toBeTruthy();
    });

    // Click Export Ledger
    const exportBtn = screen.getByText(/Export B2C Sales Ledger/i);
    fireEvent.click(exportBtn);

    await waitFor(() => {
      expect(api.apiRequest).toHaveBeenCalledWith(expect.stringContaining('/api/reports/b2c-sales-export/'));
    });
  });

  it('3. SellerSettingsView loads profile, executes PATCH on save, and disables unsupported fields', async () => {
    api.apiRequest.mockImplementation((url, options) => {
      if (options?.method === 'PATCH') {
        return Promise.resolve({ store_name: 'Updated Store Name', store_description: 'New Description', is_women_owned: true });
      }
      return Promise.resolve({
        store_name: 'Original Store Name',
        store_description: 'Original Description',
        is_women_owned: false
      });
    });

    renderWithProviders(<SellerSettingsView />);

    await waitFor(() => {
      expect(screen.getByDisplayValue('Original Store Name')).toBeTruthy();
    });

    // Verify SLA select is disabled
    const select = screen.getByRole('combobox');
    expect(select.disabled).toBe(true);

    // Verify women-owned checkbox is enabled while unsupported feature checkboxes are disabled
    const checkboxes = screen.getAllByRole('checkbox');
    const disabledCheckboxes = checkboxes.filter(cb => cb.disabled);
    expect(disabledCheckboxes.length).toBe(2);

    const womenOwnedCheckbox = screen.getByLabelText(/This business is women-owned \/ women-led/i);
    expect(womenOwnedCheckbox.disabled).toBe(false);
    expect(womenOwnedCheckbox.checked).toBe(false);

    // Toggle women-owned checkbox and update store name
    fireEvent.click(womenOwnedCheckbox);
    expect(womenOwnedCheckbox.checked).toBe(true);

    const nameInput = screen.getByDisplayValue('Original Store Name');
    fireEvent.change(nameInput, { target: { value: 'New Store Name' } });

    const saveBtn = screen.getByText('Save Store Preferences');
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(api.apiRequest).toHaveBeenCalledWith('/api/vendors/me/', expect.objectContaining({
        method: 'PATCH',
        body: JSON.stringify({ store_name: 'New Store Name', store_description: 'Original Description', is_women_owned: true })
      }));
    });
  });

  it('4. SellerSalesWidget handles missing data cleanly without mock fallback values or sparklines', () => {
    renderWithProviders(
      <SellerSalesWidget salesByCurrency={null} selectedCurrency="INR" availableCurrencies={['INR']} />
    );

    // Amounts should display ₹0
    const zeroAmounts = screen.getAllByText('₹0');
    expect(zeroAmounts.length).toBe(5);

    // Sparklines should be absent
    expect(screen.queryByText('Trend')).toBeNull();
  });

});
