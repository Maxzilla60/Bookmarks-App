<script lang="ts">
	import BookmarksCount from './components/BookmarksCount.svelte';
	import ColorPicker from './components/color/ColorPicker.svelte';
	import ImportButton from './components/import/ImportButton.svelte';
	import NewVersusButton from './components/NewVersusButton.svelte';
	import RandomBookmark from './components/RandomBookmark.svelte';
	import SearchInput from './components/searchinput/SearchInput.svelte';
	import SortingButton from './components/sort/SortingButton.svelte';
	import StatsButton from './components/stats/StatsButon.svelte';
	import TableSelect from './components/TableSelect.svelte';
</script>

<div class="toolbar">
	<TableSelect/>
	<span class="top-bar-divider"></span>

	<SearchInput/>
	<BookmarksCount/>
	<span class="top-bar-divider"></span>

	<NewVersusButton/>
	<RandomBookmark/>
	<span class="top-bar-divider"></span>

	<SortingButton/>
	<span class="top-bar-divider"></span>

	<ImportButton/>
	<StatsButton/>
	<span class="top-bar-divider"></span>

	<ColorPicker/>
</div>
