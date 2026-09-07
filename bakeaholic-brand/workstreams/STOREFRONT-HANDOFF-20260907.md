# Storefront handoff — 7 September 2026

## Candidate

- Branch: `fix/storefront-live-contract-reconcile-20260907`
- Final SHA: `0cf46e3a31b4e23411376101b05bfe77bed917a9`.
- Integration base: `origin/main` `20a7bfc0b628850d5f4b21217f2483f547e26067`.
- Live contract source: `40cf33ec0d74d6e7f4336f815548bbbdd7e94a24`.
- Production unchanged; no Meta, catalogue, spend, customer-contact or OAuth changes.

## Bounded changes

- Preserved the live fulfilment, payment, cart, receipt, roles and promotion contract while reconciling current main.
- Standardized all 12 Bali stockist logos into centered white slots with preserved aspect ratio; added whitespace-trimmed WHSmith and Bali Direct optical assets.
- Bliss Balls Any 4 Packs (Rp250K) runs through 12 Sep 2026 00:00 WITA exclusive; Cookies Any 12 (Rp200K) remains through 14 Sep 2026 00:00 WITA; both are concurrently active, with tax and delivery separate.

## Evidence

- Node syntax checks pass; full suite 88/88 pass; `git diff --check` pass.
- Desktop local QA: both promo cards visible, all 12 logos uniform and centered, no horizontal overflow.
- Mobile 390px QA: two promo cards present, overflow false, every logo fits its card.

## Approval boundary

Local integration only. A new exact SHA requires separate release approval; do not deploy, rewrite main, or force-push from this checkpoint.
