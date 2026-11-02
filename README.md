# Life

A personal todo, notes and repeating-chores app for one person: an Android app and a desktop app, both from one Angular codebase, backed by a self-hosted PocketBase on a Raspberry Pi.

| Service | Folder | |
| --- | --- | --- |
| Angular app | `app/` | [README](app/README.md) |
| Android shell | `app/android/` | [README](app/android/README.md) |
| Desktop shell | `desktop/` | [README](desktop/README.md) |
| Backend | `pocketbase/` | [README](pocketbase/README.md) |
| Deployment | `deploy/`, `docker-compose.yml` | [README](deploy/README.md) |

How they fit together: [system overview](docs/diagrams/01-system-overview.md), and [every diagram](docs/diagrams/README.md).

## Run in development

From WSL, in the repo folder:

```sh
docker compose -f docker-compose.dev.yml up
```

Then open http://localhost:4200 and sign in with `me@example.com` / `lifeapp-dev`. PocketBase's admin UI is at http://localhost:8090/_/ (`admin@example.com` / `lifeapp-admin`). See the [dev environment](docs/diagrams/02b-deployment-dev.md).

The seed data matches the design canvas, dated around the day it first ran. `./scripts/dev-reset.sh` throws the data away and reseeds for today. After pulling new code, `docker compose -f docker-compose.dev.yml up -d --force-recreate` picks it up.

## Run in production

See the [deployment README](deploy/README.md).

## Config

The dev Compose file needs no setup: its values are fixed, for development only. `CHOKIDAR_USEPOLLING` makes the dev server poll, because files on `/mnt/c` are slow to watch; the rest are explained in the [PocketBase README](pocketbase/README.md). Production settings go in `.env`, from `.env.example`: see the [deployment README](deploy/README.md).
