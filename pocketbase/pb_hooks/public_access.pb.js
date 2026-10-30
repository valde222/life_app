/// <reference path="../pb_data/types.d.ts" />

routerUse((e) => {
  const viaProxy = ["X-Forwarded-For", "Forwarded", "X-Real-Ip", "Tailscale-Funnel-Request"].some(
    (header) => e.request.header.get(header) !== "",
  );
  const path = e.request.url.path;
  const superuserRoute = path === "/_" || path.startsWith("/_/") || path.startsWith("/api/collections/_superusers/");
  if (viaProxy && (superuserRoute || e.hasSuperuserAuth())) {
    throw new NotFoundError();
  }
  return e.next();
});
