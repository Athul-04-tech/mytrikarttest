import React, { useState, useEffect, useCallback } from 'react';
import {
  Megaphone,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Clock,
  ChevronLeft,
  ChevronRight,
  Info,
  ShieldAlert,
  MailOpen,
  Mail
} from 'lucide-react';
import { apiRequest } from '../../../utils/api';

function formatLocalDate(isoStr) {
  if (!isoStr) return '—';
  const d = new Date(isoStr);
  if (Number.isNaN(d.getTime())) return String(isoStr);
  return d.toLocaleString();
}

export default function SellerAnnouncementsView({
  unreadCount: parentUnreadCount,
  onUnreadCountUpdate,
}) {
  const [announcements, setAnnouncements] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [nextUrl, setNextUrl] = useState(null);
  const [prevUrl, setPrevUrl] = useState(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [errorStatus, setErrorStatus] = useState(null);

  const [unreadCount, setUnreadCount] = useState(
    typeof parentUnreadCount === 'number' ? parentUnreadCount : 0
  );
  const [selectedId, setSelectedId] = useState(null);
  const [markingReadId, setMarkingReadId] = useState(null);
  const [actionError, setActionError] = useState(null);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const data = await apiRequest('/api/announcements/unread-count/');
      const count = typeof data?.unread_count === 'number' ? data.unread_count : 0;
      setUnreadCount(count);
      if (onUnreadCountUpdate) {
        onUnreadCountUpdate(count);
      }
      return count;
    } catch {
      return null;
    }
  }, [onUnreadCountUpdate]);

  const fetchFeed = useCallback(async (targetPage = page) => {
    setLoading(true);
    setError(null);
    setErrorStatus(null);

    const qs = targetPage > 1 ? `?page=${targetPage}` : '';
    try {
      const data = await apiRequest(`/api/announcements/${qs}`);
      const rows = Array.isArray(data) ? data : (data?.results || []);
      setAnnouncements(rows);
      setTotalCount(typeof data?.count === 'number' ? data.count : rows.length);
      setNextUrl(data?.next || null);
      setPrevUrl(data?.previous || null);
    } catch (err) {
      setAnnouncements([]);
      setTotalCount(0);
      setNextUrl(null);
      setPrevUrl(null);
      setErrorStatus(err.status || null);
      setError(
        err.data?.detail ||
          err.message ||
          'Unable to load announcements from the server.'
      );
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchFeed(page);
    fetchUnreadCount();
  }, [page, fetchFeed, fetchUnreadCount]);

  useEffect(() => {
    if (typeof parentUnreadCount === 'number') {
      setUnreadCount(parentUnreadCount);
    }
  }, [parentUnreadCount]);

  const handleOpenAnnouncement = async (item) => {
    setSelectedId(item.id);
    setActionError(null);
    setMarkingReadId(item.id);
    try {
      const res = await apiRequest(`/api/announcements/${item.id}/read/`, {
        method: 'POST',
      });
      setAnnouncements((prev) =>
        prev.map((row) =>
          row.id === item.id
            ? {
                ...row,
                is_read: res?.is_read ?? true,
                read_at: res?.read_at || row.read_at || new Date().toISOString(),
              }
            : row
        )
      );
      await fetchUnreadCount();
    } catch (err) {
      setActionError(
        err.data?.detail || err.message || 'Failed to mark announcement as read.'
      );
    } finally {
      setMarkingReadId(null);
    }
  };

  // Unapproved Vendor (403) Clear In-Dashboard Message (not an error page)
  if (error && errorStatus === 403) {
    return (
      <div
        data-testid="seller-announcements-unapproved"
        className="bg-white rounded-3xl border border-[#FF811A]/40 p-8 text-center space-y-3 shadow-xs"
      >
        <div className="w-12 h-12 rounded-2xl bg-[#FFF3EC] text-[#FA661C] mx-auto flex items-center justify-center">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <span className="inline-block text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#FFF3EC] text-[#FA661C]">
          Onboarding Approval Required
        </span>
        <h2 className="font-['Outfit'] text-xl font-extrabold text-[#1A2420]">
          Vendor Announcements Unavailable Yet
        </h2>
        <p className="text-sm font-bold text-[#FA661C]" data-testid="unapproved-vendor-detail">
          {error}
        </p>
        <p className="text-xs text-[#6B6058] max-w-md mx-auto">
          Live marketplace announcements are shared with approved vendors. Once your vendor onboarding application is approved by platform staff, notices will appear here automatically.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-reveal" data-testid="seller-announcements-view">
      {/* Feed Header */}
      <div className="bg-white rounded-3xl border border-[#EAE3DC] p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#FF811A] bg-[#FFF3EC] px-2.5 py-0.5 rounded-full">
              SELLER HUB NOTICE FEED
            </span>
            <span
              data-testid="seller-feed-unread-badge"
              className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full ${
                unreadCount > 0
                  ? 'bg-[#D7263D] text-white'
                  : 'bg-[#E8F5E9] text-[#2E7D32]'
              }`}
            >
              {unreadCount} Unread
            </span>
          </div>
          <h1 className="font-['Outfit'] text-2xl sm:text-3xl font-extrabold text-[#FA661C] mt-1">
            Vendor Announcements
          </h1>
          <p className="text-xs text-[#6B6058] mt-0.5">
            Official platform notices for your store. Delivery is in-app only — no email or SMS is sent. Select an announcement to read it and mark it as read.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            fetchFeed(page);
            fetchUnreadCount();
          }}
          data-testid="seller-refresh-announcements-btn"
          className="px-3.5 py-2 bg-[#FFFFFF] border border-[#EAE3DC] rounded-xl hover:bg-[#FFF3EC] text-[#FA661C] text-xs font-bold inline-flex items-center space-x-1.5 self-start sm:self-auto cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh</span>
        </button>
      </div>

      {/* In-app Delivery Info Banner */}
      <div className="p-3.5 bg-[#FFF8F2] border border-[#FF811A]/40 rounded-2xl flex items-center space-x-2.5 text-xs text-[#6B6058]">
        <Info className="w-4 h-4 text-[#FA661C] shrink-0" />
        <span>
          <strong className="text-[#FA661C]">In-app delivery only:</strong> Announcements are published directly to this Seller Hub feed. Plain text only.
        </span>
      </div>

      {actionError && (
        <div
          data-testid="seller-announcement-action-error"
          role="alert"
          className="p-3.5 bg-[#FDE8EA] border border-[#D7263D]/40 rounded-2xl text-xs font-bold text-[#D7263D]"
        >
          {actionError}
        </div>
      )}

      {/* Feed Body */}
      {loading ? (
        <div
          data-testid="seller-announcements-loading"
          className="p-12 bg-white rounded-3xl border border-[#EAE3DC] text-center space-y-3"
        >
          <RefreshCw className="w-7 h-7 text-[#FA661C] animate-spin mx-auto" />
          <p className="text-xs font-bold text-[#6B6058]">Loading announcements...</p>
        </div>
      ) : error ? (
        <div
          data-testid="seller-announcements-error"
          className="p-8 bg-[#FDE8EA] border border-[#D7263D]/40 rounded-3xl text-center space-y-3"
        >
          <AlertCircle className="w-8 h-8 text-[#D7263D] mx-auto" />
          <h3 className="font-['Outfit'] text-base font-extrabold text-[#1A2420]">
            Unable to Load Announcements
          </h3>
          <p className="text-xs font-bold text-[#D7263D]">{error}</p>
          <button
            type="button"
            onClick={() => fetchFeed(page)}
            className="px-4 py-2 bg-[#FA661C] text-white rounded-xl text-xs font-bold cursor-pointer"
          >
            Retry
          </button>
        </div>
      ) : announcements.length === 0 ? (
        <div
          data-testid="seller-announcements-empty"
          className="p-12 bg-white rounded-3xl border border-[#EAE3DC] text-center space-y-2 shadow-xs"
        >
          <Megaphone className="w-8 h-8 text-[#FA661C] mx-auto opacity-75" />
          <h3 className="font-['Outfit'] text-base font-extrabold text-[#1A2420]">
            No announcements
          </h3>
          <p className="text-xs text-[#6B6058]">
            There are no live announcements for your vendor account right now.
          </p>
        </div>
      ) : (
        <div className="space-y-3" data-testid="seller-announcements-list">
          {announcements.map((item) => {
            const isExpanded = selectedId === item.id;
            const isUnread = !item.is_read;

            return (
              <article
                key={item.id}
                data-testid={`seller-announcement-item-${item.id}`}
                onClick={() => handleOpenAnnouncement(item)}
                className={`rounded-2xl border p-5 transition-all cursor-pointer shadow-2xs ${
                  isUnread
                    ? 'bg-[#FFF8F2] border-[#FA661C]/50 hover:border-[#FA661C]'
                    : 'bg-white border-[#EAE3DC] hover:border-[#FF811A]/50'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center space-x-2.5 min-w-0">
                    <span
                      className={`p-1.5 rounded-xl shrink-0 ${
                        isUnread
                          ? 'bg-[#FA661C] text-white'
                          : 'bg-[#FFF3EC] text-[#6B6058]'
                      }`}
                    >
                      {isUnread ? (
                        <Mail className="w-4 h-4" />
                      ) : (
                        <MailOpen className="w-4 h-4" />
                      )}
                    </span>
                    <h2 className="font-['Outfit'] text-base font-extrabold text-[#1A2420] break-words">
                      {item.title}
                    </h2>
                  </div>

                  <div className="flex items-center space-x-2 shrink-0">
                    <span
                      data-testid={`seller-announcement-status-${item.id}`}
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                        isUnread
                          ? 'bg-[#D7263D] text-white'
                          : 'bg-[#E8F5E9] text-[#2E7D32]'
                      }`}
                    >
                      {markingReadId === item.id
                        ? 'Marking read...'
                        : isUnread
                        ? 'Unread'
                        : 'Read'}
                    </span>
                    <span className="text-[11px] text-[#6B6058] flex items-center space-x-1">
                      <Clock className="w-3 h-3 text-[#FA661C]" />
                      <span>{formatLocalDate(item.publish_from)}</span>
                    </span>
                  </div>
                </div>

                {/* Plain text body — never rendered as HTML */}
                <div
                  data-testid={`seller-announcement-body-${item.id}`}
                  className={`mt-3 text-xs text-[#1A2420] whitespace-pre-line break-words leading-relaxed ${
                    isExpanded ? 'p-3.5 bg-white rounded-xl border border-[#EAE3DC]' : ''
                  }`}
                >
                  {item.body}
                </div>

                <div className="mt-3 pt-2.5 border-t border-[#EAE3DC]/60 flex flex-wrap items-center justify-between gap-2 text-[11px] text-[#6B6058]">
                  <div>
                    <span>Published: {formatLocalDate(item.publish_from)}</span>
                    {item.publish_until && (
                      <span className="ml-3">
                        Valid until: {formatLocalDate(item.publish_until)}
                      </span>
                    )}
                  </div>
                  <div>
                    {item.read_at ? (
                      <span className="text-[#2E7D32] font-bold">
                        Read at {formatLocalDate(item.read_at)}
                      </span>
                    ) : (
                      <span className="text-[#FA661C] font-bold">
                        Click to open and mark as read
                      </span>
                    )}
                  </div>
                </div>
              </article>
            );
          })}

          {/* Pagination Controls */}
          {(prevUrl || nextUrl) && (
            <div className="pt-2 flex items-center justify-between text-xs">
              <button
                type="button"
                disabled={!prevUrl}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                data-testid="seller-pagination-prev"
                className="px-3.5 py-2 rounded-xl border border-[#EAE3DC] bg-white font-bold text-[#1A2420] disabled:opacity-40 inline-flex items-center space-x-1 cursor-pointer disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Previous</span>
              </button>
              <span className="font-bold text-[#6B6058]">
                Page {page} ({totalCount} total)
              </span>
              <button
                type="button"
                disabled={!nextUrl}
                onClick={() => setPage((p) => p + 1)}
                data-testid="seller-pagination-next"
                className="px-3.5 py-2 rounded-xl border border-[#EAE3DC] bg-white font-bold text-[#1A2420] disabled:opacity-40 inline-flex items-center space-x-1 cursor-pointer disabled:cursor-not-allowed"
              >
                <span>Next</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

