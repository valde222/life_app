const APP = '^src/app/';

const feature = (name) => `${APP}features/${name}/`;

module.exports = {
  forbidden: [
    {
      name: 'no-circular',
      severity: 'error',
      from: {},
      to: { circular: true },
    },
    {
      name: 'domain-is-pure',
      comment: 'domain/ holds plain TypeScript: models and rules, no framework or storage',
      severity: 'error',
      from: { path: `${APP}domain/` },
      to: { pathNot: [`${APP}domain/`] },
    },
    {
      name: 'core-below-shared-and-features',
      severity: 'error',
      from: { path: `${APP}core/` },
      to: { path: `${APP}(shared|features|shell)/` },
    },
    {
      name: 'shared-below-features',
      severity: 'error',
      from: { path: `${APP}shared/` },
      to: { path: `${APP}(features|shell)/` },
    },
    {
      name: 'features-are-independent',
      comment: 'a feature may use shared, core and domain, never another feature',
      severity: 'error',
      from: { path: `${APP}features/([^/]+)/` },
      to: { path: `${APP}features/`, pathNot: [feature('$1')] },
    },
    {
      name: 'nothing-imports-the-shell',
      severity: 'error',
      from: { path: APP, pathNot: [`${APP}shell/`] },
      to: { path: `${APP}shell/` },
    },
    {
      name: 'storage-and-server-stay-in-core',
      comment: 'only the data, sync and server modules talk to Dexie or the PocketBase SDK',
      severity: 'error',
      from: { path: APP, pathNot: [`${APP}core/(data|sync|server)/`] },
      to: { path: '^node_modules/(dexie|pocketbase)/' },
    },
    {
      name: 'local-store-stays-in-core-data-and-sync',
      severity: 'error',
      from: { path: APP, pathNot: [`${APP}core/(data|sync)/`] },
      to: { path: `${APP}core/data/local-store` },
    },
  ],
  options: {
    doNotFollow: { path: 'node_modules' },
    exclude: { path: '\\.spec\\.ts$' },
    tsConfig: { fileName: 'tsconfig.app.json' },
    tsPreCompilationDeps: true,
    enhancedResolveOptions: {
      exportsFields: ['exports'],
      conditionNames: ['import', 'require', 'node', 'default'],
    },
  },
};
