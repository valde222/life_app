import { defineConfig, devices } from '@playwright/test';

export const E2E_SERVER = 'http://localhost:8091';
export const E2E_USER = { email: 'e2e@example.com', password: 'e2e-password' };
export const E2E_ADMIN = { email: 'e2e-admin@example.com', password: 'e2e-admin-password' };

export default defineConfig({
  testDir: './e2e',
  snapshotPathTemplate: '{testDir}/screenshots/{arg}{ext}',
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env['CI'],
  retries: process.env['CI'] ? 1 : 0,
  reporter: process.env['CI'] ? 'github' : 'list',
  use: {
    baseURL: 'http://localhost:4300',
    trace: 'retain-on-failure',
    ...devices['Pixel 7'],
    reducedMotion: 'reduce',
  },
  webServer: [
    ...(process.env['E2E_POCKETBASE_RUNNING'] ? [] : [pocketBaseServer()]),
    {
      command: 'npx ng serve --port 4300',
      url: 'http://localhost:4300',
      timeout: 180_000,
      reuseExistingServer: !process.env['CI'],
    },
  ],
});

function pocketBaseServer() {
  const env = [
    `PB_USER_EMAIL=${E2E_USER.email}`,
    `PB_USER_PASSWORD=${E2E_USER.password}`,
    `PB_ADMIN_EMAIL=${E2E_ADMIN.email}`,
    `PB_ADMIN_PASSWORD=${E2E_ADMIN.password}`,
    'PB_RATE_LIMITS=off',
  ].join(' ');
  return {
    command: `${env} ../pocketbase/tests/start-server.sh life-e2e-pocketbase 8091 && docker attach life-e2e-pocketbase`,
    url: `${E2E_SERVER}/api/health`,
    timeout: 180_000,
    reuseExistingServer: !process.env['CI'],
    gracefulShutdown: { signal: 'SIGTERM' as const, timeout: 5_000 },
  };
}
