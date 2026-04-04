import { expect, test } from '@playwright/test';
import { BOOKMARKS, TABLES } from './support/fixtures';
import { setupMockApi } from './support/mock-api';

const TWO_BOOKMARKS = [BOOKMARKS.scrollsOfArcana, BOOKMARKS.oracleOfMysts];

async function startVersusBattle(page: import('@playwright/test').Page): Promise<void> {
	await expect(page.locator('#versus')).toBeHidden();
	await page.locator('button[aria-label="New versus"]').click();
	await expect(page.locator('#versus')).toBeVisible();
}

async function getFirstCornerBookmark(page: import('@playwright/test').Page) {
	const firstTitle = (await page.locator('.versus_bookmark_title').first().textContent())?.trim();
	return firstTitle === BOOKMARKS.scrollsOfArcana.title
		? BOOKMARKS.scrollsOfArcana
		: BOOKMARKS.oracleOfMysts;
}

// ─── Button enabling ───────────────────────────────────────────────────────────

test('"New versus" button is disabled with fewer than two bookmarks', async ({ page }) => {
	await setupMockApi(page, { bookmarks: [BOOKMARKS.scrollsOfArcana] });
	await page.goto('/');

	await expect(page.locator('button[aria-label="New versus"]')).toBeDisabled();
});

test('"New versus" button is disabled when there are no bookmarks', async ({ page }) => {
	await setupMockApi(page, { bookmarks: [] });
	await page.goto('/');

	await expect(page.locator('button[aria-label="New versus"]')).toBeDisabled();
});

// ─── Panel content ────────────────────────────────────────────────────────────

test('versus panel shows both bookmarks', async ({ page }) => {
	await setupMockApi(page, { bookmarks: TWO_BOOKMARKS });
	await page.goto('/');
	await startVersusBattle(page);

	const titles = page.locator('.versus_bookmark_title');
	await expect(titles).toHaveCount(2);

	const panel = page.locator('#versus');
	const allTitleText = await titles.allTextContents();
	expect(allTitleText.map(t => t.trim())).toContain(BOOKMARKS.scrollsOfArcana.title);
	expect(allTitleText.map(t => t.trim())).toContain(BOOKMARKS.oracleOfMysts.title);
	const allLinks = await panel.locator('a').allTextContents();
	expect(allLinks.map(l => l.trim())).toContain(BOOKMARKS.scrollsOfArcana.url);
	expect(allLinks.map(l => l.trim())).toContain(BOOKMARKS.oracleOfMysts.url);
	await expect(panel).toContainText('search');
	await expect(panel).toContainText('divination');
});

// ─── Voting ───────────────────────────────────────────────────────────────────

test('the createVote mutation receives the correct winner and loser IDs', async ({ page }) => {
	await setupMockApi(page, { bookmarks: TWO_BOOKMARKS });
	await page.goto('/');
	await startVersusBattle(page);

	const voteRequest = page.waitForRequest(
		req => req.method() === 'POST' && req.url().includes('/createVote'),
	);

	await page.locator('button[aria-label="Vote for this bookmark"]').first().click();

	const req = await voteRequest;
	const body = JSON.parse(req.postData() ?? '{}') as Record<string, {
		winningId: string;
		losingId: string;
	}>;

	const fixtureIds = new Set([BOOKMARKS.scrollsOfArcana.id, BOOKMARKS.oracleOfMysts.id]);
	expect(fixtureIds).toContain(body['0']?.winningId);
	expect(fixtureIds).toContain(body['0']?.losingId);
	expect(body['0']?.winningId).not.toBe(body['0']?.losingId);
});

test('the voted-for bookmark is sent as the winner', async ({ page }) => {
	await setupMockApi(page, { bookmarks: TWO_BOOKMARKS });
	await page.goto('/');
	await startVersusBattle(page);

	const leftBookmark = await getFirstCornerBookmark(page);

	const voteRequest = page.waitForRequest(
		req => req.method() === 'POST' && req.url().includes('/createVote'),
	);

	await page.locator('.versus_bookmark').first().locator('button[aria-label="Vote for this bookmark"]').click();

	const req = await voteRequest;
	const body = JSON.parse(req.postData() ?? '{}') as Record<string, {
		winningId: string;
		losingId: string;
	}>;

	expect(body['0']?.winningId).toBe(leftBookmark.id);
});

test('voting immediately starts a new battle (panel stays visible)', async ({ page }) => {
	await setupMockApi(page, { bookmarks: TWO_BOOKMARKS });
	await page.goto('/');
	await startVersusBattle(page);

	await page.locator('button[aria-label="Vote for this bookmark"]').first().click();

	await expect(page.locator('#versus')).toBeVisible();
});

// ─── Locate button ────────────────────────────────────────────────────────────

test('clicking "Go to this bookmark in list" selects the bookmark in the list', async ({ page }) => {
	await setupMockApi(page, { bookmarks: TWO_BOOKMARKS });
	await page.goto('/');
	await startVersusBattle(page);

	const leftBookmark = await getFirstCornerBookmark(page);

	await page
		.locator('.versus_bookmark')
		.first()
		.locator('button[aria-label="Go to this bookmark in list"]')
		.click();

	await expect(page.locator(`#${leftBookmark.id}`)).toHaveClass(/selected/);
});

// ─── Delete button in the versus panel ───────────────────────────────────────

test('clicking the delete button in the versus panel sends the deleteBookmark mutation', async ({ page }) => {
	await setupMockApi(page, { bookmarks: TWO_BOOKMARKS });
	await page.goto('/');
	await startVersusBattle(page);

	const leftBookmark = await getFirstCornerBookmark(page);

	const deleteRequest = page.waitForRequest(
		req => req.method() === 'POST' && req.url().includes('/deleteBookmark'),
	);

	await page
		.locator('.versus_bookmark')
		.first()
		.locator('button[aria-label="Delete bookmark"]')
		.click();

	const req = await deleteRequest;
	const body = JSON.parse(req.postData() ?? '{}') as Record<string, { id: string }>;
	expect(body['0']?.id).toBe(leftBookmark.id);
});

// ─── Table switch resets the battle ──────────────────────────────────────────

test('switching the active table hides the versus panel', async ({ page }) => {
	const api = await setupMockApi(page, { tables: TABLES, bookmarks: TWO_BOOKMARKS });
	await page.goto('/');
	await startVersusBattle(page);

	api.pushBookmarks([]);
	api.pushVotes([]);
	await page.locator('select').selectOption(TABLES[1]!.name);

	await expect(page.locator('#versus')).toBeHidden();
});

// ─── Live WebSocket vote updates ──────────────────────────────────────────────

test('votes pushed via WebSocket are incorporated and the panel remains visible', async ({ page }) => {
	const api = await setupMockApi(page, { bookmarks: TWO_BOOKMARKS, votes: [] });
	await page.goto('/');
	await startVersusBattle(page);

	api.pushVotes([{
		id: 'voteId-aaaaaaaaaaaaaaaaaaaa',
		winner: BOOKMARKS.scrollsOfArcana.id,
		loser: BOOKMARKS.oracleOfMysts.id,
	}]);

	await expect(page.locator('#versus')).toBeVisible();
});

test('"New versus" button becomes enabled after bookmarks arrive via WebSocket', async ({ page }) => {
	const api = await setupMockApi(page, { bookmarks: [] });
	await page.goto('/');
	await expect(page.locator('button[aria-label="New versus"]')).toBeDisabled();

	api.pushBookmarks(TWO_BOOKMARKS);
	await expect(page.locator('button[aria-label="New versus"]')).toBeEnabled();
});

