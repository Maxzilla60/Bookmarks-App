import { expect, test } from '@playwright/test';
import { BOOKMARKS } from './support/fixtures';
import { setupMockApi } from './support/mock-api';

async function openDetails(page: import('@playwright/test').Page, titleText: string) {
	await page.locator('.list_bookmark_title', { hasText: titleText }).click();
	await expect(page.locator('dialog#bookmark_details_dialog')).toBeVisible();
}

// ─── Opening the dialog ───────────────────────────────────────────────────────

test('clicking a bookmark title opens the details dialog', async ({ page }) => {
	await setupMockApi(page, { bookmarks: [BOOKMARKS.oracleOfMysts] });
	await page.goto('/');
	await expect(page.locator('dialog#bookmark_details_dialog')).not.toBeVisible();
	await openDetails(page, 'Oracle of the Mysts');

	const dialog = page.locator('dialog#bookmark_details_dialog');

	await expect(dialog.locator('dd.id')).toContainText(BOOKMARKS.oracleOfMysts.id);
	await expect(dialog.locator('dd[contenteditable="true"]').first()).toContainText(BOOKMARKS.oracleOfMysts.title);
	await expect(dialog.locator('dd.url')).toContainText(BOOKMARKS.oracleOfMysts.url);
	await expect(dialog.locator('dd', { hasText: String(BOOKMARKS.oracleOfMysts.visitCount) }).first()).toBeVisible();

	await expect(dialog).toContainText('search');
	await expect(dialog).toContainText('divination');

	await expect(page.locator('dialog#bookmark_details_dialog button', { hasText: 'Confirm Edit' })).toHaveCount(0);
	await expect(page.locator('dialog#bookmark_details_dialog button')).toBeVisible();

	await page.locator('dialog#bookmark_details_dialog button').click();
	await expect(page.locator('dialog#bookmark_details_dialog')).not.toBeVisible();
});

// ─── Editing ─────────────────────────────────────────────────────────────────

test('editing the title switches the button to "Confirm Edit"', async ({ page }) => {
	await setupMockApi(page, { bookmarks: [BOOKMARKS.scrollsOfArcana] });
	await page.goto('/');
	await openDetails(page, 'Scrolls of Arcana');

	const titleField = page.locator('dialog#bookmark_details_dialog dd[contenteditable="true"]').first();
	await titleField.fill('Scrolls of Arcana Extended');

	await expect(page.locator('dialog#bookmark_details_dialog button', { hasText: 'Confirm Edit' })).toBeVisible();
});

test('editing the URL switches the button to "Confirm Edit"', async ({ page }) => {
	await setupMockApi(page, { bookmarks: [BOOKMARKS.scrollsOfArcana] });
	await page.goto('/');
	await openDetails(page, 'Scrolls of Arcana');

	const urlField = page.locator('dialog#bookmark_details_dialog dd.url');
	await urlField.fill('https://www.scrollsofarcana.com/extended');

	await expect(page.locator('dialog#bookmark_details_dialog button', { hasText: 'Confirm Edit' })).toBeVisible();
});

test('confirming an edit sends the editBookmark mutation', async ({ page }) => {
	await setupMockApi(page, { bookmarks: [BOOKMARKS.scrollsOfArcana] });
	await page.goto('/');
	await openDetails(page, 'Scrolls of Arcana');

	const editRequest = page.waitForRequest(
		req => req.method() === 'POST' && req.url().includes('/editBookmark'),
	);

	const titleField = page.locator('dialog#bookmark_details_dialog dd[contenteditable="true"]').first();
	await titleField.fill('Scrolls of Arcana Extended');

	await page.locator('dialog#bookmark_details_dialog button', { hasText: 'Confirm Edit' }).click();
	await expect(page.locator('dialog#bookmark_details_dialog')).not.toBeVisible();

	const req = await editRequest;
	const body = JSON.parse(req.postData() ?? '{}') as Record<string, {
		id: string;
		titleAndUrl: { title: string; url: string }
	}>;
	expect(body['0']?.id).toBe(BOOKMARKS.scrollsOfArcana.id);
	expect(body['0']?.titleAndUrl.title).toBe('Scrolls of Arcana Extended');
});

test('"Confirm Edit" button is disabled if the title is empty', async ({ page }) => {
	await setupMockApi(page, { bookmarks: [BOOKMARKS.scrollsOfArcana] });
	await page.goto('/');
	await openDetails(page, 'Scrolls of Arcana');

	const dialog = page.locator('dialog#bookmark_details_dialog');
	await dialog.locator('dd.url').fill('https://www.scrollsofarcana.com'); // keep URL valid
	await dialog.locator('dd[contenteditable="true"]').first().fill(''); // clear title → invalid

	await expect(dialog.locator('button', { hasText: 'Confirm Edit' })).toBeDisabled();
});

test('"Confirm Edit" button is disabled if the URL is not a valid URL', async ({ page }) => {
	await setupMockApi(page, { bookmarks: [BOOKMARKS.scrollsOfArcana] });
	await page.goto('/');
	await openDetails(page, 'Scrolls of Arcana');

	const dialog = page.locator('dialog#bookmark_details_dialog');
	await dialog.locator('dd[contenteditable="true"]').first().fill('Scrolls of Arcana'); // keep title valid
	await dialog.locator('dd.url').fill('not-a-valid-url'); // set URL to invalid

	await expect(dialog.locator('button', { hasText: 'Confirm Edit' })).toBeDisabled();
});
