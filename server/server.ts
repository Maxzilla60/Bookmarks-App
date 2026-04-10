import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import { applyWSSHandler } from '@trpc/server/adapters/ws';
import { type } from 'arktype';
import { type BookmarkFromDB, type BookmarkTable, type Category, idSchema, tagSchema, titleAndUrlSchema, type VersusVote } from 'bookmarksapp-schemas/schemas';
import cors from 'cors';
import { entries, keys, uniq } from 'lodash-es';
import { nanoid } from 'nanoid';
import { otag as toAsyncGenerator } from 'observable-to-async-generator';
import { fromEvent, NEVER, Observable, takeUntil } from 'rxjs';
import { WebSocketServer } from 'ws';
import { backupTables } from './backup';
import { type TableEntry, tables } from './database/tables';

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
	table: type.enumerated(...keys(tables)),
});

function getTable(table: string): TableEntry {
	return tables[table]!;
}

function findBookmarkByID(bookmarks: BookmarkFromDB[], id: string): BookmarkFromDB {
	return bookmarks.find(b => b.id === id)!;
}

const appRouter = router({
	getCategories: procedure
		.input(tablesInputSchema.assert)
		.query(({ input }): Array<Category> => getTable(input.table).categories),

	getTables: procedure.query((): Array<BookmarkTable> =>
		entries(tables).map(([name, { emoji }]) => ({ name, emoji })),
	),

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
					tags: [] as string[],
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
			});
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
				bookmarks
					.filter(({ id }) => input.ids.includes(id))
					.forEach(b => {
						b.tags = uniq([...b.tags, input.tag]);
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
