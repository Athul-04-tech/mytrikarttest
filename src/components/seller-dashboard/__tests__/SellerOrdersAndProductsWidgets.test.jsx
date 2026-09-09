import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import SellerOrdersWidget from '../SellerOrdersWidget';
import SellerProductsWidget from '../SellerProductsWidget';

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

describe('Seller Dashboard Orders & Products Widgets Wire & Empty States', () => {
  it('1. SellerOrdersWidget renders zero counts and honest empty state for empty orders', () => {
    const emptyCounts = { pending: 0, processing: 0, shipped: 0, delivered: 0, cancelled: 0 };
    render(
      <SellerOrdersWidget
        orderStatusCounts={emptyCounts}
        recentOrders={[]}
        onNavigateToOrders={vi.fn()}
      />
    );

    expect(screen.getByText('Orders Fulfillment Queue')).toBeTruthy();
    expect(screen.getByText('No recent orders')).toBeTruthy();
    // Ensure no hardcoded mock order numbers (e.g. ORD-94821) exist
    expect(screen.queryByText(/ORD-94821/)).toBeNull();
    expect(screen.queryByText(/Aarav Sharma/)).toBeNull();
  });

  it('2. SellerOrdersWidget renders real recent orders when array is populated', () => {
    const counts = { pending: 1, processing: 0, shipped: 0, delivered: 0, cancelled: 0 };
    const recent = [
      {
        id: 55,
        order_number: 'ORD-5500',
        amount: 2500,
        currency: 'INR',
        status: 'pending',
        product_names: ['Handcrafted Clay Pot']
      }
    ];

    render(
      <SellerOrdersWidget
        orderStatusCounts={counts}
        recentOrders={recent}
        onNavigateToOrders={vi.fn()}
      />
    );

    expect(screen.getByText('ORD-5500')).toBeTruthy();
    expect(screen.getByText('Handcrafted Clay Pot')).toBeTruthy();
    expect(screen.queryByText('No recent orders')).toBeNull();
  });

  it('3. SellerProductsWidget renders zero counts and honest empty state when no SKUs need attention', () => {
    const emptyCounts = { published: 0, pending_review: 0, draft: 0, rejected: 0 };
    const emptyAttention = { low_stock_variants: [], pending_review_products: [] };

    render(
      <SellerProductsWidget
        productStatusCounts={emptyCounts}
        inventoryAttention={emptyAttention}
        onNavigateToProducts={vi.fn()}
      />
    );

    expect(screen.getByText('Inventory & Catalog Health')).toBeTruthy();
    expect(screen.getByText('Needs Immediate Attention (0 SKUs)')).toBeTruthy();
    expect(screen.getByText('No SKUs need attention')).toBeTruthy();
    // Ensure hardcoded sample products do not exist
    expect(screen.queryByText(/SKU-AUD-9421/)).toBeNull();
    expect(screen.queryByText(/Spatial ANC Wireless Headphones/)).toBeNull();
  });

  it('4. SellerProductsWidget renders attention list for low stock variants and pending review products', () => {
    const counts = { published: 2, pending_review: 1, draft: 0, rejected: 0 };
    const attention = {
      low_stock_variants: [
        { variant_id: 10, product_name: 'Bamboo Water Bottle', sku_code: 'BAM-BOT-01', stock_quantity: 1 }
      ],
      pending_review_products: [
        { id: 22, name: 'Silk Saree', status: 'pending_review' }
      ]
    };

    render(
      <SellerProductsWidget
        productStatusCounts={counts}
        inventoryAttention={attention}
        onNavigateToProducts={vi.fn()}
      />
    );

    expect(screen.getByText('Needs Immediate Attention (2 SKUs)')).toBeTruthy();
    expect(screen.getByText('Bamboo Water Bottle')).toBeTruthy();
    expect(screen.getByText('BAM-BOT-01: 1 units remaining')).toBeTruthy();
    expect(screen.getByText('Silk Saree')).toBeTruthy();
    expect(screen.getByText('Pending Compliance Review by Admin')).toBeTruthy();
  });
});
