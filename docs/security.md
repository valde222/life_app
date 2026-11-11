# Security

Life holds personal notes, photos and work data for one person, on a PocketBase that is reachable from the internet. This page says what protects that data, what the audit of October 2026 found and fixed, and what only you can do on the Pi. The checklist the audit followed (OWASP ASVS 5.0 for the server and web app, OWASP MASVS 2 for Android, Tauri's security guide for the desktop) is in `plans/security-audit.md`.

## What's protected, and how

**Only you can read or change anything.**
- Every record has an `owner`. The server sets it from your token when the record is created. Every rule on all eight collections says "signed in as a user, and the owner is you", and the owner can't be changed (decision 18).
- Sign-up is off and accounts can't delete themselves.
- Photos are protected files. They can only be fetched with a short-lived file token issued to the owner, and only images (no SVG, no HTML) up to 25 MB are accepted.
- `pocketbase/tests/access.test.mjs` tries to list, view, create, update and delete every collection, the accounts, the photos and the realtime feed. It runs signed out, with a really expired token, with three kinds of forged token, as a second real account and as a superuser coming through the tunnel. Every attempt must fail. It runs in CI against a fresh, hardened container, and it also reads the live schema so a migration can't quietly loosen a rule.

**The admin side isn't on the internet.**
- The tunnel serves PocketBase's API only; `/_/` and the superuser auth routes are refused.
- PocketBase also refuses any superuser request that arrived through a proxy, so even a leaked superuser token is useless from outside.
- You reach the admin UI over SSH (`deploy/README.md`).

**Guessing the password is slow.**
- Sign-in is limited to 5 tries a minute per client address. The address is the one the tunnel appends, not one a client can fake.
- In production PocketBase refuses to start with a password under 16 characters or an example value.
- Tokens last five days and the apps refresh them as they sync.

**Nothing the apps receive can run code.**
- Note markdown goes through a tokenizer that escapes every piece of text. A fuzz test checks that no input produces a tag or attribute outside a short allowlist.
- Both shells enforce a Content Security Policy: scripts only from the app, no inline scripts or handlers, network only over HTTPS (or plain HTTP to this machine). An end-to-end test checks it blocks injected scripts and nothing the app does.
- On the desktop, JavaScript can make exactly two native calls: the capture window may hide itself, and the main window may ask Life to open a note's file (`open_file`). Everything else (tray, windows, webviews, shortcuts, the opener and updater plugins) is refused. `open_file` only downloads over HTTPS (or HTTP from `localhost`), keeps the file inside its own temp folder whatever the name, caps it at 50 MB, and marks it as downloaded from the internet, so Windows asks before running a program and Office opens documents in Protected View. The Android plugin makes the same checks.
- On Android, the share target reads images only from other apps' `content://` providers. Shared text is capped.

**Traffic and data at rest on devices.**
- The apps only accept an `https://` server, or plain HTTP to `localhost`. Release APKs refuse cleartext at the OS level.
- Android keeps app data out of cloud backups and device transfers.
- Releases are signed release builds, never debuggable debug builds, with the keystore only in GitHub secrets.
- The desktop app installs an update only if its installer is signed by the updater key, whose private half lives only in GitHub secrets and your password manager. It fetches over HTTPS from GitHub and asks before installing.
- Signing in to a different server or account empties the local copy.

**On the Pi.**
- Every container runs read-only, with no Linux capabilities and `no-new-privileges`. PocketBase and the backup job run as uid 10001, and PocketBase listens only on `127.0.0.1`.
- The PocketBase download is checked against a pinned SHA-256, and base images are pinned by digest.
- Backups are encrypted with `age` to a public key whose private half never touches the Pi. `deploy/backup/test.sh` proves a backup can't be read without the key and restores into a working server.

**Supply chain.**
- CI runs with read-only tokens and actions pinned to commit SHAs.
- It runs gitleaks over the whole history, `npm audit` and OSV-Scanner on every push, and CodeQL on TypeScript, Java, Rust and the workflows.
- Dependabot watches npm, Cargo, Gradle, Docker, Compose and Actions. It skips TypeScript and Gradle wrapper major versions, which wait for Angular and Capacitor to move, and updates CodeQL's steps together.
- npm doesn't run dependencies' install scripts.

## Findings

Severity: **High**, someone else could read or change data, or run code in the app. **Medium**, needs a second weakness, local access or a mistake. **Low**, hardening. **Info**, accepted and explained.

| # | Severity | Finding | Status |
| --- | --- | --- | --- |
| S1 | High | Note markdown ran its link patterns over HTML it had already made, so `[[ https://x.com/onmouseover=alert(1)//]]` became a live event handler. Notes arrive from the share sheet, so any web page could do it | Fixed `0475116` |
| S2 | High | The tunnel published PocketBase at `/`: the admin dashboard and superuser sign-in were on the internet | Fixed `acd7e3a` |
| S3 | Medium | The share target opened any URI it was handed, including `file://` paths and Life's own FileProvider, so another app could make Life copy its private files (WebView storage holding the token) into a synced note | Fixed `3b549ec` |
| S4 | Medium | No rate limiting: the one password could be guessed at full speed | Fixed `38a8066` |
| S5 | Medium | Rules only checked "signed in": any second account could read, change and delete everything, and a stolen token could delete the account | Fixed `76004d8` |
| S6 | Medium | No Content Security Policy in either shell (`csp: null` in Tauri), so any injection could run script with the token in reach | Fixed `9cdee29` |
| S7 | Medium | Both desktop windows had `core:default` (tray, menus, webviews, events) from JavaScript | Fixed `f3ace42` |
| S8 | Medium | Android `allowBackup` was on, sending notes, photos and the token to cloud backups; cleartext wasn't explicitly refused | Fixed `3d1d853` |
| S9 | Medium | Backups left the Pi as plain zips; the backup job ran as root and built JSON from the password by hand | Fixed `c035bec` |
| S10 | Medium | The release workflow published the debuggable, debug-signed APK | Fixed `d5157d2` |
| S11 | Medium | PocketBase was downloaded without a checksum and ran as root; the superuser password went on a command line; weak passwords were accepted | Fixed `08731ad` |
| S12 | Low | The server address field accepted plain HTTP to any host | Fixed `773787a` |
| S13 | Low | CI ran with default token permissions and tag-pinned actions, with no secret, dependency or code scanning | Fixed `6fadcad` |
| S14 | Low | Advisories in build tooling: Vite, zod, uuid, xcode, glob, minimatch | Fixed `6223bb0`, `f0e0ac2` |
| S15 | Low | Tokens were never refreshed | Fixed `84cfd2d` |
| S16 | Low | Signing in to another server or account kept the old local copy | Fixed `1dc4526` |
| S17 | Low | Found by the closing `/security-review`: the public-address block matched the literal path `/api/collections/_superusers/`, so superuser sign-in still worked through the tunnel as `_SUPERUSERS` or by the collection's id (the token it gave was still refused) | Fixed `581504a` |
| I1 | Info | The sign-in token lives in WebView storage, readable by script in the app. An offline-first client can't use an HttpOnly cookie; S1, S6 and S7 are what keep script out | Accepted |
| I2 | Info | No MFA. PocketBase's MFA needs a second factor by email (OTP), which needs SMTP set up. Rate limits and a 16+ character password stand in | Your call (see below) |
| I3 | Info | RustSec advisories in `glib`, `zbus_names`, `zvariant`, `zvariant_derive` and `proc-macro-error`: Tauri's Linux backend, not compiled into the Windows build. Listed with reasons in `desktop/src-tauri/osv-scanner.toml` | Accepted |
| I4 | Info | `withGlobalTauri` exposes `window.__TAURI__`; with S7 fixed it can reach one command in each window (hide in the capture window, `open_file` in the main window) | Accepted |
| I5 | Info | Capacitor's template FileProvider shares broad paths, but isn't exported and the app never grants URIs from it; `config.xml`'s `access origin="*"` is a Cordova leftover Capacitor ignores | Accepted |
| I6 | Info | Gradle has no lockfile; the 50 release libraries were resolved and checked against OSV by hand (none affected), and Dependabot watches them | Accepted |
| I7 | Info | The Tailscale container runs as root (tailscaled needs it); it has `no-new-privileges` and userspace networking | Accepted |
| I8 | Info | Dev and test passwords are in `docker-compose.dev.yml` and `app/e2e/user.env` on purpose. The production compose file requires values from `.env` and refuses example ones | Accepted |

gitleaks found nothing in the 44 commits of history before the audit.

## What you need to do on the Pi

None of this is in the repo, and none of it was done for you.

- [ ] **SSH keys only.** In `/etc/ssh/sshd_config`: `PasswordAuthentication no`, `KbdInteractiveAuthentication no`, `PermitRootLogin no`. Restart `sshd`, and check you can still log in from a second terminal before closing the first. Better still, use Tailscale SSH and don't expose port 22 at all.
- [ ] **Automatic updates.** `sudo apt install unattended-upgrades && sudo dpkg-reconfigure -plow unattended-upgrades`. Once a month, `git pull && docker compose build --pull && docker compose up -d` to pick up patched images.
- [ ] **Firewall.** `sudo ufw default deny incoming && sudo ufw allow from 192.168.0.0/16 to any port 22 && sudo ufw enable` (adjust to your LAN). Forward no ports on the router; the tunnel needs none.
- [ ] **Tunnel and access.**
  - Use a tagged, single-use Tailscale auth key.
  - In the tailnet policy, allow Funnel only for this node's tag.
  - Turn on two-factor sign-in for your Tailscale identity provider and for GitHub.
  - After starting the tunnel, check from outside that `https://life.<tailnet>.ts.net/_/` doesn't show the dashboard and `/api/health` answers.
- [ ] **Secrets.** `chmod 600 .env`. Generate both passwords with `openssl rand -base64 24`. Make the age key and the Android keystore on your PC, and keep both in your password manager, never on the Pi.
- [ ] **Data folders.** Give them to the containers' user before the first start: step 3 of the first deploy in `deploy/README.md`.
- [ ] **Backup restore test.** Right after the first nightly backup, then every few months:
  - Copy the latest `life-*.zip.age` to your PC and decrypt it with `age -d -i life-backup.key`.
  - Check it unzips and holds `data.db`.
  - Run `deploy/backup/test.sh`.
  - Keep one backup somewhere other than the Pi's own disks.
- [ ] **MFA (optional, I2).** If you want a second factor: set up SMTP in the admin UI (Settings → Mail), then enable OTP and MFA on the `users` collection. Test it in a private window before signing out of the apps.
- [ ] **GitHub, when you add the remote.** Turn on secret scanning and push protection, Dependabot alerts and the CodeQL workflow's code scanning (Settings → Code security). Add the four `ANDROID_KEYSTORE_*` secrets and the two `TAURI_SIGNING_PRIVATE_KEY*` secrets. Protect `main`.
