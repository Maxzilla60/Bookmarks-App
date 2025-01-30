<script lang="ts">
	import { SwordsIcon } from 'lucide-svelte';
	import { allBookmarks$ } from '../../../../api/data/allBookmarks$';
	import { newVersusBattle } from '../../../versus/versusBattle$';
</script>

<button
	onclick={() => newVersusBattle()}
	title="New versus"
	aria-label="New versus"
	disabled={$allBookmarks$.length <= 1}
>
	<SwordsIcon color="white"/>
</button>
