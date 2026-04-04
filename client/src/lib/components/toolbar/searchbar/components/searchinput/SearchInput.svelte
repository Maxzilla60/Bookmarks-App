<script lang="ts">
	import { allBookmarks$ } from '@api/data/allBookmarks$';
	import { SearchIcon } from 'lucide-svelte';
	import { updateSearch } from './search';
</script>

<SearchIcon color="var(--accent-color-500)"/>
<input
	oninput={e => updateSearch(e.target?.value ?? '')}
	type="search"
	placeholder="Search..."
	disabled={$allBookmarks$.length === 0}
/>
