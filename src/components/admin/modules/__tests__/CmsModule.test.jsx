import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import CmsModule from '../CmsModule';
import { apiRequest } from '../../../../utils/api';
import { ToastProvider } from '../../../../context/ToastContext';

vi.mock('../../../../utils/api', () => ({
  apiRequest: vi.fn(),
}));

const mockPages = [
  { id: 1, title: 'About Us', slug: 'about-us', body: '# About Us', status: 'published', published_at: '2026-09-01T10:00:00Z', noindex: false },
  { id: 2, title: 'Privacy Policy', slug: 'privacy-policy', body: '# Privacy', status: 'draft', published_at: null, noindex: false }
];

const mockBanners = [
  { id: 10, title: 'Hero Festive Sale', image_url: 'https://example.com/banner.jpg', link_url: 'https://example.com/sale', placement: 'homepage_hero', is_active: true, display_order: 1 }
];

const mockBlogPosts = [
  { id: 20, title: 'Welcome to MytriKart', slug: 'welcome-mytrikart', excerpt: 'Launch announcement', body: 'Full body text', status: 'published', published_at: '2026-09-10T12:00:00Z', tags: 'news,launch' }
];

const mockFaqCategories = [
  { id: 30, title: 'Shipping & Delivery', slug: 'shipping-delivery', display_order: 1 }
];

const mockFaqItems = [
  { id: 40, category: 30, question: 'How long does shipping take?', answer: 'Shipping takes 2-4 business days.', is_active: true, display_order: 1 }
];

const mockAgreements = [
  { id: 50, agreement_type: 'vendor_agreement', version: 'v1.0', title: 'Master Vendor Terms 2026', body: '# Terms', published_at: '2026-09-15T08:00:00Z', created_by: 1 }
];

describe('CmsModule — Real Backend API Wiring & Tabbed Governance', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    apiRequest.mockImplementation(async (url) => {
      if (url === '/api/cms/admin/pages/') return mockPages;
      if (url === '/api/cms/admin/banners/') return mockBanners;
      if (url === '/api/cms/admin/blog-posts/') return mockBlogPosts;
      if (url === '/api/cms/admin/faq-categories/') return mockFaqCategories;
      if (url === '/api/cms/admin/faq-items/') return mockFaqItems;
      if (url === '/api/cms/admin/agreement-versions/') return mockAgreements;
      return {};
    });
  });

  it('1. fetches and renders CMS pages list and triggers page publish', async () => {
    render(
      <ToastProvider>
        <CmsModule />
      </ToastProvider>
    );

    expect(await screen.findByText('About Us')).toBeInTheDocument();
    expect(screen.getByText('Privacy Policy')).toBeInTheDocument();

    // Find publish button for draft page "Privacy Policy"
    const publishBtns = screen.getAllByText('Publish');
    expect(publishBtns.length).toBeGreaterThan(0);

    apiRequest.mockImplementationOnce(async (url, options) => {
      if (url === '/api/cms/admin/pages/2/publish/') {
        return { ...mockPages[1], status: 'published', published_at: '2026-09-28T10:00:00Z' };
      }
      return {};
    });

    fireEvent.click(publishBtns[0]);

    await waitFor(() => {
      expect(apiRequest).toHaveBeenCalledWith('/api/cms/admin/pages/2/publish/', { method: 'POST' });
    });
  });

  it('2. allows creating a new page via POST /api/cms/admin/pages/', async () => {
    render(
      <ToastProvider>
        <CmsModule />
      </ToastProvider>
    );

    expect(await screen.findByText('About Us')).toBeInTheDocument();

    const createBtn = screen.getByText('Create New Page');
    fireEvent.click(createBtn);

    expect(screen.getByText('Create New CMS Page')).toBeInTheDocument();

    const titleInput = screen.getByPlaceholderText('e.g. Terms of Service');
    fireEvent.change(titleInput, { target: { value: 'Return Policy' } });

    const bodyInput = screen.getByPlaceholderText('# Enter Markdown page content here...');
    fireEvent.change(bodyInput, { target: { value: '# Return Policy Content' } });

    apiRequest.mockImplementationOnce(async (url, options) => {
      if (url === '/api/cms/admin/pages/' && options.method === 'POST') {
        return { id: 3, title: 'Return Policy', slug: 'return-policy', body: '# Return Policy Content', status: 'draft', published_at: null, noindex: false };
      }
      return {};
    });

    const saveBtn = screen.getByText('Save Page');
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(apiRequest).toHaveBeenCalledWith('/api/cms/admin/pages/', expect.objectContaining({
        method: 'POST',
        body: expect.stringContaining('"title":"Return Policy"')
      }));
    });
  });

  it('3. renders agreement versions as view-only and append-only', async () => {
    render(
      <ToastProvider>
        <CmsModule />
      </ToastProvider>
    );

    expect(await screen.findByText('About Us')).toBeInTheDocument();

    const agreementTab = screen.getByRole('button', { name: /Agreement Versions/i });
    fireEvent.click(agreementTab);

    expect(await screen.findByText('Master Vendor Terms 2026')).toBeInTheDocument();
    expect(screen.getByText(/Vendor agreement versions are append-only/i)).toBeInTheDocument();
  });
});
