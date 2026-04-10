import { client } from '@api/client';
import { showError } from '@components/error/errors$';
import type { BookmarkTable } from 'bookmarksapp-schemas/schemas';
import { first, isNil } from 'lodash';
import { BehaviorSubject, filter, type Observable, shareReplay, switchMap, take, tap } from 'rxjs';

const LC_KEY = 'currentTable';

export const tables: Array<BookmarkTable> = await client.getTables.query();
const tableNames = tables.map(({ name }) => name);
const tablesSubject = new BehaviorSubject<string>(getInitialCurrentTable());

export const currentTable$: Observable<string | undefined> = tablesSubject.asObservable().pipe(
	tap(table => localStorage.setItem(LC_KEY, table)),
	shareReplay({ bufferSize: 1, refCount: true }),
);

export function fromCurrentTable<T>(fn: (table: string) => Promise<T>): Observable<T> {
	return currentTable$.pipe(
		take(1),
		filter(table => !isNil(table)),
		switchMap(fn),
	);
}

export function switchTable(table: string): void {
	if (tableNames.includes(table)) {
		tablesSubject.next(table);
	} else {
		showError(`Table '${table}' not found!`);
	}
}

function getInitialCurrentTable(): string {
	const fromLocalStorage = getCurrentTableFromLocalStorage();
	if (!isNil(fromLocalStorage) && tableNames.includes(fromLocalStorage)) {
		return fromLocalStorage;
	}

	return first(tableNames)!;
}

function getCurrentTableFromLocalStorage(): string | undefined {
	try {
		return localStorage.getItem(LC_KEY) ?? undefined;
	} catch (e) {
		return undefined;
	}
}
