# Security audit

The whole repo, checked against OWASP ASVS 5.0 (server and web app) and OWASP MASVS 2 (Android), with the Tauri desktop shell checked against Tauri's own security guide. One user, data reachable from the internet over HTTPS, so the bar is: nobody but that user can read or change anything, and nothing the apps receive from outside can run code in them.

Each check is ticked once it has been examined; a finding gets a number (S1…) and its own `fix(security): …` commit. Findings, severities and status end up in `docs/security.md`. To resume, continue from the first unticked box.

Severity: **High** (data readable or changeable by someone else, or code execution in the app), **Medium** (needs a second weakness or local access), **Low** (hardening), **Info** (accepted, documented).

## PocketBase (ASVS V4 API, V6 Authentication, V7 Sessions, V8 Authorization, V5 Files, V13 Configuration)

- [ ] API rules on every collection allow only the signed-in user; nothing is public (V8)
- [ ] `users` collection: sign-up off, list/view/update limited to yourself, no self-delete (V8, V6)
- [ ] Superuser dashboard and superuser sign-in not reachable on the public address (V13)
- [ ] Rate limits on, keyed on the real client address behind the tunnel (V6)
- [ ] MFA: what PocketBase offers and what it needs (V6)
- [ ] Auth token lifetime and how the apps refresh it (V7, V9)
- [ ] Password strength enforced for the account and superuser at boot (V6)
- [ ] File field protected, with type and size limits; files only readable with a file token (V5)
- [ ] Text and JSON fields have size limits (V2)
- [ ] Hooks: the sync hook can't be used to bypass rules; the purge cron only touches soft-deleted records (V15)
- [ ] Migrations match the rules above; a test reads the live schema and fails if they drift (V13)
- [ ] Automated attack tests against the dev server: every collection read, list, create, update and delete, signed out, with an expired token, with a forged token and with a superuser-shaped token; file download without a token (V8)
- [ ] Error responses don't leak internals (V16)

## Web app, Angular (ASVS V1 Encoding, V3 Web Frontend, V7, V14, V16)

- [ ] Markdown renderer: no way for note text to produce markup other than the allowed tags and attributes (V1)
- [ ] Every `innerHTML` and `bypassSecurityTrust*` use (V1, V3)
- [ ] Shared text and links: only `http(s)` links become `href`s; nothing becomes a script URL (V1)
- [ ] Content Security Policy for the web build (V3)
- [ ] Token storage and what happens on sign-out (V7, V14)
- [ ] Local copy cleared when the account or server changes (V14)
- [ ] What gets logged to the console, and whether it reaches device logs in release builds (V16)
- [ ] Server URL field: only `http(s)`, and `http` only for local addresses (V12)

## Desktop, Tauri

- [ ] Capabilities and permissions cut to what the app calls (Tauri security: capabilities)
- [ ] Strict CSP in `tauri.conf.json` (Tauri security: CSP)
- [ ] IPC commands validate their input; no custom commands, no remote origins in capabilities
- [ ] `withGlobalTauri` exposure weighed against the permissions it can reach
- [ ] Global hotkey and tray only show windows; single-instance ignores its arguments
- [ ] Release build has devtools off and no debug logging

## Android, Capacitor (MASVS STORAGE, NETWORK, PLATFORM, CODE)

- [ ] Cleartext traffic blocked in release, allowed only in debug (MASVS-NETWORK)
- [ ] Exported components and intent filters; the share target only reads `content://` images from other apps, never its own files (MASVS-PLATFORM)
- [ ] Shared text and image size limits (MASVS-PLATFORM)
- [ ] Allowed navigation hosts; WebView mixed content off in release (MASVS-PLATFORM)
- [ ] Backup flags: app data not in cloud or device-transfer backups (MASVS-STORAGE)
- [ ] FileProvider paths and export (MASVS-PLATFORM)
- [ ] Release signing: no keystore or passwords in the repo; releases signed from GitHub secrets, not debug builds (MASVS-CODE)
- [ ] Permissions requested are the ones used (MASVS-PRIVACY)

## Secrets

- [ ] gitleaks over the whole git history
- [ ] `.env`, keystores and keys ignored by git
- [ ] `.env.example` holds placeholders only
- [ ] CI takes secrets from GitHub secrets only
- [ ] Dev and test credentials are clearly dev-only and never used by the production compose file

## Dependencies

- [ ] `npm audit` (app)
- [ ] `cargo audit` (desktop)
- [ ] Gradle dependencies scanned (Android)
- [ ] Docker base images and tools at current, patched versions

## Docker and deployment

- [ ] Image versions pinned, downloads checksum-verified
- [ ] Containers run as non-root
- [ ] Only needed ports, bound to localhost where possible
- [ ] Read-only root filesystems, dropped capabilities, `no-new-privileges`
- [ ] No secrets baked into images or passed on command lines
- [ ] Healthchecks on every long-running service
- [ ] Tunnel config: only PocketBase's API published, nothing else
- [ ] Backups encrypted before leaving the Pi, and a tested restore path
- [ ] Backup script safe with any password characters

## CI

- [ ] gitleaks on every push
- [ ] CodeQL for JavaScript/TypeScript, Java and Rust
- [ ] Dependency audits on every push
- [ ] Dependabot for npm, Cargo, Gradle, Docker and Actions
- [ ] Workflows run with least-privilege `permissions`
- [ ] Actions pinned to commit SHAs

## Wrap-up

- [ ] `docs/security.md`: what's protected and how, every finding with severity and status, the Pi checklist
- [ ] `/security-review` over every change on this branch, findings fixed
- [ ] All unit, API and end-to-end tests pass; merge and tag
