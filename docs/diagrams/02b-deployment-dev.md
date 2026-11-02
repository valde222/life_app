# Deployment: dev environment

The services, volumes, network and ports in `docker-compose.dev.yml`, on the development machine.

```mermaid
flowchart TB
  browser(["Browser or dev build of a shell"])
  browser -- "localhost:4200" --> app
  browser -- "localhost:8090" --> pb
  subgraph net["Compose network life-dev_default, in WSL"]
    app["app<br/>node:22-alpine<br/>npm ci, then ng serve with polling"]
    pb["pocketbase<br/>from ./pocketbase"]
    seed["seed<br/>node:22-alpine<br/>runs once, then exits"]
  end
  seed -- "HTTP, once healthy" --> pb
  subgraph disk["Storage"]
    modules[("named volume<br/>app_node_modules")]
    repo[("the repo<br/>bind mounted")]
    pbvol[("named volume<br/>pb_dev_data")]
  end
  app --> modules
  app --> repo
  pb -- "migrations, hooks: read-only" --> repo
  seed -- "seed folder: read-only" --> repo
  pb --> pbvol
```

- There is no `backup` or `tunnel` here, and no hardening; the logins are fixed development values in the Compose file.
- Files on `/mnt/c` are slow to watch, so the dev server polls and the PocketBase data stays in a named volume.
