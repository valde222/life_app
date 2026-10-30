# Deployment

Production runs on the Raspberry Pi (arm64) from `docker-compose.yml`. Valdemar deploys; nothing here runs automatically.

## Services

| Service | What it does |
| --- | --- |
| `pocketbase` | The backend, data in `./data/pb_data`, reachable on the Pi at `127.0.0.1:8090` |
| `backup` | Nightly at 03:30: asks PocketBase for a backup zip, copies it to `BACKUP_TARGET`, keeps `BACKUP_KEEP_DAYS` days |
| `tunnel` | Tailscale Funnel giving PocketBase a public HTTPS address (`https://life.<tailnet>.ts.net`). Only starts with `--profile tunnel` |

No web build is served: the work PC runs the desktop app.

## First deploy

1. Clone the repo on the Pi, `cp .env.example .env`, fill it in.
2. `docker compose up -d --build`
3. For public HTTPS: create a Tailscale auth key, put it in `TS_AUTHKEY`, enable Funnel for the tailnet, then `docker compose --profile tunnel up -d`.
4. In each app, set the server address on the sign-in screen to the Funnel address.

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

Stop `pocketbase`, unzip the backup into `./data/pb_data` (replacing its contents), start it again. The admin UI (Settings → Backups) can also restore one.

## Still open

Where `BACKUP_TARGET` points (second disk, another machine, or a cloud bucket), and whether Funnel stays the tunnel.
