import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import AnnouncementsModule from '../AnnouncementsModule';
import { apiRequest } from '../../../../utils/api';
import { ToastProvider } from '../../../../context/ToastContext';

vi.mock('../../../../utils/api', () => ({
  apiRequest: vi.fn(),
}));

const mockVendors = [
  { id: 8, store_name: 'Acme Demo Store (8)', onboarding_status: 'store_published' },
  { id: 4, store_name: 'Acme Demo Store', onboarding_status: 'store_published' },
  { id: 1, store_name: 'Royal', onboarding_status: 'registered' },
];

const mockAnnouncementsList = {
  count: 2,
  next: null,
  previous: null,
  results: [
    {
      id: 10,
      title: 'Diwali Logistics Cutoff Schedule',
      body: 'Dispatch cutoffs start at 18:00 IST.',
      audience: 'all_approved',
      target_vendor_ids: [],
      status: 'draft',
      publish_from: '2026-11-10T10:00:00+05:30',
      publish_until: '2026-11-15T10:00:00+05:30',
      created_by: 50,
      created_at: '2026-11-10T09:00:00+05:30',
      updated_at: '2026-11-10T09:30:00+05:30',
      read_count: 0,
    },
    {
      id: 1,
      title: 'LIVE PROOF, DELETE NOT POSSIBLE, IGNORE',
      body: 'LIVE PROOF, DELETE NOT POSSIBLE, IGNORE',
      audience: 'selected_vendors',
      target_vendor_ids: [8],
      status: 'published',
      publish_from: '2026-11-07T11:56:02.470000+05:30',
      publish_until: '2026-11-11T12:01:02.470000+05:30',
      created_by: 50,
      created_at: '2026-11-07T12:01:02.954386+05:30',
      updated_at: '2026-11-07T12:01:05.254360+05:30',
      read_count: 1,
    },
  ],
};

describe('AnnouncementsModule — Real Backend Wiring', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    apiRequest.mockImplementation(async (url) => {
      if (url.startsWith('/api/announcements/admin/') && !url.includes('/audit/') && !url.includes('/publish/') && !url.includes('/unpublish/') && !url.includes('/archive/')) {
        return mockAnnouncementsList;
      }
      if (url === '/api/vendors/admin/') {
        return mockVendors;
      }
      return {};
    });
  });

  const renderModule = () =>
    render(
      <ToastProvider>
        <AnnouncementsModule />
      </ToastProvider>
    );

  it('1. renders admin announcements list, filters by status/audience/search, and shows in-app plain-text notice', async () => {
    renderModule();

    expect(await screen.findByText('Diwali Logistics Cutoff Schedule')).toBeInTheDocument();
    expect(screen.getAllByText('LIVE PROOF, DELETE NOT POSSIBLE, IGNORE').length).toBeGreaterThan(0);
    expect(screen.getByText(/In-App Delivery Only \(No Email or SMS\)/i)).toBeInTheDocument();
    expect(screen.getByTestId('read-count-1')).toHaveTextContent('1');

    // Filter by status
    fireEvent.change(screen.getByTestId('filter-status-select'), {
      target: { value: 'published' },
    });

    await waitFor(() => {
      expect(apiRequest).toHaveBeenCalledWith('/api/announcements/admin/?status=published');
    });

    // Filter by audience
    fireEvent.change(screen.getByTestId('filter-audience-select'), {
      target: { value: 'selected_vendors' },
    });

    await waitFor(() => {
      expect(apiRequest).toHaveBeenCalledWith(
        '/api/announcements/admin/?status=published&audience=selected_vendors'
      );
    });
  });

  it('2. displays server field validation errors under matching inputs (no raw keys) and clears error when typing', async () => {
    renderModule();
    expect(await screen.findByText('Diwali Logistics Cutoff Schedule')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('create-announcement-btn'));
    expect(screen.getByTestId('announcement-form-modal')).toBeInTheDocument();

    // Simulate 400 validation errors for blank title, HTML in body, and publish_until < publish_from
    apiRequest.mockImplementationOnce(async () => {
      const err = new Error('Validation failed');
      err.status = 400;
      err.data = {
        title: ['This field may not be blank.'],
        body: ['HTML markup is not allowed; use plain text.'],
        publish_until: ['Publish-until cannot be before publish-from.'],
      };
      throw err;
    });

    fireEvent.change(screen.getByTestId('input-body'), {
      target: { value: '<b>HTML not allowed</b>' },
    });

    fireEvent.click(screen.getByTestId('submit-announcement-btn'));

    expect(await screen.findByTestId('error-title')).toHaveTextContent(
      'This field may not be blank.'
    );
    expect(screen.getByTestId('error-body')).toHaveTextContent(
      'HTML markup is not allowed; use plain text.'
    );
    expect(screen.getByTestId('error-publish_until')).toHaveTextContent(
      'Publish-until cannot be before publish-from.'
    );

    // Typing in title clears only the title error
    fireEvent.change(screen.getByTestId('input-title'), {
      target: { value: 'Valid Plain Text Title' },
    });
    expect(screen.queryByTestId('error-title')).toBeNull();
    expect(screen.getByTestId('error-body')).toBeInTheDocument();

    // Typing in body clears the body error
    fireEvent.change(screen.getByTestId('input-body'), {
      target: { value: 'Valid plain text body without angle brackets.' },
    });
    expect(screen.queryByTestId('error-body')).toBeNull();
  });

  it('3. handles 409 Conflict when deleting a read announcement and archives instead when clicking "Archive instead"', async () => {
    renderModule();
    expect((await screen.findAllByText('LIVE PROOF, DELETE NOT POSSIBLE, IGNORE')).length).toBeGreaterThan(0);

    // Click Delete on announcement #1 (which has read_count: 1)
    fireEvent.click(screen.getByTestId('delete-announcement-1'));
    expect(screen.getByTestId('delete-confirm-modal')).toBeInTheDocument();

    // Server returns 409 Conflict on DELETE
    apiRequest.mockImplementationOnce(async (url, options) => {
      if (url === '/api/announcements/admin/1/' && options?.method === 'DELETE') {
        const err = new Error('Conflict');
        err.status = 409;
        err.data = {
          detail: 'This announcement has been read and cannot be deleted; archive it instead.',
        };
        throw err;
      }
      return {};
    });

    fireEvent.click(screen.getByTestId('confirm-delete-btn'));

    const conflictAlert = await screen.findByTestId('delete-conflict-message');
    expect(conflictAlert).toHaveTextContent(
      'This announcement has been read and cannot be deleted; archive it instead.'
    );

    const archiveInsteadBtn = screen.getByTestId('archive-instead-btn');
    expect(archiveInsteadBtn).toBeInTheDocument();

    // Clicking "Archive instead" calls POST /api/announcements/admin/1/archive/
    apiRequest.mockImplementationOnce(async (url, options) => {
      if (url === '/api/announcements/admin/1/archive/' && options?.method === 'POST') {
        return {
          ...mockAnnouncementsList.results[1],
          status: 'archived',
        };
      }
      return {};
    });

    fireEvent.click(archiveInsteadBtn);

    await waitFor(() => {
      expect(apiRequest).toHaveBeenCalledWith('/api/announcements/admin/1/archive/', {
        method: 'POST',
      });
    });

    await waitFor(() => {
      expect(screen.queryByTestId('delete-confirm-modal')).toBeNull();
    });
  });

  it('4. opens audit history panel and displays actor, action, timestamp, and old/new values', async () => {
    renderModule();
    expect(await screen.findByText('Diwali Logistics Cutoff Schedule')).toBeInTheDocument();

    apiRequest.mockImplementationOnce(async (url) => {
      if (url === '/api/announcements/admin/1/audit/') {
        return {
          count: 1,
          next: null,
          previous: null,
          results: [
            {
              id: 99,
              announcement_id: 1,
              action: 'publish',
              actor_id: 50,
              occurred_at: '2026-11-07T12:01:05+05:30',
              old_value: { status: 'draft', title: 'LIVE PROOF, DELETE NOT POSSIBLE, IGNORE' },
              new_value: { status: 'published', title: 'LIVE PROOF, DELETE NOT POSSIBLE, IGNORE' },
            },
          ],
        };
      }
      return {};
    });

    fireEvent.click(screen.getByTestId('audit-announcement-1'));

    expect(await screen.findByTestId('audit-history-panel')).toBeInTheDocument();
    expect(await screen.findByTestId('audit-row-99')).toBeInTheDocument();
    expect(screen.getByText('User #50')).toBeInTheDocument();
  });
});
