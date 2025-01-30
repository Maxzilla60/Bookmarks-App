<script lang="ts">
	import { type } from 'arktype';
	import { tagSchema } from 'bookmarksapp-schemas/schemas';
	import { LocateFixedIcon, TagIcon } from 'lucide-svelte';
	import { BehaviorSubject, combineLatest, map, merge, Observable, Subject, withLatestFrom } from 'rxjs';
	import { tagBookmarks } from '../../../api/actions/tagBookmarks';
	import { allBookmarks$, allTags$ } from '../../../api/data/allBookmarks$';
	import { fromCtrlShortcut } from '../../../util/util';
	import { selectedBookmarkIds$ } from '../../list/selectedBookmarks';
	import CategoriesButton from './components/CategoriesButton.svelte';

	const selectedTagSubject = new BehaviorSubject<string>('');

	const selectedBookmarks$ = combineLatest({
		bookmarks: allBookmarks$,
		selectedIds: selectedBookmarkIds$,
	}).pipe(
		map(({ bookmarks, selectedIds }) => bookmarks.filter(b => selectedIds.includes(b.id))),
	);

	const tagBookmarksSubject = new Subject<void>();
	tagBookmarksSubject.asObservable().pipe(
		withLatestFrom(
			selectedBookmarks$,
			selectedTagSubject.asObservable(),
		),
	).subscribe(([, selectedBookmarks, selectedTag]) => {
		const inputElement = document.getElementById('tag_input') as HTMLInputElement | null;
		if (inputElement) {
			inputElement.value = '';
			selectedTagSubject.next('');
		}
		tagBookmarks(selectedBookmarks, selectedTag);
	});

	const submitButtonIsDisabled$: Observable<boolean> = selectedTagSubject.asObservable().pipe(
		map(tag => tagSchema(tag) instanceof type.errors),
	);

	const scrollToSelectedBookmarkSubject = new Subject<void>();
	merge(
		scrollToSelectedBookmarkSubject.asObservable(),
		fromCtrlShortcut(document.body, 'g'),
	).pipe(
		withLatestFrom(selectedBookmarkIds$),
		map(([, selectedBookmarkIds]) => selectedBookmarkIds[0]),
	).subscribe((bookmarkId?) => {
		bookmarkId && document.getElementById(bookmarkId)?.scrollIntoView();
	});
</script>

<div class="toolbar">
	<form onsubmit={e => e.preventDefault()}>
		<fieldset disabled={$selectedBookmarkIds$.length === 0}>
			<input
				id="tag_input"
				list="tag_datalist"
				oninput={e => selectedTagSubject.next(e.target?.value ?? '')}
				type="text"
				placeholder="Add tag..."
			/>
			<datalist id="tag_datalist">
				{#each $allTags$ as tag (tag)}
					<option value={tag}></option>
				{/each}
			</datalist>
			<button
				disabled={$submitButtonIsDisabled$}
				onclick={() => tagBookmarksSubject.next()}
				type="submit"
				title="Add tag to selected bookmark(s)"
				aria-label="Add tag to selected bookmark(s)"
			>
				<TagIcon color="white"/>
			</button>
			<span title="Amount of selected bookmarks">
				{$selectedBookmarkIds$.length}
			</span>
		</fieldset>
	</form>
	<span class="top-bar-divider"></span>
	<button
		onclick={() => scrollToSelectedBookmarkSubject.next()}
		title="Go to selected bookmark(s) in list (Ctrl + G)"
		aria-label="Go to selected bookmark(s) in list (Ctrl + G)"
		disabled={$selectedBookmarkIds$.length === 0}
	>
		<LocateFixedIcon color="white"/>
	</button>
	<CategoriesButton/>
</div>

<style>
	fieldset {
		display: flex;
		gap: 10px;
		align-items: center;
		padding: 0;
		margin: 0;
		border: none;
		width: fit-content;
	}

	span {
		color: var(--accent-color-400);
		font-weight: bold;
	}
</style>
