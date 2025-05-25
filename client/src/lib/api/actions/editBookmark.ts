import type { Bookmark, BookmarkFromDB, TitleAndUrl } from 'bookmarksapp-schemas/schemas';
import { titleAndUrlSchema } from 'bookmarksapp-schemas/schemas';
import { PencilIcon } from 'lucide-svelte';
import type { Observable } from 'rxjs';
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
	{
		loadingMessage: (params) => `Editing "${params.title}"...`,
		successMessage: () => 'Bookmark edited!',
		successIcon: PencilIcon,
	},
);

export const editBookmark$: Observable<Array<BookmarkFromDB>> = updates$;

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
