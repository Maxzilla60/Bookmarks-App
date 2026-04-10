import { expect, test } from '@playwright/test';
import { BOOKMARKS } from './support/fixtures';
import { setupMockApi } from './support/mock-api';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const ADD_BTN_TITLE = 'Add bookmark (Ctrl + B)';

async function openAddDialog(page: import('@playwright/test').Page) {
	await page.locator(`button[title="${ADD_BTN_TITLE}"]`).click();
	await expect(page.locator('dialog#add_bookmark_dialog')).toBeVisible();
}

async function fillAddForm(
	page: import('@playwright/test').Page,
	{ title, url, tags }: { title?: string; url?: string; tags?: string },
) {
	if (title !== undefined) {
		await page.locator('input#add_title').fill(title);
	}
	if (url !== undefined) {
		await page.locator('input#add_url').fill(url);
	}
	if (tags !== undefined) {
		await page.locator('input#add_tags').fill(tags);
	}
}

// ─── Opening the dialog ───────────────────────────────────────────────────────

test('add bookmark button opens the dialog', async ({ page }) => {
	await setupMockApi(page);
	await page.goto('/');
	await openAddDialog(page);
});

// ─── Validation ───────────────────────────────────────────────────────────────

test('Add Bookmark button is disabled when the form is empty', async ({ page }) => {
	await setupMockApi(page);
	await page.goto('/');
	await openAddDialog(page);

	await expect(page.locator('dialog#add_bookmark_dialog button')).toBeDisabled();
});

test('Add Bookmark button is disabled when the title is empty', async ({ page }) => {
	await setupMockApi(page);
	await page.goto('/');
	await openAddDialog(page);

	await fillAddForm(page, { title: '', url: 'https://example.com' });
	await expect(page.locator('dialog#add_bookmark_dialog button')).toBeDisabled();
});

test('Add Bookmark button is disabled when the URL is empty', async ({ page }) => {
	await setupMockApi(page);
	await page.goto('/');
	await openAddDialog(page);

	await fillAddForm(page, { title: 'My Site', url: '' });
	await expect(page.locator('dialog#add_bookmark_dialog button')).toBeDisabled();
});

test('Add Bookmark button is disabled when the URL is not a valid URL', async ({ page }) => {
	await setupMockApi(page);
	await page.goto('/');
	await openAddDialog(page);

	await fillAddForm(page, { title: 'My Site', url: 'not-a-url' });
	await expect(page.locator('dialog#add_bookmark_dialog button')).toBeDisabled();
});

test('Add Bookmark button is disabled when a tag contains invalid characters', async ({ page }) => {
	await setupMockApi(page);
	await page.goto('/');
	await openAddDialog(page);

	await fillAddForm(page, { title: 'My Site', url: 'https://example.com', tags: 'valid, invalid tag!' });
	await expect(page.locator('dialog#add_bookmark_dialog button')).toBeDisabled();
});

test('Add Bookmark button is enabled with a valid title and URL', async ({ page }) => {
	await setupMockApi(page);
	await page.goto('/');
	await openAddDialog(page);

	await fillAddForm(page, { title: 'My Site', url: 'https://example.com' });
	await expect(page.locator('dialog#add_bookmark_dialog button')).toBeEnabled();
});

test('Add Bookmark button is enabled with a valid title, URL, and tags', async ({ page }) => {
	await setupMockApi(page);
	await page.goto('/');
	await openAddDialog(page);

	await fillAddForm(page, { title: 'My Site', url: 'https://example.com', tags: 'news, tech' });
	await expect(page.locator('dialog#add_bookmark_dialog button')).toBeEnabled();
});

// ─── Tag preview ──────────────────────────────────────────────────────────────

test('valid tags show a live chip preview', async ({ page }) => {
	await setupMockApi(page);
	await page.goto('/');
	await openAddDialog(page);

	await fillAddForm(page, { title: 'My Site', url: 'https://example.com', tags: 'news, tech' });

	const tagPreview = page.locator('dialog#add_bookmark_dialog .tag-preview');
	await expect(tagPreview).toBeVisible();
	await expect(tagPreview).toContainText('news');
	await expect(tagPreview).toContainText('tech');
});

test('invalid tags are not shown in the preview', async ({ page }) => {
	await setupMockApi(page);
	await page.goto('/');
	await openAddDialog(page);

	await fillAddForm(page, { title: 'My Site', url: 'https://example.com', tags: 'valid, bad tag!' });

	// "valid" is a valid tag but "bad tag!" is not — only valid ones are previewed
	const tagPreview = page.locator('dialog#add_bookmark_dialog .tag-preview');
	await expect(tagPreview).toBeVisible();
	await expect(tagPreview).toContainText('valid');
	await expect(tagPreview).not.toContainText('bad tag!');
});

test('no tag preview is shown when the tags field is empty', async ({ page }) => {
	await setupMockApi(page);
	await page.goto('/');
	await openAddDialog(page);

	await fillAddForm(page, { title: 'My Site', url: 'https://example.com' });

	await expect(page.locator('dialog#add_bookmark_dialog .tag-preview')).not.toBeVisible();
});

// ─── Adding a bookmark ────────────────────────────────────────────────────────

test('clicking Add Bookmark sends the createBookmarks mutation', async ({ page }) => {
	await setupMockApi(page, { bookmarks: [] });
	await page.goto('/');
	await openAddDialog(page);

	await fillAddForm(page, { title: 'Example', url: 'https://example.com' });
	await expect(page.locator('dialog#add_bookmark_dialog button')).toBeEnabled();

	const createRequest = page.waitForRequest(
		req => req.method() === 'POST' && req.url().includes('/createBookmarks'),
	);

	await page.locator('dialog#add_bookmark_dialog button').click();
	await expect(page.locator('dialog#add_bookmark_dialog')).not.toBeVisible();

	const req = await createRequest;
	const body = JSON.parse(req.postData() ?? '{}') as Record<string, {
		newBookmarks: Array<{ title: string; url: string; tags?: Array<string> }>;
	}>;
	expect(body['0']?.newBookmarks).toHaveLength(1);
	expect(body['0']?.newBookmarks[0]?.title).toBe('Example');
	expect(body['0']?.newBookmarks[0]?.url).toBe('https://example.com');
});

test('clicking Add Bookmark sends tags with the mutation', async ({ page }) => {
	await setupMockApi(page, { bookmarks: [] });
	await page.goto('/');
	await openAddDialog(page);

	await fillAddForm(page, { title: 'Tagged Site', url: 'https://tagged.com', tags: 'news, tech' });

	const createRequest = page.waitForRequest(
		req => req.method() === 'POST' && req.url().includes('/createBookmarks'),
	);

	await page.locator('dialog#add_bookmark_dialog button').click();

	const req = await createRequest;
	const body = JSON.parse(req.postData() ?? '{}') as Record<string, {
		newBookmarks: Array<{ title: string; url: string; tags?: Array<string> }>;
	}>;
	expect(body['0']?.newBookmarks[0]?.tags).toEqual(['news', 'tech']);
});

test('dialog closes after successfully adding a bookmark', async ({ page }) => {
	await setupMockApi(page, { bookmarks: [] });
	await page.goto('/');
	await openAddDialog(page);

	await fillAddForm(page, { title: 'Example', url: 'https://example.com' });
	await page.locator('dialog#add_bookmark_dialog button').click();

	await expect(page.locator('dialog#add_bookmark_dialog')).not.toBeVisible();
});

// ─── Duplicate detection ──────────────────────────────────────────────────────

test('adding a URL that already exists shows an error dialog', async ({ page }) => {
	await setupMockApi(page, { bookmarks: [BOOKMARKS.scrollsOfArcana] });
	await page.goto('/');
	await openAddDialog(page);

	await fillAddForm(page, { title: 'Scrolls Again', url: BOOKMARKS.scrollsOfArcana.url });
	await page.locator('dialog#add_bookmark_dialog button').click();

	await expect(page.locator('dialog#error_dialog')).toBeVisible();
	await expect(page.locator('dialog#error_dialog')).toContainText(BOOKMARKS.scrollsOfArcana.url);
});

test('no createBookmarks request is sent when the URL is a duplicate', async ({ page }) => {
	await setupMockApi(page, { bookmarks: [BOOKMARKS.scrollsOfArcana] });
	await page.goto('/');
	await openAddDialog(page);

	await fillAddForm(page, { title: 'Scrolls Again', url: BOOKMARKS.scrollsOfArcana.url });

	let mutationFired = false;
	page.on('request', req => {
		if (req.method() === 'POST' && req.url().includes('/createBookmarks')) {
			mutationFired = true;
		}
	});

	await page.locator('dialog#add_bookmark_dialog button').click();
	await expect(page.locator('dialog#error_dialog')).toBeVisible();
	expect(mutationFired).toBe(false);
});

// ─── Form reset ───────────────────────────────────────────────────────────────

test('form fields are cleared when the dialog is reopened', async ({ page }) => {
	await setupMockApi(page, { bookmarks: [] });
	await page.goto('/');

	// Open, fill in, then close via a successful submission
	await openAddDialog(page);
	await fillAddForm(page, { title: 'First', url: 'https://first.com' });
	await page.locator('dialog#add_bookmark_dialog button').click();
	await expect(page.locator('dialog#add_bookmark_dialog')).not.toBeVisible();

	// Reopen
	await openAddDialog(page);
	await expect(page.locator('input#add_title')).toHaveValue('');
	await expect(page.locator('input#add_url')).toHaveValue('');
	await expect(page.locator('input#add_tags')).toHaveValue('');
});

