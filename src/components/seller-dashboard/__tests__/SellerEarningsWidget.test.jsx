import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import SellerEarningsWidget from '../SellerEarningsWidget';
import SellerDashboardSidebar from '../SellerDashboardSidebar';
import { MemoryRouter } from 'react-router-dom';

// Mock ToastContext & useCountUp
vi.mock('../../../context/ToastContext', () => ({
  useToast: () => ({
    success: vi.fn(),
    info: vi.fn(),
    error: vi.fn(),
  }),
}));

vi.mock('../../../hooks/useCountUp', () => ({
  useCountUp: (target) => target,
}));

describe('Seller Dashboard Live Data Wiring Suite', () => {
  // TEST FIXTURE 1: Fresh Account Empty Response Shape (EXACT shape from API)
  const emptyApiFixture = {
    as_of: "2026-09-07",
    sales_by_currency: { today: {}, yesterday: {}, last_7_days: {}, last_30_days: {}, lifetime: {} },
    earnings_by_currency: {},
    pending_settlement_order_count: 0,
    paid_settlement: {
      amount_by_currency: {},
      is_approximation: true,
      note: "Paid withdrawals are not linked to settlement ledger credits, so this cannot be attributed to individual settlements."
    },
    order_status_counts: {},
    product_status_counts: {}
  };

  // TEST FIXTURE 2: Populated Account Response Shape
  const populatedApiFixture = {
    as_of: "2026-09-07",
    sales_by_currency: {
      today: { INR: 1000 },
      yesterday: { INR: 500 },
      last_7_days: { INR: 5000 },
      last_30_days: { INR: 20000 },
      lifetime: { INR: 50000 }
    },
    earnings_by_currency: {
      INR: { gross: 20000, commission: 2000, net: 18000 }
    },
    pending_settlement_order_count: 3,
    paid_settlement: {
      amount_by_currency: { INR: 15000 },
      is_approximation: true,
      note: "Paid withdrawals are not linked to settlement ledger credits, so this cannot be attributed to individual settlements."
    },
    order_status_counts: { new: 5, processing: 2, completed: 10 },
    product_status_counts: { published: 12, draft: 3 }
  };

  // TASK C - TEST 1: Renders ₹0/empty values for fresh account empty API response shape
  it('1. renders ₹0 figures for fresh account empty API response shape', () => {
    render(
      <SellerEarningsWidget
        earningsByCurrency={emptyApiFixture.earnings_by_currency}
        paidSettlementData={emptyApiFixture.paid_settlement}
        pendingSettlementOrderCount={emptyApiFixture.pending_settlement_order_count}
        selectedCurrency="INR"
      />
    );

    // Verify all 4 panels display formatted ₹0 (or $0 depending on currency formatter)
    const zeroElements = screen.getAllByText('₹0');
    expect(zeroElements.length).toBeGreaterThanOrEqual(4);
    
    // Ensure hardcoded sample numbers (e.g. 615,780 or 684,200) DO NOT exist
    expect(screen.queryByText(/615,780/)).toBeNull();
    expect(screen.queryByText(/684,200/)).toBeNull();
    expect(screen.queryByText(/531,580/)).toBeNull();
  });

  // TASK C - TEST 2: Renders populated figures correctly for non-empty API response fixture
  it('2. renders correctly populated amounts for non-empty API response fixture', () => {
    render(
      <SellerEarningsWidget
        earningsByCurrency={populatedApiFixture.earnings_by_currency}
        paidSettlementData={populatedApiFixture.paid_settlement}
        pendingSettlementOrderCount={populatedApiFixture.pending_settlement_order_count}
        selectedCurrency="INR"
      />
    );

    expect(screen.getByText('₹18,000')).toBeDefined(); // Net
    expect(screen.getByText('₹20,000')).toBeDefined(); // Gross
    expect(screen.getByText('₹2,000')).toBeDefined();  // Commission
    expect(screen.getByText('₹15,000')).toBeDefined(); // Disbursed
    expect(screen.getByText(/3 Pending Release/i)).toBeDefined();
  });

  // TASK C - TEST 3: Surfaces is_approximation flag and note banner when true
  it('3. surfaces is_approximation badge and note banner when true', () => {
    render(
      <SellerEarningsWidget
        earningsByCurrency={emptyApiFixture.earnings_by_currency}
        paidSettlementData={emptyApiFixture.paid_settlement}
        pendingSettlementOrderCount={0}
        selectedCurrency="INR"
      />
    );

    expect(screen.getByText('Approx.')).toBeDefined();
    expect(screen.getByText('Paid Settlement Attribution Note')).toBeDefined();
    expect(screen.getByText(/Paid withdrawals are not linked to settlement ledger credits/i)).toBeDefined();
  });

  // TASK C - TEST 4: Sidebar badges reflect real counts and hide when zero
  it('4a. hides sidebar badges when counts are zero', () => {
    render(
      <MemoryRouter>
        <SellerDashboardSidebar
          isMobileOpen={false}
          onCloseMobile={vi.fn()}
          productStatusCounts={emptyApiFixture.product_status_counts}
          orderStatusCounts={emptyApiFixture.order_status_counts}
        />
      </MemoryRouter>
    );

    // Hardcoded "48" and "6 New" MUST NOT exist when counts are 0
    expect(screen.queryByText('48')).toBeNull();
    expect(screen.queryByText('6 New')).toBeNull();
  });

  it('4b. renders real counts in sidebar badges when populated counts are provided', () => {
    render(
      <MemoryRouter>
        <SellerDashboardSidebar
          isMobileOpen={false}
          onCloseMobile={vi.fn()}
          productStatusCounts={populatedApiFixture.product_status_counts}
          orderStatusCounts={populatedApiFixture.order_status_counts}
        />
      </MemoryRouter>
    );

    // Total products = 12 + 3 = 15
    expect(screen.getByText('15')).toBeDefined();
    // New orders = 5
    expect(screen.getByText('5 New')).toBeDefined();
  });
});
