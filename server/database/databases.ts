import type { BookmarkFromDB, Category, VersusVote } from 'bookmarksapp-schemas/schemas';
import { databaseSchema } from 'bookmarksapp-schemas/schemas';
import fs from 'fs';
import { endsWith, fromPairs, isEmpty, replace } from 'lodash-es';
import type { Low } from 'lowdb';
import { JSONFilePreset } from 'lowdb/node';

export type DbContents = {
	emoji: string;
	bookmarks: Array<BookmarkFromDB>;
	votes: Array<VersusVote>;
	categories: Array<Category>;
}

const tablesPath = 'database/tables';

export const databases = await getDatabases();

type DataBase = {
	emoji: string;
	database: Low<DbContents>;
};

async function getDatabases(): Promise<Record<string, DataBase>> {
	const tables = [];
	for (const fileName of fs.readdirSync(tablesPath)) {
		if (endsWith(fileName, '.json')) {
			const tableName = replace(fileName, '.json', '');
			const database = await createRepository(tableName);
			tables.push([tableName, {
				database,
				emoji: database.data.emoji,
			}]);
		}
	}

	if (isEmpty(tables)) {
		throw new Error('No tables found');
	}

	return fromPairs(tables);
}

async function createRepository(table: string): Promise<Low<DbContents>> {
	const db = await JSONFilePreset<DbContents>(`${tablesPath}/${table}.json`, {
		emoji: '🔖',
		bookmarks: [],
		votes: [],
		categories: [],
	});
	db.read();
	databaseSchema.assert(db.data);
	return db;
}
