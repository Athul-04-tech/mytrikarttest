import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import SellerAnnouncementsView from '../SellerAnnouncementsView';
import { apiRequest } from '../../../../utils/api';

vi.mock('../../../../utils/api', () => ({
  apiRequest: vi.fn(),
}));

describe('SellerAnnouncementsView — Real Backend Wiring', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('1. renders unread badge from /api/announcements/unread-count/, marks announcement read on click, and updates unread badge from server', async () => {
    let serverUnreadCount = 1;
    let isItemRead = false;

    apiRequest.mockImplementation(async (url, options) => {
      if (url === '/api/announcements/') {
        return {
          count: 1,
          next: null,
          previous: null,
          results: [
            {
              id: 25,
              title: 'Plain Text Holiday Notice',
              body: 'All vendor payouts will process on schedule.',
              publish_from: '2026-11-10T08:00:00+05:30',
              publish_until: '2026-11-15T08:00:00+05:30',
              is_read: isItemRead,
              read_at: isItemRead ? '2026-11-10T09:00:00+05:30' : null,
            },
          ],
        };
      }
      if (url === '/api/announcements/unread-count/') {
        return { unread_count: serverUnreadCount };
      }
      if (url === '/api/announcements/25/read/' && options?.method === 'POST') {
        isItemRead = true;
        serverUnreadCount = 0;
        return {
          announcement_id: 25,
          is_read: true,
          read_at: '2026-11-10T09:00:00+05:30',
        };
      }
      return {};
    });

    const onUnreadUpdate = vi.fn();
    render(<SellerAnnouncementsView onUnreadCountUpdate={onUnreadUpdate} />);

    expect(await screen.findByText('Plain Text Holiday Notice')).toBeInTheDocument();
    expect(screen.getByTestId('seller-feed-unread-badge')).toHaveTextContent('1 Unread');
    expect(screen.getByTestId('seller-announcement-status-25')).toHaveTextContent('Unread');

    // Click announcement to open and mark as read
    fireEvent.click(screen.getByTestId('seller-announcement-item-25'));

    await waitFor(() => {
      expect(apiRequest).toHaveBeenCalledWith('/api/announcements/25/read/', {
        method: 'POST',
      });
    });

    await waitFor(() => {
      expect(screen.getByTestId('seller-feed-unread-badge')).toHaveTextContent('0 Unread');
      expect(screen.getByTestId('seller-announcement-status-25')).toHaveTextContent('Read');
      expect(onUnreadUpdate).toHaveBeenCalledWith(0);
    });
  });

  it('2. renders real empty state ("No announcements") when server returns 0 rows', async () => {
    apiRequest.mockImplementation(async (url) => {
      if (url === '/api/announcements/') {
        return { count: 0, next: null, previous: null, results: [] };
      }
      if (url === '/api/announcements/unread-count/') {
        return { unread_count: 0 };
      }
      return {};
    });

    render(<SellerAnnouncementsView />);

    expect(await screen.findByTestId('seller-announcements-empty')).toBeInTheDocument();
    expect(screen.getByText('No announcements')).toBeInTheDocument();
  });

  it('3. shows a clear message (not an error page) when an unapproved vendor gets 403', async () => {
    apiRequest.mockImplementation(async (url) => {
      const err = new Error('Forbidden');
      err.status = 403;
      err.data = { detail: 'An approved vendor account is required.' };
      if (url === '/api/announcements/' || url === '/api/announcements/unread-count/') {
        throw err;
      }
      return {};
    });

    render(<SellerAnnouncementsView />);

    expect(await screen.findByTestId('seller-announcements-unapproved')).toBeInTheDocument();
    expect(screen.getByTestId('unapproved-vendor-detail')).toHaveTextContent(
      'An approved vendor account is required.'
    );
  });
});

