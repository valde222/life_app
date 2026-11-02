# System overview

The phone, the desktop, the Pi and GitHub, and what talks to what over which protocol.

```mermaid
flowchart LR
  subgraph phone["Android phone"]
    apk["Angular app in Capacitor<br/>local copy in IndexedDB"]
    phonecal["Phone calendars"]
    others["Other apps"]
  end
  subgraph pc["Windows PC"]
    exe["Angular app in Tauri<br/>local copy in IndexedDB"]
  end
  subgraph pi["Raspberry Pi, Docker Compose"]
    tunnel["tunnel<br/>Tailscale Funnel"]
    pb["pocketbase :8090<br/>SQLite and photos"]
    backup["backup<br/>daily after 03:00"]
  end
  target[("BACKUP_TARGET<br/>age-encrypted zips")]
  subgraph github["GitHub"]
    actions["GitHub Actions"]
    release["Releases<br/>APK and .exe"]
  end
  you(["Valdemar"])

  others -- "Android share intent" --> apk
  phonecal -- "read-only calendar API" --> apk
  apk -- "HTTPS: REST and SSE" --> tunnel
  exe -- "HTTPS: REST and SSE" --> tunnel
  tunnel -- "HTTP" --> pb
  backup -- "HTTP: make and delete a backup" --> pb
  backup -- "file: encrypted copy" --> target
  actions -- "builds on v* tags" --> release
  release -. "installed by hand" .-> apk
  release -. "installed by hand" .-> exe
  you -. "SSH: git checkout, compose up, admin UI" .-> pi
```

- The build plan (decision 6) calls this online first, but the screens only ever read the local copy; the network is used by sync alone.
- The tunnel is still an open question in the build plan; the code ships Tailscale Funnel, in its own container so it can be swapped.
- Neither app updates itself, and nothing in GitHub reaches the Pi.
