# sillytavern-railway

[![Deploy on Railway](https://railway.com/button.svg)](https://railway.com/deploy/sillytavern-or-just-updated-ai-character?referralCode=Z1xivh&utm_medium=integration&utm_source=template&utm_campaign=generic)

**Deploy on Railway:** [SillyTavern template](https://railway.com/deploy/sillytavern-or-just-updated-ai-character?referralCode=Z1xivh&utm_medium=integration&utm_source=template&utm_campaign=generic)

A hardened Railway wrapper for [SillyTavern](https://github.com/SillyTavern/SillyTavern) — the
open-source AI chat / roleplay frontend — built on the upstream Railway image
[`ghcr.io/null2264/st-railway`](https://github.com/null2264/st-railway) and pinned to
**SillyTavern 1.18.0**.

## Why this wrapper exists

The upstream Railway image ships SillyTavern with `enableUserAccounts: true`, `securityOverride:
true`, and a `default-user` admin account created with an **empty password**. On a stock deploy the
first stranger to open the public URL can:

- log in as that admin with an empty password (`POST /api/users/login` with `password: ""` → `200`),
- read every chat, persona and lorebook, and drive any configured LLM backend on the deployer's own
  API credits,
- lock the real owner out permanently via `POST /api/users/change-password` (→ `204`).

This wrapper seeds the `default-user` password from `ST_ADMIN_PASSWORD` **before the web server ever
binds a port**, so the very first request the public URL serves is already password-protected — there
is no claim window. It uses the image's own `node-persist` store, so the on-disk record always matches
whatever version the server reads.

## Behaviour

- **Refuses to boot** on an empty `ST_ADMIN_PASSWORD` rather than shipping an open admin account.
- **Idempotent**: seeds only when the account has no password, so a password you later set in the UI
  survives every redeploy.
- Everything else — the config knobs, the persistent volume at `/home/node/app/persist`, the `$PORT`
  handling — matches upstream.

## Environment

| Variable | Required | Description |
| --- | --- | --- |
| `ST_ADMIN_PASSWORD` | yes | Password seeded onto the `default-user` admin account on first boot. Boot fails if empty. |

Volume: mount at `/home/node/app/persist` (character cards, chats, lorebooks, settings, the user store).

## Image

`ghcr.io/bon5co/sillytavern-railway:1.18.0` (also `:latest`), built from `Dockerfile` by GitHub
Actions on every push to `main`.
