import type { Bookmark, BookmarkFromDB } from 'bookmarksapp-schemas/schemas';
import type { Observable } from 'rxjs';
import { client } from '../client';
import { createBookmarkAction } from '../createAction';
import { fromCurrentTable } from '../data/currentTable$';

const { update, updates$ } = createBookmarkAction<Bookmark>(
	bookmark => fromCurrentTable(table =>
		client.deleteBookmark.mutate({
			table,
			id: bookmark.id,
		}),
	),
	{
		loadingMessage: (bookmark) => `Deleting "${bookmark.title}"...`,
		successMessage: () => 'Bookmark deleted!',
	},
);

export const deleteBookmark$: Observable<Array<BookmarkFromDB>> = updates$;

export function deleteBookmark(bookmark: Bookmark): void {
	update(bookmark);
}
