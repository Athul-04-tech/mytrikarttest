import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import CatalogSchemaModule from '../CatalogSchemaModule';
import { apiRequest } from '../../../../utils/api';
import { ToastProvider } from '../../../../context/ToastContext';

vi.mock('../../../../utils/api', () => ({
  apiRequest: vi.fn(),
  ApiError: class ApiError extends Error {
    constructor(message, status, data) {
      super(message);
      this.status = status;
      this.data = data;
    }
  }
}));

const mockCategories = [
  { id: 1, name: 'Electronics & Mobiles', slug: 'electronics-mobiles', parent: null, is_active: true, always_requires_review: false },
  { id: 2, name: 'Fashion & Apparel', slug: 'fashion-apparel', parent: null, is_active: true, always_requires_review: false }
];

const mockAttributes = [
  { id: 10, category: 1, attribute_name: 'Storage Capacity', field_type: 'dropdown', is_required: true, is_variation_capable: true, display_order: 1 },
  { id: 11, category: 1, attribute_name: 'RAM Size', field_type: 'dropdown', is_required: false, is_variation_capable: false, display_order: 2 }
];

const mockValues = [
  { id: 100, category_attribute: 10, value: '128 GB', display_order: 1 },
  { id: 101, category_attribute: 10, value: '256 GB', display_order: 2 }
];

function renderModule() {
  return render(
    <ToastProvider>
      <CatalogSchemaModule />
    </ToastProvider>
  );
}

describe('CatalogSchemaModule — Category, Attribute & Allowed Value Admin Governance Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    apiRequest.mockImplementation((url) => {
      if (url === '/api/products/admin/categories/') {
        return Promise.resolve(mockCategories);
      }
      if (url === '/api/products/admin/categories/1/attributes/') {
        return Promise.resolve(mockAttributes);
      }
      if (url === '/api/products/admin/category-attributes/10/values/') {
        return Promise.resolve(mockValues);
      }
      return Promise.reject(new Error('Unknown URL: ' + url));
    });
  });

  it('renders category list, attributes with is_variation_capable, and allowed values', async () => {
    renderModule();

    expect(await screen.findByText('Category & Schema Management')).toBeInTheDocument();
    expect(await screen.findByText('Electronics & Mobiles')).toBeInTheDocument();
    expect(screen.getByText('Fashion & Apparel')).toBeInTheDocument();

    expect(await screen.findByText('Storage Capacity')).toBeInTheDocument();
    expect(screen.getByText('Variation Capable')).toBeInTheDocument();

    expect(await screen.findByText('128 GB')).toBeInTheDocument();
    expect(screen.getByText('256 GB')).toBeInTheDocument();
  });

  it('handles category creation POST /api/products/admin/categories/', async () => {
    apiRequest.mockImplementation((url, options) => {
      if (options?.method === 'POST' && url === '/api/products/admin/categories/') {
        return Promise.resolve({
          id: 3,
          name: 'Home & Kitchen',
          slug: 'home-kitchen',
          parent: null,
          is_active: true,
          always_requires_review: false
        });
      }
      return Promise.resolve(mockCategories);
    });

    renderModule();

    const createBtn = await screen.findByRole('button', { name: /Create Category/i });
    fireEvent.click(createBtn);

    expect(await screen.findByText('Create New Category')).toBeInTheDocument();

    const nameInput = screen.getByPlaceholderText('e.g. Consumer Electronics');
    fireEvent.change(nameInput, { target: { value: 'Home & Kitchen' } });

    const saveBtn = screen.getByRole('button', { name: /Save Category/i });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(apiRequest).toHaveBeenCalledWith(
        '/api/products/admin/categories/',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            name: 'Home & Kitchen',
            slug: 'home-kitchen',
            parent: null,
            is_active: true,
            always_requires_review: false
          })
        })
      );
    });
  });

  it('handles server 409 Conflict rejection when attempting to delete record in use by products', async () => {
    vi.spyOn(window, 'confirm').mockImplementation(() => true);

    apiRequest.mockImplementation((url, options) => {
      if (options?.method === 'DELETE' && url.includes('/api/products/admin/categories/1/')) {
        const error = new Error('Conflict');
        error.data = { detail: 'This catalog record is referenced by existing product data and cannot be deleted.' };
        error.status = 409;
        return Promise.reject(error);
      }
      if (url === '/api/products/admin/categories/') return Promise.resolve(mockCategories);
      if (url === '/api/products/admin/categories/1/attributes/') return Promise.resolve(mockAttributes);
      if (url === '/api/products/admin/category-attributes/10/values/') return Promise.resolve(mockValues);
      return Promise.reject(new Error('Unknown URL: ' + url));
    });

    renderModule();

    const deleteCatBtns = await screen.findAllByTitle(/Delete Category/i);
    fireEvent.click(deleteCatBtns[0]);

    expect(await screen.findByText('Server Protection Triggered')).toBeInTheDocument();
    expect(screen.getByText(/This catalog record is referenced by existing product data and cannot be deleted/i)).toBeInTheDocument();
  });
});
