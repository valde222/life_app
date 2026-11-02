# PocketBase

The backend: one PocketBase (pinned in the `Dockerfile`) holding the one account, the eight collections and the photos. See the [data model](../docs/diagrams/04-data-model.md).

The schema only changes through `pb_migrations/`, applied on start. The hooks in `pb_hooks/` create the account from the environment, stamp each record's owner, ignore updates older than the stored `changed_at` ([conflicts](../docs/diagrams/05b-sync-conflict.md)), purge records deleted more than 30 days ago at 04:15, set rate limits, and refuse superusers that come through a proxy. What protects the data is in [`docs/security.md`](../docs/security.md).

## Run

In development and production, use the Compose files at the repo root ([dev](../README.md), [production](../deploy/README.md)). The dev one also runs `seed/seed.mjs`, which does nothing if data exists. The admin UI is at http://localhost:8090/_/.

To run the API tests, from WSL in `pocketbase/`, with the variables below set (`PB_URL=http://localhost:8091` here):

```sh
tests/start-server.sh life-test-pocketbase 8091
node --test --test-concurrency=1 tests/*.test.mjs
docker stop life-test-pocketbase
```

## Config

| Variable | Use |
| --- | --- |
| `PB_USER_EMAIL`, `PB_USER_PASSWORD` | The one account the apps sign in with; created or updated on start |
| `PB_ADMIN_EMAIL`, `PB_ADMIN_PASSWORD` | Superuser for the admin UI and backups; created or updated on start |
| `PB_ENV` | `production` on the Pi: refuses passwords under 16 characters or the example values |
| `PB_RATE_LIMITS` | `off` only for the end-to-end test server. Never set in production |
| `PB_URL` | Not read by PocketBase: tells the seed, the backup job and the tests where to find it |

## Talks to

Nothing. The apps and the backup job talk to it.
