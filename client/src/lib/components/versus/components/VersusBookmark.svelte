<script lang="ts">
	import type { Bookmark } from 'bookmarksapp-schemas/schemas';
	import { isNil } from 'lodash';
	import { EyeIcon, LocateFixedIcon, StarIcon, ToiletIcon } from 'lucide-svelte';
	import { createVersusVote } from '../../../api/actions/createVersusVote';
	import { deleteBookmark } from '../../../api/actions/deleteBookmark';
	import { visitBookmark } from '../../../api/actions/visitBookmark';
	import { openBookmarkDetails } from '../../details/state';
	import { selectBookmarks } from '../../list/selectedBookmarks';
	import Tag from '../../shared/Tag.svelte';
	import { newVersusBattle } from '../versusBattle$';

	type Props = {
		bookmark?: Bookmark;
		otherBookmark?: Bookmark;
	}
	const { bookmark, otherBookmark }: Props = $props();

	function selectBookmark(bookmarkId: string): void {
		selectBookmarks([bookmarkId]);
		document.getElementById(bookmarkId)?.scrollIntoView();
	}

	function voteVersus(): void {
		createVersusVote(bookmark!, otherBookmark!);
		newVersusBattle();
	}
</script>

<div class="versus_bookmark">
	{#if bookmark}
		<div
			title={bookmark.title}
			class="versus_bookmark_title"
		>
			{bookmark.title}
		</div>
		<a
			href={bookmark.url}
			onclick={() => visitBookmark(bookmark)}
			onauxclick={() => visitBookmark(bookmark)}
			title={bookmark.url}
			target="_blank"
			rel="noreferrer noopener"
		>
			{bookmark.url}
		</a>
		<div>
			{#each bookmark.tags.sort() as tag (bookmark.id + '_' + tag)}
				<Tag {tag} {bookmark}/>
			{/each}
		</div>
		<!-- <div>{ bookmark.versus.voted }</div> -->
		<div id="buttons">
			<button
				onclick={() => voteVersus()}
				disabled={isNil(otherBookmark)}
				title="Vote for this bookmark"
				aria-label="Vote for this bookmark"
			>
				<StarIcon color="white"/>
			</button>
			<span class="versus-bookmark-divider"></span>
			<button
				onclick={() => selectBookmark(bookmark.id)}
				title="Go to this bookmark in list"
				aria-label="Go to this bookmark in list"
			>
				<LocateFixedIcon color="white"/>
			</button>
			<button
				onclick={() => openBookmarkDetails(bookmark)}
				title="View details of this bookmark"
				aria-label="View details of this bookmark"
			>
				<EyeIcon color="white"/>
			</button>
			<button
				onclick={() => deleteBookmark(bookmark)}
				title="Delete bookmark"
				aria-label="Delete bookmark"
			>
				<ToiletIcon color="white"/>
			</button>
		</div>
	{/if}
</div>

<style>
	.versus_bookmark {
		flex: 0.5;
		display: flex;
		flex-direction: column;
		overflow: hidden;
		margin: 15px 10px;
		text-align: center;
		gap: 5px;
	}

	.versus_bookmark_title, a {
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		width: calc(100%);
	}

	#buttons {
		padding-top: 5px;
		display: inline-flex;
		justify-content: center;
		gap: 5px;
	}

	.versus-bookmark-divider {
		border: 1px solid hsl(var(--grey-color-hue), 0%, 73%);
		height: 1.5em;
		margin-left: 5px;
		margin-right: 5px;
	}
</style>
