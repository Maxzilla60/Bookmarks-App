import { client } from '@api/client';
import { createAction } from '@api/createAction';
import { fromCurrentTable } from '@api/data/currentTable$';
import { validate } from '@util/validate';
import type { BookmarkInput } from 'bookmarksapp-schemas/schemas';
import { bookmarkInputSchema } from 'bookmarksapp-schemas/schemas';
import { BookmarkCheckIcon } from 'lucide-svelte';

const update = createAction<Array<BookmarkInput>>(
	newBookmarks => fromCurrentTable(table =>
		client.createBookmarks.mutate({
			table,
			newBookmarks,
		}),
	),
	{
		loadingMessage: (newBookmarks) => {
			if (newBookmarks.length === 1) {
				return `Creating bookmark...`;
			}
			return `Creating ${newBookmarks.length} bookmarks...`;
		},
		successMessage: (newBookmarks) => {
			if (newBookmarks.length === 0) {
				return `Created no bookmarks.`;
			}
			if (newBookmarks.length === 1) {
				return `Created bookmark!`;
			}
			return `Created ${newBookmarks.length} bookmarks!`;
		},
		successIcon: BookmarkCheckIcon,
	});

export function createBookmarks(bookmarks: Array<BookmarkInput>): void {
	const success = validate(bookmarkInputSchema.array(), bookmarks, 'createBookmarks');
	if (!success) {
		return;
	}

	update(bookmarks);
}
