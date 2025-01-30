import type { Bookmark, BookmarkFromDB } from 'bookmarksapp-schemas/schemas';
import { bookmarkSchema } from 'bookmarksapp-schemas/schemas';
import { chain, isEqual } from 'lodash';
import { catchError, combineLatest, distinctUntilChanged, map, merge, Observable, of, shareReplay, startWith, switchMap, tap } from 'rxjs';
import { validate } from '../../util/validate';
import { createBookmarks$ } from '../actions/createBookmarks';
import { createVersusVote$ } from '../actions/createVersusVote';
import { deleteBookmark$ } from '../actions/deleteBookmark';
import { editBookmark$ } from '../actions/editBookmark';
import { removeTagFromBookmark$ } from '../actions/removeTagFromBookmark';
import { tagBookmarks$ } from '../actions/tagBookmarks';
import { visitBookmark$ } from '../actions/visitBookmark';
import { client } from '../client';
import { currentTable$ } from './currentTable$';

interface VersusVote {
	id: string,
	winner: string,
	loser: string,
}

type BookmarksAndVotesFromDB = Observable<{
	bookmarks: Array<BookmarkFromDB>,
	votes: Array<VersusVote>
}>;

const bookmarksAndVotes$: BookmarksAndVotesFromDB = currentTable$.pipe(
	switchMap(table => combineLatest({
		bookmarks: merge(
			client.getBookmarks.query({ table }),
			createBookmarks$,
			editBookmark$,
			visitBookmark$,
			tagBookmarks$,
			deleteBookmark$,
			removeTagFromBookmark$,
		),
		votes: merge(
			client.getVotes.query({ table }),
			createVersusVote$,
		),
	})),
);

export const allBookmarks$: Observable<Array<Bookmark>> = bookmarksAndVotes$.pipe(
	map(({ bookmarks, votes }) => bookmarks.map(b => appendVersusToBookmark(b, votes))),
	tap(validateBookmarksFromDB),
	catchError(() => of([])),
	startWith([]),
	shareReplay({ bufferSize: 1, refCount: true }),
);

export const allTags$: Observable<Array<string>> = allBookmarks$.pipe(
	map(bookmarks => chain(bookmarks)
		.flatMap(b => b.tags)
		.uniq()
		.sortBy()
		.value(),
	),
	distinctUntilChanged(isEqual),
	shareReplay({ bufferSize: 1, refCount: true }),
);

function validateBookmarksFromDB(bookmarks: Array<Bookmark>): void {
	const isValid = validate(bookmarkSchema.array(), bookmarks, 'allBookmarks$');
	if (!isValid) {
		throw new Error('Error loading bookmarks! See console.');
	}
}

function appendVersusToBookmark(bookmark: BookmarkFromDB, votes: Array<VersusVote>): Bookmark {
	return {
		...bookmark,
		versus: {
			compared: votes.filter(({ winner, loser }) => winner === bookmark.id || loser === bookmark.id).length ?? 0,
			voted: votes.filter(({ winner }) => winner === bookmark.id).length ?? 0,
		},
	};
}
