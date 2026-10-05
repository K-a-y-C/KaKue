import { defineConfig } from '@playwright/test';
const baseURL = 'http://127.0.0.1:4174' + (process.env.BASE_PATH || '/');
const preview = process.env.PREVIEW === '1';
const presenter = process.env.PRESENTER === '1';
export default defineConfig({
  testDir: './tests/browser', fullyParallel: false, workers: 1,
  use: { baseURL, viewport: { width: 1440, height: 900 }, channel: 'chrome', deviceScaleFactor: presenter && process.platform === 'darwin' ? 2 : 1, headless: !presenter, launchOptions: { args: presenter ? ['--enable-webgl', '--enable-gpu', ...(process.platform === 'darwin' ? ['--use-angle=metal'] : [])] : ['--enable-webgl', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] } },
  webServer: { command: preview ? 'npm run preview -- --port 4174 --strictPort' : 'npm run dev -- --port 4174 --strictPort', url: baseURL, reuseExistingServer: false },
});
