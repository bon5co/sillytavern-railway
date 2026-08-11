#!/usr/bin/env node
/*
 * Seed SillyTavern's default-user account with a password BEFORE the web server
 * ever binds a port.
 *
 * Why this exists: the upstream Railway image ships config with
 * `enableUserAccounts: true` and `securityOverride: true`, and SillyTavern's
 * DEFAULT_USER is created with an EMPTY password and `admin: true`. On a stock
 * deploy the first stranger to reach the public URL can log in as that admin
 * with an empty password (verified: `POST /api/users/login` with password ""
 * returns 200), read every chat and persona, drive any configured LLM backend
 * on the deployer's API credits, and lock the real owner out by calling
 * `POST /api/users/change-password` (returns 204). Both competing Railway
 * listings ship this exact image with no mitigation.
 *
 * SillyTavern stores users in a node-persist store under `<dataRoot>/_storage`,
 * keyed `user:<handle>`, with the password hashed as
 * `scryptSync(password.normalize(), salt, 64).toString('base64')` and a
 * 16-byte base64 salt. We use the image's OWN node-persist so the on-disk
 * filename hashing always matches whatever version the server reads.
 *
 * Idempotent: seeds only when the record is missing or its password is empty,
 * so a password the deployer later sets in the UI is preserved across
 * redeploys. On a fresh volume the record does not exist yet, so seeding here
 * (before the server's own initUserStorage runs) means the very first request
 * the public port ever serves is already password-protected — no claim window.
 */
'use strict';

const crypto = require('crypto');
const path = require('path');
const np = require('node-persist');

const DATA_ROOT = process.env.ST_DATA_ROOT || '/home/node/app/data';
const HANDLE = 'default-user';
const KEY = `user:${HANDLE}`;

const password = process.env.ST_ADMIN_PASSWORD;
if (!password || !String(password).trim()) {
  console.error('[seed-admin] ST_ADMIN_PASSWORD is empty — refusing to boot with an anonymously claimable admin account.');
  process.exit(1);
}

(async () => {
  const storage = np.create({
    dir: path.join(DATA_ROOT, '_storage'),
    ttl: false,
    expiredInterval: 0,
  });
  await storage.init();

  let rec = await storage.getItem(KEY);
  if (rec && rec.password) {
    console.log('[seed-admin] default-user already has a password — leaving it unchanged.');
    return;
  }

  const salt = crypto.randomBytes(16).toString('base64');
  const hash = crypto.scryptSync(String(password).normalize(), salt, 64).toString('base64');

  if (!rec) {
    rec = { handle: HANDLE, name: 'User', created: Date.now() };
  }
  rec.password = hash;
  rec.salt = salt;
  rec.admin = true;
  rec.enabled = true;

  await storage.setItem(KEY, rec);
  console.log('[seed-admin] default-user password seeded from ST_ADMIN_PASSWORD.');
})().catch((err) => {
  console.error('[seed-admin] failed:', err && err.stack ? err.stack : err);
  process.exit(1);
});
