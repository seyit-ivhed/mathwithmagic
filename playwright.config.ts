import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
    testDir: './e2e',
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    workers: process.env.CI ? 1 : undefined,
    reporter: 'html',
    use: {
        baseURL: 'http://127.0.0.1:15176',
        trace: 'on-first-retry',
        locale: 'en-US',
        timezoneId: 'Europe/Stockholm',
    },
    projects: [
        {
            name: 'chromium',
            use: { ...devices['Desktop Chrome'] },
        },
    ],
    webServer: {
        command: 'npx vite --port 15176 --strictPort',
        url: 'http://127.0.0.1:15176',
        reuseExistingServer: !process.env.CI,
        env: {
            VITE_NO_HTTPS: '1',
            VITE_SUPABASE_URL: 'http://localhost:54321',
            VITE_SUPABASE_ANON_KEY: 'test-anon-key-for-e2e',
        },
    },
});
