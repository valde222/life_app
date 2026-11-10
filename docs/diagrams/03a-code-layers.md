# Code layers

Which layers of the Angular app import which, with the number of imports on each arrow. Generated from the real imports by `npm run diagrams` in `app/`; don't edit by hand.

```mermaid
flowchart TD
  shell["shell"]
  features["features"]
  shared["shared"]
  core["core"]
  domain["domain"]
  core -- 34 --> domain
  features -- 97 --> core
  features -- 65 --> domain
  features -- 104 --> shared
  shared -- 14 --> core
  shared -- 17 --> domain
  shell -- 13 --> core
  shell -- 28 --> features
  shell -- 10 --> shared
```

- The rules are in `app/.dependency-cruiser.cjs`, and `npm run lint` fails on a break: each layer imports only the layers below it, and a feature never imports another feature.
- Dexie and the PocketBase SDK may only be imported by `core/data`, `core/sync` and `core/server`.
- The diagrams after this one leave out `domain`, which every layer may import.
