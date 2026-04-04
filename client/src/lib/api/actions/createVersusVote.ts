import { client } from '@api/client';
import { createAction } from '@api/createAction';
import { fromCurrentTable } from '@api/data/currentTable$';
import type { Bookmark } from 'bookmarksapp-schemas/schemas';
import { StarIcon } from 'lucide-svelte';

type CreateVersusVoteAction = {
	winningBookmark: Bookmark,
	losingBookmark: Bookmark
};

const update = createAction<CreateVersusVoteAction>(
	({ winningBookmark, losingBookmark }) => fromCurrentTable(table =>
		client.createVote.mutate({
			table,
			winningId: winningBookmark.id,
			losingId: losingBookmark.id,
		}),
	),
	{
		loadingMessage: ({ winningBookmark }) => `Voting for "${winningBookmark.title}"...`,
		successMessage: ({ winningBookmark }) => `Voted for "${winningBookmark.title}"!`,
		successIcon: StarIcon,
	},
);

export function createVersusVote(winningBookmark: Bookmark, losingBookmark: Bookmark): void {
	update({
		winningBookmark,
		losingBookmark,
	});
}
