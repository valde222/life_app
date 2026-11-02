# Diagrams and README review

Diagrams that explain how the app works, drawn from the code as it is today, and READMEs checked against the same code. Where the code differs from `docs/build-plan.md`, the diagram shows the code and notes the difference. Branch `docs/diagrams`. To resume, continue from the first unticked box.

## Rules

- Every diagram is one Mermaid block in one Markdown file under `docs/diagrams/`: one sentence, the diagram, at most three short notes. A crowded diagram becomes two files.
- One commit per diagram (`docs(diagrams): …`) and per README (`docs(readme): …`).
- A README covers what the service does, how to run it in dev and production, its config and environment variables, and what it talks to. Everything else moves out or goes. Every command is run before it stays.
- Commands are tested on a copy of the repo under a separate Compose project, so the running dev environment and its data aren't touched. Nothing is deployed to the Pi.

## Diagrams

- [x] 1. System overview (`01-system-overview.md`)
- [x] 2. Deployment: production (`02a-deployment-production.md`)
- [x] 2. Deployment: dev environment (`02b-deployment-dev.md`)
- [x] 3. Code structure: script that generates the Angular graphs from the real imports (`npm run diagrams`)
- [x] 3. Code structure: Angular layers (`03a-code-layers.md`, generated)
- [x] 3. Code structure: features to shared (`03b-features-to-shared.md`, generated)
- [x] 3. Code structure: features to core (`03c-features-to-core.md`, generated)
- [x] 3. Code structure: inside core (`03d-inside-core.md`, generated)
- [x] 3. Code structure: shared to core (`03e-shared-to-core.md`, generated)
- [x] 3. Code structure: Tauri modules (`03f-tauri-modules.md`)
- [x] 3. Code structure: Android native parts (`03g-android-native.md`)
- [x] 4. Data model (`04-data-model.md`)
- [x] 5. Sync: offline change to the other device (`05a-sync-offline-change.md`)
- [x] 5. Sync: conflicts (`05b-sync-conflict.md`)
- [x] 6. Sign-in: logging in and token refresh (`06a-sign-in.md`)
- [x] 6. Sign-in: expired token (`06b-expired-token.md`)
- [x] 7. Lifecycles: todo (`07a-todo-lifecycle.md`)
- [ ] 7. Lifecycles: open todo (`07b-todo-open-states.md`)
- [ ] 7. Lifecycles: quick note (`07c-note-lifecycle.md`)
- [ ] 7. Lifecycles: repeating item (`07d-repeating-lifecycle.md`)
- [ ] 8. Capture (`08-capture.md`)
- [ ] 9. Screen map: phone (`09a-screens-phone.md`)
- [ ] 9. Screen map: detail screens (`09b-screens-details.md`)
- [ ] 9. Screen map: desktop (`09c-screens-desktop.md`)
- [ ] 10. CI/CD (`10-ci-cd.md`)

## READMEs

- [ ] Top-level `README.md`
- [ ] `app/README.md`
- [ ] `app/android/README.md`
- [ ] `desktop/README.md`
- [ ] `pocketbase/README.md`
- [ ] `deploy/README.md`
- [ ] Every variable in `.env.example` and the Compose files documented; nothing documented that no longer exists

## Finish

- [ ] `docs/diagrams/README.md`: one line per diagram, in order
- [ ] Every diagram renders; `scripts/check-diagrams.sh` runs in CI, so a broken diagram fails the build
- [ ] `CLAUDE.md`: a change that affects a diagram or a README updates it in the same commit
