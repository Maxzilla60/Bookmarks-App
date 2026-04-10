<script lang="ts">
	import { createBookmarks } from '@api/actions/createBookmarks';
	import { allBookmarks$ } from '@api/data/allBookmarks$';
	import { showError } from '@components/error/errors$';
	import PopUp from '@components/shared/popup/PopUp.svelte';
	import { createOpenDialogSubject } from '@components/shared/popup/popUpDialog';
	import Tag from '@components/shared/Tag.svelte';
	import { type } from 'arktype';
	import { tagSchema, titleAndUrlSchema } from 'bookmarksapp-schemas/schemas';
	import { BookmarkPlusIcon } from 'lucide-svelte';
	import { BehaviorSubject, combineLatest, filter, identity, map, type Observable, Subject, withLatestFrom } from 'rxjs';

	const addDialogId = 'add_bookmark_dialog';

	const titleSubject = new BehaviorSubject<string>('');
	const urlSubject = new BehaviorSubject<string>('');
	const tagsRawSubject = new BehaviorSubject<string>('');

	const showDialogSubject = createOpenDialogSubject(addDialogId);
	showDialogSubject.asObservable()
		.pipe(filter(identity))
		.subscribe(() => {
			const titleEl = document.getElementById('add_title') as HTMLInputElement | null;
			const urlEl = document.getElementById('add_url') as HTMLInputElement | null;
			const tagsEl = document.getElementById('add_tags') as HTMLInputElement | null;
			if (titleEl) {
				titleEl.value = '';
			}
			if (urlEl) {
				urlEl.value = '';
			}
			if (tagsEl) {
				tagsEl.value = '';
			}
			titleSubject.next('');
			urlSubject.next('');
			tagsRawSubject.next('');
		});

	const parsedTags$: Observable<Array<string>> = tagsRawSubject.asObservable().pipe(
		map(raw => raw.split(',').map(t => t.trim()).filter(t => t.length > 0)),
	);

	const validTags$: Observable<Array<string>> = parsedTags$.pipe(
		map(tags => tags.filter(tag => {
			const result = tagSchema(tag);
			return !(result instanceof type.errors);
		})),
	);

	const tagsAreInvalid$: Observable<boolean> = combineLatest({
		parsed: parsedTags$,
		valid: validTags$,
	}).pipe(
		map(({ parsed, valid }) => parsed.length !== valid.length),
	);

	const formIsInvalid$: Observable<boolean> = combineLatest({
		title: titleSubject.asObservable(),
		url: urlSubject.asObservable(),
		tagsInvalid: tagsAreInvalid$,
	}).pipe(
		map(({ title, url, tagsInvalid }) =>
			titleAndUrlSchema({ title, url }) instanceof type.errors || tagsInvalid,
		),
	);

	const addBookmarkSubject = new Subject<void>();
	addBookmarkSubject.asObservable().pipe(
		withLatestFrom(
			titleSubject.asObservable(),
			urlSubject.asObservable(),
			validTags$,
			allBookmarks$,
		),
	).subscribe(([, title, url, tags, allBookmarks]) => {
		const existing = allBookmarks.find(b => b.url === url);
		if (existing) {
			showError(`A bookmark with this URL already exists:\n${url}`);
			return;
		}
		createBookmarks([{ title, url, tags }]);
		showDialogSubject.next(false);
	});
</script>

<button
	onclick={() => showDialogSubject.next(true)}
	title="Add bookmark (Ctrl + B)"
	aria-label="Add bookmark (Ctrl + B)"
>
	<BookmarkPlusIcon color="white"/>
</button>

<PopUp id={addDialogId} height={48} width={35}>
	<div class="add-form">
		<label for="add_title">
			Title
			<input
				id="add_title"
				type="text"
				placeholder="Bookmark title"
				oninput={e => titleSubject.next(e.currentTarget.value)}
			/>
		</label>

		<label for="add_url">
			URL
			<input
				id="add_url"
				type="url"
				placeholder="https://..."
				oninput={e => urlSubject.next(e.currentTarget.value)}
			/>
		</label>

		<label for="add_tags">
			Tags
			<span class="hint">(comma-separated, optional)</span>
			<input
				id="add_tags"
				type="text"
				placeholder="tag1, tag2, tag3"
				oninput={e => tagsRawSubject.next(e.currentTarget.value)}
			/>
		</label>

		{#if $validTags$.length > 0}
			<div class="tag-preview">
				{#each $validTags$ as tag}
					<Tag {tag}/>
				{/each}
			</div>
		{/if}
	</div>

	<button
		onclick={() => addBookmarkSubject.next()}
		disabled={$formIsInvalid$}
	>
		<BookmarkPlusIcon color="white"/>
		<span>Add Bookmark</span>
	</button>
</PopUp>

<style>
	.add-form {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 8px;
		padding: 16px;
		background-color: white;
		overflow-y: auto;
	}

	label {
		font-weight: bold;
		color: #333;
	}

	.hint {
		font-weight: normal;
		font-size: 0.85em;
		color: #666;
	}

	input {
		padding: 8px 10px;
		border: 1px solid #ccc;
		border-radius: 4px;
		font-size: 14px;
		box-sizing: border-box;
		width: 100%;
	}

	input:focus {
		outline: none;
		border-color: var(--accent-color-500);
		box-shadow: 0 0 0 2px color-mix(in srgb, var(--accent-color-500) 25%, transparent);
	}

	.tag-preview {
		display: flex;
		flex-wrap: wrap;
		gap: 4px;
		padding-top: 4px;
	}
</style>
