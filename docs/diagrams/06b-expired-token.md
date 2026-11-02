# Sign-in: an expired token

How the app gets back to sign-in when the token has expired, and what happens to unsent changes.

```mermaid
sequenceDiagram
  actor You
  participant App as App and route guard
  participant Sync as PocketBaseSync
  participant Server as Server
  participant PB as PocketBase
  participant Local as IndexedDB

  alt Token already past its expiry when the app opens
    App->>Server: signedIn? No: the SDK sees the token is invalid
    App-->>You: Guard redirects to /sign-in
  else Refused during a session
    Sync->>PB: Pull, send or refresh
    PB-->>Sync: 401 or 403
    Sync->>Server: expire(): clear the token, set expired
    Server-->>App: The expired signal changes
    App-->>You: Navigate to /sign-in
  end
  Note over Local: Local copy and outbox untouched

  You->>Server: Sign in again
  alt Same account
    Server->>Local: adopt: nothing changes, outbox kept
    Note over Sync: Sync is already started: nothing runs until the next change,<br/>online event or Settings › Sync now
  else Different account
    Server->>Local: adopt: every table cleared, outbox included
  end
```

- Sign-out is different: Settings › Sign out stops sync, clears the token and deletes the whole local database, then reloads at `/sign-in`.
