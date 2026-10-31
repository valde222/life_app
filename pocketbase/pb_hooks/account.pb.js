/// <reference path="../pb_data/types.d.ts" />

onBootstrap((e) => {
  e.next();

  const minProductionPassword = 16;
  const placeholders = ["change-me", "change-me-too"];
  const production = $os.getenv("PB_ENV") === "production";

  for (const [collection, prefix] of [["users", "PB_USER"], ["_superusers", "PB_ADMIN"]]) {
    const email = $os.getenv(`${prefix}_EMAIL`);
    const password = $os.getenv(`${prefix}_PASSWORD`);
    if (!email || !password) {
      continue;
    }
    if (production && (password.length < minProductionPassword || placeholders.includes(password))) {
      throw new Error(`${prefix}_PASSWORD must be at least ${minProductionPassword} characters and not the example value`);
    }
    let account;
    try {
      account = e.app.findAuthRecordByEmail(collection, email);
    } catch {
      account = new Record(e.app.findCollectionByNameOrId(collection));
      account.setEmail(email);
      account.setVerified(true);
    }
    if (!account.validatePassword(password)) {
      account.setPassword(password);
      e.app.save(account);
    }
  }
});
