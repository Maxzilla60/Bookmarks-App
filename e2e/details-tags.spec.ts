import { expect, test } from '@playwright/test';
import { BOOKMARKS } from './support/fixtures';
import { setupMockApi } from './support/mock-api';

async function openDetails(page: import('@playwright/test').Page, titleText: string) {
	await page.locator('.list_bookmark_title', { hasText: titleText }).click();
	await expect(page.locator('dialog#bookmark_details_dialog')).toBeVisible();
}

function tagsInput(page: import('@playwright/test').Page) {
	return page.locator('dialog#bookmark_details_dialog input.svelte-tags-input');
}

function tagChips(page: import('@playwright/test').Page) {
	return page.locator('dialog#bookmark_details_dialog .svelte-tags-input-tag');
}

function confirmEditButton(page: import('@playwright/test').Page) {
	return page.locator('dialog#bookmark_details_dialog button', { hasText: 'Confirm Edit' });
}

// Clicking "Confirm Edit" commits title, url and tags together via a single
// `editBookmark` mutation. tRPC's httpBatchLink may still wrap it in a batch
// whose pathname is like "/editBookmark", so these helpers locate a procedure
// within such a batch and return its input by matching the batch index.
function batchContains(req: import('@playwright/test').Request, procedure: string): boolean {
	if (req.method() !== 'POST') {
		return false;
	}
	return new URL(req.url()).pathname.slice(1).split(',').includes(procedure);
}

function batchedInput<T>(req: import('@playwright/test').Request, procedure: string): T | undefined {
	const procedures = new URL(req.url()).pathname.slice(1).split(',');
	const index = procedures.indexOf(procedure);
	if (index === -1) {
		return undefined;
	}
	const body = JSON.parse(req.postData() ?? '{}') as Record<string, T>;
	return body[String(index)];
}

// ─── Displaying current tags ──────────────────────────────────────────────────

test('the details dialog shows the bookmark\'s current tags as chips', async ({ page }) => {
	await setupMockApi(page, { bookmarks: [BOOKMARKS.oracleOfMysts] });
	await page.goto('/');
	await openDetails(page, 'Oracle of the Mysts');

	await expect(tagChips(page)).toHaveCount(BOOKMARKS.oracleOfMysts.tags.length);
	await expect(tagChips(page).filter({ hasText: 'search' })).toBeVisible();
	await expect(tagChips(page).filter({ hasText: 'divination' })).toBeVisible();
});

test('a bookmark with no tags shows no chips', async ({ page }) => {
	await setupMockApi(page, { bookmarks: [BOOKMARKS.scrollsOfArcana] });
	await page.goto('/');
	await openDetails(page, 'Scrolls of Arcana');

	await expect(tagChips(page)).toHaveCount(0);
});

// ─── Adding a tag ─────────────────────────────────────────────────────────────

test('adding a tag is deferred until "Confirm Edit" is clicked', async ({ page }) => {
	await setupMockApi(page, { bookmarks: [BOOKMARKS.scrollsOfArcana] });
	await page.goto('/');
	await openDetails(page, 'Scrolls of Arcana');

	let editRequestSent = false;
	page.on('request', req => {
		if (batchContains(req, 'editBookmark')) {
			editRequestSent = true;
		}
	});

	await tagsInput(page).fill('wisdom');
	await tagsInput(page).press('Enter');

	// The chip appears locally, but nothing is persisted yet.
	await expect(tagChips(page).filter({ hasText: 'wisdom' })).toBeVisible();
	await expect(confirmEditButton(page)).toBeVisible();
	expect(editRequestSent).toBe(false);
});

test('confirming after adding a tag sends the updated tags in editBookmark', async ({ page }) => {
	await setupMockApi(page, { bookmarks: [BOOKMARKS.scrollsOfArcana] });
	await page.goto('/');
	await openDetails(page, 'Scrolls of Arcana');

	await tagsInput(page).fill('wisdom');
	await tagsInput(page).press('Enter');

	const editRequest = page.waitForRequest(req => batchContains(req, 'editBookmark'));
	await confirmEditButton(page).click();

	const req = await editRequest;
	const input = batchedInput<{ id: string; updateBookmark: { tags: Array<string> } }>(req, 'editBookmark');
	expect(input?.id).toBe(BOOKMARKS.scrollsOfArcana.id);
	expect(input?.updateBookmark.tags).toContain('wisdom');
	await expect(page.locator('dialog#bookmark_details_dialog')).not.toBeVisible();
});

test('an invalid tag is rejected and no mutation is sent', async ({ page }) => {
	await setupMockApi(page, { bookmarks: [BOOKMARKS.scrollsOfArcana] });
	await page.goto('/');
	await openDetails(page, 'Scrolls of Arcana');

	let editRequestSent = false;
	page.on('request', req => {
		if (batchContains(req, 'editBookmark')) {
			editRequestSent = true;
		}
	});

	// Spaces are not allowed by tagSchema (/^\w+$/), so this should be rejected.
	await tagsInput(page).fill('not valid');
	await tagsInput(page).press('Enter');

	await expect(tagChips(page)).toHaveCount(0);
	// The rejected tag must not mark the dialog as edited.
	await expect(confirmEditButton(page)).toHaveCount(0);
	expect(editRequestSent).toBe(false);
});

// ─── Removing a tag ───────────────────────────────────────────────────────────

test('removing a tag is deferred until "Confirm Edit" is clicked', async ({ page }) => {
	await setupMockApi(page, { bookmarks: [BOOKMARKS.oracleOfMysts] });
	await page.goto('/');
	await openDetails(page, 'Oracle of the Mysts');

	let editRequestSent = false;
	page.on('request', req => {
		if (batchContains(req, 'editBookmark')) {
			editRequestSent = true;
		}
	});

	await tagChips(page)
		.filter({ hasText: 'search' })
		.locator('.svelte-tags-input-tag-remove')
		.click();

	// The chip disappears locally, but nothing is persisted yet.
	await expect(tagChips(page).filter({ hasText: 'search' })).toHaveCount(0);
	await expect(confirmEditButton(page)).toBeVisible();
	expect(editRequestSent).toBe(false);
});

test('confirming after removing a tag sends the updated tags in editBookmark', async ({ page }) => {
	await setupMockApi(page, { bookmarks: [BOOKMARKS.oracleOfMysts] });
	await page.goto('/');
	await openDetails(page, 'Oracle of the Mysts');

	await tagChips(page)
		.filter({ hasText: 'search' })
		.locator('.svelte-tags-input-tag-remove')
		.click();

	const editRequest = page.waitForRequest(req => batchContains(req, 'editBookmark'));
	await confirmEditButton(page).click();

	const req = await editRequest;
	const input = batchedInput<{ id: string; updateBookmark: { tags: Array<string> } }>(req, 'editBookmark');
	expect(input?.id).toBe(BOOKMARKS.oracleOfMysts.id);
	expect(input?.updateBookmark.tags).not.toContain('search');
	expect(input?.updateBookmark.tags).toContain('divination');
	await expect(page.locator('dialog#bookmark_details_dialog')).not.toBeVisible();
});

// ─── Autocomplete ─────────────────────────────────────────────────────────────

test('autocomplete suggests tags from other bookmarks', async ({ page }) => {
	await setupMockApi(page, {
		bookmarks: [BOOKMARKS.scrollsOfArcana, BOOKMARKS.oracleOfMysts, BOOKMARKS.grimoireOfLore],
	});
	await page.goto('/');
	await openDetails(page, 'Scrolls of Arcana');

	await tagsInput(page).pressSequentially('div');

	const matches = page.locator('dialog#bookmark_details_dialog .svelte-tags-input-matchs li');
	await expect(matches.filter({ hasText: 'divination' })).toBeVisible();
});
