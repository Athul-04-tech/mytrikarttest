const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

let inMemoryAccessToken = typeof window !== 'undefined' ? localStorage.getItem('mk_access_token') : null;
let inMemoryRefreshToken = typeof window !== 'undefined' ? localStorage.getItem('mk_refresh_token') : null;
let sessionExpiredListener = null;

export function setTokens({ access, refresh }) {
  inMemoryAccessToken = access || null;
  if (typeof window !== 'undefined') {
    if (access) {
      localStorage.setItem('mk_access_token', access);
    } else {
      localStorage.removeItem('mk_access_token');
    }
  }

  if (refresh !== undefined) {
    inMemoryRefreshToken = refresh || null;
    if (typeof window !== 'undefined') {
      if (refresh) {
        localStorage.setItem('mk_refresh_token', refresh);
      } else {
        localStorage.removeItem('mk_refresh_token');
      }
    }
  }
}

export function clearTokens() {
  inMemoryAccessToken = null;
  inMemoryRefreshToken = null;
  if (typeof window !== 'undefined') {
    localStorage.removeItem('mk_access_token');
    localStorage.removeItem('mk_refresh_token');
  }
}

export function getTokens() {
  if (typeof window !== 'undefined') {
    inMemoryAccessToken = localStorage.getItem('mk_access_token') || inMemoryAccessToken;
    inMemoryRefreshToken = localStorage.getItem('mk_refresh_token') || inMemoryRefreshToken;
  }
  return {
    access: inMemoryAccessToken,
    refresh: inMemoryRefreshToken,
  };
}

export function setOnSessionExpired(listener) {
  sessionExpiredListener = listener;
}

export class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

export async function apiRequest(endpoint, options = {}, isRetry = false) {
  const url = endpoint.startsWith('http')
    ? endpoint
    : `${BASE_URL}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;

  // The browser must generate the multipart content type (including its
  // boundary) for FormData.  Setting application/json here makes DRF try to
  // parse image/PDF bytes as JSON.
  const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;
  const headers = {
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...(options.headers || {}),
  };

  if (inMemoryAccessToken && !options.skipAuth) {
    headers['Authorization'] = `Bearer ${inMemoryAccessToken}`;
  }

  let response;
  try {
    response = await fetch(url, {
      ...options,
      headers,
    });
  } catch (netErr) {
    throw new ApiError(netErr.message || 'Network request failed', 0, null);
  }

  let data = null;
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    try {
      data = await response.json();
    } catch {
      data = null;
    }
  } else {
    try {
      const text = await response.text();
      data = text ? { message: text } : null;
    } catch {
      data = null;
    }
  }

  // Intercept 401 for single token refresh retry
  if (response.status === 401 && !isRetry && !options.skipAuth && inMemoryRefreshToken) {
    try {
      const refreshUrl = `${BASE_URL}/api/accounts/token/refresh/`;
      const refreshRes = await fetch(refreshUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh: inMemoryRefreshToken }),
      });

      if (refreshRes.ok) {
        const refreshData = await refreshRes.json();
        inMemoryAccessToken = refreshData.access;
        if (refreshData.refresh) {
          inMemoryRefreshToken = refreshData.refresh;
        }
        // Retry original request once
        return await apiRequest(endpoint, options, true);
      } else {
        // Refresh token failed/expired
        clearTokens();
        if (sessionExpiredListener) {
          sessionExpiredListener();
        }
        throw new ApiError('Session expired. Please log in again.', refreshRes.status, await refreshRes.json().catch(() => null));
      }
    } catch (err) {
      if (err instanceof ApiError) throw err;
      clearTokens();
      if (sessionExpiredListener) {
        sessionExpiredListener();
      }
      throw new ApiError('Session refresh failed.', 401, null);
    }
  }

  if (!response.ok) {
    const errorMsg = (data && (data.detail || data.message)) || `HTTP ${response.status} Error`;
    throw new ApiError(errorMsg, response.status, data);
  }

  return data;
}

export default {
  apiRequest,
  setTokens,
  clearTokens,
  getTokens,
  setOnSessionExpired,
  ApiError,
};
