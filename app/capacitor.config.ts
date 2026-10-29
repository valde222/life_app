import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'dk.ottes.life',
  appName: 'Life',
  webDir: 'dist/app/browser',
  android: {
    allowMixedContent: process.env['LIFE_DEV_SERVER'] === '1',
  },
};

export default config;
