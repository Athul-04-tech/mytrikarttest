// Central Configuration & API Origin Management for MytriKart
const rawApiUrl = import.meta.env.VITE_API_BASE_URL;

function computeApiBaseUrl() {
  const isProd = import.meta.env.PROD;
  const trimmed = typeof rawApiUrl === 'string' ? rawApiUrl.trim() : '';

  if (isProd) {
    if (!trimmed) {
      throw new Error(
        'CRITICAL CONFIGURATION ERROR: VITE_API_BASE_URL is missing or empty in production build. ' +
        'Production builds must specify an explicit production/staging API origin (e.g. VITE_API_BASE_URL="https://api-staging.example.com").'
      );
    }

    const lower = trimmed.toLowerCase();
    if (lower.includes('localhost') || lower.includes('127.0.0.1')) {
      throw new Error(
        `CRITICAL CONFIGURATION ERROR: Invalid production VITE_API_BASE_URL="${trimmed}". ` +
        'Production builds must not point to localhost or 127.0.0.1.'
      );
    }

    return trimmed.endsWith('/') ? trimmed.slice(0, -1) : trimmed;
  }

  // Development environment fallback
  if (!trimmed) {
    return 'http://127.0.0.1:8000';
  }
  return trimmed.endsWith('/') ? trimmed.slice(0, -1) : trimmed;
}

export const API_BASE_URL = computeApiBaseUrl();

/**
 * Resolves relative media paths (e.g. /media/products/item.png) to absolute URLs
 * using the configured API_BASE_URL. Absolute URLs are returned unchanged.
 * Empty or null paths return an explicit static fallback asset.
 *
 * @param {string|null|undefined} path - Media path or absolute URL
 * @returns {string} Absolute resolved URL or fallback asset path
 */
export function resolveMediaUrl(path) {
  if (!path || typeof path !== 'string' || !path.trim()) {
    return '/icons.svg';
  }

  const cleanPath = path.trim();

  // Return absolute URLs, protocol-relative URLs, or data URIs unchanged
  if (/^(https?:|\/\/|data:)/i.test(cleanPath)) {
    return cleanPath;
  }

  const normalizedPath = cleanPath.startsWith('/') ? cleanPath : `/${cleanPath}`;
  return `${API_BASE_URL}${normalizedPath}`;
}
