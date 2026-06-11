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
- `DATA_DIR=/app/data`
- `PUBLIC_SITE_URL=https://bakeaholicbali.com`
- `GOOGLE_MAPS_API_KEY=...`
- `BITESHIP_API_KEY=...`
- `BITESHIP_COURIERS=gojek,grab`
- `XENDIT_ENVIRONMENT=test` or `live`
- `XENDIT_SECRET_KEY=...`
- `XENDIT_CALLBACK_TOKEN=...`

Activate the customer-facing payment channels in the Xendit dashboard. The storefront offers card, QRIS, and virtual-account choices, then Xendit handles the secure payment flow for the selected channel.

Optional but recommended for live messaging:

- `WHATSAPP_ACCESS_TOKEN=...`
- `WHATSAPP_PHONE_NUMBER_ID=...`
- `WHATSAPP_BUSINESS_ACCOUNT_ID=...`
- `WHATSAPP_VERIFY_TOKEN=...`
- `WHATSAPP_APP_ID=...`
- `WHATSAPP_APP_SECRET=...`
- `WHATSAPP_OTP_TEMPLATE_NAME=...`
- `WHATSAPP_ORDER_TEMPLATE_NAME=...`
- `WHATSAPP_RECEIPT_TEMPLATE_NAME=...`
- `WHATSAPP_SHIPPING_TEMPLATE_NAME=...`
- `WHATSAPP_ADMIN_NUMBER=...`
- `WHATSAPP_ADMIN_TEMPLATE_NAME=...`
- `WHATSAPP_ADMIN_SHIPPING_TEMPLATE_NAME=...`
- `WHATSAPP_TEMPLATE_LANGUAGE=en`

For admin alerts, use a Meta-approved template whose body variables match the values the app sends: event/status, order id, customer name, customer phone, total, payment method, delivery status, and invoice URL.

For customer receipts, use a Meta-approved template whose body variables match the values the app sends: order id, total, and receipt URL.

For shipping updates, use a Meta-approved template whose body variables match the values the app sends: order id, courier name, waybill/tracking number, tracking link, and Biteship document/link.

Daily delivery approval can happen from WhatsApp. The configured admin number can reply `APPROVE BAK-0001`, `READY BAK-0001`, `KIRIM BAK-0001`, or `SEND BAK-0001`; the app will then create the Biteship delivery order. If stock is empty, admin can reply `CANCEL BAK-0001`; the app cancels the order and attempts a Xendit refund when a payment id is available, otherwise it marks the refund as manual-required for the Xendit dashboard.

The admin WhatsApp template can also use quick-reply buttons if Meta approves them. Use button payloads/text like `APPROVE {{order_id}}` and `CANCEL {{order_id}}`.

Online checkout is blocked outside store hours. Default hours are daily, 09:00-17:00 Bali time (`Asia/Makassar`).

## Persistent storage

Mount a Railway volume to:

`/app/data`

This keeps these files persistent across deploys:

- `catalog.json`
- `customers.json`
- `orders-live.json`
- `orders-test.json`

## Deploy steps on Railway

1. Create a new Railway project.
2. In Railway, set the service Root Directory to `/order-demo` if you connect the whole repository.
3. Deploy using the included `Dockerfile`.
4. If Railway does not detect the Dockerfile automatically, set `RAILWAY_DOCKERFILE_PATH=/order-demo/Dockerfile`.
5. Add a volume mounted at `/app/data`.
6. Set the environment variables listed above.
7. Add `bakeaholicbali.com` as a custom domain in Railway.
8. In Namecheap, add the DNS records Railway provides.
9. After the public URL is live, set your Xendit invoice callback URL to:

`https://your-domain/api/xendit/invoice-callback`

## Recommended production follow-up

This app is launchable now, but for stronger long-term reliability the next upgrade should be moving:

- customers
- addresses
- live orders

from JSON files into a real database.
