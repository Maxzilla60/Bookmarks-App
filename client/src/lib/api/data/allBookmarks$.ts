import { client } from '@api/client';
import { fromSubscription } from '@api/fromSubscription';
import { validate } from '@util/validate';
import type { Bookmark, BookmarkFromDB, VersusVote } from 'bookmarksapp-schemas/schemas';
import { bookmarkSchema } from 'bookmarksapp-schemas/schemas';
import { chain, isEqual, isNil } from 'lodash';
import { catchError, combineLatest, distinctUntilChanged, map, type Observable, of, shareReplay, startWith, switchMap, tap } from 'rxjs';
import { currentTable$ } from './currentTable$';

type BookmarksAndVotesFromDB = {
	bookmarks: Array<BookmarkFromDB>,
	votes: Array<VersusVote>
};

const bookmarksAndVotes$: Observable<BookmarksAndVotesFromDB> =
	currentTable$.pipe(
		switchMap(table => {
			if (isNil(table)) {
				return of({
					bookmarks: [],
					votes: [],
				});
			}

			return combineLatest({
				bookmarks: fromSubscription<Array<BookmarkFromDB>>(callbacks =>
					client.watchBookmarks.subscribe({ table }, callbacks),
				),
				votes: fromSubscription<Array<VersusVote>>(callbacks =>
					client.watchVotes.subscribe({ table }, callbacks),
				),
			});
		}),
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
		.flatMap(({ tags }) => tags)
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
