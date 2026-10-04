import { defineConfig } from '@playwright/test';
const preview = process.env.PREVIEW === '1';
export default defineConfig({
  testDir: './tests/browser', fullyParallel: false, workers: 1,
  use: { baseURL: 'http://127.0.0.1:4174', viewport: { width: 1440, height: 900 }, channel: 'chrome', launchOptions: { args: ['--enable-webgl', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] } },
  webServer: { command: preview ? 'npm run preview -- --port 4174 --strictPort' : 'npm run dev -- --port 4174 --strictPort', url: 'http://127.0.0.1:4174', reuseExistingServer: false },
});
