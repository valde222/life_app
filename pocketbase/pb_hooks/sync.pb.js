/// <reference path="../pb_data/types.d.ts" />

onRecordUpdateRequest(
  (e) => {
    const stored = e.record.original();
    if (e.record.getInt("changed_at") < stored.getInt("changed_at")) {
      return e.json(200, stored);
    }
    e.next();
  },
  "groups", "lists", "todos", "steps", "completions", "notes", "calendar_events", "settings",
);

cronAdd("purgeDeleted", "15 4 * * *", () => {
  const cutoff = new DateTime().addDate(0, 0, -30).string();
  for (const name of ["steps", "completions", "notes", "todos", "lists", "groups", "calendar_events", "settings"]) {
    const records = $app.findRecordsByFilter(name, "deleted_at != '' && deleted_at < {:cutoff}", "", 0, 0, { cutoff });
    for (const record of records) {
      $app.delete(record);
    }
  }
});
