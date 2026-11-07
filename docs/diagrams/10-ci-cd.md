# CI/CD

What runs on a push, on a pull request, on a tag and on a schedule, and what each produces.

```mermaid
flowchart LR
  push(["Push to any branch or tag"]) --> ci
  pr(["Pull request"]) --> ci
  pr --> codeql
  main(["Push to main"]) --> codeql
  week(["Mondays 05:17 UTC"]) --> codeql
  tag(["Tag vMAJOR.MINOR.PATCH"]) --> release

  subgraph ci["CI: pass or fail"]
    test["test<br/>unit, build, PocketBase attack tests,<br/>backup round trip, end-to-end"]
    lint["lint<br/>ESLint, layers, tokens, Prettier"]
    desktop["desktop, on Windows<br/>rustfmt, clippy, cargo test"]
    android["android<br/>share and manifest tests"]
    security["security<br/>gitleaks, OSV, npm audit"]
    diagrams["diagrams<br/>every diagram renders"]
  end
  test -. "on failure" .-> traces[/"playwright-traces artifact"/]

  codeql["CodeQL<br/>JS and TS, Java, Rust, Actions"] --> alerts[/"Code scanning alerts"/]

  subgraph release["Release"]
    web["web<br/>version from the tag, Angular build"] --> windows["windows<br/>cargo tauri build"]
    web --> apk["android<br/>signed, verified APK"]
  end
  windows --> gh[/"GitHub Release:<br/>NSIS .exe and life-tag.apk"/]
  apk --> gh
```

- A push to a tag runs CI too, because CI's `push` has no filter. Release doesn't wait for it.
- Only a `vMAJOR.MINOR.PATCH` tag starts a release; MINOR and PATCH stay under 100. The version goes into the web build (Settings › Version), the APK's `versionName` and `versionCode`, and the desktop installer. A release fails if the Android signing secrets are missing.
- Nothing deploys to the Pi. Dependabot opens weekly pull requests for npm, Cargo, Gradle, Docker and Actions.
