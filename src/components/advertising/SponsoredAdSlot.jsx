import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL, resolveMediaUrl } from '../../config/env';
import { getTokens } from '../../utils/api';

const SERVE_TIMEOUT_MS = 2000;

/**
 * Reusable Storefront Ad Slot for `header_banner` (3:1) and `product_page_top` (4:3).
 *
 * Rules:
 * - Fetches on mount with `cache: 'no-store'` and a 2-second timeout.
 * - Never blocks the rest of the page and renders NOTHING (`null`) on empty, null, error, or timeout.
 * - Never caches the serve response or `click_token` in localStorage, sessionStorage, URL, or logs.
 * - When an ad exists: renders a real `<a href={destination}>` link with the resolved `creative_url` photo,
 *   a clearly visible `"Sponsored"` label (using the server's `label`), and `product_name` for alt text
 *   and accessible link name, sized to the placement's aspect ratio (`3:1` or `4:3`).
 * - On click (left-click, Ctrl/Cmd-click, or middle-click): sends `POST /api/advertising/click/` with
 *   `{"click_token": ...}` in the request body and `keepalive: true` (including `Authorization: Bearer <token>`
 *   when a user is logged in), at most once per served ad instance, and navigates to `destination`
 *   immediately without waiting for the click response.
 */
export default function SponsoredAdSlot({ placement, productId, timeoutMs = SERVE_TIMEOUT_MS }) {
  const navigate = useNavigate();
  const [ad, setAd] = useState(null);
  const clickSentRef = useRef(false);

  useEffect(() => {
    setAd(null);
    clickSentRef.current = false;

    if (
      placement !== 'header_banner' &&
      placement !== 'product_page_top'
    ) {
      return undefined;
    }

    if (
      placement === 'product_page_top' &&
      (productId === undefined || productId === null || String(productId).trim() === '')
    ) {
      return undefined;
    }

    const endpoint =
      placement === 'product_page_top'
        ? `${API_BASE_URL}/api/advertising/serve/product_page_top/?product_id=${encodeURIComponent(
            String(productId).trim()
          )}`
        : `${API_BASE_URL}/api/advertising/serve/header_banner/`;

    let isMounted = true;
    const controller =
      typeof AbortController !== 'undefined' ? new AbortController() : null;

    const timerId = setTimeout(() => {
      if (controller) {
        try {
          controller.abort();
        } catch {
          // Ignore abort errors
        }
      }
      if (isMounted) {
        setAd(null);
      }
    }, timeoutMs);

    const { access } = getTokens();
    const headers = {};
    if (access) {
      headers['Authorization'] = `Bearer ${access}`;
    }

    fetch(endpoint, {
      method: 'GET',
      cache: 'no-store',
      headers,
      ...(controller ? { signal: controller.signal } : {}),
    })
      .then((res) => {
        if (!res.ok) return null;
        return res.json().catch(() => null);
      })
      .then((data) => {
        if (!isMounted) return;
        const served = data?.ad;
        if (
          served &&
          typeof served === 'object' &&
          served.creative_url &&
          served.destination &&
          served.click_token
        ) {
          setAd(served);
        } else {
          setAd(null);
        }
      })
      .catch(() => {
        // Render nothing on error or timeout; never log click_token
        if (isMounted) {
          setAd(null);
        }
      })
      .finally(() => {
        clearTimeout(timerId);
      });

    return () => {
      isMounted = false;
      clearTimeout(timerId);
      if (controller) {
        try {
          controller.abort();
        } catch {
          // Ignore abort errors
        }
      }
    };
  }, [placement, productId, timeoutMs]);

  const sendClickBeacon = useCallback(() => {
    if (!ad || !ad.click_token || clickSentRef.current) return;
    clickSentRef.current = true;

    const { access } = getTokens();
    const headers = {
      'Content-Type': 'application/json',
    };
    if (access) {
      headers['Authorization'] = `Bearer ${access}`;
    }

    try {
      fetch(`${API_BASE_URL}/api/advertising/click/`, {
        method: 'POST',
        keepalive: true,
        cache: 'no-store',
        headers,
        body: JSON.stringify({ click_token: ad.click_token }),
      }).catch(() => {
        // Fire-and-forget; never log click_token
      });
    } catch {
      // Ignore synchronous fetch exceptions
    }
  }, [ad]);

  const handleLinkClick = (e) => {
    if (!ad) return;
    sendClickBeacon();

    // Let browser handle Ctrl/Cmd-click, Shift-click, Alt-click, or non-primary button natively (e.g. open in new tab)
    const isModifiedClick =
      e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || (e.button !== undefined && e.button !== 0);

    if (!isModifiedClick) {
      e.preventDefault();
      navigate(ad.destination);
    }
  };

  const handleAuxClick = (e) => {
    if (!ad) return;
    // Middle-click (button === 1) opens in a new tab natively; record the click once
    if (e.button === 1) {
      sendClickBeacon();
    }
  };

  const handleMouseDown = (e) => {
    if (!ad) return;
    // Some browsers open a new tab on middle-button mousedown without firing click; record once
    if (e.button === 1) {
      sendClickBeacon();
    }
  };

  if (!ad) {
    return null;
  }

  const labelText = ad.label || 'Sponsored';
  const productName = ad.product_name || 'Sponsored Product';
  const imageSrc = resolveMediaUrl(ad.creative_url);
  const isHeaderBanner = placement === 'header_banner';

  return (
    <div
      data-testid={`sponsored-ad-slot-${placement}`}
      className={
        isHeaderBanner
          ? 'w-full bg-[#FFF8F2]/60 border-t border-[#EAE3DC]/70'
          : 'w-full'
      }
    >
      <div
        className={
          isHeaderBanner
            ? 'max-w-7xl mx-auto px-3 sm:px-4 md:px-8 py-2'
            : 'max-w-md'
        }
      >
        <a
          href={ad.destination}
          data-testid={`sponsored-ad-link-${placement}`}
          aria-label={`${labelText}: ${productName}`}
          onClick={handleLinkClick}
          onAuxClick={handleAuxClick}
          onMouseDown={handleMouseDown}
          className="group relative block w-full overflow-hidden rounded-2xl border border-[#EAE3DC] bg-white shadow-2xs hover:border-[#FA661C]/60 transition-colors"
        >
          <div
            data-testid={`sponsored-ad-aspect-box-${placement}`}
            style={{ aspectRatio: isHeaderBanner ? '3 / 1' : '4 / 3' }}
            className={`relative w-full overflow-hidden bg-[#F9F6F0] ${
              isHeaderBanner ? 'aspect-[3/1]' : 'aspect-[4/3]'
            }`}
          >
            <img
              data-testid={`sponsored-ad-img-${placement}`}
              src={imageSrc}
              alt={`${productName} (${labelText})`}
              className="w-full h-full object-cover object-center"
            />
            <span
              data-testid={`sponsored-ad-label-${placement}`}
              className="absolute top-2.5 left-2.5 z-10 inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-[#1A2420]/85 text-white border border-white/20 shadow-xs backdrop-blur-xs"
            >
              {labelText}
            </span>
          </div>
        </a>
      </div>
    </div>
  );
}

