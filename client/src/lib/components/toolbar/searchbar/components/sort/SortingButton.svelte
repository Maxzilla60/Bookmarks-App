<script lang="ts">
	import { ArrowDownUpIcon, ArrowUpDownIcon } from 'lucide-svelte';
	import { map } from 'rxjs';
	import { BookmarksSort } from '../../../../../util/sort.enum';
	import { sortType$, toggleSort } from './sorting';

	const sortIsVersusScore$ = sortType$.pipe(
		map(sort => sort === BookmarksSort.VERSUS_SCORE),
	);

	const sortButtonTitle$ = sortIsVersusScore$.pipe(
		map(isVersusScore => isVersusScore ? 'Sort by Position' : 'Sort by Versus Score'),
	);

	const sortLetter$ = sortIsVersusScore$.pipe(
		map(isVersusScore => isVersusScore ? 'V' : 'P'),
	);

	const sortLetterTitle$ = sortIsVersusScore$.pipe(
		map(isVersusScore => isVersusScore ? 'Sorted by Versus Score' : 'Sorted by Position'),
	);
</script>

<button
	onclick={() => toggleSort()}
	title={$sortButtonTitle$}
	aria-label={$sortButtonTitle$}
>
	{#if $sortLetter$ === 'V'}
		<ArrowDownUpIcon color="white"/>
	{:else}
		<ArrowUpDownIcon color="white"/>
	{/if}
</button>
<span
	id="sort_type"
	title={$sortLetterTitle$}
>
	{$sortLetter$}
</span>

<style>
	#sort_type {
		font-weight: bold;
		color: var(--accent-color-400);
	}
</style>
