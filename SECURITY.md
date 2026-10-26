# Security changes and deployment boundaries

This is targeted hardening informed by [OWASP Top 10:2025](https://top10.owasp.org/2025/en/), not a certification, penetration test or a claim of complete OWASP compliance. Only the supplied frontend and gateway source were available. A live backend, production headers, DNS and payment flow were not available for verification.

| OWASP 2025 risk | Repository changes | Remaining owner/deployment work |
| --- | --- | --- |
| A01 Broken Access Control | Removed fabricated users and JWTs; never trusts browser roles or prices; fixed upstream allowlist, origin/method checks | Authorize every backend resource/action; prevent direct backend bypass of the gateway |
| A02 Security Misconfiguration | Production response-header template; removed wildcard CORS, demo IP/security UI and unrelated domain configuration; fail-closed gateway setup | Apply and verify headers on the real host, scope cookies correctly, configure unique rate-limit namespaces |
| A03 Software Supply Chain Failures | Removed unused dependencies and stale lockfile; added npm lockfile and clean-install instructions | Maintain dependencies, protect CI/repository access, review audit results on every update |
| A04 Cryptographic Failures | Removed browser-persisted auth tokens and token display; gateway requires HTTPS upstream | Backend password hashing, encryption at rest, secrets management and secure session cookies |
| A05 Injection | React text rendering retained; bounded field validation; safe persisted cart image paths; only explicit API paths and headers forwarded | Validate schemas on the server, parameterize database access, safely encode email/content outputs |
| A06 Insecure Design | Removed fake success states; pending writes are guarded; cart kept on failure and only cleared on confirmed orders | Idempotent checkout, price/entitlement verification, fraud controls and transaction design |
| A07 Authentication Failures | Server-provided session/user required; legacy local tokens removed; real 429 feedback replaces local counters | Secure account creation, strong password policy, MFA where appropriate, revocation, account recovery and anti-enumeration |
| A08 Software or Data Integrity Failures | Persisted cart parsed defensively; no client totals sent to checkout; JSON response confirmation required | Verify payment webhooks and entitlement changes, bind orders to users, protect build/deploy pipeline |
| A09 Security Logging and Alerting Failures | Removed fake violation counters and exposed internals; generic service errors | Log security events server-side, redact credentials/PII, configure alerts and retention; not implemented by a browser UI |
| A10 Mishandling of Exceptional Conditions | Network errors, malformed responses, absent config, oversized bodies, invalid JSON, timeouts and limiter failures handled explicitly | Test backend failure/rollback paths and production recovery/availability |

## Gateway limits

The gateway uses Cloudflare-managed rate-limit bindings rather than an isolate-local Map. Keys are based on Cloudflare's connecting IP and a fixed route group, never a token prefix supplied by the caller. Auth login/register share the same limit. Bodies are bounded to 16KB even when Content-Length is absent. Redirects are not followed, and only a configured HTTPS origin receives requests. Cookies and CSRF validation remain the backend's responsibility; Origin checks alone do not authenticate non-browser callers.

The [Cloudflare Rate Limiting API](https://developers.cloudflare.com/workers/runtime-apis/bindings/rate-limit/) documents approximate limits per location. This gateway is not a globally strict quota or a complete WAF. Use backend/global controls when required. Enforce trusted proxy configuration and keep the backend unreachable except through authorized callers where possible.

## Verification completed

- Node security tests exercise hostile origins, forged token rotation, missing configuration, invalid upstreams, payload bounds, invalid JSON, method/path handling, redirects, upstream failures, response headers and persisted cart validation.
- React component tests exercise contact success/failure, forged stored login identities, server-confirmed login, safe checkout failure and Retry-After parsing.
- Lint, TypeScript configuration check, production build and dependency audit are run separately. `allowJs` does not enable full JavaScript type checking; ESLint and runtime tests provide the source checks here.
- The Playwright suite is supplied but browser execution and visual inspection were blocked by this environment. Do not treat test discovery as a passed browser test run.

## Before launch

Implement the README's backend contract, review its authorization/session/payment handling, configure the gateway and production headers, run the browser suite, inspect its screenshots on phone and desktop, and test the actual deployed endpoints and headers. Replace the original legal/social placeholder links with real destinations.
