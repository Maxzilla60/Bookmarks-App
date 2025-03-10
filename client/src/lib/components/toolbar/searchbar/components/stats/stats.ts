import { uniq } from 'lodash';
import { map, type Observable } from 'rxjs';
import { allBookmarks$ } from '../../../../../api/data/allBookmarks$';

interface BookmarkStats {
	noTags: number;
	notVisited: number;
	noVersus: number;
	deleted: number;
	findSource: number;
	duplicates: number;
	comparedStats: Record<string, number>;
	tagStats: Array<{
		tag: string,
		count: number,
	}>;
}

export const stats$: Observable<BookmarkStats> = allBookmarks$.pipe(
	map(bookmarks => ({
		bookmarks,
		tags: uniq(bookmarks.flatMap(b => b.tags)) as Array<string>,
	})),
	map(({ bookmarks, tags }) => ({
		noTags: bookmarks.filter(b => b.tags?.length <= 0).length ?? 0,
		notVisited: bookmarks.filter(b => b.visitCount <= 0).length ?? 0,
		noVersus: bookmarks.filter(b => b.versus.voted <= 0).length ?? 0,
		deleted: bookmarks.filter(b => b.tags.includes('deleted')).length ?? 0,
		findSource: bookmarks.filter(b => b.tags.includes('findsource')).length ?? 0,
		duplicates: bookmarks.filter(b => b.tags.includes('duplicate')).length ?? 0,
		comparedStats: Object.entries(bookmarks
			.reduce((reducer, currentValue) => {
					const comparedAmount = `${currentValue.versus.compared}`;
					reducer[comparedAmount] ??= 0;
					reducer[comparedAmount] += 1;
					return reducer;
				}, {} as Record<string, number>,
			)) as unknown as Record<string, number>,
		tagStats: tags
			.map(tag => ({
				tag,
				count: bookmarks.filter(b => b.tags.includes(tag)).length,
			}))
			.sort((a, b) => b.count - a.count),
	})),
);
