<script lang="ts">
	import { allBookmarks$ } from '@api/data/allBookmarks$';
	import { newVersusBattle } from '@components/versus/versusBattle$';
	import { SwordsIcon } from 'lucide-svelte';
</script>

<button
	onclick={() => newVersusBattle()}
	title="New versus"
	aria-label="New versus"
	disabled={$allBookmarks$.length <= 1}
>
	<SwordsIcon color="white"/>
</button>
