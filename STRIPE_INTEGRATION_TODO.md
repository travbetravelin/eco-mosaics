# Stripe Integration — TODO

Single source of truth for finishing the Stripe embedded Checkout form on `/pay`.

## Values to Replace

The following values are placeholders and must be updated before going live.

**Files containing placeholders:**
- [supabase/functions/create-checkout-session/index.ts](supabase/functions/create-checkout-session/index.ts)
- [src/pay.njk](src/pay.njk)

| Field | Current Value | What to Set |
|-------|--------------|-------------|
| mode | payment | Set to "payment" for one-time charges or "subscription" for recurring billing. |
| line_items[].price | price_... | Your actual Stripe Price ID from the Dashboard (https://dashboard.stripe.com/prices) or API. |
| stripePublishableKey (front matter) | pk_test_... | Publishable key from https://dashboard.stripe.com/test/apikeys (`pk_live_...` for production). Safe to commit — it is public. |
| checkoutEndpoint (front matter) | https://ktkdxgpsdwzuhsdkdzir.supabase.co/functions/v1/create-checkout-session | Correct if the function is deployed to the "Eco Mosaics Restoration" Supabase project. Change the ref if deployed elsewhere. |

## Configured Parameters

These parameters were configured in Checkout Studio and are already set correctly.

**Files containing these parameters:**
- [supabase/functions/create-checkout-session/index.ts](supabase/functions/create-checkout-session/index.ts)
- [src/pay.njk](src/pay.njk) (appearance)

| Parameter | Value |
|-----------|-------|
| ui_mode | form (requires Stripe SDK ≥ 21.0.0; function pins `npm:stripe@^22.6.2`) |
| billing_address_collection | auto |
| phone_number_collection | { enabled: false } |
| automatic_tax | { enabled: false } |
| payment_method_collection | always (only sent when mode is "subscription") |
| submit_type | auto |
| integration_identifier | custom_embedded_web_0001 |
| API version | 2026-03-25.dahlia; custom_checkout_payment_form_preview=v1 |
| Stripe.js | https://js.stripe.com/dahlia/stripe.js, beta `custom_checkout_payment_form_1` |
| appearance | theme stripe, colorPrimary #008f51, fontSizeBase 16px (see `src/pay.njk`) |

Added beyond Checkout Studio (required for `ui_mode: form`): `return_url` → `/payment-received/?session_id={CHECKOUT_SESSION_ID}`.

## Setup

1. **Restore the Supabase project** "Eco Mosaics Restoration" (`ktkdxgpsdwzuhsdkdzir`) — it is currently paused. Check the free-plan active-project limit first.
2. **Install the Supabase CLI** and link: `supabase link --project-ref ktkdxgpsdwzuhsdkdzir`
3. **Set secrets** (server-only, never commit):
   ```sh
   supabase secrets set STRIPE_SECRET_KEY=sk_test_...
   supabase secrets set SITE_URL=https://ecomosaicsrestoration.com
   ```
   `SITE_URL` also controls CORS. For local testing (`npm start`), set it to `http://localhost:8080`.
4. **Deploy:** `supabase functions deploy create-checkout-session --no-verify-jwt`
   (`--no-verify-jwt` lets the public page call it without a Supabase auth token.)
5. Replace the placeholders above, push to `main`.

## New Files

```
supabase/functions/create-checkout-session/index.ts   Edge Function — creates the Checkout Session
src/pay.njk                                            /pay — embedded payment form
src/payment-received.njk                               /payment-received/ — return page after payment
src/_includes/base.njk                                 (edited) loads Stripe.js when `stripeJs: true`
```

## How It Works

1. Visitor opens `/pay`; Stripe.js loads from js.stripe.com.
2. Page POSTs to the Edge Function, which creates a Checkout Session with the secret key and returns `client_secret`.
3. `initCheckoutFormSdk` renders the form in a Stripe-hosted iframe inside `#checkout-form`.
4. On submit, `actions.confirm` completes payment; Stripe redirects to `/payment-received/`.

## Testing

Use test keys (`pk_test_` / `sk_test_`). Any future expiry date, any CVC, any ZIP.

| Card | Result |
|------|--------|
| 4242 4242 4242 4242 | Succeeds |
| 4000 0025 0000 3155 | Requires 3D Secure |
| 4000 0000 0000 9995 | Declined (insufficient funds) |

Payments appear in https://dashboard.stripe.com/test/payments.

## Next Steps

- **Amount model:** the session charges a fixed Price. For variable invoice amounts, either create a Price per invoice or change the function to accept an amount/invoice ID and use `price_data` (validate server-side).
- **Fulfillment / records:** add a `checkout.session.completed` webhook (a second Edge Function using `STRIPE_WEBHOOK_SECRET`) if payments need to update anything automatically. Not added — nothing on the site currently consumes it.
- **Branding:** `colorPrimary` is the Checkout Studio value `#008f51`; site brand colors are moss `#4a6741` and amber `#c8864a`.
- **Go live:** swap to live keys, redeploy the function.
- `/pay` and `/payment-received/` are `noindex` and excluded from `sitemap.xml`.

## Resources

- https://support.stripe.com
- https://docs.stripe.com/mcp
