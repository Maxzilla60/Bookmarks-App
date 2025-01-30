import { uniq } from 'lodash';
import { map, scan, shareReplay, startWith, Subject, switchMap, tap } from 'rxjs';
import { currentTable$ } from '../../api/data/currentTable$';

type SelectBookmarks = {
	bookmarkIds: Array<string>;
	append: boolean;
}

const LC_KEY = 'selectedBookmarkIds';

const selectedBookmarkIdsSubject = new Subject<SelectBookmarks>();
export const selectedBookmarkIds$ = currentTable$.pipe(switchMap(table =>
	selectedBookmarkIdsSubject.asObservable().pipe(
		scan((acc, value) => {
			if (value.append) {
				return [...acc, ...value.bookmarkIds];
			}
			return value.bookmarkIds;
		}, getSelectedBookmarkIdsFromLocalStorage(table)),
		map(uniq),
		tap(ids => localStorage.setItem(getKey(table), JSON.stringify(ids))),
		startWith(getSelectedBookmarkIdsFromLocalStorage(table)),
		shareReplay({ bufferSize: 1, refCount: true }),
	),
));

export function selectBookmarks(bookmarkIds: Array<string>, append: boolean = false): void {
	selectedBookmarkIdsSubject.next({
		bookmarkIds,
		append,
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
