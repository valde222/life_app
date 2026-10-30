/// <reference path="../pb_data/types.d.ts" />

onBootstrap((e) => {
  e.next();

  const settings = e.app.settings();
  settings.meta.appName = "Life";
  settings.trustedProxy.headers = ["X-Forwarded-For"];
  settings.trustedProxy.useLeftmostIP = false;
  settings.rateLimits.enabled = $os.getenv("PB_RATE_LIMITS") !== "off";
  settings.rateLimits.rules = [
    { label: "*:auth", maxRequests: 5, duration: 60 },
    { label: "*:create", maxRequests: 60, duration: 10 },
    { label: "/api/", maxRequests: 600, duration: 10 },
  ];
  e.app.save(settings);
});
