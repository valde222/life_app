/// <reference path="../pb_data/types.d.ts" />

const SIGNED_IN = "@request.auth.id != ''";
const LIST_COLOURS = ["blue", "purple", "teal", "green", "orange", "pink", "grey"];

function syncFields() {
  return [
    { name: "changed_at", type: "number", onlyInt: true },
    { name: "deleted_at", type: "date" },
    { name: "created", type: "autodate", onCreate: true, onUpdate: false },
    { name: "updated", type: "autodate", onCreate: true, onUpdate: true },
  ];
}

function relation(app, name, target, maxSelect = 1) {
  return {
    name,
    type: "relation",
    collectionId: app.findCollectionByNameOrId(target).id,
    maxSelect,
    cascadeDelete: false,
  };
}

function createCollection(app, name, fields, extraIndexes = []) {
  const collection = new Collection({
    type: "base",
    name,
    listRule: SIGNED_IN,
    viewRule: SIGNED_IN,
    createRule: SIGNED_IN,
    updateRule: SIGNED_IN,
    deleteRule: SIGNED_IN,
    fields: [...fields, ...syncFields()],
    indexes: [`CREATE INDEX idx_${name}_updated ON ${name} (updated)`, ...extraIndexes],
  });
  app.save(collection);
}

migrate(
  (app) => {
    const users = app.findCollectionByNameOrId("users");
    users.createRule = null;
    app.save(users);

    createCollection(app, "groups", [
      { name: "name", type: "text", required: true },
      { name: "order", type: "number" },
    ]);
    createCollection(app, "lists", [
      { name: "name", type: "text", required: true },
      relation(app, "group", "groups"),
      { name: "colour", type: "select", values: LIST_COLOURS, maxSelect: 1 },
      { name: "order", type: "number" },
      { name: "archived_at", type: "date" },
    ]);
    createCollection(app, "todos", [
      { name: "title", type: "text", required: true },
      relation(app, "list", "lists"),
      { name: "inbox", type: "bool" },
      { name: "date", type: "text", pattern: "^\\d{4}-\\d{2}-\\d{2}$" },
      { name: "time", type: "text", pattern: "^\\d{2}:\\d{2}$" },
      { name: "time_end", type: "text", pattern: "^\\d{2}:\\d{2}$" },
      { name: "is_event", type: "bool" },
      { name: "repeat_mode", type: "select", values: ["none", "rough", "schedule"], maxSelect: 1 },
      { name: "repeat_every_days", type: "number", onlyInt: true },
      { name: "repeat_every_weeks", type: "number", onlyInt: true },
      { name: "repeat_weekdays", type: "json" },
      { name: "reminder", type: "date" },
      { name: "done_at", type: "date" },
      { name: "archived_at", type: "date" },
    ]);
    createCollection(app, "steps", [
      relation(app, "todo", "todos"),
      { name: "text", type: "text" },
      { name: "done", type: "bool" },
      { name: "order", type: "number" },
    ]);
    createCollection(app, "completions", [
      relation(app, "todo", "todos"),
      { name: "done_on", type: "text", pattern: "^\\d{4}-\\d{2}-\\d{2}$" },
    ]);
    createCollection(app, "notes", [
      { name: "title", type: "text" },
      { name: "body", type: "text", max: 1000000 },
      relation(app, "list", "lists"),
      { name: "inbox", type: "bool" },
      {
        name: "photos",
        type: "file",
        maxSelect: 99,
        maxSize: 25 * 1024 * 1024,
        mimeTypes: ["image/jpeg", "image/png", "image/webp", "image/heic", "image/gif"],
        thumbs: ["200x200", "800x0"],
      },
      relation(app, "todos", "todos", 999),
      { name: "archived_at", type: "date" },
    ]);
    createCollection(app, "calendar_events", [
      { name: "calendar", type: "text" },
      { name: "external_id", type: "text" },
      { name: "title", type: "text" },
      { name: "start", type: "date" },
      { name: "end", type: "date" },
      { name: "all_day", type: "bool" },
      { name: "synced_at", type: "date" },
    ], ["CREATE UNIQUE INDEX idx_calendar_events_external ON calendar_events (calendar, external_id)"]);
    createCollection(app, "settings", [{ name: "calendars", type: "json" }]);
  },
  (app) => {
    for (const name of ["settings", "calendar_events", "notes", "completions", "steps", "todos", "lists", "groups"]) {
      app.delete(app.findCollectionByNameOrId(name));
    }
    const users = app.findCollectionByNameOrId("users");
    users.createRule = "";
    app.save(users);
  },
);
