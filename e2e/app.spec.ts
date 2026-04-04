import { expect, test } from '@playwright/test';
import { BOOKMARKS, TABLES } from './support/fixtures';
import { setupMockApi } from './support/mock-api';

// ─── App shell ───────────────────────────────────────────────────────────────

test('table selector lists every available table', async ({ page }) => {
	await setupMockApi(page, { tables: TABLES });
	await page.goto('/');
	const options = page.locator('select option');
	await expect(options).toHaveCount(TABLES.length);
	await expect(options.first()).toContainText(TABLES[0]!.name);
	await expect(options.nth(1)).toContainText(TABLES[1]!.name);
});

// ─── Bookmark list ───────────────────────────────────────────────────────────

test('shows an empty list when there are no bookmarks', async ({ page }) => {
	await setupMockApi(page, { bookmarks: [] });
	await page.goto('/');
	await expect(page.locator('#list')).toBeEmpty();
});

test('each entry shows title, URL and tags', async ({ page }) => {
	await setupMockApi(page, { bookmarks: [BOOKMARKS.oracleOfMysts] });
	await page.goto('/');

	const entry = page.locator('.list_bookmark').first();
	await expect(entry.locator('.list_bookmark_title')).toContainText('Oracle of the Mysts');
	await expect(entry.locator('a')).toContainText('https://www.oracleofmysts.com');
	await expect(entry.locator('.list_bookmark_tags')).toContainText('search');
	await expect(entry.locator('.list_bookmark_tags')).toContainText('divination');
});

test('bookmarks with the "deleted" tag show a strikethrough title', async ({ page }) => {
	await setupMockApi(page, { bookmarks: [BOOKMARKS.dragonsTavern] });
	await page.goto('/');

	const deletedTitle = page.locator('.list_bookmark_title.deleted');
	await expect(deletedTitle).toBeVisible();
	await expect(deletedTitle).toContainText('The Dragon\'s Tavern');
});

test('bookmarks without the "deleted" tag do not have strikethrough', async ({ page }) => {
	await setupMockApi(page, { bookmarks: [BOOKMARKS.scrollsOfArcana] });
	await page.goto('/');

	await expect(page.locator('.list_bookmark_title.deleted')).toHaveCount(0);
});

// ─── Live WebSocket updates ───────────────────────────────────────────────────

test('new bookmarks pushed via WebSocket appear in the list', async ({ page }) => {
	const api = await setupMockApi(page, { bookmarks: [] });
	await page.goto('/');
	await expect(page.locator('.list_bookmark')).toHaveCount(0);

	api.pushBookmarks([BOOKMARKS.scrollsOfArcana]);
	await expect(page.locator('.list_bookmark')).toHaveCount(1);
	await expect(page.locator('.list_bookmark_title')).toContainText('Scrolls of Arcana');
});

test('updated bookmark data is reflected in the list', async ({ page }) => {
	const api = await setupMockApi(page, { bookmarks: [BOOKMARKS.scrollsOfArcana] });
	await page.goto('/');
	await expect(page.locator('.list_bookmark_title').first()).toContainText('Scrolls of Arcana');

	api.pushBookmarks([{ ...BOOKMARKS.scrollsOfArcana, title: 'Scrolls of Arcana (updated)' }]);
	await expect(page.locator('.list_bookmark_title').first()).toContainText('Scrolls of Arcana (updated)');
});

test('removing a bookmark via WebSocket removes it from the list', async ({ page }) => {
	const api = await setupMockApi(page, { bookmarks: [BOOKMARKS.scrollsOfArcana, BOOKMARKS.oracleOfMysts] });
	await page.goto('/');
	await expect(page.locator('.list_bookmark')).toHaveCount(2);

	api.pushBookmarks([BOOKMARKS.oracleOfMysts]);
	await expect(page.locator('.list_bookmark')).toHaveCount(1);
	await expect(page.locator('.list_bookmark_title')).toContainText('Oracle of the Mysts');
});
