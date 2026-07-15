# Longstory Short Story

A Cloudflare Workers Next/Vinext app for a paid AI fiction manuscript service. The website uses the supplied project logo as the visible brand mark and keeps payment/workflow secrets on server routes.

## What Is Included

- Premium marketing homepage with the provided logo in the header and footer.
- Supabase email/password sign-in with password reset.
- Authenticated dashboard showing submitted orders and status.
- New story submission flow that saves an order before checkout.
- Stripe Checkout session route with promotion-code support.
- Square payment-link flow alongside Stripe, with webhook handling for both providers.
- Payment success/cancel pages, contact page, privacy policy, and terms page.
- Supabase SQL migration for `profiles` and `story_orders` with RLS.

## Assets

- Original logo: `long story short story logo.png`
- Public original copy: `public/logo.png`
- Cropped website logo: `public/logo-cropped.png`
- Grok Imagine hero image: `public/hero-manuscript.png`

## Local Setup

Create `.env.local` from `.env.example` and fill in real keys:

```bash
cp .env.example .env.local
```

Required environment variables:

- `NEXT_PUBLIC_APP_URL`
- `SUPPORT_EMAIL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_PRICE_ID`
- `SQUARE_APPLICATION_ID`
- `SQUARE_ACCESS_TOKEN`
- `SQUARE_LOCATION_ID`
- `SQUARE_WEBHOOK_SIGNATURE_KEY`
- `SQUARE_WEBHOOK_NOTIFICATION_URL`
- `N8N_WEBHOOK_URL`

Never place `SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, or Square secret values in frontend code.

## Supabase

Run the SQL in `supabase/migrations/0001_initial.sql` against the Supabase project:

```text
https://spkcsrasflfenwuttrdv.supabase.co
```

The migration enables RLS so users can read and create only their own story orders. Server routes use the service-role key for payment and workflow status updates.

For password reset, make sure Supabase Auth redirects include:

```text
https://longstory-short-story.gkedia.workers.dev/login
```

## Stripe

Create a one-time $29.99 USD Price in Stripe and set its ID as `STRIPE_PRICE_ID`. Configure a webhook endpoint for:

```text
/api/stripe/webhook
```

Listen for:

```text
checkout.session.completed
```

The webhook verifies the Stripe signature, updates the order as paid, and posts the manuscript payload to n8n.

## Square

Create a Square app, add the four Square credentials above, and configure the webhook subscription to point at:

```text
/api/square/webhook
```

Listen for payment events such as `payment.created` and `payment.updated`. The app uses the payment link flow for checkout and marks the matching order paid when Square confirms the payment webhook.

## n8n

The default workflow endpoint is:

```text
https://n8n.srv822882.hstgr.cloud/webhook/de6ee764-0eb3-41b0-9172-16ea4f8e31c7
```

The browser never calls n8n directly. The server webhook route sends the payload only after Square confirms payment.

## Development

Do not use ports 3000 or 3001 for this project.

```bash
npm install
npm run dev -- --port 5173
```

Validation:

```bash
npm run lint
npm run build
npm audit
```

## Cloudflare Deployment

Build with:

```bash
npm run build
```

Deploy the generated Worker with Wrangler:

```bash
npx wrangler deploy --config dist/server/wrangler.json
```

Set production runtime variables and secrets in Cloudflare Workers. Do not commit secret values.
