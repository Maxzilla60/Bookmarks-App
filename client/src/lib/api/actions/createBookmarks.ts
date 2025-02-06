import type { BookmarkFromDB, TitleAndUrl } from 'bookmarksapp-schemas/schemas';
import { titleAndUrlSchema } from 'bookmarksapp-schemas/schemas';
import type { Observable } from 'rxjs';
import { validate } from '../../util/validate';
import { client } from '../client';
import { createBookmarkAction } from '../createAction';
import { fromCurrentTable } from '../data/currentTable$';

const { update, updates$ } = createBookmarkAction<Array<TitleAndUrl>>(
	newBookmarks => fromCurrentTable(table =>
		client.createBookmarks.mutate({
			table,
			newBookmarks,
		}),
	),
);

export const createBookmarks$: Observable<Array<BookmarkFromDB>> = updates$;

export function createBookmarks(titleAndUrls: Array<TitleAndUrl>): void {
	const success = validate(titleAndUrlSchema.array(), titleAndUrls, 'createBookmarks');
	if (!success) {
		return;
	}

	update(titleAndUrls);
}

