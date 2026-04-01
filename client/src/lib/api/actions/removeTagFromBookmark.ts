import type { Bookmark } from 'bookmarksapp-schemas/schemas';
import { TagIcon } from 'lucide-svelte';
import { client } from '../client';
import { createAction } from '../createAction';
import { fromCurrentTable } from '../data/currentTable$';

type RemoveTagFromBookmarkAction = {
	tagToRemove: string,
	bookmark: Bookmark
};

const update = createAction<RemoveTagFromBookmarkAction>(
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

export function removeTagFromBookmark(bookmark: Bookmark, tagToRemove: string) {
	update({
		tagToRemove,
		bookmark,
	});
}
