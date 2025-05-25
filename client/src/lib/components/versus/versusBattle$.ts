import type { Bookmark } from 'bookmarksapp-schemas/schemas';
import { map, type Observable, shareReplay, startWith, Subject, switchMap, withLatestFrom } from 'rxjs';
import { allBookmarks$ } from '../../api/data/allBookmarks$';
import { currentTable$ } from '../../api/data/currentTable$';
import { randomChoice } from '../../util/util';

export type VersusBattle = {
	leftCorner?: Bookmark,
	rightCorner?: Bookmark,
};

type VersusBattleIds = {
	leftCorner: Bookmark['id'],
	rightCorner: Bookmark['id'],
};

const initNewVersusBattleSubject = new Subject<void>();
export const versusBattle$: Observable<VersusBattle> = currentTable$.pipe(
	switchMap(() => initNewVersusBattleSubject.asObservable().pipe(
		withLatestFrom(allBookmarks$),
		map(([, bookmarks]) => bookmarks),
		map(createVersusIds),
		switchMap(ids => allBookmarks$.pipe(
			map(bookmarks => ({
				leftCorner: bookmarks.find(b => b.id === ids.leftCorner),
				rightCorner: bookmarks.find(b => b.id === ids.rightCorner),
			})),
		)),
			startWith({} as VersusBattle),
		),
	),
	shareReplay({ bufferSize: 1, refCount: true }),
);

export function newVersusBattle(): void {
	initNewVersusBattleSubject.next();
}

function createVersusIds(bookmarks: Array<Bookmark>): VersusBattleIds {
	const leftCorner = randomChoice(bookmarks).id;
	const rightCorner = randomChoice(bookmarks).id;

	if (leftCorner === rightCorner) {
		return createVersusIds(bookmarks);
	}

	return {
		leftCorner,
		rightCorner,
	};
}
