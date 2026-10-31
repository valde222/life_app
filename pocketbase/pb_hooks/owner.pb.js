/// <reference path="../pb_data/types.d.ts" />

onRecordCreateRequest(
  (e) => {
    if (e.auth && e.auth.collection().name === "users") {
      e.record.set("owner", e.auth.id);
    }
    e.next();
  },
  ...require(`${__hooks}/collections.js`).synced,
);
