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
	<hr/>

	<SearchInput/>
	<BookmarksCount/>
	<hr/>

	<NewVersusButton/>
	<RandomBookmark/>
	<UndoButton/>
	<hr/>

	<SortingButton/>
	<hr/>

	<AddBookmarkButton/>
	<ImportButton/>
	<StatsButton/>
	<hr/>

	<ColorPicker/>
</div>
