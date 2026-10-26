import axios from 'axios';

// Use a same-origin reverse proxy so credentials never leave the site's origin.
const prefix = import.meta.env.VITE_API_URL || '';
if (prefix && (!prefix.startsWith('/') || prefix.startsWith('//') || /[\\?#]/.test(prefix))) {
  throw new Error('VITE_API_URL must be a same-origin path prefix.');
}
export const apiClient = axios.create({
  baseURL: prefix,
  allowAbsoluteUrls: false,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
});

export function parseRetryAfter(value, now = Date.now()) {
  const seconds = /^\d+$/.test(String(value)) ? Number(value) : Math.ceil((Date.parse(value) - now) / 1000);
  return Number.isFinite(seconds) ? Math.min(3600, Math.max(1, seconds)) : 30;
}

apiClient.interceptors.request.use((config) => {
  if (!/^\/api\/[a-z0-9/-]+$/i.test(config.url || '')) throw new Error('Invalid API endpoint.');
  // A server-issued CSRF cookie may accompany an HttpOnly session cookie.
  const csrfCookie = document.cookie.split('; ').find((entry) => entry.startsWith('csrf_token='));
  if (csrfCookie && !['get', 'head', 'options'].includes(config.method)) {
    config.headers['X-CSRF-Token'] = decodeURIComponent(csrfCookie.slice('csrf_token='.length));
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => {
    if (!response.headers['content-type']?.includes('application/json')) {
      throw new Error('The service is unavailable. Please try again later.');
    }
    return response;
  },
  (error) => {
    if (error.response?.status === 429) {
      window.dispatchEvent(new CustomEvent('security:rate-limited', { detail: {
        retryAfter: parseRetryAfter(error.response.headers['retry-after'] ?? error.response.data?.retryAfter),
      } }));
    }
    return Promise.reject(error);
  },
);

export const apiErrorMessage = (error, fallback) => {
  if (error.response?.status === 429) return 'Too many requests. Please wait before trying again.';
  if (error.response?.status === 401) return 'Invalid email or password.';
  return fallback;
};
