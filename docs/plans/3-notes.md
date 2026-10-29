# 3 · Notes, photos and links

**Goal:** notes hold text and photos and link to todos and other notes, both ways.

**Covers:** R24, R25, T11, Offline and sync 6; screens Note, CaptureNote, ImagePicker, ImageView, LinkPicker, Todo.

## Behaviour

- **Note page.** Back to where it came from, "+ Photo", "+ Link…". Title, list label and date, the body rendered from markdown (headings, paragraphs, lists, `code`, code blocks, bold, links), photos as thumbnails, Linked items. Tapping the body edits it, with a toolbar: Heading, Code, Photo. Delete at the bottom.
- **Photos (R24).** "Add a photo." sheet: Take photo (camera) and Files (any image, several at once). A photo is shown at once from the device and uploaded with its note by the outbox, so photos taken offline go up on reconnect (Offline and sync 6). Thumbnails (200×200) and full size come from PocketBase, through short-lived file tokens because the files are protected.
- **Photo view.** Black screen, Close, "1 of N", the photo full size, swipe or arrows between photos, Delete.
- **Links (R25).** "Link to…" sheet: search, All / Notes / Todos, Suggested (same list), Recent, ticks, "+ New note and link it", Done. A link shows on both ends: a note lists its todos and notes; a todo lists the notes linking to it; a linked note lists the notes that link to it.
- Todo detail gets "+ Link…" next to "+ Write a note".

## Decisions

- Note-to-note links need a field the data model didn't have: `notes.links` (relation to notes, many). Logged as decision 17.
- The design's "Recent" photo grid needs native gallery access; v1 offers Take photo and Files only, which cover the same photos. Logged in this plan.
- Markdown is rendered by a small in-house renderer that escapes everything first, so note text can never inject markup.

## Steps

- [x] Migration adding `notes.links`
- [x] Markdown renderer with unit tests
- [x] Note page with view and edit modes and toolbar
- [x] Photo upload through the outbox, local pending photos, file tokens
- [x] Add a photo sheet and photo view
- [x] Link picker and links shown both ways
- [x] e2e T11

## Done when

T11 passes.
