import type { BookmarkFromDB, BookmarkTable } from 'bookmarksapp-schemas/schemas';

export const TABLES: Array<BookmarkTable> = [
	{ name: 'spellbooks', emoji: '📖' },
	{ name: 'quests', emoji: '⚔️' },
];

export const BOOKMARKS = {
	scrollsOfArcana: {
		id: 'arcana-id-aaaaaaaaaaa',
		title: 'Scrolls of Arcana',
		url: 'https://www.scrollsofarcana.com',
		tags: [],
		visitCount: 5,
		position: 2,
	} satisfies BookmarkFromDB,
	oracleOfMysts: {
		id: 'oracle-id-bbbbbbbbbbb',
		title: 'Oracle of the Mysts',
		url: 'https://www.oracleofmysts.com',
		tags: ['search', 'divination'],
		visitCount: 20,
		position: 5,
	} satisfies BookmarkFromDB,
	dragonsTavern: {
		id: 'tavern-id-cccccccccccc',
		title: 'The Dragon\'s Tavern',
		url: 'https://www.dragonstavern.net',
		tags: ['deleted'],
		visitCount: 15,
		position: 1,
	} satisfies BookmarkFromDB,
	grimoireOfLore: {
		id: 'grimoir-id-ddddddddddd',
		title: 'Grimoire of Lore',
		url: 'https://www.grimoireoflore.net',
		tags: ['docs', 'reference'],
		visitCount: 8,
		position: 3,
	} satisfies BookmarkFromDB,
};

export const DEFAULT_BOOKMARKS: Array<BookmarkFromDB> = Object.values(BOOKMARKS);
