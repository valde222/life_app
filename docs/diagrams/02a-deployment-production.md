# Deployment: production

The services, volumes, network and ports in `docker-compose.yml`, on the Pi.

```mermaid
flowchart TB
  apps(["Apps, HTTPS 443 through Funnel"]) --> tunnel
  ssh(["SSH tunnel to the Pi"]) --> port["127.0.0.1:8090"]
  subgraph net["Compose network life_default, on the Pi (arm64)"]
    tunnel["tunnel<br/>tailscale/tailscale<br/>profile: tunnel"]
    backup["backup<br/>from ./deploy/backup<br/>uid 10001"]
    pb["pocketbase<br/>from ./pocketbase<br/>port 8090, uid 10001"]
  end
  port --> pb
  tunnel -- "HTTP" --> pb
  backup -- "HTTP, once healthy" --> pb
  subgraph disk["Bind mounts on the Pi"]
    tsdata[("./data/tailscale")]
    serve[("./deploy/tailscale/serve.json")]
    pbdata[("./data/pb_data")]
    target[("BACKUP_TARGET<br/>default ./data/offsite")]
  end
  tunnel --> tsdata
  tunnel -- "read-only" --> serve
  pb --> pbdata
  backup -- "read-only" --> pbdata
  backup --> target
```

- `pocketbase` and `backup` have a read-only filesystem, no capabilities and `no-new-privileges`; `tunnel` has only `no-new-privileges`.
- The tunnel starts only with `--profile tunnel`, and it answers `/_` and `/api/collections/_superusers/` itself with "Not found".
- The folders are bind mounts, not named volumes, so they can be copied and restored as plain files.
