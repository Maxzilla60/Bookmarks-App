<script lang="ts">
	import type { Bookmark } from 'bookmarksapp-schemas/schemas';
	import { ToiletIcon } from 'lucide-svelte';
	import { writable } from 'svelte/store';
	import { deleteBookmark } from '../../../api/actions/deleteBookmark';
	import { visitBookmark } from '../../../api/actions/visitBookmark';
	import { getBookmarkVersusString } from '../../../util/util';
	import { openBookmarkDetails } from '../../details/state';
	import Tag from '../../shared/Tag.svelte';
	import { selectBookmark, selectedBookmarkIds$ } from '../selectedBookmark';

	type Props = {
		bookmark: Bookmark;
	};
	const { bookmark }: Props = $props();

	const isHovering = writable<boolean>(false);

	function handleSelect(event: Event) {
		const { checked } = event.target as HTMLInputElement;
		const { shiftKey } = event;

		selectBookmark(
			bookmark.id,
			shiftKey,
			!checked,
		);
	}
</script>

<div
	id={bookmark.id}
	class="list_bookmark"
	class:selected={$selectedBookmarkIds$.includes(bookmark.id)}
>
	<input
		style:display={$isHovering ? 'initial' : 'none'}
		onclick={e => handleSelect(e)}
		onmouseleave={() => isHovering.set(false)}
		type="checkbox"
		checked={$selectedBookmarkIds$.includes(bookmark.id)}
	/>
	<img
		style:display={$isHovering ? 'none' : 'initial'}
		onmouseenter={() => isHovering.set(true)}
		title={getBookmarkVersusString(bookmark)}
		loading="lazy"
		src={`https://www.google.com/s2/favicons?domain=${bookmark.url}`}
		alt="favicon"
	/>
	<span
		onclick={e =>{
			e.stopPropagation();
			openBookmarkDetails(bookmark);
		}}
		title={bookmark.title}
		class="list_bookmark_title"
		class:deleted={bookmark.tags.includes('deleted')}
	>
		{bookmark.title}
	</span>
	<span class="list_bookmark_divider"></span>
	<a
		href={bookmark.url}
		onclick={e =>{
			e.stopPropagation();
			visitBookmark(bookmark);
		}}
		title={bookmark.url}
		target="_blank"
		rel="noreferrer noopener"
	>
		{bookmark.url}
	</a>
	<span class="list_bookmark_divider"></span>
	<span class="list_bookmark_tags" title={bookmark.tags.join(', ')}>
		{#each bookmark.tags.sort() as tag (bookmark.id + '_' + tag)}
			<Tag {tag} {bookmark}/>
		{/each}
	</span>
	<button
		onclick={e =>{
			e.stopPropagation();
			deleteBookmark(bookmark);
		}}
		class="list_bookmark_delete_button"
		title="Delete bookmark"
		aria-label="Delete bookmark"
	>
		{#if $selectedBookmarkIds$.includes(bookmark.id)}
			<ToiletIcon color="white"/>
		{:else}
			<ToiletIcon color="var(--accent-color-700)"/>
		{/if}
	</button>
</div>

<style>
	.list_bookmark {
		display: flex;
		margin-top: 10px;
		margin-bottom: 10px;
		align-items: center;
		padding: 5px;
		cursor: pointer;
	}

	img, input {
		background-color: white;
		width: 20px;
		height: 20px;
		margin-left: 10px;
		margin-right: 5px;
	}

	input {
		cursor: pointer;
	}

	.list_bookmark_title, a, .list_bookmark_tags {
		flex: 0.333;
		margin-left: 10px;
	}

	.list_bookmark_title, a {
		text-overflow: ellipsis;
		white-space: nowrap;
		overflow: hidden;
		width: calc(100%);
	}

	.list_bookmark_divider {
		border: 1px solid hsl(var(--grey-color-hue), 0%, 73%);
		height: 1.5em;
		margin-left: 10px;
	}

	.list_bookmark_delete_button {
		border: none;
		background-color: transparent;
		visibility: hidden;
	}

	.deleted {
		text-decoration: line-through;
	}

	.list_bookmark:hover {
		background-color: color-mix(in hsl, var(--accent-color-500) 30%, white);
	}

	.list_bookmark.selected {
		background-color: var(--accent-color-500);
		color: white;
	}

	.list_bookmark.selected > img {
		border: 2px white solid;
		box-sizing: content-box;
		margin-left: 8px;
		margin-right: 3px;
	}

	.list_bookmark.selected > a,
	.list_bookmark.selected > .list_bookmark_title {
		color: white;
		font-weight: bold;
	}

	.list_bookmark.selected > a:hover {
		color: var(--accent-color-400);
	}

	.list_bookmark.selected > .list_bookmark_divider {
		border: 1px solid var(--accent-color-600);
	}

	.list_bookmark:hover > .list_bookmark_delete_button {
		visibility: initial;
	}
</style>
