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
- `WHATSAPP_ADMIN_TEMPLATE_NAME=...`
- `WHATSAPP_ADMIN_REVIEW_TEMPLATE_NAME=...` (enable only after Meta approves it)
- `WHATSAPP_ADMIN_SHIPPING_TEMPLATE_NAME=...`
- `WHATSAPP_TEMPLATE_LANGUAGE=en`

For legacy admin alerts, use a Meta-approved template whose nine body variables match the values the app sends: event/status, order id, a safe Admin-screen customer-details notice, a safe alert-privacy notice, total, payment method, delivery status, invoice URL, and action text. Customer name and phone are deliberately not sent in alert variables.

The privacy-safe replacement staff template uses two body variables only: order ID and review reason/status. Add one dynamic website button labelled `Review order` with URL `https://bakeaholicbali.com/admin.html?section=orders&order={{1}}`. The secure Admin page then provides Approve, Cancel and Contact customer to authorised Orders staff. Set `WHATSAPP_ADMIN_REVIEW_TEMPLATE_NAME` only after Meta reports the template as Approved; while it is blank, the existing approved alert remains active. The replacement alert contains no customer name, phone, address or other customer detail.

Customer payment reminders should use the app's WhatsApp templates. The payment reminder template button should point to `https://bakeaholicbali.com/pay.html?ref={{1}}`; the app sends a secure order reference so customers land on the Bakeaholic waiting-payment page first. Receipt buttons should point to `https://bakeaholicbali.com/invoice.html?ref={{1}}`.

For the `payment_receipt` WhatsApp template, set the dynamic website button in Meta to:

- Website URL: `https://bakeaholicbali.com/invoice.html?ref={{1}}`
- Sample URL: `https://bakeaholicbali.com/invoice.html?ref=BAK-0001.abc123`

Do not use `https://checkout.xendit.co/{{1}}` for receipt templates. The app sends a short secure reference such as `BAK-0001.<receipt-token>`; Meta owns the fixed URL prefix, so the template prefix must be Bakeaholic for the button to open the Bakeaholic receipt.

For shipping updates, use a Meta-approved template whose body variables match the values the app sends: order id, courier name, waybill/tracking number, tracking link, and Biteship document/link. Add a dynamic website button with base URL `https://bakeaholicbali.com/invoice.html?{{1}}`; the app sends the order document query into that button so customer/admin can open tracking, invoice, and print details.

Daily delivery approval can happen from WhatsApp. The admin alert template should include quick-reply buttons named `Approve` and `Cancel`; the app resolves the order from the replied-to Meta message and also accepts explicit payloads such as `APPROVE BAK-0001` and `CANCEL BAK-0001`. Approve creates the Biteship delivery order once; cancel cancels the order and attempts a Xendit refund when a payment id is available, otherwise it marks the refund as manual-required for the Xendit dashboard. Repeated actions are rejected by the saved order state.

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
