<script lang="ts">
	import { sortBy } from 'lodash';
	import { CheckIcon, TagsIcon } from 'lucide-svelte';
	import { filter, map } from 'rxjs';
	import { categories$ } from '../../../../api/data/categories$';
	import { confirmButtonText } from '../../../../util/util';
	import PopUp from '../../../shared/popup/PopUp.svelte';
	import { createOpenDialogSubject } from '../../../shared/popup/popUpDialog';
	import Tag from '../../../shared/Tag.svelte';

	const categoriesDialogId = 'categories_dialog';

	const showCategoriesDialogSubject = createOpenDialogSubject(categoriesDialogId);

	const sortedCategories$ = categories$.pipe(
		map(categories => sortBy(categories, 'name')),
	);

	const buttonText$ = showCategoriesDialogSubject.asObservable().pipe(
		filter(open => open === true),
		map(confirmButtonText),
	);
</script>

<button
	onclick={() => showCategoriesDialogSubject.next(true)}
	title="Categories"
	aria-label="Categories"
>
	<TagsIcon color="white"/>
</button>
<PopUp id={categoriesDialogId}>
	<ul>
		{#each $sortedCategories$ as category}
			<li>
				<h1>
					<span style="font-weight: bold">{ category.name }</span>
					(<span style:color={category.color}>{ category.color }</span>)
				</h1>
				<ul>
					{#each category.tags as tag (tag)}
						<Tag {tag}/>
					{/each}
				</ul>
			</li>
		{/each}
	</ul>
	<button
		onclick={() => showCategoriesDialogSubject.next(false)}
		autofocus
	>
		<CheckIcon color="white"/>
		<span>{$buttonText$}</span>
	</button>
</PopUp>

<style>
	h1 {
		margin: 0;
	}

	h1, h1 > * {
		font-size: x-large;
	}

	ul {
		flex: auto;
		text-align: center;
		background-color: white;
		margin: 0;
		padding: 10px;
		overflow-y: scroll;
	}

	li > ul {
		overflow-y: unset;
	}

	li:not(:first-child) {
		margin-top: 10px;
	}
</style>
