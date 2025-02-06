import type { Bookmark, BookmarkFromDB } from 'bookmarksapp-schemas/schemas';
import type { Observable } from 'rxjs';
import { client } from '../client';
import { createBookmarkAction } from '../createAction';
import { fromCurrentTable } from '../data/currentTable$';

type RemoveTagFromBookmarkAction = {
	tagToRemove: string,
	bookmark: Bookmark
};

const { update, updates$ } = createBookmarkAction<RemoveTagFromBookmarkAction>(
	({ bookmark, tagToRemove }) => fromCurrentTable(table =>
		client.removeTagFromBookmark.mutate({
			table,
			id: bookmark.id,
			tag: tagToRemove,
		}),
	),
);

export const removeTagFromBookmark$: Observable<Array<BookmarkFromDB>> = updates$;

export function removeTagFromBookmark(bookmark: Bookmark, tagToRemove: string) {
	update({
		tagToRemove,
		bookmark,
	});
}
