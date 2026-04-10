import { allBookmarks$ } from '@api/data/allBookmarks$';
import { chain, countBy } from 'lodash';
import { map, type Observable } from 'rxjs';

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
		noTags: bookmarks.filter(b => b.tags?.length <= 0).length ?? 0,
		notVisited: bookmarks.filter(b => b.visitCount <= 0).length ?? 0,
		noVersus: bookmarks.filter(b => b.versus.voted <= 0).length ?? 0,
		deleted: bookmarks.filter(b => b.tags.includes('deleted')).length ?? 0,
		findSource: bookmarks.filter(b => b.tags.includes('findsource')).length ?? 0,
		duplicates: bookmarks.filter(b => b.tags.includes('duplicate')).length ?? 0,
		comparedStats: countBy(bookmarks, b => b.versus.compared),
		tagStats: chain(bookmarks)
			.flatMap('tags')
			.uniq()
			.map(tag => ({
				tag,
				count: bookmarks.filter(b => b.tags.includes(tag)).length,
			}))
			.orderBy('count', 'desc')
			.value(),
	})),
);
