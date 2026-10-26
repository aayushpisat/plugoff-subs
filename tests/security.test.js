import test from 'node:test';
import assert from 'node:assert/strict';
import worker, { handleRequest } from '../cloudflare/rate-limiter-worker.js';
import { validateContactForm, validateEmail, validatePassword } from '../src/core/utils/validators.js';
import { normalizeCart } from '../src/core/utils/cart.js';

const request = (path = '/api/contact', headers = {}, body = '{}', method = 'POST') => new Request(`https://plugoff.example${path}`, {
  method, headers: { Origin: 'https://plugoff.example', 'Content-Type': 'application/json', 'CF-Connecting-IP': '203.0.113.1', ...headers },
  ...(method !== 'GET' && { body }),
});
const env = (limit = async () => ({ success: true })) => ({ API_ORIGIN: 'https://backend.example', AUTH_LIMITER: { limit }, CONTACT_LIMITER: { limit }, CHECKOUT_LIMITER: { limit }, API_LIMITER: { limit } });
const success = async () => new Response('{"success":true}', { headers: { 'Content-Type': 'application/json' } });

test('rejects hostile origins and cross-site requests before contacting the backend', async () => {
  for (const headers of [{ Origin: 'https://evil.example' }, { 'Sec-Fetch-Site': 'cross-site' }, { Origin: 'null' }]) {
    const result = await handleRequest(request('/api/contact', headers), env(), () => assert.fail('must not fetch'));
    assert.equal(result.status, 403);
  }
});
test('rotating forged bearer tokens cannot reset the rate-limit identity', async () => {
  const keys = [];
  const settings = env(async ({ key }) => { keys.push(key); return { success: keys.length < 2 }; });
  assert.equal((await handleRequest(request('/api/auth/login', { Authorization: 'Bearer forged-1' }), settings, success)).status, 200);
  const blocked = await handleRequest(request('/api/auth/register', { Authorization: 'Bearer forged-2' }), settings, success);
  assert.equal(blocked.status, 429);
  assert.equal(blocked.headers.get('Retry-After'), '60');
  assert.equal(keys[0], keys[1]);
});
test('missing bindings, missing client IP, and invalid upstream origins fail closed', async () => {
  for (const settings of [{}, { API_ORIGIN: 'https://backend.example' }, { ...env(), API_ORIGIN: 'http://backend.example' }, { ...env(), API_ORIGIN: 'https://plugoff.example' }, { ...env(), API_ORIGIN: 'https://backend.example/other' }]) {
    assert.equal((await handleRequest(request(), settings, () => assert.fail('must not fetch'))).status, 503);
  }
  const noIp = request(); noIp.headers.delete('CF-Connecting-IP');
  assert.equal((await handleRequest(noIp, env(), success)).status, 503);
});
test('unknown paths, wrong methods, oversized requests and invalid JSON are refused', async () => {
  assert.equal((await handleRequest(request('/api/auth/login/extra'), env(), success)).status, 404);
  assert.equal((await handleRequest(request('/api/contact', {}, undefined, 'GET'), env(), success)).status, 405);
  assert.equal((await handleRequest(request('/api/contact', { 'Content-Type': 'text/plain' }), env(), success)).status, 415);
  assert.equal((await handleRequest(request('/api/contact', {}, 'x'.repeat(16385)), env(), success)).status, 413);
  assert.equal((await handleRequest(request('/api/contact', {}, '{'), env(), success)).status, 400);
});
test('upstream is fixed and redirects, HTML fallbacks and failures do not become success', async () => {
  const result = await handleRequest(request('/api/contact?redirect=https://evil.example', { Authorization: 'Bearer forged' }), env(), async (target, options) => {
    assert.equal(target.href, 'https://backend.example/api/contact');
    assert.equal(options.redirect, 'manual');
    assert.equal(options.headers.get('Authorization'), null);
    return success();
  });
  assert.equal(result.status, 200);
  assert.equal(result.headers.get('Cache-Control'), 'no-store');
  assert.equal(result.headers.get('X-Content-Type-Options'), 'nosniff');
  assert.equal(result.headers.get('Access-Control-Allow-Origin'), null);
  for (const fetcher of [async () => new Response('', { status: 302 }), async () => new Response('<html>'), async () => { throw new Error('upstream secret'); }]) {
    const failed = await handleRequest(request(), env(), fetcher);
    assert.equal(failed.status, 502); assert.doesNotMatch(await failed.text(), /secret/);
  }
});
test('Cloudflare entry point accepts its ExecutionContext without treating it as fetch', async () => {
  const result = await worker.fetch(request(), {}, { waitUntil() {} });
  assert.equal(result.status, 503);
});
test('malformed cart storage cannot crash or inject unsafe media into the cart', () => {
  for (const value of [null, {}, 'x', [null, { id: 'x' }]]) assert.deepEqual(normalizeCart(value), []);
  const [item] = normalizeCart([{ id: 'x', productId: 'course', title: 'Course', price: 99, quantity: Infinity, image: 'javascript:alert(1)', freebies: [null, 'Book', 'Book'] }]);
  assert.equal(item.quantity, 1); assert.equal(item.image, ''); assert.deepEqual(item.freebies, ['Book']);
  const [bounded] = normalizeCart([{ id: 'y', productId: 'course', title: 'Course', price: 99, quantity: 100000 }]);
  assert.equal(bounded.quantity, 99);
});
test('contact validation handles wrong types, bounds, email and optional phone', () => {
  assert.equal(validateContactForm({ name: {}, email: [], message: 1 }).isValid, false);
  assert.equal(validateEmail('x'.repeat(255) + '@example.com') !== null, true);
  assert.equal(validateContactForm({ name: 'Test User', email: 'test@example.com', message: 'Hello there', phone: '+91 98765 43210' }).isValid, true);
  assert.equal(validateContactForm({ name: 'Test', email: 't@example.com', message: 'x'.repeat(5001) }).isValid, false);
  assert.equal(validatePassword('a long passphrase'), null);
  assert.notEqual(validatePassword('short'), null);
});
