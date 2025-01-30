import type { Bookmark } from 'bookmarksapp-schemas/schemas';
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
);

export const deleteBookmark$ = updates$;

export function deleteBookmark(bookmark: Bookmark): void {
	update(bookmark);
}
