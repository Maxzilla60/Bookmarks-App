<script lang="ts">
	import ErrorDialog from './lib/components/error/ErrorDialog.svelte';
	import BookmarksList from './lib/components/list/BookmarksList.svelte';
	import SearchBar from './lib/components/toolbar/searchbar/SearchBar.svelte';
	import TagBar from './lib/components/toolbar/tagbar/TagBar.svelte';
	import VersusBattle from './lib/components/versus/VersusBattle.svelte';
	import './styles.css';
</script>

<ErrorDialog/>
<div id="tool_bar">
	<SearchBar/>
	<TagBar/>
</div>
<VersusBattle/>
<BookmarksList/>

<style>
	#tool_bar {
		background-color: hsl(var(--grey-color-hue), 10%, 25%);
		box-shadow: 0 1px 11px 0 var(--accent-color-950);
		z-index: 2;
		display: flex;
		flex-direction: column;
		gap: 10px;
		padding: 10px;
	}
</style>
