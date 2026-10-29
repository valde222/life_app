# 1 · Repo layout

**Goal:** one Angular app, wrapped by a Capacitor shell (Android) and a Tauri shell (desktop), next to PocketBase and deployment files. Anyone can find each service and its README.

**Covers:** decisions 2, 3, 4, 10, 15.

## Layout

| Path | Service |
| --- | --- |
| `app/` | Angular app (standalone components, signals). Capacitor config and `app/android/` live here because Capacitor plugins resolve from this `node_modules`. |
| `desktop/` | Tauri 2 shell (`desktop/src-tauri`). `frontendDist` points at `../app/dist/app/browser`; `beforeBuildCommand` stays empty. |
| `pocketbase/` | Dockerfile (pinned version), `pb_migrations/`, `pb_hooks/`, seed script. |
| `deploy/` | Backup job, tunnel notes, Pi instructions. |
| `docker-compose.yml` | Production on the Pi (arm64). |
| `docker-compose.dev.yml` | Development with seed data. |
| `.github/workflows/` | CI and release builds. |

## Versions (each at least two weeks old on 2026-10-29)

Angular 22.2.2, PocketBase v0.40.4, Capacitor 8, Tauri 2.

## Steps

- [ ] Scaffold the Angular app in `app/` (Vitest unit tests, SCSS, no SSR, routing)
- [ ] Top-level README: how the pieces fit, how to start the dev environment
- [ ] `app/README.md`
- [ ] `.gitignore` covers every tool added

## Done when

`npm test` and `npm run build` pass in `app/`, and the README tells Valdemar how to start the dev environment.
