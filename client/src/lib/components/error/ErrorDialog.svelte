<script lang="ts">
	import { first, isEqual, isNil } from 'lodash';
	import { CheckIcon } from 'lucide-svelte';
	import { distinctUntilChanged, filter, map, type Observable, tap } from 'rxjs';
	import { confirmButtonText } from '../../util/util';
	import PopUp from '../shared/popup/PopUp.svelte';
	import { type BookMaxError, dismissError, errors$ } from './errors$';

	const errorDialogId = 'error_dialog';

	const error$: Observable<BookMaxError | undefined> = errors$.pipe(
		map(e => first(e)),
		map(formatErrorMessage),
		tap(e => {
			const dialogElement = document.getElementById(errorDialogId) as HTMLDialogElement | null;
			if (e) {
				dialogElement?.showModal();
			} else {
				dialogElement?.close();
			}
		}),
		distinctUntilChanged(isEqual),
	);
	error$.subscribe(e => e && console.error(e));

	const buttonText$ = error$.pipe(
		filter(error => !isNil(error)),
		map(confirmButtonText),
	);

	function formatErrorMessage(error?: BookMaxError): BookMaxError | undefined {
		if (error) {
			return {
				...error,
				message: error.message.replaceAll('\n', '<br/>'),
			};
		}
		return undefined;
	}
</script>

<PopUp id={errorDialogId}>
	{#if $error$}
		<p>
			{@html $error$.message}
		</p>
		<button onclick={() => dismissError($error$.id)}>
			<CheckIcon color="white"/>
			<span>{$buttonText$}</span>
		</button>
	{/if}
</PopUp>

<style>
	p {
		height: 100%;
		margin: 0;
		color: white;
		font-size: larger;
		text-align: center;
		display: flex;
		align-items: center;
		justify-content: center;
	}
</style>
