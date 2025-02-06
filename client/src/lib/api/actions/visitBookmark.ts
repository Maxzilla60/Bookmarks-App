import type { Bookmark, BookmarkFromDB } from 'bookmarksapp-schemas/schemas';
import type { Observable } from 'rxjs';
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

export const visitBookmark$: Observable<Array<BookmarkFromDB>> = updates$;

export function visitBookmark(bookmark: Bookmark) {
	update(bookmark);
}
