<script lang="ts">
	import type { Bookmark } from 'bookmarksapp-schemas/schemas';
	import { SwordsIcon } from 'lucide-svelte';
	import { map, type Observable, startWith } from 'rxjs';
	import VersusBookmark from './components/VersusBookmark.svelte';
	import { type VersusBattle, versusBattle$ } from './versusBattle$';

	const leftCorner$: Observable<Bookmark | undefined> = versusBattle$.pipe(
		map(({ leftCorner }) => leftCorner),
	);
	const rightCorner$: Observable<Bookmark | undefined> = versusBattle$.pipe(
		map(({ rightCorner }) => rightCorner),
	);

	const versusDisplay$: Observable<'flex' | 'none'> = versusBattle$.pipe(
		map((versus: VersusBattle) => Boolean(versus.leftCorner) || Boolean(versus.rightCorner)),
		map(hasVersus => (hasVersus ? 'flex' : 'none') as 'flex' | 'none'),
		startWith('none' as 'flex' | 'none'),
	);
</script>

<div
	id="versus"
	style:display={$versusDisplay$}
>
	<VersusBookmark
		bookmark={$leftCorner$}
		otherBookmark={$rightCorner$}
	/>
	<div id="versus-icon">
		<SwordsIcon
			color="var(--accent-color-400)"
			size="28"
		/>
	</div>
	<VersusBookmark
		bookmark={$rightCorner$}
		otherBookmark={$leftCorner$}
	/>
</div>

<style>
	#versus {
		justify-content: space-around;
		box-shadow: 0 1px 11px 0 var(--accent-color-700);
		z-index: 1;
	}

	#versus-icon {
		align-self: center;
		padding: 10px;
	}
</style>
