export const APP_VERSION = '5.2.0';

declare const __BUILD_TIME__: string;
export const BUILD_TIME = typeof __BUILD_TIME__ !== 'undefined' ? __BUILD_TIME__ : new Date().toISOString();
