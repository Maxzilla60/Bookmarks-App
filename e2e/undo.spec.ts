import { expect, test } from '@playwright/test';
import { BOOKMARKS } from './support/fixtures';
import { setupMockApi } from './support/mock-api';

// ─── Undo button state ────────────────────────────────────────────────────────

test('undo button is disabled when canUndo is false', async ({ page }) => {
	await setupMockApi(page, { canUndo: false });
	await page.goto('/');

	const undoButton = page.getByRole('button', { name: 'Undo last action (Ctrl + Z)' });
	await expect(undoButton).toBeDisabled();
});

test('undo button is enabled when canUndo is true', async ({ page }) => {
	await setupMockApi(page, { canUndo: true });
	await page.goto('/');

	const undoButton = page.getByRole('button', { name: 'Undo last action (Ctrl + Z)' });
	await expect(undoButton).toBeEnabled();
});

test('undo button becomes enabled after canUndo is pushed as true', async ({ page }) => {
	const api = await setupMockApi(page, { canUndo: false });
	await page.goto('/');

	const undoButton = page.getByRole('button', { name: 'Undo last action (Ctrl + Z)' });
	await expect(undoButton).toBeDisabled();

	api.pushCanUndo(true);
	await expect(undoButton).toBeEnabled();
});

test('undo button becomes disabled after canUndo is pushed as false', async ({ page }) => {
	const api = await setupMockApi(page, { canUndo: true });
	await page.goto('/');

	const undoButton = page.getByRole('button', { name: 'Undo last action (Ctrl + Z)' });
	await expect(undoButton).toBeEnabled();

	api.pushCanUndo(false);
	await expect(undoButton).toBeDisabled();
});

// ─── Undo mutation ────────────────────────────────────────────────────────────

test('clicking the undo button sends the undo mutation', async ({ page }) => {
	await setupMockApi(page, { canUndo: true });
	await page.goto('/');

	const undoRequest = page.waitForRequest(
		req => req.method() === 'POST' && req.url().includes('/undo'),
	);

	await page.getByRole('button', { name: 'Undo last action (Ctrl + Z)' }).click();

	const req = await undoRequest;
	const body = JSON.parse(req.postData() ?? '{}') as Record<string, { table: string }>;
	expect(body['0']?.table).toBe('spellbooks');
});

test('clicking the undo button sends the correct table name', async ({ page }) => {
	await setupMockApi(page, {
		tables: [{ name: 'spellbooks', emoji: '📖' }, { name: 'quests', emoji: '⚔️' }],
		bookmarks: [BOOKMARKS.scrollsOfArcana],
		canUndo: true,
	});
	await page.goto('/');

	await page.locator('select').selectOption('quests');

	const undoRequest = page.waitForRequest(
		req => req.method() === 'POST' && req.url().includes('/undo'),
	);

	await page.getByRole('button', { name: 'Undo last action (Ctrl + Z)' }).click();

	const req = await undoRequest;
	const body = JSON.parse(req.postData() ?? '{}') as Record<string, { table: string }>;
	expect(body['0']?.table).toBe('quests');
});

// ─── Ctrl+Z keyboard shortcut ─────────────────────────────────────────────────

test('Ctrl+Z keyboard shortcut sends the undo mutation when canUndo is true', async ({ page }) => {
	await setupMockApi(page, { canUndo: true });
	await page.goto('/');

	const undoRequest = page.waitForRequest(
		req => req.method() === 'POST' && req.url().includes('/undo'),
	);

	await page.keyboard.press('Control+z');

	await undoRequest;
});

test('Ctrl+Z keyboard shortcut does not send the undo mutation when canUndo is false', async ({ page }) => {
	await setupMockApi(page, { canUndo: false });
	await page.goto('/');

	let undoRequestFired = false;
	page.on('request', req => {
		if (req.method() === 'POST' && req.url().includes('/undo')) {
			undoRequestFired = true;
		}
	});

	await page.keyboard.press('Control+z');
	// Give time for any request to fire
	await page.waitForTimeout(300);

	expect(undoRequestFired).toBe(false);
});

