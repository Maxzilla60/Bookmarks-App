<script lang="ts">
	import AddBookmarkButton from './components/add/AddBookmarkButton.svelte';
	import BookmarksCount from './components/BookmarksCount.svelte';
	import ColorPicker from './components/color/ColorPicker.svelte';
	import ImportButton from './components/import/ImportButton.svelte';
	import NewVersusButton from './components/NewVersusButton.svelte';
	import RandomBookmark from './components/RandomBookmark.svelte';
	import SearchInput from './components/searchinput/SearchInput.svelte';
	import SortingButton from './components/sort/SortingButton.svelte';
	import StatsButton from './components/stats/StatsButon.svelte';
	import TableSelect from './components/TableSelect.svelte';
	import UndoButton from './components/UndoButton.svelte';
</script>

<div class="toolbar">
	<TableSelect/>
	<span class="top-bar-divider"></span>

	<SearchInput/>
	<BookmarksCount/>
	<span class="top-bar-divider"></span>

	<NewVersusButton/>
	<RandomBookmark/>
	<UndoButton/>
	<span class="top-bar-divider"></span>

	<SortingButton/>
	<span class="top-bar-divider"></span>

	<AddBookmarkButton/>
	<ImportButton/>
	<StatsButton/>
	<span class="top-bar-divider"></span>

	<ColorPicker/>
</div>
