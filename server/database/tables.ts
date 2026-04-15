import type { BookmarkFromDB, Category, VersusVote } from 'bookmarksapp-schemas/schemas';
import { chain, endsWith, fromPairs, isEmpty, isEqual, keys, replace } from 'lodash-es';
import { LowSync } from 'lowdb';
import { JSONFileSync } from 'lowdb/node';
import fs from 'node:fs';
import { BehaviorSubject, type Observable } from 'rxjs';

const tablesPath = 'database/tables';

type TableData = {
	emoji: string;
	bookmarks: Array<BookmarkFromDB>;
	votes: Array<VersusVote>;
	categories: Array<Category>;
};

/** The two arrays that mutations are allowed to modify. */
type MutableData = Pick<TableData, 'bookmarks' | 'votes'>;

export type TableEntry = {
	/** Display emoji loaded from JSON. */
	emoji: string;
	/** Read-only categories loaded from JSON. */
	categories: Array<Category>;
	/** Live Observable of all bookmarks — replays the current value on subscription. */
	bookmarks$: Observable<Array<BookmarkFromDB>>;
	/** Live Observable of all votes — replays the current value on subscription. */
	votes$: Observable<Array<VersusVote>>;
	/**
	 * Apply a synchronous mutation to bookmarks/votes, write the JSON file,
	 * then broadcast the updated arrays to any active subscribers.
	 */
	mutate: (fn: (data: MutableData) => void) => void;
};

const tablesSubject = new BehaviorSubject<Record<string, TableEntry>>(getInitialTables());
watchTables();

export const tables$: Observable<Record<string, TableEntry>> = tablesSubject.asObservable();

export function getTables(): Record<string, TableEntry> {
	return tablesSubject.value;
}

function getInitialTables(): Record<string, TableEntry> {
	const tables: Array<[string, TableEntry]> = [];

	for (const fileName of fs.readdirSync(tablesPath)) {
		if (endsWith(fileName, '.json')) {
			const tableName = replace(fileName, '.json', '');
			tables.push([tableName, openTableEntry(tableName)]);
		}
	}

	if (isEmpty(tables)) {
		throw new Error('No tables found');
	}

	return fromPairs(tables);
}

function watchTables(): void {
	fs.watch(tablesPath, (eventType, filename) => {
		if (eventType !== 'rename' || !filename || !endsWith(filename, '.json')) {
			return;
		}

		const tables: Record<string, TableEntry> = chain(fs.readdirSync(tablesPath))
			.filter(f => endsWith(f, '.json'))
			.map(f => replace(f, '.json', ''))
			.map(tableName => [tableName, openTableEntry(tableName)])
			.fromPairs()
			.value();
		if (!isEqual(keys(tables), keys(tablesSubject.value))) {
			tablesSubject.next(tables);
		}
	});
}

function openTableEntry(tableName: string): TableEntry {
	const db = new LowSync<TableData>(new JSONFileSync<TableData>(`${tablesPath}/${tableName}.json`), {
		emoji: '🔖',
		bookmarks: [],
		votes: [],
		categories: [],
	});
	db.read();

	const bookmarksSubject = new BehaviorSubject<Array<BookmarkFromDB>>(db.data.bookmarks);
	const votesSubject = new BehaviorSubject<Array<VersusVote>>(db.data.votes);

	const mutate = (fn: (data: MutableData) => void): void => {
		fn(db.data);
		db.write();
		// Emit shallow copies so subscribers always see a new reference.
		bookmarksSubject.next([...db.data.bookmarks]);
		votesSubject.next([...db.data.votes]);
	};

	return {
		emoji: db.data.emoji,
		categories: db.data.categories,
		bookmarks$: bookmarksSubject.asObservable(),
		votes$: votesSubject.asObservable(),
		mutate,
	};
}
