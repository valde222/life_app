# Security audit

The whole repo, checked against OWASP ASVS 5.0 (server and web app) and OWASP MASVS 2 (Android), with the Tauri desktop shell checked against Tauri's own security guide. One user, data reachable from the internet over HTTPS, so the bar is: nobody but that user can read or change anything, and nothing the apps receive from outside can run code in them.

Each check is ticked once it has been examined; a finding gets a number (S1…) and its own `fix(security): …` commit. Findings, severities and status end up in `docs/security.md`. To resume, continue from the first unticked box.

Severity: **High** (data readable or changeable by someone else, or code execution in the app), **Medium** (needs a second weakness or local access), **Low** (hardening), **Info** (accepted, documented).

## PocketBase (ASVS V4 API, V6 Authentication, V7 Sessions, V8 Authorization, V5 Files, V13 Configuration)

- [x] API rules on every collection allow only the signed-in user; nothing is public (V8)
- [x] `users` collection: sign-up off, list/view/update limited to yourself, no self-delete (V8, V6)
- [x] Superuser dashboard and superuser sign-in not reachable on the public address (V13)
- [x] Rate limits on, keyed on the real client address behind the tunnel (V6)
- [x] MFA: what PocketBase offers and what it needs (V6)
- [x] Auth token lifetime and how the apps refresh it (V7, V9)
- [x] Password strength enforced for the account and superuser at boot (V6)
- [x] File field protected, with type and size limits; files only readable with a file token (V5)
- [x] Text and JSON fields have size limits (V2)
- [x] Hooks: the sync hook can't be used to bypass rules; the purge cron only touches soft-deleted records (V15)
- [x] Migrations match the rules above; a test reads the live schema and fails if they drift (V13)
- [x] Automated attack tests against the dev server: every collection read, list, create, update and delete, signed out, with an expired token, with a forged token and with a superuser-shaped token; file download without a token (V8)
- [x] Error responses don't leak internals (V16)

## Web app, Angular (ASVS V1 Encoding, V3 Web Frontend, V7, V14, V16)

- [x] Markdown renderer: no way for note text to produce markup other than the allowed tags and attributes (V1)
- [x] Every `innerHTML` and `bypassSecurityTrust*` use (V1, V3)
- [x] Shared text and links: only `http(s)` links become `href`s; nothing becomes a script URL (V1)
- [x] Content Security Policy for the web build (V3)
- [x] Token storage and what happens on sign-out (V7, V14)
- [x] Local copy cleared when the account or server changes (V14)
- [x] What gets logged to the console, and whether it reaches device logs in release builds (V16)
- [x] Server URL field: only `http(s)`, and `http` only for local addresses (V12)

## Desktop, Tauri

- [x] Capabilities and permissions cut to what the app calls (Tauri security: capabilities)
- [x] Strict CSP in `tauri.conf.json` (Tauri security: CSP)
- [x] IPC commands validate their input; no custom commands, no remote origins in capabilities
- [x] `withGlobalTauri` exposure weighed against the permissions it can reach
- [x] Global hotkey and tray only show windows; single-instance ignores its arguments
- [x] Release build has devtools off and no debug logging

## Android, Capacitor (MASVS STORAGE, NETWORK, PLATFORM, CODE)

- [x] Cleartext traffic blocked in release, allowed only in debug (MASVS-NETWORK)
- [x] Exported components and intent filters; the share target only reads `content://` images from other apps, never its own files (MASVS-PLATFORM)
- [x] Shared text and image size limits (MASVS-PLATFORM)
- [x] Allowed navigation hosts; WebView mixed content off in release (MASVS-PLATFORM)
- [x] Backup flags: app data not in cloud or device-transfer backups (MASVS-STORAGE)
- [x] FileProvider paths and export (MASVS-PLATFORM)
- [x] Release signing: no keystore or passwords in the repo; releases signed from GitHub secrets, not debug builds (MASVS-CODE)
- [x] Permissions requested are the ones used (MASVS-PRIVACY)

## Secrets

- [x] gitleaks over the whole git history
- [x] `.env`, keystores and keys ignored by git
- [x] `.env.example` holds placeholders only
- [x] CI takes secrets from GitHub secrets only
- [x] Dev and test credentials are clearly dev-only and never used by the production compose file

## Dependencies

- [x] `npm audit` (app)
- [x] `cargo audit` (desktop)
- [x] Gradle dependencies scanned (Android)
- [x] Docker base images and tools at current, patched versions

## Docker and deployment

- [x] Image versions pinned, downloads checksum-verified
- [x] Containers run as non-root
- [x] Only needed ports, bound to localhost where possible
- [x] Read-only root filesystems, dropped capabilities, `no-new-privileges`
- [x] No secrets baked into images or passed on command lines
- [x] Healthchecks on every long-running service
- [x] Tunnel config: only PocketBase's API published, nothing else
- [x] Backups encrypted before leaving the Pi, and a tested restore path
- [x] Backup script safe with any password characters

## CI

- [x] gitleaks on every push
- [x] CodeQL for JavaScript/TypeScript, Java and Rust
- [x] Dependency audits on every push
- [x] Dependabot for npm, Cargo, Gradle, Docker and Actions
- [x] Workflows run with least-privilege `permissions`
- [x] Actions pinned to commit SHAs

## Wrap-up

- [x] `docs/security.md`: what's protected and how, every finding with severity and status, the Pi checklist
- [x] `/security-review` over every change on this branch, findings fixed
- [x] All unit, API and end-to-end tests pass; merge and tag
