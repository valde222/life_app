# CI green on GitHub

The first runs on GitHub: `main` passed, and every red run was on a Dependabot pull request. Four causes. Branch `fix/ci-green`.

## Causes and fixes

- **End-to-end tests typed before the capture box had focus.** T3, T4, T9, T16 and the sign-out test open Capture and type at once. The box takes focus a moment after the sheet opens (`cdkFocusInitial`), so on a slow runner the first letters were lost ("buy butter" became "y butter") and the test failed or passed only on retry. A `typeInCapture` helper waits for the focus first. The app is unchanged: nobody types within a few milliseconds of tapping Capture.
- **CodeQL's `init` and `analyze` were bumped in separate pull requests.** CodeQL refuses mismatched versions. Dependabot now groups `github/codeql-action/*`.
- **TypeScript 7.** Angular 22 needs TypeScript 6, so `npm ci` failed. Dependabot ignores TypeScript major versions; they arrive when an Angular update allows them.
- **Gradle 9.** The wrapper's jump from 8.14 to 9.9 breaks the Android build. Dependabot ignores Gradle wrapper major versions until Capacitor's Android template moves to Gradle 9.

## Steps

- [x] Plan
- [x] `typeInCapture` helper; the five tests use it; end-to-end tests pass
- [ ] Dependabot: group CodeQL, ignore TypeScript and Gradle wrapper majors
- [ ] Merge to `main`
