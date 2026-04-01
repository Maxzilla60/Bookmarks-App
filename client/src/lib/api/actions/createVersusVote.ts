import type { Bookmark } from 'bookmarksapp-schemas/schemas';
import { StarIcon } from 'lucide-svelte';
import { client } from '../client';
import { createAction } from '../createAction';
import { fromCurrentTable } from '../data/currentTable$';

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
