// @ts-check
import { defineConfig, devices } from '@playwright/test';
import 'dotenv/config';



export default defineConfig({
  testDir: './tests',
  timeout: 180_000,
  fullyParallel: false,
  workers: 1,           
  retries: 0,
  reporter: 'line',     
  use: {
    headless: true,
    viewport: { width: 1280, height: 720 },  
    video: 'off',
    trace: 'off',
    screenshot: 'off',
    actionTimeout: 30_000,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});