import { type Bookmark, tagSchema } from 'bookmarksapp-schemas/schemas';
import { validate } from '../../util/validate';
import { client } from '../client';
import { createBookmarkAction } from '../createAction';
import { fromCurrentTable } from '../data/currentTable$';

type TagBookmarkAction = {
	bookmarks: Array<Bookmark>,
	tag: string
};

const { update, updates$ } = createBookmarkAction<TagBookmarkAction>(
	({ bookmarks, tag }) => fromCurrentTable(table =>
		client.tagBookmarks.mutate({
			table,
			ids: bookmarks.map(({ id }) => id),
			tag,
		}),
	),
);

export const tagBookmarks$ = updates$;

export function tagBookmarks(bookmarks: Array<Bookmark>, tag: string): void {
	const success = validate(tagSchema, tag, 'tagBookmarks');
	if (!success) {
		return;
	}

	update({
		bookmarks,
		tag,
	});
}
