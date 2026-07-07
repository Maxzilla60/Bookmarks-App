import { client } from '@api/client';
import { createAction } from '@api/createAction';
import { fromCurrentTable } from '@api/data/currentTable$';
import { validate } from '@util/validate';
import type { UpdateBookmark } from 'bookmarksapp-schemas/schemas';
import { updateBookmarkSchema } from 'bookmarksapp-schemas/schemas';
import { PencilIcon } from 'lucide-svelte';

const update = createAction<{ id: string } & UpdateBookmark>(
	params => fromCurrentTable(table =>
		client.editBookmark.mutate({
			table,
			id: params.id,
			updateBookmark: params,
		}),
	),
	{
		loadingMessage: (params) => `Editing "${params.title}"...`,
		successMessage: () => 'Bookmark edited!',
		successIcon: PencilIcon,
	},
);

export function editBookmark(id: string, updateBookmark: UpdateBookmark): void {
	const success = validate(updateBookmarkSchema, updateBookmark, 'editBookmark');
	if (!success) {
		return;
	}

	update({
		id,
		...updateBookmark,
	});
}
