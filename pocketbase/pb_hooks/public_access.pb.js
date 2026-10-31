/// <reference path="../pb_data/types.d.ts" />

routerUse((e) => {
  const viaProxy = ["X-Forwarded-For", "Forwarded", "X-Real-Ip", "Tailscale-Funnel-Request"].some(
    (header) => e.request.header.get(header) !== "",
  );
  if (!viaProxy) {
    return e.next();
  }
  const path = e.request.url.path;
  let superuserRoute = path === "/_" || path.startsWith("/_/");
  const collectionRoute = /^\/api\/collections\/([^/]+)/.exec(path);
  if (collectionRoute) {
    try {
      superuserRoute ||= e.app.findCachedCollectionByNameOrId(collectionRoute[1]).name === "_superusers";
    } catch {}
  }
  if (superuserRoute || e.hasSuperuserAuth()) {
    throw new NotFoundError();
  }
  return e.next();
});
