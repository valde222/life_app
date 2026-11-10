/// <reference path="../pb_data/types.d.ts" />

migrate(
  (app) => {
    const notes = app.findCollectionByNameOrId("notes");
    notes.fields.add(
      new FileField({
        name: "files",
        maxSelect: 99,
        maxSize: 50 * 1024 * 1024,
        protected: true,
      }),
    );
    app.save(notes);
  },
  (app) => {
    const notes = app.findCollectionByNameOrId("notes");
    notes.fields.removeByName("files");
    app.save(notes);
  },
);
