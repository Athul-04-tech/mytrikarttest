import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import SellerDashboardTopBar from '../SellerDashboardTopBar';
import { MemoryRouter } from 'react-router-dom';

// Mock ToastContext
vi.mock('../../../context/ToastContext', () => ({
  useToast: () => ({
    success: vi.fn(),
    info: vi.fn(),
    error: vi.fn(),
  }),
}));

describe('SellerDashboardTopBar Alerts Wiring Suite', () => {
  const renderTopBar = (alertsProps) => {
    return render(
      <MemoryRouter>
        <SellerDashboardTopBar onToggleSidebar={vi.fn()} alerts={alertsProps} />
      </MemoryRouter>
    );
  };

  it('1. hides bell badge pill when active alerts count is 0 and shows "No active store alerts" in dropdown', () => {
    const emptyAlerts = { low_stock_variants: [], new_orders_count: 0 };
    renderTopBar(emptyAlerts);

    // Bell badge pill (with text 3 or any number) should NOT exist
    const bellBtn = screen.getByRole('button', { name: /open notifications/i });
    expect(bellBtn).toBeDefined();

    // Query for any badge pill within the bell button
    expect(bellBtn.querySelector('.animate-badge-pop')).toBeNull();

    // Open notification dropdown
    fireEvent.click(bellBtn);

    // Verify empty state text is rendered
    expect(screen.getByText('No active store alerts')).toBeDefined();

    // Verify header title does NOT include "(Urgent)"
    expect(screen.getByText('Store Alerts')).toBeDefined();

    // Static Weekly Payout block still renders
    expect(screen.getByText('Weekly Payout Ready')).toBeDefined();
  });

  it('2. renders low stock warning with badge count 1 and formatted variant detail', () => {
    const lowStockAlerts = {
      low_stock_variants: [
        { product_id: 1, product_name: 'Spatial ANC Headphones', sku_code: 'ANC-01', stock_quantity: 2 }
      ],
      new_orders_count: 0
    };

    renderTopBar(lowStockAlerts);

    // Bell badge pill shows 1
    const bellBtn = screen.getByRole('button', { name: /open notifications/i });
    const badge = bellBtn.querySelector('.animate-badge-pop');
    expect(badge).not.toBeNull();
    expect(badge.textContent).toBe('1');

    // Open dropdown
    fireEvent.click(bellBtn);

    expect(screen.getByText('Store Alerts (1 Urgent)')).toBeDefined();
    expect(screen.getByText('Low Stock Warning')).toBeDefined();
    expect(screen.getByText('Spatial ANC Headphones (ANC-01) has 2 units remaining.')).toBeDefined();
  });

  it('3. renders new customer orders warning with badge count 1', () => {
    const newOrdersAlerts = {
      low_stock_variants: [],
      new_orders_count: 5
    };

    renderTopBar(newOrdersAlerts);

    const bellBtn = screen.getByRole('button', { name: /open notifications/i });
    const badge = bellBtn.querySelector('.animate-badge-pop');
    expect(badge).not.toBeNull();
    expect(badge.textContent).toBe('1');

    // Open dropdown
    fireEvent.click(bellBtn);

    expect(screen.getByText('Store Alerts (1 Urgent)')).toBeDefined();
    expect(screen.getByText('5 New Customer Orders')).toBeDefined();
    expect(screen.getByText('Orders waiting in fulfillment dispatch queue.')).toBeDefined();
  });

  it('4. renders badge count 2 when both low stock and new orders exist, excluding Weekly Payout block', () => {
    const bothAlerts = {
      low_stock_variants: [
        { product_id: 10, product_name: 'Wireless Mouse', sku_code: 'WM-99', stock_quantity: 1 }
      ],
      new_orders_count: 3
    };

    renderTopBar(bothAlerts);

    const bellBtn = screen.getByRole('button', { name: /open notifications/i });
    const badge = bellBtn.querySelector('.animate-badge-pop');
    expect(badge).not.toBeNull();
    expect(badge.textContent).toBe('2'); // Low stock (1) + New orders (1) = 2

    // Open dropdown
    fireEvent.click(bellBtn);

    expect(screen.getByText('Store Alerts (2 Urgent)')).toBeDefined();
    expect(screen.getByText('Low Stock Warning')).toBeDefined();
    expect(screen.getByText('3 New Customer Orders')).toBeDefined();
    expect(screen.getByText('Weekly Payout Ready')).toBeDefined();
  });
});
