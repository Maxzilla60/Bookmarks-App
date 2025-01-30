import type { Bookmark, TitleAndUrl } from 'bookmarksapp-schemas/schemas';
import { titleAndUrlSchema } from 'bookmarksapp-schemas/schemas';
import { validate } from '../../util/validate';
import { client } from '../client';
import { createBookmarkAction } from '../createAction';
import { fromCurrentTable } from '../data/currentTable$';

const { update, updates$ } = createBookmarkAction<Pick<Bookmark, 'id' | 'title' | 'url'>>(
	params => fromCurrentTable(table =>
		client.editBookmark.mutate({
			table,
			id: params.id,
			titleAndUrl: params,
		}),
	),
);

export const editBookmark$ = updates$;

export function editBookmark(id: string, titleAndUrl: TitleAndUrl): void {
	const success = validate(titleAndUrlSchema, titleAndUrl, 'editBookmark');
	if (!success) {
		return;
	}

	update({
		id,
		...titleAndUrl,
	});
}
