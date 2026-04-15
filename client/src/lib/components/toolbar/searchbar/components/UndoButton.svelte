<script lang="ts">
	import { undo } from '@api/actions/undo';
	import { canUndo$ } from '@api/data/canUndo$';
	import { fromCtrlShortcut } from '@util/util';
	import { Undo2Icon } from 'lucide-svelte';
	import { filter, withLatestFrom } from 'rxjs';

	fromCtrlShortcut(document.body, 'z').pipe(
		withLatestFrom(canUndo$),
		filter(([, canUndo]) => canUndo),
	).subscribe(() => {
		undo();
	});
</script>

<button
	onclick={() => undo()}
	disabled={!$canUndo$}
	title="Undo last action (Ctrl + Z)"
	aria-label="Undo last action (Ctrl + Z)"
>
	<Undo2Icon color="white"/>
</button>

