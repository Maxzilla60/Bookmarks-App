import { type } from 'arktype';
import { uniq } from 'lodash-es';
import { urlAlphabet } from 'nanoid';

export const idSchema = type('string > 0').narrow((id, ctx) => {
	if ([...id].every(letter => urlAlphabet.includes(letter))) {
		return true;
	}
	return ctx.mustBe('a valid nanoid id');
});

export const tagSchema = type('/^\\w+$/ > 0').pipe(tag => tag.toLowerCase());

const tagsSchema = tagSchema.array().narrow((tags, ctx) => {
	if (uniq(tags).length === tags.length) {
		return true;
	}
	return ctx.mustBe('unique');
});
export const bookmarkFromDBSchema = type({
	id: idSchema,
	title: '/^[^\\n]*$/ > 0',
	url: 'string.url > 0',
	tags: tagsSchema,
	visitCount: 'number >= 0',
	position: 'number >= 0',
});

const versusStatsSchema = type({
	compared: 'number >= 0',
	voted: 'number >= 0',
});
export const bookmarkSchema = type({
	'...': bookmarkFromDBSchema,
	versus: versusStatsSchema,
});

export const titleAndUrlSchema = type({
	title: bookmarkSchema.get('title'),
	url: bookmarkSchema.get('url'),
});

export const versusVoteSchema = type({
	id: idSchema,
	winner: idSchema,
	loser: idSchema,
});

export const categorySchema = type({
	name: '/^\\w+$/ > 0',
	tags: tagsSchema,
	'color?': 'string',
});

export const databaseSchema = type({
	emoji: 'string', // TODO: should be single emoji (https://stackoverflow.com/a/59050877/10748420)
	bookmarks: bookmarkFromDBSchema.array(),
	votes: versusVoteSchema.array(),
	categories: categorySchema.array(),
});

export type BookmarkFromDB = typeof bookmarkFromDBSchema.infer;
export type Bookmark = typeof bookmarkSchema.infer;
export type VersusStats = typeof versusStatsSchema.infer;
export type TitleAndUrl = typeof titleAndUrlSchema.infer;
export type VersusVote = typeof versusVoteSchema.infer;
export type Category = typeof categorySchema.infer;
