import React from 'react';
import '@testing-library/jest-dom';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import ProductListingPage from '../ProductListingPage';
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
    id: 1,
    name: 'Electronics',
    slug: 'electronics',
    children: [
      {
        id: 2,
        name: 'Computers',
        slug: 'computers',
        children: [
          { id: 3, name: 'Laptops', slug: 'laptops', children: [] }
        ]
      }
    ]
  },
  {
    id: 4,
    name: 'Fashion',
    slug: 'fashion',
    children: []
  }
];

const createMockProducts = (count = 15) => {
  const list = [];
  for (let i = 1; i <= count; i++) {
    const isElectronics = i <= 13;
    const isLaptop = i <= 5;
    list.push({
      id: 100 + i,
      name: `Product ${i} ${isLaptop ? 'Laptop' : isElectronics ? 'Gadget' : 'Shirt'}`,
      slug: `product-${i}`,
      category: isLaptop ? 3 : isElectronics ? 1 : 4,
      category_name: isLaptop ? 'Laptops' : isElectronics ? 'Electronics' : 'Fashion',
      images: [],
      variants: [
        {
          id: 200 + i,
          price: (i * 100).toFixed(2),
          mrp: (i * 120).toFixed(2),
          discount_percentage: '16.67',
          stock_quantity: 10,
          currency: 'INR'
        }
      ],
      average_rating: 4.5,
      review_count: i
    });
  }
  return list;
};

const mockProducts = createMockProducts(15);

describe('ProductListingPage Dedicated Product Listing', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(apiModule.apiRequest).mockImplementation(async (endpoint) => {
      if (endpoint === '/api/products/categories/') {
        return mockCategories;
      }
      if (endpoint.startsWith('/api/products/published/')) {
        const url = new URL(endpoint, 'http://localhost');
        const searchQuery = url.searchParams.get('search');
        if (searchQuery) {
          return mockProducts.filter((p) => p.name.toLowerCase().includes(searchQuery.toLowerCase()));
        }
        return mockProducts;
      }
      if (endpoint === '/api/customers/wishlist/') {
        return [];
      }
      if (endpoint === '/api/customers/cart/count/' || endpoint === '/api/customers/wishlist/count/') {
        return { count: 0 };
      }
      if (endpoint === '/api/accounts/me/') {
        return { id: 1, role: 'customer', email: 'test@example.com' };
      }
      return [];
    });
  });

  const renderComponent = (initialRoute = '/products') => {
    return render(
      <MemoryRouter initialEntries={[initialRoute]}>
        <ToastProvider>
          <AuthProvider>
            <CartWishlistProvider>
              <Routes>
                <Route path="/products" element={<ProductListingPage />} />
                <Route path="/category/:categorySlug" element={<ProductListingPage />} />
              </Routes>
            </CartWishlistProvider>
          </AuthProvider>
        </ToastProvider>
      </MemoryRouter>
    );
  };

  it('renders all published products on /products with pagination', async () => {
    renderComponent('/products');

    await waitFor(() => {
      expect(screen.getAllByText(/All Marketplace Products/i)[0]).toBeDefined();
    });

    // Should show page 1 items (12 per page)
    expect(screen.getByText('Product 1 Laptop')).toBeDefined();
    expect(screen.getByText('Product 12 Gadget')).toBeDefined();
    expect(screen.queryByText('Product 13 Gadget')).toBeNull();

    // Check pagination count info
    expect(screen.getAllByText(/15/i)[0]).toBeDefined();
    const nextBtn = screen.getByRole('button', { name: /Next Page/i });
    fireEvent.click(nextBtn);

    // Page 2 items should load
    await waitFor(() => {
      expect(screen.getByText('Product 13 Gadget')).toBeDefined();
    });
    expect(screen.queryByText('Product 1 Laptop')).toBeNull();
  });

  it('includes subcategory descendant products when filtering by top-level category', async () => {
    renderComponent('/category/electronics');

    await waitFor(() => {
      expect(screen.getAllByText(/Electronics/i)[0]).toBeDefined();
    });

    // Laptop product (category 3, sub-descendant of Electronics category 1) should be included!
    expect(screen.getByText('Product 1 Laptop')).toBeDefined();
    // Fashion item (category 4) should NOT be included
    expect(screen.queryByText('Product 14 Shirt')).toBeNull();
  });

  it('filters by subcategory query param ?sub=laptops', async () => {
    renderComponent('/category/electronics?sub=laptops');

    await waitFor(() => {
      expect(screen.getByText('Product 1 Laptop')).toBeDefined();
    });

    // Gadget items (category 1, but not under laptops category 3) should be filtered out
    expect(screen.queryByText('Product 6 Gadget')).toBeNull();
  });

  it('displays empty state when no products match category', async () => {
    vi.mocked(apiModule.apiRequest).mockImplementation(async (endpoint) => {
      if (endpoint === '/api/products/categories/') return mockCategories;
      if (endpoint.startsWith('/api/products/published/')) return [];
      return [];
    });

    renderComponent('/category/fashion');

    await waitFor(() => {
      expect(screen.getByText('No products found in this category')).toBeDefined();
    });

    expect(screen.getByRole('button', { name: /Browse All Marketplace Products/i })).toBeDefined();
  });

  it('fetches and displays search results when ?search=query is present', async () => {
    renderComponent('/products?search=Laptop');

    await waitFor(() => {
      expect(screen.getByText('Search results for "Laptop"')).toBeDefined();
    });

    expect(screen.getByText('Product 1 Laptop')).toBeDefined();
    expect(screen.getByText('Search: "Laptop"')).toBeDefined();
    expect(screen.queryByText('Product 6 Gadget')).toBeNull();
  });

  it('displays genuine empty state when search yields no matches', async () => {
    renderComponent('/products?search=NonExistentQueryXYZ');

    await waitFor(() => {
      expect(screen.getByText('No products found for "NonExistentQueryXYZ"')).toBeDefined();
    });

    expect(screen.getByText(/No active listings match your search query "NonExistentQueryXYZ"/i)).toBeDefined();
  });
});

