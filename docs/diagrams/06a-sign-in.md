# Sign-in: logging in and token refresh

Logging in from the sign-in screen, what starts afterwards, and when the token is refreshed.

```mermaid
sequenceDiagram
  actor You
  participant UI as Sign-in screen
  participant Session as Session and Server
  participant PB as PocketBase
  participant Local as IndexedDB
  participant App as Route guards and Sync

  You->>UI: Server address, email, password
  alt Address is neither https nor http to this machine
    UI-->>You: "Use an https:// address"
  else Address is fine
    UI->>Session: signIn
    Session->>PB: users auth-with-password
    alt Unreachable, 429, or anything else refused
      PB-->>UI: Status 0, 429, other
      UI-->>You: "Can't reach the server", "Too many tries", "Wrong email or password"
    else Accepted
      PB-->>Session: Token, kept by the SDK on the device
      Session->>Local: adopt: server address and account
      Note over Local: Same owner: kept. No owner yet with unsent changes: kept.<br/>Anything else: every table cleared.
      UI->>App: Go to /
      App->>App: Start Sync, share receiver, calendars, reminders
      App->>App: Wait for the first sync, then /setup/groups if there are no groups or todos
    end
  end

  Note over Session,App: Later, whenever sync() runs
  App->>Session: refreshIfStale
  opt Token valid and past half its lifetime
    Session->>PB: users auth-refresh
    PB-->>Session: New token
  end
```

- `sync()` runs at app start, on the `online` event, on the 30-second retry and on Settings › Sync now. It has no timer, so an app that stays open and online doesn't refresh.
- PocketBase allows 5 sign-ins a minute per client, and refuses superusers that come through the tunnel.
