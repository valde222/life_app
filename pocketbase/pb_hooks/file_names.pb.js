/// <reference path="../pb_data/types.d.ts" />

onRecordCreateRequest((e) => {
  require(`${__hooks}/file_names.js`).remember(e.record);
  e.next();
}, "notes");

onRecordUpdateRequest((e) => {
  require(`${__hooks}/file_names.js`).remember(e.record);
  e.next();
}, "notes");
