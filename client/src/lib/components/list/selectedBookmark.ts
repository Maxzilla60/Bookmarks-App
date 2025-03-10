import { uniq } from 'lodash';
import { map, scan, shareReplay, startWith, Subject, switchMap, tap } from 'rxjs';
import { currentTable$ } from '../../api/data/currentTable$';

type SelectBookmarks = {
	bookmarkId: string;
	append: boolean;
	deselect: boolean;
}

const LC_KEY = 'selectedBookmarkIds';

const selectedBookmarkIdsSubject = new Subject<SelectBookmarks>();
export const selectedBookmarkIds$ = currentTable$.pipe(switchMap(table =>
	selectedBookmarkIdsSubject.asObservable().pipe(
		scan((acc, { append, bookmarkId, deselect }) => {
			if (deselect) {
				return acc.filter(id => bookmarkId !== id);
			}
			if (append) {
				return [...acc, bookmarkId];
			}
			return [bookmarkId];
		}, getSelectedBookmarkIdsFromLocalStorage(table)),
		map(uniq),
		tap(ids => localStorage.setItem(getKey(table), JSON.stringify(ids))),
		startWith(getSelectedBookmarkIdsFromLocalStorage(table)),
		shareReplay({ bufferSize: 1, refCount: true }),
	),
));

export function selectBookmark(bookmarkId: string, append = false, deselect = false): void {
	selectedBookmarkIdsSubject.next({
		bookmarkId,
		append,
		deselect,
	});
}

function getSelectedBookmarkIdsFromLocalStorage(table: string): Array<string> {
	const key = getKey(table);
	try {
		return JSON.parse(localStorage.getItem(key)!) ?? [] as Array<string>;
	} catch (e) {
		return [];
	}
}

function getKey(table: string): string {
	return `${LC_KEY}_${table}`;
}
