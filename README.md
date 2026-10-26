# PlugOFF

React + Vite + Tailwind website. The existing illustrations, copy, colors, desktop compositions and interactive unplug effect are retained. Below 1024px, the illustrated sections place copy and artwork in separate areas, with fluid type, editorial spacing and blended image edges.

## Run

Requires Node.js 22.12+ (validated using Node.js 24.22.1).

```sh
npm ci
npm run dev
```

Open the local URL printed by Vite. For a production build:

```sh
npm run build
npm run preview
```

## Validate

```sh
npm run lint
npm run typecheck
npm test
npx playwright install chromium
npm run test:e2e
```

The browser suite covers all seven routes at 320, 360, 390, 768, 1024 and 1440 pixels, verifies that mobile copy and artwork do not overlap, checks horizontal overflow and menu/unplug controls, and saves full-page screenshots. Run it on your development machine before release; the supplied environment could not run Chromium or connect its remote browser to the local preview. No browser screenshots or visual approval are claimed.

## What changed

- Shared `IllustratedSection` keeps desktop backgrounds and makes mobile art an independent region. About, story, journal and contact reuse it.
- The home unplug scene sits between the two text blocks on mobile. Desktop text retains its outer columns.
- Journal heading width scales with the desktop text column. Phone forms use 16px input text, and compact timeline metrics fit their cards.
- Navigation exposes its expanded state and closes with Escape. Focus styles and reduced motion support were added. Footer FAQ navigation works across hash routes.
- Removed five unreachable modules, unused imports, unused API declarations, duplicate images and unreferenced development media. `public/` fell from approximately 45MB to 5.8MB.
- Removed unused Gemini, Express, dotenv, motion, esbuild, tsx and autoprefixer direct dependencies. Build tools are development dependencies. A reproducible npm lockfile replaces the stale Bun lockfile. The original install had an esbuild/Vite peer conflict; the cleaned package installs without peer overrides.
- Removed fake authentication, simulated successful messages/subscriptions/orders, fake tokens and simulated security claims. Real requests require explicit JSON confirmation. Without a connected backend, these actions display an honest error and retain user input/cart.
- Authentication uses server-managed cookie sessions. No bearer tokens or user credentials are persisted in browser storage. See [SECURITY.md](./SECURITY.md).

## Backend connection

No application backend was present in the repository. To activate login, registration, contact, newsletter and checkout, implement the contract below and serve it at the **same origin** as the frontend. The optional `VITE_API_URL` is a same-origin path prefix such as `/backend`; it is not a secret or an external API URL. The supplied gateway expects `/api/*` without a prefix.

| Method | Endpoint | Request / response |
| --- | --- | --- |
| GET | `/api/auth/me` | `{ "user": { "name": "...", "email": "..." } }`; 401 when signed out |
| POST | `/api/auth/login` | `{ email, password }`; returns `{ user: { name, email } }` and session cookie |
| POST | `/api/auth/register` | `{ name, email, password }`; returns the same user/session shape |
| POST | `/api/auth/logout` | `{}`; revoke session, expire cookie, return JSON |
| POST | `/api/contact` | `{ name, email, phone, message }`; return `{ "success": true }` only after accepting the message |
| POST | `/api/newsletter` | `{ email }`; return `{ "success": true }` only after accepting the subscription |
| POST | `/api/checkout` | `{ items: [{ productId, quantity, freebies }] }`; return `{ "orderId": "...", "status": "confirmed" }` only after server confirmation |

All responses must have `Content-Type: application/json`; use non-2xx responses for errors. Auth/session endpoints should not return tokens to the client. A server-issued `csrf_token` cookie is echoed as `X-CSRF-Token` on writes when present. The server must verify it and/or strictly enforce same-origin Origin and Fetch Metadata checks. `HttpOnly; Secure; SameSite=Lax` or stricter should be used for the session cookie. Cookies must be scoped for the public site domain, not the private upstream hostname.

Checkout sends product IDs, quantity and freebie selections; prices, discounts, tax, entitlements, inventory and payment verification must be resolved by the backend. Cart prices shown in the UI are estimates. This repository does not implement a payment processor or invent a paid/confirmed order.

## Deployment

`public/_headers` provides CSP and other response headers for hosts that support this format (for example Cloudflare Pages). On another host configure equivalent HTTP response headers; a file in the build does not automatically enable headers everywhere. Inline styles are still allowed for the existing dynamic artwork/SVG transforms; scripts are restricted to the same origin. Cloudinary and Unsplash remain the only external image sources.

An API gateway template is in `cloudflare/`. Attach it to the public site's `/api/*` routes, set `API_ORIGIN` to your real HTTPS backend origin, and configure the rate-limiting bindings in `wrangler.toml` with unique namespace IDs for your Cloudflare account. Wrangler 4.36+ supports these bindings. The gateway fails closed if configuration or bindings are missing. Its upstream may not equal the public origin, to prevent recursion. Do not route `/api/*` back to the SPA fallback.

Cloudflare rate limits are approximate and local to each location. The backend still needs strict abuse controls where necessary, authentication, authorization, session management, persistent validation, monitoring and trusted checkout logic. See the remaining work in [SECURITY.md](./SECURITY.md).

The footer's Privacy Policy and Terms links still use the original About destination; supply actual legal pages before launch. External social links also retain their original generic destinations.
