import { client } from '@api/client';
import { createAction } from '@api/createAction';
import { fromCurrentTable } from '@api/data/currentTable$';
import { validate } from '@util/validate';
import type { Bookmark, TitleAndUrl } from 'bookmarksapp-schemas/schemas';
import { titleAndUrlSchema } from 'bookmarksapp-schemas/schemas';
import { PencilIcon } from 'lucide-svelte';

const update = createAction<Pick<Bookmark, 'id' | 'title' | 'url'>>(
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
