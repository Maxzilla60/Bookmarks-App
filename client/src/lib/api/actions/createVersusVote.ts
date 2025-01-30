import type { Bookmark } from 'bookmarksapp-schemas/schemas';
import { switchMap } from 'rxjs';
import { client } from '../client';
import { createVoteAction } from '../createAction';
import { fromCurrentTable } from '../data/currentTable$';

type CreateVersusVoteAction = {
	winningBookmark: Bookmark,
	losingBookmark: Bookmark
};

const { update, updates$ } = createVoteAction<CreateVersusVoteAction>(({ winningBookmark, losingBookmark }) => {
	const newVote$ = fromCurrentTable(table =>
		client.createVote.mutate({
			table,
			winningId: winningBookmark.id,
			losingId: losingBookmark.id,
		}),
	);

	if (winningBookmark.position > losingBookmark.position) {
		return newVote$;
	}

	const positionUpdate$ = fromCurrentTable(table =>
		client.updateBookmarkPosition.mutate({
			table,
			id: winningBookmark.id,
			newPosition: losingBookmark.position + 1,
		}),
	);

	return positionUpdate$.pipe(
		switchMap(() => newVote$),
	);
});

export const createVersusVote$ = updates$;

export function createVersusVote(winningBookmark: Bookmark, losingBookmark: Bookmark): void {
	update({
		winningBookmark,
		losingBookmark,
	});
}
