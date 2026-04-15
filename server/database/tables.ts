import type { BookmarkFromDB, Category, VersusVote } from 'bookmarksapp-schemas/schemas';
import { chain, cloneDeep, endsWith, fromPairs, isEmpty, isEqual, isNil, keys, replace } from 'lodash-es';
import { LowSync } from 'lowdb';
import { JSONFileSync } from 'lowdb/node';
import fs from 'node:fs';
import { BehaviorSubject, type Observable } from 'rxjs';

const tablesPath = 'database/tables';

const MAX_UNDO_STACK = 50;

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
	/** Emits whether there is anything on the undo stack for this table. */
	canUndo$: Observable<boolean>;
	/**
	 * Apply a synchronous mutation to bookmarks/votes, write the JSON file,
	 * then broadcast the updated arrays to any active subscribers.
	 * Pass `undoable = false` to skip pushing to the undo stack (e.g. visitBookmark).
	 */
	mutate: (fn: (data: MutableData) => void, undoable?: boolean) => void;
	/** Revert the most recent undoable mutation, if any. */
	undo: () => void;
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

	const undoStack: Array<MutableData> = [];
	const canUndoSubject = new BehaviorSubject<boolean>(false);

	const mutate = (fn: (data: MutableData) => void, undoable = true): void => {
		if (undoable) {
			const snapshot = cloneDeep<MutableData>({ bookmarks: db.data.bookmarks, votes: db.data.votes });
			undoStack.push(snapshot);
			if (undoStack.length > MAX_UNDO_STACK) {
				undoStack.shift();
			}
			canUndoSubject.next(true);
		}
		fn(db.data);
		db.write();
		bookmarksSubject.next(db.data.bookmarks);
		votesSubject.next(db.data.votes);
	};

	const undo = (): void => {
		const snapshot = undoStack.pop();

		if (isNil(snapshot)) {
			return;
		}

		db.data.bookmarks = snapshot.bookmarks;
		db.data.votes = snapshot.votes;
		db.write();
		bookmarksSubject.next(snapshot.bookmarks);
		votesSubject.next(snapshot.votes);
		canUndoSubject.next(undoStack.length > 0);
	};

	return {
		emoji: db.data.emoji,
		categories: db.data.categories,
		bookmarks$: bookmarksSubject.asObservable(),
		votes$: votesSubject.asObservable(),
		canUndo$: canUndoSubject.asObservable(),
		mutate,
		undo,
	};
}
