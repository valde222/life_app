declare const LIFE_VERSION: string | undefined;

export const APP_VERSION = typeof LIFE_VERSION === 'string' ? LIFE_VERSION : 'dev';
