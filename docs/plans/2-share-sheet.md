# 2 · Android share sheet

**Goal:** sharing text, a link or a photo from another app makes a quick note in the Inbox.

**Covers:** R1, R3, T5.

## Approach

- An intent filter for `ACTION_SEND` (`text/plain`, `image/*`) on the main activity, read by a small Capacitor plugin in `MainActivity` that hands `{ text, subject, imageUris }` to the web app on launch and on new intents.
- The web side (`ShareReceiver`) turns it into a quick note: title from the subject or first line, body the text or link, `inbox` on. Photos are attached once photos land in phase 3; until then a shared photo makes a note titled "Photo".
- Shown with toast "In the Inbox".
- T5 is automated at the web side by dispatching the same payload the plugin sends; the Android half is checked by hand on the phone.

## Steps

- [ ] Intent filter and plugin in the Android shell
- [ ] ShareReceiver with unit tests
- [ ] e2e T5 (web side)

## Done when

T5 passes and sharing a link from Chrome on the phone lands in the Inbox.
