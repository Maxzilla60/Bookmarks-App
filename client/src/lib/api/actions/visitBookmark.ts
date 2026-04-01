import type { Bookmark } from 'bookmarksapp-schemas/schemas';
import { client } from '../client';
import { createAction } from '../createAction';
import { fromCurrentTable } from '../data/currentTable$';

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
