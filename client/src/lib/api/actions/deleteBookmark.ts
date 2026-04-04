import { client } from '@api/client';
import { createAction } from '@api/createAction';
import { fromCurrentTable } from '@api/data/currentTable$';
import type { Bookmark } from 'bookmarksapp-schemas/schemas';
import { ToiletIcon } from 'lucide-svelte';

const update = createAction<Bookmark>(
	bookmark => fromCurrentTable(table =>
		client.deleteBookmark.mutate({
			table,
			id: bookmark.id,
		}),
	),
	{
		loadingMessage: (bookmark) => `Deleting "${bookmark.title}"...`,
		successMessage: () => 'Bookmark deleted!',
		successIcon: ToiletIcon,
	},
);

export function deleteBookmark(bookmark: Bookmark): void {
	update(bookmark);
}
