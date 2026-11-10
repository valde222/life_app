module.exports = {
  remember(record) {
    const uploads = record.getUnsavedFiles("files");
    if (!uploads.length) {
      return;
    }
    const names = JSON.parse(record.getString("file_names") || "{}") || {};
    for (const upload of uploads) {
      names[upload.name] = upload.originalName;
    }
    record.set("file_names", names);
  },
};
