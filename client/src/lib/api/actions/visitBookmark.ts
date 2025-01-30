import type { Bookmark } from 'bookmarksapp-schemas/schemas';
import { client } from '../client';
import { createBookmarkAction } from '../createAction';
import { fromCurrentTable } from '../data/currentTable$';

const { update, updates$ } = createBookmarkAction<Bookmark>(
	bookmark => fromCurrentTable(table =>
		client.visitBookmark.mutate({
			table,
			id: bookmark.id,
		}),
	),
);

export const visitBookmark$ = updates$;

export function visitBookmark(bookmark: Bookmark) {
	update(bookmark);
}
