<script lang="ts">
	import { SparkleIcon } from 'lucide-svelte';
	import { map, Subject, withLatestFrom } from 'rxjs';
	import { allBookmarks$ } from '../../../../api/data/allBookmarks$';
	import { randomChoice } from '../../../../util/util';
	import { selectBookmarks } from '../../../list/selectedBookmarks';

	const openRandomBookmarkSubject = new Subject<void>();
	openRandomBookmarkSubject.pipe(
		withLatestFrom(allBookmarks$),
		map(([_, bookmarks]) => bookmarks),
		map(randomChoice),
	).subscribe(randomBookmark => {
		selectBookmarks([randomBookmark.id]);
		document.getElementById(randomBookmark.id)?.scrollIntoView();
		window.open(randomBookmark.url, '_blank', 'noreferrer noopener');
	});
</script>

<button
	onclick={() => openRandomBookmarkSubject.next()}
	title="Random bookmark"
	aria-label="Random bookmark"
	disabled={$allBookmarks$.length === 0}
>
	<SparkleIcon color="white"/>
</button>
