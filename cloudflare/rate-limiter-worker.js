const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Cache-Control': 'no-store',
  'Strict-Transport-Security': 'max-age=31536000',
};
const ROUTES = new Map([
  ['/api/auth/login', ['POST', 'AUTH_LIMITER']],
  ['/api/auth/register', ['POST', 'AUTH_LIMITER']],
  ['/api/auth/logout', ['POST', 'AUTH_LIMITER']],
  ['/api/auth/me', ['GET', 'API_LIMITER']],
  ['/api/contact', ['POST', 'CONTACT_LIMITER']],
  ['/api/newsletter', ['POST', 'CONTACT_LIMITER']],
  ['/api/checkout', ['POST', 'CHECKOUT_LIMITER']],
]);
const json = (status, message, headers = {}) => new Response(JSON.stringify({ message }), {
  status, headers: { ...SECURITY_HEADERS, 'Content-Type': 'application/json', ...headers },
});

export async function handleRequest(request, env, upstreamFetch = fetch) {
  const url = new URL(request.url);
  const route = ROUTES.get(url.pathname);
  if (!route) return json(404, 'Not found');
  // Deploy same-origin at /api/*; cross-origin browser calls are not accepted.
  const origin = request.headers.get('Origin');
  if ((origin && origin !== url.origin) || request.headers.get('Sec-Fetch-Site') === 'cross-site') return json(403, 'Forbidden');
  if (request.method !== route[0]) return json(405, 'Method not allowed', { Allow: route[0] });
  if (request.method === 'POST' && origin !== url.origin) return json(403, 'Forbidden');
  if (request.method === 'POST' && request.headers.get('Content-Type')?.split(';')[0].trim() !== 'application/json') return json(415, 'Expected JSON');

  // Never derive identity from an unverified Authorization token or client-supplied JWT.
  const ip = request.headers.get('CF-Connecting-IP');
  const limiter = env?.[route[1]];
  if (!ip || !limiter || !env?.API_ORIGIN) return json(503, 'Service unavailable');
  let target;
  try {
    target = new URL(env.API_ORIGIN);
    if (target.protocol !== 'https:' || target.origin === url.origin || target.username || target.password || target.pathname !== '/' || target.search || target.hash) throw new Error('Invalid origin');
    const result = await limiter.limit({ key: `${route[1]}:${ip}` });
    if (!result.success) return json(429, 'Too many requests. Please wait.', { 'Retry-After': '60' });
  } catch { return json(503, 'Service unavailable'); }
  let body;
  if (request.method === 'POST') {
    // Read a bounded stream; do not trust Content-Length to prevent oversized payloads.
    const reader = request.body?.getReader();
    const chunks = []; let size = 0;
    if (reader) {
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          size += value.byteLength;
          if (size > 16384) { await reader.cancel(); return json(413, 'Request too large'); }
          chunks.push(value);
        }
      } catch { return json(400, 'Invalid request'); }
    }
    body = new Uint8Array(size); let offset = 0;
    for (const chunk of chunks) { body.set(chunk, offset); offset += chunk.byteLength; }
    try { JSON.parse(new TextDecoder().decode(body)); } catch { return json(400, 'Invalid JSON'); }
  }
  target.pathname = url.pathname;
  // Only explicit headers reach the fixed upstream. Cookies and CSRF are verified there.
  const headers = new Headers({ Accept: 'application/json', 'Content-Type': 'application/json' });
  for (const name of ['Cookie', 'X-CSRF-Token', 'Origin']) {
    const value = request.headers.get(name); if (value) headers.set(name, value);
  }
  try {
    const response = await upstreamFetch(target, { method: request.method, headers, body, redirect: 'manual', signal: AbortSignal.timeout(10000) });
    if (response.status >= 300 && response.status < 400) return json(502, 'Service unavailable');
    if (!response.headers.get('Content-Type')?.includes('application/json')) return json(502, 'Service unavailable');
    const result = new Headers(response.headers);
    result.delete('Access-Control-Allow-Origin'); result.delete('Access-Control-Allow-Credentials');
    for (const [key, value] of Object.entries(SECURITY_HEADERS)) result.set(key, value);
    return new Response(response.body, { status: response.status, headers: result });
  } catch { return json(502, 'Service unavailable'); }
}
export default { fetch(request, env) { return handleRequest(request, env); } };
