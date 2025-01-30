<script lang="ts">
	import type { Bookmark } from 'bookmarksapp-schemas/schemas';
	import { combineLatest, map, Observable, startWith } from 'rxjs';
	import { allBookmarks$ } from '../../api/data/allBookmarks$';
	import { fromCtrlShortcut, fuzzySearch, sortBy } from '../../util/util';
	import BookmarkDetailsDialog from '../details/BookmarkDetailsDialog.svelte';
	import { searchTerm$ } from '../toolbar/searchbar/components/searchinput/search';
	import { sortType$ } from '../toolbar/searchbar/components/sort/sorting';
	import BookmarkEntry from './components/details/BookmarkEntry.svelte';

	const sortedBookmarks$: Observable<Array<Bookmark>> = combineLatest({
		bookmarks: allBookmarks$,
		sort: sortType$,
	}).pipe(
		map(({ bookmarks, sort }) => [...bookmarks].sort(sortBy(sort))),
	);

	const bookmarks$: Observable<Array<Bookmark>> = combineLatest({
		bookmarks: sortedBookmarks$,
		searchTerm: searchTerm$,
	}).pipe(
		map(({ bookmarks, searchTerm }) => fuzzySearch(bookmarks, searchTerm)),
		startWith([]),
	);

	fromCtrlShortcut(document.body, 'Home').subscribe(() => {
		document.getElementById('list')!.scrollTop = 0;
	});

	fromCtrlShortcut(document.body, 'End').subscribe(() => {
		const listElement = document.getElementById('list')!;
		listElement.scrollTop = listElement.scrollHeight;
	});
</script>

<BookmarkDetailsDialog/>
<div id="list">
	{#each $bookmarks$ as bookmark (bookmark.id)}
		<BookmarkEntry {bookmark}/>
	{/each}
</div>

<style>
	#list {
		overflow-y: scroll;
		user-select: none;
	}
</style>
