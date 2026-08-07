<script lang="ts">
	import { editBookmark } from '@api/actions/editBookmark';
	import { allTags$ } from '@api/data/allBookmarks$';
	import PopUp from '@components/shared/popup/PopUp.svelte';
	import { calculateVersusScore, confirmButtonText } from '@util/util';
	import { type } from 'arktype';
	import type { Bookmark } from 'bookmarksapp-schemas/schemas';
	import { tagSchema, titleAndUrlSchema } from 'bookmarksapp-schemas/schemas';
	import { isEqual, isNil, sortBy } from 'lodash';
	import { CheckIcon, PencilIcon } from 'lucide-svelte';
	import { BehaviorSubject, combineLatest, distinctUntilChanged, filter, first, map, merge, type Observable, startWith, Subject, switchMap, withLatestFrom } from 'rxjs';
	import Tags from 'svelte-tags-input';
	import { bookmarkDetails$, openBookmarkDetails } from './state';

	type BookmarkWithScore = Bookmark & { versusScore: number };

	const bookmarkDetailsDialogId = 'bookmark_details_dialog';

	const titleInputSubject = new Subject<string>();
	const urlInputSubject = new Subject<string>();

	bookmarkDetails$.subscribe(bookmark => {
		const dialogElement = document.getElementById(bookmarkDetailsDialogId) as HTMLDialogElement | null;
		if (bookmark) {
			dialogElement!.showModal();
		} else {
			dialogElement!.close();
		}
	});

	const title$: Observable<string> = bookmarkDetails$.pipe(
		filter(bookmark => !isNil(bookmark)),
		switchMap(({ title }) => titleInputSubject.asObservable().pipe(startWith(title))),
	);
	const url$: Observable<string> = bookmarkDetails$.pipe(
		filter(bookmark => !isNil(bookmark)),
		switchMap(({ url }) => urlInputSubject.asObservable().pipe(startWith(url))),
	);

	const bookmark$: Observable<BookmarkWithScore> = bookmarkDetails$.pipe(
		filter(bookmark => !isNil(bookmark)),
		map(bookmark => ({
			...bookmark,
			versusScore: calculateVersusScore(bookmark.versus),
		})),
	);

	const tagsEditedSubject = new Subject<void>();

	const isEdited$: Observable<boolean> = bookmarkDetails$.pipe(
		filter(bookmark => !isNil(bookmark)),
		switchMap(() => merge(
			titleInputSubject.asObservable(),
			urlInputSubject.asObservable(),
			tagsEditedSubject.asObservable(),
		)),
		first(),
		map(() => true),
		startWith(false),
	);

	const okButtonText$: Observable<string> = bookmarkDetails$.pipe(
		filter(bookmark => !isNil(bookmark)),
		map(confirmButtonText),
	);

	const buttonIsDisabled$: Observable<boolean> = bookmark$.pipe(
		switchMap(bookmark => combineLatest({
			title: titleInputSubject.asObservable(),
			url: urlInputSubject.asObservable(),
		}).pipe(startWith(bookmark))),
		map(titleAndUrl => titleAndUrlSchema(titleAndUrl) instanceof type.errors),
		startWith(true),
	);

	const doEditSubject = new Subject<void>();
	const tagsInputSubject = new BehaviorSubject<Array<string>>([]);
	bookmark$.pipe(
		map(({ tags }) => sortBy(tags)),
		distinctUntilChanged(isEqual),
	).subscribe(tags => tagsInputSubject.next(tags));

	const tagsInput = {
		subscribe: (run: (value: Array<string>) => void) => {
			const subscription = tagsInputSubject.subscribe(run);
			return () => subscription.unsubscribe();
		},
		set: (value: Array<string>) => tagsInputSubject.next(value),
	};

	doEditSubject.asObservable().pipe(
		withLatestFrom(
			bookmark$,
			title$,
			url$,
			tagsInputSubject.asObservable(),
		),
	).subscribe(([, bookmark, title, url, tags]) => {
		editBookmark(bookmark.id, { title, url, tags });
	});

	function isValidTag(tag: string): boolean {
		return !(tagSchema(tag) instanceof type.errors);
	}
</script>

<PopUp
	id={bookmarkDetailsDialogId}
	width={40}
	height={50}
>
	{#if $bookmark$}
		{#key $bookmark$}
			<dl>
				<dt>id</dt>
				<dd class="id">{$bookmark$.id}</dd>

				<dt>
					<PencilIcon size="20"/>
					<span>title</span>
				</dt>
				<dd
					contenteditable="true"
					oninput={e => titleInputSubject.next(e.target?.innerText ?? '')}
				>
					{$bookmark$.title}
				</dd>

				<dt>
					<PencilIcon size="20"/>
					<span>url</span>
				</dt>
				<dd
					contenteditable="true"
					oninput={e => urlInputSubject.next(e.target?.innerText ?? '')}
					class="url"
				>
					{$bookmark$.url}
				</dd>

				<dt>tags</dt>
				<dd>
					<Tags
						bind:tags={$tagsInput}
						autoComplete={$allTags$}
						onlyUnique
						customValidation={isValidTag}
						onTagAdded={() => tagsEditedSubject.next()}
						onTagRemoved={() => tagsEditedSubject.next()}
						placeholder="Add tag..."
					/>
				</dd>

				<dt>visitCount</dt>
				<dd>{$bookmark$.visitCount}</dd>

				<dt>position</dt>
				<dd>{$bookmark$.position}</dd>

				<dt>compared</dt>
				<dd>{$bookmark$.versus.compared}</dd>

				<dt>voted</dt>
				<dd>{$bookmark$.versus.voted}</dd>

				<dt>versusScore</dt>
				<dd>{$bookmark$.versusScore}</dd>
			</dl>
		{/key}
	{/if}
	{#if $isEdited$}
		<button
			disabled={$buttonIsDisabled$}
			onclick={() => {
				doEditSubject.next();
				openBookmarkDetails(undefined);
			}}
		>
			<PencilIcon color="white"/>
			<span>Confirm Edit</span>
		</button>
	{:else}
		<button
			disabled={$buttonIsDisabled$}
			onclick={() => openBookmarkDetails(undefined)}
			autofocus
		>
			<CheckIcon color="white"/>
			<span>{$okButtonText$}</span>
		</button>
	{/if}
</PopUp>

<style>
	dl {
		display: grid;
		grid-template-columns: 1fr 5fr;
		column-gap: 20px;

		flex: auto;
		background-color: white;
		margin: 0;
		padding: 10px;
		overflow-y: scroll;
	}

	dt, dd {
		align-self: center;
		padding-top: 10px;
		padding-bottom: 10px;
	}

	dt {
		font-weight: bold;
		text-align: right;
	}

	dd {
		margin: 0;
		text-align: left;
		overflow-wrap: anywhere;
	}

	.id {
		font-family: monospace;
		font-size: x-large;
	}

	.url {
		color: var(--accent-color-600);
		font-weight: bold;
		text-decoration: underline;
		cursor: pointer;
	}

	[contenteditable="true"]:hover {
		cursor: pointer;
		background-color: hsl(var(--grey-color-hue), 25%, 87%);
	}

	dd {
		:global(.svelte-tags-input-layout) {
			border-radius: 4px;
		}

		:global(.svelte-tags-input-tag) {
			width: unset;
			border-radius: 29px;
			padding: 0 10px;
			display: inline-flex;
			position: relative;
			column-gap: 5px;
			cursor: initial;
			background-color: var(--accent-color-500);
		}
	}
</style>
