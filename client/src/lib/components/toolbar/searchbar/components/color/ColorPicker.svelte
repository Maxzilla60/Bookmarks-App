<script lang="ts">
	import { PaletteIcon } from 'lucide-svelte';
	import { color$, cycleColor } from './color';
</script>

<button
	onclick={cycleColor}
	title={`Current color is ${$color$.name}`}
	aria-label={`Current color is ${$color$.name}`}
>
	<PaletteIcon color="white"/>
</button>
