import type { Bookmark, BookmarkFromDB, VersusVote } from 'bookmarksapp-schemas/schemas';
import { StarIcon } from 'lucide-svelte';
import type { Observable } from 'rxjs';
import { client } from '../client';
import { createAction } from '../createAction';
import { fromCurrentTable } from '../data/currentTable$';

type CreateVersusVoteAction = {
	winningBookmark: Bookmark,
	losingBookmark: Bookmark
};

type BookmarksAndVotes = {
	bookmarks: Array<BookmarkFromDB>,
	votes: Array<VersusVote>
};

const { update, updates$ } = createAction<CreateVersusVoteAction, BookmarksAndVotes>(
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

export const createVersusVote$: Observable<BookmarksAndVotes> = updates$;

export function createVersusVote(winningBookmark: Bookmark, losingBookmark: Bookmark): void {
	update({
		winningBookmark,
		losingBookmark,
	});
}
