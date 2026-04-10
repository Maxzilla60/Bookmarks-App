import { expect, test } from '@playwright/test';
import { TABLES } from './support/fixtures';
import { setupMockApi } from './support/mock-api';

test('a new table pushed via WebSocket appears as a new option', async ({ page }) => {
	const api = await setupMockApi(page, { tables: [TABLES[0]!] });
	await page.goto('/');

	const options = page.locator('select option');
	await expect(options).toHaveCount(1);

	api.pushTables(TABLES); // adds TABLES[1] = { name: 'quests', emoji: '⚔️' }

	await expect(options).toHaveCount(2);
	await expect(options.nth(1)).toContainText(TABLES[1]!.name);
});

test('a removed table disappears from the selector', async ({ page }) => {
	const api = await setupMockApi(page, { tables: TABLES });
	await page.goto('/');

	const options = page.locator('select option');
	await expect(options).toHaveCount(2);

	api.pushTables([TABLES[0]!]); // removes 'quests'

	await expect(options).toHaveCount(1);
	await expect(options.first()).toContainText(TABLES[0]!.name);
});

test('all tables removed at once empties the selector', async ({ page }) => {
	const api = await setupMockApi(page, { tables: TABLES });
	await page.goto('/');

	await expect(page.locator('select option')).toHaveCount(2);

	api.pushTables([]);

	await expect(page.locator('select option')).toHaveCount(0);
});

test('multiple tables added in a single push all appear as options', async ({ page }) => {
	const extra = [
		{ name: 'potions', emoji: '🧪' },
		{ name: 'artifacts', emoji: '💎' },
	];
	const api = await setupMockApi(page, { tables: TABLES });
	await page.goto('/');

	await expect(page.locator('select option')).toHaveCount(2);

	api.pushTables([...TABLES, ...extra]);

	await expect(page.locator('select option')).toHaveCount(4);
	for (const { name } of extra) {
		await expect(page.locator('select')).toContainText(name);
	}
});

test('a changed emoji is reflected in the option text', async ({ page }) => {
	const api = await setupMockApi(page, { tables: [{ name: 'spellbooks', emoji: '📖' }] });
	await page.goto('/');

	await expect(page.locator('select option').first()).toContainText('📖');

	api.pushTables([{ name: 'spellbooks', emoji: '🔥' }]);

	await expect(page.locator('select option').first()).toContainText('🔥');
});

test('the currently-selected table remains selected when unrelated tables are added', async ({ page }) => {
	const api = await setupMockApi(page, { tables: [TABLES[0]!] });
	await page.goto('/');

	await expect(page.locator('select')).toHaveValue(TABLES[0]!.name);

	api.pushTables(TABLES); // second table added; first stays in place

	await expect(page.locator('select')).toHaveValue(TABLES[0]!.name);
	await expect(page.locator('select option')).toHaveCount(2);
});

test('a dynamically-added table can be switched to', async ({ page }) => {
	const api = await setupMockApi(page, { tables: [TABLES[0]!] });
	await page.goto('/');

	await expect(page.locator('select option')).toHaveCount(1);

	api.pushTables(TABLES); // 'quests' becomes available

	// Wait for the option to appear, then switch to it
	const newOption = page.locator('select option', { hasText: TABLES[1]!.name });
	await expect(newOption).toBeAttached();

	api.pushBookmarks([]);
	api.pushVotes([]);
	await page.locator('select').selectOption(TABLES[1]!.name);

	await expect(page.locator('select')).toHaveValue(TABLES[1]!.name);
});

