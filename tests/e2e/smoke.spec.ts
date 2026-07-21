import { expect, test } from '@playwright/test';

test('home shows brand and featured tools', async ({ page }) => {
	await page.goto('/');
	await expect(page.getByRole('heading', { level: 1 })).toHaveText(
		'Privacy-first tools that stay in your browser'
	);
	await expect(page.getByRole('button', { name: /Search tools, packs/i })).toBeVisible();
	await expect(page.getByRole('link', { name: 'Search tools' }).first()).toBeVisible();
	await expect(page.getByRole('heading', { name: 'Popular tools' })).toBeVisible();
});

test('tools catalog lists plugins', async ({ page }) => {
	await page.goto('/tools');
	await expect(page.getByRole('heading', { name: 'Tools' })).toBeVisible();
	await expect(page.getByRole('link', { name: 'JSON Formatter' })).toBeVisible();
	await expect(page.getByRole('link', { name: 'Word Counter' })).toBeVisible();
});

test('tool page renders engine shell and UI', async ({ page }) => {
	await page.goto('/tools/json-formatter');
	await expect(page.getByRole('heading', { name: 'JSON Formatter' })).toBeVisible();
	await expect(page.getByLabel('JSON input')).toBeVisible();
	await expect(page.getByRole('heading', { name: 'Frequently asked questions' })).toBeVisible();
});

test('search finds jwt decoder', async ({ page }) => {
	await page.goto('/search?q=jwt');
	await expect(page.getByRole('link', { name: 'JWT Decoder' })).toBeVisible();
});

test('regex tester tool page loads', async ({ page }) => {
	await page.goto('/tools/regex-tester');
	await expect(page.getByRole('heading', { name: 'Regex Tester' })).toBeVisible();
	await expect(page.getByLabel('Pattern')).toBeVisible();
});

test('json formatter has shareable action bar and presets', async ({ page }) => {
	await page.goto('/tools/json-formatter');
	await expect(page.getByRole('toolbar', { name: 'Tool actions' })).toBeVisible();
	await expect(page.getByRole('button', { name: 'Share link' })).toBeVisible();
	await expect(page.getByRole('button', { name: 'Pretty Print' })).toBeVisible();
	await expect(page.getByRole('heading', { name: 'Next step' })).toBeVisible();
});

test('color converter restores state from URL', async ({ page }) => {
	await page.goto('/tools/color-converter?hex=ff0000');
	await expect(page.getByLabel('Color')).toHaveValue('#ff0000');
});

test('login page is reachable', async ({ page }) => {
	await page.goto('/login');
	await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible();
	await expect(page.getByLabel('Email').first()).toBeVisible();
});
