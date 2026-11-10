# Deploy checklist

Every step that needs a person, in order, from a repo on your PC to both apps in daily use. Nothing here is automated. Where a README has the details, the step links to it.

Everything secret goes into your password manager as you make it. None of it goes in the repo, and none of it stays only on the Pi.

## 1. Before you start

- [ ] **Decide the sync conflict rule.** When both devices change the same item, the change made later on its device's clock wins, even if it reaches the server second. The build plan says the later server time wins instead. Keep the code as it is, or ask for the change. This is question 1 in the [bug sweep report](bugs/bug-sweep-report.md#questions-about-the-rules). Questions 2 to 6 there are smaller and can wait.
- [ ] **Accounts:** GitHub and Tailscale, both with two-factor sign-in on.
- [ ] **Tools on your PC.** In WSL: `sudo apt install age`. For `keytool`, use Android Studio's, at `"C:\Program Files\Android\Android Studio\jbr\bin\keytool.exe"`.

## 2. Make the secrets (on your PC)

| Secret | How | Used by |
| --- | --- | --- |
| Updater signing key | **Already made:** `C:\Users\ottes\life-updater.key` and `life-updater.key.password`. Its public key is in `desktop/src-tauri/tauri.conf.json` | GitHub secrets `TAURI_SIGNING_PRIVATE_KEY` (the file's contents) and `TAURI_SIGNING_PRIVATE_KEY_PASSWORD` |
| Android keystore | `keytool -genkeypair -v -keystore life.jks -alias life -keyalg RSA -keysize 4096 -validity 10000`, then `base64 -w0 life.jks` in WSL | GitHub secrets `ANDROID_KEYSTORE_BASE64`, `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS` (`life`), `ANDROID_KEY_PASSWORD` |
| Backup key | `age-keygen -o life-backup.key` in WSL. The `age1…` line is the public key | `BACKUP_AGE_RECIPIENT` in the Pi's `.env`. The private key is only for restoring |
| App account password | `openssl rand -base64 24` | `PB_USER_PASSWORD` in `.env`; you type it into both apps once |
| Admin password | `openssl rand -base64 24` | `PB_ADMIN_PASSWORD` in `.env` |

- [ ] All five are in your password manager.
- [ ] Delete `life-updater.key*`, `life.jks` and `life-backup.key` from disk once they're stored and the GitHub secrets are in. If you lose the updater key or the keystore, installed apps can't take updates and have to be reinstalled, which costs any unsynced changes. If you lose the backup key, the backups can't be read.

## 3. GitHub

- [ ] Create an empty **public** repository. It has to be public: the desktop app and Obtainium read releases without a GitHub login.
- [ ] Push `main`, without tags yet:
  ```sh
  git remote add origin https://github.com/<you>/life-app.git
  git push -u origin main
  ```
- [ ] Under Actions, the CI run on `main` is green.
- [ ] Settings › Secrets and variables › Actions: add the six secrets from step 2.
- [ ] Settings › Code security: turn on secret scanning, push protection, Dependabot alerts and CodeQL code scanning.
- [ ] Settings › Rules: protect `main` from force pushes and deletion. Don't require pull requests unless you mean to work through them; merges are pushed straight to `main`.
- [ ] Push the newest release tag only: `git push origin v1.1.0`. (`v1.0.0` exists too but was never released; the old `v0.N-name` tags don't start a release.)
- [ ] The Release run is green, and the `v1.1.0` release has three files: `life-v1.1.0.apk`, `Life_1.1.0_x64-setup.exe` and `latest.json`.
- [ ] `https://github.com/<you>/life-app/releases/latest/download/latest.json` opens in a private browser window and says `"version": "1.1.0"`.

## 4. Prepare the Pi

- [ ] 64-bit Raspberry Pi OS, up to date: `sudo apt update && sudo apt full-upgrade`.
- [ ] Docker and Compose: `curl -fsSL https://get.docker.com | sh`, then `sudo usermod -aG docker $USER` and log in again. `docker compose version` works.
- [ ] Backup disk: a second disk or network share, mounted at the same path every boot through `/etc/fstab` (add `nofail` so the Pi still boots without it). That path becomes `BACKUP_TARGET`.
- [ ] SSH keys only, unattended upgrades and the firewall: the first three boxes in [What you need to do on the Pi](security.md#what-you-need-to-do-on-the-pi).
- [ ] Tailscale admin console:
  - DNS: MagicDNS and HTTPS certificates are on.
  - Access controls: add a `tag:life` owned by you, and allow Funnel for it (`"nodeAttrs": [{"target": ["tag:life"], "attr": ["funnel"]}]`).
  - Settings › Keys: create an auth key that is single-use, pre-approved and tagged `tag:life`. Tagged devices don't expire, so the tunnel won't drop after 180 days.

## 5. Deploy

Follow the [first deploy](../deploy/README.md#first-deploy) in the deployment README, steps 1 to 6:

- [ ] Clone, `git checkout v1.1.0`, `.env` filled in, `chmod 600 .env`.
- [ ] Data folders owned by `10001:10001`.
- [ ] `docker compose up -d --build` (the first build on a Pi takes a few minutes).
- [ ] `TS_AUTHKEY` set, then `docker compose --profile tunnel up -d`.
- [ ] From your phone on mobile data, not Wi-Fi: `https://life.<tailnet>.ts.net/api/health` answers, and `https://life.<tailnet>.ts.net/_/` says Not found.
- [ ] The admin UI works over SSH (`ssh -L 8090:127.0.0.1:8090 <pi>`, then `http://localhost:8090/_/`), and the superuser from `.env` can sign in.

## 6. Prove the backups before you rely on them

- [ ] Take one now: `docker compose exec backup sh /backup.sh` prints `Backed up life-YYYY-MM-DD.zip.age`, and the file is in `BACKUP_TARGET`.
- [ ] Copy it to your PC and restore it: `age -d -i life-backup.key -o life.zip life-YYYY-MM-DD.zip.age`, then `unzip -l life.zip` lists `data.db`.
- [ ] The next morning: a new file is there. The container runs in UTC, so "after 03:00" means 04:00 or 05:00 Danish time.
- [ ] `docker compose ps` shows every service healthy.

## 7. Phone

- [ ] If a debug build of Life was ever installed on this phone, uninstall it first. It's signed with a different key, and the release won't install over it.
- [ ] Install Obtainium from its [GitHub releases](https://github.com/ImranR98/Obtainium/releases) and allow it to install apps when Android asks.
- [ ] In Obtainium: Add app, paste `https://github.com/<you>/life-app`, install. In Obtainium's settings, leave background update checks on, and set Android's battery setting for Obtainium to Unrestricted so the checks run.
- [ ] Open Life. On the sign-in screen, the server is `https://life.<tailnet>.ts.net`, with the email and password from `.env`.
- [ ] Allow notifications when asked (reminders), and calendar access in Settings › Calendars if you want your calendars in the app.
- [ ] Settings › Version says `1.1.0`.

## 8. Desktop

- [ ] Download `Life_1.1.0_x64-setup.exe` from the release and run it. Windows SmartScreen will warn about an unknown publisher, because the installer has no paid code-signing certificate: click More info › Run anyway. Updates later don't show this.
- [ ] Sign in with the same server, email and password.
- [ ] To start with Windows: Win+R, `shell:startup`, and put a shortcut to `%LOCALAPPDATA%\Life\Life.exe` there.
- [ ] Ctrl+Space opens the capture window. If another app already uses that shortcut, Life can't take it.
- [ ] Settings › Version says `1.1.0`.

## 9. Check on the real devices

The bug sweep couldn't test these without a phone and a desktop in hand.

- [ ] **Sync:** with the phone in flight mode, add a todo. It says "Offline, 1 waiting". Turn flight mode off, and the todo shows up on the desktop within seconds.
- [ ] **Android:** back closes a sheet, then goes back a screen, and doesn't quit with a sheet open. Send the app to the background and come back; force-stop it and reopen; rotate the phone. Share a link and a photo into Life while it's closed: both land in the Inbox. Deny camera or files permission once while adding a photo: the app keeps working and the note keeps what you typed. Deny calendar access: Settings › Calendars offers "Allow calendar access".
- [ ] **Desktop:** Ctrl+Space works while Life is minimised and while it's only in the tray. Closing the window keeps it in the tray, and Tray › Quit ends it. The window opens at a sensible size.
- [ ] **Sign out guard:** in flight mode, add something, then press Settings › Sign out once. It asks again ("Sign out and lose 1 change"). Don't press it again: go back, turn flight mode off and let it sync.
- [ ] **Files on the phone:** on a note, + File › pick a PDF and a Word or Excel file. Both show by their names, then tap each: it opens in your PDF viewer and in Word or Excel. A type no app on the phone handles says "No app here opens …".
- [ ] **Files on the desktop:** the same files show on the PC. Clicking one opens it in its Windows app; an Office file opens in Protected View, which is expected (it's marked as downloaded).
- [ ] **Error log:** Settings › Error log is empty, or holds only errors from the flight-mode test.

## 10. Prove the update path once

Do this in the first week, while it's cheap to fix. Afterwards, every update works the same way.

- [ ] Make a small visible change, merge it to `main`, then `git tag v1.1.1 && git push origin main v1.1.1`. Wait for the release to go green.
- [ ] Before updating, put the phone in flight mode and add a todo, so there's something unsynced.
- [ ] **Desktop:** quit Life from the tray and start it again. Within a minute it asks to install 1.1.1. Install and restart: it reopens on 1.1.1 (Settings › Version), still signed in, with everything there.
- [ ] **Phone:** in Obtainium, check for updates and install 1.1.1. Life opens on 1.1.1, still signed in, with the unsynced todo still waiting. Turn flight mode off, and it syncs.

## 11. From then on

- **Releasing:** follow [Release and update](../deploy/README.md#release-and-update). Tags are `vMAJOR.MINOR.PATCH`, only going up. When a release changes the server, take a backup on the Pi first.
- **Monthly:** update the Pi's images (`docker compose build --pull && docker compose up -d`), check `docker compose ps`, and merge or close Dependabot's pull requests.
- **Every few months:** restore test as in step 6, and keep one backup somewhere other than the Pi.
- **When something looks wrong:** Settings › Error log on that device, then Copy, then paste it into an issue or a session. For the server: `docker compose logs pocketbase --since 1h`.
- **Optional:** two-factor sign-in for the app account (MFA in [security.md](security.md#what-you-need-to-do-on-the-pi)).
