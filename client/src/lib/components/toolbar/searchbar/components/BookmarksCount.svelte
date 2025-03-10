<script lang="ts">
	import type { Bookmark } from 'bookmarksapp-schemas/schemas';
	import { BehaviorSubject, combineLatest, map, type Observable } from 'rxjs';
	import { allBookmarks$ } from '../../../../api/data/allBookmarks$';

	const isHoveringSubject = new BehaviorSubject<boolean>(false);

	const allBookmarksCount$: Observable<number> = allBookmarks$.pipe(
		map(bookmarks => bookmarks.length),
	);

	const deletedBookmarksCount$: Observable<string> = allBookmarks$.pipe(
		map((bookmarks: Array<Bookmark>) => ({
			allCount: bookmarks.length,
			deletedCount: bookmarks.filter(b => b.tags.includes('deleted')).length,
		})),
		map(({ allCount, deletedCount }) => `${allCount - deletedCount} - ${deletedCount}`),
	);

	const bookmarksCount$: Observable<number | string> = combineLatest({
		isHovering: isHoveringSubject.asObservable(),
		allBookmarksCount: allBookmarksCount$,
		deletedBookmarksCount: deletedBookmarksCount$,
	}).pipe(
		map(({ isHovering, allBookmarksCount, deletedBookmarksCount }) => {
			return isHovering ? deletedBookmarksCount : allBookmarksCount;
		}),
	);
</script>

<span
	id="bookmarks_count"
	title="Excluding deleted count"
	onmouseenter={() => isHoveringSubject.next(true)}
	onmouseleave={() => isHoveringSubject.next(false)}
>
	{$bookmarksCount$}
</span>

<style>
	#bookmarks_count {
		min-width: 37px;
		text-align: center;
		cursor: pointer;
		color: var(--accent-color-400);
		font-weight: bold;
	}
</style>
