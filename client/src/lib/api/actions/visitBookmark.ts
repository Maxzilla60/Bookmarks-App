import { client } from '@api/client';
import { createAction } from '@api/createAction';
import { fromCurrentTable } from '@api/data/currentTable$';
import type { Bookmark } from 'bookmarksapp-schemas/schemas';

const update = createAction<Bookmark>(
	bookmark => fromCurrentTable(table =>
		client.visitBookmark.mutate({
			table,
			id: bookmark.id,
		}),
	),
);

export function visitBookmark(bookmark: Bookmark) {
	update(bookmark);
}
