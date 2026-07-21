import { defineConfig, devices } from '@playwright/test';

const PORT = 4173;

export default defineConfig({
	testDir: 'tests/e2e',
	fullyParallel: true,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 1 : 0,
	use: {
		baseURL: `http://127.0.0.1:${PORT}`,
		trace: 'on-first-retry'
	},
	webServer: {
		command: 'pnpm build && pnpm preview --host 127.0.0.1 --port 4173',
		port: PORT,
		reuseExistingServer: !process.env.CI,
		timeout: 120_000
	},
	projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }]
});
