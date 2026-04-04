import { expect, test } from '@playwright/test';
import { BOOKMARKS, DEFAULT_BOOKMARKS } from './support/fixtures';
import { setupMockApi } from './support/mock-api';

test('filters bookmarks by title', async ({ page }) => {
	await setupMockApi(page, { bookmarks: DEFAULT_BOOKMARKS });
	await page.goto('/');
	await expect(page.locator('.list_bookmark')).toHaveCount(DEFAULT_BOOKMARKS.length);

	await page.fill('input[type="search"]', 'Arcana');
	await expect(page.locator('.list_bookmark')).toHaveCount(1);
	await expect(page.locator('.list_bookmark_title')).toContainText('Scrolls of Arcana');
});

test('filters bookmarks by URL', async ({ page }) => {
	await setupMockApi(page, { bookmarks: DEFAULT_BOOKMARKS });
	await page.goto('/');

	await page.fill('input[type="search"]', 'dragonstavern');
	await expect(page.locator('.list_bookmark')).toHaveCount(1);
	await expect(page.locator('.list_bookmark_title')).toContainText('The Dragon\'s Tavern');
});

test('filters bookmarks by tag', async ({ page }) => {
	await setupMockApi(page, { bookmarks: DEFAULT_BOOKMARKS });
	await page.goto('/');

	await page.fill('input[type="search"]', 'reference');
	await expect(page.locator('.list_bookmark')).toHaveCount(1);
	await expect(page.locator('.list_bookmark_title')).toContainText('Grimoire of Lore');
});

test('search is case-insensitive (fuzzy)', async ({ page }) => {
	await setupMockApi(page, { bookmarks: DEFAULT_BOOKMARKS });
	await page.goto('/');

	await page.fill('input[type="search"]', 'arcana');
	await expect(page.locator('.list_bookmark')).toHaveCount(1);
	await expect(page.locator('.list_bookmark_title')).toContainText('Scrolls of Arcana');
});

test('partial / fuzzy match works', async ({ page }) => {
	await setupMockApi(page, { bookmarks: DEFAULT_BOOKMARKS });
	await page.goto('/');

	await page.fill('input[type="search"]', 'grimoire');
	await expect(page.locator('.list_bookmark')).toHaveCount(1);
	await expect(page.locator('.list_bookmark_title')).toContainText('Grimoire of Lore');
});

test('clearing the search restores all bookmarks', async ({ page }) => {
	await setupMockApi(page, { bookmarks: DEFAULT_BOOKMARKS });
	await page.goto('/');

	await page.fill('input[type="search"]', 'Arcana');
	await expect(page.locator('.list_bookmark')).toHaveCount(1);

	await page.fill('input[type="search"]', '');
	await expect(page.locator('.list_bookmark')).toHaveCount(DEFAULT_BOOKMARKS.length);
});

test('a query that matches nothing shows an empty list', async ({ page }) => {
	await setupMockApi(page, { bookmarks: DEFAULT_BOOKMARKS });
	await page.goto('/');

	await page.fill('input[type="search"]', 'xyzzy_not_a_real_bookmark');
	await expect(page.locator('.list_bookmark')).toHaveCount(0);
});

test('search input is disabled when there are no bookmarks', async ({ page }) => {
	await setupMockApi(page, { bookmarks: [] });
	await page.goto('/');

	await expect(page.locator('input[type="search"]')).toBeDisabled();
});

test('search input becomes enabled once bookmarks arrive', async ({ page }) => {
	const api = await setupMockApi(page, { bookmarks: [] });
	await page.goto('/');
	await expect(page.locator('input[type="search"]')).toBeDisabled();

	api.pushBookmarks([BOOKMARKS.scrollsOfArcana]);
	await expect(page.locator('input[type="search"]')).toBeEnabled();
});
