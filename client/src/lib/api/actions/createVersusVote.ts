import type { Bookmark, VersusVote } from 'bookmarksapp-schemas/schemas';
import { type Observable, switchMap } from 'rxjs';
import { client } from '../client';
import { createVoteAction } from '../createAction';
import { fromCurrentTable } from '../data/currentTable$';

type CreateVersusVoteAction = {
	winningBookmark: Bookmark,
	losingBookmark: Bookmark
};

const { update, updates$ } = createVoteAction<CreateVersusVoteAction>(({ winningBookmark, losingBookmark }): Observable<Array<VersusVote>> => {
	const newVote$ = fromCurrentTable(table =>
		client.createVote.mutate({
			table,
			winningId: winningBookmark.id,
			losingId: losingBookmark.id,
		}),
	);

	// TODO: Move this logic to BE
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

export const createVersusVote$: Observable<Array<VersusVote>> = updates$;

export function createVersusVote(winningBookmark: Bookmark, losingBookmark: Bookmark): void {
	update({
		winningBookmark,
		losingBookmark,
	});
}
