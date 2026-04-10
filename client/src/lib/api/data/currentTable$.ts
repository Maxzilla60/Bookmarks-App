import { client } from '@api/client';
import { fromSubscription } from '@api/fromSubscription';
import { showError } from '@components/error/errors$';
import type { BookmarkTable, TablesUpdate } from 'bookmarksapp-schemas/schemas';
import { first, isNil } from 'lodash';
import { BehaviorSubject, filter, firstValueFrom, map, type Observable, shareReplay, switchMap, take, tap } from 'rxjs';
import { toast } from 'svelte-sonner';

const LC_KEY = 'currentTable';

const tablesUpdates$ = fromSubscription<TablesUpdate>(
	callbacks => client.watchTables.subscribe(undefined, callbacks),
).pipe(
	tap(({ removed, added }) => {
		for (const { name, emoji } of removed) {
			toast.info(`${emoji} Table "${name}" removed!`);
		}
		for (const { name, emoji } of added) {
			toast.info(`${emoji} Table "${name}" added!`);
		}
	}),
	shareReplay({ bufferSize: 1, refCount: false }),
);

export const tables$: Observable<Array<BookmarkTable>> = tablesUpdates$.pipe(
	map(({ tables }) => tables),
);

const initialTables = await firstValueFrom(tables$);
const tablesSubject = new BehaviorSubject<string>(getInitialCurrentTable(initialTables));

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
	tables$.pipe(take(1)).subscribe(tables => {
		if (tables.map(t => t.name).includes(table)) {
			tablesSubject.next(table);
		} else {
			showError(`Table '${table}' not found!`);
		}
	});
}

function getInitialCurrentTable(tables: Array<BookmarkTable>): string {
	const tableNames = tables.map(({ name }) => name);
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
