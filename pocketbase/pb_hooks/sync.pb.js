/// <reference path="../pb_data/types.d.ts" />

cronAdd("purgeDeleted", "15 4 * * *", () => {
  const cutoff = new DateTime().addDate(0, 0, -30).string();
  for (const name of require(`${__hooks}/collections.js`).childrenFirst) {
    const records = $app.findRecordsByFilter(name, "deleted_at != '' && deleted_at < {:cutoff}", "", 0, 0, { cutoff });
    for (const record of records) {
      $app.delete(record);
    }
  }
});
