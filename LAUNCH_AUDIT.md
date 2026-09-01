# Bakeaholic launch audit

Last reviewed: 7 August 2026 (Asia/Makassar)

## Launch decision

The storefront is ready for launch. Payment, cancellation, refund, delivery, WhatsApp, admin access and customer-session workflows have completed their recorded live tests. No further paid transaction is required before launch.

## Verified release

- Automated release checks: **49/49 passing** on 7 August 2026.
- Card, QRIS and Virtual Account creation workflows passed the recorded live tests.
- The successful card order completed the full delivery lifecycle.
- Customer and three-recipient admin WhatsApp flows passed, including duplicate suppression and idempotent quick replies.
- Biteship booking, retry, pickup, tracking and delivery updates passed the recorded live tests.
- Cancellation and refund initiation passed. Refund completion remains tied to Xendit's final webhook rather than an optimistic local status.
- Named staff accounts, scoped Storefront Manager and Orders Manager roles, revocation, staff TOTP, and owner authenticator protection are implemented.
- The public storefront and admin route are proxied by Cloudflare; unauthenticated admin API access is rejected.
- The production Railway volume is mounted at `/app/runtime-data` and reports Ready.
- GitHub release tag `v1.0.0`, `main`, and the deployed Railway commit all resolve to `9b60dd6bb4d188225f0740b6e9ffa7202f8ba78d`.

## Production configuration note

Railway still contains the fallback label `XENDIT_ENVIRONMENT=test`. Production first reads the persisted admin integration settings from `/app/runtime-data/integrations.json`; that setting is Live and uses the production key, as demonstrated by the completed live payments. Changing the fallback immediately before launch would restart a working service without improving the effective configuration. Reconcile the Railway label during a planned maintenance window after launch, then run a non-destructive configuration diagnostic.

## Data protection and recovery

- Railway persistent storage is healthy, and an independent private backup was verified on 7 August 2026.
- The backup and restore runbook is in `BACKUP_RECOVERY.md`.
- Verified archive: `/Users/edu/Documents/Codex/backups/bakeaholic/bakeaholic-runtime-2026-08-07.tar.gz`
- Archive SHA-256: `a2129916c69c8729d61638bf76dac40afe4eff73be9461c6a092bd597165088e`
- All JSON files parsed successfully, 139 live orders were present, and the restored copy booted in isolation with storefront `200` and unauthenticated admin session `401`.
- The temporary Railway SSH key was removed after export; Railway reported zero registered keys after cleanup.

## Owner launch checks

These are business decisions, not engineering blockers:

- Confirm launch inventory, stock and prices.
- Remove unwanted historical vouchers and create only the promotions intended for launch.
- Confirm the final staff-account list and disable any account that should not have launch access.

## Release and rollback record

- Release tag: `v1.0.0`
- Release commit: `9b60dd6bb4d188225f0740b6e9ffa7202f8ba78d`
- Railway deployment ID: `6b9fc35c-3b24-487d-b923-700b51663644`
- Railway deployment status: `SUCCESS` (7 August 2026, 09:40 Asia/Makassar)
- Previous stable commit: `76d722a74a23922c9d57a9ed0af1596f25fffe67`
- Previous Railway deployment ID: `36e98ba6-19ee-49c8-aef6-1d476618d077` (Railway has marked it removed)
- Rollback method: redeploy the previous stable Git commit; do not delete tag `v1.0.0`.
- Smoke-test result: storefront and legal pages return successfully through Cloudflare; unauthenticated admin session access returns `401`; automated checks pass 49/49.

## Release freeze

From this point until the 24–48 hour observation window completes:

- Do not change payment, webhook, WhatsApp, Biteship or session logic unless responding to a confirmed production incident.
- Do not run additional paid tests solely to reconfirm already-passed paths.
- Permit only catalog, inventory, price, voucher and staff-access changes required for normal operations.
- Record every emergency change with its Git commit and Railway deployment ID.
