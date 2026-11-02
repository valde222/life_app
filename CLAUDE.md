# Life app

A personal todo, notes and repeating-chores app for one user: an Android app and a desktop app, backed by a self-hosted PocketBase.

## Read first, every session

1. `docs/build-plan.md` is the brief: decisions, data model, behaviour rules (R1…), acceptance tests (T1…), build phases and working rules. Follow it. Don't reverse a decision in its log without asking.
2. `docs/TODO.md` is the overall checklist. If it doesn't exist yet, write it before any code (see the build plan's Planning rule).
3. The plan in `docs/plans/` for the first unticked line in `TODO.md`, then `git log --oneline -20`.
4. Continue from the first unticked step.

## Reference

- `docs/screens/png/` shows every screen; `docs/screens/html/` has the exact markup and values. Build to match.
- `docs/design-system/` holds the tokens (`tokens.json`), the writing rules (`README.md`) and one file per component. Use only these values.

## Working rules (short version; the build plan has the full one)

- Build the whole app in one run, phase after phase. Stop only for a decision the docs can't answer that would be costly to undo; otherwise pick the reasonable option, log it, carry on.
- Plan each feature in `docs/plans/` and commit the plan before coding it.
- Small commits, one logical change each, conventional messages naming the rule or test (`feat: … (R18)`). Tick the plan step and the `TODO.md` line in the same commit.
- Each phase: branch, tests pass, merge to `main`, tag (`v0.1-foundations`, …).
- Keep `.gitignore` up to date as tools are added (a starter is in the repo). Commit `.env.example`, never `.env`. Check `git status` before every commit.
- Docs at service level, one short README per service, updated in the same commit as the code.
- When a change affects a diagram in `docs/diagrams/` or a README, update it in the same commit.
- Docker Compose for production (`docker-compose.yml`, arm64 for the Pi) and development (`docker-compose.dev.yml` with seed data matching the screens).
- No comments that explain code; rewrite the code instead. Only a why the code can't say, with a link.

## Machine setup

The repo is on the Windows drive (for example `C:\dev\life-app`, which is `/mnt/c/dev/life-app` in WSL). Work from WSL.

- **WSL:** git, Docker, Node, npm and all Angular work. Install npm packages from WSL only; never run npm on the Windows side or share `node_modules` with it.
- **Windows:** Rust, the Tauri CLI and the Android SDK (Android Studio). Call them from WSL with `cmd.exe /c "..."` from inside the repo folder.
- **Desktop build:** build the web files in WSL, then run `cargo tauri build` on Windows. Tauri's `beforeBuildCommand` stays empty and `frontendDist` points at the built folder, so Windows needs no Node.
- **Android build:** `npx cap sync android` in WSL, then `gradlew.bat assembleDebug` on Windows; install on the phone with the Windows `adb.exe`.
- **Docker dev:** files on `/mnt/c` are slow to watch, so the Angular dev server uses polling and PocketBase keeps its data in a named volume, not a bind mount.
- **Releases:** GitHub Actions builds the Windows app and the APK on every phase tag and attaches them to a release.
- **Deployment:** Valdemar deploys to the Pi. Never attempt it.
