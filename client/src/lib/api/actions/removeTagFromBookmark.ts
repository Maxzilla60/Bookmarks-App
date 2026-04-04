import { client } from '@api/client';
import { createAction } from '@api/createAction';
import { fromCurrentTable } from '@api/data/currentTable$';
import type { Bookmark } from 'bookmarksapp-schemas/schemas';
import { TagIcon } from 'lucide-svelte';

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
