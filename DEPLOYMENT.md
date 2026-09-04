# Bakeaholic deployment

## Recommended host

Use Railway first for this project.

Why:

- it fits the current custom Node server without a rebuild
- it supports a custom domain
- it supports persistent volumes for `customers.json`, `orders-live.json`, and `catalog.json`
- it is simpler than Fly.io and more natural for this app than Shopify

Official docs:

- [Railway public networking](https://docs.railway.com/guides/public-networking)
- [Railway domains](https://docs.railway.com/guides/public-networking#custom-domains)
- [Railway volumes](https://docs.railway.com/reference/volumes)

## Required environment variables

At minimum:

- `HOST=0.0.0.0`
- `PORT=4173`
- `DATA_DIR=/app/runtime-data`
- `PUBLIC_SITE_URL=https://bakeaholicbali.com`
- `GOOGLE_MAPS_API_KEY=...`
- `BITESHIP_API_KEY=...`
- `BITESHIP_COURIERS=gojek,grab`
- `XENDIT_ENVIRONMENT=test` or `live`
- `XENDIT_SECRET_KEY=...`
- `XENDIT_CALLBACK_TOKEN=...`

Activate QRIS, Virtual Account, and Card channels in the Xendit dashboard. The storefront keeps all three payment methods on the Bakeaholic checkout: QRIS displays the Xendit QR code, Bank Transfer displays the generated virtual-account number, and Credit / Debit Card uses Xendit's embedded secure card component. Bank-app handoff and card authentication may still invoke the customer's banking or authentication flow when required, but the checkout itself must not send customers to a hosted Xendit Invoice page.

Optional but recommended for live messaging:

- `WHATSAPP_ACCESS_TOKEN=...`
- `WHATSAPP_PHONE_NUMBER_ID=...`
- `WHATSAPP_BUSINESS_ACCOUNT_ID=...`
- `WHATSAPP_VERIFY_TOKEN=...`
- `WHATSAPP_APP_ID=...`
- `WHATSAPP_APP_SECRET=...`
- `WHATSAPP_OTP_TEMPLATE_NAME=...`
- `WHATSAPP_ORDER_TEMPLATE_NAME=...`
- `WHATSAPP_ORDER_CANCELLED_TEMPLATE_NAME=order_cancelled`
- `WHATSAPP_SHIPPING_TEMPLATE_NAME=...`
- `WHATSAPP_ADMIN_NUMBER=...`
- `WHATSAPP_ADMIN_TEMPLATE_NAME=admin_order_alert_v5`
- `WHATSAPP_ADMIN_SHIPPING_TEMPLATE_NAME=admin_shipping_update_v2`
- `WHATSAPP_ADMIN_DELIVERY_RECOVERY_TEMPLATE_NAME=admin_driver_cancelled_v1`
- `WHATSAPP_ADMIN_DELIVERY_COMPLETE_TEMPLATE_NAME=admin_delivery_complete_v1`
- `WHATSAPP_REFUND_COMPLETED_TEMPLATE_NAME=refund_completed`
- `WHATSAPP_ADMIN_REFUND_TEMPLATE_NAME=admin_refund_update`
- `WHATSAPP_TEMPLATE_LANGUAGE=en`

`admin_order_alert_v5` replaces the legacy paid-order alert. It keeps the established nine body variables: event/status, order ID, safe customer-details notice, safe alert-privacy notice, total, payment method, delivery status, invoice URL, and action text. It has exactly three quick replies in this visible order: `Approve`, `Contact customer`, `Cancel`; map their payloads to `APPROVE BAK-0001`, `CONTACT_CUSTOMER`, and `CANCEL BAK-0001`. Do not configure a URL button and do not use the rejected `admin_order_alert_v3` contract. Approve accepts only the configured staff recipient's exact, fresh v5 reply context, rechecks the saved pickup/drop-off/items/service snapshot and live acceptable Biteship rate, atomically claims the action, then requests exactly one driver. Customer and staff shipping templates are sent only once the courier is allocated. Contact customer sends only that staff recipient a Cloud API contact card for the OTP-verified order owner (or a staff-only `wa.me` session link if contact cards are unsupported). Cancel uses the same exact context and a persisted 60-second Undo window; only committed cancellation sends `order_cancelled`, while `refund_completed` waits for the authenticated Xendit terminal event.

Customer payment reminders should use the app's WhatsApp templates. The payment reminder template button should point to `https://bakeaholicbali.com/pay.html?ref={{1}}`; the app sends a secure order reference so customers land on the Bakeaholic waiting-payment page first. Receipt buttons should point to `https://bakeaholicbali.com/invoice.html?ref={{1}}`.

For the `payment_receipt` WhatsApp template, set the dynamic website button in Meta to:

- Website URL: `https://bakeaholicbali.com/invoice.html?ref={{1}}`
- Sample URL: `https://bakeaholicbali.com/invoice.html?ref=BAK-0001.abc123`

Do not use `https://checkout.xendit.co/{{1}}` for receipt templates. The app sends a short secure reference such as `BAK-0001.<receipt-token>`; Meta owns the fixed URL prefix, so the template prefix must be Bakeaholic for the button to open the Bakeaholic receipt.

For `shipping_update_v2` and `admin_shipping_update_v2`, use their established four body variables: order ID, courier name, waybill/tracking number, and tracking/document link. Add dynamic website button 0 with base URL `https://bakeaholicbali.com/invoice.html?ref={{1}}`; the app sends the secure order reference only. Do not use `?{{1}}`.

`admin_driver_cancelled_v1` (Meta template ID `28967992756135901`) has exactly four body variables in order: order ID, courier, previous delivery/failed shipment reference, and reason. It has exactly one quick reply, `Request new driver`, with payload `REQUEST_NEW_DRIVER`; no Admin URL button and no self-delivery option. The app sends it only after a signed Biteship webhook or authenticated Biteship GET proves `cancelled`, `rejected`, or `courier_not_found` before pickup/handoff. Its click re-verifies the same failed shipment, paid/preparing state, stored route/items/service snapshot, no replacement, and an unchanged-or-lower live Biteship rate before making one replay-safe replacement booking. Any failed check sends a clear reply only to the requesting staff member.

`refund_completed` is sent to the verified order owner only after the authenticated Xendit refund callback reaches `processed`; a pending/requested refund never sends it. `admin_refund_update` is sent to staff for the same processed terminal event or a terminal failure.

The unpaid payment window is provider-aligned at +5 minutes, with reminders at +2 and +4 minutes. If Xendit reports a successful capture after local expiry/cancellation, the order is retained as `paid_late_review` for staff, with payment truth and audit preserved; it never reopens fulfillment, clears the already-expired cart again, or books delivery automatically. Use the governed refund workflow where appropriate.

Admin delivery proof is never included in customer responses. Orders staff can open only an authenticated, no-store Admin proof redirect; it resolves solely a stored, verified HTTPS Biteship proof URL and otherwise shows the explicit unavailable state.

Daily delivery approval can start from WhatsApp. The v5 Approve reply is bound to its clicked staff message and, after route/items/service/rate rechecks, creates exactly one governed Biteship delivery request. Cancel is bound to the same context and starts the persisted 60-second Undo window; only expiry of that window commits cancellation/refund. Explicit `APPROVE BAK-0001` and `CANCEL BAK-0001` must match that message context. Repeated, stale, or mismatched actions are rejected by saved order state.

## Lifecycle template migration order

1. In Meta, use submitted `admin_driver_cancelled_v1` (ID `28967992756135901`) and obtain approval for `admin_order_alert_v5`, `shipping_update_v2`, `admin_shipping_update_v2`, and `admin_delivery_complete_v1` with the contracts above. Keep `admin_order_alert_v3` unused.
2. Set the listed environment values, including refund templates, on the release candidate. Do not enable a URL button on v5 or on `admin_driver_cancelled_v1`.
3. Deploy the tested code once. Existing unpaid reminder records are versioned to the +2/+4/+5-minute schedule; old persisted 60-second staff-action records are not rescheduled at startup.
4. Verify authenticated webhook health and the templates' Meta approval before any resend. Never use diagnostics/resends to create a shipment, customer contact, cancellation, refund, or payment change.

In production, `WHATSAPP_APP_SECRET` is mandatory. The WhatsApp webhook rejects every POST when it is absent or the `X-Hub-Signature-256` does not validate. The Admin health result shows only `appSecretConfigured`, never the secret value.

Text commands also work from the configured admin number: `APPROVE`, `READY`, `KIRIM`, `SEND`, `CANCEL`, or `REFUND`. If several orders are waiting, include the order number, for example `APPROVE BAK-0001`.

Online checkout is blocked outside store hours. Default hours are daily, 09:00-17:00 Bali time (`Asia/Makassar`).

## Persistent storage

Mount a Railway volume to:

`/app/runtime-data` (the current production mount)

This keeps these files persistent across deploys:

- `catalog.json`
- `customers.json`
- `orders-live.json`
- `orders-test.json`
- `integrations.json`
- `vouchers.json`
- `uploads/`

The Railway volume is persistent storage, not a backup. Export or snapshot `/app/runtime-data` before a release and periodically thereafter; a restore test must be recorded before the backup/recovery checklist can be marked verified.

## Deploy steps on Railway

1. Create a new Railway project.
2. In Railway, set the service Root Directory to `/order-demo` if you connect the whole repository.
3. Deploy using the included `Dockerfile`.
4. If Railway does not detect the Dockerfile automatically, set `RAILWAY_DOCKERFILE_PATH=/order-demo/Dockerfile`.
5. Add a volume mounted at `/app/runtime-data`, and set `DATA_DIR=/app/runtime-data`.
6. Set the environment variables listed above.
7. Add `bakeaholicbali.com` as a custom domain in Railway.
8. In Namecheap, add the DNS records Railway provides.
9. After the public URL is live, set your Xendit invoice callback URL to:

`https://your-domain/api/xendit/invoice-callback`

## Backup and recovery

Follow `BACKUP_RECOVERY.md` before launch and on the documented schedule. A Railway volume is durable application storage, not an independent backup.

## Recommended production follow-up

This app is launchable now, but for stronger long-term reliability the next upgrade should be moving:

- customers
- addresses
- live orders

from JSON files into a real database.
## Ops synchronization

Set `OPS_SYNC_URL` and `STOREFRONT_SYNC_SECRET` only after the Ops marketplace migration and catalog ownership links are ready. Every order is written to the storefront first, then placed in `ops-sync-outbox.json`. Failed deliveries remain queued and are retried on the next order event; checkout is never lost because Ops is temporarily unavailable.
