import { expect, test } from '@playwright/test';
import { BOOKMARKS, DEFAULT_BOOKMARKS } from './support/fixtures';
import { setupMockApi } from './support/mock-api';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const IMPORT_BTN_TITLE = 'Import bookmarks from Session Buddy (Ctrl + I)';

async function openImportDialog(page: import('@playwright/test').Page) {
	await page.locator(`button[title="${IMPORT_BTN_TITLE}"]`).click();
	await expect(page.locator('dialog#import_dialog')).toBeVisible();
}

async function fillImportField(page: import('@playwright/test').Page, json: string) {
	await page.locator('textarea#import_field').fill(json);
}

// ─── Opening the dialog ───────────────────────────────────────────────────────

test('import button opens the dialog', async ({ page }) => {
	await setupMockApi(page);
	await page.goto('/');
	await openImportDialog(page);
});

test('Ctrl+I keyboard shortcut opens the import dialog', async ({ page }) => {
	await setupMockApi(page);
	await page.goto('/');
	await page.keyboard.press('Control+i');
	await expect(page.locator('dialog#import_dialog')).toBeVisible();
});

// ─── Validation ───────────────────────────────────────────────────────────────

test('import button is disabled for invalid JSON', async ({ page }) => {
	await setupMockApi(page);
	await page.goto('/');
	await openImportDialog(page);

	await fillImportField(page, 'this is not json');
	await expect(page.locator('dialog#import_dialog button')).toBeDisabled();
});

test('import button is disabled for a JSON object (not an array)', async ({ page }) => {
	await setupMockApi(page);
	await page.goto('/');
	await openImportDialog(page);

	await fillImportField(page, JSON.stringify({ title: 'Test', url: 'https://test.com' }));
	await expect(page.locator('dialog#import_dialog button')).toBeDisabled();
});

test('import button is disabled for array items missing required fields', async ({ page }) => {
	await setupMockApi(page);
	await page.goto('/');
	await openImportDialog(page);

	await fillImportField(page, JSON.stringify([{ name: 'Wrong field' }]));
	await expect(page.locator('dialog#import_dialog button')).toBeDisabled();
});

test('import button is disabled for array items with an invalid URL', async ({ page }) => {
	await setupMockApi(page);
	await page.goto('/');
	await openImportDialog(page);

	await fillImportField(page, JSON.stringify([{ title: 'Test', url: 'not-a-url' }]));
	await expect(page.locator('dialog#import_dialog button')).toBeDisabled();
});

// ─── Importing ────────────────────────────────────────────────────────────────

test('clicking Import sends the createBookmarks mutation', async ({ page }) => {
	await setupMockApi(page, { bookmarks: [] });
	await page.goto('/');
	await openImportDialog(page);

	const newBookmark = { title: 'Example', url: 'https://example.com' };
	await fillImportField(page, JSON.stringify([newBookmark]));
	await expect(page.locator('dialog#import_dialog button')).toBeEnabled();

	const createRequest = page.waitForRequest(
		req => req.method() === 'POST' && req.url().includes('/createBookmarks'),
	);

	await page.locator('dialog#import_dialog button').click();
	await expect(page.locator('dialog#import_dialog')).not.toBeVisible();

	const req = await createRequest;
	const body = JSON.parse(req.postData() ?? '{}') as Record<string, {
		newBookmarks: Array<{ title: string; url: string }>;
	}>;
	expect(body['0']?.newBookmarks).toEqual([newBookmark]);
});

test('importing multiple bookmarks sends all of them in one mutation', async ({ page }) => {
	await setupMockApi(page, { bookmarks: [] });
	await page.goto('/');
	await openImportDialog(page);

	const newBookmarks = [
		{ title: 'Site A', url: 'https://site-a.com' },
		{ title: 'Site B', url: 'https://site-b.com' },
		{ title: 'Site C', url: 'https://site-c.com' },
	];
	await fillImportField(page, JSON.stringify(newBookmarks));

	const createRequest = page.waitForRequest(
		req => req.method() === 'POST' && req.url().includes('/createBookmarks'),
	);

	await page.locator('dialog#import_dialog button').click();

	const req = await createRequest;
	const body = JSON.parse(req.postData() ?? '{}') as Record<string, {
		newBookmarks: Array<{ title: string; url: string }>;
	}>;
	expect(body['0']?.newBookmarks).toHaveLength(3);
});

// ─── Duplicate detection ──────────────────────────────────────────────────────

test('importing a URL that already exists shows an error dialog', async ({ page }) => {
	await setupMockApi(page, { bookmarks: [BOOKMARKS.scrollsOfArcana] });
	await page.goto('/');
	await openImportDialog(page);

	const duplicate = [{ title: 'Scrolls of Arcana Again', url: BOOKMARKS.scrollsOfArcana.url }];
	await fillImportField(page, JSON.stringify(duplicate));
	await page.locator('dialog#import_dialog button').click();

	await expect(page.locator('dialog#error_dialog')).toBeVisible();
	await expect(page.locator('dialog#error_dialog')).toContainText(BOOKMARKS.scrollsOfArcana.url);
});

test('non-duplicate bookmarks are still imported even when some are duplicates', async ({ page }) => {
	await setupMockApi(page, { bookmarks: DEFAULT_BOOKMARKS });
	await page.goto('/');
	await openImportDialog(page);

	const payload = [
		{ title: 'Scrolls of Arcana Again', url: BOOKMARKS.scrollsOfArcana.url }, // duplicate
		{ title: 'Brand New Site', url: 'https://brand-new-site.example.com' }, // new
	];
	await fillImportField(page, JSON.stringify(payload));

	const createRequest = page.waitForRequest(
		req => req.method() === 'POST' && req.url().includes('/createBookmarks'),
	);

	await page.locator('dialog#import_dialog button').click();

	const req = await createRequest;
	const body = JSON.parse(req.postData() ?? '{}') as Record<string, {
		newBookmarks: Array<{ title: string; url: string }>;
	}>;
	expect(body['0']?.newBookmarks).toHaveLength(1);
	expect(body['0']?.newBookmarks[0]?.url).toBe('https://brand-new-site.example.com');
});
