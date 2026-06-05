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
- `GOOGLE_MAPS_API_KEY=...`
- `BITESHIP_API_KEY=...`
- `BITESHIP_COURIERS=gojek,grab`
- `XENDIT_ENVIRONMENT=test` or `live`
- `XENDIT_SECRET_KEY=...`
- `XENDIT_CALLBACK_TOKEN=...`

Optional but recommended for live messaging:

- `WHATSAPP_ACCESS_TOKEN=...`
- `WHATSAPP_PHONE_NUMBER_ID=...`
- `WHATSAPP_BUSINESS_ACCOUNT_ID=...`
- `WHATSAPP_VERIFY_TOKEN=...`
- `WHATSAPP_APP_ID=...`
- `WHATSAPP_APP_SECRET=...`
- `WHATSAPP_OTP_TEMPLATE_NAME=...`
- `WHATSAPP_ORDER_TEMPLATE_NAME=...`
- `WHATSAPP_TEMPLATE_LANGUAGE=en`

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
