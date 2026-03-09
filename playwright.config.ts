import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
    testDir: './e2e',
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    workers: process.env.CI ? 1 : undefined,
    reporter: 'html',
    use: {
        baseURL: 'https://127.0.0.1:5173',
        ignoreHTTPSErrors: true,
        trace: 'on-first-retry',
        locale: 'en-US',
        timezoneId: 'Europe/Stockholm',
        reducedMotion: 'reduce',
    },
    projects: [
        {
            name: 'chromium',
            use: { ...devices['Desktop Chrome'] },
        },
    ],
    webServer: {
        command: 'npm run dev',
        url: 'https://127.0.0.1:5173',
        reuseExistingServer: !process.env.CI,
        env: {
            NODE_TLS_REJECT_UNAUTHORIZED: '0',
            VITE_SUPABASE_URL: 'http://localhost:54321',
            VITE_SUPABASE_ANON_KEY: 'test-anon-key-for-e2e',
        },
    },
});
