# Bakeaholic backup and recovery

## Scope

Production state lives in the Railway volume mounted at `/app/runtime-data`. Back up the entire directory so orders, customers, catalog, vouchers, integration settings and uploaded media remain consistent.

Backups contain personal data and integration secrets. Store them privately, never commit them to Git, and restrict local files to the owner account.

## Schedule

- Immediately before launch.
- Before any payment, authentication, webhook or data-storage deployment.
- Daily during the first seven launch days.
- Weekly after the launch observation period.
- Keep at least one recent copy outside Railway.

## Export procedure

1. Create a dedicated Railway SSH key only for the export.
2. Register the public key in Railway account settings.
3. Create a compressed archive of `/app/runtime-data` through the Railway service connection.
4. Download the archive to a private folder outside the repository.
5. Record the UTC timestamp, release commit and Railway deployment ID alongside the archive.
6. Verify the archive can be listed and extracted without errors.
7. Remove the temporary Railway SSH key and confirm that it no longer appears in the account key list.

The export must not stop the service, mutate the volume, or expose the archive through the public website.

## Restore rehearsal

Never rehearse restoration over production.

1. Extract the archive into a new temporary directory.
2. Verify the required JSON files parse successfully.
3. Confirm `orders-live.json`, `customers.json`, `catalog.json`, `vouchers.json`, `integrations.json` and `uploads/` are present when they existed in the source snapshot.
4. Start a local or isolated Railway service with `DATA_DIR` pointing to the extracted directory.
5. Run the automated test suite and open the isolated storefront and admin login.
6. Confirm order counts and representative catalog records match the snapshot manifest.
7. Destroy the isolated rehearsal environment after verification; retain the private archive and verification record.

## Production recovery

1. Freeze admin writes and storefront checkout.
2. Take a final copy of the damaged state for investigation.
3. Create a new Railway volume rather than overwriting the damaged one in place.
4. Restore the latest verified archive to the new volume.
5. Attach the new volume at `/app/runtime-data` in an isolated deployment.
6. Verify authentication, catalog, order history and a non-payment smoke test.
7. Promote the restored deployment, then monitor Xendit, WhatsApp and Biteship callbacks.

## Verification record

- Latest verified backup: `/Users/edu/Documents/Codex/backups/bakeaholic/bakeaholic-runtime-2026-08-07.tar.gz`
- SHA-256: `a2129916c69c8729d61638bf76dac40afe4eff73be9461c6a092bd597165088e`
- Verified: `2026-08-07T08:18:33Z`
- Restore rehearsal: `PASSED` — all JSON parsed; isolated storefront returned `200`; unauthenticated admin session returned `401`
- Live orders in snapshot: `139`
- Temporary Railway SSH key: `REMOVED`; zero registered Railway SSH keys verified after cleanup
- Release commit: `9b60dd6bb4d188225f0740b6e9ffa7202f8ba78d`
- Railway deployment: `6b9fc35c-3b24-487d-b923-700b51663644`
