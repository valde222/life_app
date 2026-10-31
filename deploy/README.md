# Deployment

Production runs on the Raspberry Pi (arm64) from `docker-compose.yml`. Valdemar deploys; nothing here runs automatically.

## Services

| Service | What it does |
| --- | --- |
| `pocketbase` | The backend, data in `./data/pb_data`, reachable on the Pi at `127.0.0.1:8090` |
| `backup` | Once a day after 03:00: asks PocketBase for a backup zip, encrypts it with `age` to `BACKUP_AGE_RECIPIENT`, writes it to `BACKUP_TARGET`, keeps `BACKUP_KEEP_DAYS` days. Refuses to run without a key; unhealthy if no backup in two days |
| `tunnel` | Tailscale Funnel giving PocketBase a public HTTPS address (`https://life.<tailnet>.ts.net`). Only starts with `--profile tunnel` |

No web build is served: the work PC runs the desktop app.

Every container runs with a read-only filesystem, no Linux capabilities and `no-new-privileges`; PocketBase and the backup job run as uid 10001, not root.

## First deploy

1. Clone the repo on the Pi, `cp .env.example .env`, fill it in. Passwords must be at least 16 characters (`openssl rand -base64 24`); PocketBase won't start otherwise.
2. On your PC, not the Pi, make the backup key: `age-keygen -o life-backup.key`. Put the `age1…` public key in `BACKUP_AGE_RECIPIENT`. Keep `life-backup.key` in your password manager; without it the backups can't be read.
3. Give the data folders to the containers' user: `mkdir -p data/pb_data "$BACKUP_TARGET" && sudo chown 10001:10001 data/pb_data "$BACKUP_TARGET"`.
4. `docker compose up -d --build`
5. For public HTTPS: create a Tailscale auth key, put it in `TS_AUTHKEY`, enable Funnel for the tailnet, then `docker compose --profile tunnel up -d`.
6. In each app, set the server address on the sign-in screen to the Funnel address.

## Admin UI

The public address never serves the admin UI or lets a superuser sign in: the tunnel refuses `/_/` and `/api/collections/_superusers/`, and PocketBase refuses any superuser request that came through a proxy. To use the admin UI, tunnel to the Pi over SSH and open it locally:

```sh
ssh -L 8090:127.0.0.1:8090 <pi>
# then http://localhost:8090/_/
```

After starting the tunnel, check from outside: `curl -s -o /dev/null -w '%{http_code}\n' https://life.<tailnet>.ts.net/_/` must not print `200` with the dashboard, and `https://life.<tailnet>.ts.net/api/health` must print `200`.

## Update and roll back

`git checkout <tag> && docker compose up -d --build`. Migrations run on start. Before rolling back across a schema change, restore the backup taken before the update.

## Restore a backup

On a machine with the key:

```sh
age -d -i life-backup.key -o life.zip life-YYYY-MM-DD.zip.age
```

Then on the Pi: `docker compose stop pocketbase`, move `./data/pb_data` aside, unzip `life.zip` into a fresh `./data/pb_data`, `sudo chown -R 10001:10001 data/pb_data`, `docker compose start pocketbase`.

`deploy/backup/test.sh` does the whole round trip with throwaway containers (back up, check the file is unreadable without the key, decrypt, restore into a fresh PocketBase, find the data) and must print `PASS`.

## Still open

Where `BACKUP_TARGET` points (second disk, another machine, or a cloud bucket), and whether Funnel stays the tunnel.
