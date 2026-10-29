/// <reference path="../pb_data/types.d.ts" />

onBootstrap((e) => {
  e.next();

  const email = $os.getenv("PB_USER_EMAIL");
  const password = $os.getenv("PB_USER_PASSWORD");
  if (!email || !password) {
    return;
  }

  let user;
  try {
    user = e.app.findAuthRecordByEmail("users", email);
  } catch {
    user = new Record(e.app.findCollectionByNameOrId("users"));
    user.setEmail(email);
    user.setVerified(true);
  }
  user.setPassword(password);
  e.app.save(user);
});
