/// <reference path="../pb_data/types.d.ts" />

migrate(
  (app) => {
    const notes = app.findCollectionByNameOrId("notes");
    notes.fields.add(
      new RelationField({
        name: "links",
        collectionId: notes.id,
        maxSelect: 999,
        cascadeDelete: false,
      }),
    );
    notes.fields.getByName("photos").protected = true;
    app.save(notes);
  },
  (app) => {
    const notes = app.findCollectionByNameOrId("notes");
    notes.fields.getByName("photos").protected = false;
    notes.fields.removeByName("links");
    app.save(notes);
  },
);
