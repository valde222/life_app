# Files on notes

A note can hold files of any type, up to 50 MB each, next to its photos. Tapping a file opens it in another app: on the phone whatever handles that type, on the desktop the default Windows app. New rule R31, new acceptance test T17. Branch `feat/note-files`, tagged `v1.1.0`.

Decided with Valdemar: any file type; open in another app rather than save a copy; 50 MB per file.

## Behaviour

- **Adding:** "+ File" in the note's top bar, and File in the editing toolbar, open the system file picker (several files at once). A file over 50 MB isn't queued; a toast says "\<name> is over 50 MB". Files queue and upload like photos: offline they wait, and a new note's files upload once the note itself is on the server.
- **Showing:** a Files section under the photos lists each file by its name, without the random suffix PocketBase adds (`report_k3j2h1g9f0.pdf` shows as `report.pdf`). A file still waiting to upload says "Waiting to upload" and can't be opened yet.
- **Opening:** tapping a file fetches it with a short-lived file token and hands it to the shell:
  - Android: a `FileOpener` plugin downloads it into the app's cache (`cache/opened/`) and starts `ACTION_VIEW` through the existing FileProvider. With no app for the type, a toast says so.
  - Desktop: a Rust command `open_file` downloads it to `%TEMP%\life-files\<time>\<name>`, marks it as downloaded from the internet (`Zone.Identifier`, as browsers do, so Windows warns before running a program or opens Office files in Protected View), and opens it with the default app.
  - Browser (dev and tests): opens the file's URL in a new tab.
  - The opened file is a copy: editing it doesn't change the note.
- **Removing:** each file has a remove button; the first press turns it into "Remove", the second removes it from the note and the server. Same two-press pattern as elsewhere.
- **Security:** the field is protected like photos (a file token is needed, and only the owner gets one). Both shells accept only `https://` URLs, or `http://` to `localhost` and `127.0.0.1` for development, and reduce the name to a plain file name, so a crafted name can't write outside their folder. On the desktop the main window gains IPC for this one command, granted in its own capability.

## Not in this change

Sharing a file from another Android app into Life (R3 covers text, links and photos); dragging files onto a note on the desktop; searching file names.

## Steps

- [ ] PocketBase: `files` field on notes (any type, 50 MB, 99 per note, protected); access tests cover it; a 45 MB upload works through the body limit
- [ ] App data: `Note.files`, the upload queue takes a field (`photos` or `files`), file names without the suffix, the 50 MB check
- [ ] Note editor: + File, the Files section, remove with confirm; T17 end-to-end in the browser
- [ ] Android `FileOpener` plugin, with unit tests for its URL and name checks
- [ ] Desktop `open_file` command, its capability, with tests for its URL and name checks
- [ ] Docs: build plan (R31, T17, data model, decision 22), READMEs, diagrams, security
- [ ] Tests, lint, clippy and the visual check pass; merge to `main`; tag `v1.1.0`
