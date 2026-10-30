import { defineConfig, devices } from '@playwright/test';

export const E2E_SERVER = 'http://localhost:8091';
export const E2E_USER = { email: 'e2e@example.com', password: 'e2e-password' };

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env['CI'],
  retries: process.env['CI'] ? 1 : 0,
  reporter: process.env['CI'] ? 'github' : 'list',
  use: {
    baseURL: 'http://localhost:4300',
    trace: 'retain-on-failure',
    ...devices['Pixel 7'],
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
  return {
    command:
      'docker build -q -t life-pocketbase:e2e ../pocketbase && ' +
      `docker run --rm --name life-e2e-pocketbase -p 8091:8090 -e PB_USER_EMAIL=${E2E_USER.email} ` +
      `-e PB_USER_PASSWORD=${E2E_USER.password} -e PB_RATE_LIMITS=off life-pocketbase:e2e`,
    url: `${E2E_SERVER}/api/health`,
    timeout: 180_000,
    reuseExistingServer: !process.env['CI'],
    gracefulShutdown: { signal: 'SIGTERM' as const, timeout: 5_000 },
  };
}
