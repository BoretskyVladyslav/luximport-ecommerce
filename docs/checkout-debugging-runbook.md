# Checkout Debugging Runbook

## Purpose
Use this guide when customers report "cannot buy product" errors.

## Quick triage
1. Reproduce checkout and capture network for:
   - `POST /api/checkout/create-order`
   - `POST /api/payment/init`
   - WayForPay redirect
2. Copy `correlationId` from API responses.
3. Search server logs by correlation ID to locate the exact failure checkpoint.

## Symptom -> likely cause
- `PAYMENT_ENV_INVALID`: duplicated/invalid `WAYFORPAY_*` or invalid `NEXT_PUBLIC_DOMAIN`.
- `CART_STALE` or `CART_TOTAL_MISMATCH`: client cart is stale vs Sanity inventory/pricing.
- `SANITY_UNAVAILABLE`: missing/invalid `SANITY_API_TOKEN`.
- `PAYMENT_WEBHOOK_SIGNATURE_MISMATCH`: incorrect secret key or payload tampering.
- `PAYMENT_WEBHOOK_AMOUNT_MISMATCH`: amount mismatch between order and gateway callback.

## Recovery actions
- **Payment init failed:** ask user to retry checkout, verify payment env and restart app.
- **Cart stale:** force cart revalidation and ask user to confirm updated totals.
- **Webhook failed but payment likely done:** inspect WayForPay dashboard, then reconcile order status.
- **NP delivery API outage:** switch user to manual delivery entry fallback.

## Release checks
- Happy path purchase reaches payment page and success route.
- Validation errors show inline and top-level UI, no raw crashes.
- Every API error includes `code` and `correlationId`.
