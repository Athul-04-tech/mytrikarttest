import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import HomePage from '../HomePage';
import { CartWishlistProvider } from '../../context/CartWishlistContext';
import { ToastProvider } from '../../context/ToastContext';
import { AuthProvider } from '../../context/AuthContext';
import * as apiModule from '../../utils/api';

vi.mock('../../utils/api', async () => {
  const actual = await vi.importActual('../../utils/api');
  return {
    ...actual,
    apiRequest: vi.fn(),
  };
});

const mockCategories = [
  {
    id: 2,
    name: 'Electronics',
    slug: 'electronics',
    children: [
      { id: 5, name: 'Laptops', slug: 'laptops', children: [] }
    ]
  },
  { id: 6, name: 'Fashion', slug: 'fashion', children: [] }
];

const mockPublishedProducts = [
  {
    id: 101,
    name: 'HP Victus Gaming Laptop',
    slug: 'hp-victus',
    description: 'High performance gaming laptop',
    category: 5,
    category_name: 'Laptops',
    images: [{ id: 1, image: 'http://127.0.0.1:8000/media/laptop.png', is_primary: true }],
    variants: [
      {
        id: 201,
        price: '74999.00',
        mrp: '89999.00',
        discount_percentage: '16.67',
        stock_quantity: 3,
        currency: 'INR'
      }
    ],
    average_rating: 4.8,
    review_count: 12
  },
  {
    id: 102,
    name: 'Basic Cotton T-Shirt',
    slug: 'cotton-tshirt',
    description: 'Comfortable everyday tee',
    category: 6,
    category_name: 'Fashion',
    images: [],
    variants: [
      {
        id: 202,
        price: '499.00',
        mrp: null,
        discount_percentage: null,
        stock_quantity: 50,
        currency: 'INR'
      }
    ],
    average_rating: null,
    review_count: 0
  }
];

describe('Homepage Real Data Feed & Category Nav', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(apiModule.apiRequest).mockImplementation(async (endpoint) => {
      if (endpoint === '/api/products/categories/') {
        return mockCategories;
      }
      if (endpoint === '/api/products/published/') {
        return mockPublishedProducts;
      }
      if (endpoint === '/api/customers/wishlist/') {
        return [];
      }
      if (endpoint === '/api/accounts/me/') {
        return { id: 1, role: 'customer', email: 'test@example.com' };
      }
      return [];
    });
  });

  const renderComponent = (initialRoute = '/') => {
    return render(
      <MemoryRouter initialEntries={[initialRoute]}>
        <ToastProvider>
          <AuthProvider>
            <CartWishlistProvider>
              <Routes>
                <Route path="/" element={<HomePage isLoggedIn={false} currentUser={null} />} />
                <Route path="/category/:categorySlug" element={<HomePage isLoggedIn={false} currentUser={null} />} />
              </Routes>
            </CartWishlistProvider>
          </AuthProvider>
        </ToastProvider>
      </MemoryRouter>
    );
  };

  it('1. fetches and renders real backend categories in CategoryNav', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getAllByText('For You')[0]).toBeDefined();
      expect(screen.getAllByText('Electronics')[0]).toBeDefined();
      expect(screen.getAllByText('Fashion')[0]).toBeDefined();
    });
  });

  it('2. fetches and renders real published products feed with verified count', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('HP Victus Gaming Laptop')).toBeDefined();
      expect(screen.getByText('Basic Cotton T-Shirt')).toBeDefined();
      expect(screen.getByText(/2 Verified Products/i)).toBeDefined();
    });
  });

  it('3. displays real average rating vs "No reviews yet" state correctly', async () => {
    renderComponent();

    await waitFor(() => {
      // Product 101 has 4.8 rating and 12 reviews
      expect(screen.getByText('4.8')).toBeDefined();
      expect(screen.getByText('(12)')).toBeDefined();

      // Product 102 has 0 reviews
      expect(screen.getByText('No reviews yet')).toBeDefined();
    });
  });

  it('4. displays struck-through MRP and discount badge only when MRP > price', async () => {
    renderComponent();

    await waitFor(() => {
      // Product 101 has MRP 89999 and price 74999
      expect(screen.getByText('₹89,999')).toBeDefined();
      expect(screen.getByText('17% Off')).toBeDefined();

      // Product 102 has null MRP -> no MRP or discount rendered
      expect(screen.queryByText('₹0')).toBeNull();
    });
  });

  it('5. displays real "Only X left" badge for stock <= 5', async () => {
    renderComponent();

    await waitFor(() => {
      // Product 101 has stock_quantity = 3
      expect(screen.getByText('Only 3 left')).toBeDefined();
    });
  });

  it('6. displays products belonging to descendant subcategory (Laptops) when parent category (Electronics) is selected', async () => {
    renderComponent('/category/electronics');

    await waitFor(() => {
      // HP Victus is assigned to Category Laptops (ID 5), which is a child of Electronics (ID 2)
      expect(screen.getByText('HP Victus Gaming Laptop')).toBeDefined();
      // Fashion item should be filtered out
      expect(screen.queryByText('Basic Cotton T-Shirt')).toBeNull();
      expect(screen.getByText(/1 Verified Products/i)).toBeDefined();
    });
  });
});
