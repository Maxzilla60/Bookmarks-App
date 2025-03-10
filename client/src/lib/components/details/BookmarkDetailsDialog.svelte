<script lang="ts">
	import { type } from 'arktype';
	import type { Bookmark } from 'bookmarksapp-schemas/schemas';
	import { titleAndUrlSchema } from 'bookmarksapp-schemas/schemas';
	import { isNil } from 'lodash';
	import { CheckIcon, PencilIcon } from 'lucide-svelte';
	import { combineLatest, filter, first, map, merge, type Observable, startWith, Subject, switchMap, withLatestFrom } from 'rxjs';
	import { editBookmark } from '../../api/actions/editBookmark';
	import { calculateVersusScore, confirmButtonText } from '../../util/util';
	import PopUp from '../shared/popup/PopUp.svelte';
	import Tag from '../shared/Tag.svelte';
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

	const isEdited$: Observable<boolean> = bookmarkDetails$.pipe(
		filter(bookmark => !isNil(bookmark)),
		switchMap(() => merge(
			titleInputSubject.asObservable(),
			urlInputSubject.asObservable(),
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
	doEditSubject.asObservable().pipe(
		withLatestFrom(
			bookmark$,
			title$,
			url$,
		),
		map(([, bookmark, title, url]) => ({
			id: bookmark.id,
			title,
			url,
		})),
	).subscribe(({ id, title, url }) => editBookmark(id, { title, url }));
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
					{#each $bookmark$.tags.sort() as tag ($bookmark$.id + '_' + tag)}
						<Tag {tag}/>
					{/each}
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
</style>
