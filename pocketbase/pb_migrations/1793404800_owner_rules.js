/// <reference path="../pb_data/types.d.ts" />

const COLLECTIONS = ["groups", "lists", "todos", "steps", "completions", "notes", "calendar_events", "settings"];
const AS_USER = "@request.auth.collectionName = 'users'";
const OWNED = `${AS_USER} && owner = @request.auth.id`;
const OWNER_UNCHANGED = "(@request.body.owner:isset = false || @request.body.owner = @request.auth.id)";
const SIGNED_IN = "@request.auth.id != ''";

function ownerOfExistingRecords(app) {
  const email = $os.getenv("PB_USER_EMAIL");
  if (email) {
    try {
      return app.findAuthRecordByEmail("users", email).id;
    } catch {}
  }
  const users = app.findAllRecords("users");
  return users.length === 1 ? users[0].id : "";
}

migrate(
  (app) => {
    const users = app.findCollectionByNameOrId("users");
    users.deleteRule = null;
    app.save(users);

    const owner = ownerOfExistingRecords(app);
    for (const name of COLLECTIONS) {
      const collection = app.findCollectionByNameOrId(name);
      collection.fields.add(
        new RelationField({ name: "owner", collectionId: users.id, maxSelect: 1, cascadeDelete: false }),
      );
      collection.addIndex(`idx_${name}_owner`, false, "owner", "");
      collection.listRule = OWNED;
      collection.viewRule = OWNED;
      collection.createRule = `${AS_USER} && ${OWNER_UNCHANGED}`;
      collection.updateRule = `${OWNED} && ${OWNER_UNCHANGED}`;
      collection.deleteRule = OWNED;
      app.save(collection);
      if (owner) {
        app.db().newQuery(`UPDATE ${name} SET owner = {:owner} WHERE owner = ''`).bind({ owner }).execute();
      }
    }
  },
  (app) => {
    for (const name of COLLECTIONS) {
      const collection = app.findCollectionByNameOrId(name);
      collection.removeIndex(`idx_${name}_owner`);
      collection.fields.removeByName("owner");
      collection.listRule = SIGNED_IN;
      collection.viewRule = SIGNED_IN;
      collection.createRule = SIGNED_IN;
      collection.updateRule = SIGNED_IN;
      collection.deleteRule = SIGNED_IN;
      app.save(collection);
    }
    const users = app.findCollectionByNameOrId("users");
    users.deleteRule = "id = @request.auth.id";
    app.save(users);
  },
);
