<script lang="ts">
	import { DatabaseIcon } from 'lucide-svelte';
	import { currentTable$, switchTable, tables } from '../../../../api/data/currentTable$';
</script>

<DatabaseIcon color="var(--accent-color-500)"/>
<select
	value={$currentTable$}
	onchange={e => switchTable(e.target.value)}
>
	{#each tables as { name, emoji }}
		<option
			value={name}
		>
			{emoji} {name}
		</option>
	{/each}
</select>

<style>
	select {
		align-self: end;
	}
</style>
