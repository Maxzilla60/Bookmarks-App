<script lang="ts">
	import type { Snippet } from 'svelte';

	type Props = {
		id: string;
		width?: number;
		height?: number;
		children?: Snippet;
	}
	const { id, width = 30, height = 30, children }: Props = $props();
</script>

<dialog
	{id}
	style:width={width + '%'}
	style:height={height + '%'}
>
	<div class="dialog-container">
		{@render children?.()}
	</div>
</dialog>

<style>
	dialog {
		background-color: hsl(var(--grey-color-hue), 10%, 25%);
		box-shadow: 0 1px 11px 0 var(--accent-color-950);
		border: none;
		border-radius: 1%;
		width: 30%;
		height: 30%;
	}

	.dialog-container {
		display: flex;
		flex-flow: column;
		height: 100%;
	}
</style>
