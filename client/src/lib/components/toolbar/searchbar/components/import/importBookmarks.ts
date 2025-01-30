import type { Bookmark, TitleAndUrl } from 'bookmarksapp-schemas/schemas';
import { titleAndUrlSchema } from 'bookmarksapp-schemas/schemas';
import { createBookmarks } from '../../../../../api/actions/createBookmarks';
import { validate } from '../../../../../util/validate';
import { showError } from '../../../../error/errors$';

export function importBookmarks(importText: string, allBookmarks: Array<Bookmark>): void {
	if (!importText.length) {
		return;
	}

	// Parse JSON
	let titleAndUrls: Array<TitleAndUrl> = [];
	try {
		titleAndUrls = JSON.parse(importText) as Array<TitleAndUrl>;
	} catch (e) {
		showError('Couldn\'t parse JSON.');
		return;
	}

	// Validate
	const isValid = validate(titleAndUrlSchema.array(), titleAndUrls, 'importBookmarks');
	if (!isValid) {
		return;
	}

	// Check for dupes
	const bookmarkUrls = allBookmarks.map(b => b.url);
	const existingBookmarks = titleAndUrls.filter(t => bookmarkUrls.includes(t.url));
	if (existingBookmarks.length) {
		showError(
			`There are ${existingBookmarks.length} bookmark(s) that already exist and will not be imported:\n
			${existingBookmarks.map(t => `- ${t.url}`).join('\n')}`,
		);
	}

	// Import
	const bookmarksToCreate = titleAndUrls.filter(t => !existingBookmarks.includes(t));
	createBookmarks(bookmarksToCreate);

	// Scroll to bottom
	const listElement = document.getElementById('list')!;
	listElement.scrollTop = listElement.scrollHeight;
}
