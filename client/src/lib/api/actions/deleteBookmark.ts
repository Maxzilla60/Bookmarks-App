import type { Bookmark } from 'bookmarksapp-schemas/schemas';
import { ToiletIcon } from 'lucide-svelte';
import { client } from '../client';
import { createAction } from '../createAction';
import { fromCurrentTable } from '../data/currentTable$';

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
