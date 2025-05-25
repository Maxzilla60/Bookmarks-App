import type { Bookmark, BookmarkFromDB } from 'bookmarksapp-schemas/schemas';
import { TagIcon } from 'lucide-svelte';
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
	{
		loadingMessage: ({ bookmark, tagToRemove }) => `Removing tag "${tagToRemove}" from "${bookmark.title}"...`,
		successMessage: () => 'Tag removed!',
		successIcon: TagIcon,
	},
);

export const removeTagFromBookmark$: Observable<Array<BookmarkFromDB>> = updates$;

export function removeTagFromBookmark(bookmark: Bookmark, tagToRemove: string) {
	update({
		tagToRemove,
		bookmark,
	});
}
