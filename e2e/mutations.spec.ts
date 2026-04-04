import { expect, test } from '@playwright/test';
import { BOOKMARKS, DEFAULT_BOOKMARKS, TABLES } from './support/fixtures';
import { setupMockApi } from './support/mock-api';

// ─── Delete bookmark ──────────────────────────────────────────────────────────

test('clicking the delete button sends the deleteBookmark mutation', async ({ page }) => {
	await setupMockApi(page, { bookmarks: [BOOKMARKS.scrollsOfArcana] });
	await page.goto('/');

	const deleteRequest = page.waitForRequest(
		req => req.method() === 'POST' && req.url().includes('/deleteBookmark'),
	);

	const entry = page.locator('.list_bookmark').first();
	await entry.hover();
	await entry.locator('.list_bookmark_delete_button').click();

	const req = await deleteRequest;
	const body = JSON.parse(req.postData() ?? '{}') as Record<string, { id: string }>;
	expect(body['0']?.id).toBe(BOOKMARKS.scrollsOfArcana.id);
});

test('delete button sends the correct id for each bookmark', async ({ page }) => {
	await setupMockApi(page, { bookmarks: [BOOKMARKS.scrollsOfArcana, BOOKMARKS.oracleOfMysts] });
	await page.goto('/');

	const oracleEntry = page.locator(`#${BOOKMARKS.oracleOfMysts.id}`);

	const deleteRequest = page.waitForRequest(
		req => req.method() === 'POST' && req.url().includes('/deleteBookmark'),
	);

	await oracleEntry.hover();
	await oracleEntry.locator('.list_bookmark_delete_button').click();

	const req = await deleteRequest;
	const body = JSON.parse(req.postData() ?? '{}') as Record<string, { id: string }>;
	expect(body['0']?.id).toBe(BOOKMARKS.oracleOfMysts.id);
});

// ─── Visit bookmark ───────────────────────────────────────────────────────────

test('clicking a bookmark link sends the visitBookmark mutation', async ({ page }) => {
	await setupMockApi(page, { bookmarks: [BOOKMARKS.scrollsOfArcana] });
	await page.goto('/');

	const visitRequest = page.waitForRequest(
		req => req.method() === 'POST' && req.url().includes('/visitBookmark'),
	);

	await page.context().route('https://www.scrollsofarcana.com', route => route.abort());

	await page.locator('.list_bookmark a').first().click({ modifiers: [] });

	const req = await visitRequest;
	const body = JSON.parse(req.postData() ?? '{}') as Record<string, { id: string }>;
	expect(body['0']?.id).toBe(BOOKMARKS.scrollsOfArcana.id);
});

// ─── Bookmark selection ───────────────────────────────────────────────────────

test('checking a bookmark checkbox selects it (highlighted row)', async ({ page }) => {
	await setupMockApi(page, { bookmarks: [BOOKMARKS.scrollsOfArcana] });
	await page.goto('/');

	const entry = page.locator('.list_bookmark').first();
	const checkbox = entry.locator('input[type="checkbox"]');

	await checkbox.evaluate(el => (el as HTMLInputElement).click());

	await expect(entry).toHaveClass(/selected/);
});

test('unchecking a bookmark removes the selection', async ({ page }) => {
	await setupMockApi(page, { bookmarks: [BOOKMARKS.scrollsOfArcana] });
	await page.goto('/');

	const entry = page.locator('.list_bookmark').first();
	const checkbox = entry.locator('input[type="checkbox"]');

	await checkbox.evaluate(el => (el as HTMLInputElement).click());
	await expect(entry).toHaveClass(/selected/);

	await checkbox.evaluate(el => (el as HTMLInputElement).click());
	await expect(entry).not.toHaveClass(/selected/);
});

// ─── Table switching ──────────────────────────────────────────────────────────

test('switching the table sends new subscriptions and updates the list', async ({ page }) => {
	const questsBookmark = {
		id: 'quests0-id-ddddddddddd',
		title: 'The Adventurers Guild',
		url: 'https://www.adventurersguild.net',
		tags: [],
		visitCount: 3,
		position: 1,
	};

	const api = await setupMockApi(page, {
		tables: TABLES,
		bookmarks: DEFAULT_BOOKMARKS,
	});
	await page.goto('/');
	await expect(page.locator('.list_bookmark')).toHaveCount(DEFAULT_BOOKMARKS.length);

	api.pushBookmarks([questsBookmark]);
	api.pushVotes([]);

	await page.locator('select').selectOption(TABLES[1]!.name);

	await expect(page.locator('.list_bookmark_title')).toContainText('The Adventurers Guild');
});
