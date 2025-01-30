<script lang="ts">
	import { type } from 'arktype';
	import { titleAndUrlSchema } from 'bookmarksapp-schemas/schemas';
	import { FileUpIcon, FileWarningIcon } from 'lucide-svelte';
	import { BehaviorSubject, filter, identity, map, type Observable, Subject, withLatestFrom } from 'rxjs';
	import { allBookmarks$ } from '../../../../../api/data/allBookmarks$';
	import { fromCtrlShortcut } from '../../../../../util/util';
	import PopUp from '../../../../shared/popup/PopUp.svelte';
	import { createOpenDialogSubject } from '../../../../shared/popup/popUpDialog';
	import { importBookmarks } from './importBookmarks';

	const importDialogId = 'import_dialog';
	const textAreaValueSubject = new BehaviorSubject<string>('');

	const showImportDialogSubject = createOpenDialogSubject(importDialogId);
	showImportDialogSubject.asObservable()
		.pipe(filter(identity))
		.subscribe(() => {
			const textAreaElement = document.getElementById('import_field') as HTMLTextAreaElement | null;
			if (textAreaElement) {
				textAreaElement.value = '';
				textAreaValueSubject.next('');
			}
		});

	const inputIsInvalid$: Observable<boolean> = textAreaValueSubject.asObservable().pipe(
		map(value => {
			let titlesAndUrls: unknown;
			try {
				titlesAndUrls = JSON.parse(value);
			} catch (e) {
				return true;
			}

			return titleAndUrlSchema.array()(titlesAndUrls) instanceof type.errors;
		}),
	);

	fromCtrlShortcut(document.body, 'i').subscribe(() => {
		showImportDialogSubject.next(true);
	});

	const importBookmarksSubject = new Subject<void>();
	importBookmarksSubject.asObservable().pipe(
		withLatestFrom(
			textAreaValueSubject.asObservable(),
			allBookmarks$,
		),
	).subscribe(([, importText, allBookmarks]) => {
		importBookmarks(importText, allBookmarks);
		showImportDialogSubject.next(false);
	});
</script>

<button
	onclick={() => showImportDialogSubject.next(true)}
	title="Import bookmarks from Session Buddy (Ctrl + I)"
	aria-label="Import bookmarks from Session Buddy (Ctrl + I)"
>
	<FileUpIcon color="white"/>
</button>
<PopUp id={importDialogId}>
	<textarea
		id="import_field"
		oninput={(e) => textAreaValueSubject.next(e.target?.value ?? '')}
		autofocus
	></textarea>
	<button
		onclick={() => importBookmarksSubject.next()}
		disabled={$inputIsInvalid$}
	>
		{#if $inputIsInvalid$}
			<FileWarningIcon color="white"/>
			<span>Invalid JSON</span>
		{:else }
			<FileUpIcon color="white"/>
			<span>Import</span>
		{/if}
	</button>
</PopUp>

<style>
	#import_field {
		flex: 1;
		font-family: 'Ubuntu Mono', monospace;
		background-color: white;
		resize: none;
		width: unset !important;
		height: unset !important;
	}
</style>
