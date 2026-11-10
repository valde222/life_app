# Deployment

Production runs on the Raspberry Pi (arm64) from `docker-compose.yml`: PocketBase, a daily encrypted backup, and a tunnel that gives it a public HTTPS address. No web build is served. Valdemar deploys; nothing here runs automatically. See [production deployment](../docs/diagrams/02a-deployment-production.md).

| Service | What it does |
| --- | --- |
| `pocketbase` | The backend, on the Pi at `127.0.0.1:8090` |
| `backup` | Once a day after 03:00, encrypts a PocketBase backup to `BACKUP_TARGET`. Unhealthy if there's none from the last two days |
| `tunnel` | Tailscale Funnel at `https://life.<tailnet>.ts.net`. Starts only with `--profile tunnel` |

## First deploy

The full list of manual steps, GitHub and phone included, is [`docs/deploy-checklist.md`](../docs/deploy-checklist.md). The Pi part:

1. Clone the repo on the Pi and check out the release tag (`git checkout v1.1.1`). `cp .env.example .env`, `chmod 600 .env`, fill it in. Passwords must be at least 16 characters (`openssl rand -base64 24`); PocketBase won't start otherwise.
2. On your PC, not the Pi, make the backup key. In WSL: `sudo apt install age`, then `age-keygen -o life-backup.key`. Put the `age1…` public key in `BACKUP_AGE_RECIPIENT`. Keep `life-backup.key` in your password manager; without it the backups can't be read.
3. Give the data folders to the containers' user:
   ```sh
   set -a; . ./.env; set +a
   mkdir -p data/pb_data "$BACKUP_TARGET"
   sudo chown 10001:10001 data/pb_data "$BACKUP_TARGET"
   ```
4. `docker compose up -d --build`
5. For public HTTPS: create a Tailscale auth key, put it in `TS_AUTHKEY`, enable Funnel for the tailnet, then `docker compose --profile tunnel up -d`.
6. Check from outside: `https://life.<tailnet>.ts.net/api/health` must answer `200` and `https://life.<tailnet>.ts.net/_/` must not show the dashboard.
7. Install the apps (below) and set the server address on each sign-in screen to the Funnel address.

What else to do on the Pi yourself is in [`docs/security.md`](../docs/security.md).

## Admin UI

The public address never serves it. Tunnel to the Pi over SSH and open it locally:

```sh
ssh -L 8090:127.0.0.1:8090 <pi>
# then http://localhost:8090/_/
```

## Install the apps

- **Phone:** install [Obtainium](https://github.com/ImranR98/Obtainium) and add the repo's GitHub URL as an app. It installs the APK from the newest release and offers each new one; Android keeps the app's data because every release is signed with the same key. See the [Android README](../app/android/README.md).
- **Desktop:** run `Life_<version>_x64-setup.exe` from the newest release once. After that the app updates itself, asking first. See the [desktop README](../desktop/README.md).

## Release and update

1. On your PC: merge to `main`, then `git tag vX.Y.Z && git push origin main vX.Y.Z`. The release workflow builds the APK and the installer (about 15 minutes); check it's green under Actions.
2. On the Pi, if the server changed (anything in `pocketbase/`, `deploy/` or `docker-compose.yml`):
   ```sh
   docker compose exec backup sh /backup.sh
   git fetch --tags && git checkout vX.Y.Z
   docker compose up -d --build
   ```
   The first line takes a backup now, so a rollback has something from just before the update. Migrations run on start.
3. The apps: the desktop asks within six hours or at its next start; Obtainium on the phone shows the update.

When a release adds a migration, update the Pi before installing the apps: the new apps may use fields or collections the old server doesn't have.

To roll back the server: `git checkout <previous tag> && docker compose up -d --build`. If the release you're leaving ran a migration, restore the backup taken in step 2 first (below). The apps don't roll back: Android won't install a lower version over a higher one without uninstalling, which throws away unsynced changes. Revert the change and release it as the next patch version instead.

## Restore a backup

On a machine with the key:

```sh
age -d -i life-backup.key -o life.zip life-YYYY-MM-DD.zip.age
```

Then on the Pi: `docker compose stop pocketbase`, move `./data/pb_data` aside, unzip `life.zip` into a fresh `./data/pb_data`, `sudo chown -R 10001:10001 data/pb_data`, `docker compose start pocketbase`.

`deploy/backup/test.sh` does the whole round trip with throwaway containers and must print `PASS`.

## Config

Set in `.env`, from `.env.example`:

| Variable | Use |
| --- | --- |
| `PB_USER_EMAIL`, `PB_USER_PASSWORD` | The one account the apps sign in with |
| `PB_ADMIN_EMAIL`, `PB_ADMIN_PASSWORD` | Superuser, for the admin UI and the backup job |
| `BACKUP_AGE_RECIPIENT` | Public key backups are encrypted to. Required |
| `BACKUP_TARGET` | Where backups go; a second disk or network share. Default `./data/offsite` |
| `BACKUP_KEEP_DAYS` | Days to keep. Default 14 |
| `TS_AUTHKEY` | Tailscale auth key for the tunnel |

Fixed in `docker-compose.yml`:

| Variable | Use |
| --- | --- |
| `PB_ENV` | `production`: turns on PocketBase's password check |
| `PB_URL` | Where the backup job finds PocketBase |
| `TS_STATE_DIR` | Where Tailscale keeps its state, `./data/tailscale` on the Pi |
| `TS_SERVE_CONFIG` | The tunnel's routes, from `deploy/tailscale/serve.json` |
| `TS_USERSPACE` | Runs Tailscale without a kernel network device |
| `TS_ENABLE_HEALTH_CHECK`, `TS_LOCAL_ADDR_PORT` | The tunnel's health check, on `127.0.0.1:9002` |

## Talks to

The apps reach PocketBase through the tunnel. The backup job talks to PocketBase and writes to `BACKUP_TARGET`. See the [system overview](../docs/diagrams/01-system-overview.md).
