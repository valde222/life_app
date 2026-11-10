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
    notes.fields.add(new JSONField({ name: "file_names" }));
    app.save(notes);
  },
  (app) => {
    const notes = app.findCollectionByNameOrId("notes");
    notes.fields.removeByName("file_names");
    notes.fields.removeByName("files");
    app.save(notes);
  },
);
