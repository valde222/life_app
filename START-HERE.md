# Starting the build

1. Answer the first three open questions at the bottom of the build plan (Pi address, work PC, sign-in).
2. Export the build plan from its doc as Markdown and save it as `docs/build-plan.md` inside `life-app-starter`.
3. Create an empty GitHub repo and clone it from WSL into a folder on the Windows drive, for example `/mnt/c/dev/life-app` (`C:\dev\life-app` in Windows). Copy the contents of `life-app-starter` into it and make the first commit.
4. In WSL, install Node and Claude Code (you have git and Docker). On Windows, run `cargo install tauri-cli` (you have Rust and Android Studio). The Windows app and the APK are also built by GitHub Actions on each phase tag.
5. Open Claude Code in WSL, in the repo folder, and say: "Read CLAUDE.md and start the build."
6. If it stops for any reason, open it again and say: "Read docs/TODO.md and continue."
