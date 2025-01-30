<script lang="ts">
	import type { Bookmark } from 'bookmarksapp-schemas/schemas';
	import { XIcon } from 'lucide-svelte';
	import { map } from 'rxjs';
	import { removeTagFromBookmark } from '../../api/actions/removeTagFromBookmark';
	import { tagColors$ } from './tagColors';

	type Props = {
		tag: string;
		bookmark?: Bookmark;
	}
	const { tag, bookmark = undefined }: Props = $props();

	const color$ = tagColors$.pipe(
		map(colors => colors[tag]),
	);
</script>

<div
	class="bookmark_tag"
	style:background-color={$color$}
>
	<span>{tag}</span>
	{#if bookmark}
		<button
			onclick={e =>{
				e.stopPropagation();
				removeTagFromBookmark(bookmark,tag);
			}}
			class="delete_tag_button"
			title="Delete tag"
			aria-label="Delete tag"
		>
			<XIcon size="19" color="white"/>
		</button>
	{/if}
</div>

<style>
	.bookmark_tag {
		border-radius: 29px;
		padding: 0 10px;
		display: inline-flex;
		position: relative;
		column-gap: 5px;
		cursor: initial;
		background-color: var(--accent-color-500);
	}

	.bookmark_tag:not(:last-child) {
		margin-right: 5px;
	}

	.bookmark_tag > span {
		color: white;
		margin: 0;
	}

	.delete_tag_button {
		height: unset;
		width: unset;
		background-color: transparent;
		display: none;
		padding: 0;
	}

	.bookmark_tag:hover .delete_tag_button {
		display: inline-flex;
		align-items: center;
		vertical-align: middle;
	}
</style>
