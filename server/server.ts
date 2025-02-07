import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import { type } from 'arktype';
import { type BookmarkFromDB, type Category, idSchema, tagSchema, titleAndUrlSchema, type VersusVote } from 'bookmarksapp-schemas/schemas';
import cors from 'cors';
import { entries, find, keys, remove, uniq } from 'lodash-es';
import type { Low } from 'lowdb';
import { nanoid } from 'nanoid';
import { backupTables } from './backup';
import { databases, type DbContents } from './database/databases';

const t = initTRPC.create();
export const router = t.router;
export const procedure = t.procedure;

function getDatabase(table: string): Low<DbContents> {
	return databases[table]!.database;
}

function getBookmarksFromDB(database: Low<DbContents>): Array<BookmarkFromDB> {
	const { bookmarks } = database.data;
	return bookmarks;
}

function getVotesFromDB(database: Low<DbContents>): Array<VersusVote> {
	const { votes } = database.data;
	return votes;
}

function getBookmarkByIdFromDB(database: Low<DbContents>, id: string): BookmarkFromDB {
	const bookmarks = getBookmarksFromDB(database);
	return find(bookmarks, { id })!;
}

const tablesInputSchema = type({
	table: type.enumerated(...keys(databases)),
});

const appRouter = router({
	getBookmarks: procedure
		.input(tablesInputSchema.assert)
		.query(({ input }): Array<BookmarkFromDB> => getDatabase(input.table).data.bookmarks),
	getVotes: procedure
		.input(tablesInputSchema.assert)
		.query(({ input }): Array<VersusVote> => getDatabase(input.table).data.votes),
	getCategories: procedure
		.input(tablesInputSchema.assert)
		.query(({ input }): Array<Category> => getDatabase(input.table).data.categories),
	getTables: procedure.query((): Array<{ name: string, emoji: string }> =>
		entries(databases).map(([name, { emoji }]) => ({
			name,
			emoji,
		})),
	),

	createBookmarks: procedure
		.input(type({
			'...': tablesInputSchema,
			newBookmarks: titleAndUrlSchema.array(),
		}).assert)
		.mutation(async ({ input }): Promise<Array<BookmarkFromDB>> => {
			const database = getDatabase(input.table);

			const bookmarks = getBookmarksFromDB(database);
			const newBookmarks = input.newBookmarks.map(({ title, url }) => ({
				id: nanoid(),
				title,
				url,
				tags: [],
				visitCount: 0,
				position: 0,
			}));

			newBookmarks.forEach(newBookmark => bookmarks.push(newBookmark));

			await database.write();
			return database.data.bookmarks;
		}),
	editBookmark: procedure
		.input(type({
			'...': tablesInputSchema,
			id: idSchema,
			titleAndUrl: titleAndUrlSchema,
		}).assert)
		.mutation(async ({ input }): Promise<Array<BookmarkFromDB>> => {
			const database = getDatabase(input.table);

			const bookmarkToUpdate = getBookmarkByIdFromDB(database, input.id);

			bookmarkToUpdate.title = input.titleAndUrl.title;
			bookmarkToUpdate.url = input.titleAndUrl.url;

			await database.write();
			return database.data.bookmarks;
		}),
	visitBookmark: procedure
		.input(type({
			'...': tablesInputSchema,
			id: idSchema,
		}).assert)
		.mutation(async ({ input }): Promise<Array<BookmarkFromDB>> => {
			const database = getDatabase(input.table);

			const bookmarkToUpdate = getBookmarkByIdFromDB(database, input.id);

			bookmarkToUpdate.visitCount = bookmarkToUpdate.visitCount + 1;

			await database.write();
			return database.data.bookmarks;
		}),
	tagBookmarks: procedure
		.input(type({
			'...': tablesInputSchema,
			ids: idSchema.array(),
			tag: tagSchema,
		}).assert)
		.mutation(async ({ input }): Promise<Array<BookmarkFromDB>> => {
			const database = getDatabase(input.table);

			const bookmarks = getBookmarksFromDB(database);

			bookmarks
				.filter(b => input.ids.includes(b.id))
				.forEach(b => {
					b.tags = uniq([...b.tags, input.tag]);
				});

			await database.write();
			return database.data.bookmarks;
		}),
	removeTagFromBookmark: procedure
		.input(type({
			'...': tablesInputSchema,
			id: idSchema,
			tag: tagSchema,
		}).assert)
		.mutation(async ({ input }): Promise<Array<BookmarkFromDB>> => {
			const database = getDatabase(input.table);

			const bookmarkToUpdate = getBookmarkByIdFromDB(database, input.id);

			bookmarkToUpdate.tags = remove(
				bookmarkToUpdate.tags,
				(tag: string) => tag !== input.tag,
			);

			await database.write();
			return database.data.bookmarks;
		}),
	deleteBookmark: procedure
		.input(type({
			'...': tablesInputSchema,
			id: idSchema,
		}).assert)
		.mutation(async ({ input }): Promise<Array<BookmarkFromDB>> => {
			const database = getDatabase(input.table);

			const bookmarks = getBookmarksFromDB(database);
			const votes = getVotesFromDB(database);

			remove(bookmarks, { id: input.id });
			remove(votes, vote => vote.winner === input.id || vote.loser === input.id);

			await database.write();
			return database.data.bookmarks;
		}),

	createVote: procedure
		.input(type({
			'...': tablesInputSchema,
			winningId: idSchema,
			losingId: idSchema,
		}).assert)
		.mutation(async ({ input }): Promise<{ bookmarks: Array<BookmarkFromDB>, votes: Array<VersusVote> }> => {
			const database = getDatabase(input.table);

			const winningBookmark = getBookmarkByIdFromDB(database, input.winningId);
			const losingBookmark = getBookmarkByIdFromDB(database, input.losingId);

			if (winningBookmark.position <= losingBookmark.position) {
				winningBookmark.position = losingBookmark.position + 1;
			}

			const votes = getVotesFromDB(database);
			const newVote: VersusVote = {
				id: nanoid(),
				winner: input.winningId,
				loser: input.losingId,
			};

			votes.push(newVote);

			await database.write();
			return {
				bookmarks: database.data.bookmarks,
				votes: database.data.votes,
			};
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
console.log('Server online!');
