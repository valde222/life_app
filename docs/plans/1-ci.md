# 1 · CI

**Goal:** every push runs the tests; every phase tag builds the Windows app and the APK and attaches them to a GitHub release.

**Covers:** decision 15, build plan Git rule.

## Workflows

- `ci.yml` (push, pull request): Node 22; `npm ci`, lint, unit tests, build in `app/`; start PocketBase from `pocketbase/` with Docker, run Playwright end-to-end tests.
- `release.yml` (tags `v*`): build the web files once; job `windows` (windows-latest, Rust, `cargo tauri build`); job `android` (ubuntu, JDK 21, `npx cap sync android`, `./gradlew assembleDebug`); attach the installer and APK to the release.

The repo has no GitHub remote yet, so these run once Valdemar adds one.

## Steps

- [ ] `ci.yml`
- [ ] `release.yml`

## Done when

Both workflows parse (`actionlint`), and the commands they run pass locally.
