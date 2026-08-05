# Bakeaholic launch audit

Last reviewed: 5 August 2026 (Asia/Makassar)

## Verified

- Automated release checks: 42/42 passing.
- Card, QRIS and Virtual Account creation workflows passed the recorded live tests.
- Customer and three-recipient admin WhatsApp flows passed, with idempotent quick-reply handling.
- Biteship booking, pickup, tracking and delivery updates passed the recorded live tests.
- The public storefront and admin route are both proxied by Cloudflare. The public route returned Cloudflare headers and the admin route returned a Cloudflare managed challenge.
- A Railway persistent volume is mounted at `/app/runtime-data`.
- Current Git branch before this release: `agent/fix-card-stale-session` at `507d1e4519f27a6a6c79f95fe05da3ae430e71e0`.
- Current Railway deployment before this release: `35ec5cfb-2a76-48d1-9c47-4d7900d1ef03`.

## Corrected in this release

- WhatsApp Approve and Cancel quick replies resolve the exact order for every configured admin recipient.
- Repeated admin actions are rejected by saved order state.
- Refund creation sends one admin update rather than one update per callback/retry.
- A Xendit accepted/processed refund remains visibly pending until the provider reports a final result; it no longer sends a premature customer “refund completed” message.
- Empty voucher storage remains empty instead of silently restoring legacy sample vouchers.
- Admin can delete all discounts in one operation.
- Invoice printing uses A5; report printing remains A4.
- CSV, PDF and on-screen reports include order and product-level detail.

## Launch blockers requiring an operator

1. **Independent data backup is not verified.** The Railway volume is durable storage, not a backup. Export `/app/runtime-data`, store it outside Railway, and perform one restore test before marking recovery verified.
2. **Production Xendit setting must be reconciled.** Railway currently reports `XENDIT_ENVIRONMENT=test`, while saved integration settings and successful live payments indicate live operation. Confirm the admin integration page says Live, then change the Railway variable to `live` so both sources agree.
3. **Named admin access is not implemented.** The current admin uses one shared password/session model. Do not share the password with a new administrator. Named accounts with roles and revocation should be a post-launch security upgrade.
4. **Discount cleanup needs an authenticated click.** After deploying, open Admin → Discounts → Delete all discounts, then create only the launch vouchers required.
5. Inventory and pricing require the owner's final commercial review.

## Release and rollback record

Complete these fields after the exact commit is deployed:

- Release tag: `v1.0.0-rc.1`
- Release commit: `PENDING`
- Railway deployment ID: `PENDING`
- Previous rollback deployment: `35ec5cfb-2a76-48d1-9c47-4d7900d1ef03`
- Smoke-test result: `PENDING`

Do not remove the previous successful Railway deployment until the 24–48 hour launch observation window is complete.
