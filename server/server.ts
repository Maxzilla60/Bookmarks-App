import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import { applyWSSHandler } from '@trpc/server/adapters/ws';
import { type } from 'arktype';
import { type BookmarkFromDB, type BookmarkTable, type Category, idSchema, type TablesUpdate, tagSchema, titleAndUrlSchema, type VersusVote } from 'bookmarksapp-schemas/schemas';
import cors from 'cors';
import { entries, keys, uniq } from 'lodash-es';
import { nanoid } from 'nanoid';
import { otag as toAsyncGenerator } from 'observable-to-async-generator';
import { fromEvent, map, NEVER, Observable, pairwise, startWith, takeUntil } from 'rxjs';
import { WebSocketServer } from 'ws';
import { backupTables } from './backup';
import { getTables, type TableEntry, tables$ } from './database/tables';

function toAborted(signal: AbortSignal | undefined): Observable<Event> {
	if (!signal) {
		return NEVER;
	}
	return fromEvent(signal, 'abort', { once: true });
}

const t = initTRPC.create();
export const router = t.router;
export const procedure = t.procedure;

const tablesInputSchema = type({
	table: type.string.narrow((s, ctx) => {
		if (keys(getTables()).includes(s)) {
			return true;
		}
		ctx.error(`Expected one of: ${keys(getTables()).join(', ')}`);
		return false;
	}),
});

function getTable(table: string): TableEntry {
	const entry = getTables()[table];
	if (!entry) {
		throw new Error(`Unknown table: '${table}'`);
	}
	return entry;
}

function findBookmarkByID(bookmarks: Array<BookmarkFromDB>, id: string): BookmarkFromDB {
	return bookmarks.find(b => b.id === id)!;
}

const appRouter = router({
	getCategories: procedure
		.input(tablesInputSchema.assert)
		.query(({ input }): Array<Category> => getTable(input.table).categories),

	watchTables: procedure.subscription(({ signal }): AsyncIterableIterator<TablesUpdate> => {
		function toBookmarkTable([name, { emoji }]: [string, TableEntry]): BookmarkTable {
			return { name, emoji };
		}

		const tablesUpdates$: Observable<TablesUpdate> = tables$.pipe(
			map(tables => entries(tables).map(toBookmarkTable)),
			pairwise(),
			map(([prev, curr]) => ({
				tables: curr,
				added: curr.filter(t => !prev.some(p => p.name === t.name)),
				removed: prev.filter(t => !curr.some(c => c.name === t.name)),
			})),
			startWith({
				tables: entries(getTables()).map(toBookmarkTable),
				added: [],
				removed: [],
			}),
			takeUntil(toAborted(signal)),
		);
		return toAsyncGenerator(tablesUpdates$);
	}),

	createBookmarks: procedure
		.input(type({
			'...': tablesInputSchema,
			newBookmarks: titleAndUrlSchema.array(),
		}).assert)
		.mutation(({ input }): void => {
			const entry = getTable(input.table);

			entry.mutate(({ bookmarks }) => {
				const newBookmarks = input.newBookmarks.map(({ title, url }) => ({
					id: nanoid(),
					title,
					url,
					tags: [] as Array<string>,
					visitCount: 0,
					position: 0,
				}));

				bookmarks.push(...newBookmarks);
			});
		}),

	editBookmark: procedure
		.input(type({
			'...': tablesInputSchema,
			id: idSchema,
			titleAndUrl: titleAndUrlSchema,
		}).assert)
		.mutation(({ input }): void => {
			const entry = getTable(input.table);

			entry.mutate(({ bookmarks }) => {
				const bookmarkToUpdate = findBookmarkByID(bookmarks, input.id);

				bookmarkToUpdate.title = input.titleAndUrl.title;
				bookmarkToUpdate.url = input.titleAndUrl.url;
			});
		}),

	visitBookmark: procedure
		.input(type({
			'...': tablesInputSchema,
			id: idSchema,
		}).assert)
		.mutation(({ input }): void => {
			const entry = getTable(input.table);

			entry.mutate(({ bookmarks }) => {
				const bookmark = findBookmarkByID(bookmarks, input.id);

				bookmark.visitCount++;
			}, false);
		}),

	tagBookmarks: procedure
		.input(type({
			'...': tablesInputSchema,
			ids: idSchema.array(),
			tag: tagSchema,
		}).assert)
		.mutation(({ input }): void => {
			const entry = getTable(input.table);

			entry.mutate(({ bookmarks }) => {
				input.ids.forEach(id => {
					const bookmark = findBookmarkByID(bookmarks, id);
					bookmark.tags = uniq([...bookmark.tags, input.tag]);
				});
			});
		}),

	removeTagFromBookmark: procedure
		.input(type({
			'...': tablesInputSchema,
			id: idSchema,
			tag: tagSchema,
		}).assert)
		.mutation(({ input }): void => {
			const entry = getTable(input.table);

			entry.mutate(({ bookmarks }) => {
				const bookmark = findBookmarkByID(bookmarks, input.id);

				bookmark.tags = bookmark.tags.filter(t => t !== input.tag);
			});
		}),

	deleteBookmark: procedure
		.input(type({
			'...': tablesInputSchema,
			id: idSchema,
		}).assert)
		.mutation(({ input }): void => {
			const entry = getTable(input.table);

			entry.mutate(data => {
				data.bookmarks = data.bookmarks
					.filter(({ id }) => id !== input.id);
				data.votes = data.votes
					.filter(({ loser, winner }) => winner !== input.id && loser !== input.id);
			});
		}),

	createVote: procedure
		.input(type({
			'...': tablesInputSchema,
			winningId: idSchema,
			losingId: idSchema,
		}).assert)
		.mutation(({ input }): void => {
			getTable(input.table).mutate(({ bookmarks, votes }) => {
				const winningBookmark = findBookmarkByID(bookmarks, input.winningId);
				const losingBookmark = findBookmarkByID(bookmarks, input.losingId);

				if (winningBookmark.position <= losingBookmark.position) {
					winningBookmark.position = losingBookmark.position + 1;
				}

				votes.push({
					id: nanoid(),
					winner: input.winningId,
					loser: input.losingId,
				});
			});
		}),

	watchBookmarks: procedure
		.input(tablesInputSchema.assert)
		.subscription(({ input, signal }): AsyncIterableIterator<Array<BookmarkFromDB>> => {
			const bookmarks$ = getTable(input.table).bookmarks$.pipe(
				takeUntil(toAborted(signal)),
			);
			return toAsyncGenerator(bookmarks$);
		}),

	watchVotes: procedure
		.input(tablesInputSchema.assert)
		.subscription(({ input, signal }): AsyncIterableIterator<Array<VersusVote>> => {
			const votes$ = getTable(input.table).votes$.pipe(
				takeUntil(toAborted(signal)),
			);
			return toAsyncGenerator(votes$);
		}),

	undo: procedure
		.input(tablesInputSchema.assert)
		.mutation(({ input }): void => {
			getTable(input.table).undo();
		}),

	watchCanUndo: procedure
		.input(tablesInputSchema.assert)
		.subscription(({ input, signal }): AsyncIterableIterator<boolean> => {
			const canUndo$ = getTable(input.table).canUndo$.pipe(
				takeUntil(toAborted(signal)),
			);
			return toAsyncGenerator(canUndo$);
		}),
});

export type AppRouter = typeof appRouter;

console.log('Backing up...');
backupTables();
console.log('Starting server...');
createHTTPServer({
	middleware: cors(),
	router: appRouter,
}).listen(3000);

const wss = new WebSocketServer({ port: 3001 });
applyWSSHandler({ wss, router: appRouter });
console.log('Server online! HTTP on :3000, WebSocket on :3001');
